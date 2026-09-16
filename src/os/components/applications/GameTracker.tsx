import React, { useEffect, useMemo, useState } from 'react';
import Window from '../os/Window';
import STEAM_LIBRARY, {
    GAME_OVERRIDES,
    GameEntry,
    GameOverrides,
    GameSort,
    STEAM_CATALOG,
    getVisibleSteamGames,
} from '../gametracker/games';
import GameLibraryManager from '../gametracker/GameLibraryManager';
import './GameTracker.css';

export interface GameTrackerProps extends WindowAppProps {}

const SORT_LABELS: Record<GameSort, string> = {
    hours: 'Most Played',
    alphabetical: 'A-Z',
};

const SORTS: GameSort[] = ['hours', 'alphabetical'];
const GAMES_PER_SHELF = 6;

const groupIntoShelves = (games: GameEntry[]) => {
    const shelves: GameEntry[][] = [];
    for (let index = 0; index < games.length; index += GAMES_PER_SHELF) {
        shelves.push(games.slice(index, index + GAMES_PER_SHELF));
    }
    return shelves;
};

const formatHours = (hours: number) => {
    if (!hours) return 'Not played yet';
    if (hours < 0.1) return '< 0.1 hours';
    return `${hours.toLocaleString(undefined, {
        maximumFractionDigits: 1,
    })} ${hours === 1 ? 'hour' : 'hours'}`;
};

const formatLastPlayed = (timestamp?: number) => {
    if (!timestamp) return 'No recent session';
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(timestamp * 1000));
};

const GameTracker: React.FC<GameTrackerProps> = (props) => {
    const [sort, setSort] = useState<GameSort>('hours');
    const [selectedGame, setSelectedGame] = useState<GameEntry | null>(null);
    const [managerOpen, setManagerOpen] = useState(false);
    const [overrides, setOverrides] = useState<GameOverrides>(GAME_OVERRIDES);
    const canManage =
        import.meta.env.DEV &&
        typeof window !== 'undefined' &&
        ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

    const games = useMemo(() => {
        const sorted = getVisibleSteamGames(overrides);

        if (sort === 'alphabetical') {
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        }

        return sorted.sort(
            (a, b) => b.hours - a.hours || a.title.localeCompare(b.title)
        );
    }, [overrides, sort]);

    const shelves = useMemo(() => groupIntoShelves(games), [games]);
    const totalHours = useMemo(
        () => Math.round(games.reduce((sum, game) => sum + game.hours, 0)),
        [games]
    );

    useEffect(() => {
        if (!selectedGame) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setSelectedGame(null);
            }
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [selectedGame]);

    const useFallbackCover = (
        event: React.SyntheticEvent<HTMLImageElement>
    ) => {
        const image = event.currentTarget;
        if (image.dataset.fallback === 'true') return;
        image.dataset.fallback = 'true';
        image.src = image.dataset.fallbackSrc || '';
        image.classList.add('is-fallback');
    };

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
            bottomLeftText={`${games.length} games · ${totalHours.toLocaleString()} hours`}
        >
            <div className="game-library">
                <header className="game-library__header">
                    <div>
                        <h2>Game Shelf</h2>
                        <p>
                            {games.length} games · {totalHours.toLocaleString()} hours
                            on record
                        </p>
                    </div>

                    <div className="game-library__header-actions">
                        {canManage && (
                            <button
                                className="game-library__manage-button"
                                type="button"
                                onClick={() => {
                                    setSelectedGame(null);
                                    setManagerOpen(true);
                                }}
                            >
                                Manage
                            </button>
                        )}
                        <div
                            className="game-library__filters"
                            role="group"
                            aria-label="Sort game shelf"
                        >
                            {SORTS.map((sortOption) => (
                                <button
                                    key={sortOption}
                                    type="button"
                                    aria-pressed={sort === sortOption}
                                    onClick={() => setSort(sortOption)}
                                >
                                    {SORT_LABELS[sortOption]}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {!STEAM_LIBRARY.isComplete && (
                    <div className="game-library__preview" role="status">
                        Showing six public Steam highlights. Add the private API key
                        to import the complete library automatically.
                    </div>
                )}

                <main className="game-library__scroll">
                    {shelves.map((shelf, shelfIndex) => (
                        <section
                            className="game-shelf"
                            aria-label={`Game shelf ${shelfIndex + 1}`}
                            key={`${sort}-${shelfIndex}`}
                        >
                            <div className="game-shelf__games">
                                {shelf.map((game) => (
                                    <button
                                        className="game-case"
                                        key={game.appId}
                                        onClick={() => setSelectedGame(game)}
                                        type="button"
                                    >
                                        <span className="game-case__cover">
                                            <img
                                                alt={`${game.title} cover art`}
                                                data-fallback-src={game.fallbackCover}
                                                decoding="async"
                                                draggable={false}
                                                loading={
                                                    shelfIndex === 0
                                                        ? 'eager'
                                                        : 'lazy'
                                                }
                                                onError={useFallbackCover}
                                                src={game.cover}
                                            />
                                        </span>
                                        <span className="game-case__caption">
                                            <strong>{game.title}</strong>
                                            <span>{formatHours(game.hours)}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className="game-shelf__ledge" aria-hidden="true" />
                        </section>
                    ))}
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
                            data-fallback-src={selectedGame.fallbackCover}
                            decoding="async"
                            onError={useFallbackCover}
                            src={selectedGame.cover}
                        />
                        <div className="game-inspector__copy">
                            <span className="game-inspector__status">Steam</span>
                            <h3>{selectedGame.title}</h3>
                            <p className="game-inspector__metadata">
                                App ID {selectedGame.appId}
                            </p>
                            {selectedGame.notes && (
                                <p className="game-inspector__notes">
                                    {selectedGame.notes}
                                </p>
                            )}
                            <dl className="game-inspector__facts">
                                <div>
                                    <dt>Played</dt>
                                    <dd>{formatHours(selectedGame.hours)}</dd>
                                </div>
                                <div>
                                    <dt>Last played</dt>
                                    <dd>
                                        {formatLastPlayed(
                                            selectedGame.lastPlayedAt
                                        )}
                                    </dd>
                                </div>
                            </dl>
                            <a
                                className="game-inspector__steam-link"
                                href={`https://store.steampowered.com/app/${selectedGame.appId}`}
                                rel="noreferrer"
                                target="_blank"
                            >
                                View on Steam ↗
                            </a>
                        </div>
                    </aside>
                )}

                {managerOpen && (
                    <GameLibraryManager
                        catalog={STEAM_CATALOG}
                        initialOverrides={overrides}
                        onClose={() => setManagerOpen(false)}
                        onSaved={(savedOverrides) => {
                            setOverrides(savedOverrides);
                            setSelectedGame(null);
                        }}
                    />
                )}
            </div>
        </Window>
    );
};

export default GameTracker;
