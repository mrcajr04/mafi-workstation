"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { DuplicatePropertyContact } from "@/lib/duplicate-property-contacts";

type PropertyDuplicateNoticeProps = {
  matches: DuplicatePropertyContact[];
};

export function PropertyDuplicateNotice({
  matches,
}: PropertyDuplicateNoticeProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isViewingNames, setIsViewingNames] = useState(false);

  if (!matches.length || isDismissed) {
    return null;
  }

  return (
    <div className="rounded-md border border-mafi-gold-light bg-mafi-gold-light/30 px-3 py-2 text-sm text-mafi-text-dark">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p>
            Heads up: {matches.length} other prospect
            {matches.length === 1 ? "" : "s"} have shown interest in this same
            property.{" "}
            <button
              className="font-semibold text-mafi-blue-primary hover:text-mafi-blue-dark"
              onClick={() => setIsViewingNames((current) => !current)}
              type="button"
            >
              View
            </button>
          </p>
          {isViewingNames ? (
            <div className="mt-2 rounded-md border border-mafi-border bg-white px-3 py-2 shadow-sm">
              <p className="mb-1 text-xs font-semibold uppercase text-mafi-text-light">
                Matching prospects
              </p>
              <ul className="space-y-1">
                {matches.map((match) => (
                  <li className="text-sm text-mafi-text-dark" key={match.id}>
                    {match.prospectName}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <button
          aria-label="Dismiss duplicate property notice"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-mafi-text-mid hover:bg-white/60 hover:text-mafi-text-dark"
          onClick={() => setIsDismissed(true)}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
