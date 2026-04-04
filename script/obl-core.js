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