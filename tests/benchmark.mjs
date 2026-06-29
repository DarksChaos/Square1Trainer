/* global process, fetch, WebSocket */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { access, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import net from 'node:net';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function parseArgs(argv) {
  const opts = {
    runs: 5,
    modes: ['pbl', 'obl'],
    cpu: 4,
    port: 0,
    cdpPort: 0,
    timeout: 25_000,
    postReadyWait: 350,
    chrome: process.env.CHROME_BIN || '',
    headless: 'new',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => argv[++i];
    if (arg === '--runs' || arg === '-n') opts.runs = Number(value());
    else if (arg === '--mode') opts.modes = [value()];
    else if (arg === '--modes') opts.modes = value().split(',').map(s => s.trim()).filter(Boolean);
    else if (arg === '--cpu') opts.cpu = Number(value());
    else if (arg === '--port') opts.port = Number(value());
    else if (arg === '--cdp-port') opts.cdpPort = Number(value());
    else if (arg === '--timeout') opts.timeout = Number(value());
    else if (arg === '--post-ready-wait') opts.postReadyWait = Number(value());
    else if (arg === '--chrome') opts.chrome = value();
    else if (arg === '--headless') opts.headless = value();
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  opts.modes = opts.modes.map(m => m.toLowerCase());
  for (const mode of opts.modes) {
    if (!['pbl', 'obl'].includes(mode)) throw new Error(`Invalid mode: ${mode}`);
  }
  if (!Number.isFinite(opts.runs) || opts.runs < 1) throw new Error('--runs must be >= 1');
  if (!Number.isFinite(opts.cpu) || opts.cpu < 1) throw new Error('--cpu must be >= 1');
  return opts;
}

function printHelp() {
  console.log(`Usage: npm run benchmark -- [options]

Benchmarks the built app in ./public using local Chrome.
Run npm run build first if you want fresh public assets.

Options:
  -n, --runs <n>              Samples per mode. Default: 5
      --mode <pbl|obl>        Benchmark one mode only
      --modes <pbl,obl>       Comma-separated modes. Default: pbl,obl
      --cpu <n>               Chrome CPU throttle rate. Default: 4
      --port <n>              Static-server port. Default: random free port
      --cdp-port <n>          Chrome DevTools port. Default: random free port
      --chrome <path>         Chrome/Chromium binary path
      --headless <new|old>    Chrome headless mode. Default: new; falls back to old
      --post-ready-wait <ms>  Wait after UI ready before checking lazy chunks. Default: 350
      --timeout <ms>          Per-sample ready timeout. Default: 25000
`);
}

async function pathExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function findChrome(explicit) {
  const candidates = [
    explicit,
    process.env.CHROME_BIN,
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.includes(path.sep) && await pathExists(candidate)) return candidate;
    const found = await which(candidate);
    if (found) return found;
  }
  throw new Error('Could not find Chrome/Chromium. Pass --chrome /path/to/chrome or set CHROME_BIN.');
}

function which(bin) {
  return new Promise(resolve => {
    const child = spawn(process.platform === 'win32' ? 'where' : 'which', [bin], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    child.stdout.on('data', chunk => { out += chunk; });
    child.on('close', code => resolve(code === 0 ? out.trim().split(/\r?\n/)[0] : ''));
  });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
    server.on('error', reject);
  });
}

async function startStaticServer(port) {
  const actualPort = port || await getFreePort();
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/') pathname = '/index.html';
      const requested = path.normalize(path.join(PUBLIC_DIR, pathname));
      if (!requested.startsWith(PUBLIC_DIR + path.sep)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      let file = requested;
      const info = await stat(file);
      if (info.isDirectory()) file = path.join(file, 'index.html');
      res.writeHead(200, {
        'content-type': MIME[path.extname(file)] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise((resolve, reject) => {
    server.listen(actualPort, '127.0.0.1', resolve);
    server.on('error', reject);
  });

  return {
    port: actualPort,
    close: () => new Promise(resolve => server.close(resolve)),
  };
}

async function waitForCdp(port, chromeProcess, timeout = 8_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (chromeProcess.exitCode !== null) return false;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return true;
    } catch {}
    await sleep(100);
  }
  return false;
}

async function launchChrome(chromeBin, requestedPort, headless) {
  const cdpPort = requestedPort || await getFreePort();
  const profile = await mkdtemp(path.join(tmpdir(), 'unified-trainer-bench-'));

  async function attempt(mode) {
    const args = [
      `--headless=${mode}`,
      `--remote-debugging-address=127.0.0.1`,
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${profile}`,
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-allow-origins=*',
      'about:blank',
    ];
    const child = spawn(chromeBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.stdout.on('data', () => {});

    if (await waitForCdp(cdpPort, child)) return { child, stderr: () => stderr, mode };
    child.kill('SIGTERM');
    await sleep(300);
    return null;
  }

  let chrome = await attempt(headless);
  if (!chrome && headless !== 'old') chrome = await attempt('old');
  if (!chrome) {
    await rm(profile, { recursive: true, force: true });
    throw new Error('Chrome started but DevTools did not become available.');
  }

  return {
    port: cdpPort,
    mode: chrome.mode,
    close: async () => {
      chrome.child.kill('SIGTERM');
      await sleep(250);
      if (chrome.child.exitCode === null) chrome.child.kill('SIGKILL');
      await rm(profile, { recursive: true, force: true });
    },
  };
}

async function cdpClient(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  if (!res.ok) throw new Error(`Could not open Chrome tab: HTTP ${res.status}`);
  const page = await res.json();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  return {
    send,
    close: () => ws.close(),
  };
}

async function evalValue(send, expression) {
  const out = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (out.exceptionDetails) throw new Error(out.exceptionDetails.text || JSON.stringify(out.exceptionDetails));
  return out.result.value;
}

async function waitFor(send, expression, timeout) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evalValue(send, expression)) return;
    await sleep(50);
  }
  throw new Error(`timeout: ${expression}`);
}

async function sample({ baseUrl, cdpPort, mode, index, cpu, timeout, postReadyWait }) {
  const { send, close } = await cdpClient(cdpPort);
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Performance.enable');
    await send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        localStorage.setItem('trainerMode', '${mode}');
        (() => {
          const tick = () => {
            const title = document.querySelector('#mode-title')?.textContent || '';
            if (!window.__benchReady && title.includes('TRAINER')) {
              window.__benchReady = performance.now();
            }
            if (!window.__benchReady) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        })();
      `,
    });

    const url = `${baseUrl}/?bench=${Date.now()}-${mode}-${index}`;
    await send('Page.navigate', { url });
    await waitFor(send, 'window.__benchReady > 0', timeout);
    await sleep(postReadyWait);

    const raw = await evalValue(send, `JSON.stringify((() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime ?? null;
      const resources = performance.getEntriesByType('resource').map(r => r.name.split('/').pop());
      return {
        ready: window.__benchReady,
        domContentLoaded: nav?.domContentLoadedEventEnd ?? null,
        loadEnd: nav?.loadEventEnd ?? null,
        fcp,
        cases: document.querySelectorAll('#results .case').length,
        defaultLists: document.querySelectorAll('#defaultlists .list-item').length,
        userLists: document.querySelectorAll('#userlists .list-item').length,
        loadedSearch: resources.some(x => x.startsWith('search-')),
        loadedAlgReference: resources.some(x => x.startsWith('alg-reference-')),
        loadedTags: resources.some(x => x.startsWith('tags-')),
        loadedPblAlgs: resources.some(x => x.startsWith('pbl-algs-')),
        loadedOblAlgs: resources.some(x => x.startsWith('obl-algs-')),
      };
    })())`);
    return JSON.parse(raw);
  } finally {
    close();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function median(values) {
  const xs = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!xs.length) return NaN;
  return xs[Math.floor(xs.length / 2)];
}

function rounded(value) {
  return Number.isFinite(value) ? Math.round(value) : 'n/a';
}

function formatBool(value) {
  return value ? 'yes' : 'no';
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const chromeBin = await findChrome(opts.chrome);
  const server = await startStaticServer(opts.port);
  const chrome = await launchChrome(chromeBin, opts.cdpPort, opts.headless);
  const baseUrl = `http://127.0.0.1:${server.port}`;
  const failures = [];
  const results = Object.fromEntries(opts.modes.map(mode => [mode, []]));

  console.log(`Serving ${PUBLIC_DIR}`);
  console.log(`Chrome: ${chromeBin}`);
  console.log(`URL: ${baseUrl}`);
  console.log(`Headless: ${chrome.mode}, CPU throttle: ${opts.cpu}x, runs: ${opts.runs}`);
  console.log('');

  try {
    for (const mode of opts.modes) {
      for (let i = 0; i < opts.runs; i++) {
        try {
          const row = await sample({
            baseUrl,
            cdpPort: chrome.port,
            mode,
            index: i,
            cpu: opts.cpu,
            timeout: opts.timeout,
            postReadyWait: opts.postReadyWait,
          });
          results[mode].push(row);
          console.log(
            `${mode.toUpperCase()} #${i + 1}: ` +
            `ready=${rounded(row.ready)}ms ` +
            `FCP=${rounded(row.fcp)}ms ` +
            `DCL=${rounded(row.domContentLoaded)}ms ` +
            `load=${rounded(row.loadEnd)}ms ` +
            `cases=${row.cases} lists=${row.defaultLists}/${row.userLists} ` +
            `search=${formatBool(row.loadedSearch)} ` +
            `algRef=${formatBool(row.loadedAlgReference)} ` +
            `tags=${formatBool(row.loadedTags)} ` +
            `algData=${formatBool(row.loadedPblAlgs)}/${formatBool(row.loadedOblAlgs)}`
          );
        } catch (error) {
          failures.push({ mode, index: i + 1, error });
          console.log(`${mode.toUpperCase()} #${i + 1}: FAILED — ${error.message}`);
        }
      }
    }

    console.log('');
    console.log('Summary');
    console.log('Mode  Samples  Ready(ms)  FCP(ms)  DCL(ms)  Load(ms)  Initial DOM  Upfront lazy UI');
    for (const mode of opts.modes) {
      const rows = results[mode];
      const ready = median(rows.map(row => row.ready));
      const fcp = median(rows.map(row => row.fcp));
      const dcl = median(rows.map(row => row.domContentLoaded));
      const load = median(rows.map(row => row.loadEnd));
      const dom = rows[0] ? `${rows[0].cases} cases, ${rows[0].defaultLists}/${rows[0].userLists} lists` : 'n/a';
      const lazyUi = rows[0]
        ? `search:${formatBool(rows[0].loadedSearch)} algRef:${formatBool(rows[0].loadedAlgReference)} tags:${formatBool(rows[0].loadedTags)}`
        : 'n/a';
      console.log(`${mode.toUpperCase().padEnd(5)} ${String(rows.length).padEnd(7)} ${String(rounded(ready)).padEnd(10)} ${String(rounded(fcp)).padEnd(8)} ${String(rounded(dcl)).padEnd(8)} ${String(rounded(load)).padEnd(9)} ${dom.padEnd(20)} ${lazyUi}`);
    }

    if (failures.length) {
      console.log('');
      console.log(`Failures: ${failures.length}`);
      for (const failure of failures) {
        console.log(`- ${failure.mode.toUpperCase()} #${failure.index}: ${failure.error.message}`);
      }
    }

    if (opts.modes.some(mode => results[mode].length === 0)) process.exitCode = 1;
  } finally {
    await chrome.close();
    await server.close();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
