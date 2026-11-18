const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

const STATION_URL = process.env.PRIME_STATION_URL || 'https://prime-station-iu2x.onrender.com';

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 960,
    minWidth: 1050,
    minHeight: 700,
    title: 'Prime Station',
    backgroundColor: '#07111e',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.loadURL(STATION_URL);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
