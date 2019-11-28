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

function pvByDest(moves) {
  const result = moves.reduce((res, move) => {
    const dest = move.san.substr(2);
    if (!res[dest] || move.score.value > res[dest].score.value) {
      res[dest] = move;
    }
    return res;
  }, {});
  return Object.entries(result).map(x => x[1]);
}

function pvBySrc(moves) {
  const result = moves.reduce((res, move) => {
    const src = move.san.substr(0, 2);
    if (!res[src] || move.score.value > res[src].score.value) {
      res[src] = move;
    }
    return res;
  }, {});
  return Object.entries(result).map(x => x[1]);
}

function standardDeviation(values) {
  const avg = average(values);

  const squareDiffs = values.map(value => {
    const diff = value - avg;
    const sqrDiff = diff * diff;
    return sqrDiff;
  });

  const avgSquareDiff = average(squareDiffs);

  const stdDev = Math.sqrt(avgSquareDiff);

  return stdDev;
}

function average(data) {
  assert(data.length > 0, "can't calc average of empty array");
  return (
    data.reduce(function(sum, value) {
      return sum + value;
    }, 0) / data.length
  );
}

// check if should pick best move by standard deviation
// count - number of scores to consider
// chance - probability to do stddev check
// threshold - value stddev has to exceed
//
// ie: [550, 550, 287, 167, 149, 145, 141, 137, 109, 90, 83, 80, 65, 51]
//
function stdDevDiffCheck({ scores, count, threshold, chance }) {
  if (roll(chance) && scores.length > 1) {
    const data = scores.slice(0, count);
    const stdDev = standardDeviation(data);
    const diffFromBest = scores[0] - stdDev;
    const picked = diffFromBest > threshold;
    console.log(
      "stddev check",
      picked,
      stdDev,
      "diff",
      diffFromBest,
      "threshold",
      threshold,
      "count",
      count,
      data
    );
    return picked;
  }
  console.log("chance no stddev");
  return false;
}

function firstDiffCheck({ scores, threshold, chance }) {
  if (roll(chance) && scores.length > 1) {
    const diff = scores[0] - scores[1];
    const picked = diff > threshold;
    console.log(
      "first diff check diff",
      picked,
      diff,
      "threshold",
      threshold,
      "chance",
      chance,
      scores.slice(0, 2)
    );
    return picked;
  }
  console.log("chance no first diff check", chance, scores.slice(0, 2));
  return false;
}

module.exports = {
  pickChance,
  roll,
  simplifyPv,
  pvByDest,
  pvBySrc,
  standardDeviation,
  stdDevDiffCheck,
  firstDiffCheck
};
