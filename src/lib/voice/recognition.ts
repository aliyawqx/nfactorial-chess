"use client";

import { LOCALE_BCP47 } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface RecognitionOptions {
  locale: Locale;
  continuous?: boolean;
  interim?: boolean;
  onResult: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string; confidence: number }; isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

export function isWebSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "SpeechRecognition" in window ||
    "webkitSpeechRecognition" in window
  );
}

export function isLocaleSupported(locale: Locale): boolean {
  if (!isWebSpeechSupported()) return false;
  // Web Speech API не поддерживает kk-KZ — для казахского нужен Whisper fallback
  return locale !== "kk";
}

export class SpeechRecognizer {
  private recognition: SpeechRecognitionLike | null = null;
  private listening = false;

  constructor(private opts: RecognitionOptions) {
    if (typeof window === "undefined") return;
    const SR =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SR) return;
    const r = new SR();
    r.lang = LOCALE_BCP47[opts.locale];
    r.continuous = opts.continuous ?? false;
    r.interimResults = opts.interim ?? true;
    r.maxAlternatives = 3;

    r.onresult = (event) => {
      const results = Array.from(event.results);
      for (const result of results) {
        const alt = result[0];
        opts.onResult({
          transcript: alt.transcript,
          confidence: alt.confidence ?? 0,
          isFinal: result.isFinal,
        });
      }
    };

    r.onerror = (event) => {
      this.listening = false;
      opts.onError?.(event.error);
    };
    r.onend = () => {
      this.listening = false;
      opts.onEnd?.();
    };
    r.onstart = () => {
      this.listening = true;
      opts.onStart?.();
    };

    this.recognition = r;
  }

  setLocale(locale: Locale) {
    if (this.recognition) this.recognition.lang = LOCALE_BCP47[locale];
    this.opts.locale = locale;
  }

  start() {
    if (!this.recognition || this.listening) return;
    try {
      this.recognition.start();
    } catch {
      /* already started */
    }
  }

  stop() {
    if (this.recognition && this.listening) {
      try {
        this.recognition.stop();
      } catch {
        /* ignore */
      }
    }
  }

  abort() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        /* ignore */
      }
    }
    this.listening = false;
  }

  get isListening() {
    return this.listening;
  }
}
