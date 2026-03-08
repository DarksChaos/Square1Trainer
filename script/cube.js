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

function allCharsIn(str1, str2) {
    return [...str1].every((char) => str2.includes(char));
}

function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }
}

function replaceWithDict(str, dict) {
    // keys are already sorted longest → shortest
    const pattern = new RegExp(Object.keys(dict).join("|"), "g");
    while (str.replace(pattern, (match) => dict[match]) !== str)
        str = str.replace(pattern, (match) => dict[match]);
    return str;
}

const compareCS = (a, b) =>
    a.length === b.length &&
    a.every(
        (element, index) =>
            (element >= 0 && b[index] >= 0) ||
            (element == -1 && element == b[index])
    );

class Move {
    static Slice = 0b11111111;
    static U = 0b11110000;
    static D = 0b00001111;
    static Move(u, d) {
        return (mod(u, 12) << 4) + mod(d, 12);
    }
    static isSlice(move) {
        return move == this.Slice;
    }
    static Up(move) {
        return (move & this.U) >> 4;
    }
    static Down(move) {
        return move & this.D;
    }
    static Add(a, b) {
        u1 = this.Up(a);
        u2 = this.Up(b);
        d1 = this.Down(a);
        d2 = this.Down(b);
        return this.Move(u1 + u2, d1 + d2);
    }
    static Sub(a, b) {
        u1 = this.Up(a);
        u2 = this.Up(b);
        d1 = this.Down(a);
        d2 = this.Down(b);
        return this.Move(u1 - u2, d1 - d2);
    }
    static toString(move, short = false) {
        if (this.isSlice(move)) return "/";
        let u = this.Up(move);
        let d = this.Down(move);
        if (u > 6) u -= 12;
        if (d > 6) d -= 12;
        if (short) return u + d;
        return "(" + u + ", " + d + ")";
    }
}

class Sequence {
    static parseMove(move) {
        move = move.replace(/[^0-9\/,\-]/g, "");
        if (move == "/") return Move.Slice;
        if (move.includes(",")) {
            // There is a separator
            let nums = move.split(",");
            return Move.Move(parseInt(nums[0]), parseInt(nums[1]));
        } else {
            switch (move.length) {
                case 2:
                    return Move.Move(parseInt(move[0]), parseInt(move[1]));
                case 3:
                    if (move[0] == "-")
                        return Move.Move(
                            parseInt(move.slice(0, 2)),
                            parseInt(move[2])
                        );
                    return Move.Move(
                        parseInt(move[0]),
                        parseInt(move.slice(1))
                    );
                case 4:
                    return Move.Move(
                        parseInt(move.slice(0, 2)),
                        parseInt(move.slice(2))
                    );
            }
        }
    }

    constructor(string) {
        this.moves = [];
        string = string.replace(/[^0-9\/,\-]/g, "");
        let moveTxt = string.split(/(\/)/).filter((part) => part !== "");
        for (let i = 0; i < moveTxt.length; i++) {
            if (moveTxt[i] == "") continue;
            this.moves.push(Sequence.parseMove(moveTxt[i]));
        }
    }

    toString(karn = false) {
        let str = "";
        for (let i = 0; i < this.moves.length; i++) {
            str += Move.toString(this.moves[i]);
        }
        return str;
    }
}

const solved = "A1B2C3D45E6F7G8H-";

// headlights/bars in the back, or FR angle
const TPLL = {
    // NO DP
    "-": "A1B2C3D4",
    Al: "A1C2D3B4",
    Ar: "C1A2B3D4",
    E: "D1C2B3A4",
    F: "D3B2C1A4",
    Gal: "A1C4D2B3",
    Gar: "C2A4B3D1",
    Gol: "A3C1D2B4",
    Gor: "C2A3B1D4",
    H: "A3B4C1D2",
    Ja: "D4B2C3A1",
    Jm: "D1B2C4A3",
    Na: "D4C3B2A1",
    Nm: "B4A3D2C1",
    Rl: "D1B3C2A4",
    Rr: "B4D3A1C2",
    T: "D1B4C3A2",
    Ul: "A3B2C4D1",
    Ur: "A4B2C1D3",
    V: "C2B1A3D4",
    Y: "A2D1C3B4",
    Z: "A2B1C4D3",

    // DP
    Adj: "A1B2C4D3",
    Opp: "A3B2C1D4",
    pJ: "D1B2C3A4",
    pN: "A1D2C3B4",
    Ba: "D4B1C3A2",
    Bm: "D1B3C4A2",
    Cl: "D2B3C1A4",
    Cr: "D3B1C2A4",
    Da: "D2B4C3A1",
    Dm: "D1B4C2A3",
    Ka: "D4B3C2A1",
    Km: "D2B1C4A3",
    M: "D3B4C1A2",
    Ol: "A2B3C4D1",
    Or: "A4B1C2D3",
    Pl: "D4B2C1A3",
    Pr: "D3B2C4A1",
    Q: "D1C4B3A2",
    Sa: "D4C2B3A1",
    Sm: "D1C2B4A3",
    W: "C2D1A3B4",
    X: "D3C2B1A4",
};

let BPLL = {
    // NO DP
    "-": "5E6F7G8H",
    Al: "5G6E7F8H",
    Ar: "5E6G7H8F",
    E: "5H6G7F8E",
    F: "6E5G8H7F",
    Gal: "8E5G7H6F",
    Gar: "8E6G5H7F",
    Gol: "7E5G6H8F",
    Gor: "5E8G6H7F",
    H: "8F5G6H7E",
    Ja: "5E7G8H6F",
    Jm: "7E6G8H5F",
    Na: "7G6F5E8H",
    Nm: "7E6H5G8F",
    Rl: "7F5H8E6G",
    Rr: "7F8H6E5G",
    T: "5F8H7E6G",
    Ul: "6G7H5E8F",
    Ur: "8G6H5E7F",
    V: "7G8F6E5H",
    Y: "7E8H6G5F",
    Z: "8G7H6E5F",

    // DP
    Adj: "8G7H5E6F",
    Opp: "5E8F7G6H",
    pJ: "7F8H5E6G",
    pN: "7E8H5G6F",
    Ba: "5F8H6E7G",
    Bm: "5F7H8E6G",
    Cl: "7F6H8E5G",
    Cr: "7F5H6E8G",
    Da: "6F8H7E5G",
    Dm: "8F5H7E6G",
    Ka: "6F5H8E7G",
    Km: "8F7H6E5G",
    M: "5F6H7E8G",
    Ol: "6G7H8E5F",
    Or: "8G5H6E7F",
    Pl: "6H8F7G5E",
    Pr: "8H5F7G6E",
    Q: "7H6G5F8E",
    Sa: "8H6G7F5E",
    Sm: "6H5G7F8E",
    W: "7E8F6G5H",
    X: "7F6E5H8G",
};

function testPLL(layer, list) {
    for (let [name, value] of Object.entries(list)) {
        if (layer == value) return name;
    }
    return 0;
}

function rotateLayer(layer, full) {
    const n = 6 + full;
    return layer.slice(n) + layer.slice(0, n);
}

function offsetLayer(layer, top) {
    const a = top ? "A".charCodeAt(0) : "E".charCodeAt(0);
    const offnum = top ? 0 : 4;
    let str = "";
    for (const s of layer) {
        if (isNaN(s))
            str += String.fromCharCode(mod(s.charCodeAt(0) - a + 1, 4) + a);
        else str += (mod(parseInt(s), 4) + 1 + offnum).toString();
    }
    return str;
}

function findPLL(layer, top, full = false) {
    const list = top ? TPLL : BPLL;
    const limit = 4 + 4 * full;
    for (let i = 0; i < limit; i++) {
        let base = layer;
        for (let j = 0; j < 4; j++) {
            let pllName = testPLL(base, list);
            if (pllName) return pllName;
            base = offsetLayer(base, top);
        }
        layer = rotateLayer(layer, full);
    }
    return false;
}

// OBL TRAINER IMPORTS

const KARN = {
    "3,0": "U",
    "-3,0": "U'",
    "0,3": "D",
    "0,-3": "D'",
    "3,3": "e",
    "-3,-3": "e'",
    "3,-3": "E",
    "-3,3": "E'",
    "2,-1": "u",
    "-1,2": "d",
    "-4,-1": "F'",
    "-1,-4": "f'",
    "2,-4": "T",
    "-4,2": "t'",
    "2,2": "m",
    "-1,-1": "M'",
    "5,-1": "u2",
    "1,-5": "d2'",
    "-2,1": "u'",
    "1,-2": "d'",
    "4,1": "F",
    "1,4": "f",
    "-2,4": "T'",
    "4,-2": "t",
    "-2,-2": "m'",
    "1,1": "M",
    "-5,1": "u2'",
    "-1,5": "d2",
};

const HIGHKARN = {
    // add spaces for de-ambiguity
    " U U' U U' ": " U4 ",
    " U' U U' U ": " U4' ",
    " D D' D D' ": " D4 ",
    " D' D D' D ": " D4' ",
    " u u' u u' ": " u4 ",
    " u' u u' u ": " u4' ",
    " d d' d d' ": " d4 ",
    " d' d d' d ": " d4' ",

    " U U' U ": " U3 ",
    " U' U U' ": " U3' ",
    " D D' D ": " D3 ",
    " D' D D' ": " D3' ",
    " u u' u ": " u3 ",
    " u' u u' ": " u3' ",
    " d d' d ": " d3 ",
    " d' d d' ": " d3' ",
    " F F' F ": " F3 ",
    " F' F F' ": " F3' ",
    " f f' f ": " f3 ",
    " f' f f' ": " f3' ",

    " U U' ": " W ",
    " U' U ": " W' ",
    " D D' ": " B ",
    " D' D ": " B' ",
    " u u' ": " w ",
    " u' u ": " w' ",
    " d d' ": " b ",
    " d' d ": " b' ",
    " F F' ": " F2 ",
    " F' F ": " F2' ",
    " f f' ": " f2 ",
    " f' f ": " f2' ",

    " 60 ": " U2 ",
    " 63 ": " U2D ",
    " 6-3 ": " U2D' ",
    " 66 ": " U2D2 ",
    " 06 ": " D2 ",
    " 36 ": " UD2 ",
    " -36 ": " U'D2 ",

    " U U ": " UU ",
    " U' U' ": " UU' ",
    " D D ": " DD ",
    " D' D' ": " DD' ",
};
// if the following moves accur, replace them with optimized ones
// UPDATE THIS
const OPTIM = {
    "/0,0/": "", // special case, handled in optimize()
    "/3,3/3,3/": "-3,-3/-3,-3",
    "/-3,-3/-3,-3/": "3,3/3,3",
    "/2,2/-2,-2/": "2,2/-2,-2",
    "/-2,-2/2,2/": "-2,-2/2,2",
    "/1,1/-1,-1/": "1,1/-1,-1",
    "/-1,-1/1,1/": "-1,-1/1,1",
    "/2,-4/-2,4/2,-4/": "2,-4/-2,4/2,-4",
    "/-2,4/2,-4/-2,4/": "-2,4/2,-4/-2,4",
    "/5,-1/-5,1/5,-1/": "5,-1/-5,1/5,-1",
    "/-5,1/5,-1/-5,1/": "-5,1/5,-1/-5,1"
}

const OPTIM_KEYS = Array.from(Object.keys(OPTIM)); // array of keys

function karnify(scramble) {
    // scramble: e.g. "4,-3/-3,0/-1,2/1,-2/-1,2/3,3/-2,-2/3,3/-3,0/-1,2/3,3/3,3/-2,4/-1,0"
    // returns "4-3 U' d3 e m' e U' d e e T' -10"
    scramble = scramble.split("/");
    let newMoves = [];
    // first level karnify
    for (let move of scramble) {
        if (move in KARN) {
            newMoves.push(KARN[move]);
        } else {
            newMoves.push(move.replace(",", ""));
        }
    }
    let firstKarn = newMoves.join(" ");
    // second level karnify
    let secondKarn = replaceWithDict(firstKarn, HIGHKARN);
    return secondKarn;
}

function legalMove(move) {
    // move: (int) -10 ~ 12 (i think)
    // returns: -5 ~ 6
    if (move < -5) {
        return move + 12;
    }
    else if (move > 6) {
        return move - 12;
    }
    return move;
}

function addMoves(move1, move2) {
    // move1/2: "3,-3" or "A", "a"; cannot both be alignments
    let alignments = false;
    let startA;
    if (move1.toLowerCase() === "a" || move2.toLowerCase() === "a") {
        alignments = true;
        let Atranslation = {"A": "a", "a": "A"};
        if (move1 in Atranslation) {
            return changesAlignment(parseInt(move2.split(",")[0], 10)) ? Atranslation[move1] : move1;
        }
        if (move2 in Atranslation) {
            return changesAlignment(parseInt(move1.split(",")[0], 10)) ? Atranslation[move2] : move2;
        }
    }
    move1 = move1.split(",");
    move2 = move2.split(",");
    result = [legalMove(parseInt(move1[0],10) + parseInt(move2[0],10)),
                legalMove(parseInt(move1[1],10) + parseInt(move2[1],10))];
    return result.join(",");
}

function optimize(scramble) {
    // scramble: "A/-3,-3/0,3/0,-3/-1,-4/-3,0/3,0/0,-3/0,3/a"
    while (replaceWithDict(scramble, OPTIM) !== scramble) {
        // optimize needed
        console.log(`preoptim: ${scramble}`);
        let moves = scramble.split("/");
        // moves now in ["A","3,-3", "3,0", "a"]
        let atSlice = 0; // the index of the next move in "moves"
        let cycleCompleted = false;
        for (let i = 0; i < scramble.length; i++) {
            // going over every character of scramble
            if (cycleCompleted) break;
            if (scramble.at(i) !== "/") continue;
            atSlice++;
            for (let optimable of OPTIM_KEYS) {
                // avoid getting the last "a" also
                if (scramble.length - 1-i < optimable.length) continue;
                if (scramble.slice(i, i+optimable.length) === optimable) {
                    // match!!
                    if (optimable === "/0,0/") {
                        // special case
                        moves[atSlice-1] = addMoves(moves[atSlice-1], moves[atSlice+1]);
                        moves.splice(atSlice, 2);
                        scramble = moves.join("/")
                        cycleCompleted = true;
                        break;
                    }
                    let optimableLen = optimable.split("/").length;
                    let optimTo = OPTIM[optimable].split("/"); // no slice at beginning/end
                    let delSliceNum = optimableLen - 2;
                    moves[atSlice-1] = addMoves(moves[atSlice-1], optimTo.shift());
                    moves[atSlice+optimableLen-2] = addMoves(moves[atSlice+optimableLen-2], optimTo.pop());
                    // now optimTo has the two merged moves removed
                    moves.splice(atSlice, delSliceNum, ...optimTo);
                    scramble = moves.join("/")
                    cycleCompleted = true;
                    break;
                }
            }
        }
    }
    return scramble;
}

class Cube {
    constructor(descriptor) {
        this.setPosition(descriptor);
    }

    setPosition(position) {
        const l = position.length;
        // top layer
        this.topPieces = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
        let tcorners = 0;
        let i = 0;
        for (; i + tcorners < 12; i++) {
            let l = position[i];
            this.topPieces[i + tcorners] = solved.indexOf(l);
            if (isNaN(l)) {
                tcorners++;
            }
        }
        this.botPieces = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
        let bcorners = 0;
        for (let i = 12 - tcorners; i + bcorners + tcorners < 24; i++) {
            let l = position[i];
            let idx = i + bcorners + tcorners - 12;
            this.botPieces[idx] = solved.indexOf(l);
            if (isNaN(l)) {
                bcorners++;
            }
        }
        this.barflip = position[16] == "/" || position[16] == "+";
    }

    topLayerString() {
        let str = "";
        for (let i = 0; i < 12; i++) {
            let number = this.topPieces[i];
            if (number == -1) continue;
            str += solved[number];
        }
        return str;
    }

    botLayerString() {
        let str = "";
        for (let i = 0; i < 12; i++) {
            let number = this.botPieces[i];
            if (number == -1) continue;
            str += solved[number];
        }
        return str;
    }

    barChar(flip = this.barflip) {
        return (flip ? "+" : "-").toString();
    }

    isOblSolved() {
        return (
            this.topPieces.every((n) => n < 8) &&
            this.botPieces.every((n) => n > 7 || n == -1)
        );
    }

    pblCase(full = true) {
        const top = findPLL(this.topLayerString(), true, full);
        const bot = findPLL(this.botLayerString(), false, full);
        const bf = (this.barflip ? "+" : "-").toString();
        if (top == "-") return ":" + bot + bf;
        if (bot == "-") return top + ":" + bf;
        return top + "/" + bot + bf;
    }

    setPBL(top, bot, preU, preD, u, d, flip) {
        preU = mod(preU, 4);
        preD = mod(preD, 4);
        u = mod(u, 8);
        d = mod(d, 8);
        let topStr = TPLL[top];
        let botStr = BPLL[bot];
        for (; preU > 0; preU--) topStr = offsetLayer(topStr, true);
        for (; preD > 0; preD--) botStr = offsetLayer(botStr, false);
        for (; u > 0; u--) topStr = rotateLayer(topStr, true);
        for (; d > 0; d--) botStr = rotateLayer(botStr, true);
        this.setPosition(topStr + botStr + this.barChar(flip));
    }

    descriptor() {
        return this.topLayerString() + this.botLayerString() + this.barChar();
    }

    isStrictCubeShape() {
        // aligned
        return (
            compareCS(
                this.topPieces,
                [0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0]
            ) &&
            compareCS(this.botPieces, [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1])
        );
    }

    isSliceable(u, d) {
        if (
            this.topPieces[mod(-u, 12)] == -1 ||
            this.topPieces[mod(-u + 6, 12)] == -1
        ) {
            return false;
        }
        if (
            this.botPieces[mod(-d, 12)] == -1 ||
            this.botPieces[mod(-d + 6, 12)] == -1
        ) {
            return false;
        }
        return true;
    }

    nextSliceables() {
        let tp = 6,
            tn = -6,
            bp = 6,
            bn = -6;
        for (let i = 1; i <= 6; i++) {
            if (this.isSliceable(i, 0)) {
                tp = i;
                break;
            }
        }
        for (let i = -1; i >= -6; i--) {
            if (this.isSliceable(i, 0)) {
                tn = i;
                break;
            }
        }
        for (let i = 1; i <= 6; i++) {
            if (this.isSliceable(0, i)) {
                bp = i;
                break;
            }
        }
        for (let i = -1; i >= -6; i--) {
            if (this.isSliceable(0, i)) {
                bn = i;
                break;
            }
        }
        return [tp, tn, bp, bn];
    }

    applySequence(sequence) {
        for (let i = 0; i < sequence.moves.length; i++) {
            this.applyMove(sequence.moves[i]);
        }
    }

    applyMove(move) {
        if (Move.isSlice(move)) {
            this.slice();
            return;
        }
        this.turn(Move.Up(move), Move.Down(move));
    }

    turn(u, d) {
        if (!this.isSliceable(u, d)) {
            console.error("destination unsliceable");
            return;
        }
        // top
        let tempPieces = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
        for (let i = 0; i < 12; i++) {
            tempPieces[i] = this.topPieces[mod(i - u, 12)];
        }
        for (let i = 0; i < 12; i++) {
            this.topPieces[i] = tempPieces[i];
        }
        // bottom
        tempPieces = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];

        for (let i = 0; i < 12; i++) {
            tempPieces[i] = this.botPieces[mod(i - d, 12)];
        }
        for (let i = 0; i < 12; i++) {
            this.botPieces[i] = tempPieces[i];
        }
    }

    slice() {
        if (this.topPieces[0] == -1 || this.topPieces[6] == -1) {
            console.error("Unsliceable on top layer");
            return;
        }
        if (this.botPieces[0] == -1 || this.botPieces[6] == -1) {
            console.error("Unsliceable on bottom layer");
            return;
        }
        // swap top[6:11] with bot[0:5]
        // Save all values
        let lt = this.topPieces.slice(0, 6);
        let rt = this.topPieces.slice(6);
        let lb = this.botPieces.slice(6);
        let rb = this.botPieces.slice(0, 6);

        // Assign new values
        this.topPieces = lt.concat(rb);
        this.botPieces = rt.concat(lb);

        // change barflip
        this.barflip = !this.barflip;
    }
}

// Variables
const evenPLL = Object.keys(TPLL).slice(0, 22);
const oddPLL = Object.keys(TPLL).slice(22);

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
let generators;
let hasActiveScramble = false;
let isPopupOpen = false;

let lastRemoved;
let selectedCount = 0;

const weight = {
    "-": 1,
    E: 2,
    H: 1,
    Na: 1,
    Nm: 1,
    Opp: 2,
    Ol: 1,
    Or: 1,
    pN: 2,
    Q: 1,
    X: 1,
    Z: 2,
};

const PLLextndlen = {
    // NO DP
    "-": 1,
    Al: 2,
    Ar: 2,
    E: 1,
    F: 1,
    Gal: 4,
    Gar: 4,
    Gol: 4,
    Gor: 4,
    H: 1,
    Ja: 2,
    Jm: 2,
    Na: 2,
    Nm: 2,
    Rl: 2,
    Rr: 2,
    T: 1,
    Ul: 2,
    Ur: 2,
    V: 1,
    Y: 1,
    Z: 1,

    // DP
    Adj: 1,
    Opp: 1,
    pJ: 1,
    pN: 1,
    Ba: 2,
    Bm: 2,
    Cl: 2,
    Cr: 2,
    Da: 2,
    Dm: 2,
    Ka: 2,
    Km: 2,
    M: 1,
    Ol: 2,
    Or: 2,
    Pl: 2,
    Pr: 2,
    Q: 1,
    Sa: 2,
    Sm: 2,
    W: 1,
    X: 1
};

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

// the first element is for mobile, the second is for pc
const eachCaseEls = document.querySelectorAll(".allcases");
const karnEls = document.querySelectorAll(".karn");
const weightEls = document.querySelectorAll(".weight");
const settingList = [eachCaseEls, karnEls, weightEls];

const removeLastEl = document.getElementById("unselprev");

// Selection buttons
const selectAllEl = document.getElementById("sela");
const deselectAllEl = document.getElementById("desela");
const selectTheseEl = document.getElementById("selt");
const deselectTheseEl = document.getElementById("deselt");
const showSelectionEl = document.getElementById("showselected");
const showAllEl = document.getElementById("showall");
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

// localStorage wrapper with PBL suffix
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

    if (storageSelectedPBL !== null) {
        selectedPBL = JSON.parse(storageSelectedPBL);
        for (let k of selectedPBL) {
            selectPBL(k);
            selectedCount++;
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
        // First ever load — select all cases
        for (let pbl of possiblePBL) {
            selectPBL(pblname(pbl));
        }
        saveSelectedPBL();
    }
    updateSelCount();

    const storageUserLists = storage.getItem("userLists");
    if (storageUserLists !== null) {
        userLists = JSON.parse(storageUserLists);
        for (list of Object.keys(userLists)) {
            if (!Array.isArray(userLists[list])) {
                console.log("Non array")
                formattedList = []
                for (i of possiblePBL) {
                    if (userLists[list][pblname(i)] == 1) {
                        formattedList.push(pblname(i))
                    }
                }
                userLists[list] = formattedList.copyWithin()
            }
        }
        addUserLists();
    }
}

function saveSelectedPBL() {
    storage.setItem("selected", JSON.stringify(selectedPBL));
    // this is === 0 cuz genScram() has a if statement that deletes the scram if so
    if (!hasActiveScramble || selectedPBL.length == 0) generateScramble();
    else if (
        !selectedPBL.includes(currentCase.slice(0, currentCase.length - 1)) &&
        currentCase != ""
    ) // regenerate the scram if the scram's case was deselected
        generateScramble(true);
}

function updateSelCount() {
    selCountEl.textContent = "Selected: " + selectedCount;
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

    // Load generators
    // await fetch("./generators.json")
    //     .then((response) => {
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! Status: ${response.status}`);
    //         }
    //         return response.json();
    //     })
    //     .then((data) => {
    //         generators = data;
    //         // Load local storage data only after generators
    //         // have been loaded, so we can generate a scramble
    //         getLocalStorageData(true);
    //     })
    //     .catch((error) => console.error("Failed to fetch data:", error));
    
    getLocalStorageData(true);

    lastRemoved = "";

    // Add event listener to all case buttons, so we can click them
    document.querySelectorAll(".case").forEach((caseEl) => {
        caseEl.addEventListener("click", () => {
            const isChecked = caseEl.classList.contains("checked");
            let n = caseEl.id;
            if (isChecked) {
                deselectPBL(n);
            } else {
                selectPBL(n);
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
            addDefaultLists();
        })
        .catch((error) => console.error("Failed to fetch data:", error));
}

function isPll(pll, filter) {
    const special = ["opp", "adj", "pn", "pj"];
    if (special.includes(pll)) {
        return filter == pll;
    }
    return pll.startsWith(filter);
}

function passesFilter(pbl, filter) {
    let u = pbl[0].toLowerCase();
    let d = pbl[1].toLowerCase();
    filter = filter.replace("/", " ").toLowerCase();
    if (filter.includes(" ")) {
        arr = filter.match(/[^ ]+/g);
        if (arr != null) {
            arr = arr.slice(0, 2);
            [a, b] = arr.slice(0, 2);
            if (a && b) {
                return (
                    (isPll(u, a) && isPll(d, b)) || (isPll(u, b) && isPll(d, a))
                );
            }
            filter = a; //  if we type 'Pl/' take 'Pl' as the filter
        }
    }
    return isPll(u, filter) || isPll(d, filter);
}

function generateScramble(regen = false) {
    let eachCaseAlert = false;
    if (scrambleOffset >= 0 && !regen && scrambleList.length > 0 && selectedPBL.length === 0) {
        // user probably timed one of the prev scrams
        displayPrevScram();
        currentScrambleEl.textContent = scrambleList.at(-1 - scrambleOffset)[
            usingKarn
        ];
        return;
    } else if (scrambleOffset < 0) scrambleOffset = 0;
    if (selectedPBL.length === 0) {
        timerEl.textContent = "--:--";
        currentScrambleEl.textContent = "Scramble will show up here";
        previousScrambleEl.textContent = "Last scramble will show up here";
        hasActiveScramble = false;
        scrambleList = [];
        return;
    }
    if (remainingPBL.length === 0) {
        // start a new cycle
        if (eachCase === 1) eachCaseAlert = true;
        enableGoEachCase();
    }
    let caseNum = randInt(0, remainingPBL.length - 1);
    let pblChoice = remainingPBL.splice(caseNum, 1)[0];

    let barflip = "-+"[randInt(0, 1)]
    let scramble = optimize(window.scrambler.getScramble(pblChoice, barflip));
    pblChoice += barflip;

    previousCase = currentCase; // e.g. "Al/Ar+"
    currentCase = pblChoice;


    // scramble = generators[pblChoice];
    // Add random begin and end layer moves
    // let s = scramble[0];
    // let e = scramble[scramble.length - 1];
    // let start;
    // let end;
    // if (s === "A") {
    //     start = [randrange(-5, 5, 3), randrange(-3, 7, 3)];
    // } else {
    //     start = [randrange(-3, 7, 3), randrange(-4, 6, 3)];
    // }
    // if (e === "A") {
    //     end = [randrange(-4, 6, 3), randrange(-3, 7, 3)];
    // } else {
    //     end = [randrange(-3, 7, 3), randrange(-5, 5, 3)];
    // }

    // let final = [
    //     (start.join(",") + scramble.slice(1, -1) + end.join(",")).replaceAll(
    //         "/",
    //         " / "
    //     ),
    //     start.join("") + karnify(scramble).slice(1, -1) + end.join(""),
    //     currentCase,
    // ];
    let final = [scramble.replaceAll("/", " / "), karnify(scramble), currentCase];

    if (regen) {
        scrambleList[scrambleList.length - 1] = final;
        // set current scram only if we are on the current scram
        if (scrambleOffset === 0)
            currentScrambleEl.textContent = final[usingKarn];
    } else {
        if (scrambleList.length != 0) {
            previousScramble = scrambleList[scrambleList.length - 1];
            previousScrambleEl.textContent =
                "Previous scramble: " +
                scrambleList.at(-1)[usingKarn] +
                " (" +
                scrambleList.at(-1)[2] +
                ")";
        }
        currentScrambleEl.textContent = final[usingKarn];
        scrambleList.push(final);
    }
    if (!hasActiveScramble) timerEl.textContent = "0.00"; // prob for first scram (who is prob, idk)
    hasActiveScramble = true;
    if (eachCaseAlert)
        setTimeout(function () {
            alert("You have gone through each case!");
        }, 100);
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

function selectPBL(pbl) {
    document.getElementById(pbl).classList.add("checked");
    if (!selectedPBL.includes(pbl)) {
        selectedPBL.push(pbl);
        selectedCount++;
        updateSelCount();
    }
    if (eachCase > 0 && !remainingPBL.includes(pbl)) {
        remainingPBL = remainingPBL.concat(Array(eachCase).fill(pbl));
    }
}

function deselectPBL(pbl) {
    document.getElementById(pbl).classList.remove("checked");
    if (selectedPBL.includes(pbl)) {
        selectedPBL = selectedPBL.filter((a) => a != pbl);
        selectedCount--;
        updateSelCount();
    }
    if (eachCase && remainingPBL.includes(pbl)) {
        remainingPBL = remainingPBL.filter((a) => a != pbl);
    }
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
        content += `
        <div id="${k}" class=\"list-item\">${k} (${
            userLists[k].length
        })</div>`;
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
        content += `
        <div id="${k}" class=\"list-item\">${k} (${
            defaultLists[k].length
        })</div>`;
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

    if (Array.isArray(list)) {
        for (let pbl of possiblePBL) {
            hidePBL(pblname(pbl));
        }
        for (let pbl of list) {
            showPBL(pbl);
        }
    } else {
        // Legacy handling
        for (let [pbl, inlist] of Object.entries(list)) {
            if (inlist) {
                showPBL(pbl);
            } else {
                hidePBL(pbl);
            }
        }
    }

    if (setSelection) {
        deselectAll()
        selectThese();
        saveSelectedPBL();
        selCountEl.textContent = "Selected list: " + listName;
    } else {
        selCountEl.textContent = "Viewing list: " + listName;
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
    // pbl: "Al/Ar"
    pbl = pbl.split("/");
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

filterInputEl.addEventListener("input", () => {
    filterInputEl.value = filterInputEl.value.replace(/[^a-zA-Z0-9/\- ]+/g, "");
    setHighlightedList(null);
    if (filterInputEl.value.slice(0, 4).toLowerCase() === "freq") {
        if (
            !["1", "2", "4", "8", "16", "32", "64", "128", "256"].includes(
                filterInputEl.value.slice(4).trim()
            )
        ) {
            // no pbl is the given frequency
            for (let pbl of possiblePBL) {
                const n = pblname(pbl);
                hidePBL(n);
            }
        } else {
            let freq = parseInt(filterInputEl.value.slice(4).trim(), 10);
            for (let pbl of possiblePBL) {
                const n = pblname(pbl);
                if (getWeight(n) * getCaseCount(pbl) === freq) {
                    showPBL(n);
                } else {
                    hidePBL(n);
                }
            }
        }
    } else {
        for (let pbl of possiblePBL) {
            const n = pblname(pbl);
            if (passesFilter(pbl, filterInputEl.value)) {
                showPBL(n);
            } else {
                hidePBL(n);
            }
        }
    }
    updateSelCount();
});

function selectAll() {
    if (usingTimer()) return;
    for (let pbl of possiblePBL) {
        selectPBL(pblname(pbl));
    }
    saveSelectedPBL();
}

selectAllEl.addEventListener("click", selectAll);

function deselectAll() {
    if (usingTimer()) return;
    for (let pbl of possiblePBL) {
        deselectPBL(pblname(pbl));
    }
    saveSelectedPBL();
}

deselectAllEl.addEventListener("click", deselectAll);

function selectThese() {
    if (usingTimer()) return;
    for (let i of pblListEl.children) {
        if (!i.classList.contains("hidden")) {
            selectPBL(i.id);
        }
    }
    saveSelectedPBL();
}

selectTheseEl.addEventListener("click", selectThese);

function deselectThese() {
    if (usingTimer()) return;
    for (let i of pblListEl.children) {
        if (!i.classList.contains("hidden")) {
            deselectPBL(i.id);
        }
    }
    saveSelectedPBL();
}

deselectTheseEl.addEventListener("click", deselectThese);

function showAllClick() {
    if (usingTimer()) return;
    showAll();
}

showAllEl.addEventListener("click", showAllClick);

function showSelection() {
    if (usingTimer()) return;
    for (let pbl of possiblePBL) {
        const n = pblname(pbl);
        if (selectedPBL.includes(n)) {
            showPBL(n);
        } else {
            hidePBL(n);
        }
    }
    updateSelCount();
}

showSelectionEl.addEventListener("click", showSelection);

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
    const isMobileView = window.getComputedStyle(document.querySelector('.visible-mobile')).display !== 'none';
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
        deselectPBL(previousCase.slice(0, previousCase.length - 1));
        lastRemoved = previousCase.slice(0, previousCase.length - 1);
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

// fun little thing
function updateColors() {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;

    // Cycle hue 0–360 throughout the day
    const hue = (hours / 24) * 360;

    document.documentElement.style.setProperty(
        "--border-col",
        `hsl(${hue}, 80%, 70%)`
    );

    document.documentElement.style.setProperty(
        "--button-col",
        `hsla(${hue}, 30%, 15%, 0.5)`
    );
}

updateColors();
setInterval(updateColors, 60 * 1000);

init();
