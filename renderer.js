"use strict";

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { startChess, connectDgtBoard } = require("dgt-board/index");
const utils = require("dgt-board/lib/utils");
const _ = require("lodash");
const { ipcRenderer } = require("electron");
const personas = require("./lib/personas");
const DB = require("./lib/db");

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
  const board = document.getElementById("chess-board");
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
      } else {
        html.push("&nbsp;");
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

  getInitFen() {
    const initFen = localStorage.getItem(this._id);
    return initFen === "startpos" ? utils.defaultFen : initFen;
  }

  getInitFenPos() {
    return localStorage.getItem(this._id);
  }

  getMoves() {
    return localStorage.getItem(this._moveKey);
  }

  clear() {
    localStorage.removeItem(this._id);
    localStorage.removeItem(this._moveKey);
  }
}

function leaveProfile() {
  document.getElementById("user-profile").style.display = "none";
  document.getElementById("game-container").style.display = "block";
}

function showProfile() {
  const x = localStorage.getItem("profile");
  if (x) {
    const profile = JSON.parse(x);
    $("#profileFirstname").val(profile.firstName);
    $("#profileLastname").val(profile.lastName);
    $("#profileRating").val(profile.rating);
    $("#profileCity").val(profile.city);
    $("#profileState").val(profile.state);
    $("#profileZip").val(profile.zip);
    $("#favOpen").val(profile.favOpen);
    $("#favGM").val(profile.favGM);
    $("#coachName").val(profile.coachName);
  }

  document.getElementById("user-profile").style.display = "block";
  document.getElementById("game-container").style.display = "none";
}

async function start() {
  let adjustSizeTimer;
  let boardSz = 0;

  const adjustBoardSize = () => {
    const boardElem = $("#chess-board");
    const sz = boardElem.width();
    if (sz !== boardSz) {
      boardElem.css("font-size", `${Math.floor(sz / 8) - 4}px`);
      boardSz = sz;
      console.log("board size", sz);
      boardElem.height(sz);
      const rank = $("#board-rank");
      const rankFileFontSize = `${Math.floor(sz / 20)}px`;
      rank.height(sz);
      rank.css("font-size", rankFileFontSize);
      $("#board-file").css("font-size", rankFileFontSize);
      $("#board-container").css("opacity", "1");
      $("#play-info").css("font-size", `${Math.floor(sz / 30)}px`);
    }
  };

  $(window).resize(() => {
    clearTimeout(adjustSizeTimer);
    adjustSizeTimer = setTimeout(adjustBoardSize, 20);
  });

  adjustBoardSize();

  let profile = JSON.parse(localStorage.getItem("profile") || "{}");
  $("#leaveProfile").click(leaveProfile);
  $("#saveProfile").click(saveProfile);
  const personaName = localStorage.getItem("persona") || "mickey";
  let persona = switchPersona(personaName);

  ipcRenderer.on("edit-profile", showProfile);

  const setVsBanner = () => {
    const playerName = [profile.firstName, profile.lastName].filter(x => x).join(" ") || "player";
    const personaName = [persona.firstName, persona.lastName].filter(x => x).join(" ") || "???";
    document.getElementById("vs-banner").innerHTML = `${playerName} vs. ${personaName}`;
  };

  setVsBanner();

  const db = await DB.initialize();
  const board = await connectDgtBoard();

  function saveProfile() {
    const firstName = $("#profileFirstname").val();
    const lastName = $("#profileLastname").val();
    const rating = $("#profileRating").val();
    const city = $("#profileCity").val();
    const state = $("#profileState").val();
    const zip = $("#profileZip").val();
    const favOpen = $("#favOpen").val();
    const favGM = $("#favGM").val();
    const coachName = $("#coachName").val();
    const bgu = ["boy", "girl", "unknown"];
    const sex = [
      $("#radioBoy")[0].checked,
      $("#radioGirl")[0].checked,
      $("#radioUnknown")[0].checked
    ]
      .map((x, ix) => x && bgu[ix])
      .filter(x => x)[0];

    profile = {
      firstName,
      lastName,
      rating,
      city,
      state,
      zip,
      sex,
      favOpen,
      favGM,
      coachName
    };
    localStorage.setItem("profile", JSON.stringify(profile));
    setVsBanner();
    leaveProfile();
  }

  let statusMessages;
  let currentStatus;
  let illegal;
  let game = null;
  let gameSaver;
  let gameType = "Tournament";

  const setBanner = banner => {
    document.getElementById("game-banner").innerHTML = banner;
  };

  setInterval(() => {
    if (statusMessages) {
      if (currentStatus !== statusMessages) {
        currentStatus = statusMessages;
        document.getElementById("status").innerHTML = currentStatus;
      }
      statusMessages = undefined;
    }
  }, 100);

  const setStatus = status => {
    statusMessages = status;
  };

  const onChanged = positions => {
    updateBoard(game.getBoardRaw(), null, positions.wantRaw);
  };

  let audioPlaying = false;
  let lastPlayed;

  const showTurn = raw => {
    raw = raw || game.getGameRaw();
    setStatus(game.turnColor + " turn");
    updateBoard(raw);
  };

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

  const clearIllegalForBoardChanged = () => {
    if (illegal) {
      illegal = undefined;
      showTurn();
    }
  };

  const newGame = async (banner, reset) => {
    gameType = banner;
    setBanner(banner);
    setVsBanner();

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

    board.removeAllListeners();

    game = await startChess(game, board, {
      allowTakeback,
      blackInfo: {
        firstName: persona.firstName,
        lastName: persona.lastName,
        rating: "???"
      },
      whiteInfo: profile,
      startFen: gameSaver.getInitFen(),
      moves: gameSaver.getMoves()
    });

    setStatus("waiting for board ready");

    onChanged({ wantRaw: utils.fenToRaw(game._startFen) });
    board.on("changed", clearIllegalForBoardChanged);
  };

  await newGame("Tournament", false);

  ipcRenderer.on("switch-persona", (event, name) => {
    if (persona.name !== name) {
      console.log("changing persona to", name);
      persona = switchPersona(name);
      playAudio(_.get(persona, "sounds.greeting"), persona.assetDir, true);
      newGame(gameType, false);
      setVsBanner();
    }
  });

  game.on("wait-start", onChanged);

  game.on("take-back-wait-board-ready", ({ boardRaw, wantRaw }) => {
    updateBoard(boardRaw, null, wantRaw);
    setStatus("waiting for take back");
  });

  game.on("ready", () => {
    const readySound = _.get(persona, "actions.ready.sound");
    if (readySound) {
      const groupId = readySound.groupId || "sounds";
      playAudio(persona.sounds[groupId], persona.assetDir, readySound.id);
    }
    showTurn();
  });

  game.on("board-ready", ({ boardRaw }) => showTurn(boardRaw));

  game.on("player-moved", ({ player, move }) => {
    gameSaver.updateMove(move.san);
    if (game.turnColor === "black") {
      playAudio(_.get(persona, "sounds.moveChat"), persona.assetDir);
    }
    showTurn();
  });

  game.on("waiting-board-sync", ({ move, beforeRaw }) => {
    setStatus(
      `<span class="text-red-dark font-bold">${move.san}</span>
position <span class="text-green"> ${move.from} \u2192 ${move.to} </span>`
    );
    updateBoard(game.getGameRaw(), beforeRaw);
  });

  game.on("board-not-sync-change", () => {
    playAudio(_.get(persona, "sounds.illegalMove"), persona.assetDir, true);
  });

  game.on("game-over", async result => {
    setStatus(`Gameover, ${result.result}`);
    const black = game.getPlayer("black");
    const white = game.getPlayer("white");

    let bpt = 5;
    let wpt = 5;

    if (result.winner) {
      bpt = result.winner === "black" ? 10 : 0;
      wpt = result.winner === "white" ? 10 : 0;
    }
    await db.add("games", {
      type: gameType,
      date: Math.floor(Date.now() / 1000),
      fen: gameSaver.getInitFenPos(),
      moves: gameSaver.getMoves(),
      black: {
        name: black.name,
        point: bpt
      },
      white: {
        name: white.name,
        point: wpt
      }
    });
    gameSaver.clear();
  });

  game.on("illegal-move", ({ move, color }) => {
    if (color === "white") {
      illegal = { move, color };
      playAudio(_.get(persona, "sounds.illegalMove"), persona.assetDir, true);
      setStatus(`${color}: \
<span class="text-red">illegal move </span>\
<span class="text-green"> ${move.from} \u2192 ${move.to} </span>`);
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
