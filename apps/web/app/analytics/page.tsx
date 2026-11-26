"use client";

import { useMemo, useState } from "react";
import { useCategoryIcons } from "../components/ds/category-icon";
import { computeViewModel } from "../components/pages/analysis-data";
import { AnalysisSections, PeriodControls } from "../components/pages/analysis-sections";

export default function AnalyticsPage() {
  const [unit, setUnit] = useState<"month" | "year">("month");
  const [month, setMonth] = useState("2026-11");
  const [year, setYear] = useState("2026");
  const [filter, setFilter] = useState("all");
  const { kStored, kMap } = useCategoryIcons();

  const vm = useMemo(
    () => computeViewModel({ unit, month, year, filter, kMap, kStored }),
    [unit, month, year, filter, kMap, kStored]
  );

  return (
    <main className="flex min-w-0 flex-[999_1_520px] flex-col gap-5 px-7 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[28px] leading-snug">分析</h1>
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
    </main>
  );
}
