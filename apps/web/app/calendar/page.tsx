"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { CatIcon, loadStoredCats, KN, type StoredCats } from "@/components/categories/category-icon";

const yen = (n: number) => "¥" + n.toLocaleString("ja-JP");
const signed = (n: number) => (n < 0 ? "−" : "+") + yen(Math.abs(n));

// [日, 種別(i=収入/e=支出), 大分類, 小分類(メモ兼用), 金額]
const ENTRIES: [number, "i" | "e", string, string, number][] = [
  [1, "e", "住居・光熱", "家賃", 82000],
  [2, "e", "食費", "スーパー", 5860],
  [3, "e", "日用品", "洗剤", 2480],
  [4, "e", "食費", "ランチ", 1100],
  [5, "e", "交通", "ICチャージ", 3000],
  [5, "e", "通信", "スマホ", 5480],
  [6, "e", "食費", "外食", 3480],
  [7, "e", "衣服・美容", "衣類", 8500],
  [7, "e", "通信", "インターネット", 3500],
  [8, "e", "食費", "スーパー", 6120],
  [8, "e", "娯楽", "本", 1800],
  [9, "e", "食費", "カフェ", 640],
  [10, "i", "給与", "11月分", 312400],
  [10, "e", "日用品", "日用品", 3200],
  [11, "e", "食費", "ランチ", 1250],
  [12, "e", "住居・光熱", "電気", 7200],
  [12, "e", "医療", "通院", 3200],
  [13, "e", "食費", "スーパー", 4980],
  [14, "e", "食費", "外食", 5200],
  [14, "e", "交通", "タクシー", 2400],
  [15, "e", "住居・光熱", "ガス", 4800],
  [15, "e", "娯楽", "ゲーム", 4500],
  [16, "e", "食費", "スーパー", 3900],
  [16, "e", "日用品", "雑貨", 5100],
  [17, "e", "食費", "ランチ", 980],
  [17, "e", "その他", "ギフト", 6400],
  [18, "i", "副収入", "原稿料", 18000],
  [18, "e", "交通", "ICチャージ", 1400],
  [18, "e", "衣服・美容", "美容院", 3000],
  [19, "e", "食費", "カフェ", 560],
  [19, "e", "娯楽", "動画配信", 1490],
  [20, "e", "住居・光熱", "水道", 4000],
  [20, "e", "娯楽", "イベント", 4510],
  [21, "e", "食費", "スーパー", 4830],
  [22, "e", "食費", "外食", 4000],
  [22, "e", "交通", "ICチャージ", 3000],
  [23, "e", "食費", "スーパー", 4320],
  [23, "e", "娯楽", "映画", 2000],
  [24, "e", "食費", "ランチ", 980],
  [24, "e", "日用品", "ドラッグストア", 1860],
];

const NAMES = ["日", "月", "火", "水", "木", "金", "土"];
const YEAR = 2026;
const MONTH = 10; // 11月
const FIRST = new Date(YEAR, MONTH, 1).getDay();
const DAYS_IN_MONTH = new Date(YEAR, MONTH + 1, 0).getDate();
const TODAY = 24;

function totalsOf(day: number) {
  return ENTRIES.filter((e) => e[0] === day).reduce(
    (a, e) => {
      if (e[1] === "i") a.inc += e[4];
      else a.exp += e[4];
      return a;
    },
    { inc: 0, exp: 0 }
  );
}

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

type Cell =
  | { blank: true }
  | {
      blank: false;
      n: number;
      inc: string;
      exp: string;
      label: string;
      selected: boolean;
      bg: string;
      ring: string;
      numBg: string;
      numFg: string;
    };

export default function CalendarPage() {
  const [tree] = useState<StoredCats | null>(() => loadStoredCats());
  const kMap = toKMap(tree);
  const [day, setDay] = useState(TODAY);

  const cells: Cell[] = [];
  for (let i = 0; i < FIRST; i++) cells.push({ blank: true });
  for (let d = 1; d <= DAYS_IN_MONTH; d++) {
    const t = totalsOf(d);
    const sel = d === day;
    cells.push({
      blank: false,
      n: d,
      inc: t.inc ? "+" + yen(t.inc) : "",
      exp: t.exp ? "−" + yen(t.exp) : "",
      label: `11月${d}日 ${NAMES[(FIRST + d - 1) % 7]}曜日 収入${yen(t.inc)} 支出${yen(t.exp)}`,
      selected: sel,
      bg: sel ? "var(--blue-100)" : d > TODAY ? "var(--surface-page)" : "var(--surface-card)",
      ring: sel ? "inset 0 0 0 2px var(--blue-600)" : "none",
      numBg: d === TODAY ? "var(--blue-600)" : "transparent",
      numFg: d === TODAY ? "#ffffff" : d > TODAY ? "var(--text-muted)" : "var(--text-heading)",
    });
  }
  while (cells.length % 7 !== 0) cells.push({ blank: true });

  const all = ENTRIES.reduce(
    (a, e) => {
      if (e[1] === "i") a.inc += e[4];
      else a.exp += e[4];
      return a;
    },
    { inc: 0, exp: 0 }
  );
  const dt = totalsOf(day);
  const dayEntries = ENTRIES.filter((e) => e[0] === day);

  return (
    <>
      <main
        style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20, padding: "24px 28px", boxSizing: "border-box" }}
      >
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.25 }}>カレンダー</h1>
          <div style={{ width: 180 }}>
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
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 16 }}
        >
          <Card eyebrow="収入" title={yen(all.inc)} />
          <Card eyebrow="支出" title={yen(all.exp)} />
          <Card eyebrow="収支" title={signed(all.inc - all.exp)} />
        </section>

        <section aria-label="月のカレンダー">
          <Card eyebrow="2026.11" title="日別の収支">
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }}>
                {NAMES.map((w) => (
                  <span key={w} style={{ padding: "4px 6px", fontSize: 12, fontWeight: 500, letterSpacing: "var(--ls-wide)", color: "var(--text-muted)" }}>
                    {w}
                  </span>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }}>
                {cells.map((c, i) => {
                  if (c.blank) return <div key={i} />;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDay(c.n)}
                      aria-label={c.label}
                      aria-pressed={c.selected}
                      style={{
                        minHeight: 100,
                        minWidth: 0,
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        gap: 4,
                        padding: 6,
                        border: "1px solid var(--border-default)",
                        borderRadius: "var(--radius-sm)",
                        background: c.bg,
                        boxShadow: c.ring,
                        fontFamily: "var(--font-numeral)",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "var(--radius-circle)",
                          background: c.numBg,
                          color: c.numFg,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {c.n}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--blue-700)" }}>{c.inc}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-heading)" }}>{c.exp}</span>
                    </button>
                  );
                })}
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.5, color: "var(--text-muted)" }}>
                青い数字が収入、黒い数字が支出です。日付を選ぶと、右に明細が表示されます。
              </p>
            </div>
          </Card>
        </section>
      </main>

      <aside
        aria-label="選んだ日の明細"
        style={{ flex: "1 1 320px", maxWidth: 380, minWidth: 0, padding: "24px 28px 24px 0", boxSizing: "border-box" }}
      >
        <Card eyebrow="DAY" title={`11/${day}(${NAMES[(FIRST + day - 1) % 7]})`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
              {[
                { label: "収入", value: yen(dt.inc), color: "var(--blue-700)", weight: 600 },
                { label: "支出", value: yen(dt.exp), color: "var(--text-heading)", weight: 600 },
                { label: "収支", value: signed(dt.inc - dt.exp), color: "var(--text-heading)", weight: 700 },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 12, letterSpacing: "var(--ls-wide)", color: "var(--text-muted)" }}>{s.label}</span>
                  <span style={{ fontFamily: "var(--font-numeral)", fontSize: 15, fontWeight: s.weight, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {dayEntries.map((e, i) => {
                const isIncome = e[1] === "i";
                const color = isIncome ? "var(--blue-700)" : "var(--text-heading)";
                return (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 56, borderTop: "1px solid var(--border-default)" }}
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
                        <CatIcon name={e[2]} kMap={kMap} size={18} />
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-heading)" }}>{e[3]}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{e[2]}</span>
                      </div>
                    </div>
                    <span style={{ fontFamily: "var(--font-numeral)", fontSize: 16, fontWeight: 600, color }}>
                      {isIncome ? "+" : "−"}{yen(e[4])}
                    </span>
                  </div>
                );
              })}
              {dayEntries.length === 0 && (
                <p style={{ margin: 0, padding: "12px 0", borderTop: "1px solid var(--border-default)", fontSize: 14, color: "var(--text-muted)" }}>
                  この日の記録はありません。
                </p>
              )}
            </div>
            <a href="/entry" style={{ fontSize: 13, fontWeight: 500, color: "var(--brand-primary)", textDecoration: "none" }}>
              この日に記録を追加
            </a>
          </div>
        </Card>
      </aside>
    </>
  );
}
