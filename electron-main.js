const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const next = require('next');

let mainWindow;
let server;

async function createServer() {
  const dev = false;
  const nextApp = next({ dev, dir: __dirname });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      handle(req, res);
    });

    // Boş bir port bulması için 0 veriyoruz
    srv.listen(0, (err) => {
      if (err) return reject(err);
      const address = srv.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({ srv, port });
    });
  });
}

async function createWindow() {
  try {
    const { srv, port } = await createServer();
    server = srv;

    mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    mainWindow.loadURL(`http://localhost:${port}`);

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  } catch (error) {
    console.error('Electron içinde Next sunucusu başlatılırken hata:', error);
    app.quit();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

