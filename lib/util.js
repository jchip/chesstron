"use strict";

/* eslint-disable no-magic-numbers, no-console */

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

function simplifyPv(moves, depth) {
  const result = moves
    .filter(x => depth === undefined || x.depth === depth)
    .reduce((res, move) => {
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

function average(data) {
  assert(data.length > 0, "can't calc average of empty array");
  return (
    data.reduce((sum, value) => {
      return sum + value;
    }, 0) / data.length
  );
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

//
// check if should pick best move by skipping scores with standard
//  deviation below minDev and calc diff of the value to best
// chance - probability to do stddev check
// threshold - check that diff is exceed this
//
// ie: [550, 550, 287, 167, 149, 145, 141, 137, 109, 90, 83, 80, 65, 51]
//
function stdDevDiffCheck({ scores, threshold, minDev = 10, chance = 90 }) {
  if (roll(chance) && scores.length > 1) {
    let n = 1;
    // find first N scores with std dev less than 10
    for (; n < scores.length; n++) {
      const stdDev = standardDeviation(scores.slice(0, n + 1));
      if (stdDev > minDev) break;
    }
    const diff = scores[0] - scores[n];
    const picked = diff > threshold;
    console.log("stddev check", picked, "slot", n, "diff", diff, "threshold", threshold);
    return picked;
  }
  console.log("chance no stddev");
  return false;
}

function firstDiffCheck({ scores, threshold, chance = 90 }) {
  return stdDevDiffCheck({ scores, threshold, chance });
}

//
// if there are more negative scores than positive, then balance them
// percent being the number of negatives to take as a percent of positives
//
function balanceScores({ scores, percent = 100 }) {
  let i = 1;
  for (; i < scores.length && scores[i] > 0; i++) {}
  return scores.slice(0, Math.floor(0.5 + i * (1 + percent / 100)));
}

// pick scores where stddev remain below a limit
// depth 4
// r3kb1r/1b2pppp/1n6/1pp5/8/2N2N2/PP3PPP/R1BK3R b kq - 1 13
// [622, 603, 535, 521, 264, 251, 244, 221, 187, 183]
function limitScoresByStdDev({ scores, limit, chance = 90 }) {
  if (roll(chance) && scores.length > 1) {
    let n = 1;
    // find first N scores with std dev less than 10
    for (; n < scores.length; n++) {
      const stdDev = standardDeviation(scores.slice(0, n + 1));
      if (stdDev > limit) break;
    }
    return scores.slice(0, n);
  }

  return scores;
}

function downSampleArray(from, newSize) {
  const chopSize = from.length / newSize;
  const newArray = new Array(newSize);
  let carry = 0;
  let carryChop = 0;
  for (let i = 0; i < newSize; i++) {
    newArray[i] = 0;
    let chop = chopSize;
    while (chop > 0.00001) {
      if (carry > 0) {
        newArray[i] += carry;
        chop -= carryChop;
        carry = carryChop = 0;
      } else if (chop > 1) {
        chop -= 1;
        newArray[i] += from.shift();
      } else if (from.length > 0) {
        carry = from.shift();
        const take = carry * chop;
        carry -= take;
        carryChop = 1 - chop;
        newArray[i] += take;
        break;
      } else {
        break;
      }
    }
    newArray[i] = Math.floor(newArray[i] + 0.5);
  }

  return newArray;
}

// r1k2b1r/1bN1p3/5ppp/2p5/P4B2/1p3N2/1P3PPP/R2R2K1 b - - 3 23
// depth 4 picked bad move but depth 3 picked better one

module.exports = {
  pickChance,
  roll,
  simplifyPv,
  pvByDest,
  pvBySrc,
  standardDeviation,
  stdDevDiffCheck,
  firstDiffCheck,
  balanceScores,
  limitScoresByStdDev,
  downSampleArray
};
