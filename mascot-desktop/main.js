const { app, BrowserWindow, ipcMain, screen } = require("electron");
const https = require("https");

let win;
let lastTs = 0;
let etag = "";

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
      webSecurity: false,
    },
  });
  win.loadFile("index.html");
}

function fetchNotify() {
  return new Promise((resolve) => {
    const headers = { "User-Agent": "hajimari-mascot/1.7" };
    if (etag) headers["If-None-Match"] = etag;
    const options = {
      hostname: "api.github.com",
      path: "/repos/hayashi-bit/hajimari_mock/contents/notify.json?ref=notify",
      method: "GET",
      headers,
    };
    const req = https.request(options, (res) => {
      if (res.statusCode === 304) { resolve(null); return; }
      if (res.statusCode !== 200) { resolve(null); return; }
      etag = res.headers["etag"] || etag;
      let body = "";
      res.on("data", (c) => { body += c; });
      res.on("end", () => {
        try {
          const d = JSON.parse(body);
          const txt = Buffer.from(d.content.replace(/\n/g, ""), "base64").toString();
          resolve(JSON.parse(txt).ts || 0);
        } catch { resolve(null); }
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
      if (lastTs > 0 && ts > now - 300) {
        win?.webContents.send("show-complete");
      }
      lastTs = ts;
    }
  } catch {}
  setTimeout(poll, 5000);
}

app.whenReady().then(async () => {
  createWindow();
  const ts = await fetchNotify();
  if (ts) lastTs = ts;
  setTimeout(poll, 5000);
});

app.on("window-all-closed", () => app.quit());
ipcMain.on("close-app", () => app.quit());
