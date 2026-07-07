"use client";

import { useState } from "react";
import { NewProspectModal } from "@/components/workstation/new-prospect-modal";
import { ProspectIntakeInitialData } from "@/components/workstation/prospect-intake-form";
import { borrowerTypeLabels, labelFromMap } from "@/lib/labels";
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
};

type OpportunityListItemProps = {
  canEdit: boolean;
  contact: OpportunityListContact;
  showBdrColumn: boolean;
};

const loanPurposeLabels = {
  PURCHASE: "Purchase",
  RATE_TERM_REFI: "Rate/Term Refi",
  CASH_OUT_REFI: "Cash-Out Refi",
  LIMITED_CASH_OUT: "Limited Cash-Out",
} as const;

function emailOnly(value: string) {
  const parenthesizedEmail = value.match(/\(([^()\s]+@[^()\s]+)\)/);

  return parenthesizedEmail?.[1] ?? value;
}

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
      loanPurposeLabels[form.loanPurpose as keyof typeof loanPurposeLabels] ??
      contact.loanPurposeLabel,
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
    prospectEmail: form.prospectEmail,
    prospectName: form.prospectName,
    prospectPhone: form.prospectPhone,
  };
}

function desktopGridClass(showBdrColumn: boolean) {
  return showBdrColumn
    ? "grid-cols-[minmax(5.5rem,0.7fr)_minmax(8rem,1.05fr)_minmax(9rem,1.45fr)_minmax(7rem,0.75fr)_minmax(7rem,0.9fr)_minmax(9rem,1.25fr)_minmax(10rem,1.3fr)_minmax(4rem,0.45fr)]"
    : "grid-cols-[minmax(5.5rem,0.7fr)_minmax(10rem,1.55fr)_minmax(7rem,0.8fr)_minmax(7rem,0.9fr)_minmax(9rem,1.3fr)_minmax(10rem,1.35fr)_minmax(4rem,0.5fr)]";
}

export function OpportunityMobileCard({
  canEdit,
  contact,
  showBdrColumn,
}: OpportunityListItemProps) {
  const [displayContact, setDisplayContact] = useState(contact);
  if (displayContact.opportunityStatusTone === "READY_FOR_REVIEW") {
    return null;
  }

  const createdByEmail = emailOnly(displayContact.createdBy);
  const content = (
    <>
      <p className="text-sm font-semibold">{displayContact.prospectName}</p>
      <div className="mt-3 grid gap-2 text-xs text-mafi-text-mid">
        <InfoLine label="Date created" value={displayContact.createdLabel} />
        {showBdrColumn ? (
          <InfoLine label="Created By" value={createdByEmail} />
        ) : null}
        <InfoLine label="Phone" value={formatUSPhone(displayContact.prospectPhone, "No phone")} />
        <InfoLine label="Borrower type" value={displayContact.borrowerType} />
        <InfoLine label="Loan purpose" value={displayContact.loanPurposeLabel} />
        <div className="flex items-center gap-2">
          <span className="font-medium text-mafi-text-dark">Status:</span>
          {displayContact.isPhase1Incomplete ? <IncompleteBadge /> : null}
          <StatusBadge
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
  if (displayContact.opportunityStatusTone === "READY_FOR_REVIEW") {
    return null;
  }

  const createdByEmail = emailOnly(displayContact.createdBy);
  const rowClassName = `grid w-full ${desktopGridClass(showBdrColumn)} items-center border-b border-mafi-border text-left text-[13px] transition last:border-b-0`;
  const cells = (
    <>
      <div className="truncate px-4 py-2 text-mafi-text-mid">
        {displayContact.createdLabel}
      </div>
      {showBdrColumn ? (
        <div className="truncate px-4 py-2 text-mafi-text-mid">
          {createdByEmail}
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
      <div className="min-w-0 px-4 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {displayContact.isPhase1Incomplete ? <IncompleteBadge /> : null}
          <StatusBadge
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

function IncompleteBadge() {
  return (
    <span className="inline-flex max-w-full items-center rounded-full border border-mafi-gold bg-mafi-gold-light/50 px-2 py-1 text-[11px] font-semibold leading-none text-mafi-gold-dark">
      Incomplete
    </span>
  );
}

function StatusBadge({
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
  const className =
    tone === "NOT_STARTED"
      ? "border-mafi-border bg-mafi-bg-lighter text-mafi-text-light"
      : tone === "NOT_MOVING_FORWARD"
        ? "border-mafi-gold bg-mafi-gold-light/45 text-mafi-gold-dark"
        : "border-mafi-border bg-mafi-bg-light text-mafi-blue-primary";

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2 py-1 text-[11px] font-semibold leading-none ${className}`}
      title={title}
    >
      <span className="truncate">{label}</span>
    </span>
  );
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
