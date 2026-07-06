import React, { useCallback, useEffect, useState } from 'react';
import ShowcaseExplorer from '../applications/ShowcaseExplorer';
import DoomShareware from '../applications/DoomShareware';
import CommanderKeen from '../applications/CommanderKeen';
import FreecivWeb from '../applications/FreecivWeb';
import {
    AboutTxt,
    AuthorizedGamesReadme,
    ContactCard,
    MusicDisk,
    PhotosFolder,
    ProjectsFolder,
    ResearchNotes,
    ResumePdf,
    ThisComputer,
} from '../applications/DesktopFiles';
import ShutdownSequence from './ShutdownSequence';
import Jianwordle from '../applications/Jianwordle';
import Toolbar from './Toolbar';
import DesktopShortcut, { DesktopShortcutProps } from './DesktopShortcut';
import { IconName } from '../../assets/icons';
import Credits from '../applications/Credits';

export interface DesktopProps {}

type ExtendedWindowAppProps<T> = T & WindowAppProps;

const APPLICATIONS: {
    [key in string]: {
        key: string;
        name: string;
        shortcutIcon: IconName;
        component: React.FC<ExtendedWindowAppProps<any>>;
    };
} = {
    computer: {
        key: 'computer',
        name: 'This Computer',
        shortcutIcon: 'computerBig',
        component: ThisComputer,
    },
    showcase: {
        key: 'showcase',
        name: 'My Showcase',
        shortcutIcon: 'showcaseIcon',
        component: ShowcaseExplorer,
    },
    resume: {
        key: 'resume',
        name: 'Resume.pdf',
        shortcutIcon: 'pdfIcon',
        component: ResumePdf,
    },
    projectsFolder: {
        key: 'projectsFolder',
        name: 'Projects',
        shortcutIcon: 'folderIcon',
        component: ProjectsFolder,
    },
    aboutTxt: {
        key: 'aboutTxt',
        name: 'ABOUT.TXT',
        shortcutIcon: 'textFileIcon',
        component: AboutTxt,
    },
    researchNotes: {
        key: 'researchNotes',
        name: 'Research Notes',
        shortcutIcon: 'textFileIcon',
        component: ResearchNotes,
    },
    contactCard: {
        key: 'contactCard',
        name: 'Contact Card',
        shortcutIcon: 'linkIcon',
        component: ContactCard,
    },
    photos: {
        key: 'photos',
        name: 'Photos',
        shortcutIcon: 'photoIcon',
        component: PhotosFolder,
    },
    musicDisk: {
        key: 'musicDisk',
        name: 'Music Disk',
        shortcutIcon: 'musicDiskIcon',
        component: MusicDisk,
    },
    gamesReadme: {
        key: 'gamesReadme',
        name: 'GAMES-README.TXT',
        shortcutIcon: 'textFileIcon',
        component: AuthorizedGamesReadme,
    },
    doomShareware: {
        key: 'doomShareware',
        name: 'Doom Shareware',
        shortcutIcon: 'doomSharewareIcon',
        component: DoomShareware,
    },
    commanderKeen: {
        key: 'commanderKeen',
        name: 'Commander Keen',
        shortcutIcon: 'keenIcon',
        component: CommanderKeen,
    },
    freecivWeb: {
        key: 'freecivWeb',
        name: 'Freeciv Web',
        shortcutIcon: 'freecivIcon',
        component: FreecivWeb,
    },
    jianwordle: {
        key: 'jianwordle',
        name: 'Jerryordle',
        shortcutIcon: 'jianwordleIcon',
        component: Jianwordle,
    },
    credits: {
        key: 'credits',
        name: 'Credits',
        shortcutIcon: 'credits',
        component: Credits,
    },
};

const Desktop: React.FC<DesktopProps> = (props) => {
    const [windows, setWindows] = useState<DesktopWindows>({});

    const [shortcuts, setShortcuts] = useState<DesktopShortcutProps[]>([]);

    const [shutdown, setShutdown] = useState(false);
    const [numShutdowns, setNumShutdowns] = useState(1);

    useEffect(() => {
        if (shutdown === true) {
            rebootDesktop();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shutdown]);

    useEffect(() => {
        const newShortcuts: DesktopShortcutProps[] = [];
        Object.keys(APPLICATIONS).forEach((key) => {
            const app = APPLICATIONS[key];
            newShortcuts.push({
                shortcutName: app.name,
                icon: app.shortcutIcon,
                onOpen: () => {
                    addWindow(
                        app.key,
                        <app.component
                            onInteract={() => onWindowInteract(app.key)}
                            onMinimize={() => minimizeWindow(app.key)}
                            onClose={() => removeWindow(app.key)}
                            key={app.key}
                        />
                    );
                },
            });
        });

        setShortcuts(newShortcuts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rebootDesktop = useCallback(() => {
        setWindows({});
    }, []);

    const removeWindow = useCallback((key: string) => {
        // Absolute hack and a half
        setTimeout(() => {
            setWindows((prevWindows) => {
                const newWindows = { ...prevWindows };
                delete newWindows[key];
                return newWindows;
            });
        }, 100);
    }, []);

    const minimizeWindow = useCallback((key: string) => {
        setWindows((prevWindows) => {
            const newWindows = { ...prevWindows };
            newWindows[key].minimized = true;
            return newWindows;
        });
    }, []);

    const getHighestZIndex = useCallback((): number => {
        let highestZIndex = 0;
        Object.keys(windows).forEach((key) => {
            const window = windows[key];
            if (window) {
                if (window.zIndex > highestZIndex)
                    highestZIndex = window.zIndex;
            }
        });
        return highestZIndex;
    }, [windows]);

    const toggleMinimize = useCallback(
        (key: string) => {
            const newWindows = { ...windows };
            const highestIndex = getHighestZIndex();
            if (
                newWindows[key].minimized ||
                newWindows[key].zIndex === highestIndex
            ) {
                newWindows[key].minimized = !newWindows[key].minimized;
            }
            newWindows[key].zIndex = getHighestZIndex() + 1;
            setWindows(newWindows);
        },
        [windows, getHighestZIndex]
    );

    const onWindowInteract = useCallback(
        (key: string) => {
            setWindows((prevWindows) => ({
                ...prevWindows,
                [key]: {
                    ...prevWindows[key],
                    zIndex: 1 + getHighestZIndex(),
                },
            }));
        },
        [setWindows, getHighestZIndex]
    );

    const startShutdown = useCallback(() => {
        setTimeout(() => {
            setShutdown(true);
            setNumShutdowns(numShutdowns + 1);
        }, 600);
    }, [numShutdowns]);

    const addWindow = useCallback(
        (key: string, element: JSX.Element) => {
            setWindows((prevState) => ({
                ...prevState,
                [key]: {
                    zIndex: getHighestZIndex() + 1,
                    minimized: false,
                    component: element,
                    name: APPLICATIONS[key].name,
                    icon: APPLICATIONS[key].shortcutIcon,
                },
            }));
        },
        [getHighestZIndex]
    );

    const getShortcutPosition = (index: number) => {
        const column = index % 4;
        const row = Math.floor(index / 4);
        return {
            left: column * 96,
            top: row * 94,
        };
    };

    return !shutdown ? (
        <div style={styles.desktop}>
            {/* For each window in windows, loop over and render  */}
            {Object.keys(windows).map((key) => {
                const element = windows[key].component;
                if (!element) return <div key={`win-${key}`}></div>;
                return (
                    <div
                        key={`win-${key}`}
                        style={Object.assign(
                            {},
                            { zIndex: windows[key].zIndex },
                            windows[key].minimized && styles.minimized
                        )}
                    >
                        {React.cloneElement(element, {
                            key,
                            onInteract: () => onWindowInteract(key),
                            onClose: () => removeWindow(key),
                        })}
                    </div>
                );
            })}
            <div style={styles.shortcuts}>
                {shortcuts.map((shortcut, i) => {
                    return (
                        <div
                            style={Object.assign(
                                {},
                                styles.shortcutContainer,
                                getShortcutPosition(i)
                            )}
                            key={shortcut.shortcutName}
                        >
                            <DesktopShortcut
                                icon={shortcut.icon}
                                shortcutName={shortcut.shortcutName}
                                onOpen={shortcut.onOpen}
                            />
                        </div>
                    );
                })}
            </div>
            <Toolbar
                windows={windows}
                toggleMinimize={toggleMinimize}
                shutdown={startShutdown}
            />
        </div>
    ) : (
        <ShutdownSequence
            setShutdown={setShutdown}
            numShutdowns={numShutdowns}
        />
    );
};

const styles: StyleSheetCSS = {
    desktop: {
        minHeight: '100%',
        flex: 1,
        background:
            'radial-gradient(circle at 18% 12%, rgba(255,255,255,0.9), transparent 28%), radial-gradient(circle at 80% 18%, rgba(157, 198, 255, 0.36), transparent 32%), linear-gradient(135deg, #eef3f7 0%, #dfe8f1 44%, #f7f2ea 100%)',
        color: '#14202b',
        overflow: 'hidden',
    },
    shutdown: {
        minHeight: '100%',
        flex: 1,
        backgroundColor: '#1d2e2f',
    },
    shortcutContainer: {
        position: 'absolute',
    },
    shortcuts: {
        position: 'absolute',
        top: 58,
        left: 22,
    },
    minimized: {
        pointerEvents: 'none',
        opacity: 0,
    },
};

export default Desktop;
