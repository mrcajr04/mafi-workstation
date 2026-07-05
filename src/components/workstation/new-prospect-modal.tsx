"use client";

import { UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  ProspectIntakeForm,
  ProspectIntakeInitialData,
} from "@/components/workstation/prospect-intake-form";
import { cn } from "@/lib/utils";

type NewProspectModalProps = {
  initialData?: ProspectIntakeInitialData;
  onOptimisticSaved?: (form: ProspectIntakeInitialData) => void;
  trigger?: (open: () => void) => ReactNode;
};

export function NewProspectModal({
  initialData,
  onOptimisticSaved,
  trigger,
}: NewProspectModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = Boolean(initialData);

  function openModal() {
    setIsOpen(true);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <>
      {trigger ? (
        trigger(openModal)
      ) : (
        <button
          className={cn(buttonVariants({ size: "lg" }), "min-h-11 gap-2 whitespace-nowrap px-4")}
          onClick={openModal}
          type="button"
        >
          <UserPlus className="size-4" />
          New Prospect
        </button>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-mafi-text-dark/45 p-3 backdrop-blur-md sm:p-5">
          <button
            aria-label="Close new prospect modal"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <section className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-mafi-border bg-mafi-bg-off shadow-2xl">
            <header className="flex shrink-0 items-center justify-between border-b border-mafi-border bg-mafi-bg-light px-4 py-3">
              <div>
                <h2 className="text-xl font-bold text-mafi-text-dark">
                  {isEditMode ? "Edit Prospect" : "New Prospect"}
                </h2>
                <p className="text-xs text-mafi-text-mid">
                  {isEditMode
                    ? "Review and update the prospect details."
                    : "Capture the prospect details needed for Phase 1-2."}
                </p>
                {initialData?.createdOnLabel ? (
                  <p className="mt-1 text-xs text-mafi-text-light">
                    Created on {initialData.createdOnLabel}
                  </p>
                ) : null}
              </div>
              <button
                aria-label="Close"
                className="inline-flex size-9 items-center justify-center rounded-md text-mafi-text-dark hover:bg-mafi-bg-lighter"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="overflow-y-auto p-3 pb-0 sm:p-4 sm:pb-0">
              <ProspectIntakeForm
                dense
                initialData={initialData}
                key={initialData?.contactId ?? "new-prospect"}
                onCancel={() => setIsOpen(false)}
                onOptimisticSaved={(form) => {
                  if (initialData?.contactId) {
                    onOptimisticSaved?.({
                      ...form,
                      contactId: initialData.contactId,
                    });
                  }
                }}
                onSaved={() => {
                  setIsOpen(false);
                  router.refresh();
                }}
              />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
