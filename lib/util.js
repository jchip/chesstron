"use strict";

function pickChance(chances, mapped) {
  const max = chances.reduce((a, x) => a + x, 0);

  if (max > 100) {
    throw new Error("pickChance: chances total exceeds 100: " + chances);
  }

  const v = Math.floor(Math.random() * 100);

  let upper = 0;

  for (let i = 0; i < chances.length; i++) {
    upper += chances[i];
    if (v < upper) {
      return mapped ? mapped[i] : i;
    }
  }
  return -1;
}

// function test2() {
//   const chances = [10, 30, 40, 20];
//   const picked = [0, 0, 0, 0];
//   const samples = 100000;
//   for (let x = 0; x < samples; x++) {
//     const x = pickChance(chances);
//     if (x < 0) console.error("oops", x);
//     picked[x]++;
//   }
//   console.log(picked);
// }

// test2();

module.exports = {
  pickChance
};
