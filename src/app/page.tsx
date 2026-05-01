"use client";

import Link from "next/link";
import {
  Mic,
  Eye,
  Zap,
  Globe2,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/I18nProvider";

export default function Home() {
  const t = useT();
  const features = [
    { icon: Mic, title: t.features.voiceTitle, description: t.features.voiceDesc },
    { icon: Eye, title: t.features.a11yTitle, description: t.features.a11yDesc },
    { icon: Zap, title: t.features.aiTitle, description: t.features.aiDesc },
    {
      icon: Users,
      title: t.features.multiplayerTitle,
      description: t.features.multiplayerDesc,
    },
    {
      icon: Sparkles,
      title: t.features.coachTitle,
      description: t.features.coachDesc,
    },
    {
      icon: Globe2,
      title: t.features.leaderboardTitle,
      description: t.features.leaderboardDesc,
    },
  ];

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="container mx-auto max-w-6xl px-4 py-16 sm:py-24">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                <span aria-hidden="true" className="text-base">♞</span>
                {t.home.heroTagline}
              </div>
              <h1 className="mb-6 text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                {t.home.heroTitle1}
                <span className="block bg-gradient-to-r from-primary to-board-dark bg-clip-text text-transparent">
                  {t.home.heroTitle2}
                </span>
              </h1>
              <p className="mb-8 max-w-2xl text-balance text-base sm:text-lg text-muted-foreground">
                {t.home.heroDescription}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/play/local"
                  className={cn(buttonVariants({ size: "lg" }), "gap-2")}
                >
                  {t.home.ctaPlay}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/accessibility"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  {t.home.ctaA11y}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b py-16 sm:py-20" aria-labelledby="features-heading">
          <div className="container mx-auto max-w-6xl px-4">
            <h2
              id="features-heading"
              className="mb-12 text-center text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              {t.home.featuresTitle}
            </h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="rounded-xl border bg-card p-6 transition hover:border-foreground/20"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container mx-auto max-w-3xl px-4 text-center">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.home.readyTitle}
            </h2>
            <p className="mb-8 text-muted-foreground">{t.home.readyDescription}</p>
            <Link
              href="/play/local"
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              {t.home.ctaPlayLocal}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-sm text-muted-foreground">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
          <p>{t.home.footerLeft}</p>
          <p>{t.home.footerRight}</p>
        </div>
      </footer>
    </>
  );
}
