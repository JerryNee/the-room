import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLocalSteamGames } from './steam-local-library.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = path.join(
    ROOT,
    'src/os/components/gametracker/steam-games.generated.json'
);
const LOCAL_SNAPSHOT_PATH = path.join(
    ROOT,
    'src/os/components/gametracker/steam-local-games.generated.json'
);
const DEFAULT_STEAM_ID = '76561198413462584';
const DEFAULT_PROFILE_URL = 'https://steamcommunity.com/id/super_jerry001/';
const APP_METADATA_OVERRIDES = {
    251040: {
        name: 'PAYDAY 2 Demo',
    },
    884520: {
        name: 'Running With Dinosaurs',
    },
};

const readLocalEnv = async () => {
    try {
        const contents = await readFile(path.join(ROOT, '.env.local'), 'utf8');
        return Object.fromEntries(
            contents
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line && !line.startsWith('#') && line.includes('='))
                .map((line) => {
                    const separator = line.indexOf('=');
                    const key = line.slice(0, separator).trim();
                    const value = line
                        .slice(separator + 1)
                        .trim()
                        .replace(/^(['"])(.*)\1$/, '$2');
                    return [key, value];
                })
        );
    } catch (error) {
        if (error?.code === 'ENOENT') return {};
        throw error;
    }
};

const readJson = async (filePath, fallback) => {
    try {
        return JSON.parse(await readFile(filePath, 'utf8'));
    } catch (error) {
        if (error?.code === 'ENOENT') return fallback;
        throw error;
    }
};

const decodeXml = (value = '') =>
    value
        .replace(/^<!\[CDATA\[|\]\]>$/g, '')
        .replaceAll('&amp;', '&')
        .replaceAll('&quot;', '"')
        .replaceAll('&apos;', "'")
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>');

const matchTag = (xml, tag) => {
    const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
    return match ? decodeXml(match[1].trim()) : '';
};

const fetchText = async (url) => {
    const response = await fetch(url, {
        headers: { 'user-agent': 'JerryRoom-Steam-Sync/1.0' },
    });
    if (!response.ok) {
        throw new Error(`Steam request failed (${response.status} ${response.statusText})`);
    }
    return response.text();
};

const fetchJson = async (url) => JSON.parse(await fetchText(url));

const parsePublicPreview = (xml) => {
    const gameBlocks = [
        ...xml.matchAll(/<mostPlayedGame>([\s\S]*?)<\/mostPlayedGame>/g),
    ];

    return gameBlocks
        .map(([, block]) => {
            const gameLink = matchTag(block, 'gameLink');
            const appId = Number(gameLink.match(/\/app\/(\d+)/)?.[1]);
            if (!appId) return null;

            return {
                appId,
                name: matchTag(block, 'gameName'),
                playtimeMinutes: Math.round(
                    Number(matchTag(block, 'hoursOnRecord') || 0) * 60
                ),
                recentPlaytimeMinutes: Math.round(
                    Number(matchTag(block, 'hoursPlayed') || 0) * 60
                ),
                lastPlayedAt: 0,
                iconUrl: matchTag(block, 'gameIcon'),
                fallbackImageUrl:
                    matchTag(block, 'gameLogo') || matchTag(block, 'gameIcon'),
            };
        })
        .filter(Boolean);
};

const normalizeApiGame = (game) => {
    const iconUrl = game.img_icon_url
        ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
        : '';

    return {
        appId: game.appid,
        name: game.name,
        playtimeMinutes: game.playtime_forever ?? 0,
        recentPlaytimeMinutes: game.playtime_2weeks ?? 0,
        lastPlayedAt: game.rtime_last_played ?? 0,
        iconUrl,
        fallbackImageUrl: iconUrl,
    };
};

const fetchOwnedGames = async (apiKey, steamId) => {
    const url = new URL(
        'https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/'
    );
    url.search = new URLSearchParams({
        key: apiKey,
        steamid: steamId,
        include_appinfo: 'true',
        include_played_free_games: 'true',
        format: 'json',
    }).toString();

    const payload = await fetchJson(url);
    const games = payload?.response?.games;
    if (!Array.isArray(games)) {
        throw new Error(
            'Steam returned no game list. Check the API key and make Game details public.'
        );
    }

    return games.map(normalizeApiGame);
};

const fetchRecentlyPlayedGames = async (apiKey, steamId) => {
    const url = new URL(
        'https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/'
    );
    url.search = new URLSearchParams({
        key: apiKey,
        steamid: steamId,
        count: '0',
        format: 'json',
    }).toString();

    const payload = await fetchJson(url);
    const games = payload?.response?.games;
    return Array.isArray(games) ? games.map(normalizeApiGame) : [];
};

const fetchStoreMetadata = async (appId) => {
    try {
        const url = new URL('https://store.steampowered.com/api/appdetails');
        url.search = new URLSearchParams({
            appids: String(appId),
            l: 'english',
            cc: 'us',
        }).toString();

        const payload = await fetchJson(url);
        const app = payload?.[String(appId)];
        if (!app?.success || !app.data?.name) return null;

        return {
            name: app.data.name,
            fallbackImageUrl:
                app.data.capsule_imagev5 || app.data.header_image || '',
        };
    } catch {
        return null;
    }
};

const mapWithConcurrency = async (items, concurrency, mapper) => {
    const results = new Array(items.length);
    let cursor = 0;

    const worker = async () => {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await mapper(items[index], index);
        }
    };

    await Promise.all(
        Array.from(
            { length: Math.min(concurrency, items.length) },
            () => worker()
        )
    );
    return results;
};

const enrichLocalGames = async (localGames, knownGames) => {
    const knownByAppId = new Map(
        knownGames.map((game) => [game.appId, game])
    );

    Object.entries(APP_METADATA_OVERRIDES).forEach(([appId, details]) => {
        const numericAppId = Number(appId);
        const existing = knownByAppId.get(numericAppId);
        if (existing && !existing.name?.startsWith('Steam App ')) return;
        knownByAppId.set(numericAppId, {
            ...existing,
            appId: numericAppId,
            ...details,
            fallbackImageUrl:
                existing?.fallbackImageUrl ||
                `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${numericAppId}/header.jpg`,
        });
    });

    const missingAppIds = localGames
        .filter((game) => !knownByAppId.has(game.appId))
        .map((game) => game.appId);
    const metadata = await mapWithConcurrency(
        missingAppIds,
        6,
        fetchStoreMetadata
    );

    missingAppIds.forEach((appId, index) => {
        const details = metadata[index];
        if (!details) return;
        knownByAppId.set(appId, {
            appId,
            ...details,
        });
    });

    return localGames.map((game) => {
        const known = knownByAppId.get(game.appId);
        return {
            ...game,
            name: known?.name || `Steam App ${game.appId}`,
            iconUrl: known?.iconUrl || '',
            fallbackImageUrl: known?.fallbackImageUrl || '',
        };
    });
};

const mergeGames = ({ ownedGames, recentGames, localGames }) => {
    const merged = new Map();
    const ownedAppIds = new Set(ownedGames.map((game) => game.appId));

    [ownedGames, recentGames, localGames].forEach((games) => {
        games.forEach((game) => {
            const current = merged.get(game.appId);
            if (!current) {
                merged.set(game.appId, { ...game });
                return;
            }

            merged.set(game.appId, {
                ...current,
                name:
                    current.name?.startsWith('Steam App ') && game.name
                        ? game.name
                        : current.name || game.name,
                playtimeMinutes: Math.max(
                    current.playtimeMinutes || 0,
                    game.playtimeMinutes || 0
                ),
                recentPlaytimeMinutes: Math.max(
                    current.recentPlaytimeMinutes || 0,
                    game.recentPlaytimeMinutes || 0
                ),
                lastPlayedAt: Math.max(
                    current.lastPlayedAt || 0,
                    game.lastPlayedAt || 0
                ),
                iconUrl: current.iconUrl || game.iconUrl || '',
                fallbackImageUrl:
                    current.fallbackImageUrl ||
                    game.fallbackImageUrl ||
                    '',
            });
        });
    });

    return [...merged.values()].map((game) => ({
        ...game,
        librarySource: ownedAppIds.has(game.appId)
            ? 'owned'
            : 'family-shared',
    }));
};

const localEnv = await readLocalEnv();
const env = { ...localEnv, ...process.env };
const steamId = env.STEAM_ID || DEFAULT_STEAM_ID;
const profileUrl = env.STEAM_PROFILE_URL || DEFAULT_PROFILE_URL;
const apiKey = env.STEAM_API_KEY?.trim();
const requireApi = env.STEAM_REQUIRE_API === 'true';

if (requireApi && !apiKey) {
    console.log('Steam sync skipped: STEAM_API_KEY has not been configured.');
    process.exit(0);
}

const profileXml = await fetchText(`${profileUrl.replace(/\/?$/, '/')}?xml=1`);
const profile = {
    steamId,
    name: matchTag(profileXml, 'steamID') || 'Steam Player',
    url: profileUrl,
    avatarUrl: matchTag(profileXml, 'avatarFull'),
};

const ownedGames = apiKey
    ? await fetchOwnedGames(apiKey, steamId)
    : parsePublicPreview(profileXml);
const recentGames = apiKey
    ? await fetchRecentlyPlayedGames(apiKey, steamId)
    : [];
const existingLibrary = await readJson(OUTPUT_PATH, { games: [] });
const historicalFamilyGames = Array.isArray(existingLibrary.games)
    ? existingLibrary.games.filter(
          (game) => game.librarySource === 'family-shared'
      )
    : [];
const existingLocalSnapshot = await readJson(LOCAL_SNAPSHOT_PATH, {
    capturedAt: '',
    games: [],
});
const localClient = await readLocalSteamGames({
    steamId,
    explicitPath: env.STEAM_LOCAL_CONFIG,
});

let localGames = Array.isArray(existingLocalSnapshot.games)
    ? existingLocalSnapshot.games
    : [];

if (localClient.found) {
    localGames = await enrichLocalGames(localClient.games, [
        ...ownedGames,
        ...recentGames,
        ...historicalFamilyGames,
        ...localGames,
    ]);

    await writeFile(
        LOCAL_SNAPSHOT_PATH,
        `${JSON.stringify(
            {
                steamId,
                capturedAt: new Date().toISOString(),
                games: localGames,
            },
            null,
            2
        )}\n`,
        'utf8'
    );
}

const games = mergeGames({
    ownedGames,
    recentGames,
    localGames: [...historicalFamilyGames, ...localGames],
});

if (games.length === 0) {
    throw new Error('Steam sync found no visible games.');
}

games.sort(
    (a, b) =>
        b.playtimeMinutes - a.playtimeMinutes ||
        a.name.localeCompare(b.name, 'en')
);

const library = {
    profile,
    source: apiKey
        ? localGames.length
            ? 'steam-web-api+local-client'
            : 'steam-web-api'
        : localGames.length
          ? 'public-profile-preview+local-client'
          : 'public-profile-preview',
    isComplete: Boolean(apiKey),
    syncedAt: new Date().toISOString(),
    games,
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(library, null, 2)}\n`, 'utf8');

const familySharedCount = games.filter(
    (game) => game.librarySource === 'family-shared'
).length;

console.log(
    `Steam sync complete: ${games.length} games for ${profile.name} ` +
        `(${ownedGames.length} owned, ${familySharedCount} family/shared-history).`
);
