"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { Divider } from "@astryxdesign/core/Divider";
import { Icon } from "@astryxdesign/core/Icon";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { InputGroup, InputGroupText } from "@astryxdesign/core/InputGroup";
import { Selector } from "@astryxdesign/core/Selector";
import { Heading, Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import {
  isQuickExpenseCategory,
  QUICK_EXPENSE_AMOUNTS,
  QUICK_EXPENSE_CATEGORIES,
  type QuickExpenseCategory,
} from "../../components/quickExpenseData";

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getTodayInJapan() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export default function QuickExpensePage() {
  const [amountInput, setAmountInput] = useState("");
  const [category, setCategory] = useState<QuickExpenseCategory | "">("");
  const [saved, setSaved] = useState(false);
  const [today, setToday] = useState("");
  const amountDigits = amountInput.replace(/\D/g, "");
  const amountValue = Number(amountDigits);
  const isAmountValid =
    today.length > 0 &&
    isQuickExpenseCategory(category) &&
    amountDigits.length > 0 &&
    amountDigits.length <= 15 &&
    Number.isSafeInteger(amountValue) &&
    amountValue > 0;
  useEffect(() => {
    const timer = window.setTimeout(() => setToday(getTodayInJapan()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const dateLabel =
    today &&
    new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(new Date(`${today}T12:00:00+09:00`));

  function saveExpense() {
    if (!isAmountValid || !isQuickExpenseCategory(category)) return;

    try {
      const stored = window.localStorage.getItem("kurashi.quick-transactions");
      const parsed = stored ? (JSON.parse(stored) as unknown[]) : [];
      const entries = Array.isArray(parsed) ? parsed : [];
      window.localStorage.setItem(
        "kurashi.quick-transactions",
        JSON.stringify([
          ...entries,
          { date: today, type: "expense", amount: amountValue, category },
        ]),
      );
    } catch {
      // The confirmation below still gives immediate feedback if storage is unavailable.
    }
    setSaved(true);
  }

  return (
    <Center axis="horizontal" width="100%" minHeight="100vh">
      <VStack
        as="main"
        width="100%"
        maxWidth={560}
        paddingInline={4}
        paddingBlock={6}
        gap={5}
      >
        <HStack hAlign="between" vAlign="center">
          <Button
            label="家計簿に戻る"
            href="/"
            as={Link}
            variant="ghost"
            size="sm"
            icon={<Icon icon="chevronLeft" />}
          />
          <Text type="supporting" color="secondary">
            今日の支出
          </Text>
        </HStack>

        <VStack gap={1}>
          <Text as="p" type="label" weight="semibold" color="accent">
            今日の支出をすぐ記録
          </Text>
          <Heading level={1}>金額を入力</Heading>
          <Text as="p" type="supporting">
            {dateLabel}
          </Text>
        </VStack>

        <Card padding={5} variant={saved ? "green" : "default"}>
          {saved ? (
            <VStack gap={4} hAlign="center">
              <Center axis="both" width={56} height={56}>
                <Icon icon="check" size="lg" color="success" />
              </Center>
              <VStack gap={1} hAlign="center">
                <Text type="large" weight="semibold">
                  記録しました
                </Text>
                <Text type="supporting" color="secondary">
                  ¥{amountValue.toLocaleString("ja-JP")}
                </Text>
                <Text type="supporting" color="secondary">
                  {category}
                </Text>
              </VStack>
              <HStack gap={2} hAlign="center">
                <Button
                  label="もう1件入力"
                  variant="secondary"
                  onClick={() => {
                    setAmountInput("");
                    setCategory("");
                    setSaved(false);
                  }}
                />
                <Button
                  label="家計簿を見る"
                  href="/"
                  as={Link}
                  variant="primary"
                />
              </HStack>
            </VStack>
          ) : (
            <VStack gap={4}>
              <Selector
                label="支出項目"
                description="記録する項目を選択してください。"
                options={[...QUICK_EXPENSE_CATEGORIES]}
                value={category}
                onChange={(value) => {
                  const nextCategory = QUICK_EXPENSE_CATEGORIES.find(
                    (option) => option === value,
                  );
                  setCategory(nextCategory ?? "");
                }}
                placeholder="項目を選択"
                isRequired
                presentation="adaptive"
              />
              <InputGroup
                label="支出金額"
                description="数字を入力してください"
              >
                <InputGroupText>¥</InputGroupText>
                <TextInput
                  label="支出金額"
                  isLabelHidden
                  value={amountInput}
                  onChange={(value) => setAmountInput(formatAmountInput(value))}
                  placeholder="0"
                  inputMode="numeric"
                  enterKeyHint="done"
                  hasAutoFocus
                  status={
                    amountDigits.length > 15
                      ? {
                          type: "error",
                          message: "金額は15桁以内で入力してください。",
                        }
                      : undefined
                  }
                />
              </InputGroup>

              <VStack gap={2}>
                <Text type="label" color="secondary">
                  よく使う金額
                </Text>
                <HStack gap={2}>
                  {QUICK_EXPENSE_AMOUNTS.map((amount) => (
                    <Button
                      key={amount}
                      label={`${amount.toLocaleString("ja-JP")}円`}
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setAmountInput(amount.toLocaleString("ja-JP"))
                      }
                    />
                  ))}
                </HStack>
              </VStack>

              <Divider />
              <Button
                label="支出を記録する"
                variant="primary"
                width="100%"
                isDisabled={!isAmountValid}
                onClick={saveExpense}
              />
            </VStack>
          )}
        </Card>
      </VStack>
    </Center>
  );
}
