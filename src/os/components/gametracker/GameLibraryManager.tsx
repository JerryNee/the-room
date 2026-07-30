import React, { useMemo, useState } from 'react';
import {
    GameEntry,
    GameOverride,
    GameOverrides,
} from './games';
import './GameLibraryManager.css';

type ManagerFilter = 'all' | 'shelf' | 'hidden' | 'unplayed';
type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'warning';

interface GameLibraryManagerProps {
    catalog: GameEntry[];
    initialOverrides: GameOverrides;
    onClose: () => void;
    onSaved: (overrides: GameOverrides) => void;
}

const FILTER_LABELS: Record<ManagerFilter, string> = {
    all: 'All',
    shelf: 'On Shelf',
    hidden: 'Hidden',
    unplayed: 'Not Played',
};

const FILTERS: ManagerFilter[] = ['all', 'shelf', 'hidden', 'unplayed'];

const cloneOverrides = (overrides: GameOverrides): GameOverrides =>
    JSON.parse(JSON.stringify(overrides));

const normalizeOverrides = (overrides: GameOverrides): GameOverrides => {
    const normalized: GameOverrides = {};

    Object.keys(overrides)
        .sort((a, b) => Number(a) - Number(b))
        .forEach((appId) => {
            const override = overrides[appId];
            const notes = override?.notes?.trim();
            const entry: GameOverride = {};
            if (override?.hidden) entry.hidden = true;
            if (notes) entry.notes = notes;
            if (entry.hidden || entry.notes) normalized[appId] = entry;
        });

    return normalized;
};

const serializeOverrides = (overrides: GameOverrides) =>
    JSON.stringify(normalizeOverrides(overrides));

const formatHours = (hours: number) =>
    hours > 0 && hours < 0.1
        ? '< 0.1 h'
        : hours
        ? `${hours.toLocaleString(undefined, {
              maximumFractionDigits: 1,
          })} h`
        : 'No playtime';

const GameLibraryManager: React.FC<GameLibraryManagerProps> = ({
    catalog,
    initialOverrides,
    onClose,
    onSaved,
}) => {
    const [draft, setDraft] = useState<GameOverrides>(() =>
        cloneOverrides(initialOverrides)
    );
    const [baseline, setBaseline] = useState<GameOverrides>(() =>
        cloneOverrides(initialOverrides)
    );
    const [selectedAppId, setSelectedAppId] = useState(
        catalog.find((game) => game.hours > 0)?.appId ?? catalog[0]?.appId
    );
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<ManagerFilter>('all');
    const [saveState, setSaveState] = useState<SaveState>('idle');
    const [message, setMessage] = useState('');
    const [syncing, setSyncing] = useState(false);

    const isHidden = (game: GameEntry) =>
        Boolean(draft[String(game.appId)]?.hidden);
    const isOnShelf = (game: GameEntry) => game.hours > 0 && !isHidden(game);

    const counts = useMemo(
        () => ({
            all: catalog.length,
            shelf: catalog.filter(isOnShelf).length,
            hidden: catalog.filter(isHidden).length,
            unplayed: catalog.filter((game) => game.hours === 0).length,
        }),
        [catalog, draft]
    );

    const filteredGames = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();

        return catalog.filter((game) => {
            const matchesQuery =
                !normalizedQuery ||
                game.title.toLocaleLowerCase().includes(normalizedQuery) ||
                String(game.appId).includes(normalizedQuery);
            if (!matchesQuery) return false;

            if (filter === 'shelf') return isOnShelf(game);
            if (filter === 'hidden') return isHidden(game);
            if (filter === 'unplayed') return game.hours === 0;
            return true;
        });
    }, [catalog, draft, filter, query]);

    const selectedGame =
        catalog.find((game) => game.appId === selectedAppId) ?? catalog[0];
    const dirty =
        serializeOverrides(draft) !== serializeOverrides(baseline);
    const dirtyCount = useMemo(() => {
        const appIds = new Set([
            ...Object.keys(normalizeOverrides(draft)),
            ...Object.keys(normalizeOverrides(baseline)),
        ]);
        return [...appIds].filter(
            (appId) =>
                JSON.stringify(normalizeOverrides(draft)[appId] || {}) !==
                JSON.stringify(normalizeOverrides(baseline)[appId] || {})
        ).length;
    }, [baseline, draft]);

    const updateOverride = (
        appId: number,
        patch: Partial<GameOverride>
    ) => {
        setDraft((current) => {
            const key = String(appId);
            const next = {
                ...current,
                [key]: {
                    ...current[key],
                    ...patch,
                },
            };
            return normalizeOverrides(next);
        });
        setSaveState('idle');
        setMessage('');
    };

    const toggleVisibility = (game: GameEntry) => {
        if (game.hours === 0) return;
        updateOverride(game.appId, { hidden: !isHidden(game) });
    };

    const showAllPlayed = () => {
        setDraft((current) => {
            const next = cloneOverrides(current);
            catalog.forEach((game) => {
                if (game.hours <= 0 || !next[String(game.appId)]) return;
                delete next[String(game.appId)].hidden;
            });
            return normalizeOverrides(next);
        });
        setSaveState('idle');
        setMessage('');
    };

    const resetChanges = () => {
        setDraft(cloneOverrides(baseline));
        setSaveState('idle');
        setMessage('');
    };

    const closeManager = () => {
        if (dirty) {
            setSaveState('warning');
            setMessage('Save or reset your changes before closing.');
            return;
        }
        onClose();
    };

    const saveChanges = async () => {
        if (!dirty) return;
        setSaveState('saving');
        setMessage('Saving changes...');

        try {
            const response = await fetch('/__steam-game-manager/overrides', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    overrides: normalizeOverrides(draft),
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || 'Unable to save changes.');
            }

            const saved = normalizeOverrides(payload.overrides || {});
            setDraft(cloneOverrides(saved));
            setBaseline(cloneOverrides(saved));
            onSaved(saved);
            setSaveState('saved');
            setMessage('Saved to game-overrides.json.');
        } catch (error) {
            setSaveState('error');
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to save changes.'
            );
        }
    };

    const syncSteam = async () => {
        if (dirty || syncing) return;
        setSyncing(true);
        setSaveState('idle');
        setMessage('Fetching the latest library from Steam...');

        try {
            const response = await fetch('/__steam-game-manager/sync', {
                method: 'POST',
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || 'Unable to sync Steam.');
            }

            setSaveState('saved');
            setMessage(
                `Synced ${payload.gameCount ?? 0} Steam items. Reloading...`
            );
            window.setTimeout(() => window.location.reload(), 900);
        } catch (error) {
            setSyncing(false);
            setSaveState('error');
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to sync Steam.'
            );
        }
    };

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
        <section
            className="game-manager"
            aria-label="Steam game library manager"
        >
            <header className="game-manager__header">
                <div>
                    <p>Local editing tool</p>
                    <h2>Library Manager</h2>
                    <span>
                        {counts.shelf} on shelf, {counts.hidden} hidden
                    </span>
                </div>
                <div className="game-manager__actions">
                    <button
                        type="button"
                        className="game-manager__button"
                        disabled={dirty || syncing}
                        title={
                            dirty
                                ? 'Save or reset changes before syncing.'
                                : 'Merge owned games with local Steam play history, including Family Library games.'
                        }
                        onClick={syncSteam}
                    >
                        {syncing ? 'Syncing...' : 'Sync Steam'}
                    </button>
                    <button
                        type="button"
                        className="game-manager__button"
                        disabled={!dirty || syncing}
                        onClick={resetChanges}
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        className="game-manager__button game-manager__button--primary"
                        disabled={
                            !dirty || saveState === 'saving' || syncing
                        }
                        onClick={saveChanges}
                    >
                        {saveState === 'saving'
                            ? 'Saving...'
                            : `Save${dirtyCount ? ` (${dirtyCount})` : ''}`}
                    </button>
                    <button
                        type="button"
                        className="game-manager__button"
                        disabled={syncing}
                        onClick={closeManager}
                    >
                        Done
                    </button>
                </div>
            </header>

            <div className="game-manager__toolbar">
                <label className="game-manager__search">
                    <span>Search</span>
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Title or App ID"
                    />
                </label>
                <div
                    className="game-manager__filters"
                    role="group"
                    aria-label="Filter managed games"
                >
                    {FILTERS.map((option) => (
                        <button
                            type="button"
                            key={option}
                            aria-pressed={filter === option}
                            onClick={() => setFilter(option)}
                        >
                            {FILTER_LABELS[option]}
                            <span>{counts[option]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {message && (
                <div
                    className="game-manager__message"
                    data-state={saveState}
                    role={saveState === 'error' ? 'alert' : 'status'}
                >
                    {message}
                </div>
            )}

            <div className="game-manager__body">
                <div className="game-manager__list-pane">
                    <div className="game-manager__list-summary">
                        <span>{filteredGames.length} results</span>
                        {counts.hidden > 0 && (
                            <button type="button" onClick={showAllPlayed}>
                                Show all played
                            </button>
                        )}
                    </div>
                    <div className="game-manager__list" role="list">
                        {filteredGames.map((game) => (
                            <div
                                className="game-manager__row"
                                data-hidden={isHidden(game)}
                                data-selected={game.appId === selectedAppId}
                                key={game.appId}
                                role="listitem"
                            >
                                <button
                                    className="game-manager__row-main"
                                    type="button"
                                    onClick={() => setSelectedAppId(game.appId)}
                                >
                                    <img
                                        alt=""
                                        aria-hidden="true"
                                        data-fallback-src={game.fallbackCover}
                                        loading="lazy"
                                        onError={useFallbackCover}
                                        src={game.cover}
                                    />
                                    <span>
                                        <strong>{game.title}</strong>
                                        <small>
                                            {formatHours(game.hours)} |{' '}
                                            {game.librarySource ===
                                            'family-shared'
                                                ? 'Family Library'
                                                : 'Owned'}{' '}
                                            | App ID {game.appId}
                                        </small>
                                    </span>
                                </button>
                                <label className="game-manager__visibility">
                                    <span>
                                        {game.hours === 0
                                            ? 'Not played'
                                            : isHidden(game)
                                              ? 'Hidden'
                                              : 'On shelf'}
                                    </span>
                                    <input
                                        type="checkbox"
                                        aria-label={`Show ${game.title} on shelf`}
                                        checked={isOnShelf(game)}
                                        disabled={game.hours === 0}
                                        onChange={() => toggleVisibility(game)}
                                    />
                                </label>
                            </div>
                        ))}
                        {filteredGames.length === 0 && (
                            <p className="game-manager__empty">
                                No games match this search.
                            </p>
                        )}
                    </div>
                </div>

                {selectedGame && (
                    <aside
                        className="game-manager__detail"
                        aria-label={`Edit ${selectedGame.title}`}
                    >
                        <div className="game-manager__detail-cover">
                            <img
                                alt={`${selectedGame.title} cover art`}
                                data-fallback-src={selectedGame.fallbackCover}
                                onError={useFallbackCover}
                                src={selectedGame.cover}
                            />
                        </div>
                        <div className="game-manager__detail-copy">
                            <h3>{selectedGame.title}</h3>
                            <p>
                                {formatHours(selectedGame.hours)} |{' '}
                                {selectedGame.librarySource ===
                                'family-shared'
                                    ? 'Family Library'
                                    : 'Owned'}{' '}
                                | App ID {selectedGame.appId}
                            </p>
                        </div>

                        <label className="game-manager__switch">
                            <span>
                                <strong>Show on portfolio shelf</strong>
                                <small>
                                    Games without playtime stay off the shelf.
                                </small>
                            </span>
                            <input
                                type="checkbox"
                                checked={isOnShelf(selectedGame)}
                                disabled={selectedGame.hours === 0}
                                onChange={() =>
                                    toggleVisibility(selectedGame)
                                }
                            />
                        </label>

                        <label className="game-manager__notes">
                            <span>Personal note</span>
                            <textarea
                                value={
                                    draft[String(selectedGame.appId)]?.notes ||
                                    ''
                                }
                                maxLength={2000}
                                onChange={(event) =>
                                    updateOverride(selectedGame.appId, {
                                        notes: event.target.value,
                                    })
                                }
                                placeholder="A short memory or verdict shown in the game details."
                            />
                            <small>
                                Optional. Maximum 2,000 characters.
                            </small>
                        </label>
                    </aside>
                )}
            </div>
        </section>
    );
};

export default GameLibraryManager;
