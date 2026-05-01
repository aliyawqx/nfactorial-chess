"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

interface LiveRegionContextValue {
  announce: (message: string, assertive?: boolean) => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const [politeMsg, setPoliteMsg] = useState("");
  const [assertiveMsg, setAssertiveMsg] = useState("");
  const politeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assertiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((message: string, assertive = false) => {
    if (assertive) {
      if (assertiveTimerRef.current) clearTimeout(assertiveTimerRef.current);
      setAssertiveMsg("");
      assertiveTimerRef.current = setTimeout(() => setAssertiveMsg(message), 50);
    } else {
      if (politeTimerRef.current) clearTimeout(politeTimerRef.current);
      setPoliteMsg("");
      politeTimerRef.current = setTimeout(() => setPoliteMsg(message), 50);
    }
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {politeMsg}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {assertiveMsg}
      </div>
    </LiveRegionContext.Provider>
  );
}

export function useAnnounce() {
  const ctx = useContext(LiveRegionContext);
  if (!ctx) {
    throw new Error("useAnnounce must be used within LiveRegionProvider");
  }
  return ctx.announce;
}
