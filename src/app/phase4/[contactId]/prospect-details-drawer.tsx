"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export function ProspectDetailsDrawer({
  children,
  trigger,
}: {
  children: ReactNode;
  trigger: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        className="hidden text-left text-3xl font-bold text-mafi-text-dark underline-offset-4 hover:text-mafi-blue-primary hover:underline md:inline"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {trigger}
      </button>

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 hidden md:block"
          role="dialog"
        >
          <button
            aria-label="Close prospect details"
            className="absolute inset-0 bg-black/35"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-mafi-border bg-mafi-bg-off shadow-xl">
            <div className="flex items-center justify-between border-b border-mafi-border bg-mafi-bg-light px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
                  Reference
                </p>
                <h2 className="text-lg font-bold text-mafi-text-dark">
                  Prospect Details
                </h2>
              </div>
              <button
                aria-label="Close prospect details"
                className="inline-flex size-9 items-center justify-center rounded-md text-mafi-text-mid hover:bg-white hover:text-mafi-blue-primary"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid gap-4">{children}</div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
