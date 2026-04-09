// ─── MATH UTILITIES ──────────────────────────────────────────────────────────
// Note: mod / randInt / randrange may already be in utils.js — remove if so.

function mod(n, m) {
    return ((n % m) + m) % m;
}

function randInt(min, max) {
    // max included
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randrange(start, stop, step = 1) {
    if (stop === undefined) { stop = start; start = 0; }
    const width = Math.ceil((stop - start) / step);
    if (width <= 0) throw new Error("Invalid range");
    return start + Math.floor(Math.random() * width) * step;
}

// ─── SHARED CONSTANTS ─────────────────────────────────────────────────────────

const MIN_EACHCASE = 2;
const MAX_EACHCASE = 4;

// ─── SHARED STATE ─────────────────────────────────────────────────────────────

let usingKarn = 0; // 0 = standard, 1 = karn; shared by both trainers

let isPopupOpen = false;

// Timer
let pressStartTime  = null;
let holdTimeout     = null;
let timerStart      = null;
let intervalId      = null;
let isRunning       = false;
let timerStoppedAt  = null;
let readyToStart    = false;
let otherKeyPressed = 0;
const startDelay    = 200;

// ── Shared display state ──────────────────────────────────────────────────────
// Both trainers share showMode, preSearchMode, and highlightedList.
// applyMode() resets them to neutral values on every trainer switch.

let showMode      = 'all'; // 'all' | 'selected' | 'searched' | 'list'
let preSearchMode = 'all';
let highlightedList = null;

// ─── DOM ELEMENT REFERENCES ───────────────────────────────────────────────────

const toggleUiEl      = document.getElementById("toggleui");
const uploadEl        = document.getElementById("uploaddata");
const downloadEl      = document.getElementById("downloaddata");
const fileEl          = document.getElementById("fileinput");

const sidebarEl = document.getElementById("sidebar");
const contentEl = document.getElementById("content");

// Shared case-list container and filter — used by both trainers.
const caseListEl    = document.getElementById("results");
const filterInputEl = document.getElementById("pbl-filter");

const eachCaseEl       = document.getElementById("allcases");
const karnEl           = document.getElementById("karn");
const weightEl         = document.getElementById("weight");
const globalBarflipEl  = document.getElementById("globalbarflip");
const globalBarflipRow = document.getElementById("globalbarfliprow");
const useBarflipEl     = document.getElementById("usebarflip");
const bottom56El       = document.getElementById("allow-bottom56");
const bottom56Row      = document.getElementById('bottom56-row');

const removeLastEl    = document.getElementById("unselprev");
const selectAllEl     = document.getElementById("sela");
const deselectAllEl   = document.getElementById("desela");
const showToggleEl    = document.getElementById("showtoggle");
const selCountEl      = document.getElementById("selcount");

const openListsEl     = document.getElementById("openlists");
const userListsEl     = document.getElementById("userlists");
const defaultListsEl  = document.getElementById("defaultlists");
const newListEl       = document.getElementById("newlist");
const deleteListEl    = document.getElementById("dellist");
const overwriteListEl = document.getElementById("overwritelist");
const selectListEl    = document.getElementById("sellist");
const trainListEl     = document.getElementById("trainlist");
const listPopupEl     = document.getElementById("list-popup");
const helpPopupEl     = document.getElementById("help-popup");
const settingsPopupEl = document.getElementById("settings-popup");
const openSettingsEl  = document.getElementById("open-settings");

const currentScrambleEl  = document.getElementById("cur-scram");
currentScrambleEl.style.cursor = "pointer";
const previousScrambleEl = document.getElementById("prev-scram");
const prevScrambleButton = document.getElementById("prev");
const nextScrambleButton = document.getElementById("next");
const timerEl    = document.getElementById("timer");
const timerBoxEl = document.getElementById("timerbox");

// ─── SHARED HELPERS ───────────────────────────────────────────────────────────

function usingTimer() {
    return isRunning || pressStartTime != null;
}

function isMac() {
    if (navigator.userAgentData) return navigator.userAgentData.platform === "macOS";
    return navigator.userAgent.toUpperCase().includes("MAC");
}

function isTouchDevice() {
    return window.matchMedia('(pointer: coarse)').matches;
}

function recentlyStopped() {
    return timerStoppedAt !== null && (performance.now() - timerStoppedAt) < 200;
}

function canInteractTimer() {
    const active = trainerMode === 'obl' ? oblHasActiveScramble : pblHasActive;
    return active && document.activeElement !== filterInputEl && !isPopupOpen;
}

function validName(n) {
    for (const l of n) {
        if (l.toLowerCase() === l.toUpperCase() && isNaN(parseInt(l)) && !" /".includes(l))
            return false;
    }
    return true;
}

function updateColors(hue) {
    document.documentElement.style.setProperty("--border-col", `hsl(${hue}, 80%, 70%)`);
    document.documentElement.style.setProperty("--button-col", `hsla(${hue}, 30%, 15%, 0.5)`);
}

// ─── TOAST / LOADING ─────────────────────────────────────────────────────────

let _successTimer = null;

function showSuccess(message = "Done!", duration = 2000) {
    const toast = document.getElementById("success-toast");
    toast.classList.remove("fading");
    document.getElementById("success-message").textContent = message;
    toast.style.display = "flex";
    if (_successTimer) clearTimeout(_successTimer);
    _successTimer = setTimeout(hideSuccess, duration);
}

function hideSuccess() {
    const toast = document.getElementById("success-toast");
    toast.classList.add("fading");
    setTimeout(() => {
        toast.style.display = "none";
        toast.classList.remove("fading");
        _successTimer = null;
    }, 300);
}

function showLoading(message = "Loading...") {
    document.getElementById("loading-message").textContent = message;
    document.getElementById("loading-overlay").style.display = "flex";
}

function hideLoading() {
    document.getElementById("loading-overlay").style.display = "none";
}

// ─── POPUP MANAGEMENT ────────────────────────────────────────────────────────

function openListPopup()     { if (usingTimer()) return; isPopupOpen = true; listPopupEl.classList.add("open"); }
function openHelpPopup()     { if (usingTimer()) return; isPopupOpen = true; helpPopupEl.classList.add("open"); }
function openSettingsPopup() { if (usingTimer()) return; isPopupOpen = true; settingsPopupEl.classList.add("open"); }

function closePopup() {
    isPopupOpen = false;
    listPopupEl.classList.remove("open");
    helpPopupEl.classList.remove("open");
    settingsPopupEl.classList.remove("open");
}

[listPopupEl, helpPopupEl, settingsPopupEl].forEach(el => {
    el.addEventListener('click', (e) => { if (e.target === el) closePopup(); });
});

for (const cross of document.querySelectorAll(".cross")) {
    cross.addEventListener("click", () => closePopup());
}

// ─── TIMER ────────────────────────────────────────────────────────────────────

function formatTime(ms) {
    const s  = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${s}.${cs.toString().padStart(2, "0")}`;
}

function setColor(className = "") {
    timerEl.classList.remove("red", "green");
    if (className) timerEl.classList.add(className);
}

function startTimer() {
    timerStart = performance.now();
    intervalId = setInterval(() => {
        timerEl.textContent = formatTime(performance.now() - timerStart);
    }, 10);
    isRunning = true;
    setColor();

    // Pre-generate next PBL scramble while timer is running.
    if (trainerMode === 'pbl' && pblRemaining.length > 0 && !pblWorkerBusy && !pblPending) {
        pblRequestScramble(pblRemaining[randInt(0, pblRemaining.length - 1)]);
    }
}

function stopTimer() {
    clearInterval(intervalId);
    isRunning      = false;
    timerStoppedAt = performance.now();
}

function resetTimer(hidden) {
    stopTimer();
    pressStartTime  = null;
    holdTimeout     = null;
    timerStart      = null;
    intervalId      = null;
    readyToStart    = false;
    otherKeyPressed = 0;
    if (canInteractTimer() && !hidden) timerEl.textContent = "0.00";
    else if (!hidden)                  timerEl.textContent = "--:--";
    setColor();
}

function timerBeginTouch(spaceEquivalent) {
    if (!canInteractTimer()) return;
    if (document.activeElement === filterInputEl) return;
    if (isRunning) {
        stopTimer();
        if (trainerMode === 'obl') {
            oblScrambleOffset--;
            oblGenerateScramble();
        } else {
            pblOffset--;
            pblGenerateScramble();
        }
        if (!spaceEquivalent) otherKeyPressed += 1;
    } else if (spaceEquivalent && otherKeyPressed <= 0) {
        if (!pressStartTime) {
            pressStartTime = performance.now();
            setColor("red");
            holdTimeout = setTimeout(() => {
                setColor("green");
                readyToStart = true;
            }, startDelay);
        }
    }
}

function timerEndTouch(spaceEquivalent) {
    if (spaceEquivalent) {
        const heldTime = performance.now() - pressStartTime;
        clearTimeout(holdTimeout);
        if (!isRunning) {
            if (heldTime >= startDelay && readyToStart) startTimer();
            else setColor();
        }
        pressStartTime = null;
        readyToStart   = false;
    } else {
        otherKeyPressed = Math.max(0, otherKeyPressed - 1);
    }
}

// ─── SHARED DISPLAY ───────────────────────────────────────────────────────────

// updateSelCount: one function for both trainers.
// OBL counts the selected array directly; PBL de-dupes by base name (strip +/-).
function updateSelCount() {
    let count;
    if (trainerMode === 'obl') {
        count = oblSelectedCases[oblUsingSpe].length;
    } else {
        count = new Set(pblSelected.map(s => s.slice(0, -1))).size;
    }
    selCountEl.textContent = 'Selected: ' + count;
}

// updateToggle: purely reads showMode + highlightedList — no trainer branching.
function updateToggle() {
    if (showMode === 'list' && highlightedList == null) showMode = 'selected';
    let state;
    if      (showMode === 'list')     state = `list: ${highlightedList}`;
    else if (showMode === 'searched') state = 'searched';
    else if (showMode === 'selected') state = 'selected';
    else                              state = 'all';
    const MAX = 11;
    const display = state.length > MAX ? state.slice(0, MAX - 1) + '…' : state;
    showToggleEl.title = `Showing: ${state}`;
    showToggleEl.innerHTML =
        `<span style="font-size:0.65em;opacity:0.8;font-weight:normal;letter-spacing:0.05em">SHOWING:</span>` +
        `<span style="max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${display}</span>`;
}

function updateSelectBtn() {
    selectAllEl.textContent = filterInputEl.value.trim() !== '' ? 'Select these' : 'Select ALL';
}

function updateDeselectBtn() {
    deselectAllEl.textContent = filterInputEl.value.trim() !== '' ? 'Deselect these' : 'Deselect ALL';
}

// showAll / showSelected: shared entry points that delegate to the active trainer.
// Both set showMode and call updateToggle so the button label always stays in sync.
function showAll() {
    if (trainerMode === 'obl') {
        document.querySelectorAll('.case').forEach(el => el.classList.remove('hidden'));
    } else {
        pblPossible.forEach(pbl => pblShow(pblName(pbl)));
    }
    showMode = 'all';
    updateSelCount();
    updateToggle();
}

function showSelected() {
    if (usingTimer()) return;
    if (trainerMode === 'obl') {
        document.querySelectorAll('.case').forEach(el => {
            if (oblSelectedCases[oblUsingSpe].includes(el.id)) el.classList.remove('hidden');
            else el.classList.add('hidden');
        });
    } else {
        pblPossible.forEach(pbl => {
            const n = pblName(pbl);
            if (pblSelected.some(s => s.slice(0, -1) === n)) pblShow(n);
            else pblHide(n);
        });
    }
    showMode = 'selected';
    updateSelCount();
    updateToggle();
}

// setHighlighted: manages the highlighted list item — no trainer-specific logic.
function setHighlighted(id) {
    if (id === "all") id = null;
    if (highlightedList != null) {
        const prev = document.getElementById(highlightedList);
        if (prev) prev.classList.remove("highlighted");
    }
    highlightedList = id;
    if (id != null) {
        const el = document.getElementById(id);
        if (el) el.classList.add("highlighted");
    }
}

// addListItemEvent: generic toggle-highlight click. Used by both trainers' list UIs.
function addListItemEvent(item) {
    item.addEventListener("click", () => {
        if (item.classList.contains("highlighted")) {
            item.classList.remove("highlighted");
            highlightedList = null;
        } else {
            setHighlighted(item.id);
        }
    });
}

// ─── SHARED SETTINGS ─────────────────────────────────────────────────────────

// onCheckKarn: toggles usingKarn, mirrors it to oblUsingKarn, then updates
// whichever trainer's display is currently active.
function onCheckKarn() {
    usingKarn ^= 1;
    oblUsingKarn = usingKarn;
    if (trainerMode === 'obl') {
        oblDisplayCurrentScramble();
    } else if (pblHasActive) {
        currentScrambleEl.textContent = pblScrambleList.at(-1 - pblOffset)[usingKarn];
        pblDisplayPrevScram();
    }
    pblSaveSettings();
}

karnEl.addEventListener("change", () => onCheckKarn());

// ─── SCRAMBLE NAVIGATION ─────────────────────────────────────────────────────

function prevScram() {
    if (usingTimer()) return;
    if (trainerMode === 'obl') {
        if (!oblScrambleList.length) return;
        oblScrambleOffset = Math.min(oblScrambleOffset + 1, oblScrambleList.length - 1);
        oblDisplayCurrentScramble();
        const prev = oblScrambleList.at(-2 - oblScrambleOffset);
        previousScrambleEl.textContent = prev
            ? 'Previous scramble: ' + prev[oblUsingKarn] + ' (' + prev[2] + ')'
            : 'Last scramble will show up here';
        return;
    }
    if (!pblScrambleList.length) return;
    pblOffset = Math.min(pblOffset + 1, pblScrambleList.length - 1);
    currentScrambleEl.textContent = pblScrambleList.at(-1 - pblOffset)[usingKarn];
    pblDisplayPrevScram();
}

function nextScram() {
    if (usingTimer()) return;
    if (trainerMode === 'obl') {
        if (!oblScrambleList.length) return;
        oblScrambleOffset--;
        if (oblScrambleOffset < 0) {
            oblScrambleOffset = 0;
            oblGenerateScramble();
        } else {
            oblDisplayCurrentScramble();
            const prev = oblScrambleList.at(-2 - oblScrambleOffset);
            previousScrambleEl.textContent = prev
                ? 'Previous scramble: ' + prev[oblUsingKarn] + ' (' + prev[2] + ')'
                : 'Last scramble will show up here';
        }
        return;
    }
    if (!pblScrambleList.length) return;
    pblOffset--;
    if (pblOffset < 0) {
        pblOffset = 0;
        pblGenerateScramble();
    } else {
        currentScrambleEl.textContent = pblScrambleList.at(-1 - pblOffset)[usingKarn];
        pblDisplayPrevScram();
    }
}

function removeLast() {
    if (trainerMode === 'obl') {
        if (oblScrambleList.length < 2) return;
        const prev = oblScrambleList.at(-2 - oblScrambleOffset);
        if (!prev) return;
        oblLastRemoved = prev[2];
        oblDeselect(oblLastRemoved);
        oblSaveSelected();
        showSuccess("Last case removed.", 500);
        return;
    }
    if (pblScrambleList.at(-2 - pblOffset) !== undefined) {
        const base = pblPreviousCase.slice(0, -1); // strip +/- suffix
        if (!pblUseBarflip) {
            pblDeselect(base + '+');
            pblDeselect(base + '-');
        } else {
            pblDeselect(pblPreviousCase);
        }
        pblLastRemoved = pblPreviousCase;
        pblSaveSelected();
        showSuccess("Last case removed.", 500);
    }
}

prevScrambleButton.addEventListener("click", prevScram);
nextScrambleButton.addEventListener("click", nextScram);
removeLastEl.addEventListener("click", removeLast);

// Open alg reference on scramble click — PBL only.
currentScrambleEl.addEventListener("click", () => {
    if (usingTimer()) return;
    if (trainerMode === 'pbl') pblOpenCluster();
});

// ─── SHARED EVENT LISTENERS ───────────────────────────────────────────────────

filterInputEl.addEventListener("input", () => {
    if (trainerMode === 'obl') {
        filterInputEl.value = filterInputEl.value.replace(/[^a-zA-Z1-4/\- ]+/g, "");
        oblApplyFilter(filterInputEl.value);
        // OBL filter is always live — don't touch showMode.
        return;
    }
    filterInputEl.value = filterInputEl.value.replace(/[^a-zA-Z0-9/\-<>!*&() ]+/g, "");
    setHighlighted(null);
    applyFilter(filterInputEl.value); // in filter.js
    updateSelectBtn();
    updateDeselectBtn();

    const hasFilter = filterInputEl.value.trim() !== '';
    if (hasFilter) {
        if (showMode !== 'searched') {
            preSearchMode = (showMode === 'list') ? 'all' : showMode;
            showMode = 'searched';
        }
    } else {
        // Restoring from search — go back to wherever we were.
        if (showMode === 'selected') showSelected();
        else {
            showMode = preSearchMode;
            if (showMode === 'selected') showSelected();
            else showAll();
        }
    }
    updateToggle();
});

selectAllEl.addEventListener("click", () => {
    if (trainerMode === 'obl') { oblSelectAll(); return; }
    if (filterInputEl.value.trim() !== '') pblSelectThese(false);
    else pblSelectAll(false);
});

selectAllEl.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (trainerMode === 'obl') { oblDeselectAll(); return; }
    if (filterInputEl.value.trim() !== '') pblSelectThese(true);
    else pblSelectAll(true);
});

deselectAllEl.addEventListener("click", () => {
    if (trainerMode === 'obl') { oblDeselectAll(); return; }
    if (filterInputEl.value.trim() !== '') pblDeselectThese();
    else pblDeselectAll();
});

showToggleEl.addEventListener("click", () => {
    if (usingTimer()) return;
    const hasFilter = filterInputEl.value.trim() !== '';
    if (hasFilter) {
        if (showMode === 'searched') { showSelected(); }
        else {
            showAll();
            // Re-apply the live filter for whichever trainer is active.
            if (trainerMode === 'obl') oblApplyFilter(filterInputEl.value);
            else applyFilter(filterInputEl.value);
            showMode = 'searched';
            updateToggle();
        }
    } else {
        if      (showMode === 'list')     showSelected();  // list → selected
        else if (showMode === 'selected') showAll();       // selected → all
        else                              showSelected();  // all → selected
    }
});

openListsEl.addEventListener("click",    () => { if (usingTimer()) return; openListPopup(); });
openSettingsEl.addEventListener("click", () => { if (usingTimer()) return; openSettingsPopup(); });
document.getElementById("open-help").addEventListener("click", () => {
    if (usingTimer()) return;
    openHelpPopup();
});

toggleUiEl.addEventListener("click", () => {
    if (usingTimer()) return;
    const isMobileView = window.innerWidth <= 900;
    if (isMobileView) {
        if (sidebarEl.classList.contains("hidden-mobile")) {
            sidebarEl.classList.remove("hidden-mobile");
            sidebarEl.classList.add("full-width-mobile");
            contentEl.classList.add("hidden-mobile");
        } else {
            sidebarEl.classList.add("hidden-mobile");
            sidebarEl.classList.remove("full-width-mobile");
            contentEl.classList.remove("hidden-mobile");
        }
    } else {
        sidebarEl.classList.toggle("hidden");
    }
});

window.addEventListener("keydown", (e) => {
    const inInput = document.activeElement === filterInputEl;

    if (e.code === "Escape") {
        if (document.getElementById("cluster-modal").style.display === "flex") {
            closeCluster();
            return;
        }
        if (isPopupOpen) closePopup();
        if (usingTimer()) resetTimer(false);
        if (inInput) filterInputEl.blur();
        return;
    }

    if (canInteractTimer()) {
        const isSpace    = e.code === "Space";
        const wasRunning = isRunning;
        timerBeginTouch(isSpace);
        if (isSpace) e.preventDefault();
        if (wasRunning) return;
    }

    if (recentlyStopped()) return;

    const ctrl = isMac() ? e.metaKey : e.ctrlKey;
    if (ctrl && !e.altKey) {
        if (e.shiftKey) {
            switch (e.key.toLowerCase()) {
                case "a": e.preventDefault(); pblDeselectAll(); return;
                case "s": e.preventDefault(); pblDeselectThese(); return;
                case "z": e.preventDefault(); pblDeselect(pblLastRemoved); pblSaveSelected(); return;
            }
        } else {
            switch (e.key.toLowerCase()) {
                case "a": if (!inInput) { e.preventDefault(); pblSelectAll(); } return;
                case "s": e.preventDefault(); pblSelectThese(); return;
                case "f": e.preventDefault(); filterInputEl.focus(); return;
                case "z": e.preventDefault(); pblSelect(pblLastRemoved); pblSaveSelected(); return;
                case "y": e.preventDefault(); pblDeselect(pblLastRemoved); pblSaveSelected(); return;
            }
        }
    } else if (!ctrl && e.altKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
            case "a": e.preventDefault(); showAll(); return;
            case "s": e.preventDefault(); showSelected(); return;
        }
    }

    if (!inInput && !ctrl && !e.altKey && !e.shiftKey) {
        let el;
        switch (e.key.toLowerCase()) {
            case "backspace":  e.preventDefault(); removeLast(); return;
            case "arrowleft":  e.preventDefault(); prevScram(); return;
            case "arrowright": e.preventDefault(); nextScram(); return;
            case "e": el = eachCaseEl;      el.checked = !el.checked; pblOnEachCase();       return;
            case "k": el = karnEl;          el.checked = !el.checked; onCheckKarn();         return;
            case "r": el = weightEl;        el.checked = !el.checked; pblOnWeights();        return;
            case "g": el = globalBarflipEl; el.checked = !el.checked; pblOnGlobalBarflip(); return;
            case "b": el = useBarflipEl;    el.checked = !el.checked; pblOnUseBarflip();     return;
        }
    }
});

window.addEventListener("keyup", (e) => {
    if (!canInteractTimer()) return;
    const isSpace = e.code === "Space";
    timerEndTouch(isSpace);
    if (isSpace) e.preventDefault();
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") resetTimer(true);
});

timerBoxEl.addEventListener("touchstart", () => {
    if (isPopupOpen || !canInteractTimer()) return;
    timerBeginTouch(true);
});

timerBoxEl.addEventListener("touchend", () => {
    if (!canInteractTimer()) return;
    timerEndTouch(true);
});

// ─── MODE SYSTEM ──────────────────────────────────────────────────────────────

const MODE_KEY  = 'trainerMode';
let trainerMode = localStorage.getItem(MODE_KEY) || 'obl'; // 'pbl' | 'obl'

function switchMode() {
    trainerMode = trainerMode === 'pbl' ? 'obl' : 'pbl';
    localStorage.setItem(MODE_KEY, trainerMode);
    applyMode();
}

function applyMode() {
    const isPBL = trainerMode === 'pbl';
    document.getElementById('mode-title').textContent = isPBL ? 'PBL TRAINER' : 'OBL TRAINER';

    // Show/hide settings rows that apply to only one trainer.
    document.getElementById('scramble-length-row').style.display =
        isPBL ? '' : 'none';
    document.getElementById('bottom56-row').style.display =
        (isPBL && pblScrambleMode === 'short') ? 'flex' : 'none';
    document.getElementById('usebarflip').closest('.settings-row').style.display =
        isPBL ? '' : 'none';
    document.getElementById('globalbarfliprow').style.display =
        (isPBL && pblUseBarflip) ? '' : 'none';
    document.getElementById('weight').closest('.settings-row').style.display =
        isPBL ? '' : 'none';
    document.getElementById('specific-row').style.display =
        isPBL ? 'none' : '';
    document.getElementById('oblp-row').style.display =
        isPBL ? 'none' : '';

    // Reset shared display state so neither trainer bleeds into the other.
    showMode        = 'all';
    preSearchMode   = 'all';
    highlightedList = null;
    filterInputEl.value = '';
    updateSelectBtn();
    updateDeselectBtn();

    if (isPBL) {
        oblSaveState();
        pblRestoreGrid();   // defined in pbl-core.js
    } else {
        pblSaveState();
        oblLoadUserLists();
        oblLoadSelected();
        oblRestoreGrid();
    }
}

function pblSaveState() {} // placeholder — extend if teardown logic is needed
function oblSaveState() {} // placeholder

document.getElementById('mode-title').addEventListener('click', switchMode);

// ─── CLUSTER MODAL INFRASTRUCTURE ────────────────────────────────────────────
// Shared by both trainers. Each trainer's core file holds:
//   - its own Supabase client (different projects)
//   - its own cluster cache + cluster worker + worker-state vars
//   - its own openCluster() that calls these generic helpers, then its own formatter
//
// HTML generation (formatCluster, hasAlgData, nab, textWidth) lives in the
// trainer's own core file so OBL can have a completely different layout.

// ── Cache I/O ──────────────────────────────────────────────────────────────

function clusterCacheSave(storageKey, cache) {
    try { localStorage.setItem(storageKey, JSON.stringify(cache)); } catch (e) {}
}

function clusterCacheLoad(storageKey) {
    try { const d = localStorage.getItem(storageKey); return d ? JSON.parse(d) : {}; }
    catch (e) { return {}; }
}

// ── Supabase helpers ───────────────────────────────────────────────────────
// Both functions take the trainer's own Supabase client as their first argument
// because PBL and OBL live in different Supabase projects.

async function clusterDownloadAll(sbClient, table, cache, saveFn) {
    const { data, error } = await sbClient.from(table).select("cluster_index, data");
    if (error || !data) return;
    data.forEach(row => { cache[row.cluster_index] = row.data; });
    saveFn();
    showSuccess("Algs successfully stored.", 1000);
}

async function clusterFetch(sbClient, table, clusterIndex, cache, saveFn) {
    if (cache[clusterIndex]) return cache[clusterIndex];
    const { data, error } = await sbClient
        .from(table).select("data").eq("cluster_index", clusterIndex).single();
    if (!error && data) {
        cache[clusterIndex] = data.data;
        saveFn();
        return data.data;
    }
    return null;
}

// ── Wait-for-ready helper ──────────────────────────────────────────────────
// Awaits any in-flight background sync before the modal opens.
//   workerReadyPromise  Promise | null — null means sync already finished
//   isWorkerBusy        () => bool — getter for the busy flag
//   cache               {} — the trainer's cluster cache object
//   downloadFn          async () => void — full-download fallback for first-time users

async function clusterEnsureReady(workerReadyPromise, isWorkerBusy, cache, downloadFn) {
    if (workerReadyPromise) {
        showLoading();
        await workerReadyPromise;
        hideLoading();
    } else if (isWorkerBusy()) {
        showLoading();
        await new Promise(resolve => {
            const check = setInterval(() => {
                if (!isWorkerBusy()) { clearInterval(check); resolve(); }
            }, 100);
        });
        hideLoading();
    } else if (Object.keys(cache).length === 0) {
        requestAnimationFrame(() => showLoading());
        await downloadFn();
        hideLoading();
    }
}

// ── Shared modal helpers ───────────────────────────────────────────────────

// Resize the modal window to fit the widest content line after HTML is set.
function clusterSizeModal(content) {
    content.style.visibility = 'hidden';
    requestAnimationFrame(() => {
        const win    = document.getElementById('cluster-modal-inner');
        const header = win.querySelector('.cluster-header');
        const maxW   = Math.min(800, window.innerWidth * 0.80);
        const minW   = Math.min(360, window.innerWidth * 0.95);
        const needed = Math.max(content.scrollWidth, header ? header.scrollWidth : 0) + 2;
        win.style.width = Math.max(minW, Math.min(needed, maxW)) + 'px';
        // After the window width is applied, check whether the longest alg span
        // fits inside the visible scroll area.
        requestAnimationFrame(() => {
            const algSpans = content.querySelectorAll('.alg-lines');
            const maxAlgRight = Math.max(0, ...[...algSpans].map(s => {
                return s.clientWidth + s.offsetLeft;
            }));
            const overflows = maxAlgRight > content.clientWidth;
            content.querySelectorAll('.cluster-text>:not(.alg-lines):not(.cluster-title)').forEach(s => {
                if (overflows) s.style.width = (maxAlgRight - s.offsetLeft) + 'px';
                else s.style.width = '';
            });
            content.style.visibility = '';
        });
    });
}

// closeCluster: shared by both trainers.
// The HTML calls this directly via onclick="closeCluster()".
function closeCluster() {
    document.getElementById("cluster-modal").style.display = "none";
    document.getElementById("cluster-modal-inner").style.width = '';
    isPopupOpen = false;
}

// ─── OBL STATE ────────────────────────────────────────────────────────────────

let oblSelectedCases     = [[], []]; // [nonSpe[], spe[]]
let oblRemainingCases    = [[], []];
let oblUserLists         = {};
let oblDefaultLists      = {};
let oblUsingKarn         = 0;
let oblUsingSpe          = 0;
let oblUsingMemo         = false;
let oblScrambleList      = [];
let oblCurrentCase       = '';
let oblPreviousCase      = '';
let oblHasActiveScramble = false;
let oblScrambleOffset    = 0;
let oblLastRemoved       = '';
let oblEachCase          = 0;

const oblStorage = {
    getItem:  k      => localStorage.getItem(k + 'OBL'),
    setItem:  (k, v) => localStorage.setItem(k + 'OBL', v),
};

// ─── OBL SELECTION ────────────────────────────────────────────────────────────

function oblSelect(id) {
    if (!oblSelectedCases[oblUsingSpe].includes(id)) {
        oblSelectedCases[oblUsingSpe].push(id);
        if (oblEachCase > 0)
            oblRemainingCases[oblUsingSpe].push(...Array(oblEachCase).fill(id));
    }
    const el = document.getElementById(id);
    if (el) el.classList.add('checked', 'checked-both');
    updateSelCount();
}

function oblDeselect(id) {
    oblSelectedCases[oblUsingSpe]  = oblSelectedCases[oblUsingSpe].filter(x => x !== id);
    oblRemainingCases[oblUsingSpe] = oblRemainingCases[oblUsingSpe].filter(x => x !== id);
    const el = document.getElementById(id);
    if (el) el.classList.remove('checked', 'checked-both');
    updateSelCount();
}

function oblSaveSelected() {
    if (!oblUsingSpe) oblSelectedCases[1] = [...getSpeList(oblSelectedCases[0])];
    else              oblSelectedCases[0] = [...getNonSpeList(oblSelectedCases[1])];
    oblStorage.setItem('selected', JSON.stringify(oblSelectedCases));
    if (!oblHasActiveScramble || oblSelectedCases[oblUsingSpe].length === 0)
        oblGenerateScramble();
    else if (!oblSelectedCases[oblUsingSpe].includes(oblCurrentCase))
        oblGenerateScramble(true);
}

function oblEnableEachCase() {
    oblEachCase = eachCaseEl.checked ? 1 : randInt(MIN_EACHCASE, MAX_EACHCASE);
    oblRemainingCases[oblUsingSpe] =
        oblSelectedCases[oblUsingSpe].flatMap(el => Array(oblEachCase).fill(el));
}

// ─── OBL SCRAMBLE GENERATION ─────────────────────────────────────────────────

function oblGenerateScramble(regen = false) {
    if (oblSelectedCases[oblUsingSpe].length === 0) {
        timerEl.textContent            = '--:--';
        currentScrambleEl.textContent  = 'Scramble will show up here';
        previousScrambleEl.textContent = 'Last scramble will show up here';
        oblHasActiveScramble = false;
        oblScrambleList      = [];
        return;
    }
    if (oblRemainingCases[oblUsingSpe].length === 0) oblEnableEachCase();

    const idx    = randInt(0, oblRemainingCases[oblUsingSpe].length - 1);
    const choice = oblRemainingCases[oblUsingSpe].splice(idx, 1)[0];
    oblCurrentCase = choice;

    const specific = oblUsingSpe
        ? choice
        : OBLtranslation[choice][randInt(0, OBLtranslation[choice].length - 1)];
    const scramble = getOBLScramble(specific);

    const s     = scramble[0].at(0), e = scramble[0].at(-1);
    const start = s === 'A'
        ? [randrange(-5, 5, 3), randrange(-3, 7, 3)]
        : [randrange(-3, 7, 3), randrange(-4, 6, 3)];
    const end   = e === 'A'
        ? [randrange(-4, 6, 3), randrange(-3, 7, 3)]
        : [randrange(-3, 7, 3), randrange(-5, 5, 3)];

    const raw   = start.join(',') + scramble[0].slice(1, -1) + end.join(',');
    const final = [raw.replaceAll('/', ' / '), karnify(raw.replaceAll('/', '/')), choice];

    if (regen) {
        oblScrambleList[oblScrambleList.length - 1] = final;
    } else {
        if (oblScrambleList.length) {
            previousScrambleEl.textContent =
                'Previous scramble: ' + oblScrambleList.at(-1)[oblUsingKarn] +
                ' (' + oblScrambleList.at(-1)[2] + ')';
        }
        oblScrambleList.push(final);
    }
    oblHasActiveScramble = true;
    if (!timerEl.textContent || timerEl.textContent === '--:--')
        timerEl.textContent = '0.00';
    oblDisplayCurrentScramble();
}

function oblDisplayCurrentScramble() {
    if (!oblHasActiveScramble || !oblScrambleList.length) return;
    const entry = oblScrambleList.at(-1 - oblScrambleOffset);
    if (entry) currentScrambleEl.textContent =
        entry[oblUsingKarn] + (oblUsingMemo ? ` (${entry[3] ?? ''})` : '');
}

// ─── OBL FILTER ───────────────────────────────────────────────────────────────

function oblApplyFilter(raw) {
    document.querySelectorAll('.case').forEach(caseEl => {
        if (passesOBLFilter(caseEl.id, raw)) caseEl.classList.remove('hidden');
        else                                  caseEl.classList.add('hidden');
    });
    updateSelCount();
}

// ─── OBL LISTS ────────────────────────────────────────────────────────────────

function oblLoadUserLists() {
    const stored = oblStorage.getItem('userLists');
    if (stored) oblUserLists = JSON.parse(stored);
}

function oblSaveUserLists() {
    oblStorage.setItem('userLists', JSON.stringify(oblUserLists));
}

function oblLoadSelected() {
    const stored = oblStorage.getItem('selected');
    if (!stored) return;
    oblSelectedCases = JSON.parse(stored);
    if (!Array.isArray(oblSelectedCases[0])) oblSelectedCases = [oblSelectedCases, []]; // legacy
    oblEnableEachCase();
    oblSelectedCases[oblUsingSpe].forEach(id => oblSelect(id));
    if (oblSelectedCases[oblUsingSpe].length) oblGenerateScramble();
}

// ─── OBL BULK SELECT ─────────────────────────────────────────────────────────

function oblSelectAll() {
    if (usingTimer()) return;
    document.querySelectorAll('.case').forEach(caseEl => {
        if (!caseEl.classList.contains('hidden')) oblSelect(caseEl.id);
    });
    oblSaveSelected();
}

function oblDeselectAll() {
    if (usingTimer()) return;
    oblSelectedCases  = [[], []];
    oblRemainingCases = [[], []];
    document.querySelectorAll('.case').forEach(caseEl => {
        caseEl.classList.remove('checked', 'checked-both');
    });
    oblSaveSelected();
    updateSelCount();
}

// ─── OBL GRID ─────────────────────────────────────────────────────────────────

function oblRestoreGrid() {
    caseListEl.style.gridTemplateColumns = oblUsingSpe
        ? 'repeat(auto-fit, minmax(160px, 1fr))'
        : 'repeat(auto-fit, minmax(130px, 1fr))';

    caseListEl.innerHTML = oblUsingSpe
        ? possibleOBL.flatMap(obl =>
            getSpe(OBLname(obl)).map(s => `<div class="case" id="${s}">${s}</div>`)
          ).join('')
        : possibleOBL.map(obl =>
            `<div class="case" id="${OBLname(obl)}">${OBLname(obl)}</div>`
          ).join('');

    document.querySelectorAll('.case').forEach(caseEl => {
        const id = caseEl.id;
        if (oblSelectedCases[oblUsingSpe].includes(id))
            caseEl.classList.add('checked', 'checked-both');
        caseEl.addEventListener('click', () => {
            if (usingTimer()) return;
            if (caseEl.classList.contains('checked')) oblDeselect(id);
            else oblSelect(id);
            oblSaveSelected();
        });
    });

    oblApplyFilter(''); // honours any in-progress filter (cleared by applyMode)
    updateSelCount();

    // Always update scramble display — prevents PBL text bleeding through on switch.
    if (oblHasActiveScramble && oblScrambleList.length) {
        oblDisplayCurrentScramble();
        const prev = oblScrambleList.at(-2 - oblScrambleOffset);
        previousScrambleEl.textContent = prev
            ? 'Previous scramble: ' + prev[oblUsingKarn] + ' (' + prev[2] + ')'
            : 'Last scramble will show up here';
        if (timerEl.textContent === '--:--') timerEl.textContent = '0.00';
    } else {
        currentScrambleEl.textContent  = 'Scramble will show up here';
        previousScrambleEl.textContent = 'Last scramble will show up here';
        timerEl.textContent            = '--:--';
    }
}
