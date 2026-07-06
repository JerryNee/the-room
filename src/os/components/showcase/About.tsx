import React from 'react';
import avatar from '../../../images/avatar.jpg';
import ResumeDownload from './ResumeDownload';
import { introduction } from '../../../config/infoConfig';

export interface AboutProps {}

const About: React.FC<AboutProps> = () => {
    return (
        <div className="site-page-content">
            <h1>About</h1>
            <h3>Jianwei “Jerry” Ni</h3>
            <br />
            <div className="text-block">
                <p>
                    My name is <b>Jianwei Ni</b> — that's the name on my
                    passport. Most people know me as <b>Jerry</b>, which is my
                    preferred name, so you'll see both used across this site.
                    They're the same person: Jianwei is Jerry.
                </p>
                <br />
                <p>{introduction}</p>
                <br />
                <p>
                    I study Computer Science & Statistics at UIUC and focus on
                    building systems where emerging technology becomes useful
                    for real people. My recent work explores mixed reality,
                    medical training, computer vision, and generative AI.
                </p>
                <br />
                <p>
                    I enjoy making ideas tangible: from Vision Pro medical
                    training prototypes to MR companions, immersive education
                    tools, and practical software workflows.
                </p>
                <br />
                <p>
                    <b>Email: </b>
                    <a href="mailto:nijianweijerry@gmail.com">
                        nijianweijerry@gmail.com
                    </a>
                </p>
            </div>
            <div className="captioned-image">
                <img src={avatar} alt="Jianwei Ni" style={styles.avatar} />
                <p>
                    <sub>
                        <b>Figure 1:</b> Jianwei Ni
                    </sub>
                </p>
            </div>
            <ResumeDownload />
        </div>
    );
};

const styles: StyleSheetCSS = {
    avatar: {
        maxWidth: 420,
        width: '100%',
        border: '2px solid black',
        boxSizing: 'border-box',
    },
};

export default About;
