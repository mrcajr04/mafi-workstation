"use client";

import { NewProspectModal } from "@/components/workstation/new-prospect-modal";
import { ProspectIntakeInitialData } from "@/components/workstation/prospect-intake-form";

type OpportunityListContact = {
  id: string;
  bdrName: string;
  createdLabel: string;
  prospectName: string;
  prospectPhone: string;
  prospectEmail: string;
  borrowerType: string;
  loanPurposeLabel: string;
  ficoLabel: string;
  hasFicoInfo: boolean;
  initialData: ProspectIntakeInitialData;
};

type OpportunityListItemProps = {
  canEdit: boolean;
  contact: OpportunityListContact;
  showBdrColumn: boolean;
};

function desktopGridClass(showBdrColumn: boolean) {
  return showBdrColumn
    ? "grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.85fr)_minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.55fr)]"
    : "grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.6fr)]";
}

export function OpportunityMobileCard({
  canEdit,
  contact,
  showBdrColumn,
}: OpportunityListItemProps) {
  const content = (
    <>
      <p className="text-sm font-semibold">{contact.prospectName}</p>
      <div className="mt-3 grid gap-2 text-xs text-mafi-text-mid">
        <InfoLine label="Date created" value={contact.createdLabel} />
        {showBdrColumn ? <InfoLine label="BDR" value={contact.bdrName} /> : null}
        <InfoLine label="Phone" value={contact.prospectPhone || "No phone"} />
        <InfoLine label="Email" value={contact.prospectEmail || "No email"} />
        <InfoLine label="Borrower type" value={contact.borrowerType} />
        <InfoLine label="Loan purpose" value={contact.loanPurposeLabel} />
        <InfoLine label="FICO" muted={!contact.hasFicoInfo} value={contact.ficoLabel} />
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
      initialData={contact.initialData}
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
  const rowClassName = `grid w-full ${desktopGridClass(showBdrColumn)} items-center border-b border-mafi-border text-left text-[13px] transition last:border-b-0`;
  const cells = (
    <>
      <div className="truncate px-4 py-2 text-mafi-text-mid">
        {contact.createdLabel}
      </div>
      {showBdrColumn ? (
        <div className="truncate px-4 py-2 text-mafi-text-mid">
          {contact.bdrName}
        </div>
      ) : null}
      <div className="min-w-0 px-4 py-2">
        <p className="font-semibold text-mafi-text-dark">
          {contact.prospectName}
        </p>
      </div>
      <div className="truncate px-4 py-2 text-mafi-text-mid">
        {contact.prospectPhone || "No phone"}
      </div>
      <div className="truncate px-4 py-2 text-mafi-text-mid">
        {contact.prospectEmail || "No email"}
      </div>
      <div className="truncate px-4 py-2 text-mafi-text-mid">
        {contact.borrowerType}
      </div>
      <div className="px-4 py-2 text-mafi-text-mid">
        {contact.loanPurposeLabel}
      </div>
      <div
        className={
          contact.hasFicoInfo
            ? "px-4 py-2 text-mafi-text-mid"
            : "px-4 py-2 text-mafi-text-light"
        }
      >
        {contact.ficoLabel}
      </div>
    </>
  );

  if (!canEdit) {
    return <div className={rowClassName}>{cells}</div>;
  }

  return (
    <NewProspectModal
      initialData={contact.initialData}
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
