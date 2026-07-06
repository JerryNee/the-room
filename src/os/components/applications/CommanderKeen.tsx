import React, { useState } from 'react';
import LicensedWebGame from './LicensedWebGame';
import Window from '../os/Window';

export interface CommanderKeenAppProps extends WindowAppProps {}

const CommanderKeenApp: React.FC<CommanderKeenAppProps> = (props) => {
    const [width, setWidth] = useState(980);
    const [height, setHeight] = useState(670);

    return (
        <Window
            top={22}
            left={34}
            width={width}
            height={height}
            windowTitle="Commander Keen"
            windowBarColor="#114aa0"
            windowBarIcon="windowGameIcon"
            bottomLeftText="Shareware edition"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
        >
            <LicensedWebGame
                title="Commander Keen"
                width={width}
                height={Math.max(420, height - 62)}
                frameUrl="https://www.pcjs.org/software/pcx86/game/id/commander_keen/"
                sourceUrl="https://www.pcjs.org/software/pcx86/game/id/commander_keen/"
                sourceLabel="Commander Keen shareware, hosted by PCjs"
                licenseSummary="Shareware episode presented through the external PCjs emulator page."
            />
        </Window>
    );
};

export default CommanderKeenApp;
