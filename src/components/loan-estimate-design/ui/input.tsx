import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-7 w-full rounded-md border border-[var(--le-line)] bg-white px-2 text-[length:var(--type-sm)] text-[var(--le-ink)] shadow-sm transition focus:border-[var(--le-blue)] focus:outline-none focus:ring-2 focus:ring-[rgb(49_95_190_/_0.16)] disabled:cursor-not-allowed disabled:border-[var(--le-navy-soft)] disabled:bg-[var(--le-panel)] disabled:text-[var(--le-subtle)]",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
