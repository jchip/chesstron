"use strict";

const PersonaStockfish = require("../persona-stockfish");
const util = require("../../lib/util");

const tigger = new PersonaStockfish({
  depth: () => util.pickChance([4, 6, 10, 80], [8, 7, 6, 5]),
  moveMinScore: -250,
  minBestScore: 5,
  stdDevLimit: { limit: 100, chance: 90 },
  minOpenLimit: { score: 150, moves: 6 },
  firstDiffParams: { threshold: 180, chance: 85 },
  playChances: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 15, 25]
});

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

  engines: tigger.engines,

  strategy: {
    default: ["stockfish"]
  }
};
