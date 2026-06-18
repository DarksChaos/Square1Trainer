// ═══════════════════════════════════════════════════════════════════════════
//  ALG-REFERENCE OVERRIDES + TAG ASSIGNMENTS
//  User edits to alg-reference content and tag attachments, stored per trainer
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

function _algStore()   { return trainerMode === 'obl' ? oblStorage  : pblStorage; }
function _algClusters() { return trainerMode === 'obl' ? oblClusters : pblClusters; }

// ── Store I/O ────────────────────────────────────────────────────────────────

function loadContentOverrides() {
    try { return JSON.parse(_algStore().getItem('algOverrides')) || {}; }
    catch (e) { return {}; }
}
function saveContentOverrides(overrides) {
    _algStore().setItem('algOverrides', JSON.stringify(overrides));
}

function loadTagAssignments() {
    try { return JSON.parse(_algStore().getItem('tagAssignments')) || {}; }
    catch (e) { return {}; }
}
function saveTagAssignments(assignments) {
    _algStore().setItem('tagAssignments', JSON.stringify(assignments));
}

// ── Unit ids ─────────────────────────────────────────────────────────────────

// Stable id for the n-th shipped (default) solution group.
function defaultGroupId(index) { return 'sg' + index; }

// Next free "new<n>" id for a cluster's matt override.
function nextNewGroupId(mattOverride) {
    let max = 0;
    for (const id of Object.keys(mattOverride?.groups || {})) {
        const m = /^new(\d+)$/.exec(id);
        if (m) max = Math.max(max, +m[1]);
    }
    return 'new' + (max + 1);
}

// Canonical "title|source|unitId" reference used as the value in tagAssignments.
function unitRef(title, source, unitId) { return `${title}|${source}|${unitId}`; }

// ── Merge (read path) ────────────────────────────────────────────────────────

// Resolves a cluster's matt solution-groups with overrides applied, in order.
function effectiveMattGroups(title) {
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
function effectiveCluster(title) {
    const cluster = _algClusters()[title];
    if (!cluster) return cluster;
    const ov = loadContentOverrides()[title];
    if (!ov) return cluster;

    const eff = { ...cluster };

    if (cluster.matt) {
        eff.matt = { ...cluster.matt, 'solution-groups': effectiveMattGroups(title) };
        if (ov.matt && 'distinction-help' in ov.matt)
            eff.matt['distinction-help'] = ov.matt['distinction-help'];
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
function mattUnitOrder(title) {
    const cluster   = _algClusters()[title];
    const defGroups = cluster?.matt?.['solution-groups'] || [];
    const ov        = loadContentOverrides()[title]?.matt;
    return ov?.order || defGroups.map((_, i) => defaultGroupId(i));
}
