import React from 'react';
import { awards } from '../../../../config/projects';

export interface ArtProjectsProps {}

const ArtProjects: React.FC<ArtProjectsProps> = () => {
    return (
        <div className="site-page-content">
            <h1>Awards</h1>
            <h3>Honors</h3>
            <br />
            <p>
                Recognition for academic work, technical growth, and
                competitive programming.
            </p>
            <br />
            {awards.map((award) => (
                <div className="text-block" key={award.name}>
                    <h2>{award.name}</h2>
                    <br />
                    <p>
                        <b>{award.date}</b> - {award.location}
                    </p>
                    <br />
                    <p>{award.description}</p>
                </div>
            ))}
        </div>
    );
};

export default ArtProjects;
