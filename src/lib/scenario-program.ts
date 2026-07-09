import { ScenarioProgram } from "@prisma/client";

/**
 * Display labels for the structured Scenario program enum. These match the
 * loan-estimate program vocabulary (LoanProgram in loan-estimate-design.ts /
 * the program strings the PDF calc understands).
 */
export const scenarioProgramLabels: Record<ScenarioProgram, string> = {
  FIXED_30: "30 YR FIXED",
  FIXED_15: "15 YR FIXED",
  ARM_1_1: "1/1 ARM",
  ARM_3_1: "3/1 ARM",
  ARM_5_1: "5/1 ARM",
  ARM_7_1: "7/1 ARM",
  ARM_10_1: "10/1 ARM",
  IO: "IO",
};

export const scenarioProgramOptions = (
  Object.entries(scenarioProgramLabels) as Array<[ScenarioProgram, string]>
).map(([value, label]) => ({ value, label }));

const ARM_PERIOD_TO_PROGRAM: Record<string, ScenarioProgram> = {
  "1": "ARM_1_1",
  "3": "ARM_3_1",
  "5": "ARM_5_1",
  "7": "ARM_7_1",
  "10": "ARM_10_1",
};

/**
 * Hardened, one-time backfill classifier for legacy scenarios that predate the
 * structured `program` field. New scenarios set `program` explicitly via the
 * form, so this is NOT used on the write path — only by
 * scripts/backfill-scenario-program.ts.
 *
 * Fixes the two failure modes of the old `mapProgram` heuristic:
 *  - IO false-positive: it matched the substring "io" anywhere, so lenders like
 *    "Champions" / "Union" / "Regions" were labeled Interest-Only. Here IO
 *    requires a real token (\bIO\b or "interest only"), never a substring.
 *  - No ARM detection: the old logic could only ever emit IO / 15 / 30 fixed.
 *    Here an explicit fixed-period ratio ("5/1 ARM") maps to the right ARM.
 *
 * Returns `confident: false` for rows a human should review (an ARM without a
 * parseable standard period, or a ratio without the word "ARM").
 */
export function parseScenarioProgram(
  lenderAndProduct: string,
  loanTerm: number,
): { program: ScenarioProgram; confident: boolean } {
  const product = lenderAndProduct.toUpperCase();
  const mentionsArm = /\bARM\b/.test(product);
  const armRatio = product.match(/\b(\d{1,2})\s*\/\s*\d{1,2}\b/);

  if (armRatio) {
    const mapped = ARM_PERIOD_TO_PROGRAM[armRatio[1]];
    if (mapped) {
      // A ratio plus the word "ARM" is unambiguous; a bare ratio is likely an
      // ARM but flagged for review.
      return { program: mapped, confident: mentionsArm };
    }
    return { program: "ARM_5_1", confident: false };
  }

  if (mentionsArm) {
    // "ARM" with no parseable ratio — best-effort, flag for review.
    return { program: "ARM_5_1", confident: false };
  }

  if (/\bIO\b/.test(product) || /\bINTEREST[\s-]?ONLY\b/.test(product)) {
    return { program: "IO", confident: true };
  }

  if (loanTerm === 15) {
    return { program: "FIXED_15", confident: true };
  }

  return { program: "FIXED_30", confident: true };
}
