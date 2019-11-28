"use strict";

const EngineMgr = require("../../lib/engine-mgr");
const chessUtil = require("dgt-board/lib/utils");
const chess = require("chess-js");

describe("stockfish", function() {
  let engines = {};
  let play;

  this.timeout(10000);

  before(async () => {
    const manager = new EngineMgr();
    engines.b = {
      engine: await manager.initEngine({ name: "houdini", id: "b" }),
      options: { depth: 10, multiPV: 10 }
    };
    engines.w = {
      engine: await manager.initEngine({ name: "stockfish", id: "w" }),
      options: { depth: 10, multiPV: 10 }
    };
  });

  after(async () => {
    await engines.b.engine.quit();
    await engines.w.engine.quit();
  });

  this.beforeEach(() => {
    play = new chess.Chess();
  });

  function showFenAscii(fen) {
    const raw = chessUtil.fenToRaw(fen);
    console.log(chessUtil.rawToAscii(raw).join("\n"));
  }

  function movePos(...moves) {
    moves.forEach(move => {
      const promotion = move.length > 4 ? move.substr(4, 1) : undefined;
      play.move({
        from: move.substr(0, 2),
        to: move.substr(2, 2),
        promotion
      });
    });
  }

  function checkEndGame() {
    if (play.in_draw()) {
      return { result: "draw" };
    } else if (play.in_stalemate()) {
      return { result: stalemate };
    } else if (play.in_threefold_repetition()) {
      return { result: "threefold repetition" };
    } else if (play.in_checkmate()) {
      return { result: "checkmate", winner: play.turn() === "w" ? "black" : "white" };
    } else {
      return false;
    }
  }

  it("test engine vs engine", async () => {
    const fen1 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    play.reset();
    play.load(fen1);
    // const moves = ["e2e4", "d7d5"];
    const moves = [];
    movePos(...moves);
    for (let i = 0; i < 1000; i++) {
      const fen = play.fen();
      const { engine, options = {} } = engines[play.turn()];
      engine.position(fen);
      const result = await engine.go(options);
      console.log(fen);
      showFenAscii(fen);
      const bm = result.bestmove;
      //   console.log(moves.join(" "), bm);
      console.log(bm);
      moves.push(bm);
      movePos(bm);
      const x = checkEndGame();
      if (x) {
        console.log("end", x);
        break;
      }
    }
  }).timeout(100000);
});
