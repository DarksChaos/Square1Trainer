import { startApp } from './app.js';

await startApp();

// Fetch the reference datasets immediately after the initialized UI has painted.
requestAnimationFrame(() => requestAnimationFrame(() => {
  const load = () => {
    import('../data/alg-data.js')
      .then(({ loadAlgorithmData }) => loadAlgorithmData())
      .catch((error) => {
        console.error('Could not load algorithm reference data:', error);
      });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 1500 });
  else setTimeout(load, 250);
}));
