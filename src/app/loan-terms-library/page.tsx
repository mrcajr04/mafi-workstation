import Link from "next/link";
import { BorrowerType } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  LoanProductResults,
  type LoanProductListItem,
} from "@/app/loan-terms-library/loan-product-results";
import { borrowerTypeLabels } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

type LoanTermsSearchParams = {
  borrowerType?: string;
  lender?: string;
  loanType?: string;
  maxLtv?: string;
  minFico?: string;
  propertyType?: string;
  purpose?: string;
};

function splitOptions(values: (string | null)[]) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => value?.split(",") ?? [])
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function numberParam(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function splitProductValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const getCachedLoanProducts = unstable_cache(
  () =>
    prisma.loanProduct.findMany({
      orderBy: [{ lender: "asc" }, { loanType: "asc" }, { minFico: "asc" }],
    }),
  ["loan-products-library"],
  {
    revalidate: 3600,
    tags: ["loan-products-library"],
  },
);

export default async function LoanTermsLibraryPage({
  searchParams,
}: {
  searchParams: Promise<LoanTermsSearchParams>;
}) {
  const filters = await searchParams;
  const minFico = numberParam(filters.minFico);
  const maxLtv = numberParam(filters.maxLtv);
  const allProducts = await getCachedLoanProducts();
  const selectedBorrowerTypeLabel = filters.borrowerType
    ? borrowerTypeLabels[filters.borrowerType as BorrowerType]
    : undefined;
  const products = allProducts.filter((product) => {
    const maxProductLtv = Number(product.maxLtv.toString());

    return (
      (!filters.lender || product.lender === filters.lender) &&
      (!filters.loanType || product.loanType === filters.loanType) &&
      (minFico === undefined || product.minFico <= minFico) &&
      (maxLtv === undefined || maxProductLtv >= maxLtv) &&
      (!selectedBorrowerTypeLabel ||
        splitProductValues(product.eligibleBorrowerTypes).includes(
          selectedBorrowerTypeLabel,
        )) &&
      (!filters.propertyType ||
        product.eligiblePropertyTypes.includes(filters.propertyType)) &&
      (!filters.purpose || product.eligiblePurposes.includes(filters.purpose))
    );
  });
  const lenderOptions = Array.from(
    new Set(allProducts.map((product) => product.lender)),
  ).sort((a, b) => a.localeCompare(b));
  const loanTypeOptions = Array.from(
    new Set(allProducts.map((product) => product.loanType)),
  ).sort((a, b) => a.localeCompare(b));
  const borrowerTypeOptions = Object.values(BorrowerType).map((value) => ({
    label: borrowerTypeLabels[value],
    value,
  }));
  const propertyTypeOptions = splitOptions(
    allProducts.map((product) => product.eligiblePropertyTypes),
  );
  const purposeOptions = splitOptions(
    allProducts.map((product) => product.eligiblePurposes),
  );
  const resultItems: LoanProductListItem[] = products.map((product) => ({
    description: product.description,
    eligibleBorrowerTypes: product.eligibleBorrowerTypes,
    eligiblePropertyTypes: product.eligiblePropertyTypes,
    eligiblePurposes: product.eligiblePurposes,
    id: product.id,
    lender: product.lender,
    loanSubtype: product.loanSubtype,
    loanType: product.loanType,
    maxLtv: product.maxLtv.toString(),
    minFico: product.minFico,
  }));

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
          Reference
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
          Loan Terms Library
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
          Search educational loan product references by credit, LTV, occupancy,
          property type, and purpose.
        </p>
      </div>

      <div className="rounded-md border border-mafi-border bg-mafi-bg-light px-4 py-3 text-sm text-mafi-text-dark">
        This library is an educational reference only. It is not a quoting tool
        - always confirm current program details and eligibility with a Licensed
        Loan Originator.
      </div>

      <Card className="border-mafi-border bg-mafi-bg-off">
        <CardContent className="pt-5">
          <form className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            <FilterSelect
              label="Lender"
              name="lender"
              options={lenderOptions}
              value={filters.lender}
            />
            <FilterSelect
              label="Loan Type"
              name="loanType"
              options={loanTypeOptions}
              value={filters.loanType}
            />
            <div className="space-y-1">
              <label
                className="text-xs font-semibold uppercase text-mafi-text-mid"
                htmlFor="minFico"
              >
                Min FICO
              </label>
              <Input
                defaultValue={filters.minFico ?? ""}
                id="minFico"
                min={0}
                name="minFico"
                placeholder="Show min <= score"
                type="number"
              />
            </div>
            <div className="space-y-1">
              <label
                className="text-xs font-semibold uppercase text-mafi-text-mid"
                htmlFor="maxLtv"
              >
                Max LTV
              </label>
              <Input
                defaultValue={filters.maxLtv ?? ""}
                id="maxLtv"
                min={0}
                name="maxLtv"
                placeholder="Show max >= LTV"
                step="0.01"
                type="number"
              />
            </div>
            <FilterSelect
              label="Borrower Type"
              name="borrowerType"
              options={borrowerTypeOptions}
              value={filters.borrowerType}
            />
            <FilterSelect
              label="Property Type"
              name="propertyType"
              options={propertyTypeOptions}
              value={filters.propertyType}
            />
            <FilterSelect
              label="Purpose"
              name="purpose"
              options={purposeOptions}
              value={filters.purpose}
            />
            <div className="flex items-end gap-2">
              <button
                className="h-10 rounded-md bg-mafi-blue-primary px-4 text-sm font-semibold text-white hover:bg-mafi-blue-dark"
                type="submit"
              >
                Apply filters
              </button>
              <Link
                className="inline-flex h-10 items-center rounded-md border border-mafi-border bg-white px-4 text-sm font-semibold text-mafi-text-dark hover:bg-mafi-bg-lighter"
                href="/loan-terms-library"
              >
                Clear
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-mafi-text-dark">Results</h2>
        <p className="text-sm text-mafi-text-mid">
          {products.length} product{products.length === 1 ? "" : "s"}
        </p>
      </div>

      <LoanProductResults products={resultItems} />
    </main>
  );
}

function FilterSelect({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: keyof LoanTermsSearchParams;
  options: Array<string | { label: string; value: string }>;
  value?: string;
}) {
  return (
    <div className="space-y-1">
      <label
        className="text-xs font-semibold uppercase text-mafi-text-mid"
        htmlFor={name}
      >
        {label}
      </label>
      <select
        className="h-10 w-full rounded-md border border-mafi-border bg-white px-3 text-sm text-mafi-text-dark"
        defaultValue={value ?? ""}
        id={name}
        name={name}
      >
        <option value="">All</option>
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;

          return (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
          );
        })}
      </select>
    </div>
  );
}
