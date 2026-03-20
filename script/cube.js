function mod(n, m) {
    return ((n % m) + m) % m;
}

function randInt(min, max) {
    // max included
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randrange(start, stop, step = 1) {
    if (stop === undefined) {
        // Si un seul argument est fourni, il s'agit de stop ; start = 0
        stop = start;
        start = 0;
    }

    const width = Math.ceil((stop - start) / step);
    if (width <= 0) {
        throw new Error("Invalid range");
    }

    const index = Math.floor(Math.random() * width);
    return start + index * step;
}

let possiblePBL = [];
let selectedPBL = [];
let scrambleList = []; // [[normal, karn], etc.]

let previousScramble = null;

let remainingPBL = [];
let eachCase = 0; // 0 = random, n = get each case n times before moving on
let usingKarn = 0; // 0 = not using karn, etc.
let usingWeight = false;
const MIN_EACHCASE = 2;
const MAX_EACHCASE = 4;

let defaultLists = {};
let userLists = {};
let highlightedList = null;

let scrambleOffset = 0;
let equatorMode = 'random';
let scrambleMode = 'long';
let allowBottom56 = false;
let pendingScramble = null;
let workerBusy = false;
let worker = null;
let generators;
let hasActiveScramble = false;
let isPopupOpen = false;

let lastRemoved;
let selectedCount = 0;

let currentShowMode = 'all'; // 'all' | 'selected' | 'searched' | 'list'
let preSearchMode = 'all';

// ─── BARFLIP MODE HELPERS ─────────────────────────────────────────────────────

// Migrate legacy selectedPBL (no suffix) → ["Al/Al+","Al/Al-"] format
function legacyMigrateSelected(arr) {
    if (arr.some(s => !s.endsWith('+') && (!s.endsWith('-') || s.endsWith('/-')))) {
        const result = [];
        for (const s of arr) {
            if (s.endsWith('+') || (s.endsWith('-') && !s.endsWith('/-'))) {
                result.push(s);
            } else {
                result.push(s + '+', s + '-');
            }
        }
        return result;
    }
    return arr;
}

// Returns 'none'|'both'|'plus'|'minus' for a base case name (no suffix)
function getCaseMode(base) {
    const hasPlus = selectedPBL.includes(base + '+');
    const hasMinus = selectedPBL.includes(base + '-');
    if (hasPlus && hasMinus) return 'both';
    if (hasPlus) return 'plus';
    if (hasMinus) return 'minus';
    return 'none';
}

// Updates the DOM class on a .case element to reflect its current mode
function setCaseDomClass(el, mode) {
    el.classList.remove('checked-both', 'checked-plus', 'checked-minus');
    if (mode === 'both')  el.classList.add('checked-both');
    else if (mode === 'plus')  el.classList.add('checked-plus');
    else if (mode === 'minus') el.classList.add('checked-minus');
}

// State for the Select ALL / Select these button cycling
// 'none'|'both'|'plus'|'minus'
let selectBtnState = 'none';

let pressStartTime = null;
let holdTimeout = null;
let timerStart = null;
let intervalId = null;
let isRunning = false;
let readyToStart = false;
let otherKeyPressed = 0;
const startDelay = 200;
let currentCase = "";
let previousCase = "";

// HTML elements

// Top bar buttons
const toggleUiEl = document.getElementById("toggleui");
const uploadEl = document.getElementById("uploaddata");
const downloadEl = document.getElementById("downloaddata");
const fileEl = document.getElementById("fileinput");

const sidebarEl = document.getElementById("sidebar");
const contentEl = document.getElementById("content");

const pblListEl = document.getElementById("results");
const filterInputEl = document.getElementById("obl-filter");

const eachCaseEls = document.querySelectorAll(".allcases");
const karnEls = document.querySelectorAll(".karn");
const weightEls = document.querySelectorAll(".weight");
const settingList = [eachCaseEls, karnEls, weightEls];

const removeLastEl = document.getElementById("unselprev");

// Selection buttons
const selectAllEl = document.getElementById("sela");
const deselectAllEl = document.getElementById("desela");
const selectTheseEl = null; //idk, claude set it to null
const deselectTheseEl = null;
const showSelectionEl = document.getElementById("showselected");
const showAllEl = document.getElementById("showall");
const showToggleEl = document.getElementById("showtoggle");
const selCountEl = document.getElementById("selcount");

// List buttons
const openListsEl = document.getElementById("openlists");
const userListsEl = document.getElementById("userlists");
const defaultListsEl = document.getElementById("defaultlists");
const newListEl = document.getElementById("newlist");
const deleteListEl = document.getElementById("dellist");
const overwriteListEl = document.getElementById("overwritelist");
const selectListEl = document.getElementById("sellist");
const trainListEl = document.getElementById("trainlist");
const listPopupEl = document.getElementById("list-popup");
const helpPopupEl = document.getElementById("help-popup");
const settingsPopupEl = document.getElementById("settings-popup");
const openSettingsEl = document.getElementById("open-settings");

// Main page elements (scrambles and timer)
const currentScrambleEl = document.getElementById("cur-scram");
currentScrambleEl.style.cursor = "pointer";
const previousScrambleEl = document.getElementById("prev-scram");
const prevScrambleButton = document.getElementById("prev");
const nextScrambleButton = document.getElementById("next");
const timerEl = document.getElementById("timer");
const timerBoxEl = document.getElementById("timerbox");

function usingTimer() {
    return isRunning || pressStartTime != null;
}

function pblname(pbl) {
    return `${pbl[0]}/${pbl[1]}`;
}

// ─── LUMP MODAL ───────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://bubvugdjwryhcawrwhxa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1YnZ1Z2Rqd3J5aGNhd3J3aHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjUzOTEsImV4cCI6MjA4ODcwMTM5MX0.KgsJCFeBDmIRkyNbOA0VpPc7biTflZo2Pbuh7SPfiH8";
const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const lumpCache = {}; // lump_index → data

function findLumpForCase(caseName) {
    // caseName like "Al/Ar" (strip trailing + or -)
    const clean = caseName.replace(/[+-]$/, "");
    for (const [lumpTitle, cases] of Object.entries(PBL_LUMP_MAP)) {
        if (cases.includes(clean)) return lumpTitle;
    }
    return null;
}

function findLumpIndex(lumpTitle) {
    const keys = Object.keys(PBL_LUMP_MAP);
    return keys.indexOf(lumpTitle);
}

const SB_CACHE_KEY = "pblLumpCache";

function saveLocalCache(cache) {
    try { localStorage.setItem(SB_CACHE_KEY, JSON.stringify(cache)); } catch (e) { }
}

function loadLocalCache() {
    try { const d = localStorage.getItem(SB_CACHE_KEY); return d ? JSON.parse(d) : {}; } catch (e) { return {}; }
}

// Populate lumpCache from localStorage on startup
Object.assign(lumpCache, loadLocalCache());

async function downloadAllLumps() {
    const { data, error } = await sbClient.from("pbl_lumps").select("lump_index, data");
    if (error || !data) return;
    data.forEach(row => { lumpCache[row.lump_index] = row.data; });
    saveLocalCache(lumpCache);
    toast && toast("Alg data cached locally.");
}

async function fetchLump(lumpIndex) {
    if (lumpCache[lumpIndex]) return lumpCache[lumpIndex];
    // try single fetch from supabase
    const { data, error } = await sbClient.from("pbl_lumps").select("data").eq("lump_index", lumpIndex).single();
    if (!error && data) {
        lumpCache[lumpIndex] = data.data;
        saveLocalCache(lumpCache);
        return data.data;
    }
    return null;
}

function hasAlgData(algs) {
    return algs && algs.some(a => a.angle?.trim() || a.notation?.trim());
}

function nab(text) {
    // this stands for normalize_angled_brackets. too long a name to be used 100 times.
    return text.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function indent(text) {
    return;
}

function formatLumpAsText(lump, lumpTitle) {
    let lines = [];

    // Title
    lines.push(
        `<span class="lump-title">${lumpTitle}${lump["Optimal-slicecount"] ? " (" + lump["Optimal-slicecount"] + ")" : ""}</span>`,
    );
    lines.push("");

    // Distinction help
    if (lump.Matt?.["Distinction-help"]?.trim()) {
        lines.push(`<i><span>${nab(lump.Matt["Distinction-help"])}</span></i>`);
    }

    // Matt solution groups
    const sgs = lump.Matt?.["solution-groups"] || [];
    for (const sg of sgs) {
        const hasContent =
            sg["Solution-Overview"]?.trim() ||
            sg["alg-blocks"]?.some(
                (ab) =>
                    ab["Alg-explanation"]?.trim() ||
                    ab["angle-explanation"]?.trim() ||
                    ab.cases?.some((c) => hasAlgData(c.algs)),
            );
        if (!hasContent) continue;

        lines.push("");
        const slices = sg["Solution-Slicecount"]
            ? ` (${sg["Solution-Slicecount"]})`
            : "";
        if (sg["Solution-Overview"]?.trim()) {
            lines.push(`<span><b>${nab(sg["Solution-Overview"])}${slices}</b></span>`);
        }

        for (const ab of sg["alg-blocks"] || []) {
            if (ab["angle-explanation"]?.trim()) lines.push(`<span>${nab(ab["angle-explanation"])}</span>`);
            if (ab["Alg-explanation"]?.trim()) lines.push(`<span>${nab(ab["Alg-explanation"])}</span>`);

            for (const c of ab.cases || []) {
                if (!hasAlgData(c.algs)) continue;
                for (const alg of c.algs) {
                    if (!alg.angle?.trim() && !alg.notation?.trim()) continue;
                    const angle = alg.angle?.trim()
                        ? `&lt;${alg.angle}&gt; `
                        : "";
                    lines.push(
                        `<span class="alg-line">${c["case-name"]}+ ${angle}<span style="font-family:monospace">${alg.notation}</span></span>`,
                    );
                }
            }
        }
    }

    // Derpy
    const filledDerpy = (lump.derpy || []).filter((c) => hasAlgData(c.algs));
    if (filledDerpy.length) {
        lines.push("");
        lines.push(`<span class="section-label"><b>Derpy</b></span>`);
        for (const c of filledDerpy) {
            for (const alg of c.algs) {
                if (!alg.angle?.trim() && !alg.notation?.trim()) continue;
                const angle = alg.angle?.trim() ? `&lt;${alg.angle}&gt; ` : "";
                lines.push(
                    `<span class="alg-line">${c["case-name"]}+ ${angle}<span style="font-family:monospace">${alg.notation}</span></span>`,
                );
                lines.push(
                    `<span class="alg-line">${c["case-name"]}+ ${angle}<span style="font-family:monospace">${alg.notation}</span></span>`,
                );
            }
        }
    }

    return lines.join("");
}

let hasOfferedDownload = false;

async function openLumpModal() {
    if (!hasActiveScramble) return;
    if (!hasOfferedDownload && Object.keys(lumpCache).length === 0) {
        hasOfferedDownload = true;
        if (confirm("Download alg data for offline use? (~1MB, one time only)")) {
            await downloadAllLumps();
        }
    }
    const raw = currentCase; // e.g. "Al/Ar+"
    const caseName = raw.replace(/[+-]$/, "");
    const lumpTitle = findLumpForCase(caseName);
    if (!lumpTitle) return;
    const lumpIndex = findLumpIndex(lumpTitle);

    const modal = document.getElementById("lump-modal");
    const content = document.getElementById("lump-modal-content");
    modal.style.display = "block";
    isPopupOpen = true;
    content.innerHTML = `<span style="opacity:0.4">Loading…</span>`;

    let lump = await fetchLump(lumpIndex);

    // fallback: build from pbl-data.js if available and supabase has nothing
    if (!lump && typeof PBL_DATA !== "undefined") {
        lump = PBL_DATA[lumpTitle];
    }

    if (!lump) {
        content.innerHTML = `<span style="opacity:0.4">No data found for "${lumpTitle}".</span>`;
        return;
    }

    content.innerHTML = formatLumpAsText(lump, lumpTitle);
}

function closeLumpModal(e) {
    document.getElementById("lump-modal").style.display = "none";
    isPopupOpen = false;
}

// ─── localStorage wrapper with PBL suffix
const STORAGE_SUFFIX = 'PBL';

const storage = {
    getItem: (key) => localStorage.getItem(key + STORAGE_SUFFIX),
    setItem: (key, value) => localStorage.setItem(key + STORAGE_SUFFIX, value),
    removeItem: (key) => localStorage.removeItem(key + STORAGE_SUFFIX)
};

// Migration function for legacy data
function migrateLegacyData() {
    const legacyKeys = ['settings', 'selected', 'userLists'];
    let migrated = false;

    for (let key of legacyKeys) {
        const legacyData = localStorage.getItem(key);
        const newData = storage.getItem(key);

        // Only migrate if legacy data exists and new data doesn't
        if (legacyData !== null && newData === null) {
            storage.setItem(key, legacyData);
            localStorage.removeItem(key); // Clean up old data
            migrated = true;
        }
    }

    if (migrated) {
        console.log('Migrated legacy PBL data to new storage format');
    }
}

function getLocalStorageData(fillSidebar = false) {
    migrateLegacyData();
    const storageSelectedPBL = storage.getItem("selected");

    if (fillSidebar) {
        possiblePBL.splice(0, 1);
        let buttons = "";
        for (let [t, b] of possiblePBL) {
            buttons += `
            <div class="case" id="${t}/${b}">${t} / ${b}</div>`;
        }
        pblListEl.innerHTML += buttons;
    }

    const storageSettings = storage.getItem("settings");
    for (let el of settingList) {
        if (el[0].checked) el[0].click();
    }
    if (storageSettings === null)
        storage.setItem("settings", "0".repeat(settingList.length));
    else {
        for (let i = 0; i < settingList.length; i++)
            if (storageSettings[i] === "1") {
                settingList[i][0].click();
            }
        while (storage.getItem("settings").length !== settingList.length) {
            storage.setItem("settings", storage.getItem("settings") + "0")
        }
    }

    const storedEquator = storage.getItem("equatorMode");
    if (storedEquator) {
        equatorMode = storedEquator;
        const radio = document.querySelector(`input[name="equator"][value="${equatorMode}"]`);
        if (radio) radio.checked = true;
    }

    const storedScrambleMode = storage.getItem("scrambleMode");
    if (storedScrambleMode) {
        scrambleMode = storedScrambleMode;
        const radio = document.querySelector(`input[name="scramlen"][value="${scrambleMode}"]`);
        if (radio) radio.checked = true;
        document.getElementById('bottom56-row').style.display =
            scrambleMode === 'small' ? 'flex' : 'none';
    }

    const storedBottom56 = storage.getItem("allowBottom56");
    if (storedBottom56) {
        allowBottom56 = storedBottom56 === "1";
        document.getElementById('allow-bottom56').checked = allowBottom56;
    }

    if (storageSelectedPBL !== null) {
        selectedPBL = legacyMigrateSelected(JSON.parse(storageSelectedPBL));
        // Save back so legacy format is not repeated on next load
        storage.setItem("selected", JSON.stringify(selectedPBL));
        for (let k of selectedPBL) {
            selectPBL(k);
        }
        if (selectedPBL.length > 0) {
            showSelection();
        } else {
            showAll();
        }
        if (eachCaseEls[0].checked) eachCase = 1;
        else eachCase = randInt(MIN_EACHCASE, MAX_EACHCASE);
        enableGoEachCase();
        generateScramble();
    } else if (fillSidebar) {
        // First ever load — select all cases in 'both' mode
        for (let pbl of possiblePBL) {
            const base = pblname(pbl);
            selectPBL(base + '+');
            selectPBL(base + '-');
        }
        saveSelectedPBL();
    }
    updateSelCount();

    const storageUserLists = storage.getItem("userLists");
    if (storageUserLists !== null) {
        userLists = JSON.parse(storageUserLists);
        let needsSave = false;
        for (let list of Object.keys(userLists)) {
            if (!Array.isArray(userLists[list])) {
                console.log("Non array")
                let formattedList = []
                for (let i of possiblePBL) {
                    if (userLists[list][pblname(i)] == 1) {
                        formattedList.push(pblname(i))
                    }
                }
                userLists[list] = formattedList.copyWithin();
                needsSave = true;
            }
            // Legacy migration: expand entries without suffix
            const migrated = legacyMigrateSelected(userLists[list]);
            if (migrated !== userLists[list]) {
                userLists[list] = migrated;
                needsSave = true;
            }
        }
        if (needsSave) saveUserLists();
        addUserLists();
    }
}

function saveSelectedPBL() {
    storage.setItem("selected", JSON.stringify(selectedPBL));
    // this is === 0 cuz genScram() has a if statement that deletes the scram if so
    if (!hasActiveScramble || selectedPBL.length == 0) generateScramble();
    else if (
        !selectedPBL.includes(currentCase) &&
        currentCase != ""
    ) // regenerate the scram if the scram's case was deselected
        generateScramble(true);
}

function updateSelCount() {
    const unique = new Set(selectedPBL.map(s => s.slice(0, -1))).size;
    selectedCount = unique;
    selCountEl.textContent = "Selected: " + unique;
}

function saveUserLists() {
    storage.setItem("userLists", JSON.stringify(userLists));
}

function saveSettings() {
    let store = "";
    for (let els of settingList)
        if (els[0].checked)
            store += "1";
        else
            store += "0";
    storage.setItem("settings", store);
    storage.setItem("equatorMode", equatorMode);
    storage.setItem("scrambleMode", scrambleMode);
    storage.setItem("allowBottom56", allowBottom56 ? "1" : "0");
}

function setHighlightedList(id) {
    if (id == "all") id = null;
    if (id != null) {
        const item = document.getElementById(id);
        item.classList.add("highlighted");
    }
    if (highlightedList != null) {
        document
            .getElementById(highlightedList)
            .classList.remove("highlighted");
    }
    highlightedList = id;
}

function addListItemEvent(item) {
    item.addEventListener("click", () => {
        if (item.classList.contains("highlighted")) {
            item.classList.remove("highlighted");
            highlightedList = null;
        } else {
            setHighlightedList(item.id);
        }
    });
}

async function init() {
    // Compute possible pbls
    for (let t of evenPLL) {
        for (let b of evenPLL) possiblePBL.push([t, b]);
    }
    for (let t of oddPLL) {
        for (let b of oddPLL) {
            possiblePBL.push([t, b]);
        }
    }

    getLocalStorageData(true);

    lastRemoved = "";

    // Add event listener to all case buttons, so we can click them
    document.querySelectorAll(".case").forEach((caseEl) => {
        const base = caseEl.id;

        caseEl.addEventListener("click", () => {
            if (usingTimer()) return;
            const mode = getCaseMode(base);
            if (mode === 'none' || mode === 'plus' || mode === 'minus') {
                // left click → select as 'both'
                selectPBL(base + '+');
                selectPBL(base + '-');
            } else {
                // mode === 'both' → deselect
                deselectPBL(base + '+');
                deselectPBL(base + '-');
            }
            saveSelectedPBL();
        });

        caseEl.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (usingTimer()) return;
            const mode = getCaseMode(base);
            if (mode === 'none') {
                // right click from unselected → +
                selectPBL(base + '+');
            } else if (mode === 'both') {
                // right click from both → +
                deselectPBL(base + '-');
            } else if (mode === 'plus') {
                // right click from + → -
                deselectPBL(base + '+');
                selectPBL(base + '-');
            } else {
                // mode === 'minus' → deselect
                deselectPBL(base + '-');
            }
            saveSelectedPBL();
        });
    });

    // Load default lists
    await fetch("./json/defaultlists.json")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            defaultLists = data;
            // Legacy migration: expand non-suffixed entries at runtime
            for (const k of Object.keys(defaultLists)) {
                defaultLists[k] = legacyMigrateSelected(defaultLists[k]);
            }
            addDefaultLists();
        })
        .catch((error) => console.error("Failed to fetch data:", error));
}

function generateScramble(regen = false) {
    let eachCaseAlert = false;
    if (scrambleOffset >= 0 && !regen && scrambleList.length > 0 && selectedPBL.length === 0) {
        displayPrevScram();
        currentScrambleEl.textContent = scrambleList.at(-1 - scrambleOffset)[usingKarn];
        return;
    } else if (scrambleOffset < 0) scrambleOffset = 0;
    if (selectedPBL.length === 0) {
        timerEl.textContent = "--:--";
        currentScrambleEl.textContent = "Scramble will show up here";
        previousScrambleEl.textContent = "Last scramble will show up here";
        hasActiveScramble = false;
        scrambleList = [];
        pendingScramble = null;
        return;
    }
    if (remainingPBL.length === 0) {
        if (eachCase === 1) eachCaseAlert = true;
        enableGoEachCase();
    }

    // Pick the next case
    const caseNum = randInt(0, remainingPBL.length - 1);
    const pblChoice = remainingPBL.splice(caseNum, 1)[0];

    if (regen) {
        // Regen: fire worker and wait, replace current scramble when done
        pendingScramble = 'waiting';
        workerBusy = false; // force allow
        requestNextScramble(pblChoice);
        // worker.onmessage will call flushPendingScramble which will update scrambleList tail
        // but for regen we need to overwrite, so we handle it differently:
        worker.onmessage = function (e) {
            workerBusy = false;
            if (e.data.error) { console.error(e.data.error); return; }
            const data = e.data;
            previousCase = currentCase;
            currentCase = data.caseName;
            const final = [data.scramble, data.karn, data.caseName];
            scrambleList[scrambleList.length - 1] = final;
            if (scrambleOffset === 0)
                currentScrambleEl.textContent = final[usingKarn];
            // restore normal handler
            worker.onmessage = normalWorkerHandler;
        };
        if (eachCaseAlert) setTimeout(() => alert("You have gone through each case!"), 100);
        return;
    }

    // Normal generate: use pending if ready, else wait
    if (pendingScramble && pendingScramble !== 'waiting') {
        const data = pendingScramble;
        pendingScramble = null;

        previousCase = currentCase;
        currentCase = data.caseName;
        const final = [data.scramble, data.karn, data.caseName];

        if (scrambleList.length !== 0) {
            previousScramble = scrambleList[scrambleList.length - 1];
            previousScrambleEl.textContent =
                "Previous scramble: " +
                scrambleList.at(-1)[usingKarn] +
                " (" + scrambleList.at(-1)[2] + ")";
        }
        currentScrambleEl.textContent = final[usingKarn];
        scrambleList.push(final);
        if (!hasActiveScramble) timerEl.textContent = "0.00";
        hasActiveScramble = true;

        // Pre-generate next
        if (remainingPBL.length > 0) {
            const nextCaseNum = randInt(0, remainingPBL.length - 1);
            const nextChoice = remainingPBL[nextCaseNum]; // peek, don't splice yet
            requestNextScramble(nextChoice);
        }
    } else {
        // Worker busy or no pending — show loading, wait
        currentScrambleEl.classList.add("generating");
        pendingScramble = 'waiting';
        if (!workerBusy) requestNextScramble(pblChoice);
        worker.onmessage = function (e) {
            workerBusy = false;
            if (e.data.error) { console.error(e.data.error); return; }
            const data = e.data;
            previousCase = currentCase;
            currentCase = data.caseName;
            const final = [data.scramble, data.karn, data.caseName];
            if (scrambleList.length !== 0) {
                previousScramble = scrambleList[scrambleList.length - 1];
                previousScrambleEl.textContent =
                    "Previous scramble: " +
                    scrambleList.at(-1)[usingKarn] +
                    " (" + scrambleList.at(-1)[2] + ")";
            }
            currentScrambleEl.textContent = final[usingKarn];
            currentScrambleEl.classList.remove("generating");
            scrambleList.push(final);
            if (!hasActiveScramble) timerEl.textContent = "0.00";
            hasActiveScramble = true;
            pendingScramble = null;
            worker.onmessage = normalWorkerHandler;
        };
    }

    if (eachCaseAlert) setTimeout(() => alert("You have gone through each case!"), 100);
}

function normalWorkerHandler(e) {
    workerBusy = false;
    if (e.data.error) { console.error('Worker error:', e.data.error); return; }
    pendingScramble = e.data;
}

function displayPrevScram() {
    if (scrambleList.at(-2 - scrambleOffset) !== undefined) {
        // we have a prev scram to display
        previousScrambleEl.textContent =
            "Previous scramble: " +
            scrambleList.at(-2 - scrambleOffset)[usingKarn] +
            " (" +
            scrambleList.at(-2 - scrambleOffset)[2] +
            ")";
    } else {
        previousScrambleEl.textContent = "Last scramble will show up here";
    }
}

function showAll() {
    for (let pbl of possiblePBL) {
        showPBL(pblname(pbl));
    }
    updateSelCount();
}

function hidePBL(text) {
    document.getElementById(text).classList.add("hidden");
}

function showPBL(text) {
    document.getElementById(text).classList.remove("hidden");
}

function selectPBL(s) {
    // s must end with '+' or '-'
    const base = s.slice(0, -1);
    const el = document.getElementById(base);
    if (!selectedPBL.includes(s)) {
        selectedPBL.push(s);
    }
    if (eachCase > 0 && !remainingPBL.includes(s)) {
        remainingPBL = remainingPBL.concat(Array(eachCase).fill(s));
    }
    if (el) setCaseDomClass(el, getCaseMode(base));
    updateSelCount();
}

function deselectPBL(s) {
    // s must end with '+' or '-'
    if (!selectedPBL.includes(s)) return;
    const base = s.slice(0, -1);
    const el = document.getElementById(base);
    selectedPBL = selectedPBL.filter(a => a !== s);
    remainingPBL = remainingPBL.filter(a => a !== s);
    if (el) setCaseDomClass(el, getCaseMode(base));
    updateSelCount();
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${centiseconds.toString().padStart(2, "0")}`;
}

function setColor(className) {
    timerEl.classList.remove("red", "green");
    if (className != "") timerEl.classList.add(className);
}

function startTimer() {
    timerStart = performance.now();
    intervalId = setInterval(() => {
        const now = performance.now();
        const elapsed = now - timerStart;
        timerEl.textContent = formatTime(elapsed);
    }, 10);
    isRunning = true;
    setColor();

    // Pre-generate next scramble while timer is running
    if (remainingPBL.length > 0 && !workerBusy && !pendingScramble) {
        const nextCaseNum = randInt(0, remainingPBL.length - 1);
        const nextChoice = remainingPBL[nextCaseNum];
        requestNextScramble(nextChoice);
    }
}

function stopTimer() {
    clearInterval(intervalId);
    isRunning = false;
}

function resetTimer(hidden) {
    stopTimer();
    pressStartTime = null;
    holdTimeout = null;
    timerStart = null;
    intervalId = null;
    readyToStart = false;
    otherKeyPressed = 0;
    if (canInteractTimer() && !hidden) {
        timerEl.textContent = "0.00";
    } else if (!hidden) {
        timerEl.textContent = "--:--";
    }
    setColor("");
}

function timerBeginTouch(spaceEquivalent) {
    if (!hasActiveScramble) return;
    if (document.activeElement == filterInputEl) return;
    if (isRunning) {
        // Stop timer
        stopTimer();
        scrambleOffset--;
        generateScramble();
        if (!spaceEquivalent) otherKeyPressed += 1;
    } else if (spaceEquivalent && otherKeyPressed <= 0) {
        if (!pressStartTime) {
            pressStartTime = performance.now();
            setColor("red");
            // Après 200ms, passer en vert
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
            if (heldTime >= startDelay && readyToStart) {
                startTimer();
            } else {
                setColor();
            }
        }
        pressStartTime = null;
        readyToStart = false;
    } else {
        otherKeyPressed = Math.max(0, otherKeyPressed - 1);
    }
}

function addUserLists() {
    let content = "";
    for (let k of Object.keys(userLists)) {
        const uniqueCount = new Set(userLists[k].map(s => s.slice(0, -1))).size;
        content += `
        <div id="${k}" class=\"list-item\">${k} (${uniqueCount})</div>`;
    }
    userListsEl.innerHTML = content;
    for (let item of document.querySelectorAll("#userlists>.list-item")) {
        addListItemEvent(item);
    }
    saveUserLists();
}

function addDefaultLists() {
    let content = "";
    for (let k of Object.keys(defaultLists)) {
        const uniqueCount = new Set(defaultLists[k].map(s => s.slice(0, -1))).size;
        content += `
        <div id="${k}" class=\"list-item\">${k} (${uniqueCount})</div>`;
    }
    defaultListsEl.innerHTML = content;
    for (let item of document.querySelectorAll("#defaultlists>.list-item")) {
        addListItemEvent(item);
    }
}

// setSelection = true => will select and show the cases
//              = false => will only show the cases
function selectList(listName, setSelection) {
    if (listName == null) {
        showAll();
        return;
    }

    let list;
    if (Object.keys(defaultLists).includes(listName)) {
        list = defaultLists[listName];
    } else {
        list = userLists[listName];
    }

    // Hide all, then show cases from the list (strip suffix for DOM lookup)
    if (Array.isArray(list)) {
        for (let pbl of possiblePBL) {
            hidePBL(pblname(pbl));
        }
        const shownBases = new Set();
        for (let pbl of list) {
            const base = pbl.replace(/[+-]$/, '');
            if (!shownBases.has(base)) {
                showPBL(base);
                shownBases.add(base);
            }
        }
    } else {
        // Legacy object format
        for (let [pbl, inlist] of Object.entries(list)) {
            if (inlist) {
                showPBL(pbl);
            } else {
                hidePBL(pbl);
            }
        }
    }

    if (setSelection) {
        deselectAll();
        // Select each entry with its stored barflip mode
        for (let entry of list) {
            selectPBL(entry);
        }
        saveSelectedPBL();
        currentShowMode = 'list';
        updateShowToggleBtn();
    } else {
        currentShowMode = 'list';
        updateShowToggleBtn();
    }
    saveUserLists();
}

function validName(n) {
    for (let l of n) {
        if (
            l.toLowerCase() == l.toUpperCase() &&
            isNaN(parseInt(l)) &&
            !" /".includes(l)
        ) {
            return false;
        }
    }
    return true;
}

function openListPopup() {
    if (usingTimer()) return;
    isPopupOpen = true;
    listPopupEl.classList.add("open");
}

function openHelpPopup() {
    if (usingTimer()) return;
    isPopupOpen = true;
    helpPopupEl.classList.add("open");
}

function openSettingsPopup() {
    if (usingTimer()) return;
    isPopupOpen = true;
    settingsPopupEl.classList.add("open");
}

function closePopup() {
    isPopupOpen = false;
    listPopupEl.classList.remove("open");
    helpPopupEl.classList.remove("open");
    settingsPopupEl.classList.remove("open");
}

function canInteractTimer() {
    return (
        hasActiveScramble &&
        document.activeElement != filterInputEl &&
        !isPopupOpen
    );
}

function getWeight(pbl) {
    // pbl may be "Al/Ar" or "Al/Ar+"/"Al/Ar-"
    pbl = pbl.replace(/[+-]$/, '').split("/");
    let uWeight = pbl[0] in weight ? weight[pbl[0]] : 4;
    let dWeight = pbl[1] in weight ? weight[pbl[1]] : 4;
    return uWeight * dWeight;
}

function getCaseCount(pbl) {
    // pbl: ["Al", "Ar"]
    return PLLextndlen[pbl[0]] * PLLextndlen[pbl[1]];
}

function enableGoEachCase() {
    eachCase = eachCase === 0 ? randInt(MIN_EACHCASE, MAX_EACHCASE) : eachCase;
    remainingPBL = selectedPBL.flatMap((el) =>
        Array(eachCase * (usingWeight ? getWeight(el) : 1)).fill(el)
    );
}

// Init worker
worker = new Worker('/script/worker.js');

function restartWorker() {
    if (worker) worker.terminate();
    worker = new Worker('/script/worker.js');
    worker.onmessage = normalWorkerHandler;
    workerBusy = false;
}

function requestNextScramble(pblChoice) {
    if (workerBusy) return;
    workerBusy = true;
    pendingScramble = null;
    // pblChoice ends in '+' or '-' — extract the per-case equator override
    const suffix = pblChoice.at(-1);
    if (!['+', '-'].includes(suffix)) throw new Error(`suffix: ${suffix} is not valid.`)
    const caseName = pblChoice.slice(0, -1);
    const caseEquatorMode = suffix === '+' ? 'slash' : 'bar';
    worker.postMessage({
        caseName,
        equatorMode: caseEquatorMode,
        scrambleMode,
        allowBottom56
    });
}

function pendingConflicts(newEquatorMode, newScrambleMode, newAllowBottom56) {
    if (!pendingScramble || pendingScramble === 'waiting') return false;
    if (newScrambleMode !== scrambleMode) return true;
    if (newAllowBottom56 !== allowBottom56) return true;
    return false;
}

function cancelAndRegenerateIfNeeded(newEquatorMode, newScrambleMode, newAllowBottom56) {
    const conflicts = pendingConflicts(newEquatorMode, newScrambleMode, newAllowBottom56);
    const workerSettingChanged = newScrambleMode !== scrambleMode || newAllowBottom56 !== allowBottom56;
    // If worker is busy generating with old settings, restart it
    if (workerBusy && workerSettingChanged) {
        restartWorker();
        pendingScramble = null;
    } else if (conflicts) {
        pendingScramble = null;
    }
}

function flushPendingScramble() {
    if (!pendingScramble || pendingScramble === 'waiting') return;
    const data = pendingScramble;
    pendingScramble = null;

    previousCase = currentCase;
    currentCase = data.caseName;
    const final = [data.scramble, data.karn, data.caseName];

    if (scrambleList.length !== 0) {
        previousScramble = scrambleList[scrambleList.length - 1];
        previousScrambleEl.textContent =
            "Previous scramble: " +
            scrambleList.at(-1)[usingKarn] +
            " (" + scrambleList.at(-1)[2] + ")";
    }
    currentScrambleEl.textContent = final[usingKarn];
    scrambleList.push(final);
    if (!hasActiveScramble) timerEl.textContent = "0.00";
    hasActiveScramble = true;
}

document.querySelectorAll('input[name="equator"]').forEach(radio => {
    radio.addEventListener("change", () => {
        const newEquatorMode = radio.value;
        cancelAndRegenerateIfNeeded(newEquatorMode, scrambleMode, allowBottom56);
        equatorMode = newEquatorMode;
        saveSettings();
    });
});

document.querySelectorAll('input[name="scramlen"]').forEach(radio => {
    radio.addEventListener("change", () => {
        const newScrambleMode = radio.value;
        cancelAndRegenerateIfNeeded(equatorMode, newScrambleMode, allowBottom56);
        scrambleMode = newScrambleMode;
        document.getElementById('bottom56-row').style.display =
            scrambleMode === 'small' ? 'flex' : 'none';
        generateScramble(true);
        saveSettings();
    });
});

document.getElementById('allow-bottom56').addEventListener("change", function () {
    const newAllowBottom56 = this.checked;
    cancelAndRegenerateIfNeeded(equatorMode, scrambleMode, newAllowBottom56);
    allowBottom56 = newAllowBottom56;
    if (scrambleMode === 'small') generateScramble(true);
    saveSettings();
});

filterInputEl.addEventListener("input", () => {
    filterInputEl.value = filterInputEl.value.replace(/[^a-zA-Z0-9/\-<>!*&() ]+/g, "");
    setHighlightedList(null);
    applyFilter(filterInputEl.value);
    updateSelectBtn();
    updateDeselectBtn();

    const hasFilter = filterInputEl.value.trim() !== '';

    if (hasFilter) {
        if (currentShowMode !== 'searched') {
            preSearchMode = (currentShowMode === 'list') ? 'all' : currentShowMode;
            currentShowMode = 'searched';
        }
    } else {
        // clearing the search
        if (currentShowMode === 'selected') {
            showSelection();
        } else {
            // currentShowMode is 'searched'
            currentShowMode = preSearchMode;
            if (currentShowMode === 'selected') showSelection();
            else showAll();
        }
    }

    updateShowToggleBtn();
});

// Returns the list of visible (non-hidden) base case names
function getVisibleBases() {
    const bases = [];
    for (let i of pblListEl.children) {
        if (!i.classList.contains("hidden")) bases.push(i.id);
    }
    return bases;
}

// Apply a target mode ('both'|'plus'|'minus'|'none') to a list of base names
function applyModeToList(bases, mode) {
    for (const base of bases) {
        deselectPBL(base + '+');
        deselectPBL(base + '-');
        if (mode === 'both') {
            selectPBL(base + '+');
            selectPBL(base + '-');
        } else if (mode === 'plus') {
            selectPBL(base + '+');
        } else if (mode === 'minus') {
            selectPBL(base + '-');
        }
    }
    saveSelectedPBL();
}

// Next mode in left-click cycle: none/plus/minus → both → plus → minus → both
function nextModeLeft(current) {
    if (current === 'none') return 'both';
    if (current === 'both') return 'plus';
    if (current === 'plus') return 'minus';
    return 'both'; // minus → both
}

// Next mode in right-click cycle
function nextModeRight(current) {
    if (current === 'none' || current === 'both') return 'plus';
    if (current === 'plus') return 'minus';
    return 'plus'; // minus → plus
}

function selectAll(isRightClick = false) {
    if (usingTimer()) return;
    const bases = possiblePBL.map(pbl => pblname(pbl));
    selectBtnState = isRightClick ? nextModeRight(selectBtnState) : nextModeLeft(selectBtnState);
    applyModeToList(bases, selectBtnState);
}

function deselectAll() {
    if (usingTimer()) return;
    selectBtnState = 'none';
    for (let pbl of possiblePBL) {
        const base = pblname(pbl);
        deselectPBL(base + '+');
        deselectPBL(base + '-');
    }
    saveSelectedPBL();
}

selectAllEl.addEventListener("click", () => {
    if (filterInputEl.value.trim() !== '') selectThese(false);
    else selectAll(false);
});

selectAllEl.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (filterInputEl.value.trim() !== '') selectThese(true);
    else selectAll(true);
});

deselectAllEl.addEventListener("click", () => {
    if (filterInputEl.value.trim() !== '') deselectThese();
    else deselectAll();
});

function selectThese(isRightClick = false) {
    if (usingTimer()) return;
    const bases = getVisibleBases();
    selectBtnState = isRightClick ? nextModeRight(selectBtnState) : nextModeLeft(selectBtnState);
    applyModeToList(bases, selectBtnState);
}

function deselectThese() {
    if (usingTimer()) return;
    selectBtnState = 'none';
    for (let i of pblListEl.children) {
        if (!i.classList.contains("hidden")) {
            deselectPBL(i.id + '+');
            deselectPBL(i.id + '-');
        }
    }
    saveSelectedPBL();
}

function showAllClick() {
    if (usingTimer()) return;
    showAll();
    currentShowMode = 'all';
    updateShowToggleBtn();
}

function updateShowToggleBtn() {
    if (currentShowMode === 'list' && highlightedList == null) {
        currentShowMode = 'selected';
    }
    let state;
    if (currentShowMode === 'list') state = `List: ${highlightedList}`;
    else if (currentShowMode === 'searched') state = 'searched';
    else if (currentShowMode === 'selected') state = 'selected';
    else state = 'all';

    showToggleEl.innerHTML = `<span style="font-size:0.65em;opacity:0.8;font-weight:normal;letter-spacing:0.05em">SHOWING:</span><span>${state}</span>`;
}

function updateSelectBtn() {
    const hasFilter = filterInputEl.value.trim() !== '';
    selectAllEl.textContent = hasFilter ? 'Select these' : 'Select ALL';
}

function updateDeselectBtn() {
    const hasFilter = filterInputEl.value.trim() !== '';
    deselectAllEl.textContent = hasFilter ? 'Deselect these' : 'Deselect ALL';
}

showToggleEl.addEventListener("click", () => {
    if (usingTimer()) return;
    const hasFilter = filterInputEl.value.trim() !== '';
    if (hasFilter) {
        // can only toggle between searched and selected
        if (currentShowMode === 'searched') {
            currentShowMode = 'selected';
            showSelection();
        } else {
            currentShowMode = 'searched';
            showAll();
            applyFilter(filterInputEl.value);
        }
    } else {
        if (currentShowMode === 'list') {
            currentShowMode = 'selected';
            showSelection();
        } else if (currentShowMode === 'selected') {
            currentShowMode = 'all';
            showAll();
        } else {
            currentShowMode = 'selected';
            showSelection();
        }
    }
    updateShowToggleBtn();
});

function showSelection() {
    if (usingTimer()) return;
    for (let pbl of possiblePBL) {
        const n = pblname(pbl);
        if (selectedPBL.some(s => s.slice(0, -1) === n)) {
            showPBL(n);
        } else {
            hidePBL(n);
        }
    }
    updateSelCount();
    currentShowMode = 'selected';
    updateShowToggleBtn();
}

function prevScram() {
    if (usingTimer()) return;
    if (scrambleList.length == 0) return;
    scrambleOffset = Math.min(scrambleOffset + 1, scrambleList.length - 1);
    currentScrambleEl.textContent = scrambleList.at(-1 - scrambleOffset)[
        usingKarn
    ];
    displayPrevScram();
}

prevScrambleButton.addEventListener("click", prevScram);

currentScrambleEl.addEventListener("click", () => {
    if (usingTimer()) return;
    openLumpModal();
});

function nextScram() {
    if (usingTimer()) return;
    if (scrambleList.length == 0) return;
    scrambleOffset--;
    if (scrambleOffset < 0) {
        // scrambleOffset = 0;: this is already set in the function below
        generateScramble();
    } else {
        currentScrambleEl.textContent = scrambleList.at(-1 - scrambleOffset)[
            usingKarn
        ];
        displayPrevScram();
    }
}

nextScrambleButton.addEventListener("click", nextScram);

openListsEl.addEventListener("click", () => {
    if (usingTimer()) return;
    openListPopup();
});

document.getElementById("open-help").addEventListener("click", () => {
    if (usingTimer()) return;
    openHelpPopup();
});

openSettingsEl.addEventListener("click", () => {
    if (usingTimer()) return;
    openSettingsPopup();
});

newListEl.addEventListener("click", () => {
    if (usingTimer()) return;
    if (selectedPBL.length == 0) {
        alert("Please select PBLs to create a list!");
        return;
    }
    let newListName = prompt("Name of your list:");
    if (newListName == null || newListName == "") {
        return;
    }
    newListName = newListName.trim();
    if (newListName == "" || !validName(newListName)) {
        alert(
            "Please enter a valid name (only letters, numbers, slashes, and spaces)"
        );
        return;
    }
    if (Object.keys(defaultLists).includes(newListName)) {
        alert("A default list already has this name!");
        return;
    }
    if (Object.keys(userLists).includes(newListName)) {
        alert("You already gave this name to a list");
        return;
    }
    if (document.getElementById(newListName) != null) {
        alert("You can't give this name to a list (id taken)");
        return;
    }
    // New way of creating a list
    let newList = selectedPBL.copyWithin()
    userLists[newListName] = newList;
    addUserLists();
    setHighlightedList(newListName);
});

overwriteListEl.addEventListener("click", () => {
    if (usingTimer()) return;
    if (highlightedList == null) {
        return;
    } else if (Object.keys(defaultLists).includes(highlightedList)) {
        alert("You cannot overwrite a default list");
        return;
    }
    if (selectedPBL.length == 0) {
        alert("Please select PBLs to overwrite the list!");
        return;
    }

    // valid request
    if (confirm("You are about to overwrite list " + highlightedList)) {
        let newList = selectedPBL.copyWithin();
        userLists[highlightedList] = newList;
        addUserLists();
        selectList(highlightedList, false);
        highlightedList = null;
        closePopup();
    }
});

selectListEl.addEventListener("click", () => {
    if (highlightedList == null) {
        alert("Please click on a list");
        return;
    }
    selectList(highlightedList, false);
    closePopup();
});

deleteListEl.addEventListener("click", () => {
    if (highlightedList == null) {
        return;
    }
    if (Object.keys(userLists).includes(highlightedList)) {
        if (confirm("You are about to delete list " + highlightedList)) {
            delete userLists[highlightedList];
            highlightedList = null;
            addUserLists();
        }
        return;
    }
    if (Object.keys(defaultLists).includes(highlightedList)) {
        alert("You cannot delete a default list");
        return;
    }
    alert("Error");
});

trainListEl.addEventListener("click", () => {
    if (highlightedList == null) {
        alert("Please click on a list");
        return;
    }
    selectList(highlightedList, true);
    closePopup();
});

function isMac() {
    if (navigator.userAgentData) {
        // Newer, privacy-preserving API
        return navigator.userAgentData.platform === "macOS";
    }
    // Fallback for older browsers
    return navigator.userAgent.toUpperCase().includes("MAC");
}

window.addEventListener("keydown", (e) => {
    const inInput = document.activeElement === filterInputEl;
    if (e.code == "Escape") {
        if (document.getElementById("lump-modal").style.display === "block") {
            closeLumpModal();
            return;
        }
        if (isPopupOpen) {
            closePopup();
        }
        if (usingTimer()) {
            resetTimer(false);
        }
        if (inInput) filterInputEl.blur();
        return;
    }

    // space (start timer)
    if (canInteractTimer()) {
        let isSpace = e.code == "Space";
        let runningTemp = isRunning;
        timerBeginTouch(isSpace);
        if (isSpace) e.preventDefault();
        if (runningTemp) return;
    }

    // ctrl F (search cases); ctrl Z (undo remove last); ctrl Y (redo remove last)
    const ctrl = isMac() ? e.metaKey : e.ctrlKey;
    if (ctrl && !e.altKey) {
        if (e.shiftKey) {
            // ctrl + shift +
            switch (e.key.toLowerCase()) {
                case "a":
                    e.preventDefault();
                    deselectAll();
                    return;
                case "s":
                    e.preventDefault();
                    deselectThese();
                case "z": // made this work for ctrl + y as well bc why not
                    e.preventDefault();
                    deselectPBL(lastRemoved);
                    saveSelectedPBL();
                    return;
            }
        } else {
            // ctrl +
            switch (e.key.toLowerCase()) {
                case "a":
                    if (!inInput) {
                        e.preventDefault();
                        selectAll();
                    }
                    return;
                case "s":
                    e.preventDefault();
                    selectThese();
                    return;

                case "f":
                    e.preventDefault(); // stop the browser’s find box
                    filterInputEl.focus();
                    return;
                case "z":
                    e.preventDefault();
                    selectPBL(lastRemoved);
                    saveSelectedPBL();
                    return;
                case "y":
                    e.preventDefault();
                    deselectPBL(lastRemoved);
                    saveSelectedPBL();
                    return;
            }
        }
    } else if (!ctrl && e.altKey && !e.shiftKey) {
        // alt +
        switch (e.key.toLowerCase()) {
            case "a":
                e.preventDefault();
                showAll();
                return;
            case "s":
                e.preventDefault();
                showSelection();
                return;
        }
    }

    // backspace (remove last); left arrow (prev scram); right arrow (next scram)
    if (!inInput && !ctrl && !e.altKey && !e.shiftKey) {
        let el;
        switch (e.key.toLowerCase()) {
            case "backspace":
                e.preventDefault();
                removeLast();
                return;
            case "arrowleft":
                e.preventDefault();
                prevScram();
                return;
            case "arrowright":
                e.preventDefault();
                nextScram();
                return;
            // we have to take [1] because the ones that are visible on pc
            // (on the side bar) are further down in the html file
            case "e":
                el = eachCaseEls[0];
                el.checked = !el.checked;
                onCheckEachCase(el);
                return;
            case "k":
                el = karnEls[0];
                el.checked = !el.checked;
                onCheckKarn();
                return;
            case "r":
                el = weightEls[0];
                el.checked = !el.checked;
                onCheckWeights();
                return;
        }
    }
});

window.addEventListener("keyup", (e) => {
    if (!canInteractTimer()) return;
    let isSpace = e.code == "Space";
    timerEndTouch(isSpace);
    if (isSpace) e.preventDefault();
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState == "hidden") {
        resetTimer(true);
    }
});

timerBoxEl.addEventListener("touchstart", (e) => {
    if (isPopupOpen) return;
    if (!canInteractTimer()) return;
    timerBeginTouch(true);
});

timerBoxEl.addEventListener("touchend", (e) => {
    if (!canInteractTimer()) return;
    timerEndTouch(true);
});

toggleUiEl.addEventListener("click", () => {
    if (usingTimer()) return;
    const isMobileView = window.innerWidth <= 900;
    if (isMobileView) {
        if (sidebarEl.classList.contains("hidden-on-mobile")) {
            sidebarEl.classList.remove("hidden-on-mobile");
            sidebarEl.classList.add("full-width-mobile");
            contentEl.classList.add("hidden-mobile");
        } else {
            sidebarEl.classList.add("hidden-on-mobile");
            sidebarEl.classList.remove("full-width-mobile");
            contentEl.classList.remove("hidden-mobile");
        }
    } else {
        if (sidebarEl.classList.contains("hidden")) {
            sidebarEl.classList.remove("hidden");
        } else {
            sidebarEl.classList.add("hidden");
        }
    }
});

downloadEl.addEventListener("click", () => {
    if (usingTimer()) return;
    const data = JSON.stringify({
        'settingsPBL': storage.getItem('settings'),
        'selectedPBL': storage.getItem('selected'),
        'userListsPBL': storage.getItem('userLists')
    });
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PBLTrainerData.json";
    a.click();
    URL.revokeObjectURL(url);
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
            deselectAll();
            jsonData = JSON.parse(reader.result);
            storage.setItem("selected", jsonData["selectedPBL"]);

            let outdated = false;
            if ("userListsPBL" in jsonData) storage.setItem("userLists", jsonData["userListsPBL"]);
            else if ("userLists" in jsonData) {
                storage.setItem("userLists", jsonData["userLists"]);
                outdated = true;
            }
            if ("settingsPBL" in jsonData) storage.setItem("settings", jsonData["settingsPBL"]);
            else if ("settings" in jsonData) {
                storage.setItem("settings", jsonData["settings"]);
                outdated = true;
            }
            if (outdated) {
                alert("File formatting is outdated, re-export recommended.");
            }
            getLocalStorageData();
        } catch (e) {
            console.error("Error:", e);
        } finally {
            // Clear the file input so the same file can be selected again
            e.target.value = '';
        }
    };
    reader.readAsText(file);
});

function removeLast() {
    if (scrambleList.at(-2 - scrambleOffset) !== undefined) {
        deselectPBL(previousCase); // previousCase already ends in '+'/'-'
        lastRemoved = previousCase;
        saveSelectedPBL();
    }
}

removeLastEl.addEventListener("click", removeLast);

function onCheckEachCase(el) {
    eachCase = el.checked ? 1 : randInt(MIN_EACHCASE, MAX_EACHCASE);
    enableGoEachCase();
    saveSettings();
}

function onCheckKarn() {
    usingKarn ^= 1; // switches between 0 and 1 with XOR
    if (hasActiveScramble)
        currentScrambleEl.textContent = scrambleList.at(-1 - scrambleOffset)[
            usingKarn
        ];
    displayPrevScram();
    saveSettings();
}

function onCheckWeights() {
    usingWeight = !usingWeight;
    enableGoEachCase();
    saveSettings();
}

eachCaseEls.forEach((btn) =>
    btn.addEventListener("change", () => onCheckEachCase(btn))
);

karnEls.forEach((btn) =>
    btn.addEventListener("change", () => onCheckKarn())
);

weightEls.forEach((btn) =>
    btn.addEventListener("change", () => onCheckWeights())
);

// Enable crosses
for (let cross of document.querySelectorAll(".cross")) {
    cross.addEventListener("click", () => closePopup());
}

function updateColors(hue) {
    // 40 is orange, 90 is grass green, 120 is pure green, 180 cyan, 210 is nice, 270 purple, 300 pink, 330 magenta

    document.documentElement.style.setProperty(
        "--border-col",
        `hsl(${hue}, 80%, 70%)`
    );

    document.documentElement.style.setProperty(
        "--button-col",
        `hsla(${hue}, 30%, 15%, 0.5)`
    );
}

init();
updateSelectBtn();
updateDeselectBtn();
updateShowToggleBtn();

/*
the showing: $showing is too long and cannot be contained in one line... so it is breaking line, and making the whole thing look pretty weird. can you think of any idea that'd preserve the aesthetics without jeopardizing the affordance of the button (like, i can literally nuke the text : "showing:"... but that'd confuse soo many people what's the button about)...?*/
