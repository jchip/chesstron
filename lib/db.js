"use strict";

const idb = require("idb");

async function initialize() {
  const db = await idb.openDB("chesstron", 1, {
    upgrade(db, oldVersion, newVersion, transaction) {
      db.createObjectStore("games", { keyPath: "id", autoIncrement: true });
    }
  });

  return db;
}

module.exports = {
  initialize
};
