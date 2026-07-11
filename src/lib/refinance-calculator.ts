import {
  buildAnnualAmortizationSchedule,
  calculateMonthlyPaymentByMonths,
  type AnnualAmortizationRow,
} from "@/lib/payment-calculator";

export type RefinanceCalculatorInput = {
  currentBalance: number;
  currentInterestRate: number;
  originalTermMonths: number;
  originationMonth: number;
  originationYear: number;
  newLoanAmount: number;
  newInterestRate: number;
  newTermMonths: number;
  refinanceFees: number;
  cashOut: number;
  rollFeesIntoLoan: boolean;
};

export type RefinanceCalculationResult = {
  remainingTermMonths: number;
  effectiveNewPrincipal: number;
  currentMonthlyPayment: number;
  newMonthlyPayment: number;
  monthlySavings: number;
  annualSavings: number;
  breakEvenMonths: number | null;
  breakEvenDate: Date | null;
  currentRemainingInterest: number;
  newLoanInterest: number;
  interestDifference: number;
  currentAmortization: AnnualAmortizationRow[];
  newAmortization: AnnualAmortizationRow[];
  savingsByYear: Array<{ year: number; month: number; cumulativeSavings: number }>;
  comparisonHorizonMonths: number;
};

export const refinanceCalculatorDefaults: RefinanceCalculatorInput = {
  currentBalance: 200_000,
  currentInterestRate: 6,
  originalTermMonths: 360,
  originationMonth: 7,
  originationYear: 2021,
  newLoanAmount: 192_000,
  newInterestRate: 4.75,
  newTermMonths: 360,
  refinanceFees: 6_000,
  cashOut: 0,
  rollFeesIntoLoan: false,
};

export function monthsElapsedSinceOrigination(
  originationMonth: number,
  originationYear: number,
  asOfDate: Date,
) {
  return (
    (asOfDate.getFullYear() - originationYear) * 12 +
    (asOfDate.getMonth() + 1 - originationMonth)
  );
}

export function calculateRemainingTermMonths(
  originalTermMonths: number,
  originationMonth: number,
  originationYear: number,
  asOfDate: Date,
) {
  const elapsed = monthsElapsedSinceOrigination(originationMonth, originationYear, asOfDate);
  if (elapsed < 0) return { error: "Origination date cannot be in the future.", months: null };
  const remaining = originalTermMonths - elapsed;
  if (remaining < 1) {
    return { error: "The current loan appears fully matured. Review the origination date and original term.", months: null };
  }
  return { error: null, months: remaining };
}

export function validateRefinanceInput(input: RefinanceCalculatorInput, asOfDate: Date) {
  const errors: string[] = [];
  if (!Number.isFinite(input.currentBalance) || input.currentBalance <= 0) errors.push("Enter a current loan balance greater than zero.");
  if (!Number.isFinite(input.newLoanAmount) || input.newLoanAmount <= 0) errors.push("Enter a proposed new loan amount greater than zero.");
  if (!Number.isFinite(input.currentInterestRate) || input.currentInterestRate < 0) errors.push("Current interest rate cannot be negative.");
  if (!Number.isFinite(input.newInterestRate) || input.newInterestRate < 0) errors.push("New interest rate cannot be negative.");
  if (![120, 180, 240, 360].includes(input.originalTermMonths)) errors.push("Select a valid original loan term.");
  if (![120, 180, 240, 360].includes(input.newTermMonths)) errors.push("Select a valid new loan term.");
  if (!Number.isInteger(input.originationMonth) || input.originationMonth < 1 || input.originationMonth > 12) errors.push("Select a valid origination month.");
  if (!Number.isInteger(input.originationYear) || input.originationYear < 1900) errors.push("Enter a valid origination year.");
  if (!Number.isFinite(input.refinanceFees) || input.refinanceFees < 0) errors.push("Refinance fees cannot be negative.");
  if (!Number.isFinite(input.cashOut) || input.cashOut < 0) errors.push("Cash out cannot be negative.");
  if (input.cashOut > input.newLoanAmount) errors.push("Cash out cannot exceed the proposed new loan amount.");
  const remaining = calculateRemainingTermMonths(input.originalTermMonths, input.originationMonth, input.originationYear, asOfDate);
  if (remaining.error) errors.push(remaining.error);
  return errors;
}

export function calculateRefinanceScenario(
  input: RefinanceCalculatorInput,
  asOfDate: Date,
): { errors: string[]; result: RefinanceCalculationResult | null } {
  const errors = validateRefinanceInput(input, asOfDate);
  if (errors.length) return { errors, result: null };

  const remainingTermMonths = calculateRemainingTermMonths(
    input.originalTermMonths,
    input.originationMonth,
    input.originationYear,
    asOfDate,
  ).months!;
  const effectiveNewPrincipal = input.newLoanAmount + (input.rollFeesIntoLoan ? input.refinanceFees : 0);
  const currentMonthlyPayment = calculateMonthlyPaymentByMonths(input.currentBalance, input.currentInterestRate, remainingTermMonths);
  const newMonthlyPayment = calculateMonthlyPaymentByMonths(effectiveNewPrincipal, input.newInterestRate, input.newTermMonths);
  const monthlySavings = currentMonthlyPayment - newMonthlyPayment;
  const breakEvenMonths = monthlySavings > 0 ? input.refinanceFees / monthlySavings : null;
  const breakEvenDate = breakEvenMonths === null ? null : addMonths(asOfDate, Math.ceil(breakEvenMonths));
  const currentAmortization = buildAnnualAmortizationSchedule(input.currentBalance, input.currentInterestRate, remainingTermMonths, currentMonthlyPayment);
  const newAmortization = buildAnnualAmortizationSchedule(effectiveNewPrincipal, input.newInterestRate, input.newTermMonths, newMonthlyPayment);
  const currentRemainingInterest = currentAmortization.reduce((sum, row) => sum + row.interestPaid, 0);
  const newLoanInterest = newAmortization.reduce((sum, row) => sum + row.interestPaid, 0);
  const comparisonHorizonMonths = Math.min(360, Math.max(remainingTermMonths, input.newTermMonths));
  const savingsByYear = buildSavingsByYear(monthlySavings, input.refinanceFees, comparisonHorizonMonths);

  const numericValues = [effectiveNewPrincipal, currentMonthlyPayment, newMonthlyPayment, monthlySavings, currentRemainingInterest, newLoanInterest];
  if (numericValues.some((value) => !Number.isFinite(value))) {
    return { errors: ["The entered values are too large to calculate safely."], result: null };
  }

  return {
    errors: [],
    result: {
      remainingTermMonths,
      effectiveNewPrincipal,
      currentMonthlyPayment,
      newMonthlyPayment,
      monthlySavings,
      annualSavings: monthlySavings * 12,
      breakEvenMonths,
      breakEvenDate,
      currentRemainingInterest,
      newLoanInterest,
      interestDifference: currentRemainingInterest - newLoanInterest,
      currentAmortization,
      newAmortization,
      savingsByYear,
      comparisonHorizonMonths,
    },
  };
}

export function buildSavingsByYear(monthlySavings: number, fees: number, horizonMonths: number) {
  const points: Array<{ year: number; month: number; cumulativeSavings: number }> = [];
  for (let month = 12; month <= horizonMonths; month += 12) {
    points.push({ year: month / 12, month, cumulativeSavings: monthlySavings * month - fees });
  }
  if (horizonMonths % 12 !== 0) {
    points.push({ year: horizonMonths / 12, month: horizonMonths, cumulativeSavings: monthlySavings * horizonMonths - fees });
  }
  return points;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date.getFullYear(), date.getMonth(), 1);
  result.setMonth(result.getMonth() + months);
  return result;
}
