import { oblClusters, pblClusters } from '../data/alg-data.js';
import { trainerMode } from './app.js';

const pblStorage = {
    getItem:    k      => localStorage.getItem(k + 'PBL'),
    setItem:    (k, v) => localStorage.setItem(k + 'PBL', v),
};

const oblStorage = {
    getItem:  k      => localStorage.getItem(k + 'OBL'),
    setItem:  (k, v) => localStorage.setItem(k + 'OBL', v),
};

export function _algStore()   { return trainerMode === 'obl' ? oblStorage  : pblStorage; }
export function _algClusters() { return trainerMode === 'obl' ? oblClusters : pblClusters; }

export function loadContentOverrides() {
    try { return JSON.parse(_algStore().getItem('algOverrides')) || {}; }
    catch (e) { return {}; }
}

export function saveContentOverrides(overrides) {
    _algStore().setItem('algOverrides', JSON.stringify(overrides));
}

export function loadTagAssignments() {
    try { return JSON.parse(_algStore().getItem('tagAssignments')) || {}; }
    catch (e) { return {}; }
}

export function saveTagAssignments(assignments) {
    _algStore().setItem('tagAssignments', JSON.stringify(assignments));
}

// Removes a deleted tag's attachments from both trainers' stores.
export function purgeTagFromAssignments(tagId) {
    for (const store of [pblStorage, oblStorage]) {
        try {
            const a = JSON.parse(store.getItem('tagAssignments')) || {};
            if (a[tagId]) { delete a[tagId]; store.setItem('tagAssignments', JSON.stringify(a)); }
        } catch (e) {}
    }
}

// Stable id for the n-th shipped (default) solution group.
export function defaultGroupId(index) { return 'sg' + index; }

// Next free "new<n>" id for a cluster's matt override.
export function nextNewGroupId(mattOverride) {
    let max = 0;
    for (const id of Object.keys(mattOverride?.groups || {})) {
        const m = /^new(\d+)$/.exec(id);
        if (m) max = Math.max(max, +m[1]);
    }
    return 'new' + (max + 1);
}

// Canonical "title|source|unitId" reference used as the value in tagAssignments.
// PBL matt addresses a solution group by its id; every other source (OBL matt,
// any sheet) is a single whole-source unit addressed with "*".
export function unitRef(title, source, unitId) { return `${title}|${source}|${unitId}`; }

// ── Tag attachment (tagAssignments is the source of truth) ───────────────────

export const UNIT_TAG_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none"/></svg>`;

export function tagsForUnit(ref) {
    const a = loadTagAssignments();
    return Object.keys(a).filter(tid => a[tid].includes(ref));
}

export function toggleUnitTag(ref, tagId) {
    const a = loadTagAssignments();
    if (!a[tagId]) a[tagId] = [];
    const i = a[tagId].indexOf(ref);
    if (i >= 0) a[tagId].splice(i, 1); else a[tagId].push(ref);
    if (!a[tagId].length) delete a[tagId];
    saveTagAssignments(a);
}

// Set of cluster titles (in the current trainer) that have at least one unit
// tagged with any tag.
export function taggedClusterTitles() {
    const set = new Set();
    for (const refs of Object.values(loadTagAssignments())) {
        for (const ref of refs) set.add(ref.split('|')[0]);
    }
    return set;
}

// Distinct cluster titles that have at least one unit tagged with `tagId`.
function tagClusterTitles(tagId) {
    const refs = loadTagAssignments()[tagId] || [];
    const titles = [];
    for (const ref of refs) {
        const title = ref.split('|')[0];
        if (!titles.includes(title)) titles.push(title);
    }
    return titles;
}

// Resolves a cluster's matt solution-groups with overrides applied, in order.
export function effectiveMattGroups(title) {
    const cluster   = _algClusters()[title];
    const defGroups = cluster?.matt?.['solution-groups'] || [];
    const ov        = loadContentOverrides()[title]?.matt;
    if (!ov) return defGroups;

    const order = ov.order || defGroups.map((_, i) => defaultGroupId(i));
    return order.map(id => {
        if (ov.groups && id in ov.groups) return ov.groups[id];
        const m = /^sg(\d+)$/.exec(id);
        return m ? defGroups[+m[1]] : null;
    }).filter(Boolean);
}

// Returns a cluster object with all overrides applied (default if none).
// case-list and optimal-slicecount are never editable, so they pass through.
export function effectiveCluster(title) {
    const cluster = _algClusters()[title];
    if (!cluster) return cluster;
    const ov = loadContentOverrides()[title];
    if (!ov) return cluster;

    const eff = { ...cluster };

    if ('matt' in ov) {
        if (trainerMode === 'obl') {
            eff.matt = ov.matt; // OBL matt is flat — the override replaces it wholesale
        } else {
            eff.matt = { ...cluster.matt, 'solution-groups': effectiveMattGroups(title) };
            if ('distinction-help' in ov.matt) eff.matt['distinction-help'] = ov.matt['distinction-help'];
        }
    }

    // Sheet sources: a present override replaces that source wholesale.
    for (const key of Object.keys(ov)) {
        if (key === 'matt') continue;
        eff[key] = ov[key];
    }
    return eff;
}

// Returns the ordered list of matt unit ids for a cluster (defaults + added),
// matching the order effectiveMattGroups() renders them in. Used by the editor
// and tag display to address units.
export function mattUnitOrder(title) {
    const cluster   = _algClusters()[title];
    const defGroups = cluster?.matt?.['solution-groups'] || [];
    const ov        = loadContentOverrides()[title]?.matt;
    return ov?.order || defGroups.map((_, i) => defaultGroupId(i));
}

// Union of the case-list cases of every cluster a tag touches. These match the
// grid cell ids (PBL "Al/Al", "Gal/-"; OBL "Uw/THw"), so they can be selected /
// shown directly. Order follows the clusters' own case-list order.
export function tagCaseBases(tagId) {
    const out = [];
    for (const title of tagClusterTitles(tagId)) {
        for (const c of (effectiveCluster(title)?.['case-list'] || [])) {
            if (!out.includes(c)) out.push(c);
        }
    }
    return out;
}

// PBL only: the barflip mode each case should be selected as when a tag is
// applied. A tagged matt solution group implies a mode from its slicecount —
// even → '-', odd → '+'. Within a cluster these combine: mixed parities, an
// unknown slicecount, or any tagged sheet view (jlminx/derpy, addressed by "*")
// force 'both'. Every case in a touched cluster shares that cluster's mode.
// Returns [{ base, mode }] with mode ∈ '+' | '-' | 'both'.
export function tagCaseModes(tagId) {
    const refs = loadTagAssignments()[tagId] || [];
    const acc  = new Map(); // title -> { even, odd, both }
    for (const ref of refs) {
        const [title, source, unitId] = ref.split('|');
        if (!_algClusters()[title]) continue; // stale ref (cluster gone)
        let a = acc.get(title);
        if (!a) { a = { even: false, odd: false, both: false }; acc.set(title, a); }
        if (source !== 'matt') { a.both = true; continue; } // sheet view → both
        const g = mattGroupById(title, unitId);
        const n = g ? Number(g['solution-slicecount']) : NaN;
        if (!Number.isFinite(n)) { a.both = true; continue; }
        if (n % 2 === 0) a.even = true; else a.odd = true;
    }

    const baseMode = new Map(); // base -> mode (merge to 'both' on conflict)
    for (const [title, a] of acc) {
        const mode = (a.both || (a.even && a.odd)) ? 'both' : a.even ? '-' : a.odd ? '+' : 'both';
        for (const c of (effectiveCluster(title)?.['case-list'] || [])) {
            const prev = baseMode.get(c);
            baseMode.set(c, prev && prev !== mode ? 'both' : mode);
        }
    }
    return [...baseMode].map(([base, mode]) => ({ base, mode }));
}

// The matt solution group addressed by `unitId` (sg<n>/new<n>). effectiveMattGroups
// and mattUnitOrder share the same order, so their indices line up.
export function mattGroupById(title, unitId) {
    const order  = mattUnitOrder(title);
    const groups = effectiveMattGroups(title);
    const i = order.indexOf(unitId);
    return i >= 0 ? groups[i] : null;
}

// Selection state of a tag across a set of unit refs: 'none' | 'some' | 'all'.
// (Single-unit today; multi-unit selection will use 'some' later.)
export function tagUnitState(tagId, refs) {
    const set = loadTagAssignments()[tagId] || [];
    const n = refs.filter(r => set.includes(r)).length;
    return n === 0 ? 'none' : n === refs.length ? 'all' : 'some';
}
