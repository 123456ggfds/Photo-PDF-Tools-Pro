const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const isDevelopment = !app.isPackaged && process.env.ELECTRON_START_URL;
const diagnosticsEnabled = process.env.ELECTRON_DIAGNOSTICS === "1";

function writeDiagnostic(message) {
  if (!diagnosticsEnabled) return;
  const filePath = path.join(process.cwd(), "electron-runtime.log");
  fs.appendFileSync(filePath, `[${new Date().toISOString()}] ${message}\n`);
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 980,
    minHeight: 680,
    show: false,
    backgroundColor: "#0f1117",
    title: "Photo & PDF Tools Pro",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://") && !url.startsWith("http://127.0.0.1")) event.preventDefault();
  });
  window.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    writeDiagnostic(`console level=${level} source=${sourceId}:${line} message=${message}`);
  });
  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    writeDiagnostic(`did-fail-load code=${errorCode} description=${errorDescription} url=${validatedURL}`);
  });
  window.webContents.on("render-process-gone", (_event, details) => {
    writeDiagnostic(`render-process-gone reason=${details.reason} exitCode=${details.exitCode}`);
  });
  window.webContents.once("did-finish-load", () => {
    writeDiagnostic(`did-finish-load url=${window.webContents.getURL()}`);
    if (process.env.ELECTRON_SMOKE_TEST) setTimeout(() => app.quit(), 800);
  });

  if (isDevelopment) {
    window.loadURL(process.env.ELECTRON_START_URL);
  } else {
    window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId("com.photopdftools.pro");
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
