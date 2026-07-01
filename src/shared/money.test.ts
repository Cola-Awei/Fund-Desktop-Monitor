import { describe, expect, it } from "vitest";
import { formatAmount, signClass } from "./money";

describe("formatAmount", () => {
  it("formats signed amounts with two decimals", () => {
    expect(formatAmount(128.456)).toBe("+128.46");
    expect(formatAmount(-18.7)).toBe("-18.70");
  });
});

describe("signClass", () => {
  it("maps signs to UI classes", () => {
    expect(signClass(1)).toBe("gain");
    expect(signClass(-1)).toBe("loss");
    expect(signClass(0)).toBe("flat");
  });
});
