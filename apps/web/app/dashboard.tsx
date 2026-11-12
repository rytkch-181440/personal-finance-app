"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { Divider } from "@astryxdesign/core/Divider";
import { Grid } from "@astryxdesign/core/Grid";
import { Icon } from "@astryxdesign/core/Icon";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { useCalendarDays, useCalendarNavigation } from "@astryxdesign/core/Calendar";
import { Heading, Text } from "@astryxdesign/core/Text";

const spendingByDay = new Map([
  [1, 4800],
  [3, 1280],
  [5, 3600],
  [6, 520],
  [8, 2400],
  [9, 6800],
  [11, 1750],
  [12, 3200],
  [14, 920],
  [15, 5400],
  [17, 2100],
  [18, 8200],
  [20, 1680],
  [21, 3450],
  [23, 980],
  [24, 6100],
  [26, 2300],
  [27, 1240],
  [29, 4100],
  [30, 1800],
]);

const monthlyExpense = Array.from(spendingByDay.values()).reduce(
  (total, amount) => total + amount,
  0,
);
const monthlyIncome = 320000;
const currency = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});
const weekdayFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "long",
});
type ISODateString = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

function formatCompactAmount(amount: number) {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k`;
  }
  return amount.toLocaleString("ja-JP");
}

function formatISODate(year: number, month: number, day: number): ISODateString {
  const paddedYear = String(year).padStart(4, "0");
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  return `${paddedYear}-${paddedMonth}-${paddedDay}` as ISODateString;
}

function SummaryCard({
  label,
  amount,
  description,
  icon,
  variant,
}: {
  label: string;
  amount: number;
  description: string;
  icon: "arrowDown" | "arrowUp";
  variant: "red" | "green";
}) {
  return (
    <Card padding={4} variant={variant}>
      <VStack gap={3}>
        <HStack gap={2} vAlign="center">
          <Icon
            icon={icon}
            color={variant === "red" ? "error" : "success"}
            size="sm"
          />
          <Text as="p" type="label" color="secondary">
            {label}
          </Text>
        </HStack>
        <VStack gap={1}>
          <Text as="p" type="display-2" weight="semibold">
            {currency.format(amount)}
          </Text>
          <Text as="p" type="supporting">
            {description}
          </Text>
        </VStack>
      </VStack>
    </Card>
  );
}

export default function Dashboard({ initialDate }: { initialDate: ISODateString }) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const {
    monthYearLabel,
    visibleCalendarMonths,
    navigateMonth,
  } = useCalendarNavigation({ initialValue: initialDate });
  const { year, month } = visibleCalendarMonths[0];
  const { weeks, dayNames } = useCalendarDays({
    year,
    month,
    weekStartsOn: 0,
    hasVariableRowCount: true,
  });
  const selectedDay = Number(selectedDate.slice(-2));
  const selectedAmount = spendingByDay.get(selectedDay) ?? 0;
  const selectedDateLabel = weekdayFormatter.format(
    new Date(`${selectedDate}T12:00:00+09:00`),
  );

  function changeMonth(delta: number) {
    const nextMonth = new Date(Date.UTC(year, month - 1 + delta, 1));
    const nextDate = formatISODate(
      nextMonth.getUTCFullYear(),
      nextMonth.getUTCMonth() + 1,
      1,
    );
    navigateMonth(delta);
    setSelectedDate(nextDate);
  }

  return (
    <Center axis="horizontal" width="100%">
      <VStack
        as="main"
        width="100%"
        maxWidth={1200}
        paddingInline={4}
        paddingBlock={6}
        gap={6}
      >
        <HStack hAlign="between" vAlign="center">
          <HStack gap={2} vAlign="center">
            <Center
              axis="both"
              width={40}
              height={40}
              aria-hidden="true"
            >
              <Text type="large" weight="bold" color="accent">
                暮
              </Text>
            </Center>
            <VStack gap={0.5}>
              <Text as="p" type="label" weight="semibold">
                kurashi
              </Text>
              <Text as="p" type="supporting">
                あなたの家計を、すっきり見える化
              </Text>
            </VStack>
          </HStack>
          <Text type="supporting" color="secondary">
            サンプルデータ
          </Text>
        </HStack>

        <VStack gap={1}>
          <Heading level={1}>今月の家計</Heading>
          <Text as="p" type="supporting">
            収入と支出のバランスをひと目で確認できます。
          </Text>
        </VStack>

        <Grid columns={{ minWidth: 250, max: 2 }} gap={3}>
          <SummaryCard
            label="今月の支出"
            amount={monthlyExpense}
            description="日別の支出をカレンダーで確認"
            icon="arrowDown"
            variant="red"
          />
          <SummaryCard
            label="今月の収入"
            amount={monthlyIncome}
            description="給与・その他の収入"
            icon="arrowUp"
            variant="green"
          />
        </Grid>

        <Grid columns={{ minWidth: 320, max: 2 }} gap={4} align="start">
          <Card padding={4}>
            <VStack gap={4}>
              <HStack hAlign="between" vAlign="center">
                <VStack gap={1}>
                  <Heading level={2}>日別の支出</Heading>
                  <Text as="p" type="supporting">
                    日付を選ぶと、その日の合計を確認できます
                  </Text>
                </VStack>
                <HStack gap={1} vAlign="center">
                  <Button
                    label="前の月"
                    variant="ghost"
                    size="sm"
                    icon={<Icon icon="chevronLeft" />}
                    isIconOnly
                    onClick={() => changeMonth(-1)}
                  />
                  <Button
                    label="次の月"
                    variant="ghost"
                    size="sm"
                    icon={<Icon icon="chevronRight" />}
                    isIconOnly
                    onClick={() => changeMonth(1)}
                  />
                </HStack>
              </HStack>

              <HStack hAlign="between" vAlign="center">
                <Heading level={3}>{monthYearLabel}</Heading>
                <Text type="supporting">金額は円</Text>
              </HStack>

              <VStack gap={1.5}>
                <Grid columns={7} gap={0.5}>
                  {dayNames.map((dayName) => (
                    <Center axis="horizontal" key={dayName}>
                      <Text as="p" type="label" color="secondary">
                        {dayName}
                      </Text>
                    </Center>
                  ))}
                </Grid>
                {weeks.map((week) => (
                  <Grid columns={7} gap={0.5} key={week[0].iso}>
                    {week.map((day) => {
                      const amount = day.isOutside
                        ? 0
                        : (spendingByDay.get(day.dayNumber) ?? 0);
                      const isSelected = selectedDate === day.iso;

                      return (
                        <VStack key={day.iso} gap={0.5} hAlign="center">
                          <Button
                            label={`${day.iso}、${amount ? currency.format(amount) : "支出なし"}`}
                            variant={isSelected ? "primary" : "ghost"}
                            size="sm"
                            width="100%"
                            isDisabled={day.isOutside}
                            onClick={() => setSelectedDate(day.iso)}
                          >
                            {day.dayNumber}
                          </Button>
                          <Text
                            as="p"
                            type="supporting"
                            color={amount ? "inherit" : "disabled"}
                          >
                            {amount ? formatCompactAmount(amount) : "·"}
                          </Text>
                        </VStack>
                      );
                    })}
                  </Grid>
                ))}
              </VStack>
              <HStack gap={2} vAlign="center">
                <Icon icon="info" color="secondary" size="xsm" />
                <Text as="p" type="supporting">
                  日付を選択すると、その日の支出合計を確認できます。
                </Text>
              </HStack>
            </VStack>
          </Card>

          <VStack gap={4}>
            <Card padding={4}>
              <VStack gap={3}>
                <VStack gap={1}>
                  <Text as="p" type="label" color="secondary">
                    選択した日
                  </Text>
                  <Heading level={3}>{selectedDateLabel}</Heading>
                </VStack>
                <Divider />
                <VStack gap={1}>
                  <Text as="p" type="supporting">
                    この日の支出合計
                  </Text>
                  <Text type="display-2" weight="semibold">
                    {currency.format(selectedAmount)}
                  </Text>
                  <Text as="p" type="supporting">
                    {selectedAmount
                      ? "日別の支出を合計しています"
                      : "この日の支出記録はありません"}
                  </Text>
                </VStack>
              </VStack>
            </Card>

            <Card padding={4} variant="muted">
              <VStack gap={3}>
                <Heading level={3}>今月の記録</Heading>
                <HStack hAlign="between" vAlign="center">
                  <Text as="p" type="supporting">
                    支出があった日
                  </Text>
                  <Text type="label" weight="semibold">
                    {spendingByDay.size}日
                  </Text>
                </HStack>
                <Divider />
                <HStack hAlign="between" vAlign="center">
                  <Text as="p" type="supporting">
                    支出のある日の平均
                  </Text>
                  <Text type="label" weight="semibold">
                    {currency.format(Math.round(monthlyExpense / spendingByDay.size))}
                  </Text>
                </HStack>
                <Divider />
                <HStack hAlign="between" vAlign="center">
                  <Text as="p" type="supporting">
                    収入との差引
                  </Text>
                  <Text type="label" weight="semibold">
                    {currency.format(monthlyIncome - monthlyExpense)}
                  </Text>
                </HStack>
              </VStack>
            </Card>
          </VStack>
        </Grid>

        <Text as="p" type="supporting">
          ※ 表示金額は画面イメージ用のサンプルです。
        </Text>
      </VStack>
    </Center>
  );
}
