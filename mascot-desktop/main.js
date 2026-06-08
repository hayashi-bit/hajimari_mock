const { app, BrowserWindow, ipcMain, screen } = require("electron");
const https = require("https");

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

function fetchTs() {
  return new Promise((resolve) => {
    const t = Date.now();
    const options = {
      hostname: "raw.githubusercontent.com",
      path: `/hayashi-bit/hajimari_mock/notify/notify.json?t=${t}`,
      method: "GET",
      headers: {
        "User-Agent": "hajimari-mascot",
        "Cache-Control": "no-cache, no-store",
        "Pragma": "no-cache",
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const { ts } = JSON.parse(data);
          resolve(ts || 0);
        } catch { resolve(0); }
      });
    });
    req.on("error", () => resolve(0));
    req.end();
  });
}

async function poll() {
  try {
    const ts = await fetchTs();
    if (ts && ts !== lastTs && ts > (Date.now() / 1000 - 300)) {
      if (lastTs !== 0) {
        win?.webContents.send("show-complete");
      }
      lastTs = ts;
    }
  } catch {}
  setTimeout(poll, 5000);
}

app.whenReady().then(async () => {
  createWindow();
  lastTs = await fetchTs();
  setTimeout(poll, 5000);
});

app.on("window-all-closed", () => app.quit());
ipcMain.on("close-app", () => app.quit());
