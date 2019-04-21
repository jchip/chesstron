// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { startChess, connectDgtBoard } = require("dgt-board/index");
const utils = require("dgt-board/lib/utils");

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

const updateBoard = (raw, prev, expected) => {
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
      } else if (expected) {
        const ep = expected[ix];
        pieceColor = "";
        if (ep !== ap) {
          if (ep !== ".") {
            piece = ep;
            pieceColor = " green";
          } else {
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

const tweetyIllegalMoveSounds = {
  "bad old putty cat": "tweety03.mp3",
  "bombs away": "tweety37.mp3",
  "bad old putty cat2": "tweety07.mp3"
};

const tweetySounds = {
  "he got away": "tweety09.mp3",
  "I wonder what that putty cat up to now": "tweety11.mp3",
  "I tawt I taw a putty cat": "tweety13.mp3",
  "A surprise for me": "tweety14.mp3",
  "What you doin up there": "tweety15.mp3"
};

async function start() {
  const board = await connectDgtBoard();

  let game;

  game = await startChess(null, board);
  const onChanged = positions => {
    updateBoard(game._board.toString(), null, positions.wantRaw);
  };

  game.on("wait-start", onChanged);

  game.on("take-back-wait-board-ready", ({ boardRaw, wantRaw }) => {
    updateBoard(boardRaw, null, wantRaw);
    document.getElementById("status").innerText = "waiting for take back";
  });

  onChanged({ wantRaw: utils.fenToRaw(game._startFen) });

  let audioPlaying = false;
  let lastPlayed;

  const playAudio = (sounds, folder, force) => {
    const shouldPlay = Math.random() * 100;
    if (!audioPlaying && (force || shouldPlay >= 35)) {
      let name;
      if (typeof force === "string") {
        name = force;
      } else {
        const keys = Object.keys(sounds);
        do {
          const ix = Math.floor(Math.random() * keys.length);
          name = keys[ix];
        } while (keys.length > 1 && lastPlayed === name);
        lastPlayed = name;
      }
      const sound = sounds[name];
      const audio = new Audio(`assets/${folder}/audio/${sound}`);
      audioPlaying = true;
      audio.play();
      audio.onended = () => {
        audioPlaying = false;
      };
    }
  };

  const showTurn = raw => {
    raw = raw || game._chess.toString();
    document.getElementById("status").innerText = game.turnColor + " turn";
    updateBoard(raw);
  };

  game.on("ready", () => {
    playAudio(tweetySounds, "tweety", "I tawt I taw a putty cat");
    showTurn();
  });

  game.on("board-ready", ({ boardRaw }) => showTurn(boardRaw));

  game.on("player-moved", () => {
    if (game.turnColor === "black") {
      playAudio(tweetySounds, "tweety");
    }
    showTurn();
  });

  game.on("waiting-board-sync", ({ move, beforeRaw }) => {
    document.getElementById("status").innerHTML =
      `<span class="text-red-dark font-bold">${move.san}</span>` +
      ` position <span class="text-green"> ${move.from} \u2192 ${move.to} </span>`;
    updateBoard(game._chess.toString(), beforeRaw);
  });

  game.on("board-not-sync-change", () => {
    playAudio(tweetyIllegalMoveSounds, "tweety", true);
  });

  game.on("game-over", ({ result }) => {
    document.getElementById("status").innerHTML = result;
  });

  game.on("illegal-move", ({ move, color }) => {
    playAudio(tweetyIllegalMoveSounds, "tweety", true);
    document.getElementById("status").innerHTML = `${color}: \
<span class="text-red">illegal move </span>\
<span class="text-green"> ${move.from} \u2192 ${move.to} </span>`;
  });

  const setBanner = banner => {
    document.getElementById("game-banner").innerHTML = banner;
  };

  document.getElementById("new-tournament").addEventListener("click", async () => {
    console.log("new tournament");
    await game.reset();
    setBanner("Tournament");
    await startChess(game, board, { allowTakeback: false });
  });

  document.getElementById("new-tutorial").addEventListener("click", async () => {
    console.log("new tournament");
    await game.reset();
    setBanner("Training");

    await startChess(game, board, { allowTakeback: true });
  });

  document.addEventListener("keyup", e => {
    if (e.key === "Backspace") {
      if (game.turnColor === "white" && game._players && game._players.black.allowTakeback()) {
        game.takeBack();
      }
    }
  });
}

start();
