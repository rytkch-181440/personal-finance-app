import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tag({
  selected = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center rounded-pill border px-3.5 py-1.5 font-body text-[13px] font-semibold",
        "transition-colors duration-fast ease-future",
        selected
          ? "border-primary bg-blue-100 text-primary"
          : "border-border bg-card text-body",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
