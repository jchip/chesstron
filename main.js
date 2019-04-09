// Modules to control application life and create native browser window
const url = require("url");
const path = require("path");
const electron = require("electron");
const { app, BrowserWindow } = electron;
const scanDir = require("filter-scan-dir");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

function initialize() {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
    return;
  }

  loadDemos();

  function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 1150,
      height: 900,
      title: "Chesstron",
      webPreferences: {
        nodeIntegration: true
      }
    });

    // and load the index.html of the app.
    // mainWindow.loadFile("index.html");

    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file",
        slashes: true
      })
    );

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on("closed", function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null;
    });
  }

  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on("ready", createWindow);

  // Quit when all windows are closed.
  app.on("window-all-closed", function() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow();
    }
  });
}

// Require each JS file in the main-process dir
function loadDemos() {
  const files = scanDir.sync({
    dir: path.join(__dirname, "main-process"),
    includeRoot: true,
    filterExt: [".js"]
  });
  files.forEach(file => {
    require(file);
  });
}

initialize();
