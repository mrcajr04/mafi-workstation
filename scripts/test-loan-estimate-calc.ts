import {
  calculateLoanEstimate,
  formatLoanEstimateCurrency,
  loanEstimateDefaults,
} from "../src/lib/loan-estimate-calc";

const expected = {
  reserves: "$27,564.33",
  totalAssetsRequired: "$62,728.36",
  totalCashToClose: "$35,164.03",
  totalClosingCosts: "$18,517.00",
  totalMonthlyPayment: "$4,594.05",
  totalPrepaid: "$16,647.03",
};

const result = calculateLoanEstimate(loanEstimateDefaults);
const actual = {
  reserves: formatLoanEstimateCurrency(result.reserves),
  totalAssetsRequired: formatLoanEstimateCurrency(result.totalAssetsRequired),
  totalCashToClose: formatLoanEstimateCurrency(result.totalCashToClose),
  totalClosingCosts: formatLoanEstimateCurrency(result.totalClosingCosts),
  totalMonthlyPayment: formatLoanEstimateCurrency(result.totalMonthlyPayment),
  totalPrepaid: formatLoanEstimateCurrency(result.totalPrepaid),
};

console.log("Loan Estimate calc reference outputs:");
console.table(actual);

const failures = Object.entries(expected).filter(
  ([key, value]) => actual[key as keyof typeof actual] !== value,
);

if (failures.length > 0) {
  console.error("Loan Estimate calc reference test failed.");
  for (const [key, value] of failures) {
    console.error(
      `${key}: expected ${value}, received ${actual[key as keyof typeof actual]}`,
    );
  }
  process.exit(1);
}

console.log("Loan Estimate calc reference test passed.");
