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

function parseAmountNumber(value: string | undefined) {
  if (value === undefined) return null;
  const trimmed = value.trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(trimmed)) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : null;
}

function parseCurrentPrice(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

export function normalizeHoldingInput(input: HoldingInput, now = new Date()): NormalizeHoldingResult {
  const fundCode = input.fundCode.trim();
  let shares = input.mode === "profitAmount" ? null : parsePositiveNumber(input.shares);
  const errors: HoldingInputErrors = {};

  if (!validateFundCode(fundCode)) errors.fundCode = "Fund code must be exactly 6 digits.";
  if (input.mode !== "profitAmount" && shares === null) {
    errors.shares = "Holding shares must be greater than 0.";
  }

  let costPrice: number | null = null;
  if (input.mode === "costPrice") {
    costPrice = parsePositiveNumber(input.costPrice);
    if (costPrice === null) errors.costPrice = "Cost unit price must be greater than 0.";
  } else if (input.mode === "totalAmount") {
    const totalAmount = parsePositiveNumber(input.totalAmount);
    if (totalAmount === null) errors.totalAmount = "Total invested amount must be greater than 0.";
    if (shares !== null && totalAmount !== null) costPrice = totalAmount / shares;
  } else if (input.mode === "profitAmount") {
    const currentAmount = parsePositiveNumber(input.currentAmount);
    const holdingProfit = parseAmountNumber(input.holdingProfit);
    const currentPrice = parseCurrentPrice(input.currentPrice);

    if (currentAmount === null) errors.currentAmount = "Current amount must be greater than 0.";
    if (holdingProfit === null) errors.holdingProfit = "Holding profit must be a valid amount.";
    if (currentPrice === null) errors.currentPrice = "Current price must be greater than 0.";

    if (currentAmount !== null && holdingProfit !== null && currentPrice !== null) {
      const totalAmount = currentAmount - holdingProfit;
      if (totalAmount <= 0) {
        errors.holdingProfit = "Calculated total invested amount must be greater than 0.";
      } else {
        shares = currentAmount / currentPrice;
        costPrice = totalAmount / shares;
      }
    }
  } else {
    errors.costPrice = "Cost unit price must be greater than 0.";
    errors.totalAmount = "Total invested amount must be greater than 0.";
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
