"use strict";

const _ = require("lodash");
const util = require("../../lib/util");

const makePvMove = async (engine, id) => {
  const depth = util.pickChance([15, 20, 30, 30], [10, 6, 4, 2]);
  console.log(id, "about to make multi pv move, depth", depth);
  const result = await engine.go({
    depth,
    MultiPV: 10
  });
  if (result.info.length > 1) {
    const sortedPv = result.info
      // avoid moves that puts winnie in significant disadvantage if possible
      .filter(x => x.pv && x.score && x.score.value > -50)
      .sort((a, b) => {
        if (b.depth === a.depth) {
          return b.score.value - a.score.value;
        }

        return b.depth - a.depth;
      });

    if (sortedPv.length > 1) {
      let picked;
      let pv;

      let scores = [];
      const firstPv = sortedPv[0];
      const firstMove = firstPv.pv.split(" ")[0];
      const nextPv = sortedPv.find(x => x.pv.split(" ")[0] !== firstMove);
      // opponent most likely made a big blunder, take obvious move
      if (nextPv && firstPv.score.value - nextPv.score.value > 120) {
        picked = 0;
        pv = firstPv;
      } else {
        picked = util.pickChance([10, 25, 20, 15, 10, 6, 5, 4, 3, 2]);
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
  stockfish1: {
    name: "stockfish",
    move: async engine => makeBestMove(engine, "stockfish1")
  },
  stockfish: {
    name: "stockfish",
    initOptions: {
      MultiPV: 10
    },
    move: async engine => makePvMove(engine, "stockfish")
  },
  irina: {
    name: "irina",
    move: async engine => makeBestMove(engine, "irina", 1)
  },
  komodo1: {
    name: "komodo",
    move: async engine => makeBestMove(engine, "komodo1")
  },
  komodo: {
    name: "komodo",
    initOptions: {
      MultiPV: 10
    },
    move: async engine => makePvMove(engine, "komodo")
  },
  amyan: {
    name: "amyan",
    move: async engine => makeBestMove(engine, "amyan", 1)
  }
};

module.exports = {
  name: "winnie",
  firstName: "Winnie",
  lastName: "The Pooh",
  assetDir: "winnie",
  sounds: {
    greeting: {
      "good morning": "good-morning-christopher-robin.ogg",
      "oh stuff and fluff": "oh-stuff-and-fluff.ogg",
      "i am rumbly in my tumbly": "i-am-rumbly-in-my-tumbly.ogg"
    },
    moveChat: {
      "think think think": "think-think-think.ogg",
      "i was afraid of that": "i-was-afraid-of-that.ogg",
      "clever disguise": "clever-disguise.ogg",
      "i am stuck": "i-am-stuck.ogg"
    },
    illegalMove: {
      "dum dum dum": "dum-dum-dum.ogg",
      "aim me at the bees": "aim-me-at-the-bees.ogg",
      "oh bother": "oh-bother.ogg"
    },
    ready: {
      "come down": "i-think-i-shall-come-down.ogg",
      "no hurry": "no-hurry.ogg",
      "time for something sweet": "time-for-something-sweet.ogg"
    }
  },

  images: {
    default: "cute-pose-winnie-the-pooh.png"
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
    default: ["stockfish1", "komodo1", "stockfish", "komodo", "amyan", "irina"]
  }
};
