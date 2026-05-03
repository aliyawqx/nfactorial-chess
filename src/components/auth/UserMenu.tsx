"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, User as UserIcon, UserPlus, Settings } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, configured, isAnonymous, signOut, loading } = useAuth();
  const { profile } = useProfile();
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

  if (!configured) return null;

  if (loading) {
    return (
      <div
        aria-hidden="true"
        className="h-9 w-9 sm:w-[7rem] rounded-md border bg-card/40 animate-pulse"
      />
    );
  }

  if (!user || isAnonymous) {
    return (
      <div className="hidden sm:flex items-center gap-1">
        <Link
          href="/login"
          className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          {t.common.login}
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t.common.signup}
        </Link>
      </div>
    );
  }

  // user_metadata.display_name доступно из auth сразу — без flash из email
  const userMetaName = (user.user_metadata as { display_name?: string } | null)
    ?.display_name;
  const name =
    profile?.display_name ||
    userMetaName ||
    user.email?.split("@")[0] ||
    t.common.guest;
  const initial = name.slice(0, 1).toUpperCase();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.refresh();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={`${t.common.profile}: ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-9 w-9 sm:w-auto sm:min-w-[7rem] sm:max-w-[12rem] items-center gap-2 rounded-md border bg-card px-2.5 text-sm hover:bg-secondary justify-center sm:justify-start",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            profile?.is_pro
              ? "bg-gradient-to-br from-amber-400 to-fuchsia-500 text-white"
              : "bg-primary text-primary-foreground",
          )}
        >
          {initial}
        </span>
        <span className="hidden sm:flex min-w-0 flex-1 items-center gap-1 text-left">
          <span className="truncate">{name}</span>
          {profile?.is_pro && (
            <span
              aria-label={t.common.pro}
              className="inline-flex shrink-0 items-center rounded-sm bg-gradient-to-br from-amber-400 to-fuchsia-500 px-1 py-px text-[9px] font-bold uppercase text-white"
            >
              Pro
            </span>
          )}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] overflow-hidden rounded-md border bg-popover py-1 shadow-md"
        >
          <div className="border-b px-3 py-2 text-xs text-muted-foreground">
            {user.email}
          </div>
          <Link
            href="/settings/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"
          >
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            {t.common.profile}
          </Link>
          <Link
            href="/games"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"
          >
            <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {t.common.games}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            {t.common.logout}
          </button>
        </div>
      )}
    </div>
  );
}

export function MobileAuthLinks() {
  const { t } = useI18n();
  const { user, configured, isAnonymous, signOut } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();

  if (!configured) return null;

  if (!user || isAnonymous) {
    return (
      <>
        <Link
          href="/login"
          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"
        >
          <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
          {t.common.login}
        </Link>
        <Link
          href="/signup"
          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
          {t.common.signup}
        </Link>
      </>
    );
  }

  const userMetaName = (user.user_metadata as { display_name?: string } | null)
    ?.display_name;
  const name =
    profile?.display_name ||
    userMetaName ||
    user.email?.split("@")[0] ||
    t.common.guest;
  return (
    <>
      <div className="border-b px-4 py-2 text-xs text-muted-foreground">
        {name}
        {user.email && <div className="text-[10px]">{user.email}</div>}
      </div>
      <Link
        href="/settings/profile"
        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"
      >
        <Settings className="h-3.5 w-3.5" aria-hidden="true" />
        {t.common.profile}
      </Link>
      <Link
        href="/games"
        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"
      >
        <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {t.common.games}
      </Link>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.refresh();
        }}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        {t.common.logout}
      </button>
    </>
  );
}
