"use server";

import { RoleType } from "@prisma/client";
import { logAccessDenied, logAuditEvent } from "@/lib/audit";
import { formatTimestampForDisplay } from "@/lib/dates";
import type { LoanEstimateState } from "@/lib/loan-estimate-calc";
import {
  LOAN_DOCUMENTS_BUCKET,
  createLoanEstimateSignedUrl,
  ensureLoanDocumentsBucket,
} from "@/lib/loan-estimate-storage";
import {
  loanEstimatePdfHtml,
  renderLoanEstimatePdf,
} from "@/lib/loan-estimate-pdf";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

type GenerateLoanEstimatePdfResult =
  | {
      success: true;
      data: {
        downloadUrl: string;
        generatedAt: string;
      };
    }
  | { success: false; error: string };

function timestampForPath(date: Date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

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
    const html = loanEstimatePdfHtml(state);
    const pipeline = await prisma.phase4Pipeline.upsert({
      create: {
        contactId,
        loanEstimateHtml: html,
      },
      update: {
        loanEstimateHtml: html,
      },
      where: {
        contactId,
      },
    });
    const pdf = await renderLoanEstimatePdf(state);
    const storagePath = `phase4/${contactId}/loan-estimates/${timestampForPath(
      generatedAt,
    )}.pdf`;
    const supabase = await ensureLoanDocumentsBucket();
    const { error: uploadError } = await supabase.storage
      .from(LOAN_DOCUMENTS_BUCKET)
      .upload(storagePath, pdf, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    await logAuditEvent(
      access.data.id,
      "GENERATE_DOCUMENT",
      "Phase4Pipeline",
      pipeline.id,
      {
        contactId,
        docType: "LOAN_ESTIMATE",
        generatedAt: generatedAt.toISOString(),
        storageBucket: LOAN_DOCUMENTS_BUCKET,
        storagePath,
      },
    );

    return {
      success: true,
      data: {
        downloadUrl: await createLoanEstimateSignedUrl(storagePath),
        generatedAt: formatTimestampForDisplay(generatedAt),
      },
    };
  } catch (error) {
    console.error(
      "Loan Estimate PDF generation failed",
      error instanceof Error ? error.message : error,
    );

    return {
      success: false,
      error: "Unable to generate the Loan Estimate PDF. Please try again.",
    };
  }
}
