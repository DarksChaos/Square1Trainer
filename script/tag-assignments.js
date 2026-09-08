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

// Rewrites a legacy positional "sg<n>" matt unit id to the current content slug
// of the group at index n. Ids that aren't sg<n> (already slugs, or user-added
// "new<n>") pass through. Used by the loaders below to self-heal stored refs.
function remapLegacyUnitId(title, unitId) {
    const m = /^sg(\d+)$/.exec(unitId);
    return m ? (defaultGroupIds(title)[+m[1]] ?? unitId) : unitId;
}

export function loadContentOverrides() {
    const raw = _algStore().getItem('algOverrides');
    let ov;
    try { ov = JSON.parse(raw) || {}; } catch (e) { return {}; }
    // Self-heal legacy sg<n> group ids in stored overrides. Cheap fast-path
    // skips the walk when the serialized form has no "sg<n>" token.
    if (raw && /"sg\d+"/.test(raw)) {
        let changed = false;
        for (const title of Object.keys(ov)) {
            const matt = ov[title]?.matt;
            if (!matt) continue;
            if (Array.isArray(matt.order))
                matt.order = matt.order.map(id => { const n = remapLegacyUnitId(title, id); if (n !== id) changed = true; return n; });
            if (matt.groups) {
                const g = {};
                for (const id of Object.keys(matt.groups)) { const n = remapLegacyUnitId(title, id); if (n !== id) changed = true; g[n] = matt.groups[id]; }
                matt.groups = g;
            }
        }
        if (changed) saveContentOverrides(ov);
    }
    return ov;
}

export function saveContentOverrides(overrides) {
    _algStore().setItem('algOverrides', JSON.stringify(overrides));
}

export function loadClusterComments() {
    try { return JSON.parse(_algStore().getItem('clusterComments')) || {}; }
    catch (e) { return {}; }
}

export function saveClusterComments(comments) {
    _algStore().setItem('clusterComments', JSON.stringify(comments));
}

export function getClusterComment(title) {
    return loadClusterComments()[title] || '';
}

export function setClusterComment(title, comment) {
    const comments = loadClusterComments();
    const text = String(comment ?? '').trim();
    if (text) comments[title] = text;
    else delete comments[title];
    saveClusterComments(comments);
}

export function loadTagAssignments() {
    const raw = _algStore().getItem('tagAssignments');
    let a;
    try { a = JSON.parse(raw) || {}; } catch (e) { return {}; }
    // Self-heal legacy sg<n> refs → content slugs (fast-path when none present).
    if (raw && raw.includes('|matt|sg')) {
        let changed = false;
        for (const tid of Object.keys(a)) {
            a[tid] = a[tid].map(ref => {
                const p = ref.split('|');
                if (p[1] !== 'matt') return ref;
                const nid = remapLegacyUnitId(p[0], p[2]);
                if (nid === p[2]) return ref;
                changed = true;
                return `${p[0]}|matt|${nid}`;
            });
        }
        if (changed) saveTagAssignments(a);
    }
    return a;
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

// Stable, content-derived id for a shipped solution group: the slug of its
// solution-overview with its slicecount appended (so + and − barflips of the
// same solution stay distinct). Because the id is a pure function of content,
// reordering or inserting groups in the generated data doesn't move a group's
// identity — only rewording its overview or changing its slicecount does. Ids
// are unique within a cluster; an exact collision gets an appearance-order
// suffix. The generated JSON may carry an explicit `id` per group, which is
// authoritative; we compute the same slug when it's absent.
export function slugifyOverview(s) {
    return String(s ?? '').trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function computeGroupIds(groups) {
    const seen = new Map();
    return groups.map(g => {
        if (g.id) return g.id;
        let id = slugifyOverview(g['solution-overview']) || 'group';
        const slice = g['solution-slicecount'];
        if (slice != null && slice !== '') id += '-' + slice;
        const n = (seen.get(id) || 0) + 1;
        seen.set(id, n);
        return n === 1 ? id : id + '-' + n;
    });
}

// Ids of a cluster's shipped (default) solution groups, aligned with the
// defaultMattGroups() order.
export function defaultGroupIds(title) {
    return computeGroupIds(_algClusters()[title]?.matt?.['solution-groups'] || []);
}

// Map from a cluster's default-group id → its shipped group object.
export function defaultGroupById(title) {
    const groups = _algClusters()[title]?.matt?.['solution-groups'] || [];
    return new Map(defaultGroupIds(title).map((id, i) => [id, groups[i]]));
}


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

// Single source of truth lives in help-icons.js (shared with the help-nav Tags
// icon); re-exported here for this module's existing consumers.
export { UNIT_TAG_SVG } from './help-icons.js';

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
export function tagClusterTitles(tagId) {
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

    const defById = defaultGroupById(title);
    const order   = ov.order || [...defById.keys()];
    return order.map(id => {
        if (ov.groups && id in ov.groups) return ov.groups[id];
        return defById.get(id) || null;
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
    const ov = loadContentOverrides()[title]?.matt;
    return ov?.order || defaultGroupIds(title);
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

// PBL "count + and - as 2 cases" setting, mirrored here by pbl-core so tag
// counts (computed in this low-level store) can honor it without a circular
// import back into pbl-core.
let _pblCountBarflip = false;
export function setPblCountBarflip(on) { _pblCountBarflip = !!on; }

// OBL tag-case counter, mirrored here by obl-core for the same reason: it
// needs oblUsingSpe (base vs. specific granularity) and getSpeList, both of
// which would create a circular import if pulled in directly.
let _oblTagCaseCounter = null;
export function setOblTagCaseCounter(fn) { _oblTagCaseCounter = fn; }

// Number of cases a tag represents. With the PBL count-barflip setting on, a
// case selected as 'both' (mixed-parity matt groups, or a sheet view) counts as
// two; '+'-only or '-'-only cases count as one. Otherwise (and always in OBL)
// each base case counts once.
export function tagCaseCount(tagId) {
    if (trainerMode === 'pbl' && _pblCountBarflip) {
        return tagCaseModes(tagId).reduce((n, { mode }) => n + (mode === 'both' ? 2 : 1), 0);
    }
    if (trainerMode === 'obl' && _oblTagCaseCounter) return _oblTagCaseCounter(tagId);
    return tagCaseBases(tagId).length;
}

// true if a matt solution group carries its own algs, as opposed to e.g. "// barflip"
export function groupHasOwnAlgs(group) {
    return !!(group?.['alg-blocks']?.some(b => b.cases?.some(c => c.algs?.length)));
}

// PBL only: the barflip mode for each case (consistent per cluster) when a tag is applied.
// A tagged matt solution group implies a mode from its slicecount.
// Within a cluster these combine: mixed barflips, unknown slicecount, or
// any tagged sheet view (jlminx/derpy, addressed by "*") force 'both'.
// addonMixed is used to merge a +/- that just came from solution groups like "// barflip".
// Returns [{ base, mode, addonMixed }].
export function tagCaseModes(tagId) {
    const refs = loadTagAssignments()[tagId] || [];
    const acc  = new Map(); // title -> { even, odd, rawBoth, hasAddon }
    for (const ref of refs) {
        const [title, source, unitId] = ref.split('|');
        if (!_algClusters()[title]) continue; // stale ref (cluster gone)
        let a = acc.get(title);
        if (!a) { a = { even: false, odd: false, rawBoth: false, hasAddon: false }; acc.set(title, a); }
        if (source !== 'matt') { a.rawBoth = true; continue; } // sheet view → both
        const g = mattGroupById(title, unitId);
        const n = g ? Number(g['solution-slicecount']) : NaN;
        if (!Number.isFinite(n)) { a.rawBoth = true; continue; }
        if (n % 2 === 0) a.even = true; else a.odd = true;
        if (g && !groupHasOwnAlgs(g)) a.hasAddon = true;
    }

    const baseInfo = new Map(); // base -> { mode, addonMixed } (merge to 'both' on conflict)
    for (const [title, a] of acc) {
        const mixed      = a.even && a.odd;
        const mode       = (a.rawBoth || mixed) ? 'both' : a.even ? '-' : a.odd ? '+' : 'both';
        const addonMixed = mixed && !a.rawBoth && a.hasAddon;
        for (const c of (effectiveCluster(title)?.['case-list'] || [])) {
            const prev = baseInfo.get(c);
            baseInfo.set(c, prev
                ? { mode: prev.mode !== mode ? 'both' : mode, addonMixed: prev.addonMixed || addonMixed }
                : { mode, addonMixed });
        }
    }
    return [...baseInfo].map(([base, { mode, addonMixed }]) => ({ base, mode, addonMixed }));
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
