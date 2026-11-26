import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-glow-blue hover:bg-primary-hover",
  accent: "bg-accent text-white shadow-glow-coral hover:bg-accent-hover",
  secondary: "border border-border bg-card text-heading shadow-sm hover:bg-sunken",
  ghost: "bg-transparent text-heading hover:bg-sunken",
};

const sizeClass: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-pill font-body font-bold",
        "transition-[transform,box-shadow,background] duration-base ease-future",
        "hover:-translate-y-px active:scale-[0.97]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
