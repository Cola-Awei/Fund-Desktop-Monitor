import type { Holding, HoldingInput, HoldingInputErrors, NormalizeHoldingResult } from "./types.js";

export function validateFundCode(fundCode: string) {
  return /^\d{6}$/.test(fundCode.trim());
}

function parsePositiveNumber(value: string | undefined) {
  if (value === undefined) return null;
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(trimmed)) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function normalizeHoldingInput(input: HoldingInput, now = new Date()): NormalizeHoldingResult {
  const fundCode = input.fundCode.trim();
  const shares = parsePositiveNumber(input.shares);
  const costPrice = parsePositiveNumber(input.costPrice);
  const errors: HoldingInputErrors = {};

  if (!validateFundCode(fundCode)) errors.fundCode = "Fund code must be exactly 6 digits.";
  if (shares === null) errors.shares = "Holding shares must be greater than 0.";
  if (costPrice === null) errors.costPrice = "Cost unit price must be greater than 0.";

  if (Object.keys(errors).length > 0 || shares === null || costPrice === null) {
    return { ok: false, errors };
  }

  const timestamp = now.toISOString();
  const holding: Holding = {
    fundCode,
    shares,
    costPrice,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return { ok: true, holding };
}
