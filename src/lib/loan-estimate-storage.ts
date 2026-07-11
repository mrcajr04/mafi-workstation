import "server-only";

import { prisma } from "@/lib/prisma";

type LoanEstimateGeneration = {
  generatedAt: Date;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * A GENERATE_DOCUMENT audit entry counts as a Loan Estimate generation when its
 * fieldDiffs mark it docType === "LOAN_ESTIMATE". (Pre-Approval documents log
 * docType === "PRE_APPROVAL" and are excluded.) Loan Estimates are no longer
 * stored as PDFs, so this intentionally does not require a storagePath.
 */
function isLoanEstimateGeneration(fieldDiffs: unknown) {
  return isObject(fieldDiffs) && fieldDiffs.docType === "LOAN_ESTIMATE";
}

/**
 * Bulk "when was the Loan Estimate last generated" lookup for list views.
 * Phase4Pipeline also logs GENERATE_DOCUMENT for the Loan Pre-Approval doc (see
 * document-actions.ts), so entries are filtered to docType === "LOAN_ESTIMATE"
 * via the shared isLoanEstimateGeneration check.
 */
export async function getLatestLoanEstimateGenerationTimestamps(
  pipelineIds: string[],
): Promise<Map<string, Date>> {
  const timestamps = new Map<string, Date>();

  if (!pipelineIds.length) {
    return timestamps;
  }

  const auditLogs = await prisma.auditLog.findMany({
    orderBy: {
      timestamp: "desc",
    },
    where: {
      action: "GENERATE_DOCUMENT",
      entityId: { in: pipelineIds },
      entityType: "Phase4Pipeline",
    },
  });

  for (const auditLog of auditLogs) {
    if (timestamps.has(auditLog.entityId)) {
      continue;
    }

    if (isLoanEstimateGeneration(auditLog.fieldDiffs)) {
      timestamps.set(auditLog.entityId, auditLog.timestamp);
    }
  }

  return timestamps;
}

export async function getLatestLoanEstimateGeneration(
  contactId: string,
): Promise<LoanEstimateGeneration | null> {
  const pipeline = await prisma.phase4Pipeline.findUnique({
    where: {
      contactId,
    },
    select: {
      id: true,
    },
  });

  if (!pipeline) {
    return null;
  }

  const auditLogs = await prisma.auditLog.findMany({
    orderBy: {
      timestamp: "desc",
    },
    take: 25,
    where: {
      action: "GENERATE_DOCUMENT",
      entityId: pipeline.id,
      entityType: "Phase4Pipeline",
    },
  });

  for (const auditLog of auditLogs) {
    if (!isLoanEstimateGeneration(auditLog.fieldDiffs)) {
      continue;
    }

    return {
      generatedAt: auditLog.timestamp,
    };
  }

  return null;
}
