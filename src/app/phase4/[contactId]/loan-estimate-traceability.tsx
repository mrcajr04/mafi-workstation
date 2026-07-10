"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Traceability data for the Loan Estimate sidebar panel: everything a reviewer
 * would see on the Opportunity/Scenario Desk detail pages, pre-formatted
 * server-side (mirrors scenario-desk/[contactId]/page.tsx) so this client
 * component stays a pure display layer.
 */
export type LoanEstimateTraceability = {
  contact: {
    name: string;
    phone: string;
    email: string;
    borrowerType: string;
    vesting: string;
    fico: string;
    coBorrowers: string[];
    assets: string[];
    bdrName: string;
  };
  property: {
    address: string;
    propertyType: string;
    taxesLastYear: string;
    taxesPresentYear: string;
    insurance: string;
    insuranceAnnual: string;
    hoaName: string;
    hoaManagement: string;
    hoaFees: string;
  };
  opportunity: {
    propertyValue: string;
    loanAmount: string;
    ltv: string;
    hasRealtor: string;
    status: string;
  };
  scenarios: Array<{
    scenarioNumber: number;
    lenderAndProduct: string;
    interestRate: string;
    loanTerm: string;
    program: string;
    mortgageInsurance: string;
    principalAndInterest: string;
    pitia: string;
    escrowed: string;
    originationPay: string;
    processingFee: string;
    comments: string;
    isSelected: boolean;
  }>;
};

export function TraceabilityTrigger({
  data,
}: {
  data: LoanEstimateTraceability;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const titleId = "loan-estimate-traceability-title";
  const modal =
    typeof document === "undefined"
      ? null
      : createPortal(
          <AnimatePresence>
            {open ? (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-[1px]"
                  aria-hidden="true"
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="pointer-events-none fixed inset-0 z-[81] flex items-center justify-center p-4"
                >
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    className="pointer-events-auto max-h-[min(88vh,780px)] w-full max-w-[960px] overflow-y-auto rounded-md border border-slate-200 bg-white p-6 text-left shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
                  >
                    <TraceabilityContent
                      data={data}
                      onClose={() => setOpen(false)}
                      titleId={titleId}
                    />
                  </div>
                </motion.div>
              </>
            ) : null}
          </AnimatePresence>,
          document.body,
        );

  return (
    <>
      <button
        type="button"
        aria-label="View source data for this loan estimate"
        title="View source data for this loan estimate"
        className="ml-1.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-slate-400 transition hover:text-[var(--le-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(49_95_190_/_0.24)]"
        onClick={() => setOpen(true)}
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {modal}
    </>
  );
}

function TraceabilityContent({
  data,
  onClose,
  titleId,
}: {
  data: LoanEstimateTraceability;
  onClose: () => void;
  titleId: string;
}) {
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Source Data
          </p>
          <h3
            id={titleId}
            className="text-[length:var(--type-lg)] font-black text-[var(--le-navy)]"
          >
            {data.contact.name}
          </h3>
        </div>
        <button
          type="button"
          className="rounded-sm p-1 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-5">
        <section>
          <SectionTitle>Opportunity</SectionTitle>
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Name" value={data.contact.name} />
            <Field label="Phone" value={data.contact.phone} />
            <Field label="Email" value={data.contact.email} />
            <Field label="Borrower Type" value={data.contact.borrowerType} />
            <Field label="Vesting" value={data.contact.vesting} />
            <Field label="FICO" value={data.contact.fico} />
            <Field label="BDR" value={data.contact.bdrName} />
            <FieldList label="Co-borrowers" items={data.contact.coBorrowers} />
            <FieldList label="Assets" items={data.contact.assets} />
          </div>
          <div className="mt-4 grid gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Address" value={data.property.address} />
            <Field label="Property Type" value={data.property.propertyType} />
            <Field label="Taxes Last Year" value={data.property.taxesLastYear} />
            <Field
              label="Taxes Present Year"
              value={data.property.taxesPresentYear}
            />
            <Field label="Insurance" value={data.property.insurance} />
            <Field
              label="Estimated Annual Insurance"
              value={data.property.insuranceAnnual}
            />
            <Field label="HOA" value={data.property.hoaName} />
            <Field label="HOA Management" value={data.property.hoaManagement} />
            <Field label="HOA Fees" value={data.property.hoaFees} />
          </div>
          <div className="mt-4 grid gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Property Value" value={data.opportunity.propertyValue} />
            <Field label="Loan Amount" value={data.opportunity.loanAmount} />
            <Field label="LTV" value={data.opportunity.ltv} />
            <Field label="Has Realtor" value={data.opportunity.hasRealtor} />
            <Field label="Status" value={data.opportunity.status} />
          </div>
        </section>

        <section>
          <SectionTitle>Scenario Desk</SectionTitle>
          <div className="grid gap-3 lg:grid-cols-3">
            {data.scenarios.map((scenario) => (
              <div
                key={scenario.scenarioNumber}
                className={`rounded-md border p-3 ${
                  scenario.isSelected
                    ? "border-[var(--le-blue)] bg-[var(--le-navy-soft)]"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Scenario {scenario.scenarioNumber}
                  </p>
                  {scenario.isSelected ? (
                    <span className="rounded-sm bg-[var(--le-blue)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                      Selected
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Field label="Lender & Product" value={scenario.lenderAndProduct} />
                  <Field label="Rate" value={scenario.interestRate} />
                  <Field label="Loan Term" value={scenario.loanTerm} />
                  <Field label="Program" value={scenario.program} />
                  <Field label="P&I" value={scenario.principalAndInterest} />
                  <Field label="PITIA" value={scenario.pitia} />
                  <Field
                    label="Mortgage Insurance"
                    value={scenario.mortgageInsurance}
                  />
                  <Field label="Escrowed" value={scenario.escrowed} />
                  <Field label="Origination Pay" value={scenario.originationPay} />
                  <Field label="Processing Fee" value={scenario.processingFee} />
                  {scenario.comments ? (
                    <Field label="Comments" value={scenario.comments} />
                  ) : null}
                </div>
              </div>
            ))}
            {data.scenarios.length === 0 ? (
              <p className="text-sm text-slate-500">No scenarios recorded.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 text-[11px] font-black uppercase tracking-wider text-[var(--le-navy)]">
      {children}
    </h4>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="truncate text-[length:var(--type-sm)] font-bold text-[var(--le-ink)]" title={value}>
        {value}
      </p>
    </div>
  );
}

function FieldList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      {items.length ? (
        <div className="mt-0.5 space-y-0.5">
          {items.map((item, index) => (
            <p
              key={`${item}-${index}`}
              className="truncate text-[length:var(--type-sm)] font-bold text-[var(--le-ink)]"
            >
              {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-[length:var(--type-sm)] text-slate-400">Not provided</p>
      )}
    </div>
  );
}
