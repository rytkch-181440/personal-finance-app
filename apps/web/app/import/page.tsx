"use client";

import { useState } from "react";
import { Card } from "../components/ds/card";
import { Button } from "../components/ds/button";
import { Badge } from "../components/ds/badge";
import { Tag } from "../components/ds/tag";
import { Checkbox } from "../components/ds/checkbox";
import { Select, type SelectOption } from "../components/ds/select";
import { Tabs } from "../components/ds/tabs";
import { CatIcon, loadStoredCats, KN, type StoredCats } from "../components/ds/category-icon";

const yen = (n: number) => "¥" + n.toLocaleString("ja-JP");

type Kind = "auto" | "check" | "dup";
type Row = { store: string; date: string; amt: number; cat: string; kind: Kind; checked: boolean };

const ROWS: Row[] = [
  { store: "○○スーパー 駅前店", date: "11/21", amt: 4320, cat: "食費", kind: "auto", checked: true },
  { store: "□□鉄道 ICチャージ", date: "11/20", amt: 3000, cat: "交通", kind: "auto", checked: true },
  { store: "動画配信サービス", date: "11/19", amt: 1490, cat: "娯楽", kind: "auto", checked: true },
  { store: "△△ドラッグ 中央店", date: "11/18", amt: 1860, cat: "日用品", kind: "auto", checked: true },
  { store: "××ショップ オンライン", date: "11/15", amt: 6980, cat: "", kind: "check", checked: true },
  { store: "△△サービス", date: "11/09", amt: 2480, cat: "", kind: "check", checked: true },
  { store: "○○スーパー 駅前店", date: "11/12", amt: 4320, cat: "食費", kind: "dup", checked: false },
];

const META: Record<Kind, { status: string; tone: "success" | "warning" | "info" }> = {
  auto: { status: "自動分類", tone: "success" },
  check: { status: "要確認", tone: "warning" },
  dup: { status: "重複の可能性", tone: "info" },
};

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

const STEPS = [
  { label: "ファイル選択", current: false },
  { label: "内容確認", current: true },
  { label: "完了", current: false },
];

export default function ImportPage() {
  const [tree] = useState<StoredCats | null>(() => loadStoredCats());
  const kMap = toKMap(tree);
  const [filter, setFilter] = useState("all");
  const [rows, setRows] = useState<Row[]>(ROWS);

  const categories: SelectOption[] = [
    { label: "選んでください", value: "" },
    ...(tree?.expense ?? [
      { name: "食費", children: [] },
      { name: "日用品", children: [] },
      { name: "交通", children: [] },
      { name: "住居・光熱", children: [] },
      { name: "通信", children: [] },
      { name: "娯楽", children: [] },
      { name: "衣服・美容", children: [] },
      { name: "医療", children: [] },
      { name: "その他", children: [] },
    ]).map((p) => ({ label: p.name, value: p.name })),
  ];

  const formats: SelectOption[] = [
    { label: "自動で判定（おすすめ）", value: "auto" },
    { label: "汎用CSV（日付・店名・金額）", value: "generic" },
  ];

  const visible = rows.filter((r) => filter === "all" || r.kind === filter);

  return (
    <>
      <main
        style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20, padding: "24px 28px", boxSizing: "border-box" }}
      >
        <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.25 }}>カード明細を取り込む</h1>
          <ol aria-label="取り込みの手順" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", gap: 20, fontSize: 13, letterSpacing: "var(--ls-wide)" }}>
            {STEPS.map((s, i) => (
              <li
                key={s.label}
                aria-current={s.current ? "step" : undefined}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  fontWeight: s.current ? 700 : 400,
                  color: s.current ? "var(--brand-primary)" : "var(--text-muted)",
                }}
              >
                <span style={{ fontFamily: "var(--font-numeral)" }}>({String(i + 1).padStart(2, "0")})</span>
                {s.label}
              </li>
            ))}
          </ol>
        </header>

        <Tabs
          tabs={[
            { label: "すべて 48", value: "all" },
            { label: "要確認 2", value: "check" },
            { label: "重複の可能性 5", value: "dup" },
          ]}
          value={filter}
          onChange={setFilter}
        />

        <section aria-label="読み込んだ明細">
          <Card flat>
            <div style={{ display: "flex", flexDirection: "column", overflowX: "auto" }}>
              <div
                style={{
                  minWidth: 640,
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 72px 200px 112px 100px",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 40,
                  fontSize: 12,
                  letterSpacing: "var(--ls-wide)",
                  color: "var(--text-muted)",
                }}
              >
                <span>店名</span>
                <span>利用日</span>
                <span>カテゴリ</span>
                <span>状態</span>
                <span style={{ textAlign: "right" }}>金額</span>
              </div>
              {visible.map((r, i) => {
                const m = META[r.kind];
                return (
                  <div
                    key={i}
                    style={{
                      minWidth: 640,
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) 72px 200px 112px 100px",
                      alignItems: "center",
                      gap: 12,
                      minHeight: 60,
                      borderTop: "1px solid var(--border-default)",
                    }}
                  >
                    <Checkbox
                      label={r.store}
                      checked={r.checked}
                      onChange={(v) => setRows((prev) => prev.map((x, j) => (j === i ? { ...x, checked: v } : x)))}
                    />
                    <span style={{ fontFamily: "var(--font-numeral)", fontSize: 13, color: "var(--text-muted)" }}>{r.date}</span>
                    <div>
                      {r.kind === "check" ? (
                        <Select
                          options={categories}
                          defaultValue=""
                          onChange={(e) =>
                            setRows((prev) => prev.map((x, j) => (j === i ? { ...x, cat: e.target.value } : x)))
                          }
                        />
                      ) : (
                        <Tag>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <CatIcon name={r.cat} kMap={kMap} size={16} />
                            {r.cat}
                          </span>
                        </Tag>
                      )}
                    </div>
                    <div>
                      <Badge tone={m.tone}>{m.status}</Badge>
                    </div>
                    <span style={{ textAlign: "right", fontFamily: "var(--font-numeral)", fontSize: 16, fontWeight: 600, color: "var(--text-heading)" }}>
                      {yen(r.amt)}
                    </span>
                  </div>
                );
              })}
              <div
                style={{
                  minWidth: 640,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: 52,
                  borderTop: "1px solid var(--border-default)",
                }}
              >
                <span style={{ fontSize: 14, color: "var(--text-body)" }}>ほか 39件</span>
                <Button variant="ghost" size="sm">
                  すべて表示
                </Button>
              </div>
            </div>
          </Card>
          <p style={{ margin: "8px 4px 0", fontSize: 12, lineHeight: 1.5, color: "var(--text-muted)" }}>
            カテゴリをクリックすると変更できます。チェックを入れた明細だけを取り込みます。
          </p>
        </section>
      </main>

      <aside
        aria-label="取り込みの概要"
        style={{ flex: "1 1 320px", maxWidth: 380, minWidth: 0, padding: "24px 28px 24px 0", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16 }}
      >
        <Card eyebrow="FILE" title="meisai_202611.csv">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            <span style={{ fontSize: 14, color: "var(--text-body)" }}>48件を読み込みました</span>
            <Select label="カード会社の形式" options={formats} defaultValue="auto" />
            <div>
              <Button variant="secondary" size="sm">
                ファイルを差し替える
              </Button>
            </div>
          </div>
        </Card>

        <Card eyebrow="SUMMARY" title="43件を取り込みます">
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { badge: "自動分類", tone: "success" as const, count: "41件" },
                { badge: "要確認", tone: "warning" as const, count: "2件" },
                { badge: "重複の可能性（除外）", tone: "info" as const, count: "5件" },
              ].map((s) => (
                <div key={s.badge} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 40, borderTop: "1px solid var(--border-default)" }}>
                  <Badge tone={s.tone}>{s.badge}</Badge>
                  <span style={{ fontFamily: "var(--font-numeral)", fontSize: 16, fontWeight: 600, color: "var(--text-heading)" }}>{s.count}</span>
                </div>
              ))}
            </div>
            <Button variant="primary" size="lg" className="w-full">
              43件を取り込む
            </Button>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "var(--text-muted)" }}>
              カテゴリ未選択の明細は「未分類」として取り込みます。
            </p>
          </div>
        </Card>
      </aside>
    </>
  );
}
