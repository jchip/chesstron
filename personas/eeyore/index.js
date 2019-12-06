"use strict";

const PersonaStockfish = require("../persona-stockfish");
const util = require("../../lib/util");

const eeyore = new PersonaStockfish({
  depth: () => util.pickChance([1, 1, 4, 4, 20, 20, 55], [9, 8, 7, 6, 5, 4, 3]),
  moveMinScore: -300,
  minBestScore: 5,
  stdDevLimit: { limit: 150, chance: 90 },
  minOpenLimit: { score: 150, moves: 6 },
  firstDiffParams: { threshold: 200, chance: 85 },
  playChances: [1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 10, 10, 15, 25]
});

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

  engines: eeyore.engines,

  strategy: {
    default: ["stockfish"]
  }
};
