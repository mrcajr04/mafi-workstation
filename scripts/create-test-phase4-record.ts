import { DecisionBranch } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const testEmailOverride = "mrcajr04@gmail.com";

function isFakeSeedEmail(email: string | null) {
  const normalizedEmail = email?.toLowerCase() ?? "";

  return (
    normalizedEmail.includes("example.com") ||
    normalizedEmail.startsWith("seed_")
  );
}

async function main() {
  const contact = await prisma.contact.findFirst({
    where: {
      phase4Pipeline: null,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      prospectEmail: true,
      prospectName: true,
    },
  });

  if (!contact) {
    console.error(
      "No contact without a Phase4Pipeline was found. Seed or create contacts first, then rerun this script.",
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Selected contact: ${contact.prospectName} (${contact.id})`);

  if (isFakeSeedEmail(contact.prospectEmail)) {
    await prisma.contact.update({
      where: {
        id: contact.id,
      },
      data: {
        prospectEmail: testEmailOverride,
      },
    });

    console.log(`Overrode fake prospect email to: ${testEmailOverride}`);
  } else {
    console.log(
      `Kept existing prospect email: ${contact.prospectEmail ?? "not provided"}`,
    );
  }

  const pipeline = await prisma.phase4Pipeline.create({
    data: {
      contactId: contact.id,
      decisionBranch: DecisionBranch.PENDING,
    },
    select: {
      id: true,
    },
  });

  const backdatedAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

  await prisma.$executeRaw`
    UPDATE "Phase4Pipeline"
    SET "updatedAt" = ${backdatedAt}
    WHERE "id" = ${pipeline.id}::uuid
  `;

  const updatedPipeline = await prisma.phase4Pipeline.findUnique({
    where: {
      id: pipeline.id,
    },
    select: {
      id: true,
      updatedAt: true,
    },
  });

  console.log(`Created Phase4Pipeline id: ${pipeline.id}`);
  console.log(
    `Backdated updatedAt: ${updatedPipeline?.updatedAt.toISOString()}`,
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
