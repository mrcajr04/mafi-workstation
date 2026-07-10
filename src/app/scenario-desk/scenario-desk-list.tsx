import Link from "next/link";
import { ContactStatus, RoleType } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateForDisplay } from "@/lib/dates";
import { loanPurposeLabels } from "@/lib/labels";
import { formatUSPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

function formatDate(value: Date) {
  return formatDateForDisplay(value);
}

const getCachedScenarioDeskContacts = unstable_cache(
  () =>
    prisma.contact.findMany({
      where: {
        status: ContactStatus.IN_SCENARIO_REVIEW,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
        enteredReviewAt: true,
        updatedAt: true,
        loanPurpose: true,
        prospectEmail: true,
        prospectName: true,
        prospectPhone: true,
        bdr: {
          select: {
            email: true,
            fullName: true,
          },
        },
        opportunityValue: {
          select: {
            loanAmount: true,
            propertyValue: true,
            ltv: true,
          },
        },
      },
    }),
  ["scenario-desk-list"],
  {
    revalidate: 30,
    tags: ["scenario-desk-list"],
  },
);

export async function ScenarioDeskList() {
  const access = await requireRole([RoleType.LICENSED_LO, RoleType.OWNER]);

  if (!access.success) {
    return (
      <Card className="border-mafi-border bg-mafi-bg-white">
        <CardContent className="px-6 py-10 text-center text-sm text-mafi-text-mid">
          Not authorized. Scenario Desk is available only to Licensed LO and
          Owner roles.
        </CardContent>
      </Card>
    );
  }

  const contacts = await getCachedScenarioDeskContacts();

  return (
    <Card className="overflow-hidden border-mafi-border bg-mafi-bg-white shadow-sm">
      <CardContent className="p-0">
        {contacts.length ? (
          <div>
            <div className="hidden grid-cols-[minmax(220px,1.35fr)_minmax(120px,0.65fr)_minmax(210px,1fr)_minmax(130px,0.65fr)_150px] items-center border-b border-mafi-border bg-mafi-bg-light px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-mafi-text-light md:grid">
              <span>Prospect</span>
              <span>Loan Purpose</span>
              <span>Assigned BDR</span>
              <span>Ready Since</span>
              <span className="text-right">Action</span>
            </div>
            {contacts.map((contact) => (
              <Link
                className="grid gap-3 border-b border-mafi-border px-4 py-4 text-sm transition last:border-b-0 hover:bg-mafi-bg-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mafi-blue-primary/40 md:grid-cols-[minmax(220px,1.35fr)_minmax(120px,0.65fr)_minmax(210px,1fr)_minmax(130px,0.65fr)_150px] md:items-center md:py-3"
                href={`/scenario-desk/${contact.id}`}
                key={contact.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-mafi-text-dark">
                    {contact.prospectName}
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-mafi-text-mid">
                    {formatUSPhone(contact.prospectPhone, "No phone")} {" | "}
                    {contact.prospectEmail || "No email"}
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-mafi-text-mid md:text-sm md:font-medium md:normal-case md:tracking-normal">
                  {loanPurposeLabels[contact.loanPurpose]}
                </p>
                <div className="min-w-0 text-mafi-text-mid">
                  <p className="truncate font-medium text-mafi-text-dark">
                    {contact.bdr.fullName}
                  </p>
                  <p className="truncate text-xs">{contact.bdr.email}</p>
                </div>
                <p className="text-sm font-medium text-mafi-text-dark">
                  {formatDate(
                    contact.enteredReviewAt ??
                      contact.updatedAt ??
                      contact.createdAt,
                  )}
                </p>
                <span className="inline-flex min-h-10 items-center justify-center rounded-md bg-mafi-blue-primary px-3 py-2 text-xs font-bold text-white shadow-sm transition md:justify-self-end">
                  Review Scenario -&gt;
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-base font-semibold text-mafi-text-dark">
              No contacts are ready for scenario review.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mafi-text-mid">
              When Opportunity Value records are marked ready, licensed users
              will see them here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
