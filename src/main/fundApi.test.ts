import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildFundMobileQuoteUrl,
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

describe("buildFundMobileQuoteUrl", () => {
  it("builds the Eastmoney mobile quote fallback endpoint", () => {
    expect(buildFundMobileQuoteUrl("021528")).toBe(
      "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=1&appType=ttjj&product=EFund&plat=Android&deviceid=fund-desktop-monitor&Version=1&Fcodes=021528",
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

  it("falls back to the mobile quote endpoint when the fundgz request fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve("<html>404</html>"),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              Datas: [
                {
                  FCODE: "021528",
                  SHORTNAME: "财通成长优选混合C",
                  PDATE: "2026-07-20",
                  NAV: "3.8050",
                  GSZ: null,
                  GSZZL: null,
                  GZTIME: null,
                },
              ],
              ErrCode: 0,
              Success: true,
              Expansion: { GZTIME: "2026-07-21", FSRQ: "2026-07-20" },
            }),
          ),
      } as Response);
    globalThis.fetch = fetchMock;

    await expect(fetchFundQuote("021528")).resolves.toEqual({
      fundCode: "021528",
      name: "财通成长优选混合C",
      jzrq: "2026-07-20",
      dwjz: 3.805,
      gsz: null,
      gszzl: null,
      gztime: "2026-07-21 15:00",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringContaining("021528.js"));
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringContaining("Fcodes=021528"));
  });

  it("falls back to the mobile quote endpoint when fundgz returns malformed text", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("not-jsonp"),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              Datas: [
                {
                  FCODE: "026211",
                  SHORTNAME: "平安科技精选混合发起式C",
                  PDATE: "2026-07-20",
                  NAV: "1.5399",
                  GSZ: null,
                  GSZZL: null,
                  GZTIME: null,
                },
              ],
              ErrCode: 0,
              Success: true,
              Expansion: { GZTIME: "2026-07-21", FSRQ: "2026-07-20" },
            }),
          ),
      } as Response);
    globalThis.fetch = fetchMock;

    await expect(fetchFundQuote("026211")).resolves.toMatchObject({
      fundCode: "026211",
      name: "平安科技精选混合发起式C",
      dwjz: 1.5399,
      gztime: "2026-07-21 15:00",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns a Chinese refresh error when both quote endpoints are unavailable", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("not-jsonp"),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("{\"Datas\":[],\"ErrCode\":0,\"Success\":true}"),
      } as Response);

    await expect(fetchFundQuote("000001")).rejects.toThrow(
      "基金估值暂不可用，稍后自动刷新",
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
