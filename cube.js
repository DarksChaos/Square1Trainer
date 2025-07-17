let canvas; //= document.getElementById("canvas")
let ctx; //= canvas.getContext("2d")

function mod(n, m) {
    return ((n % m) + m) % m;
}

function randInt(min, max) {
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

const compareCS = (a, b) =>
    a.length === b.length &&
    a.every(
        (element, index) =>
            (element >= 0 && b[index] >= 0) ||
            (element == -1 && element == b[index])
    );

const LAYER_DEG = 15;
const EDGE_DEG = 30;
const CORNER_DEG = 60;

// colorscheme
let TOPCOL = "#444";
let BOTCOL = "white";
let BLANKCOL = "#888";
let TSIDECOLS = ["red", "#0f5fff", "orange", "#00db33"];
let BSIDECOLS = ["red", "#00db33", "orange", "#0f5fff"];

function rad(deg) {
    return (deg * Math.PI) / 180;
}

const LAYER_RAD = rad(LAYER_DEG);
const EDGE_RAD = rad(EDGE_DEG);
const CORNER_RAD = rad(CORNER_DEG);

const PADDING = 0.3;

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

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    rotateAround(center, angleRad) {
        // Translation relative au centre
        const dx = this.x - center.x;
        const dy = this.y - center.y;

        // Rotation
        const rotatedX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
        const rotatedY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

        // Mise à jour des coordonnées
        this.x = rotatedX + center.x;
        this.y = rotatedY + center.y;
    }

    addC(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    addP(point) {
        this.x += point.x;
        this.y += point.y;
    }

    toString() {
        return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }
}

const P0 = new Point(0, 0);

function drawPolygon(points, fillColor, strokeColor = "black") {
    if (points.length < 3) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawPoint(point, color = "black", radius = 3) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawSlice(center, color = "#ff5500", scale = 100) {
    let padding = scale * PADDING * 1.5;
    ctx.beginPath();
    ctx.moveTo(center.x, center.y - scale - padding);
    ctx.lineTo(center.x, center.y + scale + padding);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.stroke();
}

function drawEquator(center, flipped, scale = 100) {
    let l = center.x - (scale * 2) / 3;
    let r = flipped ? center.x + (scale * 2) / 3 : center.x + (scale * 4) / 3;
    let t = center.y - scale / 4;
    let b = center.y + scale / 4;

    let TL = new Point(l, t);
    let TM = new Point(center.x, center.y - scale / 4);
    let TR = new Point(r, t);

    let BL = new Point(l, b);
    let BM = new Point(center.x, center.y + scale / 4);
    let BR = new Point(r, b);

    drawPolygon([TL, TM, BM, BL], TSIDECOLS[0]);
    drawPolygon([TR, TM, BM, BR], TSIDECOLS[flipped * 2]);
}

function drawEdge(
    center,
    step,
    sideCol,
    isTopColor,
    isTopLayer,
    scale = 100,
    sideBlank = false,
    topBlank = false
) {
    let padding = scale * PADDING;
    let innerLength = scale - padding;
    let offRad = step * EDGE_RAD;
    let sideColors = isTopColor ? TSIDECOLS : BSIDECOLS;
    // define points
    // il, ir = inner outer corners (end of top area)
    // ol, or = outer corners (side color points) (tingman reference)
    // All coords relative to 0 for now
    let il = new Point(innerLength * Math.tan(LAYER_RAD), innerLength);
    let ir = new Point(-innerLength * Math.tan(LAYER_RAD), innerLength);

    let ol = new Point(scale * Math.tan(LAYER_RAD), scale);
    let or = new Point(-scale * Math.tan(LAYER_RAD), scale);
    // adjust alignment based on layer, and flip if bottom layer
    if (isTopLayer) offRad += LAYER_RAD;
    else offRad += Math.PI + LAYER_RAD;

    il.rotateAround(P0, offRad);
    ir.rotateAround(P0, offRad);
    ol.rotateAround(P0, offRad);
    or.rotateAround(P0, offRad);

    il.addP(center);
    ir.addP(center);
    ol.addP(center);
    or.addP(center);

    // draw
    let layerColor, sideColor;
    if (sideBlank) sideColor = BLANKCOL;
    else sideColor = sideColors[sideCol];
    if (topBlank) layerColor = BLANKCOL;
    else layerColor = isTopColor ? TOPCOL : BOTCOL;
    // Top part
    drawPolygon([center, il, ir], layerColor);
    drawPolygon([il, ir, or, ol], sideColor);
}

function drawCorner(
    center,
    step,
    leftCol,
    isTopColor,
    isTopLayer,
    scale = 100,
    sideBlank = false,
    topBlank = false
) {
    let padding = scale * PADDING;
    let innerLength = scale - padding;
    let offRad = step * EDGE_RAD;
    let sideColors = isTopColor ? TSIDECOLS : BSIDECOLS;

    // points
    // Just like edges, except we add im, om
    // ir and or are a rotation of il and ol by CORNER_RAD:
    let il = new Point(-innerLength * Math.tan(LAYER_RAD), innerLength);
    let ol = new Point(-scale * Math.tan(LAYER_RAD), scale);
    let im = new Point(
        -innerLength * Math.tan(LAYER_RAD + EDGE_RAD),
        innerLength
    );
    let om = new Point(-scale * Math.tan(LAYER_RAD + EDGE_RAD), scale);
    let ir = new Point(-innerLength * Math.tan(LAYER_RAD), innerLength);
    let or = new Point(-scale * Math.tan(LAYER_RAD), scale);
    ir.rotateAround(P0, CORNER_RAD);
    or.rotateAround(P0, CORNER_RAD);

    // adjust alignment based on layer
    if (isTopLayer) offRad -= LAYER_RAD;
    else offRad -= LAYER_RAD + Math.PI;

    il.rotateAround(P0, offRad);
    ol.rotateAround(P0, offRad);
    im.rotateAround(P0, offRad);
    om.rotateAround(P0, offRad);
    ir.rotateAround(P0, offRad);
    or.rotateAround(P0, offRad);

    il.addP(center);
    im.addP(center);
    ir.addP(center);
    ol.addP(center);
    om.addP(center);
    or.addP(center);

    // draw
    let layerColor, sideColor0, sideColor1;
    if (topBlank) layerColor = BLANKCOL;
    else layerColor = isTopColor ? TOPCOL : BOTCOL;
    if (sideBlank) {
        sideColor0 = sideColor1 = BLANKCOL;
    } else {
        let rightCol = mod(leftCol + 1, 4);
        sideColor0 = sideColors[leftCol];
        sideColor1 = sideColors[rightCol];
    }

    drawPolygon([center, il, im, ir], layerColor);
    drawPolygon([il, ol, om, im], sideColor0);
    drawPolygon([im, om, or, ir], sideColor1);
}

function drawCursor(center, step, scale = 100) {
    // outer cursor
    let offRad = step * EDGE_RAD;
    let distance = scale * (1 + PADDING * 1.5);
    let radius = scale / 8;
    let touchPt = new Point(center.x, center.y - scale);
    let cedgePt = new Point(center.x, center.y - distance + radius);
    let cursor = new Point(center.x, center.y - distance);
    touchPt.rotateAround(center, offRad);
    cursor.rotateAround(center, offRad);
    cedgePt.rotateAround(center, offRad);
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.arc(cursor.x, cursor.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.lineWidth = scale / 20;
    ctx.strokeStyle = "red";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cedgePt.x, cedgePt.y);
    ctx.lineTo(touchPt.x, touchPt.y);
    ctx.lineWidth = scale / 30;
    ctx.stroke();
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
    Ol: "8G5H6E7F",
    Or: "6G7H8E5F",
    Pl: "6H8F7G5E",
    Pr: "8H5F7G6E",
    Q: "7H6G5F8E",
    Sa: "8H6G7F5E",
    Sm: "6H5G7F8E",
    W: "7E8F6G5H",
    X: "7F6E5H8G",
};

let KARN = {
    U: Move.Move(3, 0),
    "U'": Move.Move(-3, 0),
    D: Move.Move(0, 3),
    "D'": Move.Move(0, -3),
    u: Move.Move(2, -1),
    "u'": Move.Move(-2, 1),
    d: Move.Move(-1, 2),
    "d'": Move.Move(1, -2),
    M: Move.Move(1, 1),
    "M'": Move.Move(-1, -1),
    m: Move.Move(2, 2),
    "m'": Move.Move(-2, -2),
    F: Move.Move(4, 1),
    "F'": Move.Move(-4, -1),
    f: Move.Move(1, 4),
    "f'": Move.Move(-1, -4),
    T: Move.Move(2, -4),
    "T'": Move.Move(-2, 4),
    t: Move.Move(-4, 2),
    "t'": Move.Move(4, -2),
};

const kmoves = Object.entries(KARN);

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

// [top?, color (1st clockwise for corners), corner?]
const pieceProperties = [
    [true, 0, true],
    [true, 1, false],
    [true, 1, true],
    [true, 2, false],
    [true, 2, true],
    [true, 3, false],
    [true, 3, true],
    [true, 0, false],

    [false, 0, false],
    [false, 0, true],
    [false, 1, false],
    [false, 1, true],
    [false, 2, false],
    [false, 2, true],
    [false, 3, false],
    [false, 3, true],
];

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

    draw(center, scale = 100, blanks = false) {
        const topCenter = new Point(
            center.x - scale * 1.5,
            center.y - scale / 2
        );
        const botCenter = new Point(
            center.x + scale * 1.5,
            center.y - scale / 2
        );
        const barCenter = new Point(center.x, center.y + scale);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // top layer
        for (let i = 0; i < 12; i++) {
            let piece = this.topPieces[i];
            if (piece == -1) continue;
            const props = pieceProperties[piece];
            if (props[2]) {
                // corner
                drawCorner(topCenter, i, props[1], props[0], true, scale);
            } else {
                drawEdge(topCenter, i, props[1], props[0], true, scale);
            }
        }
        // bottom layer
        for (let i = 0; i < 12; i++) {
            let piece = this.botPieces[i];
            if (piece == -1) continue;
            const props = pieceProperties[piece];
            if (props[2]) {
                // corner
                drawCorner(botCenter, i, props[1], props[0], false, scale);
            } else {
                drawEdge(botCenter, i, props[1], props[0], false, scale);
            }
        }
        // equator
        drawEquator(barCenter, this.barflip, scale);
        // slice lines
        // drawSlice(topCenter, scale);
        // drawSlice(botCenter, scale);

        // temp
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
let scrambleList = [];

let previousScramble = null;

let remainingPBL = [];
let eachCase = false;

let defaultLists = {};
let userLists = {};
let highlightedList = null;

let scrambleOffset = 0;
let generators;
let hasActiveScramble = false;
let hasPreviousScramble = false;
let isPopupOpen = false;

let cubeCenter, cubeScale;

let pressStartTime = null;
let holdTimeout = null;
let timerStart = null;
let intervalId = null;
let isRunning = false;
let readyToStart = false;
let otherKeyPressed = 0;
const startDelay = 0;

// HTML elements

// Top bar buttons
const toggleUiEl = document.getElementById("toggleui");
const uploadEl = document.getElementById("uploaddata");
const downloadEl = document.getElementById("downloaddata");
const fileEl = document.getElementById("fileinput");

const sidebarEl = document.getElementById("sidebar");
const contentEl = document.getElementById("content");

const pblListEl = document.getElementById("results");
const filterInputEl = document.getElementById("filter");

const eachCaseEl = document.getElementById("allcases");

// Selection buttons
const selectAllEl = document.getElementById("sela");
const deselectAllEl = document.getElementById("desela");
const selectTheseEl = document.getElementById("selt");
const deselectTheseEl = document.getElementById("deselt");
const showSelectionEl = document.getElementById("showselected");
const showAllEl = document.getElementById("showall");

// List buttons
const openListsEl = document.getElementById("openlists");
const userListsEl = document.getElementById("userlists");
const defaultListsEl = document.getElementById("defaultlists");
const newListEl = document.getElementById("newlist");
const deleteListEl = document.getElementById("dellist");
const selectListEl = document.getElementById("sellist");
const trainListEl = document.getElementById("trainlist");

// Popup
const scramblePopupEl = document.getElementById("scram-popup");
const displayScramEl = document.getElementById("display-scram");
const canvasWrapperEl = document.getElementById("canvas-wrapper");
const displayPBLname = document.getElementById("pblname");

const listPopupEl = document.getElementById("list-popup");

// initialize canvas declared at the very top of the file
canvas = document.getElementById("scram-canvas");
ctx = canvas.getContext("2d");

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

function listLength(list) {
    let l = 0;
    for (let i of Object.values(list)) {
        l += i;
    }
    return l;
}

function getLocalStorageData() {
    // selectedPBL
    const storageSelectedPBL = localStorage.getItem("selectedPBL");
    if (storageSelectedPBL !== null) {
        selectedPBL = JSON.parse(storageSelectedPBL);
        for (let k of selectedPBL) {
            selectPBL(k)
        }
        if (eachCase) {
            remainingPBL = structuredClone(selectedPBL);
        }
        generateScramble();
        if (selectedPBL.length != 0) {
            for (let pbl of possiblePBL) {
                hidePBL(pblname(pbl));
            }
            for (let pbl of selectedPBL) {
                showPBL(pbl);
            }
        }
    }

    // userLists
    const storageUserLists = localStorage.getItem("userLists");
    if (storageUserLists !== null) {
        userLists = JSON.parse(storageUserLists);
        addUserLists();
    }
}

function saveSelectedPBL() {
    localStorage.setItem("selectedPBL", JSON.stringify(selectedPBL));
    if (!hasActiveScramble || selectedPBL.length == 0) generateScramble();
}

function saveUserLists() {
    localStorage.setItem("userLists", JSON.stringify(userLists));
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

    possiblePBL.splice(0, 1);
    let buttons = "";
    for ([t, b] of possiblePBL) {
        buttons += `
        <div class="case" id="${t}/${b}">${t} / ${b}</div>`;
    }
    pblListEl.innerHTML += buttons;

    if (eachCaseEl.checked) {
        enableGoEachCase();
    }

    // Load generators
    await fetch("./generators.json")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            generators = data;
            // Load local storage data only after generators
            // have been loaded, so we can generate a scramble
            getLocalStorageData();
        })
        .catch((error) => console.error("Failed to fetch data:", error));
    // Add buttons to the page for each pbl choice
    // Stored to a temp variable so we edit the page only once, and prevent a lag spike

    // Add event listener to each button, so we can click it
    document.querySelectorAll(".case").forEach((caseEl) => {
        caseEl.addEventListener("click", () => {
            const isChecked = caseEl.classList.contains("checked")
            n = caseEl.id;
            if(isChecked) {
                deselectPBL(n)
            } else {
                selectPBL(n)
            }
            saveSelectedPBL();
        });
    });

    // Load default lists
    await fetch("./defaultlists.json")
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

// function updateSelection() {
//     selectedPBL = [];
//     for (pbl of possiblePBL) {
//         const e = document.getElementById(pblname(pbl));
//         if (e.classList.contains("checked")) {
//             selectedPBL.push(e.id);
//             if(eachCase && !remainingPBL.includes(e.id)) {
//                 remainingPBL.push(e.id)
//             }
//         } else if(remainingPBL.includes(e.id)) {
//             remainingPBL.splice(remainingPBL.indexOf(e.id), 1)
//         }
//     }
//     saveSelectedPBL();
//     if (!hasActiveScramble || selectedPBL.length == 0) generateScramble();
// }

function isPll(pll, filter) {
    special = ["opp", "adj", "pn", "pj"];
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
        arr = filter.match(/[^ ]+/g).slice(0, 2);
        if (arr != null) {
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

function generateScramble() {
    scrambleOffset = 0;
    if (selectedPBL.length == 0) {
        timerEl.textContent = "--:--";
        currentScrambleEl.textContent = "Scramble will show up here";
        hasActiveScramble = false;
        scrambleList = [];
        return;
    }
    if (eachCase) {
        if (remainingPBL.length == 0) {
            remainingPBL = structuredClone(selectedPBL)
            
        }
        let caseNum = randInt(0, remainingPBL.length - 1);
        pblChoice = remainingPBL.splice(caseNum, 1)[0]
    } else {
        pblChoice = selectedPBL[randInt(0, selectedPBL.length - 1)];
    }

    pblChoice += "-+"[randInt(0, 1)];

    scramble = generators[pblChoice];
    // Add random begin and end layer moves
    let s = scramble[0];
    let e = scramble[scramble.length - 1];
    let start;
    let end;
    if (s == "A") {
        start = `${randrange(-5, 5, 3)},${randrange(-3, 7, 3)}`;
    } else {
        start = `${randrange(-3, 7, 3)},${randrange(-4, 6, 3)}`;
    }
    if (e == "A") {
        end = `${randrange(-4, 6, 3)},${randrange(-3, 7, 3)}`;
    } else {
        end = `${randrange(-3, 7, 3)},${randrange(-5, 5, 3)}`;
    }

    let final = (
        start +
        scramble.slice(1, scramble.length - 1) +
        end
    ).replaceAll("/", " / ");
    if (scrambleList.length != 0) {
        previousScramble = scrambleList[scrambleList.length - 1];
        previousScrambleEl.textContent =
            "Previous scramble : " + previousScramble;
        hasPreviousScramble = true;
    }
    if (!hasActiveScramble) {
        timerEl.textContent = "0.00";
    }
    currentScrambleEl.textContent = final;
    scrambleList.push(final);
    hasActiveScramble = true;
}

function showAll() {
    for (let pbl of possiblePBL) {
        showPBL(pblname(pbl));
    }
}

function hidePBL(text) {
    document.getElementById(text).classList.add("hidden");
}

function showPBL(text) {
    document.getElementById(text).classList.remove("hidden");
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${centiseconds.toString().padStart(2, "0")}`;
}

function setColor(className) {
    timerEl.classList.remove("red", "green");
    timerEl.classList.add(className);
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

function addUserLists() {
    let content = "";
    for (k of Object.keys(userLists)) {
        content += `
        <div id="${k}" class=\"list-item\">${k} (${listLength(
            userLists[k]
        )})</div>`;
    }
    userListsEl.innerHTML = content;
    for (let item of document.querySelectorAll("#userlists>.list-item")) {
        addListItemEvent(item);
    }
    saveUserLists();
}

function addDefaultLists() {
    let content = "";
    for (k of Object.keys(defaultLists)) {
        content += `
        <div id="${k}" class=\"list-item\">${k} (${listLength(
            defaultLists[k]
        )})</div>`;
    }
    defaultListsEl.innerHTML = content;
    for (let item of document.querySelectorAll("#defaultlists>.list-item")) {
        addListItemEvent(item);
    }
}

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
    if(setSelection) {
        for(let [pbl, inlist] of Object.entries(list)) {
            if(inlist) {
                console.log("Adding pbl", pbl)
                showPBL(pbl)
                selectPBL(pbl)
            } else {
                hidePBL(pbl)
                deselectPBL(pbl)
            }
        }

        saveSelectedPBL();
    } else {
        for(let [pbl, inlist] of Object.entries(list)) {
            if(inlist) {
                showPBL(pbl)
            } else {
                hidePBL(pbl)
            }
        }
    }
    saveUserLists();
}

function validName(n) {
    for (l of n) {
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

function openScramblePopup(scramble) {
    if (usingTimer()) return;
    isPopupOpen = true;
    scramblePopupEl.classList.add("open");

    // Change canvas size
    const w = canvasWrapperEl.offsetWidth;
    const h = canvasWrapperEl.offsetHeight;

    canvas.width = w;
    canvas.height = h;
    cubeCenter = new Point(parseInt(w / 2), parseInt(h / 2));
    cubeScale = parseInt(w / 7);

    let displayCube = new Cube(solved);
    displayCube.applySequence(new Sequence(scramble));
    displayCube.draw(cubeCenter, cubeScale);

    displayScramEl.textContent = scramble;
    displayPBLname.textContent = displayCube.pblCase();
}

function openListPopup() {
    if (usingTimer()) return;
    isPopupOpen = true;
    listPopupEl.classList.add("open");
}

function closePopup() {
    isPopupOpen = false;
    scramblePopupEl.classList.remove("open");
    listPopupEl.classList.remove("open");
}

function canInteractTimer() {
    return (
        hasActiveScramble &&
        document.activeElement != filterInputEl &&
        !isPopupOpen
    );
}

function timerBeginTouch(spaceEquivalent) {
    if (!hasActiveScramble) return;
    if (document.activeElement == filterInputEl) return;
    if (isRunning) {
        // Stop timer
        stopTimer();
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

function selectPBL(pbl) {
    document.getElementById(pbl).classList.add("checked");
    if(!selectedPBL.includes(pbl)) {
        selectedPBL.push(pbl);
        console.log(pbl)
    }
    if (eachCase && !remainingPBL.includes(pbl)) {
        remainingPBL.push(pbl);
    }
}

function deselectPBL(pbl) {
    console.log("Deselect")
    document.getElementById(pbl).classList.remove("checked");
    if(selectedPBL.includes(pbl)) {
        selectedPBL.splice(selectedPBL.indexOf(pbl), 1);
        console.log("Removed", pbl)
    }
    if (eachCase && remainingPBL.includes(pbl)) {
        remainingPBL.splice(remainingPBL.indexOf(pbl), 1)
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

function enableGoEachCase() {
    eachCase = true;
    remainingPBL = structuredClone(selectedPBL);
    caseNum = 0;
}

init();

filterInputEl.addEventListener("input", () => {
    filterInputEl.value = filterInputEl.value.replace(/[^a-zA-Z/\- ]+/g, "");
    setHighlightedList(null);
    for (pbl of possiblePBL) {
        const n = pblname(pbl);
        if (passesFilter(pbl, filterInputEl.value)) {
            showPBL(n);
        } else {
            hidePBL(n);
        }
    }
});

selectAllEl.addEventListener("click", () => {
    if (usingTimer()) return;
    for(let pbl of possiblePBL) {
        selectPBL(pblname(pbl))
    }
    saveSelectedPBL();
});

deselectAllEl.addEventListener("click", () => {
    if (usingTimer()) return;
    for(let pbl of possiblePBL) {
        deselectPBL(pblname(pbl))
    }
    saveSelectedPBL();
});

selectTheseEl.addEventListener("click", () => {
    if (usingTimer()) return;
    for (i of pblListEl.children) {
        if (!i.classList.contains("hidden")) {
            selectPBL(i.id);
        }
    }
    saveSelectedPBL();
});

deselectTheseEl.addEventListener("click", () => {
    if (usingTimer()) return;
    for (i of pblListEl.children) {
        if (!i.classList.contains("hidden")) {
            deselectPBL(i.id);
        }
    }
    saveSelectedPBL();
});

showAllEl.addEventListener("click", () => {
    if (usingTimer()) return;
    showAll();
});

showSelectionEl.addEventListener("click", () => {
    if (usingTimer()) return;
    for (pbl of possiblePBL) {
        const n = pblname(pbl);
        if (selectedPBL.includes(n)) {
            showPBL(n);
        } else {
            hidePBL(n);
        }
    }
});

prevScrambleButton.addEventListener("click", () => {
    if (usingTimer()) return;
    if (scrambleList.length == 0) return;
    scrambleOffset = Math.min(scrambleOffset + 1, scrambleList.length - 1);
    currentScrambleEl.textContent =
        scrambleList[scrambleList.length - 1 - scrambleOffset];
});

nextScrambleButton.addEventListener("click", () => {
    if (usingTimer()) return;
    if (scrambleList.length == 0) return;
    scrambleOffset--;
    if (scrambleOffset < 0) {
        scrambleOffset = 0;
        generateScramble();
    } else {
        currentScrambleEl.textContent =
            scrambleList[scrambleList.length - 1 - scrambleOffset];
    }
});

openListsEl.addEventListener("click", () => {
    if (usingTimer()) return;
    openListPopup();
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
    let newList = {};
    for (pbl of possiblePBL) {
        const n = pblname(pbl);
        if (selectedPBL.includes(n)) {
            newList[n] = 1;
        } else {
            newList[n] = 0;
        }
        userLists[newListName] = newList;
        addUserLists();
        setHighlightedList(newListName);
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
        alert("No list selected");
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
        alert("You can't delete a default list");
        return;
    }
    if (highlightedList == null) {
        alert("Please select a list to delete it");
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

window.addEventListener("keydown", (e) => {
    if (isPopupOpen) {
        if (e.code == "Escape") closePopup();
        return;
    }
    if (!canInteractTimer()) return;
    let isSpace = e.code == "Space";
    timerBeginTouch(isSpace);
    if (isSpace) e.preventDefault();
});

window.addEventListener("keyup", (e) => {
    if (!canInteractTimer()) return;
    let isSpace = e.code == "Space";
    timerEndTouch(isSpace);
    if (isSpace) e.preventDefault();
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

currentScrambleEl.addEventListener("click", () => {
    if (usingTimer()) return;
    if (isPopupOpen || !hasActiveScramble) return;
    openScramblePopup(currentScrambleEl.innerText);
});

previousScrambleEl.addEventListener("click", () => {
    if (usingTimer()) return;
    if (isPopupOpen || !hasPreviousScramble) return;
    openScramblePopup(previousScramble);
});

toggleUiEl.addEventListener("click", () => {
    if (usingTimer()) return;
    if (sidebarEl.classList.contains("hidden")) {
        sidebarEl.classList.remove("hidden");
        sidebarEl.classList.add("full-width-mobile");
        contentEl.classList.add("hidden-mobile");
    } else {
        sidebarEl.classList.add("hidden");
        sidebarEl.classList.remove("full-width-mobile");
        contentEl.classList.remove("hidden-mobile");
    }
});

downloadEl.addEventListener("click", () => {
    if (usingTimer()) return;
    const data = JSON.stringify(localStorage);
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
            jsonData = JSON.parse(reader.result);
            localStorage.setItem("selectedPBL", jsonData["selectedPBL"]);
            localStorage.setItem("userLists", jsonData["userLists"]);
            getLocalStorageData();
        } catch (e) {
            console.error("Error:", e);
        }
    };
    reader.readAsText(file);
});

eachCaseEl.addEventListener("change", (e) => {
    eachCase = eachCaseEl.checked;
    if (eachCase) {
        enableGoEachCase();
    }
});

// Enable crosses
for (let cross of document.querySelectorAll(".cross")) {
    cross.addEventListener("click", () => closePopup());
}
