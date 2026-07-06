"use server";

import {
  ContactStatus,
  ScenarioDeskStatus,
  RoleType,
} from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { logAccessDenied, logAuditEvent } from "@/lib/audit";
import { normalizeCurrencyInput } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export type ScenarioInput = {
  escrowed: boolean;
  interestRate: string;
  lenderAndProduct: string;
  originationPay: string;
  pitia: string;
  principalAndInterest: string;
  processingFee: string;
  scenarioNumber: number;
};

export type FinalizeScenarioDeskInput = {
  contactId: string;
  scenarios: ScenarioInput[];
  selectedScenarioNumber: number;
};

type ScenarioActionResult =
  | { success: true }
  | { success: false; error: string };

function decimalFromCurrency(value: string) {
  return normalizeCurrencyInput(value) ?? 0;
}

function decimalFromPercent(value: string) {
  const normalized = value.replace("%", "").trim();
  return normalized ? Number(normalized) : 0;
}

export async function finalizeScenarioDesk(
  input: FinalizeScenarioDeskInput,
): Promise<ScenarioActionResult> {
  const access = await requireRole([RoleType.LICENSED_LO, RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied(
      "FINALIZE_SCENARIO_DESK",
      "ScenarioDesk",
      input.contactId,
    );
    return {
      success: false,
      error: access.error,
    };
  }

  const scenarios = input.scenarios
    .slice(0, 3)
    .filter((scenario) => scenario.lenderAndProduct.trim());

  if (!scenarios.length) {
    return {
      success: false,
      error: "Add at least one scenario before finalizing.",
    };
  }

  if (
    !scenarios.some(
      (scenario) => scenario.scenarioNumber === input.selectedScenarioNumber,
    )
  ) {
    return {
      success: false,
      error: "Select a final scenario before finalizing.",
    };
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: input.contactId,
      status: ContactStatus.IN_SCENARIO_REVIEW,
    },
    select: {
      id: true,
    },
  });

  if (!contact) {
    return {
      success: false,
      error: "Contact is not ready for scenario review.",
    };
  }

  const finalizedScenarioDesk = await prisma.$transaction(async (tx) => {
    const scenarioDesk = await tx.scenarioDesk.upsert({
      where: {
        contactId: contact.id,
      },
      create: {
        contactId: contact.id,
        selectedScenarioNumber: input.selectedScenarioNumber,
        status: ScenarioDeskStatus.FINALIZED,
      },
      update: {
        selectedScenarioNumber: input.selectedScenarioNumber,
        status: ScenarioDeskStatus.FINALIZED,
      },
    });

    await tx.scenario.deleteMany({
      where: {
        scenarioDeskId: scenarioDesk.id,
      },
    });

    await tx.scenario.createMany({
      data: scenarios.map((scenario) => ({
        escrowed: scenario.escrowed,
        interestRate: decimalFromPercent(scenario.interestRate),
        lenderAndProduct: scenario.lenderAndProduct.trim(),
        originationPay: decimalFromCurrency(scenario.originationPay),
        pitia: decimalFromCurrency(scenario.pitia),
        principalAndInterest: decimalFromCurrency(
          scenario.principalAndInterest,
        ),
        processingFee: decimalFromCurrency(scenario.processingFee),
        scenarioDeskId: scenarioDesk.id,
        scenarioNumber: scenario.scenarioNumber,
      })),
    });

    await tx.contact.update({
      where: {
        id: contact.id,
      },
      data: {
        status: ContactStatus.IN_PROCESSING,
      },
    });

    return scenarioDesk;
  });

  await logAuditEvent(
    access.data.id,
    "FINALIZE_SCENARIO_DESK",
    "ScenarioDesk",
    finalizedScenarioDesk.id,
    {
      contactId: contact.id,
      selectedScenarioNumber: input.selectedScenarioNumber,
    },
  );
  revalidatePath("/scenario-desk");
  revalidatePath(`/scenario-desk/${contact.id}`);
  revalidatePath("/opportunities");
  updateTag("scenario-desk-list");
  updateTag("phase4-list");

  return {
    success: true,
  };
}
