import React, { useEffect, useRef, useState } from 'react';
import Colors from '../../constants/colors';
import { Icon } from '../general';

export interface ToolbarProps {
    windows: DesktopWindows;
    toggleMinimize: (key: string) => void;
    shutdown: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ windows, toggleMinimize, shutdown }) => {
    const getTime = () => new Date().toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
    });
    const [startWindowOpen, setStartWindowOpen] = useState(false);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [time, setTime] = useState(getTime());
    const lastActive = Object.keys(windows).reduce((active, key) =>
        !active || windows[key].zIndex >= windows[active].zIndex ? key : active, '');

    useEffect(() => {
        const timer = window.setInterval(() => setTime(getTime()), 5000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const closeOutside = (event: MouseEvent) => {
            if (!toolbarRef.current?.contains(event.target as Node)) {
                setStartWindowOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && startWindowOpen) {
                event.preventDefault();
                setStartWindowOpen(false);
            }
        };
        document.addEventListener('mousedown', closeOutside);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('mousedown', closeOutside);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [startWindowOpen]);

    return (
        <div className="os-toolbar" style={styles.toolbarOuter} ref={toolbarRef}>
            {startWindowOpen && (
                <div className="os-start-menu" style={styles.startWindow}>
                    <div style={styles.startWindowInner}>
                        <div style={styles.startWindowContent}>
                            <button
                                type="button"
                                className="start-menu-option"
                                style={styles.startMenuOption}
                                onClick={() => {
                                    setStartWindowOpen(false);
                                    shutdown();
                                }}
                            >
                                <Icon style={styles.startMenuIcon} icon="computerBig" />
                                <span style={styles.startMenuText}>Shut Down...</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="os-toolbar-inner" style={styles.toolbarInner}>
                <div className="os-toolbar-main" style={styles.toolbar}>
                    <button
                        type="button"
                        className="os-start-button"
                        aria-label="JianweiOS menu"
                        aria-expanded={startWindowOpen}
                        style={Object.assign({}, styles.startContainerOuter,
                            startWindowOpen && styles.activeTabOuter)}
                        onClick={() => setStartWindowOpen((open) => !open)}
                    >
                        <div style={Object.assign({}, styles.startContainer,
                            startWindowOpen && styles.activeTabInner)}>
                            <Icon size={18} icon="myComputer" style={styles.startIcon} />
                            <span className="toolbar-text">JianweiOS</span>
                        </div>
                    </button>
                    <div className="os-toolbar-tabs" style={styles.toolbarTabsContainer}
                        aria-label="Open applications">
                        {Object.keys(windows).map((key) => {
                            const active = lastActive === key && !windows[key].minimized;
                            return (
                                <button
                                    type="button"
                                    key={key}
                                    className="os-toolbar-tab"
                                    title={windows[key].name}
                                    aria-label={`${active ? 'Minimize' : windows[key].minimized ? 'Restore' : 'Switch to'} ${windows[key].name}`}
                                    aria-pressed={active}
                                    style={Object.assign({}, styles.tabContainerOuter,
                                        active && styles.activeTabOuter)}
                                    onClick={() => toggleMinimize(key)}
                                >
                                    <div className="os-toolbar-tab-inner"
                                        style={Object.assign({}, styles.tabContainer,
                                            active && styles.activeTabInner)}>
                                        <Icon size={18} icon={windows[key].icon} style={styles.tabIcon} />
                                        <span className="os-toolbar-tab-label" style={styles.tabText}>
                                            {windows[key].name}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="os-toolbar-time" style={styles.time}>
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
