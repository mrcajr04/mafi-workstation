"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export type AuditLogListItem = {
  actionLabel: string;
  detailsText: string;
  entityId: string;
  entityType: string;
  id: string;
  timestampLabel: string;
  userFullName: string;
};

type AuditLogListProps = {
  logs: AuditLogListItem[];
};

export function AuditLogList({ logs }: AuditLogListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpanded(logId: string) {
    setExpandedId((currentId) => (currentId === logId ? null : logId));
  }

  return (
    <>
      <div className="space-y-3 p-4 md:hidden">
        {logs.map((log) => (
          <div
            className="rounded-md border border-mafi-border bg-mafi-bg-off p-4 text-sm"
            key={log.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-mafi-text-dark">
                  {log.actionLabel}
                </p>
                <p className="mt-1 text-xs text-mafi-text-light">
                  {log.timestampLabel}
                </p>
              </div>
              <span className="rounded-full bg-mafi-bg-lighter px-2 py-1 text-xs font-semibold text-mafi-blue-primary">
                {log.entityType}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-mafi-text-mid">
              <p>
                <span className="font-semibold text-mafi-text-dark">
                  User:
                </span>{" "}
                {log.userFullName}
              </p>
              <p>
                <span className="font-semibold text-mafi-text-dark">
                  Entity ID:
                </span>{" "}
                {log.entityId}
              </p>
            </div>
            <AuditDetailsButton
              detailsText={log.detailsText}
              isExpanded={expandedId === log.id}
              onToggle={() => toggleExpanded(log.id)}
            />
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,0.9fr)] border-b border-mafi-border bg-mafi-bg-lighter text-sm font-semibold text-mafi-text-dark">
          <div className="px-4 py-3">Timestamp</div>
          <div className="px-4 py-3">User</div>
          <div className="px-4 py-3">Action</div>
          <div className="px-4 py-3">Entity Type</div>
          <div className="px-4 py-3">Details</div>
        </div>
        {logs.map((log) => (
          <div
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,0.9fr)] items-start border-b border-mafi-border text-sm last:border-b-0"
            key={log.id}
          >
            <div className="px-4 py-3 text-mafi-text-mid">
              {log.timestampLabel}
            </div>
            <div className="px-4 py-3 text-mafi-text-mid">
              {log.userFullName}
            </div>
            <div className="px-4 py-3 font-medium text-mafi-text-dark">
              {log.actionLabel}
            </div>
            <div className="px-4 py-3 text-mafi-text-mid">
              {log.entityType}
            </div>
            <div className="px-4 py-3">
              <AuditDetailsButton
                detailsText={log.detailsText}
                isExpanded={expandedId === log.id}
                onToggle={() => toggleExpanded(log.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AuditDetailsButton({
  detailsText,
  isExpanded,
  onToggle,
}: {
  detailsText: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <div className="mt-2">
      <button
        className="inline-flex items-center gap-1 text-sm font-semibold text-mafi-blue-primary hover:underline"
        onClick={onToggle}
        type="button"
      >
        <Icon className="size-4" />
        View details
      </button>
      {isExpanded ? (
        <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-mafi-bg-light p-3 text-xs text-mafi-text-dark">
          {detailsText}
        </pre>
      ) : null}
    </div>
  );
}
