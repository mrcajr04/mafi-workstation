export type LoanEstimateState = {
  adminFee: string;
  appraisalFee: string;
  applicationFee: string;
  applicantName: string;
  brokerFeeFlatFee: string;
  brokerFeeMode: "flat" | "percent";
  brokerFeePct: string;
  cellPhone: string;
  cityTaxStamps: string;
  developFee: "No" | "Yes";
  developFeeContractPct: string;
  downPaymentGivenToSeller: string;
  downPaymentPct: string;
  email: string;
  endorsements: string;
  floodHO6Annual: string;
  floodZoneCertFee: string;
  foreignOrDomestic: "D" | "F";
  hazardInsAnnual: string;
  hazardInsEscrow: string;
  hoaMonthly: string;
  interestDays: string;
  loanNumber: string;
  lowFlatFee: string;
  lowThreshold: string;
  miscFilingFee: string;
  miscTitleFee: string;
  newOrUsed: "New" | "Used";
  occupancy: string;
  officePhone: string;
  originationFlatFee: string;
  originationMode: "flat" | "percent";
  originationPct: string;
  otherCredits: string;
  presentedBy: string;
  processingFee: string;
  program: string;
  propertyTaxRatePct: string;
  propertyType: string;
  purchasePrice: string;
  rate: string;
  recordingFees: string;
  reserveMonths: string;
  sellerCredit: string;
  settlementFee: string;
  sfrOrCondo: "condo" | "sfr";
  stampsOnDeed: string;
  stateTaxStamps: string;
  surveyFee: string;
  taxMonths: string;
  tier1Cap: string;
  tier1Rate: string;
  tier2Cap: string;
  tier2Rate: string;
  tier3Cap: string;
  tier3Rate: string;
  tier4Cap: string;
  tier4Rate: string;
  tier5Cap: string;
  tier5Rate: string;
  tier6Cap: string;
  tier6Rate: string;
  titleInsuranceFee: string;
  titleSearchFee: string;
  transamericaFee: string;
  underwritingFee: string;
};

export type LoanEstimateResult = {
  adminFee: number;
  appraisalFee: number;
  applicationFee: number;
  brokerFee: number;
  capitalContribution: number;
  cityTaxStamps: number;
  developFeeContract: number;
  downPayment: number;
  downPaymentPct: number;
  downPaymentGivenToSeller: number;
  endorsements: number;
  fixedLoanCosts: number;
  fixedTitleCosts: number;
  floodHO6Escrow: number;
  floodZoneCertFee: number;
  hazardInsEscrow: number;
  hoaOrHazardLabel: string;
  hoaOrHazardValue: number;
  interestPerDiem: number;
  loanAmount: number;
  loanOrigination: number;
  ltv: number;
  miscFilingFee: number;
  miscTitleFee: number;
  monthlyFlood: number;
  monthlyHazard: number;
  monthlyHOA: number;
  monthlyPropertyTax: number;
  otherCredits: number;
  otherPrepaid: number;
  principalInterest: number;
  processingFee: number;
  purchasePrice: number;
  recordingFees: number;
  reserveMonths: number;
  reserves: number;
  sellerCredit: number;
  settlementFee: number;
  stampsOnDeed: number;
  stateTaxStamps: number;
  suggestedEndorsements: number;
  surveyFee: number;
  taxesEscrow: number;
  tierContrib: number[];
  titleInsuranceFee: number;
  titlePremium: number;
  titlePremiumPlus100: number;
  titleSearchFee: number;
  totalAssetsRequired: number;
  totalCashToClose: number;
  totalClosingAndPrepaid: number;
  totalClosingCosts: number;
  totalMonthlyPayment: number;
  totalPrepaid: number;
  transamericaFee: number;
  underwritingFee: number;
};

export const loanEstimateDefaults: LoanEstimateState = {
  adminFee: "750",
  appraisalFee: "750",
  applicationFee: "250",
  applicantName: "Unit # 301",
  brokerFeeFlatFee: "4130",
  brokerFeeMode: "percent",
  brokerFeePct: "1",
  cellPhone: "+1.786.457.6156",
  cityTaxStamps: "1445.50",
  developFee: "Yes",
  developFeeContractPct: "1.75",
  downPaymentGivenToSeller: "177000",
  downPaymentPct: "30",
  email: "miguelc@mlghomefinancial.com",
  endorsements: "492.50",
  floodHO6Annual: "1100",
  floodZoneCertFee: "20",
  foreignOrDomestic: "F",
  hazardInsAnnual: "0",
  hazardInsEscrow: "0",
  hoaMonthly: "800",
  interestDays: "1",
  loanNumber: "369001",
  lowFlatFee: "100",
  lowThreshold: "17392",
  miscFilingFee: "580",
  miscTitleFee: "550",
  newOrUsed: "New",
  occupancy: "INVESTMENT",
  officePhone: "786.689.2939",
  originationFlatFee: "4130",
  originationMode: "percent",
  originationPct: "1",
  otherCredits: "0",
  presentedBy: "Miguel Cardozo",
  processingFee: "950",
  program: "30 YR FIXED",
  propertyTaxRatePct: "1.8",
  propertyType: "CONDO",
  purchasePrice: "590000",
  rate: "7.25",
  recordingFees: "285",
  reserveMonths: "6",
  sellerCredit: "0",
  settlementFee: "1250",
  sfrOrCondo: "condo",
  stampsOnDeed: "0",
  stateTaxStamps: "826",
  surveyFee: "0",
  taxMonths: "4",
  tier1Cap: "100000",
  tier1Rate: "5.75",
  tier2Cap: "1000000",
  tier2Rate: "5",
  tier3Cap: "5000000",
  tier3Rate: "2.5",
  tier4Cap: "10000000",
  tier4Rate: "2.25",
  tier5Cap: "50000000",
  tier5Rate: "2",
  tier6Cap: "100000000",
  tier6Rate: "2.25",
  titleInsuranceFee: "250",
  titleSearchFee: "250",
  transamericaFee: "108",
  underwritingFee: "1500",
};

const usd = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

export function formatLoanEstimateCurrency(value: number) {
  return usd.format(Number.isFinite(value) ? value : 0);
}

function num(value: string | number | null | undefined) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function pmt(rateMonthly: number, n: number, pv: number) {
  if (n <= 0) {
    return 0;
  }

  if (rateMonthly === 0) {
    return pv / n;
  }

  return (pv * rateMonthly) / (1 - Math.pow(1 + rateMonthly, -n));
}

function titleTiers(price: number, state: LoanEstimateState) {
  const caps = [
    num(state.tier1Cap),
    num(state.tier2Cap),
    num(state.tier3Cap),
    num(state.tier4Cap),
    num(state.tier5Cap),
    num(state.tier6Cap),
  ];
  const rates = [
    num(state.tier1Rate),
    num(state.tier2Rate),
    num(state.tier3Rate),
    num(state.tier4Rate),
    num(state.tier5Rate),
    num(state.tier6Rate),
  ];
  const threshold = num(state.lowThreshold);
  const flat = num(state.lowFlatFee);
  const contributions: number[] = [];
  let prevCap = 0;

  for (let i = 0; i < caps.length; i += 1) {
    const cap = caps[i];
    const rate = rates[i];
    let value: number;

    if (i === 0) {
      if (price < threshold) {
        value = flat;
      } else if (cap > price) {
        value = (price * rate) / 1000;
      } else {
        value = (cap * rate) / 1000;
      }
    } else if (cap > price) {
      value = ((price - prevCap) * rate) / 1000;
    } else {
      value = ((cap - prevCap) * rate) / 1000;
    }

    contributions.push(value);
    prevCap = cap;
  }

  return {
    contributions,
    premium: contributions
      .filter((value) => value > 0)
      .reduce((sum, value) => sum + value, 0),
  };
}

export function calculateLoanEstimate(
  state: LoanEstimateState,
): LoanEstimateResult {
  const result = {} as LoanEstimateResult;

  result.purchasePrice = num(state.purchasePrice);
  result.downPaymentPct = num(state.downPaymentPct);
  result.downPayment = result.purchasePrice * (result.downPaymentPct / 100);
  result.loanAmount = result.purchasePrice - result.downPayment;
  result.ltv = result.purchasePrice
    ? (result.loanAmount / result.purchasePrice) * 100
    : 0;

  result.loanOrigination =
    state.originationMode === "flat"
      ? num(state.originationFlatFee)
      : result.loanAmount * (num(state.originationPct) / 100);
  result.brokerFee =
    state.brokerFeeMode === "flat"
      ? num(state.brokerFeeFlatFee)
      : result.loanAmount * (num(state.brokerFeePct) / 100);
  result.appraisalFee = num(state.appraisalFee);
  result.applicationFee = num(state.applicationFee);
  result.underwritingFee = num(state.underwritingFee);
  result.processingFee = num(state.processingFee);
  result.adminFee = num(state.adminFee);
  result.interestPerDiem =
    ((result.loanAmount * (num(state.rate) / 100)) / 365) *
    num(state.interestDays);

  result.settlementFee = num(state.settlementFee);
  result.titleSearchFee = num(state.titleSearchFee);
  result.miscTitleFee = num(state.miscTitleFee);
  result.titleInsuranceFee = num(state.titleInsuranceFee);

  const tiers = titleTiers(result.purchasePrice, state);
  result.tierContrib = tiers.contributions;
  result.titlePremium = tiers.premium;
  result.titlePremiumPlus100 = result.titlePremium + 100;
  result.suggestedEndorsements = result.titlePremiumPlus100 * 0.1 + 180;
  result.endorsements = num(state.endorsements);

  result.recordingFees = num(state.recordingFees);
  result.cityTaxStamps = num(state.cityTaxStamps);
  result.stateTaxStamps = num(state.stateTaxStamps);
  result.stampsOnDeed = num(state.stampsOnDeed);
  result.surveyFee = num(state.surveyFee);
  result.transamericaFee = num(state.transamericaFee);
  result.floodZoneCertFee = num(state.floodZoneCertFee);
  result.miscFilingFee = num(state.miscFilingFee);

  result.fixedLoanCosts =
    result.loanOrigination +
    result.brokerFee +
    result.appraisalFee +
    result.applicationFee +
    result.underwritingFee +
    result.processingFee +
    result.adminFee;
  result.fixedTitleCosts =
    result.settlementFee +
    result.titleSearchFee +
    result.miscTitleFee +
    result.titleInsuranceFee +
    result.endorsements +
    result.recordingFees +
    result.cityTaxStamps +
    result.stateTaxStamps +
    result.stampsOnDeed +
    result.surveyFee +
    result.transamericaFee +
    result.floodZoneCertFee +
    result.miscFilingFee;
  result.totalClosingCosts = result.fixedLoanCosts + result.fixedTitleCosts;

  result.monthlyPropertyTax =
    (result.purchasePrice * (num(state.propertyTaxRatePct) / 100)) / 12;
  result.taxesEscrow = result.monthlyPropertyTax * num(state.taxMonths);
  result.hazardInsEscrow = num(state.hazardInsEscrow);
  result.developFeeContract =
    state.developFee === "Yes"
      ? result.purchasePrice * (num(state.developFeeContractPct) / 100)
      : 0;
  result.capitalContribution =
    state.newOrUsed === "New" ? num(state.hoaMonthly) * 2 : 0;
  result.floodHO6Escrow = num(state.floodHO6Annual);
  result.totalPrepaid =
    result.taxesEscrow +
    result.hazardInsEscrow +
    result.developFeeContract +
    result.capitalContribution +
    result.floodHO6Escrow +
    result.interestPerDiem;
  result.otherPrepaid =
    result.totalPrepaid -
    result.developFeeContract -
    result.capitalContribution;

  result.totalClosingAndPrepaid =
    result.totalClosingCosts + result.totalPrepaid;

  result.sellerCredit = num(state.sellerCredit);
  result.otherCredits = num(state.otherCredits);
  result.downPaymentGivenToSeller = num(state.downPaymentGivenToSeller);
  result.totalCashToClose =
    result.downPayment +
    result.totalClosingAndPrepaid -
    result.downPaymentGivenToSeller -
    result.sellerCredit -
    result.otherCredits;

  const rateMonthly = num(state.rate) / 100 / 12;
  const termYears = state.program === "15 YR FIXED" ? 15 : 30;
  const isInterestOnly = state.program === "IO";
  const numberOfPayments = termYears * 12;
  result.principalInterest = isInterestOnly
    ? (num(state.rate) / 100 / 12) * result.loanAmount
    : pmt(rateMonthly, numberOfPayments, result.loanAmount);

  result.monthlyHazard = num(state.hazardInsAnnual) / 12;
  result.monthlyFlood = num(state.floodHO6Annual) / 12;
  result.monthlyHOA = num(state.hoaMonthly);
  result.totalMonthlyPayment =
    result.principalInterest +
    result.monthlyPropertyTax +
    result.monthlyHazard +
    result.monthlyFlood +
    result.monthlyHOA;

  result.reserveMonths = num(state.reserveMonths);
  result.reserves = result.totalMonthlyPayment * result.reserveMonths;
  result.totalAssetsRequired = result.totalCashToClose + result.reserves;

  result.hoaOrHazardLabel = state.sfrOrCondo === "condo" ? "HOA" : "Hazard Ins";
  result.hoaOrHazardValue =
    state.sfrOrCondo === "condo" ? result.monthlyHOA : result.monthlyHazard;

  return result;
}
