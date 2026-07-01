import { describe, expect, it } from "vitest";
import { safeNormalizeHoldingInput, validateRemoveHoldingFundCode } from "./ipcPayload.js";

describe("safeNormalizeHoldingInput", () => {
  it("returns field errors instead of throwing for a non-object payload", () => {
    const result = safeNormalizeHoldingInput(null);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.fundCode).toBe("Fund code must be exactly 6 digits.");
      expect(result.errors.shares).toBe("Holding shares must be greater than 0.");
      expect(result.errors.costPrice).toBe("Cost unit price must be greater than 0.");
    }
  });

  it("returns relevant field errors for malformed field types", () => {
    const result = safeNormalizeHoldingInput({
      mode: "totalAmount",
      fundCode: 123456,
      shares: null,
      totalAmount: 100,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.fundCode).toBe("Fund code must be exactly 6 digits.");
      expect(result.errors.shares).toBe("Holding shares must be greater than 0.");
      expect(result.errors.totalAmount).toBe("Total invested amount must be greater than 0.");
    }
  });

  it("rejects invalid input mode before normalization", () => {
    const result = safeNormalizeHoldingInput({
      mode: "marketValue",
      fundCode: "000001",
      shares: "3200",
      totalAmount: "5184",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.costPrice).toBe("Cost unit price must be greater than 0.");
      expect(result.errors.totalAmount).toBe("Total invested amount must be greater than 0.");
    }
  });

  it("normalizes valid holding input payloads", () => {
    const result = safeNormalizeHoldingInput({
      mode: "costPrice",
      fundCode: "000001",
      shares: "3200",
      costPrice: "1.62",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holding.fundCode).toBe("000001");
      expect(result.holding.shares).toBe(3200);
      expect(result.holding.costPrice).toBe(1.62);
    }
  });

  it("normalizes current amount and profit input payloads", () => {
    const result = safeNormalizeHoldingInput({
      mode: "profitAmount",
      fundCode: "000001",
      currentAmount: "1654.70",
      holdingProfit: "154.70",
      currentPrice: 1.6547,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holding.shares).toBeCloseTo(1000, 6);
      expect(result.holding.costPrice).toBeCloseTo(1.5, 6);
    }
  });
});

describe("validateRemoveHoldingFundCode", () => {
  it("accepts exact six-digit string fund codes", () => {
    expect(validateRemoveHoldingFundCode("000001")).toBe("000001");
  });

  it("rejects malformed remove payloads", () => {
    expect(validateRemoveHoldingFundCode(1)).toBeNull();
    expect(validateRemoveHoldingFundCode("00001A")).toBeNull();
    expect(validateRemoveHoldingFundCode(" 000001 ")).toBeNull();
  });
});
