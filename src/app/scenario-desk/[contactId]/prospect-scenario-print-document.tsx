import Image from "next/image";
import type { ScenarioLoanTerm } from "@prisma/client";
import {
  formatCurrencyDisplay,
  formatCurrencyDisplayWithCents,
  formatInterestRateDisplay,
  formatRatioPercentDisplay,
} from "@/lib/currency";
import { getLoanTermMetadata } from "@/lib/mortgage/scenario-calculations";

export type ProspectPrintScenario = {
  escrowed: boolean;
  interestRate: number;
  lenderAndProduct: string;
  loanTerm: ScenarioLoanTerm;
  mortgageInsurance: boolean;
  pitia: number;
  principalAndInterest: number;
  scenarioNumber: number;
};

export type ProspectScenarioPrintContext = {
  annualInsurance: number | null;
  annualPropertyTaxes: number | null;
  datePrepared: string;
  hoaMonthly: number | null;
  impliedPositionAmount: number | null;
  impliedPositionLabel: "Implied Down Payment" | "Implied Equity Position";
  impliedPositionPercent: number | null;
  loanAmount: number | null;
  loanPurpose: string;
  preparedBy: string | null;
  propertyAddress: string | null;
  propertyValue: number | null;
  prospectName: string;
  statedLtv: number | null;
};

type ProspectScenarioPrintDocumentProps = ProspectScenarioPrintContext & {
  documentState: "draft" | "finalized";
  scenarios: ProspectPrintScenario[];
  selectedScenarioNumber: number | null;
};

const disclaimer =
  "Figures are estimates based on current assumptions. Actual terms, costs, taxes, insurance, and payments may change. This document is not the official Loan Estimate and is not a commitment to lend.";

function hasValue(value: number | null) {
  return value !== null && Number.isFinite(value);
}

function money(value: number | null, withCents = false) {
  if (!hasValue(value)) {
    return "Not yet estimated";
  }

  return withCents
    ? formatCurrencyDisplayWithCents(value)
    : formatCurrencyDisplay(value);
}

export function ProspectScenarioPrintDocument({
  annualInsurance,
  annualPropertyTaxes,
  datePrepared,
  documentState,
  hoaMonthly,
  impliedPositionAmount,
  impliedPositionLabel,
  impliedPositionPercent,
  loanAmount,
  loanPurpose,
  preparedBy,
  propertyAddress,
  propertyValue,
  prospectName,
  scenarios,
  selectedScenarioNumber,
  statedLtv,
}: ProspectScenarioPrintDocumentProps) {
  const realScenarios = scenarios
    .filter((scenario) => scenario.lenderAndProduct.trim())
    .sort((a, b) => a.scenarioNumber - b.scenarioNumber);
  const selectedScenario = realScenarios.find(
    (scenario) => scenario.scenarioNumber === selectedScenarioNumber,
  );
  const monthlyTaxes = hasValue(annualPropertyTaxes)
    ? (annualPropertyTaxes as number) / 12
    : null;
  const monthlyInsurance = hasValue(annualInsurance)
    ? (annualInsurance as number) / 12
    : null;
  const roundedPaymentComponents = selectedScenario
    ? Math.round(selectedScenario.principalAndInterest * 100) / 100 +
      Math.round((monthlyTaxes ?? 0) * 100) / 100 +
      Math.round((monthlyInsurance ?? 0) * 100) / 100 +
      Math.round((hoaMonthly ?? 0) * 100) / 100
    : 0;
  const paymentRoundingAdjustment = selectedScenario
    ? Math.round((selectedScenario.pitia - roundedPaymentComponents) * 100) / 100
    : 0;
  const showPaymentRoundingAdjustment =
    Math.abs(paymentRoundingAdjustment) >= 0.01 &&
    Math.abs(paymentRoundingAdjustment) <= 0.02;

  return (
    <article
      aria-hidden="true"
      className="prospect-scenario-print-document"
      data-document-state={documentState}
    >
      <header className="prospect-print-header">
        <div>
          <Image
            alt="MLG Home Financial"
            className="prospect-print-logo"
            height={52}
            priority
            src="/brand/mafi-workstation-logotype.png"
            width={210}
          />
          <p className="prospect-print-eyebrow">
            {documentState === "finalized"
              ? "Finalized scenario summary"
              : "Draft scenario comparison"}
          </p>
          <h1>Mortgage Scenario Comparison</h1>
        </div>
        <dl className="prospect-print-prepared">
          <div>
            <dt>Date prepared</dt>
            <dd>{datePrepared}</dd>
          </div>
          {preparedBy ? (
            <div>
              <dt>Prepared by</dt>
              <dd>{preparedBy}</dd>
            </div>
          ) : null}
        </dl>
      </header>

      <section className="prospect-print-intro" aria-labelledby="prospect-print-for">
        <p className="prospect-print-section-label" id="prospect-print-for">
          Prepared for
        </p>
        <h2>{prospectName}</h2>
        <p>{propertyAddress || "Property address to be determined"}</p>
        <p>{loanPurpose}</p>
      </section>

      <section className="prospect-print-section" aria-labelledby="loan-assumptions">
        <div className="prospect-print-section-heading">
          <p className="prospect-print-section-number">01</p>
          <div>
            <h2 id="loan-assumptions">Core Loan Assumptions</h2>
            <p>The starting figures used to compare these financing options.</p>
          </div>
        </div>
        <dl className="prospect-print-assumptions">
          <PrintMetric label="Property value" value={money(propertyValue)} />
          <PrintMetric label="Loan amount" value={money(loanAmount)} />
          <PrintMetric
            label="Loan-to-value (LTV)"
            value={hasValue(statedLtv) ? formatRatioPercentDisplay(statedLtv) : "Not provided"}
          />
          <PrintMetric
            label={impliedPositionLabel}
            value={
              hasValue(impliedPositionAmount) && hasValue(impliedPositionPercent)
                ? `${money(impliedPositionAmount)} (${formatRatioPercentDisplay(impliedPositionPercent)})`
                : "Not available"
            }
          />
        </dl>
      </section>

      <section className="prospect-print-section prospect-print-selected" aria-labelledby="selected-option">
        <div className="prospect-print-section-heading">
          <p className="prospect-print-section-number">02</p>
          <div>
            <h2 id="selected-option">Selected Financing Scenario</h2>
            <p>
              {selectedScenario
                ? "The option selected by your Loan Originator for the next step."
                : "No financing scenario has been selected yet."}
            </p>
          </div>
        </div>

        {selectedScenario ? (
          <>
            <div className="prospect-print-recommendation">
              <div className="prospect-print-selected-label">
                Selected scenario {selectedScenario.scenarioNumber}
              </div>
              <h3>{selectedScenario.lenderAndProduct}</h3>
              <dl className="prospect-print-selected-terms">
                <PrintMetric
                  label="Interest rate"
                  value={formatInterestRateDisplay(selectedScenario.interestRate)}
                />
                <PrintMetric
                  label="Loan term"
                  value={getLoanTermMetadata(selectedScenario.loanTerm).label}
                />
                <PrintMetric label="Escrowed" value={selectedScenario.escrowed ? "Yes" : "No"} />
                <PrintMetric
                  label="Mortgage insurance"
                  value={selectedScenario.mortgageInsurance ? "Yes" : "No"}
                />
              </dl>
            </div>

            <div className="prospect-print-payment">
              <div className="prospect-print-payment-heading">
                <div>
                  <p className="prospect-print-section-label">Estimated monthly payment</p>
                  <h3>How the total is constructed</h3>
                </div>
                <p className="prospect-print-payment-total">
                  <span>Estimated PITIA</span>
                  <strong>{money(selectedScenario.pitia, true)}</strong>
                </p>
              </div>
              <dl className="prospect-print-payment-lines">
                <PaymentLine
                  label="Principal & Interest"
                  value={money(selectedScenario.principalAndInterest, true)}
                />
                <PaymentLine label="Estimated property taxes" value={money(monthlyTaxes, true)} />
                <PaymentLine
                  label="Estimated homeowners insurance"
                  value={money(monthlyInsurance, true)}
                />
                <PaymentLine label="HOA" value={money(hoaMonthly, true)} />
                {showPaymentRoundingAdjustment ? (
                  <PaymentLine
                    label="Rounding adjustment"
                    value={money(paymentRoundingAdjustment, true)}
                  />
                ) : null}
                <PaymentLine emphasis label="Estimated PITIA" value={money(selectedScenario.pitia, true)} />
              </dl>
              {annualInsurance === null ? (
                <p className="prospect-print-notice">
                  Homeowners insurance has not yet been estimated and is not included in the total shown.
                </p>
              ) : null}
              {selectedScenario.mortgageInsurance ? (
                <p className="prospect-print-footnote">
                  Mortgage insurance is indicated as applicable, but no monthly mortgage-insurance amount is included in this worksheet.
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <div className="prospect-print-empty">
            This draft contains financing options, but a recommended scenario has not been selected.
          </div>
        )}
      </section>

      {realScenarios.length >= 2 ? (
        <section className="prospect-print-section" aria-labelledby="option-comparison">
          <div className="prospect-print-section-heading">
            <p className="prospect-print-section-number">03</p>
            <div>
              <h2 id="option-comparison">Compare Your Options</h2>
              <p>A side-by-side view of the scenarios prepared for you.</p>
            </div>
          </div>
          <div className="prospect-print-comparison">
            {realScenarios.map((scenario) => {
              const isSelected = scenario.scenarioNumber === selectedScenarioNumber;

              return (
                <section
                  className={`prospect-print-option${isSelected ? " is-selected" : ""}`}
                  key={scenario.scenarioNumber}
                >
                  <div className="prospect-print-option-heading">
                    <div>
                      <p>Scenario {scenario.scenarioNumber}</p>
                      <h3>{scenario.lenderAndProduct}</h3>
                    </div>
                    {isSelected ? <span>Selected</span> : null}
                  </div>
                  <dl>
                    <ComparisonLine label="Interest rate" value={formatInterestRateDisplay(scenario.interestRate)} />
                    <ComparisonLine label="Loan term" value={getLoanTermMetadata(scenario.loanTerm).label} />
                    <ComparisonLine label="Principal & Interest" value={money(scenario.principalAndInterest, true)} />
                    <ComparisonLine label="Estimated PITIA" value={money(scenario.pitia, true)} emphasis />
                    <ComparisonLine label="Escrowed" value={scenario.escrowed ? "Yes" : "No"} />
                    <ComparisonLine label="Mortgage insurance" value={scenario.mortgageInsurance ? "Yes" : "No"} />
                  </dl>
                </section>
              );
            })}
          </div>
        </section>
      ) : null}

      <footer className="prospect-print-footer">
        <p>{disclaimer}</p>
        <p className="prospect-print-footer-brand">MLG Home Financial | MAFI Workstation</p>
      </footer>
    </article>
  );
}

function PrintMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PaymentLine({
  emphasis = false,
  label,
  value,
}: {
  emphasis?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className={emphasis ? "is-total" : ""}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ComparisonLine({
  emphasis = false,
  label,
  value,
}: {
  emphasis?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className={emphasis ? "is-emphasis" : ""}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
