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
            `<button class="stv-tagsel" title="Bulk re-tag these">${UNIT_TAG_SVG}<span>Tags</span></button>` +
        `</div>`;

    const body = clusters.length
        ? clusters.map(c =>
            `<div class="stv-cluster">` +
                `<button class="stv-cluster-title" data-title="${escapeHtml(c.title)}">${escapeHtml(c.title)}</button>` +
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
            return `<div class="case ${inList ? 'checked-both' : ''}" data-id="${escapeHtml(id)}">${escapeHtml(id)}</div>`;
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
    if (_slvDefault) { showSuccess("Default lists can’t be edited.", 1200); return; }
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
