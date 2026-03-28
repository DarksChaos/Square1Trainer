const SUPABASE_URL = "https://bubvugdjwryhcawrwhxa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1YnZ1Z2Rqd3J5aGNhd3J3aHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjUzOTEsImV4cCI6MjA4ODcwMTM5MX0.KgsJCFeBDmIRkyNbOA0VpPc7biTflZo2Pbuh7SPfiH8";
const SYNC_INTERVAL_MS = 10 * 60 * 1000;

async function fetchAllLumps() {
    self.postMessage({ type: 'busy' });
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/pbl_lumps?select=lump_index,data`,
            { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        const incoming = {};
        rows.forEach(row => { incoming[row.lump_index] = row.data; });
        self.postMessage({ type: 'data', payload: incoming });
    } catch (err) {
        self.postMessage({ type: 'error', message: err.message });
    }
}

self.onmessage = function(e) {
    if (e.data.type === 'start') {
        fetchAllLumps();
        setInterval(fetchAllLumps, SYNC_INTERVAL_MS);
    }
};
