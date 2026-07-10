import Link from "next/link";
import { RoleType, ScenarioDeskStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCurrencyDisplay,
  formatCurrencyDisplayWithCents,
  formatInterestRateDisplay,
} from "@/lib/currency";
import { formatDateForDisplay, formatTimestampForDisplay } from "@/lib/dates";
import { loanPurposeLabels } from "@/lib/labels";
import { getLatestLoanEstimateGenerationTimestamps } from "@/lib/loan-estimate-storage";
import { formatUSPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

type PipelineStatus = "all" | "needs-estimate" | "drafted";

const statusTabs: Array<{ id: PipelineStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "needs-estimate", label: "Needs Estimate" },
  { id: "drafted", label: "Drafted" },
];

function formatDate(value: Date) {
  return formatDateForDisplay(value);
}

function normalizeStatus(value?: string): PipelineStatus {
  return statusTabs.some((tab) => tab.id === value)
    ? (value as PipelineStatus)
    : "all";
}

function pipelineStatus(generatedAt?: Date): {
  id: PipelineStatus;
  label: string;
  tone: string;
} {
  if (generatedAt) {
    return {
      id: "drafted",
      label: "Drafted",
      tone: "border-blue-100 bg-blue-50 text-mafi-blue-primary",
    };
  }

  return {
    id: "needs-estimate",
    label: "Needs Estimate",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  };
}

const getCachedPhase4Contacts = unstable_cache(
  () =>
    prisma.contact.findMany({
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
        updatedAt: true,
        bdr: {
          select: {
            fullName: true,
          },
        },
        opportunityValue: {
          select: {
            loanAmount: true,
          },
        },
        phase4Pipeline: {
          select: {
            id: true,
            updatedAt: true,
          },
        },
        propertyDetails: {
          select: {
            address: true,
          },
        },
        scenarioDesk: {
          select: {
            selectedScenarioNumber: true,
            scenarios: {
              select: {
                interestRate: true,
                lenderAndProduct: true,
                pitia: true,
                scenarioNumber: true,
              },
            },
          },
        },
      },
    }),
  ["phase4-list"],
  {
    revalidate: 30,
    tags: ["phase4-list"],
  },
);

export default async function Phase4Page({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const access = await requireRole([
    RoleType.BDR,
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
            Not authorized. Phase 4 is available only to active workstation
            roles.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [{ status }, contacts] = await Promise.all([
    searchParams ?? Promise.resolve({ status: undefined }),
    getCachedPhase4Contacts(),
  ]);
  const activeStatus = normalizeStatus(status);
  const pipelineIds = contacts
    .map((contact) => contact.phase4Pipeline?.id)
    .filter((id): id is string => Boolean(id));
  const generationTimestamps =
    await getLatestLoanEstimateGenerationTimestamps(pipelineIds);
  const rows = contacts.map((contact) => {
    const selectedScenario = contact.scenarioDesk?.scenarios.find(
      (scenario) =>
        scenario.scenarioNumber === contact.scenarioDesk?.selectedScenarioNumber,
    );
    const generatedAt = contact.phase4Pipeline
      ? generationTimestamps.get(contact.phase4Pipeline.id)
      : undefined;
    const statusInfo = pipelineStatus(generatedAt);

    return {
      contact,
      generatedAt,
      selectedScenario,
      statusInfo,
    };
  });
  const visibleRows =
    activeStatus === "all"
      ? rows
      : rows.filter((row) => row.statusInfo.id === activeStatus);
  const counts = statusTabs.reduce<Record<PipelineStatus, number>>(
    (accumulator, tab) => {
      accumulator[tab.id] =
        tab.id === "all"
          ? rows.length
          : rows.filter((row) => row.statusInfo.id === tab.id).length;
      return accumulator;
    },
    {
      all: 0,
      drafted: 0,
      "needs-estimate": 0,
    },
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
          Loan Estimate
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
          Loan Estimate Pipeline
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
          Review finalized scenarios, open the fee sheet, and track which loan
          estimates still need to be drafted.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => {
          const isActive = activeStatus === tab.id;
          const href = tab.id === "all" ? "/phase4" : `/phase4?status=${tab.id}`;

          return (
            <Link
              className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "border-mafi-blue-primary bg-mafi-blue-primary text-white"
                  : "border-mafi-border bg-mafi-bg-white text-mafi-text-mid hover:bg-mafi-bg-light"
              }`}
              href={href}
              key={tab.id}
            >
              {tab.label}{" "}
              <span className={isActive ? "text-white/80" : "text-mafi-text-light"}>
                {counts[tab.id]}
              </span>
            </Link>
          );
        })}
      </div>

      <Card className="border-mafi-border bg-mafi-bg-white">
        <CardContent className="p-0">
          {visibleRows.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] table-fixed border-collapse text-left text-sm">
                <thead className="border-b border-mafi-border bg-mafi-bg-light text-xs uppercase tracking-wide text-mafi-text-mid">
                  <tr>
                    <th className="w-[16%] px-4 py-3 font-bold">Borrower</th>
                    <th className="w-[8%] px-4 py-3 font-bold">Loan Purpose</th>
                    <th className="w-[15%] px-4 py-3 font-bold">Property</th>
                    <th className="w-[10%] px-4 py-3 text-right font-bold">Loan Amount</th>
                    <th className="w-[18%] px-4 py-3 font-bold">Lender / Product</th>
                    <th className="w-[7%] px-4 py-3 text-right font-bold">Rate</th>
                    <th className="w-[10%] px-4 py-3 text-right font-bold">Payment</th>
                    <th className="w-[10%] px-4 py-3 font-bold">Status</th>
                    <th className="w-[16%] px-4 py-3 font-bold">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mafi-border">
                  {visibleRows.map(
                    ({ contact, generatedAt, selectedScenario, statusInfo }) => (
                      <tr className="group transition hover:bg-mafi-bg-light/80" key={contact.id}>
                        <td className="px-4 py-3 align-top">
                          <Link className="block" href={`/phase4/${contact.id}`}>
                            <p className="font-semibold text-mafi-text-dark group-hover:text-mafi-blue-primary">
                              {contact.prospectName}
                            </p>
                            <p className="text-xs text-mafi-text-mid">
                              {formatUSPhone(contact.prospectPhone)}
                            </p>
                            <p className="max-w-[220px] truncate text-xs text-mafi-text-light">
                              {contact.prospectEmail || "Email not provided"}
                            </p>
                          </Link>
                        </td>
                        <td className="px-4 py-3 align-top text-mafi-text-mid">
                          <Link className="block" href={`/phase4/${contact.id}`}>
                            {loanPurposeLabels[contact.loanPurpose]}
                          </Link>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Link className="block" href={`/phase4/${contact.id}`}>
                            <p
                              className="max-w-[230px] truncate text-mafi-text-dark"
                              title={contact.propertyDetails?.address ?? ""}
                            >
                              {contact.propertyDetails?.address || "Not provided"}
                            </p>
                            <p className="text-xs text-mafi-text-light">
                              BDR: {contact.bdr.fullName}
                            </p>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right align-top font-mono tabular-nums text-mafi-text-dark">
                          <Link className="block" href={`/phase4/${contact.id}`}>
                            {formatCurrencyDisplay(contact.opportunityValue?.loanAmount)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Link className="block" href={`/phase4/${contact.id}`}>
                            {selectedScenario ? (
                              <p
                                className="max-w-[230px] truncate font-medium text-mafi-text-dark"
                                title={selectedScenario.lenderAndProduct}
                              >
                                {selectedScenario.lenderAndProduct}
                              </p>
                            ) : (
                              <p className="text-mafi-text-light">
                                No scenario selected
                              </p>
                            )}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right align-top font-mono tabular-nums text-mafi-text-dark">
                          <Link className="block" href={`/phase4/${contact.id}`}>
                            {selectedScenario
                              ? formatInterestRateDisplay(
                                  selectedScenario.interestRate,
                                )
                              : "Not provided"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right align-top font-mono tabular-nums text-mafi-text-dark">
                          <Link className="block" href={`/phase4/${contact.id}`}>
                            {selectedScenario
                              ? formatCurrencyDisplayWithCents(selectedScenario.pitia)
                              : "Not provided"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Link className="block" href={`/phase4/${contact.id}`}>
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusInfo.tone}`}
                            >
                              {statusInfo.label}
                            </span>
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 align-top text-mafi-text-mid">
                          <Link className="block" href={`/phase4/${contact.id}`}>
                            <p className="text-xs">
                              {generatedAt
                                ? formatTimestampForDisplay(generatedAt)
                                : formatDate(contact.updatedAt)}
                            </p>
                            <p className="mt-1 text-[11px] text-mafi-text-light">
                              Created {formatDate(contact.createdAt)}
                            </p>
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-mafi-text-mid">
              No loan estimates match this view.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
