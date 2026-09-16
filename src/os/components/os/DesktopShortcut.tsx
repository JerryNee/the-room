import React, { useEffect, useRef, useState } from 'react';
import getIconByName, { IconName } from '../../assets/icons';
import { Icon } from '../general';

export interface DesktopShortcutProps {
    icon: IconName;
    shortcutName: string;
    invertText?: boolean;
    onOpen: () => void;
}

const DesktopShortcut: React.FC<DesktopShortcutProps> = ({
    icon,
    shortcutName,
    invertText,
    onOpen,
}) => {
    const [isSelected, setIsSelected] = useState(false);
    const [lastSelected, setLastSelected] = useState(false);
    const containerRef = useRef<HTMLButtonElement>(null);
    const doubleClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requiredIcon = getIconByName(icon) as unknown as string;
    const shortcutId = `desktop-shortcut-${shortcutName.replace(/\s/g, '')}`;

    const isMobileViewport = () => window.matchMedia(
        '(max-width: 768px), (max-width: 1024px) and (pointer: coarse)'
    ).matches;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsSelected(false);
                setLastSelected(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (doubleClickTimer.current) clearTimeout(doubleClickTimer.current);
        };
    }, []);

    // The 3D desktop forwards mouse events; preserve its two-press activation.
    const handleMouseDown = () => {
        if (isMobileViewport()) return;
        if (doubleClickTimer.current) {
            clearTimeout(doubleClickTimer.current);
            doubleClickTimer.current = null;
            setIsSelected(false);
            onOpen();
            return;
        }
        setIsSelected(true);
        setLastSelected(true);
        doubleClickTimer.current = setTimeout(() => {
            doubleClickTimer.current = null;
        }, 300);
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        // Native click allows a touch scroll to cancel before launching an app.
        if (isMobileViewport() || event.detail === 0) onOpen();
    };

    return (
        <button
            type="button"
            className="os-shortcut"
            id={shortcutId}
            style={styles.appShortcut}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            ref={containerRef}
        >
            <div style={styles.iconContainer}>
                <div
                    className="desktop-shortcut-icon"
                    style={Object.assign(
                        {},
                        styles.iconOverlay,
                        isSelected && styles.checkerboard,
                        isSelected && {
                            WebkitMask: `url(${requiredIcon})`,
                        }
                    )}
                />
                <Icon icon={icon} style={styles.icon} size={32} />
            </div>
            <div
                className={
                    isSelected
                        ? 'selected-shortcut-border'
                        : lastSelected
                        ? 'shortcut-border'
                        : ''
                }
                style={
                    isSelected
                        ? {
                              backgroundColor: 'rgba(0, 122, 255, 0.18)',
                              borderRadius: 7,
                          }
                        : {}
                }
            >
                <p
                    style={Object.assign(
                        {},
                        styles.shortcutText,
                        invertText && !isSelected && { color: 'black' }
                    )}
                >
                    {shortcutName}
                </p>
            </div>
        </button>
    );
};

const styles: StyleSheetCSS = {
    appShortcut: {
        display: 'flex',
        background: 'transparent',
        border: 0,
        padding: 0,
        font: 'inherit',
        color: 'inherit',
        cursor: 'pointer',
        position: 'absolute',
        width: 74,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        textAlign: 'center',
        gap: 6,
    },
    shortcutText: {
        cursor: 'pointer',
        textOverflow: 'wrap',
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
        color: '#172123',
        fontSize: 10,
        fontWeight: 650,
        lineHeight: 1.15,
        textShadow: '0 1px 0 rgba(255,255,255,0.58)',
        paddingRight: 5,
        paddingLeft: 5,
    },
    iconContainer: {
        cursor: 'pointer',
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        background:
            'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.34))',
        border: '1px solid rgba(255,255,255,0.64)',
        boxShadow:
            '0 12px 26px rgba(18, 28, 38, 0.12), inset 0 1px 0 rgba(255,255,255,0.82)',
    },
    icon: {
        width: 30,
        height: 30,
        imageRendering: 'auto',
    },
    iconOverlay: {
        position: 'absolute',
        top: 0,
        width: 46,
        height: 46,
        borderRadius: 14,
    },
    checkerboard: {
        background: 'rgba(0, 122, 255, 0.18)',
        boxShadow: '0 0 0 2px rgba(0, 122, 255, 0.28)',
        pointerEvents: 'none',
    },
};

export default DesktopShortcut;
