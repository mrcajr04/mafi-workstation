import assert from "node:assert/strict";
import {
  calculateMonthlyPrincipalAndInterest,
  calculatePaymentScenario,
  paymentCalculatorDefaults,
  syncAnnualAmountFromPercentage,
  syncAnnualPercentageFromAmount,
  syncAnnualPercentageFromMonthlyAmount,
  syncDownPaymentFromAmount,
  syncDownPaymentFromPercentage,
  syncMonthlyAmountFromAnnualPercentage,
} from "../src/lib/payment-calculator";

const closeTo = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);

assert.deepEqual(syncDownPaymentFromAmount(200_000, 50_000), { amount: 50_000, percentage: 25 });
assert.deepEqual(syncDownPaymentFromPercentage(200_000, 25), { amount: 50_000, percentage: 25 });
assert.deepEqual(syncAnnualAmountFromPercentage(200_000, 1.2), { amount: 2_400, percentage: 1.2 });
assert.deepEqual(syncAnnualPercentageFromAmount(200_000, 2_400), { amount: 2_400, percentage: 1.2 });
const insuranceFromPercent = syncMonthlyAmountFromAnnualPercentage(200_000, 1.8);
closeTo(insuranceFromPercent.amount, 300);
assert.equal(insuranceFromPercent.percentage, 1.8);
const insuranceFromAmount = syncAnnualPercentageFromMonthlyAmount(200_000, 300);
assert.equal(insuranceFromAmount.amount, 300);
closeTo(insuranceFromAmount.percentage, 1.8);

closeTo(calculateMonthlyPrincipalAndInterest(160_000, 6, 30), 959.28);
closeTo(calculateMonthlyPrincipalAndInterest(120_000, 0, 10), 1_000);

const scenario = calculatePaymentScenario(paymentCalculatorDefaults);
assert.equal(scenario.errors.length, 0);
assert.ok(scenario.result);
closeTo(scenario.result.loanAmount, 160_000);
closeTo(scenario.result.totalMonthlyPayment, 1_659.28);
closeTo(scenario.result.recommendedAnnualIncome, scenario.result.totalMonthlyPayment * 12 / 0.38);
closeTo(scenario.result.minimumDownPayment, 10_000);
closeTo(scenario.result.estimatedClosingCosts, 3_800);
closeTo(scenario.result.recommendedSavings, 13_800);
closeTo(scenario.result.amortization.at(-1)?.endingBalance ?? 1, 0);

const fullDownPayment = calculatePaymentScenario({
  ...paymentCalculatorDefaults,
  downPayment: paymentCalculatorDefaults.homePrice,
});
assert.ok(fullDownPayment.result);
assert.equal(fullDownPayment.result.loanAmount, 0);
assert.equal(fullDownPayment.result.principalAndInterest, 0);

const invalid = calculatePaymentScenario({ ...paymentCalculatorDefaults, downPayment: 250_000 });
assert.ok(invalid.errors.includes("Down payment cannot exceed the home price."));
assert.equal(invalid.result, null);

const largeScenario = calculatePaymentScenario({ ...paymentCalculatorDefaults, homePrice: 100_000_000 });
assert.ok(largeScenario.result);
for (const value of Object.values(largeScenario.result).filter((item): item is number => typeof item === "number")) {
  assert.ok(Number.isFinite(value));
}

console.log("Payment calculator tests passed.");
