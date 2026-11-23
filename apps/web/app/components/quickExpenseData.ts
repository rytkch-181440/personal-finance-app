export const QUICK_EXPENSE_CATEGORIES = [
  "食費",
  "日用品",
  "交通費",
  "住居費",
  "光熱費",
  "娯楽",
] as const;

export type QuickExpenseCategory = (typeof QUICK_EXPENSE_CATEGORIES)[number];

export const QUICK_EXPENSE_AMOUNTS = [300, 500, 1000, 3000, 5000] as const;

export function isQuickExpenseCategory(
  value: unknown,
): value is QuickExpenseCategory {
  return (
    typeof value === "string" &&
    QUICK_EXPENSE_CATEGORIES.some((category) => category === value)
  );
}
