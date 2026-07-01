import type { Holding, HoldingInput, HoldingInputErrors, NormalizeHoldingResult } from "./types";

export function validateFundCode(fundCode: string) {
  return /^\d{6}$/.test(fundCode.trim());
}

function parsePositiveNumber(value: string | undefined) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function normalizeHoldingInput(input: HoldingInput, now = new Date()): NormalizeHoldingResult {
  const fundCode = input.fundCode.trim();
  const shares = parsePositiveNumber(input.shares);
  const errors: HoldingInputErrors = {};

  if (!validateFundCode(fundCode)) errors.fundCode = "Fund code must be exactly 6 digits.";
  if (shares === null) errors.shares = "Holding shares must be greater than 0.";

  let costPrice: number | null = null;
  if (input.mode === "costPrice") {
    costPrice = parsePositiveNumber(input.costPrice);
    if (costPrice === null) errors.costPrice = "Cost unit price must be greater than 0.";
  } else {
    const totalAmount = parsePositiveNumber(input.totalAmount);
    if (totalAmount === null) errors.totalAmount = "Total invested amount must be greater than 0.";
    if (shares !== null && totalAmount !== null) costPrice = totalAmount / shares;
  }

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
