"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { buttonVariants } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

function SuccessContent() {
  const { t } = useI18n();
  const params = useSearchParams();
  const { refresh } = useProfile();

  useEffect(() => {
    // ждём webhook чтобы подхватить is_pro
    const t1 = setTimeout(() => refresh(), 500);
    const t2 = setTimeout(() => refresh(), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [refresh]);

  return (
    <main id="main" className="flex-1">
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-500" aria-hidden="true" />
        <h1 className="mb-2 text-2xl font-semibold">{t.shop.successTitle}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t.shop.successSubtitle}</p>

        <div className="flex flex-col items-center gap-2">
          <Link
            href="/settings/profile"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            {t.shop.goToProfile}
          </Link>
          <Link
            href="/shop"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t.shop.backToShop}
          </Link>
        </div>

        {params.get("session_id") && (
          <p className="mt-6 font-mono text-[10px] text-muted-foreground/60">
            session: {params.get("session_id")?.slice(0, 16)}…
          </p>
        )}
      </div>
    </main>
  );
}

export default function ShopSuccessPage() {
  return (
    <>
      <AppHeader />
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </>
  );
}
