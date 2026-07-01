import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchFundQuote } from "./fundApi.js";
import { broadcastSnapshot, registerIpc } from "./ipc.js";
import { PortfolioService } from "./portfolioService.js";
import { HoldingStore } from "./storage.js";
import type { PortfolioSnapshot } from "../shared/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let refreshTimer: NodeJS.Timeout | null = null;
let refreshPromise: Promise<PortfolioSnapshot> | null = null;
let service: PortfolioService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 390,
    height: 330,
    resizable: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) void mainWindow.loadURL(devUrl);
  else void mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
}

function refreshAndBroadcast() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = service
    .refreshAll()
    .then((snapshot) => {
      broadcastSnapshot(mainWindow, snapshot);
      return snapshot;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

app.whenReady().then(async () => {
  service = new PortfolioService(new HoldingStore(app.getPath("userData")), fetchFundQuote);
  registerIpc(service, () => mainWindow, refreshAndBroadcast);
  createWindow();
  await service.load();
  await refreshAndBroadcast();
  refreshTimer = setInterval(() => void refreshAndBroadcast(), 30_000);
});

app.on("before-quit", () => {
  app.isQuitting = true;
  if (refreshTimer) clearInterval(refreshTimer);
});

app.on("window-all-closed", () => {
  if (process.platform === "darwin") return;
});
