export const MLG_TIME_ZONE = "America/Chicago";

export function formatTimestampForDisplay(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
    month: "short",
    second: "2-digit",
    timeZone: MLG_TIME_ZONE,
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateForDisplay(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: MLG_TIME_ZONE,
    year: "numeric",
  }).format(new Date(value));
}

export function recentRelativeTime(value: Date | string, now = new Date()) {
  const diffMs = now.getTime() - new Date(value).getTime();

  if (diffMs < 0 || diffMs > 60 * 60 * 1000) {
    return null;
  }

  const minutes = Math.max(1, Math.floor(diffMs / 60_000));

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  return null;
}
