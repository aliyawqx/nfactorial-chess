"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="h-9 w-[7rem] rounded-md bg-secondary/40"
        aria-hidden="true"
      />
    );
  }

  const options = [
    { value: "light", label: "Светлая", icon: Sun },
    { value: "dark", label: "Тёмная", icon: Moon },
    { value: "system", label: "Система", icon: Monitor },
  ] as const;

  return (
    <div
      role="radiogroup"
      aria-label="Выбор темы оформления"
      className="inline-flex items-center gap-0.5 rounded-md border bg-card p-0.5"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-sm transition",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
