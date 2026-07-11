import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RefinanceCalculator } from "./refinance-calculator";

export default function RefinanceCalculatorPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-5">
      <header className="border-b border-mafi-border pb-4">
        <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-mafi-text-mid transition hover:text-mafi-blue-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mafi-blue-primary/30" href="/calculators">
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />Back to Mortgage Calculators
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-mafi-text-dark">Refinance Calculator</h1>
        <p className="mt-1.5 max-w-4xl text-sm leading-6 text-mafi-text-mid">Compare the current mortgage with a proposed refinance and estimate monthly savings, break-even timing, and long-term cost differences.</p>
      </header>
      <RefinanceCalculator />
    </main>
  );
}
