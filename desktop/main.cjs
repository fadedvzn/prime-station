/**
 * Prime Station — desktop shell.
 *
 * Runs the whole app locally: the Express server is loaded into this process
 * (Electron's main process is Node), then the window points at it. No Render,
 * no hosted backend, no child process, no internet connection required.
 *
 * Loading the server in-process rather than spawning it also avoids a Windows
 * quirk: spawning a GUI-subsystem executable (which a packaged Electron app is)
 * returns ENOENT even when the file is right there.
 *
 * Data lives in the OS user-data directory, not in the app bundle, so
 * reinstalling or updating the app does not wipe your clients or tasks.
 */
const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const isDev = !app.isPackaged;

/** Ask the OS for a free port so two copies never collide. */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

/** Poll until the server answers, or give up. */
function waitForServer(port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(
        { host: '127.0.0.1', port, path: '/api/health', timeout: 2000 },
        (res) => {
          res.resume();
          // Any HTTP answer means the server is up.
          resolve();
        }
      );
      req.on('error', retry);
      req.on('timeout', () => { req.destroy(); retry(); });
    };
    const retry = () => {
      if (Date.now() > deadline) {
        reject(new Error('The local server did not start in time.'));
        return;
      }
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

let mainWindow = null;

/** Where the app's own files live, packaged or not. */
function appRoot() {
  return isDev ? path.join(__dirname, '..') : app.getAppPath();
}

/** Owner password and secrets for a single-machine install. */
function localSecrets(dataDir) {
  const file = path.join(dataDir, 'local-secrets.json');
  const crypto = require('node:crypto');

  if (fs.existsSync(file)) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* regenerate */ }
  }

  const secrets = {
    OWNER_PASSWORD: crypto.randomBytes(9).toString('base64url'),
    SESSION_SECRET: crypto.randomBytes(48).toString('hex'),
    TOKEN_ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex')
  };
  fs.writeFileSync(file, JSON.stringify(secrets, null, 2), { mode: 0o600 });
  return secrets;
}

async function startServer() {
  const port = await freePort();

  // Everything the server needs, pointed at the user's own data folder.
  const dataDir = path.join(app.getPath('userData'), 'data');
  fs.mkdirSync(path.join(dataDir, 'uploads'), { recursive: true });

  // The server reads its config from the environment at import time, so this
  // must be set before it is loaded.
  process.env.NODE_ENV = 'production';
  process.env.PORT = String(port);
  process.env.DATA_DIR = dataDir;
  process.env.UPLOAD_DIR = path.join(dataDir, 'uploads');
  process.env.DATABASE_PATH = path.join(dataDir, 'prime-station.sqlite');
  process.env.BASE_URL = 'http://127.0.0.1:' + port;
  process.env.AGENTS_PATH = path.join(appRoot(), 'agents.json');

  Object.assign(process.env, localSecrets(dataDir));

  const entry = path.join(appRoot(), 'server', 'index.js');
  if (!fs.existsSync(entry)) {
    throw new Error('server/index.js is missing from the app bundle.');
  }

  // Load the server into THIS process. Electron's main process is Node, so
  // there is no child process to spawn.
  try {
    await import(pathToFileURL(entry).href);
  } catch (err) {
    throw new Error('The server failed to start.\n\n' + (err && err.stack ? err.stack : err));
  }

  await waitForServer(port);
  return port;
}

async function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#070c14',
    title: 'Prime Station',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // External links open in the real browser, never inside the app window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  await mainWindow.loadURL('http://127.0.0.1:' + port + '/');
  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  try {
    const port = await startServer();
    await createWindow(port);
  } catch (err) {
    dialog.showErrorBox('Prime Station could not start', err.message);
    app.quit();
  }
});
