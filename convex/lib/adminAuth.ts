/**
 * Admin session token verification.
 *
 * Token format, issued by the Next.js side:
 *   `${expiresAtMs}.${sigBase64url}`
 *   sig = HMAC-SHA256(key = ADMIN_SESSION_SECRET, message = String(expiresAtMs))
 *   encoded base64url, no padding.
 *
 * Runs in the default Convex runtime using Web Crypto (`crypto.subtle`), which
 * the runtime supports (https://docs.convex.dev/functions/runtimes). No Node
 * imports, so this is usable from queries and mutations alike.
 */
import { ConvexError } from "convex/values";

const TOKEN_RE = /^(\d{1,16})\.([A-Za-z0-9_-]{43})$/;
const B64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function base64UrlEncode(bytes: Uint8Array): string {
  let out = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63] + B64URL[(n >> 6) & 63] + B64URL[n & 63];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63];
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63] + B64URL[(n >> 6) & 63];
  }
  return out;
}

/** Constant-time string equality (for equal-length inputs; unequal lengths return false). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return base64UrlEncode(new Uint8Array(sig));
}

/**
 * Pure verification. Returns true only when the token is well-formed, unexpired
 * at `nowMs`, and its signature matches `secret`.
 */
export async function verifyAdminToken(
  token: string | undefined | null,
  secret: string | undefined | null,
  nowMs: number,
): Promise<boolean> {
  if (typeof token !== "string" || typeof secret !== "string" || secret.length === 0) return false;
  const match = TOKEN_RE.exec(token);
  if (!match) return false;
  const expiresAtMs = Number(match[1]);
  if (!Number.isSafeInteger(expiresAtMs) || expiresAtMs <= nowMs) return false;
  const expected = await hmacSha256Base64Url(secret, String(expiresAtMs));
  return timingSafeEqual(expected, match[2]);
}

/**
 * Call at the top of every admin handler, before any db access.
 * Throws `ConvexError("Unauthorized")` on any failure, including an unset
 * `ADMIN_SESSION_SECRET` on the deployment.
 */
export async function requireAdmin(token: string | undefined): Promise<void> {
  const ok = await verifyAdminToken(token, process.env.ADMIN_SESSION_SECRET, Date.now());
  if (!ok) throw new ConvexError("Unauthorized");
}
