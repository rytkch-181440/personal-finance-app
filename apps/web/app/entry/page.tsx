"use client";

import { useState } from "react";
import { Card } from "../components/ds/card";
import { Button } from "../components/ds/button";
import { Badge } from "../components/ds/badge";
import { Input } from "../components/ds/input";
import { Tabs } from "../components/ds/tabs";
import { Tag } from "../components/ds/tag";
import { CatIcon, loadStoredCats, KN, type CatParent, type StoredCats } from "../components/ds/category-icon";

const yen = (n: number) => "¥" + n.toLocaleString("ja-JP");

type Entry = { memo: string; path: string; type: "expense" | "income"; amt: number };

const DEFAULT_TREE: StoredCats = {
  expense: [
    { name: "食費", children: ["食料品", "外食", "カフェ", "惣菜・弁当"] },
    { name: "日用品", children: ["消耗品", "洗剤・衛生用品", "雑貨"] },
    { name: "交通", children: ["電車・バス", "タクシー", "ガソリン"] },
    { name: "住居・光熱", children: ["家賃", "電気", "ガス", "水道"] },
    { name: "通信", children: ["スマホ", "インターネット"] },
    { name: "娯楽", children: ["映画・動画", "本", "ゲーム"] },
    { name: "衣服・美容", children: ["衣類", "美容院"] },
    { name: "医療", children: ["通院", "薬"] },
    { name: "その他", children: [] },
  ].map((p) => ({ name: p.name, icon: KN[p.name], children: p.children.map((c) => ({ name: c, icon: KN[c] })) })),
  income: [
    { name: "給与", children: ["本給", "賞与"] },
    { name: "副収入", children: [] },
    { name: "お小遣い", children: [] },
    { name: "その他", children: [] },
  ].map((p) => ({ name: p.name, icon: KN[p.name], children: p.children.map((c) => ({ name: c, icon: KN[c] })) })),
};

function toKMap(tree: StoredCats) {
  const map: Record<string, string> = {};
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

export default function EntryPage() {
  const [tree] = useState<StoredCats>(() => loadStoredCats() ?? DEFAULT_TREE);
  const kMap = toKMap(tree);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("1280");
  const [date, setDate] = useState("2026-11-24");
  const [memo, setMemo] = useState("");
  const [parent, setParent] = useState("食費");
  const [child, setChild] = useState("外食");
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([
    { memo: "ランチ", path: "食費 / 外食", type: "expense", amt: 980 },
    { memo: "ドラッグストア", path: "日用品 / 消耗品", type: "expense", amt: 1860 },
  ]);

  const list: CatParent[] = tree[type];
  const cur = list.find((p) => p.name === parent) ?? list[0] ?? { name: "", children: [] };
  const empty = amount === "";
  const path = child ? `${cur.name} / ${child}` : cur.name;

  const switchType = (v: string) => {
    const t = v as "expense" | "income";
    const first = tree[t][0];
    setType(t);
    setParent(first?.name ?? "");
    setChild("");
    setSaved(false);
  };

  const save = () => {
    setEntries((prev) => [
      { memo: memo || child || cur.name, path, type, amt: Number(amount) },
      ...prev,
    ]);
    setAmount("");
    setMemo("");
    setSaved(true);
  };

  const todayTag = "今日 11/24(火)";

  return (
    <>
      <main
        style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20, padding: "24px 28px", boxSizing: "border-box" }}
      >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.25 }}>記録を追加</h1>
          <Badge tone="info">{todayTag}</Badge>
        </header>

        <Card eyebrow="NEW ENTRY" title="金額とカテゴリを選ぶだけ">
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 12 }}>
            <Tabs
              tabs={[
                { label: "支出", value: "expense" },
                { label: "収入", value: "income" },
              ]}
              value={type}
              onChange={switchType}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
                gap: 16,
              }}
            >
              <Input
                label="金額（円）"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
              />
              <Input label="日付" type="date" value={date} onChange={(e) => { setDate(e.target.value); setSaved(false); }} />
              <Input
                label="メモ（任意）"
                placeholder="例: ランチ"
                value={memo}
                onChange={(e) => { setMemo(e.target.value); setSaved(false); }}
              />
            </div>

            <section aria-label="カテゴリ" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: 16 }}>カテゴリ</h2>
                <a href="/categories" style={{ fontSize: 13, fontWeight: 500, color: "var(--brand-primary)", textDecoration: "none" }}>
                  カテゴリを編集
                </a>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, letterSpacing: "var(--ls-wide)", color: "var(--text-muted)" }}>大分類</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {list.map((p) => (
                    <Tag
                      key={p.name}
                      selected={p.name === cur.name}
                      onClick={() => {
                        setParent(p.name);
                        setChild("");
                        setSaved(false);
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <CatIcon name={p.name} kMap={kMap} size={16} />
                        {p.name}
                      </span>
                    </Tag>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, letterSpacing: "var(--ls-wide)", color: "var(--text-muted)" }}>
                  小分類（{cur.name}）
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 36, alignItems: "center" }}>
                  {(cur.children ?? []).map((c) => {
                    const cn = typeof c === "string" ? c : c.name;
                    const ci = typeof c === "string" ? undefined : c.icon;
                    return (
                      <Tag
                        key={cn}
                        selected={child === cn}
                        onClick={() => {
                          setChild(child === cn ? "" : cn);
                          setSaved(false);
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <CatIcon name={cn} kMap={{ [cn]: ci ?? "", ...kMap }} size={16} />
                          {cn}
                        </span>
                      </Tag>
                    );
                  })}
                  {(cur.children ?? []).length === 0 && (
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>小分類はありません。</span>
                  )}
                </div>
              </div>
            </section>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                paddingTop: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>選択中</span>
                <Badge tone="info">{path}</Badge>
                {saved && <Badge tone="success">記録しました</Badge>}
              </div>
              <Button variant="primary" size="lg" disabled={empty} onClick={save}>
                {type === "expense" ? "支出を記録する" : "収入を記録する"}
              </Button>
            </div>
          </div>
        </Card>
      </main>

      <aside aria-label="今日の記録" style={{ flex: "1 1 320px", maxWidth: 380, minWidth: 0, padding: "24px 28px 24px 0", boxSizing: "border-box" }}>
        <Card eyebrow="TODAY" title="今日の記録">
          <div style={{ display: "flex", flexDirection: "column", marginTop: 8 }}>
            {entries.map((e, i) => {
              const last = e.path.split(" / ").pop() ?? e.path;
              const color = e.type === "income" ? "var(--blue-600)" : "var(--text-heading)";
              return (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 60, borderTop: "1px solid var(--border-default)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
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
                      <CatIcon name={last} kMap={kMap} size={18} />
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-heading)" }}>{e.memo}</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{e.path}</span>
                    </div>
                  </div>
                  <span style={{ fontFamily: "var(--font-numeral)", fontSize: 16, fontWeight: 600, color }}>
                    {e.type === "income" ? "+" : "−"}{yen(e.amt)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </aside>
    </>
  );
}
