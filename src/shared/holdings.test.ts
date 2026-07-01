import { describe, expect, it } from "vitest";
import { normalizeHoldingInput, validateFundCode } from "./holdings";

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
});
