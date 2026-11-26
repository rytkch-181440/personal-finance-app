import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SelectOption = { label: string; value: string };

export function Select({
  label,
  options = [],
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode;
  options?: SelectOption[];
}) {
  return (
    <label className={cn("flex w-full flex-col gap-1.5 font-body", className)}>
      {label && <span className="text-[13px] font-semibold text-heading">{label}</span>}
      <select
        className={cn(
          "w-full appearance-none rounded-sm border border-border bg-card px-4 py-3 font-body text-base text-body outline-none",
          "disabled:bg-sunken disabled:text-muted"
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
