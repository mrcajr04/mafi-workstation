import { RoleType } from "@prisma/client";
import { EmailTemplatesEditor } from "@/app/admin/email-templates/email-templates-editor";
import { type EmailTemplateKey } from "@/lib/email-templates";
import { getEmailTemplates } from "@/lib/email-template-store";
import { requireRole } from "@/lib/rbac";

export default async function EmailTemplatesPage() {
  const access = await requireRole([RoleType.OWNER]);

  if (!access.success) {
    return (
      <main className="mx-auto max-w-6xl">
        <p className="text-sm text-destructive">
          Not authorized. Email Templates is available only to Owners.
        </p>
      </main>
    );
  }

  const templates = await getEmailTemplates();

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
          Email Templates
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
          Edit automated email subjects and HTML bodies without changing code.
        </p>
      </div>

      <EmailTemplatesEditor
        templates={templates.map((template) => ({
          bodyHtml: template.bodyHtml,
          id: template.id,
          subject: template.subject,
          templateKey: template.templateKey as EmailTemplateKey,
        }))}
      />
    </main>
  );
}
