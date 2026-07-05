import {
  documentShell,
  formatDocumentValue,
  LoanDocumentData,
} from "@/lib/documents/document-types";

export function loanPreApprovalTemplate(data: LoanDocumentData) {
  return documentShell(
    "Loan Pre-Approval",
    `
      <p style="margin:0 0 6px;color:#3676C2;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">Loan Pre-Approval</p>
      <h1 style="margin:0 0 22px;font-size:28px;line-height:1.15;color:#0B2238;">Mortgage Pre-Approval Summary</h1>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
        <tr>
          <td style="padding:9px 0;color:#54595F;width:34%;">Borrower</td>
          <td style="padding:9px 0;font-weight:700;">${formatDocumentValue(data.borrowerName)}</td>
        </tr>
        <tr>
          <td style="padding:9px 0;color:#54595F;">Property Address</td>
          <td style="padding:9px 0;font-weight:700;">${formatDocumentValue(data.propertyAddress)}</td>
        </tr>
        <tr>
          <td style="padding:9px 0;color:#54595F;">Loan Amount</td>
          <td style="padding:9px 0;font-weight:700;">${formatDocumentValue(data.loanAmount)}</td>
        </tr>
        <tr>
          <td style="padding:9px 0;color:#54595F;">Lender / Product</td>
          <td style="padding:9px 0;font-weight:700;">${formatDocumentValue(data.lenderAndProduct)}</td>
        </tr>
        <tr>
          <td style="padding:9px 0;color:#54595F;">Interest Rate</td>
          <td style="padding:9px 0;font-weight:700;">${formatDocumentValue(data.interestRate)}</td>
        </tr>
      </table>

      <div style="border:1px solid #D8E4F0;background:#FCFCFC;border-radius:8px;padding:18px;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;line-height:1.65;">
          Based on the information currently available, the borrower listed above has been reviewed for mortgage pre-approval consideration.
          This summary is general and non-binding, and remains subject to full application review, credit verification, property review,
          underwriting approval, investor guidelines, and any required conditions.
        </p>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#54595F;width:34%;">Loan Officer</td>
          <td style="padding:8px 0;font-weight:700;">${formatDocumentValue(data.loanOfficerName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#54595F;">NMLS</td>
          <td style="padding:8px 0;font-weight:700;">${formatDocumentValue(data.loanOfficerNmls)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#54595F;">Date</td>
          <td style="padding:8px 0;font-weight:700;">${formatDocumentValue(data.documentDate)}</td>
        </tr>
      </table>
    `,
  );
}
