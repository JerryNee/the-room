import React, { useState } from 'react';
import LicensedWebGame from './LicensedWebGame';
import Window from '../os/Window';

export interface DoomSharewareAppProps extends WindowAppProps {}

const DoomSharewareApp: React.FC<DoomSharewareAppProps> = (props) => {
    const [width, setWidth] = useState(980);
    const [height, setHeight] = useState(670);

    return (
        <Window
            top={10}
            left={10}
            width={width}
            height={height}
            windowTitle="Doom Shareware"
            windowBarColor="#1c1c1c"
            windowBarIcon="windowGameIcon"
            bottomLeftText="Shareware edition"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
        >
            <LicensedWebGame
                title="Doom Shareware"
                width={width}
                height={Math.max(420, height - 62)}
                frameUrl="https://archive.org/embed/doom_20230531?autoplay=1"
                sourceUrl="https://archive.org/details/doom_20230531"
                sourceLabel="DOOM v1.9 shareware, embedded from Internet Archive"
                licenseSummary="Shareware package with DOOM1.WAD, not the registered commercial DOOM.WAD."
            />
        </Window>
    );
};

export default DoomSharewareApp;
