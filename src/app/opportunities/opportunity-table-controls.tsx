"use client";

import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OpportunitySortKey } from "@/lib/queries/engagement-queries";

type FilterOption = {
  label: string;
  value: string;
};

type SortableHeaderProps = {
  children: ReactNode;
  sortKey: OpportunitySortKey;
};

type FilterHeaderProps = SortableHeaderProps & {
  filterLabel: string;
  filterParam: "borrowerType" | "loanPurpose" | "opportunityStatus";
  options: FilterOption[];
  selectedValue?: string;
};

export function OpportunitySortableHeader({
  children,
  sortKey,
}: SortableHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort");
  const currentDirection = searchParams.get("direction") === "asc" ? "asc" : "desc";
  const isActive = currentSort === sortKey;
  const nextDirection = isActive && currentDirection === "asc" ? "desc" : "asc";
  const SortIcon = currentDirection === "asc" ? ChevronUp : ChevronDown;

  function applySort() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.set("sort", sortKey);
    params.set("direction", nextDirection);

    router.push(`/opportunities?${params.toString()}`);
  }

  return (
    <button
      className="flex w-full items-center gap-1 px-4 py-2 text-left font-semibold hover:text-mafi-blue-primary"
      onClick={applySort}
      type="button"
    >
      <span className="truncate">{children}</span>
      {isActive ? <SortIcon className="size-3.5 shrink-0" /> : null}
    </button>
  );
}

export function OpportunityFilterHeader({
  children,
  filterLabel,
  filterParam,
  options,
  selectedValue,
  sortKey,
}: FilterHeaderProps) {
  return (
    <div className="flex min-w-0 items-center gap-1 px-4 py-2">
      <OpportunitySortButton sortKey={sortKey}>{children}</OpportunitySortButton>
      <OpportunityFilterMenu
        label={filterLabel}
        options={options}
        paramName={filterParam}
        selectedValue={selectedValue}
      />
    </div>
  );
}

export function OpportunityMobileFilters({
  borrowerType,
  loanPurpose,
  opportunityStatus,
  showClearAll,
}: {
  borrowerType?: string;
  loanPurpose?: string;
  opportunityStatus?: string;
  showClearAll: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-mafi-border bg-mafi-bg-lighter p-2">
      <OpportunityFilterMenu
        label="Borrower type"
        options={borrowerTypeOptions}
        paramName="borrowerType"
        selectedValue={borrowerType}
      />
      <OpportunityFilterMenu
        label="Loan purpose"
        options={loanPurposeOptions}
        paramName="loanPurpose"
        selectedValue={loanPurpose}
      />
      <OpportunityFilterMenu
        label="Status"
        options={opportunityStatusOptions}
        paramName="opportunityStatus"
        selectedValue={opportunityStatus}
      />
      {showClearAll ? <OpportunityClearFiltersButton /> : null}
    </div>
  );
}

export function OpportunityClearFiltersButton() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("borrowerType");
    params.delete("loanPurpose");
    params.delete("opportunityStatus");

    router.push(`/opportunities?${params.toString()}`);
  }

  return (
    <button
      className="rounded-md px-2 py-1 text-xs font-semibold text-mafi-blue-primary hover:bg-white hover:underline"
      onClick={clearFilters}
      type="button"
    >
      Clear all
    </button>
  );
}

function OpportunitySortButton({
  children,
  sortKey,
}: SortableHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort");
  const currentDirection = searchParams.get("direction") === "asc" ? "asc" : "desc";
  const isActive = currentSort === sortKey;
  const nextDirection = isActive && currentDirection === "asc" ? "desc" : "asc";
  const SortIcon = currentDirection === "asc" ? ChevronUp : ChevronDown;

  function applySort() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.set("sort", sortKey);
    params.set("direction", nextDirection);

    router.push(`/opportunities?${params.toString()}`);
  }

  return (
    <button
      className="flex min-w-0 items-center gap-1 text-left font-semibold hover:text-mafi-blue-primary"
      onClick={applySort}
      type="button"
    >
      <span className="truncate">{children}</span>
      {isActive ? <SortIcon className="size-3.5 shrink-0" /> : null}
    </button>
  );
}

export const borrowerTypeOptions = [
  { label: "Primary", value: "PRIMARY" },
  { label: "Second Home", value: "SECOND_HOME" },
  { label: "Investment", value: "INVESTMENT" },
  { label: "Other", value: "OTHER" },
];

export const loanPurposeOptions = [
  { label: "Purchase", value: "PURCHASE" },
  { label: "Rate/Term Refi", value: "RATE_TERM_REFI" },
  { label: "Cash-Out Refi", value: "CASH_OUT_REFI" },
  { label: "Limited Cash-Out", value: "LIMITED_CASH_OUT" },
];

export const opportunityStatusOptions = [
  { label: "No opportunity value yet", value: "NOT_STARTED" },
  { label: "Incomplete", value: "INCOMPLETE" },
  { label: "Still working it", value: "NOT_DECIDED" },
  { label: "Ready for Review", value: "READY_FOR_REVIEW" },
  { label: "Not moving forward", value: "NOT_MOVING_FORWARD" },
];

function OpportunityFilterMenu({
  label,
  options,
  paramName,
  selectedValue,
}: {
  label: string;
  options: FilterOption[];
  paramName: "borrowerType" | "loanPurpose" | "opportunityStatus";
  selectedValue?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedLabel = options.find((option) => option.value === selectedValue)?.label;

  function applyFilter(value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (value) {
      params.set(paramName, value);
    } else {
      params.delete(paramName);
    }

    router.push(`/opportunities?${params.toString()}`);
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
              <span className="max-w-24 truncate">{selectedLabel}</span>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => applyFilter(undefined)}>
            All {label.toLowerCase()}s
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {options.map((option) => (
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
