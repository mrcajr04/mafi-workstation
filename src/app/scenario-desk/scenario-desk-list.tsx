import Link from "next/link";
import { ContactStatus, RoleType } from "@prisma/client";
import { ArrowRight, Clock3, Inbox, LockKeyhole } from "lucide-react";
import { unstable_cache } from "next/cache";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateForDisplay } from "@/lib/dates";
import { isRefinanceLoanPurpose, loanPurposeLabels } from "@/lib/labels";
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
      <Card className="border-mafi-border bg-mafi-bg-white shadow-sm">
        <CardContent className="px-6 py-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-mafi-gold/30 bg-mafi-gold-light/40 text-mafi-gold-dark">
            <LockKeyhole className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-mafi-text-dark">
            Scenario Desk access required
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mafi-text-mid">
            This workspace is available only to Licensed Loan Originator and
            Owner roles.
          </p>
        </CardContent>
      </Card>
    );
  }

  const contacts = await getCachedScenarioDeskContacts();
  const purchaseCount = contacts.filter(
    (contact) => !isRefinanceLoanPurpose(contact.loanPurpose),
  ).length;
  const refinanceCount = contacts.length - purchaseCount;

  return (
    <div className="space-y-4">
      <section className="grid overflow-hidden rounded-lg border border-mafi-border bg-mafi-bg-white shadow-sm sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(100px,0.45fr))]">
        <div className="border-b border-mafi-border px-5 py-4 sm:border-r sm:border-b-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-mafi-text-light">
            Review queue
          </p>
          <h2 className="mt-1 text-lg font-bold text-mafi-text-dark">
            Ready for scenario review
          </h2>
          <p className="mt-1 text-xs leading-5 text-mafi-text-mid">
            Cases are ordered by the most recent workflow activity.
          </p>
        </div>
        {[
          ["Total", contacts.length],
          ["Purchase", purchaseCount],
          ["Refinance", refinanceCount],
        ].map(([label, value]) => (
          <div
            className="border-t border-mafi-border px-4 py-3 first:border-t-0 sm:border-t-0 sm:border-l"
            key={label}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-mafi-text-light">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-mafi-text-dark">
              {value}
            </p>
          </div>
        ))}
      </section>

      <Card className="overflow-hidden border-mafi-border bg-mafi-bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-mafi-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-mafi-text-dark">
              Prospect queue
            </h2>
            <p className="text-xs text-mafi-text-mid">
              Open a case to build and compare financing scenarios.
            </p>
          </div>
          <span className="self-start rounded-full border border-mafi-border bg-mafi-bg-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-mafi-text-mid sm:self-auto">
            {contacts.length} open
          </span>
        </div>
        <CardContent className="p-0">
          {contacts.length ? (
            <div>
              <div className="hidden grid-cols-[minmax(220px,1.3fr)_minmax(130px,0.65fr)_minmax(190px,0.9fr)_minmax(130px,0.55fr)_150px] items-center border-b border-mafi-border bg-mafi-bg-light px-4 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-mafi-text-light lg:grid">
                <span>Prospect</span>
                <span>Loan Purpose</span>
                <span>Assigned BDR</span>
                <span>Ready Since</span>
                <span className="text-right">Action</span>
              </div>
              {contacts.map((contact) => (
                <Link
                  className="grid gap-3 border-b border-mafi-border px-4 py-4 text-sm transition last:border-b-0 hover:bg-mafi-bg-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mafi-blue-primary/40 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(220px,1.3fr)_minmax(130px,0.65fr)_minmax(190px,0.9fr)_minmax(130px,0.55fr)_150px] lg:items-center lg:py-3"
                  href={`/scenario-desk/${contact.id}`}
                  key={contact.id}
                >
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-mafi-text-dark">
                      {contact.prospectName}
                    </p>
                    <p className="mt-1 break-words text-xs leading-5 text-mafi-text-mid">
                      {formatUSPhone(contact.prospectPhone, "No phone")} {" | "}
                      {contact.prospectEmail || "No email"}
                    </p>
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                    <span className="inline-flex rounded-full border border-mafi-blue-primary/20 bg-mafi-blue-primary/5 px-2.5 py-1 text-[11px] font-bold text-mafi-blue-primary">
                      {loanPurposeLabels[contact.loanPurpose]}
                    </span>
                  </div>
                  <div className="min-w-0 text-mafi-text-mid sm:col-span-1 lg:col-span-1">
                    <p className="break-words font-medium text-mafi-text-dark">
                      {contact.bdr.fullName}
                    </p>
                    <p className="break-all text-xs">{contact.bdr.email}</p>
                  </div>
                  <p className="flex items-center gap-2 text-sm font-medium text-mafi-text-dark sm:col-span-1 lg:col-span-1">
                    <Clock3
                      className="size-3.5 text-mafi-text-light"
                      aria-hidden="true"
                    />
                    {formatDate(
                      contact.enteredReviewAt ??
                        contact.updatedAt ??
                        contact.createdAt,
                    )}
                  </p>
                  <span className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-mafi-blue-primary px-3 py-2 text-xs font-bold text-white shadow-sm transition sm:row-start-1 sm:row-end-3 sm:col-start-2 sm:self-center lg:row-auto lg:col-auto lg:justify-self-end">
                    Review Scenario
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-mafi-blue-primary/15 bg-mafi-blue-primary/5 text-mafi-blue-primary">
                <Inbox className="size-6" aria-hidden="true" />
              </span>
              <p className="mt-4 text-lg font-semibold text-mafi-text-dark">
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
    </div>
  );
}
