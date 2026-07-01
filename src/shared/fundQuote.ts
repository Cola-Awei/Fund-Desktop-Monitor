import type { FundQuote } from "./types.js";

function parseNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parseFundQuoteJsonp(responseText: string): FundQuote {
  const match = responseText.match(/^jsonpgz\((.*)\);?$/s);
  if (!match) throw new Error("Invalid fund quote response");

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(match[1]);
  } catch {
    throw new Error("Invalid fund quote response");
  }

  const fundCode = String(raw.fundcode ?? "");
  const name = String(raw.name ?? "");
  if (!/^\d{6}$/.test(fundCode) || !name) {
    throw new Error("Invalid fund quote response");
  }

  return {
    fundCode,
    name,
    jzrq: String(raw.jzrq ?? ""),
    dwjz: parseNullableNumber(raw.dwjz),
    gsz: parseNullableNumber(raw.gsz),
    gszzl: parseNullableNumber(raw.gszzl),
    gztime: String(raw.gztime ?? ""),
  };
}
