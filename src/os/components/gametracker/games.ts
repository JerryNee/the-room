import generatedLibrary from './steam-games.generated.json';
import savedOverrides from './game-overrides.json';
import arkSurvivalEvolvedCover from '../../assets/game-covers/ark-survival-evolved.webp';
import deathStranding2Cover from '../../assets/game-covers/death-stranding-2-on-the-beach.jpg';
import forzaHorizon6Cover from '../../assets/game-covers/forza-horizon-6.jpg';
import residentEvilRequiemCover from '../../assets/game-covers/resident-evil-requiem.webp';

export type GameSort = 'hours' | 'alphabetical';

export interface GameEntry {
    appId: number;
    title: string;
    cover: string;
    fallbackCover: string;
    iconUrl?: string;
    librarySource?: 'owned' | 'family-shared';
    hours: number;
    recentHours: number;
    lastPlayedAt?: number;
    notes?: string;
}

export interface SteamLibraryProfile {
    steamId: string;
    name: string;
    url: string;
    avatarUrl: string;
}

export interface SteamLibrary {
    profile: SteamLibraryProfile;
    source:
        | 'steam-web-api'
        | 'steam-web-api+local-client'
        | 'public-profile-preview'
        | 'public-profile-preview+local-client';
    isComplete: boolean;
    syncedAt: string;
    games: GameEntry[];
}

export interface GameOverride {
    hidden?: boolean;
    notes?: string;
}

export type GameOverrides = Record<string, GameOverride>;

const toHours = (minutes = 0) => minutes / 60;
const rawLibrary = generatedLibrary as typeof generatedLibrary;
const COVER_OVERRIDES: Record<number, string> = {
    346110: arkSurvivalEvolvedCover,
    2483190: forzaHorizon6Cover,
    3280350: deathStranding2Cover,
    3764200: residentEvilRequiemCover,
};

export const GAME_OVERRIDES = savedOverrides as GameOverrides;

export const STEAM_CATALOG: GameEntry[] = rawLibrary.games.map((game) => ({
    appId: game.appId,
    title: game.name,
    cover:
        COVER_OVERRIDES[game.appId] ||
        `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.appId}/library_600x900_2x.jpg`,
    fallbackCover:
        game.fallbackImageUrl ||
        game.iconUrl ||
        `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.appId}/header.jpg`,
    iconUrl: game.iconUrl,
    librarySource:
        'librarySource' in game
            ? (game.librarySource as GameEntry['librarySource'])
            : undefined,
    hours: toHours(game.playtimeMinutes),
    recentHours: toHours(game.recentPlaytimeMinutes),
    lastPlayedAt: game.lastPlayedAt || undefined,
}));

export const getVisibleSteamGames = (
    overrides: GameOverrides = GAME_OVERRIDES
) =>
    STEAM_CATALOG.filter(
        (game) => game.hours > 0 && !overrides[String(game.appId)]?.hidden
    ).map((game) => ({
        ...game,
        notes: overrides[String(game.appId)]?.notes,
    }));

const STEAM_LIBRARY: SteamLibrary = {
    profile: rawLibrary.profile,
    source: rawLibrary.source as SteamLibrary['source'],
    isComplete: rawLibrary.isComplete,
    syncedAt: rawLibrary.syncedAt,
    games: getVisibleSteamGames(),
};

export default STEAM_LIBRARY;
