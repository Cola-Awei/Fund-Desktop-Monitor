import { BrowserWindow, ipcMain } from "electron";
import { normalizeHoldingInput } from "../shared/holdings.js";
import { CHANNELS } from "../shared/ipcChannels.js";
import type { PortfolioSnapshot } from "../shared/types.js";
import type { PortfolioService } from "./portfolioService.js";

export function broadcastSnapshot(window: BrowserWindow | null, snapshot: unknown) {
  window?.webContents.send(CHANNELS.snapshotUpdated, snapshot);
}

export function registerIpc(
  service: PortfolioService,
  getWindow: () => BrowserWindow | null,
  refreshNow: () => Promise<PortfolioSnapshot>,
) {
  ipcMain.handle(CHANNELS.getSnapshot, () => service.snapshot());
  ipcMain.handle(CHANNELS.addHolding, async (_event, input) => {
    const normalized = normalizeHoldingInput(input);
    if (!normalized.ok) return normalized;
    const snapshot = await service.addHolding(normalized.holding);
    return { ok: true, snapshot };
  });
  ipcMain.handle(CHANNELS.removeHolding, (_event, fundCode: string) => service.removeHolding(fundCode));
  ipcMain.handle(CHANNELS.refreshNow, refreshNow);
  ipcMain.handle(CHANNELS.minimize, () => getWindow()?.minimize());
  ipcMain.handle(CHANNELS.closeToTray, () => getWindow()?.hide());
}
