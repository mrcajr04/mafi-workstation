"use server";

import { RoleType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logAccessDenied, logAuditEvent } from "@/lib/audit";
import { type EmailTemplateKey } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

type UpdateEmailTemplateResult =
  | { success: true }
  | { success: false; error: string };

function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  return Object.fromEntries(
    Object.entries(after)
      .filter(([key, value]) => before[key] !== value)
      .map(([key, value]) => [
        key,
        {
          after: value,
          before: before[key],
        },
      ]),
  );
}

export async function updateEmailTemplate(
  templateKey: EmailTemplateKey,
  subject: string,
  bodyHtml: string,
): Promise<UpdateEmailTemplateResult> {
  const access = await requireRole([RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("UPDATE_EMAIL_TEMPLATE", "EmailTemplate", templateKey);
    return {
      success: false,
      error: "FORBIDDEN",
    };
  }

  const nextTemplate = {
    bodyHtml: bodyHtml.trim(),
    subject: subject.trim(),
  };

  if (!nextTemplate.subject || !nextTemplate.bodyHtml) {
    return {
      success: false,
      error: "Subject and body are required.",
    };
  }

  const existingTemplate = await prisma.emailTemplate.findUnique({
    where: {
      templateKey,
    },
  });

  const savedTemplate = await prisma.emailTemplate.upsert({
    where: {
      templateKey,
    },
    update: nextTemplate,
    create: {
      ...nextTemplate,
      templateKey,
    },
  });

  await logAuditEvent(
    access.data.id,
    "UPDATE_EMAIL_TEMPLATE",
    "EmailTemplate",
    savedTemplate.id,
    {
      changedFields: existingTemplate
        ? changedFields(existingTemplate, nextTemplate)
        : nextTemplate,
      templateKey,
    },
  );

  revalidatePath("/admin/email-templates");

  return {
    success: true,
  };
}
