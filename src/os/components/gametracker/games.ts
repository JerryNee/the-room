// Game Tracker data. Add every game you've played as one entry here —
// the app renders whatever is in this list, newest `year` first.
// The entries below are SAMPLES: replace them with your own history.

export type GameStatus =
    | 'playing'
    | 'completed'
    | 'on-hold'
    | 'dropped'
    | 'backlog';

export interface GameEntry {
    title: string;
    platform: string;
    status: GameStatus;
    /** 1-10 */
    rating?: number;
    /** hours played, roughly */
    hours?: number;
    /** year you first played it */
    year?: number;
    /** favorite moment, verdict, or why you dropped it */
    notes?: string;
}

export const STATUS_LABELS: Record<GameStatus, string> = {
    playing: 'Playing',
    completed: 'Completed',
    'on-hold': 'On Hold',
    dropped: 'Dropped',
    backlog: 'Backlog',
};

const GAMES: GameEntry[] = [
    {
        title: 'The Legend of Zelda: Breath of the Wild',
        platform: 'Switch',
        status: 'completed',
        rating: 10,
        hours: 120,
        year: 2023,
        notes: 'The plateau opening is still the best tutorial ever made.',
    },
    {
        title: 'Elden Ring',
        platform: 'PC',
        status: 'playing',
        rating: 9,
        hours: 85,
        year: 2024,
        notes: 'Currently lost in the Lands Between. Malenia can wait.',
    },
    {
        title: 'Hades',
        platform: 'PC',
        status: 'completed',
        rating: 9,
        hours: 60,
        year: 2023,
        notes: 'Escaped 30+ times and still coming back for the dialogue.',
    },
    {
        title: 'Stardew Valley',
        platform: 'PC',
        status: 'on-hold',
        rating: 8,
        hours: 45,
        year: 2022,
        notes: 'Year 3 farm is thriving; will return next winter (real one).',
    },
    {
        title: "Baldur's Gate 3",
        platform: 'PC',
        status: 'backlog',
        year: 2025,
        notes: 'Bought on sale. Waiting for a free month, which may never come.',
    },
    {
        title: 'Cyberpunk 2077',
        platform: 'PC',
        status: 'dropped',
        rating: 6,
        hours: 15,
        year: 2022,
        notes: 'Bounced off at launch; should retry post-2.0 someday.',
    },
];

export default GAMES;
