import type { FundQuote } from "./types.js";

function parseNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parseFundQuoteJsonp(responseText: string): FundQuote {
  const match = responseText.match(/^jsonpgz\((.*)\);?$/s);
  if (!match) throw new Error("Invalid fund quote response");

  let raw: unknown;
  try {
    raw = JSON.parse(match[1]);
  } catch {
    throw new Error("Invalid fund quote response");
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid fund quote response");
  }

  const payload = raw as Record<string, unknown>;

  const fundCode = String(payload.fundcode ?? "");
  const name = String(payload.name ?? "");
  if (!/^\d{6}$/.test(fundCode) || !name) {
    throw new Error("Invalid fund quote response");
  }

  return {
    fundCode,
    name,
    jzrq: String(payload.jzrq ?? ""),
    dwjz: parseNullableNumber(payload.dwjz),
    gsz: parseNullableNumber(payload.gsz),
    gszzl: parseNullableNumber(payload.gszzl),
    gztime: String(payload.gztime ?? ""),
  };
}
