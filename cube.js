let canvas; //= document.getElementById("canvas")
let ctx; //= canvas.getContext("2d")

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

// KARNOTATION

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

function karnify(scramble) {
    // scramble: e.g. "A/-3,0/-1,2/1,-2/-1,2/3,3/-2,-2/3,3/-3,0/-1,2/3,3/3,3/-2,4/A"
    // returns "A U' d3 e m' e U' d e e T' A"
    scramble = scramble.split("/");
    newMoves = [];
    // first level karnify; skip the A and a
    for (let move of scramble) {
        if (move in KARN) {
            newMoves.push(KARN[move]);
        } else {
            newMoves.push(move.replace(",", ""));
        }
    }
    firstKarn = newMoves.join(" ");
    // second level karnify
    secondKarn = replaceWithDict(firstKarn, HIGHKARN);
    return secondKarn;
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
// let hasPreviousScramble = false; // will be replaced with scrambleList.at(-2-scrambleOffset) !== undefined
let isPopupOpen = false;

let cubeCenter, cubeScale;
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
    X: 1,
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
const openHelpEl = document.getElementById("open-help");
const uploadEl = document.getElementById("uploaddata");
const downloadEl = document.getElementById("downloaddata");
const fileEl = document.getElementById("fileinput");

const sidebarEl = document.getElementById("sidebar");
const contentEl = document.getElementById("content");

const pblListEl = document.getElementById("results");
const filterInputEl = document.getElementById("filter");

const eachCaseEls = document.querySelectorAll(".allcases");
const karnEls = document.querySelectorAll(".karn");
const weightEls = document.querySelectorAll(".weight");

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

// Popup
const scramblePopupEl = document.getElementById("scram-popup");
const displayScramEl = document.getElementById("display-scram");
const canvasWrapperEl = document.getElementById("canvas-wrapper");
const displayPBLname = document.getElementById("pblname");

const listPopupEl = document.getElementById("list-popup");

// initialize canvas declared at the very top of the file
canvas = document.getElementById("scram-canvas");
ctx = canvas.getContext("2d");

const helpPopupEl = document.getElementById("help-popup");

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

function getLocalStorageData(fillSidebar=false) {
    // selectedPBL
    const storageSelectedPBL = localStorage.getItem("selectedPBL");
    if (storageSelectedPBL !== null) {
        if(fillSidebar) {
            // Add buttons to the page for each pbl choice
            // Stored to a temp variable so we edit the 
            // page only once, and avoid a lag spike
            
            // Do it here, just before shoing/hiding pbls, 
            // so that they don't all appear then disappear
            // when loading the page with already selected cases
            possiblePBL.splice(0, 1);
            let buttons = "";
            for ([t, b] of possiblePBL) {
                buttons += `
                <div class="case" id="${t}/${b}">${t} / ${b}</div>`;
            }
            pblListEl.innerHTML += buttons;
        }
        
        selectedPBL = JSON.parse(storageSelectedPBL);
        for (let k of selectedPBL) {
            selectPBL(k);
            selectedCount++;
            updateSelCount();
        }
                
        if (selectedPBL.length > 0) {
            showSelection();
        }

        if (eachCaseEls[0].checked || eachCaseEls[1].checked) eachCase = 1;
        else eachCase = randInt(MIN_EACHCASE, MAX_EACHCASE);
        enableGoEachCase();
        generateScramble();
        // if (selectedPBL.length != 0) {
        //     for (let pbl of possiblePBL) {
        //         hidePBL(pblname(pbl));
        //     }
        //     for (let pbl of selectedPBL) {
        //         showPBL(pbl);
        //     }
        // }
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
    // this is === 0 cuz genScram() has a if statement that deletes the scram if so
    if (!hasActiveScramble || selectedPBL.length == 0) generateScramble();
    else if (
        !selectedPBL.includes(currentCase.slice(0, currentCase.length - 1)) &&
        currentCase != ""
    )
        generateScramble(true);
}

function updateSelCount() {
    selCountEl.textContent = "Selected: " + selectedCount;
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
    // uncheck everything
    for (x in [0, 1]) {
        karnEls[x].checked = false
        weightEls[x].checked = false
        eachCaseEls[x].checked = false
    }

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
    generators = {
    "-/--": "",
    "-/-+": "A/6,0/6,0/A",
    "-/Al-": "a/-5,-2/-3,0/-1,2/1,4/0,-3/-1,-4/-2,-2/A",
    "-/Al+": "A/-1,2/4,1/0,-3/0,3/-4,2/1,-2/A",
    "-/Ar-": "A/-1,2/4,-2/0,3/6,0/-3,0/-4,-1/-2,1/A",
    "-/Ar+": "A/-4,5/4,-2/0,-3/3,0/-4,-1/-2,1/A",
    "-/E-": "a/-2,-2/-4,-1/-2,-2/2,-1/-2,-2/A",
    "-/E+": "a/-2,-2/-4,-1/4,-2/6,0/-4,-1/-2,-2/A",
    "-/F-": "a/1,-2/-1,2/3,0/1,4/-4,2/-3,0/-2,1/-1,2/-2,1/A",
    "-/F+": "A/3,3/-1,2/4,1/-4,2/1,-2/-3,0/-1,2/-2,1/A",
    "-/Gal-": "A/2,-4/-2,1/3,0/0,-3/-1,2/1,1/-3,3/A",
    "-/Gal+": "a/3,3/4,1/2,-1/-3,0/-3,-3/3,0/a",
    "-/Gar-": "A/-4,5/-5,1/-4,2/4,1/-1,-4/-2,1/-3,-3/A",
    "-/Gar+": "A/3,3/-1,-4/1,-2/-3,0/-3,-3/3,0/A",
    "-/Gol-": "A/-3,-3/-1,2/1,4/-4,-1/-5,1/-4,2/-2,1/A",
    "-/Gol+": "A/0,-3/-3,-3/3,0/-1,2/1,4/-3,-3/A",
    "-/Gor-": "A/3,0/-1,-1/1,-2/0,3/-3,0/2,-1/-2,1/A",
    "-/Gor+": "a/-3,6/-3,-3/-3,0/-2,1/2,-1/-3,-3/a",
    "-/H-": "a/-5,1/5,-1/1,4/5,-1/-5,1/A",
    "-/H+": "A/-4,2/4,-2/-4,-1/-2,-2/-4,2/-2,-2/A",
    "-/Ja-": "A/3,-3/0,3/-3,0/3,0/-3,0/A",
    "-/Ja+": "A/0,3/-3,0/0,3/0,3/-3,3/-3,-3/A",
    "-/Jm-": "a/0,-3/3,0/0,-3/0,3/-3,3/a",
    "-/Jm+": "a/-3,0/3,0/-3,0/-3,0/-3,-3/-3,3/a",
    "-/Na-": "A/-3,-3/3,0/-3,-3/-3,0/-3,-3/A",
    "-/Na+": "A/3,3/3,0/-3,-3/-3,0/6,0/-3,3/A",
    "-/Nm-": "a/-3,-3/3,0/-3,-3/-3,0/-3,-3/a",
    "-/Nm+": "A/-3,-3/-3,0/5,-1/4,-2/-3,0/-3,-3/A",
    "-/Rl-": "A/6,-3/-3,0/0,3/0,3/-1,-4/1,-2/-3,-3/A",
    "-/Rl+": "A/-3,0/0,3/-3,0/-3,0/-1,-4/4,1/6,0/-3,3/A",
    "-/Rr-": "a/-2,1/-4,-1/0,-3/0,3/-3,0/1,4/-1,2/a",
    "-/Rr+": "A/-1,2/4,-2/3,0/-3,-3/3,0/0,3/-1,-4/-2,1/A",
    "-/T-": "A/-1,2/4,1/-4,-1/4,1/-1,-4/4,1/3,0/A",
    "-/T+": "a/-5,4/-3,0/0,3/-4,-1/4,1/0,3/2,-1/-2,-2/A",
    "-/Ul-": "A/-1,-4/-3,0/1,-2/-4,-1/0,-3/3,0/1,1/A",
    "-/Ul+": "A/2,-1/-5,1/0,3/0,-3/-1,-4/1,-2/A",
    "-/Ur-": "A/2,-1/1,4/3,0/0,-3/5,-1/1,4/6,0/A",
    "-/Ur+": "A/5,-4/4,1/0,3/-3,0/5,-1/1,-2/A",
    "-/V-": "A/3,6/-3,3/-3,0/3,0/-1,2/1,-2/-3,0/-1,2/-2,1/A",
    "-/V+": "A/-3,6/-4,-1/1,4/-1,-4/-5,1/0,-3/5,-1/-2,1/A",
    "-/Y-": "A/0,3/-1,-4/4,1/-4,-1/4,1/-1,-4/-2,1/A",
    "-/Y+": "A/-3,6/-4,-1/1,4/-1,-4/1,-2/6,0/-1,2/-2,1/A",
    "-/Z-": "A/-3,-3/3,0/-1,-1/1,4/-3,-3/A",
    "-/Z+": "A/6,-3/-1,-1/1,4/-3,0/-1,-1/-2,1/A",
    "Al/--": "A/5,2/0,3/1,-2/-4,-1/0,3/0,-3/-2,-2/A",
    "Al/-+": "a/4,-5/-4,-1/3,0/0,-3/4,-2/2,-1/a",
    "Al/Al-": "A/0,-3/2,2/-2,1/-1,-4/-2,-2/-4,2/-2,-2/A",
    "Al/Al+": "A/-4,5/4,1/-3,0/0,-3/-1,-4/4,-2/A",
    "Al/Ar-": "A/2,-4/4,1/6,0/-4,2/-2,1/A",
    "Al/Ar+": "A/2,-4/-2,1/2,2/-2,1/A",
    "Al/E-": "A/5,2/0,3/1,-2/-4,-1/-2,1/2,-1/-2,-2/A",
    "Al/E+": "A/5,2/0,3/1,-2/-4,-1/4,1/6,0/-4,-1/-2,-2/A",
    "Al/F-": "A/6,-3/-3,-3/-1,2/1,4/-1,-1/1,-2/-3,3/A",
    "Al/F+": "a/-2,-5/-1,-1/-2,1/2,-1/-3,-3/3,0/3,0/-2,-2/A",
    "Al/Gal-": "A/6,3/0,3/2,-1/0,-3/-2,-2/-3,-3/-3,3/A",
    "Al/Gal+": "A/3,6/0,3/-1,2/0,-3/1,1/-3,3/A",
    "Al/Gar-": "A/-4,5/-2,1/0,-3/-1,-4/-5,1/A",
    "Al/Gar+": "A/5,-4/-2,1/0,-3/-3,3/-1,-4/4,-2/A",
    "Al/Gol-": "A/-4,2/-5,1/-3,0/3,0/0,-3/-1,-1/-2,1/A",
    "Al/Gol+": "A/5,-1/-2,1/3,0/-3,0/-1,-4/-2,1/A",
    "Al/Gor-": "a/-5,1/-4,-1/-3,0/1,-2/-1,2/a",
    "Al/Gor+": "a/4,-2/-1,-4/3,0/-3,3/-2,1/-1,2/a",
    "Al/H-": "a/0,3/4,1/-1,-4/4,-2/-1,-4/4,1/0,3/A",
    "Al/H+": "A/-4,-1/3,0/-2,1/-1,-4/1,4/-4,2/0,3/-2,-2/A",
    "Al/Ja-": "a/-3,6/0,-3/1,-2/-3,0/5,-1/a",
    "Al/Ja+": "A/5,-4/-5,1/0,-3/0,3/-1,-4/4,-2/A",
    "Al/Jm-": "A/5,-1/0,-3/-2,1/-3,0/0,3/A",
    "Al/Jm+": "A/-1,5/0,-3/1,4/0,3/-3,0/0,-3/A",
    "Al/Na-": "A/6,-3/-3,0/-1,2/4,1/-3,-3/3,0/-3,0/-1,2/-2,1/A",
    "Al/Na+": "A/0,-3/3,0/0,-3/-1,2/1,-2/0,3/-1,2/-2,1/A",
    "Al/Nm-": "A/0,3/-3,0/-1,2/0,-3/3,0/-5,1/0,-3/-1,2/-2,1/A",
    "Al/Nm+": "A/-4,-1/3,0/-2,1/2,-1/0,3/-3,0/-3,-3/-2,1/A",
    "Al/Rl-": "A/2,-1/-3,0/1,4/0,-3/-1,-1/1,-2/0,-3/A",
    "Al/Rl+": "A/5,-4/-2,1/-3,3/2,-1/3,0/-2,1/-1,-1/-2,1/A",
    "Al/Rr-": "A/-1,-4/-3,3/1,-2/0,-3/-4,-1/-3,3/-2,-2/A",
    "Al/Rr+": "A/0,-3/3,0/0,-3/0,3/-1,-1/-2,1/2,2/-2,1/A",
    "Al/T-": "A/-4,5/-2,1/0,-3/5,-1/1,-2/-3,0/3,0/A",
    "Al/T+": "A/-4,5/1,1/-1,-4/1,-2/-3,-3/-3,0/A",
    "Al/Ul-": "A/-3,3/2,-1/1,-2/-1,2/1,-2/A",
    "Al/Ul+": "A/-1,2/1,-2/-1,2/-3,0/-3,-3/-5,1/A",
    "Al/Ur-": "A/5,-1/0,-3/-2,1/-1,2/0,3/6,0/-2,-2/A",
    "Al/Ur+": "A/-1,5/-3,0/-2,1/2,-1/0,-3/4,-2/A",
    "Al/V-": "A/-4,5/-2,-2/-3,3/0,3/-1,2/1,-2/-3,3/A",
    "Al/V+": "A/5,-1/4,1/0,3/-3,-3/-3,0/0,3/-1,-4/-2,1/A",
    "Al/Y-": "A/-1,2/1,-2/-3,0/5,-1/-2,-2/3,0/-3,3/A",
    "Al/Y+": "A/5,-4/-2,1/0,3/-3,3/-1,-1/1,-2/A",
    "Al/Z-": "A/3,6/3,0/0,-3/-4,2/-2,1/3,0/-3,0/-1,2/-2,1/A",
    "Al/Z+": "a/6,-3/1,4/0,3/-4,-1/4,1/0,3/-4,-1/-2,-2/A",
    "Ar/--": "A/-1,2/-5,1/3,0/0,3/-4,-1/-2,1/-3,3/A",
    "Ar/-+": "a/4,-5/-4,2/3,0/0,-3/1,4/-1,2/a",
    "Ar/Al-": "A/5,-1/-2,-2/-3,0/2,2/-2,1/A",
    "Ar/Al+": "A/-4,5/-2,-2/2,-1/4,-2/A",
    "Ar/Ar-": "a/3,0/-2,-2/-1,2/-2,1/5,-1/-2,-2/-3,3/A",
    "Ar/Ar+": "A/2,-4/1,4/3,0/3,0/-1,-4/-2,1/A",
    "Ar/E-": "a/-5,4/-4,-1/0,3/0,3/-3,-3/-2,-2/-1,2/a",
    "Ar/E+": "a/-5,4/2,-1/0,-3/3,0/-2,1/3,0/-1,-1/-2,1/A",
    "Ar/F-": "A/5,-4/-2,1/-1,2/-5,1/3,0/-3,0/3,0/A",
    "Ar/F+": "A/5,-4/1,-2/0,3/-1,-1/-2,1/0,3/0,-3/-3,3/A",
    "Ar/Gal-": "a/1,-2/-1,2/3,0/4,1/5,-1/a",
    "Ar/Gal+": "a/1,-2/-1,2/3,0/4,1/-1,-1/6,0/a",
    "Ar/Gar-": "A/-4,5/-2,-2/-1,-4/0,-3/-2,1/-1,2/-2,1/A",
    "Ar/Gar+": "A/5,-4/4,1/0,3/0,-3/-1,2/-5,1/A",
    "Ar/Gol-": "A/-1,5/4,1/0,3/-1,2/-2,1/A",
    "Ar/Gol+": "A/-1,5/1,4/3,0/2,-1/1,4/6,0/A",
    "Ar/Gor-": "A/-3,6/0,-3/3,0/-1,2/1,4/2,2/-2,1/A",
    "Ar/Gor+": "A/-1,2/4,1/-3,0/-3,-3/-1,-4/-2,1/A",
    "Ar/H-": "A/-3,0/-4,-1/4,1/-4,2/4,1/-4,-1/-3,0/a",
    "Ar/H+": "A/2,-4/4,1/0,-3/-1,2/4,1/0,-3/3,0/-3,-3/A",
    "Ar/Ja-": "a/1,-5/0,3/-1,2/3,0/-3,0/a",
    "Ar/Ja+": "A/2,-4/1,4/-3,0/0,3/5,-1/-2,1/A",
    "Ar/Jm-": "A/0,-3/3,0/2,-1/0,3/-5,1/A",
    "Ar/Jm+": "A/6,-3/0,-3/0,-3/-4,2/0,3/-5,1/A",
    "Ar/Na-": "A/-3,3/0,-3/-1,-4/1,4/-1,-4/-2,1/6,0/-1,2/-2,1/A",
    "Ar/Na+": "A/3,-3/-3,0/-1,-4/4,1/-1,-4/1,4/-1,-4/-2,1/A",
    "Ar/Nm-": "A/3,0/-3,0/2,-1/0,-3/0,3/4,1/-3,0/-1,-4/-2,1/A",
    "Ar/Nm+": "a/1,-2/-1,2/0,-3/0,3/4,1/3,0/-1,-1/-2,1/A",
    "Ar/Rl-": "A/-1,5/4,-2/-1,-4/1,-2/0,-3/-1,-1/-2,1/A",
    "Ar/Rl+": "a/-5,-2/2,-1/1,-2/2,-1/-2,-2/-3,0/2,-1/-2,1/A",
    "Ar/Rr-": "A/3,6/3,0/-1,2/-2,1/0,3/-1,-1/-2,1/A",
    "Ar/Rr+": "A/-3,6/6,0/-3,0/-1,2/-2,1/0,3/-1,-1/-2,1/A",
    "Ar/T-": "A/0,3/0,-3/-1,2/4,-2/-3,0/2,-1/-2,1/A",
    "Ar/T+": "A/3,6/-3,-3/-1,-4/4,1/-1,-1/1,-2/A",
    "Ar/Ul-": "A/-1,2/-5,1/-3,0/0,3/5,-1/-2,1/-3,3/A",
    "Ar/Ul+": "a/-2,1/2,-1/3,0/0,3/-2,1/2,-1/a",
    "Ar/Ur-": "A/5,-4/-2,1/-1,2/1,-2/-3,3/A",
    "Ar/Ur+": "A/5,-4/-2,1/-1,2/4,1/-3,-3/-3,3/A",
    "Ar/V-": "A/6,3/-4,-1/4,1/-4,-1/1,-2/-1,-4/-2,1/A",
    "Ar/V+": "A/5,-1/1,-2/0,3/-3,0/0,3/0,3/-1,-4/-2,1/A",
    "Ar/Y-": "a/-5,4/2,-1/0,3/-3,3/-3,-3/-2,-2/-1,2/a",
    "Ar/Y+": "a/4,-5/-1,2/-3,3/0,3/4,-2/-1,2/a",
    "Ar/Z-": "A/6,3/-4,-1/1,4/-3,3/-1,-4/-2,-2/-3,3/-1,2/-2,1/A",
    "Ar/Z+": "A/3,0/0,3/-3,3/-1,-4/1,4/-1,-4/-3,0/-2,1/A",
    "E/--": "a/-2,-2/-1,2/-2,-2/-1,-4/-2,-2/A",
    "E/-+": "A/5,-4/-2,-2/-3,0/0,3/2,2/-2,1/A",
    "E/Al-": "a/-2,-5/-3,0/2,-1/1,4/-1,2/3,0/-2,-2/A",
    "E/Al+": "A/3,3/-1,2/-2,1/5,-1/4,1/-3,0/-1,2/-2,1/A",
    "E/Ar-": "A/5,-4/1,4/0,-3/0,3/-3,-3/-1,-1/-2,1/A",
    "E/Ar+": "a/4,-5/0,-3/5,-1/-2,-2/-1,2/4,1/-1,2/-2,1/A",
    "E/E-": "A/5,-4/-2,-2/-3,3/2,2/-2,1/A",
    "E/E+": "A/3,-3/2,-1/1,1/-3,3/-1,-1/-2,1/A",
    "E/F-": "A/-1,2/-2,1/0,-3/3,0/0,-3/-4,-1/1,-2/A",
    "E/F+": "A/2,-4/3,0/-2,1/-3,0/5,-1/-2,1/-1,2/-2,1/A",
    "E/Gal-": "a/1,4/2,-1/1,-2/2,-1/3,0/1,1/-3,3/A",
    "E/Gal+": "a/0,-3/1,1/-3,3/2,-1/-3,0/3,0/a",
    "E/Gar-": "A/-3,6/-3,-3/-3,0/-1,-4/-3,3/4,1/-3,-3/A",
    "E/Gar+": "A/0,3/-1,-1/-3,3/1,-2/3,0/0,-3/A",
    "E/Gol-": "A/-3,6/0,-3/-4,-1/6,0/-2,-2/-1,-1/-2,1/A",
    "E/Gol+": "A/-3,6/0,-3/2,-1/4,-2/-1,-1/-2,1/A",
    "E/Gor-": "A/3,0/-3,-3/-1,-4/1,4/0,3/2,-1/-2,1/A",
    "E/Gor+": "a/3,6/0,3/-2,1/-3,3/-1,-1/3,0/a",
    "E/H-": "a/3,-3/-2,-2/-3,3/-1,2/-2,-2/-1,2/-2,-2/A",
    "E/H+": "A/-3,-3/3,0/5,-1/-3,3/4,1/-3,-3/A",
    "E/Ja-": "A/-3,6/-3,0/3,0/0,3/-1,2/4,1/-3,-3/A",
    "E/Ja+": "A/-3,-3/-1,2/4,1/-3,0/-3,-3/3,0/A",
    "E/Jm-": "a/0,-3/4,-2/0,-3/2,-1/3,0/0,3/-2,1/A",
    "E/Jm+": "a/-3,6/-3,-3/-3,0/1,4/-1,2/-3,-3/a",
    "E/Na-": "A/3,3/3,0/-1,-1/4,1/-3,-3/A",
    "E/Na+": "A/3,3/-3,0/-1,-1/1,-2/6,0/-3,3/A",
    "E/Nm-": "a/-3,-3/-3,0/1,1/-1,2/-3,-3/a",
    "E/Nm+": "A/-3,-3/-1,-4/-3,3/4,-2/-3,0/-3,-3/A",
    "E/Rl-": "A/3,3/-1,-4/-2,1/-4,-1/-5,1/-4,2/-2,1/A",
    "E/Rl+": "A/3,3/-1,-4/-2,1/2,-1/-5,1/-1,-1/-3,3/-2,1/A",
    "E/Rr-": "A/5,-4/4,1/3,0/-3,0/3,0/-4,2/-2,1/A",
    "E/Rr+": "A/-1,2/1,-2/3,0/0,-3/3,0/0,3/-1,-4/-2,1/A",
    "E/T-": "A/2,-1/0,3/1,4/-4,-1/4,-2/0,-3/0,-3/A",
    "E/T+": "A/0,-3/3,0/3,0/-4,-1/4,1/-3,0/-1,2/-2,1/A",
    "E/Ul-": "A/5,-1/0,-3/-2,1/-3,0/-1,-4/4,1/0,3/-1,2/-2,1/A",
    "E/Ul+": "A/-3,6/-1,-4/0,-3/3,0/1,-2/-4,-1/-3,-3/-2,1/A",
    "E/Ur-": "a/0,-3/4,-2/-1,2/-2,1/0,-3/5,-1/1,4/-1,2/-2,1/A",
    "E/Ur+": "A/3,0/-4,-1/0,3/1,4/5,-1/-3,0/-3,0/-2,1/A",
    "E/V-": "A/6,3/-1,-4/4,1/-1,-4/-5,1/-3,0/-3,-3/-1,2/-2,1/A",
    "E/V+": "A/5,5/1,-2/2,-1/1,4/2,-1/0,3/1,4/-3,3/A",
    "E/Y-": "A/2,-1/1,4/3,0/-4,-1/-5,1/-3,-3/-3,0/A",
    "E/Y+": "A/-4,5/1,4/-3,3/-3,0/-1,-4/1,-2/A",
    "E/Z-": "A/3,3/-1,-4/-3,-3/4,1/-3,-3/A",
    "E/Z+": "A/3,3/-1,-4/-5,1/-4,2/4,1/-3,-3/A",
    "F/--": "A/-3,6/0,-3/2,-1/-3,0/3,0/-5,1/0,-3/-1,2/-2,1/A",
    "F/-+": "A/-4,5/1,-2/3,0/-1,2/4,-2/-4,-1/4,1/-3,-3/A",
    "F/Al-": "A/-1,2/4,-2/-3,3/-1,2/4,1/-3,-3/3,0/A",
    "F/Al+": "A/2,5/-3,3/-2,1/-1,2/-3,-3/4,1/2,-1/-2,1/A",
    "F/Ar-": "A/-3,6/-3,0/3,0/-1,-1/1,-2/2,-1/1,-2/A",
    "F/Ar+": "A/-1,-1/4,1/2,-1/-2,-2/-1,2/3,0/4,-2/-3,3/A",
    "F/E-": "a/3,0/1,4/3,0/0,-3/3,0/-1,2/-3,0/a",
    "F/E+": "A/-1,2/-2,1/-3,0/5,-1/-2,1/-1,2/0,-3/4,-2/A",
    "F/F-": "A/5,-4/-2,-2/-1,2/1,1/-3,3/A",
    "F/F+": "A/-3,0/2,2/-2,1/5,-1/6,0/-2,-2/A",
    "F/Gal-": "A/-3,6/0,-3/0,3/5,-1/-3,0/1,1/-3,3/A",
    "F/Gal+": "a/4,-5/5,-1/3,0/0,-3/1,-2/5,-1/a",
    "F/Gar-": "A/-3,3/2,-1/-2,1/-3,3/3,0/-1,-4/4,-2/A",
    "F/Gar+": "A/-3,3/2,-1/1,-2/-3,0/-4,-1/-5,1/A",
    "F/Gol-": "A/-4,2/1,4/0,-3/3,0/-1,-1/-2,-2/3,0/A",
    "F/Gol+": "A/-1,5/1,-2/-3,0/3,0/5,-1/1,-2/A",
    "F/Gor-": "A/-3,6/-1,-1/3,0/4,-2/2,-1/4,1/-3,-3/A",
    "F/Gor+": "a/-5,1/-1,-4/0,-3/-2,1/-1,2/-3,3/a",
    "F/H-": "A/-3,3/-1,-4/-3,0/1,-2/-1,-1/-3,0/1,4/-4,-1/-2,1/A",
    "F/H+": "A/2,-4/4,1/0,-3/-1,2/4,1/-1,-4/4,1/-3,-3/A",
    "F/Ja-": "A/-1,2/1,-2/-3,0/-1,2/4,-2/A",
    "F/Ja+": "A/-4,5/-2,1/0,-3/2,-1/-2,-2/6,0/A",
    "F/Jm-": "a/4,-5/2,-1/0,3/-2,1/-4,2/a",
    "F/Jm+": "a/-3,6/4,-2/-4,-1/1,-2/2,-1/1,4/A",
    "F/Na-": "A/5,-4/4,1/0,-3/0,3/-4,2/-2,1/-3,3/A",
    "F/Na+": "A/5,-4/-5,1/0,3/3,0/-1,-4/-2,1/A",
    "F/Nm-": "a/1,4/-3,0/0,3/-4,2/-2,1/-3,0/-1,2/a",
    "F/Nm+": "a/1,-2/-1,-4/0,3/0,3/-5,1/2,-1/a",
    "F/Rl-": "a/6,-3/4,1/5,-1/-2,-2/2,-1/4,-2/3,0/A",
    "F/Rl+": "a/1,4/-3,3/2,-1/0,3/4,1/-3,3/-1,-1/-2,-2/A",
    "F/Rr-": "A/5,-4/1,4/0,3/-3,-3/-1,2/-2,1/-3,3/A",
    "F/Rr+": "A/3,3/3,0/-4,-1/1,4/-1,-1/1,-2/5,-1/-2,-2/A",
    "F/T-": "a/6,-3/-2,-2/2,-1/-2,1/-4,2/1,1/-3,3/A",
    "F/T+": "a/-5,1/5,-1/-2,1/-1,2/-2,-2/3,0/A",
    "F/Ul-": "A/5,-4/4,-2/3,0/-3,3/-1,2/-2,1/-3,3/A",
    "F/Ul+": "A/-4,5/-5,1/-4,2/-2,1/-1,2/-2,1/2,-1/-2,1/A",
    "F/Ur-": "a/-2,-5/-4,2/-5,1/-1,2/-2,1/0,3/-3,-3/A",
    "F/Ur+": "A/0,-3/3,0/2,-1/-2,1/0,-3/2,2/-2,1/-3,3/A",
    "F/V-": "a/1,-2/-1,2/1,4/6,0/-4,-1/a",
    "F/V+": "a/-5,4/2,-1/1,-2/2,-1/a",
    "F/Y-": "A/5,-4/1,-2/3,0/0,3/-1,2/-2,1/-3,3/A",
    "F/Y+": "a/-5,1/0,3/2,-1/1,-2/-3,0/5,-1/a",
    "F/Z-": "A/6,3/2,-1/0,-3/0,3/1,-2/-1,2/0,-3/-3,3/-2,1/A",
    "F/Z+": "A/-3,-3/-1,2/-2,1/-1,-4/1,4/-3,0/-4,-1/-2,1/A",
    "Gal/--": "A/-3,-3/-1,-4/-2,1/0,-3/-3,-3/3,0/-3,3/A",
    "Gal/-+": "A/-3,-3/-1,-4/1,-2/0,3/-3,-3/-3,0/A",
    "Gal/Al-": "a/-3,6/-3,0/1,-2/-3,0/2,2/-3,3/-5,1/A",
    "Gal/Al+": "A/5,-4/1,4/0,3/-3,0/-1,2/-5,1/A",
    "Gal/Ar-": "A/-4,5/1,-2/0,-3/-4,-1/-5,1/A",
    "Gal/Ar+": "A/-1,2/-2,1/-3,0/0,-3/-1,-1/-5,1/A",
    "Gal/E-": "A/3,0/-3,-3/-3,0/-1,-4/-3,3/1,-2/-3,-3/A",
    "Gal/E+": "A/3,0/-1,-1/-3,3/1,-2/0,3/0,-3/A",
    "Gal/F-": "A/5,-4/-5,1/3,0/6,0/-3,0/-1,2/-5,1/A",
    "Gal/F+": "A/5,-4/-5,1/-3,0/3,0/-1,2/-5,1/A",
    "Gal/Gal-": "A/2,-1/0,-3/4,1/-3,3/-4,-1/4,1/-3,0/A",
    "Gal/Gal+": "a/-3,0/4,1/-1,-4/0,-3/4,-2/-1,-4/1,4/-3,3/A",
    "Gal/Gar-": "A/0,3/-3,-3/-1,2/-3,-3/-5,1/A",
    "Gal/Gar+": "A/-3,-3/-1,-4/-3,-3/-5,1/0,-3/-3,-3/A",
    "Gal/Gol-": "A/-3,-3/-1,-4/-3,3/1,4/-3,-3/A",
    "Gal/Gol+": "A/-3,-3/-1,2/-3,3/-2,1/6,0/-3,3/A",
    "Gal/Gor-": "a/0,3/4,1/-1,2/1,1/-1,2/1,4/0,3/A",
    "Gal/Gor+": "a/-3,0/3,0/-2,1/2,-1/-2,1/0,-3/2,2/-2,1/A",
    "Gal/H-": "A/3,0/0,-3/3,0/-1,2/-3,3/6,0/-2,-2/A",
    "Gal/H+": "A/0,3/0,-3/0,3/-4,-1/-3,-3/-5,1/A",
    "Gal/Ja-": "A/-3,-3/-1,2/-5,1/-3,0/-3,-3/A",
    "Gal/Ja+": "A/-3,-3/-1,-4/4,-2/-3,0/6,0/-3,3/A",
    "Gal/Jm-": "A/-4,2/3,0/1,4/0,-3/-4,-1/-3,0/4,-2/A",
    "Gal/Jm+": "A/-4,2/3,0/1,4/0,-3/-4,-1/3,0/6,0/-2,-2/A",
    "Gal/Na-": "A/-3,-3/-1,2/-2,1/3,0/-3,-3/-3,0/-3,3/A",
    "Gal/Na+": "A/-3,-3/-1,2/-2,1/-3,0/-3,-3/3,0/A",
    "Gal/Nm-": "A/3,0/-3,0/-3,3/-3,0/-1,2/-3,-3/-5,1/A",
    "Gal/Nm+": "A/3,6/3,0/0,-3/-3,3/-1,2/-3,3/6,0/-2,-2/A",
    "Gal/Rl-": "A/-3,-3/3,0/2,2/-3,3/4,1/6,0/-3,3/A",
    "Gal/Rl+": "A/-3,-3/3,0/2,2/-3,3/1,-2/-3,-3/A",
    "Gal/Rr-": "a/1,-2/-1,-4/0,3/0,3/-3,-3/-5,1/2,-1/a",
    "Gal/Rr+": "a/4,-5/-1,-4/-3,0/4,1/-1,2/-3,3/a",
    "Gal/T-": "a/0,-3/1,4/0,3/2,-1/1,4/-4,2/4,1/A",
    "Gal/T+": "a/1,-5/3,0/-1,2/0,3/0,-3/-3,3/a",
    "Gal/Ul-": "A/-1,2/1,-2/0,3/-4,-1/4,-2/A",
    "Gal/Ul+": "A/-1,2/1,-2/0,3/-4,-1/-2,-2/6,0/A",
    "Gal/Ur-": "A/-4,5/-2,-2/-3,0/3,0/0,-3/-4,2/-5,1/A",
    "Gal/Ur+": "A/5,-4/4,1/0,-3/3,0/2,-1/4,-2/A",
    "Gal/V-": "A/-1,2/4,1/-3,-3/-3,0/0,3/-1,-4/-5,1/A",
    "Gal/V+": "A/-4,5/4,-2/3,0/-3,0/2,-1/4,-2/A",
    "Gal/Y-": "a/6,3/3,0/1,-2/2,-1/4,1/5,-1/-5,1/A",
    "Gal/Y+": "a/4,-2/0,-3/-1,2/-3,3/3,0/-3,0/a",
    "Gal/Z-": "A/6,-3/-1,-1/-3,3/1,-2/3,0/-3,0/-3,3/A",
    "Gal/Z+": "A/3,6/2,2/-3,3/-2,1/0,-3/0,3/A",
    "Gar/--": "A/2,-1/1,-2/3,0/-3,0/0,3/-1,-1/-2,1/A",
    "Gar/-+": "a/-3,-3/4,1/-1,2/-3,0/-3,-3/3,0/a",
    "Gar/Al-": "a/1,-2/2,-1/3,0/1,4/5,-1/a",
    "Gar/Al+": "a/-2,1/2,-1/0,3/1,-2/5,-1/1,1/A",
    "Gar/Ar-": "A/0,-3/3,0/3,0/-1,2/-2,1/-1,-1/-2,1/A",
    "Gar/Ar+": "A/2,-4/3,0/-2,1/-3,3/3,0/-3,0/A",
    "Gar/E-": "a/-3,6/-3,-3/-3,0/1,4/-3,3/-4,-1/-3,-3/a",
    "Gar/E+": "a/-3,0/1,1/-3,3/2,-1/0,-3/3,0/a",
    "Gar/F-": "A/3,3/-1,2/-2,1/-4,2/-2,1/-1,-1/-2,1/A",
    "Gar/F+": "A/0,-3/0,3/2,-1/3,0/-2,-2/-3,3/A",
    "Gar/Gal-": "a/0,3/-3,-3/-2,1/-3,-3/-4,2/a",
    "Gar/Gal+": "a/3,6/-3,-3/-3,0/1,4/-3,3/-3,3/A",
    "Gar/Gar-": "A/-1,2/3,0/1,4/-3,3/-4,-1/4,1/3,0/A",
    "Gar/Gar+": "A/-4,2/-3,-3/-3,0/1,4/-3,0/-4,-1/1,-2/-3,3/A",
    "Gar/Gol-": "A/-3,0/5,-1/-2,1/2,-1/-2,1/-4,2/3,0/a",
    "Gar/Gol+": "A/-3,6/0,-3/-1,-1/3,0/0,-3/3,0/1,4/3,0/A",
    "Gar/Gor-": "a/-3,-3/-2,1/-3,3/2,-1/-3,-3/a",
    "Gar/Gor+": "A/-1,5/1,4/3,0/3,0/-1,2/-5,1/A",
    "Gar/H-": "a/-3,0/0,3/-3,0/0,3/-2,1/-3,3/-3,3/A",
    "Gar/H+": "a/6,3/3,0/0,-3/-2,1/-3,-3/-4,2/a",
    "Gar/Ja-": "A/2,-1/-2,-2/-3,3/0,-3/3,0/-1,-4/-2,1/A",
    "Gar/Ja+": "A/-3,6/0,-3/2,-1/4,-2/3,0/3,0/-1,-4/-2,1/A",
    "Gar/Jm-": "A/-1,2/-2,1/0,-3/-4,2/-2,1/A",
    "Gar/Jm+": "A/-4,5/-2,1/-3,0/-4,2/-2,1/-3,3/A",
    "Gar/Na-": "a/-3,6/1,4/5,-1/-2,-2/-1,-4/3,0/4,-2/A",
    "Gar/Na+": "A/-1,2/4,-2/0,-3/-3,-3/3,0/0,-3/-1,-4/-2,1/A",
    "Gar/Nm-": "A/2,-4/1,4/0,-3/3,0/-1,2/-2,-2/-3,3/A",
    "Gar/Nm+": "a/-3,-3/-2,1/2,-1/0,3/-3,-3/-3,0/a",
    "Gar/Rl-": "A/-4,5/4,1/3,0/6,0/-1,2/-2,1/-3,3/A",
    "Gar/Rl+": "A/5,-4/4,1/0,-3/-1,-4/-2,1/-3,3/A",
    "Gar/Rr-": "A/-3,0/-3,-3/3,0/-1,-4/-2,1/-1,2/-2,1/A",
    "Gar/Rr+": "A/-4,5/-5,1/-3,0/-1,2/-2,1/-3,3/A",
    "Gar/T-": "a/-5,4/-3,0/5,-1/-2,-2/2,-1/6,0/-2,1/A",
    "Gar/T+": "a/-5,4/-3,0/5,-1/-2,-2/-4,-1/4,1/A",
    "Gar/Ul-": "A/3,0/0,-3/2,-1/1,4/-1,-1/-2,-2/-3,3/A",
    "Gar/Ul+": "A/6,-3/-3,0/-1,2/3,0/-2,-2/-3,3/A",
    "Gar/Ur-": "a/1,-2/-1,2/0,-3/4,1/-4,2/a",
    "Gar/Ur+": "a/-2,1/-1,2/0,-3/-3,3/4,1/5,-1/a",
    "Gar/V-": "A/-3,0/0,3/0,-3/-4,2/3,0/-2,-2/-3,3/A",
    "Gar/V+": "A/6,-3/-3,0/-1,2/0,-3/1,1/-3,3/A",
    "Gar/Y-": "A/6,3/-1,2/0,-3/-2,1/-4,-1/3,0/-2,-2/A",
    "Gar/Y+": "A/2,-4/3,0/-2,1/0,3/0,-3/-3,3/A",
    "Gar/Z-": "A/5,-4/1,4/-3,0/3,0/-3,-3/-1,2/-2,1/A",
    "Gar/Z+": "a/3,0/-2,-2/-3,3/2,-1/0,3/0,-3/a",
    "Gol/--": "A/2,-1/-2,-2/3,0/-3,0/0,3/2,-1/-2,1/A",
    "Gol/-+": "a/3,0/-3,-3/-3,0/-2,1/-1,-4/-3,-3/a",
    "Gol/Al-": "A/3,0/-3,0/-3,3/-1,2/3,0/6,0/-2,-2/A",
    "Gol/Al+": "A/3,0/-3,0/-3,3/-1,2/-3,0/4,-2/A",
    "Gol/Ar-": "a/-5,1/-1,-4/-3,0/-2,1/-1,2/a",
    "Gol/Ar+": "a/1,-5/-4,-1/-3,0/1,-2/-1,-4/6,0/a",
    "Gol/E-": "A/-1,2/1,4/-3,-3/-3,0/0,-3/-1,-4/-2,1/A",
    "Gol/E+": "a/3,6/3,0/-2,1/-4,2/1,1/-1,2/a",
    "Gol/F-": "A/3,0/-1,-1/3,0/4,-2/0,-3/3,0/-3,-3/A",
    "Gol/F+": "A/-1,5/-2,-2/-1,2/1,-2/0,-3/3,0/A",
    "Gol/Gal-": "a/3,3/-2,1/-3,3/-1,-4/-3,-3/a",
    "Gol/Gal+": "A/5,-1/4,1/0,3/0,3/-1,-4/4,-2/A",
    "Gol/Gar-": "a/0,3/-5,1/2,-1/1,-2/2,-1/4,-2/0,-3/A",
    "Gol/Gar+": "A/-3,0/0,3/-1,2/1,4/0,-3/3,0/5,-1/4,-2/A",
    "Gol/Gol-": "A/3,0/-1,-4/4,1/-3,3/-4,-1/3,0/-2,1/A",
    "Gol/Gol+": "A/3,0/-1,-4/1,4/-4,-1/-5,1/-3,-3/-1,2/-2,1/A",
    "Gol/Gor-": "a/1,-5/-3,-3/-1,-4/-3,-3/-3,0/a",
    "Gol/Gor+": "A/-1,2/-2,1/-3,0/-3,-3/-1,-1/-2,1/A",
    "Gol/H-": "a/-2,4/-3,-3/-1,2/3,0/0,-3/-3,0/6,0/a",
    "Gol/H+": "a/4,-2/-3,-3/-1,2/0,3/0,-3/0,3/a",
    "Gol/Ja-": "a/-2,-5/-1,-4/4,-2/0,-3/-1,-4/4,1/-3,0/A",
    "Gol/Ja+": "A/3,0/-3,0/2,-1/-2,1/3,0/0,-3/2,2/-2,1/A",
    "Gol/Jm-": "A/-1,2/-5,1/0,-3/-1,2/-2,1/A",
    "Gol/Jm+": "A/5,-4/-5,1/-3,0/2,-1/1,4/6,0/A",
    "Gol/Na-": "A/-4,2/-3,0/-3,0/-2,-2/-3,3/-4,-1/-3,0/a",
    "Gol/Na+": "A/5,-4/-2,1/0,3/-3,0/-3,-3/3,0/-1,-1/-2,1/A",
    "Gol/Nm-": "a/3,0/1,4/0,-3/2,-1/3,0/-3,3/-2,1/A",
    "Gol/Nm+": "a/0,-3/-3,-3/3,0/1,-2/-1,-4/-3,-3/a",
    "Gol/Rl-": "A/3,-3/2,-1/1,4/0,-3/6,0/-1,2/-2,1/A",
    "Gol/Rl+": "A/3,-3/-1,2/4,1/3,0/-1,-4/-2,1/A",
    "Gol/Rr-": "A/-3,3/-1,2/1,-2/0,-3/6,0/-1,-1/-2,1/A",
    "Gol/Rr+": "A/3,-3/-1,2/-2,1/0,3/5,-1/-2,1/A",
    "Gol/T-": "A/3,6/3,0/0,3/-4,-1/1,4/-1,-1/-2,1/A",
    "Gol/T+": "A/-1,-4/0,-3/-5,1/-3,0/-3,3/-1,2/a",
    "Gol/Ul-": "a/-2,4/-4,-1/3,0/1,-2/2,-1/a",
    "Gol/Ul+": "a/-2,4/-4,-1/3,0/1,-2/-4,-1/6,0/a",
    "Gol/Ur-": "A/2,-1/4,-2/0,3/-3,-3/-3,0/-4,-1/-2,1/A",
    "Gol/Ur+": "a/4,-2/-1,2/0,3/-3,0/1,4/2,-1/a",
    "Gol/V-": "A/-1,2/-2,-2/-1,2/-5,1/0,3/0,3/-3,-3/A",
    "Gol/V+": "a/-2,4/2,-1/0,-3/3,0/4,-2/-1,2/a",
    "Gol/Y-": "A/-1,5/-3,0/-2,-2/-3,0/2,-1/-2,1/-3,-3/A",
    "Gol/Y+": "A/0,-3/-3,3/-3,0/-1,2/-3,0/4,-2/A",
    "Gol/Z-": "A/6,-3/-3,-3/-1,2/1,4/-3,0/2,-1/-2,1/A",
    "Gol/Z+": "a/-3,6/-3,0/1,-2/5,-1/-2,-2/2,-1/a",
    "Gor/--": "A/5,2/-3,3/1,-2/2,-1/0,3/-3,-3/-2,-2/A",
    "Gor/-+": "A/6,3/-3,-3/3,0/-1,2/-2,1/-3,-3/A",
    "Gor/Al-": "A/-1,5/1,4/0,3/2,-1/-2,1/A",
    "Gor/Al+": "A/2,-4/4,1/0,-3/-3,3/-1,2/-2,1/A",
    "Gor/Ar-": "A/-4,5/1,-2/2,-1/0,3/1,4/2,2/-2,1/A",
    "Gor/Ar+": "A/5,-1/-2,1/0,3/-3,0/-4,-1/-2,1/A",
    "Gor/E-": "A/-3,0/0,3/-1,2/-5,1/2,2/-2,1/-3,3/A",
    "Gor/E+": "A/-3,6/-3,0/2,-1/4,-2/-1,-1/1,-2/A",
    "Gor/F-": "A/-1,5/-2,1/6,0/-3,0/-1,2/-2,1/-3,3/A",
    "Gor/F+": "A/-1,5/4,1/3,0/-1,2/-2,1/-3,3/A",
    "Gor/Gal-": "A/-3,0/-1,-4/-2,1/-1,-1/-2,1/-4,-1/-3,0/a",
    "Gor/Gal+": "A/5,-4/1,-2/-1,2/-3,3/4,1/3,0/-1,-4/-2,1/A",
    "Gor/Gar-": "A/3,3/-1,-4/-3,3/-2,1/-3,-3/A",
    "Gor/Gar+": "A/3,3/-1,-4/-3,3/1,-2/-3,3/6,0/A",
    "Gor/Gol-": "A/-4,2/-3,-3/4,1/-3,-3/-3,0/A",
    "Gor/Gol+": "A/3,3/3,0/-4,2/-3,-3/-2,1/-3,-3/A",
    "Gor/Gor-": "a/0,3/4,1/-1,-4/-3,3/4,1/3,0/2,-1/a",
    "Gor/Gor+": "a/-3,0/3,0/-2,1/2,-1/4,1/0,-3/2,2/-2,1/A",
    "Gor/H-": "A/-1,5/-3,-3/-2,1/3,0/0,-3/-3,0/6,0/A",
    "Gor/H+": "A/5,-1/-3,-3/-2,1/0,3/0,-3/0,3/A",
    "Gor/Ja-": "A/3,3/-3,0/5,-1/-2,1/-3,-3/A",
    "Gor/Ja+": "A/3,3/-3,0/5,-1/1,4/6,0/-3,3/A",
    "Gor/Jm-": "a/-5,4/-4,-1/0,3/-3,0/-3,3/-2,-2/-1,2/a",
    "Gor/Jm+": "a/3,0/-2,-2/2,-1/-3,3/-2,1/3,0/-1,-1/-2,1/A",
    "Gor/Na-": "A/6,3/-3,-3/3,0/-1,2/1,4/6,0/-3,3/A",
    "Gor/Na+": "A/-3,6/-3,-3/-3,0/2,-1/-2,1/-3,-3/A",
    "Gor/Nm-": "A/2,-4/-3,-3/4,1/3,0/-3,0/0,3/-3,3/A",
    "Gor/Nm+": "A/-1,2/0,-3/-3,-3/-2,1/5,-1/3,0/6,0/-2,1/A",
    "Gor/Rl-": "A/-3,6/-3,0/2,-1/-5,1/2,2/-2,1/-3,3/A",
    "Gor/Rl+": "A/3,3/-1,-4/4,-2/-1,-1/-2,1/-3,-3/A",
    "Gor/Rr-": "a/-3,3/1,-2/-1,-4/3,0/4,1/-4,-1/6,0/a",
    "Gor/Rr+": "a/-3,3/1,-2/-1,-4/3,0/4,1/2,-1/a",
    "Gor/T-": "A/5,-1/1,-2/3,0/0,-3/-1,-4/-2,1/-3,3/A",
    "Gor/T+": "a/0,-3/-3,3/-3,0/-2,1/-3,0/5,-1/a",
    "Gor/Ul-": "a/-2,1/2,-1/-2,1/-1,-4/3,0/0,3/-3,-3/a",
    "Gor/Ul+": "a/3,0/-3,0/-3,3/-2,1/-3,0/5,-1/a",
    "Gor/Ur-": "A/-4,2/4,1/0,-3/-1,2/1,-2/A",
    "Gor/Ur+": "A/2,-4/1,4/0,-3/-4,-1/6,0/1,4/A",
    "Gor/V-": "A/2,-4/1,4/0,-3/2,-1/1,4/-3,-3/-3,3/A",
    "Gor/V+": "a/-2,4/-1,-1/-2,1/2,-1/0,-3/3,0/a",
    "Gor/Y-": "a/3,0/1,4/-4,-1/4,-2/-1,-4/-2,1/0,-3/A",
    "Gor/Y+": "a/-2,-5/0,-3/-4,2/-3,0/-3,3/-2,1/A",
    "Gor/Z-": "A/0,3/0,-3/-1,2/4,-2/-1,-1/1,-2/-3,3/A",
    "Gor/Z+": "A/0,-3/0,3/2,-1/-3,3/-2,-2/3,0/A",
    "H/--": "a/-5,1/5,-1/-2,1/5,-1/-5,1/A",
    "H/-+": "a/-2,-2/-3,0/-4,2/4,-2/-1,2/-2,-2/A",
    "H/Al-": "A/0,-3/-1,-4/1,4/-4,2/4,1/-1,-4/-3,0/a",
    "H/Al+": "A/-4,2/-3,-3/-3,0/-5,1/3,0/3,0/-4,-1/-2,1/A",
    "H/Ar-": "a/3,0/1,4/-4,-1/4,-2/-1,-4/1,4/0,3/A",
    "H/Ar+": "a/-2,4/-1,-4/-5,1/-4,-1/-2,1/-4,-1/-5,1/-3,0/A",
    "H/E-": "a/3,-3/-2,-2/-3,3/-4,-1/-2,-2/-4,-1/-2,-2/A",
    "H/E+": "A/3,3/-1,-4/-3,3/-5,1/-3,0/-3,-3/A",
    "H/F-": "A/6,3/0,3/2,-1/0,-3/-2,-2/-1,-4/-2,1/-1,2/-2,1/A",
    "H/F+": "A/2,-4/4,1/-3,0/-1,2/1,4/3,0/3,0/-3,-3/A",
    "H/Gal-": "a/-3,6/0,-3/3,0/1,4/-3,3/-4,2/-2,-2/A",
    "H/Gal+": "a/-3,0/3,0/-3,0/-2,1/-3,-3/-4,2/a",
    "H/Gar-": "A/6,-3/0,-3/0,3/-1,2/-3,3/6,0/-2,-2/A",
    "H/Gar+": "A/-3,6/0,-3/3,0/-4,-1/-3,-3/-5,1/A",
    "H/Gol-": "A/-4,2/-3,-3/-2,1/3,0/6,0/-3,0/-3,0/A",
    "H/Gol+": "A/-4,2/-3,-3/-2,1/-3,0/3,0/-3,0/A",
    "H/Gor-": "a/-2,4/-3,-3/-1,-4/0,-3/0,3/0,3/6,0/a",
    "H/Gor+": "a/-5,1/-3,-3/-1,-4/0,3/-3,0/0,3/a",
    "H/H-": "a/3,-3/-2,-2/-3,3/-4,2/-2,-2/A",
    "H/H+": "A/-4,2/-3,-3/-2,-2/-3,3/A",
    "H/Ja-": "a/1,-5/-1,-4/-3,0/0,3/1,4/-4,2/-2,-2/A",
    "H/Ja+": "a/1,-5/-1,2/3,0/0,-3/1,4/-4,2/a",
    "H/Jm-": "A/5,-1/1,4/0,3/-3,0/-3,3/-1,2/-5,1/A",
    "H/Jm+": "A/-4,2/1,-2/3,0/-3,0/-4,-1/-5,1/A",
    "H/Na-": "A/3,3/-3,0/5,-1/4,-2/-3,0/6,0/-3,3/A",
    "H/Na+": "A/-3,-3/3,0/-4,2/-5,1/-3,0/-3,-3/A",
    "H/Nm-": "A/5,-1/-3,-3/-5,1/-3,0/-3,-3/-3,0/-3,-3/A",
    "H/Nm+": "a/-3,-3/3,0/-5,1/-4,2/-3,0/-3,-3/a",
    "H/Rl-": "A/0,-3/-3,-3/3,0/2,-1/-3,3/1,-2/-3,-3/A",
    "H/Rl+": "A/3,-3/-4,-1/-3,3/1,-2/-1,-4/-3,3/-3,-3/-2,1/A",
    "H/Rr-": "a/4,1/0,3/-1,-1/-2,-2/3,0/-1,-4/-3,3/a",
    "H/Rr+": "A/2,-1/-2,1/0,-3/-1,-4/0,-3/4,-2/5,-1/-2,1/A",
    "H/T-": "A/-3,-3/-1,-4/1,4/-1,-1/6,0/-2,1/-3,0/-1,2/-2,1/A",
    "H/T+": "A/-3,-3/-1,-4/1,4/5,-1/4,1/-3,0/-1,2/-2,1/A",
    "H/Ul-": "a/0,-3/4,1/-1,-4/-5,1/-1,-4/4,1/0,-3/A",
    "H/Ul+": "A/3,6/-4,-1/4,-2/3,0/-4,2/-2,1/-1,2/-5,1/A",
    "H/Ur-": "A/3,0/-4,-1/4,1/5,-1/4,1/-4,-1/3,0/a",
    "H/Ur+": "A/-1,5/-3,-3/3,0/4,-2/-3,0/-3,0/-1,-4/-2,1/A",
    "H/V-": "A/-3,3/-1,-4/-3,0/-2,1/-1,2/-3,0/3,0/-3,-3/-2,1/A",
    "H/V+": "A/5,-1/1,4/3,0/2,-1/4,1/-1,-4/1,4/-3,-3/A",
    "H/Y-": "a/-2,1/-1,2/0,3/-2,1/-1,-1/-2,1/0,3/-1,2/-2,1/A",
    "H/Y+": "A/2,-1/-2,1/0,-3/-1,-4/4,-2/-4,-1/-2,1/-3,-3/A",
    "H/Z-": "A/-3,-3/-3,0/-4,2/-3,3/-2,1/6,0/-3,3/A",
    "H/Z+": "A/-3,-3/3,0/-4,2/-3,3/1,4/-3,-3/A",
    "Ja/--": "a/-3,0/0,3/0,-3/-3,3/-3,0/a",
    "Ja/-+": "a/-3,6/-3,0/3,0/0,3/-3,3/-3,-3/a",
    "Ja/Al-": "A/0,-3/0,3/2,-1/3,0/-5,1/A",
    "Ja/Al+": "A/-3,6/-3,0/0,3/5,-1/0,-3/4,-2/A",
    "Ja/Ar-": "A/5,-1/-3,0/-2,1/0,-3/0,3/A",
    "Ja/Ar+": "a/4,1/5,-1/1,-2/-4,2/-3,0/4,1/A",
    "Ja/E-": "A/-1,2/-2,1/0,3/-1,-4/4,1/-3,-3/3,0/A",
    "Ja/E+": "a/3,3/-2,1/-4,-1/-3,0/-3,-3/3,0/a",
    "Ja/F-": "a/4,-5/-1,2/0,3/1,-2/-4,2/a",
    "Ja/F+": "a/1,-2/2,-1/3,0/4,1/-4,2/-2,-2/A",
    "Ja/Gal-": "A/-1,2/-2,1/3,0/5,-1/1,-2/A",
    "Ja/Gal+": "A/-4,5/1,-2/0,3/-1,-1/6,0/1,4/A",
    "Ja/Gar-": "a/0,-3/1,4/-4,-1/-3,0/4,-2/-1,-4/1,4/A",
    "Ja/Gar+": "A/2,-1/1,-2/0,-3/-4,-1/4,-2/-1,2/1,4/-3,-3/A",
    "Ja/Gol-": "A/5,-1/0,-3/1,4/0,-3/-4,-1/0,3/-5,1/A",
    "Ja/Gol+": "A/5,-4/1,4/0,-3/-4,-1/0,3/-2,1/-1,-1/-2,1/A",
    "Ja/Gor-": "A/-1,2/4,-2/0,3/-1,2/1,-2/A",
    "Ja/Gor+": "A/2,-1/4,-2/3,0/-1,2/4,1/6,0/A",
    "Ja/H-": "A/5,-1/1,-2/-3,0/0,3/-1,2/6,0/-2,-2/A",
    "Ja/H+": "A/5,-1/1,4/3,0/0,-3/-1,2/4,-2/A",
    "Ja/Ja-": "A/2,-4/0,3/4,1/-3,0/-1,-4/3,0/-5,1/A",
    "Ja/Ja+": "A/-1,-4/0,-3/1,4/0,3/-4,-1/3,0/6,0/-2,1/A",
    "Ja/Jm-": "a/0,3/-3,-3/3,0/a",
    "Ja/Jm+": "a/3,3/3,0/-3,0/-3,-3/a",
    "Ja/Na-": "A/-4,2/1,-2/0,3/-3,0/-4,-1/6,0/-2,-2/A",
    "Ja/Na+": "A/-4,2/4,1/0,-3/0,3/-4,-1/4,-2/A",
    "Ja/Nm-": "a/0,-3/0,3/0,3/6,0/-3,0/a",
    "Ja/Nm+": "a/6,-3/-3,0/0,3/-3,0/a",
    "Ja/Rl-": "A/-1,2/4,1/0,3/-1,-4/1,-2/A",
    "Ja/Rl+": "A/5,-4/1,4/0,3/2,-1/6,0/1,4/A",
    "Ja/Rr-": "a/3,3/-2,1/-1,2/6,0/-3,3/a",
    "Ja/Rr+": "a/3,3/4,1/-4,-1/-3,-3/a",
    "Ja/T-": "A/-3,0/0,3/-1,2/0,-3/4,-2/A",
    "Ja/T+": "A/0,-3/0,3/2,-1/0,3/6,0/-2,-2/A",
    "Ja/Ul-": "A/-4,2/3,0/1,-2/0,3/0,-3/A",
    "Ja/Ul+": "a/-5,1/-4,-1/0,-3/0,3/4,-2/2,-1/a",
    "Ja/Ur-": "A/0,3/0,-3/-1,2/-3,0/4,-2/A",
    "Ja/Ur+": "A/0,3/0,-3/-1,2/-3,0/-2,-2/6,0/A",
    "Ja/V-": "a/1,-5/-1,2/0,3/1,-2/-1,2/a",
    "Ja/V+": "a/-5,1/2,-1/0,3/-2,1/-1,-4/6,0/a",
    "Ja/Y-": "A/5,-1/0,-3/-2,1/0,3/-3,0/A",
    "Ja/Y+": "A/6,3/3,0/-3,0/-4,2/0,-3/4,-2/A",
    "Ja/Z-": "a/0,3/-5,1/3,0/2,-1/0,-3/-3,0/-2,1/A",
    "Ja/Z+": "a/4,1/-1,2/-2,1/-1,2/0,3/4,-2/A",
    "Jm/--": "A/3,0/0,-3/3,0/-3,0/-3,3/A",
    "Jm/-+": "A/6,3/3,0/0,-3/-3,0/-3,-3/-3,3/A",
    "Jm/Al-": "a/1,-5/3,0/-1,2/0,3/-3,0/a",
    "Jm/Al+": "A/2,-1/-2,1/0,-3/2,-1/1,1/-3,3/A",
    "Jm/Ar-": "a/-3,6/-3,0/1,-2/0,-3/5,-1/a",
    "Jm/Ar+": "a/6,-3/-3,0/-2,1/0,3/6,0/-1,-1/a",
    "Jm/E-": "A/3,3/-1,2/1,4/0,-3/-3,-3/3,0/-3,3/A",
    "Jm/E+": "A/-3,6/-3,-3/-3,0/-1,-4/1,4/-3,-3/A",
    "Jm/F-": "A/-1,2/-2,1/-3,0/2,-1/4,-2/A",
    "Jm/F+": "A/5,-4/1,-2/0,-3/-3,3/-1,2/-5,1/A",
    "Jm/Gal-": "A/5,-4/1,1/-3,3/3,0/-3,0/-1,-4/-2,1/A",
    "Jm/Gal+": "a/4,-2/-3,0/-4,-1/0,3/1,4/-3,0/-4,2/-2,-2/A",
    "Jm/Gar-": "A/3,3/-1,2/4,-2/-3,0/-3,-3/A",
    "Jm/Gar+": "A/3,3/-1,2/1,1/-3,3/3,0/-3,-3/A",
    "Jm/Gol-": "A/3,3/3,0/-4,2/1,4/-3,-3/A",
    "Jm/Gol+": "A/3,3/-3,0/-4,2/-2,1/6,0/-3,3/A",
    "Jm/Gor-": "A/2,-1/4,1/0,-3/-3,3/-3,0/5,-1/-2,1/A",
    "Jm/Gor+": "A/5,-4/1,-2/0,3/-3,3/3,0/3,0/-1,-4/-2,1/A",
    "Jm/H-": "A/3,0/-3,-3/-3,0/2,-1/4,-2/3,0/-3,-3/A",
    "Jm/H+": "a/-2,4/-4,-1/3,0/0,-3/-2,1/5,-1/a",
    "Jm/Ja-": "A/0,3/-3,-3/3,0/A",
    "Jm/Ja+": "A/3,3/3,0/3,0/-3,-3/A",
    "Jm/Jm-": "a/0,3/-2,-2/2,-1/1,-2/0,3/-1,-1/1,-2/A",
    "Jm/Jm+": "A/-1,5/0,-3/1,-2/-1,2/4,-2/-3,0/2,-1/-2,1/A",
    "Jm/Na-": "A/0,-3/0,3/0,3/6,0/-3,0/A",
    "Jm/Na+": "A/6,-3/-3,0/0,3/-3,0/A",
    "Jm/Nm-": "A/-4,-1/-2,1/-1,2/1,-2/-4,-1/6,0/-2,1/A",
    "Jm/Nm+": "A/-4,-1/-2,1/-1,2/1,-2/2,-1/4,1/A",
    "Jm/Rl-": "A/3,3/-1,2/-2,1/-3,3/6,0/A",
    "Jm/Rl+": "A/3,3/-1,-4/1,-2/-3,-3/A",
    "Jm/Rr-": "a/1,-2/-1,-4/0,3/4,1/-1,2/a",
    "Jm/Rr+": "a/-5,4/-4,-1/0,3/1,4/-1,-4/6,0/a",
    "Jm/T-": "a/6,-3/-3,0/-2,1/3,0/-4,2/a",
    "Jm/T+": "A/-4,5/4,1/0,3/-3,0/-1,-4/1,-2/A",
    "Jm/Ul-": "a/0,-3/0,3/1,-2/3,0/-4,2/a",
    "Jm/Ul+": "a/3,0/0,-3/0,3/4,-2/-3,0/5,-1/a",
    "Jm/Ur-": "a/-2,4/-3,0/2,-1/0,-3/3,0/a",
    "Jm/Ur+": "A/5,-1/-2,1/0,-3/2,-1/-2,1/-3,3/A",
    "Jm/V-": "A/5,-4/-2,1/0,3/2,-1/-5,1/A",
    "Jm/V+": "A/2,-1/-2,1/-3,3/-3,0/-1,2/4,-2/A",
    "Jm/Y-": "a/-3,0/0,3/-2,1/0,-3/5,-1/a",
    "Jm/Y+": "A/-4,5/1,4/0,-3/3,0/-4,-1/1,-2/A",
    "Jm/Z-": "A/3,0/-3,-3/-3,0/-4,-1/-2,1/6,0/-3,3/A",
    "Jm/Z+": "A/6,3/-3,-3/3,0/-4,-1/1,4/-3,-3/A",
    "Na/--": "a/-3,-3/-3,0/-3,-3/-3,0/-3,-3/a",
    "Na/-+": "A/-3,-3/-3,0/-4,2/-5,1/-3,0/-3,-3/A",
    "Na/Al-": "A/2,2/-3,3/4,1/0,3/-1,2/-3,-3/4,1/-1,2/-2,1/A",
    "Na/Al+": "A/0,-3/-1,-4/0,-3/4,1/-4,-1/4,1/-1,2/-2,-2/A",
    "Na/Ar-": "a/-2,1/-1,2/0,3/-2,1/5,-1/0,3/-2,1/-1,2/-2,1/A",
    "Na/Ar+": "a/3,6/0,3/-2,1/-1,2/-2,1/3,0/-1,-1/-2,1/A",
    "Na/E-": "a/3,3/-2,1/-1,-1/-3,0/-3,-3/a",
    "Na/E+": "A/-3,-3/3,0/-4,2/-3,3/1,-2/-3,-3/A",
    "Na/F-": "a/-2,1/-4,-1/3,0/0,-3/4,-2/-1,2/-3,3/a",
    "Na/F+": "a/-2,1/-4,-1/3,0/3,0/-5,1/2,-1/a",
    "Na/Gal-": "A/5,-1/1,-2/0,-3/0,3/-4,-1/1,1/-3,3/A",
    "Na/Gal+": "a/3,3/-2,1/-1,2/0,3/-3,-3/-3,0/a",
    "Na/Gar-": "A/-3,0/3,0/-3,0/-1,2/-3,-3/-2,-2/-3,3/A",
    "Na/Gar+": "A/-4,-1/-3,0/4,-2/-1,2/-3,-3/-3,0/-3,3/-2,1/A",
    "Na/Gol-": "A/5,-1/-3,-3/-2,1/3,0/-3,0/-3,3/-3,0/A",
    "Na/Gol+": "a/4,-5/-1,2/-3,0/1,4/-1,-1/4,1/-1,-1/-2,1/A",
    "Na/Gor-": "a/-3,0/1,4/3,0/2,-1/0,-3/-3,3/-2,1/A",
    "Na/Gor+": "a/6,3/-3,-3/3,0/1,-2/2,-1/-3,-3/a",
    "Na/H-": "A/5,-1/-3,-3/-5,1/3,0/-3,-3/-3,0/-3,-3/A",
    "Na/H+": "a/-3,-3/3,0/4,-2/5,-1/-3,0/-3,-3/a",
    "Na/Ja-": "a/4,-2/-1,-4/0,3/-3,0/-2,1/-4,2/-2,-2/A",
    "Na/Ja+": "A/5,2/-2,1/2,-1/1,-2/-1,2/4,1/A",
    "Na/Jm-": "a/3,0/3,0/6,0/-3,0/-3,0/a",
    "Na/Jm+": "a/3,0/-3,0/3,0/-3,0/a",
    "Na/Na-": "a/4,-2/-4,2/-2,1/5,-1/-5,1/A",
    "Na/Na+": "a/-2,-2/-1,-4/-5,1/5,-1/-3,0/-2,-2/A",
    "Na/Nm-": "A/-4,2/-3,-3/-5,1/A",
    "Na/Nm+": "a/3,-3/-3,3/a",
    "Na/Rl-": "A/-4,-1/-3,3/-2,1/-4,-1/-3,-3/-3,3/-2,1/A",
    "Na/Rl+": "A/-1,-4/-3,3/1,-2/-1,2/-3,3/4,1/A",
    "Na/Rr-": "a/3,0/-3,-3/-3,0/0,3/-5,1/-4,-1/-3,-3/a",
    "Na/Rr+": "A/5,-4/1,-2/-1,2/1,4/-1,-1/-2,1/-1,-1/-2,1/A",
    "Na/T-": "a/1,-2/-4,2/0,3/0,-3/4,1/2,-1/-3,3/a",
    "Na/T+": "a/6,3/4,-2/-1,2/-2,1/0,-3/5,-1/-3,-3/-2,1/A",
    "Na/Ul-": "A/3,6/0,3/-1,2/0,-3/-3,-3/4,1/0,3/-1,2/-2,1/A",
    "Na/Ul+": "A/5,2/0,3/0,3/-2,-2/-1,-4/4,1/-4,-1/-2,1/A",
    "Na/Ur-": "A/2,-1/-2,1/2,-1/-3,3/1,-2/-3,-3/3,0/-1,-4/-2,1/A",
    "Na/Ur+": "A/-1,5/4,1/3,0/-1,2/4,1/-4,-1/1,-2/-3,-3/A",
    "Na/V-": "a/4,-5/-4,-1/-3,0/3,0/-5,1/-1,2/-3,3/a",
    "Na/V+": "a/4,-5/-4,-1/-3,0/0,-3/4,-2/2,-1/a",
    "Na/Y-": "a/-2,1/5,-1/0,-3/0,3/1,4/2,-1/-3,3/a",
    "Na/Y+": "A/-4,5/4,1/3,0/-3,0/5,-1/0,-3/-3,-3/-5,1/A",
    "Na/Z-": "a/-3,-3/-3,0/-2,-2/-4,-1/-3,-3/a",
    "Na/Z+": "a/3,-3/-5,1/-4,-1/-2,-2/2,-1/-2,-2/A",
    "Nm/--": "A/-3,-3/-3,0/-3,-3/-3,0/-3,-3/A",
    "Nm/-+": "A/3,3/-3,0/-3,-3/-3,0/6,0/-3,3/A",
    "Nm/Al-": "A/3,3/-3,0/-4,2/-2,1/-4,2/1,-2/-3,0/-1,2/-2,1/A",
    "Nm/Al+": "A/2,-1/1,-2/3,0/-1,2/4,-2/0,3/3,0/-3,-3/A",
    "Nm/Ar-": "A/-1,2/4,1/3,0/-3,-3/3,0/6,0/-3,0/-1,2/-2,1/A",
    "Nm/Ar+": "A/3,6/3,0/0,3/-1,2/1,-2/-3,0/-1,2/-2,1/A",
    "Nm/E-": "A/-3,-3/3,0/-1,-1/1,-2/-3,-3/A",
    "Nm/E+": "A/-3,-3/-3,0/-1,-1/4,1/6,0/-3,3/A",
    "Nm/F-": "A/-1,-4/0,3/0,-3/4,-2/-1,2/0,3/-2,1/A",
    "Nm/F+": "A/5,-4/-5,1/3,0/0,3/-4,-1/1,-2/A",
    "Nm/Gal-": "a/0,-3/4,1/-3,3/-1,2/3,0/0,3/-2,1/A",
    "Nm/Gal+": "A/-1,2/1,-2/-1,2/0,3/4,1/0,3/-1,2/-2,1/A",
    "Nm/Gar-": "A/-4,5/4,-2/5,-1/4,1/-4,-1/-2,1/-3,-3/A",
    "Nm/Gar+": "A/3,3/-1,2/-2,1/0,3/-3,-3/-3,0/A",
    "Nm/Gol-": "A/6,-3/0,-3/-1,2/1,4/-3,0/-1,-1/-2,1/A",
    "Nm/Gol+": "A/3,0/-3,-3/-3,0/2,-1/1,4/-3,-3/A",
    "Nm/Gor-": "a/4,-5/0,-3/-3,-3/-1,2/4,-2/-3,0/-1,-4/a",
    "Nm/Gor+": "A/-4,5/1,4/0,3/0,3/-3,-3/-3,0/-4,2/-2,1/A",
    "Nm/H-": "A/3,3/-3,0/-4,2/-5,1/-3,0/6,0/-3,3/A",
    "Nm/H+": "A/-3,-3/3,0/5,-1/4,-2/-3,0/-3,-3/A",
    "Nm/Ja-": "A/6,-3/0,-3/0,3/0,3/6,0/A",
    "Nm/Ja+": "A/3,6/0,3/-3,0/0,3/A",
    "Nm/Jm-": "A/-1,5/4,1/0,3/3,0/6,0/-1,2/-5,1/A",
    "Nm/Jm+": "A/5,-1/1,-2/0,-3/0,3/-1,2/-5,1/A",
    "Nm/Na-": "A/6,0/-3,-3/-3,3/A",
    "Nm/Na+": "A/3,-3/-3,3/A",
    "Nm/Nm-": "A/-4,2/4,-2/-3,0/5,-1/-5,1/A",
    "Nm/Nm+": "a/-2,-2/3,0/5,-1/-5,1/-1,2/-2,-2/A",
    "Nm/Rl-": "A/-3,0/0,3/-3,0/-3,0/-1,-4/1,-2/-3,-3/A",
    "Nm/Rl+": "A/3,0/-3,0/3,0/-1,2/0,3/-2,-2/2,-1/-2,-2/A",
    "Nm/Rr-": "a/4,1/-3,3/-1,2/-2,1/-1,-4/4,-2/-3,-3/A",
    "Nm/Rr+": "a/4,1/-3,3/-1,2/1,-2/-3,3/-1,-4/a",
    "Nm/T-": "A/3,-3/2,-1/1,4/0,-3/3,0/-4,2/-2,1/A",
    "Nm/T+": "A/-1,2/4,-2/0,-3/0,3/3,0/-3,-3/-4,2/-2,1/A",
    "Nm/Ul-": "a/6,3/-2,1/0,-3/0,3/-1,-4/-2,1/-4,2/6,0/-2,1/A",
    "Nm/Ul+": "A/3,6/5,-1/1,4/-4,2/1,-2/-1,-4/0,3/-2,1/A",
    "Nm/Ur-": "a/3,6/3,0/-2,1/2,-1/-2,1/0,3/-3,0/-1,2/-2,1/A",
    "Nm/Ur+": "A/-4,5/1,-2/0,-3/-1,2/-5,1/-1,-4/1,-2/-3,-3/A",
    "Nm/V-": "A/-1,2/1,4/0,3/0,-3/5,-1/1,-2/-3,3/A",
    "Nm/V+": "A/-1,2/4,-2/-3,0/-3,0/-1,-4/-2,1/A",
    "Nm/Y-": "A/-1,2/-5,1/3,0/0,-3/-4,-1/-2,1/-3,3/A",
    "Nm/Y+": "A/3,6/0,3/-1,2/1,-2/0,-3/0,3/-1,2/-2,1/A",
    "Nm/Z-": "A/3,3/-1,2/-2,-2/-3,0/-3,-3/A",
    "Nm/Z+": "a/1,-5/-3,3/-4,-1/-2,-2/-4,-1/-2,-2/A",
    "Rl/--": "a/0,-3/-3,-3/3,0/0,3/-5,1/-1,2/-3,-3/a",
    "Rl/-+": "A/3,6/2,2/4,1/-1,2/-2,1/0,-3/-1,-1/-2,1/A",
    "Rl/Al-": "A/5,-4/1,1/-1,2/4,-2/0,-3/3,0/-3,-3/A",
    "Rl/Al+": "A/-4,-4/-3,3/1,4/0,3/-1,-4/-3,-3/-3,3/-2,1/A",
    "Rl/Ar-": "A/-1,-4/0,-3/-5,1/0,-3/2,-1/-2,-2/-3,-3/A",
    "Rl/Ar+": "A/-3,-3/3,0/-4,2/1,-2/-4,2/-2,1/-1,-1/-2,1/A",
    "Rl/E-": "A/-4,5/4,-2/-3,0/3,0/-3,0/-4,-1/1,-2/A",
    "Rl/E+": "A/5,-4/1,4/-3,-3/3,0/0,3/-4,-1/1,-2/-3,3/A",
    "Rl/F-": "A/-3,0/2,2/-3,3/1,-2/2,-1/-3,0/4,-2/A",
    "Rl/F+": "A/5,5/-3,3/-2,1/0,3/-4,-1/-3,3/-3,-3/-2,1/A",
    "Rl/Gal-": "A/5,-4/4,-2/0,3/-1,-4/6,0/1,4/-3,3/A",
    "Rl/Gal+": "A/-1,2/4,-2/3,0/2,-1/1,-2/-3,3/A",
    "Rl/Gar-": "a/4,-5/-1,-4/-3,0/6,0/-2,1/-1,2/-3,3/a",
    "Rl/Gar+": "a/4,-5/-1,-4/3,0/4,1/-1,2/-3,3/a",
    "Rl/Gol-": "a/-3,3/-2,1/-4,-1/0,3/6,0/-2,1/-1,2/a",
    "Rl/Gol+": "a/3,-3/-2,1/-1,-4/0,-3/4,1/-1,2/a",
    "Rl/Gor-": "A/3,-3/-1,2/1,-2/-3,0/-4,2/1,-2/-3,3/A",
    "Rl/Gor+": "A/3,-3/-1,2/-2,1/-3,0/-4,2/1,-2/A",
    "Rl/H-": "a/3,-3/4,1/-3,0/-3,-3/-1,-1/-2,1/-1,-4/a",
    "Rl/H+": "A/-4,5/1,-2/3,0/-4,-1/3,0/4,-2/5,-1/-2,1/A",
    "Rl/Ja-": "a/-2,1/-1,-4/-3,0/4,1/2,-1/a",
    "Rl/Ja+": "a/-2,1/-1,-4/-3,0/-2,1/6,0/-4,-1/a",
    "Rl/Jm-": "a/-3,-3/4,1/2,-1/-3,3/6,0/a",
    "Rl/Jm+": "a/-3,-3/4,1/-1,2/-3,-3/a",
    "Rl/Na-": "a/-5,-2/-3,3/2,-1/-2,1/-4,-1/-5,1/-3,-3/A",
    "Rl/Na+": "a/4,1/-3,3/2,-1/-2,1/-3,3/-1,-4/a",
    "Rl/Nm-": "a/6,3/-3,-3/3,0/3,0/-5,1/-1,2/-3,-3/a",
    "Rl/Nm+": "A/-1,2/-2,-2/-1,2/-2,-2/-4,-1/-2,1/2,-1/-2,1/A",
    "Rl/Rl-": "A/3,-3/-1,2/1,4/-3,0/-4,-1/1,-2/-3,3/A",
    "Rl/Rl+": "A/3,-3/2,-1/4,1/0,-3/-1,2/6,0/1,4/-3,3/A",
    "Rl/Rr-": "A/2,-1/1,-2/-3,3/2,-1/1,-2/A",
    "Rl/Rr+": "a/4,-5/-4,2/-5,1/-1,2/a",
    "Rl/T-": "A/-3,-3/-1,2/1,-2/5,-1/1,4/-1,-1/-2,1/A",
    "Rl/T+": "A/3,3/-1,-4/-3,3/1,-2/-4,2/-2,1/-1,-1/-2,1/A",
    "Rl/Ul-": "A/3,6/2,2/-2,1/-1,2/-2,1/3,0/-3,0/A",
    "Rl/Ul+": "A/5,2/-3,3/1,-2/3,0/2,-1/-3,3/-3,-3/-2,-2/A",
    "Rl/Ur-": "A/-4,5/1,-2/2,-1/4,1/0,3/0,-3/-3,-3/A",
    "Rl/Ur+": "A/2,-1/-2,1/2,-1/1,4/0,3/3,0/6,0/-3,3/A",
    "Rl/V-": "A/5,-4/1,4/3,0/-3,-3/-1,-4/1,-2/-3,3/A",
    "Rl/V+": "a/-2,1/2,-1/-3,0/3,0/4,-2/0,-3/2,2/-2,1/A",
    "Rl/Y-": "A/-3,-3/-1,2/1,-2/-1,-4/-2,-2/2,-1/4,-2/A",
    "Rl/Y+": "A/6,3/-1,2/0,-3/-2,1/2,-1/4,-2/-1,2/-2,-2/A",
    "Rl/Z-": "A/5,-4/-2,-2/-1,2/0,3/-2,1/2,-1/-2,1/A",
    "Rl/Z+": "A/5,-4/-2,-2/-1,2/0,3/4,1/6,0/-4,-1/-2,1/A",
    "Rr/--": "A/-1,2/1,4/3,0/-3,0/0,3/-4,-1/-2,1/A",
    "Rr/-+": "A/-4,5/-2,1/-3,0/0,3/0,-3/-3,-3/-1,2/-2,1/A",
    "Rr/Al-": "a/1,4/-3,3/-1,2/3,0/4,1/5,-1/-2,-2/A",
    "Rr/Al+": "a/-3,0/4,1/-3,3/2,-1/0,3/-2,1/-4,2/-2,1/A",
    "Rr/Ar-": "A/-3,6/-1,-1/1,4/-1,2/1,4/-4,2/-5,1/A",
    "Rr/Ar+": "A/-3,6/-1,-1/1,4/0,-3/3,0/0,-3/-1,-1/-2,1/A",
    "Rr/E-": "A/-4,5/4,-2/5,-1/4,1/2,-1/-2,1/-3,-3/A",
    "Rr/E+": "A/2,-4/3,0/1,-2/-1,2/-2,1/-3,0/2,2/-2,1/A",
    "Rr/F-": "a/1,4/0,3/-1,2/-3,0/1,-2/-1,2/1,1/A",
    "Rr/F+": "a/6,-3/-3,-3/3,0/-5,1/-1,2/-2,1/-1,2/-2,1/A",
    "Rr/Gal-": "A/-1,2/4,1/0,-3/0,3/-3,-3/-4,2/1,-2/A",
    "Rr/Gal+": "A/5,-4/4,1/0,3/-1,-4/-2,1/-3,3/A",
    "Rr/Gar-": "A/-3,-3/3,0/-1,-1/-3,3/1,-2/6,0/-3,3/A",
    "Rr/Gar+": "A/-3,-3/-3,0/-1,-1/-3,3/4,1/-3,-3/A",
    "Rr/Gol-": "A/0,3/-3,0/3,0/5,-1/4,-2/-1,-1/-2,1/A",
    "Rr/Gol+": "A/-3,-3/-1,-4/-3,3/-2,-2/-3,0/-3,-3/A",
    "Rr/Gor-": "A/3,-3/-1,2/4,1/-3,0/-1,-4/4,1/6,0/A",
    "Rr/Gor+": "A/-3,3/2,-1/4,1/0,-3/-1,-4/1,-2/A",
    "Rr/H-": "A/-1,-4/0,3/-2,-2/-1,-1/3,0/4,1/-3,3/A",
    "Rr/H+": "A/5,2/-3,3/1,-2/2,-1/4,1/-4,2/-3,-3/-2,-2/A",
    "Rr/Ja-": "A/-3,-3/-1,2/1,-2/6,0/-3,3/A",
    "Rr/Ja+": "A/-3,-3/-1,-4/4,1/-3,-3/A",
    "Rr/Jm-": "A/2,-1/4,1/-3,0/-1,-4/-2,1/A",
    "Rr/Jm+": "A/5,-4/1,4/0,-3/-4,-1/1,4/6,0/A",
    "Rr/Na-": "A/3,0/-3,-3/-3,0/3,0/-4,2/4,1/-3,-3/A",
    "Rr/Na+": "A/-4,5/4,-2/-3,0/3,0/0,-3/0,3/-1,-4/-2,1/A",
    "Rr/Nm-": "A/3,0/-3,-3/-3,0/2,-1/-3,3/4,1/-3,-3/A",
    "Rr/Nm+": "A/5,2/3,0/-2,-2/-1,-1/3,0/4,1/A",
    "Rr/Rl-": "A/-1,2/-2,-2/6,0/-1,-1/-2,1/A",
    "Rr/Rl+": "A/-1,2/4,-2/5,-1/-2,1/A",
    "Rr/Rr-": "a/0,3/-2,-2/2,-1/1,-2/3,0/-1,-1/-2,1/A",
    "Rr/Rr+": "a/4,-5/3,0/2,-1/-2,-2/2,-1/4,-2/-1,2/-2,1/A",
    "Rr/T-": "A/3,0/-1,-1/1,4/2,-1/-2,1/5,-1/4,-2/A",
    "Rr/T+": "A/-3,6/-3,-3/-1,-4/4,1/-3,3/0,-3/-1,2/-2,1/A",
    "Rr/Ul-": "A/-4,5/4,1/-4,2/4,1/-4,-1/4,1/0,3/A",
    "Rr/Ul+": "A/-4,2/3,0/4,1/-4,2/1,4/-1,-4/-3,0/-2,1/A",
    "Rr/Ur-": "a/4,1/-3,0/-4,2/-3,0/0,-3/-3,-3/-2,-2/A",
    "Rr/Ur+": "A/5,-4/-2,-2/-1,2/3,0/1,-2/-3,3/-1,2/-2,1/A",
    "Rr/V-": "a/0,-3/3,0/3,0/-2,-2/-1,2/-2,1/-1,2/a",
    "Rr/V+": "A/-3,6/0,-3/2,-1/1,-2/0,3/0,-3/2,2/-2,1/A",
    "Rr/Y-": "A/3,6/2,2/4,1/-1,2/1,-2/-4,2/-5,1/A",
    "Rr/Y+": "A/3,0/0,-3/3,0/-4,-1/4,1/-3,0/-1,2/-2,1/A",
    "Rr/Z-": "A/-4,5/-5,1/-4,2/4,1/-1,2/-2,1/-3,-3/A",
    "Rr/Z+": "A/-4,5/-5,1/0,3/-3,-3/3,0/-3,-3/-1,2/-2,1/A",
    "T/--": "A/-1,2/1,4/-4,-1/1,4/-1,-4/1,4/3,0/A",
    "T/-+": "a/-2,-2/-1,2/0,3/1,4/-4,-1/3,0/-3,0/-2,1/A",
    "T/Al-": "A/6,3/3,0/2,-1/-5,1/3,0/2,-1/1,-2/A",
    "T/Al+": "A/6,-3/-3,-3/-1,2/1,4/-1,-1/-2,1/A",
    "T/Ar-": "A/2,-1/1,-2/3,0/-4,2/-2,1/3,0/-3,0/A",
    "T/Ar+": "A/0,3/-1,-1/-3,0/1,-2/-3,-3/-3,0/A",
    "T/E-": "A/-1,2/3,0/4,1/-1,-4/1,4/3,0/3,0/A",
    "T/E+": "A/2,-1/4,1/3,0/-1,-4/1,4/3,0/-3,0/-3,-3/A",
    "T/F-": "A/-1,2/-2,1/6,0/0,3/-3,0/-1,2/-5,1/A",
    "T/F+": "A/5,-4/1,4/0,-3/-3,0/-1,2/-5,1/A",
    "T/Gal-": "A/-1,5/0,-3/1,-2/-3,0/-3,0/-3,-3/-3,3/A",
    "T/Gal+": "A/5,-1/0,-3/-2,1/-3,0/3,0/-3,3/A",
    "T/Gar-": "A/-4,-1/6,0/1,4/-3,0/-4,-1/-2,-2/-3,3/A",
    "T/Gar+": "A/-1,2/1,-2/-3,0/-4,-1/-2,-2/-3,3/A",
    "T/Gol-": "A/5,-1/4,-2/-1,-4/4,1/0,-3/-1,-1/-2,1/A",
    "T/Gol+": "a/-2,-5/0,3/5,-1/0,3/-3,3/-2,1/A",
    "T/Gor-": "A/-3,6/0,-3/2,-1/-5,1/-3,-3/-1,2/-5,1/A",
    "T/Gor+": "A/0,3/-3,3/3,0/-1,2/3,0/-5,1/A",
    "T/H-": "a/-3,0/-5,1/-1,-4/1,-2/-1,2/3,0/1,4/-1,-1/-2,1/A",
    "T/H+": "A/-1,2/-2,1/0,3/-1,-4/-5,1/-1,-4/1,-2/-3,-3/A",
    "T/Ja-": "a/6,-3/0,-3/-2,1/0,3/-4,2/a",
    "T/Ja+": "a/-3,6/0,-3/1,-2/0,-3/-4,2/-2,-2/A",
    "T/Jm-": "A/-3,0/3,0/-1,2/-3,0/4,-2/A",
    "T/Jm+": "A/3,0/-3,0/0,3/5,-1/3,0/-5,1/A",
    "T/Na-": "A/-1,2/4,-2/-3,0/3,0/-1,-4/1,-2/-3,3/A",
    "T/Na+": "a/-2,-5/0,-3/2,-1/4,1/2,-1/-5,1/-4,-1/-2,-2/A",
    "T/Nm-": "a/-3,3/1,-2/-1,-4/3,0/-3,0/4,-2/-1,2/a",
    "T/Nm+": "a/-3,6/1,4/-4,-1/4,-2/-1,-4/4,1/-3,3/-3,0/A",
    "T/Rl-": "A/0,3/-1,-1/4,1/-1,2/-2,1/-4,2/-5,1/A",
    "T/Rl+": "a/3,3/-2,1/0,3/-1,-1/-3,3/1,-2/-1,-1/-2,1/A",
    "T/Rr-": "A/3,3/-1,2/1,-2/0,-3/-1,-1/3,0/-5,1/A",
    "T/Rr+": "a/3,3/-2,-2/-1,-4/1,-2/0,-3/-1,-4/-3,3/-2,-2/A",
    "T/T-": "A/2,-4/3,0/-5,1/-3,3/-3,0/A",
    "T/T+": "A/-1,5/0,-3/-2,-2/3,0/A",
    "T/Ul-": "A/2,-1/1,-2/3,0/-3,3/-1,-1/1,-2/-3,3/A",
    "T/Ul+": "A/-4,5/-2,1/0,-3/5,-1/-2,-2/3,0/A",
    "T/Ur-": "a/-2,-5/-4,2/-5,1/-1,2/0,3/-2,1/-3,-3/A",
    "T/Ur+": "a/1,-2/-1,2/3,0/-3,3/-2,-2/2,-1/a",
    "T/V-": "A/-1,2/4,-2/3,0/0,3/5,-1/1,-2/-3,3/A",
    "T/V+": "A/-4,2/0,3/-2,1/2,-1/0,-3/4,-2/A",
    "T/Y-": "A/3,-3/-1,2/1,-2/2,-1/1,4/-3,-3/-3,3/A",
    "T/Y+": "A/3,-3/2,-1/-2,1/-1,2/1,-2/-3,3/A",
    "T/Z-": "a/-5,4/-4,-1/0,-3/-3,-3/-3,3/-2,1/-1,2/a",
    "T/Z+": "a/1,-2/-1,-4/3,0/-3,3/4,1/-1,2/a",
    "Ul/--": "A/2,-1/4,-2/-3,0/0,-3/-1,-4/-2,1/-3,3/A",
    "Ul/-+": "A/2,-1/4,1/3,0/-3,0/5,-1/-2,1/A",
    "Ul/Al-": "A/2,-1/-2,1/2,-1/1,-2/-3,3/A",
    "Ul/Al+": "A/2,-1/-2,1/2,-1/4,1/-3,-3/-3,3/A",
    "Ul/Ar-": "A/0,-3/3,0/2,-1/0,3/4,1/-3,-3/-3,0/A",
    "Ul/Ar+": "a/-2,4/-3,0/-1,2/1,-2/0,-3/5,-1/a",
    "Ul/E-": "A/-4,-1/3,0/1,4/-1,2/1,-2/0,-3/2,-1/6,0/-2,1/A",
    "Ul/E+": "A/-4,5/1,4/-3,0/3,0/-3,0/-1,2/-2,1/-3,3/A",
    "Ul/F-": "A/3,0/-4,-1/1,4/-1,-4/1,-2/-4,-1/1,-2/A",
    "Ul/F+": "A/-3,0/-4,-1/1,4/-4,-1/-2,1/-1,-4/-2,1/-3,3/A",
    "Ul/Gal-": "a/4,-5/-1,2/-3,0/4,1/-4,2/a",
    "Ul/Gal+": "a/1,-2/2,-1/-3,0/-3,3/4,1/5,-1/a",
    "Ul/Gar-": "A/-4,5/4,-2/0,3/0,-3/-1,2/1,1/-3,3/A",
    "Ul/Gar+": "A/5,-4/1,4/0,-3/0,3/2,-1/4,-2/A",
    "Ul/Gol-": "A/-4,2/1,4/0,-3/2,-1/1,-2/A",
    "Ul/Gol+": "A/2,-4/1,4/-3,0/2,-1/4,1/6,0/A",
    "Ul/Gor-": "A/5,-4/-2,1/-1,2/1,4/0,-3/0,-3/-3,-3/A",
    "Ul/Gor+": "a/-2,4/2,-1/3,0/0,-3/4,1/-1,2/a",
    "Ul/H-": "A/0,3/-1,-4/1,4/5,-1/4,1/-1,-4/3,0/a",
    "Ul/H+": "A/5,-1/4,1/3,0/-1,2/4,1/0,3/0,-3/-3,-3/A",
    "Ul/Ja-": "a/-2,4/0,-3/2,-1/-3,0/3,0/a",
    "Ul/Ja+": "A/5,-1/4,1/3,0/0,-3/-4,2/1,-2/A",
    "Ul/Jm-": "A/-3,6/0,-3/2,-1/-3,0/4,-2/A",
    "Ul/Jm+": "A/-3,6/0,-3/2,-1/-3,0/-2,-2/6,0/A",
    "Ul/Na-": "A/-3,3/-1,-1/3,0/0,-3/4,1/-4,-1/4,1/-1,-4/-2,1/A",
    "Ul/Na+": "A/-4,5/-2,1/0,-3/2,-1/-5,1/-4,-1/4,1/-3,-3/A",
    "Ul/Nm-": "A/-1,2/1,4/0,3/-3,0/-1,2/0,-3/4,-2/5,-1/-2,1/A",
    "Ul/Nm+": "A/-1,5/1,4/3,0/2,-1/4,1/-1,-4/4,1/-3,-3/A",
    "Ul/Rl-": "A/-1,5/4,-2/-1,-4/1,-2/-4,-1/-2,-2/3,0/A",
    "Ul/Rl+": "A/5,-4/1,1/-1,2/-2,-2/-1,2/-2,1/2,-1/-2,1/A",
    "Ul/Rr-": "A/2,-1/1,-2/2,-1/4,1/-1,2/4,1/-3,-3/A",
    "Ul/Rr+": "A/-3,-3/-1,-4/4,-2/-3,0/-4,-1/-2,1/-1,2/-2,1/A",
    "Ul/T-": "a/-2,-5/-4,2/-5,1/-1,2/3,0/1,4/-3,-3/A",
    "Ul/T+": "A/2,-1/-5,1/0,-3/-3,3/-1,2/1,-2/A",
    "Ul/Ul-": "A/6,-3/-1,-1/-2,1/3,0/-1,-1/-2,1/-3,3/A",
    "Ul/Ul+": "a/-5,1/5,-1/-2,1/0,3/-1,-1/1,-2/A",
    "Ul/Ur-": "A/-3,3/-1,-1/4,1/-1,-1/1,-2/A",
    "Ul/Ur+": "a/-5,1/3,0/-1,-1/3,0/a",
    "Ul/V-": "A/-3,3/2,-1/-2,-2/-4,-1/4,1/-3,-3/-3,0/A",
    "Ul/V+": "A/2,-4/-5,1/-1,2/-2,1/0,3/0,3/-1,2/-2,1/A",
    "Ul/Y-": "a/-2,-2/-1,2/-2,-2/-1,2/1,-2/-1,-1/-2,1/A",
    "Ul/Y+": "a/6,-3/-2,-2/-3,0/-1,-4/-3,-3/3,0/a",
    "Ul/Z-": "a/-2,1/-1,-4/-5,1/-1,-4/4,1/-1,2/-3,0/a",
    "Ul/Z+": "A/-4,5/4,1/-3,0/-1,-4/1,4/-1,2/-2,1/-3,-3/A",
    "Ur/--": "A/2,-1/-5,1/3,0/-3,0/-4,-1/4,1/6,0/A",
    "Ur/-+": "A/5,-4/-5,1/3,0/0,-3/-4,-1/1,-2/A",
    "Ur/Al-": "a/-5,1/3,0/2,-1/-2,1/0,-3/-4,2/-2,-2/A",
    "Ur/Al+": "A/-1,2/1,-2/3,0/0,3/-1,2/1,-2/A",
    "Ur/Ar-": "A/-3,3/-1,2/1,-2/2,-1/1,-2/A",
    "Ur/Ar+": "A/3,-3/-1,2/-2,1/2,-1/4,1/6,0/A",
    "Ur/E-": "A/-1,-4/0,3/0,-3/4,-2/-4,-1/-5,1/-1,2/-3,3/-2,1/A",
    "Ur/E+": "A/-3,6/0,3/-4,-1/4,1/-4,-1/0,3/-2,1/-3,3/A",
    "Ur/F-": "a/-3,-3/-2,1/-3,0/-1,2/-5,1/-4,2/4,1/A",
    "Ur/F+": "A/-4,5/4,-2/3,0/-1,2/-3,3/-2,1/-1,2/-2,1/A",
    "Ur/Gal-": "A/6,3/0,3/-3,0/-4,2/-3,0/1,1/-3,3/A",
    "Ur/Gal+": "A/5,-1/-3,0/-2,1/0,3/-3,3/3,0/A",
    "Ur/Gar-": "A/-4,5/1,-2/3,0/-4,-1/4,-2/A",
    "Ur/Gar+": "A/-4,5/1,-2/3,0/-4,-1/-2,-2/6,0/A",
    "Ur/Gol-": "a/0,3/-3,3/3,0/-2,1/0,3/6,0/-1,-1/a",
    "Ur/Gol+": "a/0,3/0,-3/-3,3/-2,1/0,-3/5,-1/a",
    "Ur/Gor-": "a/-2,4/-1,-4/3,0/-2,1/2,-1/a",
    "Ur/Gor+": "a/-2,4/-1,-4/3,0/4,1/6,0/-4,-1/a",
    "Ur/H-": "a/0,-3/1,4/-1,-4/-5,1/-4,-1/1,4/-3,0/A",
    "Ur/H+": "A/0,-3/3,0/2,-1/4,1/3,0/0,3/5,-1/4,-2/A",
    "Ur/Ja-": "a/3,6/0,3/-2,1/3,0/-4,2/a",
    "Ur/Ja+": "a/0,3/-3,0/3,0/4,-2/-3,0/5,-1/a",
    "Ur/Jm-": "A/-4,2/0,3/1,-2/3,0/0,-3/A",
    "Ur/Jm+": "A/2,-4/0,3/-2,1/3,0/3,0/6,0/A",
    "Ur/Na-": "A/-3,-3/-1,2/-2,1/-4,2/1,-2/-3,3/3,0/-1,2/-2,1/A",
    "Ur/Na+": "A/-3,-3/-1,2/1,4/5,-1/1,-2/0,3/-1,2/-2,1/A",
    "Ur/Nm-": "A/-1,2/4,1/0,-3/-3,-3/-1,2/-3,3/-2,1/-1,2/-2,1/A",
    "Ur/Nm+": "A/5,-4/-2,1/-3,0/-1,-4/4,-2/-1,-4/1,4/-3,-3/A",
    "Ur/Rl-": "a/1,-2/-1,2/1,-2/-4,-1/-3,0/0,3/-3,-3/a",
    "Ur/Rl+": "A/-1,-4/0,3/1,4/-1,2/4,1/-1,2/-2,1/3,0/A",
    "Ur/Rr-": "A/-3,-3/-1,-4/1,-2/5,-1/-2,1/2,2/-2,1/A",
    "Ur/Rr+": "A/-3,-3/-1,-4/1,-2/5,-1/4,1/6,0/-4,2/-2,1/A",
    "Ur/T-": "A/5,-4/-2,1/-3,3/0,3/5,-1/4,1/6,0/A",
    "Ur/T+": "A/-1,2/-2,1/-3,0/5,-1/-2,-2/3,0/A",
    "Ur/Ul-": "A/6,-3/-1,-1/-3,0/1,1/-3,3/A",
    "Ur/Ul+": "a/-2,1/-1,-1/-2,1/5,-1/a",
    "Ur/Ur-": "A/2,-4/4,-2/-3,0/0,3/-1,-1/-2,1/-3,3/A",
    "Ur/Ur+": "A/3,0/-1,-1/-2,1/2,-1/-5,1/5,-1/a",
    "Ur/V-": "A/6,3/0,3/2,-1/-2,-2/3,0/2,-1/1,-2/A",
    "Ur/V+": "a/4,4/3,0/3,0/-1,-1/1,-2/5,-1/0,3/-2,-2/A",
    "Ur/Y-": "a/-2,-2/-1,-4/-2,1/-1,-1/1,-2/-1,-4/-2,-2/A",
    "Ur/Y+": "a/0,3/-3,-3/-2,1/-4,-1/-2,-2/-1,2/a",
    "Ur/Z-": "A/-1,2/4,1/0,3/0,-3/-1,-1/-2,-2/3,0/A",
    "Ur/Z+": "A/2,-1/1,4/-3,3/-3,0/-1,-4/4,1/-3,3/-3,-3/A",
    "V/--": "A/3,0/0,-3/0,3/5,-1/4,-2/3,0/3,0/-1,-4/-2,1/A",
    "V/-+": "A/0,3/-4,-1/4,1/-1,-4/-5,1/-3,0/5,-1/-2,1/A",
    "V/Al-": "A/-3,6/-1,-1/3,0/-2,1/0,-3/3,0/0,-3/A",
    "V/Al+": "A/-3,0/3,0/-1,2/0,3/0,-3/4,-2/5,-1/-2,1/A",
    "V/Ar-": "A/6,-3/0,-3/0,3/-1,2/-2,1/-1,-1/-2,1/A",
    "V/Ar+": "A/3,6/0,3/3,0/6,0/-1,2/-2,1/-1,-1/-2,1/A",
    "V/E-": "A/-1,2/4,-2/-3,0/-3,0/-1,-4/3,0/-2,1/-1,-1/-2,1/A",
    "V/E+": "A/3,-3/-1,2/1,4/-3,3/-3,0/-1,-4/-2,1/-3,3/A",
    "V/F-": "A/-1,2/-2,1/-1,-4/6,0/1,4/A",
    "V/F+": "A/-4,5/1,-2/2,-1/1,-2/A",
    "V/Gal-": "A/-1,2/1,-2/-1,2/4,1/-1,-4/1,-2/-3,-3/A",
    "V/Gal+": "A/6,-3/0,-3/-1,2/-3,0/1,1/-3,3/A",
    "V/Gar-": "A/-1,5/4,-2/-1,-4/-2,1/3,0/2,2/-2,1/A",
    "V/Gar+": "A/-1,2/4,-2/0,3/-3,0/-1,2/4,-2/A",
    "V/Gol-": "A/2,-4/4,1/-3,0/3,0/3,0/-1,2/-2,1/A",
    "V/Gol+": "A/2,-4/-2,1/3,0/-3,0/-4,2/-2,1/A",
    "V/Gor-": "A/3,3/-1,2/4,1/-4,-1/-2,1/-1,2/-2,1/A",
    "V/Gor+": "a/4,-2/-1,2/-3,0/0,3/4,-2/-1,2/a",
    "V/H-": "A/3,3/-1,2/-3,3/4,1/-1,-4/4,1/3,0/-1,-4/-2,1/A",
    "V/H+": "A/5,-1/1,4/0,3/2,-1/1,4/-1,-4/4,1/-3,-3/A",
    "V/Ja-": "A/5,-1/-2,1/-3,0/2,-1/-2,1/A",
    "V/Ja+": "A/-4,5/-5,1/0,-3/0,-3/-1,-4/-5,1/A",
    "V/Jm-": "a/-2,1/2,-1/-3,0/-2,1/5,-1/a",
    "V/Jm+": "a/-3,0/-5,1/-4,-1/-2,1/2,-1/4,1/A",
    "V/Na-": "A/-1,2/4,1/0,3/-3,0/5,-1/-2,1/-3,3/A",
    "V/Na+": "A/5,-4/1,4/0,3/3,0/-4,2/-2,1/A",
    "V/Nm-": "a/4,-5/-1,-4/-3,0/0,3/-5,1/2,-1/-3,3/a",
    "V/Nm+": "a/1,-2/-4,2/0,3/0,3/4,1/-1,2/a",
    "V/Rl-": "a/3,6/1,4/-4,2/1,1/-1,2/-5,1/-3,0/A",
    "V/Rl+": "A/-1,5/4,-2/-1,2/4,1/-3,0/-3,0/-1,2/-2,1/A",
    "V/Rr-": "A/-3,-3/-3,0/3,0/-4,-1/-2,1/-1,2/-2,1/A",
    "V/Rr+": "A/3,6/-3,-3/-3,0/0,-3/-1,2/-2,1/-1,2/-2,1/A",
    "V/T-": "A/5,-1/-3,0/-2,1/2,-1/0,-3/1,1/-3,3/A",
    "V/T+": "A/-1,2/4,-2/0,3/0,-3/-4,2/1,-2/A",
    "V/Ul-": "A/0,-3/-3,-3/-1,2/4,1/2,2/-2,1/-3,3/A",
    "V/Ul+": "A/3,3/-3,0/2,2/-2,1/-4,2/-2,1/-1,-1/-2,1/A",
    "V/Ur-": "A/-4,5/-5,1/-3,3/-1,2/4,1/-3,-3/-3,0/A",
    "V/Ur+": "a/4,4/2,-1/-3,0/1,1/-1,2/-5,1/-1,2/-2,-2/A",
    "V/V-": "A/3,-3/2,2/-2,1/-1,-1/-2,1/A",
    "V/V+": "A/-3,3/-3,-3/-1,-1/-2,1/-1,-1/-2,1/A",
    "V/Y-": "A/-1,5/-2,1/0,3/0,3/-3,3/-1,-4/-2,1/A",
    "V/Y+": "A/-4,2/4,-2/-3,0/3,0/-1,-1/-2,1/A",
    "V/Z-": "a/-3,0/4,1/2,-1/-2,-2/2,-1/-2,1/0,3/A",
    "V/Z+": "A/6,3/3,0/2,-1/1,-2/3,0/0,-3/2,2/-2,1/A",
    "Y/--": "A/0,3/-4,-1/4,1/-1,-4/4,1/-4,-1/-2,1/A",
    "Y/-+": "A/3,3/-1,-4/1,4/-1,-4/4,1/3,0/-1,-4/-2,1/A",
    "Y/Al-": "a/-2,-5/5,-1/4,-2/-1,2/0,-3/-2,1/-3,-3/A",
    "Y/Al+": "A/5,-4/4,-2/0,3/-3,3/-1,2/-2,1/A",
    "Y/Ar-": "A/-1,-4/0,-3/1,1/-1,-4/3,0/4,1/-3,0/A",
    "Y/Ar+": "A/5,-4/1,-2/0,3/-3,3/-1,-1/-2,1/A",
    "Y/E-": "A/2,-1/4,1/3,0/-1,-4/-5,1/-3,-3/-3,0/A",
    "Y/E+": "A/-1,2/4,1/3,0/-3,3/-1,-4/1,-2/A",
    "Y/F-": "A/5,-1/0,-3/1,-2/-1,2/1,4/-1,-1/-5,1/A",
    "Y/F+": "A/5,-1/-3,0/-2,1/2,-1/3,0/-5,1/A",
    "Y/Gal-": "A/2,-4/3,0/1,4/0,-3/3,0/-3,3/-3,0/A",
    "Y/Gal+": "A/2,-4/3,0/1,-2/0,3/-3,0/-3,3/A",
    "Y/Gar-": "a/-3,6/-2,1/3,0/-1,2/1,4/2,-1/-2,-2/A",
    "Y/Gar+": "A/2,-1/-2,1/3,0/-1,-4/1,1/-3,3/A",
    "Y/Gol-": "A/2,-4/4,1/0,3/0,-3/3,0/-4,2/-2,1/A",
    "Y/Gol+": "a/4,1/0,-3/-1,-1/-3,3/3,0/-2,1/A",
    "Y/Gor-": "A/-4,-1/0,3/4,-2/0,3/-1,2/-5,1/-3,-3/A",
    "Y/Gor+": "A/-3,3/3,0/-3,0/-1,2/0,-3/4,-2/A",
    "Y/H-": "a/4,-5/2,-1/-3,0/3,0/4,1/0,3/-3,0/-1,2/-2,1/A",
    "Y/H+": "A/-1,2/1,-2/-3,0/-4,-1/4,-2/-4,-1/1,-2/-3,-3/A",
    "Y/Ja-": "a/6,3/0,3/1,-2/0,-3/5,-1/a",
    "Y/Ja+": "a/3,6/0,3/-2,1/0,3/5,-1/1,1/A",
    "Y/Jm-": "A/6,-3/0,-3/-1,2/0,3/-5,1/A",
    "Y/Jm+": "A/5,-1/-3,0/4,1/-3,0/3,0/3,0/A",
    "Y/Na-": "A/2,-1/-5,1/3,0/-3,0/-4,-1/1,-2/-3,3/A",
    "Y/Na+": "a/-2,4/-1,-4/4,1/-4,-1/-5,1/-4,-1/3,0/-2,1/A",
    "Y/Nm-": "a/1,-2/5,-1/0,-3/3,0/1,4/-1,2/-3,3/a",
    "Y/Nm+": "A/5,-4/1,4/0,3/0,-3/5,-1/0,-3/-3,-3/-5,1/A",
    "Y/Rl-": "A/-4,2/-5,1/-1,2/-2,1/3,0/2,2/-2,1/A",
    "Y/Rl+": "A/-4,5/0,-3/3,0/4,-2/-1,2/1,1/-1,-4/-2,1/A",
    "Y/Rr-": "A/3,3/-1,-4/1,-2/-4,-1/-2,-2/-1,2/4,-2/A",
    "Y/Rr+": "A/-3,-3/-3,0/-4,2/1,4/-4,-1/-2,1/-1,2/-2,1/A",
    "Y/T-": "A/-4,2/0,3/4,1/0,3/-3,0/3,0/0,3/A",
    "Y/T+": "A/3,-3/2,-1/1,-2/-1,2/-2,1/-3,3/A",
    "Y/Ul-": "a/-5,-2/0,-3/-4,2/0,-3/1,-2/-1,2/-2,1/A",
    "Y/Ul+": "A/2,-1/-2,-2/-1,-4/1,-2/-3,-3/3,0/A",
    "Y/Ur-": "a/-2,-2/2,-1/1,-2/-1,-1/-2,1/2,-1/-2,-2/A",
    "Y/Ur+": "a/-5,4/2,2/4,1/-1,-4/-3,-3/3,0/a",
    "Y/V-": "A/-4,2/-2,1/-3,0/0,3/6,0/-1,2/-2,1/A",
    "Y/V+": "A/-4,2/1,-2/0,-3/-3,0/-1,-4/-2,1/A",
    "Y/Y-": "A/-4,2/-2,-2/-3,0/-1,-1/-2,1/A",
    "Y/Y+": "A/2,-4/1,4/-1,-1/-2,1/A",
    "Y/Z-": "A/0,3/3,0/-1,-4/1,4/-1,-4/3,0/-2,1/A",
    "Y/Z+": "A/-3,-3/3,0/0,3/-1,-4/4,1/3,0/-1,-4/-2,1/A",
    "Z/--": "A/3,3/-3,0/-1,-1/4,1/-3,-3/A",
    "Z/-+": "A/3,0/-1,-1/4,1/-3,0/-1,-1/-2,1/A",
    "Z/Al-": "A/3,3/-1,-4/1,-2/-3,3/2,2/4,1/-3,0/-1,2/-2,1/A",
    "Z/Al+": "A/-1,5/-3,0/-2,1/2,-1/-5,1/0,3/-1,2/-2,1/A",
    "Z/Ar-": "a/4,-5/-1,-1/3,0/-2,1/-3,0/3,0/-3,3/-1,2/-2,1/A",
    "Z/Ar+": "A/0,3/-3,-3/-1,2/1,-2/0,-3/3,0/-1,-4/-2,1/A",
    "Z/E-": "A/3,3/-1,2/-3,-3/4,1/-3,-3/A",
    "Z/E+": "A/-3,-3/-1,2/-3,-3/4,1/6,0/-3,3/A",
    "Z/F-": "A/-3,6/0,-3/0,3/5,-1/-3,0/3,0/-2,1/-1,2/-2,1/A",
    "Z/F+": "A/5,2/3,0/1,-2/-1,-4/3,0/-5,1/-1,2/-2,-2/A",
    "Z/Gal-": "A/-1,2/1,4/-3,0/0,-3/-3,-3/-1,-4/-2,1/A",
    "Z/Gal+": "a/6,-3/-2,-2/-3,3/-1,2/3,0/-3,0/a",
    "Z/Gar-": "A/3,0/-3,-3/-3,0/-4,-1/-3,3/4,1/-3,-3/A",
    "Z/Gar+": "A/0,-3/2,2/-3,3/1,-2/-3,0/3,0/A",
    "Z/Gol-": "A/-3,0/3,0/0,-3/-4,2/4,-2/-1,-1/-2,1/A",
    "Z/Gol+": "A/3,6/0,3/-1,2/-3,3/-2,-2/3,0/A",
    "Z/Gor-": "A/-1,2/-2,1/-3,-3/-3,0/0,3/-1,-4/-2,1/A",
    "Z/Gor+": "a/0,3/-3,0/-2,1/5,-1/-2,-2/2,-1/a",
    "Z/H-": "A/3,3/3,0/-4,2/-3,3/1,-2/6,0/-3,3/A",
    "Z/H+": "A/-3,-3/-1,2/-3,3/4,-2/-3,0/-3,-3/A",
    "Z/Ja-": "A/-3,0/3,0/-1,2/1,4/0,3/2,2/-2,1/A",
    "Z/Ja+": "A/-3,-3/-1,-4/1,4/0,3/-3,-3/-3,0/A",
    "Z/Jm-": "a/3,-3/1,4/2,-1/-2,1/2,-1/-3,0/-5,1/A",
    "Z/Jm+": "a/-3,6/-3,-3/-3,0/1,4/-1,-4/-3,-3/a",
    "Z/Na-": "A/-3,-3/3,0/2,2/4,1/-3,-3/A",
    "Z/Na+": "a/4,4/-4,-1/-5,1/-3,3/-1,2/-2,-2/A",
    "Z/Nm-": "a/3,3/3,0/-2,-2/-1,-4/-3,-3/a",
    "Z/Nm+": "a/3,-3/-5,1/-1,-4/-2,-2/-1,2/-2,-2/A",
    "Z/Rl-": "A/3,3/-1,-4/1,-2/-4,-1/4,-2/5,-1/-2,1/A",
    "Z/Rl+": "A/3,3/-1,-4/1,-2/-4,-1/-2,-2/6,0/-1,-1/-2,1/A",
    "Z/Rr-": "A/5,-4/-5,1/0,3/0,-3/0,3/-4,-1/-2,1/A",
    "Z/Rr+": "A/3,-3/-1,2/4,1/0,3/-3,0/-3,-3/-1,2/-2,1/A",
    "Z/T-": "A/5,-4/1,4/0,3/-3,-3/-3,3/-1,2/-2,1/A",
    "Z/T+": "A/2,-1/4,1/0,-3/-3,3/-1,-4/-2,1/A",
    "Z/Ul-": "A/5,-4/1,4/5,-1/4,1/-1,-4/-2,1/0,3/A",
    "Z/Ul+": "A/3,3/-1,-4/1,-2/-1,-4/1,4/3,0/-4,-1/-2,1/A",
    "Z/Ur-": "a/1,4/3,0/-1,2/4,1/-1,2/-3,0/1,1/A",
    "Z/Ur+": "A/3,6/-1,2/4,1/2,-1/4,-2/-1,-4/-3,3/-2,1/A",
    "Z/V-": "A/-1,2/1,4/0,-3/3,0/0,-3/-1,2/-2,1/A",
    "Z/V+": "A/-3,0/3,0/-1,2/1,-2/0,3/0,-3/2,2/-2,1/A",
    "Z/Y-": "A/0,3/0,3/-1,-4/4,1/-1,-4/0,3/-2,1/A",
    "Z/Y+": "A/-3,6/0,-3/2,-1/-2,-2/-3,0/3,0/-4,-1/-2,1/A",
    "Z/Z-": "A/5,-4/1,1/-3,3/-1,-1/-2,1/A",
    "Z/Z+": "A/0,3/5,-1/6,0/-2,-2/-1,-1/-2,1/A",
    "Adj/Adj-": "A/0,3/-1,-1/1,-2/A",
    "Adj/Adj+": "A/6,-3/5,-1/6,0/1,4/A",
    "Adj/Opp-": "A/-3,0/3,0/-1,2/4,1/0,3/0,-3/-3,-3/A",
    "Adj/Opp+": "a/4,1/2,-1/-5,1/2,-1/3,0/4,1/-4,-1/-2,1/A",
    "Adj/pJ-": "A/5,-4/-5,1/0,3/0,-3/0,3/-3,0/-3,0/A",
    "Adj/pJ+": "a/-3,6/1,-2/-1,-1/3,0/1,-2/2,-1/-3,0/-2,1/A",
    "Adj/pN-": "A/-1,2/0,-3/4,1/-4,-1/4,1/-1,-4/-2,1/A",
    "Adj/pN+": "A/-4,5/-3,0/1,4/-1,-4/1,-2/6,0/-1,2/-2,1/A",
    "Adj/Ba-": "A/2,-1/-2,1/3,0/0,-3/-3,3/A",
    "Adj/Ba+": "A/-4,5/4,1/-3,3/0,3/-3,0/-3,0/A",
    "Adj/Bm-": "a/1,-2/2,-1/0,-3/0,3/-3,3/a",
    "Adj/Bm+": "a/-2,1/2,-1/-3,0/-3,0/-3,-3/-3,3/a",
    "Adj/Cl-": "A/5,-4/-2,-2/-1,2/3,0/-2,1/0,3/-3,0/A",
    "Adj/Cl+": "a/3,3/4,1/2,-1/-3,0/-2,-2/2,-1/a",
    "Adj/Cr-": "A/3,3/-1,-4/1,-2/-4,-1/4,-2/6,0/-3,0/A",
    "Adj/Cr+": "A/3,3/-1,-4/1,-2/-4,-1/-2,-2/3,0/A",
    "Adj/Da-": "A/0,-3/0,3/-3,3/-1,2/1,-2/A",
    "Adj/Da+": "A/-3,-3/-1,2/1,4/3,0/2,2/-2,1/A",
    "Adj/Dm-": "a/0,3/-3,3/3,0/-2,1/-1,2/a",
    "Adj/Dm+": "a/-3,-3/-2,1/-1,-4/0,-3/-2,-2/-1,2/a",
    "Adj/Ka-": "a/-2,4/0,-3/2,-1/-2,1/2,-1/a",
    "Adj/Ka+": "A/2,-1/1,4/0,3/0,-3/3,0/3,0/A",
    "Adj/Km-": "A/2,-4/0,3/-2,1/2,-1/-2,1/A",
    "Adj/Km+": "a/4,-5/-4,-1/0,-3/3,0/-3,0/0,-3/a",
    "Adj/M-": "A/-4,5/-5,1/-3,0/-3,3/-1,2/3,0/-5,1/A",
    "Adj/M+": "a/-3,6/4,1/0,-3/-1,2/3,0/-5,1/0,3/-3,3/A",
    "Adj/Or-": "A/-3,0/3,0/-1,2/4,1/-1,2/1,-2/-3,-3/A",
    "Adj/Or+": "A/3,6/0,3/-1,2/1,4/-1,2/4,1/6,0/-3,3/A",
    "Adj/Ol-": "A/-4,-1/0,-3/-2,1/-1,-4/-2,1/0,-3/-1,-1/a",
    "Adj/Ol+": "a/0,-3/4,-2/-3,0/-1,-4/4,-2/-1,2/3,0/-2,1/A",
    "Adj/Pl-": "A/-3,0/3,0/0,-3/-4,2/1,-2/A",
    "Adj/Pl+": "A/3,6/0,3/0,3/-4,2/-2,-2/3,0/A",
    "Adj/Pr-": "a/0,3/-3,0/3,0/4,-2/2,-1/a",
    "Adj/Pr+": "A/-3,3/2,-1/4,1/0,-3/3,0/0,3/A",
    "Adj/Q-": "A/-4,5/-3,0/1,4/-1,-4/1,4/-3,0/-3,3/-1,-1/-2,1/A",
    "Adj/Q+": "A/2,-1/-2,1/0,-3/-1,-4/1,4/0,3/2,-1/-2,1/A",
    "Adj/Sa-": "a/-2,-2/-4,-1/-2,1/-1,-1/1,-2/2,-1/-2,-2/A",
    "Adj/Sa+": "A/5,-4/-2,-2/-3,0/0,-3/-3,-3/3,0/A",
    "Adj/Sm-": "a/1,-2/-1,-1/-2,1/-4,-1/-2,-2/2,-1/-2,-2/A",
    "Adj/Sm+": "a/6,-3/-2,-2/-4,-1/0,-3/-3,-3/3,0/a",
    "Adj/W-": "A/2,-4/4,-2/-3,0/2,-1/1,1/-1,-4/4,-2/A",
    "Adj/W+": "A/5,-4/1,1/-1,2/-2,1/-1,-1/-2,1/A",
    "Adj/X-": "a/6,-3/-2,1/-4,2/1,1/-1,2/-2,1/3,0/-1,-4/-2,1/A",
    "Adj/X+": "A/5,-4/1,-2/-1,2/0,3/-3,0/-2,1/2,-1/-2,1/A",
    "Opp/Adj-": "A/2,-1/-2,1/3,0/-1,-1/-2,1/2,-1/-2,1/A",
    "Opp/Adj+": "A/2,-4/0,3/1,4/3,0/0,-3/5,-1/-2,1/-3,3/A",
    "Opp/Opp-": "A/2,-4/1,1/-3,3/A",
    "Opp/Opp+": "a/-5,1/5,-1/a",
    "Opp/pJ-": "A/3,0/0,-3/2,-1/4,1/0,3/3,0/-3,-3/A",
    "Opp/pJ+": "A/5,-4/-2,1/0,3/-1,-1/-2,1/0,3/5,-1/-2,1/A",
    "Opp/pN-": "A/5,5/-2,1/-3,-3/-3,0/-3,-3/-1,2/-2,-2/A",
    "Opp/pN+": "A/-3,-3/-3,0/-3,-3/-3,0/5,-1/4,-2/A",
    "Opp/Ba-": "A/-3,6/-3,0/-3,3/-3,0/-1,2/1,1/-3,3/A",
    "Opp/Ba+": "A/-3,0/3,0/-3,0/-4,-1/-2,-2/-3,3/A",
    "Opp/Bm-": "a/3,0/1,4/5,-1/-2,-2/-1,2/6,0/-2,1/A",
    "Opp/Bm+": "a/-3,6/4,1/5,-1/-2,-2/-1,-4/4,1/A",
    "Opp/Cl-": "A/6,3/-3,-3/3,0/2,-1/1,-2/5,-1/4,-2/A",
    "Opp/Cl+": "A/5,-4/-5,1/3,0/-1,-1/1,4/-1,-4/3,0/-2,1/A",
    "Opp/Cr-": "a/4,1/-3,3/-1,2/-2,1/3,0/-3,3/-1,-1/a",
    "Opp/Cr+": "a/4,1/-3,3/-1,2/-2,1/-3,0/-3,3/-1,-1/-2,-2/A",
    "Opp/Da-": "A/-4,2/1,4/-3,-3/-3,0/-1,2/1,4/-3,-3/A",
    "Opp/Da+": "A/3,-3/2,2/-2,1/-3,0/3,0/-3,0/A",
    "Opp/Dm-": "A/-4,2/-3,-3/4,1/3,0/-3,0/-4,-1/-5,1/A",
    "Opp/Dm+": "a/3,-3/-2,-2/2,-1/0,3/-3,0/0,3/a",
    "Opp/Ka-": "A/6,-3/-3,0/-1,2/1,4/0,-3/0,-3/-3,-3/A",
    "Opp/Ka+": "A/5,-1/-2,-2/-1,2/-5,1/3,0/3,0/-4,-1/-2,1/A",
    "Opp/Km-": "A/5,-4/-5,1/3,0/0,3/-4,-1/-3,0/4,-2/A",
    "Opp/Km+": "a/4,4/-4,-1/0,-3/1,4/-1,2/0,-3/-3,3/-2,1/A",
    "Opp/M-": "A/-1,2/4,-2/3,0/-4,-1/6,0/-2,-2/-3,0/-1,2/-2,1/A",
    "Opp/M+": "A/-1,2/4,-2/3,0/2,-1/4,-2/-3,0/-1,2/-2,1/A",
    "Opp/Or-": "A/-1,-1/1,4/-1,-1/1,4/-1,-1/a",
    "Opp/Or+": "A/5,-1/4,-2/3,0/-1,-1/1,4/-3,-3/A",
    "Opp/Ol-": "A/-1,-1/1,-2/-1,-1/1,-2/-1,-1/a",
    "Opp/Ol+": "A/5,-1/4,-2/-3,0/-1,-1/1,-2/-3,-3/A",
    "Opp/Pl-": "A/2,-4/1,4/-3,0/3,0/-3,0/A",
    "Opp/Pl+": "A/2,-4/1,4/3,0/6,0/-3,0/-3,0/A",
    "Opp/Pr-": "A/-3,6/0,-3/3,0/-4,-1/4,-2/A",
    "Opp/Pr+": "A/6,3/0,3/0,-3/-4,-1/6,0/-2,-2/A",
    "Opp/Q-": "a/4,4/-1,-4/1,1/-3,3/-3,-3/-1,2/-2,-2/A",
    "Opp/Q+": "a/4,4/-1,-4/-5,1/-3,3/-4,-1/-2,-2/A",
    "Opp/Sa-": "A/-3,0/0,3/-1,2/1,4/-4,-1/1,-2/-3,-3/A",
    "Opp/Sa+": "A/5,-4/1,-2/0,3/0,3/-4,-1/-2,1/2,-1/-2,1/A",
    "Opp/Sm-": "a/0,3/0,-3/-2,1/-1,-4/0,3/-3,0/-3,-3/a",
    "Opp/Sm+": "A/3,6/3,0/-1,2/4,1/-1,-4/-3,3/1,-2/-3,-3/A",
    "Opp/W-": "A/3,0/-1,-4/4,1/5,-1/1,4/0,-3/-1,2/a",
    "Opp/W+": "A/5,-1/0,-3/4,1/0,3/0,3/-4,2/-2,1/-3,3/A",
    "Opp/X-": "a/-2,-2/-3,0/-3,-3/-4,2/1,1/-1,2/-2,-2/A",
    "Opp/X+": "a/1,-5/-3,3/2,-1/-2,-2/-4,-1/-2,-2/A",
    "pJ/Adj-": "A/-3,6/0,-3/3,0/-3,0/2,-1/-2,-2/3,0/A",
    "pJ/Adj+": "A/-1,-4/0,3/-3,-3/-3,0/-5,1/-4,2/-3,0/-2,1/A",
    "pJ/Opp-": "A/-1,2/0,3/4,1/-4,-1/1,4/-4,-1/-2,1/A",
    "pJ/Opp+": "A/2,-1/0,-3/6,0/-2,1/-4,-1/1,4/-4,-1/-2,1/A",
    "pJ/pJ-": "A/-1,2/-2,-2/3,0/A",
    "pJ/pJ+": "A/-1,2/4,-2/6,0/-3,0/A",
    "pJ/pN-": "a/-2,-5/0,-3/2,-1/4,1/-3,0/2,-1/-2,-2/A",
    "pJ/pN+": "a/4,1/2,-1/4,-2/-1,2/0,-3/1,4/-1,-4/-2,1/A",
    "pJ/Ba-": "A/5,-4/-2,1/-3,0/3,0/-3,3/A",
    "pJ/Ba+": "A/-1,2/1,-2/-3,0/-3,0/-3,-3/-3,3/A",
    "pJ/Bm-": "a/1,-2/2,-1/-3,3/0,-3/3,0/a",
    "pJ/Bm+": "a/-2,1/-1,2/0,3/0,3/-3,3/-3,-3/a",
    "pJ/Cl-": "A/0,3/-1,-1/4,1/-1,2/-2,1/-3,3/6,0/A",
    "pJ/Cl+": "A/-3,6/-1,-1/1,4/2,-1/1,-2/-3,-3/A",
    "pJ/Cr-": "A/3,3/-1,2/1,-2/0,-3/-1,-1/4,1/6,0/A",
    "pJ/Cr+": "A/3,3/-1,-4/1,-2/-3,0/-1,-1/1,-2/A",
    "pJ/Da-": "A/-3,3/0,-3/3,0/-1,2/1,-2/A",
    "pJ/Da+": "A/-3,-3/-1,-4/4,1/0,-3/-1,-1/-2,1/A",
    "pJ/Dm-": "a/0,-3/0,3/-3,3/-2,1/2,-1/a",
    "pJ/Dm+": "a/3,6/0,3/-2,1/-4,2/-3,-3/-3,0/a",
    "pJ/Ka-": "A/-1,2/-2,1/0,-3/3,0/0,-3/0,3/0,3/A",
    "pJ/Ka+": "A/0,3/-1,-1/1,4/0,-3/-3,-3/3,0/A",
    "pJ/Km-": "a/1,1/-1,2/0,3/-2,-2/3,0/-1,-4/1,1/A",
    "pJ/Km+": "a/0,-3/-3,-3/-2,1/2,-1/-3,-3/3,0/a",
    "pJ/M-": "A/5,-1/0,-3/1,4/0,-3/-3,0/-1,2/-5,1/A",
    "pJ/M+": "a/-2,1/2,2/-2,1/2,-1/-2,-2/2,-1/a",
    "pJ/Or-": "a/-2,-5/0,-3/2,-1/4,1/-1,2/0,-3/-2,-2/A",
    "pJ/Or+": "A/2,-4/0,-3/0,3/-2,1/-4,-1/1,-2/2,-1/-2,-2/A",
    "pJ/Ol-": "a/4,4/-1,-4/-2,1/-1,-4/1,-2/3,0/-1,-4/a",
    "pJ/Ol+": "a/6,-3/-5,1/0,3/-1,-4/-5,1/-1,2/-3,0/-2,1/A",
    "pJ/Pl-": "A/0,3/-3,0/3,0/5,-1/1,-2/A",
    "pJ/Pl+": "A/-3,6/0,-3/0,3/-1,-1/6,0/1,4/A",
    "pJ/Pr-": "a/6,-3/0,-3/-2,1/-1,2/-3,3/a",
    "pJ/Pr+": "A/-3,6/-1,-1/1,4/0,-3/3,0/-3,-3/A",
    "pJ/Q-": "A/2,-1/1,-2/3,0/2,-1/6,0/-2,1/-3,0/-1,2/-2,1/A",
    "pJ/Q+": "A/2,-1/1,-2/3,0/-4,-1/4,1/-3,0/-1,2/-2,1/A",
    "pJ/Sa-": "a/1,-5/0,3/-1,2/1,-2/-1,2/a",
    "pJ/Sa+": "A/-4,5/1,4/0,-3/3,0/-3,0/0,-3/A",
    "pJ/Sm-": "A/5,-1/0,-3/-2,1/-1,2/-2,1/A",
    "pJ/Sm+": "A/5,-1/1,1/-1,-4/-2,1/-1,2/-2,1/A",
    "pJ/W-": "A/3,0/-3,-3/-1,-4/4,-2/-1,-4/1,4/-3,-3/A",
    "pJ/W+": "A/2,-4/3,0/1,-2/-3,3/3,0/5,-1/-2,1/-3,3/A",
    "pJ/X-": "A/2,-1/1,-2/2,-1/3,0/6,0/-3,0/-2,1/-1,2/-2,1/A",
    "pJ/X+": "A/2,-1/1,-2/2,-1/-3,0/3,0/-2,1/-1,2/-2,1/A",
    "pN/Adj-": "A/-1,2/-3,0/4,1/-1,-4/4,1/-4,-1/-2,1/A",
    "pN/Adj+": "A/2,-1/-3,0/1,4/-1,2/6,0/-2,1/-4,-1/-2,1/A",
    "pN/Opp-": "a/3,3/-3,0/-3,-3/-2,1/-1,-1/-3,3/-2,-2/A",
    "pN/Opp+": "A/5,-1/4,-2/-3,0/-3,-3/-3,0/-3,-3/A",
    "pN/pJ-": "A/5,2/3,0/1,-2/-1,-4/0,3/3,0/-2,-2/A",
    "pN/pJ+": "A/-1,-4/1,4/0,-3/2,2/-2,1/-1,2/6,0/-2,1/A",
    "pN/pN-": "a/-2,-2/-4,2/-2,-2/A",
    "pN/pN+": "A/-4,2/4,-2/A",
    "pN/Ba-": "A/-3,6/0,-3/3,0/-3,0/5,-1/6,0/-2,-2/A",
    "pN/Ba+": "A/6,-3/0,-3/0,3/-4,-1/1,1/-3,3/A",
    "pN/Bm-": "a/0,-3/3,0/0,-3/0,3/-5,1/-4,2/-2,-2/A",
    "pN/Bm+": "a/0,-3/3,0/0,-3/1,4/-1,-1/-3,3/a",
    "pN/Cl-": "A/5,2/-3,3/-2,1/-1,2/3,0/-3,3/-2,-2/A",
    "pN/Cl+": "A/6,3/-3,-3/-1,2/0,-3/1,-2/-3,3/-1,2/-2,1/A",
    "pN/Cr-": "A/-1,5/4,-2/-1,2/-2,1/0,3/-3,-3/-3,0/A",
    "pN/Cr+": "A/5,-1/3,0/-3,3/-2,1/-4,-1/-3,-3/-3,3/-2,1/A",
    "pN/Da-": "a/-5,-2/-3,0/-4,2/4,1/5,-1/-3,-3/-2,1/A",
    "pN/Da+": "A/3,-3/-1,-1/1,-2/0,3/-3,0/0,3/A",
    "pN/Dm-": "A/0,-3/-3,-3/3,0/-1,2/1,4/5,-1/4,-2/A",
    "pN/Dm+": "a/3,-3/1,1/-1,2/-3,0/3,0/-3,0/a",
    "pN/Ka-": "A/3,0/0,-3/2,-1/4,1/0,3/-3,0/-3,-3/A",
    "pN/Ka+": "A/3,6/-4,-1/1,4/-4,-1/4,-2/0,-3/-3,0/-3,3/A",
    "pN/Km-": "a/0,-3/0,3/1,-2/-4,-1/1,4/-4,-1/-3,-3/a",
    "pN/Km+": "A/2,-1/1,-2/3,0/-4,2/-2,1/0,3/5,-1/-2,1/A",
    "pN/M-": "A/2,-4/3,0/1,4/0,-3/3,0/-4,2/-2,1/A",
    "pN/M+": "a/3,6/-3,-3/-3,0/1,-2/0,3/-3,0/-1,2/-2,1/A",
    "pN/Or-": "a/-2,-2/2,-1/-2,-2/2,-1/-2,-2/A",
    "pN/Or+": "a/-2,-2/2,-1/4,-2/6,0/-4,-1/-2,-2/A",
    "pN/Ol-": "a/-2,-2/-4,-1/-2,-2/-4,-1/-2,-2/A",
    "pN/Ol+": "a/6,0/4,-2/-4,-1/-2,-2/-4,-1/-2,-2/A",
    "pN/Pl-": "A/-1,5/4,1/0,3/-3,0/0,3/A",
    "pN/Pl+": "a/3,6/0,3/-3,0/1,4/5,-1/1,1/A",
    "pN/Pr-": "A/6,-3/0,-3/0,3/-1,2/-5,1/A",
    "pN/Pr+": "A/-3,3/0,-3/3,0/-3,0/-1,2/4,-2/A",
    "pN/Q-": "A/2,-4/4,1/-1,-1/1,4/-3,0/-1,-1/-2,1/A",
    "pN/Q+": "A/2,-1/1,1/-1,-4/1,4/-1,-1/-2,1/A",
    "pN/Sa-": "A/-4,2/3,0/1,4/0,3/0,-3/5,-1/-2,1/A",
    "pN/Sa+": "A/0,3/-1,-1/-3,0/1,-2/0,-3/-3,0/-1,-4/-2,1/A",
    "pN/Sm-": "A/-1,5/0,-3/4,-2/-3,0/-3,0/-1,-4/-2,1/A",
    "pN/Sm+": "a/3,6/-5,1/0,3/-3,0/-1,-4/-2,1/-4,-1/-2,-2/A",
    "pN/W-": "a/-3,6/-3,0/3,0/-2,1/-1,-1/1,4/-3,0/-1,2/-2,1/A",
    "pN/W+": "A/3,0/-1,-4/0,-3/0,3/-5,1/0,-3/-4,-1/-2,-2/A",
    "pN/X-": "A/5,5/1,4/-3,-3/-1,2/1,1/-1,2/-2,-2/A",
    "pN/X+": "A/5,-1/4,-2/3,0/-1,-1/1,-2/-3,-3/A",
    "Ba/Adj-": "a/-2,1/-1,2/0,-3/-3,3/-3,0/a",
    "Ba/Adj+": "a/-2,1/-1,-4/3,0/-3,0/-3,3/3,0/a",
    "Ba/Opp-": "a/6,3/4,1/-3,3/-1,-1/-3,0/4,1/-3,3/A",
    "Ba/Opp+": "a/0,3/4,1/5,-1/-2,-2/-4,-1/1,4/A",
    "Ba/pJ-": "a/4,-5/-1,2/0,3/0,-3/-3,3/a",
    "Ba/pJ+": "a/4,-5/-1,2/0,3/3,0/-3,-3/-3,3/a",
    "Ba/pN-": "a/3,6/3,0/-3,0/0,3/-5,1/-4,2/-2,-2/A",
    "Ba/pN+": "a/3,6/3,0/-3,0/1,4/-1,-1/-3,3/a",
    "Ba/Ba-": "A/-3,-3/-1,2/-2,1/-4,-1/1,-2/-3,0/3,0/A",
    "Ba/Ba+": "A/-4,5/-2,-2/-1,-4/4,1/0,-3/-3,0/-1,-4/-2,1/A",
    "Ba/Bm-": "A/2,-4/3,0/-5,1/-4,2/-2,1/A",
    "Ba/Bm+": "a/6,3/-3,-3/-2,1/-4,2/a",
    "Ba/Cl-": "a/-3,0/1,-2/-4,-1/4,-2/-4,-1/0,-3/-2,1/A",
    "Ba/Cl+": "A/5,-4/1,4/0,-3/-3,0/-1,2/-2,1/-1,-1/-2,1/A",
    "Ba/Cr-": "a/3,3/-2,1/-1,2/-5,1/-4,2/a",
    "Ba/Cr+": "a/3,3/-2,1/0,3/-1,-1/-3,3/-2,-2/A",
    "Ba/Da-": "a/3,0/-5,1/0,-3/-4,2/3,0/6,0/-2,1/A",
    "Ba/Da+": "A/2,-4/-5,1/-1,-4/-5,1/-3,0/-3,-3/A",
    "Ba/Dm-": "A/2,-1/1,4/-3,0/-4,-1/0,3/6,0/-2,-2/A",
    "Ba/Dm+": "A/-4,5/4,1/-3,0/-1,-4/0,-3/4,-2/A",
    "Ba/Ka-": "A/-1,5/0,-3/-2,1/-3,0/0,-3/-1,-1/-5,1/A",
    "Ba/Ka+": "A/-1,5/-3,0/1,-2/0,-3/-4,-1/-5,1/A",
    "Ba/Km-": "A/3,0/0,-3/0,3/5,-1/-3,0/-3,-3/-5,1/A",
    "Ba/Km+": "a/4,-5/5,-1/0,3/-3,0/0,3/-3,3/a",
    "Ba/M-": "A/5,-1/0,-3/-5,1/-3,0/3,0/-1,2/-5,1/A",
    "Ba/M+": "A/-4,2/3,0/-2,1/-3,0/-1,-4/-5,1/A",
    "Ba/Or-": "a/-3,6/-2,-2/-3,3/-1,2/0,3/4,1/5,-1/a",
    "Ba/Or+": "a/1,4/2,-1/3,0/-5,1/2,-1/-3,-3/-3,0/-2,1/A",
    "Ba/Ol-": "a/-5,-2/2,-1/1,-2/2,-1/3,0/-3,-3/-5,1/A",
    "Ba/Ol+": "a/6,3/-3,-3/3,0/1,4/0,-3/-1,-1/-3,3/-2,-2/A",
    "Ba/Pl-": "A/5,-1/4,-2/-1,-4/4,1/-3,-3/A",
    "Ba/Pl+": "a/3,3/-3,0/1,4/-1,-1/-3,3/-2,-2/A",
    "Ba/Pr-": "A/2,-1/1,-2/3,0/-4,2/-2,1/2,-1/-2,1/A",
    "Ba/Pr+": "A/-4,2/3,0/4,1/0,-3/-1,-4/1,-2/A",
    "Ba/Q-": "a/-3,6/-3,-3/-3,0/4,1/-1,-4/-5,1/-4,2/a",
    "Ba/Q+": "A/3,-3/2,-1/-2,1/-1,2/1,-2/0,3/-1,-1/-2,1/A",
    "Ba/Sa-": "A/-4,2/3,0/1,-2/0,3/2,-1/6,0/-2,-2/A",
    "Ba/Sa+": "A/-4,2/3,0/1,-2/0,3/-4,-1/4,-2/A",
    "Ba/Sm-": "A/2,-4/3,0/4,1/0,-3/3,0/2,-1/4,-2/A",
    "Ba/Sm+": "a/6,-3/-2,-2/-1,-4/0,-3/0,-3/-3,-3/a",
    "Ba/W-": "a/6,3/-5,1/-1,-4/-2,1/-1,2/0,3/4,-2/A",
    "Ba/W+": "A/0,3/0,-3/-1,2/-3,0/-3,-3/-5,1/A",
    "Ba/X-": "a/0,-3/1,1/-3,3/-1,2/-3,0/1,-2/5,-1/a",
    "Ba/X+": "A/5,-1/-2,1/-3,-3/-3,0/-1,-4/-3,3/1,-2/-3,-3/A",
    "Bm/Adj-": "A/2,-1/1,-2/3,0/-3,0/-3,3/A",
    "Bm/Adj+": "A/5,-4/-2,1/0,3/3,0/-3,-3/-3,3/A",
    "Bm/Opp-": "A/3,0/0,-3/3,0/0,3/-1,-1/-2,-2/-3,3/A",
    "Bm/Opp+": "A/6,3/3,0/0,-3/-4,-1/-2,-2/-3,3/A",
    "Bm/pJ-": "A/-1,2/-2,1/0,-3/-3,3/-3,0/A",
    "Bm/pJ+": "A/-4,5/1,-2/0,-3/0,-3/-3,3/-3,-3/A",
    "Bm/pN-": "A/5,2/1,-2/2,-1/-2,1/-1,2/0,-3/-5,1/A",
    "Bm/pN+": "A/0,3/-1,-4/4,-2/-1,-1/4,1/-4,-1/a",
    "Bm/Ba-": "A/0,3/-3,-3/-3,0/-1,-1/-5,1/A",
    "Bm/Ba+": "A/6,3/-3,-3/-1,2/-5,1/A",
    "Bm/Bm-": "A/2,-4/0,3/1,4/-3,0/-4,-1/1,-2/-3,3/A",
    "Bm/Bm+": "A/2,5/1,-2/-1,-4/4,1/-4,2/-2,1/-3,0/-3,3/A",
    "Bm/Cl-": "A/3,3/-1,2/-2,1/-4,2/-5,1/A",
    "Bm/Cl+": "A/3,3/-1,2/4,1/-4,2/-2,-2/-3,3/A",
    "Bm/Cr-": "A/3,3/-1,-4/-2,1/-4,-1/-2,1/0,3/-3,0/A",
    "Bm/Cr+": "A/5,-4/4,1/0,-3/-1,-4/-2,1/0,3/-1,-1/-2,1/A",
    "Bm/Da-": "A/6,3/0,3/2,-1/1,4/0,3/-3,0/-3,-3/A",
    "Bm/Da+": "a/4,-2/-3,0/-1,-4/0,-3/4,1/-1,2/a",
    "Bm/Dm-": "A/-3,-3/3,0/5,-1/-2,1/-4,2/-2,-2/-3,3/A",
    "Bm/Dm+": "A/-3,-3/3,0/5,-1/4,1/-4,2/-5,1/A",
    "Bm/Ka-": "A/3,-3/-1,2/-2,1/0,-3/-3,0/-3,3/-3,-3/A",
    "Bm/Ka+": "A/2,-1/-5,1/0,-3/-3,3/-3,0/3,0/A",
    "Bm/Km-": "A/-3,6/-1,-1/1,4/-1,-4/-3,3/1,4/-3,-3/A",
    "Bm/Km+": "a/-3,-3/4,1/2,-1/3,0/1,1/-1,2/a",
    "Bm/M-": "a/-3,6/-3,0/1,-2/-1,2/-5,1/-3,3/-3,3/A",
    "Bm/M+": "a/0,3/0,-3/-2,1/-3,0/-3,-3/-4,2/a",
    "Bm/Or-": "A/-3,6/-3,-3/-3,0/-1,-4/4,1/-4,2/-5,1/A",
    "Bm/Or+": "A/5,-1/0,-3/-2,-2/-1,2/0,3/-2,1/2,-1/-2,1/A",
    "Bm/Ol-": "A/0,3/-1,-1/-3,3/-2,1/3,0/-1,-4/4,-2/A",
    "Bm/Ol+": "A/5,-1/0,-3/1,4/-3,0/3,0/-3,-3/-1,2/-2,1/A",
    "Bm/Pl-": "A/-3,0/3,0/-1,2/4,1/-1,-4/1,4/-3,-3/A",
    "Bm/Pl+": "a/-5,1/3,0/-1,-4/-3,0/4,1/2,-1/a",
    "Bm/Pr-": "A/0,-3/3,0/3,0/-1,2/-5,1/A",
    "Bm/Pr+": "A/-3,-3/-3,0/3,0/-4,2/-2,-2/-3,3/A",
    "Bm/Q-": "A/6,3/-3,-3/3,0/-4,-1/4,1/-4,2/-5,1/A",
    "Bm/Q+": "A/2,-4/3,0/-2,1/0,3/0,-3/0,3/-1,-1/-2,1/A",
    "Bm/Sa-": "A/-3,3/-1,2/4,1/-3,0/3,0/0,3/-3,3/A",
    "Bm/Sa+": "A/5,-4/4,-2/0,3/-3,0/0,3/-3,3/A",
    "Bm/Sm-": "A/-4,5/-2,-2/-3,0/-1,2/4,-2/3,0/-3,-3/A",
    "Bm/Sm+": "a/-3,-3/4,1/-1,2/0,-3/-2,-2/-1,2/a",
    "Bm/W-": "a/-3,0/0,3/-2,1/-1,2/-5,1/-3,3/-3,3/A",
    "Bm/W+": "a/6,3/3,0/1,-2/-3,0/-3,-3/-4,2/a",
    "Bm/X-": "A/0,-3/2,2/-3,3/-2,1/-3,0/2,-1/4,-2/A",
    "Bm/X+": "A/6,-3/-3,0/-1,2/0,-3/1,-2/-3,3/-4,2/-2,1/A",
    "Cl/Adj-": "A/-3,6/0,-3/2,-1/-3,0/3,0/-2,-2/3,0/A",
    "Cl/Adj+": "a/-3,6/-2,-2/-4,-1/1,-2/-1,-4/-3,-3/a",
    "Cl/Opp-": "a/4,1/-3,3/2,-1/1,-2/0,3/-4,2/1,1/A",
    "Cl/Opp+": "a/6,3/-3,-3/3,0/-2,1/3,0/-1,-1/-3,3/-2,-2/A",
    "Cl/pJ-": "A/6,3/0,3/2,-1/3,0/1,-2/-1,-1/1,-2/A",
    "Cl/pJ+": "A/-3,-3/-1,-4/-2,1/-3,0/-1,-1/1,-2/A",
    "Cl/pN-": "a/-5,-2/-3,3/2,-1/-2,1/-3,0/5,-1/-2,-2/A",
    "Cl/pN+": "a/4,1/2,-1/-5,1/-3,0/0,3/0,3/-1,-4/-2,-2/A",
    "Cl/Ba-": "A/-3,-3/-1,-4/1,-2/-4,-1/-2,1/-3,0/0,3/A",
    "Cl/Ba+": "a/-5,-2/-3,3/3,0/-1,-4/0,3/-5,1/-4,-1/-2,1/A",
    "Cl/Bm-": "a/-3,-3/4,1/-1,2/4,-2/5,-1/a",
    "Cl/Bm+": "a/-2,-5/-1,2/-3,3/-2,1/2,-1/1,4/A",
    "Cl/Cl-": "A/-4,5/-2,1/3,0/-1,-1/1,-2/2,-1/1,-2/A",
    "Cl/Cl+": "A/5,-4/-3,0/0,3/-2,-2/2,-1/-2,1/-4,2/-2,1/A",
    "Cl/Cr-": "A/2,-4/-5,1/3,0/-1,-1/-3,3/4,1/-3,-3/A",
    "Cl/Cr+": "A/5,-1/-2,-2/2,-1/-5,1/-4,2/-2,1/A",
    "Cl/Da-": "A/2,-4/-5,1/-1,2/4,1/-3,-3/A",
    "Cl/Da+": "A/5,-1/4,-2/-1,2/1,-2/6,0/-3,3/A",
    "Cl/Dm-": "A/-3,3/2,-1/1,4/0,-3/-4,-1/-3,0/4,-2/A",
    "Cl/Dm+": "a/0,-3/4,1/3,0/-1,2/4,-2/-1,2/-3,0/-2,-2/A",
    "Cl/Ka-": "A/-3,-3/-1,2/-2,1/0,-3/-1,-1/1,-2/-3,3/A",
    "Cl/Ka+": "a/-2,1/2,-1/-2,1/5,-1/-2,-2/-1,2/a",
    "Cl/Km-": "A/-1,2/1,4/-3,0/-3,-3/-1,-4/0,3/-5,1/A",
    "Cl/Km+": "A/-3,0/2,2/-3,3/1,-2/2,-1/1,-2/A",
    "Cl/M-": "A/3,6/2,2/-3,3/-2,1/2,-1/1,-2/-3,3/A",
    "Cl/M+": "A/5,-4/-5,1/-4,2/3,0/0,-3/-2,1/-1,2/-2,1/A",
    "Cl/Or-": "a/1,4/-1,2/-2,1/-1,2/1,-2/-1,2/4,1/A",
    "Cl/Or+": "a/3,6/4,-2/-3,0/-3,-3/-1,-4/-3,-3/-3,0/-2,1/A",
    "Cl/Ol-": "A/5,-4/4,-2/3,0/-3,3/-1,2/-2,1/0,3/-1,-1/-2,1/A",
    "Cl/Ol+": "A/-1,5/-3,0/-5,1/-4,2/4,1/-1,2/-2,1/-3,-3/A",
    "Cl/Pl-": "a/3,3/-3,0/4,-2/3,0/-1,-1/-3,3/-2,-2/A",
    "Cl/Pl+": "A/5,-1/4,-2/-1,2/-5,1/-3,0/-3,-3/A",
    "Cl/Pr-": "A/2,-4/1,1/-1,2/4,1/-3,0/-1,-4/-2,1/A",
    "Cl/Pr+": "A/3,6/3,0/-1,2/4,1/-1,2/-5,1/3,0/-3,-3/A",
    "Cl/Q-": "A/2,-4/-2,1/0,-3/3,0/-3,0/-4,-1/4,-2/-1,-1/-2,1/A",
    "Cl/Q+": "a/-3,0/-3,-3/-2,1/5,-1/-2,-2/-1,2/-2,1/-3,-3/A",
    "Cl/Sa-": "A/-3,-3/-1,-4/-2,1/0,3/2,2/-2,1/-3,3/A",
    "Cl/Sa+": "a/1,-2/-1,2/1,-2/-3,3/-1,-1/3,0/a",
    "Cl/Sm-": "A/-1,2/4,1/3,0/-3,-3/-1,-4/-3,0/4,-2/A",
    "Cl/Sm+": "A/3,0/-1,-1/-3,3/1,-2/-1,2/1,-2/A",
    "Cl/W-": "A/5,-4/-2,-2/-1,2/1,4/-3,0/2,-1/-2,1/A",
    "Cl/W+": "a/-2,4/-4,-1/3,0/1,-2/2,-1/-2,1/5,-1/-5,1/A",
    "Cl/X-": "A/5,-4/4,1/0,3/-1,-1/4,1/-4,-1/1,-2/-1,-4/-2,1/A",
    "Cl/X+": "a/-5,4/2,-1/1,-2/2,-1/-2,1/3,0/-1,-1/-2,1/A",
    "Cr/Adj-": "A/5,-4/-2,-2/-1,2/0,3/-2,1/3,0/-3,0/A",
    "Cr/Adj+": "A/3,6/2,2/4,1/-1,2/-2,1/-3,-3/A",
    "Cr/Opp-": "A/-3,6/-3,-3/-3,0/2,-1/1,-2/-4,2/-5,1/A",
    "Cr/Opp+": "A/6,-3/-3,-3/-1,2/3,0/1,-2/-3,3/-1,2/-2,1/A",
    "Cr/pJ-": "A/6,-3/-1,-1/4,1/-1,2/1,-2/6,0/-3,3/A",
    "Cr/pJ+": "A/3,0/-1,-1/1,4/2,-1/4,1/-3,-3/A",
    "Cr/pN-": "A/6,3/-3,-3/3,0/-1,2/1,-2/-4,2/-5,1/A",
    "Cr/pN+": "a/1,4/-4,2/-2,1/2,-1/-3,0/4,1/-4,2/-2,1/A",
    "Cr/Ba-": "A/-3,-3/-1,-4/-2,1/5,-1/4,-2/A",
    "Cr/Ba+": "A/-3,-3/-1,-4/-2,1/-1,-1/6,0/-2,-2/A",
    "Cr/Bm-": "A/5,-1/0,-3/4,1/0,-3/-1,-4/-2,1/-3,3/A",
    "Cr/Bm+": "A/-1,5/-3,0/4,1/3,0/6,0/-1,2/-2,1/-3,3/A",
    "Cr/Cl-": "A/-1,5/-3,0/-5,1/-3,0/-1,2/-2,1/-3,3/A",
    "Cr/Cl+": "A/-4,5/-5,1/-4,2/-3,0/1,1/-3,3/A",
    "Cr/Cr-": "A/2,5/1,-2/-1,-4/-3,0/4,1/-1,2/1,4/A",
    "Cr/Cr+": "A/5,-1/-2,-2/-1,2/1,4/-3,0/-4,-1/1,-2/-3,3/A",
    "Cr/Da-": "A/-3,0/3,0/-1,2/4,1/2,-1/-2,1/-3,-3/A",
    "Cr/Da+": "A/-4,-1/-5,1/2,-1/1,-2/-4,-1/0,3/-3,0/-2,-2/A",
    "Cr/Dm-": "a/4,-2/5,-1/-2,1/-1,2/-3,-3/a",
    "Cr/Dm+": "a/4,-5/2,-1/-3,3/-2,1/3,0/-4,2/a",
    "Cr/Ka-": "A/-4,5/1,-2/2,-1/1,4/0,3/2,2/-2,1/A",
    "Cr/Ka+": "a/3,0/-2,-2/-3,3/2,-1/-2,1/2,-1/a",
    "Cr/Km-": "a/-3,-3/4,1/-3,0/2,-1/-3,3/4,-2/-3,0/A",
    "Cr/Km+": "A/5,-4/1,-2/-1,2/-5,1/2,2/-2,1/A",
    "Cr/M-": "A/3,-3/-1,2/-2,1/2,-1/-3,3/-2,-2/3,0/A",
    "Cr/M+": "A/-1,2/4,-2/3,0/2,-1/1,-2/0,3/-1,-1/-2,1/A",
    "Cr/Or-": "a/4,-5/2,-1/-3,0/3,0/-2,-2/-1,2/-2,1/-1,2/-2,1/A",
    "Cr/Or+": "A/5,-4/-2,-2/-1,2/4,1/0,-3/-3,3/-1,2/-2,1/A",
    "Cr/Ol-": "A/3,6/2,2/-2,1/-1,2/-2,1/2,-1/-2,1/A",
    "Cr/Ol+": "A/3,6/2,2/-2,1/-1,2/4,1/6,0/-4,-1/-2,1/A",
    "Cr/Pl-": "A/5,-4/4,1/0,3/-1,-4/-3,0/1,1/-3,3/A",
    "Cr/Pl+": "A/5,2/4,-2/-1,-4/-2,1/-4,-1/3,0/-3,0/-2,-2/A",
    "Cr/Pr-": "A/-1,5/-3,0/-2,1/-3,0/-4,2/-2,1/-3,3/A",
    "Cr/Pr+": "A/-3,-3/3,0/-4,2/1,-2/-4,2/-5,1/A",
    "Cr/Q-": "A/-4,5/-2,-2/-1,-4/4,-2/-1,2/-2,1/0,-3/-1,-1/-2,1/A",
    "Cr/Q+": "A/2,-4/3,0/1,-2/-1,2/-3,0/-2,1/2,2/-2,1/A",
    "Cr/Sa-": "A/-4,5/1,-2/3,0/3,0/-4,-1/4,1/-3,-3/A",
    "Cr/Sa+": "a/-3,0/1,1/-3,3/2,-1/1,-2/2,-1/a",
    "Cr/Sm-": "A/2,-1/-2,-2/-3,0/2,-1/-3,3/4,1/-3,-3/A",
    "Cr/Sm+": "A/-4,5/-2,1/2,-1/4,-2/-1,-1/1,-2/A",
    "Cr/W-": "A/-4,5/1,-2/3,0/-4,-1/3,0/-2,-2/3,0/A",
    "Cr/W+": "a/3,6/-3,-3/-3,0/1,-2/-3,0/2,2/-2,1/-3,3/A",
    "Cr/X-": "A/3,0/0,-3/2,-1/4,1/6,0/-4,-1/-2,1/-1,2/-2,1/A",
    "Cr/X+": "A/3,0/0,-3/2,-1/-2,1/2,-1/-2,1/-1,2/-2,1/A",
    "Da/Adj-": "a/3,0/-3,0/-3,3/-2,1/2,-1/a",
    "Da/Adj+": "a/3,3/-2,1/-4,-1/0,-3/-2,-2/-1,2/a",
    "Da/Opp-": "A/3,0/0,-3/2,-1/-3,0/1,4/-1,-1/-2,1/A",
    "Da/Opp+": "a/3,-3/-2,-2/-1,2/0,3/0,-3/0,3/a",
    "Da/pJ-": "a/0,-3/-3,3/-3,0/-2,1/2,-1/a",
    "Da/pJ+": "a/3,3/4,1/-1,-4/3,0/1,1/-1,2/a",
    "Da/pN-": "A/-3,6/-3,-3/-3,0/2,-1/4,1/5,-1/4,-2/A",
    "Da/pN+": "a/4,-2/-1,-1/3,0/-3,0/0,3/-3,0/a",
    "Da/Ba-": "A/-4,2/0,3/1,-2/0,-3/6,0/-1,-1/-2,1/A",
    "Da/Ba+": "A/2,-4/0,3/-2,1/0,3/5,-1/-2,1/A",
    "Da/Bm-": "A/2,-4/3,0/1,4/0,-3/6,0/-1,2/-2,1/A",
    "Da/Bm+": "A/2,-4/0,3/4,1/3,0/-1,-4/-2,1/A",
    "Da/Cl-": "a/-2,4/5,-1/-2,1/-4,-1/-3,-3/a",
    "Da/Cl+": "A/-1,-4/1,-2/2,-1/-3,3/1,-2/-1,-4/a",
    "Da/Cr-": "A/-3,3/-1,-1/3,0/4,1/0,3/-1,-4/1,-2/A",
    "Da/Cr+": "A/2,-1/1,-2/0,-3/-4,-1/1,4/0,3/2,-1/-2,1/A",
    "Da/Da-": "A/3,-3/-1,2/4,1/-3,0/-1,-4/3,0/-5,1/A",
    "Da/Da+": "A/0,-3/-1,2/-5,1/-1,2/4,1/-1,-4/6,0/-2,1/A",
    "Da/Dm-": "A/-1,2/4,-2/5,-1/3,0/-5,1/A",
    "Da/Dm+": "a/-2,4/-1,-4/-3,-3/-3,0/a",
    "Da/Ka-": "A/-3,6/-1,-1/1,4/-1,2/1,-2/6,0/-3,3/A",
    "Da/Ka+": "A/0,3/-1,-1/4,1/2,-1/4,1/-3,-3/A",
    "Da/Km-": "a/0,3/-3,-3/3,0/1,-2/3,0/-1,-1/-2,1/A",
    "Da/Km+": "a/3,0/0,-3/3,0/-3,3/-2,-2/-1,2/a",
    "Da/M-": "A/-1,2/-2,1/3,0/5,-1/4,-2/-1,-1/-2,1/A",
    "Da/M+": "A/5,-1/4,1/0,3/-1,2/0,-3/4,-2/A",
    "Da/Or-": "A/-3,6/-3,0/2,-1/4,-2/-1,-1/-3,0/4,-2/A",
    "Da/Or+": "A/0,3/0,-3/-1,2/-3,0/-2,-2/-3,0/-1,-1/-2,1/A",
    "Da/Ol-": "a/4,-2/-4,-1/0,3/1,-2/-3,3/-1,-1/3,0/a",
    "Da/Ol+": "A/3,3/-1,-4/-3,3/4,1/0,3/-3,-3/-1,-4/4,-2/A",
    "Da/Pl-": "A/-1,2/-2,1/6,0/0,3/-4,-1/0,3/-5,1/A",
    "Da/Pl+": "A/5,-4/1,4/0,-3/-4,-1/0,3/-5,1/A",
    "Da/Pr-": "A/-3,-3/-1,2/1,4/-4,2/-5,1/A",
    "Da/Pr+": "A/-3,-3/-1,-4/1,4/-3,3/-1,-1/-5,1/A",
    "Da/Q-": "A/6,3/3,0/2,-1/-3,3/-2,-2/2,-1/4,-2/A",
    "Da/Q+": "A/-1,5/0,-3/1,4/-3,-3/-3,0/0,-3/-1,-4/-2,1/A",
    "Da/Sa-": "A/3,6/2,2/4,1/-1,2/1,4/6,0/-3,3/A",
    "Da/Sa+": "A/-4,5/-2,-2/-3,0/2,-1/-2,1/-3,-3/A",
    "Da/Sm-": "A/2,-4/-2,1/0,-3/0,3/-1,-4/-3,0/4,-2/A",
    "Da/Sm+": "a/-3,6/-3,0/0,-3/-3,-3/-2,-2/-1,2/a",
    "Da/W-": "A/-1,2/1,-2/-1,2/4,-2/-1,-1/1,-2/-3,3/A",
    "Da/W+": "A/5,-1/-3,-3/3,0/-2,1/0,3/-3,0/A",
    "Da/X-": "a/4,-5/-1,2/0,3/1,-2/-1,2/-2,-2/-1,2/a",
    "Da/X+": "A/0,3/-3,0/-1,2/1,-2/2,-1/4,-2/5,-1/-2,1/A",
    "Dm/Adj-": "A/3,-3/3,0/-3,0/-1,2/-2,1/A",
    "Dm/Adj+": "A/3,3/-1,2/4,1/3,0/2,2/-2,1/A",
    "Dm/Opp-": "A/2,-4/1,4/-3,-3/-3,0/-1,2/-2,1/-3,-3/A",
    "Dm/Opp+": "A/5,-1/-2,-2/3,0/-3,0/0,3/-3,0/A",
    "Dm/pJ-": "A/3,0/-3,0/-3,3/-1,2/1,-2/A",
    "Dm/pJ+": "A/6,-3/-3,0/-1,2/-5,1/-3,-3/-3,0/A",
    "Dm/pN-": "A/-1,5/-2,1/-3,-3/-3,0/2,-1/-2,1/-3,-3/A",
    "Dm/pN+": "A/3,-3/-1,-1/-2,1/0,3/0,-3/0,3/A",
    "Dm/Ba-": "a/-2,1/-4,-1/3,0/1,4/0,-3/-4,2/-2,-2/A",
    "Dm/Ba+": "a/4,-5/-1,-4/3,0/4,1/0,3/-4,2/a",
    "Dm/Bm-": "a/4,1/0,3/5,-1/0,3/4,-2/-3,0/-3,3/A",
    "Dm/Bm+": "A/-4,2/-5,1/-1,-4/4,-2/-3,0/-3,-3/A",
    "Dm/Cl-": "A/3,6/3,0/-1,2/4,1/2,-1/1,4/-3,-3/A",
    "Dm/Cl+": "a/3,-3/-2,1/-4,-1/0,3/1,4/-3,0/-4,2/-2,-2/A",
    "Dm/Cr-": "A/-4,2/-5,1/-1,2/1,-2/-3,-3/A",
    "Dm/Cr+": "A/5,-4/-2,1/-3,3/2,-1/3,0/-5,1/A",
    "Dm/Da-": "A/2,-4/4,1/6,0/-3,3/-3,0/A",
    "Dm/Da+": "A/-4,2/1,-2/-3,-3/-3,0/A",
    "Dm/Dm-": "A/0,-3/0,3/2,-1/1,4/-1,2/1,4/-3,-3/A",
    "Dm/Dm+": "a/-3,6/-2,-2/-1,2/1,4/-4,2/1,4/-1,-1/-2,1/A",
    "Dm/Ka-": "A/0,3/0,-3/-1,2/-5,1/-3,-3/-3,0/-3,3/A",
    "Dm/Ka+": "A/6,-3/0,-3/-3,3/-1,2/1,-2/-3,3/A",
    "Dm/Km-": "a/-5,1/-1,-4/-3,0/-2,1/0,3/6,0/-1,-1/a",
    "Dm/Km+": "a/1,-5/-4,-1/-3,0/1,-2/0,-3/5,-1/a",
    "Dm/M-": "A/3,0/-3,-3/-1,-4/0,-3/1,-2/-1,2/1,-2/A",
    "Dm/M+": "a/-5,1/-1,-4/-3,0/-2,1/3,0/-4,2/a",
    "Dm/Or-": "A/-4,2/4,1/0,-3/-1,2/4,-2/-1,-1/-2,1/A",
    "Dm/Or+": "A/2,-4/1,-2/3,0/-1,2/-3,3/-2,-2/3,0/-3,3/A",
    "Dm/Ol-": "a/3,0/0,-3/1,-2/-3,3/2,2/4,1/5,-1/a",
    "Dm/Ol+": "a/6,-3/-3,0/1,4/-3,3/-1,-1/4,1/5,-1/-2,-2/A",
    "Dm/Pl-": "A/-4,2/-5,1/-3,0/3,0/-3,-3/A",
    "Dm/Pl+": "A/-1,5/4,1/3,0/0,3/-3,0/-3,3/A",
    "Dm/Pr-": "A/-3,0/0,3/-1,2/1,4/0,-3/-3,0/-3,-3/A",
    "Dm/Pr+": "a/4,-5/-4,-1/-3,0/1,4/0,3/-4,2/a",
    "Dm/Q-": "a/0,-3/0,3/1,-2/-3,3/-1,-1/-2,1/5,-1/a",
    "Dm/Q+": "a/0,3/1,-2/-3,-3/3,0/-1,2/1,-2/-1,2/-2,1/A",
    "Dm/Sa-": "A/6,3/3,0/2,-1/-5,1/-3,-3/-3,0/-3,3/A",
    "Dm/Sa+": "A/3,-3/3,0/-3,0/-1,2/1,-2/-3,3/A",
    "Dm/Sm-": "a/-5,4/0,-3/-4,-1/4,1/-4,2/4,1/2,-1/a",
    "Dm/Sm+": "a/6,-3/-2,-2/-1,-4/1,-2/-1,-4/-3,-3/a",
    "Dm/W-": "A/6,-3/-3,-3/-1,2/0,3/-2,1/2,-1/-2,1/A",
    "Dm/W+": "a/-2,4/-1,-4/0,3/-2,1/0,-3/5,-1/a",
    "Dm/X-": "A/2,-4/-2,1/0,3/2,-1/-3,3/-2,-2/3,0/A",
    "Dm/X+": "A/2,-4/4,1/-3,0/-1,2/4,-2/-1,-1/-2,1/-3,3/A",
    "Ka/Adj-": "A/-4,2/3,0/1,-2/-1,2/1,-2/A",
    "Ka/Adj+": "A/-1,2/1,-2/-1,2/-3,0/-2,-2/6,0/A",
    "Ka/Opp-": "A/-4,5/-5,1/3,0/3,0/-4,-1/0,-3/4,-2/A",
    "Ka/Opp+": "A/5,2/0,3/1,-2/-1,-4/-3,3/1,4/-1,-4/-2,-2/A",
    "Ka/pJ-": "A/-3,0/2,2/4,1/3,0/-1,-1/-2,1/-3,-3/A",
    "Ka/pJ+": "a/-3,6/-3,-3/4,1/-1,-4/-3,-3/-3,0/a",
    "Ka/pN-": "a/3,6/0,3/-2,1/-4,-1/4,1/-1,2/-3,-3/a",
    "Ka/pN+": "A/2,-4/-2,1/-1,-4/4,1/-1,-4/1,4/-1,-4/-2,1/A",
    "Ka/Ba-": "A/-3,6/-1,-1/1,4/-1,2/-5,1/-3,0/-3,-3/A",
    "Ka/Ba+": "a/1,-5/0,3/-1,2/3,0/4,1/5,-1/a",
    "Ka/Bm-": "A/3,0/0,-3/2,-1/-3,3/-2,1/2,-1/-2,1/A",
    "Ka/Bm+": "a/-5,4/5,-1/0,3/-3,0/-3,3/-3,0/a",
    "Ka/Cl-": "A/0,3/-1,-1/4,1/2,-1/-3,3/1,4/-3,-3/A",
    "Ka/Cl+": "A/2,-1/1,-2/2,-1/-5,1/2,2/-2,1/A",
    "Ka/Cr-": "A/6,3/2,2/-3,3/-2,1/-1,2/4,1/6,0/A",
    "Ka/Cr+": "A/0,-3/2,2/-3,3/1,-2/-1,2/1,-2/A",
    "Ka/Da-": "A/3,3/-3,0/5,-1/-2,1/0,-3/-1,-1/-2,1/A",
    "Ka/Da+": "a/1,-2/-1,-1/-3,0/1,-2/-4,-1/-3,-3/a",
    "Ka/Dm-": "A/5,-1/1,-2/0,3/0,-3/-4,-1/0,3/-5,1/A",
    "Ka/Dm+": "a/3,6/3,0/-3,3/-2,1/2,-1/-3,3/a",
    "Ka/Ka-": "a/3,0/-2,-2/3,0/-4,2/4,1/5,-1/-5,1/A",
    "Ka/Ka+": "A/-1,5/1,4/-1,2/3,0/-2,-2/-1,2/3,0/-2,1/A",
    "Ka/Km-": "A/5,-1/-3,-3/-2,1/2,2/-2,1/A",
    "Ka/Km+": "a/6,-3/-2,-2/-1,2/-3,3/a",
    "Ka/M-": "A/3,6/3,0/-1,2/-3,3/-2,1/2,-1/-2,1/A",
    "Ka/M+": "A/3,3/-1,2/-2,1/-4,2/4,-2/-1,2/-2,1/-3,-3/A",
    "Ka/Or-": "a/4,-5/-1,2/0,3/-5,1/2,-1/-2,1/2,-1/a",
    "Ka/Or+": "a/-3,0/1,-2/3,0/-1,-1/3,0/1,4/-1,2/4,-2/A",
    "Ka/Ol-": "a/4,-5/-1,2/-2,1/5,-1/-3,0/-2,1/-1,2/a",
    "Ka/Ol+": "A/2,-4/-2,1/-3,0/-4,-1/1,4/-1,-4/-3,0/-2,1/A",
    "Ka/Pl-": "a/-2,1/-1,-4/6,0/-3,0/-3,0/a",
    "Ka/Pl+": "a/1,-2/-1,2/3,0/-3,0/a",
    "Ka/Pr-": "a/-3,0/3,0/3,0/4,-2/-1,2/a",
    "Ka/Pr+": "a/3,0/-3,0/1,-2/-1,2/a",
    "Ka/Q-": "a/-5,-2/-1,2/4,1/-4,-1/4,-2/-4,-1/-3,0/a",
    "Ka/Q+": "A/5,2/0,3/1,-2/-4,-1/3,0/-5,1/-4,-1/-2,-2/A",
    "Ka/Sa-": "A/-3,6/-3,-3/-1,-4/4,-2/-1,2/-2,1/-3,-3/A",
    "Ka/Sa+": "A/-1,2/1,-2/-1,2/3,0/0,-3/-2,-2/2,-1/-2,-2/A",
    "Ka/Sm-": "a/4,-5/-4,-1/0,-3/3,0/-3,-3/-3,0/3,0/a",
    "Ka/Sm+": "A/-4,-1/0,-3/-3,-3/-2,1/5,-1/-3,0/-3,3/-2,1/A",
    "Ka/W-": "a/1,-2/-1,2/1,-2/-1,2/-5,1/-4,2/4,-2/A",
    "Ka/W+": "a/-3,3/-2,1/2,-1/1,-2/-3,0/5,-1/a",
    "Ka/X-": "a/0,-3/3,0/1,-2/-1,-4/-2,1/-4,-1/-3,-3/a",
    "Ka/X+": "A/-4,5/0,-3/-3,0/-5,1/-4,-1/-2,1/2,-1/-2,-2/A",
    "Km/Adj-": "a/4,-2/-3,0/-1,2/1,-2/-1,2/a",
    "Km/Adj+": "A/-3,6/0,-3/-3,-3/3,0/-4,-1/-2,1/A",
    "Km/Opp-": "A/3,0/-3,0/2,-1/1,4/-3,0/3,0/-3,-3/A",
    "Km/Opp+": "a/3,6/-3,3/4,1/-1,-4/4,-2/-4,-1/-3,0/-2,1/A",
    "Km/pJ-": "a/-2,1/-3,0/3,0/-1,-1/3,0/1,-2/-3,0/A",
    "Km/pJ+": "A/-3,6/-1,-1/4,1/0,-3/-3,-3/3,0/A",
    "Km/pN-": "A/-3,6/0,-3/2,-1/4,1/-4,-1/4,1/-3,-3/A",
    "Km/pN+": "a/-3,6/1,-2/3,0/0,-3/-1,-4/-3,0/-3,-3/-2,1/A",
    "Km/Ba-": "A/-3,3/-1,2/-2,1/0,-3/0,-3/-3,-3/-3,3/A",
    "Km/Ba+": "A/-4,5/-5,1/-3,0/0,3/-3,0/-3,3/A",
    "Km/Bm-": "A/3,3/-1,2/-2,1/-3,0/-1,-1/1,4/6,0/A",
    "Km/Bm+": "A/3,3/-1,-4/1,-2/0,-3/-1,-1/-2,1/A",
    "Km/Cl-": "A/5,-4/1,-2/-3,0/0,-3/-1,-4/1,4/-3,-3/A",
    "Km/Cl+": "a/0,3/-2,-2/-3,3/2,-1/1,-2/2,-1/a",
    "Km/Cr-": "A/0,-3/2,2/4,1/-1,-4/-2,1/-1,2/-2,1/A",
    "Km/Cr+": "a/-5,4/2,-1/1,-2/5,-1/-2,-2/-1,2/a",
    "Km/Da-": "A/-3,6/-3,0/0,3/0,3/-3,3/-1,2/-2,1/A",
    "Km/Da+": "A/0,3/-3,0/-3,0/-3,-3/-1,-1/-2,1/A",
    "Km/Dm-": "A/-4,2/1,4/-3,0/-3,3/-1,2/0,3/-5,1/A",
    "Km/Dm+": "A/-1,5/1,4/3,0/2,-1/0,3/-5,1/A",
    "Km/Ka-": "A/6,3/-3,-3/-3,3/-1,-1/-2,1/A",
    "Km/Ka+": "A/3,0/-3,3/5,-1/-2,1/A",
    "Km/Km-": "A/-1,2/-2,-2/-1,2/4,-2/3,0/5,-1/-5,1/A",
    "Km/Km+": "A/2,5/-5,1/-4,-1/4,-2/3,0/-1,-4/6,0/-2,1/A",
    "Km/M-": "A/-3,-3/-3,0/-1,-1/-2,1/3,0/2,2/-2,1/A",
    "Km/M+": "a/1,4/-3,-3/3,0/-1,-4/-3,-3/-3,0/0,3/-2,-2/A",
    "Km/Or-": "A/-4,5/1,-2/2,-1/-5,1/3,0/2,-1/1,-2/A",
    "Km/Or+": "A/6,-3/0,-3/-1,2/1,4/-3,3/-1,2/1,-2/-3,-3/A",
    "Km/Ol-": "A/-4,5/1,-2/0,-3/5,-1/-2,1/2,-1/-2,1/A",
    "Km/Ol+": "A/-4,2/4,1/3,0/-4,2/1,4/-1,-4/-3,0/-2,1/A",
    "Km/Pl-": "A/0,-3/3,0/2,-1/1,4/6,0/A",
    "Km/Pl+": "A/3,6/0,3/-1,2/-2,1/A",
    "Km/Pr-": "A/-1,2/1,4/0,3/-3,0/0,-3/A",
    "Km/Pr+": "A/5,-4/-2,1/-3,0/0,3/A",
    "Km/Q-": "A/0,-3/-4,-1/4,-2/-1,-4/1,4/2,-1/4,1/A",
    "Km/Q+": "A/0,-3/-4,-1/4,-2/-1,-4/1,4/-4,-1/6,0/-2,1/A",
    "Km/Sa-": "A/-3,6/-3,-3/-1,-4/4,-2/-3,0/0,3/-3,-3/A",
    "Km/Sa+": "A/5,-4/-2,1/-3,0/5,-1/-2,-2/-1,-4/6,0/-2,-2/A",
    "Km/Sm-": "A/-4,-1/-2,1/-1,2/1,-2/-4,-1/-5,1/-3,0/A",
    "Km/Sm+": "A/-4,-1/-2,1/-1,2/1,-2/2,-1/-5,1/-1,-1/-2,1/A",
    "Km/W-": "A/-1,5/0,-3/1,4/6,0/-4,-1/-2,1/-3,3/A",
    "Km/W+": "A/5,-1/-3,0/1,-2/2,-1/-2,1/-3,3/A",
    "Km/X-": "A/3,0/-3,0/2,-1/1,4/-1,2/1,-2/-3,-3/A",
    "Km/X+": "A/-3,6/0,-3/2,-1/4,1/-1,2/4,1/6,0/-3,3/A",
    "M/Adj-": "a/-2,1/5,-1/3,0/-3,3/-2,1/-3,0/5,-1/a",
    "M/Adj+": "A/2,-1/4,-2/5,-1/-2,1/-3,0/0,3/2,-1/-2,1/A",
    "M/Opp-": "A/-4,5/-2,1/3,0/-1,-4/4,-2/0,-3/3,0/-1,-1/-2,1/A",
    "M/Opp+": "A/6,-3/0,-3/-1,2/4,1/-3,0/-4,2/-2,1/-3,-3/A",
    "M/pJ-": "a/6,3/4,-2/-1,2/-2,1/-3,0/-4,2/4,1/A",
    "M/pJ+": "a/3,0/-2,-2/3,0/-1,2/-2,-2/-1,2/a",
    "M/pN-": "A/-4,5/4,-2/-3,0/0,3/-1,-4/-3,0/4,-2/A",
    "M/pN+": "a/-3,6/4,1/-1,2/-5,1/-4,-1/3,0/-3,3/-2,1/A",
    "M/Ba-": "a/0,3/-3,0/-2,1/-1,2/-2,-2/-3,3/-3,3/A",
    "M/Ba+": "a/-3,6/0,-3/1,-2/-3,0/-3,-3/-4,2/a",
    "M/Bm-": "A/-4,2/3,0/-2,1/-3,3/3,0/-1,-4/4,-2/A",
    "M/Bm+": "A/-3,0/3,0/-1,2/-3,0/-3,-3/-5,1/A",
    "M/Cl-": "A/-4,5/1,-2/0,-3/-4,-1/-2,1/-1,-1/-2,1/A",
    "M/Cl+": "A/5,-4/-5,1/-3,0/3,0/-1,2/-2,1/-1,-1/-2,1/A",
    "M/Cr-": "A/-3,6/-1,-1/3,0/1,4/0,3/2,-1/-2,1/A",
    "M/Cr+": "A/5,-4/-5,1/-4,2/4,1/0,-3/-3,0/-1,2/-2,1/A",
    "M/Da-": "A/-3,-3/-1,2/-5,1/-3,0/0,-3/-1,-1/-2,1/A",
    "M/Da+": "a/-5,1/-1,-4/0,-3/-2,1/0,3/-4,2/a",
    "M/Dm-": "A/-4,5/-2,1/2,-1/-5,1/2,2/-2,1/-3,3/A",
    "M/Dm+": "A/5,-1/4,1/3,0/-1,2/-3,0/4,-2/A",
    "M/Ka-": "A/3,3/3,0/-1,-1/1,-2/3,0/2,2/-2,1/A",
    "M/Ka+": "A/3,6/-4,-1/-3,0/3,0/-3,0/0,3/-2,1/-3,3/A",
    "M/Km-": "A/6,3/0,3/2,-1/-3,3/-2,1/-1,2/-2,1/A",
    "M/Km+": "A/-1,2/-3,-3/3,0/1,-2/-3,-3/-3,0/-1,2/-2,-2/A",
    "M/M-": "A/2,-1/0,-3/4,1/-3,3/-4,-1/3,0/-2,1/A",
    "M/M+": "A/5,-1/0,-3/-2,-2/-1,2/1,1/-3,3/A",
    "M/Or-": "a/1,-5/0,3/-1,-4/3,0/-3,3/4,1/-1,2/a",
    "M/Or+": "a/3,0/-2,-2/-1,2/4,1/-1,2/-2,-2/-1,2/4,-2/A",
    "M/Ol-": "a/4,-5/-4,-1/0,3/-3,3/4,1/-3,0/5,-1/a",
    "M/Ol+": "A/0,3/-3,0/-1,2/1,4/-1,2/-3,3/1,4/-3,-3/A",
    "M/Pl-": "A/-3,-3/-1,-4/-3,3/1,4/0,-3/-1,-1/-2,1/A",
    "M/Pl+": "A/-1,5/0,-3/1,-2/-3,0/-1,2/4,-2/A",
    "M/Pr-": "A/-4,5/-2,1/0,-3/-1,-4/-3,3/6,0/-2,-2/A",
    "M/Pr+": "A/-4,5/-2,1/0,-3/2,-1/-3,-3/-5,1/A",
    "M/Q-": "A/5,-4/-2,1/-1,2/3,0/-2,-2/2,-1/-2,1/-1,2/-2,1/A",
    "M/Q+": "A/-1,5/-2,1/0,3/-4,2/1,4/-4,-1/-3,0/1,-2/A",
    "M/Sa-": "A/-3,3/2,-1/1,-2/-1,2/3,0/6,0/-2,-2/A",
    "M/Sa+": "A/-3,3/2,-1/1,-2/-1,2/-3,0/4,-2/A",
    "M/Sm-": "a/-2,1/-1,2/-2,1/-3,0/2,2/-3,3/-5,1/A",
    "M/Sm+": "a/-2,4/-1,-1/-2,1/2,-1/1,-2/2,-1/a",
    "M/W-": "A/5,-4/-2,1/0,3/-3,3/-1,-1/-3,0/4,-2/A",
    "M/W+": "A/0,3/0,-3/0,3/-4,-1/-3,-3/-2,1/-1,-1/-2,1/A",
    "M/X-": "A/-3,3/-1,2/3,0/1,4/-1,-4/1,4/0,3/-1,-4/-2,1/A",
    "M/X+": "a/6,-3/0,-3/4,1/-3,-3/-1,2/-2,1/-3,3/-4,-1/a",
    "Ol/Adj-": "A/-3,0/0,3/-1,2/1,4/-1,2/-2,1/-3,-3/A",
    "Ol/Adj+": "A/6,3/3,0/2,-1/4,1/2,-1/1,4/6,0/-3,3/A",
    "Ol/Opp-": "A/-1,-1/4,1/-1,-1/3,0/1,1/A",
    "Ol/Opp+": "A/-1,5/4,-2/3,0/-1,-1/-2,1/-3,-3/A",
    "Ol/pJ-": "A/3,0/0,-3/2,-1/4,1/-1,2/4,1/-3,-3/A",
    "Ol/pJ+": "a/6,3/4,1/-1,2/-2,1/-1,2/-2,-2/-1,2/-2,1/A",
    "Ol/pN-": "a/-2,-2/-1,2/-2,-2/-1,2/-2,-2/A",
    "Ol/pN+": "a/6,0/4,-2/-1,2/-2,-2/-1,2/-2,-2/A",
    "Ol/Ba-": "A/6,3/-3,-3/3,0/-1,-4/4,1/5,-1/4,-2/A",
    "Ol/Ba+": "A/2,-4/3,0/1,1/-1,2/-3,0/-2,1/2,-1/-2,1/A",
    "Ol/Bm-": "a/3,6/1,1/-3,3/2,-1/0,-3/1,4/-4,2/a",
    "Ol/Bm+": "a/6,3/1,4/-3,3/-1,2/3,0/-2,1/-1,-4/-2,-2/A",
    "Ol/Cl-": "a/4,-5/2,-1/0,3/0,-3/1,1/-1,2/-2,1/-1,2/-2,1/A",
    "Ol/Cl+": "A/-3,6/-1,-1/3,0/4,1/3,0/-3,3/-1,2/-2,1/A",
    "Ol/Cr-": "a/1,4/2,-1/-2,1/2,-1/1,-2/2,-1/4,1/A",
    "Ol/Cr+": "a/6,3/-2,1/-1,2/1,1/-1,2/-2,-2/-1,2/-2,1/A",
    "Ol/Da-": "A/-1,5/4,1/0,3/-1,2/-3,3/-2,-2/3,0/A",
    "Ol/Da+": "A/5,-1/4,1/3,0/0,-3/-4,2/4,-2/-1,-1/-2,1/A",
    "Ol/Dm-": "A/3,6/0,3/-1,2/-3,3/-2,-2/-4,-1/-5,1/A",
    "Ol/Dm+": "A/-4,5/1,1/-1,-4/-3,-3/-3,0/-2,1/2,-1/-2,1/A",
    "Ol/Ka-": "A/-4,5/-2,1/2,-1/-5,1/0,3/-1,2/-2,1/A",
    "Ol/Ka+": "A/5,-4/1,-2/-3,3/-1,2/4,-2/-3,0/-1,2/-2,1/A",
    "Ol/Km-": "a/-5,4/2,-1/3,0/-5,1/2,-1/1,-2/2,-1/a",
    "Ol/Km+": "A/-3,0/-3,-3/-1,-4/0,3/4,1/3,0/-1,-4/-2,1/A",
    "Ol/M-": "A/2,-1/4,1/0,-3/-3,3/-1,-4/3,0/-5,1/A",
    "Ol/M+": "A/2,5/0,3/-5,1/0,-3/0,3/-4,2/-3,-3/-2,1/A",
    "Ol/Or-": "A/3,-3/-1,-1/3,0/1,1/-3,3/-1,-1/-2,1/A",
    "Ol/Or+": "A/-3,6/-1,-1/-3,3/1,1/-1,2/-5,1/A",
    "Ol/Ol-": "a/-2,-2/-4,-1/-2,-2/-1,-1/-2,-2/-1,2/-2,-2/A",
    "Ol/Ol+": "a/1,-5/5,-1/1,4/-1,2/1,1/-3,3/-1,-1/-2,1/A",
    "Ol/Pl-": "a/3,-3/1,4/2,-1/-2,1/-4,-1/6,0/-2,1/A",
    "Ol/Pl+": "a/3,-3/1,4/2,-1/-2,1/2,-1/4,1/A",
    "Ol/Pr-": "A/-3,0/3,0/-1,2/0,3/1,4/2,2/-2,1/A",
    "Ol/Pr+": "A/6,3/-3,-3/-1,2/-3,0/1,-2/-3,0/-4,2/-2,1/A",
    "Ol/Q-": "A/5,5/-3,0/-3,-3/-2,1/-3,-3/-1,2/-2,-2/A",
    "Ol/Q+": "A/-1,5/4,-2/-1,-4/-3,-3/-2,1/-3,-3/A",
    "Ol/Sa-": "A/5,-4/1,-2/-1,2/4,-2/0,-3/2,-1/1,-2/A",
    "Ol/Sa+": "A/6,3/3,0/2,-1/1,4/-3,3/-1,2/4,1/-3,-3/A",
    "Ol/Sm-": "a/4,-5/-1,2/-3,0/4,-2/-1,2/-2,1/-1,2/a",
    "Ol/Sm+": "a/0,3/1,-2/2,-1/-2,-2/2,-1/1,4/2,-1/-5,1/A",
    "Ol/W-": "A/-4,5/1,4/-3,3/-3,0/-1,-4/-3,0/4,-2/A",
    "Ol/W+": "A/-4,5/4,1/3,0/-1,-4/-2,-2/-3,-3/-1,2/-5,1/A",
    "Ol/X-": "A/5,5/-2,1/-3,-3/-1,-4/-3,-3/-3,0/-2,-2/A",
    "Ol/X+": "A/-3,-3/-1,2/-3,-3/-2,1/-4,2/-5,1/A",
    "Or/Adj-": "A/-4,-1/-3,0/-2,1/-4,-1/-2,1/-4,-1/1,1/A",
    "Or/Adj+": "a/0,-3/4,-2/0,-3/-4,-1/4,-2/-1,2/0,3/-2,1/A",
    "Or/Opp-": "A/-1,-1/-2,1/-1,-1/-3,0/1,1/A",
    "Or/Opp+": "A/-1,5/4,-2/-3,0/-1,-1/4,1/-3,-3/A",
    "Or/pJ-": "A/2,5/3,0/-2,1/-1,-4/1,-2/-1,-4/-2,-2/A",
    "Or/pJ+": "A/-1,2/1,-2/-3,0/-3,0/-1,-4/-2,1/-1,2/-2,1/A",
    "Or/pN-": "a/-2,-2/-1,-4/-2,-2/-1,-4/-2,-2/A",
    "Or/pN+": "a/-2,-2/-1,-4/4,-2/6,0/-1,2/-2,-2/A",
    "Or/Ba-": "A/0,-3/2,2/-3,3/1,-2/-3,0/-4,-1/-5,1/A",
    "Or/Ba+": "A/2,-4/0,3/4,1/0,3/-3,0/-3,-3/-1,2/-2,1/A",
    "Or/Bm-": "A/2,-4/4,1/-1,-1/-3,3/-2,1/3,0/-3,0/A",
    "Or/Bm+": "A/-4,2/-5,1/-1,2/1,-2/-4,-1/4,-2/5,-1/-2,1/A",
    "Or/Cl-": "A/6,-3/-1,-1/-2,1/-1,2/-2,1/2,-1/-2,1/A",
    "Or/Cl+": "A/6,-3/-1,-1/-2,1/-1,2/4,1/6,0/-4,-1/-2,1/A",
    "Or/Cr-": "A/2,-1/3,0/1,4/-1,-4/4,-2/3,0/0,-3/-1,2/-2,1/A",
    "Or/Cr+": "A/2,-1/1,-2/-3,0/-3,3/-1,-4/-2,1/2,2/-2,1/A",
    "Or/Da-": "A/5,-1/4,-2/-1,-4/1,4/0,3/-3,-3/-3,0/A",
    "Or/Da+": "a/-2,-5/-3,3/-1,-4/-2,1/5,-1/4,-2/-1,-4/-2,1/A",
    "Or/Dm-": "a/4,-2/-1,-4/0,3/-2,1/-3,3/-1,-1/3,0/a",
    "Or/Dm+": "A/-3,-3/-1,-4/-3,3/4,1/0,-3/-3,-3/-1,-4/-5,1/A",
    "Or/Ka-": "A/-4,5/-2,1/0,-3/5,-1/1,-2/-1,2/1,-2/A",
    "Or/Ka+": "A/-1,2/1,-2/-3,0/5,-1/1,-2/2,-1/1,4/6,0/A",
    "Or/Km-": "a/-5,4/2,-1/1,-2/5,-1/-3,0/1,-2/-1,2/a",
    "Or/Km+": "A/2,-4/0,3/-2,1/-3,0/3,0/-3,0/-4,-1/-2,1/A",
    "Or/M-": "A/5,-1/-3,0/4,1/0,-3/-3,3/-1,-4/-2,1/A",
    "Or/M+": "A/5,-1/0,-3/1,4/0,3/-3,-3/-3,3/-1,2/-2,1/A",
    "Or/Or-": "a/-2,-2/2,-1/-2,-2/-1,-1/-2,-2/-1,-4/-2,-2/A",
    "Or/Or+": "a/1,-5/5,-1/-2,1/-1,2/1,1/-3,3/-1,-1/-2,1/A",
    "Or/Ol-": "A/-1,5/1,-2/5,-1/6,0/-2,-2/-1,-1/-2,1/A",
    "Or/Ol+": "A/5,-1/0,-3/1,1/-3,3/-1,-1/-2,1/A",
    "Or/Pl-": "A/2,-4/1,4/-3,-3/-3,0/-1,-4/-2,1/-3,-3/A",
    "Or/Pl+": "A/-1,5/4,-2/-3,0/0,3/-4,-1/-5,1/-4,2/-2,1/A",
    "Or/Pr-": "a/4,-2/0,3/2,-1/-2,1/2,-1/-3,0/-5,1/A",
    "Or/Pr+": "A/-4,-1/-2,1/2,-1/-2,1/-1,-4/-3,3/a",
    "Or/Q-": "A/3,3/-1,2/-3,-3/-2,1/-1,-1/6,0/-2,-2/A",
    "Or/Q+": "A/-3,-3/-1,-4/-3,-3/4,1/-4,2/-5,1/A",
    "Or/Sa-": "A/5,-4/1,-2/0,3/-4,2/-2,1/2,-1/-2,1/A",
    "Or/Sa+": "A/2,-1/-2,1/0,-3/5,-1/1,-2/-3,3/-1,2/-2,1/A",
    "Or/Sm-": "a/4,-5/-1,2/-2,1/-4,2/3,0/-2,1/2,-1/a",
    "Or/Sm+": "A/-1,5/1,-2/0,3/-1,-4/4,1/-1,-4/0,3/-2,1/A",
    "Or/W-": "A/-4,2/0,3/1,4/-3,3/-3,0/-1,-4/1,-2/A",
    "Or/W+": "A/-3,0/0,3/-1,2/1,4/2,-1/-3,3/4,1/-3,-3/A",
    "Or/X-": "A/5,5/3,0/-3,-3/4,1/-3,-3/-1,-4/-2,-2/A",
    "Or/X+": "A/-4,2/-5,1/-1,2/-3,-3/-2,1/-3,-3/A",
    "Pl/Adj-": "a/3,0/0,-3/0,3/4,-2/2,-1/a",
    "Pl/Adj+": "A/3,6/2,2/4,1/0,3/-3,0/-3,-3/A",
    "Pl/Opp-": "A/6,3/3,0/0,-3/-1,2/4,-2/A",
    "Pl/Opp+": "A/6,-3/-3,0/0,3/-1,2/6,0/-2,-2/A",
    "Pl/pJ-": "A/-3,3/-1,2/1,-2/0,-3/3,0/A",
    "Pl/pJ+": "A/3,-3/-1,2/-2,1/0,3/6,0/-3,0/A",
    "Pl/pN-": "a/-5,1/-1,-4/-3,0/0,3/-3,0/a",
    "Pl/pN+": "A/0,3/0,-3/3,0/-3,3/-1,2/4,-2/A",
    "Pl/Ba-": "A/-3,0/0,3/0,3/-1,-4/4,-2/A",
    "Pl/Ba+": "A/0,-3/0,3/3,0/-1,2/6,0/-2,-2/A",
    "Pl/Bm-": "a/-2,1/-3,0/-1,-4/3,0/-5,1/-4,-1/1,4/A",
    "Pl/Bm+": "A/-1,5/0,-3/4,1/0,3/-1,-4/1,-2/A",
    "Pl/Cl-": "A/5,-1/-2,-2/-1,2/-2,1/0,3/5,-1/-2,1/A",
    "Pl/Cl+": "A/3,3/-3,0/-4,2/1,-2/5,-1/4,-2/A",
    "Pl/Cr-": "A/5,-1/-2,-2/-1,2/4,1/3,0/-1,-4/-2,1/A",
    "Pl/Cr+": "A/5,-4/-2,1/-1,2/3,0/-3,0/-2,1/2,-1/-2,1/A",
    "Pl/Da-": "a/-2,-5/-1,-4/4,-2/0,-3/-1,-4/3,0/-2,1/A",
    "Pl/Da+": "a/-5,4/-4,-1/0,3/1,4/0,-3/5,-1/a",
    "Pl/Dm-": "A/3,3/-1,2/1,4/5,-1/4,-2/A",
    "Pl/Dm+": "A/3,3/-1,-4/1,4/5,-1/-2,-2/6,0/A",
    "Pl/Ka-": "A/5,-4/1,4/6,0/0,3/0,3/A",
    "Pl/Ka+": "A/2,-1/-2,1/0,-3/0,3/A",
    "Pl/Km-": "a/-3,6/-3,0/1,-2/-1,-4/6,0/a",
    "Pl/Km+": "a/6,-3/-3,0/-2,1/-1,2/a",
    "Pl/M-": "A/6,-3/-1,-1/4,1/-1,-4/-3,3/1,4/-3,-3/A",
    "Pl/M+": "a/1,-5/3,0/-1,2/0,3/1,-2/-4,2/a",
    "Pl/Or-": "A/3,3/-1,2/1,4/0,3/-3,-3/-1,-4/4,-2/A",
    "Pl/Or+": "A/5,-1/1,-2/-3,-3/-1,2/1,4/-3,0/2,-1/-2,1/A",
    "Pl/Ol-": "A/0,-3/-3,-3/3,0/-1,-4/1,-2/5,-1/4,-2/A",
    "Pl/Ol+": "A/3,-3/-4,-1/1,-2/-1,2/1,-2/-1,-4/a",
    "Pl/Pl-": "A/3,0/-1,-4/4,1/-3,3/-4,-1/4,1/-3,0/A",
    "Pl/Pl+": "A/-3,6/-1,2/4,-2/3,0/-4,2/-2,1/-3,0/-3,3/A",
    "Pl/Pr-": "A/6,-3/-3,-3/-1,2/1,1/-3,3/A",
    "Pl/Pr+": "A/-3,-3/-1,2/4,-2/3,0/-4,2/-5,1/A",
    "Pl/Q-": "A/3,3/-1,-4/1,4/-3,0/-3,-3/-1,2/4,-2/A",
    "Pl/Q+": "A/5,2/-3,0/-5,1/0,-3/5,-1/-3,0/a",
    "Pl/Sa-": "A/2,-1/1,4/-3,0/0,3/3,0/A",
    "Pl/Sa+": "A/-1,2/1,-2/0,3/0,-3/A",
    "Pl/Sm-": "a/-3,0/0,3/-2,1/-1,-4/6,0/a",
    "Pl/Sm+": "a/0,-3/0,3/1,-2/-1,2/a",
    "Pl/W-": "A/2,-1/1,-2/3,0/-1,2/-3,3/6,0/-2,-2/A",
    "Pl/W+": "A/-1,2/1,-2/0,3/-4,-1/-3,-3/-5,1/A",
    "Pl/X-": "A/-4,-1/1,-2/2,-1/1,-2/-4,-1/a",
    "Pl/X+": "A/5,2/-2,1/-1,-4/6,0/1,4/-4,-1/a",
    "Pr/Adj-": "a/3,-3/-2,1/-1,2/0,-3/0,3/a",
    "Pr/Adj+": "A/6,-3/-3,0/-1,2/4,1/-3,-3/-3,3/A",
    "Pr/Opp-": "A/2,-4/-2,1/0,3/0,-3/0,3/A",
    "Pr/Opp+": "A/5,-1/-2,1/0,-3/3,0/-3,0/-3,3/A",
    "Pr/pJ-": "A/3,6/3,0/-1,2/-2,1/-3,3/A",
    "Pr/pJ+": "A/-3,6/6,0/-3,0/-1,2/-2,1/-3,3/A",
    "Pr/pN-": "a/3,0/0,-3/3,0/1,4/5,-1/a",
    "Pr/pN+": "A/2,-4/1,-2/3,0/-3,0/0,3/-3,3/A",
    "Pr/Ba-": "A/6,3/3,0/2,-1/4,1/-4,-1/-2,1/-3,-3/A",
    "Pr/Ba+": "a/-2,4/0,-3/-1,-4/3,0/4,1/2,-1/a",
    "Pr/Bm-": "A/-1,5/4,-2/-1,-4/1,-2/-3,-3/A",
    "Pr/Bm+": "A/-4,2/-5,1/-1,-4/-2,1/-3,3/6,0/A",
    "Pr/Cl-": "A/2,-1/1,4/-3,0/-4,-1/3,0/-2,-2/-3,3/A",
    "Pr/Cl+": "A/5,-4/-2,1/-1,2/-5,1/3,0/3,0/5,-1/-2,1/A",
    "Pr/Cr-": "A/-1,5/4,-2/-1,2/1,1/-3,3/3,0/-3,-3/A",
    "Pr/Cr+": "A/-1,5/4,-2/-1,2/4,-2/-3,0/-3,-3/A",
    "Pr/Da-": "A/-1,5/4,-2/3,0/3,0/-3,-3/A",
    "Pr/Da+": "A/-4,2/-5,1/3,0/0,-3/6,0/-3,3/A",
    "Pr/Dm-": "A/-1,2/1,-2/-1,2/4,-2/-3,0/2,-1/-2,1/A",
    "Pr/Dm+": "A/-4,5/1,4/3,0/-4,-1/0,-3/4,-2/A",
    "Pr/Ka-": "A/3,0/0,-3/-3,0/-4,2/-2,1/A",
    "Pr/Ka+": "A/0,-3/0,3/2,-1/-2,1/A",
    "Pr/Km-": "a/-2,1/-4,-1/-3,0/0,3/3,0/a",
    "Pr/Km+": "a/4,-5/-1,2/0,3/-3,0/a",
    "Pr/M-": "a/-2,1/2,-1/0,3/1,4/-3,3/-4,2/-2,-2/A",
    "Pr/M+": "a/4,-5/-1,2/0,3/4,1/-3,-3/-4,2/a",
    "Pr/Or-": "a/4,1/-1,2/-2,1/-1,-4/6,0/-2,1/-3,3/A",
    "Pr/Or+": "a/1,4/-1,2/1,-2/-1,2/4,1/-3,3/A",
    "Pr/Ol-": "a/3,6/4,-2/-3,0/-4,2/-3,0/4,1/-3,3/A",
    "Pr/Ol+": "a/3,6/4,-2/-3,0/-4,2/3,0/6,0/-2,1/-3,3/A",
    "Pr/Pl-": "A/3,-3/2,2/4,1/-3,-3/-3,0/A",
    "Pr/Pl+": "A/-4,2/-5,1/3,0/5,-1/-2,1/-3,-3/A",
    "Pr/Pr-": "A/-3,0/0,3/-1,2/1,4/-1,-4/-2,1/-3,-3/A",
    "Pr/Pr+": "A/2,5/-3,3/1,4/-3,0/-1,2/-3,-3/-3,3/-2,1/A",
    "Pr/Q-": "A/-1,5/-2,1/-3,-3/-3,0/-1,-4/1,4/-3,-3/A",
    "Pr/Q+": "a/-3,0/4,-2/0,-3/-4,2/-3,0/4,1/A",
    "Pr/Sa-": "A/6,0/0,-3/-3,0/-1,2/-2,1/A",
    "Pr/Sa+": "A/6,-3/-3,0/-1,2/-2,1/A",
    "Pr/Sm-": "a/1,-2/-1,2/0,3/6,0/-3,0/a",
    "Pr/Sm+": "a/-5,4/2,-1/0,-3/3,0/a",
    "Pr/W-": "a/-2,1/-1,2/-3,0/0,3/-2,1/-3,3/-3,3/A",
    "Pr/W+": "A/5,-1/-3,-3/4,1/-3,0/-1,2/-2,1/A",
    "Pr/X-": "a/4,1/-1,2/-2,1/-1,2/4,1/A",
    "Pr/X+": "a/1,4/-1,2/1,-2/-1,-4/6,0/-2,1/A",
    "Q/Adj-": "a/6,3/1,4/0,3/2,-1/4,1/5,-1/1,4/-1,2/-2,1/A",
    "Q/Adj+": "A/5,-4/-2,1/-3,0/-1,-4/4,1/0,3/-1,2/-2,1/A",
    "Q/Opp-": "A/-4,5/-2,-2/-1,-4/1,-2/6,0/-4,2/-2,1/A",
    "Q/Opp+": "A/5,-4/-2,-2/-4,-1/1,4/2,2/-2,1/A",
    "Q/pJ-": "A/2,-4/1,-2/0,3/0,3/-1,-4/4,1/-3,0/-1,2/-2,1/A",
    "Q/pJ+": "a/-3,6/4,1/3,0/-1,-4/1,4/3,0/-1,2/-2,-2/A",
    "Q/pN-": "A/2,-4/1,4/-1,-1/4,1/-3,0/-1,-1/-2,1/A",
    "Q/pN+": "A/6,-3/-1,-1/-3,0/1,4/-1,-1/-2,1/A",
    "Q/Ba-": "A/-3,6/-3,-3/-3,0/-4,-1/4,1/5,-1/4,-2/A",
    "Q/Ba+": "A/5,-1/0,-3/4,1/3,0/-3,0/3,0/-4,2/-2,1/A",
    "Q/Bm-": "A/-4,2/-2,1/2,2/-3,3/-2,1/-3,0/0,3/A",
    "Q/Bm+": "A/5,-4/0,-3/1,4/-3,3/-1,-4/1,1/-1,2/-2,1/A",
    "Q/Cl-": "A/-1,5/3,0/6,0/1,4/-1,2/0,3/-2,1/-1,-1/-2,1/A",
    "Q/Cl+": "A/5,-1/0,-3/1,-2/-1,2/0,3/-2,1/-1,-1/-2,1/A",
    "Q/Cr-": "A/-1,2/-3,0/-5,1/2,2/4,1/-4,-1/4,1/-1,2/-2,1/A",
    "Q/Cr+": "a/3,6/-3,-3/-2,1/5,-1/-2,-2/-1,2/1,4/-3,-3/A",
    "Q/Da-": "A/2,-4/-5,1/-1,-4/4,1/-3,0/-3,-3/3,0/A",
    "Q/Da+": "A/-1,5/1,4/-3,0/0,3/-4,-1/4,-2/-1,-1/-2,1/A",
    "Q/Dm-": "A/-3,6/0,-3/2,-1/4,-2/-1,-1/3,0/-5,1/A",
    "Q/Dm+": "A/-3,6/-1,-4/3,0/4,-2/-1,2/1,1/-1,-4/-2,1/A",
    "Q/Ka-": "A/2,-4/3,0/1,4/-3,0/-3,3/-1,-4/1,-2/A",
    "Q/Ka+": "a/6,-3/-2,-2/2,-1/-2,1/5,-1/1,4/2,2/-2,1/A",
    "Q/Km-": "a/-3,6/4,1/-4,2/4,1/-4,-1/1,-2/-1,-4/a",
    "Q/Km+": "A/5,-1/0,-3/1,4/0,-3/0,3/-3,-3/-1,-1/-2,1/A",
    "Q/M-": "A/5,-1/-3,-3/3,0/-2,1/-3,0/5,-1/-2,1/-1,2/-2,1/A",
    "Q/M+": "A/-1,2/1,-2/3,0/5,-1/4,-2/-3,0/-1,2/-2,1/A",
    "Q/Or-": "A/5,5/3,0/-3,-3/-2,1/-3,-3/-1,-4/-2,-2/A",
    "Q/Or+": "A/-1,5/4,-2/-1,2/-3,-3/-2,1/-3,-3/A",
    "Q/Ol-": "A/5,5/-2,1/-3,-3/-1,2/-3,-3/-3,0/-2,-2/A",
    "Q/Ol+": "A/-3,-3/-1,-4/-3,-3/-2,1/-4,2/-5,1/A",
    "Q/Pl-": "A/-1,5/-2,1/-3,-3/-3,0/-4,-1/-2,1/-3,-3/A",
    "Q/Pl+": "a/-5,-2/-3,0/-4,2/-3,0/4,-2/-3,0/A",
    "Q/Pr-": "A/-3,-3/-1,-4/4,1/3,0/-3,-3/-1,2/-5,1/A",
    "Q/Pr+": "A/-4,-1/-3,0/-5,1/-3,0/5,-1/-3,0/a",
    "Q/Q-": "A/-4,2/4,1/5,-1/6,0/-2,-2/-1,-1/-2,1/A",
    "Q/Q+": "A/2,-4/3,0/1,1/-3,3/-1,-1/-2,1/A",
    "Q/Sa-": "A/5,-1/-3,0/4,1/-3,3/0,-3/-1,-4/-2,1/A",
    "Q/Sa+": "A/-1,5/0,-3/1,4/-3,0/-3,3/-3,-3/-1,2/-2,1/A",
    "Q/Sm-": "a/6,3/1,4/5,-1/1,4/-4,-1/1,-2/-1,-4/a",
    "Q/Sm+": "A/2,-4/0,3/4,1/-3,3/0,-3/-1,-4/1,-2/-3,3/A",
    "Q/W-": "a/-5,4/0,-3/2,-1/-3,-3/-2,1/2,-1/1,-2/-4,2/-2,1/A",
    "Q/W+": "A/-4,2/-2,1/-3,0/5,-1/4,1/-1,-4/0,3/-2,1/A",
    "Q/X-": "a/-2,-2/2,-1/-3,-3/-5,1/-3,-3/-1,-4/-2,-2/A",
    "Q/X+": "A/2,-4/4,-2/-3,0/-1,2/1,1/-3,3/-1,-1/-2,1/A",
    "Sa/Adj-": "a/-2,-2/-1,2/1,-2/-1,-1/-2,1/-1,-4/-2,-2/A",
    "Sa/Adj+": "a/3,6/-3,-3/4,1/-1,-4/-3,-3/3,0/a",
    "Sa/Opp-": "a/6,-3/0,-3/-2,1/-1,-4/1,4/-1,2/-3,-3/a",
    "Sa/Opp+": "A/2,-1/-3,0/0,3/1,4/5,-1/-3,0/-3,0/-2,1/A",
    "Sa/pJ-": "A/5,-1/-3,0/-2,1/2,-1/-2,1/A",
    "Sa/pJ+": "A/5,-1/0,-3/1,-2/-1,2/1,4/6,0/A",
    "Sa/pN-": "A/5,-1/0,-3/1,4/0,3/3,0/-4,2/-2,1/A",
    "Sa/pN+": "A/5,-4/1,-2/-3,3/-3,0/5,-1/-2,1/-1,2/-2,1/A",
    "Sa/Ba-": "a/4,-2/0,-3/-1,2/-3,0/-2,1/-4,2/-2,-2/A",
    "Sa/Ba+": "a/4,-2/0,-3/-1,2/-3,0/4,1/-4,2/a",
    "Sa/Bm-": "A/-3,0/3,0/0,-3/-4,2/-3,0/-3,-3/-5,1/A",
    "Sa/Bm+": "a/3,0/-2,-2/-4,-1/0,-3/-3,0/-3,-3/a",
    "Sa/Cl-": "A/-4,5/1,-2/2,-1/4,-2/-1,-1/4,1/6,0/A",
    "Sa/Cl+": "A/-1,2/-2,1/-1,2/4,-2/-1,-1/1,-2/A",
    "Sa/Cr-": "A/-1,2/1,4/3,0/-3,-3/-1,-4/0,-3/4,-2/A",
    "Sa/Cr+": "A/0,3/-1,-1/-3,3/1,-2/2,-1/1,-2/A",
    "Sa/Da-": "a/6,-3/-2,-2/-1,-4/-2,1/-1,2/6,0/-3,3/a",
    "Sa/Da+": "a/3,0/-2,-2/-4,-1/1,-2/-4,-1/-3,-3/a",
    "Sa/Dm-": "A/-4,5/4,-2/0,3/2,-1/-5,1/2,2/-2,1/A",
    "Sa/Dm+": "a/0,3/-3,3/3,0/-2,1/2,-1/-3,3/a",
    "Sa/Ka-": "A/-3,-3/-1,-4/1,4/-4,2/4,1/-3,-3/-3,0/A",
    "Sa/Ka+": "A/3,3/-1,2/-2,1/5,-1/3,0/-2,1/-1,2/-2,1/A",
    "Sa/Km-": "a/0,3/4,-2/0,-3/5,-1/3,0/-3,3/-2,1/A",
    "Sa/Km+": "A/6,-3/0,-3/-1,2/1,4/-1,-1/-2,1/-1,-1/-2,1/A",
    "Sa/M-": "A/2,-4/3,0/-2,1/3,0/3,0/-1,2/-2,1/A",
    "Sa/M+": "a/3,-3/1,-2/-1,2/-2,1/3,0/-4,2/a",
    "Sa/Or-": "a/-5,4/2,-1/0,-3/4,-2/-1,2/1,-2/-1,2/a",
    "Sa/Or+": "A/-3,6/-3,-3/-1,-4/-3,0/4,1/-3,0/-1,-4/-2,1/A",
    "Sa/Ol-": "a/-5,4/2,-1/1,-2/-4,2/3,0/1,-2/2,-1/a",
    "Sa/Ol+": "A/-4,5/-2,-2/-1,-4/-2,1/0,3/-3,0/-4,-1/-2,1/A",
    "Sa/Pl-": "a/-2,1/2,-1/3,0/6,0/-3,0/a",
    "Sa/Pl+": "a/-2,1/2,-1/-3,0/3,0/a",
    "Sa/Pr-": "a/0,6/3,0/0,3/-2,1/-1,2/a",
    "Sa/Pr+": "a/3,6/0,3/-2,1/-1,2/a",
    "Sa/Q-": "a/1,-5/0,3/-1,-4/-3,3/3,0/4,1/-1,2/a",
    "Sa/Q+": "A/2,-4/3,0/1,4/0,3/0,3/-3,-3/-1,-1/-2,1/A",
    "Sa/Sa-": "A/-1,2/4,-2/-3,3/-4,-1/-2,1/-1,-1/-2,1/A",
    "Sa/Sa+": "A/-4,2/3,0/1,4/3,0/3,0/-3,3/-1,-4/-2,1/A",
    "Sa/Sm-": "A/0,3/-1,-1/-3,0/-3,-3/-5,1/A",
    "Sa/Sm+": "a/3,6/1,1/-1,2/-3,3/a",
    "Sa/W-": "A/3,0/-3,-3/-1,-4/0,-3/4,-2/5,-1/-2,1/A",
    "Sa/W+": "a/-5,-2/0,-3/-1,-4/-3,3/-5,1/-1,2/3,0/-2,1/A",
    "Sa/X-": "a/6,-3/0,-3/-2,1/-1,-4/-2,1/-4,-1/-3,-3/a",
    "Sa/X+": "a/-3,6/4,-2/-1,-4/-2,1/0,3/-1,-1/-3,-3/-2,1/A",
    "Sm/Adj-": "A/3,3/-1,2/-2,-2/-3,0/0,-3/-1,-1/-2,1/A",
    "Sm/Adj+": "A/6,3/2,2/4,1/0,-3/-3,-3/3,0/A",
    "Sm/Opp-": "A/6,3/0,3/2,-1/1,4/-1,-4/4,1/-3,-3/A",
    "Sm/Opp+": "a/-3,0/1,-2/-3,0/3,0/-4,-1/3,0/-3,-3/-2,1/A",
    "Sm/pJ-": "a/-2,1/2,-1/-2,1/-3,0/5,-1/a",
    "Sm/pJ+": "a/-2,1/2,-1/-2,1/-3,0/-1,-1/6,0/a",
    "Sm/pN-": "A/3,6/0,3/-1,2/1,4/0,3/0,-3/-3,-3/A",
    "Sm/pN+": "a/-3,3/0,-3/4,1/-4,-1/-5,1/-4,-1/3,0/-2,1/A",
    "Sm/Ba-": "A/3,-3/2,-1/1,4/0,-3/3,0/-3,3/-3,0/A",
    "Sm/Ba+": "A/2,-1/4,-2/3,0/-3,0/3,0/-3,3/A",
    "Sm/Bm-": "A/3,3/-1,-4/-2,1/-3,0/6,0/-4,2/-2,1/A",
    "Sm/Bm+": "A/3,3/-1,-4/-2,1/3,0/2,2/-2,1/A",
    "Sm/Cl-": "A/-1,-4/0,3/0,-3/4,-2/-1,2/1,4/-3,0/A",
    "Sm/Cl+": "a/0,-3/1,1/-3,3/2,-1/-2,1/2,-1/a",
    "Sm/Cr-": "A/3,3/-1,2/4,1/-3,0/-3,0/-1,2/-2,1/A",
    "Sm/Cr+": "a/4,-5/-1,2/-2,1/-3,3/-1,-1/3,0/a",
    "Sm/Da-": "A/0,3/0,-3/-3,0/-3,-3/-3,0/-1,2/-2,1/A",
    "Sm/Da+": "A/6,-3/0,-3/0,3/-3,3/-1,-1/-2,1/A",
    "Sm/Dm-": "A/2,-1/0,3/1,4/-4,-1/4,-2/-1,-4/1,-2/A",
    "Sm/Dm+": "A/3,6/2,2/4,1/2,-1/1,-2/-3,-3/A",
    "Sm/Ka-": "A/-4,5/1,4/0,3/3,0/-3,-3/-3,0/0,-3/A",
    "Sm/Ka+": "a/3,3/3,0/4,1/-3,0/-3,-3/-1,-4/-3,3/-2,-2/A",
    "Sm/Km-": "A/-4,5/1,1/-3,3/0,-3/-1,2/0,3/-5,1/A",
    "Sm/Km+": "A/5,-1/1,-2/0,-3/0,3/-1,2/-2,1/-1,-1/-2,1/A",
    "Sm/M-": "A/-1,2/-2,1/-1,2/0,-3/-2,-2/-3,-3/-3,3/A",
    "Sm/M+": "A/2,-1/-2,1/2,-1/0,-3/1,1/-3,3/A",
    "Sm/Or-": "A/5,-4/-2,1/-1,2/4,-2/-3,0/-1,2/-2,1/A",
    "Sm/Or+": "A/0,-3/3,0/2,-1/1,4/-3,3/-1,2/1,-2/-3,-3/A",
    "Sm/Ol-": "A/5,-4/-2,1/0,3/-4,2/1,-2/-1,2/1,-2/A",
    "Sm/Ol+": "A/5,-1/1,4/0,-3/5,-1/1,4/-1,-4/3,0/-2,1/A",
    "Sm/Pl-": "A/6,-3/0,-3/-1,2/1,4/6,0/A",
    "Sm/Pl+": "A/3,0/-3,0/2,-1/-2,1/A",
    "Sm/Pr-": "A/2,-1/4,1/-3,0/3,0/3,0/A",
    "Sm/Pr+": "A/-4,5/1,-2/3,0/0,-3/A",
    "Sm/Q-": "A/2,-1/1,4/-3,3/-3,0/-1,-4/0,3/-5,1/A",
    "Sm/Q+": "A/3,0/-1,-4/-5,1/-4,-1/1,4/-4,-1/6,0/-2,1/A",
    "Sm/Sa-": "A/-3,3/-3,-3/-3,0/-1,-1/-2,1/A",
    "Sm/Sa+": "A/3,-3/0,3/-1,-1/-2,1/A",
    "Sm/Sm-": "A/-4,2/4,-2/-3,0/5,-1/-2,1/-1,-1/-2,1/A",
    "Sm/Sm+": "A/-3,-3/3,0/5,-1/1,-2/0,3/0,3/-1,2/-2,1/A",
    "Sm/W-": "A/6,-3/-1,-1/4,1/2,-1/-2,-2/3,0/-3,-3/A",
    "Sm/W+": "A/3,3/3,0/-4,2/1,-2/0,3/0,3/-1,2/-2,1/A",
    "Sm/X-": "A/3,6/0,3/-1,2/1,4/-1,2/1,-2/-3,-3/A",
    "Sm/X+": "A/-3,0/3,0/-1,2/4,1/-1,2/4,1/6,0/-3,3/A",
    "W/Adj-": "A/-4,2/4,-2/-3,0/0,3/-1,-1/-3,0/4,-2/A",
    "W/Adj+": "A/3,0/-1,-1/3,0/-2,1/-1,-1/-2,1/A",
    "W/Opp-": "a/-3,0/4,1/-4,-1/-5,1/-4,-1/3,0/-2,1/A",
    "W/Opp+": "a/-3,0/4,1/-4,-1/-5,1/2,-1/6,0/-3,0/-2,1/A",
    "W/pJ-": "A/-3,0/-3,-3/-1,-4/-5,1/-1,2/-2,1/-3,-3/A",
    "W/pJ+": "A/6,3/-3,-3/-1,2/4,-2/-1,-4/1,4/6,0/-3,3/A",
    "W/pN-": "a/3,0/-3,3/-2,1/-3,0/3,0/-4,-1/3,0/-3,-3/-2,1/A",
    "W/pN+": "A/-3,6/5,-1/-3,0/0,3/4,1/-3,0/-1,2/-2,-2/A",
    "W/Ba-": "a/6,3/0,3/1,-2/-1,2/-2,1/-3,3/-3,3/A",
    "W/Ba+": "a/-3,0/3,0/-2,1/-3,0/-3,-3/-4,2/a",
    "W/Bm-": "A/-1,5/-3,0/1,-2/0,3/-3,3/-1,-4/-5,1/A",
    "W/Bm+": "A/-3,6/0,-3/2,-1/-3,0/-3,-3/-5,1/A",
    "W/Cl-": "A/-4,5/-2,1/3,0/-1,-4/3,0/-2,-2/3,0/A",
    "W/Cl+": "A/-1,5/4,1/3,0/0,3/-1,-1/-2,1/-1,2/-2,1/A",
    "W/Cr-": "a/-5,4/2,-1/0,-3/1,4/2,-1/-2,-2/2,-1/a",
    "W/Cr+": "A/6,-3/-3,3/3,0/-1,2/-3,3/-2,1/-1,2/-2,1/A",
    "W/Da-": "A/3,3/-3,0/5,-1/1,-2/3,0/2,2/-2,1/A",
    "W/Da+": "a/-2,4/-4,-1/0,3/1,-2/0,-3/5,-1/a",
    "W/Dm-": "A/-4,2/-3,-3/-3,0/4,1/-3,0/3,0/3,0/A",
    "W/Dm+": "A/2,-4/4,1/0,-3/-1,2/0,3/-5,1/A",
    "W/Ka-": "A/2,-1/-2,1/2,-1/3,0/4,-2/-3,3/-3,-3/A",
    "W/Ka+": "A/3,-3/-1,2/-2,1/2,-1/3,0/-5,1/A",
    "W/Km-": "A/5,-4/-2,1/3,0/3,0/-1,2/3,0/-5,1/A",
    "W/Km+": "a/1,-5/0,3/2,-1/1,-2/-1,2/-3,3/a",
    "W/M-": "A/5,-4/1,-2/-3,0/5,-1/-2,-2/-1,-4/-5,1/A",
    "W/M+": "a/-3,6/4,1/-3,3/-4,2/-3,0/3,0/4,1/-3,0/A",
    "W/Or-": "A/-4,5/4,1/-3,3/0,-3/-1,-4/0,-3/4,-2/A",
    "W/Or+": "A/-4,5/1,4/3,0/-3,0/-1,-1/-2,-2/-1,-4/-5,1/A",
    "W/Ol-": "A/-4,2/3,0/4,1/3,0/-3,3/-1,-4/1,-2/A",
    "W/Ol+": "A/6,3/0,3/2,-1/1,4/-1,2/-3,3/1,4/-3,-3/A",
    "W/Pl-": "A/-4,2/-3,-3/-2,1/3,0/6,0/-4,-1/-2,1/A",
    "W/Pl+": "A/-4,2/-3,-3/-2,1/-3,0/2,-1/-2,1/A",
    "W/Pr-": "a/-2,4/-1,-4/-5,1/-4,-1/-2,1/2,-1/4,1/A",
    "W/Pr+": "A/-4,5/1,-2/3,0/-4,-1/-3,-3/-5,1/A",
    "W/Q-": "A/-1,5/1,-2/-4,-1/4,1/-1,-4/-2,-2/-3,3/-1,-4/-2,1/A",
    "W/Q+": "A/-4,2/-2,1/0,-3/5,-1/1,4/-1,-4/3,0/-2,1/A",
    "W/Sa-": "A/6,-3/-1,-1/4,1/-3,0/2,2/-2,1/-3,-3/A",
    "W/Sa+": "a/4,4/2,-1/-2,1/-1,-1/-2,1/-3,3/-1,-4/-2,-2/A",
    "W/Sm-": "A/-4,5/1,-2/2,-1/-3,3/1,-2/3,0/0,-3/A",
    "W/Sm+": "A/5,-1/-3,-3/4,1/-3,-3/-3,0/0,3/2,2/-2,1/A",
    "W/W-": "A/-3,3/-1,-1/-2,-2/-1,-1/-2,1/-1,-1/-2,1/A",
    "W/W+": "A/-3,3/-1,-1/-3,-3/-2,1/-1,-1/-2,1/A",
    "W/X-": "A/2,-4/-5,1/3,0/0,3/-1,-4/4,1/3,0/-1,-4/-2,1/A",
    "W/X+": "A/2,-1/1,-2/0,3/-3,3/5,-1/-2,1/-1,2/-2,1/A",
    "X/Adj-": "A/-4,5/-2,1/2,-1/-3,0/6,0/0,3/-2,1/-1,2/-2,1/A",
    "X/Adj+": "A/2,-1/1,-2/2,-1/0,3/0,-3/-2,1/-1,2/-2,1/A",
    "X/Opp-": "a/6,0/-3,-3/-5,1/-1,2/-2,-2/-1,2/-2,-2/A",
    "X/Opp+": "a/3,-3/-5,1/-1,2/-2,-2/-1,2/-2,-2/A",
    "X/pJ-": "A/-4,5/-5,1/-3,0/0,3/0,3/-1,-4/-2,1/-1,2/-2,1/A",
    "X/pJ+": "A/3,-3/2,-1/-2,1/-3,0/5,-1/-2,1/-1,2/-2,1/A",
    "X/pN-": "a/1,1/-1,-4/-3,-3/-3,0/1,1/-1,2/-2,-2/A",
    "X/pN+": "A/-4,2/-5,1/3,0/-1,-1/-2,1/-3,-3/A",
    "X/Ba-": "A/-3,6/-1,-1/-3,3/1,-2/0,3/-1,2/-5,1/A",
    "X/Ba+": "A/0,-3/3,0/2,-1/0,3/-2,1/-3,3/5,-1/-2,1/A",
    "X/Bm-": "a/-3,6/-2,-2/-3,3/2,-1/0,3/-2,1/-4,2/a",
    "X/Bm+": "a/-3,6/-2,-2/-3,3/2,-1/0,3/4,1/-4,2/-2,-2/A",
    "X/Cl-": "A/0,-3/3,0/2,-1/4,1/6,0/-4,-1/-2,1/-1,2/-2,1/A",
    "X/Cl+": "A/0,-3/3,0/2,-1/-2,1/2,-1/-2,1/-1,2/-2,1/A",
    "X/Cr-": "a/6,-3/-2,-2/-4,-1/6,0/1,4/-1,2/-2,1/-1,2/-2,1/A",
    "X/Cr+": "a/-3,6/-2,-2/-1,2/1,-2/-1,2/-2,1/-1,2/-2,1/A",
    "X/Da-": "A/5,-4/1,-2/0,3/-1,2/-2,1/-1,-1/-2,1/A",
    "X/Da+": "A/2,5/6,0/1,4/0,3/-1,2/-2,1/-1,-1/-2,1/A",
    "X/Dm-": "a/4,-5/2,-1/0,3/-2,1/-1,2/-2,-2/-1,2/a",
    "X/Dm+": "A/6,3/3,0/2,-1/-2,1/2,-1/4,-2/5,-1/-2,1/A",
    "X/Ka-": "A/-3,6/-3,0/2,-1/1,4/-1,2/4,1/-3,-3/A",
    "X/Ka+": "A/-1,2/1,-2/-1,2/4,-2/-3,0/0,3/5,-1/-2,1/A",
    "X/Km-": "a/6,3/3,0/1,-2/-1,-4/-2,1/-1,2/-3,-3/a",
    "X/Km+": "a/3,6/-5,1/-1,-4/1,-2/-1,2/-2,-2/-1,-1/-2,1/A",
    "X/M-": "a/-3,-3/4,1/0,-3/-1,-1/-3,-3/-2,1/-3,0/-1,2/-2,1/A",
    "X/M+": "A/2,5/-3,3/-2,1/-4,-1/-3,-3/-2,1/0,-3/3,0/A",
    "X/Or-": "A/3,3/-1,-4/-3,-3/-2,1/-1,-1/6,0/-2,-2/A",
    "X/Or+": "A/-3,-3/-1,2/-3,-3/4,1/-4,2/-5,1/A",
    "X/Ol-": "A/5,5/-3,0/-3,-3/4,1/-3,-3/-1,2/-2,-2/A",
    "X/Ol+": "A/-4,2/-5,1/-1,-4/-3,-3/-2,1/-3,-3/A",
    "X/Pl-": "a/1,4/2,-1/1,-2/2,-1/1,4/A",
    "X/Pl+": "a/-5,-2/-1,2/1,-2/-1,2/1,-2/6,0/A",
    "X/Pr-": "A/-4,-1/-2,1/2,-1/-2,1/-4,-1/a",
    "X/Pr+": "A/-4,-1/4,1/6,0/-4,-1/-2,1/-4,-1/a",
    "X/Q-": "a/-2,-2/-4,-1/-3,-3/-5,1/-3,-3/-1,2/-2,-2/A",
    "X/Q+": "a/-2,4/-4,2/-2,1/-1,2/1,1/-3,3/-1,-1/-2,1/A",
    "X/Sa-": "A/-3,0/0,3/-1,2/1,4/-1,2/4,1/-3,-3/A",
    "X/Sa+": "A/-1,2/4,-2/0,3/-3,0/5,-1/-2,1/2,-1/-2,1/A",
    "X/Sm-": "a/0,3/0,-3/-2,1/-1,-4/-2,1/-1,2/-3,-3/a",
    "X/Sm+": "A/5,-4/4,1/3,0/-3,3/-1,-4/-3,0/1,1/-3,3/A",
    "X/W-": "A/5,-4/-2,1/-1,2/3,0/1,1/-1,-4/-2,1/-1,2/-2,1/A",
    "X/W+": "A/5,-4/1,-2/-1,2/-2,-2/3,0/-3,3/-1,2/-2,1/A",
    "X/X-": "A/6,-3/-1,-1/-2,1/2,2/-2,1/-1,-1/-2,1/A",
    "X/X+": "A/6,-3/-1,-1/4,1/6,0/-4,2/-2,1/-1,-1/-2,1/A"
};
    getLocalStorageData(true);

    lastRemoved = "";

    // Add event listener to all case buttons, so we can click them
    document.querySelectorAll(".case").forEach((caseEl) => {
        caseEl.addEventListener("click", () => {
            const isChecked = caseEl.classList.contains("checked");
            n = caseEl.id;
            if (isChecked) {
                deselectPBL(n);
            } else {
                selectPBL(n);
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
    if (scrambleOffset > 0 && !regen) {
        // user probably timed one of the prev scrams
        displayPrevScram();
        currentScrambleEl.textContent = scrambleList.at(-1 - scrambleOffset)[
            usingKarn
        ];
        return;
    } else if (scrambleOffset <= 0) scrambleOffset = 0;
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
    pblChoice = remainingPBL.splice(caseNum, 1)[0];

    pblChoice += "-+"[randInt(0, 1)];

    previousCase = currentCase; // e.g. "Al/Ar+"
    currentCase = pblChoice;

    scramble = generators[pblChoice];
    // Add random begin and end layer moves
    let s = scramble[0];
    let e = scramble[scramble.length - 1];
    let start;
    let end;
    if (s === "A") {
        start = [randrange(-5, 5, 3), randrange(-3, 7, 3)];
    } else {
        start = [randrange(-3, 7, 3), randrange(-4, 6, 3)];
    }
    if (e === "A") {
        end = [randrange(-4, 6, 3), randrange(-3, 7, 3)];
    } else {
        end = [randrange(-3, 7, 3), randrange(-5, 5, 3)];
    }

    let final = [
        (start.join(",") + scramble.slice(1, -1) + end.join(",")).replaceAll(
            "/",
            " / "
        ),
        start.join("") + karnify(scramble).slice(1, -1) + end.join(""),
        currentCase,
    ];

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
    if (!hasActiveScramble) timerEl.textContent = "0.00"; // prob for first scram (who is prob)
    hasActiveScramble = true;
    if (eachCaseAlert)
        setTimeout(function() {alert("You have gone through each case!");}, 50);
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

// setSelection = True => will select and show the cases
//              = False => will only show the cases
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
    if (setSelection) {
        for (let [pbl, inlist] of Object.entries(list)) {
            if (inlist) {
                showPBL(pbl);
                selectPBL(pbl);
            } else {
                hidePBL(pbl);
                deselectPBL(pbl);
            }
        }

        saveSelectedPBL();
        selCountEl.textContent = "Selected list: " + listName;
        console.log("HEHHEHHE");
    } else {
        for (let [pbl, inlist] of Object.entries(list)) {
            if (inlist) {
                showPBL(pbl);
            } else {
                hidePBL(pbl);
            }
        }
        selCountEl.textContent = "Viewing list: " + listName;
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
    // scramble: [not karn, karn]
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
    displayCube.applySequence(new Sequence(scramble[0]));
    displayCube.draw(cubeCenter, cubeScale);

    displayScramEl.textContent = scramble[usingKarn];
    displayPBLname.textContent = displayCube.pblCase();
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

function closePopup() {
    isPopupOpen = false;
    scramblePopupEl.classList.remove("open");
    listPopupEl.classList.remove("open");
    helpPopupEl.classList.remove("open");
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
    return PLLextndlen[pbl[0]] * PLLextndlen[pbl[1]]
}

function enableGoEachCase() {
    remainingPBL = selectedPBL.flatMap((el) =>
        Array(eachCase * (usingWeight ? getWeight(el) : 1)).fill(el)
    );
}

init();

filterInputEl.addEventListener("input", () => {
    filterInputEl.value = filterInputEl.value.replace(/[^a-zA-Z0-9/\- ]+/g, "");
    setHighlightedList(null);
    if (filterInputEl.value.slice(0,4).toLowerCase() === "freq") {
        if (!["1", "2", "4", "8", "16", "32", "64", "128", "256"].includes(filterInputEl.value.slice(4).trim())) {
            // no pbl is the given frequency
            for (pbl of possiblePBL) {
                const n = pblname(pbl);
                hidePBL(n);
            }
        }
        else {
            let freq = parseInt(filterInputEl.value.slice(4).trim(), 10);
            for (pbl of possiblePBL) {
                const n = pblname(pbl);
                if (getWeight(n) * getCaseCount(pbl) === freq) {
                    showPBL(n);
                } else {
                    hidePBL(n);
                }
            }
        }
    }
    else {
        for (pbl of possiblePBL) {
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
    for (i of pblListEl.children) {
        if (!i.classList.contains("hidden")) {
            selectPBL(i.id);
        }
    }
    saveSelectedPBL();
}

selectTheseEl.addEventListener("click", selectThese);

function deselectThese() {
    if (usingTimer()) return;
    for (i of pblListEl.children) {
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
    for (pbl of possiblePBL) {
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

openHelpEl.addEventListener("click", () => {
    if (usingTimer()) return;
    openHelpPopup();
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
    }
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
        let newList = {};
        for (pbl of possiblePBL) {
            const n = pblname(pbl);
            if (selectedPBL.includes(n)) {
                newList[n] = 1;
            } else {
                newList[n] = 0;
            }
            userLists[highlightedList] = newList;
        }
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
        alert("You cannot overwrite a default list");
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
    if (!inInput) {
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
                el = eachCaseEls[1];
                el.checked = !el.checked;
                onCheckEachCase(el);
                return;
            case "k":
                el = karnEls[1];
                el.checked = !el.checked;
                onCheckKarn();
                return;
            case "r":
                el = weightEls[1];
                el.checked = !el.checked;
                onCheckWeights();
                return;
        }
    }

    // space (start timer)
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

currentScrambleEl.addEventListener("click", () => {
    if (usingTimer()) return;
    if (isPopupOpen || !hasActiveScramble) return;
    openScramblePopup(scrambleList.at(-1 - scrambleOffset));
});

previousScrambleEl.addEventListener("click", () => {
    if (usingTimer()) return;
    if (isPopupOpen || scrambleList.at(-2 - scrambleOffset) === undefined)
        return;
    openScramblePopup(scrambleList.at(-2 - scrambleOffset));
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
}

function onCheckKarn() {
    usingKarn ^= 1; // switches between 0 and 1 with XOR
    if (hasActiveScramble)
        currentScrambleEl.textContent = scrambleList.at(-1 - scrambleOffset)[
            usingKarn
        ];
    displayPrevScram();
}

function onCheckWeights() {
    usingWeight = !usingWeight;
    enableGoEachCase();
}

eachCaseEls.forEach((el) =>
    el.addEventListener("change", (e) => {
        onCheckEachCase(el);
    })
);

karnEls.forEach((btn) =>
    btn.addEventListener("change", (e) => {
        onCheckKarn();
    })
);

weightEls.forEach((btn) =>
    btn.addEventListener("change", (e) => {
        onCheckWeights();
    })
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
