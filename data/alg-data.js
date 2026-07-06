// Stable objects let consumers import the datasets before their chunks arrive.
// The large payloads are merged in after the first responsive paint.
export const oblClusters = {};
export const pblClusters = {};

export async function loadAlgorithmData() {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const [{ oblClusters: obl }, { pblClusters: pbl }] = await Promise.all([
    import('./obl-algs.js'),
    import('./pbl-algs.js'),
  ]);

  Object.assign(oblClusters, obl);
  Object.assign(pblClusters, pbl);
}
