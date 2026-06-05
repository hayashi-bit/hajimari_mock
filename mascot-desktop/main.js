const { app, BrowserWindow, ipcMain, screen } = require("electron");
const https = require("https");
const path = require("path");

const GITHUB_API = "api.github.com";
const NOTIFY_PATH = "/repos/hayashi-bit/hajimari_mock/contents/notify.json?ref=notify";

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
  win.setIgnoreMouseEvents(false);
}

function fetchNotify() {
  return new Promise((resolve) => {
    const options = {
      hostname: GITHUB_API,
      path: NOTIFY_PATH,
      method: "GET",
      headers: { "User-Agent": "hajimari-mascot" },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const content = Buffer.from(json.content, "base64").toString("utf8");
          const { ts } = JSON.parse(content);
          resolve(ts);
        } catch {
          resolve(null);
        }
      });
    });
    req.on("error", () => resolve(null));
    req.end();
  });
}

function startPolling() {
  setInterval(async () => {
    const ts = await fetchNotify();
    if (ts && ts !== lastTs && ts > (Date.now() / 1000 - 60)) {
      lastTs = ts;
      win?.webContents.send("show-complete");
    }
    if (ts) lastTs = ts;
  }, 3000);
}

app.whenReady().then(async () => {
  createWindow();
  lastTs = (await fetchNotify()) ?? 0;
  startPolling();
});

app.on("window-all-closed", () => app.quit());

ipcMain.on("close-app", () => app.quit());
