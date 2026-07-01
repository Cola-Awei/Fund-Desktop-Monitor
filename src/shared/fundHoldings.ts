import type { FundStockHolding, FundStockHoldings } from "./types.js";

interface ParsedFundStockHolding {
  stockCode: string;
  marketCode: string;
  stockName: string;
  holdingPercent: number;
}

interface ParsedFundStockHoldings {
  fundCode: string;
  fundName: string;
  reportDate: string;
  stocks: ParsedFundStockHolding[];
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, "").replace(/\s+/g, " "));
}

function parsePercent(value: string) {
  const normalized = stripTags(value).replace(/,/g, "");
  const match = normalized.match(/(-?\d+(?:\.\d+)?)%/);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isFinite(number) ? number : null;
}

function extractContent(responseText: string) {
  const match = responseText.match(/content:"([\s\S]*?)",arryear:/);
  if (!match) throw new Error("Invalid fund stock holdings response");
  return match[1].replace(/\\"/g, '"');
}

function extractCells(rowHtml: string) {
  return Array.from(rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)).map((match) => match[1]);
}

function extractMarketCode(cellHtml: string) {
  return cellHtml.match(/unify\/r\/([^'"]+)/)?.[1] ?? null;
}

function extractStockName(cellHtml: string) {
  const linkMatch = cellHtml.match(/<a[^>]*>([\s\S]*?)<\/a>/);
  return stripTags(linkMatch?.[1] ?? cellHtml);
}

function extractHoldingPercent(cells: string[]) {
  for (let index = cells.length - 1; index >= 0; index -= 1) {
    const percent = parsePercent(cells[index]);
    if (percent !== null) return percent;
  }
  return null;
}

export function parseFundStockHoldingsResponse(
  fundCode: string,
  responseText: string,
): ParsedFundStockHoldings {
  const content = extractContent(responseText);
  const fundName =
    decodeHtml(content.match(/<a title='([^']+)'/)?.[1] ?? "") ||
    stripTags(content.match(/<label class='left'>([\s\S]*?)<\/label>/)?.[1] ?? "");
  const reportDate = content.match(/截止至：<font class='px12'>(\d{4}-\d{2}-\d{2})<\/font>/)?.[1] ?? "";

  const rows = Array.from(content.matchAll(/<tr>([\s\S]*?)<\/tr>/g));
  const stocks = rows.flatMap((rowMatch) => {
    const cells = extractCells(rowMatch[1]);
    if (cells.length < 4) return [];

    const marketCode = extractMarketCode(cells[1]);
    const stockCode = stripTags(cells[1]);
    const stockName = extractStockName(cells[2]);
    const holdingPercent = extractHoldingPercent(cells);

    if (!marketCode || !/^\d{5,6}$/.test(stockCode) || !stockName || holdingPercent === null) {
      return [];
    }

    return [{ stockCode, marketCode, stockName, holdingPercent }];
  });

  if (!fundName || !reportDate || stocks.length === 0) {
    throw new Error("Invalid fund stock holdings response");
  }

  return { fundCode, fundName, reportDate, stocks };
}

export function parseStockQuoteResponse(responseText: string) {
  let raw: unknown;
  try {
    raw = JSON.parse(responseText);
  } catch {
    throw new Error("Invalid stock quote response");
  }

  const quotes = new Map<string, number | null>();
  const diff =
    typeof raw === "object" &&
    raw !== null &&
    "data" in raw &&
    typeof raw.data === "object" &&
    raw.data !== null &&
    "diff" in raw.data &&
    Array.isArray(raw.data.diff)
      ? raw.data.diff
      : [];

  for (const item of diff) {
    if (!item || typeof item !== "object" || !("f12" in item)) continue;
    const stockCode = String(item.f12);
    const value = "f3" in item ? item.f3 : null;
    quotes.set(stockCode, typeof value === "number" && Number.isFinite(value) ? value : null);
  }

  return quotes;
}

export function mergeFundStockHoldings(
  current: ParsedFundStockHoldings,
  previous: ParsedFundStockHoldings | null,
  stockChanges: Map<string, number | null>,
): FundStockHoldings {
  const previousByCode = new Map(
    previous?.stocks.map((stock) => [stock.stockCode, stock.holdingPercent]) ?? [],
  );

  const stocks: FundStockHolding[] = current.stocks.map((stock) => {
    const previousHoldingPercent = previousByCode.get(stock.stockCode) ?? null;
    const holdingChangePercent =
      previousHoldingPercent === null
        ? null
        : Number((stock.holdingPercent - previousHoldingPercent).toFixed(2));

    return {
      ...stock,
      previousHoldingPercent,
      holdingChangePercent,
      isNew: previousHoldingPercent === null,
      stockChangePercent: stockChanges.get(stock.stockCode) ?? null,
    };
  });

  return {
    fundCode: current.fundCode,
    fundName: current.fundName,
    reportDate: current.reportDate,
    previousReportDate: previous?.reportDate ?? null,
    stocks,
  };
}
