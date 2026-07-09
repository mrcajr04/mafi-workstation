export type FeeMode = "percent" | "flat";
export type PropertyClass = "condo" | "sfr";
export type PropertyType = "CONDO" | "CONDO-HOTEL" | "SINGLE FAMILY" | "COMMERCIAL";
export type Occupancy = "PRIMARY" | "SECONDARY" | "INVESTMENT" | "OTHER";
export type LoanCategory = "F" | "D";
export type NewOrUsed = "New" | "Used";
export type YesNo = "Yes" | "No";
export type LoanProgram =
  | "30 YR FIXED"
  | "15 YR FIXED"
  | "1/1 ARM"
  | "3/1 ARM"
  | "5/1 ARM"
  | "7/1 ARM"
  | "10/1 ARM"
  | "IO";

export type LoanState = {
  presentedBy: string;
  cellPhone: string;
  officePhone: string;
  email: string;
  nmlsId: string;
  mloId: string;
  applicantName: string;
  loanNumber: string;
  loanPurpose: string;
  lenderAndProduct: string;
  propertyAddress: string;
  purchasePrice: number;
  downPaymentPct: number;
  sfrOrCondo: PropertyClass;
  propertyType: PropertyType;
  occupancy: Occupancy;
  foreignOrDomestic: LoanCategory;
  newOrUsed: NewOrUsed;
  developFee: YesNo;
  program: LoanProgram;
  rate: number;
  originationMode: FeeMode;
  originationPct: number;
  originationFlatFee: number;
  brokerFeeMode: FeeMode;
  brokerFeePct: number;
  brokerFeeFlatFee: number;
  appraisalFee: number;
  applicationFee: number;
  underwritingFee: number;
  processingFee: number;
  adminFee: number;
  interestDays: number;
  settlementFee: number;
  titleSearchFee: number;
  miscTitleFee: number;
  titleInsuranceFee: number;
  endorsements: number;
  recordingFees: number;
  cityTaxStamps: number;
  stateTaxStamps: number;
  stampsOnDeed: number;
  surveyFee: number;
  transamericaFee: number;
  floodZoneCertFee: number;
  miscFilingFee: number;
  taxMonths: number;
  propertyTaxRatePct: number;
  hazardInsEscrow: number;
  developFeeContractPct: number;
  floodHO6Annual: number;
  hazardInsAnnual: number;
  hoaMonthly: number;
  sellerCredit: number;
  otherCredits: number;
  downPaymentGivenToSeller: number;
  reserveMonths: number;
  lowThreshold: number;
  lowFlatFee: number;
  tier1Cap: number;
  tier1Rate: number;
  tier2Cap: number;
  tier2Rate: number;
  tier3Cap: number;
  tier3Rate: number;
  tier4Cap: number;
  tier4Rate: number;
  tier5Cap: number;
  tier5Rate: number;
  tier6Cap: number;
  tier6Rate: number;
};

export type LoanResults = {
  purchasePrice: number;
  downPaymentPct: number;
  downPayment: number;
  loanAmount: number;
  ltv: number;
  loanOrigination: number;
  brokerFee: number;
  appraisalFee: number;
  applicationFee: number;
  underwritingFee: number;
  processingFee: number;
  adminFee: number;
  interestPerDiem: number;
  settlementFee: number;
  titleSearchFee: number;
  miscTitleFee: number;
  titleInsuranceFee: number;
  tierContrib: number[];
  titlePremium: number;
  titlePremiumPlus100: number;
  suggestedEndorsements: number;
  endorsements: number;
  recordingFees: number;
  cityTaxStamps: number;
  stateTaxStamps: number;
  stampsOnDeed: number;
  surveyFee: number;
  transamericaFee: number;
  floodZoneCertFee: number;
  miscFilingFee: number;
  fixedLoanCosts: number;
  fixedTitleCosts: number;
  totalClosingCosts: number;
  monthlyPropertyTax: number;
  taxesEscrow: number;
  hazardInsEscrow: number;
  developFeeContract: number;
  capitalContribution: number;
  floodHO6Escrow: number;
  totalPrepaid: number;
  otherPrepaid: number;
  totalClosingAndPrepaid: number;
  sellerCredit: number;
  otherCredits: number;
  downPaymentGivenToSeller: number;
  totalCashToClose: number;
  principalInterest: number;
  monthlyHazard: number;
  monthlyFlood: number;
  monthlyHOA: number;
  totalMonthlyPayment: number;
  reserveMonths: number;
  reserves: number;
  totalAssetsRequired: number;
  hoaOrHazardLabel: string;
  hoaOrHazardValue: number;
};

export const DEFAULT_STATE: LoanState = {
  presentedBy: "Miguel Cardozo",
  cellPhone: "+17275550119",
  officePhone: "",
  email: "isaac.coleman@example.com",
  nmlsId: "2159915",
  mloId: "2004061",
  applicantName: "Hannah Price",
  loanNumber: "BF498402",
  loanPurpose: "Limited Cash-Out",
  lenderAndProduct: "Champions - DSCR 30yrs",
  propertyAddress: "772 Palm Ridge Dr, Orlando, FL 32819",
  purchasePrice: 600000,
  downPaymentPct: 66.6666666667,
  sfrOrCondo: "condo",
  propertyType: "CONDO",
  occupancy: "SECONDARY",
  foreignOrDomestic: "D",
  newOrUsed: "Used",
  developFee: "No",
  program: "30 YR FIXED",
  rate: 0,
  originationMode: "flat",
  originationPct: 0,
  originationFlatFee: 0,
  brokerFeeMode: "percent",
  brokerFeePct: 1,
  brokerFeeFlatFee: 2000,
  appraisalFee: 750,
  applicationFee: 250,
  underwritingFee: 1500,
  processingFee: 0,
  adminFee: 750,
  interestDays: 1,
  settlementFee: 1250,
  titleSearchFee: 250,
  miscTitleFee: 550,
  titleInsuranceFee: 250,
  endorsements: 492.5,
  recordingFees: 285,
  cityTaxStamps: 1445.5,
  stateTaxStamps: 826,
  stampsOnDeed: 0,
  surveyFee: 0,
  transamericaFee: 108,
  floodZoneCertFee: 20,
  miscFilingFee: 580,
  taxMonths: 4,
  propertyTaxRatePct: 1.927,
  hazardInsEscrow: 0,
  developFeeContractPct: 1.75,
  floodHO6Annual: 0,
  hazardInsAnnual: 0,
  hoaMonthly: 0,
  sellerCredit: 0,
  otherCredits: 0,
  downPaymentGivenToSeller: 400000,
  reserveMonths: 6,
  lowThreshold: 17392,
  lowFlatFee: 100,
  tier1Cap: 100000,
  tier1Rate: 5.75,
  tier2Cap: 1000000,
  tier2Rate: 5,
  tier3Cap: 5000000,
  tier3Rate: 2.5,
  tier4Cap: 10000000,
  tier4Rate: 2.25,
  tier5Cap: 50000000,
  tier5Rate: 2,
  tier6Cap: 100000000,
  tier6Rate: 2.25,
};

export const fieldDefaults = { ...DEFAULT_STATE };

export function formatCurrency(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(safeValue));

  return safeValue < 0 ? `(${formatted})` : formatted;
}

export function formatPercent(value: number, digits = 2) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const formatted = `${Math.abs(safeValue).toFixed(digits)}%`;
  return safeValue < 0 ? `(${formatted})` : formatted;
}

export function formatNumber(value: number, digits = 0) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(safeValue);
}

function pmt(rateMonthly: number, months: number, presentValue: number) {
  if (!rateMonthly) return presentValue / months;
  const pow = Math.pow(1 + rateMonthly, months);
  return (presentValue * rateMonthly * pow) / (pow - 1);
}

export function titleTiers(price: number, state: LoanState) {
  const caps = [
    state.tier1Cap,
    state.tier2Cap,
    state.tier3Cap,
    state.tier4Cap,
    state.tier5Cap,
    state.tier6Cap,
  ];
  const rates = [
    state.tier1Rate,
    state.tier2Rate,
    state.tier3Rate,
    state.tier4Rate,
    state.tier5Rate,
    state.tier6Rate,
  ];
  const contributions: number[] = [];
  let previousCap = 0;

  caps.forEach((cap, index) => {
    const rate = rates[index];
    let value: number;

    if (index === 0) {
      if (price < state.lowThreshold) value = state.lowFlatFee;
      else if (cap > price) value = (price * rate) / 1000;
      else value = (cap * rate) / 1000;
    } else if (cap > price) {
      value = ((price - previousCap) * rate) / 1000;
    } else {
      value = ((cap - previousCap) * rate) / 1000;
    }

    contributions.push(value);
    previousCap = cap;
  });

  const premium = contributions.filter((value) => value > 0).reduce((sum, value) => sum + value, 0);

  return { contributions, premium };
}

export function calculateLoanEstimate(state: LoanState): LoanResults {
  const purchasePrice = state.purchasePrice;
  const downPaymentPct = state.downPaymentPct;
  const downPayment = purchasePrice * (downPaymentPct / 100);
  const loanAmount = purchasePrice - downPayment;
  const ltv = purchasePrice ? (loanAmount / purchasePrice) * 100 : 0;

  const loanOrigination =
    state.originationMode === "flat" ? state.originationFlatFee : loanAmount * (state.originationPct / 100);
  const brokerFee =
    state.brokerFeeMode === "flat" ? state.brokerFeeFlatFee : loanAmount * (state.brokerFeePct / 100);
  const interestPerDiem = ((loanAmount * (state.rate / 100)) / 365) * state.interestDays;
  const tiers = titleTiers(purchasePrice, state);
  const titlePremium = tiers.premium;
  const titlePremiumPlus100 = titlePremium + 100;
  const suggestedEndorsements = titlePremiumPlus100 * 0.1 + 180;

  const fixedLoanCosts =
    loanOrigination +
    brokerFee +
    state.appraisalFee +
    state.applicationFee +
    state.underwritingFee +
    state.processingFee +
    state.adminFee;

  const fixedTitleCosts =
    state.settlementFee +
    state.titleSearchFee +
    state.miscTitleFee +
    state.titleInsuranceFee +
    state.endorsements +
    state.recordingFees +
    state.cityTaxStamps +
    state.stateTaxStamps +
    state.stampsOnDeed +
    state.surveyFee +
    state.transamericaFee +
    state.floodZoneCertFee +
    state.miscFilingFee;

  const totalClosingCosts = fixedLoanCosts + fixedTitleCosts;
  const monthlyPropertyTax = (purchasePrice * (state.propertyTaxRatePct / 100)) / 12;
  const taxesEscrow = monthlyPropertyTax * state.taxMonths;
  const developFeeContract = state.developFee === "Yes" ? purchasePrice * (state.developFeeContractPct / 100) : 0;
  const capitalContribution = state.newOrUsed === "New" ? state.hoaMonthly * 2 : 0;
  const floodHO6Escrow = state.floodHO6Annual;
  const totalPrepaid =
    taxesEscrow +
    state.hazardInsEscrow +
    developFeeContract +
    capitalContribution +
    floodHO6Escrow +
    interestPerDiem;
  const otherPrepaid = totalPrepaid - developFeeContract - capitalContribution;
  const totalClosingAndPrepaid = totalClosingCosts + totalPrepaid;
  const totalCashToClose =
    downPayment +
    totalClosingAndPrepaid -
    state.downPaymentGivenToSeller -
    state.sellerCredit -
    state.otherCredits;

  const rateMonthly = state.rate / 100 / 12;
  const termYears = state.program === "15 YR FIXED" ? 15 : 30;
  const isInterestOnly = state.program === "IO";
  const months = termYears * 12;
  const principalInterest = isInterestOnly ? (state.rate / 100 / 12) * loanAmount : pmt(rateMonthly, months, loanAmount);
  const monthlyHazard = state.hazardInsAnnual / 12;
  const monthlyFlood = state.floodHO6Annual / 12;
  const monthlyHOA = state.hoaMonthly;
  const totalMonthlyPayment = principalInterest + monthlyPropertyTax + monthlyHazard + monthlyFlood + monthlyHOA;
  const reserves = totalMonthlyPayment * state.reserveMonths;
  const totalAssetsRequired = totalCashToClose + reserves;

  return {
    purchasePrice,
    downPaymentPct,
    downPayment,
    loanAmount,
    ltv,
    loanOrigination,
    brokerFee,
    appraisalFee: state.appraisalFee,
    applicationFee: state.applicationFee,
    underwritingFee: state.underwritingFee,
    processingFee: state.processingFee,
    adminFee: state.adminFee,
    interestPerDiem,
    settlementFee: state.settlementFee,
    titleSearchFee: state.titleSearchFee,
    miscTitleFee: state.miscTitleFee,
    titleInsuranceFee: state.titleInsuranceFee,
    tierContrib: tiers.contributions,
    titlePremium,
    titlePremiumPlus100,
    suggestedEndorsements,
    endorsements: state.endorsements,
    recordingFees: state.recordingFees,
    cityTaxStamps: state.cityTaxStamps,
    stateTaxStamps: state.stateTaxStamps,
    stampsOnDeed: state.stampsOnDeed,
    surveyFee: state.surveyFee,
    transamericaFee: state.transamericaFee,
    floodZoneCertFee: state.floodZoneCertFee,
    miscFilingFee: state.miscFilingFee,
    fixedLoanCosts,
    fixedTitleCosts,
    totalClosingCosts,
    monthlyPropertyTax,
    taxesEscrow,
    hazardInsEscrow: state.hazardInsEscrow,
    developFeeContract,
    capitalContribution,
    floodHO6Escrow,
    totalPrepaid,
    otherPrepaid,
    totalClosingAndPrepaid,
    sellerCredit: state.sellerCredit,
    otherCredits: state.otherCredits,
    downPaymentGivenToSeller: state.downPaymentGivenToSeller,
    totalCashToClose,
    principalInterest,
    monthlyHazard,
    monthlyFlood,
    monthlyHOA,
    totalMonthlyPayment,
    reserveMonths: state.reserveMonths,
    reserves,
    totalAssetsRequired,
    hoaOrHazardLabel: state.sfrOrCondo === "condo" ? "HOA" : "Hazard Ins.",
    hoaOrHazardValue: state.sfrOrCondo === "condo" ? monthlyHOA : monthlyHazard,
  };
}
