import { pblDefaultLists, pblOptimal } from '../data/pbl-data.js';
import { tagCaseBases } from './alg-reference.js';
import { HELP_CTRL_SVG, HELP_HOME_SVG, MAX_EACHCASE, MIN_EACHCASE, addListItemEvent, applyMode, bottom56El, bottom56Row, buildHelpShortcuts, caseListEl, currentScrambleEl, defaultListsEl, eachCaseEl, globalBarflipEl, globalBarflipRow, karnEl, pblSnapSelection, previousScrambleEl, randInt, setShowMode, setUsingKarn, showAll, showSelected, showSuccess, timerEl, trainerMode, updateDeselectBtn, updateRemainingCount, updateSelCount, updateSelectBtn, updateToggle, useBarflipEl, userListsEl, usingKarn, usingTimer, weightEl } from './app.js';
import { SquanLib, squan } from './squan.js';

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

// Restore PBL checkbox states from storage when switching back from OBL.
export function pblRestoreSettings() {
    const stored = pblStorage.getItem('settings');
    if (stored !== null) {
        for (let i = 0; i < pblSettingList.length; i++)
            pblSettingList[i].checked = stored[i] === '1';
    }
    // Sync derived state that depends on checkbox values.
    setUsingKarn(karnEl.checked ? 1 : 0);
    pblWeight        = weightEl.checked;
    pblUseBarflip    = useBarflipEl.checked;
    pblShowBarflipUI = globalBarflipEl.checked;
    globalBarflipRow.style.display = pblUseBarflip ? '' : 'none';
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
        // Recalculate this base's slots with random suffix so both + and -
        // are distributed evenly instead of stacking separately.
        pblRemaining = pblRemaining.filter(r => r.slice(0, -1) !== base);
        const suffixes = ['+', '-'].filter(sx => pblSelected.includes(base + sx));
        const count = pblEachCase * (pblWeight ? squan.getPBLWeight(base) : 1);
        // If a case was already spliced this cycle and it belongs to this base,
        // that slot is already "in use" on screen — don't add it back.
        const alreadyConsumed = pblCaseSpliced && pblCurrentCase.slice(0, -1) === base ? 1 : 0;
        pblRemaining = pblRemaining.concat(
            Array.from({ length: Math.max(0, count - alreadyConsumed) }, () => base + suffixes[randInt(0, suffixes.length - 1)])
        );
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
}

// ─── PBL GRID ─────────────────────────────────────────────────────────────────

export function pblRestoreGrid() {
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

    // Update display — restore scramble text when a PBL scramble is active.
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
        const count = new Set(pblUserLists[k].map(s => s.slice(0, -1))).size;
        html += `<div id="${k}" class="list-item">${k} (${count})</div>`;
    }
    userListsEl.innerHTML = html;
    document.querySelectorAll("#userlists>.list-item").forEach(addListItemEvent);
    pblSaveUserLists();
}

export function pblAddDefaultLists() {
    let html = "";
    for (const k of Object.keys(pblDefaultLists)) {
        const count = new Set(pblDefaultLists[k].map(s => s.slice(0, -1))).size;
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

// Show (and optionally select) every case belonging to a tag's clusters. Cases
// are selected as both barflips, or as the global override barflip if one is set.
export function pblSelectTag(tagId, setSelection) {
    const bases = tagCaseBases(tagId);

    pblPossible.forEach(pbl => pblHide(pblName(pbl)));
    for (const base of bases) pblShow(base);

    if (setSelection) {
        const ovr = pblEffectiveOverride(); // null | '+' | '-'
        pblSnapSelection();
        pblDeselectAll();
        for (const base of bases) {
            if (ovr === '+')      pblSelect(base + '+');
            else if (ovr === '-') pblSelect(base + '-');
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

async function pblInit() {
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
    pblLoadStorage(true);

    // Fetch default lists JSON.
    for (const k of Object.keys(pblDefaultLists))
        pblDefaultLists[k] = pblMigrateLegacy(pblDefaultLists[k]);
    pblAddDefaultLists();
}

export function pblLoadStorage(buildGrid = false) {
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

export function pblOnEachCase() {
    pblEachCase = eachCaseEl.checked ? 1 : randInt(MIN_EACHCASE, MAX_EACHCASE);
    pblRefillRemaining();
    // The active case is already being displayed — remove one of its freshly-added
    // slots so the counter doesn't double-count it.
    if (pblCaseSpliced && pblCurrentCase) {
        const base = pblCurrentCase.slice(0, -1);
        const idx  = pblRemaining.findIndex(r => r.slice(0, -1) === base);
        if (idx !== -1) pblRemaining.splice(idx, 1);
    }
    updateRemainingCount();
    pblSaveSettings();
    pblSyncSettingsDisabled();
}

export function pblOnWeights() {
    pblWeight = weightEl.checked;
    pblRefillRemaining();
    // The active case is already being displayed — remove one of its freshly-added
    // slots so the counter doesn't double-count it.
    if (pblCaseSpliced && pblCurrentCase) {
        const base = pblCurrentCase.slice(0, -1);
        const idx  = pblRemaining.findIndex(r => r.slice(0, -1) === base);
        if (idx !== -1) pblRemaining.splice(idx, 1);
    }
    pblSaveSettings();
    pblSyncSettingsDisabled();
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

export function pblApplyBarflipUI() {
    const showOverride = pblShowBarflipUI && pblUseBarflip;
    if (pblBarflipOverrideRow) pblBarflipOverrideRow.classList.toggle('hidden', !showOverride);
    if (pblFlippedBtn) pblFlippedBtn.classList.toggle('active', showOverride && pblBarflipOverride === '+');
    if (pblSolvedBtn)  pblSolvedBtn.classList.toggle('active',  showOverride && pblBarflipOverride === '-');
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
    // G's checkbox state and pblShowBarflipUI are intentionally left alone —
    // pblEffectiveOverride() already gates on pblUseBarflip, so the override
    // has no effect on scramble generation or recoloring while B is off.
    globalBarflipRow.style.display = pblUseBarflip ? '' : 'none';
    pblApplyBarflipUI();
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
    pblRecolorAll();
    const newEffective = pblEffectiveOverride();
    if (pblHasActive && prevEffective !== newEffective) { pblPending = null; pblGenerateScramble(true); }
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

const HELP_FILTER_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <polygon points="3 4 21 4 14 13 14 20 10 20 10 13 3 4"/>
</svg>`;

const HELP_EQ_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="7.41" height="14" rx="1"/>
    <rect x="9.41" y="5" width="12.59" height="14" rx="1"/>
</svg>`

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
            { keys: ['←'],              desc: 'Previous scramble' },
            { keys: ['→'],              desc: 'Next scramble' },
            { keys: ['Space'],          desc: 'Start / stop timer' },
            { keys: ['Backspace'],      desc: 'Remove last case' },
            { keys: ['K'],              desc: 'Toggle karnotation' },
            { keys: ['E'],              desc: 'Train each case once' },
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

            <h1>Suffix tags</h1>
            <p>
                Append <code>&lt;tag&gt;</code> after the base filter to narrow results further.
            </p>
            <i>
                <code>&lt;o&gt;</code> — order-sensitive: only matches cases where the first name in your filter is the <em>top</em> layer.
            </i>
            <i>
                CP-pair tags filter by the corner permutation type of each layer (<b>a</b>&thinsp;=&thinsp;adjacent, <b>o</b>&thinsp;=&thinsp;opposite, <b>s</b>&thinsp;=&thinsp;skip/solved). The first letter is the top layer, the second is the bottom:
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
                Tags can be combined with boolean operators (precedence: <code>!</code> &gt; <code>*</code> &gt; <code>&amp;</code>):
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
            <b>"Train each case (E)"</b>, <b>"Use realistic weights (R)"</b>, and "selected: xxx" still treat both barflips of the case as a single case.
            This means you can safely select both barflips and use Train each case, and it will not Train both + and - separately.
        </p>

        <h1>Global Override</h1>
        <p>
            Enable <b>"Show global barflip override (G)"</b> to display a toggle on the home screen.
            This allows you to temporarily force EVERY case to be either + or -.
            You may select either 0 (no override) or 1 (yes override) options, but you cannot select both options at the same time.
        </p>
    `
    }
    // Add future PBL-specific sections here.
];

// ─── STARTUP ──────────────────────────────────────────────────────────────────
// Load order: app.js → pbl-core.js (this file). app.js must be loaded
// first so DOM refs, shared state, and cluster helpers are available.
//
// startApp() is invoked by the SquanLib bootstrap module in index.html once
// `squan` is available on the global object — initialization (scramble
// generation, etc.) depends on it, and module scripts run after these classic
// scripts have finished parsing.

export async function startApp() {
    await pblInit();
    applyMode();            // applies the last-used trainer mode (or 'obl' default)
    pblApplyBarflipUI();    // must run after pblShowBarflipUI + pblBarflipOverride are loaded
    updateSelectBtn();
    updateDeselectBtn();
    updateToggle();
}


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
                if (/[<>&*!()]/.test(partial)) throw new Error("Unclosed <");
                // push any leading ! as separate not-operators, then the tag
                let j = 0;
                while (partial[j] === "!") { tokens.push({ type: "op", value: "!" }); j++; }
                tokens.push({ type: "tag", value: partial.slice(j) });
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
