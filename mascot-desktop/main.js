const { app, BrowserWindow, ipcMain, screen, net } = require("electron");

let win;
let lastTs = 0;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    width: 120,
    height: 160,
    x: width - 140,
    y: height - 180,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadFile("index.html");
}

function fetchNotify() {
  return new Promise((resolve) => {
    const req = net.request(
      `https://raw.githubusercontent.com/hayashi-bit/hajimari_mock/notify/notify.json?_=${Date.now()}`
    );
    req.on("response", (res) => {
      if (res.statusCode !== 200) { resolve(null); return; }
      let body = "";
      res.on("data", (c) => { body += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(body).ts || 0); } catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
    req.end();
  });
}

async function poll() {
  try {
    const ts = await fetchNotify();
    if (ts !== null && ts > 0 && ts !== lastTs) {
      const now = Math.floor(Date.now() / 1000);
      if (lastTs > 0 && ts > now - 600) {
        win?.webContents.send("show-complete");
      }
      lastTs = ts;
    }
  } catch {}
  setTimeout(poll, 10000);
}

app.whenReady().then(async () => {
  createWindow();
  await new Promise((r) => setTimeout(r, 1000));
  const ts = await fetchNotify();
  if (ts) lastTs = ts;
  setTimeout(poll, 10000);
});

app.on("window-all-closed", () => app.quit());
ipcMain.on("close-app", () => app.quit());
