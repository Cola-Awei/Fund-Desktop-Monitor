import { describe, expect, it } from "vitest";
import { calculateHoldingProfit, summarizePortfolio } from "./profit.js";

describe("calculateHoldingProfit", () => {
  it("uses intraday estimate before latest net value", () => {
    const result = calculateHoldingProfit(
      { fundCode: "000001", shares: 1000, costPrice: 1.5, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z" },
      { fundCode: "000001", name: "Fund A", dwjz: 1.52, gsz: 1.56, gszzl: 1.2, gztime: "2026-07-01 10:33", jzrq: "2026-06-30" }
    );
    expect(result.currentPrice).toBe(1.56);
    expect(result.profitLoss).toBeCloseTo(60);
  });

  it("falls back to latest net value when estimate is missing", () => {
    const result = calculateHoldingProfit(
      { fundCode: "000001", shares: 1000, costPrice: 1.5, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z" },
      { fundCode: "000001", name: "Fund A", dwjz: 1.52, gsz: null, gszzl: null, gztime: "", jzrq: "2026-06-30" }
    );
    expect(result.currentPrice).toBe(1.52);
    expect(result.profitLoss).toBeCloseTo(20);
  });

  it("returns null values when quote has no usable price", () => {
    const result = calculateHoldingProfit(
      { fundCode: "000001", shares: 1000, costPrice: 1.5, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z" },
      { fundCode: "000001", name: "Fund A", dwjz: null, gsz: null, gszzl: null, gztime: "", jzrq: "2026-06-30" }
    );
    expect(result.currentPrice).toBeNull();
    expect(result.profitLoss).toBeNull();
  });
});

describe("summarizePortfolio", () => {
  it("sums profit/loss values", () => {
    expect(summarizePortfolio([{ profitLoss: 10 }, { profitLoss: -3.5 }])).toEqual({ totalProfitLoss: 6.5 });
  });

  it("treats null profit/loss values as zero", () => {
    expect(summarizePortfolio([{ profitLoss: 10 }, { profitLoss: null }, { profitLoss: -3.5 }])).toEqual({ totalProfitLoss: 6.5 });
  });
});
