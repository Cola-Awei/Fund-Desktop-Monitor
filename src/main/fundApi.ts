import { parseFundQuoteJsonp } from "../shared/fundQuote.js";
import type { FundQuote } from "../shared/types.js";

export function buildFundQuoteUrl(fundCode: string, now = Date.now()) {
  return `https://fundgz.1234567.com.cn/js/${fundCode}.js?rt=${now}`;
}

export async function fetchFundQuote(fundCode: string): Promise<FundQuote> {
  const response = await fetch(buildFundQuoteUrl(fundCode));
  if (!response.ok) {
    throw new Error(`Fund quote request failed with status ${response.status}`);
  }
  return parseFundQuoteJsonp(await response.text());
}
