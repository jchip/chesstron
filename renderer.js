"use strict";

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { startChess, connectDgtBoard } = require("dgt-board/index");
const utils = require("dgt-board/lib/utils");
const _ = require("lodash");
const { ipcRenderer } = require("electron");
const personas = require("./lib/personas");

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

function switchPersona(personaName) {
  const persona = personas.change(personaName);
  const avatarPath = `assets/${persona.assetDir}/${persona.images.default}`;
  document.getElementById("opponent-avatar").innerHTML = `<img src="${avatarPath}" />`;
  if (localStorage.getItem("persona") !== personaName) {
    localStorage.setItem("persona", personaName);
  }
  return persona;
}

class GameSaver {
  constructor({ reset, persona, player, game, type }) {
    this._persona = persona;
    this._player = player;
    this._game = game;

    this._id = `${persona.name}-vs-player-${type}`;
    this._moveKey = `${this._id}-moves`;
    const exist = localStorage.getItem(this._id);
    if (reset || !exist) {
      const initFen = (game && game._initFen) || utils.defaultFen;
      localStorage.setItem(this._id, utils.isStartPos(initFen) ? "startpos" : initFen);
      localStorage.setItem(this._moveKey, "");
    }
  }

  updateMove(move) {
    const moves = localStorage[this._moveKey].split(" ").filter(x => x);
    moves.push(move);
    localStorage.setItem(this._moveKey, moves.join(" "));
  }

  initFen() {
    const initFen = localStorage.getItem(this._id);
    return initFen === "startpos" ? utils.defaultFen : initFen;
  }

  moves() {
    return localStorage.getItem(this._moveKey);
  }
}

async function start() {
  const personaName = localStorage.getItem("persona") || "mickey";
  let persona = switchPersona(personaName);

  const board = await connectDgtBoard();

  let game = null;
  let gameSaver;
  let gameType = "Tournament";

  const setBanner = banner => {
    document.getElementById("game-banner").innerHTML = banner;
  };

  const setStatus = status => {
    document.getElementById("status").innerText = status;
  };

  const onChanged = positions => {
    updateBoard(game._board.toString(), null, positions.wantRaw);
  };

  const newGame = async (banner, reset) => {
    gameType = banner;
    setBanner(banner);

    if (game) {
      await game.reset();
    }

    gameSaver = new GameSaver({
      reset,
      persona,
      player: {},
      game,
      type: gameType.toLowerCase()
    });

    const allowTakeback = banner === "Tournament" ? false : true;

    game = await startChess(game, board, {
      allowTakeback,
      startFen: gameSaver.initFen(),
      moves: gameSaver.moves()
    });

    setStatus("waiting for board ready");

    onChanged({ wantRaw: utils.fenToRaw(game._startFen) });
  };

  await newGame("Tournament", false);

  ipcRenderer.on("switch-persona", (event, name) => {
    if (persona.name !== name) {
      console.log("changing persona to", name);
      persona = switchPersona(name);
      newGame(gameType, false);
    }
  });

  game.on("wait-start", onChanged);

  game.on("take-back-wait-board-ready", ({ boardRaw, wantRaw }) => {
    updateBoard(boardRaw, null, wantRaw);
    document.getElementById("status").innerText = "waiting for take back";
  });

  let audioPlaying = false;
  let lastPlayed;

  const playAudio = (sounds, folder, force, triggerProb = 35) => {
    const scaler = 100;
    const shouldPlay = Math.random() * 100 * scaler;
    const low = Math.floor((scaler * (100 - (triggerProb || 0))) / 2);
    const high = low + triggerProb * scaler;
    if (!audioPlaying && (force || (shouldPlay >= low && shouldPlay < high))) {
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
    const readySound = _.get(persona, "actions.ready.sound");
    if (readySound) {
      const groupId = readySound.groupId || "sounds";
      playAudio(persona[groupId], persona.assetDir, readySound.id);
    }
    showTurn();
  });

  game.on("board-ready", ({ boardRaw }) => showTurn(boardRaw));

  game.on("player-moved", ({ player, move }) => {
    gameSaver.updateMove(move.san);
    if (game.turnColor === "black") {
      playAudio(persona.sounds, persona.assetDir);
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
    playAudio(persona.illegalMoveSounds, persona.assetDir, true);
  });

  game.on("game-over", ({ result }) => {
    document.getElementById("status").innerHTML = result;
  });

  let illegal;

  game.on("illegal-move", ({ move, color }) => {
    if (color === "white") {
      illegal = { move, color };
      playAudio(persona.illegalMoveSounds, persona.assetDir, true);
      document.getElementById("status").innerHTML = `${color}: \
<span class="text-red">illegal move </span>\
<span class="text-green"> ${move.from} \u2192 ${move.to} </span>`;
    }
  });

  game._board.on("changed", () => {
    if (illegal) {
      illegal = undefined;
      showTurn();
    }
  });

  document.getElementById("new-tournament").addEventListener("click", async () => {
    console.log("new tournament");
    await game.reset();
    await newGame("Tournament", true);
  });

  document.getElementById("new-tutorial").addEventListener("click", async () => {
    console.log("new tournament");
    await game.reset();
    await newGame("Training", true);
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
