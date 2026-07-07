export const US_PHONE_ERROR = "Enter a valid 10-digit US phone number.";

export function phoneDigits(value?: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

export function usNationalDigits(value?: string | null) {
  const digits = phoneDigits(value);

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits;
}

export function isValidUSPhone(value?: string | null) {
  return usNationalDigits(value).length === 10;
}

export function optionalUSPhoneToE164(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const nationalDigits = usNationalDigits(trimmed);

  if (nationalDigits.length !== 10) {
    return "INVALID_PHONE";
  }

  return `+1${nationalDigits}`;
}

export function requiredUSPhoneToE164(value?: string | null) {
  const normalized = optionalUSPhoneToE164(value);

  return normalized && normalized !== "INVALID_PHONE" ? normalized : null;
}

export function formatUSPhone(value?: string | null, fallback = "Not provided") {
  const nationalDigits = usNationalDigits(value);

  if (nationalDigits.length !== 10) {
    return value?.trim() || fallback;
  }

  return `(${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(
    3,
    6,
  )}-${nationalDigits.slice(6)}`;
}

export function maskUSPhoneInput(value: string) {
  const digits = usNationalDigits(value).slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
