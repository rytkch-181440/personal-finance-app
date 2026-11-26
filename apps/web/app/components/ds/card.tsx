import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  eyebrow,
  title,
  description,
  footer,
  flat = false,
  className,
  children,
}: {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  flat?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-card bg-card p-8 font-body",
        flat ? "border border-border shadow-none" : "shadow-md",
        className
      )}
    >
      {eyebrow && (
        <span className="font-numeral text-xs font-bold tracking-wider text-primary uppercase">
          {eyebrow}
        </span>
      )}
      {title && <h3 className="font-display text-[22px] text-heading">{title}</h3>}
      {description && <p className="text-[15px] leading-normal text-muted">{description}</p>}
      {children}
      {footer && <div className="mt-2">{footer}</div>}
    </div>
  );
}
