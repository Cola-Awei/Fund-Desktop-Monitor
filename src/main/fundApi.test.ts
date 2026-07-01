import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildFundQuoteUrl,
  buildFundStockHoldingsUrl,
  buildStockQuoteUrl,
  fetchFundQuote,
  fetchFundStockHoldings,
} from "./fundApi.js";

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

describe("buildFundStockHoldingsUrl", () => {
  it("builds the Eastmoney fund archive holdings endpoint", () => {
    expect(buildFundStockHoldingsUrl("026211")).toBe(
      "https://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=026211&topline=10",
    );
    expect(buildFundStockHoldingsUrl("026211", 2025, 12)).toBe(
      "https://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=026211&topline=10&year=2025&month=12",
    );
  });
});

describe("buildStockQuoteUrl", () => {
  it("builds the Eastmoney batch stock quote endpoint", () => {
    expect(buildStockQuoteUrl(["0.300548", "1.688150"])).toBe(
      "https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f12,f14,f3&secids=0.300548,1.688150",
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

describe("fetchFundStockHoldings", () => {
  it("returns holdings merged with realtime stock quote changes and previous period changes", async () => {
    const currentResponse = `var apidata={ content:"<h4 class='t'><label class='left'><a title='平安科技精选混合发起式C'>平安科技精选混合发起式C</a>&nbsp;&nbsp;2026年1季度股票投资明细</label><label class='right'>截止至：<font class='px12'>2026-03-31</font></label></h4><table><tbody><tr><td>1</td><td><a href='//quote.eastmoney.com/unify/r/0.300548'>300548</a></td><td class='tol'><a>长芯博创</a></td><td></td><td></td><td></td><td class='tor'>8.99%</td><td></td><td></td></tr><tr><td>2</td><td><a href='//quote.eastmoney.com/unify/r/0.300502'>300502</a></td><td class='tol'><a>新易盛</a></td><td></td><td></td><td></td><td class='tor'>8.90%</td><td></td><td></td></tr></tbody></table><div id='gpdmList'>0.300548,0.300502,</div>",arryear:[2026,2025],curyear:2026};`;
    const previousResponse = `var apidata={ content:"<h4 class='t'><label class='left'><a title='平安科技精选混合发起式C'>平安科技精选混合发起式C</a>&nbsp;&nbsp;2025年4季度股票投资明细</label><label class='right'>截止至：<font class='px12'>2025-12-31</font></label></h4><table><tbody><tr><td>1</td><td><a href='//quote.eastmoney.com/unify/r/0.300502'>300502</a></td><td class='tol'><a>新易盛</a></td><td></td><td>8.60%</td><td></td><td></td></tr></tbody></table><div id='gpdmList'>0.300502,</div>",arryear:[2026,2025],curyear:2025};`;
    const stockQuoteResponse =
      '{"data":{"diff":[{"f3":-8.63,"f12":"300548"},{"f3":-5.18,"f12":"300502"}]}}';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(currentResponse) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(previousResponse) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(stockQuoteResponse) } as Response);
    globalThis.fetch = fetchMock;

    await expect(fetchFundStockHoldings("026211")).resolves.toMatchObject({
      fundCode: "026211",
      fundName: "平安科技精选混合发起式C",
      reportDate: "2026-03-31",
      previousReportDate: "2025-12-31",
      stocks: [
        {
          stockCode: "300548",
          stockChangePercent: -8.63,
          isNew: true,
        },
        {
          stockCode: "300502",
          stockChangePercent: -5.18,
          previousHoldingPercent: 8.6,
          holdingChangePercent: 0.3,
          isNew: false,
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws when the current holdings request fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(""),
    } as Response);

    await expect(fetchFundStockHoldings("026211")).rejects.toThrow(
      "Fund holdings request failed with status 500",
    );
  });
});
