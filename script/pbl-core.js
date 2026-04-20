// ─── PBL STATE ────────────────────────────────────────────────────────────────

let pblPossible  = [];  // [[top, bottom], ...]
let pblSelected  = [];  // entries end with '+' or '-'  e.g. "Al/Ar+"
let pblScrambleList = []; // [[normal, karn, caseName], ...]
let pblRemaining = [];
let pblEachCase  = 0;   // 0 = random, 1+ = fixed count per cycle
let pblWeight    = false;
let pblUseBarflip = false;
let pblHasActive  = false;

let pblOffset      = 0;  // how far back in pblScrambleList we're browsing
let pblCurrentCase  = "";
let pblPreviousCase = "";

let pblPreviouslySelected = null; // null = nothing to undo
let pblRedoSelected       = null; // null = nothing to redo

let pblScrambleMode  = 'long'; // 'long' | 'short'
let pblAllowBottom56 = false;

let pblWorker     = null;
let pblWorkerBusy = false;
let pblPending    = null; // null | 'waiting' | worker-result object

// pblDefaultLists is declared as const in pbl-data.js (JSON moved there).
let pblUserLists    = {};

// ─── BARFLIP STATE ───────────────────────────────────────────────────────────

let pblSelectBtnState    = 'none'; // 'none'|'both'|'plus'|'minus'
let pblBarflipOverride   = null;   // null | '+' | '-'
let pblShowBarflipUI     = false;

// ─── BARFLIP HELPERS ─────────────────────────────────────────────────────────

// Migrate legacy pblSelected (no suffix) → entries ending in '+' or '-'.
function pblMigrateLegacy(arr) {
    if (arr.some(s => !s.endsWith('+') && (!s.endsWith('-') || s.endsWith('/-')))) {
        const result = [];
        for (const s of arr) {
            if (s.endsWith('+') || (s.endsWith('-') && !s.endsWith('/-'))) result.push(s);
            else result.push(s + '+', s + '-');
        }
        return result;
    }
    return arr;
}

// Returns 'none'|'both'|'plus'|'minus' for a base case name (no suffix).
function pblCaseMode(base) {
    const hasPlus  = pblSelected.includes(base + '+');
    const hasMinus = pblSelected.includes(base + '-');
    if (hasPlus && hasMinus) return 'both';
    if (hasPlus)  return 'plus';
    if (hasMinus) return 'minus';
    return 'none';
}

// Updates the DOM class on a .case element.
function pblSetDomClass(el, mode) {
    el.classList.remove('checked-both', 'checked-plus', 'checked-minus');
    if      (mode === 'both')  el.classList.add('checked-both');
    else if (mode === 'plus')  el.classList.add('checked-plus');
    else if (mode === 'minus') el.classList.add('checked-minus');
}

// Mode-cycling helpers — used by click / right-click / touch / select-all.
function pblNextModeForw(m)   { return m === 'none' ? 'both'  : m === 'both'  ? 'plus' : m === 'plus' ? 'minus' : 'both'; }
function pblNextModeBack(m)  { return m === 'none' ? 'minus' : m === 'minus' ? 'plus' : m === 'plus' ? 'both'  : 'minus'; }
function pblNextModeToggle(m) { return m === 'both' ? 'none'  : 'both'; }

function pblName(pbl) { return `${pbl[0]}/${pbl[1]}`; }

function pblEffectiveOverride() {
    return pblShowBarflipUI ? pblBarflipOverride : null;
}

function pblRecolorAll() {
    const override = pblEffectiveOverride();
    document.querySelectorAll('.case').forEach(el => {
        const mode = pblCaseMode(el.id);
        pblSetDomClass(el,
            (override !== null && mode !== 'none')
                ? (override === '+' ? 'plus' : 'minus')
                : mode
        );
    });
}

// ─── CLUSTER MODAL (PBL) ─────────────────────────────────────────────────────
// generic.js provides: clusterCacheLoad/Save, clusterDownloadAll, clusterFetch,
// clusterEnsureReady, clusterSizeModal, closeCluster.
// This section holds PBL-specific: Supabase client, cache state, cluster worker,
// case lookup, and the PBL HTML formatter.
// When OBL gets a cluster modal, obl-core.js will have its own oblFormatCluster().

// ── PBL cluster data ──────────────────────────────────────────────────────
// pblClusters is declared as const in pbl-data.js.

// ── PBL case lookup ───────────────────────────────────────────────────────

function pblFindCluster(caseName) {
    const clean = caseName.replace(/[+-]$/, "");
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

function pblFormatCluster(cluster, title) {
    const lines = [];
    lines.push(
        `<span class="cluster-title">${title}${cluster["optimal-slicecount"] ? " (" + cluster["optimal-slicecount"] + ")" : ""}</span>`,
        "",
        `<span class="section-label"><b><a href="https://docs.google.com/document/d/1bLCZGcQn4Or9uZZWK8Z4cdg8AkP2l7Ljm5xwEGH97BI/edit" target="blank">from Matt's PBL Doc</a></b></span>`
    );

    if (cluster.matt?.["distinction-help"]?.trim())
        lines.push(`<span style="text-indent:2.5em;">${pblNab(cluster.matt["distinction-help"])}</span>`);

    for (const sg of cluster.matt?.["solution-groups"] || []) {
        const hasContent =
            sg["solution-overview"]?.trim() ||
            sg["alg-blocks"]?.some(ab =>
                ab["alg-explanation"]?.trim() ||
                ab["angle-explanation"]?.trim() ||
                ab.cases?.some(c => pblHasAlgData(c.algs))
            );
        if (!hasContent) continue;
        lines.push("");
        const slices = sg["solution-slicecount"] ? ` (${sg["solution-slicecount"]})` : "";
        if (sg["solution-overview"]?.trim())
            lines.push(`<span class="sol-overview"><b>${pblNab(sg["solution-overview"])}${slices}</b></span>`);

        for (const ab of sg["alg-blocks"] || []) {
            if (ab["angle-explanation"]?.trim()) lines.push(`<span class="explanations">${pblNab(ab["angle-explanation"])}</span>`);
            if (ab["alg-explanation"]?.trim())   lines.push(`<span class="explanations">${pblNab(ab["alg-explanation"])}</span>`);
            for (const c of ab.cases || []) {
                if (!pblHasAlgData(c.algs)) continue;
                for (let i = 0; i < c.algs.length; i++) {
                    const alg = c.algs[i];
                    if (!alg.angle?.trim() && !alg.notation?.trim()) continue;
                    const angle    = alg.angle?.trim() ? `&lt;${alg.angle}&gt; ` : "";
                    const notation = usingKarn ? alg.notation : unkarnify(alg.notation);
                    const indent   = i > 0 ? pblTextWidth(c["case-name"] + alg.sign + " ", "11pt Arial") : 0;
                    lines.push(
                        `<span class="alg-lines" style="margin-left:calc(5em + ${indent}px);">` +
                        `${i === 0 ? c["case-name"] + alg.sign + " " : ""}${angle}` +
                        `<span style="font-family:monospace">${notation}</span></span>`
                    );
                }
            }
        }
    }

    const filledDerpy = (cluster.derpy || []).filter(c => pblHasAlgData(c.algs));
    if (filledDerpy.length) {
        lines.push(
            "",
            `<span class="section-label"><b><a href="https://docs.google.com/spreadsheets/d/1VQNYNwdOLqqBkacHcfYtEBst22FOVhH9EAhTOYOZTgo/edit" target="blank">Optimal (from Derpy's PBL Sheet)</a></b></span>`
        );
        for (const c of filledDerpy) {
            for (let i = 0; i < c.algs.length; i++) {
                const alg = c.algs[i];
                if (!alg.angle?.trim() && !alg.notation?.trim()) continue;
                const angle    = alg.angle?.trim() ? `&lt;${alg.angle}&gt; ` : "";
                const notation = usingKarn ? alg.notation : unkarnify(alg.notation);
                const indent   = i > 0 ? pblTextWidth(c["case-name"] + " ", "11pt Arial") : 0;
                lines.push(
                    `<span class="alg-lines" style="margin-left:calc(5em + ${indent}px);">` +
                    `${i === 0 ? c["case-name"] + " " : ""}${angle}` +
                    `<span style="font-family:monospace">${notation}</span></span>`
                );
            }
        }
    }
    return lines.join("");
}

// ── pblOpenCluster ────────────────────────────────────────────────────────
// Wires the generic infrastructure to PBL-specific lookup + formatting.
// closeCluster() (shared close) lives in generic.js.

async function pblOpenCluster(caseOverride) {
    if (!pblHasActive) return;

    const raw          = caseOverride ?? pblScrambleList.at(-1 - pblOffset)[2];
    const caseName     = raw.replace(/[+-]$/, "");
    const clusterTitle = pblFindCluster(caseName);
    if (!clusterTitle) return;

    const modal   = document.getElementById("cluster-modal");
    const content = document.getElementById("cluster-modal-content");
    modal.style.display = "flex";
    isPopupOpen = true;

    const cluster = pblClusters[clusterTitle];
    if (!cluster) {
        content.innerHTML = `<span style="opacity:0.4">No data found for "${clusterTitle}".</span>`;
        return;
    }

    content.scrollTop = 0; // always start at top
    content.innerHTML = pblFormatCluster(cluster, clusterTitle);
    clusterSizeModal(content);
}

// ─── PBL STORAGE ─────────────────────────────────────────────────────────────

const pblStorage = {
    getItem:    k      => localStorage.getItem(k + 'PBL'),
    setItem:    (k, v) => localStorage.setItem(k + 'PBL', v),
    removeItem: k      => localStorage.removeItem(k + 'PBL'),
};

const pblSettingList = [eachCaseEl, karnEl, weightEl, globalBarflipEl, useBarflipEl];

function pblMigrateLegacyStorage() {
    const keys = ['settings', 'selected', 'userLists'];
    let migrated = false;
    for (const key of keys) {
        const legacyData = localStorage.getItem(key);
        const newData    = pblStorage.getItem(key);
        if (legacyData !== null && newData === null) {
            pblStorage.setItem(key, legacyData);
            localStorage.removeItem(key);
            migrated = true;
        }
    }
    if (migrated) console.log('Migrated legacy PBL data to pblStorage.');
}

function pblSaveSelected() {
    pblStorage.setItem("selected", JSON.stringify(pblSelected));
    // Regenerate scramble if: nothing active, selection gone, or current case was removed.
    if (!pblHasActive || pblSelected.length === 0) pblGenerateScramble();
    else if (pblCurrentCase !== "" && !pblSelected.includes(pblCurrentCase)) pblGenerateScramble(true);
}

function pblSaveUserLists() {
    pblStorage.setItem("userLists", JSON.stringify(pblUserLists));
}

function pblSaveBarflipOverride() {
    pblStorage.setItem("barflipOverride", pblBarflipOverride ?? '');
}

function pblSaveSettings() {
    let store = "";
    for (const el of pblSettingList) store += el.checked ? "1" : "0";
    pblStorage.setItem("settings", store);
    pblStorage.setItem("scrambleMode", pblScrambleMode);
    pblStorage.setItem("allowBottom56", pblAllowBottom56 ? "1" : "0");
}

// Restore PBL checkbox states from storage when switching back from OBL.
function pblRestoreSettings() {
    const stored = pblStorage.getItem('settings');
    if (stored !== null) {
        for (let i = 0; i < pblSettingList.length; i++)
            pblSettingList[i].checked = stored[i] === '1';
    }
    // Sync derived state that depends on checkbox values.
    usingKarn        = karnEl.checked        ? 1 : 0;
    pblWeight        = weightEl.checked;
    pblUseBarflip    = useBarflipEl.checked;
    pblShowBarflipUI = globalBarflipEl.checked;
    globalBarflipRow.style.display = pblUseBarflip ? '' : 'none';
}

// ─── PBL CASE GRID HELPERS ────────────────────────────────────────────────────

function pblShow(id) { document.getElementById(id)?.classList.remove("hidden"); }
function pblHide(id) { document.getElementById(id)?.classList.add("hidden"); }

// ─── PBL SELECTION ────────────────────────────────────────────────────────────

function pblSelect(s) {
    // s must end with '+' or '-'
    const base = s.slice(0, -1);
    const el   = document.getElementById(base);
    if (!pblSelected.includes(s)) pblSelected.push(s);
    if (pblEachCase > 0 && !pblRemaining.includes(s))
        pblRemaining = pblRemaining.concat(Array(pblEachCase).fill(s));
    if (el) {
        const override = pblEffectiveOverride();
        const mode     = pblCaseMode(base);
        pblSetDomClass(el, (override !== null && mode !== 'none') ? (override === '+' ? 'plus' : 'minus') : mode);
    }
    updateSelCount();
}

function pblDeselect(s) {
    // s must end with '+' or '-'
    if (!pblSelected.includes(s)) return;
    const base = s.slice(0, -1);
    const el   = document.getElementById(base);
    pblSelected  = pblSelected.filter(a => a !== s);
    pblRemaining = pblRemaining.filter(a => a !== s);
    if (el) {
        const override = pblEffectiveOverride();
        const mode     = pblCaseMode(base);
        pblSetDomClass(el, (override !== null && mode !== 'none') ? (override === '+' ? 'plus' : 'minus') : mode);
    }
    updateSelCount();
}

// ─── PBL WEIGHTS & EACH-CASE ─────────────────────────────────────────────────

function pblGetWeight(pbl) {
    const [u, d] = pbl.replace(/[+-]$/, '').split("/");
    return (u in weight ? weight[u] : 4) * (d in weight ? weight[d] : 4);
}

// pblGetCaseCount: used by pbl-filter.js to compute freq = weight × caseCount.
// pbl is a [top, bottom] array (as stored in pblPossible).
function pblGetCaseCount(pbl) {
    return PLLextndlen[pbl[0]] * PLLextndlen[pbl[1]];
}

function pblRefillRemaining() {
    pblEachCase = pblEachCase === 0 ? randInt(MIN_EACHCASE, MAX_EACHCASE) : pblEachCase;
    // Always de-duplicate by base so a case's weight is independent of how many
    // barflip states are selected. Each base case gets weight×eachCase slots;
    // the suffix is chosen randomly from whichever barflips are selected for it.
    // This mirrors the each-case logic and keeps ratios correct whether one or
    // both barflips are selected for any given case.
    const seenBases    = new Set();
    const dedupedBases = [];
    for (const s of pblSelected) {
        const base = s.slice(0, -1);
        if (!seenBases.has(base)) { seenBases.add(base); dedupedBases.push(base); }
    }
    pblRemaining = dedupedBases.flatMap(base => {
        const count    = pblEachCase * (pblWeight ? pblGetWeight(base) : 1);
        const suffixes = ['+', '-'].filter(sx => pblSelected.includes(base + sx));
        return Array.from({ length: count }, () => base + suffixes[randInt(0, suffixes.length - 1)]);
    });
}

// ─── PBL WORKER ──────────────────────────────────────────────────────────────

pblWorker = new Worker('./script/worker.js');

function pblRestartWorker() {
    if (pblWorker) pblWorker.terminate();
    pblWorker = new Worker('./script/worker.js');
    pblWorker.onmessage = pblNormalHandler;
    pblWorkerBusy = false;
}

function pblNormalHandler(e) {
    pblWorkerBusy = false;
    if (e.data.error) { console.error('PBL worker error:', e.data.error); return; }
    pblPending = e.data;
}

function pblRequestScramble(choice) {
    if (pblWorkerBusy) return;
    pblWorkerBusy = true;
    pblPending    = null;
    const override   = pblEffectiveOverride();
    const suffix     = override ?? choice.at(-1);
    if (!['+', '-'].includes(suffix)) throw new Error(`pblRequestScramble: invalid suffix "${suffix}"`);
    pblWorker.postMessage({
        caseName:     choice.slice(0, -1),
        equatorMode:  suffix === '+' ? 'slash' : 'bar',
        scrambleMode: pblScrambleMode,
        allowBottom56: pblAllowBottom56,
    });
}

function pblPendingConflicts(newMode, newBottom56) {
    if (!pblPending || pblPending === 'waiting') return false;
    return newMode !== pblScrambleMode || newBottom56 !== pblAllowBottom56;
}

function pblCancelIfConflicting(newMode, newBottom56) {
    const changed = newMode !== pblScrambleMode || newBottom56 !== pblAllowBottom56;
    if (pblWorkerBusy && changed) { pblRestartWorker(); pblPending = null; }
    else if (pblPendingConflicts(newMode, newBottom56)) pblPending = null;
}

// ─── PBL SCRAMBLE GENERATION ─────────────────────────────────────────────────

function pblGenerateScramble(regen = false) {
    if (pblSelected.length === 0) {
        timerEl.textContent            = "--:--";
        currentScrambleEl.textContent  = "Scramble will show up here";
        previousScrambleEl.textContent = "Last scramble will show up here";
        pblHasActive    = false;
        pblScrambleList = [];
        pblPending      = null;
        return;
    }

    // Guard: don't go into offset-browsing mode when called from selection changes.
    if (pblOffset < 0) pblOffset = 0;

    if (pblRemaining.length === 0) pblRefillRemaining();

    const idx    = randInt(0, pblRemaining.length - 1);
    const choice = pblRemaining.splice(idx, 1)[0];

    if (regen) {
        // Replace the current scramble in-place; worker result overwrites the tail.
        pblPending    = 'waiting';
        pblWorkerBusy = false; // allow re-fire
        pblRequestScramble(choice);
        pblWorker.onmessage = function(e) {
            pblWorkerBusy = false;
            if (e.data.error) { console.error(e.data.error); return; }
            const final = [e.data.scramble, e.data.karn, e.data.caseName];
            pblPreviousCase = pblCurrentCase;
            pblCurrentCase  = e.data.caseName;
            pblScrambleList[pblScrambleList.length - 1] = final;
            if (pblOffset === 0) currentScrambleEl.textContent = final[usingKarn];
            pblWorker.onmessage = pblNormalHandler;
        };
        return;
    }

    // Normal generate — use a pre-generated pending scramble if available.
    if (pblPending && pblPending !== 'waiting') {
        const data = pblPending;
        pblPending  = null;
        pblPreviousCase = pblCurrentCase;
        pblCurrentCase  = data.caseName;
        const final = [data.scramble, data.karn, data.caseName];

        if (pblScrambleList.length) {
            previousScrambleEl.textContent =
                "Previous scramble: " + pblScrambleList.at(-1)[usingKarn] +
                " (" + pblScrambleList.at(-1)[2] + ")";
        }
        currentScrambleEl.textContent = final[usingKarn];
        pblScrambleList.push(final);
        if (!pblHasActive) timerEl.textContent = "0.00";
        pblHasActive = true;

        // Kick off pre-generation of the next scramble.
        if (pblRemaining.length > 0)
            pblRequestScramble(pblRemaining[randInt(0, pblRemaining.length - 1)]);
    } else {
        // Worker busy or nothing cached — show "generating" state and wait.
        currentScrambleEl.classList.add("generating");
        pblPending = 'waiting';
        if (!pblWorkerBusy) pblRequestScramble(choice);

        pblWorker.onmessage = function(e) {
            pblWorkerBusy = false;
            if (e.data.error) { console.error(e.data.error); return; }
            const data = e.data;
            pblPreviousCase = pblCurrentCase;
            pblCurrentCase  = data.caseName;
            const final = [data.scramble, data.karn, data.caseName];

            if (pblScrambleList.length) {
                previousScrambleEl.textContent =
                    "Previous scramble: " + pblScrambleList.at(-1)[usingKarn] +
                    " (" + pblScrambleList.at(-1)[2] + ")";
            }
            currentScrambleEl.textContent = final[usingKarn];
            currentScrambleEl.classList.remove("generating");
            pblScrambleList.push(final);
            if (!pblHasActive) timerEl.textContent = "0.00";
            pblHasActive = true;
            pblPending   = null;
            pblWorker.onmessage = pblNormalHandler;
        };
    }
}

// FIX: this was the first-load / mode-switch bug. The worker's onmessage was
// calling pblGenerateScramble's internal closure which wrote to currentScrambleEl
// regardless of trainerMode. Now it always uses pblNormalHandler by default,
// which only caches the result — pblGenerateScramble reads it on next call.
pblWorker.onmessage = pblNormalHandler;

function pblDisplayPrevScram() {
    const prev = pblScrambleList.at(-2 - pblOffset);
    previousScrambleEl.textContent = prev
        ? "Previous scramble: " + prev[usingKarn] + " (" + prev[2] + ")"
        : "Last scramble will show up here";
}

// ─── PBL GRID ─────────────────────────────────────────────────────────────────

function pblRestoreGrid() {
    caseListEl.style.gridTemplateColumns = '';
    caseListEl.innerHTML = pblPossible
        .map(([t, b]) => `<div class="case" id="${t}/${b}">${t} / ${b}</div>`)
        .join('');

    document.querySelectorAll(".case").forEach(caseEl => {
        const base = caseEl.id;
        caseEl.addEventListener("click", () => {
            if (usingTimer()) return;
            pblSnapSelection();
            const mode = pblCaseMode(base);
            if (!pblUseBarflip) {
                if (mode === 'both') { pblDeselect(base+'+'); pblDeselect(base+'-'); }
                else                 { pblSelect(base+'+');   pblSelect(base+'-'); }
            } else {
                if      (mode === 'none')  { pblSelect(base+'+');   pblSelect(base+'-'); }
                else if (mode === 'both')  { pblSelect(base+'+');   pblDeselect(base+'-'); }
                else if (mode === 'plus')  { pblDeselect(base+'+'); pblSelect(base+'-'); }
                else                       { pblDeselect(base+'+'); pblDeselect(base+'-'); }
            }
            pblSaveSelected();
        });
        caseEl.addEventListener("contextmenu", e => {
            e.preventDefault();
            if (usingTimer()) return;
            pblSnapSelection();
            const mode = pblCaseMode(base);
            if (!pblUseBarflip) {
                if (mode === 'both') { pblDeselect(base+'+'); pblDeselect(base+'-'); }
                else                 { pblSelect(base+'+');   pblSelect(base+'-'); }
            } else {
                if      (mode === 'none')  { pblDeselect(base+'+'); pblSelect(base+'-'); }
                else if (mode === 'both')  { pblDeselect(base+'+'); pblDeselect(base+'-'); }
                else if (mode === 'plus')  { pblSelect(base+'+');   pblSelect(base+'-'); }
                else                       { pblSelect(base+'+');   pblDeselect(base+'-'); }
            }
            pblSaveSelected();
        });

        pblSetDomClass(caseEl, pblCaseMode(base));
    });

    applyFilter(''); // in pbl-filter.js — re-run any in-memory filter on newly built DOM

    // Update display — restore scramble text if we have an active scramble.
    // FIX: was checking oblHasActiveScramble here which was always wrong.
    if (pblHasActive && pblScrambleList.length) {
        currentScrambleEl.textContent = pblScrambleList.at(-1 - pblOffset)[usingKarn];
        pblDisplayPrevScram();
        if (timerEl.textContent === '--:--') timerEl.textContent = '0.00';
    } else {
        currentScrambleEl.textContent  = "Scramble will show up here";
        previousScrambleEl.textContent = "Last scramble will show up here";
        timerEl.textContent            = "--:--";
    }

    updateSelCount();
    // showMode was reset to 'all' by applyMode — restore correct view.
    if (pblSelected.length > 0) showSelected();
    else showAll();
    updateSelectBtn();
    updateDeselectBtn();
}

// ─── PBL BULK SELECT ─────────────────────────────────────────────────────────

function pblGetVisibleBases() {
    return [...caseListEl.children]
        .filter(el => !el.classList.contains("hidden"))
        .map(el => el.id);
}

function pblApplyModeToList(bases, mode) {
    for (const base of bases) {
        pblDeselect(base+'+'); pblDeselect(base+'-');
        if      (mode === 'both')  { pblSelect(base+'+'); pblSelect(base+'-'); }
        else if (mode === 'plus')    pblSelect(base+'+');
        else if (mode === 'minus')   pblSelect(base+'-');
    }
    pblSaveSelected();
}

function pblSelectAll(isRightClick = false) {
    if (usingTimer()) return;
    pblSnapSelection();
    const bases = pblPossible.map(pbl => pblName(pbl));
    if (!pblUseBarflip) pblSelectBtnState = pblNextModeToggle(pblSelectBtnState);
    else                pblSelectBtnState = isRightClick ? pblNextModeBack(pblSelectBtnState) : pblNextModeForw(pblSelectBtnState);
    pblApplyModeToList(bases, pblSelectBtnState);
}

function pblDeselectAll() {
    if (usingTimer()) return;
    pblSnapSelection();
    pblSelectBtnState = 'none';
    for (const pbl of pblPossible) {
        const base = pblName(pbl);
        pblDeselect(base+'+');
        pblDeselect(base+'-');
    }
    pblSaveSelected();
}

function pblSelectThese(isRightClick = false) {
    if (usingTimer()) return;
    pblSnapSelection();
    const bases = pblGetVisibleBases();
    if (!pblUseBarflip) pblSelectBtnState = pblNextModeToggle(pblSelectBtnState);
    else                pblSelectBtnState = isRightClick ? pblNextModeBack(pblSelectBtnState) : pblNextModeForw(pblSelectBtnState);
    pblApplyModeToList(bases, pblSelectBtnState);
}

function pblDeselectThese() {
    if (usingTimer()) return;
    pblSnapSelection();
    pblSelectBtnState = 'none';
    for (const el of caseListEl.children) {
        if (!el.classList.contains("hidden")) {
            pblDeselect(el.id+'+');
            pblDeselect(el.id+'-');
        }
    }
    pblSaveSelected();
}

// ─── PBL LIST MANAGEMENT ─────────────────────────────────────────────────────

function pblAddUserLists() {
    let html = "";
    for (const k of Object.keys(pblUserLists)) {
        const count = new Set(pblUserLists[k].map(s => s.slice(0, -1))).size;
        html += `<div id="${k}" class="list-item">${k} (${count})</div>`;
    }
    userListsEl.innerHTML = html;
    document.querySelectorAll("#userlists>.list-item").forEach(addListItemEvent);
    pblSaveUserLists();
}

function pblAddDefaultLists() {
    let html = "";
    for (const k of Object.keys(pblDefaultLists)) {
        const count = new Set(pblDefaultLists[k].map(s => s.slice(0, -1))).size;
        html += `<div id="${k}" class="list-item">${k} (${count})</div>`;
    }
    defaultListsEl.innerHTML = html;
    document.querySelectorAll("#defaultlists>.list-item").forEach(addListItemEvent);
}

function pblSelectList(listName, setSelection) {
    if (listName == null) { showAll(); return; }

    const list = Object.keys(pblDefaultLists).includes(listName)
        ? pblDefaultLists[listName]
        : pblUserLists[listName];

    // Hide everything, then reveal only the list's cases.
    pblPossible.forEach(pbl => pblHide(pblName(pbl)));
    if (Array.isArray(list)) {
        const shownBases = new Set();
        for (const entry of list) {
            const base = entry.replace(/[+-]$/, '');
            if (!shownBases.has(base)) { pblShow(base); shownBases.add(base); }
        }
    } else {
        // Legacy object format.
        for (const [id, inList] of Object.entries(list)) {
            if (inList) pblShow(id); else pblHide(id);
        }
    }

    if (setSelection) {
        pblSnapSelection();
        pblDeselectAll();
        for (const entry of list) pblSelect(entry);
        pblSaveSelected();
    }

    showMode = 'list';
    updateToggle();
    pblSaveUserLists();
}

// ─── PBL INIT ─────────────────────────────────────────────────────────────────

async function pblInit() {
    // Build the full cross-product list (even×even + odd×odd).
    for (const t of evenPLL) for (const b of evenPLL) pblPossible.push([t, b]);
    for (const t of oddPLL)  for (const b of oddPLL)  pblPossible.push([t, b]);
    pblPossible = pblPossible.filter(([t,b])=> (t!=="-" || b!=="-"));

    // Three-layer sort: alphabetical pair → first letter of shorter-name layer →
    // first letter of longer-name layer → plain alphabetical.
    pblPossible.sort((pa, pb) => {
        const na = pblName(pa), nb = pblName(pb);
        const la1 = [na[0], na[na.indexOf('/')+1]].sort().join('');
        const lb1 = [nb[0], nb[nb.indexOf('/')+1]].sort().join('');
        if (la1 !== lb1) return la1 < lb1 ? -1 : 1;
        const [paS, paL] = [na.split('/')[0], na.split('/')[1]].sort();
        const [pbS, pbL] = [nb.split('/')[0], nb.split('/')[1]].sort();
        const la2 = paS.replace(/[amlr]$/g, ''), lb2 = pbS.replace(/[amlr]$/g, '');
        if (la2 !== lb2) return la2 < lb2 ? -1 : 1;
        const la3 = paL.replace(/[amlr]$/g, ''), lb3 = pbL.replace(/[amlr]$/g, '');
        if (la3 !== lb3) return la3 < lb3 ? -1 : 1;
        return na < nb ? -1 : na > nb ? 1 : 0;
    });

    // Load settings, selection, lists from storage.
    pblLoadStorage(true);

    // Fetch default lists JSON.
    for (const k of Object.keys(pblDefaultLists))
        pblDefaultLists[k] = pblMigrateLegacy(pblDefaultLists[k]);
    pblAddDefaultLists();
}

function pblLoadStorage(buildGrid = false) {
    pblMigrateLegacyStorage();

    const storedSelected  = pblStorage.getItem("selected");
    const storedSettings  = pblStorage.getItem("settings");
    const storedScrMode   = pblStorage.getItem("scrambleMode");
    const storedBot56     = pblStorage.getItem("allowBottom56");
    const storedBarflip   = pblStorage.getItem("barflipOverride");
    const storedUserLists = pblStorage.getItem("userLists");

    if (buildGrid) {
        // Build the case grid DOM from pblPossible.
        caseListEl.innerHTML = pblPossible
            .map(([t, b]) => `<div class="case" id="${t}/${b}">${t} / ${b}</div>`)
            .join('');

        document.querySelectorAll(".case").forEach(caseEl => {
            const base = caseEl.id;
            caseEl.addEventListener("click", () => {
                if (usingTimer()) return;
                pblSnapSelection();
                const mode = pblCaseMode(base);
                if (!pblUseBarflip) {
                    if (mode === 'both') { pblDeselect(base+'+'); pblDeselect(base+'-'); }
                    else                 { pblSelect(base+'+');   pblSelect(base+'-'); }
                } else {
                    if      (mode === 'none')  { pblSelect(base+'+');   pblSelect(base+'-'); }
                    else if (mode === 'both')  { pblSelect(base+'+');   pblDeselect(base+'-'); }
                    else if (mode === 'plus')  { pblDeselect(base+'+'); pblSelect(base+'-'); }
                    else                       { pblDeselect(base+'+'); pblDeselect(base+'-'); }
                }
                pblSaveSelected();
            });
            caseEl.addEventListener("contextmenu", e => {
                e.preventDefault();
                if (usingTimer()) return;
                pblSnapSelection();
                const mode = pblCaseMode(base);
                if (!pblUseBarflip) {
                    if (mode === 'both') { pblDeselect(base+'+'); pblDeselect(base+'-'); }
                    else                 { pblSelect(base+'+');   pblSelect(base+'-'); }
                } else {
                    if      (mode === 'none')  { pblDeselect(base+'+'); pblSelect(base+'-'); }
                    else if (mode === 'both')  { pblDeselect(base+'+'); pblDeselect(base+'-'); }
                    else if (mode === 'plus')  { pblSelect(base+'+');   pblSelect(base+'-'); }
                    else                       { pblSelect(base+'+');   pblDeselect(base+'-'); }
                }
                pblSaveSelected();
            });
        });
    }

    // Apply settings checkboxes.
    for (const el of pblSettingList) if (el.checked) el.click();
    if (storedSettings !== null) {
        for (let i = 0; i < pblSettingList.length; i++)
            if (storedSettings[i] === "1") pblSettingList[i].click();
    } else {
        karnEl.click(); // default: karn on
    }

    globalBarflipRow.style.display = pblUseBarflip ? '' : 'none';

    if (storedScrMode) {
        pblScrambleMode = storedScrMode;
        const radio = document.querySelector(`input[name="scramlen"][value="${pblScrambleMode}"]`);
        if (radio) radio.checked = true;
        bottom56Row.style.display = pblScrambleMode === 'short' ? 'flex' : 'none';
        pblSaveSettings();
    }

    if (storedBot56) {
        pblAllowBottom56 = storedBot56 === "1";
        bottom56El.checked = pblAllowBottom56;
        pblSaveSettings();
    }

    if (storedBarflip !== null)
        pblBarflipOverride = storedBarflip === '+' ? '+' : storedBarflip === '-' ? '-' : null;

    if (storedSelected !== null) {
        pblSelected = pblMigrateLegacy(JSON.parse(storedSelected));
        pblStorage.setItem("selected", JSON.stringify(pblSelected)); // persist migrated form
        for (const k of pblSelected) pblSelect(k);
        pblEachCase = eachCaseEl.checked ? 1 : randInt(MIN_EACHCASE, MAX_EACHCASE);
        pblRefillRemaining();
        // Only generate scramble immediately if PBL is the active trainer.
        // If starting in OBL mode, applyMode will handle OBL; PBL generates when switched to.
        if (trainerMode === 'pbl') pblGenerateScramble();
    } else if (buildGrid) {
        // First-ever load — select all cases in 'both' mode.
        for (const pbl of pblPossible) {
            pblSelect(pblName(pbl)+'+');
            pblSelect(pblName(pbl)+'-');
        }
        pblSaveSelected();
    }

    updateSelCount();
    if (pblSelected.length > 0) showSelected();
    else showAll();

    if (storedUserLists !== null) {
        pblUserLists = JSON.parse(storedUserLists);
        let needsSave = false;
        for (const list of Object.keys(pblUserLists)) {
            if (!Array.isArray(pblUserLists[list])) {
                // Legacy object format → array.
                pblUserLists[list] = pblPossible
                    .filter(pbl => pblUserLists[list][pblName(pbl)] == 1)
                    .map(pbl => pblName(pbl));
                needsSave = true;
            }
            const migrated = pblMigrateLegacy(pblUserLists[list]);
            if (migrated !== pblUserLists[list]) { pblUserLists[list] = migrated; needsSave = true; }
        }
        if (needsSave) pblSaveUserLists();
        pblAddUserLists();
    }
}

// ─── PBL SETTINGS HANDLERS ────────────────────────────────────────────────────

function pblOnEachCase() {
    pblEachCase = eachCaseEl.checked ? 1 : randInt(MIN_EACHCASE, MAX_EACHCASE);
    pblRefillRemaining();
    pblSaveSettings();
}

function pblOnWeights() {
    pblWeight = weightEl.checked;
    pblRefillRemaining();
    pblSaveSettings();
}

eachCaseEl.addEventListener("change", () => pblOnEachCase());
weightEl.addEventListener("change",   () => pblOnWeights());

document.querySelectorAll('input[name="scramlen"]').forEach(radio => {
    radio.addEventListener("change", () => {
        const newMode = radio.value;
        pblCancelIfConflicting(newMode, pblAllowBottom56);
        pblScrambleMode = newMode;
        bottom56Row.style.display = pblScrambleMode === 'short' ? 'flex' : 'none';
        pblGenerateScramble(true);
        pblSaveSettings();
    });
});

bottom56El.addEventListener("change", function() {
    const newBottom56 = this.checked;
    pblCancelIfConflicting(pblScrambleMode, newBottom56);
    pblAllowBottom56 = newBottom56;
    if (pblScrambleMode === 'short') pblGenerateScramble(true);
    pblSaveSettings();
});

// ─── BARFLIP OVERRIDE UI ─────────────────────────────────────────────────────

const pblBarflipOverrideRow = document.getElementById('barflip-override-row');
const pblFlippedBtn         = document.getElementById('barflip-flipped');
const pblSolvedBtn          = document.getElementById('barflip-solved');

function pblApplyBarflipUI() {
    if (pblBarflipOverrideRow) pblBarflipOverrideRow.classList.toggle('hidden', !pblShowBarflipUI);
    if (pblFlippedBtn) pblFlippedBtn.classList.toggle('active', pblShowBarflipUI && pblBarflipOverride === '+');
    if (pblSolvedBtn)  pblSolvedBtn.classList.toggle('active',  pblShowBarflipUI && pblBarflipOverride === '-');
}

function pblSetBarflipOverride(value) {
    const prev        = pblBarflipOverride;
    pblBarflipOverride = value;
    pblApplyBarflipUI();
    pblRecolorAll();
    pblSaveBarflipOverride();
    if (pblHasActive && prev && pblBarflipOverride && prev !== pblBarflipOverride) {
        pblPending = null;
        pblGenerateScramble(true);
    }
}

function pblOnGlobalBarflip() {
    pblShowBarflipUI = globalBarflipEl.checked;
    pblApplyBarflipUI();
    pblRecolorAll();
    if (pblHasActive) { pblPending = null; pblGenerateScramble(true); }
    pblSaveSettings();
}

function pblOnUseBarflip() {
    pblUseBarflip = useBarflipEl.checked;
    globalBarflipRow.style.display = pblUseBarflip ? '' : 'none';
    pblSaveSettings();
}

globalBarflipEl.addEventListener("change", () => pblOnGlobalBarflip());
useBarflipEl.addEventListener("change",    () => pblOnUseBarflip());

if (pblFlippedBtn) {
    pblFlippedBtn.addEventListener('click', () => {
        if (usingTimer()) return;
        pblSetBarflipOverride(pblBarflipOverride === '+' ? null : '+');
    });
}
if (pblSolvedBtn) {
    pblSolvedBtn.addEventListener('click', () => {
        if (usingTimer()) return;
        pblSetBarflipOverride(pblBarflipOverride === '-' ? null : '-');
    });
}

// ─── PBL HELP CONTENT ────────────────────────────────────────────────────────
// Add extra sections here as {id, title, svg, html} objects.

const pblHelpSections = [
    {
        id: 'pbl-shortcuts',
        title: 'Shortcuts',
        svg: HELP_CTRL_SVG,
        html: buildHelpShortcuts([
            { keys: ['←'],              desc: 'Previous scramble' },
            { keys: ['→'],              desc: 'Next scramble' },
            { keys: ['Space'],          desc: 'Start / stop timer' },
            { keys: ['Backspace'],      desc: 'Remove last case' },
            { keys: ['K'],              desc: 'Toggle karnotation' },
            { keys: ['E'],              desc: 'Go through each case once' },
            { keys: ['R'],              desc: 'Toggle realistic weights' },
            { keys: ['B'],              desc: 'Distinguish + and − barflip' },
            { keys: ['G'],              desc: 'Global barflip override' },
            null,
            { keys: ['Ctrl', 'F'],      desc: 'Focus search box' },
            { keys: ['Ctrl', 'A'],      desc: 'Select all visible' },
            { keys: ['Ctrl', 'S'],      desc: 'Select visible (filtered)' },
            { keys: ['Ctrl', '⇧', 'A'], desc: 'Deselect all visible' },
            { keys: ['Ctrl', '⇧', 'S'], desc: 'Deselect visible (filtered)' },
            { keys: ['Alt', 'A'],       desc: 'Show all' },
            { keys: ['Alt', 'S'],       desc: 'Show selection' },
            { keys: ['Ctrl', 'Z'],      desc: 'Undo last selection change' },
            { keys: ['Ctrl', 'Y'],      desc: 'Redo last selection change' },
        ])
    },
    {
        id: 'pbl-filter',
        title: 'Filter',
        svg: HELP_FILTER_SVG,
        html: `
            <p style="margin-top:14px;opacity:0.9;font-size:0.9em;font-weight:bold;">Filter by Frequency</p>
            <p>Type <b>"freq"</b> followed by a number into the filter box to filter cases by frequency.</p>
            <p style="margin-top:6px;opacity:0.7;font-size:0.9em;">Valid values: 1, 2, 4, 8, 16, 32, 64, 128, 256</p>
            <p style="margin-top:6px;opacity:0.7;font-size:0.9em;">Example: <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">freq 4</code></p>
            <p style="margin-top:14px;opacity:0.9;font-size:0.9em;font-weight:bold;">Suffix tags</p>
            <p style="margin-top:4px;opacity:0.7;font-size:0.9em;">Append <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&lt;tag&gt;</code> after the base filter to narrow results further.</p>

            <p style="margin-top:10px;opacity:0.7;font-size:0.9em;"><code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&lt;o&gt;</code> — order-sensitive: only matches cases where the first name in your filter is the <em>top</em> layer.</p>

            <p style="margin-top:6px;opacity:0.7;font-size:0.9em;">CP-pair tags filter by the corner permutation type of each layer (<b>a</b>&thinsp;=&thinsp;adjacent, <b>o</b>&thinsp;=&thinsp;opposite, <b>s</b>&thinsp;=&thinsp;skip/solved). The first letter is the top layer, the second is the bottom:</p>
            <p style="margin-top:4px;opacity:0.7;font-size:0.9em;padding-left:12px;">
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&lt;aa&gt;</code>
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&lt;ao&gt;</code>
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&lt;as&gt;</code>
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&lt;oa&gt;</code>
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&lt;oo&gt;</code>
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&lt;os&gt;</code>
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&lt;sa&gt;</code>
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&lt;so&gt;</code>
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&lt;ss&gt;</code>
            </p>

            <p style="margin-top:10px;opacity:0.9;font-size:0.9em;font-weight:bold;">Operators</p>
            <p style="margin-top:4px;opacity:0.7;font-size:0.9em;">Tags can be combined with boolean operators (precedence: <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">!</code> &gt; <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">*</code> &gt; <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&amp;</code>):</p>
            <p style="margin-top:4px;opacity:0.7;font-size:0.9em;padding-left:12px;">
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&amp;</code> AND &nbsp;
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">|</code> OR &nbsp;
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">!</code> NOT &nbsp;
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">( )</code> grouping
            </p>

            <p style="margin-top:10px;opacity:0.9;font-size:0.9em;font-weight:bold;">Examples</p>
            <p style="margin-top:4px;opacity:0.7;font-size:0.9em;">
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">T &lt;o&gt;&amp;&lt;aa&gt;</code>
                — T cases where T is specifically the top layer, and both layers are adjacent CP.
            </p>
            <p style="margin-top:6px;opacity:0.7;font-size:0.9em;">
                <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px">&lt;oo&gt;|&lt;aa&gt;</code>
                — any case where both layers are opposite CP, or both are adjacent CP (no base filter, so all case names are considered).
            </p>
        `
    }
    // Add future PBL-specific sections here.
];

// ─── STARTUP ──────────────────────────────────────────────────────────────────
// Load order: generic.js → pbl-core.js (this file).
// generic.js must be loaded first so DOM refs, shared state, and cluster
// infrastructure helpers are available.

pblInit().then(() => {
    applyMode();            // applies the last-used trainer mode (or 'obl' default)
    pblApplyBarflipUI();    // must run after pblShowBarflipUI + pblBarflipOverride are loaded
    updateSelectBtn();
    updateDeselectBtn();
    updateToggle();
});
