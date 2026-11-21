"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Icon } from "@astryxdesign/core/Icon";
import { HStack, Layout, LayoutContent, LayoutHeader, VStack } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { Heading, Text } from "@astryxdesign/core/Text";

 type TransactionType = "expense" | "income";
 type Period = "month" | "year" | "all";

type AnalysisTransaction = {
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
};

const currency = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const analysisTransactions: AnalysisTransaction[] = [
  { date: "2025-01-25", type: "expense", category: "住居費", amount: 82000 },
  { date: "2025-02-28", type: "expense", category: "住居費", amount: 82000 },
  { date: "2025-03-27", type: "expense", category: "住居費", amount: 82000 },
  { date: "2025-04-26", type: "expense", category: "住居費", amount: 82000 },
  { date: "2025-05-28", type: "expense", category: "住居費", amount: 82000 },
  { date: "2025-06-27", type: "expense", category: "住居費", amount: 82000 },
  { date: "2025-07-25", type: "expense", category: "住居費", amount: 82000 },
  { date: "2025-08-28", type: "expense", category: "住居費", amount: 82000 },
  { date: "2025-09-26", type: "expense", category: "住居費", amount: 82000 },
  { date: "2025-10-28", type: "expense", category: "住居費", amount: 82000 },
  { date: "2025-11-27", type: "expense", category: "住居費", amount: 82000 },
  { date: "2025-12-26", type: "expense", category: "住居費", amount: 82000 },
  { date: "2026-01-27", type: "expense", category: "住居費", amount: 84000 },
  { date: "2026-02-26", type: "expense", category: "住居費", amount: 84000 },
  { date: "2026-03-27", type: "expense", category: "住居費", amount: 84000 },
  { date: "2026-04-27", type: "expense", category: "住居費", amount: 84000 },
  { date: "2026-05-27", type: "expense", category: "住居費", amount: 84000 },
  { date: "2026-06-27", type: "expense", category: "住居費", amount: 84000 },
  { date: "2026-07-27", type: "expense", category: "住居費", amount: 84000 },
  { date: "2026-08-27", type: "expense", category: "住居費", amount: 84000 },
  { date: "2026-09-27", type: "expense", category: "住居費", amount: 84000 },
  { date: "2026-10-27", type: "expense", category: "住居費", amount: 84000 },
  { date: "2026-11-27", type: "expense", category: "住居費", amount: 84000 },

  { date: "2026-01-25", type: "income", category: "給与", amount: 320000 },
  { date: "2026-02-25", type: "income", category: "給与", amount: 320000 },
  { date: "2026-03-25", type: "income", category: "給与", amount: 320000 },
  { date: "2026-04-25", type: "income", category: "給与", amount: 324000 },
  { date: "2026-05-25", type: "income", category: "給与", amount: 324000 },
  { date: "2026-06-25", type: "income", category: "給与", amount: 324000 },
  { date: "2026-07-25", type: "income", category: "給与", amount: 328000 },
  { date: "2026-08-25", type: "income", category: "給与", amount: 328000 },
  { date: "2026-09-25", type: "income", category: "給与", amount: 328000 },
  { date: "2026-10-25", type: "income", category: "給与", amount: 328000 },
  { date: "2026-11-25", type: "income", category: "給与", amount: 328000 },
  { date: "2025-12-10", type: "income", category: "副収入", amount: 45000 },
  { date: "2026-03-15", type: "income", category: "副収入", amount: 52000 },
  { date: "2026-06-15", type: "income", category: "副収入", amount: 48000 },
  { date: "2026-09-15", type: "income", category: "副収入", amount: 61000 },
  { date: "2026-11-15", type: "income", category: "副収入", amount: 58000 },

  { date: "2026-11-01", type: "expense", category: "食費", amount: 4800 },
  { date: "2026-11-03", type: "expense", category: "食費", amount: 1280 },
  { date: "2026-11-05", type: "expense", category: "食費", amount: 3600 },
  { date: "2026-11-08", type: "expense", category: "交通費", amount: 2400 },
  { date: "2026-11-09", type: "expense", category: "娯楽", amount: 6800 },
  { date: "2026-11-11", type: "expense", category: "交通費", amount: 1750 },
  { date: "2026-11-12", type: "expense", category: "光熱費", amount: 3200 },
  { date: "2026-11-14", type: "expense", category: "日用品", amount: 920 },
  { date: "2026-11-15", type: "expense", category: "日用品", amount: 5400 },
  { date: "2026-11-17", type: "expense", category: "交通費", amount: 2100 },
  { date: "2026-11-18", type: "expense", category: "娯楽", amount: 8200 },
  { date: "2026-11-20", type: "expense", category: "食費", amount: 1680 },
  { date: "2026-11-21", type: "expense", category: "日用品", amount: 3450 },
  { date: "2026-11-23", type: "expense", category: "光熱費", amount: 980 },
  { date: "2026-11-24", type: "expense", category: "娯楽", amount: 6100 },
  { date: "2026-11-26", type: "expense", category: "交通費", amount: 2300 },
  { date: "2026-11-27", type: "expense", category: "住居費", amount: 84000 },
  { date: "2026-11-29", type: "expense", category: "食費", amount: 4100 },
  { date: "2026-11-30", type: "expense", category: "娯楽", amount: 1800 },

  { date: "2026-10-05", type: "expense", category: "食費", amount: 28000 },
  { date: "2026-09-07", type: "expense", category: "食費", amount: 26000 },
  { date: "2026-08-04", type: "expense", category: "食費", amount: 24000 },
  { date: "2026-07-06", type: "expense", category: "食費", amount: 25000 },
  { date: "2026-06-08", type: "expense", category: "食費", amount: 22000 },
  { date: "2026-05-09", type: "expense", category: "食費", amount: 23000 },
];

const periodLabels: Record<Period, string> = {
  month: "1ヶ月",
  year: "1年",
  all: "全期間",
};

const typeLabels: Record<TransactionType, string> = {
  expense: "支出",
  income: "収入",
};

function filterByPeriod(transactions: AnalysisTransaction[], period: Period) {
  if (period === "all") {
    return transactions;
  }
  if (period === "month") {
    return transactions.filter((transaction) => transaction.date.startsWith("2026-11"));
  }
  return transactions.filter((transaction) => transaction.date.startsWith("2026"));
}

function groupByCategory(transactions: AnalysisTransaction[]) {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]);
}

function groupByMonth(transactions: AnalysisTransaction[]) {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    const month = transaction.date.slice(0, 7);
    totals.set(month, (totals.get(month) ?? 0) + transaction.amount);
  }
  return [...totals.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function groupByDay(transactions: AnalysisTransaction[]) {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    totals.set(transaction.date, (totals.get(transaction.date) ?? 0) + transaction.amount);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]);
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-");
  return `${year}年${Number(monthNumber)}月`;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [type, setType] = useState<TransactionType>("expense");

  const periodTransactions = filterByPeriod(analysisTransactions, period).filter(
    (transaction) => transaction.type === type,
  );
  const total = periodTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const categoryTotals = groupByCategory(periodTransactions);
  const monthlyTotals = groupByMonth(periodTransactions);
  const dailyTotals = groupByDay(periodTransactions);
  const topCategory = categoryTotals[0];
  const averagePerEntry = periodTransactions.length
    ? Math.round(total / periodTransactions.length)
    : 0;
  const maxCategoryAmount = categoryTotals[0]?.[1] ?? 0;
  const peakDay = dailyTotals[0];

  return (
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
                統計分析
              </Text>
            </VStack>
            <HStack gap={2}>
              <Button
                label="家計トップへ"
                href="/"
                as={Link}
                variant="secondary"
              />
              <Button
                label="項目別収支"
                href="/categories"
                as={Link}
                variant="secondary"
              />
            </HStack>
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent role="main" padding={4}>
          <VStack gap={5}>
            <VStack gap={1}>
              <Heading level={1}>統計分析</Heading>
              <Text as="p" type="supporting">
                支出と収入の傾向を期間、項目、日付ごとに確認できます。
              </Text>
            </VStack>

            <HStack hAlign="between" vAlign="center" gap={3}>
              <SegmentedControl
                label="分析期間"
                value={period}
                onChange={(value) => setPeriod(value as Period)}
                layout="hug"
              >
                <SegmentedControlItem value="month" label="1ヶ月" />
                <SegmentedControlItem value="year" label="1年" />
                <SegmentedControlItem value="all" label="全期間" />
              </SegmentedControl>

              <SegmentedControl
                label="収支の種類"
                value={type}
                onChange={(value) => setType(value as TransactionType)}
                layout="hug"
              >
                <SegmentedControlItem value="expense" label="支出" />
                <SegmentedControlItem value="income" label="収入" />
              </SegmentedControl>
            </HStack>

            <Grid columns={{ minWidth: 220, max: 4 }} gap={3}>
              <Card padding={4} variant={type === "expense" ? "red" : "green"}>
                <VStack gap={2}>
                  <HStack gap={2} vAlign="center">
                    <Icon
                      icon={type === "expense" ? "arrowDown" : "arrowUp"}
                      color={type === "expense" ? "error" : "success"}
                      size="sm"
                    />
                    <Text type="label" color="secondary">期間合計</Text>
                  </HStack>
                  <Text as="p" type="display-2" weight="semibold">
                    {currency.format(total)}
                  </Text>
                  <Text type="supporting">{periodLabels[period]}の{typeLabels[type]}</Text>
                </VStack>
              </Card>

              <Card padding={4}>
                <VStack gap={2}>
                  <Text type="label" color="secondary">1件あたり平均</Text>
                  <Text as="p" type="display-2" weight="semibold">
                    {currency.format(averagePerEntry)}
                  </Text>
                  <Text type="supporting">登録件数 {periodTransactions.length}件</Text>
                </VStack>
              </Card>

              <Card padding={4}>
                <VStack gap={2}>
                  <Text type="label" color="secondary">最大の項目</Text>
                  <Text as="p" type="display-2" weight="semibold">
                    {topCategory?.[0] ?? "なし"}
                  </Text>
                  <Text type="supporting">
                    {topCategory ? currency.format(topCategory[1]) : "データなし"}
                  </Text>
                </VStack>
              </Card>

              <Card padding={4}>
                <VStack gap={2}>
                  <Text type="label" color="secondary">最大の日</Text>
                  <Text as="p" type="display-2" weight="semibold">
                    {peakDay?.[0] ? peakDay[0].slice(5).replace("-", "月") + "日" : "なし"}
                  </Text>
                  <Text type="supporting">
                    {peakDay ? currency.format(peakDay[1]) : "データなし"}
                  </Text>
                </VStack>
              </Card>
            </Grid>

            <Grid columns={{ minWidth: 320, max: 2 }} gap={4} align="start">
              <Card padding={4}>
                <VStack gap={4}>
                  <VStack gap={1}>
                    <Heading level={2}>項目別の傾向</Heading>
                    <Text as="p" type="supporting">
                      {typeLabels[type]}が多い項目から確認できます。
                    </Text>
                  </VStack>
                  {categoryTotals.length > 0 ? (
                    <VStack gap={3}>
                      {categoryTotals.map(([category, amount]) => (
                        <VStack key={category} gap={1}>
                          <HStack hAlign="between" vAlign="center">
                            <Text type="label" weight="semibold">{category}</Text>
                            <Text type="supporting">{currency.format(amount)}</Text>
                          </HStack>
                          <ProgressBar
                            label={`${category}の${typeLabels[type]}合計`}
                            value={amount}
                            max={maxCategoryAmount}
                            isLabelHidden
                            variant={type === "expense" ? "error" : "success"}
                            hasValueLabel
                            formatValueLabel={() => `${Math.round((amount / maxCategoryAmount) * 100)}%`}
                          />
                        </VStack>
                      ))}
                    </VStack>
                  ) : (
                    <Text as="p" type="supporting">該当する項目がありません。</Text>
                  )}
                </VStack>
              </Card>

              <Card padding={4}>
                <VStack gap={4}>
                  <VStack gap={1}>
                    <Heading level={2}>月別の推移</Heading>
                    <Text as="p" type="supporting">
                      登録金額の月ごとの変化です。
                    </Text>
                  </VStack>
                  {monthlyTotals.length > 0 ? (
                    <List hasDividers edge="flush">
                      {monthlyTotals.map(([month, amount]) => {
                        const max = Math.max(...monthlyTotals.map((item) => item[1]), 1);
                        return (
                          <ListItem
                            key={month}
                            label={formatMonth(month)}
                            description={currency.format(amount)}
                            endContent={
                              <ProgressBar
                                label={`${formatMonth(month)}の${typeLabels[type]}`}
                                value={amount}
                                max={max}
                                isLabelHidden
                                variant={type === "expense" ? "error" : "success"}
                              />
                            }
                          />
                        );
                      })}
                    </List>
                  ) : (
                    <Text as="p" type="supporting">該当する月のデータがありません。</Text>
                  )}
                </VStack>
              </Card>
            </Grid>

            <Card padding={4}>
              <VStack gap={4}>
                <VStack gap={1}>
                  <Heading level={2}>日付別の傾向</Heading>
                  <Text as="p" type="supporting">
                    金額の大きい日から確認できます。
                  </Text>
                </VStack>
                {dailyTotals.length > 0 ? (
                  <List hasDividers edge="flush">
                    {dailyTotals.slice(0, 10).map(([date, amount]) => {
                      const dateLabel = new Date(`${date}T12:00:00+09:00`).toLocaleDateString("ja-JP", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      });
                      return (
                        <ListItem
                          key={date}
                          label={dateLabel}
                          description={typeLabels[type]}
                          endContent={
                            <Text type="label" weight="semibold">
                              {currency.format(amount)}
                            </Text>
                          }
                        />
                      );
                    })}
                  </List>
                ) : (
                  <Text as="p" type="supporting">該当する日のデータがありません。</Text>
                )}
              </VStack>
            </Card>

            <Text as="p" type="supporting">
              ※ 表示金額は画面イメージ用のサンプルです。
            </Text>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
