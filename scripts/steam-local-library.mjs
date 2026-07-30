import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const STEAM_ID64_BASE = 76561197960265728n;

const decodeToken = (token) =>
    token
        .slice(1, -1)
        .replaceAll('\\"', '"')
        .replaceAll('\\\\', '\\');

export const parseVdf = (contents) => {
    const tokens = contents.match(/"(?:\\.|[^"\\])*"|[{}]/g) || [];
    let cursor = 0;

    const parseObject = (endsWithBrace = false) => {
        const result = {};

        while (cursor < tokens.length) {
            const token = tokens[cursor++];
            if (token === '}') {
                if (endsWithBrace) return result;
                continue;
            }
            if (token === '{') continue;

            const key = decodeToken(token);
            const valueToken = tokens[cursor++];
            if (!valueToken) break;

            result[key] =
                valueToken === '{'
                    ? parseObject(true)
                    : decodeToken(valueToken);
        }

        return result;
    };

    return parseObject();
};

const getAccountId = (steamId) => {
    try {
        const accountId = BigInt(steamId) - STEAM_ID64_BASE;
        return accountId > 0 ? accountId.toString() : '';
    } catch {
        return '';
    }
};

const getConfigCandidates = ({ steamId, explicitPath }) => {
    if (explicitPath) return [path.resolve(explicitPath)];

    const accountId = getAccountId(steamId);
    if (!accountId) return [];

    const home = os.homedir();
    const candidates = [
        path.join(
            home,
            'Library/Application Support/Steam/userdata',
            accountId,
            'config/localconfig.vdf'
        ),
        path.join(
            home,
            '.local/share/Steam/userdata',
            accountId,
            'config/localconfig.vdf'
        ),
        path.join(
            home,
            '.steam/steam/userdata',
            accountId,
            'config/localconfig.vdf'
        ),
    ];

    if (process.env['PROGRAMFILES(X86)']) {
        candidates.push(
            path.join(
                process.env['PROGRAMFILES(X86)'],
                'Steam/userdata',
                accountId,
                'config/localconfig.vdf'
            )
        );
    }

    return candidates;
};

export const readLocalSteamGames = async ({
    steamId,
    explicitPath = '',
}) => {
    for (const candidate of getConfigCandidates({ steamId, explicitPath })) {
        try {
            const contents = await readFile(candidate, 'utf8');
            const parsed = parseVdf(contents);
            const apps =
                parsed?.UserLocalConfigStore?.Software?.Valve?.Steam?.apps;

            if (!apps || typeof apps !== 'object') continue;

            const games = Object.entries(apps)
                .map(([appId, record]) => {
                    if (
                        !/^\d+$/.test(appId) ||
                        !record ||
                        typeof record !== 'object'
                    ) {
                        return null;
                    }

                    const playtimeMinutes = Number(record.Playtime || 0);
                    if (!Number.isFinite(playtimeMinutes) || playtimeMinutes <= 0) {
                        return null;
                    }

                    return {
                        appId: Number(appId),
                        playtimeMinutes,
                        recentPlaytimeMinutes: Number(
                            record.Playtime2wks || 0
                        ),
                        lastPlayedAt: Number(record.LastPlayed || 0),
                    };
                })
                .filter(Boolean);

            return {
                found: true,
                games,
            };
        } catch (error) {
            if (error?.code === 'ENOENT') continue;
            throw error;
        }
    }

    return {
        found: false,
        games: [],
    };
};
