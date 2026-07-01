export function formatAmount(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "--";
  const abs = Math.abs(value).toFixed(2);
  if (value > 0) return `+${abs}`;
  if (value < 0) return `-${abs}`;
  return "0.00";
}

export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "--";
  return value.toFixed(4);
}

export function signClass(value: number | null | undefined): "gain" | "loss" | "flat" {
  if (!value) return "flat";
  return value > 0 ? "gain" : "loss";
}
