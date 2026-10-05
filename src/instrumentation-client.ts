import posthog from "posthog-js";
import { isNoReplayPath } from "@/lib/analytics";

// One shared PostHog project serves every lecturesfrom LLC site. Nobody is
// identified: no person profiles, no submitter data. NEXT_PUBLIC_POSTHOG_HOST
// becomes https://flow.automationsanonymous.com once the managed proxy is live.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

function syncReplay(pathname: string) {
  if (isNoReplayPath(pathname)) posthog.stopSessionRecording();
  else posthog.startSessionRecording();
}

if (key) {
  try {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      ui_host: "https://us.posthog.com",
      defaults: "2026-05-30",
      person_profiles: "identified_only",
      capture_exceptions: true,
      // Tag bots as $browser_type=bot instead of dropping them (Humans vs Machines tally).
      opt_out_useragent_filter: true,
      session_recording: { maskAllInputs: true },
      loaded: client => {
        client.register({ site: "automationsanonymous" });
        syncReplay(window.location.pathname);
      },
    });
  } catch {
    // Analytics must never break the page.
  }
}

export function onRouterTransitionStart(url: string) {
  if (!key) return;
  try {
    syncReplay(new URL(url, window.location.origin).pathname);
  } catch {
    // ignore
  }
}
