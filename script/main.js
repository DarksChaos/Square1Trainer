import { loadAlgorithmData } from '../data/alg-data.js';
import { startApp } from './app.js';

await startApp();

// Fetch the reference datasets immediately after the initialized UI has painted.
loadAlgorithmData().catch((error) => {
  console.error('Could not load algorithm reference data:', error);
});
