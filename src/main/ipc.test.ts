import { BrowserWindow, ipcMain } from "electron";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHANNELS } from "../shared/ipcChannels.js";
import type { FundStockHoldings, PortfolioSnapshot } from "../shared/types.js";
import { registerIpc } from "./ipc.js";
import type { PortfolioService } from "./portfolioService.js";

vi.mock("electron", () => ({
  BrowserWindow: vi.fn(),
  ipcMain: {
    handle: vi.fn(),
  },
}));

const snapshot: PortfolioSnapshot = {
  holdings: [],
  totalProfitLoss: 0,
  latestEstimateTime: null,
  isRefreshing: false,
};

const holdings: FundStockHoldings = {
  fundCode: "026211",
  fundName: "平安科技精选混合发起式C",
  reportDate: "2026-03-31",
  previousReportDate: "2025-12-31",
  stocks: [],
};

function handlers() {
  return new Map(
    vi.mocked(ipcMain.handle).mock.calls.map(([channel, handler]) => [channel, handler]),
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("registerIpc fund stock holdings", () => {
  it("registers a fund stock holdings handler that validates fund code payloads", async () => {
    const fetchFundStockHoldings = vi.fn().mockResolvedValue(holdings);
    registerIpc(
      {
        snapshot: vi.fn().mockReturnValue(snapshot),
        addHolding: vi.fn(),
        removeHolding: vi.fn(),
      } as unknown as PortfolioService,
      () => null,
      vi.fn().mockResolvedValue(snapshot),
      fetchFundStockHoldings,
    );

    const handler = handlers().get(CHANNELS.getFundStockHoldings);

    await expect(handler?.({} as never, "026211")).resolves.toEqual({
      ok: true,
      holdings,
    });
    await expect(handler?.({} as never, "abc")).resolves.toEqual({
      ok: false,
      error: "Fund code must be exactly 6 digits.",
    });
    expect(fetchFundStockHoldings).toHaveBeenCalledTimes(1);
    expect(BrowserWindow).toBeDefined();
  });
});
