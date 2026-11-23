"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Divider } from "@astryxdesign/core/Divider";
import { Icon } from "@astryxdesign/core/Icon";
import { InputGroup, InputGroupText } from "@astryxdesign/core/InputGroup";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import {
  isQuickExpenseCategory,
  QUICK_EXPENSE_AMOUNTS,
  QUICK_EXPENSE_CATEGORIES,
  type QuickExpenseCategory,
} from "./quickExpenseData";

const STORAGE_KEY = "kurashi.quick-transactions";

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function QuickExpenseModal({
  isOpen,
  onOpenChange,
  dateLabel,
  date,
  onSave,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  dateLabel: string;
  date: string;
  onSave: (amount: number, category: QuickExpenseCategory) => void;
}) {
  const [amountInput, setAmountInput] = useState("");
  const [savedAmount, setSavedAmount] = useState<number | null>(null);
  const [category, setCategory] = useState<QuickExpenseCategory | "">("");
  const [savedCategory, setSavedCategory] =
    useState<QuickExpenseCategory | null>(null);
  const [saveError, setSaveError] = useState("");
  const amountDigits = amountInput.replace(/\D/g, "");
  const amountValue = Number(amountDigits);
  const isAmountValid =
    amountDigits.length > 0 &&
    amountDigits.length <= 15 &&
    Number.isSafeInteger(amountValue) &&
    amountValue > 0;

  function handleOpenChange(nextIsOpen: boolean) {
    if (!nextIsOpen) {
      setAmountInput("");
      setSavedAmount(null);
      setCategory("");
      setSavedCategory(null);
      setSaveError("");
    }
    onOpenChange(nextIsOpen);
  }

  function saveExpense() {
    if (!isAmountValid || !isQuickExpenseCategory(category)) return;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) {
        setSaveError("保存済みの支出データを読み込めません。内容を確認してください。");
        return;
      }
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          ...parsed,
          { date, type: "expense", amount: amountValue, category },
        ]),
      );
    } catch {
      setSaveError("支出を保存できませんでした。ブラウザーの保存領域を確認してください。");
      return;
    }

    onSave(amountValue, category);
    setSavedAmount(amountValue);
    setSavedCategory(category);
    setSaveError("");
  }

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      purpose="form"
      width={480}
    >
      <VStack gap={4}>
        <DialogHeader
          title="今日の支出をすぐ記録"
          subtitle={dateLabel}
          onOpenChange={handleOpenChange}
        />
        {savedAmount !== null ? (
          <Card padding={5} variant="green">
            <VStack gap={4} hAlign="center">
              <Center axis="both" width={56} height={56}>
                <Icon icon="check" size="lg" color="success" />
              </Center>
              <VStack gap={1} hAlign="center">
                <Text type="large" weight="semibold">
                  記録しました
                </Text>
                <Text type="supporting" color="secondary">
                  ¥{savedAmount.toLocaleString("ja-JP")}
                </Text>
                {savedCategory ? (
                  <Text type="supporting" color="secondary">
                    {savedCategory}
                  </Text>
                ) : null}
              </VStack>
              <HStack gap={2} hAlign="center">
                <Button
                  label="もう1件入力"
                  variant="secondary"
                  onClick={() => {
                    setAmountInput("");
                    setCategory("");
                    setSavedAmount(null);
                    setSavedCategory(null);
                  }}
                />
                <Button
                  label="閉じる"
                  variant="primary"
                  onClick={() => handleOpenChange(false)}
                />
              </HStack>
            </VStack>
          </Card>
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
                setSaveError("");
              }}
              placeholder="項目を選択"
              isRequired
              presentation="adaptive"
            />
            <InputGroup label="支出金額" description="数字を入力してください">
              <InputGroupText>¥</InputGroupText>
              <TextInput
                label="支出金額"
                isLabelHidden
                value={amountInput}
                onChange={(value) => {
                  setAmountInput(formatAmountInput(value));
                  setSaveError("");
                }}
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
                    onClick={() => {
                      setAmountInput(amount.toLocaleString("ja-JP"));
                      setSaveError("");
                    }}
                  />
                ))}
              </HStack>
            </VStack>
            {saveError ? (
              <Text as="p" type="supporting">{saveError}</Text>
            ) : null}
            <Divider />
            <Button
              label="支出を記録する"
              variant="primary"
              width="100%"
              isDisabled={!isAmountValid || !category}
              onClick={saveExpense}
            />
          </VStack>
        )}
      </VStack>
    </Dialog>
  );
}
