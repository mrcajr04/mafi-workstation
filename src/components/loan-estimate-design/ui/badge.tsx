import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "gold" | "navy" | "teal" | "muted" | "danger";

const tones: Record<BadgeTone, string> = {
  gold: "bg-[var(--le-gold-soft)] text-[var(--le-gold)]",
  navy: "bg-[var(--le-navy-soft)] text-[var(--le-navy)]",
  teal: "bg-[#dff3ef] text-[var(--le-teal)]",
  muted: "bg-[var(--le-panel)] text-[var(--le-muted)]",
  danger: "bg-[#f8e2df] text-[var(--le-danger)]",
};

export function Badge({
  className,
  tone = "muted",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "loan-estimate-badge inline-flex items-center gap-1 rounded-full border border-transparent px-1.5 py-0.5 text-[length:var(--type-xs)] font-bold uppercase",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
