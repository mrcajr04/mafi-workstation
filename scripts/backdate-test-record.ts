import { prisma } from "@/lib/prisma";

const phase4PipelineId = "";
const contactId = "";

async function main() {
  if (!phase4PipelineId && !contactId) {
    throw new Error(
      "Set either phase4PipelineId or contactId in scripts/backdate-test-record.ts before running.",
    );
  }

  const backdatedAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

  const updatedRows = phase4PipelineId
    ? await prisma.$executeRaw`
        UPDATE "Phase4Pipeline"
        SET "updatedAt" = ${backdatedAt}
        WHERE "id" = ${phase4PipelineId}::uuid
      `
    : await prisma.$executeRaw`
        UPDATE "Phase4Pipeline"
        SET "updatedAt" = ${backdatedAt}
        WHERE "contactId" = ${contactId}::uuid
      `;

  console.log(
    `Backdated ${updatedRows} Phase4Pipeline record(s) to ${backdatedAt.toISOString()}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
