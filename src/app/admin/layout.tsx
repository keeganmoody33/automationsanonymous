import type { Metadata } from "next";
import Link from "next/link";
import { currentAdminToken } from "@/lib/admin-session";
import { logout } from "@/app/admin/actions";
import { LoginForm } from "@/components/admin/login-form";
import { ConvexAdminProvider } from "@/components/admin/convex-admin-provider";
import { Sheet } from "@/components/sheet";

// Admin routes are never indexed. The gate lives here: no session, and every
// admin route renders the login form in place. No /login route exists.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const ADMIN_LINKS = [
  { href: "/admin/queue", label: "Queue" },
  { href: "/admin/import", label: "Import" },
] as const;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const token = await currentAdminToken();

  if (!token) {
    return (
      <Sheet number="A0" route="/admin" title="Admin" summary="Operator access. One password, no accounts.">
        <LoginForm />
      </Sheet>
    );
  }

  return (
    <ConvexAdminProvider token={token}>
      <div className="border-b-hairline bg-paper-deep px-unit-2 md:px-major">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-baseline gap-x-unit-2 gap-y-unit py-unit text-chrome">
          <span className="text-ink">Admin</span>
          {ADMIN_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink-2 hover:text-mark">
              {l.label}
            </Link>
          ))}
          <form action={logout} className="ml-auto">
            <button type="submit" className="text-ink-2 hover:text-mark">
              Close session
            </button>
          </form>
        </div>
      </div>
      {children}
    </ConvexAdminProvider>
  );
}
