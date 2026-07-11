import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  ChartNoAxesColumnIncreasing,
  House,
  Landmark,
  RefreshCw,
  Scale,
} from "lucide-react";

type CalculatorOption = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  iconStyle: string;
  href?: string;
};

const calculatorOptions: CalculatorOption[] = [
  {
    title: "Payment Calculator",
    description: "Estimate principal, interest, taxes, insurance, and monthly housing costs.",
    icon: Calculator,
    accent: "group-hover:border-t-mafi-blue-primary",
    iconStyle: "bg-blue-50 text-mafi-blue-primary ring-blue-100",
    href: "/calculators/payment",
  },
  {
    title: "Refinance Calculator",
    description: "Compare current loan terms with a potential refinance scenario.",
    icon: RefreshCw,
    accent: "group-hover:border-t-teal-700",
    iconStyle: "bg-teal-50 text-teal-700 ring-teal-100",
    href: "/calculators/refinance",
  },
  {
    title: "How Much Can I Afford?",
    description: "Explore a practical purchase range based on income, debts, and funds.",
    icon: House,
    accent: "group-hover:border-t-mafi-gold-dark",
    iconStyle: "bg-amber-50 text-mafi-gold-dark ring-amber-100",
  },
  {
    title: "Rent Or Buy?",
    description: "Compare the longer-term financial impact of renting versus buying.",
    icon: Scale,
    accent: "group-hover:border-t-slate-600",
    iconStyle: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  {
    title: "Amortization Calculator",
    description: "Review how principal, interest, and loan balance change over time.",
    icon: ChartNoAxesColumnIncreasing,
    accent: "group-hover:border-t-cyan-700",
    iconStyle: "bg-cyan-50 text-cyan-800 ring-cyan-100",
  },
  {
    title: "Debt-To-Income Calculator",
    description: "Estimate front-end and back-end ratios from income and obligations.",
    icon: Landmark,
    accent: "group-hover:border-t-emerald-700",
    iconStyle: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
];

export function MortgageCalculators() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {calculatorOptions.map((calculator) => (
        <CalculatorTile calculator={calculator} key={calculator.title} />
      ))}
    </div>
  );
}

function CalculatorTile({ calculator }: { calculator: CalculatorOption }) {
  const Icon = calculator.icon;
  const content = (
    <>
      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-md ring-1 transition duration-200 group-hover:-translate-y-0.5 group-hover:scale-105 ${calculator.iconStyle}`}><Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} /></span>
      <span className="mt-5 block text-lg font-bold text-mafi-text-dark transition-colors group-hover:text-mafi-blue-primary">{calculator.title}</span>
      <span className="mt-2 block text-sm leading-6 text-mafi-text-mid">{calculator.description}</span>
      <span className="mt-auto flex items-center justify-between pt-5 text-xs font-bold uppercase tracking-[0.12em] text-mafi-blue-primary">Open calculator<ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" /></span>
    </>
  );
  const className = `group relative flex min-h-52 w-full flex-col overflow-hidden rounded-md border border-mafi-border border-t-2 border-t-transparent bg-white p-5 text-left shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:border-mafi-blue-primary/30 hover:shadow-[0_14px_34px_rgba(16,45,75,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mafi-blue-primary focus-visible:ring-offset-2 ${calculator.accent}`;

  return calculator.href ? (
    <Link aria-label={`Open ${calculator.title}`} className={className} href={calculator.href}>{content}</Link>
  ) : (
    <button
      aria-label={`${calculator.title}. Calculator coming soon.`}
      className={className}
      title="Calculator coming soon"
      type="button"
    >
      {content}
    </button>
  );
}
