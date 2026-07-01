import { calculateHoldingProfit, summarizePortfolio } from "../shared/profit.js";
import type { FundQuote, Holding, HoldingProfitView, PortfolioSnapshot } from "../shared/types.js";
import type { HoldingStorage } from "./storage.js";

type QuoteFetcher = (fundCode: string) => Promise<FundQuote>;

export class PortfolioService {
  private holdings: Holding[] = [];
  private quoteByCode = new Map<string, FundQuote>();
  private errorByCode = new Map<string, string>();
  private refreshing = false;

  constructor(
    private readonly storage: HoldingStorage,
    private readonly fetchQuote: QuoteFetcher,
  ) {}

  async load() {
    this.holdings = await this.storage.load();
    return this.snapshot();
  }

  async addHolding(holding: Holding) {
    const existingIndex = this.holdings.findIndex((item) => item.fundCode === holding.fundCode);
    if (existingIndex >= 0) {
      this.holdings[existingIndex] = {
        ...holding,
        createdAt: this.holdings[existingIndex].createdAt,
      };
    } else {
      this.holdings.push(holding);
    }
    await this.storage.save(this.holdings);
    return this.snapshot();
  }

  async removeHolding(fundCode: string) {
    this.holdings = this.holdings.filter((holding) => holding.fundCode !== fundCode);
    this.quoteByCode.delete(fundCode);
    this.errorByCode.delete(fundCode);
    await this.storage.save(this.holdings);
    return this.snapshot();
  }

  async refreshAll() {
    this.refreshing = true;
    await Promise.all(
      this.holdings.map(async (holding) => {
        try {
          const quote = await this.fetchQuote(holding.fundCode);
          this.quoteByCode.set(holding.fundCode, quote);
          this.errorByCode.delete(holding.fundCode);
        } catch (error) {
          this.errorByCode.set(
            holding.fundCode,
            error instanceof Error ? error.message : "Refresh failed",
          );
        }
      }),
    );
    this.refreshing = false;
    return this.snapshot();
  }

  snapshot(): PortfolioSnapshot {
    const items: HoldingProfitView[] = this.holdings.map((holding) => {
      const quote = this.quoteByCode.get(holding.fundCode) ?? null;
      const calculated = calculateHoldingProfit(holding, quote);
      const error = this.errorByCode.get(holding.fundCode);
      return {
        ...calculated,
        status: error ? "error" : quote ? "fresh" : "idle",
        error,
      };
    });

    const { totalProfitLoss } = summarizePortfolio(items);
    const latestEstimateTime =
      items
        .map((item) => item.quote?.gztime)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null;

    return {
      holdings: items,
      totalProfitLoss,
      latestEstimateTime,
      isRefreshing: this.refreshing,
    };
  }
}
