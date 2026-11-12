import { connection } from "next/server";
import { Suspense } from "react";
import { Center } from "@astryxdesign/core/Center";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/Layout";
import Dashboard from "./dashboard";

type ISODateString = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

function getTodayInJapan(): ISODateString {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to determine today's date in Japan.");
  }

  return `${year}-${month}-${day}` as ISODateString;
}

async function CurrentDashboard() {
  await connection();
  return <Dashboard initialDate={getTodayInJapan()} />;
}

function DashboardFallback() {
  return (
    <Center axis="both" minHeight="100vh">
      <VStack gap={2} hAlign="center">
        <Text type="large" weight="semibold">
          kurashi
        </Text>
        <Text as="p" type="supporting">
          画面を準備しています
        </Text>
      </VStack>
    </Center>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <CurrentDashboard />
    </Suspense>
  );
}
