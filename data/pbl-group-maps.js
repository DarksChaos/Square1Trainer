const PBL_CLUSTER_MAP = {
  "bad A/A": [
    "Al/Al",
    "Ar/Ar"
  ],
  "good A/A": [
    "Al/Ar",
    "Ar/Al"
  ],
  "A/E, E/A": [
    "Al/E",
    "Ar/E",
    "E/Al",
    "E/Ar"
  ],
  "A/F, F/A": [
    "Al/F",
    "Ar/F",
    "F/Al",
    "F/Ar"
  ],
  "bad A/Ga, Ga/A": [
    "Al/Gal",
    "Ar/Gar",
    "Gal/Al",
    "Gar/Ar"
  ],
  "good A/Ga, Ga/A": [
    "Al/Gar",
    "Ar/Gal",
    "Gal/Ar",
    "Gar/Al"
  ],
  "bad A/Go, Go/A": [
    "Al/Gol",
    "Ar/Gor",
    "Gol/Al",
    "Gor/Ar"
  ],
  "good A/Go, Go/A": [
    "Al/Gor",
    "Ar/Gol",
    "Gol/Ar",
    "Gor/Al"
  ],
  "A/H, H/A": [
    "Al/H",
    "Ar/H",
    "H/Al",
    "H/Ar"
  ],
  "A/J, J/A": [
    "Al/Ja",
    "Al/Jm",
    "Ar/Ja",
    "Ar/Jm",
    "Ja/Al",
    "Ja/Ar",
    "Jm/Al",
    "Jm/Ar"
  ],
  "A/N, N/A": [
    "Al/Na",
    "Al/Nm",
    "Ar/Na",
    "Ar/Nm",
    "Na/Al",
    "Na/Ar",
    "Nm/Al",
    "Nm/Ar"
  ],
  "Ax/Rx, Rx/Ax": [
    "Al/Rl",
    "Ar/Rr",
    "Rl/Al",
    "Rr/Ar"
  ],
  "Ax/Ry, Rx/Ay": [
    "Al/Rr",
    "Ar/Rl",
    "Rl/Ar",
    "Rr/Al"
  ],
  "A/T, T/A": [
    "Al/T",
    "Ar/T",
    "T/Al",
    "T/Ar"
  ],
  "good A/U, U/A": [
    "Al/Ul",
    "Ar/Ur",
    "Ul/Al",
    "Ur/Ar"
  ],
  "bad A/U, U/A": [
    "Al/Ur",
    "Ar/Ul",
    "Ul/Ar",
    "Ur/Al"
  ],
  "A/V, V/A": [
    "Al/V",
    "Ar/V",
    "V/Al",
    "V/Ar"
  ],
  "A/Y, Y/A": [
    "Al/Y",
    "Ar/Y",
    "Y/Al",
    "Y/Ar"
  ],
  "A/Z, Z/A": [
    "Al/Z",
    "Ar/Z",
    "Z/Al",
    "Z/Ar"
  ],
  "A/-, -/A": [
    "-/Al",
    "-/Ar",
    "Al/-",
    "Ar/-"
  ],
  "E/E": [
    "E/E"
  ],
  "E/F, F/E": [
    "E/F",
    "F/E"
  ],
  "E/Ga, Ga/E": [
    "E/Gal",
    "E/Gar",
    "Gal/E",
    "Gar/E"
  ],
  "E/Go, Go/E": [
    "E/Gol",
    "E/Gor",
    "Gol/E",
    "Gor/E"
  ],
  "E/H, H/E": [
    "E/H",
    "H/E"
  ],
  "E/J, J/E": [
    "E/Ja",
    "E/Jm",
    "Ja/E",
    "Jm/E"
  ],
  "E/N, N/E": [
    "E/Na",
    "E/Nm",
    "Na/E",
    "Nm/E"
  ],
  "E/R, R/E": [
    "E/Rl",
    "E/Rr",
    "Rl/E",
    "Rr/E"
  ],
  "E/T, T/E": [
    "E/T",
    "T/E"
  ],
  "E/U, U/E": [
    "E/Ul",
    "E/Ur",
    "Ul/E",
    "Ur/E"
  ],
  "E/V, V/E": [
    "E/V",
    "V/E"
  ],
  "E/Y, Y/E": [
    "E/Y",
    "Y/E"
  ],
  "E/Z, Z/E": [
    "E/Z",
    "Z/E"
  ],
  "E/-, -/E": [
    "-/E",
    "E/-"
  ],
  "F/F": [
    "F/F"
  ],
  "F/Ga, Ga/F": [
    "F/Gal",
    "F/Gar",
    "Gal/F",
    "Gar/F"
  ],
  "F/Go, Go/F": [
    "F/Gol",
    "F/Gor",
    "Gol/F",
    "Gor/F"
  ],
  "F/H, H/F": [
    "F/H",
    "H/F"
  ],
  "F/J, J/F": [
    "F/Ja",
    "F/Jm",
    "Ja/F",
    "Jm/F"
  ],
  "F/N, N/F": [
    "F/Na",
    "F/Nm",
    "Na/F",
    "Nm/F"
  ],
  "F/R, R/F": [
    "F/Rl",
    "F/Rr",
    "Rl/F",
    "Rr/F"
  ],
  "F/T, T/F": [
    "F/T",
    "T/F"
  ],
  "F/U, U/F": [
    "F/Ul",
    "F/Ur",
    "Ul/F",
    "Ur/F"
  ],
  "F/V, V/F": [
    "F/V",
    "V/F"
  ],
  "F/Y, Y/F": [
    "F/Y",
    "Y/F"
  ],
  "F/Z, Z/F": [
    "F/Z",
    "Z/F"
  ],
  "F/-, -/F": [
    "-/F",
    "F/-"
  ],
  "Gax/Gax": [
    "Gal/Gal",
    "Gar/Gar"
  ],
  "Gax/Gay": [
    "Gal/Gar",
    "Gar/Gal"
  ],
  "Gax/Gox, Gox/Gax": [
    "Gal/Gol",
    "Gar/Gor",
    "Gol/Gal",
    "Gor/Gar"
  ],
  "Gax/Goy, Gox/Gay": [
    "Gal/Gor",
    "Gar/Gol",
    "Gol/Gar",
    "Gor/Gal"
  ],
  "Ga/H, H/Ga": [
    "Gal/H",
    "Gar/H",
    "H/Gal",
    "H/Gar"
  ],
  "Ga/J, J/Ga": [
    "Gal/Ja",
    "Gal/Jm",
    "Gar/Ja",
    "Gar/Jm",
    "Ja/Gal",
    "Ja/Gar",
    "Jm/Gal",
    "Jm/Gar"
  ],
  "bad Ga/N, N/Ga": [
    "Gal/Na",
    "Gar/Nm",
    "Na/Gal",
    "Nm/Gar"
  ],
  "good Ga/N, N/Ga": [
    "Gal/Nm",
    "Gar/Na",
    "Na/Gar",
    "Nm/Gal"
  ],
  "good Ga/R, R/Ga": [
    "Gal/Rl",
    "Gar/Rr",
    "Rl/Gal",
    "Rr/Gar"
  ],
  "bad Ga/R, R/Ga": [
    "Gal/Rr",
    "Gar/Rl",
    "Rl/Gar",
    "Rr/Gal"
  ],
  "Ga/T, T/Ga": [
    "Gal/T",
    "Gar/T",
    "T/Gal",
    "T/Gar"
  ],
  "good Ga/U, U/Ga": [
    "Gal/Ul",
    "Gar/Ur",
    "Ul/Gal",
    "Ur/Gar"
  ],
  "bad Ga/U, U/Ga": [
    "Gal/Ur",
    "Gar/Ul",
    "Ul/Gar",
    "Ur/Gal"
  ],
  "Ga/V, V/Ga": [
    "Gal/V",
    "Gar/V",
    "V/Gal",
    "V/Gar"
  ],
  "Ga/Y, Y/Ga": [
    "Gal/Y",
    "Gar/Y",
    "Y/Gal",
    "Y/Gar"
  ],
  "Ga/Z, Z/Ga": [
    "Gal/Z",
    "Gar/Z",
    "Z/Gal",
    "Z/Gar"
  ],
  "Ga/-, -/Ga": [
    "-/Gal",
    "-/Gar",
    "Gal/-",
    "Gar/-"
  ],
  "Gox/Gox": [
    "Gol/Gol",
    "Gor/Gor"
  ],
  "Gox/Goy": [
    "Gol/Gor",
    "Gor/Gol"
  ],
  "Go/H, H/Go": [
    "Gol/H",
    "Gor/H",
    "H/Gol",
    "H/Gor"
  ],
  "Go/J, J/Go": [
    "Gol/Ja",
    "Gol/Jm",
    "Gor/Ja",
    "Gor/Jm",
    "Ja/Gol",
    "Ja/Gor",
    "Jm/Gol",
    "Jm/Gor"
  ],
  "good Go/N, N/Go": [
    "Gol/Na",
    "Gor/Nm",
    "Na/Gol",
    "Nm/Gor"
  ],
  "bad Go/N, N/Go": [
    "Gol/Nm",
    "Gor/Na",
    "Na/Gor",
    "Nm/Gol"
  ],
  "bad Go/R, R/Go": [
    "Gol/Rl",
    "Gor/Rr",
    "Rl/Gol",
    "Rr/Gor"
  ],
  "good Go/R, R/Go": [
    "Gol/Rr",
    "Gor/Rl",
    "Rl/Gor",
    "Rr/Gol"
  ],
  "Go/T, T/Go": [
    "Gol/T",
    "Gor/T",
    "T/Gol",
    "T/Gor"
  ],
  "good Go/U, U/Go": [
    "Gol/Ul",
    "Gor/Ur",
    "Ul/Gol",
    "Ur/Gor"
  ],
  "bad Go/U, U/Go": [
    "Gol/Ur",
    "Gor/Ul",
    "Ul/Gor",
    "Ur/Gol"
  ],
  "Go/V, V/Go": [
    "Gol/V",
    "Gor/V",
    "V/Gol",
    "V/Gor"
  ],
  "Go/Y, Y/Go": [
    "Gol/Y",
    "Gor/Y",
    "Y/Gol",
    "Y/Gor"
  ],
  "Go/Z, Z/Go": [
    "Gol/Z",
    "Gor/Z",
    "Z/Gol",
    "Z/Gor"
  ],
  "Go/-, -/Go": [
    "-/Gol",
    "-/Gor",
    "Gol/-",
    "Gor/-"
  ],
  "H/H": [
    "H/H"
  ],
  "H/J, J/H": [
    "H/Ja",
    "H/Jm",
    "Ja/H",
    "Jm/H"
  ],
  "H/N, N/H": [
    "H/Na",
    "H/Nm",
    "Na/H",
    "Nm/H"
  ],
  "H/R, R/H": [
    "H/Rl",
    "H/Rr",
    "Rl/H",
    "Rr/H"
  ],
  "H/T, T/H": [
    "H/T",
    "T/H"
  ],
  "H/U, U/H": [
    "H/Ul",
    "H/Ur",
    "Ul/H",
    "Ur/H"
  ],
  "H/V, V/H": [
    "H/V",
    "V/H"
  ],
  "H/Y, Y/H": [
    "H/Y",
    "Y/H"
  ],
  "H/Z, Z/H": [
    "H/Z",
    "Z/H"
  ],
  "H/-, -/H": [
    "-/H",
    "H/-"
  ],
  "J/J": [
    "Ja/Ja",
    "Ja/Jm",
    "Jm/Ja",
    "Jm/Jm"
  ],
  "J/N, N/J": [
    "Ja/Na",
    "Ja/Nm",
    "Jm/Na",
    "Jm/Nm",
    "Na/Ja",
    "Na/Jm",
    "Nm/Ja",
    "Nm/Jm"
  ],
  "J/R, R/J": [
    "Ja/Rl",
    "Ja/Rr",
    "Jm/Rl",
    "Jm/Rr",
    "Rl/Ja",
    "Rl/Jm",
    "Rr/Ja",
    "Rr/Jm"
  ],
  "J/T, T/J": [
    "Ja/T",
    "Jm/T",
    "T/Ja",
    "T/Jm"
  ],
  "J/U, U/J": [
    "Ja/Ul",
    "Ja/Ur",
    "Jm/Ul",
    "Jm/Ur",
    "Ul/Ja",
    "Ul/Jm",
    "Ur/Ja",
    "Ur/Jm"
  ],
  "J/V, V/J": [
    "Ja/V",
    "Jm/V",
    "V/Ja",
    "V/Jm"
  ],
  "J/Y, Y/J": [
    "Ja/Y",
    "Jm/Y",
    "Y/Ja",
    "Y/Jm"
  ],
  "J/Z, Z/J": [
    "Ja/Z",
    "Jm/Z",
    "Z/Ja",
    "Z/Jm"
  ],
  "J/-, -/J": [
    "-/Ja",
    "-/Jm",
    "Ja/-",
    "Jm/-"
  ],
  "N/N": [
    "Na/Na",
    "Na/Nm",
    "Nm/Na",
    "Nm/Nm"
  ],
  "good N/R, R/N": [
    "Na/Rl",
    "Nm/Rr",
    "Rl/Na",
    "Rr/Nm"
  ],
  "bad N/R, R/N": [
    "Na/Rr",
    "Nm/Rl",
    "Rl/Nm",
    "Rr/Na"
  ],
  "N/T, T/N": [
    "Na/T",
    "Nm/T",
    "T/Na",
    "T/Nm"
  ],
  "N/U, U/N": [
    "Na/Ul",
    "Na/Ur",
    "Nm/Ul",
    "Nm/Ur",
    "Ul/Na",
    "Ul/Nm",
    "Ur/Na",
    "Ur/Nm"
  ],
  "N/V, V/N": [
    "Na/V",
    "Nm/V",
    "V/Na",
    "V/Nm"
  ],
  "N/Y, Y/N": [
    "Na/Y",
    "Nm/Y",
    "Y/Na",
    "Y/Nm"
  ],
  "N/Z, Z/N": [
    "Na/Z",
    "Nm/Z",
    "Z/Na",
    "Z/Nm"
  ],
  "N/-. -/N": [
    "-/Na",
    "-/Nm",
    "Na/-",
    "Nm/-"
  ],
  "bad R/R": [
    "Rl/Rl",
    "Rr/Rr"
  ],
  "good R/R": [
    "Rl/Rr",
    "Rr/Rl"
  ],
  "R/T, T/R": [
    "Rl/T",
    "Rr/T",
    "T/Rl",
    "T/Rr"
  ],
  "R/U, U/R": [
    "Rl/Ul",
    "Rl/Ur",
    "Rr/Ul",
    "Rr/Ur",
    "Ul/Rl",
    "Ul/Rr",
    "Ur/Rl",
    "Ur/Rr"
  ],
  "R/V, V/R": [
    "Rl/V",
    "Rr/V",
    "V/Rl",
    "V/Rr"
  ],
  "R/Y, Y/R": [
    "Rl/Y",
    "Rr/Y",
    "Y/Rl",
    "Y/Rr"
  ],
  "R/Z, Z/R": [
    "Rl/Z",
    "Rr/Z",
    "Z/Rl",
    "Z/Rr"
  ],
  "R/-, -/R": [
    "-/Rl",
    "-/Rr",
    "Rl/-",
    "Rr/-"
  ],
  "T/T": [
    "T/T"
  ],
  "T/U, U/T": [
    "T/Ul",
    "T/Ur",
    "Ul/T",
    "Ur/T"
  ],
  "T/V, V/T": [
    "T/V",
    "V/T"
  ],
  "T/Y, Y/T": [
    "T/Y",
    "Y/T"
  ],
  "T/Z, Z/T": [
    "T/Z",
    "Z/T"
  ],
  "T/-, -/T": [
    "-/T",
    "T/-"
  ],
  "bad U/U": [
    "Ul/Ul",
    "Ur/Ur"
  ],
  "good U/U": [
    "Ul/Ur",
    "Ur/Ul"
  ],
  "U/V, V/U": [
    "Ul/V",
    "Ur/V",
    "V/Ul",
    "V/Ur"
  ],
  "U/Y, Y/U": [
    "Ul/Y",
    "Ur/Y",
    "Y/Ul",
    "Y/Ur"
  ],
  "U/Z, Z/U": [
    "Ul/Z",
    "Ur/Z",
    "Z/Ul",
    "Z/Ur"
  ],
  "U/-, -/U": [
    "-/Ul",
    "-/Ur",
    "Ul/-",
    "Ur/-"
  ],
  "No Parity PBL Menu": [
    "V/V"
  ],
  "V/Y, Y/V": [
    "V/Y",
    "Y/V"
  ],
  "V/Z, Z/V": [
    "V/Z",
    "Z/V"
  ],
  "V/-, -/V": [
    "-/V",
    "V/-"
  ],
  "Y/Y": [
    "Y/Y"
  ],
  "Y/Z, Z/Y": [
    "Y/Z",
    "Z/Y"
  ],
  "Y/-, -/Y": [
    "-/Y",
    "Y/-"
  ],
  "Z/Z": [
    "Z/Z"
  ],
  "Z/-, -/Z": [
    "-/Z",
    "Z/-"
  ],
  "-/-": [
    "-/-"
  ],
  "Adj/Adj": [
    "Adj/Adj"
  ],
  "Adj/B, B/Adj": [
    "Adj/Ba",
    "Adj/Bm",
    "Ba/Adj",
    "Bm/Adj"
  ],
  "Adj/C, C/Adj": [
    "Adj/Cl",
    "Adj/Cr",
    "Cl/Adj",
    "Cr/Adj"
  ],
  "Adj/D, D/Adj": [
    "Adj/Da",
    "Adj/Dm",
    "Da/Adj",
    "Dm/Adj"
  ],
  "Adj/K, K/Adj": [
    "Adj/Ka",
    "Adj/Km",
    "Ka/Adj",
    "Km/Adj"
  ],
  "Adj/M, M/Adj": [
    "Adj/M",
    "M/Adj"
  ],
  "Adj/O, O/Adj": [
    "Adj/Ol",
    "Adj/Or",
    "Ol/Adj",
    "Or/Adj"
  ],
  "Adj/Opp, Opp/Adj": [
    "Adj/Opp",
    "Opp/Adj"
  ],
  "Adj/P, P/Adj": [
    "Adj/Pl",
    "Adj/Pr",
    "Pl/Adj",
    "Pr/Adj"
  ],
  "Adj/pJ, pJ/Adj": [
    "Adj/pJ",
    "pJ/Adj"
  ],
  "Adj/pN, pN/Adj": [
    "Adj/pN",
    "pN/Adj"
  ],
  "Adj/Q, Q/Adj": [
    "Adj/Q",
    "Q/Adj"
  ],
  "Adj/S, S/Adj": [
    "Adj/Sa",
    "Adj/Sm",
    "Sa/Adj",
    "Sm/Adj"
  ],
  "Adj/W, W/Adj": [
    "Adj/W",
    "W/Adj"
  ],
  "Adj/X, X/Adj": [
    "Adj/X",
    "X/Adj"
  ],
  "bad B/B": [
    "Ba/Ba",
    "Bm/Bm"
  ],
  "good B/B": [
    "Ba/Bm",
    "Bm/Ba"
  ],
  "bad B/C, C/B": [
    "Ba/Cl",
    "Bm/Cr",
    "Cl/Ba",
    "Cr/Bm"
  ],
  "good B/C, C/B": [
    "Ba/Cr",
    "Bm/Cl",
    "Cl/Bm",
    "Cr/Ba"
  ],
  "good B/D, D/B": [
    "Ba/Da",
    "Bm/Dm",
    "Da/Ba",
    "Dm/Bm"
  ],
  "bad B/D, D/B": [
    "Ba/Dm",
    "Bm/Da",
    "Da/Bm",
    "Dm/Ba"
  ],
  "bad B/K, K/B": [
    "Ba/Ka",
    "Bm/Km",
    "Ka/Ba",
    "Km/Bm"
  ],
  "good B/K, K/B": [
    "Ba/Km",
    "Bm/Ka",
    "Ka/Bm",
    "Km/Ba"
  ],
  "B/M, M/B": [
    "Ba/M",
    "Bm/M",
    "M/Ba",
    "M/Bm"
  ],
  "good B/O, O/B": [
    "Ba/Ol",
    "Bm/Or",
    "Ol/Ba",
    "Or/Bm"
  ],
  "bad B/O, O/B": [
    "Ba/Or",
    "Bm/Ol",
    "Ol/Bm",
    "Or/Ba"
  ],
  "B/Opp, Opp/B": [
    "Ba/Opp",
    "Bm/Opp",
    "Opp/Ba",
    "Opp/Bm"
  ],
  "good B/P, P/B": [
    "Ba/Pl",
    "Bm/Pr",
    "Pl/Ba",
    "Pr/Bm"
  ],
  "bad B/P, P/B": [
    "Ba/Pr",
    "Bm/Pl",
    "Pl/Bm",
    "Pr/Ba"
  ],
  "B/pJ, pJ/B": [
    "Ba/pJ",
    "Bm/pJ",
    "pJ/Ba",
    "pJ/Bm"
  ],
  "B/pN, pN/B": [
    "Ba/pN",
    "Bm/pN",
    "pN/Ba",
    "pN/Bm"
  ],
  "B/Q, Q/B": [
    "Ba/Q",
    "Bm/Q",
    "Q/Ba",
    "Q/Bm"
  ],
  "bad B/S, S/B": [
    "Ba/Sa",
    "Bm/Sm",
    "Sa/Ba",
    "Sm/Bm"
  ],
  "good B/S, S/B": [
    "Ba/Sm",
    "Bm/Sa",
    "Sa/Bm",
    "Sm/Ba"
  ],
  "B/W, W/B": [
    "Ba/W",
    "Bm/W",
    "W/Ba",
    "W/Bm"
  ],
  "B/X, X/B": [
    "Ba/X",
    "Bm/X",
    "X/Ba",
    "X/Bm"
  ],
  "bad C/C": [
    "Cl/Cl",
    "Cr/Cr"
  ],
  "good C/C": [
    "Cl/Cr",
    "Cr/Cl"
  ],
  "good C/D, D/C": [
    "Cl/Da",
    "Cr/Dm",
    "Da/Cl",
    "Dm/Cr"
  ],
  "bad C/D, D/C": [
    "Cl/Dm",
    "Cr/Da",
    "Da/Cr",
    "Dm/Cl"
  ],
  "good C/K, K/C": [
    "Cl/Ka",
    "Cr/Km",
    "Ka/Cl",
    "Km/Cr"
  ],
  "bad C/K, K/C": [
    "Cl/Km",
    "Cr/Ka",
    "Ka/Cr",
    "Km/Cl"
  ],
  "C/M, M/C": [
    "Cl/M",
    "Cr/M",
    "M/Cl",
    "M/Cr"
  ],
  "bad C/O, O/C": [
    "Cl/Ol",
    "Cr/Or",
    "Ol/Cl",
    "Or/Cr"
  ],
  "good C/O, O/C": [
    "Cl/Or",
    "Cr/Ol",
    "Ol/Cr",
    "Or/Cl"
  ],
  "C/Opp, Opp/C": [
    "Cl/Opp",
    "Cr/Opp",
    "Opp/Cl",
    "Opp/Cr"
  ],
  "good C/P, P/C": [
    "Cl/Pl",
    "Cr/Pr",
    "Pl/Cl",
    "Pr/Cr"
  ],
  "bad C/P, P/C": [
    "Cl/Pr",
    "Cr/Pl",
    "Pl/Cr",
    "Pr/Cl"
  ],
  "C/pJ, pJ/C": [
    "Cl/pJ",
    "Cr/pJ",
    "pJ/Cl",
    "pJ/Cr"
  ],
  "C/pN, pN/C": [
    "Cl/pN",
    "Cr/pN",
    "pN/Cl",
    "pN/Cr"
  ],
  "C/Q, Q/C": [
    "Cl/Q",
    "Cr/Q",
    "Q/Cl",
    "Q/Cr"
  ],
  "bad C/S, S/C": [
    "Cl/Sa",
    "Cr/Sm",
    "Sa/Cl",
    "Sm/Cr"
  ],
  "good C/S, S/C": [
    "Cl/Sm",
    "Cr/Sa",
    "Sa/Cr",
    "Sm/Cl"
  ],
  "C/W, W/C": [
    "Cl/W",
    "Cr/W",
    "W/Cl",
    "W/Cr"
  ],
  "C/X, X/C": [
    "Cl/X",
    "Cr/X",
    "X/Cl",
    "X/Cr"
  ],
  "bad D/D": [
    "Da/Da",
    "Dm/Dm"
  ],
  "good D/D": [
    "Da/Dm",
    "Dm/Da"
  ],
  "bad D/K, K/D": [
    "Da/Ka",
    "Dm/Km",
    "Ka/Da",
    "Km/Dm"
  ],
  "good D/K, K/D": [
    "Da/Km",
    "Dm/Ka",
    "Ka/Dm",
    "Km/Da"
  ],
  "D/M, M/D": [
    "Da/M",
    "Dm/M",
    "M/Da",
    "M/Dm"
  ],
  "bad D/O, O/D": [
    "Da/Ol",
    "Dm/Or",
    "Ol/Da",
    "Or/Dm"
  ],
  "good D/O, O/D": [
    "Da/Or",
    "Dm/Ol",
    "Ol/Dm",
    "Or/Da"
  ],
  "D/Opp, Opp/D": [
    "Da/Opp",
    "Dm/Opp",
    "Opp/Da",
    "Opp/Dm"
  ],
  "bad D/P, P/D": [
    "Da/Pl",
    "Dm/Pr",
    "Pl/Da",
    "Pr/Dm"
  ],
  "good D/P, P/D": [
    "Da/Pr",
    "Dm/Pl",
    "Pl/Dm",
    "Pr/Da"
  ],
  "D/pJ, pJ/D": [
    "Da/pJ",
    "Dm/pJ",
    "pJ/Da",
    "pJ/Dm"
  ],
  "D/pN, pN/D": [
    "Da/pN",
    "Dm/pN",
    "pN/Da",
    "pN/Dm"
  ],
  "D/Q, Q/D": [
    "Da/Q",
    "Dm/Q",
    "Q/Da",
    "Q/Dm"
  ],
  "bad D/S, S/D": [
    "Da/Sa",
    "Dm/Sm",
    "Sa/Da",
    "Sm/Dm"
  ],
  "good D/S, S/D": [
    "Da/Sm",
    "Dm/Sa",
    "Sa/Dm",
    "Sm/Da"
  ],
  "D/W, W/D": [
    "Da/W",
    "Dm/W",
    "W/Da",
    "W/Dm"
  ],
  "D/X, X/D": [
    "Da/X",
    "Dm/X",
    "X/Da",
    "X/Dm"
  ],
  "bad K/K": [
    "Ka/Ka",
    "Km/Km"
  ],
  "good K/K": [
    "Ka/Km",
    "Km/Ka"
  ],
  "K/M, M/K": [
    "Ka/M",
    "Km/M",
    "M/Ka",
    "M/Km"
  ],
  "bad K/O, O/K": [
    "Ka/Ol",
    "Km/Or",
    "Ol/Ka",
    "Or/Km"
  ],
  "good K/O, O/K": [
    "Ka/Or",
    "Km/Ol",
    "Ol/Km",
    "Or/Ka"
  ],
  "K/Opp, Opp/K": [
    "Ka/Opp",
    "Km/Opp",
    "Opp/Ka",
    "Opp/Km"
  ],
  "K/P, P/K": [
    "Ka/Pl",
    "Ka/Pr",
    "Km/Pl",
    "Km/Pr",
    "Pl/Ka",
    "Pl/Km",
    "Pr/Ka",
    "Pr/Km"
  ],
  "K/pJ, pJ/K": [
    "Ka/pJ",
    "Km/pJ",
    "pJ/Ka",
    "pJ/Km"
  ],
  "K/pN, pN/K": [
    "Ka/pN",
    "Km/pN",
    "pN/Ka",
    "pN/Km"
  ],
  "K/Q, Q/K": [
    "Ka/Q",
    "Km/Q",
    "Q/Ka",
    "Q/Km"
  ],
  "bad K/S, S/K": [
    "Ka/Sa",
    "Km/Sm",
    "Sa/Ka",
    "Sm/Km"
  ],
  "good K/S, S/K": [
    "Ka/Sm",
    "Km/Sa",
    "Sa/Km",
    "Sm/Ka"
  ],
  "K/W, W/K": [
    "Ka/W",
    "Km/W",
    "W/Ka",
    "W/Km"
  ],
  "K/X, X/K": [
    "Ka/X",
    "Km/X",
    "X/Ka",
    "X/Km"
  ],
  "Double Parity PBL Menu": [
    "M/M"
  ],
  "M/O, O/M": [
    "M/Ol",
    "M/Or",
    "Ol/M",
    "Or/M"
  ],
  "M/Opp, Opp/M": [
    "M/Opp",
    "Opp/M"
  ],
  "M/P, P/M": [
    "M/Pl",
    "M/Pr",
    "Pl/M",
    "Pr/M"
  ],
  "M/pJ, pJ/M": [
    "M/pJ",
    "pJ/M"
  ],
  "M/pN, pN/M": [
    "M/pN",
    "pN/M"
  ],
  "M/Q, Q/M": [
    "M/Q",
    "Q/M"
  ],
  "M/S, S/M": [
    "M/Sa",
    "M/Sm",
    "Sa/M",
    "Sm/M"
  ],
  "M/W, W/M": [
    "M/W",
    "W/M"
  ],
  "M/X, X/M": [
    "M/X",
    "X/M"
  ],
  "bad O/O": [
    "Ol/Ol",
    "Or/Or"
  ],
  "good O/O": [
    "Ol/Or",
    "Or/Ol"
  ],
  "O/Opp, Opp/O": [
    "Ol/Opp",
    "Opp/Ol",
    "Opp/Or",
    "Or/Opp"
  ],
  "good O/P, P/O": [
    "Ol/Pl",
    "Or/Pr",
    "Pl/Ol",
    "Pr/Or"
  ],
  "bad O/P, P/O": [
    "Ol/Pr",
    "Or/Pl",
    "Pl/Or",
    "Pr/Ol"
  ],
  "O/pJ, pJ/O": [
    "Ol/pJ",
    "Or/pJ",
    "pJ/Ol",
    "pJ/Or"
  ],
  "O/pN, pN/O": [
    "Ol/pN",
    "Or/pN",
    "pN/Ol",
    "pN/Or"
  ],
  "O/Q, Q/O": [
    "Ol/Q",
    "Or/Q",
    "Q/Ol",
    "Q/Or"
  ],
  "bad O/S, S/O": [
    "Ol/Sa",
    "Or/Sm",
    "Sa/Ol",
    "Sm/Or"
  ],
  "good O/S, S/O": [
    "Ol/Sm",
    "Or/Sa",
    "Sa/Or",
    "Sm/Ol"
  ],
  "O/W, W/O": [
    "Ol/W",
    "Or/W",
    "W/Ol",
    "W/Or"
  ],
  "O/X, X/O": [
    "Ol/X",
    "Or/X",
    "X/Ol",
    "X/Or"
  ],
  "Opp/Opp": [
    "Opp/Opp"
  ],
  "Opp/P, P/Opp": [
    "Opp/Pl",
    "Opp/Pr",
    "Pl/Opp",
    "Pr/Opp"
  ],
  "Opp/pJ, pJ/Opp": [
    "Opp/pJ",
    "pJ/Opp"
  ],
  "Opp/pN, pN/Opp": [
    "Opp/pN",
    "pN/Opp"
  ],
  "Opp/Q, Q/Opp": [
    "Opp/Q",
    "Q/Opp"
  ],
  "Opp/S, S/Opp": [
    "Opp/Sa",
    "Opp/Sm",
    "Sa/Opp",
    "Sm/Opp"
  ],
  "Opp/W, W/Opp": [
    "Opp/W",
    "W/Opp"
  ],
  "Opp/X, X/Opp": [
    "Opp/X",
    "X/Opp"
  ],
  "bad P/P": [
    "Pl/Pl",
    "Pr/Pr"
  ],
  "good P/P": [
    "Pl/Pr",
    "Pr/Pl"
  ],
  "P/pJ, pJ/P": [
    "Pl/pJ",
    "Pr/pJ",
    "pJ/Pl",
    "pJ/Pr"
  ],
  "P/pN, pN/P": [
    "Pl/pN",
    "Pr/pN",
    "pN/Pl",
    "pN/Pr"
  ],
  "P/Q, Q/P": [
    "Pl/Q",
    "Pr/Q",
    "Q/Pl",
    "Q/Pr"
  ],
  "P/S, S/P": [
    "Pl/Sa",
    "Pl/Sm",
    "Pr/Sa",
    "Pr/Sm",
    "Sa/Pl",
    "Sa/Pr",
    "Sm/Pl",
    "Sm/Pr"
  ],
  "P/W, W/P": [
    "Pl/W",
    "Pr/W",
    "W/Pl",
    "W/Pr"
  ],
  "P/X, X/P": [
    "Pl/X",
    "Pr/X",
    "X/Pl",
    "X/Pr"
  ],
  "pJ/pJ": [
    "pJ/pJ"
  ],
  "pJ/pN, pN/pJ": [
    "pJ/pN",
    "pN/pJ"
  ],
  "pJ/Q, Q/pJ": [
    "Q/pJ",
    "pJ/Q"
  ],
  "pJ/S, S/pJ": [
    "Sa/pJ",
    "Sm/pJ",
    "pJ/Sa",
    "pJ/Sm"
  ],
  "pJ/W, W/pJ": [
    "W/pJ",
    "pJ/W"
  ],
  "pJ/X, X/pJ": [
    "X/pJ",
    "pJ/X"
  ],
  "pN/pN": [
    "pN/pN"
  ],
  "pN/Q, Q/pN": [
    "Q/pN",
    "pN/Q"
  ],
  "pN/S, S/pN": [
    "Sa/pN",
    "Sm/pN",
    "pN/Sa",
    "pN/Sm"
  ],
  "pN/W, W/pN": [
    "W/pN",
    "pN/W"
  ],
  "pN/X, X/pN": [
    "X/pN",
    "pN/X"
  ],
  "Q/Q": [
    "Q/Q"
  ],
  "Q/S, S/Q": [
    "Q/Sa",
    "Q/Sm",
    "Sa/Q",
    "Sm/Q"
  ],
  "Q/W, W/Q": [
    "Q/W",
    "W/Q"
  ],
  "Q/X, X/Q": [
    "Q/X",
    "X/Q"
  ],
  "bad S/S": [
    "Sa/Sa",
    "Sm/Sm"
  ],
  "good S/S": [
    "Sa/Sm",
    "Sm/Sa"
  ],
  "S/W, W/S": [
    "Sa/W",
    "Sm/W",
    "W/Sa",
    "W/Sm"
  ],
  "S/X, X/S": [
    "Sa/X",
    "Sm/X",
    "X/Sa",
    "X/Sm"
  ],
  "W/W": [
    "W/W"
  ],
  "W/X, X/W": [
    "W/X",
    "X/W"
  ],
  "X/X": [
    "X/X"
  ]
};
