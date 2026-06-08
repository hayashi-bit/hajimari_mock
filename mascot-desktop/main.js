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

function supabaseGet() {
  return new Promise((resolve) => {
    const options = {
      hostname: SUPABASE_URL,
      path: "/rest/v1/mascot_notify?id=eq.1&select=done",
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const rows = JSON.parse(data);
          resolve(rows[0]?.done ?? false);
        } catch { resolve(false); }
      });
    });
    req.on("error", () => resolve(false));
    req.end();
  });
}

function supabaseReset() {
  return new Promise((resolve) => {
    const body = JSON.stringify({ done: false });
    const options = {
      hostname: SUPABASE_URL,
      path: "/rest/v1/mascot_notify?id=eq.1",
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      res.on("data", () => {});
      res.on("end", resolve);
    });
    req.on("error", resolve);
    req.write(body);
    req.end();
  });
}

function startPolling() {
  setInterval(async () => {
    try {
      const done = await supabaseGet();
      if (done) {
        await supabaseReset();
        win?.webContents.send("show-complete");
      }
    } catch {}
  }, 3000);
}

app.whenReady().then(() => {
  createWindow();
  startPolling();
});

app.on("window-all-closed", () => app.quit());

ipcMain.on("close-app", () => app.quit());
