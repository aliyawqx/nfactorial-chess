"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useT } from "@/lib/i18n/I18nProvider";

export function AppHeader() {
  const t = useT();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
          aria-label={`${t.common.appName} — ${t.common.goToMain}`}
        >
          <span aria-hidden="true" className="text-lg">
            ♞
          </span>
          <span>{t.common.appName}</span>
        </Link>

        <nav aria-label="Главное меню" className="hidden md:block">
          <ul className="flex items-center gap-1 text-sm">
            <li>
              <Link
                href="/play/local"
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {t.common.play}
              </Link>
            </li>
            <li>
              <Link
                href="/play/ai"
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {t.common.vsAi}
              </Link>
            </li>
            <li>
              <Link
                href="/games"
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {t.common.games}
              </Link>
            </li>
            <li>
              <Link
                href="/accessibility"
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {t.common.accessibility}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
