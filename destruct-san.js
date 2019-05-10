const CHECKS = {
  "#": "checkmate",
  "+": "check"
};

function destruct_san(san) {
  // check # or + for checkmate or check
  const len = san.length;
  const x = san[len - 1];
  const check = CHECKS[x];
  if (check) {
    san = san.substr(0, len - 1);
  }

  if (san === "O-O" || san === "O-O-O") {
    return { castling: san, check };
  }

  let promotion;

  const promotions = san.split("=");

  if (promotions.length > 1) {
    promotion = promotions[1];
    san = promotions[0];
  }

  let capture;
  let to;

  let disambiguator;
  const captures = san.split("x");
  if (captures.length > 1) {
    to = capture = captures[1];
    san = captures[0];
  }

  let piece;

  const p = san[0];
  if (p === p.toUpperCase()) {
    piece = p.toLowerCase();
    san = san.substr(1);
    if (!to) {
      if (san.length === 2) {
        to = san;
      } else {
        disambiguator = san[0];
        to = san.substr(1);
      }
    } else if (san.length > 0) {
      disambiguator = san;
    }
  } else {
    piece = "p"; // pawn
    if (!to) {
      to = san;
    }
  }

  return {
    piece,
    disambiguator,
    capture,
    to,
    promotion,
    check
  };
}

module.exports = destruct_san;
