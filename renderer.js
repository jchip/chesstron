// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const startChess = require("dgtchess/index");

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

const updateBoard = raw => {
  const board = document.getElementById("board");
  const html = [];

  let rSqColor;
  let cSqColor;
  let ix = 0;
  for (let rx = 0; rx < 8; rx++) {
    rSqColor = rSqColor !== "white" ? "white" : "gray";
    cSqColor = rSqColor;
    for (let cx = 0; cx < 8; cx++, ix++) {
      html.push(`<div class="${cSqColor} square">`);
      if (raw[ix] !== ".") {
        html.push(unicodePieces[raw[ix]]);
      }
      html.push(`</div>`);
      cSqColor = cSqColor !== "white" ? "white" : "gray";
    }
  }

  board.innerHTML = html.join("");
};

async function start() {
  const game = await startChess();
  game.on("ready", () => {
    const raw = game._board.toString();
    updateBoard(raw);
  });

  game._board.on("changed", () => {
    updateBoard(game._board.toString());
  });
}

start();
