import {
  defaultEmailTemplates,
  emailShell,
  type EmailTemplateKey,
  renderTemplateBody,
} from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

type RenderEmailTemplateInput = {
  loanOfficerName?: string | null;
  prospectName: string;
  templateKey: EmailTemplateKey;
};

export async function ensureDefaultEmailTemplates() {
  await Promise.all(
    defaultEmailTemplates.map((template) =>
      prisma.emailTemplate.upsert({
        where: {
          templateKey: template.templateKey,
        },
        update: {},
        create: {
          bodyHtml: template.bodyHtml.trim(),
          subject: template.subject,
          templateKey: template.templateKey,
        },
      }),
    ),
  );
}

export async function getEmailTemplates() {
  return unstable_cache(
    async () => {
      await ensureDefaultEmailTemplates();

      return prisma.emailTemplate.findMany({
        orderBy: {
          templateKey: "asc",
        },
      });
    },
    ["email-templates-list"],
    {
      revalidate: 3600,
      tags: ["email-templates-list"],
    },
  )();
}

export async function renderEmailTemplate({
  loanOfficerName,
  prospectName,
  templateKey,
}: RenderEmailTemplateInput) {
  const defaultTemplate = defaultEmailTemplates.find(
    (template) => template.templateKey === templateKey,
  );

  if (!defaultTemplate) {
    throw new Error(`Unknown email template: ${templateKey}`);
  }

  const template = await prisma.emailTemplate.upsert({
    where: {
      templateKey,
    },
    update: {},
    create: {
      bodyHtml: defaultTemplate.bodyHtml.trim(),
      subject: defaultTemplate.subject,
      templateKey,
    },
  });
  const bodyHtml = renderTemplateBody(template.bodyHtml, {
    loan_officer_name: loanOfficerName,
    prospect_name: prospectName || "there",
  });

  return {
    html: emailShell(bodyHtml),
    subject: template.subject,
  };
}
