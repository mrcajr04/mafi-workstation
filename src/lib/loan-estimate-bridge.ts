import type { LoanEstimateState } from "@/lib/loan-estimate-calc";
import {
  DEFAULT_STATE,
  type LoanProgram,
  type LoanState,
  type Occupancy,
  type PropertyType,
} from "@/lib/loan-estimate-design";

/**
 * Bridge between the production loan-estimate state (`LoanEstimateState`, all
 * `string`-typed, the shape that feeds PDF generation / storage / audit) and
 * the redesigned UI state (`LoanState`, `number`-typed).
 *
 * The redesigned UI is presentation only. The compliance-critical path
 * (phase4 route mapping -> generateLoanEstimatePdf -> Supabase -> audit log)
 * still speaks `LoanEstimateState` end to end; these two functions convert at
 * the seam between that path and the UI, and nowhere else.
 */

/**
 * Screen-only header fields present in the redesigned UI but absent from the
 * production `LoanEstimateState` (and therefore from the generated/stored PDF).
 *
 * FOLLOW-UP (tracked in questions.md): these five are display-only for now.
 * `loanPurpose`, `lenderAndProduct`, `propertyAddress`, and `nmlsId` are sourced
 * from Contact / selected Scenario / LO Profile in the route. `mloId` has NO
 * source on the Profile model — a genuine schema gap that already caused an
 * NMLS/MLO "same value" bug. The fix is to add `mloId` to Profile, not to keep
 * defaulting it blank here.
 */
export type LoanEstimateHeaderExtras = {
  nmlsId: string;
  mloId: string;
  loanPurpose: string;
  lenderAndProduct: string;
  propertyAddress: string;
};

/** Parse a production string field to a number; empty / non-numeric -> 0. */
function num(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Serialize a UI number back to a production string, trimming floating-point
 * noise (e.g. a derived `66.6666666667`) without discarding real precision an
 * LO entered. Downstream formatting rounds for display regardless.
 */
function numToStr(value: number): string {
  return String(Math.round(value * 1e6) / 1e6);
}

const PROPERTY_TYPES: readonly PropertyType[] = [
  "CONDO",
  "CONDO-HOTEL",
  "SINGLE FAMILY",
  "COMMERCIAL",
];

const LOAN_PROGRAMS: readonly LoanProgram[] = [
  "30 YR FIXED",
  "15 YR FIXED",
  "1/1 ARM",
  "3/1 ARM",
  "5/1 ARM",
  "7/1 ARM",
  "10/1 ARM",
  "IO",
];

function coercePropertyType(value: string): PropertyType {
  if ((PROPERTY_TYPES as readonly string[]).includes(value)) {
    return value as PropertyType;
  }
  // Safety net only. The phase4 route's mapPropertyType provably emits only
  // CONDO / COMMERCIAL / SINGLE FAMILY, all within the union above, so this
  // branch should never run. Logged (not silent) if it somehow does.
  console.warn(
    `[loan-estimate-bridge] Unexpected propertyType "${value}"; defaulting to "SINGLE FAMILY".`,
  );
  return "SINGLE FAMILY";
}

function coerceProgram(value: string): LoanProgram {
  if ((LOAN_PROGRAMS as readonly string[]).includes(value)) {
    return value as LoanProgram;
  }
  // Safety net only. The phase4 route's mapProgram provably emits only
  // IO / 15 YR FIXED / 30 YR FIXED, all within the union above, so this branch
  // should never run. Logged (not silent) if it somehow does.
  console.warn(
    `[loan-estimate-bridge] Unexpected program "${value}"; defaulting to "30 YR FIXED".`,
  );
  return "30 YR FIXED";
}

function coerceOccupancy(value: string): Occupancy {
  // Deliberate, non-lossy normalization: the phase4 route's mapOccupancy emits
  // "SECOND HOME" (from BorrowerType.SECOND_HOME); the redesign labels the same
  // concept "SECONDARY". Everything else maps 1:1.
  const normalized = value === "SECOND HOME" ? "SECONDARY" : value;
  if (
    normalized === "PRIMARY" ||
    normalized === "SECONDARY" ||
    normalized === "INVESTMENT" ||
    normalized === "OTHER"
  ) {
    return normalized;
  }
  // Visible fallback rather than a silent default: occupancy materially affects
  // pricing/disclosure. Reachable only if mapOccupancy ever emits a value
  // outside its current four outputs (PRIMARY / SECOND HOME / INVESTMENT /
  // OTHER), so this should never run today.
  console.warn(
    `[loan-estimate-bridge] Unexpected occupancy "${value}"; defaulting to "PRIMARY".`,
  );
  return "PRIMARY";
}

/** Production (string) state + screen-only extras -> redesigned UI (number) state. */
export function toDesignState(
  prod: LoanEstimateState,
  extras: LoanEstimateHeaderExtras,
): LoanState {
  return {
    ...DEFAULT_STATE,

    // Screen-only header fields (no production-state source).
    nmlsId: extras.nmlsId,
    mloId: extras.mloId,
    loanPurpose: extras.loanPurpose,
    lenderAndProduct: extras.lenderAndProduct,
    propertyAddress: extras.propertyAddress,

    // Identity / plain strings — passthrough.
    presentedBy: prod.presentedBy,
    cellPhone: prod.cellPhone,
    officePhone: prod.officePhone,
    email: prod.email,
    applicantName: prod.applicantName,
    loanNumber: prod.loanNumber,

    // Exact-match string-literal unions — passthrough.
    sfrOrCondo: prod.sfrOrCondo,
    foreignOrDomestic: prod.foreignOrDomestic,
    newOrUsed: prod.newOrUsed,
    developFee: prod.developFee,
    originationMode: prod.originationMode,
    brokerFeeMode: prod.brokerFeeMode,

    // Narrowed enums — guarded coerce (see functions above).
    propertyType: coercePropertyType(prod.propertyType),
    occupancy: coerceOccupancy(prod.occupancy),
    program: coerceProgram(prod.program),

    // Numeric fields — string -> number.
    purchasePrice: num(prod.purchasePrice),
    downPaymentPct: num(prod.downPaymentPct),
    rate: num(prod.rate),
    originationPct: num(prod.originationPct),
    originationFlatFee: num(prod.originationFlatFee),
    brokerFeePct: num(prod.brokerFeePct),
    brokerFeeFlatFee: num(prod.brokerFeeFlatFee),
    appraisalFee: num(prod.appraisalFee),
    applicationFee: num(prod.applicationFee),
    underwritingFee: num(prod.underwritingFee),
    processingFee: num(prod.processingFee),
    adminFee: num(prod.adminFee),
    interestDays: num(prod.interestDays),
    settlementFee: num(prod.settlementFee),
    titleSearchFee: num(prod.titleSearchFee),
    miscTitleFee: num(prod.miscTitleFee),
    titleInsuranceFee: num(prod.titleInsuranceFee),
    endorsements: num(prod.endorsements),
    recordingFees: num(prod.recordingFees),
    cityTaxStamps: num(prod.cityTaxStamps),
    stateTaxStamps: num(prod.stateTaxStamps),
    stampsOnDeed: num(prod.stampsOnDeed),
    surveyFee: num(prod.surveyFee),
    transamericaFee: num(prod.transamericaFee),
    floodZoneCertFee: num(prod.floodZoneCertFee),
    miscFilingFee: num(prod.miscFilingFee),
    taxMonths: num(prod.taxMonths),
    propertyTaxRatePct: num(prod.propertyTaxRatePct),
    hazardInsEscrow: num(prod.hazardInsEscrow),
    developFeeContractPct: num(prod.developFeeContractPct),
    floodHO6Annual: num(prod.floodHO6Annual),
    hazardInsAnnual: num(prod.hazardInsAnnual),
    hoaMonthly: num(prod.hoaMonthly),
    sellerCredit: num(prod.sellerCredit),
    otherCredits: num(prod.otherCredits),
    downPaymentGivenToSeller: num(prod.downPaymentGivenToSeller),
    reserveMonths: num(prod.reserveMonths),
    lowThreshold: num(prod.lowThreshold),
    lowFlatFee: num(prod.lowFlatFee),
    tier1Cap: num(prod.tier1Cap),
    tier1Rate: num(prod.tier1Rate),
    tier2Cap: num(prod.tier2Cap),
    tier2Rate: num(prod.tier2Rate),
    tier3Cap: num(prod.tier3Cap),
    tier3Rate: num(prod.tier3Rate),
    tier4Cap: num(prod.tier4Cap),
    tier4Rate: num(prod.tier4Rate),
    tier5Cap: num(prod.tier5Cap),
    tier5Rate: num(prod.tier5Rate),
    tier6Cap: num(prod.tier6Cap),
    tier6Rate: num(prod.tier6Rate),
  };
}

/**
 * Redesigned UI (number) state -> production (string) state for PDF generation.
 *
 * The five screen-only extras (nmlsId, mloId, loanPurpose, lenderAndProduct,
 * propertyAddress) are intentionally dropped: `LoanEstimateState` has no home
 * for them and the PDF template does not reference them.
 */
export function toProductionState(design: LoanState): LoanEstimateState {
  return {
    // Identity / plain strings.
    presentedBy: design.presentedBy,
    cellPhone: design.cellPhone,
    officePhone: design.officePhone,
    email: design.email,
    applicantName: design.applicantName,
    loanNumber: design.loanNumber,

    // Unions / enums back to production's (looser) string fields.
    sfrOrCondo: design.sfrOrCondo,
    foreignOrDomestic: design.foreignOrDomestic,
    newOrUsed: design.newOrUsed,
    developFee: design.developFee,
    originationMode: design.originationMode,
    brokerFeeMode: design.brokerFeeMode,
    propertyType: design.propertyType,
    occupancy: design.occupancy,
    program: design.program,

    // Numeric fields — number -> string.
    purchasePrice: numToStr(design.purchasePrice),
    downPaymentPct: numToStr(design.downPaymentPct),
    rate: numToStr(design.rate),
    originationPct: numToStr(design.originationPct),
    originationFlatFee: numToStr(design.originationFlatFee),
    brokerFeePct: numToStr(design.brokerFeePct),
    brokerFeeFlatFee: numToStr(design.brokerFeeFlatFee),
    appraisalFee: numToStr(design.appraisalFee),
    applicationFee: numToStr(design.applicationFee),
    underwritingFee: numToStr(design.underwritingFee),
    processingFee: numToStr(design.processingFee),
    adminFee: numToStr(design.adminFee),
    interestDays: numToStr(design.interestDays),
    settlementFee: numToStr(design.settlementFee),
    titleSearchFee: numToStr(design.titleSearchFee),
    miscTitleFee: numToStr(design.miscTitleFee),
    titleInsuranceFee: numToStr(design.titleInsuranceFee),
    endorsements: numToStr(design.endorsements),
    recordingFees: numToStr(design.recordingFees),
    cityTaxStamps: numToStr(design.cityTaxStamps),
    stateTaxStamps: numToStr(design.stateTaxStamps),
    stampsOnDeed: numToStr(design.stampsOnDeed),
    surveyFee: numToStr(design.surveyFee),
    transamericaFee: numToStr(design.transamericaFee),
    floodZoneCertFee: numToStr(design.floodZoneCertFee),
    miscFilingFee: numToStr(design.miscFilingFee),
    taxMonths: numToStr(design.taxMonths),
    propertyTaxRatePct: numToStr(design.propertyTaxRatePct),
    hazardInsEscrow: numToStr(design.hazardInsEscrow),
    developFeeContractPct: numToStr(design.developFeeContractPct),
    floodHO6Annual: numToStr(design.floodHO6Annual),
    hazardInsAnnual: numToStr(design.hazardInsAnnual),
    hoaMonthly: numToStr(design.hoaMonthly),
    sellerCredit: numToStr(design.sellerCredit),
    otherCredits: numToStr(design.otherCredits),
    downPaymentGivenToSeller: numToStr(design.downPaymentGivenToSeller),
    reserveMonths: numToStr(design.reserveMonths),
    lowThreshold: numToStr(design.lowThreshold),
    lowFlatFee: numToStr(design.lowFlatFee),
    tier1Cap: numToStr(design.tier1Cap),
    tier1Rate: numToStr(design.tier1Rate),
    tier2Cap: numToStr(design.tier2Cap),
    tier2Rate: numToStr(design.tier2Rate),
    tier3Cap: numToStr(design.tier3Cap),
    tier3Rate: numToStr(design.tier3Rate),
    tier4Cap: numToStr(design.tier4Cap),
    tier4Rate: numToStr(design.tier4Rate),
    tier5Cap: numToStr(design.tier5Cap),
    tier5Rate: numToStr(design.tier5Rate),
    tier6Cap: numToStr(design.tier6Cap),
    tier6Rate: numToStr(design.tier6Rate),
  };
}
