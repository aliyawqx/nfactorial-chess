"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { createRoom, getRoomByInvite } from "@/lib/multiplayer/room";
import { cn } from "@/lib/utils";

export default function OnlineLobbyPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, loading, configured, ensureSignedIn } = useSupabaseUser();
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    setCreating(true);
    try {
      const u = user ?? (await ensureSignedIn());
      if (!u) throw new Error("Не удалось войти");
      const room = await createRoom({ hostId: u.id, hostColor: "white" });
      router.push(`/play/online/${room.invite_code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    setError(null);
    if (!code.trim()) return;
    setJoining(true);
    try {
      const room = await getRoomByInvite(code.trim().toLowerCase());
      if (!room) {
        setError(t.online.roomNotFound);
        setJoining(false);
        return;
      }
      router.push(`/play/online/${room.invite_code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setJoining(false);
    }
  };

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t.online.title}
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            {t.online.lobbySubtitle}
          </p>

          {!configured ? (
            <div className="rounded-lg border border-dashed bg-card/50 p-6 text-sm text-muted-foreground">
              {t.online.configureSupabase}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-2 font-semibold">{t.online.createRoom}</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t.online.shareLink}
                </p>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  )}
                  {t.online.createRoom}
                </Button>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-2 font-semibold">{t.online.joinRoom}</h2>
                <label
                  htmlFor="invite-code"
                  className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {t.online.inviteCode}
                </label>
                <input
                  id="invite-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleJoin();
                  }}
                  placeholder="abcdefgh"
                  className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  variant="outline"
                  onClick={handleJoin}
                  disabled={joining || !code.trim()}
                  className="w-full"
                >
                  {joining ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  )}
                  {t.online.joinRoom}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <a href="/play/local" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              {t.online.back}
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
