const evenPLL = ["-", "Al", "Ar", "E", "F", "Gal", "Gar", "Gol", "Gor", "H", "Ja", "Jm", "Na", "Nm", "Rl", "Rr", "T", "Ul", "Ur", "V", "Y", "Z"];
const oddPLL = ["Adj", "Opp", "pJ", "pN", "Ba", "Bm", "Cl", "Cr", "Da", "Dm", "Ka", "Km", "M", "Ol", "Or", "Pl", "Pr", "Q", "Sa", "Sm", "W", "X"];
const CP_Adj_PLL = ["Al", "Ar", "F", "Gal", "Gar", "Gol", "Gor", "Ja", "Jm", "Rl", "Rr", "T", "pJ", "Ba", "Bm", "Cl", "Cr", "Da", "Dm", "Ka", "Km", "M", "Pl", "Pr"];
const CP_Opp_PLL = ["E", "Na", "Nm", "V", "Y", "pN", "Q", "Sa", "Sm", "X"];
const CP_Solved_PLL = ["-", "H", "Ul", "Ur", "Z", "Adj", "Opp", "Ol", "Or", "W"];

const weight = {
    "-": 1, E: 2, H: 1, Na: 1, Nm: 1, Opp: 2,
    Ol: 1, Or: 1, pN: 2, Q: 1, X: 1, Z: 2,
};

const PLLextndlen = {
    "-": 1, Al: 2, Ar: 2, E: 1, F: 1, Gal: 4, Gar: 4, Gol: 4, Gor: 4,
    H: 1, Ja: 2, Jm: 2, Na: 2, Nm: 2, Rl: 2, Rr: 2, T: 1, Ul: 2, Ur: 2,
    V: 1, Y: 1, Z: 1, Adj: 1, Opp: 1, pJ: 1, pN: 1, Ba: 2, Bm: 2, Cl: 2,
    Cr: 2, Da: 2, Dm: 2, Ka: 2, Km: 2, M: 1, Ol: 2, Or: 2, Pl: 2, Pr: 2,
    Q: 1, Sa: 2, Sm: 2, W: 1, X: 1
};