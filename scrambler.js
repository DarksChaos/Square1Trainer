const NonParityCases = {
    "-": { top: "011233455677", bottom: "998bbaddcffe" },
    Al: { top: "211455633077", bottom: "99edd8bbaffc" },
    Ar: { top: "611055233477", bottom: "99addcbbeff8" },
    E: { top: "033211477655", bottom: "bb899affcdde" },
    F: { top: "011655433277", bottom: "99cddabb8ffe" },
    Gal: { top: "611455033277", bottom: "99cddebbaff8" },
    Gar: { top: "211655033477", bottom: "99addebb8ffc" },
    Gol: { top: "411055633277", bottom: "99cdd8bbeffa" },
    Gor: { top: "411655233077", bottom: "99eddcbb8ffa" },
    H: { top: "411633055277", bottom: "99cbbedd8ffa" },
    Ja: { top: "011455233677", bottom: "998ddcbbaffe" },
    Jm: { top: "011255633477", bottom: "99add8bbcffe" },
    Na: { top: "455233011677", bottom: "998ffeddcbba" },
    Nm: { top: "411277055633", bottom: "dd8bbe99cffa" },
    Rl: { top: "611255433077", bottom: "99eddabbcff8" },
    Rr: { top: "211055433677", bottom: "998ddabbeffc" },
    T: { top: "411255033677", bottom: "998ddebbcffa" },
    Ul: { top: "611233055477", bottom: "99abbeddcff8" },
    Ur: { top: "411233655077", bottom: "99ebb8ddcffa" },
    V: { top: "655233411077", bottom: "99effaddcbb8" },
    Y: { top: "255033411677", bottom: "998ffaddebbc" },
    Z: { top: "211033655477", bottom: "99abb8ddeffc" },
};

const ParityCases = {
    Adj: { top: "011233655477", bottom: "99abb8ddcffe" },
    Opp: { top: "411233055677", bottom: "998bbeddcffa" },
    pJ: { top: "011255433677", bottom: "998ddabbcffe" },
    pN: { top: "055233411677", bottom: "998ffaddcbbe" },
    Ba: { top: "211455033677", bottom: "998ddebbaffc" },
    Bm: { top: "611255033477", bottom: "99addebbcff8" },
    Cl: { top: "611055433277", bottom: "99cddabbeff8" },
    Cr: { top: "211655433077", bottom: "99eddabb8ffc" },
    Da: { top: "411055233677", bottom: "998ddcbbeffa" },
    Dm: { top: "411255633077", bottom: "99edd8bbcffa" },
    Ka: { top: "611455233077", bottom: "99eddcbbaff8" },
    Km: { top: "211055633477", bottom: "99add8bbeffc" },
    M: { top: "411655033277", bottom: "99cddebb8ffa" },
    Ol: { top: "611033255477", bottom: "99abbcddeff8" },
    Or: { top: "211433655077", bottom: "99ebb8ddaffc" },
    Pl: { top: "011455633277", bottom: "99cdd8bbaffe" },
    Pr: { top: "011655233477", bottom: "99addcbb8ffe" },
    Q: { top: "255033611477", bottom: "99aff8ddebbc" },
    Sa: { top: "211677455033", bottom: "ddebba998ffc" },
    Sm: { top: "655033411277", bottom: "99cffaddebb8" },
    W: { top: "211633055477", bottom: "99abbedd8ffc" },
    X: { top: "655433211077", bottom: "99effcddabb8" },
};

// ============================================================================
// MATH STUFF
// ============================================================================

function getNPerm(arr, n) {
    if (n === undefined) n = arr.length;
    var idx = 0;
    for (var i = 0; i < n; i++) {
        idx *= (n - i);
        for (var j = i + 1; j < n; j++) {
            if (arr[i] > arr[j]) {
                idx++;
            }
        }
    }
    return idx;
}

function setNPerm(arr, idx, n) {
    if (n === undefined) n = arr.length;
    arr.length = n;
    for (var i = n - 1; i >= 0; i--) {
        arr[i] = idx % (n - i);
        idx = ~~(idx / (n - i));
        for (var j = i + 1; j < n; j++) {
            if (arr[j] >= arr[i]) arr[j]++;
        }
    }
}

function circle(arr) {
    var leng = arguments.length - 1;
    var temp = arr[arguments[leng]];
    for (var i = leng; i > 1; i--) {
        arr[arguments[i]] = arr[arguments[i - 1]];
    }
    arr[arguments[1]] = temp;
    return circle;
}

// ============================================================================
// SQUARE-1 MODEL
// ============================================================================

class SqCubie {
    constructor() {
        this.ul = 0x011233; // everything is ccw for some reason
        this.ur = 0x455677;
        this.dl = 0x998bba; // this is actually the DR block... 9 is DBR
        this.dr = 0xddcffe; // and this is DL
        this.ml = 0;
    }

    toString() {
        return this.ul.toString(16).padStart(6, 0) +
            this.ur.toString(16).padStart(6, 0) +
            "|/".charAt(this.ml) +
            this.dl.toString(16).padStart(6, 0) +
            this.dr.toString(16).padStart(6, 0);
    }

    pieceAt(idx) {
        var ret;
        if (idx < 6) {
            ret = this.ul >> ((5 - idx) << 2);
        } else if (idx < 12) {
            ret = this.ur >> ((11 - idx) << 2);
        } else if (idx < 18) {
            ret = this.dl >> ((17 - idx) << 2);
        } else {
            ret = this.dr >> ((23 - idx) << 2);
        }
        return ret & 0xf;
    }

    setPiece(idx, value) {
        if (idx < 6) {
            this.ul &= ~(0xf << ((5 - idx) << 2));
            this.ul |= value << ((5 - idx) << 2);
        } else if (idx < 12) {
            this.ur &= ~(0xf << ((11 - idx) << 2));
            this.ur |= value << ((11 - idx) << 2);
        } else if (idx < 18) {
            this.dl &= ~(0xf << ((17 - idx) << 2));
            this.dl |= value << ((17 - idx) << 2);
        } else {
            this.dr &= ~(0xf << ((23 - idx) << 2));
            this.dr |= value << ((23 - idx) << 2);
        }
    }

    copy(c) {
        this.ul = c.ul;
        this.ur = c.ur;
        this.dl = c.dl;
        this.dr = c.dr;
        this.ml = c.ml;
    }

    doMove(move) {
        var temp;
        move <<= 2;
        if (move > 24) {
            move = 48 - move;
            temp = this.ul;
            this.ul = (this.ul >> move | this.ur << 24 - move) & 0xffffff;
            this.ur = (this.ur >> move | temp << 24 - move) & 0xffffff;
        } else if (move > 0) {
            temp = this.ul;
            this.ul = (this.ul << move | this.ur >> 24 - move) & 0xffffff;
            this.ur = (this.ur << move | temp >> 24 - move) & 0xffffff;
        } else if (move == 0) {
            temp = this.ur;
            this.ur = this.dl;
            this.dl = temp;
            this.ml = 1 - this.ml;
        } else if (move >= -24) {
            move = -move;
            temp = this.dl;
            this.dl = (this.dl << move | this.dr >> 24 - move) & 0xffffff;
            this.dr = (this.dr << move | temp >> 24 - move) & 0xffffff;
        } else if (move < -24) {
            move = 48 + move;
            temp = this.dl;
            this.dl = (this.dl >> move | this.dr << 24 - move) & 0xffffff;
            this.dr = (this.dr >> move | temp << 24 - move) & 0xffffff;
        }
    }
}

// ============================================================================
// Square Class
// ============================================================================

class Square {
    constructor() {
        this.botEdgeFirst = false;
        this.cornperm = 0;
        this.edgeperm = 0;
        this.ml = 0;
        this.topEdgeFirst = false;
    }
}

// Global Square tables
let SquarePrun = [];
let Square_TwistMove = [];
let Square_TopMove = [];
let Square_BottomMove = [];

function initSquareTables() {
    var i, pos, check, depth, done, find, idx, idxx, inv, m, ml;

    pos = [];
    for (i = 0; i < 40320; ++i) {
        setNPerm(pos, i, 8);
        circle(pos, 2, 4)(pos, 3, 5);
        Square_TwistMove[i] = getNPerm(pos, 8);
        setNPerm(pos, i, 8);
        circle(pos, 0, 3, 2, 1);
        Square_TopMove[i] = getNPerm(pos, 8);
        setNPerm(pos, i, 8);
        circle(pos, 4, 7, 6, 5);
        Square_BottomMove[i] = getNPerm(pos, 8);
    }

    for (i = 0; i < 80640; ++i) {
        SquarePrun[i] = -1;
    }
    SquarePrun[0] = 0;
    depth = 0;
    done = 1;

    while (done < 80640) {
        inv = depth >= 11;
        find = inv ? -1 : depth;
        check = inv ? depth : -1;
        ++depth;
        OUT: for (i = 0; i < 80640; ++i) {
            if (SquarePrun[i] == find) {
                idx = i >> 1;
                ml = i & 1;
                idxx = Square_TwistMove[idx] << 1 | 1 - ml;
                if (SquarePrun[idxx] == check) {
                    ++done;
                    SquarePrun[inv ? i : idxx] = depth;
                    if (inv)
                        continue OUT;
                }
                idxx = idx;
                for (m = 0; m < 4; ++m) {
                    idxx = Square_TopMove[idxx];
                    if (SquarePrun[idxx << 1 | ml] == check) {
                        ++done;
                        SquarePrun[inv ? i : idxx << 1 | ml] = depth;
                        if (inv)
                            continue OUT;
                    }
                }
                for (m = 0; m < 4; ++m) {
                    idxx = Square_BottomMove[idxx];
                    if (SquarePrun[idxx << 1 | ml] == check) {
                        ++done;
                        SquarePrun[inv ? i : idxx << 1 | ml] = depth;
                        if (inv)
                            continue OUT;
                    }
                }
            }
        }
    }
}

// ============================================================================
// Search Class
// ============================================================================

class Search {
    constructor() {
        this.Search_move = [];
        this.Search_d = new SqCubie();
        this.Search_sq = new Square();
        this.Search_c = null;
        this.Search_length1 = 0;
        this.Search_maxlen2 = 0;
        this.Search_sol_string = null;
        this.topEdgeFirst = false;
        this.botEdgeFirst = true;
    }

    fullCubeGetSquare(obj, sq) {
        var a, b;
        var prm = [];
        for (a = 0; a < 8; ++a) {
            prm[a] = obj.pieceAt(a * 3 + 1) >> 1;
        }
        sq.cornperm = getNPerm(prm, 8);
        sq.topEdgeFirst = obj.pieceAt(0) == obj.pieceAt(1);
        a = sq.topEdgeFirst ? 2 : 0;
        for (b = 0; b < 4; a += 3, ++b)
            prm[b] = obj.pieceAt(a) >> 1;
        sq.botEdgeFirst = obj.pieceAt(12) == obj.pieceAt(13);
        a = sq.botEdgeFirst ? 14 : 12;
        for (; b < 8; a += 3, ++b)
            prm[b] = obj.pieceAt(a) >> 1;
        sq.edgeperm = getNPerm(prm, 8);
        sq.ml = obj.ml;
    }

    move2string(len) {
        var s = "";
        var top = 0, bottom = 0;
        for (var i = len - 1; i >= 0; i--) {
            var val = this.Search_move[i];
            if (val > 0) {
                val = 12 - val;
                top = (val > 6) ? (val - 12) : val;
            } else if (val < 0) {
                val = 12 + val;
                bottom = (val > 6) ? (val - 12) : val;
            } else {
                var twst = "/";
                if (top == 0 && bottom == 0) {
                    s += twst;
                } else {
                    s += " (" + top + "," + bottom + ")" + twst;
                }
                top = bottom = 0;
            }
        }
        if (top == 0 && bottom == 0) { } else {
            s += " (" + top + "," + bottom + ") ";
        }
        return s;
    }

    init2() {
        var corner, edge, i, j, ml, prun;
        this.Search_d.copy(this.Search_c);
        for (i = 0; i < this.Search_length1; ++i) {
            this.Search_d.doMove(this.Search_move[i]);
        }
        this.fullCubeGetSquare(this.Search_d, this.Search_sq);
        edge = this.Search_sq.edgeperm;
        corner = this.Search_sq.cornperm;
        ml = this.Search_sq.ml;
        prun = Math.max(SquarePrun[this.Search_sq.edgeperm << 1 | ml], SquarePrun[this.Search_sq.cornperm << 1 | ml]);
        for (i = prun; i < this.Search_maxlen2; ++i) {
            if (this.solvePhase2(edge, corner, this.Search_sq.topEdgeFirst, this.Search_sq.botEdgeFirst, ml, i, this.Search_length1, 0)) {
                for (j = 0; j < i; ++j) {
                    this.Search_d.doMove(this.Search_move[this.Search_length1 + j]);
                }
                this.Search_sol_string = this.move2string(i + this.Search_length1);
                return true;
            }
        }
        return false;
    }

    solvePhase1() {
        let topEdgeFirst = this.topEdgeFirst;
        let botEdgeFirst = this.botEdgeFirst;
        const topVarSet = [1, 4, 7, 10];
        const bottomReverseVarSet = [-1, -4, -10];
        const topReverseVarSet = [11, 8, 5, 2];
        const bottomVarSet = [-11, -8, -2];
        const topFixedSet = [12, 3, 9];
        const bottomFixedSet = [-12, -3, -9];

        let initialState;
        if (!topEdgeFirst && botEdgeFirst) {
            initialState = 0; // no misalign (trust me)
        } else if (topEdgeFirst && botEdgeFirst) {
            initialState = 1; // top misalign
        } else if (!topEdgeFirst && !botEdgeFirst) {
            initialState = 2; // bottom misalign
        } else if (topEdgeFirst && !botEdgeFirst) {
            initialState = 3; // double misalign
        }

        let middlePath = [];
        for (let i = 0; i < this.Search_length1 / 3; i++) {
            let newState;
            if (i >= 2 && middlePath[i-1] === middlePath[i-2]) {
                newState = middlePath[i-1] === 1 ? 2 : 1;
            } else {
                newState = Math.random() < 0.5 ? 1 : 2;
            }
            middlePath.push(newState);
        }
        
        let statePath = [initialState, ...middlePath];
        // console.log(`State path: ${statePath.join(' -> ')}`);

        for (let depth = 0; depth < statePath.length - 1; depth++) {
            const fromState = statePath[depth];
            const toState = statePath[depth + 1];
            
            let topMove, bottomMove;
            do {
                if (fromState === 0 && toState === 1) {
                    topMove = topVarSet[Math.floor(Math.random() * topVarSet.length)];
                    bottomMove = bottomFixedSet[Math.floor(Math.random() * bottomFixedSet.length)];
                } else if (fromState === 0 && toState === 2) {
                    topMove = topFixedSet[Math.floor(Math.random() * topFixedSet.length)];
                    bottomMove = bottomVarSet[Math.floor(Math.random() * bottomVarSet.length)];
                } else if (fromState === 1 && toState === 1) {
                    topMove = topFixedSet[Math.floor(Math.random() * topFixedSet.length)];
                    bottomMove = bottomFixedSet[Math.floor(Math.random() * bottomFixedSet.length)];
                } else if (fromState === 1 && toState === 2) {
                    topMove = topReverseVarSet[Math.floor(Math.random() * topReverseVarSet.length)];
                    bottomMove = bottomVarSet[Math.floor(Math.random() * bottomVarSet.length)];
                } else if (fromState === 2 && toState === 2) {
                    topMove = topFixedSet[Math.floor(Math.random() * topFixedSet.length)];
                    bottomMove = bottomFixedSet[Math.floor(Math.random() * bottomFixedSet.length)];
                } else if (fromState === 2 && toState === 1) {
                    topMove = topVarSet[Math.floor(Math.random() * topVarSet.length)];
                    bottomMove = bottomReverseVarSet[Math.floor(Math.random() * bottomReverseVarSet.length)];
                } else if (fromState === 3 && toState === 2) {
                    topMove = topReverseVarSet[Math.floor(Math.random() * topReverseVarSet.length)];
                    bottomMove = bottomFixedSet[Math.floor(Math.random() * bottomFixedSet.length)];
                } else if (fromState === 3 && toState === 1) {
                    topMove = topFixedSet[Math.floor(Math.random() * topFixedSet.length)];
                    bottomMove = bottomReverseVarSet[Math.floor(Math.random() * bottomReverseVarSet.length)];
                }
            } while (topMove === 12 && bottomMove === -12);

            this.Search_move.push(topMove);
            this.Search_move.push(bottomMove);
            this.Search_move.push(0);
        }
        // console.log(`\nGenerated moves array: [${this.Search_move.join(', ')}]`);
        return this.init2();
    }

    solvePhase2(edge, corner, topEdgeFirst, botEdgeFirst, ml, maxl, depth, lm) {
        var botEdgeFirstx, cornerx, edgex, m, prun1, prun2, topEdgeFirstx;
        if (maxl == 0 && !topEdgeFirst && botEdgeFirst) {
            return true;
        }
        if (lm != 0 && topEdgeFirst == botEdgeFirst) {
            edgex = Square_TwistMove[edge];
            cornerx = Square_TwistMove[corner];
            if (SquarePrun[edgex << 1 | 1 - ml] < maxl && SquarePrun[cornerx << 1 | 1 - ml] < maxl) {
                this.Search_move[depth] = 0;
                if (this.solvePhase2(edgex, cornerx, topEdgeFirst, botEdgeFirst, 1 - ml, maxl - 1, depth + 1, 0)) {
                    return true;
                }
            }
        }
        if (lm <= 0) {
            topEdgeFirstx = !topEdgeFirst;
            edgex = topEdgeFirstx ? Square_TopMove[edge] : edge;
            cornerx = topEdgeFirstx ? corner : Square_TopMove[corner];
            m = topEdgeFirstx ? 1 : 2;
            prun1 = SquarePrun[edgex << 1 | ml];
            prun2 = SquarePrun[cornerx << 1 | ml];
            while (m < 12 && prun1 <= maxl && prun2 <= maxl) {
                if (prun1 < maxl && prun2 < maxl) {
                    this.Search_move[depth] = m;
                    if (this.solvePhase2(edgex, cornerx, topEdgeFirstx, botEdgeFirst, ml, maxl - 1, depth + 1, 1)) {
                        return true;
                    }
                }
                topEdgeFirstx = !topEdgeFirstx;
                if (topEdgeFirstx) {
                    edgex = Square_TopMove[edgex];
                    prun1 = SquarePrun[edgex << 1 | ml];
                    m += 1;
                } else {
                    cornerx = Square_TopMove[cornerx];
                    prun2 = SquarePrun[cornerx << 1 | ml];
                    m += 2;
                }
            }
        }
        if (lm <= 1) {
            botEdgeFirstx = !botEdgeFirst;
            edgex = botEdgeFirstx ? Square_BottomMove[edge] : edge;
            cornerx = botEdgeFirstx ? corner : Square_BottomMove[corner];
            m = botEdgeFirstx ? 1 : 2;
            prun1 = SquarePrun[edgex << 1 | ml];
            prun2 = SquarePrun[cornerx << 1 | ml];
            while (m < 5 && prun1 <= maxl && prun2 <= maxl) { // restrict to max 4 D move
                if (prun1 < maxl && prun2 < maxl) {
                    this.Search_move[depth] = -m;
                    if (this.solvePhase2(edgex, cornerx, topEdgeFirst, botEdgeFirstx, ml, maxl - 1, depth + 1, 2)) {
                        return true;
                    }
                }
                botEdgeFirstx = !botEdgeFirstx;
                if (botEdgeFirstx) {
                    edgex = Square_BottomMove[edgex];
                    prun1 = SquarePrun[edgex << 1 | ml];
                    m += 1;
                } else {
                    cornerx = Square_BottomMove[cornerx];
                    prun2 = SquarePrun[cornerx << 1 | ml];
                    m += 2;
                }
            }
        }
        return false;
    }

    findSolution(c) {
        this.Search_c = c;
        do {
            this.topEdgeFirst = false;
            this.botEdgeFirst = true;
            this.Search_length1 = 3 * (Math.floor(Math.random() * 5) + 3);
            this.Search_maxlen2 = Math.min(45 - this.Search_length1, 18);
            this.Search_move = [];
        } while (!this.solvePhase1() || this.Search_sol_string.split("/").length-1 < 9)
        return this.Search_sol_string;
    }
}

// Initialize Square tables
initSquareTables();

// Create search instance
const search = new Search();

// ============================================================================
// Public API
// ============================================================================

function scrambleFromState(cubie) {
    return search.findSolution(cubie);
}

// Parse hex format
function parseHexFormat(input) {
    const cubie = new SqCubie();

    try {
        input = input.replace(/\s/g, '');
        const parts = input.split(/[\|\/]/);

        if (parts.length !== 2) {
            throw new Error('Invalid format. Expected: 12 hex digits + separator + 12 hex digits');
        }

        const upperPart = parts[0];
        const lowerPart = parts[1];

        if (upperPart.length !== 12 || lowerPart.length !== 12) {
            throw new Error('Each part must be exactly 12 hex digits');
        }

        cubie.ul = parseInt(upperPart.substring(0, 6), 16);
        cubie.ur = parseInt(upperPart.substring(6, 12), 16);
        cubie.dl = parseInt(lowerPart.substring(0, 6), 16);
        cubie.dr = parseInt(lowerPart.substring(6, 12), 16);
        cubie.ml = input.includes('/') ? 1 : 0;

        return cubie;
    } catch (error) {
        throw new Error('Invalid hex format: ' + error.message);
    }
}

// ============================================================================
// PBL HEX GENERATOR
// ============================================================================

function getABFPermutations() {
    return {
        'U0': {
            '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
            '8': '8', '9': '9', 'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f'
        },
        'U': {
            '0': '2', '1': '3', '2': '4', '3': '5', '4': '6', '5': '7', '6': '0', '7': '1',
            '8': '8', '9': '9', 'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f'
        },
        'U2': {
            '0': '4', '1': '5', '2': '6', '3': '7', '4': '0', '5': '1', '6': '2', '7': '3',
            '8': '8', '9': '9', 'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f'
        },
        'U\'': {
            '0': '6', '1': '7', '2': '0', '3': '1', '4': '2', '5': '3', '6': '4', '7': '5',
            '8': '8', '9': '9', 'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f'
        },
        'D0': {
            '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
            '8': '8', '9': '9', 'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f'
        },
        'D': {
            '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
            '8': 'a', '9': 'b', 'a': 'c', 'b': 'd', 'c': 'e', 'd': 'f', 'e': '8', 'f': '9'
        },
        'D2': {
            '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
            '8': 'c', '9': 'd', 'a': 'e', 'b': 'f', 'c': '8', 'd': '9', 'e': 'a', 'f': 'b'
        },
        'D\'': {
            '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
            '8': 'e', '9': 'f', 'a': '8', 'b': '9', 'c': 'a', 'd': 'b', 'e': 'c', 'f': 'd'
        }
    };
}

function applyABF(layer, aufCode, adfCode) {
    const permutations = getABFPermutations();
    const topPermutation = permutations[aufCode];
    const bottomPermutation = permutations[adfCode];

    let result = '';
    for (let i = 0; i < layer.length; i++) {
        const char = layer[i].toLowerCase();
        const afterTop = topPermutation[char] || char;
        const final = bottomPermutation[afterTop] || afterTop;
        result += final;
    }
    return result;
}

function rotateLayer(str, amount) {
    const len = str.length;
    const normalizedAmount = ((amount % len) + len) % len;
    return str.slice(normalizedAmount) + str.slice(0, normalizedAmount);
}

function applyRBL(topLayer, bottomLayer, rul, rdl) {
    const rotatedTop = rotateLayer(topLayer, rul);
    const rotatedBottom = rotateLayer(bottomLayer, rdl);
    return { top: rotatedTop, bottom: rotatedBottom };
}

const RBL = [0, 3, 6, -3];

function generateRandomCase(selectedCases, equatorMode = 'random') {
    if (!selectedCases || selectedCases.length === 0) {
        throw new Error('No cases selected');
    }

    const randomCase = selectedCases[Math.floor(Math.random() * selectedCases.length)];
    const [topCaseName, bottomCaseName] = randomCase.split('/');

    let topCase, bottomCase;
    if (NonParityCases[topCaseName]) {
        topCase = NonParityCases[topCaseName];
        bottomCase = NonParityCases[bottomCaseName];
    } else {
        topCase = ParityCases[topCaseName];
        bottomCase = ParityCases[bottomCaseName];
    }

    let topHex = topCase.top;
    let bottomHex = bottomCase.bottom;

    const aufCodes = ['U0', 'U', 'U2', 'U\''];
    const adfCodes = ['D0', 'D', 'D2', 'D\''];
    const randomAuf = aufCodes[Math.floor(Math.random() * aufCodes.length)];
    const randomAdf = adfCodes[Math.floor(Math.random() * adfCodes.length)];

    topHex = applyABF(topHex, randomAuf, randomAdf);
    bottomHex = applyABF(bottomHex, randomAuf, randomAdf);

    const rul = RBL[Math.floor(Math.random() * RBL.length)];
    const rdl = RBL[Math.floor(Math.random() * RBL.length)];

    const rotated = applyRBL(topHex, bottomHex, rul, rdl);
    const finalTopHex = rotated.top;
    const finalBotHex = rotated.bottom;

    let equator;
    if (equatorMode === 'bar') {
        equator = '|';
    } else if (equatorMode === 'slash') {
        equator = '/';
    } else {
        equator = Math.random() < 0.5 ? '|' : '/';
    }

    const finalHex = `${finalTopHex}${equator}${finalBotHex}`;

    return {
        caseName: randomCase,
        finalHex: finalHex,
        topHex: finalTopHex,
        bottomHex: finalBotHex,
        equator: equator
    };
}

// ============================================================================
// MAIN cube.js USAGE
// ============================================================================

function getScramble(caseName, mlMode) {
    // caseName: e.g. "Al/Ar"
    // mlMode: "+", "-", or "random"
    let equatorMode;
    switch (mlMode) {
        case "+":
            equatorMode = 'slash';
            break;
        case "-":
            equatorMode = 'bar';
            break;
        default:
            equatorMode = 'random';
            break;
    }
    
    const result = generateRandomCase([caseName], equatorMode).finalHex;
    const solution = scrambleFromState(parseHexFormat(result));
    
    if (solution && solution !== '(solved)') {
        return solution.replace(/ \(|\)/g, "");
    } else {
        throw new Error("caseName: "+caseName+"; mlMode: "+mlMode+ "; no solution found or already solved")
    }
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.scrambler = {
        getScramble: getScramble
    };
}

// For Node.js/module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getScramble,
        scrambleFromState,
        parseHexFormat,
        generateRandomCase,
        SqCubie,
        NonParityCases,
        ParityCases
    };
}

// ============================================================================
// TEST CODE
// ============================================================================

// function testRepetitions(mlMode="random", iterations=1000) {
//     console.log('=== ALL SCRAMBLES ===\n');
    
//     const scrambles = [];
//     const startTime = Date.now();
//     let maxTime = 0;
    
//     for (let i = 0; i < iterations; i++) {
//         let NOP = Math.random() < 0.5;
//         let caseName = NOP ? Object.keys(NonParityCases)[Math.floor(Math.random() * Object.keys(NonParityCases).length)] + 
//             "/" + Object.keys(NonParityCases)[Math.floor(Math.random() * Object.keys(NonParityCases).length)] :
//             Object.keys(ParityCases)[Math.floor(Math.random() * Object.keys(ParityCases).length)] + "/" +
//             Object.keys(ParityCases)[Math.floor(Math.random() * Object.keys(ParityCases).length)];
        
//         const iterStart = Date.now();
        
//         let equatorMode;
//         if (mlMode === 'flipped') {
//             equatorMode = 'slash';
//         } else if (mlMode === 'solved') {
//             equatorMode = 'bar';
//         } else {
//             equatorMode = 'random';
//         }
        
//         const result = generateRandomCase([caseName], equatorMode).finalHex;
//         const solution = scrambleFromState(parseHexFormat(result));
        
//         const iterTime = Date.now() - iterStart;
//         maxTime = iterTime > maxTime ? iterTime : maxTime;
        
//         if (solution && solution !== '(solved)') {
//             scrambles.push({
//                 full: solution,
//                 hex: result.finalHex,
//                 time: iterTime
//             });
            
//             console.log(`${i + 1}. ${solution}`);
//         } else {
//             console.log(`${i + 1}. (No solution or already solved)`);
//         }
//     }
    
//     const totalTime = Date.now() - startTime;
//     const avgTime = totalTime / iterations;
    
//     console.log('\n=== FINAL STATISTICS ===');
//     console.log(`\nAverage time per case: ${avgTime.toFixed(2)}ms`);
//     console.log(`\nMax time: ${maxTime.toFixed(2)}ms`)
//     console.log(`Total time: ${(totalTime / 1000).toFixed(2)}s`);
    
//     if (scrambles.length > 0) {
//         const lengths = scrambles.map(s => s.full.split("/").length-1);
//         const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
//         const minLength = Math.min(...lengths);
//         const maxLength = Math.max(...lengths);
        
//         console.log(`\n=== SCRAMBLE LENGTH STATISTICS ===`);
//         console.log(`Average length: ${avgLength.toFixed(1)} slices`);
//         console.log(`Min length: ${minLength} slices`);
//         console.log(`Max length: ${maxLength} slices`);
//     }
// }

// testRepetitions();