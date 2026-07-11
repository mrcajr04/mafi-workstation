import assert from "node:assert/strict";
import {
  buildSavingsByYear,
  calculateRefinanceScenario,
  calculateRemainingTermMonths,
  refinanceCalculatorDefaults,
} from "../src/lib/refinance-calculator";
import { calculateMonthlyPaymentByMonths } from "../src/lib/payment-calculator";

const asOfDate = new Date(2026, 6, 11);
const closeTo = (actual: number, expected: number, tolerance = 0.02) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not close to ${expected}`);

assert.equal(calculateRemainingTermMonths(360, 7, 2021, asOfDate).months, 300);
assert.equal(calculateRemainingTermMonths(360, 8, 2026, asOfDate).error, "Origination date cannot be in the future.");
assert.match(calculateRemainingTermMonths(120, 1, 2010, asOfDate).error ?? "", /fully matured/);
closeTo(calculateMonthlyPaymentByMonths(120_000, 0, 120), 1_000);

const scenario = calculateRefinanceScenario(refinanceCalculatorDefaults, asOfDate);
assert.equal(scenario.errors.length, 0);
assert.ok(scenario.result);
closeTo(scenario.result.currentMonthlyPayment, calculateMonthlyPaymentByMonths(200_000, 6, 300));
closeTo(scenario.result.newMonthlyPayment, calculateMonthlyPaymentByMonths(192_000, 4.75, 360));
closeTo(scenario.result.monthlySavings, scenario.result.currentMonthlyPayment - scenario.result.newMonthlyPayment);
closeTo(scenario.result.breakEvenMonths ?? 0, 6_000 / scenario.result.monthlySavings);
assert.ok(scenario.result.breakEvenDate instanceof Date);
closeTo(scenario.result.currentAmortization.at(-1)?.endingBalance ?? 1, 0);
closeTo(scenario.result.newAmortization.at(-1)?.endingBalance ?? 1, 0);

const rolled = calculateRefinanceScenario({ ...refinanceCalculatorDefaults, rollFeesIntoLoan: true }, asOfDate);
assert.ok(rolled.result);
assert.equal(rolled.result.effectiveNewPrincipal, 198_000);
closeTo(rolled.result.breakEvenMonths ?? 0, 6_000 / rolled.result.monthlySavings);

const cashOut = calculateRefinanceScenario({ ...refinanceCalculatorDefaults, cashOut: 20_000 }, asOfDate);
assert.ok(cashOut.result);
assert.equal(cashOut.result.effectiveNewPrincipal, refinanceCalculatorDefaults.newLoanAmount);

const noSavings = calculateRefinanceScenario({ ...refinanceCalculatorDefaults, newInterestRate: 12 }, asOfDate);
assert.ok(noSavings.result);
assert.ok(noSavings.result.monthlySavings < 0);
assert.equal(noSavings.result.breakEvenMonths, null);
assert.equal(noSavings.result.breakEvenDate, null);

const zeroSavingsPoints = buildSavingsByYear(0, 6_000, 24);
assert.deepEqual(zeroSavingsPoints.map((point) => point.cumulativeSavings), [-6_000, -6_000]);
assert.equal(scenario.result.savingsByYear[0].cumulativeSavings, scenario.result.monthlySavings * 12 - 6_000);
assert.ok(Number.isFinite(scenario.result.currentRemainingInterest));
assert.ok(Number.isFinite(scenario.result.newLoanInterest));

const invalid = calculateRefinanceScenario({ ...refinanceCalculatorDefaults, newLoanAmount: 0 }, asOfDate);
assert.ok(invalid.errors.includes("Enter a proposed new loan amount greater than zero."));
assert.equal(invalid.result, null);

console.log("Refinance calculator tests passed.");
