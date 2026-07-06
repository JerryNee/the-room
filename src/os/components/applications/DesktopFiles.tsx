import React, { useState } from 'react';
import Window from '../os/Window';
import MusicPlayer from '../general/MusicPlayer';
import {
    aboutParagraphs,
    email,
    githubUsername,
    headline,
    introduction,
    name,
    projects,
    publications,
    socialLinks,
} from '../../../config/infoConfig';
import houseMaster from '../../assets/audio/house_master.mp3';
import edgeUnmastered from '../../assets/audio/edge_unmastered.mp3';
import dnbDropDrums from '../../assets/audio/dnb_drop_drums.mp3';
import breakBeat from '../../assets/audio/break.mp3';
import currentMe from '../../assets/pictures/currentme.jpg';
import workingAtComputer from '../../assets/pictures/workingAtComputer.jpg';
import eePic from '../../assets/pictures/ee.jpg';

interface FileWindowProps extends WindowAppProps {
    title: string;
    icon?: 'computerBig' | 'folderIcon' | 'textFileIcon' | 'pdfIcon' | 'linkIcon' | 'photoIcon' | 'musicDiskIcon';
    top?: number;
    left?: number;
    width?: number;
    height?: number;
    bottomLeftText?: string;
    children: React.ReactNode;
}

const openExternal = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer');
};

const FileWindow: React.FC<FileWindowProps> = ({
    title,
    icon = 'textFileIcon',
    top = 70,
    left = 120,
    width = 640,
    height = 520,
    bottomLeftText = 'Desktop file',
    children,
    ...props
}) => {
    return (
        <Window
            top={top}
            left={left}
            width={width}
            height={height}
            windowTitle={title}
            windowBarIcon={icon}
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={bottomLeftText}
        >
            <div style={styles.page}>{children}</div>
        </Window>
    );
};

export const ThisComputer: React.FC<WindowAppProps> = (props) => (
    <FileWindow
        {...props}
        title="This Computer"
        icon="computerBig"
        top={36}
        left={96}
        width={600}
        height={430}
        bottomLeftText="JNOS local machine"
    >
        <h2 style={styles.title}>Jianwei Ni OS</h2>
        <p style={styles.lead}>{headline}</p>
        <div style={styles.rule} />
        <p>
            A compact desktop surface for portfolio browsing, project notes,
            resume access, and the objects that live inside Jerry's room.
        </p>
        <div style={styles.infoGrid}>
            <span>Owner</span>
            <b>{name}</b>
            <span>School</span>
            <b>UIUC</b>
            <span>Focus</span>
            <b>Mixed Reality + Generative AI</b>
            <span>Status</span>
            <b>Online</b>
        </div>
    </FileWindow>
);

export const AboutTxt: React.FC<WindowAppProps> = (props) => (
    <FileWindow {...props} title="ABOUT.TXT" top={82} left={150}>
        <h2 style={styles.title}>ABOUT.TXT</h2>
        <p style={styles.lead}>{introduction}</p>
        {aboutParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
        ))}
    </FileWindow>
);

export const ResumePdf: React.FC<WindowAppProps> = (props) => (
    <FileWindow
        {...props}
        title="Resume.pdf"
        icon="pdfIcon"
        top={48}
        left={130}
        width={760}
        height={640}
        bottomLeftText="/resume.pdf"
    >
        <div style={styles.toolbar}>
            <h2 style={styles.title}>Resume.pdf</h2>
            <button
                className="site-button"
                onMouseDown={() => openExternal('/resume.pdf')}
            >
                Open PDF
            </button>
        </div>
        <iframe title="Resume PDF" src="/resume.pdf" style={styles.pdfFrame} />
    </FileWindow>
);

export const ProjectsFolder: React.FC<WindowAppProps> = (props) => (
    <FileWindow
        {...props}
        title="Projects"
        icon="folderIcon"
        top={58}
        left={180}
        width={720}
        height={560}
        bottomLeftText="Selected project notes"
    >
        <h2 style={styles.title}>Projects</h2>
        <p style={styles.lead}>A few things worth opening before the machine powers down.</p>
        <div style={styles.list}>
            {projects.map((project) => (
                <div key={project.name} style={styles.listItem}>
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                    <p style={styles.tags}>{project.tags.join(' / ')}</p>
                    {project.link.href && (
                        <button
                            className="site-button"
                            onMouseDown={() => openExternal(project.link.href)}
                        >
                            Open Link
                        </button>
                    )}
                </div>
            ))}
        </div>
    </FileWindow>
);

export const ResearchNotes: React.FC<WindowAppProps> = (props) => (
    <FileWindow
        {...props}
        title="Research Notes"
        icon="textFileIcon"
        top={76}
        left={210}
        width={740}
        height={520}
        bottomLeftText="Publications"
    >
        <h2 style={styles.title}>Research Notes</h2>
        <div style={styles.list}>
            {publications.map((publication) => (
                <div key={publication.title} style={styles.listItem}>
                    <h3>
                        {publication.year}. {publication.title}
                    </h3>
                    <p>{publication.authors}</p>
                    <p style={styles.tags}>{publication.venue}</p>
                </div>
            ))}
        </div>
    </FileWindow>
);

export const ContactCard: React.FC<WindowAppProps> = (props) => {
    const linkedin = socialLinks.find((link) => link.name === 'Linkedin')?.href;
    return (
        <FileWindow
            {...props}
            title="Contact Card"
            icon="linkIcon"
            top={90}
            left={240}
            width={560}
            height={380}
            bottomLeftText="Address book"
        >
            <h2 style={styles.title}>{name}</h2>
            <p style={styles.lead}>{headline}</p>
            <div style={styles.infoGrid}>
                <span>Email</span>
                <button
                    className="site-button"
                    onMouseDown={() => openExternal(`mailto:${email}`)}
                >
                    {email}
                </button>
                <span>GitHub</span>
                <button
                    className="site-button"
                    onMouseDown={() => openExternal(`https://github.com/${githubUsername}`)}
                >
                    github.com/{githubUsername}
                </button>
                <span>LinkedIn</span>
                <button
                    className="site-button"
                    onMouseDown={() => linkedin && openExternal(linkedin)}
                    disabled={!linkedin}
                >
                    Open LinkedIn
                </button>
            </div>
        </FileWindow>
    );
};

export const AuthorizedGamesReadme: React.FC<WindowAppProps> = (props) => (
    <FileWindow
        {...props}
        title="GAMES-README.TXT"
        icon="textFileIcon"
        top={110}
        left={260}
        width={620}
        height={430}
        bottomLeftText="Game source notes"
    >
        <h2 style={styles.title}>GAMES-README.TXT</h2>
        <p>
            This desktop uses shareware or open-source game entries rather than
            bundled commercial ROMs or registered game data.
        </p>
        <div style={styles.list}>
            <p>Doom Shareware: Internet Archive embed, DOOM1.WAD package.</p>
            <p>Commander Keen: PCjs-hosted shareware episode.</p>
            <p>Freeciv Web: official open-source browser client.</p>
        </div>
    </FileWindow>
);

export const MusicDisk: React.FC<WindowAppProps> = (props) => {
    const [currentSong, setCurrentSong] = useState('');
    return (
        <FileWindow
            {...props}
            title="Music Disk"
            icon="musicDiskIcon"
            top={52}
            left={190}
            width={760}
            height={520}
            bottomLeftText="Local audio"
        >
            <h2 style={styles.title}>Music Disk</h2>
            <div style={styles.musicList}>
                <MusicPlayer
                    src={houseMaster}
                    title="House Master"
                    subtitle="Recovered local track"
                    currentSong={currentSong}
                    setCurrentSong={setCurrentSong}
                />
                <MusicPlayer
                    src={edgeUnmastered}
                    title="Edge Unmastered"
                    subtitle="Recovered local track"
                    currentSong={currentSong}
                    setCurrentSong={setCurrentSong}
                />
                <MusicPlayer
                    src={dnbDropDrums}
                    title="DNB Drop Drums"
                    subtitle="Recovered local loop"
                    currentSong={currentSong}
                    setCurrentSong={setCurrentSong}
                />
                <MusicPlayer
                    src={breakBeat}
                    title="Break"
                    subtitle="Recovered local loop"
                    currentSong={currentSong}
                    setCurrentSong={setCurrentSong}
                />
            </div>
        </FileWindow>
    );
};

export const PhotosFolder: React.FC<WindowAppProps> = (props) => (
    <FileWindow
        {...props}
        title="Photos"
        icon="photoIcon"
        top={44}
        left={220}
        width={740}
        height={540}
        bottomLeftText="Recovered pictures"
    >
        <h2 style={styles.title}>Photos</h2>
        <div style={styles.photoGrid}>
            {[
                ['currentme.jpg', currentMe],
                ['workingAtComputer.jpg', workingAtComputer],
                ['ee.jpg', eePic],
            ].map(([label, src]) => (
                <figure key={label} style={styles.figure}>
                    <img src={src} alt="" style={styles.photo} />
                    <figcaption>{label}</figcaption>
                </figure>
            ))}
        </div>
    </FileWindow>
);

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
        letterSpacing: 0,
    },
    lead: {
        color: 'rgba(23, 33, 35, 0.78)',
        fontSize: 15,
        lineHeight: 1.45,
    },
    rule: {
        height: 1,
        backgroundColor: 'rgba(23, 33, 35, 0.12)',
        margin: '6px 0',
        flexShrink: 0,
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: '120px minmax(0, 1fr)',
        gap: '12px 18px',
        alignItems: 'center',
        marginTop: 12,
    },
    toolbar: {
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexShrink: 0,
    },
    pdfFrame: {
        flex: 1,
        minHeight: 0,
        border: '1px solid rgba(23, 33, 35, 0.12)',
        borderRadius: 14,
        backgroundColor: '#f5f7fa',
    },
    list: {
        flexDirection: 'column',
        gap: 14,
    },
    listItem: {
        flexDirection: 'column',
        gap: 6,
        padding: 14,
        border: '1px solid rgba(23, 33, 35, 0.1)',
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.76)',
        boxShadow: '0 8px 22px rgba(18, 28, 38, 0.06)',
    },
    tags: {
        color: 'rgba(23, 33, 35, 0.58)',
        fontSize: 13,
    },
    musicList: {
        flexDirection: 'column',
        gap: 10,
    },
    photoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 18,
    },
    figure: {
        flexDirection: 'column',
        gap: 8,
        margin: 0,
        padding: 10,
        border: '1px solid rgba(23, 33, 35, 0.1)',
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.76)',
        boxShadow: '0 8px 22px rgba(18, 28, 38, 0.06)',
    },
    photo: {
        width: '100%',
        aspectRatio: '4 / 3',
        objectFit: 'cover',
        imageRendering: 'auto',
    },
};
