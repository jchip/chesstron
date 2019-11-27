"use strict";

const _ = require("lodash");
const util = require("../../lib/util");

const makePvMove = async ({ engine, id, inDepth, game }) => {
  const depth = 10; // inDepth || util.pickChance([5, 7, 8, 20, 30, 35], [7, 6, 5, 4, 3, 2]);
  console.log(id, "about to make multi pv move, depth", depth);
  const result = await engine.go({
    depth,
    MultiPV: 5
  });
  if (result.info.length > 1) {
    const cmpScore = (a, b) => b.score.value - a.score.value;
    let sortedPv = util
      .simplifyPv(result.info)
      // avoid moves that puts eeyore in significant disadvantage if possible
      .filter(x => x.pv && x.score && x.score.value > -250)
      .sort(cmpScore);

    console.log(id, "moves", result.info, "sorted", sortedPv);

    if (sortedPv.length > 1) {
      let picked;
      let pickedMove;

      const firstPv = sortedPv[0];

      if (sortedPv.find(x => x.score.unit === "mate")) {
        sortedPv = sortedPv
          .map(x => {
            if (x.score.unit === "mate") {
              x.score = Object.assign({}, x, {
                mate: x.score.value,
                value: firstPv.score.value + x.score.value
              });
            }
            return x;
          })
          .sort(cmpScore);
      }

      const sortedPvByDest = util.pvByDest(sortedPv).sort(cmpScore);
      const sortedPvBySrc = util.pvBySrc(sortedPv).sort(cmpScore);
      console.log("sortedPvByDest", sortedPvByDest, "sortedPvBySrc", sortedPvBySrc);
      const firstDiffByDest =
        sortedPvByDest.length > 1
          ? sortedPvByDest[0].score.value - sortedPvByDest[1].score.value
          : 0;
      const firstDiffBySrc =
        sortedPvBySrc.length > 1 ? sortedPvBySrc[0].score.value - sortedPvBySrc[1].score.value : 0;
      const firstDiff = firstPv.score.value - sortedPv[1].score.value;
      // TODO: fix resume game lost history
      const moves = game ? game._chess.history().length : Infinity;
      // if our best move score is below 5, take best move
      // or if first and second pv move has a diff bigger than 180, then
      // opponent most likely made a big blunder, take obvious move 95% of the time
      // or if in first 6 moves and best move score is below 150, take best move
      if (
        firstPv.score.value < 5 ||
        (firstDiff > 180 && util.roll(95)) ||
        (firstDiffByDest > 150 && util.roll(95)) ||
        (firstDiffBySrc > 150 && util.roll(95)) ||
        (firstPv.score.value < 150 && moves <= 6)
      ) {
        // TODO: if triggered by firstDiffByDest and there are multi moves
        // for the dest square, do a random select for one of the moves
        console.log(
          "picking first pv move, firstDiff",
          firstDiff,
          "firstDiffByDest",
          firstDiffByDest,
          "firstDiffBySrc",
          firstDiffBySrc
        );
        picked = 0;
        pickedMove = firstPv;
      } else {
        let playChances = [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 15, 25];
        if (sortedPv.length < playChances.length) {
          const extraChances = playChances.slice(sortedPv.length).reverse();
          playChances = playChances.slice(0, sortedPv.length);
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
        result._bestmove = result.bestmove;
        result.bestmove = pickedMove.pv.split(" ")[0];
      }

      console.log(
        id,
        "make pv picked",
        picked,
        "score",
        pickedMove.score.value,
        result.bestmove,
        "depth",
        depth,
        "scores",
        sortedPv.slice(0, 25).map(x => x.score.value),
        "firstDiff",
        firstDiff
      );
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
