// ═══════════════════════════════════════════════════════════════════════════
//  PBL HEATMAPS
//  Two heatmaps (evenPLL × evenPLL, oddPLL × oddPLL) shown in the search
//  extension when the query is empty (PBL trainer only). Each cell is a case
//  (row = top PLL, col = bottom PLL). A tag picker on top selects which tagged
//  matt solution groups count; per case we take the shortest tagged slicecount,
//  and colour the cell by (slicecount − optimal) × weight × caseCount.
//
//  Requires pblGetOptimal(caseName) (a local lookup, added separately).
// ═══════════════════════════════════════════════════════════════════════════

const hmEl = document.getElementById('search-heatmaps');

let hmCaseCluster   = null;  // caseName → cluster title (built once)
let hmSelectedTags  = null;  // Set of selected tag ids; null = "all tags"
let hmLastSlices    = {};    // caseName → { slice, overview } from last compute
let hmTipEl         = null;
let hmTapCase       = null;  // touch: the case whose tooltip is currently shown

// ── Data ─────────────────────────────────────────────────────────────────────

function hmBuildCaseCluster() {
    if (hmCaseCluster) return hmCaseCluster;
    hmCaseCluster = {};
    for (const [title, data] of Object.entries(pblClusters))
        for (const c of data['case-list'] || []) hmCaseCluster[c] = title;
    return hmCaseCluster;
}

function hmSelectedTagIds() {
    return hmSelectedTags || new Set(getTags().map(t => t.id)); // default: all
}

// Family of a single PLL ("Gal" → "G", "pJ" → "pJ", "-" → "-").
function hmPllFamily(p) {
    return SquanLib.PLLFamily.includes(p) ? p : (p.match(/[A-Z]/g)?.join('') || p);
}

// Group consecutive same-family PLLs (the even/odd orders keep families adjacent).
function hmFamilyGroups(plls) {
    const groups = [];
    for (const p of plls) {
        const fam = hmPllFamily(p);
        const last = groups[groups.length - 1];
        if (last && last.fam === fam) last.members.push(p);
        else groups.push({ fam, members: [p] });
    }
    return groups;
}

// Canonicalize a case-name's solved-face shorthand: "Gal:" → "Gal/-", ":Gal" →
// "-/Gal" (matt data uses ":" but case-lists/heatmap cells use "/-" and "-/").
function hmCanonCase(c) {
    if (c.startsWith(':')) c = '-/' + c.slice(1);
    else if (c.endsWith(':')) c = c.slice(0, -1) + '/-';
    return c.replace(/:/g, '-');
}

// caseName → { slice, overview }: the shortest slicecount among the matt
// solution groups whose tag is in the current selection (a group is included if
// it carries any selected tag; its slicecount applies to all its case-names).
function hmComputeCaseSlices() {
    const selected    = hmSelectedTagIds();
    const assignments = loadTagAssignments();
    const included    = new Set();
    for (const tid of selected) (assignments[tid] || []).forEach(r => included.add(r));

    const result = {};
    for (const title of Object.keys(pblClusters)) {
        const groups = effectiveMattGroups(title);
        const order  = mattUnitOrder(title);
        for (let i = 0; i < groups.length; i++) {
            if (!included.has(unitRef(title, 'matt', order[i] ?? 'sg' + i))) continue;
            const slice = groups[i]['solution-slicecount'];
            if (slice == null) continue;
            const overview = groups[i]['solution-overview'] || '';
            const names = new Set();
            for (const ab of groups[i]['alg-blocks'] || [])
                for (const c of ab.cases || []) if (c['case-name']) names.add(hmCanonCase(c['case-name']));
            for (const cn of names)
                if (!result[cn] || slice < result[cn].slice) result[cn] = { slice, overview };
        }
    }
    return result;
}

// Final cell value, or null (→ gray) when there's no tagged slicecount/optimal.
function hmCellValue(caseName, row, col, slices) {
    const s = slices[caseName];
    if (!s) return null;
    const optimal = pblGetOptimal(caseName);
    if (optimal == null) return null;
    return (s.slice - optimal) * squan.getWeight(caseName) * squan.getPBLCaseCount([row, col]);
}

// ── Colour (rank-based: ~even cells per band, green→yellow→orange→red) ───────

function hmGradient(t) {
    const stops = [[0, 200, 0], [230, 230, 0], [255, 140, 0], [228, 30, 30]];
    const seg = Math.min(2, Math.floor(t * 3));
    const f   = t * 3 - seg;
    const [a, b] = [stops[seg], stops[seg + 1]];
    const c = a.map((x, i) => Math.round(x + (b[i] - x) * f));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function hmColorFn(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    return v => {
        if (n <= 1) return hmGradient(0);
        let lo = 0, hi = n;            // rank = count strictly less than v
        while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < v) lo = m + 1; else hi = m; }
        return hmGradient(Math.min(1, lo / (n - 1)));
    };
}

// ── Rendering ────────────────────────────────────────────────────────────────

function hmGridHtml(plls, slices) {
    const vals = {};
    const list = [];
    for (const r of plls) for (const c of plls) {
        const v = hmCellValue(r + '/' + c, r, c, slices);
        vals[r + '/' + c] = v;
        if (v != null) list.push(v);
    }
    const color = hmColorFn(list);
    const fams = hmFamilyGroups(plls);

    // minmax(0,1fr) lets the columns shrink to fit; same-family PLLs share one
    // header that spans their columns/rows, so cells can be narrow.
    let html = `<div class="hm-table" style="grid-template-columns:auto repeat(${plls.length}, minmax(0,1fr))">`;
    html += `<div class="hm-corner"></div>`;
    for (const g of fams)
        html += `<div class="hm-head hm-colhead" style="grid-column:span ${g.members.length}">${escapeHtml(g.fam)}</div>`;
    for (const g of fams) {
        g.members.forEach((r, idx) => {
            if (idx === 0)
                html += `<div class="hm-head hm-rowhead" style="grid-row:span ${g.members.length}">${escapeHtml(g.fam)}</div>`;
            for (const c of plls) {
                const cn = r + '/' + c, v = vals[cn];
                html += v == null
                    ? `<div class="hm-cell hm-gray" data-case="${escapeHtml(cn)}"></div>`
                    : `<div class="hm-cell" data-case="${escapeHtml(cn)}" style="background:${color(v)}"></div>`;
            }
        });
    }
    return html + '</div>';
}

function hmTagBarHtml() {
    return `<button class="hm-tag-btn" data-tip="Filter by tags">${UNIT_TAG_SVG}<span>Tags</span></button>`;
}

// Fills only the grids (used on first render and on tag-filter changes).
function hmRenderGrids() {
    hmBuildCaseCluster();
    hmLastSlices = hmComputeCaseSlices();
    const grids = hmEl.querySelector('.hm-grids');
    grids.innerHTML =
        `<div class="hm-grid">${hmGridHtml(SquanLib.evenPLL, hmLastSlices)}</div>` +
        `<div class="hm-grid">${hmGridHtml(SquanLib.oddPLL, hmLastSlices)}</div>`;
}

function renderHeatmaps() {
    if (trainerMode !== 'pbl') { hmEl.style.display = 'none'; return; }
    hmEl.innerHTML =
        `<div class="hm-tagbar">${hmTagBarHtml()}</div>` +
        `<div class="hm-grids"></div>` +
        `<div class="hm-tip" style="display:none"></div>`;
    hmTipEl = hmEl.querySelector('.hm-tip');
    hmTapCase = null;
    hmRenderGrids();
}

// ── Tooltip ──────────────────────────────────────────────────────────────────

function hmShowTip(cell, cn) {
    if (!hmTipEl) return;
    const cluster = hmCaseCluster[cn];
    const s = hmLastSlices[cn];
    hmTipEl.innerHTML =
        `<div class="hm-tip-case">${escapeHtml(cn)}</div>` +
        `<div class="hm-tip-cluster">${cluster ? escapeHtml(cluster) : '<span class="hm-tip-dim">not a PBL case</span>'}</div>` +
        (s ? `<div class="hm-tip-sol">${escapeHtml(s.overview)} (${s.slice})</div>` : '');
    hmTipEl.style.display = 'block';
    const cr = cell.getBoundingClientRect();
    const er = hmEl.getBoundingClientRect();
    hmTipEl.style.left = (cr.left - er.left + cell.offsetWidth / 2) + 'px';
    hmTipEl.style.top  = (cr.top  - er.top) + 'px';
}

function hmHideTip() { if (hmTipEl) hmTipEl.style.display = 'none'; }

function hmNavigate(cn) {
    const title = hmCaseCluster[cn];
    if (title) showClusterInSearch(title);
}

// ── Cell interaction (pointer events; pan vs tap decided on pointerup) ────────

let _hmDown = null;

hmEl.addEventListener('pointerdown', e => {
    const cell = e.target.closest('.hm-cell');
    if (cell) _hmDown = { x: e.clientX, y: e.clientY, cell, type: e.pointerType };
});

hmEl.addEventListener('pointerup', e => {
    const down = _hmDown; _hmDown = null;
    const cell = e.target.closest('.hm-cell');
    if (!down || !cell || cell !== down.cell) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return; // pan, not a tap
    const cn = cell.dataset.case;
    if (down.type === 'mouse') { hmNavigate(cn); return; }
    // touch: first tap shows the tooltip, a second tap on the same cell navigates
    if (hmTapCase === cn) { hmHideTip(); hmTapCase = null; hmNavigate(cn); }
    else { hmShowTip(cell, cn); hmTapCase = cn; }
});

hmEl.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const cell = e.target.closest('.hm-cell');
    if (cell) hmShowTip(cell, cell.dataset.case);
});
hmEl.addEventListener('pointerout', e => {
    if (e.pointerType !== 'mouse') return;
    if (e.target.closest('.hm-cell')) hmHideTip();
});

// ── Tag-filter popover ───────────────────────────────────────────────────────

let _hmFilterPop = null;

function hmFilterInner() {
    const tags = getTags();
    if (!tags.length) return `<div class="unit-tag-empty">No tags yet — create them in the Tags menu.</div>`;
    const sel = hmSelectedTagIds();
    return tags.map(t =>
        `<button class="unit-tag-opt" data-tag="${escapeHtml(t.id)}">
            <span class="unit-tag-dot" style="--tag-color:${escapeHtml(t.color)}"></span>
            <span class="unit-tag-name">${escapeHtml(t.name)}</span>
            <span class="unit-tag-box${sel.has(t.id) ? ' checked' : ''}"></span>
        </button>`).join('');
}

function hmOpenFilter(btn) {
    hmCloseFilter();
    const pop = document.createElement('div');
    pop.className = 'unit-tag-popover';
    pop.innerHTML = hmFilterInner();
    document.body.appendChild(pop);
    _hmFilterPop = pop;
    _hmPositionFilter(btn);

    pop.addEventListener('click', e => {
        const opt = e.target.closest('.unit-tag-opt');
        if (!opt) return;
        if (!hmSelectedTags) hmSelectedTags = new Set(getTags().map(t => t.id));
        const id = opt.dataset.tag;
        if (hmSelectedTags.has(id)) hmSelectedTags.delete(id); else hmSelectedTags.add(id);
        hmRenderGrids();
        pop.innerHTML = hmFilterInner();
        const newBtn = hmEl.querySelector('.hm-tag-btn');
        if (newBtn) _hmPositionFilter(newBtn);
    });
    setTimeout(() => document.addEventListener('pointerdown', _hmFilterOutside), 0);
}

function _hmPositionFilter(btn) {
    if (!_hmFilterPop) return;
    const r = btn.getBoundingClientRect();
    _hmFilterPop.style.top  = (r.bottom + 6) + 'px';
    _hmFilterPop.style.left = r.left + 'px';
    const pr = _hmFilterPop.getBoundingClientRect();
    if (pr.right  > window.innerWidth  - 8) _hmFilterPop.style.left = Math.max(8, window.innerWidth  - 8 - pr.width) + 'px';
    if (pr.bottom > window.innerHeight - 8) _hmFilterPop.style.top  = Math.max(8, r.top - pr.height - 6) + 'px';
}

function _hmFilterOutside(e) {
    if (!e.target.closest('.unit-tag-popover') && !e.target.closest('.hm-tag-btn')) hmCloseFilter();
}

function hmCloseFilter() {
    document.removeEventListener('pointerdown', _hmFilterOutside);
    if (_hmFilterPop) { _hmFilterPop.remove(); _hmFilterPop = null; }
}

hmEl.addEventListener('click', e => {
    const btn = e.target.closest('.hm-tag-btn');
    if (btn) hmOpenFilter(btn);
});
