# convex/

Backend for automationsanonymous.com. Convex 1.45, default (V8) runtime everywhere; no `"use node"` files.

## Layout

| Path | Purpose |
| --- | --- |
| `schema.ts` | `automations` and `tools` tables. Indexes: `by_status_published`, `by_slug`, `by_origin_status`, tools `by_slug`. |
| `lib/validators.ts` | Validators derived from the schema: field sets, whole-doc validators, patch fields. |
| `lib/toolShape.ts` | `PublicTool`, `publicToolValidator`, `toPublicTool`, `countByToolSlug`. |
| `lib/publicShape.ts` | `PublicAutomation`, `publicAutomationValidator`, `isPublished`, `toPublicAutomation`. |
| `lib/published.ts` | `listPublishedDocs(ctx)`: the single bounded read of published rows. |
| `lib/limits.ts` | Length and sanity limits shared by submit, import, and admin update. |
| `lib/adminAuth.ts` | `requireAdmin(token)` and pure `verifyAdminToken`. |
| `public/automations.ts` | `listPublished`, `getBySlug`, `listByTool`, `listPublishedSlugs`. |
| `public/tools.ts` | `list`, `getBySlug`, `listCategories`. |
| `public/stacks.ts` | `listByStack`, `resolve` (one-query stack page: both tools plus their shared automations). |
| `submit.ts` | `submit`: the only public write. |
| `admin/automations.ts` | `listByStatus`, `get`, `update`, `approve`, `reject`, `promoteRaw`, `publish`. |
| `admin/imports.ts` | `importAutomations` (bulk, max 200, lands in `raw`). |
| `admin/tools.ts` | `upsert`, `list`. |

Public pages read these with `fetchQuery` from `convex/nextjs` in server components. Reactive hooks are for the admin queue only.

## The three private fields

`submitterEmail`, `rejectionNote`, `internalNotes` never reach a public client. Every public query filters to `status === "published"` and returns `PublicAutomation` via `toPublicAutomation`, which copies fields by name and never spreads a document. Admin functions return whole documents and are the only readers of those fields.

## Admin token

Every `admin/*` function takes `token: v.string()` as its first argument and calls `await requireAdmin(args.token)` before any database access. The Next.js side issues the token from `ADMIN_SESSION_SECRET`:

```
token = `${expiresAtMs}.${sigBase64url}`
sig   = HMAC-SHA256(key = ADMIN_SESSION_SECRET, message = String(expiresAtMs))
        encoded base64url, no padding
```

Verification runs with Web Crypto (`crypto.subtle`) in the default runtime, constant-time compare, and fails closed if the token is malformed, expired, or `ADMIN_SESSION_SECRET` is unset on the deployment (`npx convex env set ADMIN_SESSION_SECRET ...`). Failure throws `ConvexError("Unauthorized")`.

## Status and publish rule

```
imported  -> raw -> pending -> approved -> published
submitted ->        pending -> approved -> published
                    (raw | pending | approved) -> rejected
```

- Nothing writes `status: "published"` except `admin/automations.publish`, and only from `approved`.
- `publish` assigns the permanent slug (`^[a-z0-9]+(-[a-z0-9]+)*$`, unique via `by_slug`) and sets `publishedAt = Date.now()`.
- Once a record has a slug no function changes it. `update` rejects `slug`; `publish` rejects a slug that differs from one already set.
- No identity anywhere: no author fields, no user table, no `ctx.auth`.
