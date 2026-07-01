import type {
  FundStockHoldings,
  HoldingInput,
  HoldingInputErrors,
  PortfolioSnapshot,
} from "../shared/types.js";

export {};

type AddHoldingResult =
  | { ok: true; snapshot: PortfolioSnapshot }
  | { ok: false; errors: HoldingInputErrors };

type FundStockHoldingsResult =
  | { ok: true; holdings: FundStockHoldings }
  | { ok: false; error: string };

declare global {
  interface Window {
    fundApp: {
      getSnapshot(): Promise<PortfolioSnapshot>;
      addHolding(input: HoldingInput): Promise<AddHoldingResult>;
      getFundStockHoldings(fundCode: string): Promise<FundStockHoldingsResult>;
      removeHolding(fundCode: string): Promise<PortfolioSnapshot>;
      refreshNow(): Promise<PortfolioSnapshot>;
      minimize(): Promise<void>;
      closeToTray(): Promise<void>;
      onSnapshotUpdated(callback: (snapshot: PortfolioSnapshot) => void): () => void;
    };
  }
}
