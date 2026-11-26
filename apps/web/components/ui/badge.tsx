import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "danger" | "energy";

const toneClass: Record<Tone, string> = {
  info: "bg-info-bg text-info",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-[#8a5a10]",
  danger: "bg-danger-bg text-danger",
  energy: "bg-teal-100 text-teal-600",
};

export function Badge({
  tone = "info",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-3 py-1 font-body text-[13px] font-bold",
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
