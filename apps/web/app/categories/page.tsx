"use client";

import { useState } from "react";
import { Card } from "../components/ds/card";
import { Button } from "../components/ds/button";
import { Input } from "../components/ds/input";
import { Tabs } from "../components/ds/tabs";
import {
  ICONS,
  ICON_IDS,
  ICON_LABELS,
  KN,
  loadStoredCats,
  saveStoredCats,
  type CatParent,
  type StoredCats,
} from "../components/ds/category-icon";

type Type = "expense" | "income";
type EditState = { level: "parent" | "child"; orig: string } | null;

const DEFAULT_TREE: StoredCats = {
  expense: [
    { name: "食費", icon: "utensils", children: [{ name: "食料品", icon: "cart" }, { name: "外食", icon: "utensils" }, { name: "カフェ", icon: "coffee" }, { name: "惣菜・弁当", icon: "utensils" }] },
    { name: "日用品", icon: "cart", children: [{ name: "消耗品", icon: "tag" }, { name: "洗剤・衛生用品", icon: "tag" }, { name: "雑貨", icon: "tag" }] },
    { name: "交通", icon: "car", children: [{ name: "電車・バス", icon: "tag" }, { name: "タクシー", icon: "car" }, { name: "ガソリン", icon: "tag" }] },
    { name: "住居・光熱", icon: "house", children: [{ name: "家賃", icon: "house" }, { name: "電気", icon: "zap" }, { name: "ガス", icon: "tag" }, { name: "水道", icon: "tag" }] },
    { name: "通信", icon: "phone", children: [{ name: "スマホ", icon: "phone" }, { name: "インターネット", icon: "tag" }] },
    { name: "娯楽", icon: "game", children: [{ name: "映画・動画", icon: "tag" }, { name: "本", icon: "book" }, { name: "ゲーム", icon: "game" }] },
    { name: "衣服・美容", icon: "shirt", children: [{ name: "衣類", icon: "shirt" }, { name: "美容院", icon: "tag" }] },
    { name: "医療", icon: "heart", children: [{ name: "通院", icon: "heart" }, { name: "薬", icon: "tag" }] },
    { name: "その他", icon: "dots", children: [] },
  ],
  income: [
    { name: "給与", icon: "banknote", children: [{ name: "本給", icon: "banknote" }, { name: "賞与", icon: "gift" }] },
    { name: "副収入", icon: "wallet", children: [] },
    { name: "お小遣い", icon: "gift", children: [] },
    { name: "その他", icon: "dots", children: [] },
  ],
};

function toDefault(): StoredCats {
  return JSON.parse(JSON.stringify(DEFAULT_TREE)) as StoredCats;
}

function CatGlyph({ icon, size = 18 }: { icon?: string; size?: number }) {
  const Icon = ICONS[icon ?? "tag"] ?? ICONS.tag;
  return <Icon size={size} aria-hidden="true" />;
}

export default function CategoriesPage() {
  const [tree, setTree] = useState<StoredCats>(() => loadStoredCats() ?? toDefault());
  const [type, setType] = useState<Type>("expense");
  const [sel, setSel] = useState<Record<Type, string>>(() => ({
    expense: tree.expense[0]?.name ?? "",
    income: tree.income[0]?.name ?? "",
  }));
  const [newParent, setNewParent] = useState("");
  const [newParentIcon, setNewParentIcon] = useState("tag");
  const [newChild, setNewChild] = useState("");
  const [newChildIcon, setNewChildIcon] = useState("tag");
  const [edit, setEdit] = useState<EditState>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("tag");

  const commit = (next: StoredCats, selNext?: Record<Type, string>) => {
    setTree(next);
    if (selNext) setSel(selNext);
    saveStoredCats(next);
  };

  const list = tree[type];
  const cur = list.find((p) => p.name === sel[type]);

  const switchType = (v: string) => {
    const t = v as Type;
    setType(t);
    setNewParent("");
    setNewChild("");
    setNewParentIcon("tag");
    setNewChildIcon("tag");
    setEdit(null);
  };

  const removeParent = (name: string) => {
    const next = list.filter((p) => p.name !== name);
    const keep = sel[type] === name ? next[0]?.name ?? "" : sel[type];
    commit({ ...tree, [type]: next }, { ...sel, [type]: keep });
    setEdit(null);
  };

  const removeChild = (childName: string) => {
    const next = list.map((p) =>
      p.name === cur?.name ? { ...p, children: (p.children ?? []).filter((c) => c.name !== childName) } : p
    );
    commit({ ...tree, [type]: next });
  };

  const saveEdit = () => {
    const name = editName.trim();
    if (!edit || !name) return;
    const l = tree[type];
    if (edit.level === "parent") {
      if (name !== edit.orig && l.some((p) => p.name === name)) return;
      const next = l.map((p) => (p.name === edit.orig ? { ...p, name, icon: editIcon } : p));
      commit(
        { ...tree, [type]: next },
        { ...sel, [type]: sel[type] === edit.orig ? name : sel[type] }
      );
      setEdit(null);
      return;
    }
    const target = l.find((p) => p.name === sel[type]);
    if (!target || (name !== edit.orig && (target.children ?? []).some((c) => c.name === name))) {
      setEdit(null);
      return;
    }
    const next = l.map((p) =>
      p.name === sel[type]
        ? { ...p, children: (p.children ?? []).map((c) => (c.name === edit.orig ? { ...c, name, icon: editIcon } : c)) }
        : p
    );
    commit({ ...tree, [type]: next });
    setEdit(null);
  };

  const addParent = () => {
    const name = newParent.trim();
    if (!name || list.some((p) => p.name === name)) return;
    commit(
      { ...tree, [type]: [...list, { name, icon: newParentIcon, children: [] }] },
      { ...sel, [type]: name }
    );
    setNewParent("");
    setNewParentIcon("tag");
  };

  const addChild = () => {
    const name = newChild.trim();
    const target = list.find((p) => p.name === sel[type]);
    if (!name || !target || (target.children ?? []).some((c) => c.name === name)) return;
    const next = list.map((p) =>
      p.name === sel[type] ? { ...p, children: [...(p.children ?? []), { name, icon: newChildIcon }] } : p
    );
    commit({ ...tree, [type]: next });
    setNewChild("");
    setNewChildIcon("tag");
  };

  const iconPicker = (current: string, setIcon: (id: string) => void, ariaLabel: string) => (
    <div role="group" aria-label={ariaLabel} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {ICON_IDS.map((id) => {
        const on = id === current;
        const Icon = ICONS[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => setIcon(id)}
            aria-label={ICON_LABELS[id]}
            aria-pressed={on}
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: 0,
              borderRadius: "var(--radius-circle)",
              background: on ? "var(--blue-600)" : "var(--surface-sunken)",
              color: on ? "#ffffff" : "var(--text-body)",
              cursor: "pointer",
            }}
          >
            <Icon size={20} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );

  const editingPanel = (level: "parent" | "child") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, borderRadius: "var(--radius-md)", background: "var(--blue-100)" }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--blue-700)" }}>
        {level === "parent" ? "大分類を編集" : "小分類を編集"}
      </span>
      <Input label="名前" value={editName} onChange={(e) => setEditName(e.target.value)} />
      {iconPicker(editIcon, setEditIcon, "アイコン")}
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="primary" size="md" disabled={editName.trim() === ""} onClick={saveEdit}>
          保存
        </Button>
        <Button variant="ghost" size="md" onClick={() => setEdit(null)}>
          キャンセル
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <main
        style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20, padding: "24px 28px", boxSizing: "border-box" }}
      >
        <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.25 }}>カテゴリ設定</h1>
          <p style={{ margin: 0, maxWidth: 680, fontSize: 14, lineHeight: 1.7, color: "var(--text-body)" }}>
            名前とアイコンをつけて、大分類・小分類を自由に追加できます。記録の入力では、大分類 →
            小分類の順に選べます。削除しても、過去の記録は消えません。
          </p>
        </header>

        <Tabs
          tabs={[
            { label: "支出", value: "expense" },
            { label: "収入", value: "income" },
          ]}
          value={type}
          onChange={switchType}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 16, alignItems: "start" }}>
          <Card eyebrow="PARENT" title="大分類">
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {list.map((p) => {
                  const on = cur?.name === p.name;
                  const Icon = ICONS[p.icon ?? "tag"] ?? ICONS.tag;
                  return (
                    <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderTop: "1px solid var(--border-default)" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSel({ ...sel, [type]: p.name });
                          setEdit(null);
                        }}
                        aria-pressed={on}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          minHeight: 48,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          padding: "0 12px 0 8px",
                          border: 0,
                          borderRadius: "var(--radius-sm)",
                          background: on ? "var(--blue-100)" : "transparent",
                          color: on ? "var(--blue-700)" : "var(--text-heading)",
                          fontFamily: "inherit",
                          fontSize: 15,
                          fontWeight: on ? 700 : 500,
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <span
                            style={{
                              width: 32,
                              height: 32,
                              flex: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "var(--radius-circle)",
                              background: on ? "var(--surface-card)" : "var(--blue-100)",
                              color: "var(--blue-700)",
                            }}
                          >
                            <Icon size={18} aria-hidden="true" />
                          </span>
                          <span>{p.name}</span>
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>
                          {(p.children ?? []).length ? `小分類 ${(p.children ?? []).length}` : "小分類なし"}
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEdit({ level: "parent", orig: p.name });
                          setEditName(p.name);
                          setEditIcon(p.icon ?? "tag");
                        }}
                      >
                        編集
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeParent(p.name)}>
                        削除
                      </Button>
                    </div>
                  );
                })}
                {list.length === 0 && (
                  <p style={{ margin: 0, padding: "12px 0", fontSize: 14, color: "var(--text-muted)" }}>
                    大分類がありません。下から追加してください。
                  </p>
                )}
              </div>

              {edit?.level === "parent" && editingPanel("parent")}

              <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border-default)" }}>
                <Input label="大分類を追加" placeholder="例: ペット" value={newParent} onChange={(e) => setNewParent(e.target.value)} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 12, letterSpacing: "var(--ls-wide)", color: "var(--text-muted)" }}>アイコン</span>
                  {iconPicker(newParentIcon, setNewParentIcon, "大分類のアイコン")}
                </div>
                <div>
                  <Button variant="secondary" size="md" disabled={newParent.trim() === ""} onClick={addParent}>
                    大分類を追加
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card eyebrow="CHILD" title={cur ? `${cur.name}の小分類` : "小分類"}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(cur?.children ?? []).map((c) => {
                  const Icon = ICONS[c.icon ?? "tag"] ?? ICONS.tag;
                  return (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 52, padding: "4px 0 4px 8px", borderTop: "1px solid var(--border-default)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span
                          style={{
                            width: 32,
                            height: 32,
                            flex: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "var(--radius-circle)",
                            background: "var(--blue-100)",
                            color: "var(--blue-700)",
                          }}
                        >
                          <Icon size={18} aria-hidden="true" />
                        </span>
                        <span style={{ fontSize: 15, color: "var(--text-heading)" }}>{c.name}</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEdit({ level: "child", orig: c.name });
                            setEditName(c.name);
                            setEditIcon(c.icon ?? "tag");
                          }}
                        >
                          編集
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeChild(c.name)}>
                          削除
                        </Button>
                      </span>
                    </div>
                  );
                })}
                {(cur?.children ?? []).length === 0 && (
                  <p style={{ margin: 0, padding: "12px 0", fontSize: 14, color: "var(--text-muted)" }}>
                    {cur ? "小分類はまだありません。下から追加できます。" : "左の一覧から大分類を選んでください。"}
                  </p>
                )}
              </div>

              {edit?.level === "child" && editingPanel("child")}

              {cur && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border-default)" }}>
                  <Input label="小分類を追加" placeholder="例: 外食" value={newChild} onChange={(e) => setNewChild(e.target.value)} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 12, letterSpacing: "var(--ls-wide)", color: "var(--text-muted)" }}>アイコン</span>
                    {iconPicker(newChildIcon, setNewChildIcon, "小分類のアイコン")}
                  </div>
                  <div>
                    <Button variant="secondary" size="md" disabled={newChild.trim() === ""} onClick={addChild}>
                      小分類を追加
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
