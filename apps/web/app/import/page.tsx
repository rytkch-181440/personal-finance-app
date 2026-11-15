"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { FileInput } from "@astryxdesign/core/FileInput";
import { Grid } from "@astryxdesign/core/Grid";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  VStack,
} from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";

type ImportSource = "credit-card" | "amazon";

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 }).format(size / 1024)} KB`;
  }
  return `${new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 }).format(size / (1024 * 1024))} MB`;
}

export default function ImportPage() {
  const [source, setSource] = useState<ImportSource>("credit-card");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  function handleSourceChange(value: string) {
    if (value === "credit-card" || value === "amazon") {
      setSource(value);
    }
  }

  function handleFileChange(files: File | File[] | null) {
    const selectedFile = Array.isArray(files) ? files[0] ?? null : files;

    if (!selectedFile) {
      setFile(null);
      setFileError(null);
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setFileError("CSVファイルを選択してください。");
      return;
    }

    setFile(selectedFile);
    setFileError(null);
  }

  return (
    <Layout
      height="auto"
      contentWidth={900}
      header={
        <LayoutHeader hasDivider padding={4}>
          <HStack hAlign="between" vAlign="center">
            <VStack gap={0.5}>
              <Text as="p" type="label" weight="semibold">
                kurashi
              </Text>
              <Text as="p" type="supporting">
                明細を取り込む
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
              <Heading level={1}>CSV明細の取り込み</Heading>
              <Text as="p" type="supporting">
                クレジットカードの利用明細やAmazonの購入履歴を選択できます。
              </Text>
            </VStack>

            <Card padding={4}>
              <VStack gap={4}>
                <VStack gap={1}>
                  <Heading level={2}>取り込み元を選択</Heading>
                  <Text as="p" type="supporting">
                    アップロードするCSVの種類を選んでください。
                  </Text>
                </VStack>
                <RadioList
                  label="取り込み元"
                  isLabelHidden
                  value={source}
                  onChange={handleSourceChange}
                  orientation="horizontal"
                >
                  <RadioListItem
                    label="クレジットカード明細"
                    value="credit-card"
                    description="カード会社からダウンロードしたCSV"
                  />
                  <RadioListItem
                    label="Amazon購入履歴"
                    value="amazon"
                    description="AmazonからダウンロードしたCSV"
                  />
                </RadioList>
              </VStack>
            </Card>

            <Card padding={4}>
              <VStack gap={4}>
                <VStack gap={1}>
                  <Heading level={2}>CSVファイルを選択</Heading>
                  <Text as="p" type="supporting">
                    CSVファイルを1件選択するか、ここにドラッグ＆ドロップしてください。
                  </Text>
                </VStack>

                <FileInput
                  label="CSVファイル"
                  value={file}
                  onChange={handleFileChange}
                  mode="dropzone"
                  placeholder="CSVファイルを選択"
                  description="拡張子が .csv のファイルを選択できます。"
                  status={
                    fileError
                      ? { type: "error", message: fileError }
                      : undefined
                  }
                  statusVariant="detached"
                />

                {file && (
                  <Card padding={3} variant="muted">
                    <Grid columns={{ minWidth: 180, max: 2 }} gap={2}>
                      <VStack gap={0.5}>
                        <Text as="p" type="supporting" color="secondary">
                          選択したファイル
                        </Text>
                        <Text as="p" type="label" weight="semibold">
                          {file.name}
                        </Text>
                      </VStack>
                      <VStack gap={0.5}>
                        <Text as="p" type="supporting" color="secondary">
                          ファイルサイズ
                        </Text>
                        <Text as="p" type="label" weight="semibold">
                          {formatFileSize(file.size)}
                        </Text>
                      </VStack>
                    </Grid>
                  </Card>
                )}

                <VStack gap={2}>
                  <Button
                    label="CSVをアップロード"
                    variant="primary"
                    isDisabled
                  >
                    アップロード（準備中）
                  </Button>
                  <Text as="p" type="supporting">
                    アップロード機能はバックエンド連携後に利用できます。現在、選択したファイルは送信・保存されません。
                  </Text>
                </VStack>
              </VStack>
            </Card>
          </VStack>
        </LayoutContent>
      }
      footer={
        <LayoutFooter hasDivider padding={4}>
          <Text as="p" type="supporting">
            CSVの内容解析・登録は、バックエンド連携時に対応します。
          </Text>
        </LayoutFooter>
      }
    />
  );
}
