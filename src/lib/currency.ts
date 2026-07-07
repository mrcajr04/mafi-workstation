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

export function formatCurrencyDisplay(
  value?: { toString(): string } | string | number | null,
  fallback = "Not provided",
) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[$,\s]/g, ""));

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed.toLocaleString("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  });
}

export function formatCurrencyInput(value: string) {
  const normalizedValue = normalizeCurrencyInput(value);

  if (!normalizedValue) {
    return "";
  }

  return formatCurrencyDisplay(normalizedValue, "");
}

export function currencyInputToNumber(value: string) {
  return Number(normalizeCurrencyInput(value) ?? 0);
}

export function currencyInputToRaw(value?: string) {
  return normalizeCurrencyInput(value) ?? "";
}

export function formatInterestRateDisplay(
  value?: { toString(): string } | string | number | null,
  fallback = "Not provided",
) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[%\s,]/g, ""));

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return `${parsed.toFixed(3)}%`;
}

export function formatRatioPercentDisplay(
  value?: { toString(): string } | string | number | null,
  fallback = "Not provided",
) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[%\s,]/g, ""));

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return `${parsed.toFixed(2)}%`;
}
