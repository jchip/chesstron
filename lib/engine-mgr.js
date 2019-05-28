"use strict";

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
  }
};

class EnginesManager {
  constructor() {
    this._engines = {};
    this._enginePath = "./Engines/Windows";
  }

  async get(name) {
    if (!ENGINES_DB[name]) {
      throw new Error(`Engine ${name} is unknown`);
    }

    if (!this._engines[name]) {
      const path = ENGINES_DB[name].win32.exePath;
      const fp = Path.resolve(this._enginePath, path);
      const eng = new Engine(fp);
      eng.name = name;
      await eng.init();
      this._engines[name] = eng;
    }

    return this._engines[name];
  }

  async initEngine(spec) {
    const eng = await this.get(spec.name);

    if (eng) {
      await eng.ucinewgame();
      if (spec.initOptions) {
        for (const opt in spec.initOptions) {
          await eng.setoption(opt, spec.initOptions[opt]);
        }
      }
      if (spec.init) {
        await spec.init(engine);
      }
      await eng.isready();
    }

    return eng;
  }
}

module.exports = EnginesManager;
