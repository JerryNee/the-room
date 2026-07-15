import React, { useEffect, useRef, useState } from 'react';
import Window from '../os/Window';
import MusicPlayer from '../general/MusicPlayer';
import './PhotosFolder.css';
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
import lakeYamanakaFirstLight from '../../assets/pictures/lake-yamanaka-first-light-2025.jpg';
import winterParkSnowboard from '../../assets/pictures/winter-park-snowboard-2025.jpg';
import ujiTorii from '../../assets/pictures/uji-torii-2024.jpg';
import ujiMatchaDessert from '../../assets/pictures/uji-matcha-dessert-2024.jpg';
import ujiRedBench from '../../assets/pictures/uji-red-bench-2024.jpg';
import ujiEveningStreet from '../../assets/pictures/uji-evening-street-2024.jpg';
import uiucQuadDay from '../../assets/pictures/uiuc-quad-day-2023.jpg';
import uiucBookstoreOverlook from '../../assets/pictures/uiuc-bookstore-overlook-2023.jpg';
import uiucQuadStage from '../../assets/pictures/uiuc-quad-stage-2023.jpg';
import uiucMammoth from '../../assets/pictures/uiuc-mammoth-2023.jpg';
import uiucUnionI from '../../assets/pictures/uiuc-union-i-2023.jpg';
import uiucLincolnHall from '../../assets/pictures/uiuc-lincoln-hall-2023.jpg';
import uiucIllinoisCap from '../../assets/pictures/uiuc-illinois-cap-2023.jpg';
import uiucIllinoisMerch from '../../assets/pictures/uiuc-illinois-merch-2023.jpg';
import uiucBookstoreBooks from '../../assets/pictures/uiuc-bookstore-books-2023.jpg';
import wwdc26RainbowDucks from '../../assets/pictures/wwdc26-rainbow-ducks.jpg';
import wwdc26BadgeApplePark from '../../assets/pictures/wwdc26-badge-apple-park.jpg';
import wwdc26RingBuildingFlowers from '../../assets/pictures/wwdc26-ring-building-flowers.jpg';
import wwdc26DeveloperSelfies from '../../assets/pictures/wwdc26-developer-selfies.jpg';
import wwdc26KeynoteStage from '../../assets/pictures/wwdc26-keynote-stage.jpg';
import wwdc26MandalorianScreening from '../../assets/pictures/wwdc26-mandalorian-screening.jpg';
import wwdc26ThinkingDifferent from '../../assets/pictures/wwdc26-thinking-different.jpg';
import wwdc26Macintosh1984 from '../../assets/pictures/wwdc26-macintosh-1984.jpg';
import wwdc26IphoneHistoryDisplay from '../../assets/pictures/wwdc26-iphone-history-display.jpg';

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

interface PhotoAsset {
    src: string;
    alt: string;
}

interface PhotoAlbum {
    id: string;
    title: string;
    date: string;
    cover: PhotoAsset;
    photos: PhotoAsset[];
    description: string[];
}

const PHOTO_ALBUMS: PhotoAlbum[] = [
    {
        id: 'good-morning-apple-park',
        title: 'Good Morning, Apple Park',
        date: 'Apple Park · June 7–9, 2026',
        cover: {
            src: wwdc26RainbowDucks,
            alt: 'A rainbow arch and a family of ducks on the lawn at Apple Park',
        },
        photos: [
            {
                src: wwdc26RainbowDucks,
                alt: 'A rainbow arch and a family of ducks on the lawn at Apple Park',
            },
            {
                src: wwdc26BadgeApplePark,
                alt: 'A hand holding a WWDC26 badge in front of the event sign at Apple Park',
            },
            {
                src: wwdc26RingBuildingFlowers,
                alt: 'The curved Apple Park facade rising above a field of white flowers',
            },
            {
                src: wwdc26DeveloperSelfies,
                alt: 'Two selfies with developers wearing WWDC26 badges at Apple Park',
            },
            {
                src: wwdc26KeynoteStage,
                alt: 'Tim Cook onstage beneath the glowing WWDC26 Apple logo',
            },
            {
                src: wwdc26MandalorianScreening,
                alt: 'A special screening of The Mandalorian and Grogu at Steve Jobs Theater',
            },
            {
                src: wwdc26ThinkingDifferent,
                alt: 'A rainbow Apple artwork celebrating 50 years of thinking different',
            },
            {
                src: wwdc26Macintosh1984,
                alt: 'The original 1984 Macintosh on display at Apple Park',
            },
            {
                src: wwdc26IphoneHistoryDisplay,
                alt: 'A rainbow Apple sculpture beside a display of historic iPhones',
            },
        ],
        description: [
            'Got invited to WWDC26.',
            'Watching the keynote from the lawn at Apple Park felt even more dreamlike than I’d imagined.',
            'The sunlight was perfect. So was the breeze.',
            'The moment the keynote began, the whole crowd fell quiet, almost instinctively.',
            'My first time sitting in the third row at an Apple keynote. My first time hearing Tim Cook say those words in person: “Good morning.”',
            'Maybe the last, too.',
            'Over those few days, I met developers from all over the world. Some were building indie apps. Some were working on accessibility. Others had been coming back for years.',
            'I also got to spend a long time talking with several Apple engineers. They listened closely to everyone’s product gripes and shared some of the thinking behind their design decisions. You could tell how deeply they cared about the user experience.',
            'Later, I went to Steve Jobs Theater for a special screening of The Mandalorian and Grogu. Steve Jobs Theater lived up to the legend. The movie… not so much.',
            'But sitting there—applauding and cheering with a room full of people who love making things—was more than enough. ',
            'In a way, it also felt like watching an era quietly fade.',
            'The era of keynote surprises, product idealists, and “one more thing” seems farther away every year.',
            'But at least we were there to see it shine at its brightest.',
        ],
    },
    {
        id: 'powder-day-at-winter-park',
        title: 'Powder Day at Winter Park',
        date: 'Winter Park, Colorado · March 15, 2025',
        cover: {
            src: winterParkSnowboard,
            alt: 'A snowboarder in black gear resting in the snow at Winter Park',
        },
        photos: [
            {
                src: winterParkSnowboard,
                alt: 'A snowboarder in black gear resting in the snow at Winter Park',
            },
        ],
        description: ['🏂'],
    },
    {
        id: 'first-light-of-2025',
        title: 'First Light of 2025',
        date: 'Lake Yamanaka · January 1, 2025',
        cover: {
            src: lakeYamanakaFirstLight,
            alt: 'Swans on Lake Yamanaka with Mount Fuji glowing pink at sunrise',
        },
        photos: [
            {
                src: lakeYamanakaFirstLight,
                alt: 'Swans on Lake Yamanaka with Mount Fuji glowing pink at sunrise',
            },
        ],
        description: [
            'The first light of 2025 painted Mount Fuji pink. 🗻️',
            'Happy New Year! 🎆',
        ],
    },
    {
        id: 'uji-in-matcha-green',
        title: 'Uji in Matcha Green',
        date: 'Uji, Japan · August 2, 2024',
        cover: {
            src: ujiMatchaDessert,
            alt: 'Matcha desserts in shades of green on a wooden tray',
        },
        photos: [
            {
                src: ujiTorii,
                alt: 'A vermilion torii gate framed by deep green foliage in Uji',
            },
            {
                src: ujiMatchaDessert,
                alt: 'Matcha desserts in shades of green on a wooden tray',
            },
            {
                src: ujiRedBench,
                alt: 'A red bench beneath a leafy archway in Uji',
            },
            {
                src: ujiEveningStreet,
                alt: 'Uji storefronts and overhead wires in warm evening light',
            },
        ],
        description: ['Uji in matcha green.'],
    },
    {
        id: 'a-new-chapter-at-uiuc',
        title: 'A New Chapter at UIUC',
        date: 'Champaign–Urbana, Illinois · August 21, 2023',
        cover: {
            src: uiucUnionI,
            alt: 'A giant orange and blue Block I with balloons outside the Illini Union',
        },
        photos: [
            {
                src: uiucQuadDay,
                alt: 'Students gathering beneath orange tents during UIUC Quad Day',
            },
            {
                src: uiucBookstoreOverlook,
                alt: 'The busy UIUC bookstore seen through a circular opening above',
            },
            {
                src: uiucQuadStage,
                alt: 'Students watching a performance on the UIUC Main Quad',
            },
            {
                src: uiucMammoth,
                alt: 'A mammoth statue beside a red-brick UIUC building during Quad Day',
            },
            {
                src: uiucUnionI,
                alt: 'A giant orange and blue Block I with balloons outside the Illini Union',
            },
            {
                src: uiucLincolnHall,
                alt: 'The Lincoln Hall sign in front of its red-brick campus building',
            },
            {
                src: uiucIllinoisCap,
                alt: 'A navy Illinois cap embroidered with the orange Block I',
            },
            {
                src: uiucIllinoisMerch,
                alt: 'Orange Illinois merchandise displayed inside the campus bookstore',
            },
            {
                src: uiucBookstoreBooks,
                alt: 'Books displayed on a shelf inside the UIUC bookstore',
            },
        ],
        description: [
            'UIUC 🍾️',
            'Classes have officially begun.',
            'A new chapter of my life starts here.',
            'I hope life will be kind to me.',
        ],
    },
];

const formatItemCount = (count: number, singular: string) =>
    `${count} ${singular}${count === 1 ? '' : 's'}`;

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

export const PhotosFolder: React.FC<WindowAppProps> = (props) => {
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
        null
    );
    const albumButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const lastOpenedAlbumIdRef = useRef<string | null>(null);
    const backButtonRef = useRef<HTMLButtonElement>(null);
    const activePhotoButtonRef = useRef<HTMLButtonElement>(null);
    const detailSectionRef = useRef<HTMLElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const viewerCloseButtonRef = useRef<HTMLButtonElement>(null);
    const restoreAlbumFocusRef = useRef(false);
    const restorePhotoFocusRef = useRef(false);
    const ignoreOpeningDoubleClickUntilRef = useRef(Date.now() + 450);
    const selectedAlbum =
        PHOTO_ALBUMS.find((album) => album.id === selectedAlbumId) || null;
    const selectedPhoto =
        selectedAlbum && selectedPhotoIndex !== null
            ? selectedAlbum.photos[selectedPhotoIndex] || null
            : null;
    const isViewerOpen = Boolean(selectedPhoto);

    useEffect(() => {
        if (selectedAlbum) {
            backButtonRef.current?.focus({ preventScroll: true });
            return;
        }

        if (restoreAlbumFocusRef.current) {
            const lastOpenedAlbumId = lastOpenedAlbumIdRef.current;
            if (lastOpenedAlbumId) {
                albumButtonRefs.current
                    .get(lastOpenedAlbumId)
                    ?.focus({ preventScroll: true });
            }
            restoreAlbumFocusRef.current = false;
        }
    }, [selectedAlbum]);

    useEffect(() => {
        const detailSection = detailSectionRef.current;
        if (!detailSection) return;

        if (isViewerOpen) {
            detailSection.setAttribute('inert', '');
        } else {
            detailSection.removeAttribute('inert');
        }
    }, [isViewerOpen]);

    useEffect(() => {
        if (isViewerOpen) {
            viewerCloseButtonRef.current?.focus({ preventScroll: true });
            return;
        }

        if (restorePhotoFocusRef.current) {
            activePhotoButtonRef.current?.focus({ preventScroll: true });
            restorePhotoFocusRef.current = false;
        }
    }, [isViewerOpen]);

    const openAlbum = (
        albumId: string,
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        const isOpeningDoubleClick =
            event.detail > 1 ||
            (event.detail > 0 &&
                Date.now() < ignoreOpeningDoubleClickUntilRef.current);
        if (isOpeningDoubleClick) return;
        lastOpenedAlbumIdRef.current = albumId;
        setSelectedPhotoIndex(null);
        setSelectedAlbumId(albumId);
    };

    const closeAlbum = () => {
        restoreAlbumFocusRef.current = true;
        restorePhotoFocusRef.current = false;
        setSelectedPhotoIndex(null);
        setSelectedAlbumId(null);
    };

    const openPhoto = (
        photoIndex: number,
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        activePhotoButtonRef.current = event.currentTarget;
        setSelectedPhotoIndex(photoIndex);
    };

    const closePhoto = () => {
        restorePhotoFocusRef.current = true;
        setSelectedPhotoIndex(null);
    };

    const navigatePhoto = (direction: -1 | 1) => {
        if (!selectedAlbum || selectedPhotoIndex === null) return;

        setSelectedPhotoIndex((currentIndex) => {
            if (currentIndex === null) return currentIndex;
            const nextIndex = currentIndex + direction;
            return Math.min(
                selectedAlbum.photos.length - 1,
                Math.max(0, nextIndex)
            );
        });
    };

    const handleAlbumKeyDown = (
        albumId: string,
        event: React.KeyboardEvent<HTMLButtonElement>
    ) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        lastOpenedAlbumIdRef.current = albumId;
        setSelectedPhotoIndex(null);
        setSelectedAlbumId(albumId);
    };

    const handlePhotoKeyDown = (
        photoIndex: number,
        event: React.KeyboardEvent<HTMLButtonElement>
    ) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        activePhotoButtonRef.current = event.currentTarget;
        setSelectedPhotoIndex(photoIndex);
    };

    const handleBackKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>
    ) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        closeAlbum();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (selectedPhoto) {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                closePhoto();
                return;
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                event.stopPropagation();
                navigatePhoto(-1);
                return;
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                event.stopPropagation();
                navigatePhoto(1);
            }
            return;
        }

        if (event.key === 'Escape' && selectedAlbum) {
            event.preventDefault();
            event.stopPropagation();
            closeAlbum();
        }
    };

    const handleViewerTabKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Tab') return;

        const controls = Array.from(
            viewerRef.current?.querySelectorAll<HTMLButtonElement>(
                'button:not(:disabled)'
            ) || []
        );
        if (!controls.length) return;

        event.preventDefault();
        event.stopPropagation();
        const activeControlIndex = controls.indexOf(
            document.activeElement as HTMLButtonElement
        );
        const direction = event.shiftKey ? -1 : 1;
        const nextControlIndex =
            activeControlIndex < 0
                ? 0
                : (activeControlIndex + direction + controls.length) %
                  controls.length;
        controls[nextControlIndex].focus({ preventScroll: true });
    };

    const handleViewerActionKeyDown = (
        action: () => void,
        event: React.KeyboardEvent<HTMLButtonElement>
    ) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (event.nativeEvent.isTrusted) return;
        event.preventDefault();
        event.stopPropagation();
        action();
    };

    const handleViewerWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handlePaneWheel = (event: React.WheelEvent<HTMLElement>) => {
        if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;

        const pane = event.currentTarget;
        const paneStyle = window.getComputedStyle(pane);
        const ownsVerticalScroll =
            /(auto|scroll|overlay)/.test(paneStyle.overflowY) &&
            pane.scrollHeight > pane.clientHeight;
        if (!ownsVerticalScroll) return;

        event.preventDefault();
        event.stopPropagation();

        const deltaMultiplier =
            event.deltaMode === WheelEvent.DOM_DELTA_LINE
                ? 18
                : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
                  ? pane.clientHeight
                  : 1;
        const maximumScroll = Math.max(
            0,
            pane.scrollHeight - pane.clientHeight
        );
        pane.scrollTop = Math.min(
            maximumScroll,
            Math.max(0, pane.scrollTop + event.deltaY * deltaMultiplier)
        );
    };

    const galleryLayout = !selectedAlbum
        ? 'single'
        : selectedAlbum.photos.length === 1
          ? 'single'
          : selectedAlbum.photos.length <= 4
            ? 'compact'
            : 'many';

    return (
        <FileWindow
            {...props}
            title="Photos"
            icon="photoIcon"
            top={44}
            left={180}
            width={860}
            height={600}
            bottomLeftText={`${formatItemCount(
                PHOTO_ALBUMS.length,
                'album'
            )} · ${formatItemCount(
                PHOTO_ALBUMS.reduce(
                    (total, album) => total + album.photos.length,
                    0
                ),
                'photo'
            )}`}
        >
            <div
                className="photos-app"
                onKeyDown={handleKeyDown}
                aria-label="Personal photo albums"
            >
                {selectedAlbum ? (
                    <section
                        ref={detailSectionRef}
                        className="photos-view photos-detail"
                        aria-labelledby="photos-album-title"
                        aria-hidden={isViewerOpen ? true : undefined}
                    >
                        <div className="photos-detail-toolbar">
                            <button
                                ref={backButtonRef}
                                type="button"
                                className="photos-back-button"
                                onClick={closeAlbum}
                                onKeyDown={handleBackKeyDown}
                            >
                                <span aria-hidden="true">‹</span>
                                Albums
                            </button>
                            <span className="photos-toolbar-count">
                                {formatItemCount(
                                    selectedAlbum.photos.length,
                                    'photo'
                                )}
                            </span>
                        </div>

                        <div
                            className="photos-detail-body"
                            onWheel={handlePaneWheel}
                        >
                            <div
                                className={`photos-detail-gallery photos-detail-gallery--${galleryLayout}`}
                                aria-label={`${selectedAlbum.title} photos`}
                                role="list"
                                onWheel={handlePaneWheel}
                            >
                                {selectedAlbum.photos.map((photo, photoIndex) => (
                                    <figure
                                        className="photos-detail-photo"
                                        key={`${selectedAlbum.id}-${photo.src}`}
                                        role="listitem"
                                    >
                                        <button
                                            type="button"
                                            className="photos-detail-photo-button"
                                            aria-label={`View photo ${
                                                photoIndex + 1
                                            } of ${
                                                selectedAlbum.photos.length
                                            }: ${photo.alt}`}
                                            onClick={(event) =>
                                                openPhoto(photoIndex, event)
                                            }
                                            onKeyDown={(event) =>
                                                handlePhotoKeyDown(
                                                    photoIndex,
                                                    event
                                                )
                                            }
                                        >
                                            <img
                                                src={photo.src}
                                                alt={photo.alt}
                                                loading={
                                                    photoIndex === 0
                                                        ? 'eager'
                                                        : 'lazy'
                                                }
                                                decoding="async"
                                            />
                                        </button>
                                    </figure>
                                ))}
                            </div>

                            <article
                                className="photos-story"
                                onWheel={handlePaneWheel}
                            >
                                <div className="photos-story-heading">
                                    <h2 id="photos-album-title">
                                        {selectedAlbum.title}
                                    </h2>
                                    <p className="photos-story-meta">
                                        {selectedAlbum.date}
                                    </p>
                                </div>
                                <div className="photos-story-copy">
                                    {selectedAlbum.description.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                            </article>
                        </div>
                    </section>
                ) : (
                    <section
                        className="photos-view photos-library"
                        aria-labelledby="photos-library-title"
                    >
                        <header className="photos-library-header">
                            <h2 id="photos-library-title">Photos</h2>
                            <p>
                                {PHOTO_ALBUMS.length}{' '}
                                {PHOTO_ALBUMS.length === 1 ? 'album' : 'albums'}
                            </p>
                        </header>

                        <div className="photos-album-list">
                            {PHOTO_ALBUMS.map((album) => (
                                <button
                                    ref={(element) => {
                                        if (element) {
                                            albumButtonRefs.current.set(
                                                album.id,
                                                element
                                            );
                                        } else {
                                            albumButtonRefs.current.delete(album.id);
                                        }
                                    }}
                                    className="photos-album-button"
                                    key={album.id}
                                    type="button"
                                    onClick={(event) => openAlbum(album.id, event)}
                                    onKeyDown={(event) =>
                                        handleAlbumKeyDown(album.id, event)
                                    }
                                    aria-label={`Open ${album.title}, ${formatItemCount(
                                        album.photos.length,
                                        'photo'
                                    )}`}
                                >
                                    <span className="photos-album-cover">
                                        <img src={album.cover.src} alt={album.cover.alt} />
                                    </span>
                                    <span className="photos-album-title">
                                        {album.title}
                                    </span>
                                    <span className="photos-album-meta">
                                        {album.date} ·{' '}
                                        {formatItemCount(album.photos.length, 'photo')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {selectedAlbum &&
                selectedPhoto &&
                selectedPhotoIndex !== null ? (
                    <div
                        ref={viewerRef}
                        className="photos-lightbox"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="photos-lightbox-title"
                        onKeyDown={handleViewerTabKey}
                        onWheel={handleViewerWheel}
                    >
                        <div className="photos-lightbox-toolbar">
                            <div className="photos-lightbox-meta">
                                <strong id="photos-lightbox-title">
                                    {selectedAlbum.title}
                                </strong>
                                <span aria-live="polite" aria-atomic="true">
                                    {selectedPhotoIndex + 1} of{' '}
                                    {selectedAlbum.photos.length}
                                </span>
                            </div>
                            <button
                                ref={viewerCloseButtonRef}
                                type="button"
                                className="photos-lightbox-close"
                                aria-label="Close photo viewer"
                                onClick={closePhoto}
                                onKeyDown={(event) =>
                                    handleViewerActionKeyDown(closePhoto, event)
                                }
                            >
                                <span aria-hidden="true">×</span>
                            </button>
                        </div>

                        <div className="photos-lightbox-stage">
                            <button
                                type="button"
                                className="photos-lightbox-nav photos-lightbox-nav--previous"
                                aria-label="Previous photo"
                                disabled={selectedPhotoIndex === 0}
                                onClick={() => navigatePhoto(-1)}
                                onKeyDown={(event) =>
                                    handleViewerActionKeyDown(
                                        () => navigatePhoto(-1),
                                        event
                                    )
                                }
                            >
                                <span aria-hidden="true">‹</span>
                            </button>

                            <figure className="photos-lightbox-photo">
                                <img
                                    src={selectedPhoto.src}
                                    alt={selectedPhoto.alt}
                                />
                            </figure>

                            <button
                                type="button"
                                className="photos-lightbox-nav photos-lightbox-nav--next"
                                aria-label="Next photo"
                                disabled={
                                    selectedPhotoIndex ===
                                    selectedAlbum.photos.length - 1
                                }
                                onClick={() => navigatePhoto(1)}
                                onKeyDown={(event) =>
                                    handleViewerActionKeyDown(
                                        () => navigatePhoto(1),
                                        event
                                    )
                                }
                            >
                                <span aria-hidden="true">›</span>
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </FileWindow>
    );
};

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
};
