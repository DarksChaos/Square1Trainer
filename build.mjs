import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { build } from 'esbuild';

const outputDirectory = 'public';

const CACHE_FILE_TYPES = ['html', 'htm', 'css', 'js', 'mjs', 'json', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'woff', 'woff2', 'ttf', 'webmanifest'];

function extensionOf(name) { const dot = name.lastIndexOf('.'); return dot === -1 ? '' : name.slice(dot + 1).toLowerCase(); }

async function buildServiceWorker() {
  const files = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) { await walk(fullPath); continue; }
      if (extensionOf(entry.name) && CACHE_FILE_TYPES.includes(extensionOf(entry.name))) {
        files.push('./' + relative(outputDirectory, fullPath).split('\\').join('/'));
      }
    }
  }
  await walk(outputDirectory);
  files.sort();

  const swPath = join(outputDirectory, 'service-worker.js');
  let sw = await readFile(swPath, 'utf8');
  sw = sw.replace('/*__PRECACHE__*/[]', JSON.stringify(files, null, 4));
  await writeFile(swPath, sw);
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(`${outputDirectory}/css`, { recursive: true });

await Promise.all([
  cp('index.html', `${outputDirectory}/index.html`),
  cp('favicon.ico', `${outputDirectory}/favicon.ico`),
  cp('icon-192x192.png', `${outputDirectory}/icon-192x192.png`),
  cp('icon-512x512.png', `${outputDirectory}/icon-512x512.png`),
  cp('manifest.webmanifest', `${outputDirectory}/manifest.webmanifest`),
  cp('css/index.css', `${outputDirectory}/css/index.css`),
  cp('service-worker.js', `${outputDirectory}/service-worker.js`),
]);

await build({
  entryPoints: {
    main: 'script/main.js',
    worker: 'script/worker.js',
  },
  outdir: outputDirectory,
  entryNames: 'script/[name]',
  chunkNames: 'script/chunks/[name]-[hash]',
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  treeShaking: true,
  legalComments: 'none',
});

await buildServiceWorker();
