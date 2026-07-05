function emailShell(content: string) {
  return `
    <div style="margin:0;padding:24px;background:#F0F5FD;font-family:Arial,sans-serif;color:#0B2238;">
      <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #D8E4F0;border-radius:8px;overflow:hidden;">
        <div style="padding:18px 22px;background:#2C5587;color:#FFFFFF;">
          <strong style="font-size:18px;">MAFI Workstation</strong>
        </div>
        <div style="padding:24px 22px;font-size:15px;line-height:1.6;">
          ${content}
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function followUpDiscoveryCall(prospectName: string) {
  const name = escapeHtml(prospectName || "there");

  return emailShell(`
    <p style="margin:0 0 16px;">Hi ${name},</p>
    <p style="margin:0 0 16px;">
      Just checking in on your mortgage options. Happy to answer any questions whenever you're ready.
    </p>
    <p style="margin:0;color:#54595F;">Best,<br />MAFI Workstation</p>
  `);
}

export function followUpNotMovingForward(prospectName: string) {
  const name = escapeHtml(prospectName || "there");

  return emailShell(`
    <p style="margin:0 0 16px;">Hi ${name},</p>
    <p style="margin:0 0 16px;">
      It's been a while. Rates and programs change often, so we're happy to revisit your options if the timing is better now.
    </p>
    <p style="margin:0;color:#54595F;">Best,<br />MAFI Workstation</p>
  `);
}

export function welcomeEmail(prospectName: string) {
  const name = escapeHtml(prospectName || "there");

  return emailShell(`
    <p style="margin:0 0 16px;">Hi ${name},</p>
    <p style="margin:0 0 16px;">
      Welcome to MLG Financial. We received your information and someone from our team will follow up to learn more about your mortgage goals and discuss available options.
    </p>
    <p style="margin:0 0 16px;">
      MLG Financial can help review a range of mortgage programs and potential benefits based on your situation. Any options discussed are informational and subject to eligibility, documentation, underwriting, and final approval.
    </p>
    <p style="margin:0 0 18px;color:#54595F;">Best,<br />MLG Financial</p>
    <hr style="border:0;border-top:1px solid #D8E4F0;margin:18px 0;" />
    <p style="margin:0 0 8px;color:#7A7A7A;font-size:12px;line-height:1.5;">
      If you'd rather not receive these emails, reply STOP or contact us at [placeholder email].
    </p>
    <p style="margin:0;color:#7A7A7A;font-size:12px;line-height:1.5;">
      [MLG Financial business address]
    </p>
  `);
}
