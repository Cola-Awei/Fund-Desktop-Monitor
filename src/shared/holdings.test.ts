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

  it("returns field errors for invalid input", () => {
    const result = normalizeHoldingInput({
      mode: "costPrice",
      fundCode: "abc",
      shares: "0",
      costPrice: ""
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.fundCode).toBeTruthy();
      expect(result.errors.shares).toBeTruthy();
      expect(result.errors.costPrice).toBeTruthy();
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
      mode: "costPrice",
      fundCode: "000001",
      shares: "3200",
      costPrice: "1e3"
    });
    expect(exponentResult.ok).toBe(false);
    if (!exponentResult.ok) {
      expect(exponentResult.errors.costPrice).toBeTruthy();
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
