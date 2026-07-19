import React, { useEffect, useMemo, useState } from 'react';
import Window from '../os/Window';
import GAMES, {
    GameEntry,
    GameStatus,
    STATUS_LABELS,
} from '../gametracker/games';
import './GameTracker.css';

export interface GameTrackerProps extends WindowAppProps {}

type Filter = GameStatus | 'all';

const FILTERS: Filter[] = [
    'all',
    'playing',
    'completed',
    'on-hold',
    'dropped',
    'backlog',
];

const GAMES_PER_SHELF = 6;

const groupIntoShelves = (games: GameEntry[]) => {
    const shelves: GameEntry[][] = [];
    for (let index = 0; index < games.length; index += GAMES_PER_SHELF) {
        shelves.push(games.slice(index, index + GAMES_PER_SHELF));
    }
    return shelves;
};

const GameTracker: React.FC<GameTrackerProps> = (props) => {
    const [filter, setFilter] = useState<Filter>('all');
    const [selectedGame, setSelectedGame] = useState<GameEntry | null>(null);

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

    const shelves = useMemo(() => groupIntoShelves(shown), [shown]);

    const countFor = (f: Filter) =>
        f === 'all' ? games.length : games.filter((g) => g.status === f).length;

    useEffect(() => {
        if (!selectedGame) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSelectedGame(null);
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [selectedGame]);

    useEffect(() => {
        if (
            selectedGame &&
            filter !== 'all' &&
            selectedGame.status !== filter
        ) {
            setSelectedGame(null);
        }
    }, [filter, selectedGame]);

    return (
        <Window
            top={36}
            left={120}
            width={960}
            height={650}
            windowBarIcon="windowGameIcon"
            windowTitle="Game Tracker"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={`${games.length} games on the shelf`}
        >
            <div className="game-library">
                <header className="game-library__header">
                    <div>
                        <h2>Game Shelf</h2>
                        <p>
                            {games.length} games collected · select a cover to open
                            its case
                        </p>
                    </div>

                    <div
                        className="game-library__filters"
                        role="group"
                        aria-label="Filter game shelf by status"
                    >
                        {FILTERS.map((filterOption) => (
                            <button
                                key={filterOption}
                                type="button"
                                aria-pressed={filter === filterOption}
                                onClick={() => setFilter(filterOption)}
                            >
                                {filterOption === 'all'
                                    ? 'All'
                                    : STATUS_LABELS[filterOption]}
                                <span>{countFor(filterOption)}</span>
                            </button>
                        ))}
                    </div>
                </header>

                <main className="game-library__scroll">
                    {shelves.map((shelf, shelfIndex) => (
                        <section
                            className="game-shelf"
                            aria-label={`Game shelf ${shelfIndex + 1}`}
                            key={`${filter}-${shelfIndex}`}
                        >
                            <div className="game-shelf__games">
                                {shelf.map((game) => (
                                    <button
                                        className="game-case"
                                        data-status={game.status}
                                        key={game.title}
                                        onClick={() => setSelectedGame(game)}
                                        type="button"
                                    >
                                        <span className="game-case__cover">
                                            <img
                                                alt={`${game.title} cover art`}
                                                decoding="async"
                                                draggable={false}
                                                loading={
                                                    shelfIndex === 0
                                                        ? 'eager'
                                                        : 'lazy'
                                                }
                                                src={game.cover}
                                            />
                                            <span
                                                className="game-case__status-dot"
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <span className="game-case__caption">
                                            <strong>{game.title}</strong>
                                            <span>
                                                {game.platform} ·{' '}
                                                {STATUS_LABELS[game.status]}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className="game-shelf__ledge" aria-hidden="true" />
                        </section>
                    ))}

                    {shown.length === 0 && (
                        <p className="game-library__empty">Nothing on this shelf yet.</p>
                    )}
                </main>

                {selectedGame && (
                    <aside
                        className="game-inspector"
                        aria-label={`Details for ${selectedGame.title}`}
                    >
                        <button
                            className="game-inspector__close"
                            type="button"
                            aria-label="Close game details"
                            onClick={() => setSelectedGame(null)}
                        >
                            ×
                        </button>
                        <img
                            className="game-inspector__cover"
                            alt={`${selectedGame.title} cover art`}
                            decoding="async"
                            src={selectedGame.cover}
                        />
                        <div className="game-inspector__copy">
                            <span
                                className="game-inspector__status"
                                data-status={selectedGame.status}
                            >
                                {STATUS_LABELS[selectedGame.status]}
                            </span>
                            <h3>{selectedGame.title}</h3>
                            <p className="game-inspector__metadata">
                                {[selectedGame.platform, selectedGame.year]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                            {selectedGame.notes && (
                                <p className="game-inspector__notes">
                                    {selectedGame.notes}
                                </p>
                            )}
                            <dl className="game-inspector__facts">
                                {selectedGame.hours !== undefined && (
                                    <div>
                                        <dt>Played</dt>
                                        <dd>{selectedGame.hours} hours</dd>
                                    </div>
                                )}
                                {selectedGame.rating !== undefined && (
                                    <div>
                                        <dt>Rating</dt>
                                        <dd>{selectedGame.rating}/10</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </aside>
                )}
            </div>
        </Window>
    );
};

export default GameTracker;
