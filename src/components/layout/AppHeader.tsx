"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { UserMenu, MobileAuthLinks } from "@/components/auth/UserMenu";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const navLinks = [
    { href: "/play/local", label: t.common.play },
    { href: "/play/ai", label: t.common.vsAi },
    { href: "/play/online", label: t.common.online },
    { href: "/leaderboard", label: t.common.leaderboard },
    { href: "/games", label: t.common.games },
  ];

  // Закрытие при клике вне меню или Esc
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

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

        {/* Desktop navigation */}
        <nav aria-label="Главное меню" className="hidden md:block">
          <ul className="flex items-center gap-1 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          {/* Mobile burger */}
          <div ref={menuRef} className="relative md:hidden">
            <button
              type="button"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-card hover:bg-secondary"
            >
              {open ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            {open && (
              <nav
                id="mobile-nav"
                aria-label="Мобильное меню"
                className="absolute right-0 top-full mt-1 min-w-[14rem] overflow-hidden rounded-md border bg-popover py-1 shadow-lg"
              >
                <ul className="flex flex-col">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "block px-4 py-2 text-sm text-foreground hover:bg-secondary",
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="border-t" onClick={() => setOpen(false)}>
                  <MobileAuthLinks />
                </div>
              </nav>
            )}
          </div>
          {/* UserMenu в самом правом конце — рост происходит ВПРАВО,
              соседи слева не двигаются. */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
