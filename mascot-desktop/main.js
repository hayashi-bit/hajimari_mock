const { app, BrowserWindow, ipcMain, screen } = require("electron");
const http = require("http");
const path = require("path");

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

// HTTP server to receive notifications from Stop hook
function startNotifyServer() {
  const server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/notify") {
      win?.webContents.send("show-complete");
      res.writeHead(200);
      res.end("ok");
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(39876, "127.0.0.1", () => {
    console.log("Notify server running on port 39876");
  });
}

app.whenReady().then(() => {
  createWindow();
  startNotifyServer();
});

app.on("window-all-closed", () => app.quit());

ipcMain.on("close-app", () => app.quit());
