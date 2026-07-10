"use server";

import {
  ContactStatus,
  Prisma,
  ScenarioDeskStatus,
  ScenarioLoanTerm,
  ScenarioProgram,
  RoleType,
} from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { logAccessDenied, logAuditEvent } from "@/lib/audit";
import { normalizeCurrencyInput } from "@/lib/currency";
import {
  calculatePitia,
  calculatePrincipalAndInterest,
  getLoanTermMetadata,
  numericValue,
  roundMoney,
} from "@/lib/mortgage/scenario-calculations";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { scenarioProgramLabels } from "@/lib/scenario-program";

export type ScenarioInput = {
  comments?: string;
  escrowed: boolean;
  interestRate: string;
  lenderAndProduct: string;
  loanTerm: string;
  mortgageInsurance?: boolean;
  monthlyInsurance?: string;
  originationPay: string;
  pitia: string;
  principalAndInterest: string;
  processingFee: string;
  program: ScenarioProgram;
  scenarioNumber: number;
};

// Defensive coercion — this runs on untrusted client payloads.
function asScenarioProgram(value: string): ScenarioProgram {
  return value in scenarioProgramLabels
    ? (value as ScenarioProgram)
    : ScenarioProgram.FIXED_30;
}

function asScenarioLoanTerm(
  value: string,
  program?: ScenarioProgram,
): ScenarioLoanTerm {
  if (value in ScenarioLoanTerm) {
    return value as ScenarioLoanTerm;
  }

  if (value === "15") {
    return ScenarioLoanTerm.FIXED_15;
  }

  if (value === "20") {
    return ScenarioLoanTerm.FIXED_20;
  }

  if (program === ScenarioProgram.ARM_3_1) {
    return ScenarioLoanTerm.ARM_3_1;
  }

  if (program === ScenarioProgram.ARM_5_1) {
    return ScenarioLoanTerm.ARM_5_1;
  }

  if (program === ScenarioProgram.ARM_7_1) {
    return ScenarioLoanTerm.ARM_7_1;
  }

  if (program === ScenarioProgram.IO) {
    return ScenarioLoanTerm.INTEREST_ONLY;
  }

  return ScenarioLoanTerm.FIXED_30;
}

export type FinalizeScenarioDeskInput = {
  comments: string;
  contactId: string;
  scenarios: ScenarioInput[];
  selectedScenarioNumber: number;
};

export type SaveScenarioDeskInput = {
  comments: string;
  contactId: string;
  scenarios: ScenarioInput[];
  selectedScenarioNumber?: number | null;
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

function prepareScenarios(scenarios: ScenarioInput[]) {
  return scenarios
    .slice(0, 3)
    .filter((scenario) => scenario.lenderAndProduct.trim());
}

function calculateScenarioPayments(
  scenario: ScenarioInput,
  context: {
    annualInsurance: number;
    annualPropertyTaxes: number;
    loanAmount: number;
    monthlyHoa: number;
  },
) {
  const program = asScenarioProgram(scenario.program);
  const loanTerm = asScenarioLoanTerm(scenario.loanTerm, program);
  const principalAndInterest = roundMoney(
    calculatePrincipalAndInterest({
      annualRate: decimalFromPercent(scenario.interestRate),
      loanTerm,
      loanAmount: context.loanAmount,
    }),
  );
  const pitia = roundMoney(
    calculatePitia({
      annualInsurance: context.annualInsurance,
      annualPropertyTaxes: context.annualPropertyTaxes,
      monthlyHoa: context.monthlyHoa,
      principalAndInterest,
    }),
  );

  return {
    loanTerm,
    pitia,
    principalAndInterest,
    program,
  };
}

function scenarioLoanTermYears(loanTerm: ScenarioLoanTerm) {
  return getLoanTermMetadata(loanTerm).amortizationYears;
}

export async function saveScenarioDesk(
  input: SaveScenarioDeskInput,
): Promise<ScenarioActionResult> {
  const access = await requireRole([RoleType.LICENSED_LO, RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied(
      "UPDATE_SCENARIO_DESK",
      "ScenarioDesk",
      input.contactId,
    );
    return {
      success: false,
      error: access.error,
    };
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: input.contactId,
      status: ContactStatus.IN_SCENARIO_REVIEW,
    },
    select: {
      id: true,
      opportunityValue: {
        select: {
          loanAmount: true,
        },
      },
      propertyDetails: {
        select: {
          additionalHoaFees: true,
          estimatedInsuranceAnnual: true,
          propertyTaxesLastYear: true,
          propertyTaxesPresentYear: true,
        },
      },
    },
  });

  if (!contact) {
    return {
      success: false,
      error: "Contact is not ready for scenario review.",
    };
  }

  const scenarios = prepareScenarios(input.scenarios);
  const calculationContext = {
    annualInsurance: numericValue(contact.propertyDetails?.estimatedInsuranceAnnual),
    annualPropertyTaxes: numericValue(
      contact.propertyDetails?.propertyTaxesPresentYear ??
        contact.propertyDetails?.propertyTaxesLastYear,
    ),
    loanAmount: numericValue(contact.opportunityValue?.loanAmount),
    monthlyHoa: numericValue(contact.propertyDetails?.additionalHoaFees),
  };
  const savedScenarioDesk = await prisma.$transaction(async (tx) => {
    const scenarioDesk = await tx.scenarioDesk.upsert({
      where: {
        contactId: contact.id,
      },
      create: {
        contactId: contact.id,
        selectedScenarioNumber: input.selectedScenarioNumber ?? null,
        status: ScenarioDeskStatus.IN_REVIEW,
      },
      update: {
        selectedScenarioNumber: input.selectedScenarioNumber ?? null,
        status: ScenarioDeskStatus.IN_REVIEW,
      },
    });

    await tx.scenario.deleteMany({
      where: {
        scenarioDeskId: scenarioDesk.id,
      },
    });

    if (scenarios.length) {
      await tx.scenario.createMany({
        data: scenarios.map((scenario) => {
          const calculated = calculateScenarioPayments(
            scenario,
            calculationContext,
          );
          return {
            comments: null,
            escrowed: scenario.escrowed,
            interestRate: decimalFromPercent(scenario.interestRate),
            lenderAndProduct: scenario.lenderAndProduct.trim(),
            loanTerm: scenarioLoanTermYears(calculated.loanTerm),
            loanTermCode: calculated.loanTerm,
            monthlyInsurance: 0,
            mortgageInsurance: scenario.mortgageInsurance ?? false,
            originationPay: decimalFromCurrency(scenario.originationPay),
            pitia: calculated.pitia,
            principalAndInterest: calculated.principalAndInterest,
            processingFee: decimalFromCurrency(scenario.processingFee),
            program: calculated.program,
            scenarioDeskId: scenarioDesk.id,
            scenarioNumber: scenario.scenarioNumber,
          };
        }),
      });
    }

    await tx.opportunityValue.updateMany({
      where: {
        contactId: contact.id,
      },
      data: {
        comments: input.comments.trim() || null,
      },
    });

    await tx.contact.update({
      where: {
        id: contact.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return scenarioDesk;
  });

  await logAuditEvent(
    access.data.id,
    "SAVE_SCENARIO_DRAFT",
    "ScenarioDesk",
    savedScenarioDesk.id,
    {
      contactId: contact.id,
      scenarioCount: scenarios.length,
      selectedScenarioNumber: input.selectedScenarioNumber ?? null,
    },
  );
  revalidatePath("/scenario-desk");
  revalidatePath(`/scenario-desk/${contact.id}`);
  updateTag("scenario-desk-list");

  return {
    success: true,
  };
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

  const scenarios = prepareScenarios(input.scenarios);

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
      opportunityValue: {
        select: {
          loanAmount: true,
        },
      },
      propertyDetails: {
        select: {
          additionalHoaFees: true,
          estimatedInsuranceAnnual: true,
          propertyTaxesLastYear: true,
          propertyTaxesPresentYear: true,
        },
      },
    },
  });

  if (!contact) {
    return {
      success: false,
      error: "Contact is not ready for scenario review.",
    };
  }

  if (contact.propertyDetails?.estimatedInsuranceAnnual == null) {
    return {
      success: false,
      error: "Estimated insurance is missing. PITIA may be understated.",
    };
  }

  const calculationContext = {
    annualInsurance: numericValue(contact.propertyDetails?.estimatedInsuranceAnnual),
    annualPropertyTaxes: numericValue(
      contact.propertyDetails?.propertyTaxesPresentYear ??
        contact.propertyDetails?.propertyTaxesLastYear,
    ),
    loanAmount: numericValue(contact.opportunityValue?.loanAmount),
    monthlyHoa: numericValue(contact.propertyDetails?.additionalHoaFees),
  };
  await prisma.$transaction(async (tx) => {
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
      data: scenarios.map((scenario) => {
        const calculated = calculateScenarioPayments(scenario, calculationContext);
        return {
          comments: null,
          escrowed: scenario.escrowed,
          interestRate: decimalFromPercent(scenario.interestRate),
          lenderAndProduct: scenario.lenderAndProduct.trim(),
          loanTerm: scenarioLoanTermYears(calculated.loanTerm),
          loanTermCode: calculated.loanTerm,
          monthlyInsurance: 0,
          mortgageInsurance: scenario.mortgageInsurance ?? false,
          originationPay: decimalFromCurrency(scenario.originationPay),
          pitia: calculated.pitia,
          principalAndInterest: calculated.principalAndInterest,
          processingFee: decimalFromCurrency(scenario.processingFee),
          program: calculated.program,
          scenarioDeskId: scenarioDesk.id,
          scenarioNumber: scenario.scenarioNumber,
        };
      }),
    });

    await tx.opportunityValue.updateMany({
      where: {
        contactId: contact.id,
      },
      data: {
        comments: input.comments.trim() || null,
      },
    });

    await tx.contact.update({
      where: {
        id: contact.id,
      },
      data: {
        status: ContactStatus.IN_PROCESSING,
      },
    });

    await tx.phase4Pipeline.createMany({
      data: {
        contactId: contact.id,
      },
      skipDuplicates: true,
    });

    await tx.auditLog.create({
      data: {
        action: "FINALIZE_SCENARIO_DESK",
        entityId: scenarioDesk.id,
        entityType: "ScenarioDesk",
        fieldDiffs: {
          contactId: contact.id,
          selectedScenarioNumber: input.selectedScenarioNumber,
        } satisfies Prisma.InputJsonObject,
        userId: access.data.id,
      },
    });

    return scenarioDesk;
  });
  revalidatePath("/scenario-desk");
  revalidatePath(`/scenario-desk/${contact.id}`);
  revalidatePath("/opportunities");
  updateTag("scenario-desk-list");
  updateTag("phase4-list");

  return {
    success: true,
  };
}
