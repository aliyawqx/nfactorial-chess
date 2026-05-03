"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX, AlertCircle } from "lucide-react";
import type { Move } from "chess.js";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAnnounce } from "@/components/a11y/LiveRegion";
import {
  SpeechRecognizer,
  isLocaleSupported,
  isWebSpeechSupported,
} from "@/lib/voice/recognition";
import {
  isSpeechSynthesisSupported,
  speak,
  cancelSpeak,
} from "@/lib/voice/synthesis";
import { resolveVoiceMove } from "@/lib/voice/parser";
import type { VoiceCommand } from "@/lib/voice/parser/types";
import { cn } from "@/lib/utils";

interface VoiceControllerProps {
  legalMoves: Move[];
  onMove: (params: { from: string; to: string; promotion?: "q" | "r" | "b" | "n" }) => Move | null;
  onCommand?: (command: VoiceCommand) => void;
  speakOpponentMoves?: boolean;
  lastOpponentMove?: { san: string; color: "w" | "b" } | null;
}

export function VoiceController({
  legalMoves,
  onMove,
  onCommand,
  speakOpponentMoves = true,
  lastOpponentMove,
}: VoiceControllerProps) {
  const { t, locale } = useI18n();
  const announce = useAnnounce();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const supported = mounted && isWebSpeechSupported() && isLocaleSupported(locale);
  const synthSupported = mounted && isSpeechSynthesisSupported();

  const handleResult = useCallback(
    (result: { transcript: string; confidence: number; isFinal: boolean }) => {
      setTranscript(result.transcript);
      if (!result.isFinal) return;

      const { parsed, resolution } = resolveVoiceMove(
        result.transcript,
        locale,
        legalMoves,
      );

      if (parsed.kind === "command") {
        onCommand?.(parsed.command);
        announce(`${t.voice.commandRecognized}: ${parsed.command}`);
        return;
      }

      if (resolution.status === "ok") {
        const m = resolution.move;
        const ok = onMove({
          from: m.from,
          to: m.to,
          promotion: m.promotion as "q" | "r" | "b" | "n" | undefined,
        });
        if (!ok) {
          setError(t.voice.illegal);
          if (ttsEnabled) speak(t.voice.illegal, { locale });
        } else {
          setError(null);
        }
        return;
      }

      if (resolution.status === "ambiguous") {
        const candidates = resolution.candidates
          .map((m) => `${m.from}-${m.to}`)
          .join(", ");
        setError(`${t.voice.ambiguous}: ${candidates}`);
        if (ttsEnabled) speak(`${t.voice.ambiguous}. ${candidates}`, { locale });
        return;
      }

      if (resolution.status === "illegal") {
        setError(t.voice.illegal);
        if (ttsEnabled) speak(t.voice.illegal, { locale });
        return;
      }

      setError(t.voice.notUnderstood);
    },
    [
      announce,
      legalMoves,
      locale,
      onCommand,
      onMove,
      t.voice,
      ttsEnabled,
    ],
  );

  useEffect(() => {
    if (!supported) return;
    const r = new SpeechRecognizer({
      locale,
      continuous: false,
      interim: true,
      onResult: handleResult,
      onError: (err) => {
        setError(err);
        setListening(false);
      },
      onEnd: () => setListening(false),
      onStart: () => setListening(true),
    });
    recognizerRef.current = r;
    return () => r.abort();
  }, [supported, locale, handleResult]);

  useEffect(() => {
    if (recognizerRef.current) recognizerRef.current.setLocale(locale);
  }, [locale]);

  // push-to-talk: space
  useEffect(() => {
    if (!supported) return;
    const isTextInput = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );
    };
    let pushing = false;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isTextInput(e.target) || e.repeat) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (pushing) return;
      pushing = true;
      e.preventDefault();
      setError(null);
      setTranscript("");
      recognizerRef.current?.start();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space" || !pushing) return;
      pushing = false;
      e.preventDefault();
      recognizerRef.current?.stop();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [supported]);

  useEffect(() => {
    if (!ttsEnabled || !synthSupported || !speakOpponentMoves) return;
    if (!lastOpponentMove) return;
    const tpl =
      lastOpponentMove.color === "w" ? t.a11y.whiteMoved : t.a11y.blackMoved;
    speak(tpl.replace("{san}", lastOpponentMove.san), { locale });
  }, [
    lastOpponentMove,
    ttsEnabled,
    synthSupported,
    speakOpponentMoves,
    locale,
    t.a11y,
  ]);

  const handleToggle = () => {
    if (!recognizerRef.current) return;
    if (listening) {
      recognizerRef.current.stop();
    } else {
      setError(null);
      setTranscript("");
      recognizerRef.current.start();
    }
  };

  const handleTtsToggle = () => {
    if (ttsEnabled) cancelSpeak();
    setTtsEnabled(!ttsEnabled);
  };

  if (!mounted) {
    return (
      <div
        className="h-[5.5rem] animate-pulse rounded-lg bg-secondary/40"
        aria-hidden="true"
      />
    );
  }

  if (!supported) {
    return (
      <div className="rounded-lg border border-dashed bg-card/50 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {locale === "kk"
            ? t.voice.kkNotSupported
            : t.voice.browserNotSupported}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleToggle}
          aria-label={listening ? t.voice.stopListening : t.voice.startListening}
          aria-pressed={listening}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition",
            listening
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {listening ? (
            <Mic className="h-4 w-4 animate-pulse" aria-hidden="true" />
          ) : (
            <MicOff className="h-4 w-4" aria-hidden="true" />
          )}
          {listening ? t.voice.listening : t.voice.tapToTalk}
        </button>
        {synthSupported && (
          <button
            type="button"
            onClick={handleTtsToggle}
            aria-label={ttsEnabled ? t.voice.muteTts : t.voice.unmuteTts}
            aria-pressed={ttsEnabled}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-secondary"
          >
            {ttsEnabled ? (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t.voice.hint}</p>
      {transcript && (
        <div
          aria-live="polite"
          className="mt-2 rounded-md bg-secondary/50 px-2 py-1 text-xs font-mono"
        >
          {transcript}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mt-2 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive"
        >
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {error}
        </div>
      )}
    </div>
  );
}
