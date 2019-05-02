"use strict";

module.exports = {
  name: "Mickey",
  assetDir: "mickey",
  sounds: {
    greeting: {
      "ha hi everybody": "ha-hi-everybody.mp3",
      "huh huh hi there": "huh-huh-hi-there.mp3",
      ready: "ready.mp3"
    },
    moveChat: {
      alright: "alright.mp3",
      "hmm what to do lets think": "hmm-what-to-do-lets-think.mp3",
      good: "good.mp3",
      "good job": "good-job.mp3",
      "hmm gosh i dont know": "hmm-gosh-i-dont-know.mp3"
    },
    illegalMove: {
      "oops huh huh": "oops-huh-huh.mp3",
      "oh boy": "oh-boy.mp3",
      "ha ha goofy": "haha-goofy.mp3"
    },
    ready: {
      "huh huh are you ready": "huh-huh-are-you-ready.mp3",
      "ha hi everybody": "ha-hi-everybody.mp3",
      "here we go": "here-we-go.mp3",
      "well looks like everybodys here": "well-looks-like-everybodys-here.mp3",
      "ok hre we go": "ok-here-we-go.mp3"
    }
  },

  images: {
    default: "mickey-pose-1.png"
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
