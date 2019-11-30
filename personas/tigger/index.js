"use strict";

const _ = require("lodash");
const util = require("../../lib/util");

const makePvMove = async ({ engine, id, inDepth, game }) => {
  const depth = inDepth || util.pickChance([4, 6, 10, 80], [8, 7, 6, 5]);
  console.log(id, "about to make multi pv move, depth", depth);
  const result = await engine.go({
    depth,
    MultiPV: 10
  });
  if (result.info.length > 1) {
    const cmpScore = (a, b) => b.score.value - a.score.value;
    let sortedPv = util
      .simplifyPv(result.info, depth)
      // avoid moves that puts tigger in significant disadvantage if possible
      .filter(x => x.pv && x.score && x.score.value > -250)
      .sort(cmpScore);

    console.log(id, "result", result, "sorted", sortedPv);

    if (sortedPv.length > 1) {
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
      scores = util.limitScoresByStdDev({ scores, limit: 100, chance: 90 });
      scores = util.balanceScores({ scores });
      const moves = game ? game._chess.history().length : Infinity;

      console.log("depth", depth, "scores", scores, "history moves", moves);
      // if our best move score is below 5, take best move
      // or if first and second pv move has a diff bigger than 200, then
      // opponent most likely made a big blunder, take obvious move
      // or if in first 6 moves and best move score is below 150, take best move
      if (
        scores.length <= 1 ||
        scores[0] < 5 ||
        util.firstDiffCheck({ scores, threshold: 180, chance: 85 }) ||
        (scores[0] < 150 && moves <= 6)
      ) {
        picked = 0;
        pickedMove = sortedPv[0];
        console.log("picking first pv move", pickedMove, "bestmove", result.bestmove);
      } else {
        let playChances = [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 15, 25];
        if (scores.length < playChances.length) {
          const extraChances = playChances.slice(scores.length).reverse();
          playChances = playChances.slice(0, scores.length);
          extraChances.forEach((n, ix) => {
            const k = playChances.length - ix - 1;
            if (k >= 0) playChances[k] += n;
          });
        }
        console.log("playChances", playChances);
        picked = util.pickChance(playChances);
        // if (picked < 0 || picked > sortedPv.length) {
        //   const chances = playChances;
        //   for (let i = 0; i < sortedPv.length; i++) {
        //     chances.push(100 / sortedPv.length);
        //   }
        //   picked = util.pickChance(chances);
        // }
        pickedMove = sortedPv[picked] || sortedPv[0];
      }

      result._bestmove = result.bestmove;
      result.bestmove = pickedMove.san;

      console.log(id, "make pv picked", picked, "score", pickedMove.score.value, result.bestmove);
    } else {
      console.log(id, "no multi pv to try after sorted, using best move", result.bestmove);
    }
  } else {
    console.log(id, "no viable pv to try, using bestmove", result.bestmove);
  }

  return result;
};

const makeBestMove = async (engine, id, depth) => {
  if (!depth) {
    depth = util.pickChance([10, 10, 20, 60], [4, 3, 2, 1]);
  }
  console.log(id, "about to get move with depth", depth);
  const result = await engine.go({ depth });
  console.log(id, "make best move depth", depth, result.bestmove);
  return result;
};

const engines = {
  stockfish: {
    name: "stockfish",
    initOptions: {
      MultiPV: 10
    },
    move: async (engine, engOpts, game) => makePvMove({ engine, id: "stockfish", engOpts, game })
  },
  komodo: {
    name: "komodo",
    initOptions: {
      MultiPV: 10
    },
    move: async (engine, engOpts, game) => makePvMove({ engine, id: "komodo", engOpts, game })
  }
};

module.exports = {
  name: "tigger",
  firstName: "Tigger",
  lastName: "The Tiger",
  assetDir: "tigger",
  sounds: {
    greeting: {
      hello: "hello-i-m-tigger.ogg",
      "i-m-tigger": "i-m-tigger.ogg"
    },
    moveChat: {
      "oh-boy-hahaha": "oh-boy-hahaha.ogg",
      "oh hehe": "oh-hehe.ogg",
      "sure i did he he he": "sure-i-did-he-he-he.ogg",
      "thats what tiggers do best": "thats-what-tiggers-do-best.ogg"
    },
    illegalMove: {
      growl: "growl.ogg",
      "oh-dont-be": "oh-dont-be-ridiculous.ogg",
      "yug-tiggers-dont-like-honey": "yug-tiggers-dont-like-honey.ogg"
    },
    ready: {
      "i-m-the-only-one": "i-m-the-only-one.ogg",
      "thats-what-tiggers-like-best": "thats-what-tiggers-like-best.ogg",
      "thats-what-tiggers-do-best": "thats-what-tiggers-do-best.ogg"
    }
  },

  images: {
    default: "tigger.png"
  },
  actions: {
    ready: {
      sound: {
        groupId: "ready",
        id: true
      }
    }
  },

  engines,

  strategy: {
    default: ["stockfish"]
  }
};
