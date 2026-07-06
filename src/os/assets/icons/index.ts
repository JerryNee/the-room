import React from 'react';

import windowResize from './windowResize.png';
import maximize from './maximize.png';
import minimize from './minimize.png';
import computerBig from './computerBig.png';
import computerSmall from './computerSmall.png';
import myComputer from './myComputer.png';
import showcaseIcon from './showcaseIcon.png';
import folderIcon from './folderIcon.svg';
import textFileIcon from './textFileIcon.svg';
import pdfIcon from './pdfIcon.svg';
import linkIcon from './linkIcon.svg';
import photoIcon from './photoIcon.svg';
import musicDiskIcon from './musicDiskIcon.svg';
import doomSharewareIcon from './doomSharewareIcon.svg';
import keenIcon from './keenIcon.svg';
import freecivIcon from './freecivIcon.svg';
import jianwordleIcon from './jianwordleIcon.png';
import credits from './credits.png';
import volumeOn from './volumeOn.png';
import volumeOff from './volumeOff.png';
import windowGameIcon from './windowGameIcon.png';
import windowExplorerIcon from './windowExplorerIcon.png';
import windowsStartIcon from './windowsStartIcon.png';
import close from './close.png';

const icons = {
    windowResize: windowResize,
    maximize: maximize,
    minimize: minimize,
    computerBig: computerBig,
    computerSmall: computerSmall,
    myComputer: myComputer,
    showcaseIcon: showcaseIcon,
    folderIcon: folderIcon,
    textFileIcon: textFileIcon,
    pdfIcon: pdfIcon,
    linkIcon: linkIcon,
    photoIcon: photoIcon,
    musicDiskIcon: musicDiskIcon,
    doomSharewareIcon: doomSharewareIcon,
    keenIcon: keenIcon,
    freecivIcon: freecivIcon,
    volumeOn: volumeOn,
    volumeOff: volumeOff,
    credits: credits,
    jianwordleIcon: jianwordleIcon,
    close: close,
    windowGameIcon: windowGameIcon,
    windowExplorerIcon: windowExplorerIcon,
    windowsStartIcon: windowsStartIcon,
};

export type IconName = keyof typeof icons;

const getIconByName = (
    iconName: IconName
    // @ts-ignore
): React.FC<React.SVGAttributes<SVGElement>> => icons[iconName];

export default getIconByName;
