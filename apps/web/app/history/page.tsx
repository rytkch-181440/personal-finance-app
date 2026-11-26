"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { CatIcon, loadStoredCats, KN, type StoredCats } from "@/components/categories/category-icon";

const yen = (n: number) => "¥" + Math.abs(n).toLocaleString("ja-JP");

type Row = { memo: string; cat: string; type: "expense" | "income"; amt: number };
type DayGroup = { date: string; rows: Row[] };

const DAYS: DayGroup[] = [
  { date: "11/24(火)", rows: [
    { memo: "ランチ", cat: "食費", type: "expense", amt: 980 },
    { memo: "ドラッグストア", cat: "日用品", type: "expense", amt: 1860 },
  ]},
  { date: "11/23(月・祝)", rows: [
    { memo: "映画", cat: "娯楽", type: "expense", amt: 2000 },
    { memo: "スーパー", cat: "食費", type: "expense", amt: 4320 },
  ]},
  { date: "11/22(日)", rows: [
    { memo: "ICチャージ", cat: "交通", type: "expense", amt: 3000 },
    { memo: "外食", cat: "食費", type: "expense", amt: 4000 },
  ]},
  { date: "11/21(土)", rows: [
    { memo: "スーパー", cat: "食費", type: "expense", amt: 4830 },
  ]},
  { date: "11/20(金)", rows: [
    { memo: "水道", cat: "住居・光熱", type: "expense", amt: 4000 },
    { memo: "イベント", cat: "娯楽", type: "expense", amt: 4510 },
  ]},
  { date: "11/19(木)", rows: [
    { memo: "動画配信", cat: "娯楽", type: "expense", amt: 1490 },
    { memo: "カフェ", cat: "食費", type: "expense", amt: 560 },
  ]},
  { date: "11/18(水)", rows: [
    { memo: "原稿料", cat: "副収入", type: "income", amt: 18000 },
    { memo: "ICチャージ", cat: "交通", type: "expense", amt: 1400 },
    { memo: "美容院", cat: "衣服・美容", type: "expense", amt: 3000 },
  ]},
];

function toKMap(tree: StoredCats | null) {
  const map: Record<string, string> = {};
  if (tree)
    (["expense", "income"] as const).forEach((k) =>
      tree[k].forEach((p) => {
        if (p.icon) map[p.name] = p.icon;
        (p.children ?? []).forEach((c) => {
          if (c.icon) map[c.name] = c.icon;
        });
      })
    );
  return map;
}

export default function HistoryPage() {
  const [tree] = useState<StoredCats | null>(() => loadStoredCats());
  const kMap = toKMap(tree);
  const [filter, setFilter] = useState("all");

  const groups = DAYS.map((d) => ({
    date: d.date,
    rows: d.rows.filter((r) => filter === "all" || r.type === filter),
  }))
    .filter((d) => d.rows.length > 0)
    .map((d) => {
      const sum = d.rows.reduce((a, r) => a + (r.type === "income" ? r.amt : -r.amt), 0);
      return {
        date: d.date,
        total: (sum < 0 ? "−" : "+") + yen(sum),
        rows: d.rows,
      };
    });

  return (
    <>
      <main
        style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20, padding: "24px 28px", boxSizing: "border-box" }}
      >
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.25 }}>履歴</h1>
          <div style={{ width: 200 }}>
            <Select
              options={[
                { label: "2026年11月", value: "2026-11" },
                { label: "2026年10月", value: "2026-10" },
                { label: "2026年9月", value: "2026-09" },
              ]}
              defaultValue="2026-11"
            />
          </div>
        </header>

        <section
          aria-label="今月のサマリー"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", gap: 16 }}
        >
          <Card eyebrow="11月の収入" title="¥330,400" />
          <Card eyebrow="11月の支出" title="¥213,020" />
          <Card eyebrow="11月の収支" title="+¥117,380" />
        </section>

        <div style={{ width: 320, maxWidth: "100%" }}>
          <Tabs
            tabs={[
              { label: "すべて", value: "all" },
              { label: "支出", value: "expense" },
              { label: "収入", value: "income" },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <section
          aria-label="記録の一覧"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", gap: 20, alignItems: "start" }}
        >
          {groups.map((g) => (
            <div key={g.date} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 4px" }}>
                <h2 style={{ margin: 0, fontFamily: "var(--font-numeral)", fontSize: 14, fontWeight: 600, letterSpacing: "var(--ls-wide)", color: "var(--text-body)" }}>
                  {g.date}
                </h2>
                <span style={{ fontFamily: "var(--font-numeral)", fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>
                  {g.total}
                </span>
              </div>
              <Card flat>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {g.rows.map((r, i) => {
                    const color = r.type === "income" ? "var(--blue-600)" : "var(--text-heading)";
                    return (
                      <div
                        key={i}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 56, padding: "6px 0", borderTop: "1px solid var(--border-default)" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                          <span
                            style={{
                              width: 36,
                              height: 36,
                              flex: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "var(--radius-circle)",
                              background: "var(--blue-100)",
                              color: "var(--blue-700)",
                            }}
                          >
                            <CatIcon name={r.cat} kMap={kMap} size={18} />
                          </span>
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-heading)" }}>{r.memo}</span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.cat}</span>
                          </div>
                        </div>
                        <span style={{ fontFamily: "var(--font-numeral)", fontSize: 16, fontWeight: 600, color }}>
                          {r.type === "income" ? "+" : "−"}{yen(r.amt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
