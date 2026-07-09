import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export const LOAN_DOCUMENTS_BUCKET = "loan-documents";

type LoanEstimateGeneration = {
  downloadUrl: string;
  generatedAt: Date;
  storagePath: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStoragePath(fieldDiffs: unknown) {
  if (!isObject(fieldDiffs)) {
    return null;
  }

  const docType = fieldDiffs.docType;
  const storagePath = fieldDiffs.storagePath;

  if (
    docType !== "LOAN_ESTIMATE" ||
    typeof storagePath !== "string" ||
    !storagePath
  ) {
    return null;
  }

  return storagePath;
}

export async function ensureLoanDocumentsBucket() {
  const supabase = createAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw listError;
  }

  if (buckets.some((bucket) => bucket.name === LOAN_DOCUMENTS_BUCKET)) {
    return supabase;
  }

  const { error: createError } = await supabase.storage.createBucket(
    LOAN_DOCUMENTS_BUCKET,
    {
      public: false,
    },
  );

  if (createError) {
    throw createError;
  }

  return supabase;
}

export async function createLoanEstimateSignedUrl(storagePath: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(LOAN_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);

  if (error) {
    throw error;
  }

  return data.signedUrl;
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
    const storagePath = getStoragePath(auditLog.fieldDiffs);

    if (!storagePath) {
      continue;
    }

    return {
      downloadUrl: await createLoanEstimateSignedUrl(storagePath),
      generatedAt: auditLog.timestamp,
      storagePath,
    };
  }

  return null;
}
