import { pblDefaultLists } from '../data/pbl-data.js';
import { algEditActive, algEditRedo, algEditUndo, oblFindCluster, pblFindCluster } from './alg-reference.js';
import { oblAddDefaultLists, oblApplyFilter, oblCaseSpliced, oblDeleteList, oblDeselect, oblDeselectAll, oblDeselectThese, oblDisplayCurrentScramble, oblDisplayPreviousScramble, oblGenerateScramble, oblHasActiveScramble, oblHelpSections, oblInitDefaultLists, oblLoadSelected, oblLoadSettings, oblLoadUserLists, oblNewList, oblOnEachCase, oblOnMemo, oblOnSpe, oblOverwriteList, oblPreviouslySelected, oblRedoSelected, oblRemainingCases, oblResetSelection, oblRestoreGrid, oblSaveSelected, oblSaveSettings, oblScrambleList, oblScrambleOffset, oblSelect, oblSelectAll, oblSelectList, oblSelectTag, oblSelectedCases, oblSetHistory, oblSetScrambleOffset, oblStorage, oblUsingSpe } from './obl-core.js';
import { applyFilter, pblAddDefaultLists, pblAddUserLists, pblApplyBarflipUI, pblCaseSpliced, pblDeselect, pblDeselectAll, pblDeselectThese, pblDisplayPrevScram, pblEnsureGrid, pblGenerateScramble, pblHasActive, pblHelpSections, pblHide, pblLoadStorage, pblName, pblOffset, pblOnEachCase, pblOnGlobalBarflip, pblOnUseBarflip, pblOnWeights, pblPending, pblPossible, pblPreviousCase, pblPreviouslySelected, pblRedoSelected, pblRemaining, pblRequestScramble, pblResetSelection, pblRestoreGrid, pblRestoreSettings, pblSaveSelected, pblSaveSettings, pblScrambleList, pblScrambleMode, pblSelect, pblSelectAll, pblSelectList, pblSelectTag, pblSelectThese, pblSelected, pblSetDomClass, pblSetHistory, pblSetOffset, pblShow, pblStorage, pblUseBarflip, pblUserLists, pblWorkerBusy } from './pbl-core.js';
import { isSearchOpen, openAlgReference, saveSearchEdit, toggleSearch } from './search.js';
import { deleteTag, exportTagsRaw, getTags, highlightedTagId, importTagsRaw, renderTagMenu } from './tags.js';

// ─── MATH UTILITIES ──────────────────────────────────────────────────────────

export function mod(n, m) {
    return ((n % m) + m) % m;
}

export function randInt(min, max) {
    // max included
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randrange(start, stop, step = 1) {
    if (stop === undefined) { stop = start; start = 0; }
    const width = Math.ceil((stop - start) / step);
    if (width <= 0) throw new Error("Invalid range");
    return start + Math.floor(Math.random() * width) * step;
}

// ─── SHARED CONSTANTS ─────────────────────────────────────────────────────────

export const MIN_EACHCASE = 2;
export const MAX_EACHCASE = 4;

// ─── SHARED STATE ─────────────────────────────────────────────────────────────

export let usingKarn = 0; // 0 = standard, 1 = karn; shared by both trainers

export function setUsingKarn(value) { usingKarn = value; }

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

export let showMode      = 'all'; // 'all' | 'selected' | 'searched' | 'list'
let preSearchMode = 'all';
export let highlightedList = null;

export function setShowMode(value) { showMode = value; }
export function setHighlightedList(value) { highlightedList = value; }

// ─── DOM ELEMENT REFERENCES ───────────────────────────────────────────────────

const fileEl          = document.getElementById("fileinput");

document.getElementById('squango-home').addEventListener('click', () => {
    location.href = 'https://squan-go.web.app/';
});

const railEl       = document.getElementById("rail");
const railToggleEl = document.getElementById("rail-toggle");

// Shared case-list container and filter — used by both trainers.
export const caseListEl    = document.getElementById("results");
export const filterInputEl = document.getElementById("pbl-filter");

export const eachCaseEl       = document.getElementById("each-case");
export const karnEl           = document.getElementById("karn");
export const weightEl         = document.getElementById("weight");
export const globalBarflipEl  = document.getElementById("globalbarflip");
export const globalBarflipRow = document.getElementById("globalbarfliprow");
export const useBarflipEl     = document.getElementById("usebarflip");
export const bottom56El       = document.getElementById("allow-bottom56");
export const bottom56Row      = document.getElementById('bottom56-row');

const removeLastEl    = document.getElementById("unselprev");
const selectAllEl     = document.getElementById("sela");
const deselectAllEl   = document.getElementById("desela");
const showToggleEl    = document.getElementById("showtoggle");
const selCountEl      = document.getElementById("selcount");

const openListsEl     = document.getElementById("openlists");
export const userListsEl     = document.getElementById("userlists");
export const defaultListsEl  = document.getElementById("defaultlists");
const newListEl       = document.getElementById("newlist");
const deleteListEl    = document.getElementById("dellist");
const overwriteListEl = document.getElementById("overwritelist");
const selectListEl    = document.getElementById("sellist");
const trainListEl     = document.getElementById("trainlist");
const listPopupEl     = document.getElementById("list-popup");
const helpPopupEl     = document.getElementById("help-popup");
const settingsPopupEl = document.getElementById("settings-popup");
const casesPopupEl    = document.getElementById("cases-popup");

export const currentScrambleEl  = document.getElementById("cur-scram");
currentScrambleEl.style.cursor = "pointer";
export const previousScrambleEl = document.getElementById("prev-scram");
const prevScrambleButton = document.getElementById("prev");
const nextScrambleButton = document.getElementById("next");
export const timerEl    = document.getElementById("timer");
const timerBoxEl = document.getElementById("timerbox");

export function updateScrambleNavButtons() {
    const prevEntry = trainerMode === 'obl'
        ? oblScrambleList.at(-2 - oblScrambleOffset)
        : pblScrambleList.at(-2 - pblOffset);
    prevScrambleButton.disabled = !prevEntry;
}

// ─── SHARED HELPERS ───────────────────────────────────────────────────────────

export function usingTimer() {
    return isRunning || pressStartTime != null;
}

function isMac() {
    if (navigator.userAgentData) return navigator.userAgentData.platform === "macOS";
    return navigator.userAgent.toUpperCase().includes("MAC");
}

function recentlyStopped() {
    return timerStoppedAt !== null && (performance.now() - timerStoppedAt) < 200;
}

function canInteractTimer() {
    const active = trainerMode === 'obl' ? oblHasActiveScramble : pblHasActive;
    return active && document.activeElement !== filterInputEl && !isPopupOpen && !isSearchOpen;
}

export function validName(n) {
    for (const l of n) {
        if (l.toLowerCase() === l.toUpperCase() && isNaN(parseInt(l)) && !" /".includes(l))
            return false;
    }
    return true;
}

// ─── TOAST / LOADING ─────────────────────────────────────────────────────────

let _successTimer = null;
let _hideTimer    = null;

// Per-type icon for the toast (success ✓, error ✕, info ℹ).
const TOAST_ICONS = {
    success: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.25C6.61522 2.25 2.25 6.61522 2.25 12C2.25 17.3848 6.61522 21.75 12 21.75C17.3848 21.75 21.75 17.3848 21.75 12C21.75 6.61522 17.3848 2.25 12 2.25ZM16.5303 9.96967C16.8232 10.2626 16.8232 10.7374 16.5303 11.0303L11.5303 16.0303C11.2374 16.3232 10.7626 16.3232 10.4697 16.0303L7.46967 13.0303C7.17678 12.7374 7.17678 12.2626 7.46967 11.9697C7.76256 11.6768 8.23744 11.6768 8.53033 11.9697L11 14.4393L15.4697 9.96967C15.7626 9.67678 16.2374 9.67678 16.5303 9.96967Z" fill="currentColor"/></svg>`,
    error:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.25C6.61522 2.25 2.25 6.61522 2.25 12C2.25 17.3848 6.61522 21.75 12 21.75C17.3848 21.75 21.75 17.3848 21.75 12C21.75 6.61522 17.3848 2.25 12 2.25ZM9.53 8.47a.75.75 0 0 0-1.06 1.06L10.94 12l-2.47 2.47a.75.75 0 1 0 1.06 1.06L12 13.06l2.47 2.47a.75.75 0 1 0 1.06-1.06L13.06 12l2.47-2.47a.75.75 0 0 0-1.06-1.06L12 10.94 9.53 8.47Z" fill="currentColor"/></svg>`,
    info:    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.25C6.61522 2.25 2.25 6.61522 2.25 12C2.25 17.3848 6.61522 21.75 12 21.75C17.3848 21.75 21.75 17.3848 21.75 12C21.75 6.61522 17.3848 2.25 12 2.25ZM12 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-.75 3.5a.75.75 0 0 1 1.5 0v6a.75.75 0 0 1-1.5 0v-6Z" fill="currentColor"/></svg>`,
};

// Transient toast. `type` ('success' | 'error' | 'info') sets the colour + icon.
function showToast(message, type = 'success', duration = 2000) {
    const toast = document.getElementById("success-toast");
    const box   = document.getElementById("toast-box");

    // Cancel any pending dismiss or fade-out completion.
    if (_successTimer) { clearTimeout(_successTimer); _successTimer = null; }
    if (_hideTimer)    { clearTimeout(_hideTimer);    _hideTimer    = null; }

    // Stop any fade-out, ensure visible.
    toast.classList.remove("fading");
    toast.style.display = "flex";
    box.className = 'success-box toast-' + type;
    document.getElementById("toast-icon").innerHTML = TOAST_ICONS[type] || TOAST_ICONS.success;
    document.getElementById("success-message").textContent = message;

    // Restart the entry animation directly on the box element.
    // Toggling display on the parent is unreliable for restarting child animations.
    box.style.animation = 'none';
    void box.offsetHeight; // flush styles so the browser sees the reset
    box.style.animation = '';

    _successTimer = setTimeout(hideSuccess, duration);
}

export function showSuccess(message = "Done!", duration = 2000) { showToast(message, 'success', duration); }
export function showError(message, duration = 2400)             { showToast(message, 'error',   duration); }
export function showInfo(message,  duration = 2200)             { showToast(message, 'info',    duration); }

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

// Every dismissible layer — modal popups, the spotlight search, the tag modal,
// the search-help modal — registers on one overlay stack. Each open pushes a
// history entry, so a single Back step (Esc, the ✕, a backdrop click, or the
// hardware/browser Back button) closes exactly one layer. The popstate handler
// unwinds the stack to whatever depth the history landed on.
//
// Each entry: { el, close, isPopup }. `close()` only hides the layer (never
// touches history). `isPopup` flags layers that should block trainer shortcuts.
const overlayStack = [];
// When a layer is swapped for another (a search action → modal / cluster view),
// the replacement reuses the closed layer's history entry instead of stacking a
// new one, so the depth stays in step with what's actually open.
let _reuseHistorySlot = false;

function recomputePopupFlag() {
    isPopupOpen = overlayStack.some(o => o.isPopup);
}

function syncOverlayBackdrops() {
    // Only the topmost layer paints its backdrop; lower .popup modals go flat so
    // the darken/blur never compounds.
    const topEl = overlayStack.length ? overlayStack[overlayStack.length - 1].el : null;
    overlayStack.forEach(o => {
        if (o.el && o.el.classList.contains('popup'))
            o.el.classList.toggle('behind', o.el !== topEl);
    });
}

export function pushOverlay(entry) {
    overlayStack.push(entry);
    recomputePopupFlag();
    syncOverlayBackdrops();
    const state = { overlayDepth: overlayStack.length };
    if (_reuseHistorySlot) { _reuseHistorySlot = false; history.replaceState(state, ''); }
    else                   { history.pushState(state, ''); }
}

// Close the top layer WITHOUT touching history (used by the popstate handler).
function popOverlayRaw() {
    const entry = overlayStack.pop();
    if (entry) entry.close();
    recomputePopupFlag();
    syncOverlayBackdrops();
}

// UI single-step close (Esc / ✕ / backdrop) → routed through history so it and
// the hardware Back button share one path.
export function dismissTopOverlay() { if (overlayStack.length) history.back(); }

// Close the whole stack at once (an action that finalizes, e.g. picking a list).
function dismissAllOverlays() { if (overlayStack.length) history.go(-overlayStack.length); }

// Close the top layer in anticipation of opening another in its place; the next
// pushOverlay reuses this history slot. If nothing reopens, the caller should
// clear the reservation with abandonTransition().
export function closeOverlayForTransition() {
    const entry = overlayStack.pop();
    if (entry) entry.close();
    recomputePopupFlag();
    syncOverlayBackdrops();
    _reuseHistorySlot = true;
}

// No replacement opened after a transition — discard the now-empty history slot.
export function abandonTransition() {
    if (_reuseHistorySlot) { _reuseHistorySlot = false; history.back(); }
}

let _overlayPopPending = false;
window.addEventListener('popstate', async (e) => {
    const target = e.state?.overlayDepth ?? 0;
    if (_overlayPopPending || overlayStack.length <= target) return;

    // A layer may veto navigation while it waits for a custom confirmation
    // modal (the alg editor uses this for unsaved changes). History has already
    // moved, so a veto walks it forward to the still-open overlay entry.
    const top = overlayStack[overlayStack.length - 1];
    if (top?.beforeClose) {
        _overlayPopPending = true;
        const allow = await top.beforeClose();
        _overlayPopPending = false;
        if (!allow) {
            history.go(overlayStack.length - target);
            return;
        }
    }
    while (overlayStack.length > target) popOverlayRaw();
});

// Back-compat alias kept for existing call sites.
function closeTopModal() { dismissTopOverlay(); }

function pushModal(el, onOpen) {
    if (usingTimer()) return;
    if (overlayStack.some(o => o.el === el)) return;
    onOpen?.();
    el.classList.add('open');
    pushOverlay({ el, isPopup: true, close: () => el.classList.remove('open', 'behind') });
}

function openListPopup()     { pushModal(listPopupEl, renderTagMenu); }
function openCasesPopup()    {
    pushModal(casesPopupEl, () => {
        if (trainerMode === 'pbl') pblEnsureGrid();
    });
}

/**
 * buildHelpShortcuts — turns an array of {keys, desc} (or null for a spacer)
 * into the HTML for a shortcut list.
 */
export function buildHelpShortcuts(rows) {
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
    pushModal(helpPopupEl, () => renderHelp(trainerMode === 'pbl' ? pblHelpSections : oblHelpSections));
}
function openSettingsPopup() { pushModal(settingsPopupEl); }

// closePopup closes the ENTIRE overlay stack (used when an action finalizes, e.g.
// picking a list). Going back through history keeps the browser entries in sync.
export function closePopup() { dismissAllOverlays(); }

[listPopupEl, helpPopupEl, settingsPopupEl, casesPopupEl].forEach(el => {
    el.addEventListener('click', (e) => { if (e.target === el) closeTopModal(); });
});

for (const cross of document.querySelectorAll(".cross")) {
    cross.addEventListener("click", () => closeTopModal());
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
            oblSetScrambleOffset(0);
            oblGenerateScramble();
        } else {
            pblSetOffset(pblOffset - 1);
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
export function updateSelCount() {
    let count;
    if (trainerMode === 'obl') {
        count = oblSelectedCases[oblUsingSpe].length;
    } else {
        count = new Set(pblSelected.map(s => s.slice(0, -1))).size;
    }
    selCountEl.textContent = 'Selected: ' + count;
}

// update the remainging count if each-case is on
export function updateRemainingCount() {
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
    // spliced is set synchronously before the splice in each generate function,
    // so queued + 1 is always correct: the current case + everything still in the array.
    document.getElementById('remaining-count').textContent = queued + (spliced ? 1 : 0);
    wrapperEl.style.display = '';
}

// updateToggle: purely reads showMode + highlightedList — no trainer branching.
export function updateToggle() {
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
    showToggleEl.setAttribute('data-tip', `Showing: ${state}`);
    showToggleEl.innerHTML =
        `<span style="font-size:0.65em;opacity:0.8;font-weight:normal;letter-spacing:0.05em">SHOWING:</span>` +
        `<span style="max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${display}</span>`;
    // The select/deselect buttons act on "these" whenever a subset is shown.
    updateSelectBtn();
    updateDeselectBtn();
}

// True when the grid is showing only a subset of cases — either a live filter is
// applied, or the view is anything other than "all". In that state the
// select/deselect buttons operate on the visible cases ("these") rather than all.
function isShowingSubset() {
    return filterInputEl.value.trim() !== '' || showMode !== 'all';
}

export function updateSelectBtn() {
    selectAllEl.textContent = isShowingSubset() ? 'Select these' : 'Select ALL';
}

export function updateDeselectBtn() {
    deselectAllEl.textContent = isShowingSubset() ? 'Deselect these' : 'Deselect ALL';
}

// showAll / showSelected: shared entry points that delegate to the active trainer.
// Both set showMode and call updateToggle so the button label always stays in sync.
export function showAll() {
    if (trainerMode === 'obl') {
        document.querySelectorAll('.case').forEach(el => el.classList.remove('hidden'));
    } else {
        pblPossible.forEach(pbl => pblShow(pblName(pbl)));
    }
    showMode = 'all';
    updateSelCount();
    updateToggle();
}

export function showSelected() {
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
export function setHighlighted(id) {
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
export function addListItemEvent(item) {
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
        oblDisplayPreviousScramble();
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
        if (!oblScrambleList.at(-2 - oblScrambleOffset)) return;
        oblSetScrambleOffset(Math.min(oblScrambleOffset + 1, oblScrambleList.length - 1));
        oblDisplayCurrentScramble();
        oblDisplayPreviousScramble();
        return;
    }
    if (!pblScrambleList.at(-2 - pblOffset)) return;
    pblSetOffset(Math.min(pblOffset + 1, pblScrambleList.length - 1));
    currentScrambleEl.textContent = pblScrambleList.at(-1 - pblOffset)[usingKarn];
    pblDisplayPrevScram();
}

function nextScram() {
    if (usingTimer()) return;
    if (trainerMode === 'obl') {
        if (!oblScrambleList.length) return;
        const wasAtLatest = oblScrambleOffset === 0;
        oblSetScrambleOffset(oblScrambleOffset - 1);
        if (wasAtLatest) {
            oblGenerateScramble();
        } else {
            oblDisplayCurrentScramble();
            oblDisplayPreviousScramble();
        }
        return;
    }
    if (!pblScrambleList.length) return;
    pblSetOffset(pblOffset - 1);
    if (pblOffset < 0) {
        pblSetOffset(0);
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
export function pblSnapSelection() {
    pblSetHistory([...pblSelected], null); // new action clears redo
}

// Restore pblSelected to a snapshot, re-render DOM, and save.
function pblRestoreSelection(snap) {
    pblResetSelection();
    document.querySelectorAll('.case').forEach(el => pblSetDomClass(el, 'none'));
    for (const s of snap) pblSelect(s);
    pblSaveSelected();
    updateSelCount();
}

// Called by obl-core action functions before they mutate oblSelectedCases.
function oblSnapSelection() {
    oblSetHistory([...oblSelectedCases[oblUsingSpe]], null); // new action clears redo
}

// Restore oblSelectedCases to a snapshot, re-render DOM, and save.
function oblRestoreSelection(snap) {
    oblResetSelection();
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
    applyFilter(filterInputEl.value); // in pbl-core.js
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
    if (trainerMode === 'obl') { oblSelectAll(); return; } // already operates on visible cases
    if (isShowingSubset()) pblSelectThese(false);
    else pblSelectAll(false);
});

selectAllEl.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (trainerMode === 'obl') { oblDeselectAll(); return; }
    if (isShowingSubset()) pblSelectThese(true);
    else pblSelectAll(true);
});

deselectAllEl.addEventListener("click", () => {
    if (trainerMode === 'obl') { isShowingSubset() ? oblDeselectThese() : oblDeselectAll(); return; }
    if (isShowingSubset()) pblDeselectThese();
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

// ─── RAIL / MOBILE BAR ───────────────────────────────────────────────────────
// Static HTML owns the rail markup so it is complete before JavaScript loads.

function runRailAction(action) {
    switch (action) {
        case 'cases':    if (!usingTimer()) openCasesPopup();    break;
        case 'search':   toggleSearch();                         break;
        case 'help':     if (!usingTimer()) openHelpPopup();     break;
        case 'settings': if (!usingTimer()) openSettingsPopup(); break;
        case 'upload':   doUploadData();                         break;
        case 'download': doDownloadData();                       break;
    }
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.rail-btn');
    if (!btn) return;
    btn.blur();
    runRailAction(btn.dataset.action);
});

// ─── RAIL EXPAND / COLLAPSE (desktop) ────────────────────────────────────────
function applyRailCollapsed(collapsed) {
    railEl.classList.toggle('collapsed', collapsed);
    railToggleEl.setAttribute('data-tip', collapsed ? 'Expand' : 'Collapse');
}
applyRailCollapsed(true);

railToggleEl.addEventListener('click', () => {
    const collapsed = !railEl.classList.contains('collapsed');
    applyRailCollapsed(collapsed);
});

// ─── HTML ESCAPE ─────────────────────────────────────────────────────────────
export function escapeHtml(s) {
    return s.replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
}

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
        if (overlayStack.length) { dismissTopOverlay(); return; }
        if (usingTimer()) resetTimer(false);
        if (inInput) filterInputEl.blur();
        return;
    }

    // Undo/redo for the alg editor (only while editing; doesn't touch selection undo).
    if (algEditActive()) {
        const ctrl = isMac() ? e.metaKey : e.ctrlKey;
        if (ctrl && !e.altKey) {
            const k = e.key.toLowerCase();
            if (k === "s") { e.preventDefault(); saveSearchEdit(); return; }
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
    const canShortcut = !isPopupOpen
        || settingsPopupEl.classList.contains('open')
        || casesPopupEl.classList.contains('open');

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
                    if (!casesPopupEl.classList.contains('open')) openCasesPopup();
                    filterInputEl.focus(); return;

                case "z": e.preventDefault(); if (!canShortcut) return; {
                    if (trainerMode === 'pbl') {
                        if (pblPreviouslySelected === null) return;
                        const undoSnap        = pblPreviouslySelected;
                        pblSetHistory(null, [...pblSelected]);
                        pblRestoreSelection(undoSnap);
                    } else {
                        if (oblPreviouslySelected === null) return;
                        const undoSnap        = oblPreviouslySelected;
                        oblSetHistory(null, [...oblSelectedCases[oblUsingSpe]]);
                        oblRestoreSelection(undoSnap);
                    }
                    showInfo("Undo", 500);
                    return;
                }

                case "y": e.preventDefault(); if (!canShortcut) return; {
                    if (trainerMode === 'pbl') {
                        if (pblRedoSelected === null) return;
                        const redoSnap        = pblRedoSelected;
                        pblSetHistory([...pblSelected], null);
                        pblRestoreSelection(redoSnap);
                    } else {
                        if (oblRedoSelected === null) return;
                        const redoSnap        = oblRedoSelected;
                        oblSetHistory([...oblSelectedCases[oblUsingSpe]], null);
                        oblRestoreSelection(redoSnap);
                    }
                    showInfo("Redo", 500);
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

function doDownloadData() {
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
}

function doUploadData() {
    if (pressStartTime != null) return;
    fileEl.click();
}

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
            if (outdated) showInfo("File formatting is outdated, re-export recommended.");
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
                // oblLoadUserLists also re-rendered OBL lists into the shared list DOM,
                // so re-render PBL lists last to keep the lists modal correct.
                pblAddDefaultLists();
                pblAddUserLists();
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

newListEl.addEventListener("click", async () => {
    if (trainerMode === 'obl') { oblNewList(); return; }
    if (usingTimer()) return;
    if (pblSelected.length === 0) { showError("Please select PBLs to create a list!"); return; }
    let name = await appPrompt("Name of your list:", { title: "New list", placeholder: "List name" });
    if (!name) return;
    name = name.trim();
    if (!name || !validName(name)) { showError("Please enter a valid name (only letters, numbers, slashes, and spaces)"); return; }
    if (Object.keys(pblDefaultLists).includes(name)) { showError("A default list already has this name!"); return; }
    if (Object.keys(pblUserLists).includes(name))    { showError("You already gave this name to a list."); return; }
    if (document.getElementById(name))               { showError("You can't give this name to a list (id taken)."); return; }
    pblUserLists[name] = [...pblSelected];
    pblAddUserLists();
    setHighlighted(name);
    showSuccess("Successfully created the list.");
});

overwriteListEl.addEventListener("click", async () => {
    if (highlightedTagId() != null) { showError("Tags can't be overwritten here — edit them in the Tags menu."); return; }
    if (trainerMode === 'obl') { oblOverwriteList(); return; }
    if (usingTimer()) return;
    if (highlightedList == null) return;
    if (Object.keys(pblDefaultLists).includes(highlightedList)) { showError("You cannot overwrite a default list."); return; }
    if (pblSelected.length === 0) { showError("Please select PBLs to overwrite the list!"); return; }
    if (await appConfirm(`Overwrite list “${highlightedList}” with the current selection?`, { title: "Overwrite list", okText: "Overwrite", danger: true })) {
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
    if (highlightedList == null) { showError("Please click on a list."); return; }
    if (trainerMode === 'obl') { oblSelectList(highlightedList, false); }
    else                       { pblSelectList(highlightedList, false); }
    closePopup();
    showSuccess("Selected the list.", 1000);
});

deleteListEl.addEventListener("click", async () => {
    const tagId = highlightedTagId();
    if (tagId != null) {
        const t = getTags().find(x => x.id === tagId);
        if (t && await appConfirm(`Delete tag “${t.name}”? This removes it everywhere.`, { title: "Delete tag", okText: "Delete", danger: true })) {
            deleteTag(tagId);
            highlightedList = null;
            renderTagMenu();
            showSuccess("Deleted the tag.");
        }
        return;
    }
    if (trainerMode === 'obl') { oblDeleteList(); return; }
    if (highlightedList == null) return;
    if (Object.keys(pblDefaultLists).includes(highlightedList)) { showError("You cannot delete a default list."); return; }
    if (Object.keys(pblUserLists).includes(highlightedList)) {
        if (await appConfirm(`Delete list “${highlightedList}”?`, { title: "Delete list", okText: "Delete", danger: true })) {
            delete pblUserLists[highlightedList];
            highlightedList = null;
            pblAddUserLists();
            showSuccess("Successfully deleted the list.");
        }
        return;
    }
    showError("Error: list not found.");
});

trainListEl.addEventListener("click", () => {
    const tagId = highlightedTagId();
    if (tagId != null) {
        if (trainerMode === 'obl') oblSelectTag(tagId, true); else pblSelectTag(tagId, true);
        closePopup();
        showSuccess("Training the tag.", 1000);
        return;
    }
    if (highlightedList == null) { showError("Please click on a list."); return; }
    if (trainerMode === 'obl') { oblSelectList(highlightedList, true); }
    else                       { pblSelectList(highlightedList, true); }
    closePopup();
    showSuccess("Training the list.", 1000);
});

// ─── MODE SYSTEM ──────────────────────────────────────────────────────────────

const MODE_KEY  = 'trainerMode';
export let trainerMode = localStorage.getItem(MODE_KEY) || 'pbl'; // 'pbl' | 'obl'

function switchMode() {
    trainerMode = trainerMode === 'pbl' ? 'obl' : 'pbl';
    localStorage.setItem(MODE_KEY, trainerMode);
    applyMode();
}

export function applyMode() {
    const isPBL = trainerMode === 'pbl';
    const modeTitleEl = document.getElementById('mode-title');
    modeTitleEl.textContent = isPBL ? 'PBL TRAINER' : 'OBL TRAINER';
    modeTitleEl.setAttribute('data-tip', isPBL ? 'Switch to OBL Trainer' : 'Switch to PBL Trainer');

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
    updateScrambleNavButtons();
}

document.getElementById('mode-title').addEventListener('click', switchMode);


// ═══════════════════════════════════════════════════════════════════════════
//  APP DIALOG
//  Designed replacements for the browser's alert / confirm / prompt. Each opens
//  a styled modal and returns a Promise, so callers `await` the result instead
//  of blocking the main thread.
//
//   appAlert(msg)   → Promise<void>             (resolves when dismissed)
//   appConfirm(msg) → Promise<boolean>          (true = confirmed)
//   appPrompt(msg)  → Promise<string | null>    (null = cancelled)
//
//  Transient, non-blocking feedback uses the toast (showError / showInfo /
//  showSuccess) instead — dialogs are only for acknowledgement or input.
// ═══════════════════════════════════════════════════════════════════════════

// Low-level builder. `buttons` is [{ label, value, variant }]; `input`, when
// given, adds a text field and Enter submits the primary button's value.
function appDialog({ title = '', message = '', buttons, input = null, cancelValue }) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'app-dialog-overlay';

        const box = document.createElement('div');
        box.className = 'app-dialog';
        box.innerHTML =
            (title ? `<div class="app-dialog-title"></div>` : '') +
            `<div class="app-dialog-msg"></div>` +
            (input ? `<input type="text" class="app-dialog-input" spellcheck="false" autocomplete="off" />` : '') +
            `<div class="app-dialog-buttons"></div>`;
        if (title) box.querySelector('.app-dialog-title').textContent = title;
        box.querySelector('.app-dialog-msg').textContent = message;

        const field = input ? box.querySelector('.app-dialog-input') : null;
        if (field) {
            if (input.placeholder) field.placeholder = input.placeholder;
            if (input.value)       field.value = input.value;
        }

        let done = false;
        function finish(value) {
            if (done) return;
            done = true;
            document.removeEventListener('keydown', onKey, true);
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 150);
            resolve(value);
        }

        // The primary button (last one) is what Enter triggers.
        const btnRow = box.querySelector('.app-dialog-buttons');
        buttons.forEach(b => {
            const el = document.createElement('button');
            el.className = 'app-dialog-btn' + (b.variant ? ' ' + b.variant : '');
            el.textContent = b.label;
            el.addEventListener('click', () => finish(field ? (b.primary ? field.value : b.value) : b.value));
            btnRow.appendChild(el);
        });

        function onKey(e) {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(cancelValue); }
            else if (e.key === 'Enter') {
                e.preventDefault(); e.stopPropagation();
                const primary = buttons.find(b => b.primary);
                finish(field ? (primary ? field.value : (primary?.value)) : (primary ?? buttons.at(-1)).value);
            }
        }
        document.addEventListener('keydown', onKey, true);

        overlay.addEventListener('mousedown', e => { if (e.target === overlay) finish(cancelValue); });

        overlay.appendChild(box);
        document.body.appendChild(overlay);
        // Focus the input (prompt) or the primary button.
        if (field) { field.focus(); field.select(); }
        else (btnRow.querySelector('.primary') || btnRow.lastElementChild)?.focus();
    });
}

export function appConfirm(message, { title = 'Confirm', okText = 'OK', cancelText = 'Cancel', danger = false } = {}) {
    return appDialog({
        title, message, cancelValue: false,
        buttons: [
            { label: cancelText, value: false, variant: 'ghost' },
            { label: okText, value: true, variant: danger ? 'danger' : 'primary', primary: true },
        ],
    });
}

export function appPrompt(message, { title = '', okText = 'OK', cancelText = 'Cancel', value = '', placeholder = '' } = {}) {
    return appDialog({
        title, message, cancelValue: null,
        input: { value, placeholder },
        buttons: [
            { label: cancelText, value: null, variant: 'ghost' },
            { label: okText, variant: 'primary', primary: true },
        ],
    });
}


// ═══════════════════════════════════════════════════════════════════════════
//  TOOLTIP
//  A single designed tooltip shared by every element carrying `data-tip`,
//  replacing the browser's native `title` bubble (which is unstyled and never
//  appears on touch devices). Shows on hover (after a short delay) and on
//  keyboard focus; hides on leave, click, scroll, or focus loss.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
    let tipEl = null, current = null, showTimer = null;

    function ensure() {
        if (!tipEl) {
            tipEl = document.createElement('div');
            tipEl.className = 'app-tooltip';
            tipEl.setAttribute('role', 'tooltip');
            document.body.appendChild(tipEl);
        }
        return tipEl;
    }

    function position(target) {
        const el = tipEl;
        const r  = target.getBoundingClientRect();
        el.style.left = '0px';
        el.style.top  = '0px';                 // reset so we can measure natural size
        const tr = el.getBoundingClientRect();

        let left   = r.left + r.width / 2 - tr.width / 2;
        let top    = r.top - tr.height - 8;
        let below  = false;
        if (top < 6) { top = r.bottom + 8; below = true; }
        left = Math.max(6, Math.min(left, window.innerWidth - 6 - tr.width));

        el.style.left = left + 'px';
        el.style.top  = top + 'px';
        el.classList.toggle('below', below);
    }

    function show(target) {
        const text = target.getAttribute('data-tip');
        if (!text) return;
        const el = ensure();
        el.textContent = text;
        el.style.display = 'block';
        position(target);
        el.classList.add('visible');
    }

    function hide() {
        clearTimeout(showTimer);
        showTimer = null;
        current = null;
        if (tipEl) { tipEl.classList.remove('visible'); tipEl.style.display = 'none'; }
    }

    document.addEventListener('mouseover', (e) => {
        const t = e.target.closest('[data-tip]');
        if (t === current) return;
        hide();
        if (!t) return;
        current = t;
        showTimer = setTimeout(() => { if (current === t) show(t); }, 350);
    });
    document.addEventListener('mouseout', (e) => {
        const t = e.target.closest('[data-tip]');
        if (t && t === current) hide();
    });

    document.addEventListener('focusin', (e) => {
        const t = e.target.closest?.('[data-tip]');
        if (t) { current = t; show(t); }
    });
    document.addEventListener('focusout', hide);

    // Any click (e.g. pressing the button the tip describes) or scroll dismisses it.
    document.addEventListener('click', hide, true);
    window.addEventListener('scroll', hide, true);
})();
