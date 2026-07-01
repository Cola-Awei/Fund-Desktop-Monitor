import { normalizeHoldingInput } from "../shared/holdings.js";
import { getCurrentPrice } from "../shared/profit.js";
import type { HoldingInput, HoldingInputErrors, NormalizeHoldingResult } from "../shared/types.js";
import type { FundQuote } from "../shared/types.js";

const FUND_CODE_ERROR = "Fund code must be exactly 6 digits.";
const SHARES_ERROR = "Holding shares must be greater than 0.";
const COST_PRICE_ERROR = "Cost unit price must be greater than 0.";
const TOTAL_AMOUNT_ERROR = "Total invested amount must be greater than 0.";
const CURRENT_AMOUNT_ERROR = "Current amount must be greater than 0.";
const HOLDING_PROFIT_ERROR = "Holding profit must be a valid amount.";
const CURRENT_PRICE_ERROR = "Current price must be greater than 0.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateStringField(
  payload: Record<string, unknown>,
  field: keyof HoldingInputErrors,
  message: string,
  errors: HoldingInputErrors,
) {
  const value = payload[field];
  if (typeof value !== "string") {
    errors[field] = message;
    return null;
  }
  return value;
}

export function safeNormalizeHoldingInput(payload: unknown): NormalizeHoldingResult {
  if (!isRecord(payload)) {
    return {
      ok: false,
      errors: {
        fundCode: FUND_CODE_ERROR,
        shares: SHARES_ERROR,
        costPrice: COST_PRICE_ERROR,
      },
    };
  }

  const errors: HoldingInputErrors = {};
  const fundCode = validateStringField(payload, "fundCode", FUND_CODE_ERROR, errors);
  const shares = validateStringField(payload, "shares", SHARES_ERROR, errors);

  if (payload.mode === "costPrice") {
    const costPrice = validateStringField(payload, "costPrice", COST_PRICE_ERROR, errors);
    if (fundCode === null || shares === null || costPrice === null) return { ok: false, errors };
    return normalizeHoldingInput({ mode: "costPrice", fundCode, shares, costPrice });
  }

  if (payload.mode === "totalAmount") {
    const totalAmount = validateStringField(payload, "totalAmount", TOTAL_AMOUNT_ERROR, errors);
    if (fundCode === null || shares === null || totalAmount === null) return { ok: false, errors };
    return normalizeHoldingInput({ mode: "totalAmount", fundCode, shares, totalAmount });
  }

  if (payload.mode === "profitAmount") {
    const currentAmount = validateStringField(payload, "currentAmount", CURRENT_AMOUNT_ERROR, errors);
    const holdingProfit = validateStringField(payload, "holdingProfit", HOLDING_PROFIT_ERROR, errors);
    const currentPrice =
      typeof payload.currentPrice === "number" && Number.isFinite(payload.currentPrice)
        ? payload.currentPrice
        : null;
    if (currentPrice === null) errors.currentPrice = CURRENT_PRICE_ERROR;
    if (fundCode === null || currentAmount === null || holdingProfit === null || currentPrice === null) {
      return { ok: false, errors };
    }
    return normalizeHoldingInput({
      mode: "profitAmount",
      fundCode,
      shares: "",
      currentAmount,
      holdingProfit,
      currentPrice,
    });
  }

  errors.costPrice = COST_PRICE_ERROR;
  errors.totalAmount = TOTAL_AMOUNT_ERROR;
  return { ok: false, errors };
}

export function normalizeProfitAmountHoldingInput(
  input: HoldingInput,
  quote: FundQuote | null,
): NormalizeHoldingResult {
  const currentPrice = getCurrentPrice(quote);
  return safeNormalizeHoldingInput({
    ...input,
    currentPrice: currentPrice ?? undefined,
  });
}

export function validateRemoveHoldingFundCode(payload: unknown) {
  if (typeof payload !== "string") return null;
  return /^\d{6}$/.test(payload) ? payload : null;
}
