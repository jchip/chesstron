"use strict";

const assert = require("assert");

const SCALE_UP = 10000;

//
// pick a slot in chances array base on its probability value, out
// of the sum of all values.
// if mapped array is passed, then the value from that array is returned
//
function pickChance(chances, mapped) {
  const max = chances.reduce((a, x) => a + x, 0);

  // if (max > 100) {
  //   throw new Error("pickChance: chances total exceeds 100: " + chances);
  // }

  if (mapped) {
    assert(
      chances.length === mapped.length,
      "pickChance: mapped length doesn't match chance length"
    );
  }

  const v = Math.floor(Math.random() * max * SCALE_UP);

  let upper = 0;

  for (let i = 0; i < chances.length; i++) {
    upper += chances[i] * SCALE_UP;
    if (v < upper) {
      return mapped ? mapped[i] : i;
    }
  }

  return -1;
}

//
// return true or false base on rolling chance out of outOf value
//
function roll(chance, outOf = 100) {
  const rollResult = Math.floor(Math.random() * outOf * SCALE_UP);
  return rollResult <= chance * SCALE_UP;
}

// function test2() {
//   const chances = [10, 30, 40, 20];
//   const picked = [0, 0, 0, 0, 0, 0, 0, 0, 0];
//   const samples = 100000;
//   for (let x = 0; x < samples; x++) {
//     const x = pickChance(chances);
//     if (x < 0) console.error("oops", x);
//     picked[x]++;
//   }
//   console.log(picked);
// }

// test2();

// function test3() {
//   let count = 0;
//   const samples = 100000;
//   for (let x = 0; x < samples; x++) {
//     if (roll(10, 20)) count++;
//   }
//   console.log(count);
// }

// test3();

function simplifyPv(moves) {
  const result = moves.reduce((res, move) => {
    const san = move.pv.split(" ")[0];
    if (!res[san] || move.score.value > res[san].score.value) {
      res[san] = Object.assign({ san }, move);
    }
    return res;
  }, {});

  return Object.entries(result).map(x => x[1]);
}

module.exports = {
  pickChance,
  roll,
  simplifyPv
};
