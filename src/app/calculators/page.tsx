import { MortgageCalculators } from "@/app/calculators/mortgage-calculators";

export default function CalculatorsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <div className="border-b border-mafi-border pb-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-mafi-blue-primary">
          Reference Tools
        </p>
        <h1 className="mt-1.5 text-3xl font-bold text-mafi-text-dark">
          Mortgage Calculators
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-mafi-text-mid">
          Choose a calculator to estimate payments, affordability, refinancing
          scenarios, and other key mortgage metrics.
        </p>
      </div>

      <MortgageCalculators />

      <p className="border-t border-mafi-border pt-4 text-xs leading-5 text-mafi-text-light">
        Calculator results are general estimates only and are not an offer of
        credit. Actual rates, terms, and payments are subject to underwriting.
      </p>
    </main>
  );
}
