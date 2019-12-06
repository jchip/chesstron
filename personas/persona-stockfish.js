"use strict";

const _ = require("lodash");
const util = require("../lib/util");

const cmpScore = (a, b) => b.score.value - a.score.value;

class PersonaStockfish {
  constructor(options = {}) {
    // function to get depth to analyze
    this._depth = options.depth || (() => util.pickChance([4, 6, 10, 80], [11, 10, 9, 7]));
    // minimum score moves must meet to include
    this._moveMinScore = options.moveMinScore || -200;
    // minimum best score must meet before picking by chance
    this._minBestScore = options.minBestScore || 10;
    //
    this._stdDevLimit = options.stdDevLimit || { limit: 100, chance: 90 };
    // number open moves must occur before picking moves by chance
    this._minOpenLimit = options.minOpenLimit || { score: 150, moves: 6 };
    // the parameter to consider for comparing diff between best and first bad score
    // in order to force picking the best move
    this._firstDiffParams = options.firstDiffParams || { threshold: 150, chance: 85 };
    this._playChances = [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 10, 15];
    this._id = "stockfish";
  }

  async makeBestMove({ engine }) {
    const id = this._id;
    const depth = this._depth();
    console.log(id, "about to get move with depth", depth);
    const result = await engine.go({ depth });
    console.log(id, "make best move depth", depth, result.bestmove);
    return result;
  }

  async makePvMove({ engine, engOpts, game }) {
    const id = this._id;
    const depth = this._depth();

    console.log(id, "about to make multi pv move, depth", depth);

    const result = await engine.go({ depth });

    if (result.info.length <= 1) {
      console.log(id, "no viable pv to try, using bestmove", result.bestmove);
      return result;
    }

    let sortedPv = util
      .simplifyPv(result.info, depth)
      // avoid moves that puts engine in significant disadvantage if possible
      .filter(x => {
        // engine about to be mated
        if (x.score.unit === "mate" && x.score.value < 0) {
          return false;
        }
        return x.pv && x.score && x.score.value > this._moveMinScore;
      })
      .sort(cmpScore);

    console.log(id, "result", result, "sorted", sortedPv);

    if (sortedPv.length <= 1) {
      console.log(id, "no multi pv to try after sorted, using best move", result.bestmove);
      return result;
    }

    let picked;
    let pickedMove;

    if (sortedPv.find(x => x.score.unit === "mate")) {
      const firstScore = sortedPv[0].score.value;
      sortedPv = sortedPv
        .map(x => {
          if (x.score.unit === "mate") {
            const value = firstScore + x.score.value;
            x.score = Object.assign({}, x, { mate: x.score.value, value });
          }
          return x;
        })
        .sort(cmpScore);
    }

    let scores = sortedPv.slice(0, 25).map(x => x.score.value);
    scores = util.limitScoresByStdDev(Object.assign({ scores }, this._stdDevLimit));
    scores = util.balanceScores({ scores });
    const moves = game ? game._chess.history().length : Infinity;

    console.log("depth", depth, "scores", scores, "history moves", moves);
    // if our best move score is below _minBestScore, take best move
    // or if first and second pv move has a diff bigger than _firstDiffParams, then
    // opponent most likely made a big blunder, take obvious move
    // or if in first open limit moves and best move score is below score, take best move
    if (
      scores.length <= 1 ||
      scores[0] < this._minBestScore ||
      util.firstDiffCheck(Object.assign({ scores }, this._firstDiffParams)) ||
      (scores[0] < this._minOpenLimit.score && moves <= this._minOpenLimit.moves)
    ) {
      picked = 0;
      pickedMove = sortedPv[0];
      console.log("picking first pv move", pickedMove, "bestmove", result.bestmove);
    } else {
      let playChances = this._playChances;
      if (scores.length < playChances.length) {
        playChances = util.downSampleArray(playChances, scores.length);
      }
      console.log("playChances", playChances);
      picked = util.pickChance(playChances);
      pickedMove = sortedPv[picked] || sortedPv[0];
    }

    result._bestmove = result.bestmove;
    result.bestmove = pickedMove.san;

    console.log(id, "make pv picked", picked, "score", pickedMove.score.value, result.bestmove);

    return result;
  }

  get engines() {
    return {
      stockfish: {
        name: "stockfish",
        initOptions: {
          MultiPV: 10
        },
        move: async (engine, engOpts, game) => {
          return await this.makePvMove({ engine, engOpts, game });
        }
      }
    };
  }
}

module.exports = PersonaStockfish;
