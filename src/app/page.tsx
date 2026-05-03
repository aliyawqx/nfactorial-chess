"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Mic,
  Eye,
  Zap,
  Globe2,
  Users,
  Sparkles,
  ArrowRight,
  Keyboard,
  Volume2,
  Contrast,
  ZapOff,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/I18nProvider";

const HeroBoard = dynamic(
  () => import("@/components/chess/HeroBoard").then((m) => m.HeroBoard),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto aspect-square w-full max-w-[460px] animate-pulse rounded-2xl bg-secondary/50" />
    ),
  },
);

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
        <section className="relative isolate overflow-hidden border-b">
          <HeroBoard />
          <div className="container relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col items-center justify-center px-4 py-12 sm:py-16 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/70 backdrop-blur px-3 py-1 text-xs font-medium text-muted-foreground">
              <span aria-hidden="true" className="text-base">♞</span>
              {t.home.heroTagline}
            </div>
            <h1 className="mb-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
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
                className={cn(buttonVariants({ size: "lg" }), "gap-2 shadow-lg")}
              >
                {t.home.ctaPlay}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/accessibility"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "bg-background/70 backdrop-blur",
                )}
              >
                {t.home.ctaA11y}
              </Link>
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

        <section className="border-b py-16 sm:py-20" aria-labelledby="a11y-heading">
          <div className="container mx-auto max-w-6xl px-4">
            <h2
              id="a11y-heading"
              className="mb-3 text-center text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              {t.a11yPage.heroTitle}
            </h2>
            <p className="mb-12 text-center text-balance text-muted-foreground">
              {t.a11yPage.heroDescription}
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Mic, title: t.a11yPage.voiceTitle, desc: t.a11yPage.voiceDesc },
                { icon: Keyboard, title: t.a11yPage.keyboardTitle, desc: t.a11yPage.keyboardDesc },
                { icon: Eye, title: t.a11yPage.srTitle, desc: t.a11yPage.srDesc },
                { icon: Volume2, title: t.a11yPage.ttsTitle, desc: t.a11yPage.ttsDesc },
                { icon: Contrast, title: t.a11yPage.contrastTitle, desc: t.a11yPage.contrastDesc },
                { icon: ZapOff, title: t.a11yPage.motionTitle, desc: t.a11yPage.motionDesc },
              ].map(({ icon: Icon, title, desc }) => (
                <li key={title} className="rounded-lg border bg-card p-5">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <h3 className="mb-1 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
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
