import { BrowserWindow, ipcMain } from "electron";
import { CHANNELS } from "../shared/ipcChannels.js";
import type { PortfolioSnapshot } from "../shared/types.js";
import { safeNormalizeHoldingInput, validateRemoveHoldingFundCode } from "./ipcPayload.js";
import type { PortfolioService } from "./portfolioService.js";

export function broadcastSnapshot(window: BrowserWindow | null, snapshot: PortfolioSnapshot) {
  window?.webContents.send(CHANNELS.snapshotUpdated, snapshot);
}

export function registerIpc(
  service: PortfolioService,
  getWindow: () => BrowserWindow | null,
  refreshNow: () => Promise<PortfolioSnapshot>,
) {
  ipcMain.handle(CHANNELS.getSnapshot, () => service.snapshot());
  ipcMain.handle(CHANNELS.addHolding, async (_event, input: unknown) => {
    const normalized = safeNormalizeHoldingInput(input);
    if (!normalized.ok) return normalized;
    const snapshot = await service.addHolding(normalized.holding);
    return { ok: true, snapshot };
  });
  ipcMain.handle(CHANNELS.removeHolding, (_event, fundCode: unknown) => {
    const validatedFundCode = validateRemoveHoldingFundCode(fundCode);
    if (validatedFundCode === null) return service.snapshot();
    return service.removeHolding(validatedFundCode);
  });
  ipcMain.handle(CHANNELS.refreshNow, refreshNow);
  ipcMain.handle(CHANNELS.minimize, () => getWindow()?.minimize());
  ipcMain.handle(CHANNELS.closeToTray, () => getWindow()?.hide());
}
