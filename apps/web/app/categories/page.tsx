"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Grid } from "@astryxdesign/core/Grid";
import { InputGroup, InputGroupText } from "@astryxdesign/core/InputGroup";
import { List, ListItem } from "@astryxdesign/core/List";
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  StackItem,
  VStack,
} from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { fetchCategories, type ApiCategory } from "./api";

type CategoryType = "expense" | "income";

type CategoryItem = {
  id: string;
  name: string;
  amount: string;
};

type CategoryData = Record<CategoryType, CategoryItem[]>;

const STORAGE_KEY = "kurashi.categoryItems.v1";
const categoryTypes: CategoryType[] = ["expense", "income"];
const categoryLabels: Record<CategoryType, string> = {
  expense: "支出",
  income: "収入",
};
const initialCategories: CategoryData = {
  expense: [
    { id: "expense-food", name: "食費", amount: "" },
    { id: "expense-household", name: "日用品", amount: "" },
    { id: "expense-transport", name: "交通費", amount: "" },
    { id: "expense-housing", name: "住居費", amount: "" },
    { id: "expense-utilities", name: "光熱費", amount: "" },
    { id: "expense-entertainment", name: "娯楽", amount: "" },
  ],
  income: [
    { id: "income-salary", name: "給与", amount: "" },
    { id: "income-side", name: "副収入", amount: "" },
    { id: "income-other", name: "その他", amount: "" },
  ],
};
const currency = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});
const initialCategoriesSnapshot = JSON.stringify(initialCategories);
const unavailableSnapshot = "storage-unavailable";
const unsavedSnapshotPrefix = "storage-unsaved:";
const categoryListeners = new Set<() => void>();
let unsavedSnapshot: string | null = null;

function isCategoryItem(value: unknown): value is CategoryItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "amount" in value &&
    typeof value.amount === "string"
  );
}

function isCategoryData(value: unknown): value is CategoryData {
  if (
    typeof value !== "object" ||
    value === null ||
    !("expense" in value) ||
    !("income" in value) ||
    !Array.isArray(value.expense) ||
    !Array.isArray(value.income)
  ) {
    return false;
  }

  const items = [...value.expense, ...value.income];
  const ids = items.filter(isCategoryItem).map((item) => item.id);

  return (
    value.expense.every(isCategoryItem) &&
    value.income.every(isCategoryItem) &&
    new Set(ids).size === ids.length
  );
}

function getCategorySnapshot() {
  if (unsavedSnapshot) {
    return unsavedSnapshot;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? initialCategoriesSnapshot;
  } catch {
    return unavailableSnapshot;
  }
}

function getServerCategorySnapshot() {
  return initialCategoriesSnapshot;
}

function subscribeToCategories(listener: () => void) {
  categoryListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      unsavedSnapshot = null;
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => {
    categoryListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function saveCategories(categories: CategoryData) {
  const snapshot = JSON.stringify(categories);

  try {
    window.localStorage.setItem(STORAGE_KEY, snapshot);
    unsavedSnapshot = null;
  } catch {
    unsavedSnapshot = `${unsavedSnapshotPrefix}${snapshot}`;
  }

  categoryListeners.forEach((listener) => listener());
}

function decodeCategorySnapshot(snapshot: string) {
  if (snapshot === unavailableSnapshot) {
    return {
      categories: initialCategories,
      persistenceMessage:
        "ブラウザーの保存領域にアクセスできません。設定を確認してください。",
    };
  }

  const hasUnsavedChanges = snapshot.startsWith(unsavedSnapshotPrefix);
  const serialized = hasUnsavedChanges
    ? snapshot.slice(unsavedSnapshotPrefix.length)
    : snapshot;
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
    return {
      categories: initialCategories,
      persistenceMessage:
        "保存済みの項目データを読み込めません。内容を確認してください。",
    };
  }

  if (!isCategoryData(parsed)) {
    return {
      categories: initialCategories,
      persistenceMessage:
        "保存済みの項目データを読み込めません。内容を確認してください。",
    };
  }

  return {
    categories: parsed,
    persistenceMessage: hasUnsavedChanges
      ? "変更をブラウザーに保存できませんでした。保存領域を確認してください。"
      : null,
  };
}

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function parseAmount(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length > 15) {
    return null;
  }
  return digits ? Number(digits) : 0;
}

function sumAmounts(items: CategoryItem[]) {
  let total = 0;
  for (const item of items) {
    const amount = parseAmount(item.amount);
    if (amount === null) {
      continue;
    }
    const nextTotal = total + amount;
    if (!Number.isSafeInteger(nextTotal)) {
      return null;
    }
    total = nextTotal;
  }
  return total;
}

function formatCurrency(amount: number | null) {
  return amount === null ? "—" : currency.format(amount);
}

function getApiCategoryLabel(category: ApiCategory, index: number) {
  const name = category.name ?? category.category_name ?? category.title;
  const type = category.type ?? category.category_type;
  const label =
    typeof name === "string"
      ? name
      : typeof category.id === "string" || typeof category.id === "number"
        ? `カテゴリ ${category.id}`
        : `カテゴリ ${index + 1}`;

  return typeof type === "string" ? `${label}（${type}）` : label;
}

function CategoryGroup({
  type,
  items,
  newName,
  nameError,
  total,
  onNameChange,
  onAdd,
  onAmountChange,
  onDelete,
}: {
  type: CategoryType;
  items: CategoryItem[];
  newName: string;
  nameError: string | null;
  total: number | null;
  onNameChange: (value: string) => void;
  onAdd: () => void;
  onAmountChange: (id: string, value: string) => void;
  onDelete: (item: CategoryItem) => void;
}) {
  const label = categoryLabels[type];

  return (
    <Card padding={4}>
      <VStack gap={3}>
        <HStack hAlign="between" vAlign="center">
          <VStack gap={0.5}>
            <Heading level={2}>{label}項目</Heading>
            <Text as="p" type="supporting">
              {label}の項目を追加して、金額を入力できます。
            </Text>
          </VStack>
          <Text type="label" weight="semibold">
            {formatCurrency(total)}
          </Text>
        </HStack>

        <HStack gap={2} vAlign="center">
          <StackItem size="fill">
            <TextInput
              label={`${label}項目名`}
              value={newName}
              onChange={onNameChange}
              onEnter={onAdd}
              placeholder={type === "expense" ? "例: 食費" : "例: 給与"}
              status={
                nameError
                  ? { type: "error", message: nameError }
                  : undefined
              }
            />
          </StackItem>
          <Button
            label="項目を追加"
            variant="primary"
            isDisabled={!newName.trim()}
            onClick={onAdd}
          />
        </HStack>

        {items.length > 0 ? (
          <List
            header={<Text as="p" type="label">登録済みの項目</Text>}
            hasDividers
            edge="flush"
          >
            {items.map((item) => {
              const isAmountInvalid = parseAmount(item.amount) === null;

              return (
                <ListItem
                  key={item.id}
                  label={<Text as="p" type="label">{item.name}</Text>}
                  endContent={
                    <HStack gap={1} vAlign="center">
                      <InputGroup
                        label={`${label}項目の金額`}
                        isLabelHidden
                      >
                        <InputGroupText>¥</InputGroupText>
                        <TextInput
                          label={item.name}
                          isLabelHidden
                          value={item.amount}
                          onChange={(value) => onAmountChange(item.id, value)}
                          placeholder="0"
                          inputMode="numeric"
                          enterKeyHint="done"
                          width={112}
                          status={
                            isAmountInvalid
                              ? {
                                  type: "error",
                                  message: "金額は15桁以内で入力してください。",
                                }
                              : undefined
                          }
                        />
                      </InputGroup>
                      <Button
                        label={`${item.name}を削除`}
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item)}
                      >
                        削除
                      </Button>
                    </HStack>
                  }
                />
              );
            })}
          </List>
        ) : (
          <Text as="p" type="supporting">
            項目がありません。上から追加してください。
          </Text>
        )}
      </VStack>
    </Card>
  );
}

export default function CategoriesPage() {
  const categorySnapshot = useSyncExternalStore(
    subscribeToCategories,
    getCategorySnapshot,
    getServerCategorySnapshot,
  );
  const { categories, persistenceMessage } =
    decodeCategorySnapshot(categorySnapshot);
  const [newNames, setNewNames] = useState<Record<CategoryType, string>>({
    expense: "",
    income: "",
  });
  const [nameErrors, setNameErrors] = useState<
    Record<CategoryType, string | null>
  >({
    expense: null,
    income: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<{
    type: CategoryType;
    item: CategoryItem;
  } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiCategories, setApiCategories] = useState<ApiCategory[] | null>(
    null,
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);

  const expenseTotal = sumAmounts(categories.expense);
  const incomeTotal = sumAmounts(categories.income);
  const unformattedDifference =
    expenseTotal === null || incomeTotal === null
      ? null
      : incomeTotal - expenseTotal;
  const difference =
    unformattedDifference !== null &&
    Number.isSafeInteger(unformattedDifference)
      ? unformattedDifference
      : null;
  const hasInvalidAmounts = categoryTypes.some((type) =>
    categories[type].some((item) => parseAmount(item.amount) === null),
  );
  const hasTotalOverflow =
    expenseTotal === null || incomeTotal === null || difference === null;

  function updateName(type: CategoryType, value: string) {
    setNewNames((current) => ({ ...current, [type]: value }));
    setNameErrors((current) => ({ ...current, [type]: null }));
  }

  function addCategory(type: CategoryType) {
    const name = newNames[type].trim();
    if (!name) {
      setNameErrors((current) => ({
        ...current,
        [type]: "項目名を入力してください。",
      }));
      return;
    }
    if (name.length > 30) {
      setNameErrors((current) => ({
        ...current,
        [type]: "項目名は30文字以内で入力してください。",
      }));
      return;
    }
    if (categories[type].some((item) => item.name === name)) {
      setNameErrors((current) => ({
        ...current,
        [type]: "同じ名前の項目がすでにあります。",
      }));
      return;
    }

    saveCategories({
      ...categories,
      [type]: [
        ...categories[type],
        { id: crypto.randomUUID(), name, amount: "" },
      ],
    });
    setNewNames((current) => ({ ...current, [type]: "" }));
    setNameErrors((current) => ({ ...current, [type]: null }));
  }

  function updateAmount(type: CategoryType, id: string, value: string) {
    saveCategories({
      ...categories,
      [type]: categories[type].map((item) =>
        item.id === id
          ? { ...item, amount: formatAmountInput(value) }
          : item,
      ),
    });
  }

  function deleteCategory() {
    if (!deleteTarget) {
      return;
    }

    const { type, item } = deleteTarget;
    saveCategories({
      ...categories,
      [type]: categories[type].filter((category) => category.id !== item.id),
    });
    setDeleteTarget(null);
  }

  async function handleFetchCategories() {
    setApiError(null);
    setIsFetchingCategories(true);

    try {
      const fetchedCategories = await fetchCategories(email, password);
      setApiCategories(fetchedCategories);
      setPassword("");
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "カテゴリを取得できませんでした。",
      );
    } finally {
      setIsFetchingCategories(false);
    }
  }

  return (
    <>
      <Layout
        height="auto"
        contentWidth={1200}
        header={
          <LayoutHeader hasDivider padding={4}>
            <HStack hAlign="between" vAlign="center">
              <VStack gap={0.5}>
                <Text as="p" type="label" weight="semibold">
                  kurashi
                </Text>
                <Text as="p" type="supporting">
                  項目ごとの金額を管理
                </Text>
              </VStack>
              <Button
                label="家計トップへ"
                href="/"
                as={Link}
                variant="secondary"
              />
            </HStack>
          </LayoutHeader>
        }
        content={
          <LayoutContent role="main" padding={4}>
            <VStack gap={5}>
              <VStack gap={1}>
                <Heading level={1}>項目別の収支</Heading>
                <Text as="p" type="supporting">
                  支出・収入の項目を登録し、それぞれの金額と合計を確認できます。
                </Text>
              </VStack>

              <Card padding={4}>
                <VStack gap={3}>
                  <VStack gap={0.5}>
                    <Heading level={2}>APIからカテゴリを取得</Heading>
                    <Text as="p" type="supporting">
                      アカウントで認証し、登録済みのカテゴリ一覧を取得します。
                    </Text>
                  </VStack>
                  <TextInput
                    label="メールアドレス"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoCapitalize="none"
                    hasAutoCorrect={false}
                  />
                  <TextInput
                    label="パスワード"
                    type="password"
                    value={password}
                    onChange={setPassword}
                  />
                  <Button
                    label={isFetchingCategories ? "取得中..." : "カテゴリを取得"}
                    variant="primary"
                    isDisabled={!email.trim() || !password || isFetchingCategories}
                    onClick={handleFetchCategories}
                  />
                  {apiError && (
                    <Text as="p" type="supporting" role="alert">
                      {apiError}
                    </Text>
                  )}
                  {apiCategories !== null && (
                    apiCategories.length > 0 ? (
                      <List
                        header={<Text as="p" type="label">取得したカテゴリ</Text>}
                        hasDividers
                        edge="flush"
                      >
                        {apiCategories.map((category, index) => (
                          <ListItem
                            key={
                              typeof category.id === "string" ||
                              typeof category.id === "number"
                                ? category.id
                                : index
                            }
                            label={
                              <Text as="p" type="label">
                                {getApiCategoryLabel(category, index)}
                              </Text>
                            }
                          />
                        ))}
                      </List>
                    ) : (
                      <Text as="p" type="supporting">
                        登録済みのカテゴリはありません。
                      </Text>
                    )
                  )}
                </VStack>
              </Card>

              {persistenceMessage && (
                <Card padding={3} variant="muted">
                  <Text as="p" type="supporting" weight="semibold">
                    {persistenceMessage}
                  </Text>
                </Card>
              )}

              <Grid columns={{ minWidth: 220, max: 3 }} gap={3}>
                <Card padding={3} variant="red">
                  <VStack gap={1}>
                    <Text as="p" type="supporting">
                      支出合計
                    </Text>
                    <Text as="p" type="display-2" weight="semibold">
                      {formatCurrency(expenseTotal)}
                    </Text>
                  </VStack>
                </Card>
                <Card padding={3} variant="green">
                  <VStack gap={1}>
                    <Text as="p" type="supporting">
                      収入合計
                    </Text>
                    <Text as="p" type="display-2" weight="semibold">
                      {formatCurrency(incomeTotal)}
                    </Text>
                  </VStack>
                </Card>
                <Card padding={3} variant="muted">
                  <VStack gap={1}>
                    <Text as="p" type="supporting">
                      収支差額
                    </Text>
                    <Text as="p" type="display-2" weight="semibold">
                      {formatCurrency(difference)}
                    </Text>
                  </VStack>
                </Card>
              </Grid>

              {hasInvalidAmounts && (
                <Text as="p" type="supporting">
                  金額が15桁を超える項目は合計に含まれていません。
                </Text>
              )}
              {hasTotalOverflow && (
                <Text as="p" type="supporting">
                  合計が安全に表示できる範囲を超えています。
                </Text>
              )}

              <Grid columns={{ minWidth: 320, max: 2 }} gap={4} align="start">
                {categoryTypes.map((type) => (
                  <CategoryGroup
                    key={type}
                    type={type}
                    items={categories[type]}
                    newName={newNames[type]}
                    nameError={nameErrors[type]}
                    total={
                      type === "expense" ? expenseTotal : incomeTotal
                    }
                    onNameChange={(value) => updateName(type, value)}
                    onAdd={() => addCategory(type)}
                    onAmountChange={(id, value) =>
                      updateAmount(type, id, value)
                    }
                    onDelete={(item) => setDeleteTarget({ type, item })}
                  />
                ))}
              </Grid>
            </VStack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider padding={4}>
            <Text as="p" type="supporting">
              項目と金額はこのブラウザーに自動保存されます。
            </Text>
          </LayoutFooter>
        }
      />

      <Dialog
        isOpen={deleteTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleteTarget(null);
          }
        }}
        purpose="info"
      >
        <VStack gap={3}>
          <DialogHeader
            title="項目を削除しますか？"
            subtitle={deleteTarget?.item.name}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setDeleteTarget(null);
              }
            }}
          />
          <Text as="p" type="supporting">
            登録した金額も削除されます。この操作は取り消せません。
          </Text>
          <HStack hAlign="end" gap={2}>
            <Button
              label="キャンセル"
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
            />
            <Button
              label="削除する"
              variant="destructive"
              onClick={deleteCategory}
            />
          </HStack>
        </VStack>
      </Dialog>
    </>
  );
}
