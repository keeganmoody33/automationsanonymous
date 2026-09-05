import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/*
  Admin gate. One operator, no user system.

  A session is a signed expiry: `${expiresAtMs}.${sig}` where
  sig = base64url(HMAC-SHA256(ADMIN_SESSION_SECRET, String(expiresAtMs))).
  Next.js issues it after a password check and stores it in an httpOnly
  cookie. Convex admin functions receive the same token as an argument and
  verify it themselves with the same secret (convex/lib/adminAuth.ts), so no
  client-side check is load-bearing.
*/

export const ADMIN_COOKIE = "aa_admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set");
  return s;
}

function sign(expiresAt: number): string {
  return createHmac("sha256", secret()).update(String(expiresAt)).digest("base64url");
}

function equal(a: string, b: string): boolean {
  // Hash both sides so lengths match before the constant-time compare.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function issueToken(now = Date.now()): string {
  const expiresAt = now + SESSION_TTL_MS;
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function verifyToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expiresAt = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;
  return equal(sig, sign(expiresAt));
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return equal(candidate, expected);
}

/** The current request's admin token if it verifies, else null. */
export async function currentAdminToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return verifyToken(token) ? token! : null;
}
