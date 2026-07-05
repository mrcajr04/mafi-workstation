"use server";

import { RoleType } from "@prisma/client";
import puppeteer from "puppeteer";
import { loanEstimateTemplate } from "@/lib/documents/loan-estimate-template";
import { loanPreApprovalTemplate } from "@/lib/documents/loan-pre-approval-template";
import { LoanDocumentData } from "@/lib/documents/document-types";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export type LoanDocumentType = "PRE_APPROVAL" | "LOAN_ESTIMATE";

type GenerateLoanDocumentResult =
  | {
      success: true;
      data: {
        fileName: string;
        pdfBase64: string;
      };
    }
  | { success: false; error: string };

function formatCurrency(value?: { toString(): string } | null) {
  if (!value) {
    return "Not provided";
  }

  return Number(value.toString()).toLocaleString("en-US", {
    currency: "USD",
    style: "currency",
  });
}

function formatRate(value?: { toString(): string } | null) {
  return value ? `${Number(value.toString()).toFixed(3)}%` : "Not provided";
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function htmlToPdfBase64(html: string) {
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    const pdf = await page.pdf({
      format: "Letter",
      margin: {
        bottom: "0.4in",
        left: "0.4in",
        right: "0.4in",
        top: "0.4in",
      },
      printBackground: true,
    });

    return Buffer.from(pdf).toString("base64");
  } finally {
    await browser.close();
  }
}

export async function generateLoanDocument(
  contactId: string,
  docType: LoanDocumentType,
): Promise<GenerateLoanDocumentResult> {
  const access = await requireRole([
    RoleType.LICENSED_LO,
    RoleType.LOAN_PROCESSOR,
    RoleType.OWNER,
  ]);

  if (!access.success) {
    return {
      success: false,
      error: access.error,
    };
  }

  const contact = await prisma.contact.findUnique({
    where: {
      id: contactId,
    },
    select: {
      assignedLO: {
        select: {
          fullName: true,
          nmlsNumber: true,
        },
      },
      prospectName: true,
      propertyDetails: {
        select: {
          address: true,
        },
      },
      scenarioDesk: {
        select: {
          selectedScenarioNumber: true,
          scenarios: {
            orderBy: {
              scenarioNumber: "asc",
            },
            select: {
              escrowed: true,
              interestRate: true,
              lenderAndProduct: true,
              originationPay: true,
              pitia: true,
              principalAndInterest: true,
              processingFee: true,
              scenarioNumber: true,
            },
          },
        },
      },
    },
  });

  if (!contact?.scenarioDesk?.selectedScenarioNumber) {
    return {
      success: false,
      error: "No finalized scenario is selected for this contact.",
    };
  }

  const finalizedScenario = contact.scenarioDesk.scenarios.find(
    (scenario) =>
      scenario.scenarioNumber === contact.scenarioDesk?.selectedScenarioNumber,
  );

  if (!finalizedScenario) {
    return {
      success: false,
      error: "Finalized scenario details were not found.",
    };
  }

  const documentData: LoanDocumentData = {
    borrowerName: contact.prospectName,
    documentDate: formatDate(new Date()),
    interestRate: formatRate(finalizedScenario.interestRate),
    lenderAndProduct: finalizedScenario.lenderAndProduct,
    loanAmount: formatCurrency(null),
    loanOfficerName: contact.assignedLO?.fullName ?? access.data.fullName,
    loanOfficerNmls:
      contact.assignedLO?.nmlsNumber ?? access.data.nmlsNumber ?? "Not provided",
    originationPay: formatCurrency(finalizedScenario.originationPay),
    pitia: formatCurrency(finalizedScenario.pitia),
    principalAndInterest: formatCurrency(
      finalizedScenario.principalAndInterest,
    ),
    processingFee: formatCurrency(finalizedScenario.processingFee),
    propertyAddress: contact.propertyDetails?.address ?? "Not provided",
    scenarioEscrowed: finalizedScenario.escrowed ? "Escrowed" : "Not escrowed",
  };

  const opportunityValue = await prisma.opportunityValue.findUnique({
    where: {
      contactId,
    },
    select: {
      loanAmount: true,
    },
  });

  documentData.loanAmount = formatCurrency(opportunityValue?.loanAmount);

  const html =
    docType === "PRE_APPROVAL"
      ? loanPreApprovalTemplate(documentData)
      : loanEstimateTemplate(documentData);

  const pdfBase64 = await htmlToPdfBase64(html);

  await prisma.phase4Pipeline.upsert({
    where: {
      contactId,
    },
    create: {
      contactId,
      ...(docType === "PRE_APPROVAL"
        ? { loanPreApprovalHtml: html }
        : { loanEstimateHtml: html }),
    },
    update:
      docType === "PRE_APPROVAL"
        ? { loanPreApprovalHtml: html }
        : { loanEstimateHtml: html },
  });

  return {
    success: true,
    data: {
      fileName:
        docType === "PRE_APPROVAL"
          ? "loan-pre-approval.pdf"
          : "loan-estimate.pdf",
      pdfBase64,
    },
  };
}
