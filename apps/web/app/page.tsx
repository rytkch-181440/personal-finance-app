import Image from "next/image";
import { Button, Center, Heading, Link, Stack, Text, VStack } from "@astryxdesign/core";

export default function Home() {
  return (
    <Center width="100%" minHeight="100vh" padding={6}>
      <VStack as="main" width="100%" maxWidth={768} gap={8} paddingBlock={8}>
        <Image
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <VStack gap={6}>
          <Heading level={1}>
            To get started, edit the home page file.
          </Heading>
          <Text as="p" type="large" color="secondary">
            Looking for a starting point or more instructions? Head over to{" "}
            <Link
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              type="inherit"
              weight="semibold"
            >
              Templates
            </Link>{" "}
            or the{" "}
            <Link
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              type="inherit"
              weight="semibold"
            >
              Learning
            </Link>{" "}
            center.
          </Text>
        </VStack>
        <Stack direction="horizontal" gap={4} wrap="wrap">
          <Button
            label="Deploy Now"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            icon={
              <Image
                src="/vercel.svg"
                alt=""
                width={16}
                height={14}
              />
            }
          />
          <Button
            label="Documentation"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
          />
        </Stack>
      </VStack>
    </Center>
  );
}
