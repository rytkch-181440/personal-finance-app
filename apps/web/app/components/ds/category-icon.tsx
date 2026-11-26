"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  BookOpen,
  Car,
  Coffee,
  Ellipsis,
  Gamepad2,
  Gift,
  HeartPulse,
  House,
  PawPrint,
  Shirt,
  ShoppingCart,
  Smartphone,
  Tag,
  Utensils,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  tag: Tag,
  utensils: Utensils,
  cart: ShoppingCart,
  car: Car,
  house: House,
  zap: Zap,
  phone: Smartphone,
  game: Gamepad2,
  shirt: Shirt,
  heart: HeartPulse,
  coffee: Coffee,
  book: BookOpen,
  gift: Gift,
  wallet: Wallet,
  banknote: Banknote,
  paw: PawPrint,
  dots: Ellipsis,
};

export const ICON_LABELS: Record<string, string> = {
  tag: "タグ",
  utensils: "食事",
  cart: "買い物",
  car: "乗り物",
  house: "住まい",
  zap: "電気",
  phone: "スマホ",
  game: "ゲーム",
  shirt: "衣類",
  heart: "健康",
  coffee: "カフェ",
  book: "本",
  gift: "ギフト",
  wallet: "財布",
  banknote: "お金",
  paw: "ペット",
  dots: "その他",
};

export const ICON_IDS = Object.keys(ICONS);

export const KN: Record<string, string> = {
  食費: "utensils",
  日用品: "cart",
  交通: "car",
  "住居・光熱": "house",
  通信: "phone",
  娯楽: "game",
  "衣服・美容": "shirt",
  医療: "heart",
  その他: "dots",
  給与: "banknote",
  副収入: "wallet",
  お小遣い: "gift",
  食料品: "cart",
  外食: "utensils",
  カフェ: "coffee",
  "惣菜・弁当": "utensils",
  タクシー: "car",
  家賃: "house",
  電気: "zap",
  スマホ: "phone",
  本: "book",
  ゲーム: "game",
  衣類: "shirt",
  通院: "heart",
  本給: "banknote",
  賞与: "gift",
};

export type CatChild = { name: string; icon?: string };
export type CatParent = { name: string; icon?: string; children?: CatChild[] };
export type StoredCats = { expense: CatParent[]; income: CatParent[] };

export function loadStoredCats(): StoredCats | null {
  try {
    const t = JSON.parse(localStorage.getItem("kakeibo.cats.v1") ?? "null");
    if (t && Array.isArray(t.expense) && Array.isArray(t.income)) return t as StoredCats;
  } catch {
    /* noop */
  }
  return null;
}

export function saveStoredCats(tree: StoredCats) {
  try {
    localStorage.setItem("kakeibo.cats.v1", JSON.stringify(tree));
  } catch {
    /* noop */
  }
}

export function iconKeyFor(name: string, kMap: Record<string, string>): string {
  return kMap[name] ?? KN[name] ?? (name.startsWith("その他") ? "dots" : "tag");
}

export function iconFor(name: string, kMap: Record<string, string>): LucideIcon {
  return ICONS[iconKeyFor(name, kMap)] ?? Tag;
}

/** localStorage のカテゴリ設定を読み込み、アイコン名→Lucide コンポーネントのマップを返す */
export function useCategoryIcons() {
  const [kStored] = useState<StoredCats | null>(() =>
    typeof window === "undefined" ? null : loadStoredCats()
  );
  const kMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (kStored)
      (["expense", "income"] as const).forEach((k) =>
        kStored[k].forEach((p) => {
          if (p.icon) map[p.name] = p.icon;
          (p.children ?? []).forEach((c) => {
            if (c.icon) map[c.name] = c.icon;
          });
        })
      );
    return map;
  }, [kStored]);
  return { kStored, kMap };
}

export function CatIcon({
  name,
  kMap,
  size = 18,
  className,
}: {
  name: string;
  kMap: Record<string, string>;
  size?: number;
  className?: string;
}) {
  const Icon = iconFor(name, kMap);
  return <Icon size={size} className={className} aria-hidden="true" />;
}
