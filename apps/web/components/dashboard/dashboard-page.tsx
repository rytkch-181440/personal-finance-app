"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag as FilterTag } from "@/components/ui/tag";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { useCategoryIcons } from "@/components/categories/category-icon";
import { computeViewModel } from "@/lib/analysis/analysis-data";
import { AnalysisSections, PeriodControls } from "@/components/analysis/analysis-sections";

export function DashboardPage() {
  const [unit, setUnit] = useState<"month" | "year">("month");
  const [month, setMonth] = useState("2026-11");
  const [year, setYear] = useState("2026");
  const [filter, setFilter] = useState("all");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("1280");
  const [cat, setCat] = useState("食費");
  const [saved, setSaved] = useState(false);
  const { kStored, kMap } = useCategoryIcons();

  const vm = useMemo(
    () => computeViewModel({ unit, month, year, filter, kMap, kStored, type, cat }),
    [unit, month, year, filter, kMap, kStored, type, cat]
  );

  return (
    <>
      <main className="flex min-w-0 flex-[999_1_520px] flex-col gap-5 px-7 py-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[28px] leading-snug">ダッシュボード</h1>
          <PeriodControls
            vm={vm}
            unit={unit}
            month={month}
            year={year}
            onUnitChange={(v) => setUnit(v as "month" | "year")}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />
        </header>

        <AnalysisSections vm={vm} kMap={kMap} onFilterChange={setFilter} />

        <section id="recent" aria-label="最近の記録">
          <Card eyebrow="RECENT" title="最近の記録">
            <div className="mt-2 flex flex-col">
              {vm.recent.map((r, i) => (
                <div
                  key={i}
                  className="grid min-h-12 grid-cols-[72px_130px_minmax(0,1fr)_auto] items-center gap-3 border-t border-border"
                >
                  <span className="font-numeral text-[13px] text-muted">{r.date}</span>
                  <span className="flex items-center gap-2 text-[13px] text-body">
                    <r.Icon size={16} aria-hidden="true" />
                    {r.cat}
                  </span>
                  <span className="text-sm font-medium text-heading">{r.memo}</span>
                  <span
                    className="font-numeral text-base font-semibold"
                    style={{ color: r.color }}
                  >
                    {r.amount}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>

      <aside
        aria-label="かんたん記録"
        className="w-full min-w-0 max-w-[380px] flex-1 basis-80 px-7 pb-6 pt-6 pr-7"
      >
        <Card eyebrow="QUICK ENTRY" title="かんたん記録">
          <div className="mt-3 flex flex-col gap-4">
            <Tabs
              tabs={vm.quickTabs}
              value={type}
              onChange={(v) => {
                setType(v as "expense" | "income");
                setCat(v === "expense" ? "食費" : "給与");
                setSaved(false);
              }}
            />
            <Input
              label="金額（円）"
              placeholder="0"
              inputMode="numeric"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))
              }
            />
            <div className="flex flex-wrap gap-2">
              {vm.quickCats.map((c) => (
                <FilterTag
                  key={c.label}
                  selected={c.selected}
                  onClick={() => {
                    setCat(c.label);
                    setSaved(false);
                  }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <c.Icon size={16} aria-hidden="true" />
                    {c.label}
                  </span>
                </FilterTag>
              ))}
            </div>
            <Input label="メモ（任意）" placeholder="例: ランチ" />
            <div className="flex items-center justify-between gap-2">
              <FilterTag>今日 11/24(火)</FilterTag>
              {saved && <Badge tone="success">記録しました</Badge>}
            </div>
            <Button
              variant="primary"
              size="lg"
              disabled={amount === ""}
              onClick={() => {
                setAmount("");
                setSaved(true);
              }}
              className="w-full"
            >
              {vm.saveLabel}
            </Button>
          </div>
        </Card>
      </aside>
    </>
  );
}
