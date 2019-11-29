"use strict";

const idb = require("idb");

async function initialize() {
  const db = await idb.openDB("chesstron", 1, {
    upgrade(
      db2
      // oldVersion, newVersion, transaction
    ) {
      db2.createObjectStore("games", { keyPath: "id", autoIncrement: true });
    }
  });

  return db;
}

module.exports = {
  initialize
};
