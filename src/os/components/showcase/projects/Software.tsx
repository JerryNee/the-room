import React from 'react';
import { projects } from '../../../../config/projects';
import ResumeDownload from '../ResumeDownload';

export interface SoftwareProjectsProps {}

const SoftwareProjects: React.FC<SoftwareProjectsProps> = () => {
    return (
        <div className="site-page-content">
            <h1>XR & AI</h1>
            <h3>Projects</h3>
            <br />
            <p>
                Selected projects focused on mixed reality, medical training,
                immersive systems, and applied AI.
            </p>
            <br />
            <ResumeDownload />
            <br />
            {projects.map((project, index) => (
                <div className="text-block" key={project.name}>
                    <h2>
                        {index + 1}. {project.name}
                    </h2>
                    <br />
                    <p>{project.description}</p>
                    <br />
                    <p>
                        <b>Stack: </b>
                        {project.tags.join(', ')}
                    </p>
                    {project.link.href && (
                        <>
                            <br />
                            <a
                                rel="noreferrer"
                                target="_blank"
                                href={project.link.href}
                            >
                                <p>
                                    <b>[Link]</b> - View project media
                                </p>
                            </a>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};

export default SoftwareProjects;
