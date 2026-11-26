"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Input({
  label,
  error,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  error?: ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label className={cn("flex w-full flex-col gap-1.5 font-body", className)}>
      {label && <span className="text-[13px] font-semibold text-heading">{label}</span>}
      <input
        id={id}
        className={cn(
          "w-full rounded-sm border bg-card px-4 py-3 font-body text-base text-body outline-none",
          "transition-shadow duration-fast ease-future",
          error
            ? "border-danger"
            : focused
              ? "border-border-focus shadow-(--focus-ring)"
              : "border-border",
          "disabled:bg-sunken disabled:text-muted"
        )}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}
