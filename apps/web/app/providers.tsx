"use client";

import type { ReactNode } from "react";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { Theme } from "@astryxdesign/core/theme";
import { defaultThemeSlug, themes } from "../astryx-themes";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <InternationalizationProvider locale="ja-JP">
      <Theme theme={themes[defaultThemeSlug]}>{children}</Theme>
    </InternationalizationProvider>
  );
}