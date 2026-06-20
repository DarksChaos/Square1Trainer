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

// Removes a deleted tag's attachments from both trainers' stores.
function purgeTagFromAssignments(tagId) {
    for (const store of [pblStorage, oblStorage]) {
        try {
            const a = JSON.parse(store.getItem('tagAssignments')) || {};
            if (a[tagId]) { delete a[tagId]; store.setItem('tagAssignments', JSON.stringify(a)); }
        } catch (e) {}
    }
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
// PBL matt addresses a solution group by its id; every other source (OBL matt,
// any sheet) is a single whole-source unit addressed with "*".
function unitRef(title, source, unitId) { return `${title}|${source}|${unitId}`; }

// ── Tag attachment (tagAssignments is the source of truth) ───────────────────

const UNIT_TAG_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none"/></svg>`;

function tagsForUnit(ref) {
    const a = loadTagAssignments();
    return Object.keys(a).filter(tid => a[tid].includes(ref));
}

function toggleUnitTag(ref, tagId) {
    const a = loadTagAssignments();
    if (!a[tagId]) a[tagId] = [];
    const i = a[tagId].indexOf(ref);
    if (i >= 0) a[tagId].splice(i, 1); else a[tagId].push(ref);
    if (!a[tagId].length) delete a[tagId];
    saveTagAssignments(a);
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

// Union of the case-list cases of every cluster a tag touches. These match the
// grid cell ids (PBL "Al/Al", "Gal/-"; OBL "Uw/THw"), so they can be selected /
// shown directly. Order follows the clusters' own case-list order.
function tagCaseBases(tagId) {
    const out = [];
    for (const title of tagClusterTitles(tagId)) {
        for (const c of (effectiveCluster(title)?.['case-list'] || [])) {
            if (!out.includes(c)) out.push(c);
        }
    }
    return out;
}

// The matt solution group addressed by `unitId` (sg<n>/new<n>). effectiveMattGroups
// and mattUnitOrder share the same order, so their indices line up.
function mattGroupById(title, unitId) {
    const order  = mattUnitOrder(title);
    const groups = effectiveMattGroups(title);
    const i = order.indexOf(unitId);
    return i >= 0 ? groups[i] : null;
}

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
function tagUnitsByCluster(tagId) {
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

// Selection state of a tag across a set of unit refs: 'none' | 'some' | 'all'.
// (Single-unit today; multi-unit selection will use 'some' later.)
function tagUnitState(tagId, refs) {
    const set = loadTagAssignments()[tagId] || [];
    const n = refs.filter(r => set.includes(r)).length;
    return n === 0 ? 'none' : n === refs.length ? 'all' : 'some';
}

// Inner HTML of a unit's tag control: the chip list (collapses to dots on
// overflow via the .dots class) + the fixed add button on the right.
function unitTagsInner(ref) {
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
function mattUnitOrder(title) {
    const cluster   = _algClusters()[title];
    const defGroups = cluster?.matt?.['solution-groups'] || [];
    const ov        = loadContentOverrides()[title]?.matt;
    return ov?.order || defGroups.map((_, i) => defaultGroupId(i));
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
