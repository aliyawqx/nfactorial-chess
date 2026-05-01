"use client";

import { Eye, Keyboard, Mic, Volume2, Contrast, ZapOff } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useT } from "@/lib/i18n/I18nProvider";

export default function AccessibilityPage() {
  const t = useT();
  const items = [
    { icon: Mic, title: t.a11yPage.voiceTitle, desc: t.a11yPage.voiceDesc },
    { icon: Keyboard, title: t.a11yPage.keyboardTitle, desc: t.a11yPage.keyboardDesc },
    { icon: Eye, title: t.a11yPage.srTitle, desc: t.a11yPage.srDesc },
    { icon: Volume2, title: t.a11yPage.ttsTitle, desc: t.a11yPage.ttsDesc },
    { icon: Contrast, title: t.a11yPage.contrastTitle, desc: t.a11yPage.contrastDesc },
    { icon: ZapOff, title: t.a11yPage.motionTitle, desc: t.a11yPage.motionDesc },
  ];

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <div className="mb-10">
            <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.a11yPage.heroTitle}
            </h1>
            <p className="text-muted-foreground">{t.a11yPage.heroDescription}</p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {items.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="rounded-lg border bg-card p-5">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h2 className="mb-1 font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
