import React, { useEffect, useState } from 'react';
import { Link } from '../general';
import forHire from '../../assets/pictures/forHireGif.gif';
import { useLocation, useNavigate } from 'react-router';

export interface VerticalNavbarProps {}

const VerticalNavbar: React.FC<VerticalNavbarProps> = (props) => {
    const location = useLocation();
    const [projectsExpanded, setProjectsExpanded] = useState(false);
    const [isHome, setIsHome] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const currentSection = location.pathname.includes('/projects/')
        ? ({ 'xr-ai': 'XR & AI', publications: 'Publications', awards: 'Awards' }[
              location.pathname.split('/').pop() || ''
          ] || 'Projects')
        : ({ about: 'About', experience: 'Experience', projects: 'Projects', contact: 'Contact' }[
              location.pathname.split('/').pop() || ''
          ] || 'Portfolio');

    const navigate = useNavigate();
    const goToContact = () => {
        navigate('/contact');
    };

    useEffect(() => {
        setMobileMenuOpen(false);
        if (location.pathname.includes('/projects')) {
            setProjectsExpanded(true);
        } else {
            setProjectsExpanded(false);
        }
        if (location.pathname === '/') {
            setIsHome(true);
        } else {
            setIsHome(false);
        }
        return () => {};
    }, [location.pathname]);

    return !isHome ? (
        <nav className={`showcase-nav${mobileMenuOpen ? ' is-expanded' : ''}`} style={styles.navbar} aria-label="Portfolio sections">
            <button
                type="button"
                className="showcase-nav__toggle"
                aria-label="Portfolio sections"
                aria-controls="portfolio-section-links"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((open) => !open)}
            >
                <span>{currentSection}</span>
                <span>Sections {mobileMenuOpen ? '−' : '+'}</span>
            </button>
            <div className="showcase-nav__header" style={styles.header}>
                <h1 style={styles.headerText}>Jianwei</h1>
                <h1 style={styles.headerText}>Ni</h1>
                <h3 style={styles.headerShowcase}>Portfolio</h3>
            </div>
            <div id="portfolio-section-links" className="showcase-nav__links" style={styles.links}>
                <Link containerStyle={styles.link} to="" text="HOME" />
                <Link containerStyle={styles.link} to="about" text="ABOUT" />
                <Link
                    containerStyle={styles.link}
                    to="experience"
                    text="EXPERIENCE"
                />
                <Link
                    containerStyle={Object.assign(
                        {},
                        styles.link,
                        projectsExpanded && styles.expandedLink
                    )}
                    to="projects"
                    text="PROJECTS"
                />
                {
                    // if current path contains projects
                    projectsExpanded && (
                        <div className="showcase-nav__subnav" style={styles.insetLinks}>
                            <Link
                                containerStyle={styles.insetLink}
                                to="projects/xr-ai"
                                text="XR & AI"
                            />
                            <Link
                                containerStyle={styles.insetLink}
                                to="projects/publications"
                                text="PUBLICATIONS"
                            />
                            <Link
                                containerStyle={styles.insetLink}
                                to="projects/awards"
                                text="AWARDS"
                            />
                        </div>
                    )
                }
                <Link
                    containerStyle={styles.link}
                    to="contact"
                    text="CONTACT"
                />
            </div>
            <div className="showcase-nav__spacer" style={styles.spacer} />
            <div className="showcase-nav__footer" style={styles.forHireContainer} onMouseDown={goToContact}>
                {/* <img src={forHire} style={styles.image} alt="" /> */}
            </div>
        </nav>
    ) : (
        <></>
    );
};

const styles: StyleSheetCSS = {
    navbar: {
        display: 'flex',
        width: 300,
        height: '100%',
        flexDirection: 'column',
        padding: 48,
        boxSizing: 'border-box',
        position: 'fixed',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'column',
        marginBottom: 64,
    },
    headerText: {
        fontSize: 38,
        lineHeight: 1,
    },
    headerShowcase: {
        marginTop: 12,
    },
    logo: {
        width: '100%',
        marginBottom: 8,
    },
    link: {
        marginBottom: 32,
    },
    expandedLink: {
        marginBottom: 16,
    },
    insetLinks: {
        flexDirection: 'column',
        marginLeft: 32,
        marginBottom: 16,
    },
    insetLink: {
        marginBottom: 8,
    },
    links: {
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'center',
    },
    image: {
        width: '80%',
    },
    spacer: {
        flex: 1,
    },
    forHireContainer: {
        cursor: 'pointer',

        width: '100%',
    },
};

export default VerticalNavbar;
