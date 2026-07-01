import { describe, expect, it } from "vitest";
import {
  mergeFundStockHoldings,
  parseFundStockHoldingsResponse,
  parseStockQuoteResponse,
} from "./fundHoldings.js";

const currentResponse = `var apidata={ content:"<h4 class='t'><label class='left'><a title='平安科技精选混合发起式C'>平安科技精选混合发起式C</a>&nbsp;&nbsp;2026年1季度股票投资明细</label><label class='right'>截止至：<font class='px12'>2026-03-31</font></label></h4><table><tbody><tr><td>1</td><td><a href='//quote.eastmoney.com/unify/r/0.300548'>300548</a></td><td class='tol'><a>长芯博创</a></td><td></td><td></td><td></td><td class='tor'>8.99%</td><td></td><td></td></tr><tr><td>2</td><td><a href='//quote.eastmoney.com/unify/r/0.300502'>300502</a></td><td class='tol'><a>新易盛</a></td><td></td><td></td><td></td><td class='tor'>8.90%</td><td></td><td></td></tr></tbody></table><div id='gpdmList'>0.300548,0.300502,</div>",arryear:[2026,2025],curyear:2026};`;

const previousResponse = `var apidata={ content:"<h4 class='t'><label class='left'><a title='平安科技精选混合发起式C'>平安科技精选混合发起式C</a>&nbsp;&nbsp;2025年4季度股票投资明细</label><label class='right'>截止至：<font class='px12'>2025-12-31</font></label></h4><table><tbody><tr><td>1</td><td><a href='//quote.eastmoney.com/unify/r/0.300502'>300502</a></td><td class='tol'><a>新易盛</a></td><td></td><td>8.60%</td><td></td><td></td></tr></tbody></table><div id='gpdmList'>0.300502,</div>",arryear:[2026,2025],curyear:2025};`;

describe("parseFundStockHoldingsResponse", () => {
  it("parses fund stock holdings from Eastmoney fund archives content", () => {
    const parsed = parseFundStockHoldingsResponse("026211", currentResponse);

    expect(parsed).toEqual({
      fundCode: "026211",
      fundName: "平安科技精选混合发起式C",
      reportDate: "2026-03-31",
      stocks: [
        {
          stockCode: "300548",
          marketCode: "0.300548",
          stockName: "长芯博创",
          holdingPercent: 8.99,
        },
        {
          stockCode: "300502",
          marketCode: "0.300502",
          stockName: "新易盛",
          holdingPercent: 8.9,
        },
      ],
    });
  });

  it("throws on malformed holdings responses", () => {
    expect(() => parseFundStockHoldingsResponse("026211", "not-data")).toThrow(
      "Invalid fund stock holdings response",
    );
  });
});

describe("parseStockQuoteResponse", () => {
  it("parses stock quote percentage changes by stock code", () => {
    const quotes = parseStockQuoteResponse(
      '{"data":{"diff":[{"f3":-8.63,"f12":"300548","f14":"长芯博创"},{"f3":0.85,"f12":"688150","f14":"莱特光电"}]}}',
    );

    expect(quotes.get("300548")).toBe(-8.63);
    expect(quotes.get("688150")).toBe(0.85);
  });

  it("ignores unavailable stock quote values", () => {
    const quotes = parseStockQuoteResponse('{"data":{"diff":[{"f3":"-","f12":"06869"}]}}');

    expect(quotes.get("06869")).toBeNull();
  });
});

describe("mergeFundStockHoldings", () => {
  it("adds realtime stock changes and previous holding differences", () => {
    const current = parseFundStockHoldingsResponse("026211", currentResponse);
    const previous = parseFundStockHoldingsResponse("026211", previousResponse);
    const quotes = new Map([
      ["300548", -8.63],
      ["300502", -5.18],
    ]);

    const merged = mergeFundStockHoldings(current, previous, quotes);

    expect(merged.previousReportDate).toBe("2025-12-31");
    expect(merged.stocks[0]).toMatchObject({
      stockCode: "300548",
      stockChangePercent: -8.63,
      previousHoldingPercent: null,
      holdingChangePercent: null,
      isNew: true,
    });
    expect(merged.stocks[1]).toMatchObject({
      stockCode: "300502",
      stockChangePercent: -5.18,
      previousHoldingPercent: 8.6,
      holdingChangePercent: 0.3,
      isNew: false,
    });
  });
});
