"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

type ProviderProps = ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider(props: ProviderProps) {
  return <NextThemesProvider {...props} />;
}
