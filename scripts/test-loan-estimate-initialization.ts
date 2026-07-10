import assert from "node:assert/strict";
import { toDesignState, toProductionState } from "../src/lib/loan-estimate-bridge";
import {
  calculateLoanEstimate,
  loanEstimateProductionDefaults,
  loanEstimateSampleDefaults,
  parseStoredLoanEstimateState,
} from "../src/lib/loan-estimate-calc";

const standardFeeDefaults = {
  adminFee: "750",
  appraisalFee: "750",
  applicationFee: "250",
  brokerFeePct: "1",
  cityTaxStamps: "1445.50",
  endorsements: "492.50",
  floodZoneCertFee: "20",
  miscFilingFee: "580",
  miscTitleFee: "550",
  processingFee: "950",
  recordingFees: "285",
  settlementFee: "1250",
  stateTaxStamps: "826",
  titleInsuranceFee: "250",
  titleSearchFee: "250",
  transamericaFee: "108",
  underwritingFee: "1500",
} as const;

for (const [field, expected] of Object.entries(standardFeeDefaults)) {
  assert.equal(
    loanEstimateProductionDefaults[field as keyof typeof standardFeeDefaults],
    expected,
    `${field} must use the approved standard default`,
  );
}

assert.notEqual(
  loanEstimateProductionDefaults.applicantName,
  loanEstimateSampleDefaults.applicantName,
  "sample borrower identity must remain separate from production defaults",
);

const extras = {
  lenderAndProduct: "Test product",
  loanPurpose: "Purchase",
  mloId: "",
  nmlsId: "123",
  propertyAddress: "123 Test St",
};
const blankState = { ...loanEstimateProductionDefaults, appraisalFee: "" };
const blankDesign = toDesignState(blankState, extras);
assert.ok(Number.isNaN(blankDesign.appraisalFee));
assert.equal(toProductionState(blankDesign).appraisalFee, "");

const zeroState = { ...loanEstimateProductionDefaults, appraisalFee: "0" };
assert.equal(toProductionState(toDesignState(zeroState, extras)).appraisalFee, "0");

const positiveState = { ...loanEstimateProductionDefaults, appraisalFee: "725.5" };
assert.equal(
  toProductionState(toDesignState(positiveState, extras)).appraisalFee,
  "725.5",
);

const blankTotals = calculateLoanEstimate(blankState);
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
