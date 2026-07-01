import type { HoldingInput, HoldingInputErrors, PortfolioSnapshot } from "../shared/types.js";

export {};

type AddHoldingResult =
  | { ok: true; snapshot: PortfolioSnapshot }
  | { ok: false; errors: HoldingInputErrors };

declare global {
  interface Window {
    fundApp: {
      getSnapshot(): Promise<PortfolioSnapshot>;
      addHolding(input: HoldingInput): Promise<AddHoldingResult>;
      removeHolding(fundCode: string): Promise<PortfolioSnapshot>;
      refreshNow(): Promise<PortfolioSnapshot>;
      minimize(): Promise<void>;
      closeToTray(): Promise<void>;
      onSnapshotUpdated(callback: (snapshot: PortfolioSnapshot) => void): () => void;
    };
  }
}
