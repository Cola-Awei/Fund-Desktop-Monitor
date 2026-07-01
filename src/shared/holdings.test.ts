import { describe, expect, it } from "vitest";
import { normalizeHoldingInput, validateFundCode } from "./holdings.js";

describe("validateFundCode", () => {
  it("accepts exactly six digits", () => {
    expect(validateFundCode("000001")).toBe(true);
  });

  it("rejects non-six-digit values", () => {
    expect(validateFundCode("1")).toBe(false);
    expect(validateFundCode("00001A")).toBe(false);
    expect(validateFundCode("0000001")).toBe(false);
  });
});

describe("normalizeHoldingInput", () => {
  it("uses cost price mode directly", () => {
    const result = normalizeHoldingInput({
      mode: "costPrice",
      fundCode: "000001",
      shares: "3200",
      costPrice: "1.62"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holding.fundCode).toBe("000001");
      expect(result.holding.shares).toBe(3200);
      expect(result.holding.costPrice).toBe(1.62);
    }
  });

  it("converts total amount mode into cost price", () => {
    const result = normalizeHoldingInput({
      mode: "totalAmount",
      fundCode: "000001",
      shares: "3200",
      totalAmount: "5184"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holding.costPrice).toBe(1.62);
    }
  });

  it("converts current amount and profit mode into shares and cost price", () => {
    const result = normalizeHoldingInput({
      mode: "profitAmount",
      fundCode: "000001",
      currentAmount: "1654.70",
      holdingProfit: "154.70",
      currentPrice: 1.6547
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holding.shares).toBeCloseTo(1000, 6);
      expect(result.holding.costPrice).toBeCloseTo(1.5, 6);
    }
  });

  it("returns field errors for invalid input", () => {
    const result = normalizeHoldingInput({
      mode: "totalAmount",
      fundCode: "abc",
      shares: "0",
      totalAmount: ""
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.fundCode).toBeTruthy();
      expect(result.errors.shares).toBeTruthy();
      expect(result.errors.totalAmount).toBeTruthy();
    }
  });

  it("rejects current amount mode when calculated investment is not positive", () => {
    const result = normalizeHoldingInput({
      mode: "profitAmount",
      fundCode: "000001",
      currentAmount: "100",
      holdingProfit: "100",
      currentPrice: 1
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.holdingProfit).toBeTruthy();
    }
  });

  it("rejects hexadecimal and exponent numeric input", () => {
    const hexResult = normalizeHoldingInput({
      mode: "costPrice",
      fundCode: "000001",
      shares: "0x10",
      costPrice: "1.62"
    });
    expect(hexResult.ok).toBe(false);
    if (!hexResult.ok) {
      expect(hexResult.errors.shares).toBeTruthy();
    }

    const exponentResult = normalizeHoldingInput({
      mode: "totalAmount",
      fundCode: "000001",
      shares: "3200",
      totalAmount: "1e3"
    });
    expect(exponentResult.ok).toBe(false);
    if (!exponentResult.ok) {
      expect(exponentResult.errors.totalAmount).toBeTruthy();
    }
  });

  it("rejects blank numeric input", () => {
    const result = normalizeHoldingInput({
      mode: "costPrice",
      fundCode: "000001",
      shares: "   ",
      costPrice: ""
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.shares).toBeTruthy();
      expect(result.errors.costPrice).toBeTruthy();
    }
  });

  it("uses injected time for created and updated timestamps", () => {
    const now = new Date("2026-07-01T12:34:56.789Z");
    const result = normalizeHoldingInput(
      {
        mode: "costPrice",
        fundCode: "000001",
        shares: "3200",
        costPrice: "1.62"
      },
      now
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holding.createdAt).toBe("2026-07-01T12:34:56.789Z");
      expect(result.holding.updatedAt).toBe("2026-07-01T12:34:56.789Z");
    }
  });
});
