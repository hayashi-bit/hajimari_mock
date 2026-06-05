const { app, BrowserWindow, ipcMain, screen } = require("electron");
const https = require("https");
const path = require("path");

const SUPABASE_URL = "kwmulkworqsswmiqbabd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bXVsa3dvcnFzc3dtaXFiYWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDQwMzcsImV4cCI6MjA5MjcyMDAzN30.yT9dssLbf6gjIzisahhRy8CJpzjxyQxpXdg_tI63imE";

let win;

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

function supabaseRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path,
      method,
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function startPolling() {
  setInterval(async () => {
    try {
      const rows = await supabaseRequest("GET", "/rest/v1/mascot_notify?id=eq.1&select=done", null);
      if (Array.isArray(rows) && rows[0]?.done) {
        // Reset flag
        await supabaseRequest("PATCH", "/rest/v1/mascot_notify?id=eq.1", { done: false });
        win?.webContents.send("show-complete");
      }
    } catch (e) {
      console.error("Poll error:", e.message);
    }
  }, 2000);
}

app.whenReady().then(() => {
  createWindow();
  startPolling();
});

app.on("window-all-closed", () => app.quit());

ipcMain.on("close-app", () => app.quit());
