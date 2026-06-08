const { app, BrowserWindow, ipcMain, screen, net } = require("electron");

const SUPABASE_URL = "https://kwmulkworqsswmiqbabd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bXVsa3dvcnFzc3dtaXFiYWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDQwMzcsImV4cCI6MjA5MjcyMDAzN30.yT9dssLbf6gjIzisahhRy8CJpzjxyQxpXdg_tI63imE";

let win;
let lastUpdatedAt = "";

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
    const req = net.request({
      method: "GET",
      url: `${SUPABASE_URL}/rest/v1/mascot_notify?id=eq.1&select=updated_at`,
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    req.on("response", (res) => {
      if (res.statusCode !== 200) { resolve(null); return; }
      let body = "";
      res.on("data", (c) => { body += c; });
      res.on("end", () => {
        try {
          const rows = JSON.parse(body);
          resolve(rows[0]?.updated_at || null);
        } catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
    req.end();
  });
}

async function poll() {
  try {
    const updatedAt = await fetchNotify();
    if (updatedAt && updatedAt !== lastUpdatedAt) {
      if (lastUpdatedAt !== "") {
        win?.webContents.send("show-complete");
      }
      lastUpdatedAt = updatedAt;
    }
  } catch {}
  setTimeout(poll, 5000);
}

app.whenReady().then(async () => {
  createWindow();
  await new Promise((r) => setTimeout(r, 1000));
  const updatedAt = await fetchNotify();
  if (updatedAt) lastUpdatedAt = updatedAt;
  setTimeout(poll, 5000);
});

app.on("window-all-closed", () => app.quit());
ipcMain.on("close-app", () => app.quit());
