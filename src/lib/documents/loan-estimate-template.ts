import {
  documentShell,
  formatDocumentValue,
  LoanDocumentData,
} from "@/lib/documents/document-types";

function row(label: string, value: string) {
  return `
    <tr>
      <td style="border-bottom:1px solid #D8E4F0;padding:12px;color:#54595F;">${formatDocumentValue(label)}</td>
      <td style="border-bottom:1px solid #D8E4F0;padding:12px;font-weight:700;text-align:right;">${formatDocumentValue(value)}</td>
    </tr>
  `;
}

export function loanEstimateTemplate(data: LoanDocumentData) {
  return documentShell(
    "Loan Estimate",
    `
      <p style="margin:0 0 6px;color:#3676C2;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">Loan Estimate</p>
      <h1 style="margin:0 0 22px;font-size:28px;line-height:1.15;color:#0B2238;">Estimated Loan Scenario</h1>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#54595F;width:34%;">Borrower</td>
          <td style="padding:8px 0;font-weight:700;">${formatDocumentValue(data.borrowerName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#54595F;">Property Address</td>
          <td style="padding:8px 0;font-weight:700;">${formatDocumentValue(data.propertyAddress)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#54595F;">Loan Amount</td>
          <td style="padding:8px 0;font-weight:700;">${formatDocumentValue(data.loanAmount)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#54595F;">Lender / Product</td>
          <td style="padding:8px 0;font-weight:700;">${formatDocumentValue(data.lenderAndProduct)}</td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;border:1px solid #D8E4F0;">
        <thead>
          <tr>
            <th colspan="2" style="background:#E7EEF9;color:#0B2238;text-align:left;padding:12px;font-size:15px;">Scenario Breakdown</th>
          </tr>
        </thead>
        <tbody>
          ${row("Interest Rate", data.interestRate)}
          ${row("Principal & Interest", data.principalAndInterest)}
          ${row("PITIA", data.pitia)}
          ${row("Origination Pay", data.originationPay)}
          ${row("Processing Fee", data.processingFee)}
          ${row("Escrow Status", data.scenarioEscrowed)}
        </tbody>
      </table>

      <div style="border:1px solid #FFD580;background:#FFF7E7;border-radius:8px;padding:16px;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#54595F;">
          This document is an estimate for discussion purposes only and is subject to change. Final loan terms, fees, payments,
          and closing costs may vary based on verified borrower information, property review, market conditions, underwriting,
          investor guidelines, and any applicable TRID disclosures.
        </p>
      </div>

      <p style="margin:22px 0 0;font-size:13px;color:#54595F;">Prepared by ${formatDocumentValue(data.loanOfficerName)}${data.loanOfficerNmls ? `, NMLS ${formatDocumentValue(data.loanOfficerNmls)}` : ""} on ${formatDocumentValue(data.documentDate)}.</p>
    `,
  );
}
