"use strict";

/* eslint-disable no-console */

const Path = require("path");

const { Engine } = require("node-uci");

const ENGINES_DB = {
  amyan: {
    win32: {
      exePath: "amyan/amyan.exe"
    }
  },

  stockfish: {
    win32: {
      exePath: "stockfish/stockfish_10_x64_bmi2.exe"
    }
  },

  irina: {
    win32: {
      exePath: "irina/irina.exe"
    }
  },

  komodo: {
    win32: {
      exePath: "komodo/komodo-10-64bit.exe"
    }
  },

  houdini: {
    win32: {
      exePath: "houdini/Houdini_15a_w32.exe"
    }
  }
};

class EnginesManager {
  constructor() {
    this._engines = {};
    this._enginePath = "./Engines/Windows";
  }

  async get(id, name) {
    name = name || id;

    if (!ENGINES_DB[name]) {
      throw new Error(`Engine ${name} is unknown`);
    }

    if (!this._engines[id]) {
      const path = ENGINES_DB[name].win32.exePath;
      const fp = Path.resolve(this._enginePath, path);
      console.log("Engines Manager creating new engine", name, fp);
      const eng = new Engine(fp);
      eng.name = name;
      await eng.init();
      this._engines[id] = eng;
    }

    return this._engines[id];
  }

  async initEngine(spec) {
    const engine = await this.get(spec.id, spec.name);

    if (engine) {
      await engine.ucinewgame();
      if (spec.initOptions) {
        for (const opt in spec.initOptions) {
          await engine.setoption(opt, spec.initOptions[opt]);
        }
      }
      if (spec.init) {
        await spec.init(engine);
      }
      await engine.isready();
    }

    return engine;
  }
}

module.exports = EnginesManager;
