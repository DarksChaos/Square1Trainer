// ─── OBL STATE ────────────────────────────────────────────────────────────────

let oblSelectedCases     = [[], []]; // [nonSpe[], spe[]]
let oblRemainingCases    = [[], []];
let oblUserLists         = {};
let oblDefaultLists      = {};
let oblUsingSpe          = 0;
let oblUsingMemo         = false;
let oblScrambleList      = [];
let oblCurrentCase       = '';
let oblPreviousCase      = '';
let oblHasActiveScramble = false;
let oblScrambleOffset    = 0;

let oblPreviouslySelected = null; // null = nothing to undo
let oblRedoSelected       = null; // null = nothing to redo
let oblEachCase          = 0;
let oblCaseSpliced       = false; // true once a case has been taken from remaining for display

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
    updateRemainingCount();
}

function oblDeselect(id) {
    oblSelectedCases[oblUsingSpe]  = oblSelectedCases[oblUsingSpe].filter(x => x !== id);
    oblRemainingCases[oblUsingSpe] = oblRemainingCases[oblUsingSpe].filter(x => x !== id);
    const el = document.getElementById(id);
    if (el) el.classList.remove('checked', 'checked-both');
    updateSelCount();
    updateRemainingCount();
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

function oblRefillRemaining() {
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
        oblCaseSpliced       = false;
        oblScrambleList      = [];
        updateRemainingCount();
        return;
    }
    if (oblRemainingCases[oblUsingSpe].length === 0) {
        // refill the entire array
        oblRefillRemaining();
        if (oblEachCase && oblCaseSpliced && !regen) showSuccess("Trained each case.", 1000)
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
                'Previous scramble: ' + oblScrambleList.at(-1)[usingKarn] +
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
        entry[usingKarn] + (oblUsingMemo ? ` (${entry[3] ?? ''})` : '');
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
    oblAddUserLists(); // always re-render (overwrites any PBL lists in the DOM)
}

function oblSaveUserLists() {
    oblStorage.setItem('userLists', JSON.stringify(oblUserLists));
}

// ─── OBL DEFAULT LISTS ────────────────────────────────────────────────────────
// Expand raw nonSpe arrays into [[nonSpe], [spe]] pairs.
// Safe to call multiple times — only runs once.

function oblInitDefaultLists() {
    if (Object.keys(oblDefaultLists).length > 0) return;
    for (const [name, nonSpeArr] of Object.entries(OBL_DEFAULT_LISTS_RAW))
        oblDefaultLists[name] = [nonSpeArr, getSpeList(nonSpeArr)];
}

// ─── OBL LIST RENDERING ───────────────────────────────────────────────────────

function oblAddDefaultLists() {
    let html = '';
    for (const k of Object.keys(oblDefaultLists)) {
        const count = oblDefaultLists[k][oblUsingSpe].length;
        html += `<div id="${k}" class="list-item">${k} (${count})</div>`;
    }
    defaultListsEl.innerHTML = html;
    document.querySelectorAll('#defaultlists>.list-item').forEach(addListItemEvent);
}

function oblAddUserLists() {
    let html = '';
    for (const k of Object.keys(oblUserLists)) {
        const count = oblUserLists[k][oblUsingSpe].length;
        html += `<div id="${k}" class="list-item">${k} (${count})</div>`;
    }
    userListsEl.innerHTML = html;
    document.querySelectorAll('#userlists>.list-item').forEach(addListItemEvent);
    oblSaveUserLists();
}

// ─── OBL LIST SELECTION ───────────────────────────────────────────────────────

function oblSelectList(listName, setSelection) {
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

    showMode = 'list';
    updateToggle();
    oblSaveUserLists();
}

// ─── OBL LIST BUTTON HANDLERS ─────────────────────────────────────────────────

function oblNewList() {
    if (usingTimer()) return;
    if (oblSelectedCases[oblUsingSpe].length === 0) {
        alert('Please select OBLs to create a list!'); return;
    }
    let name = prompt('Name of your list:');
    if (!name) return;
    name = name.trim();
    if (!name || !validName(name)) {
        alert('Please enter a valid name (only letters, numbers, slashes, and spaces)'); return;
    }
    if (Object.keys(oblDefaultLists).includes(name)) {
        alert('A default list already has this name!'); return;
    }
    if (Object.keys(oblUserLists).includes(name)) {
        alert('You already gave this name to a list.'); return;
    }
    if (document.getElementById(name)) {
        alert("You can't give this name to a list (id taken)."); return;
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

function oblOverwriteList() {
    if (usingTimer()) return;
    if (highlightedList == null) return;
    if (Object.keys(oblDefaultLists).includes(highlightedList)) {
        alert('You cannot overwrite a default list.'); return;
    }
    if (oblSelectedCases[oblUsingSpe].length === 0) {
        alert('Please select OBLs to overwrite the list!'); return;
    }
    if (confirm('You are about to overwrite list ' + highlightedList)) {
        const newList = [[], []];
        newList[oblUsingSpe] = [...oblSelectedCases[oblUsingSpe]];
        if (oblUsingSpe) newList[0] = getNonSpeList(newList[1]);
        else             newList[1] = getSpeList(newList[0]);
        oblUserLists[highlightedList] = newList;
        oblAddUserLists();
        oblSelectList(highlightedList, true);
        highlightedList = null;
        closePopup();
        showSuccess('Successfully overwrote the list.');
    }
}

function oblDeleteList() {
    if (highlightedList == null) return;
    if (Object.keys(oblDefaultLists).includes(highlightedList)) {
        alert('You cannot delete a default list.'); return;
    }
    if (Object.keys(oblUserLists).includes(highlightedList)) {
        if (confirm('You are about to delete list ' + highlightedList)) {
            delete oblUserLists[highlightedList];
            highlightedList = null;
            oblAddUserLists();
            showSuccess('Successfully deleted the list.');
        }
        return;
    }
    alert('Error: list not found.');
}

function oblLoadSelected() {
    const stored = oblStorage.getItem('selected');
    if (!stored) return;
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
    updateRemainingCount();
}

// ─── OBL GRID ─────────────────────────────────────────────────────────────────

function oblRestoreGrid() {
    caseListEl.style.gridTemplateColumns = 'repeat(auto-fit, minmax(130px, 1fr))';

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

    oblApplyFilter('');
    updateSelCount();

    if (oblHasActiveScramble && oblScrambleList.length) {
        oblDisplayCurrentScramble();
        const prev = oblScrambleList.at(-2 - oblScrambleOffset);
        previousScrambleEl.textContent = prev
            ? 'Previous scramble: ' + prev[usingKarn] + ' (' + prev[2] + ')'
            : 'Last scramble will show up here';
        if (timerEl.textContent === '--:--') timerEl.textContent = '0.00';
    } else {
        currentScrambleEl.textContent  = 'Scramble will show up here';
        previousScrambleEl.textContent = 'Last scramble will show up here';
        timerEl.textContent            = '--:--';
    }
}

// ─── OBL SETTINGS ─────────────────────────────────────────────────────────────

// OBL settings stored as a 3-char string: eachCase + usingSpe + usingMemo
// (same compact style as PBL's settings string)
function oblSaveSettings() {
    const store = (eachCaseEl.checked ? '1' : '0') +
                  (oblUsingSpe        ? '1' : '0') +
                  (oblUsingMemo       ? '1' : '0');
    oblStorage.setItem('settings', store);
}

function oblLoadSettings() {
    const stored = oblStorage.getItem('settings');

    // Reset to defaults first.
    eachCaseEl.checked = false;
    oblUsingSpe  = 0;
    oblUsingMemo = false;

    if (stored !== null) {
        eachCaseEl.checked = stored[0] === '1';
        oblUsingSpe        = stored[1] === '1' ? 1 : 0;
        oblUsingMemo       = stored[2] === '1';
    }

    const specificEl = document.getElementById('specific');
    if (specificEl) specificEl.checked = oblUsingSpe === 1;
    const oblpEl = document.getElementById('oblp');
    if (oblpEl) oblpEl.checked = oblUsingMemo;
}

function oblOnEachCase() {
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

function oblOnSpe() {
    const specificEl = document.getElementById('specific');
    oblUsingSpe = specificEl.checked ? 1 : 0;
    oblSaveSelected(); // syncs both arrays, regenerates
    oblRestoreGrid();
    oblAddDefaultLists(); // refresh counts for new spe mode
    oblAddUserLists();
    oblSaveSettings();
}

function oblOnMemo() {
    const oblpEl = document.getElementById('oblp');
    oblUsingMemo = oblpEl.checked;
    oblDisplayCurrentScramble();
    oblSaveSettings();
}

// Wire OBL-specific settings checkboxes.
document.getElementById('specific').addEventListener('change', () => oblOnSpe());
document.getElementById('oblp').addEventListener('change',    () => oblOnMemo());

// ─── OBL HELP CONTENT ─────────────────────────────────────────────────────────
// Add extra sections here as {id, title, svg, html} objects.

const oblHelpSections = [
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
            { keys: ['←'],              desc: 'Previous scramble' },
            { keys: ['→'],              desc: 'Next scramble' },
            { keys: ['Space'],          desc: 'Start / stop timer' },
            { keys: ['Backspace'],      desc: 'Remove last case' },
            { keys: ['K'],              desc: 'Toggle karnotation' },
            { keys: ['E'],              desc: 'Train each case once' },
            { keys: ['S'],              desc: 'Toggle specific case naming' },
            { keys: ['P'],              desc: 'Show Matt tracing memo' },
            null,
            { keys: ['Ctrl', 'F'],      desc: 'Focus search box' },
            { keys: ['Ctrl', 'A'],      desc: 'Select all visible' },
            { keys: ['Ctrl', 'S'],      desc: 'Select visible (filtered)' },
            { keys: ['Ctrl', 'Z'],      desc: 'Undo last selection change' },
            { keys: ['Ctrl', 'Y'],      desc: 'Redo last selection change' },
            { keys: ['Ctrl', '⇧', 'A'], desc: 'Deselect all visible' },
            { keys: ['Ctrl', '⇧', 'S'], desc: 'Deselect visible (filtered)' },
            { keys: ['Alt', 'A'],       desc: 'Show all' },
            { keys: ['Alt', 'S'],       desc: 'Show selection' },
        ])
    }
    // Add future OBL-specific sections here.
];

// ─── OBL MAIN ─────────────────────────────────────────────────────────────────

function isOBL(layer, obl) {
    // layer: 12-char string w/ BbWw, in cs
    // obl: a key of OBL dict
    // return: bool
    let target = OBL[obl]
    // if it's top misalign, change to bottom misalign
    if (layer.charAt(0).toUpperCase() !== layer.charAt(0)) layer = shift(layer,-1);
    for (let move = 0; move <= 3; move++) {
        if (target === shift(layer, 3*move)) return true;
    }
    if (obl.split(" ").at(-1) !== "T" && obl.split(" ").at(-1) !== "tie") {
        // T and tie colors are specified
        layer = layer_flip(layer);
        for (let move = 0; move <= 3; move++) {
            if (target === shift(layer, 3*move)) return true;
        }}
    return false;
}

function layer_flip(state){
    `flips "w" to "b" and vice versa in the given state

    Args:
        state (str): the state (e.g. "BBbBBbWWwWWw")

    Returns:
        str: the flipped state (e.g. "WWwWWwBBbBBb")
    `
    let return_val = [];
    for (let c of state) {
        switch (c) {
            case "b":
                return_val.push("w");
                break;
            case "B":
                return_val.push("W");
                break;
            case "w":
                return_val.push("b");
                break;
            case "W":
                return_val.push("B");
                break;
            default:
                console.log(c, ": from: layer_flip(): unrecognized piece")
        }
    }
    return return_val.join("")
}

function shift(a, amount) {
    // shift "ABC" to "CAB" aka cw move
    // assumes amount <= a.length (although if it's equal it makes no impact)
    amount *= -1;
    if (amount < 0) amount += a.length;
    return a.slice(amount) + a.slice(0, amount);
}

function move(cube, u,d) {
    // u,d in int
    return shift(cube.slice(0,LAYERL), u) +
            shift(cube.slice(LAYERL), d)
}

function slice(cube) {
    return  cube.slice(LAYERL, THREE_FOUR_L) + // bottom sliced up
            cube.slice(HALF_L, LAYERL) +
            cube.slice(0,HALF_L) +
            cube.slice(THREE_FOUR_L, CUBEL)
}

function changesAlignment(move) {
    // move in [u, d], returns boolean
    return mod(move, 3) != 0
}

function randAMove() {
    // return: element of A_MOVES
    return JSON.parse(JSON.stringify(A_MOVES))[randInt(0,KARNL-1)];
}

function randaMove() {
    // return: element of a_MOVES
    return JSON.parse(JSON.stringify(a_MOVES))[randInt(0,KARNL-1)];
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
            state = SLICE_A;
        }
        else {
            // a start
            moves += "a/";
            topA = false;
            state = SLICE_a;
        }
        // first 5 slices
        for (let i = 2; i < 6; i++) {
            abf = topA ? randAMove() : randaMove();
            state = slice(move(state, abf[0], abf[1]));
            moves += `${abf[0]},${abf[1]}/`
            if (changesAlignment(abf[0])) topA = !topA;
        }
        // slice 6-10
        for (let i = 6; i <= 10; i++){
            abf = topA ? randAMove() : randaMove();
            state = slice(move(state, abf[0], abf[1]));
            moves += `${abf[0]},${abf[1]}/`
            if (changesAlignment(abf[0])) topA = !topA;
            // includes check for layer flip
            if ((isOBL(state.slice(0,LAYERL), u) &&
                isOBL(state.slice(LAYERL), d)) ||
                (isOBL(state.slice(0,LAYERL), d) &&
                isOBL(state.slice(LAYERL), u))) {
                let currentA = topA ? "A" : "a";
                moves += currentA;
                console.log("preoptim moves "+moves);
                moves = optimize(moves);
                console.log("postoptim moves "+moves);
                return [moves, karnify(moves)];
            }
        }
        moves = "";
    }
}

function OBLname(obl) {
    // obl in an array, gives english
    return obl[0] ? `${obl[0]} ${obl[1]}/${obl[2]}` : `${obl[1]}/${obl[2]}`;
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

function getSpe(obl) {
    // obl in english
    // returns: an array of specific cases
    let ret = [];
    if (!obl in OBLtranslation) throw new Error("not in OBLtranslation: obl: "+obl);
    for (let spec of OBLtranslation[obl]) {
        ret.push(spec);
        let spec2 = spec.split("/")[1] + "/" + spec.split("/")[0];
        if (spec2 !== spec)
            ret.push(spec2)
    }
    return ret;
}

function getNonSpeList(l) {
    // l: a list of specific obls in english
    // returns: a list of non-specific obls in english
    let ret_repeats = [];
    for (let obl of l)
        ret_repeats.push(getNonSpe(obl));
    return [...new Set(ret_repeats)]; // dedupe the non-specific list that had repeats
}

function getSpeList(l) {
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

function passesOBLFilter(obl, filter) {
    // obl is the name of a .case element
    if (filter === "") return true;
    filter = filter.replace("/", " ").toLowerCase().split(" ");
    if (oblUsingSpe) {
        // filter left/right
        obllst = obl.split("/");
        u = obllst[0];
        ulst = u.split(" ");
        d = obllst[1];
        dlst = d.split(" ");
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
// ─── CLUSTER MODAL (OBL) ─────────────────────────────────────────────────────
// oblClusters is declared as const in obl-data.js.
// Shared modal infrastructure (clusterSizeModal, closeCluster) lives in generic.js.
// pblNab and pblTextWidth are defined in pbl-core.js (loaded before obl-core.js).

// ── OBL case → cluster lookup ─────────────────────────────────────────────

function oblFindCluster(caseName) {
    try {
        caseName = getSpe(caseName)[0];
    } catch (e) {}
    // specific name
    let [u, d] = caseName.split("/");
    caseName = [oblNaming[u], oblNaming[d]].join("/");
    for (const [title, data] of Object.entries(oblClusters)) {
        if (data["case-list"].includes(caseName)) return title;
    }
    return null;
}

// ── OBL HTML formatter ────────────────────────────────────────────────────
// Structural differences vs pblFormatCluster:
//   • matt is flat: distinction-help / angle-explanation / alg-explanation / cases[]
//     (no solution-groups or alg-blocks nesting)
//   • matt.cases[].algs are {angle, notation} objects (no "sign" field)
//   • derpy[].algs are plain notation strings (not objects)

function oblHasAlgData(algs) {
    if (!algs || !algs.length) return false;
    // algs may be strings (derpy) or objects (matt) — check both shapes
    return algs.some(a =>
        typeof a === "string" ? a.trim() : (a.angle?.trim() || a.notation?.trim())
    );
}

function oblFormatCluster(cluster, title) {
    const lines = [];
    lines.push(
        `<span class="cluster-title">${title}${cluster["optimal-slicecount"] ? " (" + cluster["optimal-slicecount"] + ")" : ""}</span>`,
        "",
        `<span class="section-label"><b><a href="https://docs.google.com/spreadsheets/d/172Vy9q4WNEvmI2FHkH96XzfXJHdTqeSWBMiANhWbXYA/edit" target="blank">from Matt's OBL Doc</a></b></span>`
    );

    const matt = cluster.matt;
    if (matt?.["distinction-help"]?.trim())
        lines.push(`<span style="text-indent:2.5em;">${pblNab(matt["distinction-help"])}</span>`);
    if (matt?.["angle-explanation"]?.trim())
        lines.push(`<span class="explanations">${pblNab(matt["angle-explanation"])}</span>`);
    if (matt?.["alg-explanation"]?.trim())
        lines.push(`<span class="explanations">${pblNab(matt["alg-explanation"])}</span>`);

    for (const c of matt?.cases || []) {
        if (!oblHasAlgData(c.algs)) continue;
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

    // OBL derpy algs are plain notation strings (not {angle, notation} objects).
    const filledDerpy = (cluster.derpy || []).filter(c => oblHasAlgData(c.algs));
    if (filledDerpy.length) {
        lines.push(
            "",
            `<span class="section-label"><b><a href="https://docs.google.com/spreadsheets/d/1BZQxg11RD829O0tKagGVC65b3s57Hd7Y0GplDCR7--w/edit" target="blank">from Derpy's OBL Sheet</a></b></span>`
        );
        for (const c of filledDerpy) {
            for (let i = 0; i < c.algs.length; i++) {
                const algStr = c.algs[i];
                if (!algStr?.trim()) continue;
                const notation = usingKarn ? algStr : unkarnify(algStr);
                const indent   = i > 0 ? pblTextWidth(c["case-name"] + " ", "11pt Arial") : 0;
                lines.push(
                    `<span class="alg-lines" style="margin-left:calc(5em + ${indent}px);">` +
                    `${i === 0 ? c["case-name"] + " " : ""}` +
                    `<span style="font-family:monospace">${notation}</span></span>`
                );
            }
        }
    }
    return lines.join("");
}

// ── oblOpenCluster ────────────────────────────────────────────────────────
// Call this wherever the OBL trainer needs to open the cluster modal.
// Pass a specific or non-specific OBL case name, or omit to use the
// current OBL case (caller must supply oblCurrentCase or equivalent).

function oblOpenCluster(caseName) {
    const clusterTitle = oblFindCluster(caseName);
    if (!clusterTitle) return;

    const modal   = document.getElementById("cluster-modal");
    const content = document.getElementById("cluster-modal-content");
    modal.style.display = "flex";
    isPopupOpen = true;

    const cluster = oblClusters[clusterTitle];
    if (!cluster) {
        content.innerHTML = `<span style="opacity:0.4">No data found for "${clusterTitle}".</span>`;
        return;
    }

    content.scrollTop = 0; // always start at top
    content.innerHTML = oblFormatCluster(cluster, clusterTitle);
    clusterSizeModal(content);
}
