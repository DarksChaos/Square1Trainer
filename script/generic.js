// ─── MATH UTILITIES ──────────────────────────────────────────────────────────

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

const eachCaseEl       = document.getElementById("each-case");
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
    return active && document.activeElement !== filterInputEl && !isPopupOpen && !isSearchOpen;
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

// ─── POPUP MANAGEMENT ────────────────────────────────────────────────────────

function openListPopup()     { if (usingTimer()) return; isPopupOpen = true; renderTagMenu(); listPopupEl.classList.add("open"); }

const HELP_HOME_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M16.25 3.75V5.43953L18.25 7.03953V3.75H16.25ZM19.75 8.23953V3.5C19.75 2.80964 19.1904 2.25 18.5 2.25H16C15.3097 2.25 14.75 2.80964 14.75 3.5V4.23953L14.3426 3.91362C12.9731 2.81796 11.027 2.81796 9.65742 3.91362L1.53151 10.4143C1.20806 10.6731 1.15562 11.1451 1.41438 11.4685C1.67313 11.792 2.1451 11.8444 2.46855 11.5857L3.25003 10.9605V21.25H2.00003C1.58581 21.25 1.25003 21.5858 1.25003 22C1.25003 22.4142 1.58581 22.75 2.00003 22.75H22C22.4142 22.75 22.75 22.4142 22.75 22C22.75 21.5858 22.4142 21.25 22 21.25H20.75V10.9605L21.5315 11.5857C21.855 11.8444 22.3269 11.792 22.5857 11.4685C22.8444 11.1451 22.792 10.6731 22.4685 10.4143L19.75 8.23953ZM19.25 9.76047L13.4056 5.08492C12.5838 4.42753 11.4162 4.42753 10.5945 5.08492L4.75003 9.76047V21.25H8.25003L8.25003 16.9506C8.24999 16.2858 8.24996 15.7129 8.31163 15.2542C8.37773 14.7625 8.52679 14.2913 8.90904 13.909C9.29128 13.5268 9.76255 13.3777 10.2542 13.3116C10.7129 13.2499 11.2858 13.25 11.9507 13.25H12.0494C12.7143 13.25 13.2871 13.2499 13.7459 13.3116C14.2375 13.3777 14.7088 13.5268 15.091 13.909C15.4733 14.2913 15.6223 14.7625 15.6884 15.2542C15.7501 15.7129 15.7501 16.2858 15.75 16.9506L15.75 21.25H19.25V9.76047ZM14.25 21.25V17C14.25 16.2717 14.2484 15.8009 14.2018 15.454C14.1581 15.1287 14.0875 15.0268 14.0304 14.9697C13.9733 14.9126 13.8713 14.842 13.546 14.7982C13.1991 14.7516 12.7283 14.75 12 14.75C11.2717 14.75 10.8009 14.7516 10.4541 14.7982C10.1288 14.842 10.0268 14.9126 9.9697 14.9697C9.9126 15.0268 9.84199 15.1287 9.79826 15.454C9.75162 15.8009 9.75003 16.2717 9.75003 17V21.25H14.25ZM12 8.25C11.3097 8.25 10.75 8.80964 10.75 9.5C10.75 10.1904 11.3097 10.75 12 10.75C12.6904 10.75 13.25 10.1904 13.25 9.5C13.25 8.80964 12.6904 8.25 12 8.25ZM9.25003 9.5C9.25003 7.98122 10.4812 6.75 12 6.75C13.5188 6.75 14.75 7.98122 14.75 9.5C14.75 11.0188 13.5188 12.25 12 12.25C10.4812 12.25 9.25003 11.0188 9.25003 9.5Z" fill="currentColor"/>
</svg>`;

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

// update the remainging count if each-case is on
function updateRemainingCount() {
    const wrapperEl = document.getElementById('each-case-remaining');
    if (!wrapperEl) return;
    if (!eachCaseEl.checked) {
        wrapperEl.style.display = 'none';
        return;
    }
    const spliced = trainerMode === 'obl' ? oblCaseSpliced : pblCaseSpliced;
    const queued  = trainerMode === 'obl'
        ? oblRemainingCases[oblUsingSpe].length
        : pblRemaining.length;
    console.log(trainerMode === "obl" ? oblRemainingCases[oblUsingSpe] : pblRemaining);
    console.log(spliced);
    // spliced is set synchronously before the splice in each generate function,
    // so queued + 1 is always correct: the current case + everything still in the array.
    document.getElementById('remaining-count').textContent = queued + (spliced ? 1 : 0);
    wrapperEl.style.display = '';
}

// updateToggle: purely reads showMode + highlightedList — no trainer branching.
function updateToggle() {
    if (showMode === 'list' && highlightedList == null) showMode = 'selected';
    let state;
    const tagId = highlightedTagId();
    if      (showMode === 'list' && tagId != null) state = `tag: ${getTags().find(t => t.id === tagId)?.name ?? tagId}`;
    else if (showMode === 'list')     state = `list: ${highlightedList}`;
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
        pblSnapSelection();
        if (!pblUseBarflip) {
            const base = pblPreviousCase.slice(0, -1); // strip +/- suffix
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

// Open alg reference (in the search bar) on scramble click — PBL and OBL.
currentScrambleEl.addEventListener("click", () => {
    if (usingTimer()) return;
    if (trainerMode === 'pbl') {
        if (!pblHasActive || !pblScrambleList.length) return;
        const raw = pblScrambleList.at(-1 - pblOffset)?.[2];
        if (raw) openAlgReference(pblFindCluster(raw));
    } else if (oblHasActiveScramble && oblScrambleList.length) {
        const entry = oblScrambleList.at(-1 - oblScrambleOffset);
        if (entry) openAlgReference(oblFindCluster(entry[2]));
    }
});

// Open alg reference (in the search bar) on previous scramble click — PBL and OBL.
previousScrambleEl.style.cursor = "pointer";
previousScrambleEl.addEventListener("click", () => {
    if (usingTimer()) return;
    if (trainerMode === 'pbl') {
        if (!pblPreviousCase) return;
        openAlgReference(pblFindCluster(pblPreviousCase));
    } else {
        const prev = oblScrambleList.at(-2 - oblScrambleOffset);
        if (prev) openAlgReference(oblFindCluster(prev[2]));
    }
});

// ─── SHARED EVENT LISTENERS ───────────────────────────────────────────────────

filterInputEl.addEventListener("input", () => {
    if (trainerMode === 'obl') {
        filterInputEl.value = filterInputEl.value.replace(/[^a-zA-Z1-4/\- ]+/g, "");
        oblApplyFilter(filterInputEl.value);
        const hasFilter = filterInputEl.value.trim() !== '';
        if (hasFilter) {
            if (showMode !== 'searched') {
                preSearchMode = (showMode === 'list') ? 'all' : showMode;
                showMode = 'searched';
            }
        } else if (showMode === 'searched') {
            showMode = preSearchMode;
            if (showMode === 'selected') showSelected();
            else if (showMode === 'list' && highlightedList != null) oblSelectList(highlightedList, false);
            else showAll();
        }
        updateToggle();
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
        // Filter cleared: restore the previous (pre-search) display mode.
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

// ─── SPOTLIGHT SEARCH ─────────────────────────────────────────────────────────
// Ctrl/Cmd+Space (or the navbar search button) opens a centered search bar.
// It searches the active trainer's clusters by title, case name, and OBL legacy
// name; the extension below the bar lists matches. ↑/↓ move the selection and
// Enter opens the selected cluster's alg reference inline in the extension.
// The "?" button opens a per-trainer help modal.

const searchOverlayEl    = document.getElementById("search-overlay");
const searchPanelEl      = document.querySelector("#search-overlay .search-panel");
const searchInputEl      = document.getElementById("search-input");
const searchExtensionEl  = document.getElementById("search-extension");
const searchResultsEl    = document.getElementById("search-results");
const searchClusterEl    = document.getElementById("search-cluster");
const searchClusterContentEl = document.getElementById("search-cluster-content");
const searchTagViewEl    = document.getElementById("search-tagview");
const searchListViewEl   = document.getElementById("search-listview");
const searchHelpBtnEl    = document.getElementById("search-help-btn");
const searchHelpModalEl  = document.getElementById("search-help-modal");

let isSearchOpen      = false;
let searchMatches     = [];     // array of cluster titles currently shown
let searchActiveIx    = -1;     // index into searchMatches of the highlighted row
let searchInClusterView = false; // true while the extension shows an alg reference
let searchClusterTitle  = null;  // cluster currently shown in the extension
let searchEditMode      = false; // true while the alg reference is being edited
let searchClusterWidth  = '';    // cached panel width (px) for the open cluster

// Search index: per cluster, a title plus every "alias" the user might type to
// reach it — case names, and (for OBL) legacy verbose names. Built once per mode.
const _searchIndexCache = { pbl: null, obl: null };

function buildSearchIndex(mode) {
    const out = [];

    if (mode === 'pbl') {
        for (const [title, data] of Object.entries(pblClusters)) {
            const aliases = new Set([title]);
            (data['case-list'] || []).forEach(c => {
                aliases.add(c);
                // also searchable via the ":" solved-face shorthand ("Al/-" ≡ "Al:")
                if (c.endsWith('/-'))      aliases.add(c.slice(0, -2) + ':');
                else if (c.startsWith('-/')) aliases.add(':' + c.slice(2));
            });
            out.push({ title, aliases: [...aliases] });
        }
        return out;
    }

    // OBL: case-list entries are short codes (e.g. "Uw/THw"). Add the short codes,
    // their reverse-mapped legacy names ("right bunny/left thumb"), and the legacy
    // verbose names from OBLtranslation (both non-specific and specific).
    const rev = {}; // short code → legacy name
    for (const [legacy, short] of Object.entries(SquanLib.NAMING)) rev[short] = legacy;

    const byTitle = {};
    for (const [title, data] of Object.entries(oblClusters)) {
        const set = new Set([title]);
        (data['case-list'] || []).forEach(code => {
            set.add(code);
            const [a, b] = code.split('/');
            if (rev[a] && rev[b]) set.add(rev[a] + '/' + rev[b]);
        });
        byTitle[title] = set;
    }

    for (const nonSpe of Object.keys(OBLtranslation)) {
        const title = oblFindCluster(nonSpe);
        if (!title || !byTitle[title]) continue;
        byTitle[title].add(nonSpe);
        for (const spe of OBLtranslation[nonSpe]) {
            const [a, b] = spe.split('/');
            byTitle[title].add(spe);
            byTitle[title].add(b + '/' + a); // mirrored specific name
        }
    }

    for (const [title, set] of Object.entries(byTitle)) out.push({ title, aliases: [...set] });
    return out;
}

function getSearchIndex() {
    if (!_searchIndexCache[trainerMode]) _searchIndexCache[trainerMode] = buildSearchIndex(trainerMode);
    return _searchIndexCache[trainerMode];
}

// Renders a cluster's alg reference for `title` into an arbitrary `content`
// element. `onResize` is the callback the source tabs use to re-fit.
// Returns true if the cluster existed and was rendered.
function renderClusterInto(content, title, onResize = () => {}) {
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

// Opens the alg reference for a cluster title in the search bar (the only place
// alg references are shown — there is no separate modal). Used by scramble clicks
// and search-result selection.
function openAlgReference(title) {
    if (!title) return;
    if (!isSearchOpen) openSearch();
    showClusterInSearch(title);
}

function escapeHtml(s) {
    return s.replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
}

function highlightMatch(title, query) {
    const safe = escapeHtml(title);
    if (!query) return safe;
    const i = title.toLowerCase().indexOf(query.toLowerCase());
    if (i < 0) return safe;
    return escapeHtml(title.slice(0, i)) +
        '<mark>' + escapeHtml(title.slice(i, i + query.length)) + '</mark>' +
        escapeHtml(title.slice(i + query.length));
}

function renderSearchResults() {
    // Any change to the query returns the extension to plain-search mode.
    if (searchEditMode) { const dirty = algEditFinish(); searchEditMode = false; if (dirty) showSuccess("Saved.", 800); }
    closeUnitTagPopover();
    _stvCloseSelector();
    searchInClusterView = false;
    searchClusterTitle = null;
    searchClusterEl.style.display = "none";
    searchTagViewEl.style.display = "none";
    searchListViewEl.style.display = "none";
    searchResultsEl.style.display = "";
    searchPanelEl.style.width = ""; // undo any cluster-view widening

    const query = searchInputEl.value.trim();
    if (!query) {
        searchMatches  = [];
        searchActiveIx = -1;
        // Empty query in PBL shows the heatmaps; OBL shows nothing.
        if (trainerMode === 'pbl') {
            searchExtensionEl.style.display = "flex";
            searchResultsEl.style.display = "none";
            hmEl.style.display = "flex";
            searchPanelEl.style.width = "min(1180px, 96vw)";
            renderHeatmaps();
        } else {
            searchExtensionEl.style.display = "none";
        }
        return;
    }
    hmEl.style.display = "none";
    hmCloseFilter();

    const q = query.toLowerCase();

    // Special action entries (keyword commands) rank above cluster matches.
    const actionHits = Object.entries(SEARCH_ACTIONS)
        .filter(([keyword, a]) => keyword.includes(q) && (a.trainer === 'both' || a.trainer === trainerMode))
        .map(([keyword, a]) => ({ kind: 'action', action: keyword, title: a.label, desc: a.desc }));

    // Title matches rank above matches found only through a case/legacy alias.
    const titleHits = [];
    const aliasHits = [];
    for (const entry of getSearchIndex()) {
        if (entry.title.toLowerCase().includes(q)) {
            titleHits.push({ kind: 'cluster', title: entry.title, via: null });
        } else {
            const via = entry.aliases.find(a => a !== entry.title && a.toLowerCase().includes(q));
            if (via) aliasHits.push({ kind: 'cluster', title: entry.title, via });
        }
    }

    // Tags and lists are searchable by name, shown with their own result style.
    const tagHits = getTags()
        .filter(t => t.name.toLowerCase().includes(q))
        .map(t => ({ kind: 'tag', tagId: t.id, name: t.name, color: t.color, count: tagCaseBases(t.id).length }));
    const listHits = searchableListNames()
        .filter(name => name.toLowerCase().includes(q))
        .map(name => ({ kind: 'list', name, count: listCaseCount(name) }));

    searchMatches  = actionHits.concat(titleHits, tagHits, listHits, aliasHits);
    searchActiveIx = searchMatches.length ? 0 : -1;

    searchExtensionEl.style.display = "flex";
    if (!searchMatches.length) {
        searchResultsEl.innerHTML = '<div class="search-empty">No matching clusters</div>';
        return;
    }

    searchResultsEl.innerHTML = searchMatches.map((m, i) => {
        const act  = m.kind === 'action';
        const cls  = `search-result${i === 0 ? ' active' : ''}${act ? ' search-action' : ''}`;
        if (act) {
            return `<div class="${cls}" data-ix="${i}">${escapeHtml(m.title)}` +
                `<span class="search-result-via">${escapeHtml(m.desc || '')}</span></div>`;
        }
        if (m.kind === 'tag') {
            return `<div class="${cls}" data-ix="${i}">` +
                `<span class="search-result-swatch" style="--tag-color:${escapeHtml(m.color)}"></span>` +
                `${highlightMatch(m.name, query)}` +
                `<span class="search-result-meta">tag · ${m.count} case${m.count === 1 ? '' : 's'}</span></div>`;
        }
        if (m.kind === 'list') {
            return `<div class="${cls}" data-ix="${i}">${highlightMatch(m.name, query)}` +
                `<span class="search-result-meta">list · ${m.count} case${m.count === 1 ? '' : 's'}</span></div>`;
        }
        const titleHtml = m.via ? escapeHtml(m.title) : highlightMatch(m.title, query);
        const viaHtml   = m.via ? `<span class="search-result-via">${highlightMatch(m.via, query)}</span>` : '';
        return `<div class="${cls}" data-ix="${i}">${titleHtml}${viaHtml}</div>`;
    }).join('');
}

function moveSearchSelection(delta) {
    if (!searchMatches.length) return;
    searchActiveIx = (searchActiveIx + delta + searchMatches.length) % searchMatches.length;
    const rows = searchResultsEl.querySelectorAll('.search-result');
    rows.forEach((r, i) => r.classList.toggle('active', i === searchActiveIx));
    const active = rows[searchActiveIx];
    if (active) active.scrollIntoView({ block: 'nearest' });
}

// Keyword commands surfaced in the search bar, keyed by the search term that
// triggers them. Add new actions here — { label, desc, trainer, run } — and they
// show up automatically. `trainer` ('obl' | 'pbl' | 'both') limits which
// trainer(s) the action appears in. `run` is invoked when the entry is chosen.
const SEARCH_ACTIONS = {
    tags: { label: 'Tags', desc: 'Manage your tags', trainer: 'both', run: () => openTagModal() },
};

function openSearchResult(ix) {
    const match = searchMatches[ix];
    if (!match) return;
    if (match.kind === 'action') { closeSearch(); SEARCH_ACTIONS[match.action]?.run(); return; }
    if (match.kind === 'tag')    { showTagInSearch(match.tagId); return; }
    if (match.kind === 'list')   { showListInSearch(match.name); return; }
    showClusterInSearch(match.title);
}

// Lists searchable in the current trainer (defaults + user-created).
function searchableListNames() {
    return trainerMode === 'obl'
        ? [...Object.keys(oblDefaultLists), ...Object.keys(oblUserLists)]
        : [...Object.keys(pblDefaultLists), ...Object.keys(pblUserLists)];
}

// Distinct-case count of a list, matching the lists-modal badge.
function listCaseCount(name) {
    if (trainerMode === 'obl') {
        const l = oblDefaultLists[name] || oblUserLists[name];
        return l ? l[oblUsingSpe].length : 0;
    }
    const l = pblDefaultLists[name] || pblUserLists[name];
    return l ? new Set(l.map(s => s.slice(0, -1))).size : 0;
}

// Shows a cluster's alg reference inside the search extension and sets the search
// bar to the cluster title. Setting .value programmatically does not fire `input`,
// so the user editing the bar (which does) reverts to plain search.
function showClusterInSearch(title) {
    if (!(trainerMode === 'pbl' ? pblClusters : oblClusters)?.[title]) return;
    searchClusterTitle = title;
    searchEditMode = false;
    searchInClusterView = true;
    searchInputEl.value = title;
    searchExtensionEl.style.display = "flex";
    searchResultsEl.style.display = "none";
    searchTagViewEl.style.display = "none";
    searchListViewEl.style.display = "none";
    hmEl.style.display = "none";
    hmCloseFilter();
    searchClusterEl.style.display = "flex";
    renderSearchClusterBody();
}

// Renders the cluster body in read or edit mode and syncs the toolbar.
function renderSearchClusterBody() {
    closeUnitTagPopover();
    const tb = document.getElementById('search-cluster-toolbar');
    tb.querySelector('.sct-edit').classList.toggle('active', searchEditMode);
    tb.querySelectorAll('.sct-undo, .sct-redo').forEach(b => b.style.display = searchEditMode ? '' : 'none');

    if (searchEditMode) {
        // Keep the current read-mode width so entering edit doesn't shrink the panel.
        algEditRender(searchClusterContentEl, searchClusterTitle);
    } else {
        applySearchClusterWidth(searchClusterTitle);
        // On a source-tab change, reuse the cached width so switching views
        // doesn't resize the panel, and re-check tag-chip overflow.
        renderClusterInto(searchClusterContentEl, searchClusterTitle, () => {
            searchPanelEl.style.width = searchClusterWidth;
            applyUnitTagOverflow(searchClusterContentEl);
        });
        applyUnitTagOverflow(searchClusterContentEl);
    }
}

function toggleSearchEdit() {
    if (!searchClusterTitle) return;
    searchEditMode = !searchEditMode;
    let dirty = false;
    if (searchEditMode) algEditBegin(searchClusterTitle);
    else                dirty = algEditFinish();
    renderSearchClusterBody();
    if (!searchEditMode && dirty) showSuccess("Saved.", 800);
}

// Sizes the whole search panel (bar + extension) to fit the cluster's widest
// ALG LINE, measured across ALL sources so switching the Matt/Derpy/JLMinx tabs
// keeps a constant width. Only the monospace alg lines (.matt-algs/.pure-algs,
// which are nowrap + fit-content) count — prose explanations are free to wrap.
// Clamped to the viewport; cached in searchClusterWidth for tab-change reuse.
function applySearchClusterWidth(title) {
    const content = searchClusterContentEl;
    const cluster = effectiveCluster(title);
    if (!cluster) return;
    const SKIP     = new Set(['case-list', 'optimal-slicecount']);
    const sources  = Object.keys(cluster).filter(k => !SKIP.has(k));
    const meta     = trainerMode === 'obl' ? OBL_SOURCE_META : PBL_SOURCE_META;
    const sheetFmt = trainerMode === 'obl' ? oblFormatSheet : pblFormatSheet;

    const prev = content.innerHTML;
    searchPanelEl.style.width = '';   // measure at the natural (default) width
    content.style.visibility = 'hidden';
    let maxRight = 0;                  // widest alg-line right edge from content's left
    for (const src of sources) {
        const m = meta[src] ?? { label: src, linkText: src, url: '', formatter: sheetFmt };
        // #cluster-source-content so the ">span { display:block }" rules apply.
        content.innerHTML = `<span class="cluster-title">${escapeHtml(title)}</span><div id="cluster-source-content">${m.formatter(cluster, src, m)}</div>`;
        const cLeft = content.getBoundingClientRect().left;
        content.querySelectorAll('.matt-algs, .pure-algs').forEach(el => {
            maxRight = Math.max(maxRight, el.getBoundingClientRect().right - cLeft);
        });
    }
    content.innerHTML = prev;
    content.style.visibility = '';

    const maxW = Math.min(900, window.innerWidth * 0.92);
    const minW = Math.min(640, window.innerWidth * 0.92);
    // maxRight already spans content's left padding + the alg line; add the right padding.
    searchClusterWidth = Math.max(minW, Math.min(maxRight + 24, maxW)) + 'px';
    searchPanelEl.style.width = searchClusterWidth;
}

function openSearch() {
    if (usingTimer()) return;
    isSearchOpen = true;
    searchOverlayEl.style.display = "flex";
    searchInputEl.value = "";
    renderSearchResults();
    searchInputEl.focus();
}

function closeSearch(e) {
    if (e && e.target !== searchOverlayEl) return; // only the backdrop click closes
    if (searchEditMode) { const dirty = algEditFinish(); searchEditMode = false; if (dirty) showSuccess("Saved.", 800); }
    closeUnitTagPopover();
    _stvCloseSelector();
    hmCloseFilter();
    isSearchOpen = false;
    searchOverlayEl.style.display = "none";
    searchInputEl.blur();
}

function toggleSearch() {
    if (isSearchOpen) closeSearch();
    else openSearch();
}

// ─── Search help modal ────────────────────────────────────────────────────────
// Per-trainer help content shown by the "?" button in the search bar.

const SEARCH_HELP_CONTENT = {
    pbl: `<p>Search PBL clusters by their title.</p>
          <p style="opacity:0.5">More PBL-specific search help coming soon.</p>`,
    obl: `<p>Search OBL clusters by their title.</p>
          <p style="opacity:0.5">More OBL-specific search help coming soon.</p>`,
};

function openSearchHelp() {
    document.getElementById("search-help-title").textContent =
        (trainerMode === 'pbl' ? 'PBL' : 'OBL') + ' search';
    document.getElementById("search-help-content").innerHTML =
        SEARCH_HELP_CONTENT[trainerMode] || '';
    searchHelpModalEl.style.display = "flex";
}

function closeSearchHelp(e) {
    if (e && e.target !== searchHelpModalEl) return;
    searchHelpModalEl.style.display = "none";
}

document.getElementById("opensearch").addEventListener("click", (e) => {
    e.currentTarget.blur(); // don't leave the nav button stuck in :focus on mobile
    toggleSearch();
});
searchHelpBtnEl.addEventListener("click", openSearchHelp);
searchInputEl.addEventListener("input", renderSearchResults);

document.querySelector('#search-cluster-toolbar .sct-edit').addEventListener("click", toggleSearchEdit);
document.querySelector('#search-cluster-toolbar .sct-undo').addEventListener("click", () => algEditUndo());
document.querySelector('#search-cluster-toolbar .sct-redo').addEventListener("click", () => algEditRedo());

// ── Per-unit tag attach (read mode) ──────────────────────────────────────────
let _unitTagRef = null;

searchClusterContentEl.addEventListener("click", (e) => {
    if (searchEditMode) return;
    const add = e.target.closest('.unit-tag-add');
    if (add) { e.stopPropagation(); openUnitTagPopover(add, add.dataset.ref); }
});

function _unitTagPopoverInner(refs) {
    const tags = getTags();
    if (!tags.length) return `<div class="unit-tag-empty">No tags yet — create them in the Tags menu.</div>`;
    return tags.map(t => {
        const state = tagUnitState(t.id, refs); // 'none' | 'some' | 'all'
        const cls   = state === 'all' ? ' checked' : state === 'some' ? ' partial' : '';
        return `<button class="unit-tag-opt" data-tag="${escapeHtml(t.id)}">
            <span class="unit-tag-dot" style="--tag-color:${escapeHtml(t.color)}"></span>
            <span class="unit-tag-name">${escapeHtml(t.name)}</span>
            <span class="unit-tag-box${cls}"></span>
        </button>`;
    }).join('');
}

function openUnitTagPopover(btn, ref) {
    closeUnitTagPopover();
    _unitTagRef = ref;
    const pop = document.createElement('div');
    pop.className = 'unit-tag-popover';
    pop.innerHTML = _unitTagPopoverInner([ref]);
    document.body.appendChild(pop);

    const r = btn.getBoundingClientRect();
    pop.style.top  = (r.bottom + 6) + 'px';
    pop.style.left = r.left + 'px';
    const pr = pop.getBoundingClientRect();
    if (pr.right  > window.innerWidth  - 8) pop.style.left = Math.max(8, window.innerWidth  - 8 - pr.width) + 'px';
    if (pr.bottom > window.innerHeight - 8) pop.style.top  = Math.max(8, r.top - pr.height - 6) + 'px';

    pop.addEventListener('click', (e) => {
        const opt = e.target.closest('.unit-tag-opt');
        if (!opt) return;
        toggleUnitTag(_unitTagRef, opt.dataset.tag);
        searchClusterContentEl.querySelectorAll(`.unit-tags[data-ref="${_unitTagRef}"]`)
            .forEach(el => { el.innerHTML = unitTagsInner(_unitTagRef); });
        applyUnitTagOverflow(searchClusterContentEl);
        pop.innerHTML = _unitTagPopoverInner([_unitTagRef]);
    });
    setTimeout(() => document.addEventListener('pointerdown', _unitTagOutside), 0);
}

// Collapse a unit's tag chips to dots when they don't fit on the line.
function applyUnitTagOverflow(content) {
    content.querySelectorAll('.unit-tags').forEach(ut => {
        const list = ut.querySelector('.unit-tag-list');
        if (!list) return;
        ut.classList.remove('dots');                       // measure in chip mode
        if (list.scrollWidth > list.clientWidth + 1) ut.classList.add('dots');
    });
}

function _unitTagOutside(e) {
    if (!e.target.closest('.unit-tag-popover') && !e.target.closest('.unit-tag-add')) closeUnitTagPopover();
}

function closeUnitTagPopover() {
    document.removeEventListener('pointerdown', _unitTagOutside);
    document.querySelectorAll('.unit-tag-popover').forEach(p => p.remove());
    _unitTagRef = null;
}

searchResultsEl.addEventListener("click", (e) => {
    const row = e.target.closest('.search-result');
    if (row) openSearchResult(Number(row.dataset.ix));
});

searchInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        e.preventDefault();
        if (searchHelpModalEl.style.display === "flex") closeSearchHelp();
        else closeSearch();
        return;
    }
    // While an alg reference is shown in the extension, leave the keys alone so
    // the caret can move and the content can be scrolled — no result navigation.
    if (searchInClusterView) return;
    switch (e.key) {
        case "ArrowDown": e.preventDefault(); moveSearchSelection(1);  break;
        case "ArrowUp":   e.preventDefault(); moveSearchSelection(-1); break;
        case "Enter":     e.preventDefault(); if (searchActiveIx >= 0) openSearchResult(searchActiveIx); break;
    }
});

document.addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON') {
        e.target.blur(); // Removes focus so key + spacebar cannot trigger a click
    }
});

window.addEventListener("keydown", (e) => {
    const inInput = document.activeElement === filterInputEl;

    // Ctrl/Cmd+Space toggles the spotlight search from anywhere.
    if ((isMac() ? e.metaKey : e.ctrlKey) && e.code === "Space") {
        e.preventDefault();
        toggleSearch();
        return;
    }

    if (e.code === "Escape") {
        if (document.getElementById("tag-modal").style.display === "flex") { closeTagModal(); return; }
        if (searchHelpModalEl.style.display === "flex") { closeSearchHelp(); return; }
        if (isSearchOpen) { closeSearch(); return; }
        if (isPopupOpen) closePopup();
        if (usingTimer()) resetTimer(false);
        if (inInput) filterInputEl.blur();
        return;
    }

    // Undo/redo for the alg editor (only while editing; doesn't touch selection undo).
    if (algEditActive()) {
        const ctrl = isMac() ? e.metaKey : e.ctrlKey;
        if (ctrl && !e.altKey) {
            const k = e.key.toLowerCase();
            if (k === "z" && !e.shiftKey) { e.preventDefault(); algEditUndo(); return; }
            if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); algEditRedo(); return; }
        }
    }

    // While the search bar is open, let its own input handler own the keyboard.
    if (isSearchOpen) return;

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
                if (trainerMode === 'pbl' && eachCaseEl.disabled) return;
                eachCaseEl.checked = !eachCaseEl.checked;
                if (trainerMode === 'pbl') pblOnEachCase(); else oblOnEachCase();
                return;
            case "r":
                if (!canShortcut) return;
                if (trainerMode !== 'pbl') return;
                if (weightEl.disabled) return;
                weightEl.checked = !weightEl.checked; pblOnWeights();
                return;
            case "g":
                if (!canShortcut) return;
                if (trainerMode !== 'pbl') return;
                if (!pblUseBarflip) return;
                globalBarflipEl.checked = !globalBarflipEl.checked; pblOnGlobalBarflip();
                return;
            case "b":
                if (!canShortcut) return;
                if (trainerMode !== 'pbl') return;
                if (useBarflipEl.disabled) return;
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
        tags:         exportTagsRaw(),
        algOverridesPBL:   pblStorage.getItem('algOverrides'),
        algOverridesOBL:   oblStorage.getItem('algOverrides'),
        tagAssignmentsPBL: pblStorage.getItem('tagAssignments'),
        tagAssignmentsOBL: oblStorage.getItem('tagAssignments'),
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
            const jsonData = JSON.parse(reader.result);
            // ── PBL ──
            let outdated = false;
            if ("selectedPBL" in jsonData) {
                pblDeselectAll();
                const sel = jsonData["selectedPBL"];
                pblStorage.setItem("selected", sel);
                const allLists = [sel, ...Object.values(JSON.parse(jsonData["userListsPBL"] ?? '{}'))];
                if (allLists.some(lst => Array.isArray(lst) && lst.length && !lst[0].endsWith('+') && (!lst[0].endsWith('-') || lst[0].endsWith('/-'))))
                    outdated = true;
            }
            if ("userListsPBL" in jsonData)   pblStorage.setItem("userLists", jsonData["userListsPBL"]);
            else if ("userLists" in jsonData) { pblStorage.setItem("userLists", jsonData["userLists"]); outdated = true; }
            if ("settingsPBL" in jsonData)    pblStorage.setItem("settings", jsonData["settingsPBL"]);
            else if ("settings" in jsonData)  { pblStorage.setItem("settings", jsonData["settings"]); outdated = true; }
            // ── OBL ──
            if ("selectedOBL" in jsonData)  oblStorage.setItem("selected",  jsonData["selectedOBL"]);
            if ("userListsOBL" in jsonData) oblStorage.setItem("userLists", jsonData["userListsOBL"]);
            if ("settingsOBL" in jsonData)  oblStorage.setItem("settings",  jsonData["settingsOBL"]);
            // ── Tags ──
            if ("tags" in jsonData) importTagsRaw(jsonData["tags"]);
            // ── Alg-reference overrides + tag assignments (per trainer) ──
            for (const [field, store, key] of [
                ["algOverridesPBL",   pblStorage, "algOverrides"],
                ["algOverridesOBL",   oblStorage, "algOverrides"],
                ["tagAssignmentsPBL", pblStorage, "tagAssignments"],
                ["tagAssignmentsOBL", oblStorage, "tagAssignments"],
            ]) {
                if (field in jsonData && jsonData[field] != null) store.setItem(key, jsonData[field]);
            }
            if (outdated) alert("File formatting is outdated, re-export recommended.");
            pblLoadStorage();
            // Always reload OBL in-memory state regardless of current trainer mode,
            // so uploading either JSON works from either trainer without switching first.
            oblLoadSettings();
            oblLoadUserLists();
            oblLoadSelected();
            if (trainerMode === 'obl') {
                oblRestoreGrid();
            } else {
                // oblLoadSettings touched shared checkboxes and oblLoadSelected may have
                // written an OBL scramble to the display — restore PBL state on top.
                pblRestoreSettings();
                if (pblHasActive && pblScrambleList.length)
                    currentScrambleEl.textContent = pblScrambleList.at(-1 - pblOffset)[usingKarn];
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
    if (highlightedTagId() != null) { alert("Tags can't be overwritten here — edit them in the Tags menu."); return; }
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
    const tagId = highlightedTagId();
    if (tagId != null) {
        if (trainerMode === 'obl') oblSelectTag(tagId, false); else pblSelectTag(tagId, false);
        closePopup();
        showSuccess("Viewing the tag.", 1000);
        return;
    }
    if (highlightedList == null) { alert("Please click on a list."); return; }
    if (trainerMode === 'obl') { oblSelectList(highlightedList, false); }
    else                       { pblSelectList(highlightedList, false); }
    closePopup();
    showSuccess("Selected the list.", 1000);
});

deleteListEl.addEventListener("click", () => {
    const tagId = highlightedTagId();
    if (tagId != null) {
        const t = getTags().find(x => x.id === tagId);
        if (t && confirm('Delete tag "' + t.name + '"? This removes it everywhere.')) {
            deleteTag(tagId);
            highlightedList = null;
            renderTagMenu();
            showSuccess("Deleted the tag.");
        }
        return;
    }
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
    const tagId = highlightedTagId();
    if (tagId != null) {
        if (trainerMode === 'obl') oblSelectTag(tagId, true); else pblSelectTag(tagId, true);
        closePopup();
        showSuccess("Training the tag.", 1000);
        return;
    }
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
        updateRemainingCount();
    } else {
        pblSaveSettings();
        eachCaseEl.disabled = false; // clear any PBL W↔E lock on the shared sidebar checkbox
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
        updateRemainingCount();
    }
    renderTagMenu(); // tag case-counts are trainer-specific
}

document.getElementById('mode-title').addEventListener('click', switchMode);
