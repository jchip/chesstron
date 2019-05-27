"use strict";

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
  }
};
