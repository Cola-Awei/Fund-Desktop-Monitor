import { parseFundQuoteJsonp } from "../shared/fundQuote.js";
import {
  mergeFundStockHoldings,
  parseFundStockHoldingsResponse,
  parseStockQuoteResponse,
} from "../shared/fundHoldings.js";
import type { FundQuote, FundStockHoldings } from "../shared/types.js";

export function buildFundQuoteUrl(fundCode: string, now = Date.now()) {
  return `https://fundgz.1234567.com.cn/js/${fundCode}.js?rt=${now}`;
}

export function buildFundStockHoldingsUrl(fundCode: string, year?: number, month?: number) {
  const params = new URLSearchParams({
    type: "jjcc",
    code: fundCode,
    topline: "10",
  });
  if (year !== undefined && month !== undefined) {
    params.set("year", String(year));
    params.set("month", String(month));
  }
  return `https://fundf10.eastmoney.com/FundArchivesDatas.aspx?${params.toString()}`;
}

export function buildStockQuoteUrl(marketCodes: string[]) {
  return `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f12,f14,f3&secids=${marketCodes.join(",")}`;
}

export async function fetchFundQuote(fundCode: string): Promise<FundQuote> {
  const response = await fetch(buildFundQuoteUrl(fundCode));
  if (!response.ok) {
    throw new Error(`Fund quote request failed with status ${response.status}`);
  }
  return parseFundQuoteJsonp(await response.text());
}

function getPreviousQuarter(reportDate: string) {
  const year = Number(reportDate.slice(0, 4));
  const month = Number(reportDate.slice(5, 7));
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;

  if (month === 3) return { year: year - 1, month: 12 };
  if (month === 6) return { year, month: 3 };
  if (month === 9) return { year, month: 6 };
  if (month === 12) return { year, month: 9 };
  return null;
}

async function fetchText(url: string, errorPrefix: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${errorPrefix} failed with status ${response.status}`);
  }
  return response.text();
}

export async function fetchFundStockHoldings(fundCode: string): Promise<FundStockHoldings> {
  const current = parseFundStockHoldingsResponse(
    fundCode,
    await fetchText(buildFundStockHoldingsUrl(fundCode), "Fund holdings request"),
  );
  const previousQuarter = getPreviousQuarter(current.reportDate);
  const previous = previousQuarter
    ? parseFundStockHoldingsResponse(
        fundCode,
        await fetchText(
          buildFundStockHoldingsUrl(fundCode, previousQuarter.year, previousQuarter.month),
          "Previous fund holdings request",
        ),
      )
    : null;
  const stockChanges = parseStockQuoteResponse(
    await fetchText(
      buildStockQuoteUrl(current.stocks.map((stock) => stock.marketCode)),
      "Stock quote request",
    ),
  );

  return mergeFundStockHoldings(current, previous, stockChanges);
}
