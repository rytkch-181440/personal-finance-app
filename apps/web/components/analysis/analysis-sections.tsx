"use client";

import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { iconFor } from "@/components/categories/category-icon";
import type { ViewModel } from "@/lib/analysis/analysis-data";

export function PeriodControls({
  vm,
  unit,
  month,
  year,
  onUnitChange,
  onMonthChange,
  onYearChange,
}: {
  vm: ViewModel;
  unit: "month" | "year";
  month: string;
  year: string;
  onUnitChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="w-[140px]">
        <Tabs
          tabs={[
            { label: "月", value: "month" },
            { label: "年", value: "year" },
          ]}
          value={unit}
          onChange={onUnitChange}
        />
      </div>
      <div className="w-[200px]">
        <Select
          aria-label="期間"
          options={unit === "month" ? vm.monthOptions : vm.yearOptions}
          value={unit === "month" ? month : year}
          onChange={(e) =>
            unit === "month" ? onMonthChange(e.target.value) : onYearChange(e.target.value)
          }
        />
      </div>
    </div>
  );
}

export function AnalysisSections({
  vm,
  kMap,
  onFilterChange,
}: {
  vm: ViewModel;
  kMap: Record<string, string>;
  onFilterChange: (value: string) => void;
}) {
  return (
    <>
      <section aria-label="AIによる分析">
        <Card eyebrow="AI INSIGHT" title={vm.periodLabel + "の振り返り"}>
          <div className="mt-3 flex flex-col gap-3.5">
            <div className="flex items-start gap-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Sparkles size={20} aria-hidden="true" />
              </div>
              <div className="flex min-w-0 flex-col gap-2.5">
                {vm.insights.map((t, i) => (
                  <p key={i} className="text-[15px] leading-[1.8] text-heading">
                    {t}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
              <Badge tone="info">AIが自動生成</Badge>
              <span className="flex-1 basis-[200px] text-xs leading-normal text-muted">
                数値は記録データから集計しています。期間やカテゴリを変えると、文章も更新されます。
              </span>
              <Button variant="secondary" size="sm">
                もう一度分析する
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <section
        aria-label="サマリー"
        className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-4"
      >
        <Card eyebrow={vm.incLabel} title={vm.incTotal} />
        <Card eyebrow={vm.expLabel} title={vm.expTotal} />
        <Card eyebrow={vm.netLabel} title={vm.netTotal} />
      </section>

      <section id="analysis" aria-label="グラフ" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-wide text-muted">
            グラフの絞り込み（カテゴリ）
          </span>
          <div className="flex flex-wrap gap-2">
            {vm.filterTags.map((f) => (
              <Tag
                key={f.label}
                selected={f.selected}
                onClick={() => onFilterChange(f.label === "全体" ? "all" : f.label)}
              >
                <span className="inline-flex items-center gap-1.5">
                  {f.icon && <f.icon size={16} aria-hidden="true" />}
                  {f.label}
                </span>
              </Tag>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
          <Card eyebrow="TREND" title={vm.chartTitle}>
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex gap-4 text-xs">
                {vm.showIncLegend && (
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-[3px] bg-blue-600" />
                    収入
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-[3px] bg-coral-500" />
                  {vm.expLegend}
                </span>
              </div>
              <div
                role="img"
                aria-label={vm.chartAria}
                className="flex h-40 items-end border-b border-border-strong px-1"
              >
                {vm.bars.map((b, i) => (
                  <div
                    key={i}
                    className="flex h-full flex-1 items-end justify-center gap-[3px]"
                  >
                    <div
                      className="rounded-t-[4px] bg-blue-600"
                      style={{ width: b.incW, height: b.incH }}
                    />
                    <div
                      className="w-4 rounded-t-[4px] bg-coral-500"
                      style={{ height: b.expH }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex px-1">
                {vm.bars.map((b, i) => (
                  <span
                    key={i}
                    className="flex-1 text-center font-numeral text-xs"
                    style={{ fontWeight: b.weight }}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
              <p className="text-xs leading-normal text-muted">{vm.chartNote}</p>
            </div>
          </Card>

          <Card eyebrow="BREAKDOWN" title={vm.pieTitle}>
            <div className="mt-3 flex flex-wrap items-center gap-5">
              <div
                className="relative size-[150px] shrink-0 rounded-full"
                style={{ background: vm.pieGradient }}
              >
                <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-card text-center">
                  <span className="text-xs text-muted">{vm.pieCenterLabel}</span>
                  <span className="font-numeral text-[15px] font-bold text-heading">
                    {vm.pieCenterValue}
                  </span>
                </div>
              </div>
              <div className="flex min-w-[180px] flex-1 flex-col">
                {vm.slices.map((s, i) => (
                  <div
                    key={i}
                    className="flex min-h-10 items-center gap-2.5 border-t border-border"
                  >
                    <span
                      className="size-3 shrink-0 rounded-[3px]"
                      style={{ background: s.color }}
                    />
                    <span className="flex-1 text-sm text-heading">{s.label}</span>
                    <span className="font-numeral text-sm font-semibold text-heading">
                      {s.amount}
                    </span>
                    <span className="w-[46px] text-right font-numeral text-xs text-muted">
                      {s.pct}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {vm.showDiff && (
          <Card eyebrow="VS LAST MONTH" title="先月の同日との差（11/24時点）">
            <div className="mt-3 flex flex-col">
              {vm.diffs.map((d) => {
                const Icon = iconFor(d.label, kMap);
                return (
                  <div
                    key={d.label}
                    className="flex min-h-12 items-center justify-between gap-3 border-t border-border"
                  >
                    <span className="flex items-center gap-2 text-sm text-heading">
                      <Icon size={16} aria-hidden="true" />
                      {d.label}
                    </span>
                    <Badge tone={d.tone}>{d.amount}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </section>
    </>
  );
}
