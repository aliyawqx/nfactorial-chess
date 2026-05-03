"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/multiplayer/time-controls";

interface ClockProps {
  timeMs: number | null;
  running: boolean;
  lastMoveAt: string | null;
  className?: string;
}

export function Clock({ timeMs, running, lastMoveAt, className }: ClockProps) {
  const [displayMs, setDisplayMs] = useState<number>(timeMs ?? 0);
  const rafRef = useRef<number | null>(null);
  const wasRunningRef = useRef(false);

  useEffect(() => {
    if (timeMs === null) return;
    if (!running) {
      // если перешли из running=true → не перезаписываем (заморозка часов на 0)
      if (!wasRunningRef.current) {
        setDisplayMs(timeMs);
      }
      wasRunningRef.current = false;
      return;
    }
    wasRunningRef.current = true;
    const startedAt = lastMoveAt ? new Date(lastMoveAt).getTime() : Date.now();
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, timeMs - elapsed);
      setDisplayMs(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [timeMs, running, lastMoveAt]);

  if (timeMs === null) return null;

  const lowTime = displayMs < 10_000;
  const expired = displayMs <= 0;

  return (
    <div
      role="timer"
      aria-live="off"
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-3 py-1.5 font-mono tabular-nums text-base font-semibold transition-colors",
        running ? "bg-card border-foreground/20" : "bg-muted/40 border-border",
        lowTime && running && "bg-destructive/15 border-destructive/40 text-destructive",
        expired && "opacity-60",
        className,
      )}
    >
      {formatClock(displayMs)}
    </div>
  );
}
