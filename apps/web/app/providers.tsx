"use client";

import type { ReactNode } from "react";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <InternationalizationProvider locale="ja-JP">
      <Theme theme={neutralTheme}>{children}</Theme>
    </InternationalizationProvider>
  );
}