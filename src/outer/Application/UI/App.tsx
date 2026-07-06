import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import LoadingScreen from './components/LoadingScreen';
import HelpPrompt from './components/HelpPrompt';
import InterfaceUI from './components/InterfaceUI';
import eventBus from './EventBus';
import './style.css';

const App = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        eventBus.on('loadingScreenDone', () => {
            setLoading(false);
        });
    }, []);

    return (
        <div id="ui-app">
            {!loading && <HelpPrompt />}
            <LoadingScreen />
        </div>
    );
};

const createUI = () => {
    const container = document.getElementById('ui');
    if (container) createRoot(container).render(<App />);
};

const createVolumeUI = () => {
    const container = document.getElementById('ui-interactive');
    if (container) createRoot(container).render(<InterfaceUI />);
};

export { createUI, createVolumeUI };
