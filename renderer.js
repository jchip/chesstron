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
const destructSan = require("./destruct-san");

const pieceLetterMap = {
  p: "pawn",
  r: "rook",
  n: "knight",
  b: "bishop",
  q: "queen",
  k: "king"
};

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
        html.push("\u2800");
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
    localStorage.setItem("persona", persona.name);
  }
  return persona;
}

function showWelcome(activeName) {
  const activePer = activeName ? personas.get(activeName) : null;
  const htmls = personas.allIds().map((id, ix) => {
    const per = personas.get(id);
    const active = (activePer ? per.name === activePer.name : ix === 0) ? " active" : "";
    return `<div class="carousel-item${active}">
<img class="d-block persona-image"
  src="assets/${per.assetDir}/${per.images.default}"
  alt="${per.name}" />
<div class="carousel-caption d-none d-md-block">
  <h5>${per.firstName} ${per.lastName}</h5>
</div>
</div>`;
  });
  document.getElementById("carousel-inner").innerHTML = htmls.join("\n");
  switchDisplay(MAIN_DISPLAYS, "welcome");
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

  undo(undoMoves) {
    const saveMoves = localStorage[this._moveKey].split(" ").filter(x => x);
    const last = _.last(saveMoves);
    let count = undoMoves.length;
    if (last.startsWith("undo")) {
      count += parseInt(last.split("_")[1], 10);
      saveMoves.pop();
    }
    saveMoves.push(`undo_${count}`);
    localStorage.setItem(this._moveKey, saveMoves.join(" "));
  }
}

const MAIN_DISPLAYS = ["welcome", "user-profile", "game-container"];

const DISPLAY_HISTORY = [];

function switchDisplay(all, active) {
  if (!active) {
    DISPLAY_HISTORY.pop();
    active = DISPLAY_HISTORY.pop() || all[0];
  }
  if (_.last(DISPLAY_HISTORY) !== active) {
    DISPLAY_HISTORY.push(active);
  }
  all.forEach(id => {
    document.getElementById(id).style.display = id === active ? "block" : "none";
  });
}

function leaveProfile() {
  switchDisplay(MAIN_DISPLAYS);
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

  switchDisplay(MAIN_DISPLAYS, "user-profile");
}

function showGame() {
  switchDisplay(MAIN_DISPLAYS, "game-container");
}

const MOVE_SOUNDS = require("./sounds2.json");

async function start() {
  const savePersonaName = localStorage.getItem("persona") || "mickey";
  let persona = switchPersona(savePersonaName);
  showWelcome(savePersonaName);

  let adjustSizeTimer;
  let boardSz = 0;

  const adjustBoardSize = () => {
    const boardElem = $("#chess-board");
    const sz = boardElem.width();
    if (sz !== boardSz) {
      boardElem.css("font-size", `${Math.floor(sz / 8) - 4}px`);
      boardSz = sz;
      boardElem.height(sz);
      const rank = $("#board-rank");
      const rankFileFontSize = `${Math.floor(sz / 20)}px`;
      rank.height(sz);
      rank.css("font-size", rankFileFontSize);
      $("#stat-info").height(sz);
      $("#board-file").css("font-size", rankFileFontSize);
      $("#board-container").css("opacity", "1");
      $("#play-info").css("font-size", `${Math.floor(sz / 30)}px`);
    }
  };

  $(window).resize(() => {
    clearTimeout(adjustSizeTimer);
    adjustSizeTimer = setTimeout(adjustBoardSize, 20);
  });

  // adjustBoardSize();

  let profile = JSON.parse(localStorage.getItem("profile") || "{}");
  $("#leaveProfile").click(leaveProfile);
  $("#saveProfile").click(saveProfile);

  ipcRenderer.on("edit-profile", showProfile);

  const setVsBanner = () => {
    const playerName = [profile.firstName, profile.lastName].filter(x => x).join(" ") || "player";
    const personaName = [persona.firstName, persona.lastName].filter(x => x).join(" ") || "???";
    document.getElementById("vs-banner").innerHTML = `${playerName} vs. ${personaName}`;
  };

  const setExitButton = action => {
    document.getElementById("game-exit-action").innerText = action || "Exit";
  };

  // setVsBanner();

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
  let gameType = localStorage.getItem(`${persona.name}-game-type`) || "Tournament";
  let boardReady = false;
  let audioPlaying = false;

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

  const showTurn = raw => {
    raw = raw || game.getGameRaw();
    setStatus(game.turnColor + " turn");
    if (game.turnColor === "white") {
      playAudio(MOVE_SOUNDS, "sound/English", `${game.turnColor}move`, true);
    }
    updateBoard(raw);
  };

  let audioPlayQueue = [];

  const playAudio = (sounds, folder, force, wait = true, triggerProb = 35) => {
    if (
      wait !== "NoQueue" &&
      (audioPlaying || (audioPlayQueue.length > 0 && wait !== "dequeued"))
    ) {
      // console.log("queueing audio", folder, force, wait, triggerProb);
      return wait && audioPlayQueue.push([sounds, folder, force, "dequeued", triggerProb]);
    }

    if (!force) {
      const scaler = 100;
      const shouldPlay = Math.random() * 100 * scaler;
      const low = Math.floor((scaler * (100 - (triggerProb || 0))) / 2);
      const high = low + triggerProb * scaler;
      // console.log("play audio", force, wait, triggerProb, low, shouldPlay, high);
      if (shouldPlay < low || shouldPlay > high) {
        return;
      }
    }

    let name;
    if (typeof force === "string") {
      name = force;
    } else if (Array.isArray(force)) {
      name = force.shift();
    } else {
      const keys = Object.keys(sounds);
      const ix = Math.floor(Math.random() * keys.length);
      name = keys[ix];
    }
    const sound = sounds[name];
    const folder2 = !folder.startsWith("sound/") ? `${folder}/audio` : folder;
    const audio = new Audio(`assets/${folder2}/${sound}`);
    audioPlaying = true;
    audio.play();
    const ended = _.once(() => {
      // console.log("playing audio ended");
      audioPlaying = false;
      if (Array.isArray(force) && force.length > 0) {
        // console.log("next audio", force);
        playAudio(sounds, folder, force, "NoQueue", triggerProb);
      } else if (audioPlayQueue.length > 0) {
        // console.log("dequeue audio");
        playAudio(...audioPlayQueue.shift());
      } else {
        // console.log("no more audio");
      }
    });

    audio.onended = ended;
    audio.onabort = ended;
    audio.oncancel = ended;
    audio.onerror = ended;
  };

  const clearIllegalForBoardChanged = () => {
    if (illegal) {
      illegal = undefined;
      showTurn();
    }
  };

  const updateClockDisplay = (color, totalTime) => {
    const elemId = `${color}-time`;
    const clockElem = document.getElementById(elemId);

    const totalSeconds = totalTime / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds - minutes * 60);
    const minStr = minutes.toString().padStart(2, "0");
    const secStr = seconds.toString().padStart(2, "0");
    const dispStr = `${minStr}:${secStr}`;
    clockElem.innerText = dispStr;
  };

  const updatePlayerClock = () => {
    setTimeout(updatePlayerClock, 100);

    if (!game || !boardReady) return;

    const player = game.getPlayer(game.turnColor);
    if (!player) return;

    const remainTime = player.getRemainingTime();
    const runningTime = player.getTurnRunningTime();
    if (!remainTime || !runningTime) return;

    updateClockDisplay(game.turnColor, remainTime - runningTime);
  };

  const newGame = async (banner, reset) => {
    console.log(`new ${banner} game`);
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

    const whiteTotalTime = 60 * 1000 * 60;
    const blackTotalTime = 60 * 1000 * 60;

    const gameInst = await startChess(game, board, {
      allowTakeback,
      blackInfo: {
        firstName: persona.firstName,
        lastName: persona.lastName,
        rating: "???",
        totalTime: blackTotalTime
      },
      whiteInfo: Object.assign(
        {
          totalTime: whiteTotalTime
        },
        profile
      ),
      startFen: gameSaver.getInitFen(),
      moves: gameSaver.getMoves()
    });

    if (!game) {
      initializeGameEvents(gameInst);
      game = gameInst;
    }

    setExitButton();
    setStatus("waiting for board ready");
    localStorage.setItem(`${persona.name}-game-type`, gameType);

    onChanged({ wantRaw: utils.fenToRaw(game._startFen) });
    board.on("changed", clearIllegalForBoardChanged);
    updateClockDisplay("black", blackTotalTime);
    updateClockDisplay("white", whiteTotalTime);
    setTimeout(updatePlayerClock, 100);
    setTimeout(adjustBoardSize, 1);
  };

  // await newGame(gameType, false);

  // showWelcome(savePersonaName);

  ipcRenderer.on("switch-persona", (event, name) => {
    if (persona.name !== name) {
      console.log("changing persona to", name);
      persona = switchPersona(name);
      playAudio(_.get(persona, "sounds.greeting"), persona.assetDir, true);
      newGame(gameType, false);
      setVsBanner();
    }
  });

  const saveGameResult = async result => {
    const black = game.getPlayer("black");
    const white = game.getPlayer("white");

    if (!black || !white) {
      return;
    }

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
      result: result.result,
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
  };

  const initializeGameEvents = gameInst => {
    gameInst.on("wait-start", onChanged);

    gameInst.on("take-back-wait-board-ready", ({ boardRaw, wantRaw }) => {
      updateBoard(boardRaw, null, wantRaw);
      setStatus("waiting for take back");
    });

    gameInst.on("take-back", ({ moves }) => {
      gameSaver.undo(moves);
    });

    gameInst.on("ready", () => {
      boardReady = true;
      setExitButton("Resign");

      const readySound = _.get(persona, "actions.ready.sound");
      if (readySound) {
        const groupId = readySound.groupId || "sounds";
        playAudio(persona.sounds[groupId], persona.assetDir, readySound.id, true);
      }
      showTurn();
    });

    gameInst.on("board-ready", ({ boardRaw }) => {
      console.log("board-ready");
      boardReady = true;
      showTurn(boardRaw);
    });

    gameInst.on("board-synced", () => {
      console.log("board-synced");
      boardReady = true;
    });

    gameInst.on("player-moved", ({ player, move, interrupted }) => {
      updateClockDisplay(player.color, player.getRemainingTime());
      gameSaver.updateMove(move.san);

      if (!interrupted) {
        if (gameInst.turnColor === "black") {
          playAudio(_.get(persona, "sounds.moveChat"), persona.assetDir, false, true);
        }
        showTurn();
      }
    });

    gameInst.on("waiting-board-sync", ({ move, beforeRaw }) => {
      setStatus(
        `<span class="text-red-dark font-weight-bold">${move.san}</span>
position <span class="magenta"> ${move.from} </span> \u2192
<span class="text-green"> ${move.to} </span>`
      );
      if (move.color === "b") {
        const detailMove = destructSan(move.san);
        if (detailMove.castling) {
          playAudio(
            MOVE_SOUNDS,
            "sound/English",
            [detailMove.castling.toLowerCase(), detailMove.check].filter(x => x),
            true
          );
        } else {
          const { piece, disambiguator, capture, to, promotion, check } = detailMove;
          const audios = [
            move.ep_square ? "enpassant" : pieceLetterMap[piece],
            disambiguator && `${disambiguator}from`,
            capture ? "takes" : "to",
            `${to[0]}from`,
            `${to[1]}to`,
            promotion && "promotesto",
            promotion && pieceLetterMap[promotion.toLowerCase()],
            check
          ].filter(x => x);
          playAudio(MOVE_SOUNDS, "sound/English", audios, true);
        }
      }
      boardReady = false;
      updateBoard(gameInst.getGameRaw(), beforeRaw);
    });

    gameInst.on("board-not-sync-change", () => {
      playAudio(_.get(persona, "sounds.illegalMove"), persona.assetDir, true, true);
    });

    gameInst.on("game-over", async result => {
      setStatus(`Gameover, ${result.result}`);
      await saveGameResult(result);
      setExitButton();
    });

    gameInst.on("illegal-move", ({ move, color }) => {
      if (color === "white") {
        illegal = { move, color };
        playAudio(_.get(persona, "sounds.illegalMove"), persona.assetDir, true);
        setStatus(`${color}: \
<span class="text-red">illegal move </span>\
<span class="text-green"> ${move.from} \u2192 ${move.to} </span>`);
      }
    });
  };

  document.getElementById("new-tournament").addEventListener("click", async () => {
    await newGame("Tournament", true);
    showGame();
  });

  document.getElementById("new-tutorial").addEventListener("click", async () => {
    await newGame("Training", true);
    showGame();
  });

  document.getElementById("resume-tournament").addEventListener("click", async () => {
    await newGame("Tournament", false);
    showGame();
  });

  document.getElementById("resume-tutorial").addEventListener("click", async () => {
    await newGame("Training", false);
    showGame();
  });

  document.getElementById("resign-button").addEventListener("click", async (a, b) => {
    const action = document.getElementById("game-exit-action");
    const text = action.innerText;
    if (text === "Resign") {
      setStatus(`Gameover, you resigned`);
      await saveGameResult({
        winner: "black",
        result: "white resigned"
      });
      setExitButton();
    } else if (text === "Exit") {
      showWelcome();
    }
  });

  document.addEventListener("keyup", e => {
    if (e.key === "Backspace") {
      if (game.turnColor === "white" && game._players && game._players.black.allowTakeback()) {
        game.takeBack();
      }
    }
  });

  $("#carouselPersonas").on("slid.bs.carousel", e => {
    // console.log("carousel persona", e);
    const id = personas.allIds()[e.to];
    persona = switchPersona(id);
  });
}

// showWelcome("mickey");
start();
