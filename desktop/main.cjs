/**
 * Prime Station — desktop shell.
 *
 * Runs the whole app locally: it starts the Express server as a child process
 * on a free port, waits for it to answer, then loads it in a window. No Render,
 * no hosted backend, no internet connection required.
 *
 * Data lives in the OS user-data directory, not in the app bundle, so
 * reinstalling or updating the app does not wipe your clients or tasks.
 */
const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const fs = require('node:fs');

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
          // Any HTTP answer means the process is up, even a 404 on this path.
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

let serverProcess = null;
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

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    DATA_DIR: dataDir,
    UPLOAD_DIR: path.join(dataDir, 'uploads'),
    DATABASE_PATH: path.join(dataDir, 'prime-station.sqlite'),
    BASE_URL: 'http://127.0.0.1:' + port,
    // Local single-user app: generate stable secrets on first run and keep them.
    ...localSecrets(dataDir),
    // Repo root in dev, app.asar root when packaged.
    AGENTS_PATH: path.join(appRoot(), 'agents.json')
  };

  const entry = path.join(appRoot(), 'server', 'index.js');
  if (!fs.existsSync(entry)) {
    throw new Error('server/index.js is missing from the app bundle.');
  }

  serverProcess = spawn(process.execPath, [entry], {
    cwd: appRoot(),
    env,
    // ELECTRON_RUN_AS_NODE makes the bundled Electron binary act as plain Node,
    // so the packaged app needs no separate Node runtime.
    windowsHide: true
  });

  let stderr = '';
  serverProcess.stderr.on('data', (d) => { stderr += d.toString(); });
  serverProcess.stdout.on('data', (d) => {
    if (isDev) process.stdout.write('[server] ' + d.toString());
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0 && mainWindow) {
      dialog.showErrorBox(
        'Prime Station stopped',
        'The local server exited with code ' + code + '.\n\n' + stderr.slice(-1500)
      );
    }
  });

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
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
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
