// sw.js — Service Worker
// Strategy:
//   • Online  → network-first: always serve the newest version, update cache in
//               the background. Cache is only a fallback for when you're offline.
//   • Offline → serve from cache if we have it.
//   • Updates → the new SW activates automatically once every tab of this site
//               is closed (no forced skipWaiting), so open tabs are never yanked
//               onto a half-loaded new version mid-session.

const VERSION = '1.0.0';
const CACHE = 'oblpbl-' + VERSION;

const CACHE_FILE_TYPES = [
    'html', 'htm', 'css', 'js', 'mjs', 'json',
    'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico',
    'woff', 'woff2', 'ttf', 'webmanifest',
];

const BLACKLIST = [];
const WHITELIST = [];

function normalize(path) {
    return path.replace(/^\/+/, '').replace(/\/+$/, '');
}

function pathMatches(path, entry) {
    const p = normalize(path);
    const e = normalize(entry);
    return p === e || p.startsWith(e + '/');
}

function extensionOf(path) {
    const name = path.split('/').pop() || '';
    const dot = name.lastIndexOf('.');
    return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

function shouldCache(pathname) {
    if (BLACKLIST.some(entry => pathMatches(pathname, entry))) return false;
    if (WHITELIST.some(entry => pathMatches(pathname, entry))) return true;
    return CACHE_FILE_TYPES.includes(extensionOf(pathname));
}

const PRECACHE = [
    "./css/index.css",
    "./favicon.ico",
    "./icon-192x192.png",
    "./icon-512x512.png",
    "./index.html",
    "./manifest.webmanifest",
    "./script/chunks/alg-reference-NMJPADMK.js",
    "./script/chunks/chunk-3SCHNFVJ.js",
    "./script/chunks/chunk-6BUIKJVM.js",
    "./script/chunks/chunk-EOAU36MI.js",
    "./script/chunks/chunk-GKQD7QPT.js",
    "./script/chunks/chunk-KHASRG47.js",
    "./script/chunks/chunk-LBPS6IYY.js",
    "./script/chunks/chunk-MWKQOSVS.js",
    "./script/chunks/chunk-WEW2UMKO.js",
    "./script/chunks/obl-algs-LMM4EYRV.js",
    "./script/chunks/obl-core-GULN6L55.js",
    "./script/chunks/pbl-algs-EDTAABXY.js",
    "./script/chunks/pbl-core-WTE5J3TH.js",
    "./script/chunks/search-JBLXH23U.js",
    "./script/chunks/tags-FNVULYWA.js",
    "./script/main.js",
    "./script/worker.js",
    "./service-worker.js"
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;

    if (sameOrigin && !shouldCache(url.pathname)) return;

    event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
    const cache = await caches.open(CACHE);
    try {
        const response = await fetch(request);
        if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await cache.match(request);
        return cached ?? new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}
