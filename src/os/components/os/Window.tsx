import React, { useEffect, useRef, useState } from 'react';
import { IconName } from '../../assets/icons';
import Icon from '../general/Icon';
import DragIndicator from './DragIndicator';
import ResizeIndicator from './ResizeIndicator';

export interface WindowProps {
    children?: React.ReactNode;
    closeWindow: () => void;
    minimizeWindow: () => void;
    onInteract: () => void;
    width: number;
    height: number;
    top: number;
    left: number;
    windowTitle?: string;
    bottomLeftText?: string;
    rainbow?: boolean;
    windowBarColor?: string;
    windowBarIcon?: IconName;
    onWidthChange?: (width: number) => void;
    onHeightChange?: (height: number) => void;
}

const Window: React.FC<WindowProps> = (props) => {
    const windowRef = useRef<any>(null);
    const dragRef = useRef<any>(null);
    const contentRef = useRef<any>(null);

    const dragProps = useRef<{
        dragStartX: any;
        dragStartY: any;
    }>();

    const resizeRef = useRef<any>(null);

    const [top, setTop] = useState(props.top);
    const [left, setLeft] = useState(props.left);

    const lastClickInside = useRef(false);

    const [width, setWidth] = useState(props.width);
    const [height, setHeight] = useState(props.height);

    const [contentWidth, setContentWidth] = useState(props.width);
    const [contentHeight, setContentHeight] = useState(props.height);

    const [windowActive, setWindowActive] = useState(true);

    const [isMaximized, setIsMaximized] = useState(false);
    const [preMaxSize, setPreMaxSize] = useState({
        width,
        height,
        top,
        left,
    });

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const startResize = (event: any) => {
        event.preventDefault();
        setIsResizing(true);
        window.addEventListener('mousemove', onResize, false);
        window.addEventListener('mouseup', stopResize, false);
    };

    const onResize = ({ clientX, clientY }: any) => {
        const curWidth = clientX - left;
        const curHeight = clientY - top;
        if (curWidth > 520) resizeRef.current.style.width = `${curWidth}px`;
        if (curHeight > 220) resizeRef.current.style.height = `${curHeight}px`;
        resizeRef.current.style.opacity = 1;
    };

    const stopResize = () => {
        setIsResizing(false);
        setWidth(resizeRef.current.style.width);
        setHeight(resizeRef.current.style.height);
        resizeRef.current.style.opacity = 0;
        window.removeEventListener('mousemove', onResize, false);
        window.removeEventListener('mouseup', stopResize, false);
    };

    const startDrag = (event: any) => {
        const { clientX, clientY } = event;
        setIsDragging(true);
        event.preventDefault();
        dragProps.current = {
            dragStartX: clientX,
            dragStartY: clientY,
        };
        window.addEventListener('mousemove', onDrag, false);
        window.addEventListener('mouseup', stopDrag, false);
    };

    const onDrag = ({ clientX, clientY }: any) => {
        let { x, y } = getXYFromDragProps(clientX, clientY);
        dragRef.current.style.transform = `translate(${x}px, ${y}px)`;
        dragRef.current.style.opacity = 1;
    };

    const stopDrag = ({ clientX, clientY }: any) => {
        setIsDragging(false);
        // dragRef.current.style.opacity = 0;
        const { x, y } = getXYFromDragProps(clientX, clientY);
        setTop(y);
        setLeft(x);
        window.removeEventListener('mousemove', onDrag, false);
        window.removeEventListener('mouseup', stopDrag, false);
    };

    const getXYFromDragProps = (
        clientX: number,
        clientY: number
    ): { x: number; y: number } => {
        if (!dragProps.current) return { x: 0, y: 0 };
        const { dragStartX, dragStartY } = dragProps.current;

        const x = clientX - dragStartX + left;
        const y = clientY - dragStartY + top;

        return { x, y };
    };

    useEffect(() => {
        dragRef.current.style.transform = `translate(${left}px, ${top}px)`;
    });

    useEffect(() => {
        props.onWidthChange && props.onWidthChange(contentWidth);
    }, [props.onWidthChange, contentWidth]); // eslint-disable-line

    useEffect(() => {
        props.onHeightChange && props.onHeightChange(contentHeight);
    }, [props.onHeightChange, contentHeight]); // eslint-disable-line

    useEffect(() => {
        setContentWidth(contentRef.current.getBoundingClientRect().width);
    }, [width]);

    useEffect(() => {
        setContentHeight(contentRef.current.getBoundingClientRect().height);
    }, [height]);

    const maximize = () => {
        if (isMaximized) {
            setWidth(preMaxSize.width);
            setHeight(preMaxSize.height);
            setTop(preMaxSize.top);
            setLeft(preMaxSize.left);
            setIsMaximized(false);
        } else {
            setPreMaxSize({
                width,
                height,
                top,
                left,
            });
            setWidth(window.innerWidth);
            setHeight(window.innerHeight - 32);
            setTop(32);
            setLeft(0);
            setIsMaximized(true);
        }
    };

    const onCheckClick = () => {
        if (lastClickInside.current) {
            setWindowActive(true);
        } else {
            setWindowActive(false);
        }
        lastClickInside.current = false;
    };

    useEffect(() => {
        window.addEventListener('mousedown', onCheckClick, false);
        return () => {
            window.removeEventListener('mousedown', onCheckClick, false);
        };
    }, []);

    const onWindowInteract = () => {
        props.onInteract();
        setWindowActive(true);
        lastClickInside.current = true;
    };

    const handleControl = (event: React.MouseEvent, callback: () => void) => {
        event.preventDefault();
        event.stopPropagation();
        callback();
    };

    return (
        <div onMouseDown={onWindowInteract} style={styles.container}>
            <div
                style={Object.assign({}, styles.window, {
                    width,
                    height,
                    top,
                    left,
                })}
                ref={windowRef}
            >
                <div style={styles.windowBorderOuter}>
                    <div style={styles.windowBorderInner}>
                        <div
                            style={styles.dragHitbox}
                            onMouseDown={startDrag}
                        ></div>
                        <div
                            className={props.rainbow ? 'rainbow-wrapper' : ''}
                            style={Object.assign(
                                {},
                                styles.topBar,
                                props.windowBarColor && {
                                    background: props.windowBarColor,
                                },
                                !windowActive && styles.inactiveTopBar
                            )}
                        >
                            <div style={styles.windowHeader}>
                                <div style={styles.windowTopButtons}>
                                    <button
                                        aria-label="Close window"
                                        onMouseDown={(event) =>
                                            handleControl(event, props.closeWindow)
                                        }
                                        style={Object.assign(
                                            {},
                                            styles.windowControl,
                                            styles.closeControl
                                        )}
                                    />
                                    <button
                                        aria-label="Minimize window"
                                        onMouseDown={(event) =>
                                            handleControl(event, props.minimizeWindow)
                                        }
                                        style={Object.assign(
                                            {},
                                            styles.windowControl,
                                            styles.minimizeControl
                                        )}
                                    />
                                    <button
                                        aria-label="Maximize window"
                                        onMouseDown={(event) =>
                                            handleControl(event, maximize)
                                        }
                                        style={Object.assign(
                                            {},
                                            styles.windowControl,
                                            styles.maximizeControl
                                        )}
                                    />
                                </div>
                                {props.windowBarIcon ? (
                                    <Icon
                                        icon={props.windowBarIcon}
                                        style={Object.assign(
                                            {},
                                            styles.windowBarIcon,
                                            !windowActive && { opacity: 0.5 }
                                        )}
                                        size={16}
                                    />
                                ) : (
                                    <div style={{ width: 16 }} />
                                )}
                                <p
                                    style={
                                        windowActive
                                            ? {}
                                            : { color: '#637083' }
                                    }
                                    className="showcase-header"
                                >
                                    {props.windowTitle}
                                </p>
                            </div>
                        </div>
                        <div
                            style={Object.assign({}, styles.contentOuter, {
                                // zIndex: isDragging || isResizing ? 0 : 100,
                            })}
                        >
                            <div style={styles.contentInner}>
                                <div style={styles.content} ref={contentRef}>
                                    {props.children}
                                </div>
                            </div>
                        </div>
                        <div
                            onMouseDown={startResize}
                            style={styles.resizeHitbox}
                        ></div>
                        <div style={styles.bottomBar}>
                            <div
                                style={Object.assign({}, styles.insetBorder, {
                                    flex: 5 / 7,
                                    alignItems: 'center',
                                })}
                            >
                                <p
                                    style={{
                                        fontSize: 12,
                                        marginLeft: 4,
                                        fontFamily: 'MSSerif',
                                    }}
                                >
                                    {props.bottomLeftText}
                                </p>
                            </div>
                            <div
                                style={Object.assign(
                                    {},
                                    styles.insetBorder,
                                    styles.bottomSpacer
                                )}
                            />
                            <div
                                style={Object.assign(
                                    {},
                                    styles.insetBorder,
                                    styles.bottomSpacer
                                )}
                            />
                            <div
                                style={Object.assign(
                                    {},
                                    styles.insetBorder,
                                    styles.bottomResizeContainer
                                )}
                            >
                                <div
                                    style={{
                                        alignItems: 'flex-end',
                                    }}
                                >
                                    <Icon size={12} icon="windowResize" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                style={
                    !isResizing
                        ? {
                              zIndex: -10000,
                              pointerEvents: 'none',
                          }
                        : {
                              zIndex: 1000,
                              cursor: 'nwse-resize',
                              mixBlendMode: 'difference',
                          }
                }
            >
                <ResizeIndicator
                    top={top}
                    left={left}
                    width={width}
                    height={height}
                    resizeRef={resizeRef}
                />
            </div>
            <div
                style={
                    !isDragging
                        ? {
                              zIndex: -10000,
                              pointerEvents: 'none',
                          }
                        : {
                              zIndex: 1000,
                              cursor: 'move',
                              mixBlendMode: 'difference',
                          }
                }
            >
                <DragIndicator
                    width={width}
                    height={height}
                    dragRef={dragRef}
                />
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    window: {
        backgroundColor: 'rgba(246, 248, 250, 0.76)',
        border: '1px solid rgba(255, 255, 255, 0.68)',
        borderRadius: 16,
        boxShadow:
            '0 28px 80px rgba(12, 18, 24, 0.22), 0 4px 18px rgba(12, 18, 24, 0.12)',
        overflow: 'hidden',
        position: 'absolute',
        backdropFilter: 'blur(22px) saturate(1.18)',
        WebkitBackdropFilter: 'blur(22px) saturate(1.18)',
    },
    dragHitbox: {
        position: 'absolute',
        width: 'calc(100% - 112px)',
        height: 40,
        zIndex: 10000,
        top: 0,
        left: 96,
        cursor: 'move',
    },
    windowBorderOuter: {
        flex: 1,
    },
    windowBorderInner: {
        flex: 1,
        flexDirection: 'column',
    },
    resizeHitbox: {
        position: 'absolute',
        width: 60,
        height: 60,
        bottom: -20,
        right: -20,
        cursor: 'nwse-resize',
    },
    topBar: {
        background:
            'linear-gradient(180deg, rgba(255,255,255,0.86), rgba(235,238,242,0.72))',
        width: '100%',
        height: 38,
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 12,
        boxSizing: 'border-box',
        borderBottom: '1px solid rgba(20, 29, 38, 0.1)',
    },
    inactiveTopBar: {
        background:
            'linear-gradient(180deg, rgba(244,246,249,0.72), rgba(229,233,238,0.58))',
    },
    contentOuter: {
        flexGrow: 1,
        marginTop: 0,
        marginBottom: 0,
        overflow: 'hidden',
    },
    contentInner: {
        flex: 1,
        overflow: 'hidden',
    },
    content: {
        flex: 1,

        position: 'relative',
        // overflow: 'scroll',
        overflowX: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
    },
    bottomBar: {
        display: 'none',
        flexShrink: 0,
        width: '100%',
        height: 24,
        background: 'rgba(246, 248, 250, 0.72)',
        borderTop: '1px solid rgba(20, 29, 38, 0.08)',
    },
    bottomSpacer: {
        width: 16,
        marginLeft: 2,
    },
    insetBorder: {
        padding: 2,
    },
    bottomResizeContainer: {
        flex: 2 / 7,

        justifyContent: 'flex-end',
        padding: 0,
        marginLeft: 2,
    },
    windowTopButtons: {
        gap: 8,
        alignItems: 'center',
        marginRight: 12,
        zIndex: 10001,
    },
    windowHeader: {
        flex: 1,
        alignItems: 'center',
        minWidth: 0,
    },
    windowBarIcon: {
        width: 16,
        height: 16,
        marginRight: 8,
        opacity: 0.72,
        imageRendering: 'auto',
    },
    windowControl: {
        width: 12,
        height: 12,
        borderRadius: 999,
        border: '1px solid rgba(0, 0, 0, 0.12)',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
    },
    closeControl: {
        background: '#ff5f57',
    },
    minimizeControl: {
        background: '#ffbd2e',
    },
    maximizeControl: {
        background: '#28c840',
    },
};

export default Window;
