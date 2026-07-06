import { MortgageCalculators } from "@/app/calculators/mortgage-calculators";

export default function CalculatorsPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
          Reference Tools
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
          Mortgage Calculators
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
          Quick estimates for payment, amortization, LTV, and DTI.
        </p>
      </div>

      <div className="rounded-md border border-mafi-gold bg-mafi-gold-light/40 px-4 py-3 text-sm font-medium text-mafi-text-dark">
        These calculators provide general estimates only. Results are not an
        offer of credit. Actual rates, terms, and payments are subject to
        underwriting and may vary.
      </div>

      <MortgageCalculators />
    </main>
  );
}
