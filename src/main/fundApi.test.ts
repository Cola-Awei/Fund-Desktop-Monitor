import { afterEach, describe, expect, it, vi } from "vitest";
import { buildFundQuoteUrl, fetchFundQuote } from "./fundApi.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.fetch = originalFetch;
});

describe("buildFundQuoteUrl", () => {
  it("builds fundgz endpoint with cache busting", () => {
    expect(buildFundQuoteUrl("000001", 123)).toBe(
      "https://fundgz.1234567.com.cn/js/000001.js?rt=123",
    );
  });
});

describe("fetchFundQuote", () => {
  it("returns normalized quote from an OK response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          'jsonpgz({"fundcode":"000001","name":"Fund A","jzrq":"2026-06-30","dwjz":"1.6370","gsz":"1.6547","gszzl":"1.08","gztime":"2026-07-01 10:33"});',
        ),
    } as Response);
    globalThis.fetch = fetchMock;

    await expect(fetchFundQuote("000001")).resolves.toEqual({
      fundCode: "000001",
      name: "Fund A",
      jzrq: "2026-06-30",
      dwjz: 1.637,
      gsz: 1.6547,
      gszzl: 1.08,
      gztime: "2026-07-01 10:33",
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("000001.js"));
  });

  it("throws on non-OK responses", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(""),
    } as Response);

    await expect(fetchFundQuote("000001")).rejects.toThrow(
      "Fund quote request failed with status 500",
    );
  });

  it("propagates malformed OK responses", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("not-jsonp"),
    } as Response);

    await expect(fetchFundQuote("000001")).rejects.toThrow(
      "Invalid fund quote response",
    );
  });
});
