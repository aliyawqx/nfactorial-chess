"use client";

import { useEffect, useRef, useState } from "react";
import { StockfishEngine } from "@/lib/chess/engine";

export function useStockfish() {
  const engineRef = useRef<StockfishEngine | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const engine = new StockfishEngine();
    engineRef.current = engine;
    engine
      .ensureReady()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });

    return () => {
      cancelled = true;
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return { engine: engineRef.current, ready };
}
