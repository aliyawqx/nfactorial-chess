"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Check, Loader2, CreditCard, ShieldCheck, Heart, Wand2 } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

export default function ShopPage() {
  const { t, locale } = useI18n();
  const { user, configured, loading: userLoading } = useSupabaseUser();
  const { profile, loading: profileLoading } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = profile?.is_pro === true;

  const handleBuy = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: "voicechess_pro" }),
      });
      if (res.status === 503) {
        setError(t.shop.configureNote);
        setSubmitting(false);
        return;
      }
      if (res.status === 401) {
        setError(t.shop.requireLogin);
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Checkout error");
      setSubmitting(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  };

  const features = [
    { icon: Wand2, title: t.shop.feat1Title, desc: t.shop.feat1Desc },
    { icon: Heart, title: t.shop.feat2Title, desc: t.shop.feat2Desc },
    { icon: Sparkles, title: t.shop.feat3Title, desc: t.shop.feat3Desc },
  ];

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-10 sm:py-16">
          {/* Hero */}
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              VoiceChess
            </div>
            <h1 className="mb-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              <span className="bg-gradient-to-r from-amber-500 to-fuchsia-500 bg-clip-text text-transparent">
                {t.shop.heroTitle}
              </span>
            </h1>
            <p className="text-balance text-muted-foreground">
              {t.shop.heroSubtitle}
            </p>
          </div>

          {/* Price card */}
          <div className="mx-auto mb-10 max-w-md rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
            <div className="mb-6 flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold">{t.shop.price}</span>
              <span className="text-sm text-muted-foreground">{t.shop.priceNote}</span>
            </div>

            {isPro ? (
              <div className="mb-6 rounded-md bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-700 dark:text-emerald-300">
                <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                {t.shop.youArePro}
                {profile?.pro_purchased_at && (
                  <span className="ml-1 text-xs">
                    ({t.shop.proSinceLabel} {new Date(profile.pro_purchased_at).toLocaleDateString(locale)})
                  </span>
                )}
              </div>
            ) : (
              <Button
                onClick={handleBuy}
                disabled={submitting || userLoading || profileLoading || !user}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                )}
                {t.shop.buyNow}
              </Button>
            )}

            {!user && configured && !userLoading && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                <Link href="/login?next=/shop" className="text-primary hover:underline">
                  {t.shop.requireLogin}
                </Link>
              </p>
            )}

            {error && (
              <div role="alert" className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {t.shop.stripeNote}
            </p>
          </div>

          {/* Features */}
          <div>
            <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight">
              {t.shop.featuresTitle}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
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

          {isPro && (
            <div className="mt-10 text-center">
              <Link
                href="/settings/profile"
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                {t.shop.goToProfile}
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
