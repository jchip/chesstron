"use strict";

const PersonaStockfish = require("../persona-stockfish");
const util = require("../../lib/util");

const winnie = new PersonaStockfish({
  depth: () => util.pickChance([1, 1, 4, 4, 20, 20, 25, 25], [10, 9, 8, 7, 6, 5, 4, 3]),
  moveMinScore: -200,
  minBestScore: 10,
  stdDevLimit: { limit: 100, chance: 95 },
  minOpenLimit: { score: 150, moves: 6 },
  firstDiffParams: { threshold: 150, chance: 85 },
  playChances: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 10, 15]
});

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

  engines: winnie.engines,

  strategy: {
    default: ["stockfish"]
  }
};
