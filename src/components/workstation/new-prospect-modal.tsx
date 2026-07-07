"use client";

import { UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  ProspectIntakeForm,
  ProspectIntakeInitialData,
} from "@/components/workstation/prospect-intake-form";
import { getProspectIntakeEditData } from "@/lib/actions/contact-actions";
import { cn } from "@/lib/utils";

type NewProspectModalProps = {
  contactId?: string;
  initialData?: ProspectIntakeInitialData;
  onOptimisticSaved?: (form: ProspectIntakeInitialData) => void;
  trigger?: (open: () => void) => ReactNode;
};

export function NewProspectModal({
  contactId,
  initialData,
  onOptimisticSaved,
  trigger,
}: NewProspectModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loadedData, setLoadedData] = useState(initialData);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = Boolean(initialData || contactId);

  function openModal() {
    setIsLoading(Boolean(contactId && loadedData?.contactId !== contactId));
    setLoadError("");
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

  useEffect(() => {
    if (!isOpen || !contactId || loadedData?.contactId === contactId) {
      return;
    }

    let isCurrent = true;

    getProspectIntakeEditData(contactId).then((result) => {
      if (!isCurrent) {
        return;
      }

      if (!result.success) {
        setLoadError(result.error);
        setIsLoading(false);
        return;
      }

      setLoadedData(result.data);
      setIsLoading(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [contactId, isOpen, loadedData?.contactId]);

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
          <section
            className={cn(
              "relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-lg border border-mafi-border bg-mafi-bg-off shadow-2xl",
              isEditMode ? "max-w-5xl" : "max-w-3xl",
            )}
          >
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
                {loadedData?.createdOnLabel ? (
                  <p className="mt-1 text-xs text-mafi-text-light">
                    Created on {loadedData.createdOnLabel}
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
              {isLoading ? (
                <div className="py-16 text-center text-sm text-mafi-text-mid">
                  Loading prospect details...
                </div>
              ) : loadError ? (
                <div className="py-16 text-center text-sm text-destructive">
                  {loadError}
                </div>
              ) : (
                <ProspectIntakeForm
                  dense
                  initialData={loadedData}
                  key={loadedData?.contactId ?? "new-prospect"}
                  onCancel={() => setIsOpen(false)}
                  onOptimisticSaved={(form) => {
                    if (loadedData?.contactId) {
                      onOptimisticSaved?.({
                        ...form,
                        contactId: loadedData.contactId,
                      });
                    }
                  }}
                  onSaved={() => {
                    setIsOpen(false);
                    router.refresh();
                  }}
                />
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
