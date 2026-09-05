import type { Metadata } from "next";

// Admin routes are never indexed. The access gate (signed session from
// ADMIN_PASSWORD and ADMIN_SESSION_SECRET) is added in Phase 4; until then
// these pages render stubs with no data.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
