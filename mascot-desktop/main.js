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

function fetchTs() {
  return new Promise((resolve) => {
    const url = `https://raw.githubusercontent.com/hayashi-bit/hajimari_mock/notify/notify.json?_=${Date.now()}`;
    const request = net.request({ url, method: "GET" });
    request.setHeader("Cache-Control", "no-cache");
    let body = "";
    request.on("response", (response) => {
      response.on("data", (chunk) => { body += chunk.toString(); });
      response.on("end", () => {
        try { resolve(JSON.parse(body).ts || 0); }
        catch { resolve(0); }
      });
    });
    request.on("error", () => resolve(0));
    request.end();
  });
}

async function poll() {
  try {
    const ts = await fetchTs();
    if (ts > 0 && ts !== lastTs) {
      const now = Math.floor(Date.now() / 1000);
      if (lastTs > 0 && ts > now - 300) {
        win?.webContents.send("show-complete");
      }
      lastTs = ts;
    }
  } catch {}
  setTimeout(poll, 4000);
}

app.whenReady().then(async () => {
  createWindow();
  lastTs = await fetchTs();
  setTimeout(poll, 4000);
});

app.on("window-all-closed", () => app.quit());
ipcMain.on("close-app", () => app.quit());
