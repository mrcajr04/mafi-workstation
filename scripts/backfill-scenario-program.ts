import { PrismaClient } from "@prisma/client";
import {
  parseScenarioProgram,
  scenarioProgramLabels,
} from "../src/lib/scenario-program";

/**
 * One-time backfill of Scenario.program for rows created before the structured
 * field existed. Classifies from lenderAndProduct + loanTerm using the hardened
 * parser and reports every change, flagging low-confidence rows for review.
 *
 * Run: npx tsx scripts/backfill-scenario-program.ts
 */
const prisma = new PrismaClient();

async function main() {
  const scenarios = await prisma.scenario.findMany({
    orderBy: { scenarioDeskId: "asc" },
  });

  console.log(`Found ${scenarios.length} scenario(s).\n`);

  const lowConfidence: string[] = [];
  let updated = 0;

  for (const scenario of scenarios) {
    const { program, confident } = parseScenarioProgram(
      scenario.lenderAndProduct,
      scenario.loanTerm,
    );

    await prisma.scenario.update({
      where: { id: scenario.id },
      data: { program },
    });
    updated += 1;

    const flag = confident ? "" : "  [LOW CONFIDENCE — review]";
    const line = `"${scenario.lenderAndProduct}" (term ${scenario.loanTerm}) -> ${scenarioProgramLabels[program]}${flag}`;
    console.log(line);
    if (!confident) {
      lowConfidence.push(`${scenario.id}: ${line}`);
    }
  }

  console.log(`\nUpdated ${updated} scenario(s).`);
  if (lowConfidence.length) {
    console.log(
      `\n${lowConfidence.length} low-confidence row(s) — verify these manually:`,
    );
    for (const entry of lowConfidence) {
      console.log(`  ${entry}`);
    }
  } else {
    console.log("All rows classified with confidence.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
