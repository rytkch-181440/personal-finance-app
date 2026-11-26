import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "./components/shell/app-shell";

export const metadata: Metadata = {
  title: "kurashi | 家計簿",
  description: "収入と支出をすっきり見える化する家計簿アプリ",
};

const fontHref =
  "https://fonts.googleapis.com/css2?" +
  "family=M+PLUS+Rounded+1c:wght@400;500;700;800&" +
  "family=Noto+Sans+JP:wght@400;500;700&" +
  "family=Space+Grotesk:wght@400;500;700&display=swap";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={fontHref} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
