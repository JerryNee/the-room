import './style.css';
import SpatialPortfolio from './v2/SpatialPortfolio';

const spatialPortfolio = new SpatialPortfolio();

(window as unknown as { __spatialPortfolio?: SpatialPortfolio }).__spatialPortfolio =
    spatialPortfolio;
