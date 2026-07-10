import assert from "node:assert/strict";
import { toDesignState, toProductionState } from "../src/lib/loan-estimate-bridge";
import {
  calculateLoanEstimate,
  loanEstimateProductionDefaults,
  loanEstimateSampleDefaults,
  parseStoredLoanEstimateState,
} from "../src/lib/loan-estimate-calc";

const unknownFeeFields = [
  "adminFee",
  "appraisalFee",
  "applicationFee",
  "brokerFeeFlatFee",
  "brokerFeePct",
  "cityTaxStamps",
  "endorsements",
  "floodZoneCertFee",
  "miscFilingFee",
  "miscTitleFee",
  "recordingFees",
  "settlementFee",
  "stateTaxStamps",
  "surveyFee",
  "titleInsuranceFee",
  "titleSearchFee",
  "transamericaFee",
  "underwritingFee",
] as const;

for (const field of unknownFeeFields) {
  assert.equal(loanEstimateProductionDefaults[field], "", `${field} must start blank`);
  assert.notEqual(
    loanEstimateSampleDefaults[field],
    loanEstimateProductionDefaults[field],
    `${field} sample data must remain separate`,
  );
}

const extras = {
  lenderAndProduct: "Test product",
  loanPurpose: "Purchase",
  mloId: "",
  nmlsId: "123",
  propertyAddress: "123 Test St",
};
const blankDesign = toDesignState(loanEstimateProductionDefaults, extras);
assert.ok(Number.isNaN(blankDesign.appraisalFee));
assert.equal(toProductionState(blankDesign).appraisalFee, "");

const zeroState = { ...loanEstimateProductionDefaults, appraisalFee: "0" };
assert.equal(toProductionState(toDesignState(zeroState, extras)).appraisalFee, "0");

const positiveState = { ...loanEstimateProductionDefaults, appraisalFee: "725.5" };
assert.equal(
  toProductionState(toDesignState(positiveState, extras)).appraisalFee,
  "725.5",
);

const blankTotals = calculateLoanEstimate(loanEstimateProductionDefaults);
assert.equal(blankTotals.appraisalFee, 0);
assert.ok(Number.isFinite(blankTotals.totalClosingCosts));
assert.ok(Number.isFinite(blankTotals.totalAssetsRequired));

assert.deepEqual(
  parseStoredLoanEstimateState(positiveState),
  positiveState,
  "stored string state must round-trip",
);
assert.equal(parseStoredLoanEstimateState({ appraisalFee: "725.5" }), null);

console.log("Loan Estimate initialization tests passed.");
