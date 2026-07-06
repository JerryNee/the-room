import React from 'react';

interface LicensedWebGameProps {
    title: string;
    width: number;
    height: number;
    frameUrl: string;
    sourceUrl: string;
    sourceLabel: string;
    licenseSummary: string;
}

const LicensedWebGame: React.FC<LicensedWebGameProps> = ({
    title,
    width,
    height,
    frameUrl,
    sourceUrl,
    sourceLabel,
    licenseSummary,
}) => {
    const openFrame = () => {
        window.open(frameUrl, '_blank', 'noopener,noreferrer');
    };

    const openSource = () => {
        window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            style={{
                ...styles.wrapper,
                width,
                height,
            }}
        >
            <div style={styles.header}>
                <div style={styles.titleBlock}>
                    <h3 style={styles.title}>{title}</h3>
                    <p style={styles.meta}>{sourceLabel}</p>
                </div>
                <div style={styles.actions}>
                    <button className="site-button" onMouseDown={openFrame}>
                        Open
                    </button>
                    <button className="site-button" onMouseDown={openSource}>
                        Source
                    </button>
                </div>
            </div>
            <iframe
                title={title}
                src={frameUrl}
                allow="autoplay; fullscreen; gamepad; pointer-lock"
                referrerPolicy="no-referrer-when-downgrade"
                style={styles.frame}
            />
            <div style={styles.status}>
                <p style={styles.statusText}>{licenseSummary}</p>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        position: 'absolute',
        inset: 0,
        backgroundColor: '#050505',
        color: '#ffffff',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: {
        height: 62,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 10px',
        boxSizing: 'border-box',
        backgroundColor: '#101014',
        borderBottom: '2px solid #ffffff',
        gap: 10,
    },
    titleBlock: {
        minWidth: 0,
        flexDirection: 'column',
    },
    title: {
        color: '#ffffff',
        fontFamily: 'Terminal, monospace',
        fontSize: 22,
        letterSpacing: 0,
        whiteSpace: 'nowrap',
    },
    meta: {
        color: '#d5dcff',
        fontFamily: 'Terminal, monospace',
        fontSize: 12,
        marginTop: 6,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    actions: {
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
    },
    frame: {
        flex: 1,
        width: '100%',
        minHeight: 0,
        border: 0,
        backgroundColor: '#000000',
    },
    status: {
        height: 28,
        flexShrink: 0,
        alignItems: 'center',
        padding: '0 10px',
        backgroundColor: '#c3c6ca',
        boxSizing: 'border-box',
        borderTop: '2px solid #ffffff',
    },
    statusText: {
        color: '#000000',
        fontFamily: 'MSSerif, serif',
        fontSize: 14,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
};

export default LicensedWebGame;
