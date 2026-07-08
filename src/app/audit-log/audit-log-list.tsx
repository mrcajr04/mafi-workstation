"use client";

import {
  ChevronDown,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AuditLogListItem = {
  actionLabel: string;
  detailsText: string;
  entityId: string;
  entityType: string;
  id: string;
  timestampLabel: string;
  timestampRelativeLabel: string | null;
  userFullName: string;
};

type FilterOption = {
  label: string;
  value: string;
};

type AuditLogListProps = {
  actionOptions: FilterOption[];
  logs: AuditLogListItem[];
  selectedAction?: string;
  selectedUserId?: string;
  userOptions: FilterOption[];
};

const actionFilterGroups = [
  {
    label: "User Management",
    values: new Set([
      "DEACTIVATE_USER",
      "DELETE_USER",
      "INVITE_USER",
      "REACTIVATE_USER",
      "RESEND_INVITE",
    ]),
  },
  {
    label: "Contact & Intake",
    values: new Set([
      "ADD_FINANCIAL_SNAPSHOT",
      "ADD_PROPERTY_DETAILS",
      "CREATE_CONTACT",
      "DELETE_CONTACT",
      "UPDATE_CONTACT",
      "UPDATE_CONTACT_BASICS",
      "UPDATE_FINANCIAL_SNAPSHOT",
      "UPDATE_OPPORTUNITY_VALUE",
      "UPDATE_PROPERTY_DETAILS",
      "VIEW_CONTACT",
    ]),
  },
  {
    label: "Settings & Templates",
    values: new Set([
      "UPDATE_AUTOMATION_SETTINGS",
      "UPDATE_EMAIL_TEMPLATE",
      "UPDATE_USER_PROFILE",
    ]),
  },
];

export function AuditLogList({
  actionOptions,
  logs,
  selectedAction,
  selectedUserId,
  userOptions,
}: AuditLogListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const hasMultipleFilters = Boolean(selectedAction && selectedUserId);

  function toggleExpanded(logId: string) {
    setExpandedId((currentId) => (currentId === logId ? null : logId));
  }

  return (
    <>
      <div className="space-y-3 p-4 md:hidden">
        <AuditMobileFilters
          actionOptions={actionOptions}
          selectedAction={selectedAction}
          selectedUserId={selectedUserId}
          userOptions={userOptions}
        />
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
                {log.timestampRelativeLabel ? (
                  <p className="mt-0.5 text-xs text-mafi-text-light">
                    {log.timestampRelativeLabel}
                  </p>
                ) : null}
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
          <AuditFilterHeader
            label="User"
            options={userOptions}
            paramName="userId"
            selectedValue={selectedUserId}
          />
          <AuditFilterHeader
            label="Action"
            options={actionOptions}
            paramName="action"
            selectedValue={selectedAction}
          />
          <div className="px-4 py-3">Entity Type</div>
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <span>Details</span>
            {hasMultipleFilters ? <ClearFiltersButton label="Clear all" /> : null}
          </div>
        </div>
        {logs.map((log) => (
          <div
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,0.9fr)] items-start border-b border-mafi-border text-sm last:border-b-0"
            key={log.id}
          >
            <div className="px-4 py-3 text-mafi-text-mid">
              <p>{log.timestampLabel}</p>
              {log.timestampRelativeLabel ? (
                <p className="mt-0.5 text-xs text-mafi-text-light">
                  {log.timestampRelativeLabel}
                </p>
              ) : null}
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

function AuditMobileFilters({
  actionOptions,
  selectedAction,
  selectedUserId,
  userOptions,
}: {
  actionOptions: FilterOption[];
  selectedAction?: string;
  selectedUserId?: string;
  userOptions: FilterOption[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-mafi-border bg-mafi-bg-lighter p-2">
      <AuditFilterMenu
        label="Action"
        options={actionOptions}
        paramName="action"
        selectedValue={selectedAction}
      />
      <AuditFilterMenu
        label="User"
        options={userOptions}
        paramName="userId"
        selectedValue={selectedUserId}
      />
      {selectedAction && selectedUserId ? <ClearFiltersButton label="Clear all filters" /> : null}
    </div>
  );
}

function AuditFilterHeader({
  label,
  options,
  paramName,
  selectedValue,
}: {
  label: string;
  options: FilterOption[];
  paramName: "action" | "userId";
  selectedValue?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <span>{label}</span>
      <AuditFilterMenu
        label={label}
        options={options}
        paramName={paramName}
        selectedValue={selectedValue}
      />
    </div>
  );
}

function AuditFilterMenu({
  label,
  options,
  paramName,
  selectedValue,
}: {
  label: string;
  options: FilterOption[];
  paramName: "action" | "userId";
  selectedValue?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedActionGroups, setExpandedActionGroups] = useState<
    Record<string, boolean>
  >({});
  const selectedLabel = options.find((option) => option.value === selectedValue)?.label;
  const groupedActionOptions =
    paramName === "action" ? groupActionOptions(options) : [];

  function toggleActionGroup(groupLabel: string) {
    setExpandedActionGroups((currentGroups) => ({
      ...currentGroups,
      [groupLabel]: !currentGroups[groupLabel],
    }));
  }

  function applyFilter(value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (value) {
      params.set(paramName, value);
    } else {
      params.delete(paramName);
    }

    const queryString = params.toString();
    router.push(queryString ? `/audit-log?${queryString}` : "/audit-log");
  }

  return (
    <div className="inline-flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Filter ${label}`}
            className={
              selectedValue
                ? "h-7 gap-1 border-mafi-blue-primary bg-white px-2 text-xs text-mafi-blue-primary hover:bg-mafi-bg-light"
                : "h-7 gap-1 border-mafi-border bg-transparent px-2 text-xs text-mafi-text-mid hover:bg-white"
            }
            size="sm"
            type="button"
            variant="outline"
          >
            <Filter className="size-3.5" />
            {selectedLabel ? (
              <span className="max-w-28 truncate">{selectedLabel}</span>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => applyFilter(undefined)}>
            All {label.toLowerCase()}s
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {paramName === "action"
            ? groupedActionOptions.map((group) => {
                const isExpanded = Boolean(expandedActionGroups[group.label]);
                const GroupIcon = isExpanded ? ChevronDown : ChevronRight;

                return (
                  <div key={group.label}>
                    <button
                      className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-mafi-text-light hover:bg-mafi-bg-light hover:text-mafi-text-mid"
                      onClick={(event) => {
                        event.preventDefault();
                        toggleActionGroup(group.label);
                      }}
                      type="button"
                    >
                      <GroupIcon className="size-3.5" />
                      <span>{group.label}</span>
                    </button>
                    {isExpanded
                      ? group.options.map((option) => (
                          <DropdownMenuItem
                            className="pl-7"
                            key={option.value}
                            onClick={() => applyFilter(option.value)}
                          >
                            {option.label}
                          </DropdownMenuItem>
                        ))
                      : null}
                  <DropdownMenuSeparator />
                  </div>
                );
              })
            : options.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => applyFilter(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedValue ? (
        <button
          aria-label={`Clear ${label} filter`}
          className="inline-flex size-6 items-center justify-center rounded-md text-mafi-text-light hover:bg-white hover:text-mafi-blue-primary"
          onClick={() => applyFilter(undefined)}
          type="button"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function groupActionOptions(options: FilterOption[]) {
  const assignedValues = new Set<string>();
  const groups = actionFilterGroups
    .map((group) => {
      const groupOptions = options.filter((option) =>
        group.values.has(option.value),
      );

      groupOptions.forEach((option) => assignedValues.add(option.value));

      return {
        label: group.label,
        options: groupOptions,
      };
    })
    .filter((group) => group.options.length > 0);
  const otherOptions = options.filter(
    (option) => !assignedValues.has(option.value),
  );

  if (otherOptions.length > 0) {
    groups.push({
      label: "Other",
      options: otherOptions,
    });
  }

  return groups;
}

function ClearFiltersButton({ label }: { label: string }) {
  const router = useRouter();

  return (
    <button
      className="rounded-md px-2 py-1 text-xs font-semibold text-mafi-blue-primary hover:bg-white hover:underline"
      onClick={() => router.push("/audit-log")}
      type="button"
    >
      {label}
    </button>
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
