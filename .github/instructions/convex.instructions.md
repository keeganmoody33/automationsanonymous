---
applyTo: "convex/**"
---

# Convex

- Object-form functions with `args` and `returns` validators on every function. Use `internalQuery` / `internalMutation` for anything not called from a client.
- Convex has no row-level security. Every function in `convex/public/` filters `status === "published"` (through `listPublishedDocs` or `isPublished`) and returns `toPublicAutomation(doc)` or the `PublicTool` shape. Never return a raw document from a public function.
- Every function in `convex/admin/` calls `await requireAdmin(args.token)` as the first statement of its handler, before any `ctx.db` access. Throw `ConvexError("Unauthorized")` on failure.
- `convex/submit.ts` is the only public write. It sets `origin: "submitted"`, `status: "pending"`. Nothing else public may write.
- Only `admin/automations.publish` writes `status: "published"`, only from `approved`, and it assigns the slug once. `update` rejects `slug`. Imports land `origin: "imported"`, `status: "raw"`.
- `submitterEmail`, `rejectionNote`, `internalNotes` are private fields. They appear in admin returns only.
- Schema is `convex/schema.ts` as written in the brief. Do not add fields, tables, or indexes without asking. Query with indexes (`by_status_published`, `by_slug`, `by_origin_status`), never a full-table `.filter()` where an index exists.
- Limits live in `convex/lib/limits.ts`; validate through `validateAutomationContent` / `validateAutomationPatch`.
- The admin token is `${expiresAtMs}.${base64url(HMAC-SHA256(ADMIN_SESSION_SECRET, expiresAtMs))}`, verified in `convex/lib/adminAuth.ts` with Web Crypto in the default runtime. Keep it byte-identical to `src/lib/admin-session.ts`.
- After changing anything here: `npx convex dev --once` (dev), `npx tsc --noEmit`, then `npx convex deploy` for production.
