import { describe, expect, it } from "vitest";
import { formatAmount, formatPrice, signClass } from "./money.js";

describe("formatAmount", () => {
  it("formats signed amounts with two decimals", () => {
    expect(formatAmount(128.456)).toBe("+128.46");
    expect(formatAmount(-18.7)).toBe("-18.70");
  });

  it("formats missing or invalid amounts as placeholders", () => {
    expect(formatAmount(null)).toBe("--");
    expect(formatAmount(undefined)).toBe("--");
    expect(formatAmount(Number.POSITIVE_INFINITY)).toBe("--");
    expect(formatAmount(Number.NaN)).toBe("--");
  });
});

describe("formatPrice", () => {
  it("formats valid prices with four decimals", () => {
    expect(formatPrice(1.23456)).toBe("1.2346");
  });

  it("formats missing or invalid prices as placeholders", () => {
    expect(formatPrice(null)).toBe("--");
    expect(formatPrice(undefined)).toBe("--");
    expect(formatPrice(Number.POSITIVE_INFINITY)).toBe("--");
    expect(formatPrice(Number.NaN)).toBe("--");
  });
});

describe("signClass", () => {
  it("maps signs to UI classes", () => {
    expect(signClass(1)).toBe("gain");
    expect(signClass(-1)).toBe("loss");
    expect(signClass(0)).toBe("flat");
  });
});
