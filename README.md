# chesstron

## Dev On Windows

Required:

- Windows 10
- Node.js 10.x - install with [@jchip/nvm](https://www.npmjs.com/package/@jchip/nvm)
- [Python 2.7](https://www.python.org/downloads/release/python-2717/)
- Visual Studio 2019 - [Community Edition](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=Community&rel=16)
  - pick workload `Desktop Development with C++`
  - make sure `MSVC v142 - VS 2019 C++ x64/x86 build tools` is selected
  - make sure `Windows 10 SDK (10.0.18362.0)` is selected

Steps:

1. Run `npm ci`
2. Run `npm start`

### Determine DGT Board COM port

After connecting DGT USB board, in order to find out the serial COM port that was assigned:

1. Start device manager
2. Open `Ports (COM & LPT)`
3. Look for `USB Serial Device (COM?)`

### Dev Tools

To enable bring up dev tool using `Ctrl+Shift+I`. Create an empty file `.dev-tool`.

ie: `touch .dev-tool` or `echo 1 > .dev-tool`

## Resources for Learning Electron

- [electronjs.org/docs](https://electronjs.org/docs) - all of Electron's documentation
- [electronjs.org/community#boilerplates](https://electronjs.org/community#boilerplates) - sample starter apps created by the community
- [electron/electron-quick-start](https://github.com/electron/electron-quick-start) - a very basic starter Electron app
- [electron/simple-samples](https://github.com/electron/simple-samples) - small applications with ideas for taking them further
- [electron/electron-api-demos](https://github.com/electron/electron-api-demos) - an Electron app that teaches you how to use Electron
- [hokein/electron-sample-apps](https://github.com/hokein/electron-sample-apps) - small demo apps for the various Electron APIs
