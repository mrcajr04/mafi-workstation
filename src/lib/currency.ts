export function normalizeCurrencyInput(value?: string) {
  const cleaned = value?.replace(/[$,\s]/g, "").trim();

  if (!cleaned) {
    return undefined;
  }

  const numericValue = Number(cleaned);

  if (!Number.isFinite(numericValue)) {
    return undefined;
  }

  return numericValue.toFixed(2);
}

export function formatCurrencyInput(value: string) {
  const normalizedValue = normalizeCurrencyInput(value);

  if (!normalizedValue) {
    return "";
  }

  return Number(normalizedValue).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function currencyInputToNumber(value: string) {
  return Number(normalizeCurrencyInput(value) ?? 0);
}
