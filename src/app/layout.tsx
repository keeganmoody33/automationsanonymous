import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Font faces are bound to *-face variables. Components never use these
// directly; they use --font-chrome and --font-voice from globals.css.
const chrome = IBM_Plex_Mono({
  variable: "--font-chrome-face",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Voice currently resolves to the same family in bold. It stays a separate
// role so the Phase 7 registry can point it at another face without touching
// a component.
const voice = IBM_Plex_Mono({
  variable: "--font-voice-face",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://automationsanonymous.com"),
  title: {
    default: "Automations Anonymous",
    template: "%s · Automations Anonymous",
  },
  description:
    "A public directory of working automations, each documented as a structured record with trigger, steps, prerequisites, failure modes, and the runnable payload. Submitted anonymously.",
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${chrome.variable} ${voice.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
