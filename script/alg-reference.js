import { oblClusters, pblClusters } from '../data/alg-data.js';
import { escapeHtml, trainerMode, usingKarn } from './app.js';
import { getSpe } from './obl-core.js';
import { searchClusterContentEl, searchEditMode, syncSearchClusterToolbar } from './search.js';
import { SquanLib, squan } from './squan.js';
import { _algClusters, UNIT_TAG_SVG, defaultGroupId, effectiveCluster, loadContentOverrides, loadTagAssignments, mattGroupById, mattUnitOrder, nextNewGroupId, saveContentOverrides, tagsForUnit, unitRef } from './tag-assignments.js';
import { getTags } from './tags.js';

export { UNIT_TAG_SVG, effectiveCluster, effectiveMattGroups, loadTagAssignments, mattUnitOrder, saveTagAssignments, tagCaseBases, tagCaseModes, tagUnitState, taggedClusterTitles, toggleUnitTag, unitRef } from './tag-assignments.js';

// ═══════════════════════════════════════════════════════════════════════════
//  ALG REFERENCE
//  Everything behind the alg-reference shown in the search overlay, in four
//  sections below:
//    1. Override + tag-assignment store (this section)
//    2. The alg-reference editor (edit mode)
//    3. Cluster alg-reference rendering (case→cluster lookup, formatters,
//       renderClusterInto)
//
//  User edits to alg-reference content and tag attachments are stored per trainer
//  in localStorage. The shipped cluster data (pblClusters / oblClusters) is never
//  mutated — effectiveCluster() merges overrides on top at render time.
//
//  contentOverrides[title].matt = {
//      order:  ["new1","sg0","sg1", …] | null,   // null = untouched default order
//      groups: { "sg0": {…solution-group…}, "new1": {…} },  // edited defaults + added
//      "distinction-help": "…"                    // optional cluster-level matt edit
//  }
//  contentOverrides[title][sourceKey] = [ {case-name, algs[]}, … ]   // sheet source
//
//  tagAssignments = { [tagId]: ["title|source|unitId", …] }  // single source of truth
//
//  A default solution group has the positional id "sg<index>"; user-added groups
//  get "new<n>". Default groups can be edited or reset, never deleted.
// ═══════════════════════════════════════════════════════════════════════════

// Human-readable label for a tagged unit: a PBL matt group shows its solution
// overview; every whole-source unit ("*") shows that source's display label.
function unitOverview(title, source, unitId) {
    if (trainerMode === 'pbl' && source === 'matt') {
        const g = mattGroupById(title, unitId);
        return g ? (g['solution-overview'] || '(no overview)') : '(removed group)';
    }
    const meta = (trainerMode === 'obl' ? OBL_SOURCE_META : PBL_SOURCE_META)[source];
    return meta?.label || source;
}

// Groups a tag's assignments by cluster, resolving each ref to a display label.
//   [{ title, entries: [{ ref, source, unitId, overview }] }]
export function tagUnitsByCluster(tagId) {
    const refs = loadTagAssignments()[tagId] || [];
    const byTitle = new Map();
    for (const ref of refs) {
        const [title, source, unitId] = ref.split('|');
        if (!_algClusters()[title]) continue; // stale ref (cluster gone)
        if (!byTitle.has(title)) byTitle.set(title, []);
        byTitle.get(title).push({ ref, source, unitId, overview: unitOverview(title, source, unitId) });
    }
    return [...byTitle.entries()].map(([title, entries]) => ({ title, entries }));
}

// Inner HTML of a unit's tag control: the chip list (collapses to dots on
// overflow via the .dots class) + the fixed add button on the right.
export function unitTagsInner(ref) {
    const tags = getTags();
    const chips = tagsForUnit(ref).map(id => {
        const t = tags.find(x => x.id === id);
        return t ? `<span class="unit-tag-chip" style="--tag-color:${escapeHtml(t.color)}" data-tip="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span>` : '';
    }).join('');
    return `<span class="unit-tag-list">${chips}</span>` +
        `<button class="unit-tag-add" data-ref="${escapeHtml(ref)}" data-tip="Tags">${UNIT_TAG_SVG}</button>`;
}

// Full tag control for a unit (emitted by the read formatters).
function unitTagsHtml(ref) {
    return `<span class="unit-tags" data-ref="${escapeHtml(ref)}">${unitTagsInner(ref)}</span>`;
}

// ── Editing helpers ──────────────────────────────────────────────────────────

function _clone(x) { return JSON.parse(JSON.stringify(x)); }

// Recursively sort object keys so equality ignores key order (the editor may
// emit fields in a different order than the shipped data).
function _canon(x) {
    if (Array.isArray(x)) return x.map(_canon);
    if (x && typeof x === 'object') {
        const o = {};
        for (const k of Object.keys(x).sort()) o[k] = _canon(x[k]);
        return o;
    }
    return x;
}
function _deepEqual(a, b) { return JSON.stringify(_canon(a)) === JSON.stringify(_canon(b)); }

function defaultMattGroups(title)        { return _algClusters()[title]?.matt?.['solution-groups'] || []; }
function defaultSheetSource(title, src)  { return _algClusters()[title]?.[src] || []; }
function clusterCaseList(title)          { return _algClusters()[title]?.['case-list'] || []; }

// case-name field (e.g. "Al/Al+") must end with +/- and its base must be a
// case in the cluster's case-list. Returns an error string, or null if valid.
// ":" is an accepted shorthand for a solved face: "Al:" ≡ "Al/-", ":Al" ≡ "-/A",
// and a kept slash "Al/:" ≡ "Al/-". Returns every canonical spelling to test.
function _caseFormCandidates(base) {
    const out = [base, base.replace(/:/g, '-')];
    if (base.startsWith(':')) out.push('-/' + base.slice(1));
    if (base.endsWith(':'))   out.push(base.slice(0, -1) + '/-');
    return out;
}

function _caseInList(base, caseList) {
    return _caseFormCandidates(base).some(c => caseList.includes(c));
}

// Splits a case field into { caseName, sign }. OBL has no barflip signs, so the
// whole field is the case name. For PBL, the trailing "-" of names like "Gal/-"
// belongs to the name, so a trailing +/- is only treated as a sign when the
// remainder (not the whole field) is a known case.
function parseCaseField(field, caseList, hasSign = true) {
    const v = (field || '').trim();
    if (!hasSign) return { caseName: v, sign: '' };
    if (_caseInList(v, caseList)) return { caseName: v, sign: '' };
    if (/[+-]$/.test(v)) return { caseName: v.slice(0, -1), sign: v.slice(-1) };
    return { caseName: v, sign: '' };
}

// ── Editor-friendly draft form ───────────────────────────────────────────────
// A "block" = { angleExp, algExp, rows:[{caseName, sign, angle, notation}] }.
// matt group = { overview, slices, blocks:[…] }; a sheet source is one block.

function _algBlockToRows(ab) {
    return (ab.cases || []).flatMap(c =>
        (c.algs || []).map(a => ({
            caseName: c['case-name'] || '', sign: a.sign || '',
            angle:    a.angle || '',        notation: a.notation || ''
        }))
    );
}

// Regroup a flat row list into the canonical cases[] shape (consecutive rows
// with the same case-name merge; the first alg of each case carries the name).
// `serialize(row)` produces each alg in the shape this source expects.
function _rowsToCases(rows, serialize) {
    const cases = [];
    for (const r of rows) {
        const last = cases[cases.length - 1];
        const alg  = serialize(r);
        if (last && last['case-name'] === r.caseName) last.algs.push(alg);
        else cases.push({ 'case-name': r.caseName, algs: [alg] });
    }
    return cases;
}

// Per-(trainer, source) alg serialization. PBL keeps {sign, angle, notation};
// OBL matt drops sign; OBL sheet sources are plain notation strings.
function _algSerializer(source) {
    if (trainerMode === 'obl' && source !== 'matt') return r => r.notation;
    if (trainerMode === 'obl')                      return r => ({ angle: r.angle, notation: r.notation });
    return r => ({ sign: r.sign, angle: r.angle, notation: r.notation });
}

function mattGroupToDraft(group) {
    return {
        overview: group['solution-overview'] || '',
        slices:   group['solution-slicecount'] ?? '',
        blocks: (group['alg-blocks'] || []).map(ab => ({
            angleExp: ab['angle-explanation'] || '',
            algExp:   ab['alg-explanation'] || '',
            rows:     _algBlockToRows(ab),
        })),
    };
}

function draftToMattGroup(draft) {
    const g = {
        'solution-overview': draft.overview,
        'alg-blocks': draft.blocks.map(b => ({
            'angle-explanation': b.angleExp,
            'alg-explanation':   b.algExp,
            cases: _rowsToCases(b.rows, _algSerializer('matt')),
        })),
    };
    const slices = draft.slices;
    if (slices !== '' && slices != null) {
        const n = Number(slices);
        g['solution-slicecount'] = Number.isFinite(n) ? n : slices;
    }
    return g;
}

// Build the full editable draft for a cluster's matt section.
//   { distinction, groups: [{ id, ...mattGroupToDraft }] }
function buildMattDraft(title) {
    const defGroups = defaultMattGroups(title);
    const ov        = loadContentOverrides()[title]?.matt;
    const order     = ov?.order || defGroups.map((_, i) => defaultGroupId(i));
    const groups = order.map(id => {
        let group;
        if (ov?.groups && id in ov.groups) group = ov.groups[id];
        else { const m = /^sg(\d+)$/.exec(id); group = m ? defGroups[+m[1]] : null; }
        return group ? { id, ...mattGroupToDraft(_clone(group)) } : null;
    }).filter(Boolean);
    return {
        distinction: ov && 'distinction-help' in ov
            ? ov['distinction-help']
            : (_algClusters()[title]?.matt?.['distinction-help'] || ''),
        groups,
    };
}

// Persist a matt draft as a minimal override (unchanged default groups omitted).
function commitMattDraft(title, draft) {
    const all       = loadContentOverrides();
    const defGroups = defaultMattGroups(title);
    const groups = {};
    for (const d of draft.groups) {
        const g = draftToMattGroup(d);
        const m = /^sg(\d+)$/.exec(d.id);
        if (m && _deepEqual(g, defGroups[+m[1]])) continue; // unchanged default
        groups[d.id] = g;
    }
    const defaultOrder = defGroups.map((_, i) => defaultGroupId(i));
    const order        = draft.groups.map(d => d.id);
    const defDist      = _algClusters()[title]?.matt?.['distinction-help'] || '';

    const matt = {};
    if (!_deepEqual(order, defaultOrder)) matt.order = order;
    if (Object.keys(groups).length)       matt.groups = groups;
    if (draft.distinction !== defDist)     matt['distinction-help'] = draft.distinction;

    if (!all[title]) all[title] = {};
    if (Object.keys(matt).length) all[title].matt = matt;
    else delete all[title].matt;
    if (!Object.keys(all[title]).length) delete all[title];
    saveContentOverrides(all);
}

// A "single-block" source — i.e. anything that isn't PBL's grouped matt:
// OBL's flat matt (distinction + one angle/alg explanation + cases), and every
// sheet source (PBL objects or OBL plain-string algs). Draft shape:
//   { distinction, angleExp, algExp, rows:[{caseName, sign, angle, notation}] }
function buildSingleBlockDraft(title, source) {
    if (source === 'matt') { // OBL flat matt
        const matt = loadContentOverrides()[title]?.matt || _algClusters()[title]?.matt || {};
        return {
            distinction: matt['distinction-help'] || '',
            angleExp:    matt['angle-explanation'] || '',
            algExp:      matt['alg-explanation'] || '',
            rows: (matt.cases || []).flatMap(c => (c.algs || []).map(a => ({
                caseName: c['case-name'] || '', sign: '', angle: a.angle || '', notation: a.notation || ''
            }))),
        };
    }
    const arr = loadContentOverrides()[title]?.[source] || defaultSheetSource(title, source);
    const obl = trainerMode === 'obl';
    return {
        distinction: '', angleExp: '', algExp: '',
        rows: (arr || []).flatMap(c => (c.algs || []).map(a => ({
            caseName: c['case-name'] || '',
            sign:     obl ? '' : (a.sign || ''),
            angle:    obl ? '' : (a.angle || ''),
            notation: typeof a === 'string' ? a : (a?.notation || ''),
        }))),
    };
}

function commitSingleBlockDraft(title, source, draft) {
    const all = loadContentOverrides();
    if (source === 'matt') { // OBL flat matt — store/clear the whole matt object
        const matt = {
            'distinction-help':  draft.distinction,
            'angle-explanation': draft.angleExp,
            'alg-explanation':   draft.algExp,
            cases: _rowsToCases(draft.rows, _algSerializer('matt')),
        };
        if (_deepEqual(matt, _algClusters()[title]?.matt)) {
            if (all[title]) { delete all[title].matt; if (!Object.keys(all[title]).length) delete all[title]; }
        } else { if (!all[title]) all[title] = {}; all[title].matt = matt; }
    } else {
        const arr = _rowsToCases(draft.rows, _algSerializer(source));
        if (_deepEqual(arr, defaultSheetSource(title, source))) {
            if (all[title]) { delete all[title][source]; if (!Object.keys(all[title]).length) delete all[title]; }
        } else { if (!all[title]) all[title] = {}; all[title][source] = arr; }
    }
    saveContentOverrides(all);
}

// A blank solution group: one empty block, no algs (the user adds them via the
// hover-+ insertion gap). Nothing is autofilled.
function blankMattGroup() {
    return { overview: '', slices: '', blocks: [{ angleExp: '', algExp: '', rows: [] }] };
}


// ═══════════════════════════════════════════════════════════════════════════
//  ALG-REFERENCE EDITOR
//  Edit-mode rendering + interactions for the alg reference shown in the search
//  extension. Reads/writes overrides via the override store above; the shipped
//  data is never touched. matt is edited as solution-group cards; sheet sources (derpy,
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

let aeTitle  = null;
let aeSource = null;
let aeDraft  = null;

let aeUndo = [], aeRedo = [];
let aeEnterSnapshot = null;      // cluster override JSON captured on entering edit mode
let aeSnapshotBeforeEdit = null; // draft state captured at each render
let aeTextUndoPushed = false;    // one undo entry per render→text-edit burst
export function algEditActive() { return searchEditMode && aeDraft != null; }

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

export function algEditBegin(title) {
    aeTitle  = title;
    const sources = _aeSources(title);
    const last = trainerMode === 'obl' ? oblLastClusterSource : pblLastClusterSource;
    aeSource = (last && sources.includes(last)) ? last : sources[0];
    aeUndo = []; aeRedo = [];
    // Snapshot the cluster's whole override (all sources) to detect real changes.
    aeEnterSnapshot = JSON.stringify(loadContentOverrides()[title] ?? null);
    _aeLoadDraft();
}

function _aeLoadDraft() {
    aeDraft = _aeGrouped() ? buildMattDraft(aeTitle) : buildSingleBlockDraft(aeTitle, aeSource);
}

function _aeCommit() {
    if (_aeGrouped()) commitMattDraft(aeTitle, aeDraft);
    else              commitSingleBlockDraft(aeTitle, aeSource, aeDraft);
}

function _aeSyncDirtyState() {
    if (typeof syncSearchClusterToolbar === 'function') syncSearchClusterToolbar();
}

// Changes are reflected in the override store during the live edit session so
// source switching and rendering continue to use one data path. The entry
// snapshot is the transaction boundary: Save advances it; Back restores it.
function _aeAutosave() {
    _aeCommit();
    _aeSyncDirtyState();
}

export function algEditDirty() {
    if (!aeDraft || !aeTitle) return false;
    const current = loadContentOverrides()[aeTitle] ?? null;
    const saved   = JSON.parse(aeEnterSnapshot);
    return !_deepEqual(current, saved);
}

export function algEditSave() {
    if (!aeDraft) return false;
    _aeCommit();
    const dirty = algEditDirty();
    aeEnterSnapshot = JSON.stringify(loadContentOverrides()[aeTitle] ?? null);
    _aeSyncDirtyState();
    return dirty;
}

function _aeTearDown() {
    aeDraft = null;
    aeTitle = aeSource = null;
    aeUndo = []; aeRedo = [];
    aeEnterSnapshot = null;
}

// Leave edit mode without saving changes made since the latest Save click.
export function algEditCancel() {
    if (aeDraft && aeTitle) {
        const all = loadContentOverrides();
        const saved = JSON.parse(aeEnterSnapshot);
        if (saved == null) delete all[aeTitle];
        else               all[aeTitle] = saved;
        saveContentOverrides(all);
    }
    _aeTearDown();
}

// ── Undo / redo ──────────────────────────────────────────────────────────────

function _aePushUndo(state) { aeUndo.push(state); aeRedo = []; if (aeUndo.length > 100) aeUndo.shift(); }
function _aeStructuralUndo() { _aePushUndo(_clone(aeDraft)); }
function _aeTextUndoOnce() { if (!aeTextUndoPushed) { _aePushUndo(aeSnapshotBeforeEdit); aeTextUndoPushed = true; } }

export function algEditUndo() {
    if (!aeUndo.length) return;
    aeRedo.push(_clone(aeDraft));
    aeDraft = aeUndo.pop();
    _aeCommit();
    algEditRender(searchClusterContentEl, aeTitle);
}
export function algEditRedo() {
    if (!aeRedo.length) return;
    aeUndo.push(_clone(aeDraft));
    aeDraft = aeRedo.pop();
    _aeCommit();
    algEditRender(searchClusterContentEl, aeTitle);
}

// ── Rendering ────────────────────────────────────────────────────────────────

function _aeEsc(s) { return escapeHtml(String(s ?? '')); }

function _aeRowHtml(bi, ri, row) {
    const caseFull = _aeEsc(row.caseName + (row.sign || ''));
    const angle = _aeHasAngle()
        ? `<span class="ae-bracket">&lt;</span><input class="ae-f ae-angle" data-bi="${bi}" data-ri="${ri}" data-f="angle" value="${_aeEsc(row.angle)}" placeholder="angle" spellcheck="false" /><span class="ae-bracket">&gt;</span>`
        : '';
    return `
    <div class="ae-gap" data-bi="${bi}" data-at="${ri}" data-tip="Add alg here"><span class="ae-gap-plus">+</span></div>
    <div class="ae-row" data-bi="${bi}" data-ri="${ri}">
        <span class="ae-grip" data-drag="row" data-tip="Drag to reorder">${AE_GRIP_SVG}</span>
        <input class="ae-f ae-case" data-bi="${bi}" data-ri="${ri}" data-f="case" value="${caseFull}" placeholder="case" spellcheck="false" />
        ${angle}
        <input class="ae-f ae-notation" data-bi="${bi}" data-ri="${ri}" data-f="notation" value="${_aeEsc(row.notation)}" placeholder="notation" spellcheck="false" />
        <button class="ae-del-alg" data-bi="${bi}" data-ri="${ri}" data-tip="Delete alg">${AE_X_SVG}</button>
    </div>`;
}

function _aeBlockRowsHtml(bi, block) {
    const rows = block.rows.map((r, ri) => _aeRowHtml(bi, ri, r)).join('');
    // trailing gap so the user can append after the last alg
    return `<div class="ae-rows">${rows}<div class="ae-gap" data-bi="${bi}" data-at="${block.rows.length}" data-tip="Add alg here"><span class="ae-gap-plus">+</span></div></div>`;
}

function _aeBlockHtml(bi, block, withExplanations) {
    const exp = withExplanations ? `
        <input class="ae-f ae-exp" data-bi="${bi}" data-f="angleExp" value="${_aeEsc(block.angleExp)}" placeholder="Angle explanation" />
        <input class="ae-f ae-exp" data-bi="${bi}" data-f="algExp" value="${_aeEsc(block.algExp)}" placeholder="Alg explanation" />` : '';
    return `<div class="ae-block" data-bi="${bi}">${exp}${_aeBlockRowsHtml(bi, block)}</div>`;
}

// Mount the source-tab bar at the end of the toolbar row so the view switcher
// sits at the right edge, opposite the back/edit/save/undo/redo group.
function _aeMountTabBar(window_, tabBar) {
    const toolbar = window_.querySelector('.search-cluster-toolbar');
    if (toolbar) toolbar.appendChild(tabBar);
    else window_.insertBefore(tabBar, window_.querySelector('.cluster-text, #search-cluster-content'));
}

export function algEditRender(content, title) {
    aeTitle = title;
    const sources = _aeSources(title);
    const meta    = _aeSourceMeta();

    // Source tabs (same markup as read mode) live in the shared tab bar.
    const window_ = content.parentElement;
    let tabBar = window_.querySelector('.cluster-tab-bar');
    if (!tabBar) { tabBar = document.createElement('div'); tabBar.className = 'cluster-tab-bar'; _aeMountTabBar(window_, tabBar); }
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
            const resetBtn = `<button class="ae-reset" data-gi="${gi}" data-tip="${isNew ? 'Delete group' : 'Reset to default'}">${isNew ? AE_TRASH_SVG : AE_RESET_SVG}</button>`;
            const blocks  = g.blocks.map((b, bi) => _aeBlockHtml(bi, b, true)).join('');
            return `<div class="ae-group" data-gi="${gi}">
                <div class="ae-group-head">
                    <span class="ae-grip" data-drag="group" data-gi="${gi}" data-tip="Drag to reorder">${AE_GRIP_SVG}</span>
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
        const reset  = `<button class="ae-reset" data-reset-source="1" data-tip="Reset to default">${AE_RESET_SVG}</button>`;
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
    _aeSyncDirtyState();
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

// Wire delegated listeners once (content element is stable). Resolve the element
// directly — searchClusterContentEl is owned by search.js, which loads after this
// file, so referencing it here at load time would be a temporal-dead-zone error.
{
    const aeContentEl = document.getElementById('search-cluster-content');
    if (aeContentEl) {
        aeContentEl.addEventListener('input',       e => { if (algEditActive()) _aeOnInput(e); });
        aeContentEl.addEventListener('click',       e => { if (algEditActive()) _aeOnClick(e); });
        aeContentEl.addEventListener('pointerdown', e => { if (algEditActive()) _aeOnPointerDown(e); });
    }
}


// ═══════════════════════════════════════════════════════════════════════════
//  CLUSTER ALG-REFERENCE RENDERING
//  Case → cluster lookup, the per-source HTML formatters, and the cluster
//  renderers for both trainers. renderClusterInto() is the shared entry point
//  used by the search overlay to draw a cluster's alg reference.
// ═══════════════════════════════════════════════════════════════════════════

// ─── CLUSTER DATA (PBL) ──────────────────────────────────────────────────────
// pblClusters is declared as const in pbl-data.js. renderClusterInto() (below)
// drives rendering; this section holds PBL-specific case→cluster lookup
// and the PBL HTML formatter (pblRenderCluster).

// ── PBL cluster data ──────────────────────────────────────────────────────
// pblClusters is declared as const in pbl-data.js.

// ── PBL case lookup ───────────────────────────────────────────────────────

export function pblFindCluster(caseName) {
    const clean = caseName.replace(/(?<!\/)[+-]$/, ""); // strip sign, keep a solved-face "-"
    for (const [title, data] of Object.entries(pblClusters)) {
        if (data["case-list"].includes(clean)) return title;
    }
    return null;
}

// ── PBL HTML formatter ────────────────────────────────────────────────────

function pblHasAlgData(algs) {
    return algs && algs.some(a => a.angle?.trim() || a.notation?.trim());
}

function pblNab(text) { // normalize angle brackets for safe HTML insertion
    return text.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function pblTextWidth(text, font) {
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');
    ctx.font     = font || getComputedStyle(document.body).font;
    return ctx.measureText(text).width;
}

// ── PBL source formatters ─────────────────────────────────────────────────

// Formats the Matt section only (no title, no tabs).
function pblFormatMatt(cluster, key, meta, title) {
    const lines = [];
    lines.push(`<span class="section-label"><b><a href="${meta.url}" target="blank">${meta.linkText}</a></b></span>`);

    if (cluster.matt?.["distinction-help"]?.trim())
        lines.push(`<span style="text-indent:2.5em;">${pblNab(cluster.matt["distinction-help"])}</span>`);

    const order = mattUnitOrder(title); // solution-group ids, aligned with the array below
    const groups = cluster.matt?.["solution-groups"] || [];
    for (let gi = 0; gi < groups.length; gi++) {
        const sg = groups[gi];
        const hasContent =
            sg["solution-overview"]?.trim() ||
            sg["alg-blocks"]?.some(ab =>
                ab["alg-explanation"]?.trim() ||
                ab["angle-explanation"]?.trim() ||
                ab.cases?.some(c => pblHasAlgData(c.algs))
            );
        if (!hasContent) continue;
        lines.push("");
        // Solution-overview line with the per-group tag control at its end
        // (matt's smallest unit).
        const slices  = sg["solution-slicecount"] ? ` (${sg["solution-slicecount"]})` : "";
        const ovText  = sg["solution-overview"]?.trim() ? `<b>${pblNab(sg["solution-overview"])}${slices}</b>` : "";
        const tagsRef = unitRef(title, 'matt', order[gi] ?? 'sg' + gi);
        lines.push(`<span class="sol-overview unit-head">${ovText}${unitTagsHtml(tagsRef)}</span>`);

        let lastAngleExplanation;
        for (const ab of sg["alg-blocks"] || []) {
            let angleExplanation = ab["angle-explanation"];
            if (angleExplanation?.trim() && angleExplanation !== lastAngleExplanation) {
                lines.push(`<span class="explanations">${pblNab(angleExplanation)}</span>`);
                lastAngleExplanation = angleExplanation.trim();
            }
            if (ab["alg-explanation"]?.trim())   lines.push(`<span class="explanations">${pblNab(ab["alg-explanation"])}</span>`);
            for (const c of ab.cases || []) {
                if (!pblHasAlgData(c.algs)) continue;
                for (let i = 0; i < c.algs.length; i++) {
                    const alg = c.algs[i];
                    if (!alg.angle?.trim() && !alg.notation?.trim()) continue;
                    const angle    = alg.angle?.trim() ? `&lt;${alg.angle}&gt; ` : "";
                    const notation = usingKarn ? alg.notation : squan.unkarnify(alg.notation);
                    const indent   = i > 0 ? pblTextWidth(c["case-name"] + alg.sign + " ", "11pt Arial") : 0;
                    lines.push(
                        `<span class="matt-algs" style="margin-left:calc(5em + ${indent}px);">` +
                        `${i === 0 ? c["case-name"] + alg.sign + " " : ""}${angle}` +
                        `<span style="font-family:monospace">${notation}</span></span>`
                    );
                }
            }
        }
    }
    if (lines.length === 1)
        lines.push(`<span style="opacity:0.4;font-style:italic;">No algs available.</span>`);
    return lines.join("");
}

// Formats a generic sheet source (Derpy format: [{case-name, algs:[{sign,angle,notation}]}]).
// All non-Matt sources are assumed to use this shape.
export function pblFormatSheet(cluster, key, meta, title) {
    const sheetData = cluster[key];
    const lines = [];
    const linkHtml = meta.url
        ? `<b><a href="${meta.url}" target="blank">${meta.linkText}</a></b>`
        : `<b>${meta.label}</b>`;
    lines.push(`<span class="section-label unit-head">${linkHtml}${unitTagsHtml(unitRef(title, key, '*'))}</span>`);
    const filled = (sheetData || []).filter(c => pblHasAlgData(c.algs));
    if (!filled.length) {
        lines.push(`<span style="opacity:0.4;font-style:italic;">No algs available.</span>`);
        return lines.join("");
    }
    for (const c of filled) {
        for (let i = 0; i < c.algs.length; i++) {
            const alg = c.algs[i];
            if (!alg.angle?.trim() && !alg.notation?.trim()) continue;
            const angle    = alg.angle?.trim() ? `&lt;${alg.angle}&gt; ` : "";
            const notation = usingKarn ? alg.notation : squan.unkarnify(alg.notation);
            const indent   = i > 0 ? pblTextWidth(c["case-name"] + (alg.sign || "") + " ", "11pt Arial") : 0;
            lines.push(
                `<span class="pure-algs" style="margin-left:calc(2.5em + ${indent}px);">` +
                `${i === 0 ? c["case-name"] + (alg.sign || "") + " " : ""}${angle}` +
                `<span style="font-family:monospace">${notation}</span></span>`
            );
        }
    }
    return lines.join("");
}

let pblLastClusterSource = null;

export const PBL_SOURCE_META = {
    matt:  { label: 'Matt',  linkText: "Matt's PBL Doc",    url: 'https://docs.google.com/document/d/1bLCZGcQn4Or9uZZWK8Z4cdg8AkP2l7Ljm5xwEGH97BI/edit', formatter: pblFormatMatt  },
    derpy: { label: 'Derpy', linkText: "Derpy's PBL Sheet", url: 'https://docs.google.com/spreadsheets/d/1VQNYNwdOLqqBkacHcfYtEBst22FOVhH9EAhTOYOZTgo/edit', formatter: pblFormatSheet },
    jlminx: { label: 'JLMinx', linkText: "JL Minx's PBL Sheet", url: 'https://docs.google.com/spreadsheets/d/10yJdudCtT-zIt7YVjhgPv4VfOuqXHa3u1fxYhaBPP8s/edit', formatter: pblFormatSheet },
};

// ── pblRenderCluster ──────────────────────────────────────────────────────
// Renders title + source tabs + body into the given `content` element.
// Called on open (activeSource = sources[0]) and on tab switch.

function pblRenderCluster(cluster, title, sources, activeSource, content, onResize = () => {}) {
    const window_ = content.parentElement;

    // Build or reuse the tab bar that sits outside the scroll container.
    let tabBar = window_.querySelector('.cluster-tab-bar');
    if (!tabBar) {
        tabBar = document.createElement('div');
        tabBar.className = 'cluster-tab-bar';
        _aeMountTabBar(window_, tabBar);
    }
    tabBar.style.display = sources.length > 1 ? '' : 'none';
    tabBar.innerHTML = sources.length > 1
        ? `<div class="cluster-tabs">${
              sources.map(src =>
                  `<input type="radio" class="cluster-tab-radio" name="cluster-src" id="ctab-${src}" value="${src}"${src === activeSource ? ' checked' : ''}>` +
                  `<label for="ctab-${src}" class="cluster-tab-label">${PBL_SOURCE_META[src]?.label ?? src}</label>`
              ).join('')
          }</div>`
        : '';

    content.innerHTML =
        `<span class="cluster-title">${title}${cluster["optimal-slicecount"] ? " (" + cluster["optimal-slicecount"] + ")" : ""}</span>` +
        `<div id="cluster-source-content"></div>`;

    function showSource(src) {
        pblLastClusterSource = src;
        const el = content.querySelector('#cluster-source-content');
        const meta = PBL_SOURCE_META[src] ?? { label: src.charAt(0).toUpperCase() + src.slice(1), linkText: src, url: '', formatter: pblFormatSheet };
        el.innerHTML = meta.formatter(cluster, src, meta, title);
    }

    showSource(activeSource);

    tabBar.querySelectorAll('.cluster-tab-radio').forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) { showSource(radio.value); onResize?.(content); }
        });
    });
}


// ─── CLUSTER DATA (OBL) ──────────────────────────────────────────────────────
// oblClusters is declared as const in obl-data.js.

// ── OBL case → cluster lookup ─────────────────────────────────────────────

export function oblFindCluster(caseName) {
    try {
        caseName = getSpe(caseName)[0];
    } catch (e) {}
    // specific name
    let [u, d] = caseName.split("/");
    caseName = [SquanLib.NAMING[u], SquanLib.NAMING[d]].join("/");
    for (const [title, data] of Object.entries(oblClusters)) {
        if (data["case-list"].includes(caseName)) return title;
    }
    return null;
}

// ── OBL HTML formatter ────────────────────────────────────────────────────
// Structural differences vs pblFormatCluster:
//   • matt is flat: distinction-help / angle-explanation / alg-explanation / cases[]
//     (no solution-groups or alg-blocks nesting)
//   • matt.cases[].algs are {angle, notation} objects (no "sign" field)
//   • derpy[].algs are plain notation strings (not objects)

function oblHasAlgData(algs) {
    if (!algs || !algs.length) return false;
    // algs may be strings (derpy) or objects (matt) — check both shapes
    return algs.some(a =>
        typeof a === "string" ? a.trim() : (a.angle?.trim() || a.notation?.trim())
    );
}

// ── OBL source formatters ─────────────────────────────────────────────────

// Formats the Matt section only (no title, no tabs).
function oblFormatMatt(cluster, key, meta, title) {
    const lines = [];
    // OBL matt is one whole unit — tag control at the end of the source link.
    lines.push(`<span class="section-label unit-head"><b><a href="${meta.url}" target="blank">${meta.linkText}</a></b>${unitTagsHtml(unitRef(title, 'matt', '*'))}</span>`);

    const matt = cluster.matt;
    if (matt?.["distinction-help"]?.trim())
        lines.push(`<span style="text-indent:2.5em;">${pblNab(matt["distinction-help"])}</span>`);
    if (matt?.["angle-explanation"]?.trim())
        lines.push(`<span class="explanations">${pblNab(matt["angle-explanation"])}</span>`);
    if (matt?.["alg-explanation"]?.trim())
        lines.push(`<span class="explanations">${pblNab(matt["alg-explanation"])}</span>`);

    for (const c of matt?.cases || []) {
        if (!oblHasAlgData(c.algs)) continue;
        for (let i = 0; i < c.algs.length; i++) {
            const alg = c.algs[i];
            if (!alg.angle?.trim() && !alg.notation?.trim()) continue;
            const angle    = alg.angle?.trim() ? `&lt;${alg.angle}&gt; ` : "";
            const notation = usingKarn ? alg.notation : squan.unkarnify(alg.notation);
            const indent   = i > 0 ? pblTextWidth(c["case-name"] + " ", "11pt Arial") : 0;
            lines.push(
                `<span class="matt-algs" style="margin-left:calc(5em + ${indent}px);">` +
                `${i === 0 ? c["case-name"] + " " : ""}${angle}` +
                `<span style="font-family:monospace">${notation}</span></span>`
            );
        }
    }
    if (lines.length === 1)
        lines.push(`<span style="opacity:0.4;font-style:italic;">No algs available.</span>`);
    return lines.join("");
}

// Formats a generic sheet source (Derpy format: [{case-name, algs:[string]}]).
// All non-Matt OBL sources are assumed to use plain notation strings.
export function oblFormatSheet(cluster, key, meta, title) {
    const sheetData = cluster[key];
    const lines = [];
    const linkHtml = meta.url
        ? `<b><a href="${meta.url}" target="blank">${meta.linkText}</a></b>`
        : `<b>${meta.label}</b>`;
    lines.push(`<span class="section-label unit-head">${linkHtml}${unitTagsHtml(unitRef(title, key, '*'))}</span>`);
    const filled = (sheetData || []).filter(c => oblHasAlgData(c.algs));
    if (!filled.length) {
        lines.push(`<span style="opacity:0.4;font-style:italic;">No algs available.</span>`);
        return lines.join("");
    }
    for (const c of filled) {
        for (let i = 0; i < c.algs.length; i++) {
            const algStr = c.algs[i];
            if (!algStr?.trim()) continue;
            const notation = usingKarn ? algStr : squan.unkarnify(algStr);
            const indent   = i > 0 ? pblTextWidth(c["case-name"] + " ", "11pt Arial") : 0;
            lines.push(
                `<span class="pure-algs" style="margin-left:calc(2.5em + ${indent}px);">` +
                `${i === 0 ? c["case-name"] + " " : ""}` +
                `<span style="font-family:monospace">${notation}</span></span>`
            );
        }
    }
    return lines.join("");
}

let oblLastClusterSource = null;

export const OBL_SOURCE_META = {
    matt:  { label: 'Matt',  linkText: "Matt's OBL Doc",    url: 'https://docs.google.com/spreadsheets/d/172Vy9q4WNEvmI2FHkH96XzfXJHdTqeSWBMiANhWbXYA/edit', formatter: oblFormatMatt  },
    derpy: { label: 'Derpy', linkText: "Derpy's OBL Sheet", url: 'https://docs.google.com/spreadsheets/d/1BZQxg11RD829O0tKagGVC65b3s57Hd7Y0GplDCR7--w/edit', formatter: oblFormatSheet },
};

// ── oblRenderCluster ──────────────────────────────────────────────────────
// Renders title + source tabs + body into the given `content` element.

function oblRenderCluster(cluster, title, sources, activeSource, content, onResize = () => {}) {
    const window_ = content.parentElement;

    // Build or reuse the tab bar that sits outside the scroll container.
    let tabBar = window_.querySelector('.cluster-tab-bar');
    if (!tabBar) {
        tabBar = document.createElement('div');
        tabBar.className = 'cluster-tab-bar';
        _aeMountTabBar(window_, tabBar);
    }
    tabBar.style.display = sources.length > 1 ? '' : 'none';
    tabBar.innerHTML = sources.length > 1
        ? `<div class="cluster-tabs">${
              sources.map(src =>
                  `<input type="radio" class="cluster-tab-radio" name="cluster-src" id="ctab-${src}" value="${src}"${src === activeSource ? ' checked' : ''}>` +
                  `<label for="ctab-${src}" class="cluster-tab-label">${OBL_SOURCE_META[src]?.label ?? src}</label>`
              ).join('')
          }</div>`
        : '';

    content.innerHTML =
        `<span class="cluster-title">${title}${cluster["optimal-slicecount"] ? " (" + cluster["optimal-slicecount"] + ")" : ""}</span>` +
        `<div id="cluster-source-content"></div>`;

    function showSource(src) {
        oblLastClusterSource = src;
        const el = content.querySelector('#cluster-source-content');
        const meta = OBL_SOURCE_META[src] ?? { label: src.charAt(0).toUpperCase() + src.slice(1), linkText: src, url: '', formatter: oblFormatSheet };
        el.innerHTML = meta.formatter(cluster, src, meta, title);
    }

    showSource(activeSource);

    tabBar.querySelectorAll('.cluster-tab-radio').forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) { showSource(radio.value); onResize?.(content); }
        });
    });
}



// Renders a cluster's alg reference for `title` into an arbitrary `content`
// element. `onResize` is the callback the source tabs use to re-fit.
// Returns true if the cluster existed and was rendered.
export function renderClusterInto(content, title, onResize = () => {}) {
    const clusters = trainerMode === 'pbl' ? pblClusters : oblClusters;
    if (!clusters || !clusters[title]) return false;
    const cluster  = effectiveCluster(title); // shipped data merged with user overrides

    const SKIP       = new Set(['case-list', 'optimal-slicecount']);
    const sources    = Object.keys(cluster).filter(k => !SKIP.has(k));
    const lastSource = trainerMode === 'pbl' ? pblLastClusterSource : oblLastClusterSource;
    const active     = (lastSource && sources.includes(lastSource)) ? lastSource : sources[0] ?? 'matt';

    content.scrollTop = 0;
    if (trainerMode === 'pbl') pblRenderCluster(cluster, title, sources, active, content, onResize);
    else                       oblRenderCluster(cluster, title, sources, active, content, onResize);
    return true;
}
