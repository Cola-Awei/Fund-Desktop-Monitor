import type { FundQuote } from "./types.js";

function parseNullableNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" && typeof value !== "string") return null;

  const normalizedValue = typeof value === "string" ? value.trim() : value;
  if (normalizedValue === "") return null;

  const number = Number(normalizedValue);
  return Number.isFinite(number) ? number : null;
}

export function parseFundQuoteJsonp(responseText: string): FundQuote {
  const match = responseText.trim().match(/^jsonpgz\((.*)\);?$/s);
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

  const fundCode = payload.fundcode;
  const name = payload.name;
  if (
    typeof fundCode !== "string" ||
    !/^\d{6}$/.test(fundCode) ||
    typeof name !== "string" ||
    !name
  ) {
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
