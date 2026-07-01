import type { FundQuote, Holding, HoldingProfitView } from "./types.js";

export function getCurrentPrice(quote: FundQuote | null) {
  if (!quote) return null;
  if (typeof quote.gsz === "number" && Number.isFinite(quote.gsz)) return quote.gsz;
  if (typeof quote.dwjz === "number" && Number.isFinite(quote.dwjz)) return quote.dwjz;
  return null;
}

export function calculateHoldingProfit(holding: Holding, quote: FundQuote | null): HoldingProfitView {
  const currentPrice = getCurrentPrice(quote);
  return {
    holding,
    quote,
    currentPrice,
    profitLoss: currentPrice === null ? null : (currentPrice - holding.costPrice) * holding.shares,
    status: quote ? "fresh" : "idle"
  };
}

export function summarizePortfolio(items: Array<{ profitLoss: number | null }>) {
  return {
    totalProfitLoss: items.reduce((sum, item) => sum + (item.profitLoss ?? 0), 0)
  };
}
