import React from 'react';
import Window from '../os/Window';
import Wordle from '../wordle/Wordle';

export interface JianwordleAppProps extends WindowAppProps {}

const JianwordleApp: React.FC<JianwordleAppProps> = (props) => {
    return (
        <Window
            top={20}
            left={300}
            width={600}
            height={680}
            windowBarIcon="windowGameIcon"
            windowTitle="Jerryordle"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={'© Jianwei Ni'}
        >
            <div className="site-page">
                <Wordle />
            </div>
        </Window>
    );
};

export default JianwordleApp;
