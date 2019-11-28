"use strict";

const EngineMgr = require("../../lib/engine-mgr");
const chessUtil = require("dgt-board/lib/utils");
const chess = require("chess-js");

describe("stockfish", function() {
  let engine;
  let play;

  before(async () => {
    const manager = new EngineMgr();
    engine = await manager.initEngine({ name: "stockfish" });
  });

  after(async () => {
    await engine.quit();
  });

  this.beforeEach(() => {
    play = new chess.Chess();
  });

  function showFenAscii(fen) {
    const raw = chessUtil.fenToRaw(fen);
    console.log(chessUtil.rawToAscii(raw).join("\n"));
  }

  it("test 1", async () => {
    const fen1 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    play.reset();
    play.load(fen1);
    const moves = [];
    for (let i = 0; i < 3; i++) {
      const fen = play.fen();
      //   showFenAscii(fen);
      engine.position(fen);
      const result = await engine.go({ depth: 10, multiPV: 10 });
      const bm = result.bestmove;
      moves.push(bm);
      play.move({
        from: bm.substr(0, 2),
        to: bm.substr(2)
      });
    }
    console.log(moves);
    showFenAscii(play.fen());
  });
});
