import Link from "next/link";
import { RoleType, ScenarioDeskStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { loanPurposeLabels } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function Phase4Page() {
  const access = await requireRole([
    RoleType.LICENSED_LO,
    RoleType.LOAN_PROCESSOR,
    RoleType.OWNER,
    RoleType.COMPLIANCE_OFFICER,
  ]);

  if (!access.success) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card className="border-mafi-border bg-mafi-bg-white">
          <CardContent className="px-6 py-10 text-center text-sm text-mafi-text-mid">
            Not authorized. Phase 4 is available only to Licensed LO, Loan
            Processor, Owner, and Compliance read-only roles.
          </CardContent>
        </Card>
      </div>
    );
  }

  const contacts = await prisma.contact.findMany({
    where: {
      scenarioDesk: {
        status: ScenarioDeskStatus.FINALIZED,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      createdAt: true,
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
      phase4Pipeline: {
        select: {
          decisionBranch: true,
          updatedAt: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
          Phase 4
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
          Loan Pre-Approval
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
          Track processing milestones after Scenario Desk has been finalized.
        </p>
      </div>

      <Card className="border-mafi-border bg-mafi-bg-white">
        <CardContent className="p-0">
          {contacts.length ? (
            <div className="divide-y divide-mafi-border">
              {contacts.map((contact) => (
                <Link
                  className="grid gap-2 px-4 py-3 text-sm transition hover:bg-mafi-bg-light md:grid-cols-[1.2fr_1fr_1fr_1fr] md:items-center"
                  href={`/phase4/${contact.id}`}
                  key={contact.id}
                >
                  <div>
                    <p className="font-semibold text-mafi-text-dark">
                      {contact.prospectName}
                    </p>
                    <p className="text-xs text-mafi-text-mid">
                      {contact.prospectPhone || "Not provided"} ·{" "}
                      {contact.prospectEmail || "Not provided"}
                    </p>
                  </div>
                  <p className="text-mafi-text-mid">
                    {loanPurposeLabels[contact.loanPurpose]}
                  </p>
                  <p className="text-mafi-text-mid">
                    BDR: {contact.bdr.fullName}
                  </p>
                  <p className="text-mafi-text-mid">
                    Created {formatDate(contact.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-mafi-text-mid">
              No finalized scenarios are ready for Phase 4.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
