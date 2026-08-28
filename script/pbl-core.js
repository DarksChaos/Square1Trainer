import { pblDefaultLists, pblOptimal } from '../data/pbl-data.js';
import { HELP_CTRL_SVG, HELP_EQ_SVG, HELP_FILTER_SVG, HELP_HOME_SVG, HELP_LEARN_SVG, HELP_LIST_SVG, HELP_SEARCH_SVG, HELP_SYNC_SVG, HELP_TAG_SVG } from './help-icons.js';
import { MAX_EACHCASE, MIN_EACHCASE, addListItemEvent, bottom56El, bottom56Row, buildHelpShortcuts, caseListEl, countBarflipEl, currentScrambleEl, defaultListsEl, eachCaseEl, globalBarflipEl, globalBarflipRow, karnEl, pblSnapSelection, previousScrambleEl, randInt, refreshOpenListCounts, setShowMode, setUsingKarn, showAll, showMode, showSelected, showSuccess, timerEl, trainerMode, updateDeselectBtn, updateRemainingCount, updateScrambleNavButtons, updateSelCount, updateSelectBtn, updateToggle, useBarflipEl, userListsEl, usingKarn, usingTimer, weightEl } from './app.js';
import { SquanLib, squan } from './squan.js';
import { setPblCountBarflip, tagCaseModes } from './tag-assignments.js';

export { pblDefaultLists };

// ─── PBL STATE ────────────────────────────────────────────────────────────────

export let pblPossible  = [];  // [[top, bottom], ...]
export let pblSelected  = [];  // entries end with '+' or '-'  e.g. "Al/Ar+"
export let pblScrambleList = []; // [[normal, karn, caseName], ...]
export let pblRemaining = [];
let pblEachCase  = 0;   // 0 = random, 1+ = fixed count per cycle
let pblWeight    = false;
export let pblUseBarflip = false;
export let pblHasActive    = false;
export let pblCaseSpliced  = false; // true once a case has been taken from remaining for display

export let pblOffset      = 0;  // how far back in pblScrambleList we're browsing
let pblCurrentCase  = "";
export let pblPreviousCase = "";

export let pblPreviouslySelected = null; // null = nothing to undo
export let pblRedoSelected       = null; // null = nothing to redo

export function pblSetOffset(value) { pblOffset = value; }
export function pblSetHistory(previous, redo) {
    pblPreviouslySelected = previous;
    pblRedoSelected = redo;
}
export function pblResetSelection() {
    pblSelected = [];
    pblRemaining = [];
}

export let pblScrambleMode  = 'long'; // 'long' | 'short'
let pblAllowBottom56 = false;

let pblWorker     = null;
export let pblWorkerBusy = false;
export let pblPending    = null; // null | 'waiting' | worker-result object
let pblPendingFor = null; // the choice string used to request pblPending (for match validation)

// pblDefaultLists is declared as const in pbl-data.js (JSON moved there).
export let pblUserLists    = {};

// ─── BARFLIP STATE ───────────────────────────────────────────────────────────

let pblSelectBtnState    = 'none'; // 'none'|'both'|'plus'|'minus'
let pblBarflipOverride   = null;   // null | '+' | '-'
let pblShowBarflipUI     = false;
export let pblCountBarflip = false; // "count + and - as 2 cases" — only takes effect while B is on

// True when a case's two barflips should be counted/trained as separate cases:
// the C setting only applies while "distinguish barflip" (B) is on, and not
// while a global barflip override is active — the override forces every case to
// a single barflip, collapsing + and - back into one case.
export function pblCountsSeparately() {
    return pblUseBarflip && pblCountBarflip && pblEffectiveOverride() === null;
}

// Counts case entries (each ending in +/-) as cases, honoring the C setting:
// when on, + and - count separately; otherwise they collapse to their base.
export function pblCaseCount(entries) {
    return pblCountsSeparately()
        ? entries.length
        : new Set(entries.map(s => s.slice(0, -1))).size;
}

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
export function pblSetDomClass(el, mode) {
    el.classList.remove('checked-both', 'checked-plus', 'checked-minus');
    if      (mode === 'both')  el.classList.add('checked-both');
    else if (mode === 'plus')  el.classList.add('checked-plus');
    else if (mode === 'minus') el.classList.add('checked-minus');
}

// Mode-cycling helpers — used by click / right-click / touch / select-all.
function pblNextModeForw(m)   { return m === 'none' ? 'both'  : m === 'both'  ? 'plus' : m === 'plus' ? 'minus' : 'both'; }
function pblNextModeBack(m)  { return m === 'none' ? 'minus' : m === 'minus' ? 'plus' : m === 'plus' ? 'both'  : 'minus'; }
function pblNextModeToggle(m) { return m === 'both' ? 'none'  : 'both'; }

export function pblName(pbl) { return `${pbl[0]}/${pbl[1]}`; }

function pblEffectiveOverride() {
    return (pblShowBarflipUI && pblUseBarflip) ? pblBarflipOverride : null;
}

// Returns true if any selected case has only + or only - chosen (not both).
// This means B is mandatory and cannot be turned off.
function pblIsBarflipRequired() {
    return pblSelected.some(entry => {
        const base = entry.slice(0, -1);
        return !(pblSelected.includes(base + '+') && pblSelected.includes(base + '-'));
    });
}

// Syncs the visual disabled/locked state of the B, W, and E settings rows.
//   • Auto-enables B if single-barflip cases are now selected and B is off.
//   • Locks B (can't uncheck) while single-barflip cases are selected.
//   • W is disabled while E is on  (they do incompatible things to pblRemaining).
//   • E is disabled while W is on.
//   • Resolves the impossible E+W-both-on state by dropping W (E wins).
function pblSyncSettingsDisabled() {
    if (trainerMode !== 'pbl') return; // never mutate PBL-specific state while in OBL

    // Auto-enable B if a selected case now requires it.
    if (pblIsBarflipRequired() && !pblUseBarflip) {
        useBarflipEl.checked = true;
        pblUseBarflip = true;
        globalBarflipRow.style.display = '';
        pblSaveSettings();
    }

    // Resolve E+W conflict: E wins — drop W silently.
    if (eachCaseEl.checked && weightEl.checked) {
        weightEl.checked = false;
        pblWeight = false;
        pblSaveSettings();
    }

    const lockedB  = pblUseBarflip && pblIsBarflipRequired();
    const eachOn   = eachCaseEl.checked;
    const weightOn = weightEl.checked;

    const bRow = useBarflipEl.closest('.settings-row');
    if (bRow) { bRow.classList.toggle('settings-disabled', lockedB);  useBarflipEl.disabled = lockedB; }

    const wRow = weightEl.closest('.settings-row');
    if (wRow) { wRow.classList.toggle('settings-disabled', eachOn);   weightEl.disabled     = eachOn; }

    // eachCaseEl lives in Settings (.settings-row); set .disabled unconditionally
    // and toggle whichever wrapper ancestor is present.
    eachCaseEl.disabled = weightOn;
    const eachWrapper = eachCaseEl.closest('.checkbox-wrapper');
    if (eachWrapper) eachWrapper.classList.toggle('settings-disabled', weightOn);
    const eRow = eachCaseEl.closest('.settings-row');
    if (eRow) eRow.classList.toggle('settings-disabled', weightOn);
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

// ─── PBL STORAGE ─────────────────────────────────────────────────────────────

export const pblStorage = {
    getItem:    k      => localStorage.getItem(k + 'PBL'),
    setItem:    (k, v) => localStorage.setItem(k + 'PBL', v),
    removeItem: k      => localStorage.removeItem(k + 'PBL'),
};

const pblSettingList = [eachCaseEl, karnEl, weightEl, globalBarflipEl, useBarflipEl, countBarflipEl];

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

export function pblSaveSelected() {
    pblStorage.setItem("selected", JSON.stringify(pblSelected));
    // Regenerate scramble if: nothing active, selection gone, or current case was removed.
    if (!pblHasActive || pblSelected.length === 0) pblGenerateScramble();
    else if (pblCurrentCase !== "" && !pblSelected.includes(pblCurrentCase)) pblGenerateScramble(true);
    pblSyncSettingsDisabled();
}

export function pblSaveUserLists() {
    pblStorage.setItem("userLists", JSON.stringify(pblUserLists));
}

function pblSaveBarflipOverride() {
    pblStorage.setItem("barflipOverride", pblBarflipOverride ?? '');
}

export function pblSaveSettings() {
    let store = "";
    for (const el of pblSettingList) store += el.checked ? "1" : "0";
    pblStorage.setItem("settings", store);
    pblStorage.setItem("scrambleMode", pblScrambleMode);
    pblStorage.setItem("allowBottom56", pblAllowBottom56 ? "1" : "0");
}

// Restore PBL checkbox states from storage. When the settings panel is opened
// from OBL, restore only PBL-owned controls so shared controls (E/K) remain OBL's.
export function pblRestoreSettings({ restoreShared = true } = {}) {
    const stored = pblStorage.getItem('settings');
    if (stored !== null) {
        const start = restoreShared ? 0 : 2; // skip each-case + karn when inactive
        for (let i = start; i < pblSettingList.length; i++)
            pblSettingList[i].checked = stored[i] === '1';
    }
    // Sync derived state that depends on checkbox values.
    if (restoreShared) setUsingKarn(karnEl.checked ? 1 : 0);
    pblWeight        = weightEl.checked;
    pblUseBarflip    = useBarflipEl.checked;
    pblShowBarflipUI = globalBarflipEl.checked;
    pblCountBarflip  = countBarflipEl.checked;
    setPblCountBarflip(pblCountsSeparately());
    // Only adjust PBL-only row visibility while PBL is the active trainer —
    // otherwise (settings opened from OBL) applyMode has already hidden these
    // rows and we'd wrongly reveal them.
    if (trainerMode === 'pbl') {
        globalBarflipRow.style.display = pblUseBarflip ? '' : 'none';
        document.getElementById('countbarflip-row').style.display = pblUseBarflip ? '' : 'none';
    }

    const storedScrMode = pblStorage.getItem("scrambleMode");
    if (storedScrMode) {
        pblScrambleMode = storedScrMode;
        const radio = document.querySelector(`input[name="scramlen"][value="${pblScrambleMode}"]`);
        if (radio) radio.checked = true;
    }
    const storedBot56 = pblStorage.getItem("allowBottom56");
    if (storedBot56 !== null) pblAllowBottom56 = storedBot56 === "1";
    bottom56El.checked = pblAllowBottom56;
    bottom56Row.style.display = pblScrambleMode === 'short' ? 'flex' : 'none';
}

// ─── PBL CASE GRID HELPERS ────────────────────────────────────────────────────

export function pblShow(id) { document.getElementById(id)?.classList.remove("hidden"); }
export function pblHide(id) { document.getElementById(id)?.classList.add("hidden"); }

// ─── PBL SELECTION ────────────────────────────────────────────────────────────

export function pblSelect(s) {
    // s must end with '+' or '-'
    const base = s.slice(0, -1);
    const el   = document.getElementById(base);
    if (!pblSelected.includes(s)) pblSelected.push(s);
    if (pblEachCase > 0) {
        const count = pblEachCase * (pblWeight ? squan.getPBLWeight(base) : 1);
        if (pblCountsSeparately()) {
            // This barflip is its own case: (re)build only its slots.
            pblRemaining = pblRemaining.filter(r => r !== s);
            const alreadyConsumed = pblCaseSpliced && pblCurrentCase === s ? 1 : 0;
            pblRemaining = pblRemaining.concat(
                Array.from({ length: Math.max(0, count - alreadyConsumed) }, () => s)
            );
        } else {
            // Recalculate this base's slots with random suffix so both + and -
            // are distributed evenly instead of stacking separately.
            pblRemaining = pblRemaining.filter(r => r.slice(0, -1) !== base);
            const suffixes = ['+', '-'].filter(sx => pblSelected.includes(base + sx));
            // If a case was already spliced this cycle and it belongs to this base,
            // that slot is already "in use" on screen — don't add it back.
            const alreadyConsumed = pblCaseSpliced && pblCurrentCase.slice(0, -1) === base ? 1 : 0;
            pblRemaining = pblRemaining.concat(
                Array.from({ length: Math.max(0, count - alreadyConsumed) }, () => base + suffixes[randInt(0, suffixes.length - 1)])
            );
        }
    }
    if (el) {
        const override = pblEffectiveOverride();
        const mode     = pblCaseMode(base);
        pblSetDomClass(el, (override !== null && mode !== 'none') ? (override === '+' ? 'plus' : 'minus') : mode);
    }
    updateSelCount();
    updateRemainingCount();
}

export function pblDeselect(s) {
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
    updateRemainingCount();
}

// ─── PBL WEIGHTS & EACH-CASE ─────────────────────────────────────────────────

// pblGetOptimal: optimal slicecount for a case like "Al/Ul", reversing the
// pblOptimal compression — try the alphabetically-sorted family, then the case
// itself, then its mirror. Throws if none are present.
export function pblGetOptimal(pbl) {
    const fam = squan.getPBLFamily(pbl).split("/").sort().join("/");
    if (fam in pblOptimal) return pblOptimal[fam];
    if (pbl in pblOptimal) return pblOptimal[pbl];
    const mirror = pbl.split("/").toReversed().join("/");
    if (mirror in pblOptimal) return pblOptimal[mirror];
    throw new Error("pblGetOptimal: no optimal slicecount for " + pbl);
}

function pblRefillRemaining() {
    pblEachCase = pblEachCase === 0 ? randInt(MIN_EACHCASE, MAX_EACHCASE) : pblEachCase;
    if (pblCountsSeparately()) {
        // Each selected barflip is its own case: give every entry its own
        // weight×eachCase slots. A 'both' case thus gets twice the slots of a
        // single-barflip case (×2 vs ×1 under realistic weights).
        pblRemaining = pblSelected.flatMap(s => {
            const count = pblEachCase * (pblWeight ? squan.getPBLWeight(s.slice(0, -1)) : 1);
            return Array.from({ length: count }, () => s);
        });
        return;
    }
    // De-duplicate by base so a case's weight is independent of how many barflip
    // states are selected. Each base case gets weight×eachCase slots; the suffix
    // is chosen randomly from whichever barflips are selected for it.
    const seenBases    = new Set();
    const dedupedBases = [];
    for (const s of pblSelected) {
        const base = s.slice(0, -1);
        if (!seenBases.has(base)) { seenBases.add(base); dedupedBases.push(base); }
    }
    pblRemaining = dedupedBases.flatMap(base => {
        const count    = pblEachCase * (pblWeight ? squan.getPBLWeight(base) : 1);
        const suffixes = ['+', '-'].filter(sx => pblSelected.includes(base + sx));
        return Array.from({ length: count }, () => base + suffixes[randInt(0, suffixes.length - 1)]);
    });
}

// ─── PBL WORKER ──────────────────────────────────────────────────────────────

pblWorker = new Worker('./script/worker.js', { type: 'module' });

function pblRestartWorker() {
    if (pblWorker) pblWorker.terminate();
    pblWorker = new Worker('./script/worker.js', { type: 'module' });
    pblWorker.onmessage = pblNormalHandler;
    pblWorkerBusy = false;
    pblPendingFor  = null;
}

function pblNormalHandler(e) {
    pblWorkerBusy = false;
    if (e.data.error) { console.error('PBL worker error:', e.data.error); return; }
    pblPending = e.data;
}

export function pblRequestScramble(choice) {
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
    if (pblWorkerBusy && changed) { pblRestartWorker(); pblPending = null; pblPendingFor = null; }
    else if (pblPendingConflicts(newMode, newBottom56)) { pblPending = null; pblPendingFor = null; }
}

// ─── PBL SCRAMBLE GENERATION ─────────────────────────────────────────────────

export function pblGenerateScramble(regen = false) {
    if (pblSelected.length === 0) {
        timerEl.textContent            = "--:--";
        currentScrambleEl.textContent  = "Scramble will show up here";
        previousScrambleEl.textContent = "Last scramble will show up here";
        pblHasActive    = false;
        pblCaseSpliced  = false;
        pblScrambleList = [];
        pblPending      = null;
        updateRemainingCount();
        updateScrambleNavButtons();
        return;
    }

    // Guard: don't go into offset-browsing mode when called from selection changes.
    if (pblOffset < 0) pblOffset = 0;

    if (pblRemaining.length === 0) {
        // refill the entire array
        pblRefillRemaining();
        if (pblEachCase === 1 && pblCaseSpliced && !regen) showSuccess("Trained each case.", 1000);
    }

    pblCaseSpliced = true; // set synchronously before splice
    const idx    = randInt(0, pblRemaining.length - 1);
    const choice = pblRemaining.splice(idx, 1)[0];
    updateRemainingCount();

    if (regen) {
        pblPending    = 'waiting';
        pblPendingFor = null; // regen is not speculative; clear any stale tracker
        pblWorkerBusy = false; // allow re-fire
        pblRequestScramble(choice);
        pblWorker.onmessage = function(e) {
            pblWorkerBusy = false;
            if (e.data.error) { console.error(e.data.error); return; }
            const final = [e.data.scramble, e.data.karn, choice];
            pblPreviousCase = pblCurrentCase;
            pblCurrentCase  = choice; // use full choice (with suffix) for accurate tracking
            pblScrambleList[pblScrambleList.length - 1] = final;
            if (pblOffset === 0) currentScrambleEl.textContent = final[usingKarn];
            pblWorker.onmessage = pblNormalHandler;
        };
        return;
    }

    // Normal generate — use a pre-generated pending scramble only if it matches choice.
    // pblPendingFor tracks which choice was used for the speculative pre-gen request.
    const pendingValid = pblPending && pblPending !== 'waiting' &&
        pblPendingFor !== null &&
        pblPendingFor.slice(0, -1) === choice.slice(0, -1) &&
        (pblEffectiveOverride() !== null || pblPendingFor.at(-1) === choice.at(-1));
    if (pendingValid) {
        const data = pblPending;
        pblPending    = null;
        pblPendingFor = null;
        pblPreviousCase = pblCurrentCase;
        pblCurrentCase  = choice; // use full choice (with suffix) for accurate tracking
        const final = [data.scramble, data.karn, choice];

        if (pblScrambleList.length) {
            previousScrambleEl.textContent =
                "Previous scramble: " + pblScrambleList.at(-1)[usingKarn] +
                " (" + pblScrambleList.at(-1)[2] + ")";
        }
        currentScrambleEl.textContent = final[usingKarn];
        pblScrambleList.push(final);
        if (!pblHasActive) timerEl.textContent = "0.00";
        pblHasActive = true;
        updateScrambleNavButtons();

        // Kick off pre-generation of the next scramble.
        if (pblRemaining.length > 0) {
            const pregenChoice = pblRemaining[randInt(0, pblRemaining.length - 1)];
            pblPendingFor = pregenChoice;
            pblRequestScramble(pregenChoice);
        }
    } else {
        // No valid pending (none cached, mismatch, or worker busy with wrong case) —
        // discard stale result, cancel any in-flight speculative gen, and generate for choice.
        pblPending    = null;
        pblPendingFor = null;
        if (pblWorkerBusy) pblRestartWorker();
        currentScrambleEl.classList.add("generating");
        pblPending = 'waiting';
        pblRequestScramble(choice);

        pblWorker.onmessage = function(e) {
            pblWorkerBusy = false;
            if (e.data.error) { console.error(e.data.error); return; }
            const data = e.data;
            pblPreviousCase = pblCurrentCase;
            pblCurrentCase  = choice; // use full choice (with suffix) for accurate tracking
            const final = [data.scramble, data.karn, choice];

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
            updateScrambleNavButtons();

            // Kick off pre-generation of the next scramble.
            if (pblRemaining.length > 0) {
                const pregenChoice = pblRemaining[randInt(0, pblRemaining.length - 1)];
                pblPendingFor = pregenChoice;
                pblRequestScramble(pregenChoice);
            } else {
                pblPendingFor = null;
            }
            pblWorker.onmessage = pblNormalHandler;
        };
    }
}

// Default handler only caches the worker result; pblGenerateScramble reads it on
// the next call. This keeps the worker from writing to currentScrambleEl while
// the OBL trainer is active.
pblWorker.onmessage = pblNormalHandler;

export function pblDisplayPrevScram() {
    const prev = pblScrambleList.at(-2 - pblOffset);
    previousScrambleEl.textContent = prev
        ? "Previous scramble: " + prev[usingKarn] + " (" + prev[2] + ")"
        : "Last scramble will show up here";
    updateScrambleNavButtons();
}

// ─── PBL GRID ─────────────────────────────────────────────────────────────────

let pblGridBuildScheduled = false;

function pblGridBuilt() {
    return caseListEl.dataset.trainerGrid === 'pbl' && caseListEl.childElementCount === pblPossible.length;
}

export function pblEnsureGrid() {
    if (pblGridBuilt()) {
        pblRecolorAll(); // grid already built — re-sync cell colors with current selection
        return;
    }
    if (pblGridBuildScheduled) return;
    pblGridBuildScheduled = true;

    // Let the modal become visible before doing the expensive DOM construction.
    requestAnimationFrame(() => {
        pblGridBuildScheduled = false;
        if (trainerMode === 'pbl') pblRestoreGrid(true);
    });
}

export function pblRestoreGrid(buildGrid = false) {
    if (buildGrid) {
    caseListEl.dataset.trainerGrid = 'pbl';
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
                // must deselect before select! because deselect might just delete
                // the case in pblRemaining that was selected in the select function.
                else if (mode === 'both')  { pblDeselect(base+'-'); pblSelect(base+'+'); }
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
                // must deselect before select! because deselect might just delete
                // the case in pblRemaining that was selected in the select function.
                else                       { pblDeselect(base+'-'); pblSelect(base+'+'); }
            }
            pblSaveSelected();
        });

        pblSetDomClass(caseEl, pblCaseMode(base));
    });

    applyFilter(''); // re-run any in-memory filter on the newly built DOM
    }

    // Update display — restore scramble text when a PBL scramble is active.
    if (pblHasActive && pblScrambleList.length) {
        currentScrambleEl.textContent = pblScrambleList.at(-1 - pblOffset)[usingKarn];
        pblDisplayPrevScram();
        if (timerEl.textContent === '--:--') timerEl.textContent = '0.00';
    } else {
        currentScrambleEl.textContent  = "Scramble will show up here";
        previousScrambleEl.textContent = "Last scramble will show up here";
        timerEl.textContent            = "--:--";
        updateScrambleNavButtons();
    }

    updateSelCount();
    // Respect the selector view the app restored for this trainer.
    if (pblGridBuilt()) {
        if (showMode === 'selected' && pblSelected.length > 0) showSelected();
        else showAll();
    }
    updateSelectBtn();
    updateDeselectBtn();
    pblSyncSettingsDisabled();
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

export function pblSelectAll(isRightClick = false) {
    if (usingTimer()) return;
    pblSnapSelection();
    const bases = pblPossible.map(pbl => pblName(pbl));
    if (!pblUseBarflip) pblSelectBtnState = pblNextModeToggle(pblSelectBtnState);
    else                pblSelectBtnState = isRightClick ? pblNextModeBack(pblSelectBtnState) : pblNextModeForw(pblSelectBtnState);
    pblApplyModeToList(bases, pblSelectBtnState);
}

export function pblDeselectAll() {
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

export function pblSelectThese(isRightClick = false) {
    if (usingTimer()) return;
    pblSnapSelection();
    const bases = pblGetVisibleBases();
    if (!pblUseBarflip) pblSelectBtnState = pblNextModeToggle(pblSelectBtnState);
    else                pblSelectBtnState = isRightClick ? pblNextModeBack(pblSelectBtnState) : pblNextModeForw(pblSelectBtnState);
    pblApplyModeToList(bases, pblSelectBtnState);
}

export function pblDeselectThese() {
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

export function pblAddUserLists() {
    let html = "";
    for (const k of Object.keys(pblUserLists)) {
        const count = pblCaseCount(pblUserLists[k]);
        html += `<div id="${k}" class="list-item">${k} (${count})</div>`;
    }
    if (!html) html = '<div class="list-empty">No list to show. Create a new one!</div>';
    userListsEl.innerHTML = html;
    document.querySelectorAll("#userlists>.list-item").forEach(addListItemEvent);
    pblSaveUserLists();
}

export function pblAddDefaultLists() {
    let html = "";
    for (const k of Object.keys(pblDefaultLists)) {
        const count = pblCaseCount(pblDefaultLists[k]);
        html += `<div id="${k}" class="list-item">${k} (${count})</div>`;
    }
    defaultListsEl.innerHTML = html;
    document.querySelectorAll("#defaultlists>.list-item").forEach(addListItemEvent);
}

export function pblSelectList(listName, setSelection) {
    if (listName == null) { showAll(); return; }

    const list = Object.keys(pblDefaultLists).includes(listName)
        ? pblDefaultLists[listName]
        : pblUserLists[listName];

    // Hide everything, then reveal only the list's cases.
    pblPossible.forEach(pbl => pblHide(pblName(pbl)));
    if (Array.isArray(list)) {
        const shownBases = new Set();
        for (const entry of list) {
            const base = entry.replace(/(?<!\/)[+-]$/, '');
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
        if (pblEachCase > 0) {
            pblRefillRemaining();
            // The active case is already being displayed — remove one of its freshly-added
            // slots so the counter doesn't double-count it.
            if (pblCaseSpliced && pblCurrentCase) {
                const base = pblCurrentCase.slice(0, -1);
                const idx  = pblRemaining.findIndex(r => r.slice(0, -1) === base);
                if (idx !== -1) pblRemaining.splice(idx, 1);
            }
        }
        pblSaveSelected();
        updateRemainingCount();
    }

    setShowMode('list');
    updateToggle();
    pblSaveUserLists();
}

// Show (and optionally select) every case belonging to a tag's clusters. Each
// case is selected as the barflip mode implied by its tagged solution groups'
// slicecounts (see tagCaseModes), unless a global barflip override forces a mode.
export function pblSelectTag(tagId, setSelection) {
    const modes = tagCaseModes(tagId);

    pblPossible.forEach(pbl => pblHide(pblName(pbl)));
    for (const { base } of modes) pblShow(base);

    if (setSelection) {
        const ovr = pblEffectiveOverride(); // null | '+' | '-'
        pblSnapSelection();
        pblDeselectAll();
        for (const { base, mode } of modes) {
            const m = ovr ?? mode; // global override wins; otherwise slicecount-derived mode
            if (m === '+')      pblSelect(base + '+');
            else if (m === '-') pblSelect(base + '-');
            else { pblSelect(base + '+'); pblSelect(base + '-'); }
        }
        if (pblEachCase > 0) {
            pblRefillRemaining();
            if (pblCaseSpliced && pblCurrentCase) {
                const b   = pblCurrentCase.slice(0, -1);
                const idx = pblRemaining.findIndex(r => r.slice(0, -1) === b);
                if (idx !== -1) pblRemaining.splice(idx, 1);
            }
        }
        pblSaveSelected();
        updateRemainingCount();
    }

    setShowMode('list');
    updateToggle();
}

// ─── PBL INIT ─────────────────────────────────────────────────────────────────

let pblInitialized = false;

export async function pblInit() {
    if (pblInitialized) return;
    pblInitialized = true;

    // Build the full cross-product list (even×even + odd×odd).
    for (const t of SquanLib.evenPLL) for (const b of SquanLib.evenPLL) pblPossible.push([t, b]);
    for (const t of SquanLib.oddPLL)  for (const b of SquanLib.oddPLL)  pblPossible.push([t, b]);
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
    pblLoadStorage();

    // Prepare default lists in memory. The hidden list-menu DOM is rendered only
    // when the lists modal opens.
    for (const k of Object.keys(pblDefaultLists))
        pblDefaultLists[k] = pblMigrateLegacy(pblDefaultLists[k]);
}

export function pblLoadStorage() {
    pblMigrateLegacyStorage();

    const storedSelected  = pblStorage.getItem("selected");
    const storedSettings  = pblStorage.getItem("settings");
    const storedScrMode   = pblStorage.getItem("scrambleMode");
    const storedBot56     = pblStorage.getItem("allowBottom56");
    const storedBarflip   = pblStorage.getItem("barflipOverride");
    const storedUserLists = pblStorage.getItem("userLists");

    // Apply settings checkboxes directly. Do not synthetic-click during load:
    // the shared E/K controls have trainer-aware handlers, and firing them while
    // restoring storage can overwrite the other trainer's settings.
    for (const el of pblSettingList) el.checked = false;
    if (storedSettings !== null) {
        for (let i = 0; i < pblSettingList.length; i++)
            pblSettingList[i].checked = storedSettings[i] === "1";
    } else {
        karnEl.checked = true; // default: karn on
    }
    setUsingKarn(karnEl.checked ? 1 : 0);
    pblWeight        = weightEl.checked;
    pblUseBarflip    = useBarflipEl.checked;
    pblShowBarflipUI = globalBarflipEl.checked;

    globalBarflipRow.style.display = pblUseBarflip ? '' : 'none';
    // Explicitly resolve any incompatible settings combinations that may have come
    // from an uploaded JSON (e.g. both E and W enabled). Don't rely on .click()
    // being a no-op on disabled elements — resolve unconditionally after the loop.
    pblSyncSettingsDisabled();

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

    // Sync C's variable + row from the restored checkbox (after the override is
    // loaded, so pblCountsSeparately is correct for the pool build below).
    pblCountBarflip = countBarflipEl.checked;
    document.getElementById('countbarflip-row').style.display = pblUseBarflip ? '' : 'none';
    setPblCountBarflip(pblCountsSeparately());

    if (storedSelected !== null) {
        pblSelected = pblMigrateLegacy(JSON.parse(storedSelected));
        pblStorage.setItem("selected", JSON.stringify(pblSelected)); // persist migrated form
        pblEachCase = eachCaseEl.checked ? 1 : randInt(MIN_EACHCASE, MAX_EACHCASE);
        pblRefillRemaining();
        // Only generate scramble immediately if PBL is the active trainer.
        // If starting in OBL mode, applyMode will handle OBL; PBL generates when switched to.
        if (trainerMode === 'pbl') pblGenerateScramble();
    } else {
        // First-ever load — select all cases in 'both' mode.
        pblSelected = pblPossible.flatMap(pbl => [pblName(pbl) + '+', pblName(pbl) + '-']);
        pblEachCase = eachCaseEl.checked ? 1 : randInt(MIN_EACHCASE, MAX_EACHCASE);
        pblRefillRemaining();
        pblSaveSelected();
    }

    updateSelCount();
    pblRecolorAll(); // re-sync each cell's selected styling (e.g. after an upload)
    if (pblGridBuilt()) {
        if (showMode === 'selected' && pblSelected.length > 0) showSelected();
        else showAll();
    }

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
    }
}

// ─── PBL SETTINGS HANDLERS ────────────────────────────────────────────────────

// After a pool rebuild, the active case is already on screen — drop one of its
// freshly-added slots so the remaining counter doesn't double-count it. Matches
// the exact barflip when counting separately, else any slot of its base.
function pblConsumeActiveSlot() {
    if (!(pblCaseSpliced && pblCurrentCase)) return;
    const matches = pblCountsSeparately()
        ? (r => r === pblCurrentCase)
        : (r => r.slice(0, -1) === pblCurrentCase.slice(0, -1));
    const idx = pblRemaining.findIndex(matches);
    if (idx !== -1) pblRemaining.splice(idx, 1);
}

// Re-sync the "count separately" mirror used by tag counts, and — when C could
// have an effect (B + C on) — rebuild the each-case pool and refresh the visible
// counts. Call whenever B, C, or the effective global override changes, since
// each of those flips whether + and - count as one case or two.
function pblResyncCountBarflip() {
    setPblCountBarflip(pblCountsSeparately());
    // C only ever affects counts while B is on; otherwise there's nothing to
    // rebuild. When B is on, rebuild on every relevant change (C or override
    // toggled either way) so + and - merge or split immediately.
    if (trainerMode !== 'pbl' || !pblUseBarflip) return;
    pblRefillRemaining();
    pblConsumeActiveSlot();
    updateSelCount();
    updateRemainingCount();
}

export function pblOnEachCase() {
    pblEachCase = eachCaseEl.checked ? 1 : randInt(MIN_EACHCASE, MAX_EACHCASE);
    pblRefillRemaining();
    pblConsumeActiveSlot();
    updateRemainingCount();
    pblSaveSettings();
    pblSyncSettingsDisabled();
}

// Rebuilds the each-case pool and selection counts when "count + and - as 2
// cases" is toggled, so + and - split or merge immediately. No effect unless B
// is on (the setting is gated on it).
export function pblOnCountBarflip() {
    pblCountBarflip = countBarflipEl.checked;
    pblResyncCountBarflip();
    refreshOpenListCounts(); // update Manage-lists counts live if that modal is open
    pblSaveSettings();
}

export function pblOnWeights() {
    pblWeight = weightEl.checked;
    pblRefillRemaining();
    pblConsumeActiveSlot();
    pblSaveSettings();
    pblSyncSettingsDisabled();
}

weightEl.addEventListener("change",   () => pblOnWeights());

document.querySelectorAll('input[name="scramlen"]').forEach(radio => {
    radio.addEventListener("change", () => {
        const newMode = radio.value;
        pblCancelIfConflicting(newMode, pblAllowBottom56);
        pblScrambleMode = newMode;
        bottom56Row.style.display = pblScrambleMode === 'short' ? 'flex' : 'none';
        if (trainerMode === 'pbl') pblGenerateScramble(true);
        pblSaveSettings();
    });
});

bottom56El.addEventListener("change", function() {
    const newBottom56 = this.checked;
    pblCancelIfConflicting(pblScrambleMode, newBottom56);
    pblAllowBottom56 = newBottom56;
    if (trainerMode === 'pbl' && pblScrambleMode === 'short') pblGenerateScramble(true);
    pblSaveSettings();
});

// ─── BARFLIP OVERRIDE UI ─────────────────────────────────────────────────────

const pblBarflipOverrideRow = document.getElementById('barflip-override-row');
const pblFlippedBtn         = document.getElementById('barflip-flipped');
const pblSolvedBtn          = document.getElementById('barflip-solved');

export function pblApplyBarflipUI() {
    const showOverride = pblShowBarflipUI && pblUseBarflip;
    if (pblBarflipOverrideRow) pblBarflipOverrideRow.classList.toggle('hidden', !showOverride);
    if (pblFlippedBtn) pblFlippedBtn.classList.toggle('active', showOverride && pblBarflipOverride === '+');
    if (pblSolvedBtn)  pblSolvedBtn.classList.toggle('active',  showOverride && pblBarflipOverride === '-');
}

function pblSetBarflipOverride(value) {
    const prev          = pblBarflipOverride;
    const prevEffective = pblEffectiveOverride();
    pblBarflipOverride = value;
    pblApplyBarflipUI();
    pblSaveBarflipOverride();
    if (trainerMode !== 'pbl') return;
    pblRecolorAll();
    // Turning the override on or off (not switching + ↔ -) flips whether + and -
    // collapse to one case — re-sync counts/pool when that changes.
    if ((prevEffective === null) !== (pblEffectiveOverride() === null)) pblResyncCountBarflip();
    if (pblHasActive && prev && pblBarflipOverride && prev !== pblBarflipOverride) {
        pblPending = null;
        pblGenerateScramble(true);
    }
}

export function pblOnUseBarflip() {
    // Prevent unchecking B when single-barflip cases are selected.
    if (!useBarflipEl.checked && pblIsBarflipRequired()) {
        useBarflipEl.checked = true;
        pblSyncSettingsDisabled();
        return;
    }
    // Capture effective override before mutating pblUseBarflip so the
    // before/after comparison is accurate.
    const prevEffective = pblEffectiveOverride();
    pblUseBarflip = useBarflipEl.checked;
    // G's and C's checkbox states are intentionally left alone — their effect is
    // gated on pblUseBarflip (pblEffectiveOverride / pblCountsSeparately), so they
    // do nothing while B is off. We only show/hide their rows and re-sync C's
    // mirror + pool, since C's effective value flips with B.
    globalBarflipRow.style.display = pblUseBarflip ? '' : 'none';
    document.getElementById('countbarflip-row').style.display = pblUseBarflip ? '' : 'none';
    pblApplyBarflipUI();
    // B just flipped, which flips C's effective value — re-sync counts/pool.
    pblResyncCountBarflip();
    if (trainerMode !== 'pbl') { pblSaveSettings(); return; }
    pblRecolorAll();
    const newEffective = pblEffectiveOverride();
    if (pblHasActive && prevEffective !== newEffective) { pblPending = null; pblGenerateScramble(true); }
    pblSaveSettings();
    pblSyncSettingsDisabled();
}

export function pblOnGlobalBarflip() {
    const prevEffective = pblEffectiveOverride();
    pblShowBarflipUI = globalBarflipEl.checked;
    pblApplyBarflipUI();
    if (trainerMode !== 'pbl') { pblSaveSettings(); return; }
    pblRecolorAll();
    const newEffective = pblEffectiveOverride();
    // Toggling the override on/off (via showing/hiding G) flips whether + and -
    // collapse to one case — re-sync counts/pool when the effective state changes.
    if (prevEffective !== newEffective) pblResyncCountBarflip();
    if (pblHasActive && prevEffective !== newEffective) { pblPending = null; pblGenerateScramble(true); }
    pblSaveSettings();
}

globalBarflipEl.addEventListener("change", () => pblOnGlobalBarflip());
useBarflipEl.addEventListener("change",    () => pblOnUseBarflip());
countBarflipEl.addEventListener("change",  () => pblOnCountBarflip());

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

export const pblHelpSections = [
    {
        id: 'pbl-home',
        title: 'Navigation',
        svg: HELP_HOME_SVG,
        html: `<p>Click on the <b>title at the top of the website</b> to switch trainers.</p>`
    },
    {
        id: 'pbl-shortcuts',
        title: 'Shortcuts',
        svg: HELP_CTRL_SVG,
        html: buildHelpShortcuts([
            { keys: ['←'],         desc: 'Previous scramble' },
            { keys: ['→'],         desc: 'Next scramble' },
            { keys: ['Space'],     desc: 'Start / stop timer' },
            { keys: ['Backspace'], desc: 'Remove last case' },
            { keys: ['K'],         desc: 'Toggle karnotation' },
            { keys: ['E'],         desc: 'Train each case once',
                info:   "Go through each of your selected cases once, and let you " +
                        "know when you've gone through all of them. Incompatible " +
                        "with any of the weights options." },
            { keys: ['R'],         desc: 'Toggle realistic weights',
                info:   "Make cases as likely to appear as they are in a real solve. " +
                        "Incompatible with \"Train each case once\"." },
            { keys: ['B'],         desc: 'Distinguish between + and − barflip',
                info:   "Allow selecting + only or - only, for a specific case." },
            { keys: ['G'],         desc: 'Global barflip override',
                info:   "Temporarily make all selected cases + or -. Check case " +
                        "selector to switch between +, -, and none (no override)." },
            { keys: ['C'],         desc: 'Count + and − as 2 cases',
                info:   "Count each PBL as 2 cases: + and -. Affects the " +
                        "\"selected\" count, and the case counts for lists and tags. " +
                        "Combined with \"Train each case once\", you can train each " +
                        "case once while treating barflips like different cases." },
            { keys: ['H'],         desc: 'Hide hint button' },
            null,
            { keys: ['Ctrl', 'F'],      desc: 'Focus search box' },
            { keys: ['Ctrl', 'Space'],  desc: 'Toggle search bar' },
            { keys: ['Ctrl', 'A'],      desc: 'Select ALL cases' },
            { keys: ['Ctrl', 'S'],      desc: 'Select all visible cases',
                info:   "Select all cases currently shown in the case selector." },
            { keys: ['Ctrl', '⇧', 'A'], desc: 'Deselect ALL cases' },
            { keys: ['Ctrl', '⇧', 'S'], desc: 'Deselect all visible cases',
                info:   "Deselect all cases currently shown in the case selector." },
            { keys: ['Alt', 'A'],       desc: 'Show all' },
            { keys: ['Alt', 'S'],       desc: 'Show selection',
                info:   "Show all selected cases." },
            { keys: ['Ctrl', 'Z'],      desc: 'Undo last selection change' },
            { keys: ['Ctrl', 'Y'],      desc: 'Redo last selection change' },
        ])
    },
    {
        id: 'pbl-filter',
        title: 'Filter',
        svg: HELP_FILTER_SVG,
        html: `
            <h1>Filter by Frequency</h1>
            <p>
                Type <b>"freq"</b> followed by a number into the filter box to filter cases by frequency.
            </p>
            <i>
                Valid values: 1, 2, 4, 8, 16, 32, 64, 128, 256
            </i>
            <i>
                Example: <code>freq 4</code>
            </i>

            <h1>Suffixes</h1>
            <p>
                Append <code>&lt;suffix&gt;</code> after the base filter to narrow results further.
            </p>
            <i>
                <code>&lt;o&gt;</code> — order-sensitive: only matches cases where the first name in your filter is the <em>top</em> layer.
            </i>
            <i>
                CP-pair suffixes filter by the corner permutation type of each layer (<b>a</b>&thinsp;=&thinsp;adjacent, <b>o</b>&thinsp;=&thinsp;opposite, <b>s</b>&thinsp;=&thinsp;skip/solved). The first letter is the top layer, the second is the bottom:
            </i>
            <i>
                <code>&lt;aa&gt;</code>
                <code>&lt;ao&gt;</code>
                <code>&lt;as&gt;</code>
                <code>&lt;oa&gt;</code>
                <code>&lt;oo&gt;</code>
                <code>&lt;os&gt;</code>
                <code>&lt;sa&gt;</code>
                <code>&lt;so&gt;</code>
                <code>&lt;ss&gt;</code>
            </i>

            <h1 style="margin-top:10px;">Operators</h1>
            <p>
                Suffixes can be combined with boolean operators (precedence: <code>!</code> &gt; <code>*</code> &gt; <code>&amp;</code>):
            </p>
            <i style="padding-left:12px;">
                <code>&amp;</code> AND &nbsp;
                <code>|</code> OR &nbsp;
                <code>!</code> NOT &nbsp;
                <code>( )</code> grouping
            </i>

            <h1 style="margin-top:10px;">Examples</h1>
            <i>
                <code>T &lt;o&gt;&amp;&lt;aa&gt;</code>
                — T cases where T is specifically the top layer, and both layers are adjacent CP.
            </i>
            <i style="margin-top:6px;">
                <code>&lt;oo&gt;|&lt;aa&gt;</code>
                — any case where both layers are opposite CP, or both are adjacent CP (no base filter, so all case names are considered).
            </i>
        `
    },
    {
        id: 'pbl-equator',
        title: "Custom barflip",
        svg: HELP_EQ_SVG,
        html: `
        <h1>Getting Started</h1>
        <p>Enable <b>"Distinguish between + and - barflip (B)"</b> in the settings.</p>

        <h1>Selecting cases</h1>
        <p>
            When you click on a case, it will be selected as <b>both-barflip state</b>. This means if you train long enough, you will get the case with both bar flipped and solved.
            When you click again, it will be selected as <b>+ barflip only</b>. Click again to select the case as <b>- barflip only</b>, and click again to deselect.
            You can also right-click to cycle in the other way. The same logic works with any of the select buttons, for example the "Select ALL" button.
        </p>
        <i style="padding-left:12px;">
            <span style="color:hsl(210, 80%, 70%);font-weight:bold;">Blue</span> — Both barflips.<br>
            <span style="color:hsl(40, 80%, 70%);font-weight:bold;">Orange</span> — Only +.<br>
            <span style="color:hsl(110, 80%, 70%);font-weight:bold;">Green</span> — Only -.<br>
            <span style="color:#999;font-weight:bold;">Gray</span> — Deselected.
        </i>

        <h1>Still one case</h1>
        <p>
            <b>"Train each case once (E)"</b>, <b>"Use realistic weights (R)"</b>, and "selected: xxx" still treat both barflips of the case as a single case.
            This means you can safely select both barflips and use Train each case, and it will not Train both + and - separately.
        </p>
        <p>
            <b>EXCEPTION</b>: With <b>"Count + and - as 2 cases (C)"</b>, the two barflips are treated as two cases.
            This affects lists/tags case counts, and makes both-barflip cases 2x as likely to show up.
        </p>

        <h1>Global Override</h1>
        <p>
            Enable <b>"Show global barflip override (G)"</b> to display a toggle on the home screen.
            This allows you to temporarily force EVERY case to be either + or -.
            You may select either 0 (no override) or 1 (yes override) options, but you cannot select both options at the same time.
        </p>
    `
    },
    {
        id: 'pbl-search',
        title: 'Search',
        svg: HELP_SEARCH_SVG,
        html: `
        <p>
            The search bar can be opened from the <b>${window.matchMedia("(max-width: 600px)").matches ? "bottom bar" : "sidebar"}</b> (or with Ctrl/Cmd + Space).
        </p>

        <h1>Search clusters</h1>
        <p>
            From within the search bar, simply enter the name of any case or cluster and hit Enter, and you will be sent to the <b>cluster reference</b> for it.
            For help within cluster reference, go the Learn section (book icon).
        </p>

        <h1>Search actions</h1>
        <p>
            Within the search bar, you can also type <b>keywords</b> to access certain actions.
            Actions are listed below:
        </p>
        <p><code>lists</code> — Add, delete, and overwrite your lists.</p>
        <p><code>tags</code> — Add, delete, and rename your tags.</p>
        <p><code>random</code> — Open a random cluster, reflecting realistic weights.</p>
        <p><code>random untagged</code> — Open a random cluster that has no tagged solutions. Great for getting a random case that you haven't learned yet.</p>`
    },
    {
        id: 'pbl-lists',
        title: 'Lists',
        svg: HELP_LIST_SVG,
        html: `
        <p>
            To see and manage your lists, enter <b>"lists"</b> in the search bar.
            Or, open the case selector from the ${window.matchMedia("(max-width: 600px)").matches ? "bottom bar" : "sidebar"}, and ${window.matchMedia("(max-width: 600px)").matches ? "tap" : "click"} on <b>"Select list"</b>.
        </p>

        <h1>List actions</h1>
        <p>
            At the bottom of the window, you should see 5 buttons.
            Here's what each of them does:
        </p>
        <p><code>Delete</code> — Delete the selected list.</p>
        <p><code>Overwrite</code> — Overwrite the content of the selected list with the cases that are currently selected.</p>
        <p><code>View</code> — Display, in the case selector, the cases belonging to the selected list. Great for when you want to see what the list has without losing your current selection.</p>
        <p><code>Select</code> — Replace whatever cases you have selected with the cases in the list.</p>
        <p><code>New List</code> — Create a new list containing the cases you have selected. The name is up to you!</p>

        <h1>List tricks</h1>
        <p>Here's some additional things you can accomplish with those 5 buttons:</p>
        <p>Rename a list: <code>select</code> it, <code>delete</code> it, and <code>new list</code>.</p>
        <p>Edit a list: <code>select</code> it, make the edits to your current selection in the case selector, and <code>overwrite</code> your original list.</p>

        <h1>Tags</h1>
        <p>You will also see your tags in the list window. For help with these, see the next section.</p>`
    },
    {
        id: 'pbl-tags',
        title: 'Tags',
        svg: HELP_TAG_SVG,
        html: `
        <h1>What are tags?</h1>
        <p><b>1. cluster-based</b></p>
        <p>
            Often, your lists will be in clusters.
            For example, if your "learning" list contains Cl/Q, it probably also contains Cr/Q, Q/Cl, and Q/Cr.
            Hence, you can simply tag the entire cluster of "C/Q, Q/C" as "learning". This will tag all 4 cases.
        </p>
        <p><b>2. solution-based</b></p>
        <p>
            You can tag a solution group in Matt's cluster reference view.
            This allows you to, for example, mark one solution as "learning" and another as "perfected".
        </p>

        <h1>Managing tags</h1>
        <p>
            Open up the search bar and type "tags".
            This opens up the window where you add, delete, and reorder tags.
        </p>

        <h1>Training tags</h1>
        <p>
            Open up the lists window (see the previous section for instructions).
            Here you will be able to view and select a tag just like you would with a list.
        </p>
        <p>
            The solution groups you tag will determine which of the barflips will be selected when you select the tag.
        </p>

        <h1>Tags → Lists</h1>
        <p>
            If you want to export a tag to a list, simply <code>select</code> the tag, and <code>new list</code>.
        </p>
        `
    },
    {
        id: 'pbl-learn',
        title: 'Learn',
        svg: HELP_LEARN_SVG,
        html: `
        <h1>Cluster references</h1>
        <p>Cluster reference is the window that pops up when you click on a scramble.</p>
        <p>
            You can leave a <b>hint</b> for yourself in the cluster reference.
            To see what that does, scroll down.
        </p>
        <p>
            You can <b>edit</b> the content of the cluster reference to suit your solutions by simply clicking on the edit icon.
        </p>
        <p>
            There are 3 <b>views</b> as of now: Matt, Derpy, and JLMinx.
            These correspond to each of our PBL sheets.
        <p>
        <p>
            <b>Matt's view</b> is solution group based.
            Each solution group can be tagged, and has learning notes as well as algs.
            If you want to <b>add your own solutions</b>, always add them as a solution group in this view.
            You just need to fill in your solutions, as well as the <b>slice count</b> for them.
        </p>
        <p>
            <b>Derpy</b> and <b>JLMinx</b> is alg based.
            That means it's just a list of algs.
            If you tag either of those views, the tag won't be able to tell if it's + or -.
        </p>

        <h1>Heatmap</h1>
        <p>
            Click on the search icon in the ${window.matchMedia("(max-width: 600px)").matches ? "bottom bar" : "sidebar"}, and the heatmap would show up.
        </p>
        <p>
            Each cell represent a PBL case.
            To show what case a cell is, hover over it, or tap.
            To go to the cluster reference for the cell, click it, or double tap.
        </p>
        <p>There are several modes regarding how the heatmap can be colored:</p>
        <p><b>1. By slicecount from optimal:</b></p>
        <p>
            Here the colors are a spectrum of <b>green to red</b>.
            The greener a cell is, the better you are at that case.
        </p>
        <p>
            To change what solutions the heatmap takes into account, change which tags are selected on top.
            Only solution groups are considered.
            This means if you want to <b>add your own solutions</b>, always add them as a solution group in Matt's view.
            You just need to fill in your solutions, as well as the <b>slice count</b> for them.
            Then, you can tag that solution group.
        </p>
        <p><b>2. By tags:</b></p>
        <p>
            Here each cell will be colored by the colors of all the tags it has.
            If it has cyan, yellow, and green tags, then its color will have all 3.
        </p>
        <p><b>3. By highest tag:</b></p>
        <p>
            Here each cell will be colored by the color of the <b>first</b> tag it has.
            If it has cyan, yellow, and green tags, and the green tag is above the other
            two in the tags modal, then it will be colored green.
        </p>

        <h1>Hints</h1>
        <p>
            You can edit your hints for a cluster in the cluster reference for it.
            To see the hints for the current scramble, click on the light bulb icon to the right of the scramble.
        </p>
        `
    },
    {
        id: 'pbl-sync',
        title: 'Data Sync',
        svg: HELP_SYNC_SVG,
        html: `
        <h1>Export data</h1>
        <p>
            To export your data, click on the download icon in the ${window.matchMedia("(max-width: 600px)").matches ? "bottom bar" : "sidebar"}.
            This will download <b>a JSON file</b>.
        </p>

        <h1>Import data</h1>
        <p>
            To import the data from a specific export, click on the upload icon in the ${window.matchMedia("(max-width: 600px)").matches ? "bottom bar" : "sidebar"}.
            Everything will be imported: your settings, your selection, your lists and tags.
        </p>`
    }
    // Add future PBL-specific sections here.
];

// ─── STARTUP ──────────────────────────────────────────────────────────────────
// ============================================================================
// PBL FILTER & SEARCH
// Depends on: pblPossible, pblName(), CP_Adj_PLL, CP_Opp_PLL, CP_Solved_PLL
//             weight, PLLextndlen (for freq filter)
// ============================================================================

// ============================================================================
// BASE FILTER
// ============================================================================

function isPll(pll, filter) {
    const special = ["opp", "adj", "pn", "pj"];
    if (special.includes(pll)) return filter == pll;
    return pll.startsWith(filter);
}

// Returns true if pbl matches filter text (no suffix)
// pbl: ["Al", "T"], filter: raw string
function passesBaseFilter(pbl, filter) {
    let u = pbl[0].toLowerCase();
    let d = pbl[1].toLowerCase();
    filter = filter.replace("/", " ").toLowerCase().trim();
    if (!filter) return true;
    if (filter.includes(" ")) {
        let arr = filter.match(/[^ ]+/g);
        if (arr != null) {
            arr = arr.slice(0, 2);
            let [a, b] = arr;
            if (a && b) {
                return (isPll(u, a) && isPll(d, b)) || (isPll(u, b) && isPll(d, a));
            }
            filter = a;
        }
    }
    return isPll(u, filter) || isPll(d, filter);
}

// freq filter: returns set of pbl names matching freq, or null if not a freq filter
function getFreqSet(filterStr) {
    if (filterStr.slice(0, 4).toLowerCase() !== "freq") return null;
    const freqStr = filterStr.slice(4).trim();
    const validFreqs = ["1", "2", "4", "8", "16", "32", "64", "128", "256"];
    const result = new Set();
    if (!validFreqs.includes(freqStr)) return result; // empty = hide all
    const freq = parseInt(freqStr, 10);
    for (let pbl of pblPossible) {
        const n = pblName(pbl);
        if (squan.getPBLWeight(n) * squan.getPBLCaseCount(pbl) === freq) result.add(n);
    }
    return result;
}

// ============================================================================
// SUFFIX SYSTEM
// ============================================================================

// CP lookup: maps PLL name -> "a" | "o" | "s". Built lazily because SquanLib is
// only available once its module has loaded (after these classic scripts).
let _cpMap = null;
function cpMap() {
    if (_cpMap) return _cpMap;
    _cpMap = {};
    for (let p of SquanLib.CPAdjPLL) _cpMap[p] = "a";
    for (let p of SquanLib.CPOppPLL) _cpMap[p] = "o";
    for (let p of SquanLib.CPSolvedPLL) _cpMap[p] = "s";
    return _cpMap;
}

// All suffix definitions. To add a new suffix:
// add an entry here. evaluate(pbl, context) returns bool.
// context = { baseTerms: string[] } (parsed base filter words, for order-aware suffixes)
const SUFFIX_DEFS = {};

// Order suffix
SUFFIX_DEFS["o"] = {
    evaluate(pbl, ctx) {
        if (!ctx.baseTerms.length) return true;
        const [t1] = ctx.baseTerms;
        return isPll(pbl[0].toLowerCase(), t1.toLowerCase());
    }
};

// CP pair suffixes: aa, ao, as, oa, oo, os, sa, so, ss
for (let x of ["a", "o", "s"]) {
    for (let y of ["a", "o", "s"]) {
        const cx = x, cy = y;
        SUFFIX_DEFS[`${x}${y}`] = {
            evaluate(pbl) { const cp = cpMap(); return cp[pbl[0]] === cx && cp[pbl[1]] === cy; }
        };
    }
}

// ============================================================================
// SUFFIX EXPRESSION PARSER + EVALUATOR
// ============================================================================

// Tokenizer: splits "<ao>*(!<o>&<ss>)" into tokens
function tokenizeSuffixExpr(expr) {
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
        if (expr[i] === " ") { i++; continue; }
        if (expr[i] === "<") {
            const end = expr.indexOf(">", i);
            if (end === -1) {
                const partial = expr.slice(i + 1).trim();
                // push any leading ! as separate not-operators, then the tag
                let j = 0;
                while (partial[j] === "!") { tokens.push({ type: "op", value: "!" }); j++; }
                const value = partial.slice(j);
                if (/[<>&*!()]/.test(value)) throw new Error("Unclosed <");
                tokens.push({ type: "tag", value, incomplete: true });
                break;
            }
            const inner = expr.slice(i + 1, end);
            let j = 0;
            while (inner[j] === "!") { tokens.push({ type: "op", value: "!" }); j++; }
            tokens.push({ type: "tag", value: inner.slice(j) });
            i = end + 1;
        } else if (expr[i] === "(") {
            tokens.push({ type: "lparen" }); i++;
        } else if (expr[i] === ")") {
            tokens.push({ type: "rparen" }); i++;
        } else if (expr[i] === "&") {
            tokens.push({ type: "op", value: "&" }); i++;
        } else if (expr[i] === "|") {
            tokens.push({ type: "op", value: "|" }); i++;
        } else if (expr[i] === "!") {
            tokens.push({ type: "op", value: "!" }); i++;
        } else {
            i++;
        }
    }
    return tokens;
}

// Recursive descent parser: precedence ! > * > &
// Returns a function: (pbl, ctx) => bool
function parseSuffixExpr(tokens) {
    let pos = 0;

    function parseExpr() { return parseUnion(); }

    function parseUnion() {
        let left = parseIntersect();
        while (pos < tokens.length && tokens[pos].type === "op" && tokens[pos].value === "|") {
            pos++;
            const right = parseIntersect();
            const l = left, r = right;
            left = (pbl, ctx) => l(pbl, ctx) || r(pbl, ctx);
        }
        return left;
    }

    function parseIntersect() {
        let left = parseNot();
        while (pos < tokens.length && tokens[pos].type === "op" && tokens[pos].value === "&") {
            pos++;
            const right = parseNot();
            const l = left, r = right;
            left = (pbl, ctx) => l(pbl, ctx) && r(pbl, ctx);
        }
        return left;
    }

    function parseNot() {
        if (pos < tokens.length && tokens[pos].type === "op" && tokens[pos].value === "!") {
            pos++;
            const inner = parseNot();
            return (pbl, ctx) => !inner(pbl, ctx);
        }
        return parseAtom();
    }

    function parseAtom() {
        if (pos >= tokens.length) throw new Error("Unexpected end of suffix expression");
        const tok = tokens[pos];
        if (tok.type === "lparen") {
            pos++;
            const inner = parseExpr();
            if (pos >= tokens.length || tokens[pos].type !== "rparen")
                throw new Error("Missing closing )");
            pos++;
            return inner;
        }
        if (tok.type === "tag") {
            pos++;
            if (tok.incomplete) {
                const candidates = Object.entries(SUFFIX_DEFS)
                    .filter(([name]) => name.startsWith(tok.value))
                    .map(([, def]) => def);
                if (!candidates.length) throw new Error(`Unknown suffix prefix: <${tok.value}`);
                return (pbl, ctx) => candidates.some(def => def.evaluate(pbl, ctx));
            }
            const def = SUFFIX_DEFS[tok.value];
            if (!def) throw new Error(`Unknown suffix: <${tok.value}>`);
            return (pbl, ctx) => def.evaluate(pbl, ctx);
        }
        throw new Error(`Unexpected token: ${JSON.stringify(tok)}`);
    }

    const fn = parseExpr();
    return fn;
}

// ============================================================================
// MAIN FILTER ENTRY POINT
// ============================================================================

// Splits raw input into base text and suffix expression string
// e.g. "T/Al <o>*<aa>" -> { base: "T/Al", suffixExpr: "<o>*<aa>" }
function splitInput(raw) {
    // The suffix expression starts at the first '<'; everything before it is the base text.
    const lt = raw.indexOf("<");
    if (lt === -1) return { base: raw.trim(), suffixExpr: "" };
    return { base: raw.slice(0, lt).trim(), suffixExpr: raw.slice(lt).trim() };
}

// Parse base filter terms (words) for context
function parseBaseTerms(base) {
    const cleaned = base.replace("/", " ").toLowerCase().trim();
    return cleaned ? cleaned.match(/[^ ]+/g) || [] : [];
}

// Main: given raw filter string, returns Set of pblNames that pass
function getFilteredSet(raw) {
    raw = raw.trim();
    const result = new Set();

    // Freq filter takes full precedence
    const freqSet = getFreqSet(raw);
    if (freqSet !== null) return freqSet;

    const { base, suffixExpr } = splitInput(raw);
    const baseTerms = parseBaseTerms(base);

    // Build context for suffix evaluation
    const ctx = { baseTerms };

    // Parse suffix expression if present
    let suffixFn = null;
    if (suffixExpr) {
        try {
            const tokens = tokenizeSuffixExpr(suffixExpr);
            if (tokens.length > 0) suffixFn = parseSuffixExpr(tokens);
        } catch (e) {
            console.warn("Suffix parse error:", e.message);
        }
    }

    for (let pbl of pblPossible) {
        const passesBase = passesBaseFilter(pbl, base);
        const passesSuffix = suffixFn ? suffixFn(pbl, ctx) : true;
        if (passesBase && passesSuffix) result.add(pblName(pbl));
    }

    return result;
}

// ============================================================================
// APPLY FILTER TO DOM
// ============================================================================

export function applyFilter(raw) {
    const visible = getFilteredSet(raw);
    for (let pbl of pblPossible) {
        const n = pblName(pbl);
        if (visible.has(n)) pblShow(n);
        else pblHide(n);
    }
    updateSelCount();
}
