import React from 'react';
import { publications } from '../../../../config/infoConfig';

export interface MusicProjectsProps {}

const MusicProjects: React.FC<MusicProjectsProps> = () => {
    return (
        <div className="site-page-content">
            <h1>Publications</h1>
            <h3>Publications</h3>
            <br />
            <p>
                Selected academic conference presentations and peer-reviewed
                papers.
            </p>
            <br />
            {publications.map((publication) => (
                <div className="text-block" key={publication.title}>
                    <h2>{publication.title}</h2>
                    <br />
                    <p>
                        <b>{publication.authors}</b> ({publication.year})
                    </p>
                    <br />
                    <p>
                        <i>{publication.venue}</i>
                    </p>
                </div>
            ))}
        </div>
    );
};

export default MusicProjects;
