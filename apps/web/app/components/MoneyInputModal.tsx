"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Divider } from "@astryxdesign/core/Divider";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { InputGroup, InputGroupText } from "@astryxdesign/core/InputGroup";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { TextInput } from "@astryxdesign/core/TextInput";

export type MoneyInputEntry = {
  type: "expense" | "income";
  amount: number;
};

type MoneyInputModalProps = {
  isOpen: boolean;
  dateLabel: string;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (entry: MoneyInputEntry) => void;
};

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function MoneyInputModal({
  isOpen,
  dateLabel,
  onOpenChange,
  onSave,
}: MoneyInputModalProps) {
  const [entryType, setEntryType] = useState<MoneyInputEntry["type"]>("expense");
  const [amountInput, setAmountInput] = useState("");
  const amountDigits = amountInput.replace(/\D/g, "");
  const amountValue = Number(amountDigits);
  const isAmountValid =
    amountDigits.length > 0 &&
    amountDigits.length <= 15 &&
    Number.isSafeInteger(amountValue) &&
    amountValue > 0;

  function handleOpenChange(nextIsOpen: boolean) {
    if (!nextIsOpen) {
      setEntryType("expense");
      setAmountInput("");
    }
    onOpenChange(nextIsOpen);
  }

  function saveEntry() {
    if (!isAmountValid) {
      return;
    }

    onSave({ type: entryType, amount: amountValue });
    handleOpenChange(false);
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
          title="金額を入力"
          subtitle={dateLabel}
          onOpenChange={handleOpenChange}
        />
        <VStack gap={4}>
          <SegmentedControl
            label="収支の種類"
            value={entryType}
            onChange={(value) => {
              if (value === "expense" || value === "income") {
                setEntryType(value);
              }
            }}
            layout="fill"
          >
            <SegmentedControlItem value="expense" label="支出" />
            <SegmentedControlItem value="income" label="収入" />
          </SegmentedControl>
          <InputGroup
            label="金額"
            description="数字を入力すると、桁ごとにカンマが入ります。"
          >
            <InputGroupText>¥</InputGroupText>
            <TextInput
              label="金額"
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
        </VStack>
        <Divider />
        <HStack hAlign="end" gap={2}>
          <Button
            label="キャンセル"
            variant="secondary"
            onClick={() => handleOpenChange(false)}
          />
          <Button
            label="保存する"
            variant="primary"
            isDisabled={!isAmountValid}
            onClick={saveEntry}
          />
        </HStack>
      </VStack>
    </Dialog>
  );
}