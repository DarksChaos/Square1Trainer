// Karnify NEEDS replaceWithDict to work, resides in cube.js

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