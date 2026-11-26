"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem = { label: ReactNode; value: string };

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem[];
  value: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-6 border-b border-border font-body", className)}>
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange?.(t.value)}
            className={cn(
              "border-b-2 px-0 py-3 text-[15px] font-bold transition-colors duration-fast ease-future",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-body"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
