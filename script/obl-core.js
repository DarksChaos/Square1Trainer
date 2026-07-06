import { OBL_DEFAULT_LISTS_RAW, OBL_MATT_LABELS, OBLtranslation, possibleOBL } from '../data/obl-data.js';
import { HELP_CTRL_SVG, HELP_HOME_SVG, HELP_LEARN_SVG, HELP_LIST_SVG, HELP_SEARCH_SVG, HELP_SYNC_SVG, HELP_TAG_SVG } from './help-icons.js';
import { MAX_EACHCASE, MIN_EACHCASE, addListItemEvent, appConfirm, appPrompt, buildHelpShortcuts, caseListEl, closePopup, currentScrambleEl, defaultListsEl, eachCaseEl, filterInputEl, highlightedList, karnEl, mod, previousScrambleEl, randInt, randrange, setHighlighted, setHighlightedList, setShowMode, setUsingKarn, showAll, showError, showMode, showSelected, showSuccess, timerEl, trainerMode, updateRemainingCount, updateScrambleNavButtons, updateSelCount, updateToggle, userListsEl, usingKarn, usingTimer, validName } from './app.js';
import { SquanLib, squan } from './squan.js';
import { tagCaseBases } from './tag-assignments.js';

// ─── OBL STATE ────────────────────────────────────────────────────────────────

export let oblSelectedCases     = [[], []]; // [nonSpe[], spe[]]
export let oblRemainingCases    = [[], []];
export let oblUserLists         = {};
export let oblDefaultLists      = {};
export let oblUsingSpe          = 0;
export let oblNamingMode        = 'matt';
let oblUsingMemo         = false;
export let oblScrambleList      = [];
let oblCurrentCase       = '';
export let oblHasActiveScramble = false;
export let oblScrambleOffset    = 0;

export let oblPreviouslySelected = null; // null = nothing to undo
export let oblRedoSelected       = null; // null = nothing to redo

export function oblSetScrambleOffset(value) {
    const maxOffset = Math.max(oblScrambleList.length - 1, 0);
    oblScrambleOffset = Math.max(0, Math.min(value, maxOffset));
}
export function oblSetHistory(previous, redo) {
    oblPreviouslySelected = previous;
    oblRedoSelected = redo;
}
export function oblResetSelection() {
    oblSelectedCases[oblUsingSpe] = [];
    oblRemainingCases[oblUsingSpe] = [];
}
let oblEachCase          = 0;
export let oblCaseSpliced       = false; // true once a case has been taken from remaining for display

export const oblStorage = {
    getItem:  k      => localStorage.getItem(k + 'OBL'),
    setItem:  (k, v) => localStorage.setItem(k + 'OBL', v),
};

// ─── OBL SELECTION ────────────────────────────────────────────────────────────

export function oblSelect(id) {
    if (!oblSelectedCases[oblUsingSpe].includes(id)) {
        oblSelectedCases[oblUsingSpe].push(id);
        if (oblEachCase > 0)
            oblRemainingCases[oblUsingSpe].push(...Array(oblEachCase).fill(id));
    }
    const el = document.getElementById(id);
    if (el) el.classList.add('checked', 'checked-both');
    updateSelCount();
    updateRemainingCount();
}

export function oblDeselect(id) {
    oblSelectedCases[oblUsingSpe]  = oblSelectedCases[oblUsingSpe].filter(x => x !== id);
    oblRemainingCases[oblUsingSpe] = oblRemainingCases[oblUsingSpe].filter(x => x !== id);
    const el = document.getElementById(id);
    if (el) el.classList.remove('checked', 'checked-both');
    updateSelCount();
    updateRemainingCount();
}

export function oblSaveSelected() {
    if (!oblUsingSpe) oblSelectedCases[1] = [...getSpeList(oblSelectedCases[0])];
    else              oblSelectedCases[0] = [...getNonSpeList(oblSelectedCases[1])];
    oblStorage.setItem('selected', JSON.stringify(oblSelectedCases));
    if (!oblHasActiveScramble || oblSelectedCases[oblUsingSpe].length === 0)
        oblGenerateScramble();
    else if (!oblSelectedCases[oblUsingSpe].includes(oblCurrentCase))
        oblGenerateScramble(true);
}

function oblRefillRemaining() {
    oblEachCase = eachCaseEl.checked ? 1 : randInt(MIN_EACHCASE, MAX_EACHCASE);
    oblRemainingCases[oblUsingSpe] =
        oblSelectedCases[oblUsingSpe].flatMap(el => Array(oblEachCase).fill(el));
}

// ─── OBL SCRAMBLE GENERATION ─────────────────────────────────────────────────

export function oblGenerateScramble(regen = false) {
    if (oblSelectedCases[oblUsingSpe].length === 0) {
        timerEl.textContent            = '--:--';
        currentScrambleEl.textContent  = 'Scramble will show up here';
        previousScrambleEl.textContent = 'Last scramble will show up here';
        oblHasActiveScramble = false;
        oblCaseSpliced       = false;
        oblScrambleList      = [];
        oblScrambleOffset    = 0;
        updateRemainingCount();
        updateScrambleNavButtons();
        return;
    }
    if (oblRemainingCases[oblUsingSpe].length === 0) {
        // refill the entire array
        oblRefillRemaining();
        if (oblEachCase === 1 && oblCaseSpliced && !regen) showSuccess("Trained each case.", 1000)
    }

    oblCaseSpliced = true; // set synchronously before splice
    const idx    = randInt(0, oblRemainingCases[oblUsingSpe].length - 1);
    const choice = oblRemainingCases[oblUsingSpe].splice(idx, 1)[0];
    updateRemainingCount();
    oblCurrentCase = choice;

    const specific = oblUsingSpe
        ? choice
        : OBLtranslation[choice][randInt(0, OBLtranslation[choice].length - 1)];
    const scramble = getOBLScramble(specific);

    const final = [
        scramble[0].replaceAll('/', ' / '),
        scramble[1],
        choice,
        scramble[2],
    ];

    if (regen) {
        oblScrambleList[oblScrambleList.length - 1] = final;
    } else {
        oblScrambleList.push(final);
    }
    oblScrambleOffset = 0;
    oblHasActiveScramble = true;
    if (!timerEl.textContent || timerEl.textContent === '--:--')
        timerEl.textContent = '0.00';
    oblDisplayCurrentScramble();
    oblDisplayPreviousScramble();
}

export function oblDisplayCurrentScramble() {
    if (!oblHasActiveScramble || !oblScrambleList.length) return;
    oblSetScrambleOffset(oblScrambleOffset);
    const entry = oblScrambleList.at(-1 - oblScrambleOffset);
    if (entry) {
        const memo = entry[3];
        currentScrambleEl.textContent = entry[usingKarn] + (oblUsingMemo && memo ? ` (${memo})` : '');
    }
    updateScrambleNavButtons();
}

export function oblDisplayPreviousScramble() {
    if (!oblHasActiveScramble || !oblScrambleList.length) {
        previousScrambleEl.textContent = 'Last scramble will show up here';
        updateScrambleNavButtons();
        return;
    }
    oblSetScrambleOffset(oblScrambleOffset);
    const prev = oblScrambleList.at(-2 - oblScrambleOffset);
    previousScrambleEl.textContent = prev
        ? 'Previous scramble: ' + prev[usingKarn] + ' (' + oblDisplayName(prev[2]) + ')'
        : 'Last scramble will show up here';
    updateScrambleNavButtons();
}

// ─── OBL FILTER ───────────────────────────────────────────────────────────────

export function oblApplyFilter(raw) {
    document.querySelectorAll('.case').forEach(caseEl => {
        if (passesOBLFilter(caseEl.id, raw)) caseEl.classList.remove('hidden');
        else                                  caseEl.classList.add('hidden');
    });
    updateSelCount();
}

// ─── OBL LISTS ────────────────────────────────────────────────────────────────

export function oblLoadUserLists() {
    const stored = oblStorage.getItem('userLists');
    if (stored) {
        oblUserLists = JSON.parse(stored);
        // Legacy: old format stored a flat array [nonSpe] rather than [[nonSpe],[spe]].
        let needsSave = false;
        for (const k of Object.keys(oblUserLists)) {
            if (!Array.isArray(oblUserLists[k][0])) {
                const flat = oblUserLists[k];
                oblUserLists[k] = [flat, getSpeList(flat)];
                needsSave = true;
            }
        }
        if (needsSave) oblSaveUserLists();
    } else {
        oblUserLists = {}; // reset so DOM is cleared even when no data exists
    }
}

export function oblSaveUserLists() {
    oblStorage.setItem('userLists', JSON.stringify(oblUserLists));
}

// ─── OBL DEFAULT LISTS ────────────────────────────────────────────────────────
// Expand raw nonSpe arrays into [[nonSpe], [spe]] pairs.
// Safe to call multiple times — only runs once.

export function oblInitDefaultLists() {
    if (Object.keys(oblDefaultLists).length > 0) return;
    for (const [name, nonSpeArr] of Object.entries(OBL_DEFAULT_LISTS_RAW))
        oblDefaultLists[name] = [nonSpeArr, getSpeList(nonSpeArr)];
}

// ─── OBL LIST RENDERING ───────────────────────────────────────────────────────

export function oblAddDefaultLists() {
    let html = '';
    for (const k of Object.keys(oblDefaultLists)) {
        const count = oblDefaultLists[k][oblUsingSpe].length;
        html += `<div id="${k}" class="list-item">${k} (${count})</div>`;
    }
    defaultListsEl.innerHTML = html;
    document.querySelectorAll('#defaultlists>.list-item').forEach(addListItemEvent);
}

export function oblAddUserLists() {
    let html = '';
    for (const k of Object.keys(oblUserLists)) {
        const count = oblUserLists[k][oblUsingSpe].length;
        html += `<div id="${k}" class="list-item">${k} (${count})</div>`;
    }
    if (!html) html = '<div class="list-empty">No list to show. Create a new one!<div>';
    userListsEl.innerHTML = html;
    document.querySelectorAll('#userlists>.list-item').forEach(addListItemEvent);
    oblSaveUserLists();
}

// ─── OBL LIST SELECTION ───────────────────────────────────────────────────────

export function oblSelectList(listName, setSelection) {
    if (listName == null) { showAll(); return; }
    const list = Object.keys(oblDefaultLists).includes(listName)
        ? oblDefaultLists[listName]
        : oblUserLists[listName];
    if (!list) return;

    // Hide all cases then show only those in the list.
    document.querySelectorAll('.case').forEach(el => el.classList.add('hidden'));
    for (const id of list[oblUsingSpe])
        document.getElementById(id)?.classList.remove('hidden');

    if (setSelection) {
        oblDeselectAll();
        for (const id of list[oblUsingSpe]) oblSelect(id);
        oblSaveSelected();
        updateRemainingCount();
    }

    setShowMode('list');
    updateToggle();
    oblSaveUserLists();
}

// Maps a cluster case-list short code ("Uw/THw") to the grid's English id
// ("right bunny/left thumb"), using the same reverse NAMING map as the search
// index. Returns null if either half has no legacy name.
function oblCodeToGridId(code) {
    const [a, b] = code.split('/');
    const la = SquanLib.NAMING_REV?.[a] ?? _oblRevName(a);
    const lb = SquanLib.NAMING_REV?.[b] ?? _oblRevName(b);
    return (la && lb) ? la + '/' + lb : null;
}

let _oblRevCache = null;
function _oblRevName(short) {
    if (!_oblRevCache) {
        _oblRevCache = {};
        for (const [legacy, s] of Object.entries(SquanLib.NAMING)) _oblRevCache[s] = legacy;
    }
    return _oblRevCache[short];
}

// Show (and optionally select) every case belonging to a tag's clusters.
export function oblSelectTag(tagId, setSelection) {
    let ids = tagCaseBases(tagId).map(oblCodeToGridId).filter(Boolean);
    if (oblUsingSpe) ids = getSpeList(ids);

    document.querySelectorAll('.case').forEach(el => el.classList.add('hidden'));
    for (const id of ids) document.getElementById(id)?.classList.remove('hidden');

    if (setSelection) {
        oblDeselectAll();
        for (const id of ids) oblSelect(id);
        oblSaveSelected();
        updateRemainingCount();
    }

    setShowMode('list');
    updateToggle();
}

// ─── OBL LIST BUTTON HANDLERS ─────────────────────────────────────────────────

export async function oblNewList() {
    if (usingTimer()) return;
    if (oblSelectedCases[oblUsingSpe].length === 0) {
        showError('Please select OBLs to create a list!'); return;
    }
    let name = await appPrompt('Name of your list:', { title: 'New list', placeholder: 'List name' });
    if (!name) return;
    name = name.trim();
    if (!name || !validName(name)) {
        showError('Please enter a valid name (only letters, numbers, slashes, and spaces)'); return;
    }
    if (Object.keys(oblDefaultLists).includes(name)) {
        showError('A default list already has this name!'); return;
    }
    if (Object.keys(oblUserLists).includes(name)) {
        showError('You already gave this name to a list.'); return;
    }
    if (document.getElementById(name)) {
        showError("You can't give this name to a list (id taken)."); return;
    }
    const newList = [[], []];
    newList[oblUsingSpe] = [...oblSelectedCases[oblUsingSpe]];
    if (oblUsingSpe) newList[0] = getNonSpeList(newList[1]);
    else             newList[1] = getSpeList(newList[0]);
    oblUserLists[name] = newList;
    oblAddUserLists();
    setHighlighted(name);
    showSuccess('Successfully created the list.');
}

export async function oblOverwriteList() {
    if (usingTimer()) return;
    if (highlightedList == null) return;
    if (Object.keys(oblDefaultLists).includes(highlightedList)) {
        showError('You cannot overwrite a default list.'); return;
    }
    if (oblSelectedCases[oblUsingSpe].length === 0) {
        showError('Please select OBLs to overwrite the list!'); return;
    }
    if (await appConfirm(`Overwrite list “${highlightedList}” with the current selection?`, { title: 'Overwrite list', okText: 'Overwrite', danger: true })) {
        const newList = [[], []];
        newList[oblUsingSpe] = [...oblSelectedCases[oblUsingSpe]];
        if (oblUsingSpe) newList[0] = getNonSpeList(newList[1]);
        else             newList[1] = getSpeList(newList[0]);
        oblUserLists[highlightedList] = newList;
        oblAddUserLists();
        oblSelectList(highlightedList, true);
        setHighlightedList(null);
        closePopup();
        showSuccess('Successfully overwrote the list.');
    }
}

export async function oblDeleteList() {
    if (highlightedList == null) return;
    if (Object.keys(oblDefaultLists).includes(highlightedList)) {
        showError('You cannot delete a default list.'); return;
    }
    if (Object.keys(oblUserLists).includes(highlightedList)) {
        if (await appConfirm(`Delete list “${highlightedList}”?`, { title: 'Delete list', okText: 'Delete', danger: true })) {
            delete oblUserLists[highlightedList];
            setHighlightedList(null);
            oblAddUserLists();
            showSuccess('Successfully deleted the list.');
        }
        return;
    }
    showError('Error: list not found.');
}

export function oblLoadSelected() {
    const stored = oblStorage.getItem('selected');
    if (!stored) {
        // First-ever load — select every OBL case (mirrors PBL's default).
        possibleOBL.forEach(obl => oblSelect(OBLname(obl)));
        oblRefillRemaining();
        oblSaveSelected(); // persists (incl. the specific-naming mirror) + makes a scramble
        return;
    }
    oblSelectedCases = JSON.parse(stored);
    if (!Array.isArray(oblSelectedCases[0])) oblSelectedCases = [oblSelectedCases, []]; // legacy
    // Select first (oblEachCase is still 0 so oblSelect won't double-fill remaining),
    // then enable each-case which rebuilds remaining cleanly from the complete selected list.
    oblSelectedCases[oblUsingSpe].forEach(id => oblSelect(id));
    if (oblHasActiveScramble) return; // remaining is valid from before the trainer switch; rebuilding would double-count
    oblRefillRemaining();
    if (oblSelectedCases[oblUsingSpe].length) oblGenerateScramble();
}

// ─── OBL BULK SELECT ─────────────────────────────────────────────────────────

// Select every case (Ctrl+A) — ignores the filter/subset, so hidden cases are
// selected too.
export function oblSelectAll() {
    if (usingTimer()) return;

    document.querySelectorAll('.case').forEach(caseEl => oblSelect(caseEl.id));
    oblSaveSelected();
}

export function oblDeselectAll() {
    if (usingTimer()) return;

    oblSelectedCases  = [[], []];
    oblRemainingCases = [[], []];
    document.querySelectorAll('.case').forEach(caseEl => {
        caseEl.classList.remove('checked', 'checked-both');
    });
    oblSaveSelected();
    updateSelCount();
    updateRemainingCount();
}

// Select only the currently visible cases (Ctrl+S) — the counterpart to
// oblSelectAll that respects the active filter/subset.
export function oblSelectThese() {
    if (usingTimer()) return;
    document.querySelectorAll('.case').forEach(caseEl => {
        if (!caseEl.classList.contains('hidden')) oblSelect(caseEl.id);
    });
    oblSaveSelected();
}

// Deselect only the currently visible cases (counterpart to oblSelectThese).
// Used when a subset is being shown.
export function oblDeselectThese() {
    if (usingTimer()) return;
    document.querySelectorAll('.case').forEach(caseEl => {
        if (!caseEl.classList.contains('hidden')) oblDeselect(caseEl.id);
    });
    oblSaveSelected();
}

// ─── OBL GRID ─────────────────────────────────────────────────────────────────

let oblGridBuildScheduled = false;

function oblExpectedGridCount() {
    return oblUsingSpe
        ? possibleOBL.reduce((sum, obl) => sum + getSpe(OBLname(obl)).length, 0)
        : possibleOBL.length;
}

export function oblEnsureGrid() {
    if (caseListEl.dataset.trainerGrid === 'obl' && caseListEl.childElementCount === oblExpectedGridCount()) {
        oblRestoreGrid(false); // grid already exists — re-sync classes/text
        return;
    }
    if (oblGridBuildScheduled) return;
    oblGridBuildScheduled = true;

    // Let the modal paint before doing the DOM build.
    requestAnimationFrame(() => {
        oblGridBuildScheduled = false;
        if (trainerMode === 'obl') oblRestoreGrid(true);
    });
}

export function oblRestoreGrid(buildGrid = false) {
    if (buildGrid) {
        caseListEl.dataset.trainerGrid = 'obl';
        caseListEl.style.gridTemplateColumns = 'repeat(auto-fit, minmax(130px, 1fr))';

        caseListEl.innerHTML = oblUsingSpe
            ? possibleOBL.flatMap(obl =>
                getSpe(OBLname(obl)).map(s => `<div class="case" id="${s}">${oblDisplayName(s)}</div>`)
              ).join('')
            : possibleOBL.map(obl =>
                `<div class="case" id="${OBLname(obl)}">${oblDisplayName(OBLname(obl))}</div>`
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

        oblApplyFilter('');
    } else if (caseListEl.dataset.trainerGrid === 'obl' && caseListEl.childElementCount) {
        for (const caseEl of caseListEl.children) {
            const selected = oblSelectedCases[oblUsingSpe].includes(caseEl.id);
            caseEl.classList.toggle('checked', selected);
            caseEl.classList.toggle('checked-both', selected);
            caseEl.textContent = oblDisplayName(caseEl.id);
        }
    }

    updateSelCount();

    if (oblHasActiveScramble && oblScrambleList.length) {
        oblDisplayCurrentScramble();
        oblDisplayPreviousScramble();
        if (timerEl.textContent === '--:--') timerEl.textContent = '0.00';
    } else {
        currentScrambleEl.textContent  = 'Scramble will show up here';
        previousScrambleEl.textContent = 'Last scramble will show up here';
        timerEl.textContent            = '--:--';
        updateScrambleNavButtons();
    }

    if (caseListEl.dataset.trainerGrid === 'obl' && caseListEl.childElementCount) {
        if (showMode === 'selected') {
            showSelected();
        } else if (showMode === 'searched') {
            oblApplyFilter(filterInputEl.value);
            updateToggle();
        } else if (showMode === 'list' && highlightedList != null) {
            oblSelectList(highlightedList, false);
        } else {
            showAll();
        }
    }
}

// ─── OBL SETTINGS ─────────────────────────────────────────────────────────────

// OBL settings stored as a compact string:
// eachCase + karn + usingSpe + usingMemo + namingMode(traditional/matt)
// (same compact style as PBL's settings string)
export function oblSaveSettings() {
    const store = (eachCaseEl.checked ? '1' : '0') +
                  (karnEl.checked     ? '1' : '0') +
                  (oblUsingSpe        ? '1' : '0') +
                  (oblUsingMemo       ? '1' : '0') +
                  (oblUsesMattNaming() ? '1' : '0');
    oblStorage.setItem('settings', store);
}

export function oblLoadSettings({ restoreShared = true } = {}) {
    const stored = oblStorage.getItem('settings');
    const hasKarnSlot = stored?.length >= 5;

    // Reset to defaults first. Karnotation defaults on for a fresh OBL trainer.
    if (restoreShared) eachCaseEl.checked = false;
    if (restoreShared) karnEl.checked = (stored === null);
    oblUsingSpe  = 0;
    oblUsingMemo = false;
    oblNamingMode = 'matt';

    if (stored !== null) {
        if (restoreShared) eachCaseEl.checked = stored[0] === '1';
        if (restoreShared && hasKarnSlot) karnEl.checked = stored[1] === '1';
        oblUsingSpe        = stored[hasKarnSlot ? 2 : 1] === '1' ? 1 : 0;
        oblUsingMemo       = stored[hasKarnSlot ? 3 : 2] === '1';
        const namingIdx    = hasKarnSlot ? 4 : 3;
        oblNamingMode      = stored.length > namingIdx ? (stored[namingIdx] === '1' ? 'matt' : 'traditional') : 'matt';
    }
    if (restoreShared) setUsingKarn(karnEl.checked ? 1 : 0);

    const specificEl = document.getElementById('specific');
    if (specificEl) specificEl.checked = oblUsingSpe === 1;
    const oblpEl = document.getElementById('oblp');
    if (oblpEl) oblpEl.checked = oblUsingMemo;
    updateOblNamingToggleText();
}

export function oblOnEachCase() {
    oblRefillRemaining();
    // The active case is already being displayed — remove one of its freshly-added
    // slots so the counter doesn't double-count it.
    if (oblCaseSpliced && oblCurrentCase) {
        const idx = oblRemainingCases[oblUsingSpe].indexOf(oblCurrentCase);
        if (idx !== -1) oblRemainingCases[oblUsingSpe].splice(idx, 1);
    }
    updateRemainingCount();
    oblSaveSettings();
}

export function oblOnSpe() {
    const specificEl = document.getElementById('specific');
    oblUsingSpe = specificEl.checked ? 1 : 0;
    oblSaveSelected(); // syncs both arrays, regenerates
    oblRestoreGrid();
    // Re-apply the current show mode so toggling specific naming doesn't reset the sidebar.
    if (showMode === 'selected') {
        showSelected();
    } else if (showMode === 'list' && highlightedList != null) {
        oblSelectList(highlightedList, false);
    } else if (showMode === 'searched') {
        oblApplyFilter(filterInputEl.value);
        updateToggle();
    }
    // else: showMode === 'all' — if the grid exists, oblRestoreGrid already
    // re-synced it. Hidden list menus are rendered lazily when opened.
    oblSaveSettings();
}

export function oblOnMemo() {
    const oblpEl = document.getElementById('oblp');
    oblUsingMemo = oblpEl.checked;
    oblDisplayCurrentScramble();
    oblSaveSettings();
}

export function oblOnNaming() {
    oblNamingMode = oblUsesMattNaming() ? 'traditional' : 'matt';
    updateOblNamingToggleText();
    oblRestoreGrid(false);
    oblDisplayCurrentScramble();
    oblDisplayPreviousScramble();
    window.dispatchEvent(new Event('obl-naming-change'));
    oblSaveSettings();
}

// Wire OBL-specific settings checkboxes.
document.getElementById('specific').addEventListener('change', () => oblOnSpe());
document.getElementById('oblp').addEventListener('change',    () => oblOnMemo());
document.getElementById('obl-naming-toggle').addEventListener('click', () => oblOnNaming());

// ─── OBL HELP CONTENT ─────────────────────────────────────────────────────────
// Add extra sections here as {id, title, svg, html} objects.

export const oblHelpSections = [
    {
        id: 'obl-home',
        title: 'Navigation',
        svg: HELP_HOME_SVG,
        html: `<p style="margin-top:14px;">Click on the <b>title at the top of the website</b> to switch trainers.</p>`
    },
    {
        id: 'obl-shortcuts',
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
                        "know when you've gone through all of them." },
            { keys: ['S'],         desc: 'Toggle specific case naming',
                info:   "Instead of showing e.g. \"good bunny/thumb\", show things " +
                        "like \"left bunny/left thumb\"." },
            { keys: ['P'],         desc: 'Show Matt tracing memo',
                info:   "Show the OBLP memo (1-8 tracing) for the current scramble." },
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
        id: 'obl-search',
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
        id: 'obl-lists',
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
        <p><code>Select</code> — Replace whatever cases you have selected with the cases in the list. </p>
        <p><code>New List</code> — Create a new list containing the cases you have selected. The name is up to you!</p>

        <h1>List tricks</h1>
        <p>Here's some additional things you can accomplish with those 5 buttons:</p>
        <p>Rename a list: <code>select</code> it, <code>delete</code> it, and <code>new list</code>.</p>
        <p>Edit a list: <code>select</code> it, make the edits to your current selection in the case selector, and <code>overwrite</code> your original list.</p>

        <h1>Tags</h1>
        <p>You will also see your tags in the list window. For help with these, see the next section.</p>`
    },
    {
        id: 'obl-tags',
        title: 'Tags',
        svg: HELP_TAG_SVG,
        html: `
        <h1>What are tags?</h1>
        <p>
            Tags are <b>cluster-based</b>. Often, your lists will be in clusters.
            For example, if your "learning" list contains T/left N (T/Nw), it probably also contains Nw/T, T/Nc, and Nc/T.
            Hence, you can simply tag the entire cluster of "T/N, N/T" as "learning". This will tag all 4 cases.
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

        <h1>Tags → Lists</h1>
        <p>
            If you want to export a tag to a list, simply <code>select</code> the tag, and <code>new list</code>.
        </p>`
    },
    {
        id: 'obl-learn',
        title: 'Learn',
        svg: HELP_LEARN_SVG,
        html: `<h1>Cluster references</h1>
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

        <h1>Hints</h1>
        <p>
            You can edit your hints for a cluster in the cluster reference for it.
            To see the hints for the current scramble, click on the light bulb icon to the right of the scramble.
        </p>`
    },
    {
        id: 'obl-sync',
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
    // Add future OBL-specific sections here.
];

// ─── OBL MAIN ─────────────────────────────────────────────────────────────────

function shift(a, amount) {
    // shift "ABC" to "CAB" aka cw move
    // assumes amount <= a.length (although if it's equal it makes no impact)
    amount *= -1;
    if (amount < 0) amount += a.length;
    return a.slice(amount) + a.slice(0, amount);
}

function move(cube, u,d) {
    // u,d in int
    return shift(cube.slice(0,SquanLib.LAYERL), u) +
            shift(cube.slice(SquanLib.LAYERL), d)
}

function changesAlignment(move) {
    // move in [u, d], returns boolean
    return mod(move, 3) != 0
}

function randAMove() {
    // return: element of A_MOVES
    return JSON.parse(JSON.stringify(SquanLib.A_MOVES))[randInt(0,SquanLib.KARNL-1)];
}

function randaMove() {
    // return: element of a_MOVES
    return JSON.parse(JSON.stringify(SquanLib.a_MOVES))[randInt(0,SquanLib.KARNL-1)];
}

function getOBLScramble(obl) {
    // obl: e.g. "left gem/knight"
    // return: e.g. ["A/-3,-3/0,3/0,-3/-1,-4/-3,0/3,0/0,-3/0,3/a", in karn]
    let moves = "";
    let abf;
    let topA; // bool: top misalign?
    let [u, d] = obl.split("/");
    let state;
    while (true) {
        if (Math.random() < 0.5) {
            // A start
            moves += "A/";
            topA = true;
            state = SquanLib.SLICE_A;
        }
        else {
            // a start
            moves += "a/";
            topA = false;
            state = SquanLib.SLICE_a;
        }
        // first 5 slices
        for (let i = 2; i < 6; i++) {
            abf = topA ? randAMove() : randaMove();
            state = squan.doSlice(move(state, abf[0], abf[1]));
            moves += `${abf[0]},${abf[1]}/`
            if (changesAlignment(abf[0])) topA = !topA;
        }
        // slice 6-10
        for (let i = 6; i <= 10; i++){
            abf = topA ? randAMove() : randaMove();
            state = squan.doSlice(move(state, abf[0], abf[1]));
            moves += `${abf[0]},${abf[1]}/`
            if (changesAlignment(abf[0])) topA = !topA;
            // includes check for layer flip
            if ((squan.isOBLCase(state.slice(0,SquanLib.LAYERL), u) &&
                squan.isOBLCase(state.slice(SquanLib.LAYERL), d)) ||
                (squan.isOBLCase(state.slice(0,SquanLib.LAYERL), d) &&
                squan.isOBLCase(state.slice(SquanLib.LAYERL), u))) {
                let currentA = topA ? "A" : "a";
                moves += currentA;
                console.log("preoptim moves "+moves);
                moves = squan.optimize(moves);
                console.log("postoptim moves "+moves);
                // add random preabf and postabf
                const s     = moves.at(0), e = moves.at(-1);
                const start = s === 'A'
                    ? [randrange(-5, 5, 3), randrange(-3, 7, 3)]
                    : [randrange(-3, 7, 3), randrange(-4, 6, 3)];
                const end   = e === 'A'
                    ? [randrange(-4, 6, 3), randrange(-3, 7, 3)]
                    : [randrange(-3, 7, 3), randrange(-5, 5, 3)];

                const raw   = start.join(',') + moves.slice(1, -1) + end.join(',');
                state = move(state, end[0], end[1]);
                const tracingMemo = squan.stateToMatt(state);
                return [raw, squan.karnify(raw), tracingMemo];
            }
        }
        moves = "";
    }
}

export function OBLname(obl) {
    // obl in an array, gives english
    return obl[0] ? `${obl[0]} ${obl[1]}/${obl[2]}` : `${obl[1]}/${obl[2]}`;
}

const OBL_MATT_TO_TRADITIONAL = Object.fromEntries(
    Object.entries(OBL_MATT_LABELS).map(([traditional, matt]) => [matt, traditional])
);

const OBL_MATT_BASE_NAMES = {
    O: 'solved',
    D: '1c',
    J: 'cadj',
    V: 'copp',
    M: '3c',
    Q: '4e',
    W: '3e',
    F: 'line',
    L: 'L',
    E: '1e',
    P: 'pair',
    A: 'arrow',
    G: 'gem',
    H: 'knight',
    X: 'axe',
    S: 'squid',
    TH: 'thumb',
    U: 'bunny',
    SH: 'shell',
    B: 'bird',
    Z: 'hazard',
    Y: 'yoshi',
    K: 'kite',
    C: 'cut',
    T: 'T',
    N: 'N',
    I: 'tie',
};

let _mattPartToTraditional = null;

function mattPartToTraditional(part) {
    if (!_mattPartToTraditional) {
        _mattPartToTraditional = {};
        for (const [traditional, matt] of Object.entries(SquanLib.NAMING))
            _mattPartToTraditional[matt] = traditional;
    }
    return _mattPartToTraditional[part] || OBL_MATT_BASE_NAMES[part] || part;
}

function mattPairToTraditional(pair) {
    return pair.split('/').map(part => mattPartToTraditional(part.trim())).join('/');
}

function mattCaseToTraditional(name) {
    if (OBL_MATT_TO_TRADITIONAL[name]) return OBL_MATT_TO_TRADITIONAL[name];
    return name.split(',').map(part => {
        const trimmed = part.trim();
        const m = /^(same|different)\s+(.+)$/.exec(trimmed);
        if (m) {
            const quality = m[1] === 'same' ? 'good' : 'bad';
            return `${quality} ${mattPairToTraditional(m[2])}`;
        }
        return mattPairToTraditional(trimmed);
    }).join(', ');
}

function traditionalCaseToMatt(name) {
    if (OBL_MATT_LABELS[name]) return OBL_MATT_LABELS[name];
    return name.split('/').map(part => SquanLib.NAMING[part.trim()] || part.trim()).join('/');
}

export function oblUsesMattNaming() {
    return oblNamingMode === 'matt';
}

function updateOblNamingToggleText() {
    const btn = document.getElementById('obl-naming-toggle');
    if (btn) btn.textContent = oblUsesMattNaming() ? "Matt's naming" : 'Traditional';
}

export function oblDisplayName(name) {
    return oblUsesMattNaming() ? traditionalCaseToMatt(name) : name;
}

export function oblDisplayAlgCaseName(name) {
    return oblUsesMattNaming() ? name : mattCaseToTraditional(name);
}

export function oblDisplayClusterTitle(title) {
    return oblUsesMattNaming() ? title : mattCaseToTraditional(title);
}

function getNonSpe(spec) {
    // spec: "black tie/left N"
    // return: "tie/N"
    for (let nonSpec in OBLtranslation) {
        if (OBLtranslation[nonSpec].includes(spec) ||
            OBLtranslation[nonSpec].includes(spec.split("/")[1]+"/"+spec.split("/")[0]))
            return nonSpec;
    }
    throw Error("spec: "+spec+" not in OBLtranslation");
}

export function getSpe(obl) {
    // obl in english
    // returns: an array of specific cases
    let ret = [];
    if (!(obl in OBLtranslation)) throw new Error("not in OBLtranslation: obl: "+obl);
    for (let spec of OBLtranslation[obl]) {
        ret.push(spec);
        let spec2 = spec.split("/")[1] + "/" + spec.split("/")[0];
        if (spec2 !== spec)
            ret.push(spec2)
    }
    return ret;
}

export function getNonSpeList(l) {
    // l: a list of specific obls in english
    // returns: a list of non-specific obls in english
    let ret_repeats = [];
    for (let obl of l)
        ret_repeats.push(getNonSpe(obl));
    return [...new Set(ret_repeats)]; // dedupe the non-specific list that had repeats
}

export function getSpeList(l) {
    // l: a list of non-specific obls in english
    // returns: a list of specific obls in english
    let ret = [];
    for (let obl of l)
        ret.push(...getSpe(obl));
    return ret;
}

function checkFirstWord(word, g, filter, u, d) {
    if (g != word) return false;
    else {
        if (filter.length === 1 || filter[1] === "")
            return true;
        else {
            let a = filter[1];
            if (filter.length === 2) {
                return u.startsWith(a) || d.startsWith(a);
            }
            else {
                let b = filter[2];
                return (u === a && d.startsWith(b)) || (d === a && u.startsWith(b));
            }
        }
    }
}

function passesMattOBLFilter(obl, raw) {
    const query = raw.trim().toLowerCase();
    if (!query) return true;
    const label = oblDisplayName(obl).toLowerCase();
    const haystack = label.replace(/[,/]/g, ' ').replace(/\s+/g, ' ').trim();
    const haystackTokens = haystack.split(' ').filter(Boolean);
    const queryTokens = query.replace(/[,/]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    return queryTokens.every(token =>
        label.includes(token) || haystackTokens.some(part => part.startsWith(token))
    );
}

function passesOBLFilter(obl, filter) {
    // obl is the name of a .case element
    if (filter === "") return true;
    if (oblUsesMattNaming()) return passesMattOBLFilter(obl, filter);
    filter = filter.replace("/", " ").toLowerCase().split(" ");
    if (oblUsingSpe) {
        // filter left/right
        const obllst = obl.split("/");
        const u = obllst[0];
        const ulst = u.split(" ");
        const d = obllst[1];
        const dlst = d.split(" ");
        obl = obl.replaceAll("/", " ").split(" ")
        filter = filter.filter((i) => i !== "");
        switch (filter.length) {
            case 1:
                return obl.some((i) => i.startsWith(filter[0]));
            case 2:
                if (["left", "right"].includes(filter[0])) {
                    // "left knight"
                    return u.startsWith(filter.join(" ")) ||
                            d.startsWith(filter.join(" "));
                }
                else if ("left".startsWith(filter[1] || "right".startsWith(filter[1]))) {
                    // "gem left" or "knight left"
                    return (ulst.at(-1) === filter[0] && dlst[0].startsWith(filter[1])) ||
                            (dlst.at(-1) === filter[0] && ulst[0].startsWith(filter[1]));
                }
                else {
                    // "gem knight"
                    return (ulst.at(-1) === filter[0] && dlst.at(-1).startsWith(filter[1])) ||
                            (dlst.at(-1) === filter[0] && ulst.at(-1).startsWith(filter[1]));
                }
            case 3:
                if (["left", "right"].includes(filter[0])) {
                    // "left knight gem" or "left knight left"
                    return (u === filter[0]+" "+filter[1] &&
                            dlst.some((i) => i.startsWith(filter.at(-1)))) ||
                            (d === filter[0]+" "+filter[1] &&
                            ulst.some((i) => i.startsWith(filter.at(-1))));
                }
                else if (["left", "right"].includes(filter[1])) {
                    // "gem left knight" or "knight left knight"
                    return (ulst.at(-1) === filter[0] && d.startsWith(filter[1]+" "+filter[2])) ||
                            (dlst.at(-1) === filter[0] && u.startsWith(filter[1]+" "+filter[2]));
                }
                else {
                    // "left knight left" handled already; "left knight gem"
                    return (ulst.at(-1) === filter[2] && d.startsWith(filter[0]+" "+filter[1])) ||
                            (dlst.at(-1) === filter[2] && u.startsWith(filter[0]+" "+filter[1]))
                }
            case 4:
                // "left bunny right thumb"
                return (u === filter[0]+" "+filter[1] && d.startsWith(filter[2]+" "+filter[3])) ||
                        (d === filter[0]+" "+filter[1] && u.startsWith(filter[2]+" "+filter[3]));
            default:
                return false;
        }
    }
    else {
        // filter good/bad
        obl = obl.replaceAll("/", " ").split(" ");
        if (obl.length === 2) obl.unshift("");
        let g = obl[0];
        let u = obl[1].toLowerCase();
        let d = obl[2].toLowerCase();
        let result_from_good_bad, result_from_non_good_bad, a, b;
        if ("good".startsWith(filter[0])) {
            result_from_good_bad = checkFirstWord("good", g, filter, u, d);
        }
        if ("bad".startsWith(filter[0])) {
            result_from_good_bad = checkFirstWord("bad", g, filter, u, d);
        }
        if ("same".startsWith(filter[0])) {
            result_from_good_bad = checkFirstWord("same", g, filter, u, d);
        }
        if ("different".startsWith(filter[0])) {
            // make "different" count also
            if (g != "diff") return false;
            else {
                // if user typed "differ ":
                if (!(["diff", "different"].includes(filter[0])) && filter.length > 1)
                    result_from_good_bad = false;
                // if user only typed "different", "diff":
                else if (filter.length === 1 || filter[1] === "")
                    result_from_good_bad = true;
                else {
                    a = filter[1]
                    // only top case:
                    if (filter.length === 2) {
                        result_from_good_bad = u.startsWith(a) || d.startsWith(a);
                    }
                    else {
                        b = filter[2]
                        result_from_good_bad = (u === a && d.startsWith(b)) || (d === a && u.startsWith(b));
                    }
                }
            }
        }
        // from here, filter's g = ""
        a = filter[0]
        // only top case:
        if (filter.length == 1 || filter[1] == "") {
            result_from_non_good_bad = u.startsWith(a) || d.startsWith(a);
        }
        else {
            b = filter[1]
            result_from_non_good_bad = (u == a && d.startsWith(b)) ||
                    (d == a && u.startsWith(b));
        }
        return result_from_good_bad || result_from_non_good_bad;
    }
}
