"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarDays,
  ChartColumn,
  LayoutDashboard,
  List,
  Plus,
  Tag,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/entry", label: "記録", icon: Plus },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/history", label: "履歴", icon: List },
  { href: "/analytics", label: "分析", icon: ChartColumn },
  { href: "/import", label: "CSV取込", icon: Upload },
  { href: "/categories", label: "カテゴリ設定", icon: Tag },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-dvh items-start bg-page">
      <nav
        aria-label="メイン"
        className="flex w-[220px] max-w-full shrink-0 flex-col gap-1 border-r border-border bg-card px-4 py-6"
      >
        <div className="px-3 pb-5 font-display text-[22px] font-extrabold text-heading">
          家計簿
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-sm px-3 text-sm no-underline",
                active
                  ? "bg-blue-100 font-bold text-blue-700"
                  : "font-medium text-body hover:bg-sunken"
              )}
            >
              <Icon size={20} strokeWidth={2} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="flex min-w-0 flex-1 flex-wrap items-start">{children}</div>
    </div>
  );
}
