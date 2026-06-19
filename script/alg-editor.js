// ═══════════════════════════════════════════════════════════════════════════
//  ALG-REFERENCE EDITOR
//  Edit-mode rendering + interactions for the alg reference shown in the search
//  extension. Reads/writes overrides via alg-overrides.js; the shipped data is
//  never touched. matt is edited as solution-group cards; sheet sources (derpy,
//  jlminx) are a single explanation-less alg-block.
//
//  Draft model (in memory, committed to the override store on every change):
//    matt:  { distinction, groups: [ { id, overview, slices, blocks:[block] } ] }
//    sheet: a single `block`
//    block: { angleExp, algExp, rows: [ {caseName, sign, angle, notation} ] }
// ═══════════════════════════════════════════════════════════════════════════

const AE_GRIP_SVG  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>`;
const AE_X_SVG     = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`;
const AE_PLUS_SVG  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const AE_RESET_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/></svg>`;
const AE_TRASH_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const AE_WARN_SVG  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

let aeTitle  = null;
let aeSource = null;
let aeDraft  = null;

let aeUndo = [], aeRedo = [];
let aeSnapshotBeforeEdit = null; // draft state captured at each render
let aeTextUndoPushed = false;    // one undo entry per render→text-edit burst
let aeSaveTimer = null;

function algEditActive() { return searchEditMode && aeDraft != null; }

function _aeSourceMeta() { return trainerMode === 'obl' ? OBL_SOURCE_META : PBL_SOURCE_META; }
function _aeSources(title) {
    const SKIP = new Set(['case-list', 'optimal-slicecount']);
    return Object.keys(_algClusters()[title] || {}).filter(k => !SKIP.has(k));
}
// Shape of the active source. Only PBL's matt is grouped (solution groups);
// OBL matt is flat, and sheet sources are a single block. OBL has no signs, and
// only matt sources carry an angle.
function _aeGrouped()  { return trainerMode === 'pbl' && aeSource === 'matt'; }
function _aeHasSign()  { return trainerMode === 'pbl'; }
function _aeHasAngle() { return trainerMode === 'pbl' || aeSource === 'matt'; }

// ── Session lifecycle ────────────────────────────────────────────────────────

function algEditBegin(title) {
    aeTitle  = title;
    const sources = _aeSources(title);
    const last = trainerMode === 'obl' ? oblLastClusterSource : pblLastClusterSource;
    aeSource = (last && sources.includes(last)) ? last : sources[0];
    aeUndo = []; aeRedo = [];
    _aeLoadDraft();
}

function _aeLoadDraft() {
    aeDraft = _aeGrouped() ? buildMattDraft(aeTitle) : buildSingleBlockDraft(aeTitle, aeSource);
}

function _aeCommit() {
    if (_aeGrouped()) commitMattDraft(aeTitle, aeDraft);
    else              commitSingleBlockDraft(aeTitle, aeSource, aeDraft);
}

function _aeAutosave() {
    clearTimeout(aeSaveTimer);
    aeSaveTimer = setTimeout(_aeCommit, 300);
}

function algEditFinish() {
    if (aeDraft) { _aeCommit(); aeDraft = null; }
    aeTitle = aeSource = null;
    aeUndo = []; aeRedo = [];
}

// ── Undo / redo ──────────────────────────────────────────────────────────────

function _aePushUndo(state) { aeUndo.push(state); aeRedo = []; if (aeUndo.length > 100) aeUndo.shift(); }
function _aeStructuralUndo() { _aePushUndo(_clone(aeDraft)); }
function _aeTextUndoOnce() { if (!aeTextUndoPushed) { _aePushUndo(aeSnapshotBeforeEdit); aeTextUndoPushed = true; } }

function algEditUndo() {
    if (!aeUndo.length) return;
    aeRedo.push(_clone(aeDraft));
    aeDraft = aeUndo.pop();
    _aeCommit();
    algEditRender(searchClusterContentEl, aeTitle);
}
function algEditRedo() {
    if (!aeRedo.length) return;
    aeUndo.push(_clone(aeDraft));
    aeDraft = aeRedo.pop();
    _aeCommit();
    algEditRender(searchClusterContentEl, aeTitle);
}

// ── Rendering ────────────────────────────────────────────────────────────────

function _aeEsc(s) { return escapeHtml(String(s ?? '')); }

function _aeRowErrorInner(err) {
    return err ? `${AE_WARN_SVG}<span>${_aeEsc(err)}</span>` : '';
}

function _aeRowHtml(bi, ri, row) {
    const caseFull = _aeEsc(row.caseName + (row.sign || ''));
    const err = validateCaseField(row.caseName + (row.sign || ''), clusterCaseList(aeTitle), _aeHasSign());
    const angle = _aeHasAngle()
        ? `<span class="ae-bracket">&lt;</span><input class="ae-f ae-angle" data-bi="${bi}" data-ri="${ri}" data-f="angle" value="${_aeEsc(row.angle)}" placeholder="angle" spellcheck="false" /><span class="ae-bracket">&gt;</span>`
        : '';
    return `
    <div class="ae-gap" data-bi="${bi}" data-at="${ri}" title="Add alg here"><span class="ae-gap-plus">+</span></div>
    <div class="ae-row" data-bi="${bi}" data-ri="${ri}">
        <span class="ae-grip" data-drag="row" title="Drag to reorder">${AE_GRIP_SVG}</span>
        <input class="ae-f ae-case" data-bi="${bi}" data-ri="${ri}" data-f="case" value="${caseFull}" placeholder="case" spellcheck="false" />
        ${angle}
        <input class="ae-f ae-notation" data-bi="${bi}" data-ri="${ri}" data-f="notation" value="${_aeEsc(row.notation)}" placeholder="notation" spellcheck="false" />
        <button class="ae-del-alg" data-bi="${bi}" data-ri="${ri}" title="Delete alg">${AE_X_SVG}</button>
    </div>
    <div class="ae-row-err">${_aeRowErrorInner(err)}</div>`;
}

function _aeBlockRowsHtml(bi, block) {
    const rows = block.rows.map((r, ri) => _aeRowHtml(bi, ri, r)).join('');
    // trailing gap so the user can append after the last alg
    return `<div class="ae-rows">${rows}<div class="ae-gap" data-bi="${bi}" data-at="${block.rows.length}" title="Add alg here"><span class="ae-gap-plus">+</span></div></div>`;
}

function _aeBlockHtml(bi, block, withExplanations) {
    const exp = withExplanations ? `
        <input class="ae-f ae-exp" data-bi="${bi}" data-f="angleExp" value="${_aeEsc(block.angleExp)}" placeholder="Angle explanation" />
        <input class="ae-f ae-exp" data-bi="${bi}" data-f="algExp" value="${_aeEsc(block.algExp)}" placeholder="Alg explanation" />` : '';
    return `<div class="ae-block" data-bi="${bi}">${exp}${_aeBlockRowsHtml(bi, block)}</div>`;
}

function algEditRender(content, title) {
    aeTitle = title;
    const sources = _aeSources(title);
    const meta    = _aeSourceMeta();

    // Source tabs (same markup as read mode) live in the shared tab bar.
    const window_ = content.parentElement;
    let tabBar = window_.querySelector('.cluster-tab-bar');
    if (!tabBar) { tabBar = document.createElement('div'); tabBar.className = 'cluster-tab-bar'; window_.insertBefore(tabBar, content); }
    tabBar.style.display = sources.length > 1 ? '' : 'none';
    tabBar.innerHTML = sources.length > 1
        ? `<div class="cluster-tabs">${sources.map(src =>
            `<input type="radio" class="cluster-tab-radio" name="ae-src" id="aetab-${src}" value="${src}"${src === aeSource ? ' checked' : ''}>` +
            `<label for="aetab-${src}" class="cluster-tab-label">${meta[src]?.label ?? src}</label>`).join('')}</div>`
        : '';
    tabBar.querySelectorAll('.cluster-tab-radio').forEach(radio =>
        radio.addEventListener('change', () => { if (radio.checked) _aeSwitchSource(radio.value); }));

    // Body
    let html = `<div class="ae-title">${_aeEsc(title)}</div>`;
    if (_aeGrouped()) {
        // PBL matt — distinction + solution-group cards + add-group.
        html += `<input class="ae-f ae-distinction" data-f="distinction" value="${_aeEsc(aeDraft.distinction)}" placeholder="Distinction help" />`;
        html += aeDraft.groups.map((g, gi) => {
            const isNew   = /^new\d+$/.test(g.id);
            const resetBtn = `<button class="ae-reset" data-gi="${gi}" title="${isNew ? 'Delete group' : 'Reset to default'}">${isNew ? AE_TRASH_SVG : AE_RESET_SVG}</button>`;
            const blocks  = g.blocks.map((b, bi) => _aeBlockHtml(bi, b, true)).join('');
            return `<div class="ae-group" data-gi="${gi}">
                <div class="ae-group-head">
                    <span class="ae-grip" data-drag="group" data-gi="${gi}" title="Drag to reorder">${AE_GRIP_SVG}</span>
                    <input class="ae-f ae-overview" data-gi="${gi}" data-f="overview" value="${_aeEsc(g.overview)}" placeholder="Solution overview" />
                    <input class="ae-f ae-slices" data-gi="${gi}" data-f="slices" value="${_aeEsc(g.slices)}" placeholder="#" />
                    ${resetBtn}
                </div>
                <div class="ae-blocks">${blocks}</div>
            </div>`;
        }).join('');
        html += `<button class="ae-add-group">${AE_PLUS_SVG} Add solution group</button>`;
    } else {
        // Single-block source: OBL flat matt (distinction + explanations) or a
        // sheet source. The whole source has one Reset.
        const isMatt = aeSource === 'matt';
        const reset  = `<button class="ae-reset" data-reset-source="1" title="Reset to default">${AE_RESET_SVG}</button>`;
        const distinction = isMatt
            ? `<input class="ae-f ae-distinction" data-f="distinction" value="${_aeEsc(aeDraft.distinction)}" placeholder="Distinction help" />` : '';
        html += distinction +
            `<div class="ae-group"><div class="ae-group-head"><span class="ae-group-label">Algs</span>${reset}</div>
            <div class="ae-blocks">${_aeBlockHtml(0, aeDraft, isMatt)}</div></div>`;
    }
    content.innerHTML = html;

    // capture undo baseline for this render
    aeSnapshotBeforeEdit = _clone(aeDraft);
    aeTextUndoPushed = false;
}

// Live-update the inline error line that sits directly after a case input's row.
function _aeUpdateRowError(caseInput, row) {
    const errEl = caseInput.closest('.ae-row')?.nextElementSibling;
    if (!errEl || !errEl.classList.contains('ae-row-err')) return;
    const err = validateCaseField(row.caseName + (row.sign || ''), clusterCaseList(aeTitle));
    errEl.innerHTML = _aeRowErrorInner(err);
}

// ── Draft mutation accessors ─────────────────────────────────────────────────

// Resolves the draft block that owns the given element. For matt this is
// (group, block); for a sheet source it's the single implicit block.
function _aeFindBlock(el) {
    if (_aeGrouped()) {
        const gi = +el.closest('.ae-group').dataset.gi;
        const bi = +el.closest('.ae-block, [data-bi]').dataset.bi;
        return aeDraft.groups[gi].blocks[bi];
    }
    return aeDraft; // single-block sources: the draft is the block
}

// ── Interactions (delegated on the content element) ──────────────────────────

function _aeOnInput(e) {
    const f = e.target.closest('.ae-f');
    if (!f) return;
    _aeTextUndoOnce();
    const field = f.dataset.f;

    if (field === 'distinction') { aeDraft.distinction = f.value; _aeAutosave(); return; }
    if (field === 'overview')    { aeDraft.groups[+f.dataset.gi].overview = f.value; _aeAutosave(); return; }
    if (field === 'slices')      { aeDraft.groups[+f.dataset.gi].slices = f.value; _aeAutosave(); return; }
    if (field === 'angleExp' || field === 'algExp') {
        const block = _aeFindBlock(f);
        block[field] = f.value; _aeAutosave(); return;
    }

    // alg row fields
    const block = _aeFindBlock(f);
    const row   = block.rows[+f.dataset.ri];
    if (field === 'angle') {
        if (/[<>]/.test(f.value)) f.value = f.value.replace(/[<>]/g, ''); // forbid brackets
        row.angle = f.value;
    } else if (field === 'notation') {
        row.notation = f.value;
    } else if (field === 'case') {
        const parsed = parseCaseField(f.value, clusterCaseList(aeTitle), _aeHasSign());
        row.caseName = parsed.caseName; row.sign = parsed.sign;
        _aeUpdateRowError(f, row);
    }
    _aeAutosave();
}

function _aeOnClick(e) {
    const gap = e.target.closest('.ae-gap');
    if (gap) { _aeInsertAlg(gap); return; }
    const del = e.target.closest('.ae-del-alg');
    if (del) { _aeDeleteAlg(del); return; }
    const reset = e.target.closest('.ae-reset');
    if (reset) { _aeReset(reset); return; }
    if (e.target.closest('.ae-add-group')) { _aeAddGroup(); return; }
}

function _aeInsertAlg(gap) {
    _aeStructuralUndo();
    const block = _aeFindBlock(gap);
    const at    = +gap.dataset.at;
    // inherit the case from the row below, else the row above; blank if neither
    const ref   = block.rows[at] || block.rows[at - 1];
    block.rows.splice(at, 0, {
        caseName: ref ? ref.caseName : '', sign: ref ? ref.sign : '',
        angle: '', notation: ''
    });
    _aeCommit();
    algEditRender(searchClusterContentEl, aeTitle);
}

function _aeDeleteAlg(btn) {
    const block = _aeFindBlock(btn);
    if (block.rows.length <= 1) return; // keep at least one alg
    _aeStructuralUndo();
    block.rows.splice(+btn.dataset.ri, 1);
    _aeCommit();
    algEditRender(searchClusterContentEl, aeTitle);
}

function _aeReset(btn) {
    _aeStructuralUndo();
    if (btn.dataset.resetSource) {
        // Revert the whole active source (OBL matt or any sheet source).
        const all = loadContentOverrides();
        if (all[aeTitle]) { delete all[aeTitle][aeSource]; if (!Object.keys(all[aeTitle]).length) delete all[aeTitle]; saveContentOverrides(all); }
        _aeLoadDraft();
    } else {
        const gi = +btn.dataset.gi;
        const g  = aeDraft.groups[gi];
        if (/^new\d+$/.test(g.id)) {
            aeDraft.groups.splice(gi, 1); // delete user-added group
        } else {
            const m = /^sg(\d+)$/.exec(g.id);
            const def = defaultMattGroups(aeTitle)[+m[1]];
            aeDraft.groups[gi] = { id: g.id, ...mattGroupToDraft(_clone(def)) };
        }
    }
    _aeCommit();
    algEditRender(searchClusterContentEl, aeTitle);
}

function _aeAddGroup() {
    _aeStructuralUndo();
    const mattOv = loadContentOverrides()[aeTitle]?.matt;
    const id = nextNewGroupId(mattOv);
    aeDraft.groups.push({ id, ...blankMattGroup() });
    _aeCommit();
    algEditRender(searchClusterContentEl, aeTitle);
}

function _aeSwitchSource(src) {
    _aeCommit();
    aeSource = src;
    if (trainerMode === 'obl') oblLastClusterSource = src; else pblLastClusterSource = src;
    aeUndo = []; aeRedo = [];
    _aeLoadDraft();
    algEditRender(searchClusterContentEl, aeTitle);
}

// ── Pointer drag reorder (rows within a block; groups) ───────────────────────

let _aeDrag = null;

function _aeOnPointerDown(e) {
    const handle = e.target.closest('.ae-grip');
    if (!handle) return;
    e.preventDefault();
    const kind = handle.dataset.drag;
    const item = handle.closest(kind === 'group' ? '.ae-group' : '.ae-row');
    if (!item) return;
    _aeStructuralUndo();

    let block = null, row = null;
    if (kind === 'row') {
        block = _aeFindBlock(item);
        row   = block.rows[+item.dataset.ri];
    }
    _aeDrag = { kind, item, container: item.parentElement, block, row };
    item.classList.add('ae-dragging');
    document.addEventListener('pointermove', _aeOnPointerMove);
    document.addEventListener('pointerup', _aeOnPointerUp);
}

function _aeOnPointerMove(e) {
    if (!_aeDrag) return;
    const sel = _aeDrag.kind === 'group' ? '.ae-group:not(.ae-dragging)' : '.ae-row:not(.ae-dragging)';
    const others = [..._aeDrag.container.querySelectorAll(sel)];
    const after = others.find(r => { const b = r.getBoundingClientRect(); return e.clientY < b.top + b.height / 2; });
    if (after) _aeDrag.container.insertBefore(_aeDrag.item, after);
    else       _aeDrag.container.appendChild(_aeDrag.item);
}

function _aeOnPointerUp() {
    if (!_aeDrag) return;
    const drag = _aeDrag;
    drag.item.classList.remove('ae-dragging');
    document.removeEventListener('pointermove', _aeOnPointerMove);
    document.removeEventListener('pointerup', _aeOnPointerUp);
    _aeDrag = null;

    if (drag.kind === 'group') {
        aeDraft.groups = [...searchClusterContentEl.querySelectorAll('.ae-group')]
            .map(el => aeDraft.groups[+el.dataset.gi]);
    } else {
        const block = drag.block;
        const newRows = [...drag.container.querySelectorAll('.ae-row')].map(el => block.rows[+el.dataset.ri]);
        // auto-relabel the dragged row to its new upper neighbour (or lower if first)
        const idx = newRows.indexOf(drag.row);
        const neighbor = newRows[idx - 1] || newRows[idx + 1];
        if (neighbor && neighbor !== drag.row) { drag.row.caseName = neighbor.caseName; drag.row.sign = neighbor.sign; }
        block.rows = newRows;
    }
    _aeCommit();
    algEditRender(searchClusterContentEl, aeTitle);
}

// Wire delegated listeners once (content element is stable).
if (searchClusterContentEl) {
    searchClusterContentEl.addEventListener('input', e => { if (algEditActive()) _aeOnInput(e); });
    searchClusterContentEl.addEventListener('click', e => { if (algEditActive()) _aeOnClick(e); });
    searchClusterContentEl.addEventListener('pointerdown', e => { if (algEditActive()) _aeOnPointerDown(e); });
}
