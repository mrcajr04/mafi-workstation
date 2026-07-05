export type LoanDocumentData = {
  borrowerName: string;
  documentDate: string;
  interestRate: string;
  lenderAndProduct: string;
  loanAmount: string;
  loanOfficerName: string;
  loanOfficerNmls: string;
  originationPay: string;
  pitia: string;
  principalAndInterest: string;
  processingFee: string;
  propertyAddress: string;
  scenarioEscrowed: string;
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function documentShell(title: string, body: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#F0F5FD;color:#0B2238;font-family:Arial,Helvetica,sans-serif;">
    <main style="max-width:760px;margin:0 auto;padding:32px;">
      <section style="background:#FFFFFF;border:1px solid #D8E4F0;border-radius:8px;overflow:hidden;">
        <header style="background:#2C5587;color:#FFFFFF;padding:22px 28px;">
          <div style="font-size:22px;font-weight:700;letter-spacing:.02em;">MLG Financial</div>
          <div style="font-size:13px;color:#E7EEF9;margin-top:4px;">MAFI Workstation</div>
        </header>
        <div style="padding:28px;">
          ${body}
        </div>
      </section>
    </main>
  </body>
</html>`;
}

export function formatDocumentValue(value: string) {
  return escapeHtml(value || "Not provided");
}
