import { oblClusters, pblClusters } from '../data/alg-data.js';
import { OBLtranslation, possibleOBL } from '../data/obl-data.js';
import { pblDefaultLists } from '../data/pbl-data.js';
import { OBL_SOURCE_META, PBL_SOURCE_META, UNIT_TAG_SVG, algEditBegin, algEditCancel, algEditDirty, algEditRedo, algEditRender, algEditSave, algEditUndo, effectiveCluster, effectiveMattGroups, loadTagAssignments, mattUnitOrder, oblFindCluster, oblFormatSheet, pblFindCluster, pblFormatSheet, renderClusterInto, saveTagAssignments, tagCaseBases, tagUnitState, tagUnitsByCluster, taggedClusterTitles, toggleUnitTag, unitRef, unitTagsInner } from './alg-reference.js';
import { abandonTransition, appConfirm, closeOverlayForTransition, dismissTopOverlay, escapeHtml, pushOverlay, randInt, showError, showInfo, showSuccess, trainerMode, usingTimer } from './app.js';
import { OBLname, getNonSpeList, getSpe, getSpeList, oblAddUserLists, oblDefaultLists, oblDisplayClusterTitle, oblDisplayName, oblNamingMode, oblSaveUserLists, oblUserLists, oblUsingSpe } from './obl-core.js';
import { pblAddUserLists, pblGetOptimal, pblPossible, pblSaveUserLists, pblUseBarflip, pblUserLists } from './pbl-core.js';
import { SquanLib, squan } from './squan.js';
import { getTags, openTagModal, renderTagMenu } from './tags.js';

// ═══════════════════════════════════════════════════════════════════════════
//  SEARCH OVERLAY
//  The spotlight search and everything shown inside its extension, in sections:
//    1. PBL heatmaps (this section)
//    2. The spotlight search core (overlay, results, cluster view, help)
//    3. Tag view + list view detail panels
//  Cluster alg references are rendered via renderClusterInto() in alg-reference.js.
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
//  PBL HEATMAPS
//  Two heatmaps (evenPLL × evenPLL, oddPLL × oddPLL) shown in the search
//  extension when the query is empty (PBL trainer only). Each cell is a case
//  (row = top PLL, col = bottom PLL). A tag picker on top selects which tagged
//  matt solution groups count; per case we take the shortest tagged slicecount,
//  and colour the cell by (slicecount − optimal) × weight × caseCount.
//
//  Uses pblGetOptimal(caseName) from pbl-core.js.
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
    // Single source of truth: getPBLFamily decides how PLLs group into families,
    // so the Gal/Gar→"Ga", Gol/Gor→"Go" split is driven entirely from there.
    return squan.getPBLFamily(p + '/' + p).split('/')[0];
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
    return (s.slice - optimal) * squan.getPBLWeight(caseName) * squan.getPBLCaseCount([row, col]);
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

    // Every PLL is one case, so every body column gets exactly one fraction. The
    // header text must adapt to the data column rather than making one case look
    // almost twice as complete as another.
    const cols = plls.map(() => 'minmax(0,1fr)').join(' ');
    // First PLL of each family — body cells in these columns/rows draw the family
    // boundary line so the header's divisions continue through the grid (with no
    // internal per-cell borders inside a family block).
    const famFirst = new Set(fams.map(g => g.members[0]));

    const rows = `auto repeat(${plls.length},minmax(0,1fr))`;
    let html = `<div class="hm-table" style="grid-template-columns:auto ${cols};grid-template-rows:${rows}">`;
    html += `<div class="hm-corner"></div>`;
    for (const g of fams) {
        // The two three-letter, single-case parity headers are shortened to the
        // same two-character footprint as pJ/pN. Row labels stay unabridged.
        const colLabel = ({ Adj: 'Ad', Opp: 'Op' })[g.fam] ?? g.fam;
        html += `<div class="hm-head hm-colhead" style="grid-column:span ${g.members.length}">${escapeHtml(colLabel)}</div>`;
    }
    for (const g of fams) {
        g.members.forEach((r, idx) => {
            if (idx === 0)
                html += `<div class="hm-head hm-rowhead" style="grid-row:span ${g.members.length}">${escapeHtml(g.fam)}</div>`;
            for (const c of plls) {
                const cn = r + '/' + c, v = vals[cn];
                let cls = 'hm-cell';
                if (famFirst.has(c)) cls += ' hm-fam-left';
                if (idx === 0)       cls += ' hm-fam-top';
                if (v == null)       cls += ' hm-gray';
                html += `<div class="${cls}" data-case="${escapeHtml(cn)}"${v == null ? '' : ` style="background:${color(v)}"`}></div>`;
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

// ── Cell interaction ─────────────────────────────────────────────────────────
// Mouse:  press does nothing; release navigates to whatever cell is under the
//         cursor (so you can press, drag to refine, and release on the target).
//         Tooltips follow the cursor the whole time (via hover below).
// Touch:  a normal tap still shows the tooltip, and a second tap navigates; a
//         plain drag pans the page. But a long-press engages a drag mode where
//         the tooltip tracks the finger and releasing navigates to the cell
//         under it.

const HM_LONGPRESS_MS  = 420;
const HM_PAN_THRESHOLD = 10;
let _hmTouch     = null;   // { startX, startY, timer, panned }
let _hmTouchDrag = false;  // long-press drag active

function hmCellAtPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    return el ? el.closest('.hm-cell') : null;
}

hmEl.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;     // mouse: act on release, not press
    const cell = e.target.closest('.hm-cell');
    if (!cell) return;
    _hmTouchDrag = false;
    _hmTouch = {
        startX: e.clientX, startY: e.clientY, panned: false,
        timer: setTimeout(() => {
            _hmTouchDrag = true;               // held still long enough → drag mode
            const c = hmCellAtPoint(_hmTouch.startX, _hmTouch.startY) || cell;
            if (c) { hmShowTip(c, c.dataset.case); hmTapCase = c.dataset.case; }
        }, HM_LONGPRESS_MS),
    };
});

hmEl.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' || !_hmTouch) return;
    if (_hmTouchDrag) {
        const c = hmCellAtPoint(e.clientX, e.clientY);   // tooltip follows the finger
        if (c) { hmShowTip(c, c.dataset.case); hmTapCase = c.dataset.case; }
    } else if (Math.hypot(e.clientX - _hmTouch.startX, e.clientY - _hmTouch.startY) > HM_PAN_THRESHOLD) {
        clearTimeout(_hmTouch.timer);          // moved before long-press → it's a pan
        _hmTouch.panned = true;
    }
});

// Block the page scroll only while a long-press drag is active (so plain pans work).
hmEl.addEventListener('touchmove', e => { if (_hmTouchDrag) e.preventDefault(); }, { passive: false });

hmEl.addEventListener('pointerup', e => {
    if (e.pointerType === 'mouse') {
        const cell = e.target.closest('.hm-cell');
        if (cell) hmNavigate(cell.dataset.case);
        return;
    }
    const t = _hmTouch; _hmTouch = null;
    if (!t) return;
    clearTimeout(t.timer);
    if (_hmTouchDrag) {                          // long-press drag → navigate under release
        _hmTouchDrag = false;
        const c = hmCellAtPoint(e.clientX, e.clientY);
        hmHideTip(); hmTapCase = null;
        if (c) hmNavigate(c.dataset.case);
        return;
    }
    if (t.panned) return;                        // it was a pan, not a tap
    const cell = e.target.closest('.hm-cell');
    if (!cell) return;
    const cn = cell.dataset.case;                // tap: 1st shows tooltip, 2nd navigates
    if (hmTapCase === cn) { hmHideTip(); hmTapCase = null; hmNavigate(cn); }
    else { hmShowTip(cell, cn); hmTapCase = cn; }
});

hmEl.addEventListener('pointercancel', () => {
    if (_hmTouch) clearTimeout(_hmTouch.timer);
    _hmTouch = null; _hmTouchDrag = false;
});

// A long-press fires the browser context menu, which would hijack the drag-and-go
// gesture. Suppress it only while the tooltip is active (drag mode or a shown tap
// tooltip) — normal right-clicks elsewhere are untouched.
hmEl.addEventListener('contextmenu', e => {
    if (_hmTouchDrag || hmTapCase) e.preventDefault();
});

// Mouse hover shows the tooltip and keeps it updated, even while dragging.
hmEl.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const cell = e.target.closest('.hm-cell');
    if (cell) hmShowTip(cell, cell.dataset.case);
});
hmEl.addEventListener('pointerout', e => {
    if (e.pointerType !== 'mouse') return;
    if (e.target.closest('.hm-cell')) hmHideTip();
});

// A tap anywhere that isn't a heatmap cell dismisses the (touch) tooltip.
document.addEventListener('pointerdown', e => {
    if (hmTapCase && !e.target.closest('.hm-cell')) { hmHideTip(); hmTapCase = null; }
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


// ═══════════════════════════════════════════════════════════════════════════
//  SPOTLIGHT SEARCH (overlay, results, cluster view, help)
// ═══════════════════════════════════════════════════════════════════════════

// ─── SPOTLIGHT SEARCH ─────────────────────────────────────────────────────────
// Ctrl/Cmd+Space (or the navbar search button) opens a centered search bar.
// It searches the active trainer's clusters by title, case name, and OBL legacy
// name; the extension below the bar lists matches. ↑/↓ move the selection and
// Enter opens the selected cluster's alg reference inline in the extension.
// The "?" button opens a per-trainer help modal.

const searchOverlayEl    = document.getElementById("search-overlay");
const searchPanelEl      = document.querySelector("#search-overlay .search-panel");
const searchInputEl      = document.getElementById("search-input");
const searchExtensionEl  = document.getElementById("search-extension");
const searchResultsEl    = document.getElementById("search-results");
const searchClusterEl    = document.getElementById("search-cluster");
export const searchClusterContentEl = document.getElementById("search-cluster-content");
const searchTagViewEl    = document.getElementById("search-tagview");
const searchListViewEl   = document.getElementById("search-listview");
const searchHelpBtnEl    = document.getElementById("search-help-btn");
const searchHelpModalEl  = document.getElementById("search-help-modal");

export let isSearchOpen      = false;
let searchMatches     = [];     // array of cluster titles currently shown
let searchActiveIx    = -1;     // index into searchMatches of the highlighted row
let searchInClusterView = false; // true while the extension shows an alg reference
let searchClusterTitle  = null;  // cluster currently shown in the extension
export let searchEditMode      = false; // true while the alg reference is being edited
let searchClusterWidth  = '';    // cached panel width (px) for the open cluster
let searchClusterReturn = { kind: 'trainer' };

// Search index: per cluster, a title plus every "alias" the user might type to
// reach it — case names, and (for OBL) legacy verbose names. Built once per mode.
const _searchIndexCache = { pbl: null, obl: null, oblNamingMode: null };

function buildSearchIndex(mode) {
    const out = [];

    if (mode === 'pbl') {
        for (const [title, data] of Object.entries(pblClusters)) {
            const aliases = new Set([title]);
            (data['case-list'] || []).forEach(c => {
                aliases.add(c);
                // also searchable via the ":" solved-face shorthand ("Al/-" ≡ "Al:")
                if (c.endsWith('/-'))      aliases.add(c.slice(0, -2) + ':');
                else if (c.startsWith('-/')) aliases.add(':' + c.slice(2));
            });
            out.push({ title, displayTitle: title, aliases: [...aliases] });
        }
        return out;
    }

    // OBL: keep navigation titles internal, but expose only the selected naming
    // dialect in the search labels/aliases.
    const rev = {}; // short code → legacy name
    for (const [legacy, short] of Object.entries(SquanLib.NAMING)) rev[short] = legacy;

    const byTitle = {};
    for (const [title, data] of Object.entries(oblClusters)) {
        const set = new Set([oblDisplayClusterTitle(title)]);
        (data['case-list'] || []).forEach(code => {
            set.add(oblDisplayClusterTitle(code));
            const [a, b] = code.split('/');
            if (rev[a] && rev[b]) set.add(oblDisplayName(rev[a] + '/' + rev[b]));
        });
        byTitle[title] = { displayTitle: oblDisplayClusterTitle(title), aliases: set };
    }

    for (const nonSpe of Object.keys(OBLtranslation)) {
        const title = oblFindCluster(nonSpe);
        if (!title || !byTitle[title]) continue;
        byTitle[title].aliases.add(oblDisplayName(nonSpe));
        for (const spe of OBLtranslation[nonSpe]) {
            const [a, b] = spe.split('/');
            byTitle[title].aliases.add(oblDisplayName(spe));
            byTitle[title].aliases.add(oblDisplayName(b + '/' + a)); // mirrored specific name
        }
    }

    for (const [title, entry] of Object.entries(byTitle))
        out.push({ title, displayTitle: entry.displayTitle, aliases: [...entry.aliases] });
    return out;
}

function getSearchIndex() {
    if (trainerMode === 'obl' && _searchIndexCache.oblNamingMode !== oblNamingMode) {
        _searchIndexCache.obl = null;
        _searchIndexCache.oblNamingMode = oblNamingMode;
    }
    if (!_searchIndexCache[trainerMode]) _searchIndexCache[trainerMode] = buildSearchIndex(trainerMode);
    return _searchIndexCache[trainerMode];
}


// Opens the alg reference for a cluster title in the search bar (the only place
// alg references are shown — there is no separate modal). Used by scramble clicks
// and search-result selection.
export function openAlgReference(title) {
    if (!title) return;
    const returnTo = isSearchOpen ? currentSearchReturnTarget() : { kind: 'trainer' };
    if (!isSearchOpen) openSearch();
    showClusterInSearch(title, returnTo);
}

function highlightMatch(title, query) {
    const safe = escapeHtml(title);
    if (!query) return safe;
    const i = title.toLowerCase().indexOf(query.toLowerCase());
    if (i < 0) return safe;
    return escapeHtml(title.slice(0, i)) +
        '<mark>' + escapeHtml(title.slice(i, i + query.length)) + '</mark>' +
        escapeHtml(title.slice(i + query.length));
}

function renderSearchResults() {
    // Any change to the query returns the extension to plain-search mode.
    closeUnitTagPopover();
    _stvCloseSelector();
    searchInClusterView = false;
    searchClusterTitle = null;
    searchClusterEl.style.display = "none";
    searchTagViewEl.style.display = "none";
    searchListViewEl.style.display = "none";
    searchResultsEl.style.display = "";
    searchPanelEl.style.width = ""; // undo any cluster-view widening

    const query = searchInputEl.value.trim();
    if (!query) {
        searchMatches  = [];
        searchActiveIx = -1;
        // Empty query in PBL shows the heatmaps; OBL shows nothing.
        if (trainerMode === 'pbl') {
            searchExtensionEl.style.display = "flex";
            searchResultsEl.style.display = "none";
            hmEl.style.display = "flex";
            searchPanelEl.style.width = "min(1440px, 96vw)";
            renderHeatmaps();
        } else {
            searchExtensionEl.style.display = "none";
        }
        return;
    }
    hmEl.style.display = "none";
    hmCloseFilter();

    const q = query.toLowerCase();

    // Special action entries (keyword commands) rank above cluster matches.
    const actionHits = Object.entries(SEARCH_ACTIONS)
        .filter(([keyword, a]) => keyword.includes(q) && (a.trainer === 'both' || a.trainer === trainerMode))
        .map(([keyword, a]) => ({ kind: 'action', action: keyword, title: a.label, desc: a.desc }));

    // Title matches rank above matches found only through a case/legacy alias.
    const titleHits = [];
    const aliasHits = [];
    for (const entry of getSearchIndex()) {
        const label = entry.displayTitle || entry.title;
        if (label.toLowerCase().includes(q)) {
            titleHits.push({ kind: 'cluster', title: entry.title, displayTitle: label, via: null });
        } else {
            const via = entry.aliases.find(a => a !== label && a.toLowerCase().includes(q));
            if (via) aliasHits.push({ kind: 'cluster', title: entry.title, displayTitle: label, via });
        }
    }

    // Tags and lists are searchable by name, shown with their own result style.
    const tagHits = getTags()
        .filter(t => t.name.toLowerCase().includes(q))
        .map(t => ({ kind: 'tag', tagId: t.id, name: t.name, color: t.color, count: tagCaseBases(t.id).length }));
    const listHits = searchableListNames()
        .filter(name => name.toLowerCase().includes(q))
        .map(name => ({ kind: 'list', name, count: listCaseCount(name) }));

    searchMatches  = actionHits.concat(titleHits, tagHits, listHits, aliasHits);
    searchActiveIx = searchMatches.length ? 0 : -1;

    searchExtensionEl.style.display = "flex";
    if (!searchMatches.length) {
        searchResultsEl.innerHTML = '<div class="search-empty">No matching clusters</div>';
        return;
    }

    searchResultsEl.innerHTML = searchMatches.map((m, i) => {
        const act  = m.kind === 'action';
        const cls  = `search-result${i === 0 ? ' active' : ''}${act ? ' search-action' : ''}`;
        if (act) {
            return `<div class="${cls}" data-ix="${i}">${escapeHtml(m.title)}` +
                `<span class="search-result-via">${escapeHtml(m.desc || '')}</span></div>`;
        }
        if (m.kind === 'tag') {
            return `<div class="${cls}" data-ix="${i}">` +
                `<span class="search-result-swatch" style="--tag-color:${escapeHtml(m.color)}"></span>` +
                `${highlightMatch(m.name, query)}` +
                `<span class="search-result-meta">tag · ${m.count} case${m.count === 1 ? '' : 's'}</span></div>`;
        }
        if (m.kind === 'list') {
            return `<div class="${cls}" data-ix="${i}">${highlightMatch(m.name, query)}` +
                `<span class="search-result-meta">list · ${m.count} case${m.count === 1 ? '' : 's'}</span></div>`;
        }
        const displayTitle = m.displayTitle || m.title;
        const titleHtml = m.via ? escapeHtml(displayTitle) : highlightMatch(displayTitle, query);
        const viaHtml   = m.via ? `<span class="search-result-via">${highlightMatch(m.via, query)}</span>` : '';
        return `<div class="${cls}" data-ix="${i}">${titleHtml}${viaHtml}</div>`;
    }).join('');
}

function moveSearchSelection(delta) {
    if (!searchMatches.length) return;
    searchActiveIx = (searchActiveIx + delta + searchMatches.length) % searchMatches.length;
    const rows = searchResultsEl.querySelectorAll('.search-result');
    rows.forEach((r, i) => r.classList.toggle('active', i === searchActiveIx));
    const active = rows[searchActiveIx];
    if (active) active.scrollIntoView({ block: 'nearest' });
}

// Weighted probability of a cluster: the weight of a single case (all cases in a
// cluster share the same weight) times how many cases the cluster has. Works for
// both trainers — OBL case-lists are already in the new naming getOBLWeight wants.
function clusterWeightedProbability(caseList) {
    if (!caseList || !caseList.length) return 0;
    const w = trainerMode === 'pbl'
        ? squan.getPBLWeight(caseList[0])
        : squan.getOBLWeight(caseList[0]);
    return w * caseList.length;
}

// Picks a cluster title at random, weighted by clusterWeightedProbability so that
// more-likely-to-occur clusters come up more often. An optional predicate
// (title, data) limits the pool (e.g. only untagged clusters).
function randomClusterTitle(filter = null) {
    let entries = Object.entries(trainerMode === 'pbl' ? pblClusters : oblClusters);
    if (filter) entries = entries.filter(([title, data]) => filter(title, data));
    if (!entries.length) return null;
    let total = 0;
    const cumulative = entries.map(([, data]) => (total += clusterWeightedProbability(data['case-list'])));
    if (total <= 0) return entries[randInt(0, entries.length - 1)][0]; // degenerate: uniform
    const r = Math.random() * total;
    const i = cumulative.findIndex(c => r < c);
    return entries[i < 0 ? entries.length - 1 : i][0];
}

// Opens a weighted-random cluster, optionally restricted by `filter`. Shows a
// notice when the (filtered) pool is empty instead of doing nothing.
function openRandomCluster(filter = null, emptyMsg = 'No matching clusters.') {
    const title = randomClusterTitle(filter);
    if (title) openAlgReference(title);
    else showInfo(emptyMsg);
}

// Keyword commands surfaced in the search bar, keyed by the search term that
// triggers them. Add new actions here — { label, desc, trainer, run } — and they
// show up automatically. `trainer` ('obl' | 'pbl' | 'both') limits which
// trainer(s) the action appears in. `run` is invoked when the entry is chosen.
const SEARCH_ACTIONS = {
    tags:             { label: 'Tags',            desc: 'Manage your tags',                          trainer: 'both', run: () => openTagModal() },
    random:           { label: 'Random',          desc: 'Open a weighted-random cluster',            trainer: 'both', run: () => openRandomCluster() },
    'random untagged': { label: 'Random Untagged', desc: 'Random cluster with no tagged solutions',  trainer: 'both',
        run: () => { const tagged = taggedClusterTitles(); openRandomCluster(title => !tagged.has(title), 'Every cluster has a tagged solution.'); } },
};

function openSearchResult(ix) {
    const match = searchMatches[ix];
    if (!match) return;
    if (match.kind === 'action') {
        closeOverlayForTransition();
        SEARCH_ACTIONS[match.action]?.run();
        abandonTransition();   // no-op if the action opened a replacement overlay
        return;
    }
    if (match.kind === 'tag')    { showTagInSearch(match.tagId); return; }
    if (match.kind === 'list')   { showListInSearch(match.name); return; }
    showClusterInSearch(match.title);
}

// Lists searchable in the current trainer (defaults + user-created).
function searchableListNames() {
    return trainerMode === 'obl'
        ? [...Object.keys(oblDefaultLists), ...Object.keys(oblUserLists)]
        : [...Object.keys(pblDefaultLists), ...Object.keys(pblUserLists)];
}

// Distinct-case count of a list, matching the lists-modal badge.
function listCaseCount(name) {
    if (trainerMode === 'obl') {
        const l = oblDefaultLists[name] || oblUserLists[name];
        return l ? l[oblUsingSpe].length : 0;
    }
    const l = pblDefaultLists[name] || pblUserLists[name];
    return l ? new Set(l.map(s => s.slice(0, -1))).size : 0;
}

// Shows a cluster's alg reference inside the search extension and sets the search
// bar to the cluster title. Setting .value programmatically does not fire `input`,
// so the user editing the bar (which does) reverts to plain search.
function currentSearchReturnTarget() {
    if (hmEl.style.display !== 'none')             return { kind: 'heatmap' };
    if (searchTagViewEl.style.display !== 'none')  return { kind: 'tag', id: _stvTagId };
    if (searchListViewEl.style.display !== 'none') return { kind: 'list', name: _slvName };
    if (searchResultsEl.style.display !== 'none')  return { kind: 'results', query: searchInputEl.value };
    return { kind: 'trainer' };
}

function showClusterInSearch(title, returnTo = null) {
    if (!(trainerMode === 'pbl' ? pblClusters : oblClusters)?.[title]) return;
    searchClusterReturn = returnTo || currentSearchReturnTarget();
    searchClusterTitle = title;
    searchEditMode = false;
    searchInClusterView = true;
    searchInputEl.value = trainerMode === 'obl' ? oblDisplayClusterTitle(title) : title;
    searchExtensionEl.style.display = "flex";
    searchResultsEl.style.display = "none";
    searchTagViewEl.style.display = "none";
    searchListViewEl.style.display = "none";
    hmEl.style.display = "none";
    hmCloseFilter();
    searchClusterEl.style.display = "flex";
    renderSearchClusterBody();
}

export function syncSearchClusterToolbar() {
    const tb = document.getElementById('search-cluster-toolbar');
    if (!tb) return;
    const navBack = tb.querySelector('.sct-back');
    const edit    = tb.querySelector('.sct-edit');
    const save    = tb.querySelector('.sct-save');
    navBack.style.display = searchEditMode ? 'none' : '';
    edit.classList.toggle('active', searchEditMode);
    edit.dataset.tip = searchEditMode ? 'Back to reference' : 'Edit alg reference';
    edit.setAttribute('aria-label', searchEditMode ? 'Back to reference' : 'Edit');
    edit.querySelector('.sct-pencil-icon').style.display = searchEditMode ? 'none' : '';
    edit.querySelector('.sct-edit-back-icon').style.display = searchEditMode ? '' : 'none';
    save.style.display = searchEditMode ? '' : 'none';
    save.disabled = !searchEditMode || !algEditDirty();
    tb.querySelectorAll('.sct-undo, .sct-redo').forEach(b => b.style.display = searchEditMode ? '' : 'none');
}

// Renders the cluster body in read or edit mode and syncs the toolbar.
function renderSearchClusterBody() {
    closeUnitTagPopover();
    syncSearchClusterToolbar();

    if (searchEditMode) {
        // Keep the current read-mode width so entering edit doesn't shrink the panel.
        algEditRender(searchClusterContentEl, searchClusterTitle);
    } else {
        applySearchClusterWidth(searchClusterTitle);
        // On a source-tab change, reuse the cached width so switching views
        // doesn't resize the panel, and re-check tag-chip overflow.
        renderClusterInto(searchClusterContentEl, searchClusterTitle, () => {
            searchPanelEl.style.width = searchClusterWidth;
            applyUnitTagOverflow(searchClusterContentEl);
        });
        applyUnitTagOverflow(searchClusterContentEl);
    }
}

let searchEditDiscardPrompt = null;

function confirmDiscardSearchEdit() {
    if (!searchEditMode || !algEditDirty()) return Promise.resolve(true);
    if (!searchEditDiscardPrompt) {
        searchEditDiscardPrompt = appConfirm(
            'You have unsaved changes. Discard them and leave the editor?',
            { title: 'Unsaved changes', okText: 'Discard', cancelText: 'Keep editing', danger: true }
        ).finally(() => { searchEditDiscardPrompt = null; });
    }
    return searchEditDiscardPrompt;
}

async function leaveSearchEdit() {
    if (!searchEditMode) return true;
    if (!await confirmDiscardSearchEdit()) return false;
    algEditCancel();
    searchEditMode = false;
    return true;
}

async function handleSearchEditButton() {
    if (!searchClusterTitle) return;
    if (searchEditMode) {
        if (!await leaveSearchEdit()) return;
    } else {
        searchEditMode = true;
        algEditBegin(searchClusterTitle);
    }
    renderSearchClusterBody();
}

export function saveSearchEdit() {
    if (!searchEditMode || !algEditDirty()) return;
    if (algEditSave()) showSuccess("Saved.", 800);
    syncSearchClusterToolbar();
}

async function handleSearchInput() {
    if (!searchEditMode) { renderSearchResults(); return; }
    const nextQuery = searchInputEl.value;
    searchInputEl.value = searchClusterTitle;
    if (!await leaveSearchEdit()) return;
    searchInputEl.value = nextQuery;
    renderSearchResults();
}

function backFromSearchCluster() {
    if (searchEditMode) return;
    const target = searchClusterReturn;
    searchClusterTitle = null;
    searchInClusterView = false;
    searchClusterEl.style.display = 'none';

    if (target.kind === 'heatmap') {
        searchInputEl.value = '';
        renderSearchResults();
    } else if (target.kind === 'tag' && target.id) {
        showTagInSearch(target.id);
    } else if (target.kind === 'list' && target.name) {
        showListInSearch(target.name);
    } else if (target.kind === 'results') {
        searchInputEl.value = target.query || '';
        renderSearchResults();
    } else {
        dismissTopOverlay();
    }
}

// Sizes the whole search panel (bar + extension) to fit the cluster's widest
// ALG LINE, measured across ALL sources so switching the Matt/Derpy/JLMinx tabs
// keeps a constant width. Only the monospace alg lines (.matt-algs/.pure-algs,
// which are nowrap + fit-content) count — prose explanations are free to wrap.
// Clamped to the viewport; cached in searchClusterWidth for tab-change reuse.
function applySearchClusterWidth(title) {
    const content = searchClusterContentEl;
    const cluster = effectiveCluster(title);
    if (!cluster) return;
    const SKIP     = new Set(['case-list', 'optimal-slicecount']);
    const sources  = Object.keys(cluster).filter(k => !SKIP.has(k));
    const meta     = trainerMode === 'obl' ? OBL_SOURCE_META : PBL_SOURCE_META;
    const sheetFmt = trainerMode === 'obl' ? oblFormatSheet : pblFormatSheet;

    const prev = content.innerHTML;
    searchPanelEl.style.width = '';   // measure at the natural (default) width
    content.style.visibility = 'hidden';
    let maxRight = 0;                  // widest alg-line right edge from content's left
    for (const src of sources) {
        const m = meta[src] ?? { label: src, linkText: src, url: '', formatter: sheetFmt };
        // #cluster-source-content so the ">span { display:block }" rules apply.
        const displayTitle = trainerMode === 'obl' ? oblDisplayClusterTitle(title) : title;
        content.innerHTML = `<span class="cluster-title">${escapeHtml(displayTitle)}</span><div id="cluster-source-content">${m.formatter(cluster, src, m, title)}</div>`;
        const cLeft = content.getBoundingClientRect().left;
        content.querySelectorAll('.matt-algs, .pure-algs').forEach(el => {
            maxRight = Math.max(maxRight, el.getBoundingClientRect().right - cLeft);
        });
    }
    content.innerHTML = prev;
    content.style.visibility = '';

    const maxW = Math.min(900, window.innerWidth * 0.92);
    const minW = Math.min(640, window.innerWidth * 0.92);
    // maxRight already spans content's left padding + the alg line; add the right padding.
    searchClusterWidth = Math.max(minW, Math.min(maxRight + 24, maxW)) + 'px';
    searchPanelEl.style.width = searchClusterWidth;
}

function openSearch() {
    if (usingTimer()) return;
    if (isSearchOpen) return;
    isSearchOpen = true;
    searchOverlayEl.style.display = "flex";
    searchInputEl.value = "";
    renderSearchResults();
    searchInputEl.focus();
    pushOverlay({
        el: searchOverlayEl,
        isPopup: false,
        close: closeSearchRaw,
        beforeClose: confirmDiscardSearchEdit,
    });
}

// Raw hide — runs from the overlay stack (no history side effects).
function closeSearchRaw() {
    if (searchEditMode) { algEditCancel(); searchEditMode = false; }
    closeUnitTagPopover();
    _stvCloseSelector();
    hmCloseFilter();
    isSearchOpen = false;
    searchOverlayEl.style.display = "none";
    searchInputEl.blur();
}

// Public close (backdrop onclick / programmatic) → single Back step.
function closeSearch(e) {
    if (e && e.target !== searchOverlayEl) return; // only the backdrop click closes
    dismissTopOverlay();
}

export function toggleSearch() {
    if (isSearchOpen) dismissTopOverlay();
    else openSearch();
}

window.addEventListener('obl-naming-change', () => {
    _searchIndexCache.obl = null;
    _searchIndexCache.oblNamingMode = oblNamingMode;
    if (!isSearchOpen || trainerMode !== 'obl') return;
    if (searchClusterEl.style.display !== 'none' && searchClusterTitle) {
        searchInputEl.value = oblDisplayClusterTitle(searchClusterTitle);
        renderSearchClusterBody();
    } else if (searchTagViewEl.style.display !== 'none') {
        renderTagView();
    } else if (searchListViewEl.style.display !== 'none') {
        renderListView();
    } else {
        renderSearchResults();
    }
});

// ─── Search help modal ────────────────────────────────────────────────────────
// Per-trainer help content shown by the "?" button in the search bar.

const SEARCH_HELP_CONTENT = {
    pbl: `<p>Search PBL clusters by their title.</p>
          <p style="opacity:0.5">More PBL-specific search help coming soon.</p>`,
    obl: `<p>Search OBL clusters by their title.</p>
          <p style="opacity:0.5">More OBL-specific search help coming soon.</p>`,
};

function openSearchHelp() {
    document.getElementById("search-help-title").textContent =
        (trainerMode === 'pbl' ? 'PBL' : 'OBL') + ' search';
    document.getElementById("search-help-content").innerHTML =
        SEARCH_HELP_CONTENT[trainerMode] || '';
    searchHelpModalEl.style.display = "flex";
    pushOverlay({ el: searchHelpModalEl, isPopup: false, close: () => { searchHelpModalEl.style.display = "none"; } });
}

function closeSearchHelp(e) {
    if (e && e.target !== searchHelpModalEl) return;
    dismissTopOverlay();
}

searchHelpBtnEl.addEventListener("click", openSearchHelp);
searchOverlayEl.addEventListener('click', closeSearch);
document.getElementById('search-help-close').addEventListener('click', () => closeSearchHelp());
searchHelpModalEl.addEventListener('click', closeSearchHelp);
searchInputEl.addEventListener("input", handleSearchInput);

document.querySelector('#search-cluster-toolbar .sct-back').addEventListener("click", backFromSearchCluster);
document.querySelector('#search-cluster-toolbar .sct-edit').addEventListener("click", handleSearchEditButton);
document.querySelector('#search-cluster-toolbar .sct-save').addEventListener("click", saveSearchEdit);
document.querySelector('#search-cluster-toolbar .sct-undo').addEventListener("click", () => algEditUndo());
document.querySelector('#search-cluster-toolbar .sct-redo').addEventListener("click", () => algEditRedo());

// ── Per-unit tag attach (read mode) ──────────────────────────────────────────
let _unitTagRef = null;

searchClusterContentEl.addEventListener("click", (e) => {
    if (searchEditMode) return;
    const add = e.target.closest('.unit-tag-add');
    if (add) { e.stopPropagation(); openUnitTagPopover(add, add.dataset.ref); }
});

function _unitTagPopoverInner(refs) {
    const tags = getTags();
    if (!tags.length) return `<div class="unit-tag-empty">No tags yet — create them in the Tags menu.</div>`;
    return tags.map(t => {
        const state = tagUnitState(t.id, refs); // 'none' | 'some' | 'all'
        const cls   = state === 'all' ? ' checked' : state === 'some' ? ' partial' : '';
        return `<button class="unit-tag-opt" data-tag="${escapeHtml(t.id)}">
            <span class="unit-tag-dot" style="--tag-color:${escapeHtml(t.color)}"></span>
            <span class="unit-tag-name">${escapeHtml(t.name)}</span>
            <span class="unit-tag-box${cls}"></span>
        </button>`;
    }).join('');
}

function openUnitTagPopover(btn, ref) {
    closeUnitTagPopover();
    _unitTagRef = ref;
    const pop = document.createElement('div');
    pop.className = 'unit-tag-popover';
    pop.innerHTML = _unitTagPopoverInner([ref]);
    document.body.appendChild(pop);

    const r = btn.getBoundingClientRect();
    pop.style.top  = (r.bottom + 6) + 'px';
    pop.style.left = r.left + 'px';
    const pr = pop.getBoundingClientRect();
    if (pr.right  > window.innerWidth  - 8) pop.style.left = Math.max(8, window.innerWidth  - 8 - pr.width) + 'px';
    if (pr.bottom > window.innerHeight - 8) pop.style.top  = Math.max(8, r.top - pr.height - 6) + 'px';

    pop.addEventListener('click', (e) => {
        const opt = e.target.closest('.unit-tag-opt');
        if (!opt) return;
        toggleUnitTag(_unitTagRef, opt.dataset.tag);
        searchClusterContentEl.querySelectorAll(`.unit-tags[data-ref="${_unitTagRef}"]`)
            .forEach(el => { el.innerHTML = unitTagsInner(_unitTagRef); });
        applyUnitTagOverflow(searchClusterContentEl);
        pop.innerHTML = _unitTagPopoverInner([_unitTagRef]);
    });
    setTimeout(() => document.addEventListener('pointerdown', _unitTagOutside), 0);
}

// Collapse a unit's tag chips to dots when they don't fit on the line.
function applyUnitTagOverflow(content) {
    content.querySelectorAll('.unit-tags').forEach(ut => {
        const list = ut.querySelector('.unit-tag-list');
        if (!list) return;
        ut.classList.remove('dots');                       // measure in chip mode
        if (list.scrollWidth > list.clientWidth + 1) ut.classList.add('dots');
    });
}

function _unitTagOutside(e) {
    if (!e.target.closest('.unit-tag-popover') && !e.target.closest('.unit-tag-add')) closeUnitTagPopover();
}

function closeUnitTagPopover() {
    document.removeEventListener('pointerdown', _unitTagOutside);
    document.querySelectorAll('.unit-tag-popover').forEach(p => p.remove());
    _unitTagRef = null;
}

searchResultsEl.addEventListener("click", (e) => {
    const row = e.target.closest('.search-result');
    if (row) openSearchResult(Number(row.dataset.ix));
});

searchInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();   // don't let the window-level Esc also fire
        dismissTopOverlay();
        return;
    }
    // While an alg reference is shown in the extension, leave the keys alone so
    // the caret can move and the content can be scrolled — no result navigation.
    if (searchInClusterView) return;
    switch (e.key) {
        case "ArrowDown": e.preventDefault(); moveSearchSelection(1);  break;
        case "ArrowUp":   e.preventDefault(); moveSearchSelection(-1); break;
        case "Enter":     e.preventDefault(); if (searchActiveIx >= 0) openSearchResult(searchActiveIx); break;
    }
});

// While the search bar is open but focus has drifted off its input (e.g. the user
// clicked a result, a heatmap cell, or the backdrop), send every keystroke back
// to the search input so typing — and shortcuts like Ctrl+A — act on the search
// field instead of being swallowed. Runs in the capture phase so the input is
// focused before the keypress that produces the character is dispatched.
window.addEventListener("keydown", (e) => {
    if (!isSearchOpen) return;
    const ae = document.activeElement;
    if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable)) return;
    if (e.key === "Escape" || e.key === "Tab") return; // leave navigation/close keys alone
    searchInputEl.focus();
    // Place the caret at the end rather than selecting/starting at the beginning.
    const end = searchInputEl.value.length;
    searchInputEl.setSelectionRange(end, end);
}, true);


// ═══════════════════════════════════════════════════════════════════════════
//  SEARCH EXTENSION: TAG VIEW + LIST VIEW
//  Two extra detail views that live inside #search-extension alongside the alg
//  reference (#search-cluster). They are not modals — they swap in/out the same
//  way the cluster view does, driven by openSearchResult().
//
//   • Tag view  (#search-tagview):  a tag's tagged solution overviews grouped by
//     cluster, each linking to its alg reference, with a tag selector on top for
//     bulk re-tagging (mark all / none of this tag's units as another tag).
//   • List view (#search-listview): a list shown as a case grid with a
//     Select / Reference mode toggle — Select edits the list's cases (and their
//     barflips, for PBL), Reference opens a case's alg reference.
// ═══════════════════════════════════════════════════════════════════════════

const GO_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>`;

// Hides every other detail view and the results list, then shows `el`. Shared by
// both views so only one thing is ever visible in the extension.
function _searchShowDetail(el) {
    searchInClusterView = true;          // gate keyboard result-navigation
    searchExtensionEl.style.display = "flex";
    searchResultsEl.style.display   = "none";
    searchClusterEl.style.display   = "none";
    searchTagViewEl.style.display   = "none";
    searchListViewEl.style.display  = "none";
    hmEl.style.display = "none";
    hmCloseFilter();
    searchPanelEl.style.width = "";      // natural width; views size themselves
    el.style.display = "block";
}

// ─── TAG VIEW ────────────────────────────────────────────────────────────────

let _stvTagId = null;

function showTagInSearch(tagId) {
    _stvTagId = tagId;
    searchClusterTitle = null;
    searchInputEl.value = getTags().find(t => t.id === tagId)?.name ?? '';
    _searchShowDetail(searchTagViewEl);
    renderTagView();
}

function renderTagView() {
    _stvCloseSelector();
    const tag = getTags().find(t => t.id === _stvTagId);
    if (!tag) { searchTagViewEl.innerHTML = '<div class="search-empty">Tag not found.</div>'; return; }

    const clusters = tagUnitsByCluster(_stvTagId);
    const head =
        `<div class="stv-head">` +
            `<span class="stv-title">` +
                `<span class="search-result-swatch" style="--tag-color:${escapeHtml(tag.color)}"></span>` +
                `${escapeHtml(tag.name)}</span>` +
            `<button class="stv-tagsel" data-tip="Bulk re-tag these">${UNIT_TAG_SVG}<span>Tags</span></button>` +
        `</div>`;

    const body = clusters.length
        ? clusters.map(c =>
            `<div class="stv-cluster">` +
                `<button class="stv-cluster-title" data-title="${escapeHtml(c.title)}">${escapeHtml(trainerMode === 'obl' ? oblDisplayClusterTitle(c.title) : c.title)}</button>` +
                c.entries.map(e =>
                    `<button class="stv-entry" data-title="${escapeHtml(c.title)}">` +
                        `<span class="stv-overview">${escapeHtml(e.overview)}</span>` +
                        `<span class="stv-go">${GO_SVG}</span>` +
                    `</button>`
                ).join('') +
            `</div>`
          ).join('')
        : `<div class="search-empty">Nothing tagged “${escapeHtml(tag.name)}” yet.</div>`;

    searchTagViewEl.innerHTML = head + `<div class="stv-body">${body}</div>`;
}

searchTagViewEl.addEventListener('click', (e) => {
    const sel = e.target.closest('.stv-tagsel');
    if (sel) { _stvOpenSelector(sel); return; }
    const go = e.target.closest('.stv-entry, .stv-cluster-title');
    if (go) showClusterInSearch(go.dataset.title);
});

// Bulk re-tag selector: a tristate list of all tags reflecting their coverage
// across the viewed tag's units. Toggling one marks/unmarks every one of those
// units with that tag.
let _stvSelPop = null;

function _stvTagRefs() { return loadTagAssignments()[_stvTagId] || []; }

function _stvSelectorInner() {
    const tags = getTags();
    if (!tags.length) return `<div class="unit-tag-empty">No tags yet — create them in the Tags menu.</div>`;
    const refs = _stvTagRefs();
    return tags.map(t => {
        const state = tagUnitState(t.id, refs); // 'none' | 'some' | 'all'
        const cls   = state === 'all' ? ' checked' : state === 'some' ? ' partial' : '';
        return `<button class="unit-tag-opt" data-tag="${escapeHtml(t.id)}">` +
            `<span class="unit-tag-dot" style="--tag-color:${escapeHtml(t.color)}"></span>` +
            `<span class="unit-tag-name">${escapeHtml(t.name)}</span>` +
            `<span class="unit-tag-box${cls}"></span></button>`;
    }).join('');
}

function _stvBulkToggle(tagId) {
    const refs  = _stvTagRefs();
    if (!refs.length) return;
    const state = tagUnitState(tagId, refs);
    const a = loadTagAssignments();
    if (!a[tagId]) a[tagId] = [];
    if (state === 'all') a[tagId] = a[tagId].filter(r => !refs.includes(r)); // all → none
    else for (const r of refs) if (!a[tagId].includes(r)) a[tagId].push(r);  // none/some → all
    if (!a[tagId].length) delete a[tagId];
    saveTagAssignments(a);
}

function _stvOpenSelector(btn) {
    _stvCloseSelector();
    const pop = document.createElement('div');
    pop.className = 'unit-tag-popover';
    pop.innerHTML = _stvSelectorInner();
    document.body.appendChild(pop);
    _stvSelPop = pop;

    const r = btn.getBoundingClientRect();
    pop.style.top  = (r.bottom + 6) + 'px';
    pop.style.left = r.left + 'px';
    const pr = pop.getBoundingClientRect();
    if (pr.right  > window.innerWidth  - 8) pop.style.left = Math.max(8, window.innerWidth  - 8 - pr.width) + 'px';
    if (pr.bottom > window.innerHeight - 8) pop.style.top  = Math.max(8, r.top - pr.height - 6) + 'px';

    pop.addEventListener('click', (e) => {
        const opt = e.target.closest('.unit-tag-opt');
        if (!opt) return;
        _stvBulkToggle(opt.dataset.tag);
        pop.innerHTML = _stvSelectorInner();
        renderTagMenu();   // case counts may have shifted
        // The viewed tag itself may have lost units — refresh its body too.
        const body = searchTagViewEl.querySelector('.stv-body');
        if (body) {
            const clusters = tagUnitsByCluster(_stvTagId);
            // Only the membership of *this* tag changes its own list, so re-render
            // lazily by toggling: re-running renderTagView would close the popover.
            if (!clusters.length || opt.dataset.tag === _stvTagId) { _stvCloseSelector(); renderTagView(); }
        }
    });
    setTimeout(() => document.addEventListener('pointerdown', _stvSelOutside), 0);
}

function _stvSelOutside(e) {
    if (!e.target.closest('.unit-tag-popover') && !e.target.closest('.stv-tagsel')) _stvCloseSelector();
}

function _stvCloseSelector() {
    document.removeEventListener('pointerdown', _stvSelOutside);
    if (_stvSelPop) { _stvSelPop.remove(); _stvSelPop = null; }
}

// ─── LIST VIEW ───────────────────────────────────────────────────────────────

let _slvName    = null;
let _slvMode    = 'select';   // 'select' | 'reference'
let _slvList    = null;       // working copy: PBL → signed entries[]; OBL → [nonSpe[], spe[]]
let _slvDefault = false;      // default lists are read-only in Select mode

function showListInSearch(name) {
    _slvName = name;
    _slvMode = 'select';
    if (trainerMode === 'obl') {
        const src = oblDefaultLists[name] || oblUserLists[name];
        _slvDefault = name in oblDefaultLists;
        _slvList = src ? [src[0].slice(), src[1].slice()] : [[], []];
    } else {
        const src = pblDefaultLists[name] || pblUserLists[name];
        _slvDefault = name in pblDefaultLists;
        _slvList = src ? src.slice() : [];
    }
    searchClusterTitle = null;
    searchInputEl.value = name;
    _searchShowDetail(searchListViewEl);
    renderListView();
}

function _slvBaseMode(base) {
    const p = _slvList.includes(base + '+'), m = _slvList.includes(base + '-');
    return p && m ? 'both' : p ? 'plus' : m ? 'minus' : 'none';
}

function _slvModeClass(mode) {
    return mode === 'both' ? 'checked-both' : mode === 'plus' ? 'checked-plus' : mode === 'minus' ? 'checked-minus' : '';
}

function _slvGridHtml() {
    if (trainerMode === 'obl') {
        const ids = oblUsingSpe
            ? possibleOBL.flatMap(o => getSpe(OBLname(o)))
            : possibleOBL.map(o => OBLname(o));
        return ids.map(id => {
            const inList = _slvList[oblUsingSpe].includes(id);
            return `<div class="case ${inList ? 'checked-both' : ''}" data-id="${escapeHtml(id)}">${escapeHtml(oblDisplayName(id))}</div>`;
        }).join('');
    }
    return pblPossible.map(([t, b]) => {
        const base = `${t}/${b}`;
        return `<div class="case ${_slvModeClass(_slvBaseMode(base))}" data-base="${escapeHtml(base)}">${t} / ${b}</div>`;
    }).join('');
}

function renderListView() {
    const ref = _slvMode === 'reference';
    const hint = ref
        ? 'Tap a case to open its alg reference.'
        : _slvDefault
            ? 'Default lists can’t be edited. Switch to your own list to change its cases.'
            : (trainerMode === 'pbl'
                ? 'Tap a case to cycle which barflips are in the list.'
                : 'Tap a case to add or remove it from the list.');

    searchListViewEl.innerHTML =
        `<div class="slv-head">` +
            `<span class="slv-title">${escapeHtml(_slvName)}` +
                (_slvDefault ? ` <span class="slv-default">(default)</span>` : ``) +
            `</span>` +
            `<div class="slv-modes">` +
                `<button data-mode="select"${ref ? '' : ' class="active"'}>Select</button>` +
                `<button data-mode="reference"${ref ? ' class="active"' : ''}>Reference</button>` +
            `</div>` +
        `</div>` +
        `<div class="slv-hint">${hint}</div>` +
        `<div class="slv-grid${ref ? ' reference' : ''}">${_slvGridHtml()}</div>`;
}

// Mode toggle.
searchListViewEl.addEventListener('click', (e) => {
    const modeBtn = e.target.closest('.slv-modes button');
    if (modeBtn) { _slvMode = modeBtn.dataset.mode; renderListView(); }
});

// PBL list edit: cycle a base none→both→plus→minus→none (mirrors the main grid).
function _slvSet(base, sign, on) {
    const e = base + sign, i = _slvList.indexOf(e);
    if (on && i < 0) _slvList.push(e);
    if (!on && i >= 0) _slvList.splice(i, 1);
}

function _slvTogglePbl(base) {
    const mode = _slvBaseMode(base);
    if (!pblUseBarflip) {
        const on = mode !== 'both';
        _slvSet(base, '+', on); _slvSet(base, '-', on);
    } else if (mode === 'none')  { _slvSet(base, '+', true);  _slvSet(base, '-', true); }
    else if   (mode === 'both')  { _slvSet(base, '-', false); }
    else if   (mode === 'plus')  { _slvSet(base, '+', false); _slvSet(base, '-', true); }
    else                         { _slvSet(base, '-', false); }
}

function _slvPersist() {
    if (trainerMode === 'obl') {
        // Keep the specific/non-specific halves in sync, like oblOverwriteList.
        if (oblUsingSpe) _slvList[0] = getNonSpeList(_slvList[1]);
        else             _slvList[1] = getSpeList(_slvList[0]);
        oblUserLists[_slvName] = [_slvList[0].slice(), _slvList[1].slice()];
        oblSaveUserLists();
        oblAddUserLists();
    } else {
        pblUserLists[_slvName] = _slvList.slice();
        pblSaveUserLists();
        pblAddUserLists();
    }
}

// Navigate to a case's alg reference (Reference mode).
function _slvGoReference(cell) {
    const title = trainerMode === 'obl'
        ? oblFindCluster(cell.dataset.id)
        : pblFindCluster(cell.dataset.base);
    if (title) showClusterInSearch(title);
}

// Edit a case (Select mode), updating just the tapped cell.
function _slvEditCell(cell) {
    if (_slvDefault) { showError("Default lists can’t be edited.", 1200); return; }
    if (trainerMode === 'obl') {
        const id = cell.dataset.id;
        const arr = _slvList[oblUsingSpe];
        const i = arr.indexOf(id);
        if (i >= 0) { arr.splice(i, 1); cell.classList.remove('checked-both'); }
        else        { arr.push(id);     cell.classList.add('checked-both'); }
    } else {
        const base = cell.dataset.base;
        _slvTogglePbl(base);
        cell.classList.remove('checked-both', 'checked-plus', 'checked-minus');
        const c = _slvModeClass(_slvBaseMode(base));
        if (c) cell.classList.add(c);
    }
    _slvPersist();
}

// Pointer handling: distinguish a tap from a pan (mobile horizontal scroll).
let _slvDown = null;
searchListViewEl.addEventListener('pointerdown', (e) => {
    const cell = e.target.closest('.case');
    if (cell) _slvDown = { x: e.clientX, y: e.clientY, cell };
});
searchListViewEl.addEventListener('pointerup', (e) => {
    const down = _slvDown; _slvDown = null;
    const cell = e.target.closest('.case');
    if (!down || !cell || cell !== down.cell) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return; // pan, not a tap
    if (_slvMode === 'reference') _slvGoReference(cell);
    else                          _slvEditCell(cell);
});
