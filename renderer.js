// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { startChess, connectDgtBoard } = require("dgtchess/index");

const unicodePieces = {
  K: "\u2654",
  Q: "\u2655",
  R: "\u2656",
  B: "\u2657",
  N: "\u2658",
  P: "\u2659",
  k: "\u265A",
  q: "\u265B",
  r: "\u265C",
  b: "\u265D",
  n: "\u265E",
  p: "\u265F"
};

const updateBoard = (raw, prev) => {
  const board = document.getElementById("board");
  const html = [];

  let rSqColor;
  let cSqColor;
  let piece;
  let pieceColor = "";
  let ix = 0;
  for (let rx = 0; rx < 8; rx++) {
    rSqColor = rSqColor !== "white" ? "white" : "gray";
    cSqColor = rSqColor;
    for (let cx = 0; cx < 8; cx++, ix++) {
      const ap = raw[ix];
      piece = ap;

      if (prev) {
        const bp = prev[ix];
        pieceColor = "";
        if (bp !== ap) {
          if (ap !== ".") {
            pieceColor = " green";
          } else {
            piece = bp;
            pieceColor = " magenta";
          }
        }
      }

      html.push(`<div class="${cSqColor} square${pieceColor}">`);
      if (piece !== ".") {
        html.push(unicodePieces[piece]);
      }
      html.push(`</div>`);
      cSqColor = cSqColor !== "white" ? "white" : "gray";
    }
  }

  board.innerHTML = html.join("");
};

async function start() {
  const board = await connectDgtBoard();
  updateBoard(board.toString());
  const game = await startChess(board);
  const onChanged = () => {
    updateBoard(game._board.toString());
  };

  game.on("wait-start", onChanged);

  game.on("ready", () => {
    const raw = game._chess.toString();
    document.getElementById("status").innerText = game.turnColor + " turn";
    updateBoard(raw);
  });

  game.on("player-moved", () => {
    const raw = game._chess.toString();
    document.getElementById("status").innerText = game.turnColor + " turn";
    updateBoard(raw);
  });

  game.on("waiting-board-sync", ({ move, beforeRaw }) => {
    document.getElementById("status").innerText =
      "SAN: " + move.san + " position " + move.from + "-> " + move.to;
    updateBoard(game._chess.toString(), beforeRaw);
  });
}

start();
