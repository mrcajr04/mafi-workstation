"use server";

import {
  AppraisalStatus,
  CommandCenterTag,
  ContactStatus,
  CreditAuthorizationStatus,
  DecisionBranch,
  DisclosuresStatus,
  LoanApplicationStatus,
  LoanApprovalStatus,
  PricingLockFloat,
  RoleType,
  ScenarioDeskStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export type Phase4PipelineInput = {
  allInvoicesCollected: boolean;
  appraisalStatus: AppraisalStatus;
  closingDocsSignedOut: boolean;
  closingScheduleDate?: string;
  contactId: string;
  creditAuthorizationStatus: CreditAuthorizationStatus;
  ctcNotified: boolean;
  decisionBranch: DecisionBranch;
  disclosuresStatus: DisclosuresStatus;
  fundingDate?: string;
  loanApplicationStatus: LoanApplicationStatus;
  loanApprovalStatus: LoanApprovalStatus;
  loanLockConfirmed: boolean;
  postClosingComplete: boolean;
  pricingLockFloat: PricingLockFloat;
};

type Phase4ActionResult = { success: true } | { success: false; error: string };

export type Phase4DecisionInput = {
  contactId: string;
  decisionBranch: Extract<
    DecisionBranch,
    "PROCEED_TO_PROCESSING" | "RE_ENGAGEMENT"
  >;
  nextTouchDate?: string;
  reasonCode?: string;
};

function optionalDate(value?: string) {
  return value ? new Date(`${value}T00:00:00`) : null;
}

export async function updatePhase4Pipeline(
  input: Phase4PipelineInput,
): Promise<Phase4ActionResult> {
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

  const contact = await prisma.contact.findFirst({
    where: {
      id: input.contactId,
      scenarioDesk: {
        status: ScenarioDeskStatus.FINALIZED,
      },
    },
    select: {
      id: true,
    },
  });

  if (!contact) {
    return {
      success: false,
      error: "Contact is not ready for Phase 4.",
    };
  }

  await prisma.phase4Pipeline.upsert({
    where: {
      contactId: contact.id,
    },
    create: {
      allInvoicesCollected: input.allInvoicesCollected,
      appraisalStatus: input.appraisalStatus,
      closingDocsSignedOut: input.closingDocsSignedOut,
      closingScheduleDate: optionalDate(input.closingScheduleDate),
      contactId: contact.id,
      creditAuthorizationStatus: input.creditAuthorizationStatus,
      ctcNotified: input.ctcNotified,
      decisionBranch: input.decisionBranch,
      disclosuresStatus: input.disclosuresStatus,
      fundingDate: optionalDate(input.fundingDate),
      loanApplicationStatus: input.loanApplicationStatus,
      loanApprovalStatus: input.loanApprovalStatus,
      loanLockConfirmed: input.loanLockConfirmed,
      postClosingComplete: input.postClosingComplete,
      pricingLockFloat: input.pricingLockFloat,
    },
    update: {
      allInvoicesCollected: input.allInvoicesCollected,
      appraisalStatus: input.appraisalStatus,
      closingDocsSignedOut: input.closingDocsSignedOut,
      closingScheduleDate: optionalDate(input.closingScheduleDate),
      creditAuthorizationStatus: input.creditAuthorizationStatus,
      ctcNotified: input.ctcNotified,
      decisionBranch: input.decisionBranch,
      disclosuresStatus: input.disclosuresStatus,
      fundingDate: optionalDate(input.fundingDate),
      loanApplicationStatus: input.loanApplicationStatus,
      loanApprovalStatus: input.loanApprovalStatus,
      loanLockConfirmed: input.loanLockConfirmed,
      postClosingComplete: input.postClosingComplete,
      pricingLockFloat: input.pricingLockFloat,
    },
  });

  revalidatePath("/phase4");
  revalidatePath(`/phase4/${contact.id}`);

  return {
    success: true,
  };
}

export async function updatePhase4DecisionBranch(
  input: Phase4DecisionInput,
): Promise<Phase4ActionResult> {
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

  if (
    input.decisionBranch === DecisionBranch.RE_ENGAGEMENT &&
    (!input.reasonCode || !input.nextTouchDate)
  ) {
    return {
      success: false,
      error: "Reason and next touch date are required for re-engagement.",
    };
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: input.contactId,
      scenarioDesk: {
        status: ScenarioDeskStatus.FINALIZED,
      },
    },
    select: {
      assignedLOId: true,
      bdrId: true,
      id: true,
    },
  });

  if (!contact) {
    return {
      success: false,
      error: "Contact is not ready for Phase 4.",
    };
  }

  const nextTouchDate = optionalDate(input.nextTouchDate);

  await prisma.$transaction(async (tx) => {
    await tx.phase4Pipeline.upsert({
      where: {
        contactId: contact.id,
      },
      create: {
        contactId: contact.id,
        decisionBranch: input.decisionBranch,
        nextTouchDate,
        reasonCode: input.reasonCode,
      },
      update: {
        decisionBranch: input.decisionBranch,
        nextTouchDate,
        reasonCode: input.reasonCode,
      },
    });

    if (input.decisionBranch === DecisionBranch.RE_ENGAGEMENT) {
      await tx.contact.update({
        where: {
          id: contact.id,
        },
        data: {
          status: ContactStatus.RE_ENGAGEMENT,
        },
      });

      await tx.commandCenterEntry.upsert({
        where: {
          contactId: contact.id,
        },
        create: {
          assignedBDRId: contact.bdrId,
          assignedLOId: contact.assignedLOId,
          contactId: contact.id,
          lastContactDate: new Date(),
          nextScheduledTouch: nextTouchDate,
          sourcePhase: "Phase 4",
          tag: CommandCenterTag.RE_ENGAGEMENT,
        },
        update: {
          assignedBDRId: contact.bdrId,
          assignedLOId: contact.assignedLOId,
          lastContactDate: new Date(),
          nextScheduledTouch: nextTouchDate,
          sourcePhase: "Phase 4",
          tag: CommandCenterTag.RE_ENGAGEMENT,
        },
      });

      return;
    }

    await tx.contact.update({
      where: {
        id: contact.id,
      },
      data: {
        status: ContactStatus.IN_PROCESSING,
      },
    });

    // Winning/client command-center routing happens later at funding.
  });

  revalidatePath("/phase4");
  revalidatePath(`/phase4/${contact.id}`);

  return {
    success: true,
  };
}
