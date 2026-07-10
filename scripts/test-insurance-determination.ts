import assert from "node:assert/strict";
import { InsuranceCoverageBasis } from "@prisma/client";
import {
  insuranceDeterminationMessages,
  validateInsuranceDetermination,
} from "../src/lib/insurance-determination";

const positive = validateInsuranceDetermination({
  annualInsurance: "1800.00",
  coverageBasis: null,
  zeroConfirmed: false,
});
assert.deepEqual(positive, { complete: true });

for (const annualInsurance of [null, undefined, "", "invalid", "-1"]) {
  const result = validateInsuranceDetermination({
    annualInsurance,
    coverageBasis: null,
    zeroConfirmed: false,
  });
  assert.equal(result.complete, false);
  if (!result.complete) {
    assert.equal(result.message, insuranceDeterminationMessages.incomplete);
  }
}

const zeroWithoutBasis = validateInsuranceDetermination({
  annualInsurance: 0,
  coverageBasis: null,
  zeroConfirmed: true,
});
assert.equal(zeroWithoutBasis.complete, false);

const zeroWithoutConfirmation = validateInsuranceDetermination({
  annualInsurance: 0,
  coverageBasis: InsuranceCoverageBasis.HOA_CONDO_MASTER_POLICY,
  zeroConfirmed: false,
});
assert.equal(zeroWithoutConfirmation.complete, false);

for (const coverageBasis of [
  InsuranceCoverageBasis.HOA_CONDO_MASTER_POLICY,
  InsuranceCoverageBasis.OTHER_CONFIRMED_COVERAGE,
]) {
  assert.deepEqual(
    validateInsuranceDetermination({
      annualInsurance: 0,
      coverageBasis,
      zeroConfirmed: true,
    }),
    { complete: true },
  );
}

assert.equal(
  validateInsuranceDetermination({
    annualInsurance: 0,
    coverageBasis: InsuranceCoverageBasis.BORROWER_PAID_POLICY,
    zeroConfirmed: true,
  }).complete,
  false,
);

console.log("Insurance determination validation tests passed.");
