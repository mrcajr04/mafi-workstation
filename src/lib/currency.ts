function normalizeCurrencyText(value?: string) {
  const cleaned = value?.replace(/[$,\s]/g, "").trim();

  if (!cleaned) {
    return undefined;
  }

  const [wholePart, fractionPart = ""] = cleaned.split(".");

  if (fractionPart.length > 2 && fractionPart.startsWith("00")) {
    return `${wholePart}${fractionPart.slice(2)}`;
  }

  return cleaned;
}

export function normalizeCurrencyInput(value?: string) {
  const cleaned = normalizeCurrencyText(value);

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
  options: { maximumFractionDigits?: number; minimumFractionDigits?: number } = {},
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
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    style: "currency",
  });
}

export function formatCurrencyDisplayWithCents(
  value?: { toString(): string } | string | number | null,
  fallback = "Not provided",
) {
  return formatCurrencyDisplay(value, fallback, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

export function formatCurrencyInput(value: string) {
  const cleaned = normalizeCurrencyText(value);

  if (!cleaned) {
    return "";
  }

  const isNegative = cleaned.startsWith("-");
  const unsignedValue = isNegative ? cleaned.slice(1) : cleaned;
  const [wholePart = ""] = unsignedValue.split(".");
  const wholeNumber = Number(wholePart || 0);

  if (!Number.isFinite(wholeNumber)) {
    return "";
  }

  const formattedWhole = wholeNumber.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
  const sign = isNegative ? "-" : "";

  return `${sign}$${formattedWhole}`;
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
