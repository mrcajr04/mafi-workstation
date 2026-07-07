"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatRatioPercentDisplay } from "@/lib/currency";
import { cn } from "@/lib/utils";

export type LoanProductListItem = {
  description: string;
  eligibleBorrowerTypes: string;
  eligiblePropertyTypes: string;
  eligiblePurposes: string;
  id: string;
  lender: string;
  loanSubtype: string | null;
  loanType: string;
  maxLtv: string;
  minFico: number;
};

type LoanProductResultsProps = {
  products: LoanProductListItem[];
};

export function LoanProductResults({ products }: LoanProductResultsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!products.length) {
    return (
      <div className="rounded-md border border-mafi-border bg-mafi-bg-white px-6 py-10 text-center text-sm text-mafi-text-mid">
        No loan products match those filters.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {products.map((product) => (
          <LoanProductMobileCard
            isExpanded={expandedId === product.id}
            key={product.id}
            onToggle={() =>
              setExpandedId((currentId) =>
                currentId === product.id ? null : product.id,
              )
            }
            product={product}
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-md border border-mafi-border bg-mafi-bg-white md:block">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.65fr)_minmax(0,0.65fr)_minmax(0,0.75fr)] border-b border-mafi-border bg-mafi-bg-lighter text-sm font-semibold text-mafi-text-dark">
          <div className="px-4 py-3">Lender</div>
          <div className="px-4 py-3">Loan Type</div>
          <div className="px-4 py-3">Min FICO</div>
          <div className="px-4 py-3">Max LTV</div>
          <div className="px-4 py-3">Details</div>
        </div>
        {products.map((product) => (
          <div className="border-b border-mafi-border last:border-b-0" key={product.id}>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.65fr)_minmax(0,0.65fr)_minmax(0,0.75fr)] items-center text-sm">
              <div className="px-4 py-3 font-semibold text-mafi-text-dark">
                {product.lender}
              </div>
              <div className="px-4 py-3 text-mafi-text-mid">
                <p className="font-semibold text-mafi-text-dark">
                  {product.loanType}
                </p>
                <p className="text-xs text-mafi-text-light">
                  {product.loanSubtype || "General"}
                </p>
              </div>
              <div className="px-4 py-3 text-mafi-text-mid">
                {product.minFico || "No stated minimum"}
              </div>
              <div className="px-4 py-3 text-mafi-text-mid">
                {formatLtv(product.maxLtv)}
              </div>
              <div className="px-4 py-3">
                <Button
                  className="gap-1"
                  onClick={() =>
                    setExpandedId((currentId) =>
                      currentId === product.id ? null : product.id,
                    )
                  }
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ChevronRight
                    className={cn(
                      "size-4 transition",
                      expandedId === product.id && "rotate-90",
                    )}
                  />
                  View details
                </Button>
              </div>
            </div>
            {expandedId === product.id ? <LoanProductDetails product={product} /> : null}
          </div>
        ))}
      </div>
    </>
  );
}

function LoanProductMobileCard({
  isExpanded,
  onToggle,
  product,
}: {
  isExpanded: boolean;
  onToggle: () => void;
  product: LoanProductListItem;
}) {
  return (
    <div className="rounded-md border border-mafi-border bg-mafi-bg-white">
      <button
        className="w-full p-4 text-left"
        onClick={onToggle}
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-mafi-text-dark">
              {product.lender}
            </p>
            <p className="text-sm text-mafi-text-mid">
              {product.loanType}
              {product.loanSubtype ? ` / ${product.loanSubtype}` : ""}
            </p>
          </div>
          <ChevronRight
            className={cn("mt-1 size-4 shrink-0 transition", isExpanded && "rotate-90")}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Info label="Min FICO" value={product.minFico || "No stated minimum"} />
          <Info label="Max LTV" value={formatLtv(product.maxLtv)} />
        </div>
      </button>
      {isExpanded ? <LoanProductDetails product={product} /> : null}
    </div>
  );
}

function LoanProductDetails({ product }: { product: LoanProductListItem }) {
  return (
    <div className="space-y-4 border-t border-mafi-border bg-mafi-bg-off px-4 py-4 text-sm">
      <p className="leading-6 text-mafi-text-dark">{product.description}</p>
      <div className="grid gap-3 md:grid-cols-3">
        <Info label="Eligible borrower types" value={product.eligibleBorrowerTypes} />
        <Info label="Eligible property types" value={product.eligiblePropertyTypes} />
        <Info label="Eligible purposes" value={product.eligiblePurposes} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mafi-text-light">
        {label}
      </p>
      <p className="mt-1 text-mafi-text-dark">{value}</p>
    </div>
  );
}

function formatLtv(value: string) {
  return formatRatioPercentDisplay(value);
}
