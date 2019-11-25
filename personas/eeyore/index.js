"use strict";

const _ = require("lodash");
const util = require("../../lib/util");

const makePvMove = async (engine, id, inDepth) => {
  const depth = inDepth || util.pickChance([4, 5, 7, 8, 9, 10, 57], [7, 6, 5, 4, 3, 2, 1]);
  console.log(id, "about to make multi pv move, depth", depth);
  const result = await engine.go({
    depth,
    MultiPV: 10
  });
  if (result.info.length > 1) {
    const sortedPv = result.info
      // avoid moves that puts eeyore in significant disadvantage if possible
      // .filter(x => x.pv && x.score && x.score.value > -80)
      .sort((a, b) => {
        return b.score.value - a.score.value;
      });

    console.log(id, "moves", result.info, "sorted", sortedPv);

    if (sortedPv.length > 1) {
      let picked;
      let pv;

      let scores = [];
      const firstPv = sortedPv[0];
      const firstMove = firstPv.pv.split(" ")[0];
      const nextPv = sortedPv.find(x => x.pv.split(" ")[0] !== firstMove);
      // opponent most likely made a big blunder, take obvious move
      if (nextPv && firstPv.score.value - nextPv.score.value > 100) {
        picked = 0;
        pv = firstPv;
      } else {
        picked = util.pickChance([3, 5, 7, 8, 8, 8, 10, 11, 15, 25]);
        if (picked < 0 || picked > sortedPv.length) {
          const chances = [];
          for (let i = 0; i < sortedPv.length; i++) {
            chances.push(100 / sortedPv.length);
          }
          picked = util.pickChance(chances);
        }
        pv = sortedPv[picked] || sortedPv[0];
        result._bestmove = result.bestmove;
        result.bestmove = pv.pv.split(" ")[0];
        scores = sortedPv.slice(0, 10).map(x => x.score.value);
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
        scores
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
    move: async engine => makePvMove(engine, "stockfish")
  },
  komodo: {
    name: "komodo",
    initOptions: {
      MultiPV: 10
    },
    move: async engine => makePvMove(engine, "komodo")
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
