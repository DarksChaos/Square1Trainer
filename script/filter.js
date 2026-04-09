// ============================================================================
// PBL FILTER & SEARCH
// Depends on: pblPossible, pblName(), CP_Adj_PLL, CP_Opp_PLL, CP_Solved_PLL
//             weight, PLLextndlen (for freq filter)
// ============================================================================

// ============================================================================
// BASE FILTER (existing logic, unchanged)
// ============================================================================

function isPll(pll, filter) {
    const special = ["opp", "adj", "pn", "pj"];
    if (special.includes(pll)) return filter == pll;
    return pll.startsWith(filter);
}

// Returns true if pbl matches filter text (no suffix)
// pbl: ["Al", "T"], filter: raw string
function passesBaseFilter(pbl, filter) {
    let u = pbl[0].toLowerCase();
    let d = pbl[1].toLowerCase();
    filter = filter.replace("/", " ").toLowerCase().trim();
    if (!filter) return true;
    if (filter.includes(" ")) {
        let arr = filter.match(/[^ ]+/g);
        if (arr != null) {
            arr = arr.slice(0, 2);
            let [a, b] = arr;
            if (a && b) {
                return (isPll(u, a) && isPll(d, b)) || (isPll(u, b) && isPll(d, a));
            }
            filter = a;
        }
    }
    return isPll(u, filter) || isPll(d, filter);
}

// freq filter: returns set of pbl names matching freq, or null if not a freq filter
function getFreqSet(filterStr) {
    if (filterStr.slice(0, 4).toLowerCase() !== "freq") return null;
    const freqStr = filterStr.slice(4).trim();
    const validFreqs = ["1", "2", "4", "8", "16", "32", "64", "128", "256"];
    const result = new Set();
    if (!validFreqs.includes(freqStr)) return result; // empty = hide all
    const freq = parseInt(freqStr, 10);
    for (let pbl of pblPossible) {
        const n = pblName(pbl);
        if (pblGetWeight(n) * pblGetCaseCount(pbl) === freq) result.add(n);
    }
    return result;
}

// ============================================================================
// SUFFIX SYSTEM
// ============================================================================

// CP lookup: maps PLL name -> "a" | "o" | "s"
const CP_MAP = (() => {
    const m = {};
    for (let p of CP_Adj_PLL) m[p] = "a";
    for (let p of CP_Opp_PLL) m[p] = "o";
    for (let p of CP_Solved_PLL) m[p] = "s";
    return m;
})();

// All suffix definitions. To add a new suffix:
// add an entry here. evaluate(pbl, context) returns bool.
// context = { baseTerms: string[] } (parsed base filter words, for order-aware suffixes)
const SUFFIX_DEFS = {};

// Order suffix
SUFFIX_DEFS["o"] = {
    evaluate(pbl, ctx) {
        if (!ctx.baseTerms.length) return true;
        const [t1] = ctx.baseTerms;
        return isPll(pbl[0].toLowerCase(), t1.toLowerCase());
    }
};

// CP pair suffixes: aa, ao, as, oa, oo, os, sa, so, ss
for (let x of ["a", "o", "s"]) {
    for (let y of ["a", "o", "s"]) {
        const cx = x, cy = y;
        SUFFIX_DEFS[`${x}${y}`] = {
            evaluate(pbl) { return CP_MAP[pbl[0]] === cx && CP_MAP[pbl[1]] === cy; }
        };
    }
}

// ============================================================================
// SUFFIX EXPRESSION PARSER + EVALUATOR
// ============================================================================

// Tokenizer: splits "<ao>*(!<o>&<ss>)" into tokens
function tokenizeSuffixExpr(expr) {
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
        if (expr[i] === " ") { i++; continue; }
        if (expr[i] === "<") {
            const end = expr.indexOf(">", i);
            if (end === -1) {
                const partial = expr.slice(i + 1).trim();
                if (/[<>&*!()]/.test(partial)) throw new Error("Unclosed <");
                // push any leading ! as separate not-operators, then the tag
                let j = 0;
                while (partial[j] === "!") { tokens.push({ type: "op", value: "!" }); j++; }
                tokens.push({ type: "tag", value: partial.slice(j) });
                break;
            }
            const inner = expr.slice(i + 1, end);
            let j = 0;
            while (inner[j] === "!") { tokens.push({ type: "op", value: "!" }); j++; }
            tokens.push({ type: "tag", value: inner.slice(j) });
            i = end + 1;
        } else if (expr[i] === "(") {
            tokens.push({ type: "lparen" }); i++;
        } else if (expr[i] === ")") {
            tokens.push({ type: "rparen" }); i++;
        } else if (expr[i] === "*") {
            tokens.push({ type: "op", value: "*" }); i++;
        } else if (expr[i] === "&") {
            tokens.push({ type: "op", value: "&" }); i++;
        } else if (expr[i] === "!") {
            tokens.push({ type: "op", value: "!" }); i++;
        } else {
            i++;
        }
    }
    return tokens;
}

// Recursive descent parser: precedence ! > * > &
// Returns a function: (pbl, ctx) => bool
function parseSuffixExpr(tokens) {
    let pos = 0;

    function parseExpr() { return parseUnion(); }

    function parseUnion() {
        let left = parseIntersect();
        while (pos < tokens.length && tokens[pos].type === "op" && tokens[pos].value === "&") {
            pos++;
            const right = parseIntersect();
            const l = left, r = right;
            left = (pbl, ctx) => l(pbl, ctx) || r(pbl, ctx);
        }
        return left;
    }

    function parseIntersect() {
        let left = parseNot();
        while (pos < tokens.length && tokens[pos].type === "op" && tokens[pos].value === "*") {
            pos++;
            const right = parseNot();
            const l = left, r = right;
            left = (pbl, ctx) => l(pbl, ctx) && r(pbl, ctx);
        }
        return left;
    }

    function parseNot() {
        if (pos < tokens.length && tokens[pos].type === "op" && tokens[pos].value === "!") {
            pos++;
            const inner = parseNot();
            return (pbl, ctx) => !inner(pbl, ctx);
        }
        return parseAtom();
    }

    function parseAtom() {
        if (pos >= tokens.length) throw new Error("Unexpected end of suffix expression");
        const tok = tokens[pos];
        if (tok.type === "lparen") {
            pos++;
            const inner = parseExpr();
            if (pos >= tokens.length || tokens[pos].type !== "rparen")
                throw new Error("Missing closing )");
            pos++;
            return inner;
        }
        if (tok.type === "tag") {
            pos++;
            const def = SUFFIX_DEFS[tok.value];
            if (!def) throw new Error(`Unknown suffix: <${tok.value}>`);
            return (pbl, ctx) => def.evaluate(pbl, ctx);
        }
        throw new Error(`Unexpected token: ${JSON.stringify(tok)}`);
    }

    const fn = parseExpr();
    return fn;
}

// ============================================================================
// MAIN FILTER ENTRY POINT
// ============================================================================

// Splits raw input into base text and suffix expression string
// e.g. "T/Al <o>*<aa>" -> { base: "T/Al", suffixExpr: "<o>*<aa>" }
function splitInput(raw) {
    const suffixStart = raw.search(/<[a-z!]+>/);
    // find where suffix expression begins (first < that starts a tag or operator block)
    // Actually: find first < character
    const lt = raw.indexOf("<");
    if (lt === -1) return { base: raw.trim(), suffixExpr: "" };
    return { base: raw.slice(0, lt).trim(), suffixExpr: raw.slice(lt).trim() };
}

// Parse base filter terms (words) for context
function parseBaseTerms(base) {
    const cleaned = base.replace("/", " ").toLowerCase().trim();
    return cleaned ? cleaned.match(/[^ ]+/g) || [] : [];
}

// Main: given raw filter string, returns Set of pblNames that pass
function getFilteredSet(raw) {
    raw = raw.trim();
    const result = new Set();

    // Freq filter takes full precedence
    const freqSet = getFreqSet(raw);
    if (freqSet !== null) return freqSet;

    const { base, suffixExpr } = splitInput(raw);
    const baseTerms = parseBaseTerms(base);

    // Build context for suffix evaluation
    const ctx = { baseTerms };

    // Parse suffix expression if present
    let suffixFn = null;
    if (suffixExpr) {
        try {
            const tokens = tokenizeSuffixExpr(suffixExpr);
            if (tokens.length > 0) suffixFn = parseSuffixExpr(tokens);
        } catch (e) {
            console.warn("Suffix parse error:", e.message);
        }
    }

    for (let pbl of pblPossible) {
        const passesBase = passesBaseFilter(pbl, base);
        const passesSuffix = suffixFn ? suffixFn(pbl, ctx) : true;
        if (passesBase && passesSuffix) result.add(pblName(pbl));
    }

    return result;
}

// ============================================================================
// APPLY FILTER TO DOM
// ============================================================================

function applyFilter(raw) {
    const visible = getFilteredSet(raw);
    for (let pbl of pblPossible) {
        const n = pblName(pbl);
        if (visible.has(n)) pblShow(n);
        else pblHide(n);
    }
    updateSelCount();
}
