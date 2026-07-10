"use client";

import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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

export function OpportunitySearchBox({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draftSearch, setDraftSearch] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = draftSearch.trim();
      const currentSearch = searchParams.get("search") ?? "";

      if (nextSearch === currentSearch) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");

      if (nextSearch) {
        params.set("search", nextSearch);
      } else {
        params.delete("search");
      }

      const query = params.toString();
      router.replace(query ? `/opportunities?${query}` : "/opportunities");
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [draftSearch, router, searchParams]);

  return (
    <Input
      className="min-h-11 w-full"
      onChange={(event) => setDraftSearch(event.target.value)}
      placeholder="Search prospects..."
      type="search"
      value={draftSearch}
    />
  );
}

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
}: {
  borrowerType?: string;
  loanPurpose?: string;
  opportunityStatus?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [draftBorrowerType, setDraftBorrowerType] = useState(borrowerType ?? "");
  const [draftLoanPurpose, setDraftLoanPurpose] = useState(loanPurpose ?? "");
  const [draftOpportunityStatus, setDraftOpportunityStatus] = useState(
    opportunityStatus ?? "",
  );
  const activeFilterCount = [
    borrowerType,
    loanPurpose,
    opportunityStatus,
  ].filter(Boolean).length;

  function openFilters() {
    setDraftBorrowerType(borrowerType ?? "");
    setDraftLoanPurpose(loanPurpose ?? "");
    setDraftOpportunityStatus(opportunityStatus ?? "");
    setIsOpen(true);
  }

  function paramsWithDraft() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    updateParam(params, "borrowerType", draftBorrowerType);
    updateParam(params, "loanPurpose", draftLoanPurpose);
    updateParam(params, "opportunityStatus", draftOpportunityStatus);

    return params;
  }

  function applyFilters() {
    const params = paramsWithDraft();
    const query = params.toString();
    setIsOpen(false);
    router.push(query ? `/opportunities?${query}` : "/opportunities");
  }

  function clearAllFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("borrowerType");
    params.delete("loanPurpose");
    params.delete("opportunityStatus");
    setDraftBorrowerType("");
    setDraftLoanPurpose("");
    setDraftOpportunityStatus("");
    setIsOpen(false);
    router.push(params.toString() ? `/opportunities?${params.toString()}` : "/opportunities");
  }

  return (
    <>
      <Button
        className="relative w-fit gap-2 border-mafi-border bg-white text-mafi-text-dark"
        onClick={openFilters}
        type="button"
        variant="outline"
      >
        <Filter className="size-4" />
        Filters
        {activeFilterCount ? (
          <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-mafi-blue-primary text-[11px] font-bold text-white">
            {activeFilterCount}
          </span>
        ) : null}
      </Button>

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end bg-black/35 md:hidden"
          role="dialog"
        >
          <button
            aria-label="Close filters"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <div className="relative w-full rounded-t-2xl border border-mafi-border bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-mafi-text-dark">
                  Filters
                </h2>
                <p className="text-sm text-mafi-text-mid">
                  Narrow the opportunities list.
                </p>
              </div>
              <button
                aria-label="Close filters"
                className="inline-flex size-9 items-center justify-center rounded-md text-mafi-text-mid hover:bg-mafi-bg-light"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <MobileFilterSelect
                label="Status"
                onChange={setDraftOpportunityStatus}
                options={opportunityStatusOptions}
                placeholder="Any status"
                value={draftOpportunityStatus}
              />
              <MobileFilterSelect
                label="Borrower Type"
                onChange={setDraftBorrowerType}
                options={borrowerTypeOptions}
                placeholder="Any borrower type"
                value={draftBorrowerType}
              />
              <MobileFilterSelect
                label="Loan Purpose"
                onChange={setDraftLoanPurpose}
                options={loanPurposeOptions}
                placeholder="Any loan purpose"
                value={draftLoanPurpose}
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-mafi-border pt-4">
              <Button
                className="min-h-11 flex-1"
                onClick={clearAllFilters}
                type="button"
                variant="outline"
              >
                Clear all
              </Button>
              <Button className="min-h-11 flex-1" onClick={applyFilters} type="button">
                Apply
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function updateParam(params: URLSearchParams, name: string, value: string) {
  if (value) {
    params.set(name, value);
  } else {
    params.delete(name);
  }
}

function MobileFilterSelect({
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-mafi-text-dark">{label}</span>
      <select
        className="min-h-11 w-full rounded-md border border-mafi-border bg-white px-3 text-sm text-mafi-text-dark focus:outline-none focus:ring-2 focus:ring-mafi-blue-primary"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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
  { label: "Business", value: "OTHER" },
];

export const loanPurposeOptions = [
  { label: "Purchase", value: "PURCHASE" },
  { label: "Rate/Term Refi", value: "RATE_TERM_REFI" },
  { label: "Cash-Out Refi", value: "CASH_OUT_REFI" },
  { label: "Limited Cash-Out", value: "LIMITED_CASH_OUT" },
];

export const opportunityStatusOptions = [
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
  const shouldShowAllOption = paramName !== "opportunityStatus";

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
          {shouldShowAllOption ? (
            <>
              <DropdownMenuItem onClick={() => applyFilter(undefined)}>
                All {label.toLowerCase()}s
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
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
