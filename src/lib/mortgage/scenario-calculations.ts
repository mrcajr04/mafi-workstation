import { ScenarioLoanTerm } from "@prisma/client";

export type LoanTermMetadata = {
  amortizationYears: number;
  interestOnly: boolean;
  label: string;
};

export const scenarioTermMetadata: Record<ScenarioLoanTerm, LoanTermMetadata> = {
  ARM_3_1: { amortizationYears: 30, interestOnly: false, label: "3/1 ARM" },
  ARM_5_1: { amortizationYears: 30, interestOnly: false, label: "5/1 ARM" },
  ARM_7_1: { amortizationYears: 30, interestOnly: false, label: "7/1 ARM" },
  FIXED_15: { amortizationYears: 15, interestOnly: false, label: "15 yrs / Fixed" },
  FIXED_20: { amortizationYears: 20, interestOnly: false, label: "20 yrs / Fixed" },
  FIXED_30: { amortizationYears: 30, interestOnly: false, label: "30 yrs / Fixed" },
  INTEREST_ONLY: { amortizationYears: 30, interestOnly: true, label: "Interest Only (I/O)" },
};

export const scenarioDeskTermOptions: ScenarioLoanTerm[] = [
  ScenarioLoanTerm.FIXED_30,
  ScenarioLoanTerm.FIXED_20,
  ScenarioLoanTerm.FIXED_15,
  ScenarioLoanTerm.ARM_3_1,
  ScenarioLoanTerm.ARM_5_1,
  ScenarioLoanTerm.ARM_7_1,
  ScenarioLoanTerm.INTEREST_ONLY,
];

export function getLoanTermMetadata(loanTerm: ScenarioLoanTerm) {
  return scenarioTermMetadata[loanTerm] ?? scenarioTermMetadata.FIXED_30;
}

export function calculatePrincipalAndInterest(input: {
  annualRate: number;
  loanTerm: ScenarioLoanTerm;
  loanAmount: number;
}) {
  const loanAmount = Number.isFinite(input.loanAmount) ? input.loanAmount : 0;
  const annualRate = Number.isFinite(input.annualRate) ? input.annualRate : 0;
  const term = getLoanTermMetadata(input.loanTerm);
  const monthlyRate = annualRate / 100 / 12;

  if (loanAmount <= 0) {
    return 0;
  }

  if (term.interestOnly) {
    return loanAmount * monthlyRate;
  }

  const totalPayments = term.amortizationYears * 12;

  if (monthlyRate === 0) {
    return loanAmount / totalPayments;
  }

  const factor = (1 + monthlyRate) ** totalPayments;
  return loanAmount * ((monthlyRate * factor) / (factor - 1));
}

export function calculatePitia(input: {
  annualInsurance: number;
  annualPropertyTaxes: number;
  monthlyHoa: number;
  principalAndInterest: number;
}) {
  return (
    input.principalAndInterest +
    input.annualPropertyTaxes / 12 +
    input.monthlyHoa +
    input.annualInsurance / 12
  );
}

export function calculateVerifiedAssets(assets: Array<{ amount?: unknown }>) {
  return assets.reduce((total, asset) => total + numericValue(asset.amount), 0);
}

export function calculateLtvMismatch(input: {
  loanAmount: number;
  ltv: number;
  propertyValue: number;
  tolerancePct?: number;
}) {
  const tolerance = input.propertyValue * ((input.tolerancePct ?? 1) / 100);
  const impliedLoanAmount = input.propertyValue * (input.ltv / 100);

  return {
    difference: Math.abs(impliedLoanAmount - input.loanAmount),
    hasMismatch: Math.abs(impliedLoanAmount - input.loanAmount) > tolerance,
    impliedLoanAmount,
  };
}

export function isInterestRateOutsideExpectedRange(annualRate: number) {
  return annualRate > 0 && (annualRate < 2 || annualRate > 12);
}

export function numericValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value ?? "").replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}
