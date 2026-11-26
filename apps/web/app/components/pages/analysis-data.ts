import { iconFor, type StoredCats } from "../ds/category-icon";
import type { LucideIcon } from "lucide-react";

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");
const signed = (n: number) => (n < 0 ? "−" : "+") + yen(Math.abs(n));

const CATS = ["食費", "日用品", "交通", "住居・光熱", "通信", "娯楽", "衣服・美容", "医療", "その他"];
const BASE = [47000, 11500, 9600, 0, 8980, 12500, 8200, 3000, 5200];
const UTIL = [24000, 23000, 18000, 15500, 14000, 14500, 17500, 20500, 15000, 14500, 16000, 19000];
const EV: Record<string, Record<string, number>> = {
  "2025-06": { "衣服・美容": 1.5 },
  "2025-08": { 娯楽: 1.7, 交通: 2.0 },
  "2025-12": { 娯楽: 1.5, "衣服・美容": 1.6, 食費: 1.15 },
  "2026-01": { 食費: 1.12, 娯楽: 1.2 },
  "2026-03": { その他: 2.2 },
  "2026-06": { "衣服・美容": 2.6, 娯楽: 1.3 },
};
const BONUS: Record<string, number> = { "2025-06": 480000, "2025-12": 520000, "2026-06": 540000 };
const NOV = [48200, 12640, 9800, 98000, 8980, 14300, 11500, 3200, 6400];
const SUBS: Record<string, [string, number][]> = {
  食費: [
    ["食料品", 0.6226],
    ["外食", 0.3525],
    ["カフェ", 0.0249],
  ],
  日用品: [
    ["雑貨", 0.4035],
    ["消耗品", 0.4003],
    ["洗剤・衛生用品", 0.1962],
  ],
  交通: [
    ["電車・バス", 0.7551],
    ["タクシー", 0.2449],
  ],
  "住居・光熱": [
    ["家賃", 0.8367],
    ["電気", 0.0735],
    ["ガス", 0.049],
    ["水道", 0.0408],
  ],
  通信: [
    ["スマホ", 0.6103],
    ["インターネット", 0.3897],
  ],
  娯楽: [
    ["映画・動画・イベント", 0.5594],
    ["ゲーム", 0.3147],
    ["本", 0.1259],
  ],
  "衣服・美容": [
    ["衣類", 0.7391],
    ["美容院", 0.2609],
  ],
  医療: [["通院", 1]],
  その他: [],
};
const N = 23;
const monthKey = (mi: number) =>
  2025 + Math.floor(mi / 12) + "-" + String((mi % 12) + 1).padStart(2, "0");

type MonthRow = {
  k: string;
  mi: number;
  short: string;
  label: string;
  cats: number[];
  inc: number;
  bonus: number;
  exp: number;
  partial: boolean;
};

const MONTHS: MonthRow[] = (() => {
  const rows: MonthRow[] = [];
  for (let mi = 0; mi < N; mi++) {
    const k = monthKey(mi);
    const mo = mi % 12;
    let cats = CATS.map((c, ci) => {
      const b = ci === 3 ? 82000 + UTIL[mo] : BASE[ci];
      const f =
        ci === 3 || ci === 4
          ? 1
          : 1 + 0.14 * Math.sin(mi * 1.3 + ci * 2.1) + 0.06 * Math.cos(mi * 2.7 + ci);
      const ev = (EV[k] && EV[k][c]) || 1;
      return Math.round((b * f * ev) / 10) * 10;
    });
    if (mi === 22) cats = NOV.slice();
    const salary = mi < 12 ? 306800 : 312400;
    const bonus = BONUS[k] || 0;
    const side = mi === 22 ? 18000 : mi % 4 === 1 ? 9000 + (mi % 3) * 3000 : 0;
    rows.push({
      k,
      mi,
      short: mo + 1 + "月",
      label: 2025 + Math.floor(mi / 12) + "年" + (mo + 1) + "月",
      cats,
      inc: salary + bonus + side,
      bonus,
      exp: cats.reduce((a, v) => a + v, 0),
      partial: mi === 22,
    });
  }
  return rows;
})();

const agg = (from: number, to: number) => {
  const r = { cats: CATS.map(() => 0), inc: 0, exp: 0, bonus: 0, n: 0 };
  for (let i = from; i <= to; i++) {
    const m = MONTHS[i];
    m.cats.forEach((v, ci) => {
      r.cats[ci] += v;
    });
    r.inc += m.inc;
    r.exp += m.exp;
    r.bonus += m.bonus;
    r.n++;
  }
  return r;
};

const VAR = [0, 1, 2, 5, 6, 7, 8];
const argmax = (arr: number[], idxs: number[]) =>
  idxs.reduce<number | null>((b, i) => (b === null || arr[i] > arr[b] ? i : b), null);
const PAL = ["var(--blue-600)", "var(--coral-500)", "var(--teal-600)", "var(--amber-500)", "var(--ink-300)"];

export type ViewModelParams = {
  unit: "month" | "year";
  month: string;
  year: string;
  filter: string;
  kMap: Record<string, string>;
  kStored: StoredCats | null;
  type?: "expense" | "income";
  cat?: string;
};

export function computeViewModel(p: ViewModelParams) {
  const { unit, month, year, filter, kMap, kStored } = p;
  const type = p.type ?? "expense";
  const cat = p.cat ?? "食費";
    const isMonth = unit === "month";
  const idx = MONTHS.findIndex((m) => m.k === month);
  const from = isMonth ? idx : (Number(year) - 2025) * 12;
  const to = isMonth ? idx : Math.min(N - 1, from + 11);
  const cur = agg(from, to);
  const nMonths = to - from + 1;
  const periodLabel = isMonth
    ? MONTHS[idx].label
    : year + "年" + (nMonths < 12 ? "（1〜" + nMonths + "月）" : "");
  const fi = CATS.indexOf(filter);
  const catMode = fi >= 0;

  /* トレンドチャート */
  const tf = isMonth ? Math.max(0, idx - 5) : from;
  const rows = MONTHS.slice(tf, to + 1);
  const vals = rows.map((m) => (catMode ? m.cats[fi] : Math.max(m.inc, m.exp)));
  const maxV = Math.max(...vals) || 1;
  const H = 160;
  const bars = rows.map((m) => ({
    label: m.short,
    weight: isMonth && m.mi === idx ? 700 : 500,
    incW: catMode ? 0 : 16,
    incH: catMode ? 0 : Math.round((m.inc / maxV) * H * 10) / 10,
    expH: Math.round(((catMode ? m.cats[fi] : m.exp) / maxV) * H * 10) / 10,
  }));
  const chartAria =
    (catMode ? filter + "の月別支出。" : "収入と支出の月別推移。") +
    rows
      .map((m) =>
        m.short +
        (catMode ? " " + yen(m.cats[fi]) : " 収入" + yen(m.inc) + " 支出" + yen(m.exp))
      )
      .join("、") +
    "。";
  let chartNote = rows.some((m) => m.partial) ? "11月は11/24までの集計です。" : "";
  if (catMode) {
    const avgC = rows.reduce((a, m) => a + m.cats[fi], 0) / rows.length;
    chartNote = (chartNote ? chartNote + " " : "") + "表示期間の月平均は" + yen(avgC) + "です。";
  }

  /* 内訳円グラフ */
  let parts: { label: string; v: number }[] = [];
  let pieBase = cur.exp;
  let pieTitle = "支出の内訳";
  let pieCenterLabel = "支出合計";
  let pieCenterValue = yen(cur.exp);
  if (!catMode) {
    const order = CATS.map((c, ci) => ({ label: c, v: cur.cats[ci] })).sort(
      (a, b) => b.v - a.v
    );
    const top = order.slice(0, 4);
    const rest = order.slice(4).reduce((a, x) => a + x.v, 0);
    parts = top.concat([{ label: "その他 " + (order.length - 4) + "カテゴリ", v: rest }]);
  } else {
    const total = cur.cats[fi];
    pieBase = total;
    pieTitle = filter + "の小分類";
    pieCenterLabel = filter;
    pieCenterValue = yen(total);
    const subs = SUBS[filter] || [];
    let acc = 0;
    parts = subs.map((p, i) => {
      const v = i === subs.length - 1 ? total - acc : Math.round(total * p[1]);
      acc += v;
      return { label: p[0], v };
    });
  }
  let g = 0;
  const stops: string[] = [];
  parts.forEach((p, i) => {
    const w = pieBase ? (p.v / pieBase) * 100 : 0;
    stops.push(PAL[i % PAL.length] + " " + g.toFixed(2) + "% " + (g + w).toFixed(2) + "%");
    g += w;
  });
  const pieGradient = parts.length
    ? "conic-gradient(" + stops.join(", ") + ")"
    : "var(--surface-sunken)";
  const slices = parts.map((p, i) => ({
    label: p.label,
    color: PAL[i % PAL.length],
    amount: yen(p.v),
    pct: (pieBase ? (p.v / pieBase) * 100 : 0).toFixed(1) + "%",
  }));

  /* AIインサイト（モック生成） */
  const paras: string[] = [];
  if (isMonth) {
    const m = MONTHS[idx];
    const others = MONTHS.filter((x) => !x.partial && x.mi !== idx);
    const avg = (ci: number) => others.reduce((a, x) => a + x.cats[ci], 0) / others.length;
    const avgShare = (ci: number) =>
      (others.reduce((a, x) => a + x.cats[ci] / x.exp, 0) / others.length) * 100;
    if (catMode) {
      if (!m.partial) {
        const a = avg(fi);
        const r = ((m.cats[fi] - a) / a) * 100;
        paras.push(
          filter +
            "の支出は" +
            yen(m.cats[fi]) +
            "で、他の月の平均（" +
            yen(a) +
            "）より" +
            Math.abs(Math.round(r)) +
            "%" +
            (r >= 0 ? "多い" : "少ない") +
            "です。"
        );
      } else {
        const sh = (m.cats[fi] / m.exp) * 100;
        paras.push(
          filter +
            "は支出の" +
            sh.toFixed(1) +
            "%を占めています（他の月の平均は" +
            avgShare(fi).toFixed(1) +
            "%）。"
        );
      }
    }
    if (!m.partial) {
      let best: { ci: number; d: number; r: number } | null = null;
      let low: { ci: number; d: number; r: number } | null = null;
      VAR.forEach((ci) => {
        const d = m.cats[ci] - avg(ci);
        const r = d / avg(ci);
        if (!best || d > best.d) best = { ci, d, r };
        if (!low || d < low.d) low = { ci, d, r };
      });
      const b = best!;
      const l = low!;
      if (b.d >= 3000 && b.r >= 0.15) {
        let t =
          m.short +
          "は" +
          CATS[b.ci] +
          "の支出が他の月に比べて多く、平均より" +
          yen(b.d) +
          "（" +
          Math.round(b.r * 100) +
          "%）上回っています。";
        if (l.r <= -0.2 && l.d <= -2000 && l.ci !== b.ci)
          t += "一方で、" + CATS[l.ci] + "は平均より" + yen(-l.d) + "少なく抑えられています。";
        paras.push(t);
      } else {
        paras.push(m.short + "は、どのカテゴリも他の月と同じくらいの支出で、落ち着いた月でした。");
      }
    } else {
      let best: { ci: number; d: number } | null = null;
      VAR.forEach((ci) => {
        const d = (m.cats[ci] / m.exp) * 100 - avgShare(ci);
        if (!best || d > best.d) best = { ci, d };
      });
      const b = best!;
      if (b.d >= 2) {
        paras.push(
          m.short +
            "（11/24時点）は、" +
            CATS[b.ci] +
            "が支出の" +
            ((m.cats[b.ci] / m.exp) * 100).toFixed(1) +
            "%を占め、他の月の平均" +
            avgShare(b.ci).toFixed(1) +
            "%より高めです。"
        );
      } else {
        paras.push(m.short + "（11/24時点）は、カテゴリごとのバランスが他の月とほぼ同じ傾向です。");
      }
    }
    const topAll = argmax(m.cats, CATS.map((c, i) => i)) as number;
    const p = Math.round((m.cats[topAll] / m.exp) * 100);
    paras.push(
      topAll === 3
        ? CATS[topAll] + "が支出の" + p + "%を占めていますが、固定費なのでいつもどおりです。"
        : CATS[topAll] + "が支出の" + p + "%を占める月でした。"
    );
    if (m.bonus > 0) {
      const vt = argmax(m.cats, VAR) as number;
      paras.push(
        m.short +
          "は賞与（" +
          yen(m.bonus) +
          "）が入りました。" +
          CATS[vt] +
          "の支出が大きめですが、自分へのご褒美として奮発したのなら、いい使い方だと思います！"
      );
    }
    const prev = MONTHS[idx - 1];
    if (prev && !prev.partial) {
      const r1 = ((m.inc - m.exp) / m.inc) * 100;
      const r0 = ((prev.inc - prev.exp) / prev.inc) * 100;
      paras.push(
        (m.partial ? "11/24時点の" : "") +
          "貯蓄率は" +
          r1.toFixed(1) +
          "%で、前月（" +
          r0.toFixed(1) +
          "%）より" +
          (r1 >= r0 ? "高く" : "低く") +
          "なっています。"
      );
    }
  } else {
    const y = Number(year);
    const rowsY = MONTHS.slice(from, to + 1);
    if (catMode) {
      const tot = cur.cats[fi];
      let t =
        filter +
        "は" +
        year +
        "年で" +
        yen(tot) +
        "（支出の" +
        Math.round((tot / cur.exp) * 100) +
        "%）、月平均は" +
        yen(tot / nMonths) +
        "です。";
      if (y > 2025) {
        const pr = agg(from - 12, to - 12);
        const r = ((tot - pr.cats[fi]) / pr.cats[fi]) * 100;
        t += "前年の同じ期間より" + Math.abs(Math.round(r)) + "%" + (r >= 0 ? "増えています。" : "減っています。");
      }
      paras.push(t);
    }
    if (y > 2025) {
      const pr = agg(from - 12, to - 12);
      let up: { ci: number; d: number } | null = null;
      let dn: { ci: number; d: number } | null = null;
      VAR.forEach((ci) => {
        const d = cur.cats[ci] - pr.cats[ci];
        if (!up || d > up.d) up = { ci, d };
        if (!dn || d < dn.d) dn = { ci, d };
      });
      const u = up!;
      const dnn = dn!;
      const tr = (cur.exp / pr.exp - 1) * 100;
      paras.push(
        "支出全体は前年の同じ期間より" +
          Math.abs(Math.round(tr)) +
          "%" +
          (tr >= 0 ? "増えました" : "減りました") +
          "。" +
          CATS[u.ci] +
          "が" +
          yen(u.d) +
          "増え、" +
          CATS[dnn.ci] +
          "が" +
          yen(-dnn.d) +
          "減っています。"
      );
    }
    const done = rowsY.filter((m) => !m.partial);
    const mx = done.reduce((b, m) => (!b || m.exp > b.exp ? m : b), done[0]);
    const mxTop = argmax(mx.cats, VAR) as number;
    paras.push(
      "支出が最も多かったのは" +
        mx.short +
        "（" +
        yen(mx.exp) +
        "）で、" +
        CATS[mxTop] +
        "が目立ちました。" +
        (mx.bonus > 0 ? "賞与が入った月なので、ご褒美の支出と考えれば納得です。" : "")
    );
    const bm = rowsY.filter((m) => m.bonus > 0);
    if (bm.length) {
      paras.push(
        "賞与は" +
          bm.map((m) => m.short).join("・") +
          "に入り、合計" +
          yen(bm.reduce((a, m) => a + m.bonus, 0)) +
          "でした。"
      );
    }
    const bs = done.reduce(
      (b, m) => (!b || (m.inc - m.exp) / m.inc > (b.inc - b.exp) / b.inc ? m : b),
      done[0]
    );
    paras.push(
      "貯蓄率が最も高かったのは" +
        bs.short +
        "（" +
        (((bs.inc - bs.exp) / bs.inc) * 100).toFixed(1) +
        "%）。年間の貯蓄率は" +
        (((cur.inc - cur.exp) / cur.inc) * 100).toFixed(1) +
        "%です。"
    );
  }
  const insights = paras.slice(0, 4);

  /* コントロール */
  const monthOptions: { label: string; value: string }[] = [];
  for (let mi = N - 1; mi >= 0; mi--)
    monthOptions.push({
      label: MONTHS[mi].label + (MONTHS[mi].partial ? "（11/24まで）" : ""),
      value: MONTHS[mi].k,
    });
  const yearOptions = [
    { label: "2026年（1〜11月）", value: "2026" },
    { label: "2025年", value: "2025" },
  ];

  const rec = [
    { date: "11/24(火)", cat: "食費", memo: "ランチ", type: "expense" as "expense" | "income", amt: 980 },
    { date: "11/24(火)", cat: "日用品", memo: "ドラッグストア", type: "expense" as "expense" | "income", amt: 1860 },
    { date: "11/23(月)", cat: "娯楽", memo: "映画", type: "expense" as "expense" | "income", amt: 2000 },
    { date: "11/23(月)", cat: "食費", memo: "スーパー", type: "expense" as "expense" | "income", amt: 4320 },
    { date: "11/22(日)", cat: "交通", memo: "ICチャージ", type: "expense" as "expense" | "income", amt: 3000 },
    { date: "11/22(日)", cat: "食費", memo: "外食", type: "expense" as "expense" | "income", amt: 4000 },
  ];
  const expenseCats = ["食費", "日用品", "交通", "住居・光熱", "通信", "娯楽", "衣服・美容", "医療", "その他"];
  const incomeCats = ["給与", "副収入", "お小遣い", "その他"];
  const qlist = kStored
    ? kStored[type].map((p) => p.name)
    : type === "expense"
      ? expenseCats
      : incomeCats;

  return {
    isMonth,
    cur,
    periodLabel,
    nMonths,
    fi,
    catMode,
    monthOptions,
    yearOptions,
    bars,
    chartAria,
    chartNote,
    expLegend: catMode ? filter : "支出",
    showIncLegend: !catMode,
    chartTitle: catMode
      ? filter + "の月別支出"
      : isMonth
        ? "6か月の収入と支出"
        : "月別の収入と支出",
    pieTitle,
    pieGradient,
    pieCenterLabel,
    pieCenterValue,
    slices,
    insights,
    incLabel: periodLabel + "の収入",
    expLabel: periodLabel + "の支出",
    netLabel: "収支 · 貯蓄率 " + (((cur.inc - cur.exp) / cur.inc) * 100).toFixed(1) + "%",
    incTotal: yen(cur.inc),
    expTotal: yen(cur.exp),
    netTotal: signed(cur.inc - cur.exp),
    filterTags: [
      { label: "全体", selected: !catMode, icon: null as LucideIcon | null },
      ...CATS.map((c) => ({ label: c, selected: filter === c, icon: iconFor(c, kMap) })),
    ],
    showDiff: isMonth && month === "2026-11",
    diffs: [
      { label: "娯楽", amount: "−¥6,800", tone: "success" as const },
      { label: "食費", amount: "+¥4,100", tone: "warning" as const },
      { label: "交通", amount: "+¥1,200", tone: "warning" as const },
    ],
    recent: rec.map((r) => ({
      date: r.date,
      cat: r.cat,
      memo: r.memo,
      Icon: iconFor(r.cat, kMap),
      amount: (r.type === "income" ? "+" : "−") + yen(r.amt),
      color: r.type === "income" ? "var(--blue-600)" : "var(--text-heading)",
    })),
    quickTabs: [
      { label: "支出", value: "expense" },
      { label: "収入", value: "income" },
    ],
    quickCats: qlist.map((c) => ({
      label: c,
      selected: c === cat,
      Icon: iconFor(c, kMap),
    })),
    saveLabel: type === "expense" ? "支出を記録する" : "収入を記録する",
  };
}

export type ViewModel = ReturnType<typeof computeViewModel>;
