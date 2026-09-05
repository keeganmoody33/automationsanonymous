import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import { PresentationProvider, PRESENTATION_BOOT } from "@/components/switches/presentation-provider";
import { SiteHeader } from "@/components/landing/site-header";
import { LoadingOverlay } from "@/components/landing/loading-overlay";
import { Hud } from "@/components/landing/hud";

// Font faces are bound to *-face variables. Components never use these
// directly; they use --font-chrome and --font-voice from globals.css.
const chrome = IBM_Plex_Mono({
  variable: "--font-chrome-face",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// The voice registry (Phase 7). Each face is loaded once at weight 700;
// [data-font] on <html> selects which one --font-voice resolves to.
const voiceMono = IBM_Plex_Mono({ variable: "--font-voice-face-mono", subsets: ["latin"], weight: ["700"] });
const voiceSansCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-voice-face-sans-condensed",
  subsets: ["latin"],
  weight: ["700"],
});
const voiceSans = IBM_Plex_Sans({ variable: "--font-voice-face-sans", subsets: ["latin"], weight: ["700"] });
const voiceSerif = IBM_Plex_Serif({ variable: "--font-voice-face-serif", subsets: ["latin"], weight: ["700"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://automationsanonymous.com"),
  title: {
    default: "Automations Anonymous",
    template: "%s · Automations Anonymous",
  },
  description:
    "A public directory of working automations, each documented as a structured record with trigger, steps, prerequisites, failure modes, and the runnable payload. Submitted anonymously.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${chrome.variable} ${voiceMono.variable} ${voiceSansCondensed.variable} ${voiceSans.variable} ${voiceSerif.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Stamps stored mode and font before first paint. Presentation only. */}
        <script dangerouslySetInnerHTML={{ __html: PRESENTATION_BOOT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <PresentationProvider>
          <LoadingOverlay />
          <Hud />
          <SiteHeader />
          {children}
        </PresentationProvider>
      </body>
    </html>
  );
}
