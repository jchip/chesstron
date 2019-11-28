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
    engines.b = await manager.initEngine({ name: "stockfish", id: "b-sf" });
    engines.w = await manager.initEngine({ name: "stockfish", id: "w-sf" });
  });

  after(async () => {
    await engines.b.quit();
    await engines.w.quit();
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
      play.move({
        from: move.substr(0, 2),
        to: move.substr(2)
      });
    });
  }

  it("test 1", async () => {
    const fen1 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    play.reset();
    play.load(fen1);
    movePos("e2e4", "d7d5");
    const moves = [];
    for (let i = 0; i < 5; i++) {
      const fen = play.fen();
      const engine = engines[play.turn()];
      engine.position(fen);
      const result = await engine.go({ depth: 20, multiPV: 10 });
      const bm = result.bestmove;
      console.log(fen);
      showFenAscii(fen);
      console.log(bm);
      moves.push(bm);
      movePos(bm);
    }
    console.log(moves);
    showFenAscii(play.fen());
  }).timeout(100000);
});
