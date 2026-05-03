"use client";

import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { CSSProperties } from "react";
import { pieceRenderObject } from "@/lib/chess/skins";

const IMMORTAL_GAME_PGN =
  "1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7#";

const MOVE_INTERVAL_MS = 1500;
const RESET_PAUSE_MS = 4000;

const lightSquareStyle: CSSProperties = {
  background: "hsl(var(--board-light))",
};
const darkSquareStyle: CSSProperties = {
  background: "hsl(var(--board-dark))",
};

const moves = (() => {
  const probe = new Chess();
  probe.loadPgn(IMMORTAL_GAME_PGN);
  return probe.history();
})();

function buildFinalFen(): string {
  const c = new Chess();
  c.loadPgn(IMMORTAL_GAME_PGN);
  return c.fen();
}

const FLOATING_PIECES: Array<{
  src: string;
  className: string;
  delay: string;
  duration: string;
  size: string;
}> = [
  {
    src: "/pieces/cburnett/wN.svg",
    className: "top-[8%] left-[6%] rotate-[-12deg]",
    delay: "0s",
    duration: "5s",
    size: "h-20 w-20 sm:h-28 sm:w-28",
  },
  {
    src: "/pieces/cburnett/bQ.svg",
    className: "top-[14%] right-[8%] rotate-[18deg]",
    delay: "0.6s",
    duration: "6s",
    size: "h-24 w-24 sm:h-32 sm:w-32",
  },
  {
    src: "/pieces/cburnett/wB.svg",
    className: "bottom-[14%] left-[10%] rotate-[10deg]",
    delay: "1.2s",
    duration: "5.5s",
    size: "h-16 w-16 sm:h-24 sm:w-24",
  },
  {
    src: "/pieces/cburnett/bN.svg",
    className: "bottom-[10%] right-[12%] rotate-[-8deg]",
    delay: "0.3s",
    duration: "6.5s",
    size: "h-20 w-20 sm:h-28 sm:w-28",
  },
  {
    src: "/pieces/cburnett/wK.svg",
    className: "top-[40%] right-[2%] rotate-[6deg] hidden md:block",
    delay: "1.8s",
    duration: "7s",
    size: "h-24 w-24",
  },
];

export function HeroBoard() {
  const [fen, setFen] = useState<string>(() => new Chess().fen());
  const [reduceMotion, setReduceMotion] = useState(false);
  const pieces = useMemo(() => pieceRenderObject("cburnett"), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setFen(buildFinalFen());
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const chess = new Chess();
    let plyIndex = 0;
    setFen(chess.fen());

    const step = () => {
      if (cancelled) return;
      if (plyIndex >= moves.length) {
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          chess.reset();
          plyIndex = 0;
          setFen(chess.fen());
          timeoutId = setTimeout(step, MOVE_INTERVAL_MS);
        }, RESET_PAUSE_MS);
        return;
      }
      try {
        chess.move(moves[plyIndex]);
        plyIndex += 1;
        setFen(chess.fen());
      } catch {
        return;
      }
      timeoutId = setTimeout(step, MOVE_INTERVAL_MS);
    };

    timeoutId = setTimeout(step, MOVE_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [reduceMotion]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute left-1/2 top-1/2 hero-tilt opacity-50 dark:opacity-35"
        style={{
          width: "min(120vw, 1100px)",
          aspectRatio: "1 / 1",
          transform:
            "translate(-50%, -50%) perspective(1400px) rotateX(28deg) rotateZ(-8deg) scale(0.95)",
          filter: "saturate(0.85)",
        }}
      >
        <Chessboard
          options={{
            id: "voicechess-hero",
            position: fen,
            showAnimations: !reduceMotion,
            animationDurationInMs: 500,
            allowDragging: false,
            allowDrawingArrows: false,
            showNotation: false,
            pieces,
            lightSquareStyle,
            darkSquareStyle,
          }}
        />
      </div>

      {FLOATING_PIECES.map((p, i) => (
        <div
          key={i}
          className={`absolute ${p.className} ${p.size} hero-float`}
          style={{
            animationDelay: p.delay,
            animationDuration: p.duration,
            animationPlayState: reduceMotion ? "paused" : "running",
            filter: "drop-shadow(0 12px 16px rgba(0,0,0,0.35))",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.src}
            alt=""
            draggable={false}
            className="h-full w-full"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/55 to-background/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.6)_70%,hsl(var(--background))_100%)]" />

      <div
        aria-hidden="true"
        className="pointer-events-auto absolute bottom-4 right-4 select-none rounded-md bg-background/60 backdrop-blur px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground"
      >
        Anderssen vs Kieseritzky · 1851
      </div>
    </div>
  );
}
