"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { LOCALES, LOCALE_FLAGS, LOCALE_LABELS } from "@/lib/i18n/config";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
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
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={t.common.language}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-2.5 text-sm hover:bg-secondary"
      >
        <Languages className="h-4 w-4" aria-hidden="true" />
        <span aria-hidden="true">{LOCALE_FLAGS[locale]}</span>
        <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t.common.language}
          className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] overflow-hidden rounded-md border bg-popover py-1 shadow-md"
        >
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-secondary",
                  l === locale && "bg-secondary font-medium",
                )}
              >
                <span aria-hidden="true">{LOCALE_FLAGS[l]}</span>
                <span>{LOCALE_LABELS[l]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
