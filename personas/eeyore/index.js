"use strict";

const _ = require("lodash");
const util = require("../../lib/util");

const makePvMove = async ({ engine, id, inDepth, game }) => {
  // const depth = inDepth || util.pickChance([4, 5, 7, 8, 9, 10, 57], [7, 6, 5, 4, 3, 2, 1]);
  const depth = inDepth || util.pickChance([5, 6, 7, 8, 9, 10, 55], [8, 7, 6, 5, 4, 3, 2]);
  console.log(id, "about to make multi pv move, depth", depth);
  const result = await engine.go({
    depth,
    MultiPV: 10
  });
  if (result.info.length > 1) {
    const sortedPv = result.info
      // avoid moves that puts eeyore in significant disadvantage if possible
      .filter(x => x.pv && x.score && x.score.value > -150)
      .sort((a, b) => {
        return b.score.value - a.score.value;
      });

    console.log(id, "moves", result.info, "sorted", sortedPv);

    if (sortedPv.length > 1) {
      let picked;
      let pv;

      const firstPv = sortedPv[0];
      const firstMove = firstPv.pv.split(" ")[0];
      const nextPv = sortedPv.find(x => x.pv.split(" ")[0] !== firstMove);
      const firstDiff = nextPv && firstPv.score.value - nextPv.score.value;
      const moves = game ? Math.floor(game._chess.history().length / 2) : Infinity;
      // if our best move score is below 75, take best move
      // or if first and second pv move has a diff bigger than 100, then
      // opponent most likely made a big blunder, take obvious move
      // or if in first 3 moves and best move score is below 150, take best move
      if (
        firstPv.score.value < 75 ||
        firstDiff > 100 ||
        (firstPv.score.value < 150 && moves <= 3)
      ) {
        picked = 0;
        pv = firstPv;
      } else {
        let playChances = [3, 5, 6, 6, 7, 7, 8, 13, 15, 30];
        if (sortedPv.length < playChances.length) {
          const extraChances = playChances.slice(sortedPv.length).reverse();
          playChances = playChances.slice(0, sortedPv.length);
          extraChances.forEach((n, ix) => {
            const k = playChances.length - ix - 1;
            if (k >= 0) playChances[k] += n;
          });
        }
        picked = util.pickChance(playChances);
        // if (picked < 0 || picked > sortedPv.length) {
        //   const chances = playChances;
        //   for (let i = 0; i < sortedPv.length; i++) {
        //     chances.push(100 / sortedPv.length);
        //   }
        //   picked = util.pickChance(chances);
        // }
        pv = sortedPv[picked] || sortedPv[0];
        result._bestmove = result.bestmove;
        result.bestmove = pv.pv.split(" ")[0];
      }

      console.log(
        id,
        "make pv move",
        picked,
        "score",
        pv.score.value,
        result.bestmove,
        "depth",
        depth,
        "scores",
        sortedPv.slice(0, 10).map(x => x.score.value),
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
  name: "eeyore",
  firstName: "Eeyore",
  lastName: "The Donkey",
  assetDir: "eeyore",
  sounds: {
    greeting: {
      "good morning": "good-morning.ogg",
      "thanks for noticing me": "thanks-for-noticing-me.ogg"
    },
    moveChat: {
      "attach to it": "attach-to-it.ogg",
      "didnt expect it": "didnt-expect-it.ogg",
      "take a day or two": "might-take-a-day-or-two.ogg",
      "who knows": "who-knows.ogg"
    },
    illegalMove: {
      "find another one": "find-another-one.ogg",
      "never does": "never-does.ogg"
    },
    ready: {
      "i found it": "I-found-it.ogg",
      "not much of a tail": "not-much-of-a-tail.ogg"
    }
  },

  images: {
    default: "eeyore.png"
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
