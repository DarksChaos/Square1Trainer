// =============================================================================
// UNKARNIFY — convert Karnotation → numeric WCA slash format
// (ported from karn.js)
// =============================================================================

const karnToWCA = {
    " U4 ":  " / U U' U U' / ",   " U4' ": " / U' U U' U / ",
    " D4 ":  " / D D' D D' / ",   " D4' ": " / D' D D' D / ",
    " u4 ":  " / u u' u u' / ",   " u4' ": " / u' u u' u / ",
    " d4 ":  " / d d' d d' / ",   " d4' ": " / d' d d' d / ",
    " U3 ":  " / U U' U / ",      " U3' ": " / U' U U' / ",
    " D3 ":  " / D D' D / ",      " D3' ": " / D' D D' / ",
    " u3 ":  " / u u' u / ",      " u3' ": " / u' u u' / ",
    " d3 ":  " / d d' d / ",      " d3' ": " / d' d d' / ",
    " F3 ":  " / F F' F / ",      " F3' ": " / F' F F' / ",
    " f3 ":  " / f f' f / ",      " f3' ": " / f' f f' / ",
    " W ":   " / U U' / ",        " W' ":  " / U' U / ",
    " B ":   " / D D' / ",        " B' ":  " / D' D / ",
    " w ":   " / u u' / ",        " w' ":  " / u' u / ",
    " b ":   " / d d' / ",        " b' ":  " / d' d / ",
    " F2 ":  " / F F' / ",        " F2' ": " / F' F / ",
    " f2 ":  " / f f' / ",        " f2' ": " / f' f / ",
    " UU ":  " / U U / ",         " UU' ": " / U' U' / ",
    " DD ":  " / D D / ",         " DD' ": " / D' D' / ",
    " T2 ":  " / T T' / ",        " T2' ": " / T' T / ",
    " t2 ":  " / t t' / ",        " t2' ": " / t' t / ",
    " U2 ":  " /6,0/ ",           " U2' ": " /6,0/ ",
    " D2 ":  " /0,6/ ",
    " U2D ": " /6,3/ ",           " U2D' ":  " /6,-3/ ",
    " U2D2 ":" /6,6/ ",
    " UD2 ": " /3,6/ ",           " U'D2 ":  " /-3,6/ ",
    " U ":   " /3,0/ ",           " U' ":  " /-3,0/ ",
    " D ":   " /0,3/ ",           " D' ":  " /0,-3/ ",
    " E ":   " /3,-3/ ",          " E' ":  " /-3,3/ ",
    " e ":   " /3,3/ ",           " e' ":  " /-3,-3/ ",
    " u ":   " /2,-1/ ",          " u' ":  " /-2,1/ ",
    " d ":   " /-1,2/ ",          " d' ":  " /1,-2/ ",
    " F ":   " /4,1/ ",           " F' ":  " /-4,-1/ ",
    " f ":   " /1,4/ ",           " f' ":  " /-1,-4/ ",
    " T ":   " /2,-4/ ",          " T' ":  " /-2,4/ ",
    " t ":   " /4,-2/ ",          " t' ":  " /-4,2/ ",
    " m ":   " /2,2/ ",           " m' ":  " /-2,-2/ ",
    " M ":   " /1,1/ ",           " M' ":  " /-1,-1/ ",
    " u2 ":  " /5,-1/ ",          " u2' ": " /-5,1/ ",
    " d2 ":  " /-1,5/ ",          " d2' ": " /1,-5/ ",
    " K ":   " /5,2/ ",           " K' ":  " /-5,-2/ ",
    " k ":   " /2,5/ ",           " k' ":  " /-2,-5/ ",
    " U2'D ":  " /6,3/ ",         " U2'D' ": " /6,-3/ ",
    " ɇ ":   " / U D / ",         " ɇ' ":  " / U' D' / ",
    " Ɇ ":   " / U D' / ",        " Ɇ' ":  " / U' D / ",
    // jlminx
    " E2 ": " / E E' / ",         " E2' ": " / E' E / ",
    " A ": " /1,0/ ",             " A' ": " /-1,0/ ",
    " G ": " /5,-4/ ",            " G' ": " /-5,4/ ",
    " g ": " /4,-5/ ",            " g' ": " /-4,5/ ",
};

const shorthandToKarn = {
    "bjj":      "/U' e D'/",        "fjj":      "/U e' D/",
    "e2bjj":    "/U' e' U'/",       "e2fjj":    "/U e U/",
    "nn":       "/E E'/",
    "jn":       "/D4'/",            "nj":       "/U4/",
    "jj":       "/U e' D/",         "bjj+e2":   "/U' e' U'/",
    "-nn":      "/E' E/",
    "-jn":      "/D4/",             "-nj":      "/D4'/",
    "bpj10":    "/d m' U/",         "bpj0-1":   "/u' m D'/",
    "fpj10":    "/u m' D/",         "fpj0-1":   "/d' m U'/",
    "aa10":     "/u m' u T'/",      "aa0-1":    "/U m' U t'/",
    "fadj10":   "/D M' d'/",        "dadj10":   "/D M' d'/",
    "fadj0-1":  "/U' M u/",         "u'adj0-1": "/U' M u/",
    "badj10":   "/U M' u'/",        "uadj10":   "/U M' u'/",
    "badj0-1":  "/D' M d/",         "d'adj0-1": "/D' M d/",
    "bb10":     "/T u' e U'/",      "bb0-1":    "/t d e' D/",
    "fdd10":    "/D e' d t/",       "fdd0-1":   "/U' e u' T/",
    "bdd10":    "/U e' u T'/",      "bdd0-1":   "/D' e d' t'/",
    "ff10":     "/d m' d M E/",     "ff0-1":    "/u' m U' M T/",
    "fv10":     "/d4/",             "fv0-1":    "/d4'/",
    "vf10":     "/u4/",             "vf0-1":    "/u4'/",
    "y2fv10":   "/u d' u -5,4/",
    "jf10":     "/w D' u T'/",      "jf0-1":    "/w' D u' T/",
    "fj10":     "/b U' d t/",       "fj0-1":    "/b' U d' t'/",
    "jr00":     "/e' w e/",         "jr10":     "/e' b e/",
    "jr0-1":    "/e' w' e/",        "jr1-1":    "/e' b' e/",
    "rj00":     "/e b' e'/",        "rj10":     "/e w e'/",
    "rj0-1":    "/e b' e'/",        "rj1-1":    "/e w e'/",
    "jv10":     "/b D d d2'/",      "jv0-1":    "/b' D' d' d2/",
    "vj10":     "/w U u u2'/",      "vj0-1":    "/w' U' u' u2/",
    "kk10":     "/u m' U E'/",      "kk0-1":    "/U m' u E'/",
    "opp10":    "/u2 u2'/",         "opp0-1":   "/u2' u2/",
    "pn10":     "/T T'/",           "pn0-1":    "/t t'/",
    "px10":     "/f' d3' f'/",      "px0-1":    "/f d3 f/",
    "xp10":     "/F' u3' F'/",      "xp0-1":    "/F u3 F/",
    "tt10":     "/d m' F' u2'/",
    "fss10":    "/u M D' E'/",      "fss0-1":   "/D' M u E'/",
    "bss10":    "/D M' u' E/",      "bss0-1":   "/U' M d E/",
    "vv10":     "/u M u m' E'/",
    "zz10":     "/u M t' M D'/",    "zz0-1":    "/D' M t' M u/",
    "30adj10":  "/U M' u'/",        "-30adj0-1":"/U' M u/",
    "03adj10":  "/D M' d'/",
    "obopp00":  "1,0/M' F M' F M'/0,1",
    "oaopp1-1": "0,1/M' u' M' u' M'/0,1",
    "but00":    "",   "also00":  "",   "done!00": "0,0",
};

const tempReplacements = {};

function addCommas(scramble) {
    return scramble.split(' ').map(move => {
        if (!move || isNaN(Number(move.replaceAll('-', '')))) return move;
        switch (move.length) {
            case 1: return move + ',0';
            case 2: return move.charAt(0) === '-' ? move + ',0' : move[0] + ',' + move[1];
            case 3: return move.charAt(0) === '-' ? move.slice(0, 2) + ',' + move[2] : move[0] + ',' + move.slice(1);
            case 4: return move.slice(0, 2) + ',' + move.slice(2);
            default: throw new Error(`"${move}" is not a valid karn numeric move`);
        }
    }).join(' ');
}

function isKarn(str) {
    return /[a-zA-Z]/.test(str.replace(/[0-9\s\/\\,\-()]/g, ''));
}

function getAlignment(topA, bottomA) {
    return (topA ? '1' : '0') + (bottomA ? '-1' : '0');
}

function unkarnifyHelp(scramble) {
    scramble = scramble.replaceAll('/', ' / ');
    return replaceWithDict(' ' + scramble + ' ', karnToWCA)
        .trim()
        .replaceAll(/ ?\/( \/?)*/g, '/')
        .replaceAll(/\s+/g, '/');
}

function replaceShorthands(scramble) {
    const moves = scramble.split('/');
    const allKnown = moves.every(m =>
        !m || !isNaN(Number(m.charAt(0))) || (' ' + m + ' ' in karnToWCA)
    );
    if (allKnown) return unkarnifyHelp(scramble);

    const alignmentIndependent = new Set([
        'bjj', 'fjj', 'nn', 'jn', 'nj', 'e2bjj', 'e2fjj',
        'jj', 'bjj+e2', '-nn', '-jn', '-nj',
    ]);
    let topA = false, bottomA = false;

    for (const move of moves) {
        if (!move) continue;
        if (move.includes(',')) {
            const [u, d] = move.split(',');
            if (parseInt(u, 10) % 3 !== 0) topA    = !topA;
            if (parseInt(d, 10) % 3 !== 0) bottomA = !bottomA;
        } else {
            const key = alignmentIndependent.has(move.toLowerCase())
                ? move.toLowerCase()
                : move.toLowerCase() + getAlignment(topA, bottomA);
            if (!(key in shorthandToKarn)) return scramble;
            const replacement = shorthandToKarn[key];
            if (replacement === undefined)
                throw new Error(`"${move}" with alignment ${getAlignment(topA, bottomA)} is not defined.`);
            scramble = scramble.replace(move, replacement);
            for (const sub of unkarnifyHelp(replacement).split('/')) {
                if (!sub) continue;
                const [u, d] = sub.split(',');
                if (parseInt(u, 10) % 3 !== 0) topA    = !topA;
                if (parseInt(d, 10) % 3 !== 0) bottomA = !bottomA;
            }
        }
    }
    scramble = scramble
        .replaceAll(/ *\/ */g, '/')
        .replaceAll(/\/\//g, '/')
        .replaceAll(/\//g, ' ');
    return unkarnifyHelp(scramble);
}

function unkarnify(scramble) {
    // ── 0. One-off overrides ──────────────────────────────────────────────────
    if (scramble in tempReplacements) scramble = tempReplacements[scramble];

    // ── 1. Easter egg passthrough ─────────────────────────────────────────────
    if (scramble.includes('meow')) return scramble;

    // ── 2. Pseudo-scramble ("p …/p'") wrapper ────────────────────────────────
    let isPScramble = /^p[ /\\|]/.test(scramble);
    if (isPScramble) scramble = scramble.slice(2, -3);

    // ── 3. Legacy single-character substitutions (mainwindow.cpp) ─────────────
    // These were used in an older compact notation:
    //   & → -1,  ^ → -2,  9 → -3,  8 → -4,  7 → -5
    scramble = scramble
        .replaceAll('&', '-1')
        .replaceAll('^', '-2')
        .replaceAll('9', '-3')
        .replaceAll('8', '-4')
        .replaceAll('7', '-5');

    // ── 4. Detect leading / trailing slice presence before stripping ──────────
    const firstToken = scramble.match(/^[^\/\\ ]*/)?.[0] ?? '';
    const firstSlice = scramble.startsWith('/') || scramble.startsWith('\\') ||
                       scramble.startsWith('|') || (' ' + firstToken + ' ' in karnToWCA);
    const lastToken  = scramble.match(/[^\/\\ ]*$/)?.[0] ?? '';
    const lastSlice  = ' ' + lastToken + ' ' in karnToWCA;

    // ── 5. Expand (move)N repetition groups ──────────────────────────────────
    // e.g. "(U U')3" → "U U' U U' U U'"
    for (const group of scramble.matchAll(/(\(.*?\))(\d+)/g)) {
        const inner   = group[1].replaceAll(/[()]/g, '');
        const count   = parseInt(group[2], 10);
        scramble = scramble.replace(group[0], Array(count).fill(inner).join(' '));
    }

    // ── 6. Normalise separators ───────────────────────────────────────────────
    scramble = scramble
        .replaceAll(/[\/\\]/g, ' ')
        .replaceAll(/[()]/g, '')
        .replaceAll(/ +/g, ' ');

    // ── 7. Expand compact numeric tokens (e.g. "2-1" → "2,-1") ──────────────
    scramble = addCommas(scramble);

    // ── 8. Replace shorthands then full dict-replace ──────────────────────────
    let final = replaceShorthands(unkarnifyHelp(scramble));

    // ── 9. Re-attach leading / trailing slices ────────────────────────────────
    if (firstSlice)  final = '/' + final;
    if (lastSlice)   final = final + '/';
    if (isPScramble) final = 'p/' + final + "/p'";
    final = final.replaceAll(/\/+/, '/');

    return final;
}

// =============================================================================
// KARNIFY — convert numeric WCA slash format → Karnotation
// =============================================================================

function replaceWithDict(str, dict) {
    // keys are already sorted longest → shortest
    const pattern = new RegExp(Object.keys(dict).join("|"), "g");
    while (str.replace(pattern, (match) => dict[match]) !== str)
        str = str.replace(pattern, (match) => dict[match]);
    return str;
}

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
