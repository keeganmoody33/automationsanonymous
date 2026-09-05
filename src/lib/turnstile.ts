/*
  Cloudflare Turnstile hook point for the submit form. Unwired by default:
  with TURNSTILE_SECRET_KEY unset every submission passes. Set the secret and
  NEXT_PUBLIC_TURNSTILE_SITE_KEY, then load the Turnstile script in
  src/components/submit-form.tsx, to enable it.
*/
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
