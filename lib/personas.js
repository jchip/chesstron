"use strict";

const scanDir = require("filter-scan-dir");
const Path = require("path");
const _ = require("lodash");

let PERSONAS;
let CURRENT;

function load(dir) {
  if (PERSONAS) return PERSONAS;
  dir = dir || Path.join(__dirname, "..", "personas");
  const dirs = scanDir.sync({
    dir,
    filter: () => false,
    includeDir: true,
    includeRoot: true,
    maxLevel: 1
  });
  PERSONAS = dirs
    .map(d => require(d))
    .reduce(
      (all, p, idx) => {
        all.byId[idx] = p;
        all.byName[p.name] = p;
        return all;
      },
      { byId: {}, byName: {} }
    );

  CURRENT = PERSONAS.byId[0];

  return PERSONAS;
}

function allNames() {
  return Object.keys(load().byName);
}

function allIds() {
  return Object.keys(load().byId);
}

function change(id) {
  const p = load();
  CURRENT = p.byName[id] || p.byId[id] || p.byId[0];
  return CURRENT;
}

module.exports = {
  load,
  change,
  allNames,
  allIds,
  current: () => CURRENT
};
