"use strict";

module.exports = {
  name: "tweety",
  assetDir: "tweety",
  sounds: {
    greeting: {
      "hello putty cat": "tweety22.mp3"
    },
    moveChat: {
      "he got away": "tweety09.mp3",
      "I wonder what that putty cat up to now": "tweety11.mp3",
      "I tawt I taw a putty cat": "tweety13.mp3",
      "A surprise for me": "tweety14.mp3",
      "What you doin up there": "tweety15.mp3"
    },
    illegalMove: {
      "bad old putty cat": "tweety03.mp3",
      "bombs away": "tweety37.mp3",
      "bad old putty cat2": "tweety07.mp3"
    }
  },
  images: {
    default: "rinr6kRnT.gif"
  },
  actions: {
    ready: {
      sound: {
        groupId: "moveChat",
        id: "I tawt I taw a putty cat"
      }
    }
  }
};
