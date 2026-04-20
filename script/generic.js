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
let _hideTimer    = null;

function showSuccess(message = "Done!", duration = 2000) {
    const toast = document.getElementById("success-toast");
    const box   = toast.querySelector('.success-box');

    // Cancel any pending dismiss or fade-out completion.
    if (_successTimer) { clearTimeout(_successTimer); _successTimer = null; }
    if (_hideTimer)    { clearTimeout(_hideTimer);    _hideTimer    = null; }

    // Stop any fade-out, ensure visible.
    toast.classList.remove("fading");
    toast.style.display = "flex";
    document.getElementById("success-message").textContent = message;

    // Restart the entry animation directly on the box element.
    // Toggling display on the parent is unreliable for restarting child animations.
    box.style.animation = 'none';
    void box.offsetHeight; // flush styles so the browser sees the reset
    box.style.animation = '';

    _successTimer = setTimeout(hideSuccess, duration);
}

function hideSuccess() {
    _successTimer = null; // clear reference before the async cleanup
    const toast = document.getElementById("success-toast");
    toast.classList.add("fading");
    _hideTimer = setTimeout(() => {
        toast.style.display = "none";
        toast.classList.remove("fading");
        _hideTimer = null;
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

// Icon for the Shortcuts section — clean minimal keyboard outline.
const HELP_CTRL_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="6" width="20" height="13" rx="2"/>
  <line x1="6"  y1="10" x2="6"  y2="10"/>
  <line x1="10" y1="10" x2="10" y2="10"/>
  <line x1="14" y1="10" x2="14" y2="10"/>
  <line x1="18" y1="10" x2="18" y2="10"/>
  <line x1="6"  y1="14" x2="6"  y2="14"/>
  <line x1="18" y1="14" x2="18" y2="14"/>
  <line x1="10" y1="14" x2="14" y2="14"/>
</svg>`;

// Icon for the Filter section — minimal funnel.
const HELP_FILTER_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <polygon points="3 4 21 4 14 13 14 20 10 20 10 13 3 4"/>
</svg>`;

/**
 * buildHelpShortcuts — turns an array of {keys, desc} (or null for a spacer)
 * into the HTML for a shortcut list.
 */
function buildHelpShortcuts(rows) {
    return '<div class="help-shortcut-group">' + rows.map(row => {
        if (!row) return '<div class="help-shortcut-sep"></div>';
        const combo = row.keys.map((k, i) =>
            (i > 0 ? '<span class="help-plus">+</span>' : '') +
            `<span class="help-kbd">${k}</span>`
        ).join('');
        return `<div class="help-shortcut-row">
            <span class="help-key-combo">${combo}</span>
            <span class="help-desc">${row.desc}</span>
        </div>`;
    }).join('') + '</div>';
}

/**
 * renderHelp — populates the help modal's nav + content panels.
 * sections: [{id, title, svg, html}]
 */
let _helpScrollObserver = null;

function renderHelp(sections) {
    const nav     = document.getElementById('help-nav');
    const content = document.getElementById('help-content');
    nav.innerHTML     = '';
    content.innerHTML = '';

    if (_helpScrollObserver) { _helpScrollObserver = null; }

    const navItems = [];
    const sectionEls = [];

    for (const sec of sections) {
        // Nav item
        const item = document.createElement('div');
        item.className   = 'help-nav-item';
        item.dataset.target = sec.id;
        item.dataset.title  = sec.title;
        item.innerHTML   = sec.svg;
        nav.appendChild(item);
        navItems.push(item);

        // Content section
        const el = document.createElement('div');
        el.className = 'help-section';
        el.id        = 'help-sec-' + sec.id;
        el.innerHTML = `<div class="help-section-title">${sec.title}</div>${sec.html}`;
        content.appendChild(el);
        sectionEls.push(el);

        item.addEventListener('click', () => {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Bidirectional sync: scroll → highlight nav
    function syncNav() {
        const contentTop = content.getBoundingClientRect().top;
        let activeIdx = 0;
        for (let i = 0; i < sectionEls.length; i++) {
            const top = sectionEls[i].getBoundingClientRect().top - contentTop;
            if (top <= 32) activeIdx = i; // 32px threshold so it fires before fully at top
        }
        navItems.forEach((ni, i) => ni.classList.toggle('active', i === activeIdx));
    }
    content.addEventListener('scroll', syncNav);
    // Initial highlight
    if (navItems.length) navItems[0].classList.add('active');
}

function openHelpPopup() {
    if (usingTimer()) return;
    isPopupOpen = true;
    helpPopupEl.classList.add("open");
    renderHelp(trainerMode === 'pbl' ? pblHelpSections : oblHelpSections);
}
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

// onCheckKarn: toggles usingKarn then updates whichever trainer's display is active.
function onCheckKarn() {
    usingKarn ^= 1;
    if (trainerMode === 'obl') {
        oblDisplayCurrentScramble();
    } else if (pblHasActive) {
        currentScrambleEl.textContent = pblScrambleList.at(-1 - pblOffset)[usingKarn];
        pblDisplayPrevScram();
    }
    if (trainerMode === 'obl') oblSaveSettings(); else pblSaveSettings();
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
            ? 'Previous scramble: ' + prev[usingKarn] + ' (' + prev[2] + ')'
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
                ? 'Previous scramble: ' + prev[usingKarn] + ' (' + prev[2] + ')'
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
        oblSnapSelection();
        oblDeselect(prev[2]);
        oblSaveSelected();
        showSuccess("Last case removed.", 500);
        return;
    }
    if (pblScrambleList.at(-2 - pblOffset) !== undefined) {
        const base = pblPreviousCase.slice(0, -1); // strip +/- suffix
        pblSnapSelection();
        if (!pblUseBarflip) {
            pblDeselect(base + '+');
            pblDeselect(base + '-');
        } else {
            pblDeselect(pblPreviousCase);
        }
        pblSaveSelected();
        showSuccess("Last case removed.", 500);
    }
}

prevScrambleButton.addEventListener("click", prevScram);
nextScrambleButton.addEventListener("click", nextScram);
removeLastEl.addEventListener("click", removeLast);

// ─── SELECTION UNDO HELPERS ───────────────────────────────────────────────────
// One-level undo + redo for bulk selection actions.
// null = "nothing available"; a new snap clears redo.
// Ctrl+Z: saves current→redo, restores undo (guards with null check).
// Ctrl+Y: saves current→undo, restores redo (guards with null check).

// Called by pbl-core action functions before they mutate pblSelected.
function pblSnapSelection() {
    pblPreviouslySelected = [...pblSelected];
    pblRedoSelected = null; // new action clears redo
}

// Restore pblSelected to a snapshot, re-render DOM, and save.
function pblRestoreSelection(snap) {
    pblSelected  = [];
    pblRemaining = [];
    document.querySelectorAll('.case').forEach(el => pblSetDomClass(el, 'none'));
    for (const s of snap) pblSelect(s);
    pblSaveSelected();
    updateSelCount();
}

// Called by obl-core action functions before they mutate oblSelectedCases.
function oblSnapSelection() {
    oblPreviouslySelected = [...oblSelectedCases[oblUsingSpe]];
    oblRedoSelected = null; // new action clears redo
}

// Restore oblSelectedCases to a snapshot, re-render DOM, and save.
function oblRestoreSelection(snap) {
    oblSelectedCases[oblUsingSpe]  = [];
    oblRemainingCases[oblUsingSpe] = [];
    document.querySelectorAll('.case').forEach(el => el.classList.remove('checked', 'checked-both'));
    for (const id of snap) oblSelect(id);
    oblSaveSelected();
    updateSelCount();
}

// Open alg reference on scramble click — PBL and OBL.
currentScrambleEl.addEventListener("click", () => {
    if (usingTimer()) return;
    if (trainerMode === 'pbl') pblOpenCluster();
    else if (trainerMode === 'obl' && oblHasActiveScramble && oblScrambleList.length) {
        const entry = oblScrambleList.at(-1 - oblScrambleOffset);
        if (entry) oblOpenCluster(entry[2]);
    }
});

// Open alg reference on previous scramble click — PBL and OBL.
previousScrambleEl.style.cursor = "pointer";
previousScrambleEl.addEventListener("click", () => {
    if (usingTimer()) return;
    if (trainerMode === 'pbl') {
        if (!pblPreviousCase) return;
        pblOpenCluster(pblPreviousCase);
    } else if (trainerMode === 'obl') {
        const prev = oblScrambleList.at(-2 - oblScrambleOffset);
        if (prev) oblOpenCluster(prev[2]);
    }
});

// ─── SHARED EVENT LISTENERS ───────────────────────────────────────────────────

filterInputEl.addEventListener("input", () => {
    if (trainerMode === 'obl') {
        filterInputEl.value = filterInputEl.value.replace(/[^a-zA-Z1-4/\- ]+/g, "");
        oblApplyFilter(filterInputEl.value);
        // OBL filter is always live — don't touch showMode.
        return;
    }
    filterInputEl.value = filterInputEl.value.replace(/[^a-zA-Z0-9/\-<>!|&() ]+/g, "");
    setHighlighted(null);
    applyFilter(filterInputEl.value); // in pbl-filter.js
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

    // Each shortcut still calls e.preventDefault() to swallow the key event,
    // then checks canShortcut before executing any trainer action.
    const canShortcut = !isPopupOpen || settingsPopupEl.classList.contains('open');

    const ctrl = isMac() ? e.metaKey : e.ctrlKey;
    if (ctrl && !e.altKey) {
        if (e.shiftKey) {
            switch (e.key.toLowerCase()) {
                case "a": e.preventDefault(); if (!canShortcut) return;
                    if (trainerMode === 'pbl') pblDeselectAll(); else oblDeselectAll();
                    return;
                case "s": e.preventDefault(); if (!canShortcut) return;
                    if (trainerMode === 'pbl') pblDeselectThese();
                    return;
            }
        } else {
            switch (e.key.toLowerCase()) {
                case "a": if (!inInput) { e.preventDefault(); if (!canShortcut) return;
                    if (trainerMode === 'pbl') pblSelectAll(); else oblSelectAll();
                } return;
                case "s": e.preventDefault(); if (!canShortcut) return;
                    if (trainerMode === 'pbl') pblSelectThese();
                    return;
                case "f": e.preventDefault(); if (!canShortcut) return;
                    filterInputEl.focus(); return;

                case "z": e.preventDefault(); if (!canShortcut) return; {
                    if (trainerMode === 'pbl') {
                        if (pblPreviouslySelected === null) return;
                        const undoSnap        = pblPreviouslySelected;
                        pblRedoSelected       = [...pblSelected];
                        pblPreviouslySelected = null;
                        pblRestoreSelection(undoSnap);
                    } else {
                        if (oblPreviouslySelected === null) return;
                        const undoSnap        = oblPreviouslySelected;
                        oblRedoSelected       = [...oblSelectedCases[oblUsingSpe]];
                        oblPreviouslySelected = null;
                        oblRestoreSelection(undoSnap);
                    }
                    showSuccess("Undo", 500);
                    return;
                }

                case "y": e.preventDefault(); if (!canShortcut) return; {
                    if (trainerMode === 'pbl') {
                        if (pblRedoSelected === null) return;
                        const redoSnap        = pblRedoSelected;
                        pblPreviouslySelected = [...pblSelected];
                        pblRedoSelected       = null;
                        pblRestoreSelection(redoSnap);
                    } else {
                        if (oblRedoSelected === null) return;
                        const redoSnap        = oblRedoSelected;
                        oblPreviouslySelected = [...oblSelectedCases[oblUsingSpe]];
                        oblRedoSelected       = null;
                        oblRestoreSelection(redoSnap);
                    }
                    showSuccess("Redo", 500);
                    return;
                }
            }
        }
    } else if (!ctrl && e.altKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
            case "a": e.preventDefault(); if (!canShortcut) return; showAll(); return;
            case "s": e.preventDefault(); if (!canShortcut) return; showSelected(); return;
        }
    }

    if (!inInput && !ctrl && !e.altKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
            case "backspace":  e.preventDefault(); if (!canShortcut) return; removeLast(); return;
            case "arrowleft":  e.preventDefault(); if (!canShortcut) return; prevScram(); return;
            case "arrowright": e.preventDefault(); if (!canShortcut) return; nextScram(); return;
            case "k": if (!canShortcut) return; karnEl.checked = !karnEl.checked; onCheckKarn(); return;
            case "e":
                if (!canShortcut) return;
                eachCaseEl.checked = !eachCaseEl.checked;
                if (trainerMode === 'pbl') pblOnEachCase(); else oblOnEachCase();
                return;
            case "r":
                if (!canShortcut) return;
                if (trainerMode !== 'pbl') return;
                weightEl.checked = !weightEl.checked; pblOnWeights();
                return;
            case "g":
                if (!canShortcut) return;
                if (trainerMode !== 'pbl') return;
                globalBarflipEl.checked = !globalBarflipEl.checked; pblOnGlobalBarflip();
                return;
            case "b":
                if (!canShortcut) return;
                if (trainerMode !== 'pbl') return;
                useBarflipEl.checked = !useBarflipEl.checked; pblOnUseBarflip();
                return;
            case "s": {
                if (!canShortcut) return;
                if (trainerMode !== 'obl') return;
                const specificEl = document.getElementById('specific');
                specificEl.checked = !specificEl.checked; oblOnSpe();
                return;
            }
            case "p": {
                if (!canShortcut) return;
                if (trainerMode !== 'obl') return;
                const oblpEl = document.getElementById('oblp');
                oblpEl.checked = !oblpEl.checked; oblOnMemo();
                return;
            }
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

// ─── DOWNLOAD / UPLOAD (shared) ───────────────────────────────────────────────
// Both trainers' data are saved/loaded together in one JSON file.

downloadEl.addEventListener("click", () => {
    if (usingTimer()) return;
    const data = JSON.stringify({
        settingsPBL:  pblStorage.getItem('settings'),
        selectedPBL:  pblStorage.getItem('selected'),
        userListsPBL: pblStorage.getItem('userLists'),
        settingsOBL:  oblStorage.getItem('settings'),
        selectedOBL:  oblStorage.getItem('selected'),
        userListsOBL: oblStorage.getItem('userLists'),
    });
    const url = URL.createObjectURL(new Blob([data], { type: "text/plain" }));
    const a   = Object.assign(document.createElement("a"), { href: url, download: "TrainerData.json" });
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Download started.", 1000);
});

uploadEl.addEventListener("click", () => {
    if (pressStartTime != null) return;
    fileEl.click();
});

fileEl.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            e.target.value = '';
            pblDeselectAll();
            const jsonData = JSON.parse(reader.result);
            // ── PBL ──
            if ("selectedPBL" in jsonData) pblStorage.setItem("selected", jsonData["selectedPBL"]);
            let outdated = false;
            if ("userListsPBL" in jsonData)   pblStorage.setItem("userLists", jsonData["userListsPBL"]);
            else if ("userLists" in jsonData) { pblStorage.setItem("userLists", jsonData["userLists"]); outdated = true; }
            if ("settingsPBL" in jsonData)    pblStorage.setItem("settings", jsonData["settingsPBL"]);
            else if ("settings" in jsonData)  { pblStorage.setItem("settings", jsonData["settings"]); outdated = true; }
            const sel = jsonData["selectedPBL"];
            const allLists = [sel, ...Object.values(JSON.parse(jsonData["userListsPBL"] ?? '{}'))];
            if (allLists.some(lst => Array.isArray(lst) && lst.length && !lst[0].endsWith('+') && (!lst[0].endsWith('-') || lst[0].endsWith('/-'))))
                outdated = true;
            // ── OBL ──
            if ("selectedOBL" in jsonData)  oblStorage.setItem("selected",  jsonData["selectedOBL"]);
            if ("userListsOBL" in jsonData) oblStorage.setItem("userLists", jsonData["userListsOBL"]);
            if ("settingsOBL" in jsonData)  oblStorage.setItem("settings",  jsonData["settingsOBL"]);
            if (outdated) alert("File formatting is outdated, re-export recommended.");
            pblLoadStorage();
            if (trainerMode === 'obl') {
                oblLoadSettings();
                oblLoadUserLists();
                oblLoadSelected();
                oblRestoreGrid();
            }
            closePopup();
            showSuccess("Imported.", 1000);
        } catch (err) { console.error("Import error:", err); }
    };
    reader.readAsText(file);
});

// ─── LIST POPUP BUTTON LISTENERS (shared, trainer-aware) ─────────────────────

newListEl.addEventListener("click", () => {
    if (trainerMode === 'obl') { oblNewList(); return; }
    if (usingTimer()) return;
    if (pblSelected.length === 0) { alert("Please select PBLs to create a list!"); return; }
    let name = prompt("Name of your list:");
    if (!name) return;
    name = name.trim();
    if (!name || !validName(name)) { alert("Please enter a valid name (only letters, numbers, slashes, and spaces)"); return; }
    if (Object.keys(pblDefaultLists).includes(name)) { alert("A default list already has this name!"); return; }
    if (Object.keys(pblUserLists).includes(name))    { alert("You already gave this name to a list."); return; }
    if (document.getElementById(name))               { alert("You can't give this name to a list (id taken)."); return; }
    pblUserLists[name] = [...pblSelected];
    pblAddUserLists();
    setHighlighted(name);
    showSuccess("Successfully created the list.");
});

overwriteListEl.addEventListener("click", () => {
    if (trainerMode === 'obl') { oblOverwriteList(); return; }
    if (usingTimer()) return;
    if (highlightedList == null) return;
    if (Object.keys(pblDefaultLists).includes(highlightedList)) { alert("You cannot overwrite a default list."); return; }
    if (pblSelected.length === 0) { alert("Please select PBLs to overwrite the list!"); return; }
    if (confirm("You are about to overwrite list " + highlightedList)) {
        pblUserLists[highlightedList] = [...pblSelected];
        pblAddUserLists();
        pblSelectList(highlightedList, false);
        highlightedList = null;
        closePopup();
        showSuccess("Successfully overwrote the list.");
    }
});

selectListEl.addEventListener("click", () => {
    if (highlightedList == null) { alert("Please click on a list."); return; }
    if (trainerMode === 'obl') { oblSelectList(highlightedList, false); }
    else                       { pblSelectList(highlightedList, false); }
    closePopup();
    showSuccess("Selected the list.", 1000);
});

deleteListEl.addEventListener("click", () => {
    if (trainerMode === 'obl') { oblDeleteList(); return; }
    if (highlightedList == null) return;
    if (Object.keys(pblDefaultLists).includes(highlightedList)) { alert("You cannot delete a default list."); return; }
    if (Object.keys(pblUserLists).includes(highlightedList)) {
        if (confirm("You are about to delete list " + highlightedList)) {
            delete pblUserLists[highlightedList];
            highlightedList = null;
            pblAddUserLists();
            showSuccess("Successfully deleted the list.");
        }
        return;
    }
    alert("Error: list not found.");
});

trainListEl.addEventListener("click", () => {
    if (highlightedList == null) { alert("Please click on a list."); return; }
    if (trainerMode === 'obl') { oblSelectList(highlightedList, true); }
    else                       { pblSelectList(highlightedList, true); }
    closePopup();
    showSuccess("Training the list.", 1000);
});

// ─── MODE SYSTEM ──────────────────────────────────────────────────────────────

const MODE_KEY  = 'trainerMode';
let trainerMode = localStorage.getItem(MODE_KEY) || 'pbl'; // 'pbl' | 'obl'

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
        oblSaveSettings();
        pblRestoreSettings();
        pblAddDefaultLists();
        pblAddUserLists();
        pblApplyBarflipUI();
        pblRestoreGrid();
        // Generate a scramble if none exists (e.g. first switch from OBL on initial load).
        if (!pblHasActive && pblSelected.length > 0) pblGenerateScramble();
        if (pblSelected.length > 0) showSelected(); else showAll();
    } else {
        pblSaveSettings();
        document.getElementById('barflip-override-row')?.classList.add('hidden');
        oblLoadSettings();
        oblInitDefaultLists();
        oblAddDefaultLists();
        oblLoadUserLists();
        oblLoadSelected();
        oblRestoreGrid();
        // Generate a scramble if none exists (mirrors PBL symmetry).
        if (!oblHasActiveScramble && oblSelectedCases[oblUsingSpe].length > 0) oblGenerateScramble();
        if (oblSelectedCases[oblUsingSpe].length > 0) showSelected(); else showAll();
    }
}


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
    const content = document.getElementById("cluster-modal-content");
    if (content) content.scrollTop = 0;
    isPopupOpen = false;
}
