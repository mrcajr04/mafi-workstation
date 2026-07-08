import { cn } from "@/lib/utils";

export type StatusBadgeTone =
  | "danger"
  | "muted"
  | "neutral"
  | "success"
  | "warning";

type StatusBadgeProps = {
  children?: React.ReactNode;
  className?: string;
  label?: string;
  title?: string;
  tone?: StatusBadgeTone;
};

const toneClasses: Record<StatusBadgeTone, string> = {
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
  muted: "border-mafi-border bg-mafi-bg-lighter text-mafi-text-light",
  neutral: "border-mafi-border bg-mafi-bg-light text-mafi-blue-primary",
  success: "border-mafi-status-green bg-mafi-status-green/15 text-mafi-text-dark",
  warning: "border-mafi-gold bg-mafi-gold-light/45 text-mafi-gold-dark",
};

export function StatusBadge({
  children,
  className,
  label,
  title,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border px-2 py-1 text-[11px] font-semibold leading-none",
        toneClasses[tone],
        className,
      )}
      title={title}
    >
      <span className="truncate">{children ?? label}</span>
    </span>
  );
}
