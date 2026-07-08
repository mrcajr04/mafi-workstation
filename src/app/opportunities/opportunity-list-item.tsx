"use client";

import { useState } from "react";
import { opportunityDesktopGridClass } from "@/app/opportunities/opportunity-list-grid";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge";
import { NewProspectModal } from "@/components/workstation/new-prospect-modal";
import { ProspectIntakeInitialData } from "@/components/workstation/prospect-intake-form";
import { formatCurrencyDisplay } from "@/lib/currency";
import {
  borrowerTypeLabels,
  labelFromMap,
  loanPurposeLabels,
} from "@/lib/labels";
import { formatUSPhone } from "@/lib/phone";

type OpportunityListContact = {
  id: string;
  createdBy: string;
  createdLabel: string;
  prospectName: string;
  prospectPhone: string;
  prospectEmail: string;
  borrowerType: string;
  loanPurposeLabel: string;
  ficoLabel: string;
  hasFicoInfo: boolean;
  isPhase1Incomplete: boolean;
  opportunityStatusLabel: string;
  opportunityStatusReason: string;
  opportunityStatusTone: string;
  opportunityValueLabel: string;
};

type OpportunityListItemProps = {
  canEdit: boolean;
  contact: OpportunityListContact;
  showBdrColumn: boolean;
};

function optimisticContact(
  contact: OpportunityListContact,
  form: ProspectIntakeInitialData,
): OpportunityListContact {
  return {
    ...contact,
    borrowerType: labelFromMap(form.borrowerType, borrowerTypeLabels),
    ficoLabel: form.ficoScore || "N/A",
    hasFicoInfo: Boolean(form.ficoScore),
    isPhase1Incomplete: !form.propertyAddress.trim(),
    loanPurposeLabel:
      labelFromMap(form.loanPurpose, loanPurposeLabels) ?? contact.loanPurposeLabel,
    opportunityStatusLabel:
      form.opportunityStatus === "NOT_DECIDED"
        ? "Still working it"
        : form.opportunityStatus === "READY_FOR_REVIEW"
          ? "Ready for Review"
          : "Not moving forward",
    opportunityStatusReason:
      form.notMovingForwardReason === "Other"
        ? form.notMovingForwardOtherReason
        : form.notMovingForwardReason,
    opportunityStatusTone: form.opportunityStatus,
    opportunityValueLabel: form.opportunityLoanAmount
      ? formatCurrencyDisplay(form.opportunityLoanAmount)
      : "No opportunity value yet",
    prospectEmail: form.prospectEmail,
    prospectName: form.prospectName,
    prospectPhone: form.prospectPhone,
  };
}

export function OpportunityMobileCard({
  canEdit,
  contact,
  showBdrColumn,
}: OpportunityListItemProps) {
  const [displayContact, setDisplayContact] = useState(contact);

  const content = (
    <>
      <p className="text-sm font-semibold">{displayContact.prospectName}</p>
      <div className="mt-3 grid gap-2 text-xs text-mafi-text-mid">
        <InfoLine label="Date created" value={displayContact.createdLabel} />
        {showBdrColumn ? (
          <InfoLine label="Created By" value={displayContact.createdBy} />
        ) : null}
        <InfoLine label="Phone" value={formatUSPhone(displayContact.prospectPhone, "No phone")} />
        <InfoLine label="Borrower type" value={displayContact.borrowerType} />
        <InfoLine label="Loan purpose" value={displayContact.loanPurposeLabel} />
        <InfoLine
          label="Opportunity value"
          muted={displayContact.opportunityValueLabel === "No opportunity value yet"}
          value={displayContact.opportunityValueLabel}
        />
        <div className="flex items-center gap-2">
          <span className="font-medium text-mafi-text-dark">Status:</span>
          {displayContact.isPhase1Incomplete ? (
            <StatusBadge label="Incomplete" tone="warning" />
          ) : null}
          <OpportunityStatusBadge
            label={displayContact.opportunityStatusLabel}
            reason={displayContact.opportunityStatusReason}
            tone={displayContact.opportunityStatusTone}
          />
        </div>
        <InfoLine label="FICO" muted={!displayContact.hasFicoInfo} value={displayContact.ficoLabel} />
      </div>
    </>
  );

  if (!canEdit) {
    return (
      <div className="block w-full rounded-md border border-mafi-border bg-mafi-bg-off p-4 text-left text-mafi-text-dark">
        {content}
      </div>
    );
  }

  return (
    <NewProspectModal
      contactId={displayContact.id}
      onOptimisticSaved={(form) =>
        setDisplayContact((currentContact) =>
          optimisticContact(currentContact, form),
        )
      }
      trigger={(open) => (
        <button
          className="block w-full rounded-md border border-mafi-border bg-mafi-bg-off p-4 text-left text-mafi-text-dark transition hover:border-mafi-blue-primary hover:bg-mafi-bg-light"
          onClick={open}
          type="button"
        >
          {content}
        </button>
      )}
    />
  );
}

export function OpportunityDesktopRow({
  canEdit,
  contact,
  showBdrColumn,
}: OpportunityListItemProps) {
  const [displayContact, setDisplayContact] = useState(contact);

  const rowClassName = `grid w-full ${opportunityDesktopGridClass(showBdrColumn)} items-center border-b border-mafi-border text-left text-[13px] transition last:border-b-0`;
  const cells = (
    <>
      <div className="truncate px-4 py-2 text-mafi-text-mid">
        {displayContact.createdLabel}
      </div>
      {showBdrColumn ? (
        <div className="truncate px-4 py-2 text-mafi-text-mid">
          {displayContact.createdBy}
        </div>
      ) : null}
      <div className="min-w-0 px-4 py-2">
        <p className="font-semibold text-mafi-text-dark">
          {displayContact.prospectName}
        </p>
      </div>
      <div className="truncate px-4 py-2 text-mafi-text-mid">
        {formatUSPhone(displayContact.prospectPhone, "No phone")}
      </div>
      <div className="truncate px-4 py-2 text-mafi-text-mid">
        {displayContact.borrowerType}
      </div>
      <div
        className="truncate whitespace-nowrap px-4 py-2 text-mafi-text-mid"
        title={displayContact.loanPurposeLabel}
      >
        {displayContact.loanPurposeLabel}
      </div>
      <div
        className={
          displayContact.opportunityValueLabel === "No opportunity value yet"
            ? "truncate px-4 py-2 text-mafi-text-light"
            : "truncate px-4 py-2 font-semibold text-mafi-text-dark"
        }
        title={displayContact.opportunityValueLabel}
      >
        {displayContact.opportunityValueLabel}
      </div>
      <div className="min-w-0 px-4 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {displayContact.isPhase1Incomplete ? (
            <StatusBadge label="Incomplete" tone="warning" />
          ) : null}
          <OpportunityStatusBadge
            label={displayContact.opportunityStatusLabel}
            reason={displayContact.opportunityStatusReason}
            tone={displayContact.opportunityStatusTone}
          />
        </div>
      </div>
      <div
        className={
          displayContact.hasFicoInfo
            ? "px-4 py-2 text-mafi-text-mid"
            : "px-4 py-2 text-mafi-text-light"
        }
      >
        {displayContact.ficoLabel}
      </div>
    </>
  );

  if (!canEdit) {
    return <div className={rowClassName}>{cells}</div>;
  }

  return (
    <NewProspectModal
      contactId={displayContact.id}
      onOptimisticSaved={(form) =>
        setDisplayContact((currentContact) =>
          optimisticContact(currentContact, form),
        )
      }
      trigger={(open) => (
        <button
          className={`${rowClassName} hover:bg-mafi-bg-light`}
          onClick={open}
          type="button"
        >
          {cells}
        </button>
      )}
    />
  );
}

function OpportunityStatusBadge({
  label,
  reason,
  tone,
}: {
  label: string;
  reason: string;
  tone: string;
}) {
  const title =
    tone === "NOT_MOVING_FORWARD" && reason
      ? `Reason: ${reason}`
      : undefined;
  const badgeTone: StatusBadgeTone =
    tone === "NOT_STARTED"
      ? "muted"
      : tone === "NOT_MOVING_FORWARD"
        ? "warning"
        : "neutral";

  return <StatusBadge label={label} title={title} tone={badgeTone} />;
}

function InfoLine({
  label,
  muted = false,
  value,
}: {
  label: string;
  muted?: boolean;
  value: string;
}) {
  return (
    <p>
      <span className="font-medium text-mafi-text-dark">{label}:</span>{" "}
      <span className={muted ? "text-mafi-text-light" : ""}>{value}</span>
    </p>
  );
}
