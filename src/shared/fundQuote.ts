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

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseTimeWithFallback(value: unknown, fallbackDate: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof fallbackDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fallbackDate)) {
    return `${fallbackDate} 15:00`;
  }
  return "";
}

export function parseFundMobileQuoteResponse(fundCode: string, responseText: string): FundQuote {
  let raw: unknown;
  try {
    raw = JSON.parse(responseText);
  } catch {
    throw new Error("Invalid fund quote response");
  }

  const payload = asRecord(raw);
  const datas = Array.isArray(payload?.Datas) ? payload.Datas : null;
  const expansion = asRecord(payload?.Expansion);
  const item = datas
    ?.map((entry) => asRecord(entry))
    .find((entry): entry is Record<string, unknown> => entry?.FCODE === fundCode);

  if (!item || payload?.Success === false || payload?.ErrCode !== 0) {
    throw new Error("Invalid fund quote response");
  }

  const name = item.SHORTNAME;
  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Invalid fund quote response");
  }

  const quoteDate = String(item.PDATE ?? expansion?.FSRQ ?? "");
  const estimateDate = item.GZTIME ?? expansion?.GZTIME ?? quoteDate;

  return {
    fundCode,
    name: name.trim(),
    jzrq: quoteDate,
    dwjz: parseNullableNumber(item.NAV),
    gsz: parseNullableNumber(item.GSZ),
    gszzl: parseNullableNumber(item.GSZZL),
    gztime: parseTimeWithFallback(item.GZTIME, estimateDate),
  };
}
