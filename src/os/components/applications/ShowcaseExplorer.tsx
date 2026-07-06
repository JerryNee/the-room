import React from 'react';
import {
    BrowserRouter as Router,
    Navigate,
    Routes,
    Route,
} from 'react-router-dom';
import Home from '../showcase/Home';
import About from '../showcase/About';
import Window from '../os/Window';
import Experience from '../showcase/Experience';
import Projects from '../showcase/Projects';
import Contact from '../showcase/Contact';
import SoftwareProjects from '../showcase/projects/Software';
import MusicProjects from '../showcase/projects/Music';
import ArtProjects from '../showcase/projects/Art';
import VerticalNavbar from '../showcase/VerticalNavbar';
import useInitialWindowSize from '../../hooks/useInitialWindowSize';

export interface ShowcaseExplorerProps extends WindowAppProps {}

const ShowcaseExplorer: React.FC<ShowcaseExplorerProps> = (props) => {
    const { initWidth, initHeight } = useInitialWindowSize({ margin: 100 });

    return (
        <Window
            top={24}
            left={56}
            width={initWidth}
            height={initHeight}
            windowTitle="Jianwei Ni - Portfolio"
            windowBarIcon="windowExplorerIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={'© Jianwei Ni'}
        >
            <Router basename="/os">
                <div className="site-page">
                    <VerticalNavbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/experience" element={<Experience />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route
                            path="/projects/xr-ai"
                            element={<SoftwareProjects />}
                        />
                        <Route
                            path="/projects/publications"
                            element={<MusicProjects />}
                        />
                        <Route
                            path="/projects/awards"
                            element={<ArtProjects />}
                        />
                        <Route
                            path="/projects/software"
                            element={<Navigate to="/projects/xr-ai" replace />}
                        />
                        <Route
                            path="/projects/music"
                            element={
                                <Navigate to="/projects/publications" replace />
                            }
                        />
                        <Route
                            path="/projects/art"
                            element={
                                <Navigate to="/projects/awards" replace />
                            }
                        />
                    </Routes>
                </div>
            </Router>
        </Window>
    );
};

export default ShowcaseExplorer;
