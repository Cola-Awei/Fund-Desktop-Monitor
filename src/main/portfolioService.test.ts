import { describe, expect, it, vi } from "vitest";
import { PortfolioService } from "./portfolioService.js";
import type { FundQuote, Holding } from "../shared/types.js";

const holding: Holding = {
  fundCode: "000001",
  shares: 1000,
  costPrice: 1.5,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

const quote: FundQuote = {
  fundCode: "000001",
  name: "Fund A",
  jzrq: "2026-06-30",
  dwjz: 1.52,
  gsz: 1.56,
  gszzl: 1.2,
  gztime: "2026-07-01 10:33",
};

describe("PortfolioService", () => {
  it("adds holdings and refreshes quotes", async () => {
    const service = new PortfolioService(
      {
        load: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockResolvedValue(undefined),
      },
      vi.fn().mockResolvedValue(quote),
    );

    await service.load();
    await service.addHolding(holding);
    const snapshot = await service.refreshAll();

    expect(snapshot.holdings[0].profitLoss).toBeCloseTo(60);
    expect(snapshot.totalProfitLoss).toBeCloseTo(60);
    expect(snapshot.latestEstimateTime).toBe("2026-07-01 10:33");
  });

  it("marks a holding as error without dropping it", async () => {
    const service = new PortfolioService(
      {
        load: vi.fn().mockResolvedValue([holding]),
        save: vi.fn().mockResolvedValue(undefined),
      },
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    await service.load();
    const snapshot = await service.refreshAll();

    expect(snapshot.holdings[0].status).toBe("error");
    expect(snapshot.holdings[0].error).toBe("network down");
  });

  it("reports refreshing while refresh quotes are pending", async () => {
    let resolveQuote: (quote: FundQuote) => void;
    const pendingQuote = new Promise<FundQuote>((resolve) => {
      resolveQuote = resolve;
    });
    const service = new PortfolioService(
      {
        load: vi.fn().mockResolvedValue([holding]),
        save: vi.fn().mockResolvedValue(undefined),
      },
      vi.fn().mockReturnValue(pendingQuote),
    );

    await service.load();
    const refresh = service.refreshAll();

    expect(service.snapshot().isRefreshing).toBe(true);

    resolveQuote!(quote);
    const snapshot = await refresh;

    expect(snapshot.isRefreshing).toBe(false);
    expect(service.snapshot().isRefreshing).toBe(false);
  });

  it("resets refreshing after unexpected refresh path exceptions", async () => {
    const service = new PortfolioService(
      {
        load: vi.fn().mockResolvedValue([holding]),
        save: vi.fn().mockResolvedValue(undefined),
      },
      vi.fn().mockResolvedValue(quote),
    );

    await service.load();
    (service as unknown as { holdings: { map: () => never } }).holdings = {
      map: () => {
        throw new Error("unexpected refresh failure");
      },
    };

    await expect(service.refreshAll()).rejects.toThrow("unexpected refresh failure");
    expect((service as unknown as { refreshing: boolean }).refreshing).toBe(false);
  });
});
