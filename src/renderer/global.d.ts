import type { HoldingInput, NormalizeHoldingResult, PortfolioSnapshot } from "../shared/types.js";

export {};

declare global {
  interface Window {
    fundApp: {
      getSnapshot(): Promise<PortfolioSnapshot>;
      addHolding(input: HoldingInput): Promise<NormalizeHoldingResult | { ok: true; snapshot: PortfolioSnapshot }>;
      removeHolding(fundCode: string): Promise<PortfolioSnapshot>;
      refreshNow(): Promise<PortfolioSnapshot>;
      minimize(): Promise<void>;
      closeToTray(): Promise<void>;
      onSnapshotUpdated(callback: (snapshot: PortfolioSnapshot) => void): () => void;
    };
  }
}
