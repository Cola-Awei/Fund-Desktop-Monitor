import { BrowserWindow, ipcMain } from "electron";
import { CHANNELS } from "../shared/ipcChannels.js";
import type { FundQuote, PortfolioSnapshot } from "../shared/types.js";
import {
  normalizeProfitAmountHoldingInput,
  safeNormalizeHoldingInput,
  validateRemoveHoldingFundCode,
} from "./ipcPayload.js";
import type { PortfolioService } from "./portfolioService.js";

type QuoteFetcher = (fundCode: string) => Promise<FundQuote>;

function isProfitAmountInput(input: unknown): input is { mode: "profitAmount"; fundCode: string } {
  return (
    typeof input === "object" &&
    input !== null &&
    "mode" in input &&
    input.mode === "profitAmount" &&
    "fundCode" in input &&
    typeof input.fundCode === "string"
  );
}

export function broadcastSnapshot(window: BrowserWindow | null, snapshot: PortfolioSnapshot) {
  window?.webContents.send(CHANNELS.snapshotUpdated, snapshot);
}

export function registerIpc(
  service: PortfolioService,
  getWindow: () => BrowserWindow | null,
  refreshNow: () => Promise<PortfolioSnapshot>,
  fetchQuote?: QuoteFetcher,
) {
  ipcMain.handle(CHANNELS.getSnapshot, () => service.snapshot());
  ipcMain.handle(CHANNELS.addHolding, async (_event, input: unknown) => {
    const normalized =
      isProfitAmountInput(input) && fetchQuote
        ? normalizeProfitAmountHoldingInput(
            input,
            await fetchQuote(String(input.fundCode ?? "")),
          )
        : safeNormalizeHoldingInput(input);
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
