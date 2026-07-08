"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

export function MobileCollapsibleSummary({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        className="flex w-full items-center justify-between gap-3 border-b border-mafi-border bg-mafi-bg-light px-6 py-3 text-left md:pointer-events-none"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="text-base font-semibold text-mafi-blue-primary">
          {title}
        </span>
        <ChevronDown
          className={`size-4 text-mafi-blue-primary transition md:hidden ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={
          isOpen
            ? "grid gap-3 p-6 pt-4 md:grid"
            : "hidden md:grid md:gap-3 md:p-6 md:pt-4"
        }
      >
        {children}
      </div>
    </div>
  );
}
