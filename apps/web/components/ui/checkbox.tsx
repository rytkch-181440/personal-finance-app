"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({
  label,
  checked = false,
  onChange,
  disabled = false,
  className,
}: {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [c, setC] = useState(checked);
  useEffect(() => setC(checked), [checked]);
  const toggle = () => {
    if (disabled) return;
    const v = !c;
    setC(v);
    onChange?.(v);
  };
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2.5 font-body text-[15px] text-body",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className
      )}
    >
      <span
        role="checkbox"
        aria-checked={c}
        onClick={toggle}
        className={cn(
          "inline-flex size-5 items-center justify-center rounded-sm transition-colors duration-fast ease-future",
          c ? "border-none bg-primary" : "border-[1.5px] border-border-strong bg-card"
        )}
      >
        {c && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2 6L4.5 8.5L10 3"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}
