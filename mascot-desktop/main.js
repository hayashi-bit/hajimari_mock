const { app, BrowserWindow, ipcMain, screen } = require("electron");
const https = require("https");
const path = require("path");

const GITHUB_API = "api.github.com";
const NOTIFY_PATH = "/repos/hayashi-bit/hajimari_mock/contents/notify.json?ref=notify";

let win;
let lastEtag = "";
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
    const headers = { "User-Agent": "hajimari-mascot" };
    if (lastEtag) headers["If-None-Match"] = lastEtag;

    const options = {
      hostname: GITHUB_API,
      path: NOTIFY_PATH,
      method: "GET",
      headers,
    };

    const req = https.request(options, (res) => {
      // 304 = not modified, free request, no change
      if (res.statusCode === 304) {
        resolve({ changed: false });
        return;
      }

      // 403 = rate limited, back off
      if (res.statusCode === 403) {
        resolve({ changed: false, rateLimit: true });
        return;
      }

      const etag = res.headers["etag"] || "";
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const content = Buffer.from(json.content, "base64").toString("utf8");
          const { ts } = JSON.parse(content);
          lastEtag = etag;
          resolve({ changed: true, ts });
        } catch {
          resolve({ changed: false });
        }
      });
    });
    req.on("error", () => resolve({ changed: false }));
    req.end();
  });
}

let pollInterval = 5000;

async function poll() {
  const result = await fetchNotify();

  if (result.rateLimit) {
    // rate limited, slow down
    pollInterval = 60000;
  } else if (result.changed) {
    pollInterval = 5000;
    const { ts } = result;
    if (ts && ts !== lastTs && ts > (Date.now() / 1000 - 120)) {
      lastTs = ts;
      win?.webContents.send("show-complete");
    }
    if (ts) lastTs = ts;
  }

  setTimeout(poll, pollInterval);
}

app.whenReady().then(async () => {
  createWindow();
  // Initial fetch to get current ts and etag (baseline)
  const init = await fetchNotify();
  if (init.changed && init.ts) lastTs = init.ts;
  setTimeout(poll, pollInterval);
});

app.on("window-all-closed", () => app.quit());

ipcMain.on("close-app", () => app.quit());
