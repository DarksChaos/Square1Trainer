import { cp, mkdir, rm } from 'node:fs/promises';
import { build } from 'esbuild';

const outputDirectory = 'public';

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(`${outputDirectory}/css`, { recursive: true });

await Promise.all([
  cp('index.html', `${outputDirectory}/index.html`),
  cp('favicon.ico', `${outputDirectory}/favicon.ico`),
  cp('css/index.css', `${outputDirectory}/css/index.css`),
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
