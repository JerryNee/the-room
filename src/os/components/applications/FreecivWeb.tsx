import React, { useState } from 'react';
import LicensedWebGame from './LicensedWebGame';
import Window from '../os/Window';

export interface FreecivWebAppProps extends WindowAppProps {}

const FreecivWebApp: React.FC<FreecivWebAppProps> = (props) => {
    const [width, setWidth] = useState(1040);
    const [height, setHeight] = useState(700);

    return (
        <Window
            top={34}
            left={58}
            width={width}
            height={height}
            windowTitle="Freeciv Web"
            windowBarColor="#20603d"
            windowBarIcon="windowGameIcon"
            bottomLeftText="Open-source web game"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
        >
            <LicensedWebGame
                title="Freeciv Web"
                width={width}
                height={Math.max(420, height - 62)}
                frameUrl="https://freecivweb.com/webclient/?action=new&type=singleplayer"
                sourceUrl="https://github.com/freeciv/freeciv-web"
                sourceLabel="Freeciv-Web official browser client"
                licenseSummary="Open-source Freeciv-Web project; see upstream GPL/AGPL license files."
            />
        </Window>
    );
};

export default FreecivWebApp;
