import puppeteer from "puppeteer";
import {
  calculateLoanEstimate,
  type LoanEstimateResult,
  type LoanEstimateState,
} from "@/lib/loan-estimate-calc";
import {
  formatCurrencyDisplay,
  formatCurrencyDisplayWithCents,
  formatInterestRateDisplay,
  formatRatioPercentDisplay,
} from "@/lib/currency";

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function wholeCurrency(value: number) {
  return formatCurrencyDisplay(value, "$0");
}

function centsCurrency(value: number) {
  return formatCurrencyDisplayWithCents(value, "$0.00");
}

function summaryRow(label: string, value: string, isTotal = false) {
  return `
    <tr class="${isTotal ? "total-row" : ""}">
      <td>${escapeHtml(label)}</td>
      <td>${escapeHtml(value)}</td>
    </tr>
  `;
}

function section(title: string, rows: string) {
  return `
    <section class="card">
      <h2>${escapeHtml(title)}</h2>
      <table>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function fixedLoanCostRows(result: LoanEstimateResult) {
  return [
    ["Appraisal Fee", result.appraisalFee],
    ["Application Fee", result.applicationFee],
    ["Loan Origination", result.loanOrigination],
    ["Broker Fee", result.brokerFee],
    ["Underwriting Fee", result.underwritingFee],
    ["Processing Fee", result.processingFee],
    ["Admin Fee", result.adminFee],
  ]
    .map(([label, value]) => summaryRow(String(label), wholeCurrency(Number(value))))
    .join("");
}

function fixedTitleCostRows(result: LoanEstimateResult) {
  return [
    ["Settlement Fee", result.settlementFee],
    ["Title Search Fee", result.titleSearchFee],
    ["Misc Title Fee", result.miscTitleFee],
    ["Title Insurance Fee", result.titleInsuranceFee],
    ["Endorsements", result.endorsements],
    ["Recording Fees", result.recordingFees],
    ["City Tax Stamps", result.cityTaxStamps],
    ["State Tax Stamps", result.stateTaxStamps],
    ["Stamps on Deed", result.stampsOnDeed],
    ["Survey Fee", result.surveyFee],
    ["Transamerica Fee", result.transamericaFee],
    ["Flood Zone Cert Fee", result.floodZoneCertFee],
    ["Misc Filing Fee", result.miscFilingFee],
  ]
    .map(([label, value]) => summaryRow(String(label), wholeCurrency(Number(value))))
    .join("");
}

export function loanEstimatePdfHtml(state: LoanEstimateState) {
  const result = calculateLoanEstimate(state);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Loan Estimate Fee Sheet</title>
    <style>
      @page { size: 8.5in 14in; margin: 0.42in; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #08213d;
        font-family: Montserrat, Arial, sans-serif;
        font-size: 11px;
        line-height: 1.35;
      }
      .document {
        width: 100%;
        min-height: 13.1in;
      }
      .header {
        background: #2c5587;
        color: #fff;
        padding: 18px 22px;
        border-radius: 10px;
      }
      .eyebrow {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.2em;
        margin: 0 0 4px;
        text-transform: uppercase;
      }
      h1 {
        font-size: 25px;
        line-height: 1.1;
        margin: 0;
      }
      h2 {
        color: #3676c2;
        font-size: 15px;
        margin: 0 0 9px;
      }
      .meta {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin: 14px 0;
      }
      .meta div,
      .card {
        border: 1px solid #d4e0ef;
        border-radius: 9px;
        padding: 12px;
      }
      .label {
        color: #68788a;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.08em;
        margin: 0 0 4px;
        text-transform: uppercase;
      }
      .value {
        font-size: 13px;
        font-weight: 700;
        margin: 0;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      td {
        border-bottom: 1px solid #e4edf7;
        padding: 5px 0;
        vertical-align: top;
      }
      td:last-child {
        font-weight: 700;
        text-align: right;
      }
      tr:last-child td {
        border-bottom: 0;
      }
      .total-row td {
        background: #eef4fb;
        border-bottom: 0;
        color: #08213d;
        font-weight: 800;
        padding: 7px 6px;
      }
      .signatures {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 28px;
        margin-top: 18px;
      }
      .signature-line {
        border-top: 1px solid #8fa4bd;
        padding-top: 6px;
      }
      .footer {
        background: #2c5587;
        border-radius: 10px;
        color: #fff;
        margin-top: 18px;
        padding: 12px;
        text-align: center;
      }
      .footer p { margin: 2px 0; }
    </style>
  </head>
  <body>
    <main class="document">
      <header class="header">
        <p class="eyebrow">MLG Home Financial</p>
        <h1>Complete Loan Estimate Fee Sheet</h1>
      </header>

      <section class="meta">
        <div><p class="label">Applicant</p><p class="value">${escapeHtml(state.applicantName || "Not provided")}</p></div>
        <div><p class="label">Loan Number</p><p class="value">${escapeHtml(state.loanNumber || "Not provided")}</p></div>
        <div><p class="label">Presented By</p><p class="value">${escapeHtml(state.presentedBy || "Not provided")}</p></div>
        <div><p class="label">Email</p><p class="value">${escapeHtml(state.email || "Not provided")}</p></div>
        <div><p class="label">Purchase Price</p><p class="value">${wholeCurrency(result.purchasePrice)}</p></div>
        <div><p class="label">Loan Amount</p><p class="value">${wholeCurrency(result.loanAmount)}</p></div>
        <div><p class="label">Rate</p><p class="value">${formatInterestRateDisplay(state.rate, "0.000%")}</p></div>
        <div><p class="label">LTV</p><p class="value">${formatRatioPercentDisplay(result.ltv, "0.00%")}</p></div>
      </section>

      <div class="grid">
        ${section("Fixed Loan Costs", `${fixedLoanCostRows(result)}${summaryRow("Fixed Loan Costs", centsCurrency(result.fixedLoanCosts), true)}`)}
        ${section("Fixed Title Costs", `${fixedTitleCostRows(result)}${summaryRow("Fixed Title Costs", centsCurrency(result.fixedTitleCosts), true)}`)}
        ${section(
          "Prepaids",
          [
            summaryRow("Taxes Escrow", centsCurrency(result.taxesEscrow)),
            summaryRow("Hazard Insurance Escrow", wholeCurrency(result.hazardInsEscrow)),
            summaryRow("Developer Fee Contract", centsCurrency(result.developFeeContract)),
            summaryRow("Capital Contribution", centsCurrency(result.capitalContribution)),
            summaryRow("Flood / HO6 Escrow", wholeCurrency(result.floodHO6Escrow)),
            summaryRow("Interest Per Diem", centsCurrency(result.interestPerDiem)),
            summaryRow("Total Pre-Paid", centsCurrency(result.totalPrepaid), true),
          ].join(""),
        )}
        ${section(
          "Monthly Payment",
          [
            summaryRow("Principal & Interest", centsCurrency(result.principalInterest)),
            summaryRow("Monthly Property Tax", centsCurrency(result.monthlyPropertyTax)),
            summaryRow("Monthly Hazard", centsCurrency(result.monthlyHazard)),
            summaryRow("Monthly Flood", centsCurrency(result.monthlyFlood)),
            summaryRow("Monthly HOA", centsCurrency(result.monthlyHOA)),
            summaryRow("Total Monthly Payment", centsCurrency(result.totalMonthlyPayment), true),
          ].join(""),
        )}
        ${section(
          "Cash to Close & Assets",
          [
            summaryRow("Total Closing Costs", centsCurrency(result.totalClosingCosts)),
            summaryRow("Total Pre-Paid", centsCurrency(result.totalPrepaid)),
            summaryRow("Down Payment", wholeCurrency(result.downPayment)),
            summaryRow("Down Payment Given to Seller", wholeCurrency(result.downPaymentGivenToSeller)),
            summaryRow("Seller Credit", wholeCurrency(result.sellerCredit)),
            summaryRow("Other Credits", wholeCurrency(result.otherCredits)),
            summaryRow("Total Cash to Close", centsCurrency(result.totalCashToClose), true),
            summaryRow("Reserves", centsCurrency(result.reserves)),
            summaryRow("Total Assets Required", centsCurrency(result.totalAssetsRequired), true),
          ].join(""),
        )}
      </div>

      <section class="signatures">
        <div class="signature-line">Applicant Signature</div>
        <div class="signature-line">Date</div>
      </section>

      <footer class="footer">
        <p><strong>MLG Home Financial</strong> · 3570 NW 87th Avenue, Suite 700, Doral, FL 33178</p>
        <p>+1.786.689.2939 (Office) · 561.287.8126 (Fax) · www.mlghomefinancial.com</p>
      </footer>
    </main>
  </body>
</html>`;
}

export async function renderLoanEstimatePdf(state: LoanEstimateState) {
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(loanEstimatePdfHtml(state), {
      waitUntil: "domcontentloaded",
    });

    const pdf = await page.pdf({
      height: "14in",
      margin: {
        bottom: "0.42in",
        left: "0.42in",
        right: "0.42in",
        top: "0.42in",
      },
      printBackground: true,
      width: "8.5in",
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
