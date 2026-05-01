"use client";

import { LOCALE_BCP47 } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let voicesCache: SpeechSynthesisVoice[] | null = null;

function getVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  if (voicesCache) return voicesCache;
  const v = window.speechSynthesis.getVoices();
  if (v.length > 0) voicesCache = v;
  return v;
}

if (typeof window !== "undefined" && isSpeechSynthesisSupported()) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    voicesCache = window.speechSynthesis.getVoices();
  });
}

export function pickVoice(locale: Locale): SpeechSynthesisVoice | null {
  const voices = getVoices();
  if (voices.length === 0) return null;
  const targetLang = LOCALE_BCP47[locale];

  // Точное совпадение
  let match = voices.find((v) => v.lang === targetLang);
  if (match) return match;

  // Частичное (e.g. ru-RU vs ru)
  const langPrefix = targetLang.split("-")[0];
  match = voices.find((v) => v.lang.startsWith(langPrefix));
  if (match) return match;

  // Fallback на ru для kk
  if (locale === "kk") {
    return voices.find((v) => v.lang.startsWith("ru")) ?? null;
  }
  return null;
}

export interface SpeakOptions {
  locale: Locale;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function speak(text: string, opts: SpeakOptions): void {
  if (!isSpeechSynthesisSupported() || !text) return;
  // Отменяем предыдущее произнесение чтобы новое не задерживалось
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(opts.locale);
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang;
  } else {
    utter.lang = LOCALE_BCP47[opts.locale];
  }
  utter.rate = opts.rate ?? 1;
  utter.pitch = opts.pitch ?? 1;
  utter.volume = opts.volume ?? 1;
  window.speechSynthesis.speak(utter);
}

export function cancelSpeak(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}
