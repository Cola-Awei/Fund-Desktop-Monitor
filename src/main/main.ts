import { app, BrowserWindow } from "electron";
import type { Tray } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchFundQuote, fetchFundStockHoldings } from "./fundApi.js";
import { broadcastSnapshot, registerIpc } from "./ipc.js";
import { PortfolioService } from "./portfolioService.js";
import { HoldingStore } from "./storage.js";
import { createAppTray } from "./tray.js";
import type { PortfolioSnapshot } from "../shared/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let appTray: Tray | null = null;
let refreshTimer: NodeJS.Timeout | null = null;
let refreshPromise: Promise<PortfolioSnapshot> | null = null;
let service: PortfolioService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 390,
    height: 330,
    minWidth: 320,
    minHeight: 260,
    resizable: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, "floating");

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

function scheduleRefresh() {
  void refreshAndBroadcast().catch((error) => {
    console.error("Scheduled refresh failed", error);
  });
}

app.whenReady().then(async () => {
  try {
    service = new PortfolioService(new HoldingStore(app.getPath("userData")), fetchFundQuote);
  } catch (error) {
    console.error("Failed to initialize portfolio service.", error);
    createWindow();
    return;
  }

  try {
    await service.load();
  } catch (error) {
    console.error("Failed to load persisted portfolio. Storage was not overwritten.", error);
  }

  registerIpc(service, () => mainWindow, refreshAndBroadcast, fetchFundStockHoldings);
  createWindow();
  appTray = createAppTray({
    getWindow: () => mainWindow,
    refreshNow: refreshAndBroadcast
  });

  try {
    await refreshAndBroadcast();
  } catch (error) {
    console.error("Failed to refresh portfolio during startup.", error);
  }

  refreshTimer = setInterval(scheduleRefresh, 30_000);
});

app.on("before-quit", () => {
  app.isQuitting = true;
  if (refreshTimer) clearInterval(refreshTimer);
});

app.on("window-all-closed", () => {
  if (process.platform === "darwin") return;
});
