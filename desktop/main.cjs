/**
 * Prime Station — standalone Windows desktop shell.
 * Express runs in Electron's main process; no child process or hosted server.
 */
const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');

function appRoot() {
  return app.isPackaged ? app.getAppPath() : path.join(__dirname, '..');
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  let mainWindow = null;

  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  function freePort() {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        const port = address.port;
        server.close((err) => err ? reject(err) : resolve(port));
      });
    });
  }

  function loadOrCreateSecrets(dataDir) {
    const file = path.join(dataDir, 'local-secrets.json');
    if (fs.existsSync(file)) {
      try {
        const existing = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (existing.OWNER_PASSWORD && existing.SESSION_SECRET && existing.TOKEN_ENCRYPTION_KEY) {
          return existing;
        }
      } catch {
        // Replace an unreadable or invalid secrets file below.
      }
    }

    const secrets = {
      OWNER_PASSWORD: crypto.randomBytes(9).toString('base64url'),
      SESSION_SECRET: crypto.randomBytes(48).toString('hex'),
      TOKEN_ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex')
    };
    fs.writeFileSync(file, JSON.stringify(secrets, null, 2), { mode: 0o600 });
    try { fs.chmodSync(file, 0o600); } catch { /* Windows ACLs govern file access. */ }
    return secrets;
  }

  function waitForServer(port, timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs;
    return new Promise((resolve, reject) => {
      const attempt = () => {
        const req = http.get({
          host: '127.0.0.1',
          port,
          path: '/api/health',
          timeout: 2000
        }, (res) => {
          res.resume();
          if (res.statusCode >= 200 && res.statusCode < 500) resolve();
          else retry();
        });
        req.once('error', retry);
        req.once('timeout', () => {
          req.destroy();
          retry();
        });
      };
      const retry = () => {
        if (Date.now() >= deadline) {
          reject(new Error('The local Prime Station server did not become healthy within 30 seconds.'));
          return;
        }
        setTimeout(attempt, 300);
      };
      attempt();
    });
  }

  async function startServer() {
    const port = await freePort();
    const dataDir = path.join(app.getPath('userData'), 'data');
    const uploadDir = path.join(dataDir, 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });

    Object.assign(process.env, {
      NODE_ENV: 'production',
      PORT: String(port),
      DATA_DIR: dataDir,
      UPLOAD_DIR: uploadDir,
      DATABASE_PATH: path.join(dataDir, 'prime-station.sqlite'),
      BASE_URL: 'http://127.0.0.1:' + port,
      AGENTS_PATH: path.join(appRoot(), 'agents.json'),
      ...loadOrCreateSecrets(dataDir)
    });

    const serverEntry = path.join(appRoot(), 'server', 'index.js');
    if (!fs.existsSync(serverEntry)) {
      throw new Error('server/index.js is missing from the installed Prime Station application.');
    }

    await import(pathToFileURL(path.join(appRoot(), 'server', 'index.js')).href);
    await waitForServer(port, 30000);
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
      dialog.showErrorBox(
        'Prime Station could not start',
        err && err.stack ? err.stack : String(err)
      );
      app.quit();
    }
  });
}
