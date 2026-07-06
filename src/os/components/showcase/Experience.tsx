import React from 'react';
import { careerList } from '../../../config/career';
import { educationList } from '../../../config/education';
import { awards } from '../../../config/projects';
import ResumeDownload from './ResumeDownload';

export interface ExperienceProps {}

const Experience: React.FC<ExperienceProps> = () => {
    return (
        <div className="site-page-content">
            <h1>Experience</h1>
            <h3>Work, research, and education</h3>
            <br />
            <section className="text-block">
                <h2>Career</h2>
                <br />
                {careerList.map((item) => (
                    <div style={styles.item} key={`${item.company}-${item.start}`}>
                        <h3>{item.title}</h3>
                        <p>
                            <b>{item.company}</b>
                        </p>
                        <p>
                            {item.start} - {item.end}
                        </p>
                    </div>
                ))}
            </section>
            <section className="text-block">
                <h2>Education</h2>
                <br />
                {educationList.map((item) => (
                    <div style={styles.item} key={item.school}>
                        <h3>{item.school}</h3>
                        <p>{item.major}</p>
                        <p>
                            {item.start} - {item.end}
                        </p>
                    </div>
                ))}
            </section>
            <section className="text-block">
                <h2>Awards & Honors</h2>
                <br />
                <ul>
                    {awards.map((award) => (
                        <li key={award.name}>
                            <p>
                                <b>{award.name}</b> ({award.date}) -{' '}
                                {award.location}
                            </p>
                            <p>{award.description}</p>
                        </li>
                    ))}
                </ul>
            </section>
            <ResumeDownload altText="Need a copy of my resume?" />
        </div>
    );
};

const styles: StyleSheetCSS = {
    item: {
        flexDirection: 'column',
        marginBottom: 24,
    },
};

export default Experience;
