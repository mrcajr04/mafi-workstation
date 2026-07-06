// Dev-only timing helper. Logs how long an async step takes to the server
// console so we can see exactly where per-navigation latency comes from.
// Remove once the slowness is diagnosed.
export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV === "production") {
    return fn();
  }
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const ms = Math.round(performance.now() - start);
    console.log(`[timing] ${label}: ${ms}ms`);
  }
}
