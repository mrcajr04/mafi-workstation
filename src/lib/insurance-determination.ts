import { InsuranceCoverageBasis } from "@prisma/client";

export const insuranceDeterminationMessages = {
  incomplete:
    "Complete the homeowners-insurance estimate before sending this opportunity to Scenario Review.",
  unconfirmedZero:
    "Confirm why the borrower-paid annual insurance estimate is $0 before sending this opportunity to Scenario Review.",
} as const;

type InsuranceDeterminationInput = {
  annualInsurance: { toString(): string } | number | string | null | undefined;
  coverageBasis: InsuranceCoverageBasis | null | undefined;
  zeroConfirmed: boolean | null | undefined;
};

export type InsuranceDeterminationResult =
  | { complete: true }
  | {
      complete: false;
      field:
        | "estimatedInsuranceAnnual"
        | "insuranceCoverageBasis"
        | "insuranceZeroConfirmed";
      message: string;
    };

export function validateInsuranceDetermination({
  annualInsurance,
  coverageBasis,
  zeroConfirmed,
}: InsuranceDeterminationInput): InsuranceDeterminationResult {
  if (
    annualInsurance === null ||
    annualInsurance === undefined ||
    String(annualInsurance).trim() === ""
  ) {
    return {
      complete: false,
      field: "estimatedInsuranceAnnual",
      message: insuranceDeterminationMessages.incomplete,
    };
  }

  const amount = Number(annualInsurance);

  if (!Number.isFinite(amount) || amount < 0) {
    return {
      complete: false,
      field: "estimatedInsuranceAnnual",
      message: insuranceDeterminationMessages.incomplete,
    };
  }

  if (amount > 0) {
    return { complete: true };
  }

  if (
    !coverageBasis ||
    coverageBasis === InsuranceCoverageBasis.BORROWER_PAID_POLICY
  ) {
    return {
      complete: false,
      field: "insuranceCoverageBasis",
      message: insuranceDeterminationMessages.unconfirmedZero,
    };
  }

  if (!zeroConfirmed) {
    return {
      complete: false,
      field: "insuranceZeroConfirmed",
      message: insuranceDeterminationMessages.unconfirmedZero,
    };
  }

  return { complete: true };
}
