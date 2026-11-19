const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');

const isDev = !app.isPackaged;

function appRoot() {
  return isDev ? path.join(__dirname, '..') : app.getAppPath();
}

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

function waitForServer(port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(
        { host: '127.0.0.1', port, path: '/api/health', timeout: 2000 },
        (res) => { res.resume(); resolve(); }
      );
      req.on('error', retry);
      req.on('timeout', () => { req.destroy(); retry(); });
    };
    const retry = () => {
      if (Date.now() > deadline) return reject(new Error('The local server did not start in time.'));
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

function localSecrets(dataDir) {
  const file = path.join(dataDir, 'local-secrets.json');
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

let mainWindow = null;

async function startServer() {
  const port = await freePort();
  const dataDir = path.join(app.getPath('userData'), 'data');
  fs.mkdirSync(path.join(dataDir, 'uploads'), { recursive: true });

  Object.assign(process.env, {
    NODE_ENV: 'production',
    PORT: String(port),
    DATA_DIR: dataDir,
    UPLOAD_DIR: path.join(dataDir, 'uploads'),
    DATABASE_PATH: path.join(dataDir, 'prime-station.sqlite'),
    BASE_URL: 'http://127.0.0.1:' + port,
    AGENTS_PATH: path.join(appRoot(), 'agents.json')
  });
  Object.assign(process.env, localSecrets(dataDir));

  const entry = path.join(appRoot(), 'server', 'index.js');
  if (!fs.existsSync(entry)) {
    throw new Error('server/index.js is missing from the app bundle.\n\nLooked in: ' + appRoot());
  }

  try {
    await import(pathToFileURL(entry).href);
  } catch (err) {
    throw new Error('The server failed to start.\n\n' + (err && err.stack ? err.stack : String(err)));
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

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  await mainWindow.loadURL('http://127.0.0.1:' + port + '/');
  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

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
}
