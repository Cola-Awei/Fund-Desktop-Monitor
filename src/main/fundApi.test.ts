import { describe, expect, it } from "vitest";
import { buildFundQuoteUrl } from "./fundApi.js";

describe("buildFundQuoteUrl", () => {
  it("builds fundgz endpoint with cache busting", () => {
    expect(buildFundQuoteUrl("000001", 123)).toBe(
      "https://fundgz.1234567.com.cn/js/000001.js?rt=123",
    );
  });
});
