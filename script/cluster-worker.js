// cluster-worker.js
// Renamed from lump-worker.js. Credentials and table name are no longer
// hardcoded — they are passed in via the 'start' message so that both the
// PBL trainer and the OBL trainer (different Supabase projects) can reuse
// the same worker file.
//
// Expected start message shape:
//   { type: 'start', supabaseUrl: '...', supabaseKey: '...', table: 'pbl_clusters' }

const SYNC_INTERVAL_MS = 10 * 60 * 1000;

let _supabaseUrl  = null;
let _supabaseKey  = null;
let _table        = null;

async function fetchAllClusters() {
    self.postMessage({ type: 'busy' });
    try {
        const res = await fetch(
            `${_supabaseUrl}/rest/v1/${_table}?select=cluster_index,data`,
            { headers: { "apikey": _supabaseKey, "Authorization": `Bearer ${_supabaseKey}` } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        const incoming = {};
        rows.forEach(row => { incoming[row.cluster_index] = row.data; });
        self.postMessage({ type: 'data', payload: incoming });
    } catch (err) {
        self.postMessage({ type: 'error', message: err.message });
    }
}

self.onmessage = function(e) {
    if (e.data.type === 'start') {
        _supabaseUrl = e.data.supabaseUrl;
        _supabaseKey = e.data.supabaseKey;
        _table       = e.data.table;
        fetchAllClusters();
        setInterval(fetchAllClusters, SYNC_INTERVAL_MS);
    }
};
