//// Optimizer NEEDS replaceWithDict to work, resides in cube.js
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