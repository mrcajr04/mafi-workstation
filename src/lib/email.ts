import { Resend } from "resend";

type SendEmailInput = {
  html: string;
  subject: string;
  to: string;
};

export async function sendEmail({ html, subject, to }: SendEmailInput) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  return resend.emails.send({
    from: "MAFI Workstation <onboarding@resend.dev>",
    html,
    subject,
    to,
  });
}
