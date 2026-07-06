import React, { useEffect, useRef, useState } from 'react';
import Colors from '../../constants/colors';
import { Icon } from '../general';
// import { } from '../general';
// import Home from '../site/Home';
// import Window from './Window';

export interface ToolbarProps {
    windows: DesktopWindows;
    toggleMinimize: (key: string) => void;
    shutdown: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    windows,
    toggleMinimize,
    shutdown,
}) => {
    const getTime = () => {
        const date = new Date();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let amPm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        let mins = minutes < 10 ? '0' + minutes : minutes;
        const strTime = hours + ':' + mins + ' ' + amPm;
        return strTime;
    };

    const [startWindowOpen, setStartWindowOpen] = useState(false);
    const lastClickInside = useRef(false);

    const [lastActive, setLastActive] = useState('');

    useEffect(() => {
        let max = 0;
        let k = '';
        Object.keys(windows).forEach((key) => {
            if (windows[key].zIndex >= max) {
                max = windows[key].zIndex;
                k = key;
            }
        });
        setLastActive(k);
    }, [windows]);

    const [time, setTime] = useState(getTime());

    useEffect(() => {
        const timer = window.setInterval(() => setTime(getTime()), 5000);
        return () => window.clearInterval(timer);
    }, []);

    const onCheckClick = () => {
        if (lastClickInside.current) {
            setStartWindowOpen(true);
        } else {
            setStartWindowOpen(false);
        }
        lastClickInside.current = false;
    };

    useEffect(() => {
        window.addEventListener('mousedown', onCheckClick, false);
        return () => {
            window.removeEventListener('mousedown', onCheckClick, false);
        };
    }, []);

    const onStartWindowClicked = (event: React.MouseEvent) => {
        event.stopPropagation();
        setStartWindowOpen(true);
        lastClickInside.current = true;
    };

    const toggleStartWindow = (event: React.MouseEvent) => {
        event.stopPropagation();
        const nextOpen = !startWindowOpen;
        setStartWindowOpen(nextOpen);
        lastClickInside.current = nextOpen;
    };

    return (
        <div style={styles.toolbarOuter}>
            {startWindowOpen && (
                <div
                    onMouseDown={onStartWindowClicked}
                    style={styles.startWindow}
                >
                    <div style={styles.startWindowInner}>
                        <div style={styles.verticalStartContainer}>
                            <p style={styles.verticalText}>JianweiOS</p>
                        </div>
                        <div style={styles.startWindowContent}>
                            <div style={styles.startMenuSpace} />
                            <div style={styles.startMenuLine} />
                            <div
                                className="start-menu-option"
                                style={styles.startMenuOption}
                                onMouseDown={shutdown}
                            >
                                <Icon
                                    style={styles.startMenuIcon}
                                    icon="computerBig"
                                />
                                <p style={styles.startMenuText}>
                                    Shut Down...
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div style={styles.toolbarInner}>
                <div style={styles.toolbar}>
                    <div
                        style={Object.assign(
                            {},
                            styles.startContainerOuter,
                            startWindowOpen && styles.activeTabOuter
                        )}
                        onMouseDown={toggleStartWindow}
                    >
                        <div
                            style={Object.assign(
                                {},
                                styles.startContainer,
                                startWindowOpen && styles.activeTabInner
                            )}
                        >
                            <Icon
                                size={18}
                                icon="myComputer"
                                style={styles.startIcon}
                            />
                            <p className="toolbar-text ">JianweiOS</p>
                        </div>
                    </div>
                    <div style={styles.toolbarTabsContainer}>
                        {Object.keys(windows).map((key) => {
                            return (
                                <div
                                    key={key}
                                    style={Object.assign(
                                        {},
                                        styles.tabContainerOuter,
                                        lastActive === key &&
                                            !windows[key].minimized &&
                                            styles.activeTabOuter
                                    )}
                                    onMouseDown={() => toggleMinimize(key)}
                                >
                                    <div
                                        style={Object.assign(
                                            {},
                                            styles.tabContainer,
                                            lastActive === key &&
                                                !windows[key].minimized &&
                                                styles.activeTabInner
                                        )}
                                    >
                                        <Icon
                                            size={18}
                                            icon={windows[key].icon}
                                            style={styles.tabIcon}
                                        />
                                        <p style={styles.tabText}>
                                            {windows[key].name}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div style={styles.time}>
                    <Icon style={styles.volumeIcon} icon="volumeOn" />
                    <p style={styles.timeText}>{time}</p>
                </div>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    toolbarOuter: {
        boxSizing: 'border-box',
        position: 'absolute',
        top: 0,
        width: '100%',
        height: 32,
        background: 'rgba(248, 250, 252, 0.72)',
        borderBottom: '1px solid rgba(20, 29, 38, 0.1)',
        boxShadow: '0 8px 30px rgba(16, 24, 32, 0.08)',
        backdropFilter: 'blur(18px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
        zIndex: 100000,
    },
    verticalStartContainer: {
        display: 'none',
    },
    verticalText: {
        fontFamily: 'Terminal',
        textOrientation: 'sideways',
        fontSize: 32,
        padding: 4,
        paddingBottom: 64,
        paddingTop: 8,
        letterSpacing: 1,
        color: Colors.lightGray,
        transform: 'scale(-1)',
        WebkitTransform: 'scale(-1)',
        MozTransform: 'scale(-1)',
        msTransform: 'scale(-1)',
        OTransform: 'scale(-1)',
        // @ts-ignore
        writingMode: 'tb-rl',
    },
    startWindowContent: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        // alignItems: 'flex-end',
    },
    startWindow: {
        position: 'absolute',
        top: 34,
        display: 'flex',
        flex: 1,
        width: 238,
        left: 8,
        boxSizing: 'border-box',
        border: '1px solid rgba(255,255,255,0.62)',
        borderRadius: 14,
        background: 'rgba(248, 250, 252, 0.88)',
        boxShadow: '0 18px 52px rgba(10, 16, 24, 0.2)',
        backdropFilter: 'blur(20px) saturate(1.18)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.18)',
        overflow: 'hidden',
    },
    activeTabOuter: {
        background: 'rgba(255,255,255,0.72)',
    },
    startWindowInner: {
        flex: 1,
        padding: 8,
    },
    startMenuIcon: {
        width: 32,
        height: 32,
    },
    startMenuText: {
        fontSize: 13,
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
        fontWeight: 600,
        marginLeft: 8,
    },
    startMenuOption: {
        alignItems: 'center',
        height: 34,
        padding: '0 10px',
        borderRadius: 9,
    },
    startMenuSpace: {
        flex: 1,
    },
    startMenuLine: {
        height: 1,
        background: 'rgba(20, 29, 38, 0.1)',
        margin: '6px 0',
    },
    activeTabInner: {
        background: 'rgba(255, 255, 255, 0.74)',
        pointerEvents: 'none',
    },
    tabContainerOuter: {
        display: 'flex',
        flex: 1,
        maxWidth: 180,
        marginRight: 6,
        boxSizing: 'border-box',
        cursor: 'pointer',
        borderRadius: 999,
        overflow: 'hidden',
    },
    tabContainer: {
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 8,
        paddingRight: 10,
        flex: 1,
        background: 'rgba(255, 255, 255, 0.28)',
    },
    tabIcon: {
        marginRight: 6,
        imageRendering: 'auto',
    },
    startContainer: {
        alignItems: 'center',
        flexShrink: 1,
        padding: '4px 10px',
        borderRadius: 999,
    },
    startContainerOuter: {
        marginLeft: 8,
        boxSizing: 'border-box',
        cursor: 'pointer',
        borderRadius: 999,
    },
    toolbarTabsContainer: {
        // background: 'blue',
        flex: 1,
        marginLeft: 4,
        marginRight: 4,
    },
    startIcon: {
        marginRight: 4,
    },
    toolbarInner: {
        alignItems: 'center',
        flex: 1,
    },
    toolbar: {
        flexGrow: 1,
        width: '100%',
    },
    time: {
        flexShrink: 1,
        width: 104,
        height: 26,
        boxSizing: 'border-box',
        marginRight: 8,
        paddingLeft: 8,
        paddingRight: 8,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.4)',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    volumeIcon: {
        cursor: 'pointer',
        height: 14,
        imageRendering: 'auto',
    },
    tabText: {
        fontSize: 12,
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
        fontWeight: 600,
        color: '#14202b',
    },
    timeText: {
        fontSize: 12,
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
        fontWeight: 600,
        color: '#14202b',
    },
};

export default Toolbar;
