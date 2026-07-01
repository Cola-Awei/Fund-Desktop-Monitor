export type CostInputMode = "costPrice" | "totalAmount" | "profitAmount";

export interface Holding {
  fundCode: string;
  shares: number;
  costPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface HoldingInput {
  mode: CostInputMode;
  fundCode: string;
  shares?: string;
  costPrice?: string;
  totalAmount?: string;
  currentAmount?: string;
  holdingProfit?: string;
  currentPrice?: number;
}

export interface HoldingInputErrors {
  fundCode?: string;
  shares?: string;
  costPrice?: string;
  totalAmount?: string;
  currentAmount?: string;
  holdingProfit?: string;
  currentPrice?: string;
}

export type NormalizeHoldingResult =
  | { ok: true; holding: Holding }
  | { ok: false; errors: HoldingInputErrors };

export interface FundQuote {
  fundCode: string;
  name: string;
  jzrq: string;
  dwjz: number | null;
  gsz: number | null;
  gszzl: number | null;
  gztime: string;
}

export interface HoldingQuoteState {
  holding: Holding;
  quote: FundQuote | null;
  status: "idle" | "loading" | "fresh" | "stale" | "error";
  error?: string;
  lastUpdatedAt?: string;
}

export interface HoldingProfitView {
  holding: Holding;
  quote: FundQuote | null;
  currentPrice: number | null;
  profitLoss: number | null;
  status: HoldingQuoteState["status"];
  error?: string;
}

export interface PortfolioSnapshot {
  holdings: HoldingProfitView[];
  totalProfitLoss: number;
  latestEstimateTime: string | null;
  isRefreshing: boolean;
}
