import Link from "next/link";
import { ContactStatus, RoleType } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateForDisplay } from "@/lib/dates";
import { formatUSPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { loanPurposeLabels } from "@/lib/labels";

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
    <Card className="border-mafi-border bg-mafi-bg-white">
      <CardContent className="p-0">
        {contacts.length ? (
          <div className="divide-y divide-mafi-border">
            {contacts.map((contact) => (
              <Link
                className="grid gap-3 px-4 py-3 text-sm transition hover:bg-mafi-bg-light md:grid-cols-[1.2fr_0.8fr_1.1fr_0.8fr_auto] md:items-center"
                href={`/scenario-desk/${contact.id}`}
                key={contact.id}
              >
                <div>
                  <p className="font-semibold text-mafi-text-dark">
                    {contact.prospectName}
                  </p>
                  <p className="text-xs text-mafi-text-mid">
                    {formatUSPhone(contact.prospectPhone, "No phone")} ·{" "}
                    {contact.prospectEmail || "No email"}
                  </p>
                </div>
                <p className="text-mafi-text-mid">
                  {loanPurposeLabels[contact.loanPurpose]}
                </p>
                <p className="text-mafi-text-mid">
                  BDR: {contact.bdr.fullName} · {contact.bdr.email}
                </p>
                <p className="text-mafi-text-mid">
                  Ready since{" "}
                  {formatDate(
                    contact.enteredReviewAt ??
                      contact.updatedAt ??
                      contact.createdAt,
                  )}
                </p>
                <span className="inline-flex justify-center rounded-md bg-mafi-blue-primary px-3 py-2 text-xs font-bold text-white">
                  Review Scenario -&gt;
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-sm text-mafi-text-mid">
            No contacts are ready for scenario review.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
