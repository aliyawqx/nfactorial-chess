import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { SkipLink } from "@/components/a11y/SkipLink";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoiceChess — шахматы голосом и для всех",
  description:
    "Шахматная платформа с голосовым управлением (русский, английский, казахский) и полной поддержкой доступности. Игра против ИИ, мультиплеер по ссылке, AI Coach.",
  applicationName: "VoiceChess",
  keywords: [
    "chess",
    "шахматы",
    "голосовое управление",
    "accessibility",
    "voice chess",
    "Stockfish",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <LiveRegionProvider>
              <SkipLink />
              {children}
            </LiveRegionProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
