import React, { useMemo, useState } from 'react';
import Window from '../os/Window';
import GAMES, { GameStatus, STATUS_LABELS } from '../gametracker/games';

export interface GameTrackerProps extends WindowAppProps {}

type Filter = GameStatus | 'all';

const STATUS_COLORS: Record<GameStatus, { fg: string; bg: string }> = {
    playing: { fg: '#1d6b43', bg: 'rgba(126, 200, 169, 0.28)' },
    completed: { fg: '#2b5c8a', bg: 'rgba(90, 155, 212, 0.24)' },
    'on-hold': { fg: '#8a6420', bg: 'rgba(232, 176, 75, 0.26)' },
    dropped: { fg: '#8a3d3d', bg: 'rgba(212, 122, 122, 0.24)' },
    backlog: { fg: '#555f66', bg: 'rgba(120, 132, 140, 0.18)' },
};

const FILTERS: Filter[] = [
    'all',
    'playing',
    'completed',
    'on-hold',
    'dropped',
    'backlog',
];

const GameTracker: React.FC<GameTrackerProps> = (props) => {
    const [filter, setFilter] = useState<Filter>('all');

    const games = useMemo(
        () =>
            [...GAMES].sort(
                (a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title)
            ),
        []
    );
    const shown = useMemo(
        () => (filter === 'all' ? games : games.filter((g) => g.status === filter)),
        [games, filter]
    );

    const completed = games.filter((g) => g.status === 'completed').length;
    const totalHours = games.reduce((sum, g) => sum + (g.hours ?? 0), 0);

    const countFor = (f: Filter) =>
        f === 'all' ? games.length : games.filter((g) => g.status === f).length;

    return (
        <Window
            top={36}
            left={150}
            width={780}
            height={600}
            windowBarIcon="windowGameIcon"
            windowTitle="Game Tracker"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={`${games.length} games tracked`}
        >
            <div style={styles.page}>
                <h2 style={styles.title}>Game Tracker</h2>
                <p style={styles.stats}>
                    {games.length} games · {completed} completed ·{' '}
                    {totalHours.toLocaleString()} hours logged
                </p>

                <div style={styles.filterRow}>
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onMouseDown={() => setFilter(f)}
                            style={{
                                ...styles.filterButton,
                                ...(filter === f ? styles.filterButtonActive : {}),
                            }}
                        >
                            {f === 'all' ? 'All' : STATUS_LABELS[f]} · {countFor(f)}
                        </button>
                    ))}
                </div>

                <div style={styles.list}>
                    {shown.map((game) => {
                        const color = STATUS_COLORS[game.status];
                        return (
                            <div key={game.title} style={styles.row}>
                                <div style={styles.rowHeader}>
                                    <span style={styles.gameTitle}>{game.title}</span>
                                    <span
                                        style={{
                                            ...styles.statusBadge,
                                            color: color.fg,
                                            background: color.bg,
                                        }}
                                    >
                                        {STATUS_LABELS[game.status]}
                                    </span>
                                </div>
                                <div style={styles.metaRow}>
                                    <span style={styles.metaChip}>{game.platform}</span>
                                    {game.year !== undefined && (
                                        <span style={styles.metaChip}>{game.year}</span>
                                    )}
                                    {game.hours !== undefined && (
                                        <span style={styles.metaChip}>{game.hours}h</span>
                                    )}
                                    {game.rating !== undefined && (
                                        <span style={styles.rating}>
                                            {'★'.repeat(Math.round(game.rating / 2))}
                                            {'☆'.repeat(5 - Math.round(game.rating / 2))}{' '}
                                            {game.rating}/10
                                        </span>
                                    )}
                                </div>
                                {game.notes && <p style={styles.notes}>{game.notes}</p>}
                            </div>
                        );
                    })}
                    {shown.length === 0 && (
                        <p style={styles.empty}>Nothing here yet.</p>
                    )}
                </div>
            </div>
        </Window>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 24,
        boxSizing: 'border-box',
        overflow: 'auto',
        background:
            'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(247,249,252,0.9))',
        color: '#172123',
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
    },
    title: {
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        fontSize: 26,
        fontWeight: 760,
        lineHeight: 1.1,
        margin: 0,
    },
    stats: {
        color: 'rgba(23, 33, 35, 0.62)',
        fontSize: 13,
        margin: 0,
    },
    filterRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
    },
    filterButton: {
        border: '1px solid rgba(23, 33, 35, 0.14)',
        borderRadius: 999,
        background: 'rgba(255, 255, 255, 0.8)',
        color: 'rgba(23, 33, 35, 0.72)',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
        padding: '7px 11px',
    },
    filterButtonActive: {
        background: '#172123',
        borderColor: '#172123',
        color: '#f5f7f8',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    row: {
        border: '1px solid rgba(23, 33, 35, 0.1)',
        borderRadius: 12,
        background: 'rgba(255, 255, 255, 0.75)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    rowHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    gameTitle: {
        fontSize: 15,
        fontWeight: 700,
    },
    statusBadge: {
        borderRadius: 999,
        flexShrink: 0,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.02em',
        padding: '4px 9px',
    },
    metaRow: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    metaChip: {
        border: '1px solid rgba(23, 33, 35, 0.12)',
        borderRadius: 6,
        color: 'rgba(23, 33, 35, 0.66)',
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 7px',
    },
    rating: {
        color: '#8a6420',
        fontSize: 12,
        fontWeight: 600,
    },
    notes: {
        color: 'rgba(23, 33, 35, 0.6)',
        fontSize: 13,
        lineHeight: 1.45,
        margin: 0,
    },
    empty: {
        color: 'rgba(23, 33, 35, 0.5)',
        fontSize: 13,
    },
};

export default GameTracker;
