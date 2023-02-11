import { app, BrowserWindow, protocol, ipcMain, IpcMainEvent } from 'electron';
import createProtocol from './createProtocol';
import merge from 'deepmerge';
import fs from 'fs';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

const partition = 'persist:app_session';

// @ts-ignore
const preloadFile: string = import.meta.electron.preload;

// @ts-ignore
const IS_DEV = import.meta.env.DEV;

// @ts-ignore
const DEV_SERVER_URL = import.meta.env.DEV_SERVER_URL;

// @ts-ignore
const windowConfig = import.meta.electron.window || {};

const preloadDefault = fs.existsSync(preloadFile)
  ? {
      webPreferences: {
        preload: preloadFile,
      },
    }
  : {};
global.VIX_VARS = global.VIX_VARS || {};

let win: BrowserWindow;
async function createWindow() {
  const defaultConfig = {
    width: 1280,
    height: 800,
    show: false,
    title: 'App Test',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      partition: partition,
      webviewTag: true,
    },
  };

  const mergedWindowConfig = merge(defaultConfig, preloadDefault, windowConfig);

  win = new BrowserWindow(mergedWindowConfig);

  createProtocol('app', partition);

  if (DEV_SERVER_URL) {
    win.loadURL(DEV_SERVER_URL);

    win.webContents.openDevTools({ mode: 'bottom' });
  } else {
    win.loadURL('app://./index.html');
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    app.quit();
  });
}

const installExtensions = async () => {
  // @ts-ignore
  if (IS_DEV) {
    try {
      const {
        default: installExtension,
        REACT_DEVELOPER_TOOLS,
        APOLLO_DEVELOPER_TOOLS,
        REDUX_DEVTOOLS,
      } = require('electron-devtools-installer');
      await installExtension(
        [REACT_DEVELOPER_TOOLS, APOLLO_DEVELOPER_TOOLS, REDUX_DEVTOOLS],
        { loadExtensionOptions: { allowFileAccess: true } }
      );
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    if (win) win.show();
  }
});

app
  .whenReady()
  .then(async () => {
    // await installExtensions();
    await createWindow();
    app.on('activate', async () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
      }
    });
  })
  .catch(console.error);

// Exit cleanly on request from parent process in development mode.
// @ts-ignore
if (IS_DEV) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}

ipcMain.on('message', (event: IpcMainEvent, message: any) => {
  setTimeout(() => event.sender.send('message', message), 500);
});
