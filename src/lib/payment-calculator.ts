export type PaymentCalculatorInput = {
  homePrice: number;
  downPayment: number;
  termYears: number;
  interestRate: number;
  annualPropertyTaxes: number;
  monthlyHoa: number;
  monthlyHomeownersInsurance: number;
  monthlyMortgageInsurance: number;
  otherMonthlyCosts: number;
};

export type AnnualAmortizationRow = {
  year: number;
  beginningBalance: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
};

export type PaymentCalculationResult = {
  loanAmount: number;
  principalAndInterest: number;
  monthlyPropertyTaxes: number;
  totalMonthlyPayment: number;
  recommendedAnnualIncome: number;
  minimumDownPayment: number;
  estimatedClosingCosts: number;
  recommendedSavings: number;
  amortization: AnnualAmortizationRow[];
};

export const paymentCalculatorDefaults: PaymentCalculatorInput = {
  homePrice: 200_000,
  downPayment: 40_000,
  termYears: 30,
  interestRate: 6,
  annualPropertyTaxes: 2_400,
  monthlyHoa: 200,
  monthlyHomeownersInsurance: 300,
  monthlyMortgageInsurance: 0,
  otherMonthlyCosts: 0,
};

function safeNumber(value: number) {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(safeNumber(value), minimum), maximum);
}

export function syncDownPaymentFromAmount(homePrice: number, amount: number) {
  const price = safeNumber(homePrice);
  const downPayment = clamp(amount, 0, price);
  return {
    amount: downPayment,
    percentage: price ? (downPayment / price) * 100 : 0,
  };
}

export function syncDownPaymentFromPercentage(homePrice: number, percentage: number) {
  const price = safeNumber(homePrice);
  const percent = clamp(percentage, 0, 100);
  return { amount: price * (percent / 100), percentage: percent };
}

export function syncAnnualAmountFromPercentage(base: number, percentage: number) {
  const safeBase = safeNumber(base);
  const percent = safeNumber(percentage);
  return { amount: safeBase * (percent / 100), percentage: percent };
}

export function syncAnnualPercentageFromAmount(base: number, amount: number) {
  const safeBase = safeNumber(base);
  const safeAmount = safeNumber(amount);
  return {
    amount: safeAmount,
    percentage: safeBase ? (safeAmount / safeBase) * 100 : 0,
  };
}

export function syncMonthlyAmountFromAnnualPercentage(base: number, percentage: number) {
  const annual = syncAnnualAmountFromPercentage(base, percentage);
  return { amount: annual.amount / 12, percentage: annual.percentage };
}

export function syncAnnualPercentageFromMonthlyAmount(base: number, monthlyAmount: number) {
  const safeMonthlyAmount = safeNumber(monthlyAmount);
  return {
    amount: safeMonthlyAmount,
    percentage: safeNumber(base) ? ((safeMonthlyAmount * 12) / safeNumber(base)) * 100 : 0,
  };
}

export function calculateMonthlyPrincipalAndInterest(
  loanAmount: number,
  annualInterestRate: number,
  termYears: number,
) {
  return calculateMonthlyPaymentByMonths(
    loanAmount,
    annualInterestRate,
    Math.round(safeNumber(termYears) * 12),
  );
}

export function calculateMonthlyPaymentByMonths(
  loanAmount: number,
  annualInterestRate: number,
  termMonths: number,
) {
  const principal = safeNumber(loanAmount);
  const payments = Math.round(safeNumber(termMonths));
  if (!principal || !payments) return 0;

  const monthlyRate = safeNumber(annualInterestRate) / 100 / 12;
  if (!monthlyRate) return principal / payments;

  const growth = (1 + monthlyRate) ** payments;
  const payment = principal * ((monthlyRate * growth) / (growth - 1));
  return Number.isFinite(payment) ? payment : 0;
}

export function validatePaymentCalculatorInput(input: PaymentCalculatorInput) {
  const errors: string[] = [];
  if (!Number.isFinite(input.homePrice) || input.homePrice <= 0) {
    errors.push("Enter a home price greater than zero.");
  }
  if (!Number.isFinite(input.downPayment) || input.downPayment < 0) {
    errors.push("Down payment cannot be negative.");
  } else if (input.downPayment > input.homePrice) {
    errors.push("Down payment cannot exceed the home price.");
  }
  if (!Number.isFinite(input.interestRate) || input.interestRate < 0) {
    errors.push("Interest rate cannot be negative.");
  }
  if (!Number.isFinite(input.termYears) || input.termYears <= 0) {
    errors.push("Select a valid loan term.");
  }
  const optionalAmounts = [
    input.annualPropertyTaxes,
    input.monthlyHoa,
    input.monthlyHomeownersInsurance,
    input.monthlyMortgageInsurance,
    input.otherMonthlyCosts,
  ];
  if (optionalAmounts.some((value) => !Number.isFinite(value) || value < 0)) {
    errors.push("Taxes, insurance, HOA, and other monthly costs cannot be negative.");
  }
  return errors;
}

export function calculatePaymentScenario(input: PaymentCalculatorInput): {
  errors: string[];
  result: PaymentCalculationResult | null;
} {
  const errors = validatePaymentCalculatorInput(input);
  if (errors.length) return { errors, result: null };

  const loanAmount = Math.max(input.homePrice - input.downPayment, 0);
  const principalAndInterest = calculateMonthlyPrincipalAndInterest(
    loanAmount,
    input.interestRate,
    input.termYears,
  );
  const monthlyPropertyTaxes = input.annualPropertyTaxes / 12;
  const totalMonthlyPayment =
    principalAndInterest +
    monthlyPropertyTaxes +
    input.monthlyHomeownersInsurance +
    input.monthlyHoa +
    input.monthlyMortgageInsurance +
    input.otherMonthlyCosts;
  const recommendedAnnualIncome = (totalMonthlyPayment * 12) / 0.38;
  const minimumDownPayment = input.homePrice * 0.05;
  const estimatedClosingCosts = input.homePrice * 0.019;
  const recommendedSavings = minimumDownPayment + estimatedClosingCosts;
  const amortization = buildAnnualAmortizationSchedule(
    loanAmount,
    input.interestRate,
    input.termYears * 12,
    principalAndInterest,
  );

  return {
    errors: [],
    result: {
      loanAmount,
      principalAndInterest,
      monthlyPropertyTaxes,
      totalMonthlyPayment,
      recommendedAnnualIncome,
      minimumDownPayment,
      estimatedClosingCosts,
      recommendedSavings,
      amortization,
    },
  };
}

export function buildAnnualAmortizationSchedule(
  loanAmount: number,
  annualInterestRate: number,
  termMonths: number,
  monthlyPayment: number,
): AnnualAmortizationRow[] {
  const totalPayments = Math.round(termMonths);
  if (!loanAmount || !totalPayments) return [];

  const monthlyRate = annualInterestRate / 100 / 12;
  let balance = loanAmount;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  const rows: AnnualAmortizationRow[] = [];

  for (let paymentNumber = 1; paymentNumber <= totalPayments; paymentNumber += 1) {
    const beginningMonthBalance = balance;
    const interestPaid = monthlyRate ? beginningMonthBalance * monthlyRate : 0;
    const principalPaid = Math.min(Math.max(monthlyPayment - interestPaid, 0), balance);
    balance = Math.max(balance - principalPaid, 0);
    cumulativePrincipal += principalPaid;
    cumulativeInterest += interestPaid;

    const isYearEnd = paymentNumber % 12 === 0 || paymentNumber === totalPayments;
    if (isYearEnd) {
      const prior = rows.at(-1);
      rows.push({
        year: Math.ceil(paymentNumber / 12),
        beginningBalance: prior?.endingBalance ?? loanAmount,
        principalPaid: cumulativePrincipal - (prior?.cumulativePrincipal ?? 0),
        interestPaid: cumulativeInterest - (prior?.cumulativeInterest ?? 0),
        endingBalance: balance < 0.005 ? 0 : balance,
        cumulativePrincipal,
        cumulativeInterest,
      });
    }
  }

  return rows;
}
