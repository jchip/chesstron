"use strict";

const _ = require("lodash");
const util = require("../../lib/util");

const makePvMove = async (engine, id) => {
  const depth = 10;
  console.log(id, "about to make multi pv move, depth", depth);
  const result = await engine.go({
    depth,
    MultiPV: 10
  });
  if (result.info.length > 1) {
    const sortedPv = result.info
      .filter(x => x.pv && x.score && x.depth >= depth)
      .sort((a, b) => {
        return b.score.value - a.score.value;
      });

    if (sortedPv.length > 1) {
      let scores = [];
      const chances = [5, 5, 5, 10, 10, 15, 20, 15, 10, 5];
      const picked = util.pickChance(chances.slice(0, Math.min(chances.length, sortedPv.length)));

      const pv = sortedPv[picked] || sortedPv[0];
      result._bestmove = result.bestmove;
      result.bestmove = pv.pv.split(" ")[0];
      scores = sortedPv.slice(0, 10).map(x => x.score.value);

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
    }
  } else {
    console.log(id, "no viable pv to try, using bestmove", result.bestmove);
  }

  return result;
};

const makeBestMove = async (engine, id, depth = 1) => {
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
  stockfish1: {
    name: "stockfish",
    move: async engine => makeBestMove(engine, "stockfish1")
  },
  amyan: {
    name: "amyan",
    move: async engine => makeBestMove(engine, "amyan", 1)
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
    default: ["stockfish1", "stockfish", "amyan", "stockfish"]
  }
};
