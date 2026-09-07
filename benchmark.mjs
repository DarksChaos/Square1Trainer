/* global WebSocket, process */

import { createReadStream } from 'node:fs';
import { access, mkdtemp, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

const SEED_PBL = {
  standard: '3,-4 / 1,1 / 3,0 / 2,2 / 0,-3 / 0,-3 / 0,-3 / -2,4 / 3,0 / 2,-1 / -3,0 / 3,1',
  karn: "3-4 M U m DD' D' T' U u U' 31",
  caseName: 'Ul/Ul+',
};

const SEED_OBL = {
  standard: '0,0 / 3,0 / 0,-3 / -3,0 / 0,3 /',
  karn: "U D' U'",
  caseName: '1c/1c',
  memo: '',
};

function parseArgs(argv) {
  const opts = { runs: 7, cpu: 4, mode: 'pbl', timeout: 20_000, baseline: '', out: '' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => argv[++i];
    if (arg === '--runs' || arg === '-n') opts.runs = Number(value());
    else if (arg === '--cpu') opts.cpu = Number(value());
    else if (arg === '--mode') opts.mode = value();
    else if (arg === '--timeout') opts.timeout = Number(value());
    else if (arg === '--baseline') opts.baseline = value();
    else if (arg === '--out') opts.out = value();
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node benchmark.mjs [--runs 7] [--cpu 4] [--mode pbl|obl] [--baseline before.json] [--out after.json]');
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!['pbl', 'obl'].includes(opts.mode)) throw new Error('--mode must be pbl or obl');
  if (!Number.isFinite(opts.runs) || opts.runs < 1) throw new Error('--runs must be >= 1');
  if (!Number.isFinite(opts.cpu) || opts.cpu < 1) throw new Error('--cpu must be >= 1');
  return opts;
}

async function pathExists(file) {
  try { await access(file); return true; }
  catch { return false; }
}

function which(bin) {
  return new Promise(resolve => {
    const child = spawn('which', [bin], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    child.stdout.on('data', chunk => { out += chunk; });
    child.on('close', code => resolve(code === 0 ? out.trim().split(/\r?\n/)[0] : ''));
  });
}

async function findChrome() {
  for (const candidate of [process.env.CHROME_BIN, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].filter(Boolean)) {
    if (candidate.includes(sep) && await pathExists(candidate)) return candidate;
    const found = await which(candidate);
    if (found) return found;
  }
  throw new Error('Chrome/Chromium not found. Set CHROME_BIN=/path/to/chrome.');
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
    server.on('error', reject);
  });
}

async function startServer() {
  const port = await freePort();
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
      const file = normalize(join(PUBLIC_DIR, pathname));
      if (!file.startsWith(PUBLIC_DIR + sep)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      await stat(file);
      res.writeHead(200, {
        'content-type': MIME[extname(file)] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  await new Promise((resolveListen, reject) => {
    server.listen(port, '127.0.0.1', resolveListen);
    server.on('error', reject);
  });
  return { port, close: () => new Promise(resolveClose => server.close(resolveClose)) };
}

async function launchChrome(chromeBin) {
  const port = await freePort();
  const profile = await mkdtemp(join(tmpdir(), 'unified-trainer-root-bench-'));
  const child = spawn(chromeBin, [
    '--headless=new',
    '--remote-debugging-address=127.0.0.1',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-allow-origins=*',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore'] });

  const start = Date.now();
  while (Date.now() - start < 8000) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return { port, close: () => closeChrome(child, profile) };
    } catch {}
    await sleep(100);
  }
  await closeChrome(child, profile);
  throw new Error('Chrome DevTools did not become available.');
}

async function closeChrome(child, profile) {
  child.kill('SIGTERM');
  await sleep(300);
  if (child.exitCode === null) child.kill('SIGKILL');
  for (let i = 0; i < 5; i++) {
    try {
      await rm(profile, { recursive: true, force: true });
      return;
    } catch {
      await sleep(150);
    }
  }
}

async function cdp(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  const page = await res.json();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (!msg.id || !pending.has(msg.id)) return;
    const wait = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) wait.reject(new Error(JSON.stringify(msg.error)));
    else wait.resolve(msg.result);
  };
  await new Promise((resolveOpen, reject) => {
    ws.onopen = resolveOpen;
    ws.onerror = reject;
  });
  const send = (method, params = {}) => new Promise((resolveSend, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve: resolveSend, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
  return { send, close: () => ws.close() };
}

async function evalValue(send, expression) {
  const out = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (out.exceptionDetails) throw new Error(out.exceptionDetails.text || JSON.stringify(out.exceptionDetails));
  return out.result.value;
}

async function waitFor(send, expression, timeout) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evalValue(send, expression)) return;
    await sleep(50);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

async function sample({ baseUrl, cdpPort, mode, cpu, timeout, index }) {
  const { send, close } = await cdp(cdpPort);
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
        localStorage.setItem('startupScramblePBL', ${JSON.stringify(JSON.stringify(SEED_PBL))});
        localStorage.setItem('startupScrambleOBL', ${JSON.stringify(JSON.stringify(SEED_OBL))});
        (() => {
          const tick = () => {
            const title = document.querySelector('#mode-title-text')?.textContent || '';
            const scramble = document.querySelector('#cur-scram')?.textContent || '';
            if (!window.__benchTitle && title.includes('TRAINER')) window.__benchTitle = performance.now();
            if (!window.__benchScramble && scramble && !scramble.includes('show up here')) window.__benchScramble = performance.now();
            if (!window.__benchReady && window.__benchTitle && window.__benchScramble) window.__benchReady = performance.now();
            if (!window.__benchReady) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        })();
      `,
    });
    await send('Page.navigate', { url: `${baseUrl}/?bench=${Date.now()}-${index}` });
    await waitFor(send, 'window.__benchReady > 0', timeout);
    await sleep(250);
    return JSON.parse(await evalValue(send, `JSON.stringify((() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const fcp = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime ?? null;
      return {
        title: window.__benchTitle,
        scramble: window.__benchScramble,
        ready: window.__benchReady,
        fcp,
        domContentLoaded: nav?.domContentLoadedEventEnd ?? null,
        loadEnd: nav?.loadEventEnd ?? null,
        currentScramble: document.querySelector('#cur-scram')?.textContent.trim() || '',
        titleText: document.querySelector('#mode-title-text')?.textContent.trim() || ''
      };
    })())`));
  } finally {
    close();
  }
}

function sleep(ms) {
  return new Promise(resolveSleep => setTimeout(resolveSleep, ms));
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : NaN;
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value) : null;
}

function summarize(rows) {
  return {
    samples: rows.length,
    title: round(median(rows.map(row => row.title))),
    scramble: round(median(rows.map(row => row.scramble))),
    ready: round(median(rows.map(row => row.ready))),
    fcp: round(median(rows.map(row => row.fcp))),
    domContentLoaded: round(median(rows.map(row => row.domContentLoaded))),
    loadEnd: round(median(rows.map(row => row.loadEnd))),
  };
}

function improvement(before, after, key) {
  if (!before?.[key] || !after?.[key]) return 'n/a';
  const delta = before[key] - after[key];
  const pct = Math.round((delta / before[key]) * 100);
  return `${delta}ms (${pct}%)`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const chromeBin = await findChrome();
  const server = await startServer();
  const chrome = await launchChrome(chromeBin);
  const baseUrl = `http://127.0.0.1:${server.port}`;
  const rows = [];

  console.log(`URL: ${baseUrl}`);
  console.log(`Chrome: ${chromeBin}`);
  console.log(`Mode: ${opts.mode.toUpperCase()}, CPU: ${opts.cpu}x, runs: ${opts.runs}`);

  try {
    for (let i = 0; i < opts.runs; i++) {
      const row = await sample({ baseUrl, cdpPort: chrome.port, mode: opts.mode, cpu: opts.cpu, timeout: opts.timeout, index: i });
      rows.push(row);
      console.log(`#${i + 1}: title=${round(row.title)}ms scramble=${round(row.scramble)}ms ready=${round(row.ready)}ms FCP=${round(row.fcp)}ms DCL=${round(row.domContentLoaded)}ms load=${round(row.loadEnd)}ms`);
    }

    const summary = summarize(rows);
    const output = { mode: opts.mode, cpu: opts.cpu, generatedAt: new Date().toISOString(), summary, rows };
    console.log('Summary:', JSON.stringify(summary));

    if (opts.baseline) {
      const baseline = JSON.parse(await import('node:fs/promises').then(fs => fs.readFile(resolve(opts.baseline), 'utf8')));
      console.log('Improvement vs baseline:');
      for (const key of ['title', 'scramble', 'ready', 'fcp', 'domContentLoaded', 'loadEnd']) {
        console.log(`${key}: ${improvement(baseline.summary, summary, key)}`);
      }
    }

    if (opts.out) {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(resolve(opts.out), JSON.stringify(output, null, 2) + '\n');
    }
  } finally {
    await chrome.close();
    await server.close();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
