// =============================================================================
// Unified Squan toolkit
// =============================================================================

export default class SquanLib {

    // =========================================================================
    // SECTION 1: DATA TABLES
    // =========================================================================

    // -------------------------------------------------------------------------
    // karnToWCA
    // Keys are padded with spaces on both sides so a simple global replace on a
    // space-delimited string cannot match partial tokens.
    // -------------------------------------------------------------------------
    static karnToWCA = {
        "U4": "U U' U U'", "U4'": "U' U U' U",
        "D4": "D D' D D'", "D4'": "D' D D' D",
        "u4": "u u' u u'", "u4'": "u' u u' u",
        "d4": "d d' d d'", "d4'": "d' d d' d",

        "U3": "U U' U", "U3'": "U' U U'",
        "D3": "D D' D", "D3'": "D' D D'",
        "u3": "u u' u", "u3'": "u' u u'",
        "d3": "d d' d", "d3'": "d' d d'",
        "F3": "F F' F", "F3'": "F' F F'",
        "f3": "f f' f", "f3'": "f' f f'",

        "W": "U U'", "W'": "U' U",
        "B": "D D'", "B'": "D' D",
        "w": "u u'", "w'": "u' u",
        "b": "d d'", "b'": "d' d",
        "F2": "F F'", "F2'": "F' F",
        "f2": "f f'", "f2'": "f' f",
        "UU": "U U", "UU'": "U' U'",
        "DD": "D D", "DD'": "D' D'",
        "T2": "T T'", "T2'": "T' T",
        "t2": "t t'", "t2'": "t' t",
        "E2": "E E'", "E2'": "E' E",
        "ɇ": "U D", "ɇ'": "U' D'",
        "Ɇ": "U D'", "Ɇ'": "U' D",

        "U2": "6,0", "U2'": "6,0",
        "D2": "0,6",
        "U2D": "6,3", "U2D'": "6,-3",
        "U2'D": "6,3", "U2'D'": "6,-3",
        "U2D2": "6,6",
        "UD2": "3,6", "U'D2": "-3,6",

        "U": "3,0", "U'": "-3,0",
        "D": "0,3", "D'": "0,-3",
        "E": "3,-3", "E'": "-3,3",
        "e": "3,3", "e'": "-3,-3",
        "u": "2,-1", "u'": "-2,1",
        "d": "-1,2", "d'": "1,-2",
        "F": "4,1", "F'": "-4,-1",
        "f": "1,4", "f'": "-1,-4",
        "T": "2,-4", "T'": "-2,4",
        "t": "4,-2", "t'": "-4,2",
        "m": "2,2", "m'": "-2,-2",
        "M": "1,1", "M'": "-1,-1",
        "u2": "5,-1", "u2'": "-5,1",
        "d2": "-1,5", "d2'": "1,-5",
        "K": "5,2", "K'": "-5,-2",
        "k": "2,5", "k'": "-2,-5",
        "G": "5,-4", "G'": "-5,4",
        "g": "4,-5", "g'": "-4,5",
    };

    // -------------------------------------------------------------------------
    // shorthandToKarn
    // "move10" means top misalign, "move1-1" means double misalign, etc.
    // Some shorthands are alignment-independent (bjj, fjj, nn, …).
    // -------------------------------------------------------------------------
    static shorthandToKarn = {
        // ── alignment-independent ─────────────────────────────────────────────
        "bjj": "U' e D'", "fjj": "U e' D",
        "e2bjj": "U' e' U'", "e2fjj": "U e U",
        "nn": "E E'",
        "jn": "D4'", "nj": "U4",
        "jj": "U e' D", "bjj+e2": "U' e' U'",
        "-nn": "E' E",
        "-jn": "D4", "-nj": "D4'",
        // ── alignment-dependent ───────────────────────────────────────────────
        "bpj10": "d m' U", "bpj0-1": "u' m D'",
        "fpj10": "u m' D", "fpj0-1": "d' m U'",
        "aa10": "u m' u T'", "aa0-1": "U m' U t'",
        "fadj10": "D M' d'", "dadj10": "D M' d'",
        "fadj0-1": "U' M u", "u'adj0-1": "U' M u",
        "badj10": "U M' u'", "uadj10": "U M' u'",
        "badj0-1": "D' M d", "d'adj0-1": "D' M d",
        "bb10": "T u' e U'", "bb0-1": "t d e' D",
        "fdd10": "D e' d t", "fdd0-1": "U' e u' T",
        "bdd10": "U e' u T'", "bdd0-1": "D' e d' t'",
        "ff10": "d m' d M E", "ff0-1": "u' m U' M T",
        "fv10": "d4", "fv0-1": "d4'",
        "vf10": "u4", "vf0-1": "u4'",
        "y2fv10": "u d' u -5,4",
        "jf10": "w D' u T'", "jf0-1": "w' D u' T",
        "fj10": "b U' d t", "fj0-1": "b' U d' t'",
        "jr00": "e' w e", "jr10": "e' b e",
        "jr0-1": "e' w' e", "jr1-1": "e' b' e",
        "rj00": "e b' e'", "rj10": "e w e'",
        "rj0-1": "e b' e'", "rj1-1": "e w e'",
        "jv10": "b D d d2'", "jv0-1": "b' D' d' d2",
        "vj10": "w U u u2'", "vj0-1": "w' U' u' u2",
        "kk10": "u m' U E'", "kk0-1": "U m' u E'",
        "opp10": "u2 u2'", "opp0-1": "u2' u2",
        "pn10": "T T'", "pn0-1": "t t'",
        "px10": "f' d3' f'", "px0-1": "f d3 f",
        "xp10": "F' u3' F'", "xp0-1": "F u3 F",
        "tt10": "d m' F' u2'",
        "fss10": "u M D' E'", "fss0-1": "D' M u E'",
        "bss10": "D M' u' E", "bss0-1": "U' M d E",
        "vv10": "u M u m' E'",
        "zz10": "u M t' M D'", "zz0-1": "D' M t' M u",
        // random things
        "30adj10": "U M' u'", "-30adj0-1": "U' M u",
        "03adj10": "D M' d'",
        "obopp00": "1,0/M' F M' F M'/0,1",
        "oaopp1-1": "0,1/M' u' M' u' M'/0,1",
        "but00": "", "also00": "", "done!00": "0,0",
    };

    static alignmentIndependent = new Set([
        'bjj', 'fjj', 'nn', 'jn', 'nj', 'e2bjj', 'e2fjj',
        'jj', 'bjj+e2', '-nn', '-jn', '-nj',
    ]);

    // -------------------------------------------------------------------------
    // wcaToBaseKarn: maps single WCA move → base karn.
    // -------------------------------------------------------------------------
    static wcaToBaseKarn = {
        // ── compound numeric → single karn ────────────────────────────────────
        "6,0": "U2",
        "6,3": "U2D", "6,-3": "U2D'", "6,6": "U2D2",
        "0,6": "D2",
        "3,6": "UD2", "-3,6": "U'D2",
        // ── single numeric → single karn ──────────────────────────────────────
        "3,0": "U", "-3,0": "U'",
        "0,3": "D", "0,-3": "D'",
        "3,-3": "E", "-3,3": "E'",
        "3,3": "e", "-3,-3": "e'",
        "2,-1": "u", "-2,1": "u'",
        "-1,2": "d", "1,-2": "d'",
        "4,1": "F", "-4,-1": "F'",
        "1,4": "f", "-1,-4": "f'",
        "2,-4": "T", "-2,4": "T'",
        "4,-2": "t", "-4,2": "t'",
        "2,2": "m", "-2,-2": "m'",
        "1,1": "M", "-1,-1": "M'",
        "5,-1": "u2", "-5,1": "u2'",
        "-1,5": "d2", "1,-5": "d2'",
    };

    // -------------------------------------------------------------------------
    // baseKarnToHighKarn: longest first, base karn → high karn
    // -------------------------------------------------------------------------
    static baseKarnToHighKarn = {
        "U' U U' U": "U4'", "U U' U U'": "U4",
        "D' D D' D": "D4'", "D D' D D'": "D4",
        "u' u u' u": "u4'", "u u' u u'": "u4",
        "d' d d' d": "d4'", "d d' d d'": "d4",

        "U' U U'": "U3'", "U U' U": "U3",
        "D' D D'": "D3'", "D D' D": "D3",
        "u' u u'": "u3'", "u u' u": "u3",
        "d' d d'": "d3'", "d d' d": "d3",
        "F' F F'": "F3'", "F F' F": "F3",
        "f' f f'": "f3'", "f f' f": "f3",

        "U' U": "W'", "U U'": "W",
        "D' D": "B'", "D D'": "B",
        "u' u": "w'", "u u'": "w",
        "d' d": "b'", "d d'": "b",
        "F' F": "F2'", "F F'": "F2",
        "f' f": "f2'", "f f'": "f2",
        "U' U'": "UU'", "U U": "UU",
        "D' D'": "DD'", "D D": "DD",
    };

    /**
     * A_MOVES: legal moves available for top misalign
     * a_MOVES: legal moves available for bottom misalign
     */
    static A_MOVES = [
        [3, 0], [-3, 0], [0, 3], [0, -3], [3, 3],
        [2, -1], [-1, 2], [-4, -1], [-1, -4], [2, -4], [2, 2], [-1, -1], [5, -1],
    ];
    static a_MOVES = [
        [3, 0], [-3, 0], [0, 3], [0, -3], [3, 3],
        [-2, 1], [1, -2], [4, 1], [1, 4], [-2, 4], [-2, -2], [1, 1], [-5, 1],
    ];

    /**
     * OPTIM: table for optimizable moves
     */
    static OPTIM = {
        // special case
        "/0,0/": "",
        "/3,3/3,3/": "-3,-3/-3,-3",
        "/-3,-3/-3,-3/": "3,3/3,3",
        "/2,2/-2,-2/": "2,2/-2,-2",
        "/-2,-2/2,2/": "-2,-2/2,2",
        "/1,1/-1,-1/": "1,1/-1,-1",
        "/-1,-1/1,1/": "-1,-1/1,1",
        "/2,-4/-2,4/2,-4/": "2,-4/-2,4/2,-4",
        "/-2,4/2,-4/-2,4/": "-2,4/2,-4/-2,4",
        "/5,-1/-5,1/5,-1/": "5,-1/-5,1/5,-1",
        "/-5,1/5,-1/-5,1/": "-5,1/5,-1/-5,1",
    };

    /**
     * CLOSEST_MAP: maps a -5~6 turn to the its closest 3n move
     */
    static CLOSEST_MAP = new Map([
        [-5, -6], [-4, -3], [-3, -3], [-2, -3], [-1, 0], [0, 0],
        [1, 0], [2, 3], [3, 3], [4, 3], [5, 6], [6, 6],
    ]);

    /**
     * MOVE_VALUES: lookup table for the ergonomic rating of each individual move.
     *   A = 10, a = 0-1
     *   / = upslice, \ = downslice
     */
    static MOVE_VALUES = new Map([
        // aligned top, upslice
        ['A/0,3', 16], ['A/0,6', 1], ['A/0,-3', 18],
        ['A/3,0', 16], ['A/3,3', 12], ['A/3,6', 0], ['A/3,-3', 13],
        ['A/6,0', 12], ['A/6,3', 11], ['A/6,6', 2], ['A/6,-3', 12],
        ['A/-3,0', 9], ['A/-3,3', 13], ['A/-3,6', 4], ['A/-3,-3', 12],
        // aligned top, downslice
        ['A\\0,3', 17], ['A\\0,6', 1], ['A\\0,-3', 8],
        ['A\\3,0', 6], ['A\\3,3', 14], ['A\\3,6', 1], ['A\\3,-3', 12],
        ['A\\6,0', 14], ['A\\6,3', 11], ['A\\6,6', 5], ['A\\6,-3', 8],
        ['A\\-3,0', 11], ['A\\-3,3', 14], ['A\\-3,6', 6], ['A\\-3,-3', 9],
        // unaligned top, upslice
        ['a/0,3', 5], ['a/0,6', 5], ['a/0,-3', 12],
        ['a/3,0', 17], ['a/3,3', 10], ['a/3,6', 5], ['a/3,-3', 7],
        ['a/6,0', 4], ['a/6,3', 2], ['a/6,6', 0], ['a/6,-3', 3],
        ['a/-3,0', 18], ['a/-3,3', 12], ['a/-3,6', 7], ['a/-3,-3', 11],
        // unaligned top, downslice
        ['a\\0,3', 5], ['a\\0,6', 5], ['a\\0,-3', 5],
        ['a\\3,0', 16], ['a\\3,3', 11], ['a\\3,6', 4], ['a\\3,-3', 6],
        ['a\\6,0', 4], ['a\\6,3', 2], ['a\\6,6', 0], ['a\\6,-3', 1],
        ['a\\-3,0', 15], ['a\\-3,3', 10], ['a\\-3,6', 2], ['a\\-3,-3', 5],
        // fractional (non-multiple-of-3) moves: alignment prefix omitted
        ['/1,-2', 4], ['\\1,-2', 17], ['/-1,2', 15], ['\\-1,2', 14],
        ['/1,-5', 3], ['\\1,-5', 1], ['/-1,5', 8], ['\\-1,5', 3],
        ['/1,4', 7], ['\\1,4', 14], ['/-1,-4', 12], ['\\-1,-4', 9],
        ['/1,1', 11], ['\\1,1', 20], ['/-1,-1', 20], ['\\-1,-1', 10],
        ['/2,-1', 20], ['\\2,-1', 12], ['/-2,1', 14], ['\\-2,1', 18],
        ['/2,2', 12], ['\\2,2', 13], ['/-2,-2', 14], ['\\-2,-2', 8],
        ['/2,5', 5], ['\\2,5', 3], ['/-2,-5', 4], ['\\-2,-5', 3],
        ['/2,-4', 14], ['\\2,-4', 6], ['/-2,4', 13], ['\\-2,4', 13],
        ['/4,4', 5], ['\\4,4', 12], ['/-4,-4', 12], ['\\-4,-4', 4],
        ['/4,1', 6], ['\\4,1', 13], ['/-4,-1', 16], ['\\-4,-1', 6],
        ['/4,-2', 12], ['\\4,-2', 9], ['/-4,2', 16], ['\\-4,2', 13],
        ['/4,-5', 2], ['\\4,-5', 5], ['/-4,5', 13], ['\\-4,5', 3],
        ['/5,5', 1], ['\\5,5', 4], ['/-5,-5', 2], ['\\-5,-5', 0],
        ['/5,2', 6], ['\\5,2', 10], ['/-5,-2', 12], ['\\-5,-2', 13],
        ['/5,-1', 11], ['\\5,-1', 7], ['/-5,1', 14], ['\\-5,1', 15],
        ['/5,-4', 2], ['\\5,-4', 2], ['/-5,4', 12], ['\\-5,4', 14],
    ]);

    /**
     * GOOD_FINISHES: moves that are acceptable as the last move
     */
    static GOOD_FINISHES = new Set([
        "1,1", "-1,-1", "2,2", "-2,-2", "2,-1", "-2,1", "1,-2", "-1,2",
        "3,0", "-3,0", "0,3", "0,-3", "3,3", "3,-3", "-3,-3", "-3,3",
        "4,1", "-4,-1", "1,4", "-1,-4", "2,-4", "-2,4", "4,-2", "-4,2",
        "5,-1", "-5,1", "-4,5", "-5,4", "6,3",
    ]);

    /**
     * OBLToEnglish: maps CSP-style hex into OBL names
     * (format is 24-character string, both corner first, STARTING FROM TOP RIGHT OF SLICE
     * meaning: 0-1 is the solved position. **the order is like CSP tracing.**)
     */
    static OBLToEnglish = {
        'BBbBBbBBbBBb': 'solved',
        'BBwWWwWWwWWw': '1c',
        'BBwBBwWWwWWw': 'cadj',
        'BBwWWwBBwWWw': 'copp',
        'BBwBBwBBwWWw': '3c',
        'BBwBBwBBwBBw': '4e',
        'WWbWWbWWbWWw': '3e',
        'WWbWWwWWbWWw': 'line',
        'WWbWWbWWwWWw': 'L',
        'WWbWWwWWwWWw': '1e',
        'WWbBBwWWwWWw': 'left pair', 'BBbWWwWWwWWw': 'right pair',
        'BBwWWwWWbWWw': 'left arrow', 'BBwWWbWWwWWw': 'right arrow',
        'WWbBBbWWwWWw': 'gem',
        'WWwWWbWWbBBw': 'left knight', 'BBbWWbWWwWWw': 'right knight',
        'WWwWWbWWwBBb': 'left axe', 'BBwWWbWWwWWb': 'right axe',
        'BBwWWbWWbWWw': 'squid',
        'WWwWWbBBbWWb': 'left thumb', 'WWbBBbWWwWWb': 'right thumb',
        'WWwBBbWWbWWb': 'left bunny', 'WWbWWbBBwWWb': 'right bunny',
        'BBbBBwWWwWWw': 'shell',
        'BBwWWwWWbBBw': 'left bird', 'BBwBBbWWwWWw': 'right bird',
        'BBwWWbWWwBBw': 'hazard',
        'BBbBBbWWwWWw': 'left kite', 'WWwWWbBBbBBw': 'right kite',
        'BBwBBwWWbWWb': 'left cut', 'BBwBBbWWbWWw': 'right cut',
        'BBbBBwWWbWWw': 'black T', 'WWwWWbBBwBBb': 'white T',
        'WWbBBwWWbBBw': 'left N', 'WWwBBbWWwBBb': 'right N',
        'WWbBBbWWwBBw': 'black tie', 'BBwWWwBBbWWb': 'white tie',
        'BBbWWwBBwWWw': 'left yoshi', 'WWwBBwWWbBBw': 'right yoshi'
    };

    static OBLToState = Object.fromEntries(
        Object.entries(this.OBLToEnglish).map(([key, value]) => [value, key])
    );

    /**
     * NAMING: matt's OBL naming
     */
    static NAMING = {
        "solved": "O", "1c": "D", "cadj": "J", "copp": "V", "3c": "M", "4e": "Q",
        "3e": "W", "line": "F", "L": "L", "1e": "E", "left pair": "Pw", "right pair": "Pc",
        "left arrow": "Aw", "right arrow": "Ac", "gem": "G", "left knight": "Hw",
        "right knight": "Hc", "left axe": "Xc", "right axe": "Xw", "squid": "S",
        "left thumb": "THw", "right thumb": "THc", "left bunny": "Uc", "right bunny": "Uw",
        "shell": "SH", "left bird": "Bc", "right bird": "Bw", "hazard": "Z",
        "left kite": "Kc", "right kite": "Kw", "left cut": "Cw", "right cut": "Cc",
        "black T": "Tu", "white T": "Td", "left N": "Nw", "right N": "Nc",
        "black tie": "Iu", "white tie": "Id", "left yoshi": "Yc", "right yoshi": "Yw"
    };

    /**
     * OBL_ANGLES: the starting angle, logged in PATTERNS
     */
    static OBL_ANGLES = {
        "solved": "-", "1c": "UR", "cadj": "R",
        "copp": "/", "3c": "DR", "4e": "-",
        "3e": "D", "line": "—", "L": "DR",
        "1e": "R", "left pair": "DR", "right pair": "UR",
        "left arrow": "UR", "right arrow": "UR",
        "gem": "DR", "left knight": "L", "right knight": "R",
        "left axe": "L", "right axe": "R", "squid": "UR",
        "left thumb": "DL", "right thumb": "DR",
        "left bunny": "DR", "right bunny": "DL",
        "shell": "R", "left bird": "R", "right bird": "U",
        "hazard": "U", "left kite": "R", "right kite": "L",
        "left cut": "R", "right cut": "R",
        "black T": "R", "white T": "R",
        "left N": "\\", "right N": "\\",
        "black tie": "DR", "white tie": "DR",
        "left yoshi": "UL", "right yoshi": "UR"
    };

    static nextAngle = {
        // Single character angles
        "-": "-", "/": "\\", "\\": "/", "—": "|", "|": "—",
        "U": "R", "R": "D", "D": "L", "L": "U",
        // Double character angles
        "UR": "DR", "DR": "DL", "DL": "UL", "UL": "UR"
    };

    static get HALF_L() { return 6; }
    static get LAYERL() { return 12; }
    static get THREE_FOUR_L() { return 18; }
    static get CUBEL() { return 24; }
    static get SOLVED_A() { return "bBBbBBbBBbBBwWWwWWwWWwWW"; }
    static get SOLVED_a() { return "BBbBBbBBbBBbWWwWWwWWwWWw"; }
    static get SLICE_a() { return "WWwWWwBBbBBbBBbBBbWWwWWw"; }
    static get SLICE_A() { return "wWWwWWbBBbBBbBBbBBwWWwWW"; }

    static A_MOVES = [
        [3, 0], [-3, 0], [0, 3], [0, -3], [3, 3],
        [2, -1], [-1, 2], [-4, -1], [-1, -4], [2, -4], [2, 2], [-1, -1], [5, -1]
    ];
    static a_MOVES = [
        [3, 0], [-3, 0], [0, 3], [0, -3], [3, 3],
        [-2, 1], [1, -2], [4, 1], [1, 4], [-2, 4], [-2, -2], [1, 1], [-5, 1]
    ];

    static KARNL = SquanLib.a_MOVES.length;

    /**
     * POSSIBLE_OBL: every OBL case as [specifier, U, D].
     */
    static POSSIBLE_OBL = [
        ['', 'solved', 'solved'],
        ['', '1c', '1c'], ['', 'cadj', 'cadj'], ['', 'cadj', 'copp'], ['', 'copp', 'copp'],
        ['', '3c', '3c'], ['', '4e', '4e'], ['', '3e', '3e'], ['', 'line', 'line'],
        ['', 'L', 'line'], ['', 'L', 'L'], ['', '1e', '1e'],
        ['good', 'pair', 'pair'], ['bad', 'pair', 'pair'],
        ['good', 'arrow', 'pair'], ['bad', 'arrow', 'pair'],
        ['good', 'arrow', 'arrow'], ['bad', 'arrow', 'arrow'],
        ['', 'gem', 'gem'], ['', 'gem', 'knight'], ['', 'gem', 'axe'], ['', 'gem', 'squid'],
        ['good', 'knight', 'knight'], ['bad', 'knight', 'knight'],
        ['good', 'knight', 'axe'], ['bad', 'knight', 'axe'],
        ['same', 'axe', 'axe'], ['diff', 'axe', 'axe'],
        ['', 'squid', 'knight'], ['', 'squid', 'axe'], ['', 'squid', 'squid'],
        ['good', 'thumb', 'thumb'], ['bad', 'thumb', 'thumb'],
        ['good', 'thumb', 'bunny'], ['bad', 'thumb', 'bunny'],
        ['good', 'bunny', 'bunny'], ['bad', 'bunny', 'bunny'],
        ['', 'shell', 'shell'], ['', 'shell', 'bird'], ['', 'shell', 'hazard'],
        ['', 'yoshi', 'shell'],
        ['good', 'bird', 'bird'], ['bad', 'bird', 'bird'],
        ['', 'bird', 'hazard'], ['', 'hazard', 'hazard'],
        ['good', 'yoshi', 'bird'], ['bad', 'yoshi', 'bird'],
        ['', 'yoshi', 'hazard'], ['same', 'yoshi', 'yoshi'], ['diff', 'yoshi', 'yoshi'],
        ['good', 'kite', 'kite'], ['bad', 'kite', 'kite'],
        ['good', 'kite', 'cut'], ['bad', 'kite', 'cut'],
        ['', 'kite', 'T'], ['good', 'kite', 'N'], ['bad', 'kite', 'N'], ['', 'kite', 'tie'],
        ['', 'cut', 'T'], ['good', 'cut', 'N'], ['bad', 'cut', 'N'], ['', 'cut', 'tie'],
        ['good', 'cut', 'cut'], ['bad', 'cut', 'cut'],
        ['good', 'T', 'T'], ['bad', 'T', 'T'], ['', 'T', 'N'],
        ['good', 'T', 'tie'], ['bad', 'T', 'tie'],
        ['good', 'N', 'N'], ['bad', 'N', 'N'], ['', 'tie', 'N'],
        ['good', 'tie', 'tie'], ['bad', 'tie', 'tie']
    ];

    /**
     * OBL_LEN: optimal slicecount of each OBL
     */
    static OBL_LEN = {
        "solved/solved": 0, "1c/1c": 5, "cadj/cadj": 4, "cadj/copp": 5, "copp/copp": 2,
        "3c/3c": 5, "4e/4e": 4, "3e/3e": 5, "line/line": 2, "L/line": 5, "L/L": 4, "1e/1e": 5,
        "good pair/pair": 2, "bad pair/pair": 4, "good arrow/pair": 3, "bad arrow/pair": 4,
        "good arrow/arrow": 3, "bad arrow/arrow": 4, "gem/gem": 4, "gem/knight": 4,
        "gem/axe": 3, "gem/squid": 4, "good knight/knight": 4, "bad knight/knight": 5,
        "good knight/axe": 3, "bad knight/axe": 4, "same axe/axe": 5, "diff axe/axe": 5,
        "squid/knight": 4, "squid/axe": 4, "squid/squid": 5, "good thumb/thumb": 2,
        "bad thumb/thumb": 5, "good thumb/bunny": 4, "bad thumb/bunny": 4,
        "good bunny/bunny": 3, "bad bunny/bunny": 5, "shell/shell": 4, "shell/bird": 4,
        "shell/hazard": 4, "yoshi/shell": 3, "good bird/bird": 4, "bad bird/bird": 5,
        "bird/hazard": 4, "hazard/hazard": 5, "good yoshi/bird": 3, "bad yoshi/bird": 4,
        "yoshi/hazard": 4, "same yoshi/yoshi": 5, "diff yoshi/yoshi": 5,
        "good kite/kite": 1, "bad kite/kite": 5, "good kite/cut": 3, "bad kite/cut": 6,
        "kite/T": 4, "good kite/N": 3, "bad kite/N": 4, "kite/tie": 4, "cut/T": 4,
        "good cut/N": 4, "bad cut/N": 5, "cut/tie": 4, "good cut/cut": 3, "bad cut/cut": 6,
        "good T/T": 3, "bad T/T": 4, "T/N": 5, "good T/tie": 3, "bad T/tie": 4,
        "good N/N": 2, "bad N/N": 4, "tie/N": 5, "good tie/tie": 3, "bad tie/tie": 4
    };

    /**
     * OBL_TRANSLATION: map nonspecific OBL to specific OBLs without layer flips
     */
    static OBL_TRANSLATION = {
        'solved/solved': ['solved/solved'],
        '1c/1c': ['1c/1c'],
        'cadj/cadj': ['cadj/cadj'],
        'cadj/copp': ['cadj/copp'],
        'copp/copp': ['copp/copp'],
        '3c/3c': ['3c/3c'],
        '4e/4e': ['4e/4e'],
        '3e/3e': ['3e/3e'],
        'line/line': ['line/line'],
        'L/line': ['L/line'],
        'L/L': ['L/L'],
        '1e/1e': ['1e/1e'],
        'good pair/pair': ['left pair/left pair', 'right pair/right pair'],
        'bad pair/pair': ['left pair/right pair'],
        'good arrow/pair': ['left arrow/right pair', 'right arrow/left pair'],
        'bad arrow/pair': ['left arrow/left pair', 'right arrow/right pair'],
        'good arrow/arrow': ['left arrow/left arrow', 'right arrow/right arrow'],
        'bad arrow/arrow': ['left arrow/right arrow'],
        'gem/gem': ['gem/gem'],
        'gem/knight': ['gem/left knight', 'gem/right knight'],
        'gem/axe': ['gem/left axe', 'gem/right axe'],
        'gem/squid': ['gem/squid'],
        'good knight/knight': ['left knight/right knight'],
        'bad knight/knight': ['left knight/left knight', 'right knight/right knight'],
        'good knight/axe': ['left knight/left axe', 'right knight/right axe'],
        'bad knight/axe': ['left knight/right axe', 'right knight/left axe'],
        'same axe/axe': ['left axe/left axe', 'right axe/right axe'],
        'diff axe/axe': ['left axe/right axe'],
        'squid/knight': ['squid/left knight', 'squid/right knight'],
        'squid/axe': ['squid/left axe', 'squid/right axe'],
        'squid/squid': ['squid/squid'],
        'good thumb/thumb': ['left thumb/left thumb', 'right thumb/right thumb'],
        'bad thumb/thumb': ['left thumb/right thumb'],
        'good thumb/bunny': ['left thumb/right bunny', 'right thumb/left bunny'],
        'bad thumb/bunny': ['left thumb/left bunny', 'right thumb/right bunny'],
        'good bunny/bunny': ['left bunny/left bunny', 'right bunny/right bunny'],
        'bad bunny/bunny': ['left bunny/right bunny'],
        'shell/shell': ['shell/shell'],
        'shell/bird': ['shell/left bird', 'shell/right bird'],
        'shell/hazard': ['shell/hazard'],
        'yoshi/shell': ['left yoshi/shell', 'right yoshi/shell'],
        'good bird/bird': ['left bird/right bird'],
        'bad bird/bird': ['left bird/left bird', 'right bird/right bird'],
        'bird/hazard': ['left bird/hazard', 'right bird/hazard'],
        'hazard/hazard': ['hazard/hazard'],
        'good yoshi/bird': ['left yoshi/left bird', 'right yoshi/right bird'],
        'bad yoshi/bird': ['left yoshi/right bird', 'right yoshi/left bird'],
        'yoshi/hazard': ['left yoshi/hazard', 'right yoshi/hazard'],
        'same yoshi/yoshi': ['left yoshi/left yoshi', 'right yoshi/right yoshi'],
        'diff yoshi/yoshi': ['left yoshi/right yoshi'],
        'good kite/kite': ['left kite/left kite', 'right kite/right kite'],
        'bad kite/kite': ['left kite/right kite'],
        'good kite/cut': ['left kite/left cut', 'right kite/right cut'],
        'bad kite/cut': ['left kite/right cut', 'right kite/left cut'],
        'kite/T': ['left kite/black T', 'left kite/white T', 'right kite/black T', 'right kite/white T'],
        'good kite/N': ['left kite/right N', 'right kite/left N'],
        'bad kite/N': ['left kite/left N', 'right kite/right N'],
        'kite/tie': ['left kite/black tie', 'left kite/white tie', 'right kite/black tie', 'right kite/white tie'],
        'cut/T': ['left cut/black T', 'left cut/white T', 'right cut/black T', 'right cut/white T'],
        'good cut/N': ['left cut/left N', 'right cut/right N'],
        'bad cut/N': ['left cut/right N', 'right cut/left N'],
        'cut/tie': ['left cut/black tie', 'left cut/white tie', 'right cut/black tie', 'right cut/white tie'],
        'good cut/cut': ['left cut/left cut', 'right cut/right cut'],
        'bad cut/cut': ['left cut/right cut'],
        'good T/T': ['black T/black T', 'white T/white T'],
        'bad T/T': ['black T/white T'],
        'T/N': ['black T/left N', 'black T/right N', 'white T/left N', 'white T/right N'],
        'good T/tie': ['black T/black tie', 'white T/white tie'],
        'bad T/tie': ['black T/white tie', 'white T/black tie'],
        'good N/N': ['left N/left N', 'right N/right N'],
        'bad N/N': ['left N/right N'],
        'tie/N': ['black tie/left N', 'black tie/right N', 'white tie/left N', 'white tie/right N'],
        'good tie/tie': ['black tie/black tie', 'white tie/white tie'],
        'bad tie/tie': ['black tie/white tie']
    };

    /**
     * CORNERS: possible OBLP corner memo
     */
    static CORNERS = [[''], ['1', '3', '5', '7'], ['13', '15', '17', '35', '37', '57'], ['135', '137', '157', '357'], ['1357']];

    /**
     * EDGES: possible OBLP edge memo
     */
    static EDGES = [[''], ['2', '4', '6', '8'], ['24', '26', '28', '46', '48', '68'], ['246', '248', '268', '468'], ['2468']];

    /**
     * TOTAL_CORNERS: flat list of CORNERS
     */
    static TOTAL_CORNERS = ['', '1', '3', '5', '7', '13', '15', '17', '35', '37', '57', '135', '137', '157', '357', '1357'];

    /**
     * TOTAL_EDGES: flat list of EDGES
     */
    static TOTAL_EDGES = ['', '2', '4', '6', '8', '24', '26', '28', '46', '48', '68', '246', '248', '268', '468', '2468'];

    /**
     * evenPLL: PBL faces without parity
     */
    static evenPLL = [
        "-", "Al", "Ar", "E", "F", "Gal", "Gar", "Gol", "Gor", "H", "Ja", "Jm",
        "Na", "Nm", "Rl", "Rr", "T", "Ul", "Ur", "V", "Y", "Z"
    ];

    /**
     * oddPLL: PBL faces with parity
     */
    static oddPLL = ["Adj", "Opp", "pJ", "pN", "Ba", "Bm", "Cl", "Cr", "Da", "Dm",
        "Ka", "Km", "M", "Ol", "Or", "Pl", "Pr", "Q", "Sa", "Sm", "W", "X"
    ];

    /**
     * CPAdjPLL: PBL faces that have one headlight
     */
    static CPAdjPLL = ["Al", "Ar", "F", "Gal", "Gar", "Gol", "Gor", "Ja", "Jm", "Rl", "Rr", "T", "pJ", "Ba", "Bm", "Cl", "Cr", "Da", "Dm", "Ka", "Km", "M", "Pl", "Pr"];

    /**
     * CPOppPLL: diag PBL faces
     */
    static CPOppPLL = ["E", "Na", "Nm", "V", "Y", "pN", "Q", "Sa", "Sm", "X"];

    /**
     * CPSolvedPLL: CP solved PBL faces
     */
    static CPSolvedPLL = ["-", "H", "Ul", "Ur", "Z", "Adj", "Opp", "Ol", "Or", "W"];

    /**
     * PBLWeights: the weight factor of PBL faces that are not 4
     */
    static PBLWeights = {
        "-": 1, E: 2, H: 1, Na: 1, Nm: 1, Opp: 2,
        Ol: 1, Or: 1, pN: 2, Q: 1, X: 1, Z: 2,
    };

    /**
     * PLLFamilyLen: the length of the PLL family that contains a PLL
     * e.g. Gal: 4, because ["Gal", "Gol", "Gor", "Gar"] is 4 long
     */
    static PLLFamilyLen = {
        "-": 1, Al: 2, Ar: 2, E: 1, F: 1, Gal: 4, Gar: 4, Gol: 4, Gor: 4,
        H: 1, Ja: 2, Jm: 2, Na: 2, Nm: 2, Rl: 2, Rr: 2, T: 1, Ul: 2, Ur: 2,
        V: 1, Y: 1, Z: 1, Adj: 1, Opp: 1, pJ: 1, pN: 1, Ba: 2, Bm: 2, Cl: 2,
        Cr: 2, Da: 2, Dm: 2, Ka: 2, Km: 2, M: 1, Ol: 2, Or: 2, Pl: 2, Pr: 2,
        Q: 1, Sa: 2, Sm: 2, W: 1, X: 1
    };

    /**
     * @param {object} [tempReplacements] initial manual unkarnifications.
     */
    constructor(tempReplacements = { "meow :3": "meow :3" }) {
        // place to put manual unkarnifications
        this.tempReplacements = { ...tempReplacements };
    }

    /**
     * setTempReplacements: replace the entire tempReplacements map.
     *
     * @param {Object<string,string>} replacements the new key→value pairs
     * @returns {this}
     */
    setTempReplacements(replacements) {
        this.tempReplacements = { ...replacements };
        return this;
    }

    /**
     * addTempReplacements: merge key→value pairs into tempReplacements.
     *
     * @param {Object<string,string>} replacements: pairs to add (overwrites collisions)
     * @returns {this}
     */
    addTempReplacements(replacements) {
        Object.assign(this.tempReplacements, replacements);
        return this;
    }


    // =========================================================================
    // SECTION 2: CORE UTILITIES
    // =========================================================================

    /**
     * dictReplace: repeatedly applies every key→value substitution in `dict`
     * to `str` until the string stabilizes.
     *
     * @param {string} str the string to be replaced
     * @param {object} dict the dictionary
     * @param {boolean} isolated whether matches need to be isolated in / \ | space or boundaries
     * @returns {string} the fully replaced string
     */
    dictReplace(str, dict, isolated = true) {
        const body = '(?:' +
            Object.keys(dict).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') +
            ')';
        const pattern = new RegExp(
            isolated ? '(?<=^|[ /\\\\|])' + body + '(?=$|[ /\\\\|])' : body,
            'g'
        );
        let prev;
        do { prev = str; str = str.replace(pattern, m => dict[m]); } while (str !== prev);
        return str;
    }

    /**
     * addCommas: e.g. "2-1" → "2,-1"
     *
     * length 1 → "N,0"
     * length 2 → starts with '-'? "-N,0" : "A,B"
     * length 3 → starts with '-'? "-A,B" : "A,BC"    (where BC is the second part)
     * length 4 → "AB,CD"
     * anything else that is not all-digits/minus → pass through unchanged
     *
     * @param {string} alg the scramble, any separator (no additional spaces). can have commas already.
     * @returns {string} the scramble, with commas added
     */
    addCommas(alg) {
        return alg.split(/[/\\| ]/).map(move => {
            if (!move || isNaN(Number(move.replaceAll('-', ''))) || move.includes(","))
                return move;
            switch (move.length) {
                case 1: return move + ',0';
                case 2: return move.charAt(0) === '-' ? move + ',0'
                    : move[0] + ',' + move[1];
                case 3: return move.charAt(0) === '-' ? move.slice(0, 2) + ',' + move[2]
                    : move[0] + ',' + move.slice(1);
                case 4: return move.slice(0, 2) + ',' + move.slice(2);
                default: throw new Error(`"${move}" is not a valid karn numeric move`);
            }
        }).join(' ');
    }

    /**
     * isKarn: returns true if the string uses any letters, excluding A and a
     *
     * @param {string} str the alg
     * @returns {boolean} whether the alg contains letters, excluding A and a
     */
    isKarn(str) {
        return /[b-zB-Z]/.test(str);
    }

    /**
     * getAlignmentMove: turns topA and bottomA into a starting move
     *
     * @param {boolean} topA top misalign?
     * @param {boolean} bottomA bottom misalign?
     * @returns {string} e.g. "10", "1-1"
     */
    getAlignmentMove(topA, bottomA) {
        return (topA ? '1' : '0') + (bottomA ? '-1' : '0');
    }

    /**
     * getAlignment: turns a starting/ending move into topA and bottomA
     *
     * @param {string} m the move
     * @returns {topA: top misalign?, bottomA: bottom misalign?}}
     */
    getAlignment(m) {
        if (!m) return { topA: false, bottomA: false } // this is just a 00 move
        m = this.addCommas(m);
        if (!m.includes(",")) throw new Error("getAlignment: move is weird: " + m);
        const [u, d] = m.split(",");
        return { topA: u !== "0", bottomA: d !== "0" }
    }


    // =========================================================================
    // SECTION 3: UNKARNIFY PIPELINE
    // =========================================================================

    /**
     * unkarnifyHelp: does the actual unkarnifying
     *
     * @param {string} alg the alg
     * @returns {string} surface-level unkarnified alg
     */
    unkarnifyHelp(alg) {
        // trim and replace random ass characters
        alg = alg.trim().replaceAll(/[()]/g, "");
        // " / " → "/"
        alg = alg.replaceAll(/ ([\/\\\|]) /g, "$1")
        if (/[\/\\\|]{2,}/.test(alg)) throw new Error("unkarnifyHelp: Two slices in a row.");

        if (!this.isKarn(alg)) return alg; // not karn at all

        // these can be "", if the alg starts/ends with a slice
        let firstMove, lastMove;
        if (!/[/\\| ]/.test(alg)) firstMove = lastMove = alg; // only one move
        else {
            firstMove = alg.match(/^([^/\\| ]*)[/\\| ]/)?.[1];
            lastMove = alg.match(/[/\\| ]([^/\\| ]*)$/)?.[1];
        }

        // only tests if it literally starts with a slice
        let startsSlice = ["/", "\\", "|"].includes(alg.charAt(0));
        // grab the literal starting slice, or just use a /
        let startingSlice = startsSlice ? alg.charAt(0) :
            firstMove in SquanLib.karnToWCA ? "/" : "";
        // same
        let endingSlice = "/" === alg.at(-1) ? "/" :
            lastMove in SquanLib.karnToWCA ? "/" : "";

        // replace all possible slices with spaces now that we have slice start
        alg = alg.replaceAll(/[/\\| ]+/g, ' ');
        alg = this.addCommas(alg);
        // now go through scramble move by move
        let s = alg.split(" ").filter(Boolean);
        for (let i = 0; i < s.length; i++)
            if (s[i] in SquanLib.karnToWCA) s[i] = SquanLib.karnToWCA[s[i]].split(" ");

        // high karns gone. now flatten
        s = s.flat();
        for (let i = 0; i < s.length; i++)
            if (s[i] in SquanLib.karnToWCA) s[i] = SquanLib.karnToWCA[s[i]];

        alg = startingSlice + s.join("/") + endingSlice;
        // sanity replacements
        alg = alg.replaceAll(/ +/g, "")
        if (/[\/\\\|]{2,}/.test(alg)) throw new Error("unkarnifyHelp: Two slices in a row post-replacements.");

        return alg;
    }

    /**
     * unkarnify: master karn → WCA
     * basically unkarnifyHelp + replaceShorthand with bling blings
     *
     * @param {string} alg the alg to be unkarnified
     * @returns {string} unkarnified alg, duh
     */
    unkarnify(alg) {
        // overrides
        if (alg in this.tempReplacements) return this.tempReplacements[alg];

        // legacy character substitutions
        alg = alg
            .replaceAll('&', '-1')
            .replaceAll('^', '-2')
            .replaceAll('9', '-3')
            .replaceAll('8', '-4')
            .replaceAll('7', '-5');

        // remove potential move counts, comments
        alg = alg.replaceAll(/\[.*?\]/g, "");

        // p scrambles
        let isPScramble = /^p[ /\\|]/.test(alg);
        let startingSlice;
        if (isPScramble) {
            startingSlice = alg.charAt(1) === " " ? "/" : alg.charAt(1);
            alg = alg.slice(2, -3);
        }

        // expand move groups, e.g. "(U U')3" → "U U' U U' U U'"
        for (const group of alg.matchAll(/(\(.*?\))(\d+)/g)) {
            const inner = group[1].replaceAll(/[()]/g, '');
            const count = parseInt(group[2], 10);
            alg = alg.replace(group[0], Array(count).fill(inner).join(' '));
        }

        // the core defer
        let final = this.replaceShorthands(this.unkarnifyHelp(alg));

        // handle p scramble
        if (isPScramble) {
            if (["/", "\\", "|"].includes(final.charAt(0))) final = final.slice(1);
            final = 'p' + startingSlice + final + "/p'";
        }
        final = final.replaceAll(/\/+/g, '/');

        return final;
    }

    /**
     * replaceShorthands: replace shorthands (bjj, fv, kk, …) in an alg,
     * tracking alignment state to choose the correct shorthand.
     *
     * @param {string} alg the alg
     * @returns {string} the alg with shorthands replaced... guys jsdoc is sometimes dumb
     */
    replaceShorthands(alg) {
        const moves = alg.split(/[\/\\\|]/);

        // early out: no shorthands
        const allKnown = moves.every(m =>
            !m || !this.isKarn(m) || (' ' + m + ' ' in SquanLib.karnToWCA)
        );
        if (allKnown) return this.unkarnifyHelp(alg);

        let topA = false, bottomA = false;

        for (const move of moves) {
            if (!move) continue;

            if (move.includes(',')) {
                // Numeric turn: update alignment tracker.
                const [u, d] = move.split(',');
                if (parseInt(u, 10) % 3 !== 0) topA = !topA;
                if (parseInt(d, 10) % 3 !== 0) bottomA = !bottomA;
            } else {
                // shorthand
                const key = SquanLib.alignmentIndependent.has(move.toLowerCase())
                    ? move.toLowerCase()
                    : move.toLowerCase() + this.getAlignmentMove(topA, bottomA);

                const replacement = SquanLib.shorthandToKarn[key];
                if (replacement === undefined)
                    throw new Error(`replaceShorthands: "${move}" with alignment ${this.getAlignmentMove(topA, bottomA)} is not defined.`);

                alg = alg.replace(move, replacement);

                // Update alignment based on what the replacement expands to.
                for (const sub of this.unkarnifyHelp(replacement).split('/')) {
                    if (!sub) continue;
                    const [u, d] = sub.split(',');
                    if (parseInt(u, 10) % 3 !== 0) topA = !topA;
                    if (parseInt(d, 10) % 3 !== 0) bottomA = !bottomA;
                }
            }
        }

        // unkarnify the shorthands that were replaced into the alg
        return this.unkarnifyHelp(alg);
    }


    // =========================================================================
    // SECTION 4: SCRAMBLE / ALG UTILITIES
    // =========================================================================

    /**
     * parseScramble: tokenizes a WCA squan scramble
     *
     * @param {string} alg the alg
     * @returns {{ type: string, top?: number, bottom?: number }[]} after parsing
     */
    parseScramble(alg) {
        const moves = [];
        const parts = alg.replace(/[\/\\\|]/g, ' / ').trim().split(/\s+/).filter(Boolean);
        for (let part of parts) {
            if (part.startsWith("p"))
                moves.push({ type: 'turn', top: 0, bottom: 0 });
            else if (part === '/') {
                moves.push({ type: 'twist' });
            } else {
                part = this.addCommas(part.replace(/[()]/g, ''));
                if (!part.includes(",")) throw new Error(`parseScramble: move: ${part} is weird.`)
                const [top, bottom] = part.split(',').map(n => parseInt(n.trim(), 10));
                if (!isNaN(top) && !isNaN(bottom))
                    moves.push({ type: 'turn', top, bottom });
            }
        }
        return moves;
    }

    /**
     * twist: does a slice on a hex string
     *
     * @param {string} tlHex top layer hex, from UFL clockwise
     * @param {string} blHex bottom layer hex, from DF clockwise
     */
    twist(tlHex, blHex) {
        return {
            tlHex: tlHex.slice(0, 6) + blHex.slice(0, 6),
            blHex: tlHex.slice(6) + blHex.slice(6),
        };
    }

    /**
     * doSlice: does a slice on a CSP-style OBL cube. throws error if unsliceable.
     *
     * @param {string} cube the CSP-style "BbWw" cube
     * @returns {string} the cube post-slice, if sliceable
     */
    doSlice(cube) {
        const [UR, UL, DR, DL] = [
            cube.slice(0, SquanLib.HALF_L),
            cube.slice(SquanLib.HALF_L, SquanLib.LAYERL),
            cube.slice(SquanLib.LAYERL, SquanLib.THREE_FOUR_L),
            cube.slice(SquanLib.THREE_FOUR_L, SquanLib.CUBEL)
        ];
        const isUP = (char) => char === char.toUpperCase();
        const canSlice = (halfLayer) => (
            !isUP(halfLayer.at(0)) || isUP(halfLayer.at(1)) &&
            !isUP(halfLayer.at(-1)) || isUP(halfLayer.at(-2))
        );
        if (!([UR, UL, DR, DL].map(canSlice).every(Boolean)))
            throw new Error("doSlice: unsliceable position encountered");
        return DR + UL + UR + DL;
    }

    /**
     * algToHex: get the hex state that the alg generates
     *
     * @param {string} alg an alg. karn is accepted.
     * @returns {tlHex: string, blHex: string} the hex
     */
    algToHex(alg) {
        let tlHex = '011233455677';
        let blHex = '998bbaddcffe';
        for (const move of this.parseScramble(this.unkarnify(alg))) {
            if (move.type === 'twist') {
                ({ tlHex, blHex } = this.twist(tlHex, blHex));
            } else {
                tlHex = this.shift(tlHex, -move.top);
                blHex = this.shift(blHex, -move.bottom);
            }
        }
        return { tlHex, blHex };
    }

    /**
     * doMoves: does moves on a cube
     *
     * @param {string} ms the moves. karn accepted.
     * @param {string} s the starting CSP-styled cube. leave to use the solved OBL state
     * @returns {string} the cube post-moves
     */
    doMoves(ms, s) {
        if (s === undefined) s = SquanLib.SOLVED_A;
        for (const tok of this.unkarnify(ms).split('/')) {
            const m = tok.trim();
            if (m !== '') {
                const [u, d] = m.split(',').map(Number);
                s = this.moveCube(s, u, d);
            }
            s = this.doSlice(s);
        }
        return this.doSlice(s);
    }

    /**
     * moveCube: does a move on a CSP-style cube
     *
     * @param {string} cube the CSP-style cube
     * @param {number} u the U move
     * @param {number} d the D move
     * @returns {string} the cube post-move
     */
    moveCube(cube, u, d) {
        return this.shift(cube.slice(0, SquanLib.LAYERL), u) +
            this.shift(cube.slice(SquanLib.LAYERL), d);
    }

    /**
     * invertScramble: reverses a scramble
     *
     * @param {string} alg the alg. karn is accepted.
     * @returns {string} the reversed alg
     */
    invertScramble(alg) {
        if (!alg) return alg;
        return this.unkarnify(alg).trim().split('/').reverse().map(part => {
            part = part.trim();
            const src = part.includes('(')
                ? part.match(/\(([^)]+)\)/)?.[1]
                : part.includes(',') ? part : null;
            if (!src) return part;
            const inverted = src.split(',').map(v => {
                const n = parseInt(v.trim(), 10);
                return isNaN(n) ? v.trim() : String(-n);
            }).join(',');
            return part.includes('(') ? `(${inverted})` : inverted;
        }).join('/');
    }

    /**
     * isPBL: check if a hex is PBL
     *
     * @param {string} hex
     * @returns {boolean} whether it's a PBL
     */
    isPBL(hex) {
        let { tlHex, blHex } = hex;
        let tA = [...tlHex]; let bA = [...blHex];
        if (tA[1] !== tA[2] ||
            tA[4] !== tA[5] ||
            tA[7] !== tA[8] ||
            tA[10] !== tA[11]
        ) return false;
        if (parseInt(tA[0], 10) % 2 !== 0 ||
            parseInt(tA[1], 10) % 2 !== 1 ||
            parseInt(tA[3], 10) % 2 !== 0 ||
            parseInt(tA[4], 10) % 2 !== 1 ||
            parseInt(tA[6], 10) % 2 !== 0 ||
            parseInt(tA[7], 10) % 2 !== 1 ||
            parseInt(tA[9], 10) % 2 !== 0 ||
            parseInt(tA[10], 10) % 2 !== 1
        ) return false;
        if (!tA.includes('0') ||
            !tA.includes('1') ||
            !tA.includes('2') ||
            !tA.includes('3') ||
            !tA.includes('4') ||
            !tA.includes('5') ||
            !tA.includes('6') ||
            !tA.includes('7')
        ) return false;
        if (bA[0] !== bA[1] ||
            bA[3] !== bA[4] ||
            bA[6] !== bA[7] ||
            bA[9] !== bA[10]
        ) return false;
        if (parseInt(bA[0], 16) % 2 !== 1 ||
            parseInt(bA[2], 16) % 2 !== 0 ||
            parseInt(bA[3], 16) % 2 !== 1 ||
            parseInt(bA[5], 16) % 2 !== 0 ||
            parseInt(bA[6], 16) % 2 !== 1 ||
            parseInt(bA[8], 16) % 2 !== 0 ||
            parseInt(bA[9], 16) % 2 !== 1 ||
            parseInt(bA[11], 16) % 2 !== 0
        ) return false;
        if (!bA.includes('8') ||
            !bA.includes('9') ||
            !bA.includes('a') ||
            !bA.includes('b') ||
            !bA.includes('c') ||
            !bA.includes('d') ||
            !bA.includes('e') ||
            !bA.includes('f')
        ) return false;
        return true;
    }


    // =========================================================================
    // SECTION 5: KARNIFY  (WCA → karn)
    // =========================================================================

    /**
     * karnify: converts WCA to karn.
     *
     * 1. assert that no two slices are next to each other and it's fully numeric
     * 2. compute any startingSlice and endingSlice
     * 3. normalize slice symbols
     * 4. go through move by move for base karns and only karnify first/last non-zero move
     *    if they have slices around.
     * 5. join back into an alg while reattaching leading/trailing slices,
     *    and dictReplace for high karns
     *
     * @param {string} alg WCA format
     * @returns {string} karn
     */
    karnify(alg) {
        alg = alg.trim();
        if (/[\/\\\|]{2,}/.test(alg)) throw new Error("karnify: Two slices in a row.");
        if (this.isKarn(alg)) throw new Error("karnify: Alg has letters. Try unkarnifying first.")
        let startsSlice = ["/", "\\", "|"].includes(alg.charAt(0));
        let startingSlice = startsSlice ? alg.charAt(0) : "";
        let endsSlice = "/" === alg.at(-1);
        let endingSlice = endsSlice ? "/" : "";

        // replace all possible slices with spaces
        alg = alg.replaceAll(/[/\\| ]+/g, ' ');

        // now go through scramble move by move to apply base karn
        let s = alg.split(" ").filter(Boolean);
        for (let i = 0; i < s.length; i++) {
            if (i === 0 && !startsSlice) {
                // even if it's in base karn, we can't karnify
                s[i] = s[i].replace(",", "");
                continue;
            }
            if (i === s.length - 1 && !endsSlice) {
                // even if it's in base karn, we can't karnify
                s[i] = s[i].replace(",", "");
                break;
            }
            // good to replace
            let inBaseKarn = s[i] in SquanLib.wcaToBaseKarn;
            s[i] = inBaseKarn ? SquanLib.wcaToBaseKarn[s[i]] : s[i].replace(",", "");
            // prevent an additional leading slice for first move karn
            if (inBaseKarn && i === 0) startingSlice = startingSlice.replace("/", "");
            if (inBaseKarn && i === s.length - 1) endingSlice = "";
        }

        alg = startingSlice + s.join(" ") + endingSlice;
        alg = this.dictReplace(alg, SquanLib.baseKarnToHighKarn);
        return alg;
    }


    // =========================================================================
    // SECTION 6: MOVE MATH & SEQUENCE OPTIMIZER
    // =========================================================================

    /**
     * legalMove: normalizes a raw turn value into the canonical squan range [−5, 6].
     *
     * @param {number} m raw turn value, e.g. −7 or 9
     * @returns {number} normalized value in [−5, 6]
     */
    legalMove(m) {
        m = m % 12; // get a range from -11 to 11
        if (m < -5) return m + 12; // send -11 to -6 up
        if (m > 6) return m - 12; // send 7 to 11 down
        return m;
    }

    /**
     * addMoves: adds two move strings component-wise and legalizes each result.
     *
     * Tolerates "A"/"a" alignment markers. When one operand is an alignment
     * marker and the other is a move, the marker is flipped iff the top
     * component of the numeric move changes alignment (not a multiple of 3).
     * The above assumes that the move is in-CS.
     * Both operands cannot simultaneously be alignment markers.
     *
     * @param {string} move1 "top,bot" string, OR "A"/"a" alignment marker
     * @param {string} move2 "top,bot" string, OR "A"/"a" alignment marker
     * @returns {string}
     *
     * @example
     * addMoves("3,0",  "-3,0") // → "0,0"
     * addMoves("2,-1", "1,-2") // → "3,-3"
     * addMoves("5,-1", "3,0")  // → "-4,-1"
     * addMoves("A",    "2,-1") // → "a"
     * addMoves("A",    "3,0")  // → "A"
     */
    addMoves(move1, move2) {
        if (!move1 && !move2) throw new Error("addMoves: both moves are empty.");
        else if (!move1) return move2;
        else if (!move2) return move1;
        const flip = { A: 'a', a: 'A' };
        if (move1 in flip && move2 in flip)
            throw new Error("addMoves: both moves cannot be alignment markers.");
        if (move1 in flip) {
            const top = parseInt(move2.split(',')[0], 10);
            return this.changesAlignment(top) ? flip[move1] : move1;
        } else if (move2 in flip) {
            const top = parseInt(move1.split(',')[0], 10);
            return this.changesAlignment(top) ? flip[move2] : move2;
        }
        const [u1, d1] = move1.split(',').map(Number);
        const [u2, d2] = move2.split(',').map(Number);
        return `${this.legalMove(u1 + u2)},${this.legalMove(d1 + d2)}`;
    }

    /**
     * changesAlignment: check if performing this turn value changes the
     * alignment state (i.e. the turn is not a multiple of 3). Assumes everything
     * is in CS.
     *
     * @param {number} m top-layer turn value,
     * @returns {boolean}
     */
    changesAlignment(m) {
        return m % 3 !== 0;
    }

    /**
     * optimize: replaces known optimizable moves (the OPTIM table) in a WCA alg
     *
     * 1. if no more optimization can be done, exit.
     * 2. split on "/" into an array
     * 3. walk to the next slice
     * 4. at each slice, check if any OPTIM key match the alg starting at that position
     * 5. if match:
     *    - "/0,0/": merge the two surrounding moves
     *    - generally: merge the first replacement move into the preceding move, merge
     *      the last into the succeeding move, and replace the inners
     * 6. restart the outer loop after any change
     *
     * @param {string} alg slash-separated WCA alg, e.g. "A/-3,0/3,3/3,3/a"
     * @returns {string} optimized alg
     */
    optimize(alg) {
        const optimKeys = Object.keys(SquanLib.OPTIM);
        while (this.dictReplace(alg, SquanLib.OPTIM, false) !== alg) {
            const moves = alg.split('/').map(m => m.trim());
            let atSlice = 0;
            let cycleCompleted = false;
            for (let i = 0; i < alg.length; i++) {
                if (cycleCompleted) break;
                if (alg[i] !== '/') continue;
                // only stop when scramble[i] is a slice
                atSlice++;
                for (const optimable of optimKeys) {
                    // if the OPTIM key is longer than what's left of scramble
                    if (alg.length - 1 - i < optimable.length) continue;
                    // if it doesn't match
                    if (alg.slice(i, i + optimable.length) !== optimable) continue;

                    // match!!
                    if (optimable === '/0,0/') {
                        // special case: merge surrounding moves
                        moves[atSlice - 1] = this.addMoves(moves[atSlice - 1], moves[atSlice + 1]);
                        moves.splice(atSlice, 2);
                    } else {
                        const optimableLen = optimable.split('/').length;
                        const optimTo = SquanLib.OPTIM[optimable].split('/');
                        // 2 represents the leading and trailing slash of optimable (forced)
                        const delSliceNum = optimableLen - 2;
                        // merge moves, even when empty (handled by addMoves)
                        moves[atSlice - 1] = this.addMoves(moves[atSlice - 1], optimTo.shift());
                        moves[atSlice + optimableLen - 2] = this.addMoves(
                            moves[atSlice + optimableLen - 2],
                            optimTo.pop()
                        );
                        moves.splice(atSlice, delSliceNum, ...optimTo);
                    }
                    alg = moves.join('/');
                    cycleCompleted = true;
                    break;
                }
            }
        }
        return alg;
    }


    // =========================================================================
    // SECTION 7: ERGONOMICS RATING
    // =========================================================================

    /**
     * getMoveValue: look up the ergonomic cost of a single move.
     * @param {boolean} startA is it top misalign right now?
     * @param {boolean} upslice is this an upslice?
     * @param {string}  move e.g. "3,0"
     * @returns {number}
     */
    getMoveValue(startA, upslice, move) {
        let comma = move.indexOf(',');
        if (comma === -1) {
            comma = this.addCommas(move).indexOf(',');
            if (comma === -1) throw new Error(`getMoveValue: move: ${move} is weird`);
        }
        const topMove = parseInt(move.slice(0, comma), 10);
        const slashCh = upslice ? '/' : '\\';
        let key;
        if (topMove % 3 === 0) {
            key = (startA ? 'A' : 'a') + slashCh + move;
        } else {
            key = slashCh + move;
        }
        return SquanLib.MOVE_VALUES.get(key) ?? 5; // if unknown, just say 5
    }

    /**
     * getOverwork: calculates how much overwork is present in an alg, along with bonus.
     * @param {string[]} moves array of "top,bot" strings (interior moves only)
     * @returns {{ movement: number, bonus: number }}
     */
    getOverwork(moves) {
        const tops = [], bots = [];
        for (const m of moves) {
            let c = m.indexOf(',');
            if (c === -1) {
                const m2 = this.addCommas(m);
                c = m2.indexOf(",");
                if (c === -1) throw new Error(`getOverwork: in moves, m: ${m} is weird.`);
            }
            tops.push(parseInt(m.slice(0, c), 10) || 0);
            bots.push(parseInt(m.slice(c + 1), 10) || 0);
        }

        let movement = 0, bonus = 0;

        // penalize streaks of lefty turns for both layers
        // U layer
        let streak = 0, closestMov = 0, buffer = 0;
        for (const t of tops) {
            const isLeft = (t === 6 || t < 0);
            if (isLeft) {
                streak++;
                if (!SquanLib.CLOSEST_MAP.has(t))
                    throw new Error("getOverwork: top move is weird: " + t)
                closestMov += Math.abs(SquanLib.CLOSEST_MAP.get(t));
                buffer += Math.abs(t);
                // has streak and nontrivial move → penalize
                if (streak > 1 && closestMov > 3) { movement += buffer; buffer = 0; }
            } else { streak = 0; closestMov = 0; buffer = 0; } // reset streak
        }

        // D layer
        streak = 0; closestMov = 0; buffer = 0;
        for (const b of bots) {
            const isLeft = b > 0;
            if (isLeft) {
                streak++;
                if (!SquanLib.CLOSEST_MAP.has(b))
                    throw new Error("getOverwork: top move is weird: " + b)
                closestMov += Math.abs(SquanLib.CLOSEST_MAP.get(b));
                buffer += Math.abs(b);
                if (streak > 1 && closestMov > 3) { movement += buffer; buffer = 0; }
            } else { streak = 0; closestMov = 0; buffer = 0; }
        }

        // Bonus: count consecutive pairs that cancel.
        for (let i = 0; i + 1 < tops.length; i++) {
            if (tops[i] + tops[i + 1] === 0) bonus++;
            if (bots[i] + bots[i + 1] === 0) bonus++;
        }

        return { movement, bonus };
    }

    /**
     * rateAlg: ergonomic rating for a single in CS squan alg
     *
     * @param {string}  algRaw raw alg (karn or WCA)
     * @param {boolean} initialTopA if the alg starts top misalign
     * @param {object}  [weights] override default weight constants
     * @returns {{ score: number, sliceStart: string }}
     *   sliceStart: '/' (prefer upslice), '\' (prefer downslice), or ' ' (no preference)
     */
    rateAlg(algRaw, initialTopA = false, weights = {}) {
        const W1 = weights.W1 ?? 34;   // per-move ergonomic rating
        const W2 = weights.W2 ?? 100;  // slice-count penalty
        const W3 = weights.W3 ?? 38;   // overwork penalty
        const W4 = weights.W4 ?? 500;  // constant term
        const W5 = weights.W5 ?? 10;   // bonus

        // strip brackets e.g. "[7|14]"
        let a = algRaw.replace(/\[.*$/, '').trim();

        // unkarnify if needed
        const numeric = this.isKarn(a) ? this.unkarnify(a) : a.replaceAll(' ', '');

        const rawParts = numeric.split('/');
        // keep leading slice for up/downslice, drop trailing slice
        const r = rawParts.filter((pt, i) => i === 0 || pt.trim() !== '').map(p => p.trim());
        const sliceCount = r.length - 1;
        if (sliceCount <= 0) return { score: W4, sliceStart: ' ' };

        let ergoUp = 0, ergoDown = 0;
        let isTopA = false, oddSlice = true;

        for (let i = 0; i < r.length - 1; i++) {
            let move = r[i]
            let c = move.indexOf(',');
            if (c === -1) {
                // if the move is empty, it's 0,0
                move = move ? this.addCommas(move) : "0,0";
                c = move.indexOf(',');
                if (c === -1)
                    throw new Error(`rateAlg:\nalg: ${algRaw}\nmove: ${move}\nis weird.`)
            }
            const t = parseInt(move.slice(0, c), 10);
            if (isNaN(t)) throw new Error(`rateAlg:\nalg: ${algRaw}\nmove: ${move}\nis weird.`)

            if (i === 0) {
                // 1st move: use to determine initial alignment
                isTopA = initialTopA !== (t % 3 !== 0);
                oddSlice = true;
                continue;
            }

            ergoUp += this.getMoveValue(isTopA, oddSlice, move);
            ergoDown += this.getMoveValue(isTopA, !oddSlice, move);
            isTopA = isTopA !== (t % 3 !== 0);
            oddSlice = !oddSlice;
        }

        const phase1 = W1 * Math.max(ergoUp, ergoDown) / sliceCount; // average move rating

        let sliceStart = '|';
        if (Math.abs(ergoUp - ergoDown) / sliceCount > 5)
            sliceStart = ergoUp > ergoDown ? '/' : '\\';

        const phase2 = W2 * sliceCount;
        const interior = r.slice(1, -1);
        const { movement, bonus } = this.getOverwork(interior);
        const phase3 = W3 * movement / sliceCount;
        const phase4 = bonus * W5 / sliceCount;

        return { score: phase1 - phase2 - phase3 + phase4 + W4, sliceStart };
    }

    /**
     * rateAndSort: rate a list of algs and return them sorted by ergonomics high to low
     *
     * @param {string[]} algLines raw alg strings
     * @param {string}   [posHex=''] position hex (used to determine initialTopA)
     * @returns {{ alg: string, score: number }[]}
     */
    rateAndSort(algLines, posHex = '') {
        // Determine initial top-layer alignment from position hex.
        let initialTopA = false;
        if (posHex) {
            const ch = posHex[0];
            initialTopA = /[A-HU-W]/i.test(ch);
        }

        return algLines.map(line => {
            const bracketPos = line.indexOf('[');
            const algOnly = bracketPos > 0 ? line.slice(0, bracketPos).trim() : line.trim();
            let result = { alg: line, score: 500 };
            let rated = false;
            let sliceStart = ' ';

            // Pre-unkarnify so rateAlg always receives a numeric string.
            const numericAlg = this.isKarn(algOnly) ? this.unkarnify(algOnly) : algOnly;
            ({ score: result.score, sliceStart } = this.rateAlg(numericAlg, initialTopA));
            rated = true;

            if (rated && ["/", "\\", "|"].includes(sliceStart)) {
                result.alg = this.injectSliceStart(line, sliceStart);
            }

            return result;
        }).sort((a, b) => b.score - a.score);
    }

    /**
     * injectSliceStart: injects the slice start into an alg
     *
     * @param {string} alg the alg. no extra spaces allowed
     * @param {string} sliceStart " " | "/" | "\\" | "|"
     * @returns {string} the alg with slice start injected at the first slice
     */
    injectSliceStart(alg, sliceStart) {
        let moreThan1 = /[/\\| ]/.test(alg); // is there ANY slice chars?
        let firstMove = moreThan1 ? alg.match(/^([^/\\| ]*)[/\\| ]/)?.[1] : alg;
        // only tests if it's a karn
        if (firstMove in SquanLib.karnToWCA) return sliceStart + alg;
        if (!moreThan1) return alg; // no slice to inject to

        // guaranteed to have a slice
        const slashPos = alg.search(/[/\\| ]/);
        return alg.slice(0, slashPos) + sliceStart + alg.slice(slashPos + 1);
    }

    // =========================================================================
    // SECTION 8: ALG TRANSFORM
    // =========================================================================

    /**
     * sepIndex: helper to identify where the D move starts in a move without comma
     *
     * @param {string} a a move without commas, e.g. "3-3"
     * @returns {number} the 0-based index of the start of the D move
     * @example "3-3" → 1
     */
    sepIndex(a) {
        let inx = 0;
        for (const ch of a) { inx++; if (/\d/.test(ch)) break; }
        return inx;
    }

    /**
     * compl: get the complement of a move
     *
     * @param {string} a a move
     * @returns {string} the complement move with commas
     * @example "-12" → "5,-4"; "-1,2" → "5,-4"
     */
    compl(a) {
        if (!a) return a;
        let u, d;
        if (a.includes(',')) [u, d] = a.split(",");
        else {
            const inx = this.sepIndex(a);
            [u, d] = [a.slice(0, inx), a.slice(inx)];
        }
        return String(this.legalMove(6 + parseInt(u, 10))) + "," +
            String(this.legalMove(6 + parseInt(d, 10)));
    }

    /**
     * lf: get the layer flip of a move
     *
     * @param {string} a a move
     * @returns {string} the layer flip move
     * @example "-12" → "2,-1"; "-1,2" → "2,-1"
     */
    lf(a) {
        if (!a) return a;
        let u, d;
        if (a.includes(',')) [u, d] = a.split(",");
        else {
            const inx = this.sepIndex(a);
            [u, d] = [a.slice(0, inx), a.slice(inx)];
        }
        return d + "," + u;
    }

    /**
     * compact: parse any input format into space-separated no-comma compact
     * segments, e.g. "30 -33 30". uses full unkarnify for karn input.
     *
     * @param {string} algIn the inputted alg. any input format
     * @returns {string} the compact format
     */
    compact(algIn) {
        let alg = algIn
            .replace(/\[.*?\]/g, "")
            .replace(/[()]/g, "").trim();
        if (this.isKarn(alg)) {
            const numeric = this.unkarnify(alg);
            return numeric.split("/").map(m => {
                if (!m) return m;
                if (!m.includes(","))
                    throw new Error(
                        `algToInternal: m doesn't have commas post karnifying: ${m}`
                    )
                const [u, d] = m.split(",");
                return String(this.legalMove(parseInt(u, 10))) +
                    String(this.legalMove(parseInt(d, 10)));
            }).join(" ");
        }
        alg = alg.replaceAll(" ", "");
        if (alg.includes("/")) {
            return alg.split("/").filter(Boolean).map(m => {
                if (!m.includes(",")) m = this.addCommas(m);
                if (!m.includes(","))
                    throw new Error(
                        `algToInternal: m doesn't have commas post addComma: ${m}`
                    )
                const [u, d] = m.split(",");
                return String(this.legalMove(parseInt(u, 10))) +
                    String(this.legalMove(parseInt(d, 10)));
            }).join(" ");
        }
        return alg.split(" ").filter(p => p).map(m => {
            const p = m.includes(",")
                ? m.split(",")
                : [m.slice(0, this.sepIndex(m)), m.slice(this.sepIndex(m))];
            return String(this.legalMove(parseInt(p[0], 10))) +
                String(this.legalMove(parseInt(p[1], 10)));
        }).join(" ");
    }

    /**
     * countY2Positions: count the number of possible y2 positions
     *
     * @param {string} algIn the alg
     * @returns {number} how many positions the alg can y2 at
     */
    countY2Positions(algIn) {
        // spaces ARE slices, cannot trim or do anything like that
        const segs = this.compact(algIn).split(" ");
        return Math.max(0, segs.length - 3);
    }

    /**
     * applyY2s: y2 an alg at a list of specified slices, and give comments
     *
     * @param {string} algIn the alg
     * @param {number[]} lfLst the list of slice positions to y2 at
     * @param {boolean} k whether to output as karn, leave to use input format
     * @returns {string} the y2'ed alg, plus comments
     */
    applyY2s(algIn, lfLst, k = null) {
        let alg = algIn.replaceAll(/\[.*?\]/g, "").trim();
        if (!lfLst) lfLst = [];

        const ki = this.isKarn(alg);
        const kOut = k === null ? ki : k;

        alg = this.unkarnify(algIn);
        let alst = alg.split("/");

        // save for alignment-changes check
        const firstMove = alst[0];
        const lastMove = alst[alst.length - 1];

        // Apply explicit y2s to interior moves
        let lfing = false, facingD = false;
        for (let i = 1; i <= alst.length - 3; i++) {
            let m = alst[i];
            m = facingD ? this.lf(m) : m;
            if (lfLst.includes(i)) { m = this.compl(m); lfing = !lfing; }
            facingD = lfing ? !facingD : facingD;
            alst[i] = m;
        }

        // fix last interior move
        const lastIntIdx = alst.length - 2;
        if (facingD) alst[lastIntIdx] = this.lf(alst[lastIntIdx]);
        if (lfing !== facingD) alst[lastIntIdx] = this.compl(alst[lastIntIdx]);
        const lastIntMove = alst[lastIntIdx];

        // add commas to all moves
        for (let i = 0; i < alst.length; i++) alst[i] = this.addCommas(alst[i]);
        alg = alst.join('/');

        // build comment
        let comment = "";
        if (lastIntMove && !SquanLib.GOOD_FINISHES.has(lastIntMove))
            comment += ' (bad finish)';
        const { topA: topAstart, bottomA: bottomAstart } = this.getAlignment(firstMove);
        const { topA: topAend, bottomA: bottomAend } = this.getAlignment(lastMove);
        if (topAstart !== bottomAstart &&
            topAstart !== topAend &&
            topAend !== bottomAend)
            comment += ' (alignment changes in CS)';

        if (kOut) {
            alg = this.karnify(alg);
        }

        return alg + comment;
    }

    // =========================================================================
    // SECTION 9: OBL and OBLP Utilities
    // =========================================================================

    /**
     * layerFlip: give the layer flipped state of a CSP-style OBL state
     *
     * @param {string} state an OBL state of however long
     * @returns {string} the layer flip of that
     */
    layerFlip(state) {
        const layerFlipMap = { 'b': 'w', 'B': 'W', 'w': 'b', 'W': 'B' };
        return [...state].map(c => {
            if (c in layerFlipMap) return layerFlipMap[c];
            throw new Error("layerFlip: unrecognized character: " + c)
        }).join('');
    }

    /**
     * shift: basically does a move on a layer
     *
     * @param {string} a CSP-style (layer) state
     * @param {number} amount the move. literally. cw = positive
     * @returns {string} the state after the move
     */
    shift(a, amount) {
        amount = ((-amount % a.length) + a.length) % a.length;
        return a.slice(amount) + a.slice(0, amount);
    }

    /**
     * oblName: turns a possibleOBL array into a string
     *
     * @param {string[]} obl a possibleOBL-style array
     * @returns {string} the actual OBL name
     */
    oblName(obl) {
        return obl[0] ? `${obl[0]} ${obl[1]}/${obl[2]}` : `${obl[1]}/${obl[2]}`;
    }

    /**
     * layerFlipName: layer flips an OBL name
     *
     * @param {string} obl an unspecific OBL name
     * @returns {string} the layer flipped version
     * @example "good bunny/thumb" → "good thumb/bunny"
     */
    layerFlipName(obl) {
        obl = obl.replace('/', ' ');
        const parts = obl.split(' ');
        if (parts.length === 2) return parts[1] + '/' + parts[0];
        return parts[0] + ' ' + parts[2] + '/' + parts[1];
    }

    /**
     * speToNonSpe: get the non-specific OBL of a specific one
     *
     * @param {string} obl the specific obl, in English
     * @param {boolean} canonical whether to return the canonical naming
     * @returns {string} the unspecific obl, in English
     * @example "left bunny/left thumb" → "good thumb/bunny"
     * @example "left bunny/left thumb", false → "good bunny/thumb"
     */
    speToNonSpe(obl, canonical = true) {
        const [uObl, dObl] = obl.split('/');
        const u = uObl.split(' ').pop();
        const d = dObl.split(' ').pop();
        const candidates = SquanLib.POSSIBLE_OBL
            .filter(c => c.includes(u) && c.includes(d))
            .map(c => this.oblName(c));
        for (const cand of candidates) {
            const specials = SquanLib.OBL_TRANSLATION[cand] || [];
            for (const spe of specials) {
                if (spe === obl) return cand;
                const [s1, s2] = spe.split('/');
                if (`${s2}/${s1}` === obl) return this.layerFlipName(cand);
            }
        }
        throw new Error(`speToNonSpe: No non-specific OBL found for: ${obl}`);
    }

    /**
     * nonSpeToSpe: get the list of specific OBLs from a non-specific OBL
     *
     * @param {string} obl the non-specific OBL name, in english
     * @returns {string[]} all the specific OBLs that it corresponds to
     */
    nonSpeToSpe(obl) {
        let ret = [];
        if (!obl in SquanLib.OBL_TRANSLATION)
            throw new Error("nonSpeToSpeList: not in OBL_TRANSLATION. obl: " + obl);
        for (let spec of SquanLib.OBL_TRANSLATION[obl]) {
            ret.push(spec);
            let spec2 = spec.split("/")[1] + "/" + spec.split("/")[0];
            if (spec2 !== spec)
                ret.push(spec2)
        }
        return ret;
    }

    /**
     * speToNonSpeMult: speToNonSpe, but for multiple specific OBLs, and with deduping
     *
     * @param {string[]} l an array of specific OBLs, in English
     * @returns {string[]} an array of non-specific OBLs, in English, after deduping
     * @example ["left thumb/left bunny", "left bunny/left thumb"] → ["good thumb/bunny"]
     */
    speToNonSpeMult(l) {
        let ret_repeats = [];
        for (let obl of l)
            ret_repeats.push(getNonSpe(obl));
        return [...new Set(ret_repeats)]; // dedupe
    }

    /**
     * nonSpeToSpeMult: nonSpeToSpe, but for multiple non-specific OBLs
     *
     * @param {string[]} l an array of non-specific OBLs, in English
     * @returns {string[]} a flattened array of the corresponding specific OBLs, in English
     */
    nonSpeToSpeMult(l) {
        // l: a list of non-specific obls in english
        // returns: a list of specific obls in english
        let ret = [];
        for (let obl of l)
            ret.push(...getSpe(obl));
        return ret;
    }

    /**
     * isOBLCase: checks if a CSP-style OBL state is an OBL
     *
     * @param {string} l the CSP-style state
     * @param {string} target the OBL name (one layer)
     * @returns {number | boolean} the angle offset, 1-4, or false
     */
    isOBLCase(l, target) {
        const targetPattern = SquanLib.OBLToState[target];
        if (!targetPattern) return false;
        // to corner first
        if (l[0] !== l[0].toUpperCase()) l = this.shift(l, -1);
        for (let m = 1; m <= 4; m++) {
            if (targetPattern === this.shift(l, -3 * m)) return m;
        }
        const noTT = !['T', 'tie'].includes(target.split(' ').pop());
        if (noTT) {
            // free to change the color
            const fl = this.layerFlip(l);
            for (let m = 1; m <= 4; m++) {
                if (targetPattern === this.shift(fl, -3 * m)) return m;
            }
        }
        return false;
    }

    /**
     * layerToOBL: convert a CSP-style "BbWw" layer to the OBL name and angle offset
     *
     * @param {string} layer CSP-style OBL layer
     * @returns {{obl: string, angleOffset: number}} the obl and and angle offset
     */
    layerToOBL(layer) {
        for (const obl of Object.keys(SquanLib.OBLToState))
            if (this.isOBLCase(layer, obl))
                return { obl, angleOffset: this.isOBLCase(layer, obl) };
        throw new Error('layerToOBL: no OBL matched layer: ' + layer);
    }



    /**
     * getAngle: get the angle from the OBL cases and angle offsets
     *
     * @param {string} u new naming U layer OBL
     * @param {string} d new naming D layer OBL
     * @param {number} au U layer angle offset
     * @param {number} ad D layer angle offset
     * @returns {string} the angle inside a <>
     * @example "left pair", "right arrow", "1", "2" → "DL DL"
     */
    getAngle(u, d, au, ad) {
        let uAngle = SquanLib.OBL_ANGLES[u];
        let dAngle = SquanLib.OBL_ANGLES[d];
        for (let i = 0; i < au % 4; i++) uAngle = SquanLib.nextAngle[uAngle];
        for (let i = 0; i < ad % 4; i++) dAngle = SquanLib.nextAngle[dAngle];
        return `${uAngle} ${dAngle}`;
    }

    /**
     * cubeToSpe: convert an OBL cube state to the OBL of the layers and their
     * angle offset
     *
     * @param {string} state the CSP-style OBL cube state
     * @returns {[{obl: string, angleOffset: number}, {obl: string, angleOffset: number}]}
     * the result
     */
    cubeToSpe(state) {
        return [
            this.layerToOBL(state.slice(0, SquanLib.LAYERL)),
            this.layerToOBL(state.slice(SquanLib.LAYERL))
        ];
    }

    /**
     * getOBLLen: get the optimal slicecount for the OBL
     *
     * @param {string} o nonspe OBL
     * @returns {number} optimal slicecount for it
     * @example "good bunny/thumb" → 4
     */
    getOBLLen(o) {
        if (o in OBL_LEN) return OBL_LEN[o];
        return OBL_LEN[layer_flip_name(o)];
    }

    /**
     * stateToLen: get the optimal slicecount for this CSP-style OBL cube state
     *
     * @param {string} u U layer CSP-style OBL state
     * @param {string} d D layer CSP-style OBL state
     * @returns {number} the optimal slicecount for the OBL
     */
    stateToLen(u, d) {
        return this.getOBLLen(this.speToNonSpe(u + '/' + d));
    }

    /**
     * getOBLNaming: get the new naming from the old naming
     *
     * @param {string} u the U layer old naming
     * @param {string} d the D layer old naming
     * @returns {string} the matt naming for the case, slash separated
     * @example "left bunny", "right thumb" → "Uc/Thc"
     */
    getOBLNaming(u, d) {
        return SquanLib.NAMING[u] + '/' + SquanLib.NAMING[d];
    }


    /**
     * stateToMatt: convert an CSP-style OBL cube state to matt tracing memo
     *
     * @param {string} s CSP-style OBL cube state
     * @returns {string} matt tracing memo for the state
     */
    stateToMatt(s) {
        let u = s.slice(0, SquanLib.LAYERL), d = s.slice(SquanLib.LAYERL);
        u = (u[0] !== u[0].toLowerCase()) ? this.shift(u, 3) : this.shift(u, 2);
        d = (d[0] !== d[0].toLowerCase()) ? this.shift(d, 3) : this.shift(d, 2);
        let mem = '';
        let p = 1;
        for (let x = 0; x < SquanLib.LAYERL; x += 3) {
            // do one "pair" at one time
            if (u[x] === 'B') mem += p;
            if (u[x + 2] === 'b') mem += (p + 1);
            p += 2;
        }
        // if it's just the solved state
        mem = (mem === '') ? '- ' : mem + ' ';
        p = 1;
        for (let x = 0; x < SquanLib.LAYERL; x += 3) {
            if (d[x] === 'B') mem += p;
            if (d[x + 2] === 'b') mem += (p + 1);
            p += 2;
        }
        return (mem[mem.length - 1] === ' ') ? mem + '-' : mem;
    }

    /**
     * mattToLayer: converts one layer matt tracing memo to OBL layer state
     *
     * @param {string} m matt tracing memo, one layer
     * @returns {string} CSP-style OBL layer
     */
    mattToLayer(m) {
        const bw = ['W', 'W', 'w', 'W', 'W', 'w', 'W', 'W', 'w', 'W', 'W', 'w'];
        for (const ch of m) {
            const num = parseInt(ch, 10);
            if (num % 2 !== 0) {
                // corner
                bw[Math.floor(num / 2) * 3] = 'B';
                bw[Math.floor(num / 2) * 3 + 1] = 'B';
            } else {
                // edge
                bw[Math.floor(num / 2) * 3 - 1] = 'b';
            }
        }
        return bw.join('');
    }

    /**
     * mattToNonSpe: converts a full matt tracing memo to non specific OBL name
     *
     * @param {string} m a full matt tracing memo
     * @returns {string} a 2-layer nonspecific OBL name
     */
    mattToNonSpe(m) {
        const [u, d] = m.split(' ');
        return this.speToNonSpe(
            `${this.layerToOBL(this.mattToLayer(u)).obl}/${this.layerToOBL(this.mattToLayer(d)).obl}`
        );
    }

    /**
     * sortOblp: sort one layer of matt tracing OBLP memo
     *
     * @param {string} seq one layer of matt tracing OBLP memo
     * @returns {string} the sorted memo
     */
    sortOblp(seq) {
        return [...seq].sort().join('');
    }

    // =========================================================================
    // SECTION 10: Miscellaneous
    // =========================================================================
    /**
     * getWeight: get the weight factor of a PBL
     *
     * @param {string} pbl the PBL, with slashes and optional barflip sign
     * @returns {number} the weight. some power of 2.
     */
    getWeight(pbl) {
        const [u, d] = pbl.replace(/[+-]$/, '').split("/");
        return (SquanLib.PBLWeights[u] ?? 4) * (SquanLib.PBLWeights[d] ?? 4);
    }

    /**
     * getPLLCaseCount: multiplies the PLLFamilyLen of the top and bottom case
     *
     * @param {string[]} pbl an array of [u, d] that represents a PBL case
     * @returns {number} the case counts in the family that contanis this PBL
     */
    getPLLCaseCount(pbl) {
        return SquanLib.PLLFamilyLen[pbl[0]] * SquanLib.PLLFamilyLen[pbl[1]];
    }
}
