"use server";

import { Prisma, RoleType } from "@prisma/client";
import { logAccessDenied, logAuditEvent } from "@/lib/audit";
import { formatTimestampForDisplay } from "@/lib/dates";
import type { LoanEstimateState } from "@/lib/loan-estimate-calc";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

type GenerateLoanEstimatePdfResult =
  | {
      success: true;
      data: {
        generatedAt: string;
      };
    }
  | { success: false; error: string };

/**
 * Records a Loan Estimate "generation": persists the current input state (so the
 * workspace restores edits on reload) and logs a GENERATE_DOCUMENT audit event
 * (so the pipeline "last generated" status stays accurate). The PDF itself is
 * produced client-side via the browser print dialog — nothing is rendered
 * server-side or stored in object storage.
 */
export async function generateLoanEstimatePdf(
  contactId: string,
  state: LoanEstimateState,
): Promise<GenerateLoanEstimatePdfResult> {
  const access = await requireRole([
    RoleType.LICENSED_LO,
    RoleType.LOAN_PROCESSOR,
    RoleType.OWNER,
  ]);

  if (!access.success) {
    await logAccessDenied("GENERATE_DOCUMENT", "Phase4Pipeline", contactId);
    return {
      success: false,
      error: access.error,
    };
  }

  try {
    const generatedAt = new Date();
    const pipeline = await prisma.phase4Pipeline.upsert({
      create: {
        contactId,
        loanEstimateState: state as unknown as Prisma.InputJsonValue,
      },
      update: {
        loanEstimateState: state as unknown as Prisma.InputJsonValue,
      },
      where: {
        contactId,
      },
    });

    await logAuditEvent(
      access.data.id,
      "GENERATE_DOCUMENT",
      "Phase4Pipeline",
      pipeline.id,
      {
        contactId,
        docType: "LOAN_ESTIMATE",
        generatedAt: generatedAt.toISOString(),
      },
    );

    return {
      success: true,
      data: {
        generatedAt: formatTimestampForDisplay(generatedAt),
      },
    };
  } catch (error) {
    console.error(
      "Loan Estimate generation failed",
      error instanceof Error ? error.message : error,
    );

    return {
      success: false,
      error: "Unable to record the Loan Estimate. Please try again.",
    };
  }
}
