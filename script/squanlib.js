// Square-1 utilities used by Unified Trainer.
export default class SquanLib {
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

    static get HALF_L() { return 6; }

    static get LAYERL() { return 12; }

    static get THREE_FOUR_L() { return 18; }

    static get CUBEL() { return 24; }

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

    static evenPLL = [
            "-", "Al", "Ar", "E", "F", "Gal", "Gar", "Gol", "Gor", "H", "Ja", "Jm",
            "Na", "Nm", "Rl", "Rr", "T", "Ul", "Ur", "V", "Y", "Z"
        ];

    static oddPLL = [
            "Adj", "Opp", "pJ", "pN", "Ba", "Bm", "Cl", "Cr", "Da", "Dm",
            "Ka", "Km", "M", "Ol", "Or", "Pl", "Pr", "Q", "Sa", "Sm", "W", "X"
        ];

    static CPAdjPLL = ["Al", "Ar", "F", "Gal", "Gar", "Gol", "Gor", "Ja", "Jm", "Rl", "Rr", "T", "pJ", "Ba", "Bm", "Cl", "Cr", "Da", "Dm", "Ka", "Km", "M", "Pl", "Pr"];

    static CPOppPLL = ["E", "Na", "Nm", "V", "Y", "pN", "Q", "Sa", "Sm", "X"];

    static CPSolvedPLL = ["-", "H", "Ul", "Ur", "Z", "Adj", "Opp", "Ol", "Or", "W"];

    static PBLWeights = {
            "-": 1, E: 2, H: 1, Na: 1, Nm: 1, Opp: 2,
            Ol: 1, Or: 1, pN: 2, Q: 1, X: 1, Z: 2,
        };

    static PLLFamily = ["-", "Adj", "pJ", "pN", "Opp"];

    static PLLFamilyLen = {
            "-": 1, Al: 2, Ar: 2, E: 1, F: 1, Gal: 2, Gar: 2, Gol: 2, Gor: 2,
            H: 1, Ja: 2, Jm: 2, Na: 2, Nm: 2, Rl: 2, Rr: 2, T: 1, Ul: 2, Ur: 2,
            V: 1, Y: 1, Z: 1, Adj: 1, Opp: 1, pJ: 1, pN: 1, Ba: 2, Bm: 2, Cl: 2,
            Cr: 2, Da: 2, Dm: 2, Ka: 2, Km: 2, M: 1, Ol: 2, Or: 2, Pl: 2, Pr: 2,
            Q: 1, Sa: 2, Sm: 2, W: 1, X: 1
        };

    static OBLWeights = {
            "-": 1, V: 2, F: 2, Q: 1, N: 2,
        };

    constructor(tempReplacements = { "meow :3": "meow :3" }) {
            // place to put manual unkarnifications
            this.tempReplacements = { ...tempReplacements };
        }

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

    isKarn(str) {
            return /[b-zB-Z]/.test(str);
        }

    getAlignmentMove(topA, bottomA) {
            return (topA ? '1' : '0') + (bottomA ? '-1' : '0');
        }

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

    legalMove(m) {
            m = m % 12; // get a range from -11 to 11
            if (m < -5) return m + 12; // send -11 to -6 up
            if (m > 6) return m - 12; // send 7 to 11 down
            return m;
        }

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

    changesAlignment(m) {
            return m % 3 !== 0;
        }

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

    layerFlip(state) {
            const layerFlipMap = { 'b': 'w', 'B': 'W', 'w': 'b', 'W': 'B' };
            return [...state].map(c => {
                if (c in layerFlipMap) return layerFlipMap[c];
                throw new Error("layerFlip: unrecognized character: " + c)
            }).join('');
        }

    shift(a, amount) {
            amount = ((-amount % a.length) + a.length) % a.length;
            return a.slice(amount) + a.slice(0, amount);
        }

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

    stateToMatt(s) {
            let u = s.slice(0, SquanLib.LAYERL), d = s.slice(SquanLib.LAYERL);
            u = (u[0] !== u[0].toLowerCase()) ? this.shift(u, 3) : this.shift(u, 2);
            d = (d[0] !== d[0].toLowerCase()) ? this.shift(d, 3) : this.shift(d, 2);
            let mem = '';
            let p = 1;
            for (let x = 0; x < SquanLib.LAYERL; x += 3) {
                if (u[x] === 'B') mem += p;
                if (u[x + 2] === 'b') mem += (p + 1);
                p += 2;
            }
            mem = (mem === '') ? '- ' : mem + ' ';
            p = 1;
            for (let x = 0; x < SquanLib.LAYERL; x += 3) {
                if (d[x] === 'B') mem += p;
                if (d[x + 2] === 'b') mem += (p + 1);
                p += 2;
            }
            return (mem[mem.length - 1] === ' ') ? mem + '-' : mem;
        }

    getPBLWeight(pbl) {
            const [u, d] = pbl.replace(/(?<!\/)[+-]$/, '').split("/");
            return (SquanLib.PBLWeights[u] ?? 4) * (SquanLib.PBLWeights[d] ?? 4);
        }

    getPBLCaseCount(pbl) {
            return SquanLib.PLLFamilyLen[pbl[0]] * SquanLib.PLLFamilyLen[pbl[1]];
        }

    getPBLFamily(pbl) {
            const [u, d] = pbl.replace(/(?<!\/)[+-]$/, '').split("/");
            function getPLLFamily(pll) {
                if (SquanLib.PLLFamily.includes(pll)) return pll;
                else if (pll.charAt(0) === "G") return pll.slice(0,2); // Ga or Go
                else return pll.match(/[A-Z]/g)?.join(''); // the uppercase portion
            }
            return getPLLFamily(u) + "/" + getPLLFamily(d);
        }

    getOBLWeight(obl) {
            const [u, d] = obl.split("/");
            return (SquanLib.OBLWeights[u.match(/[A-Z]/g)?.join('')] ?? 4) *
                (SquanLib.OBLWeights[d.match(/[A-Z]/g)?.join('')] ?? 4);
        }
}
