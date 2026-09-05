"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Reactive hooks are for the admin queue only. Public pages use fetchQuery
// in server components and never mount this provider.
const AdminTokenContext = createContext<string | null>(null);

export function useAdminToken(): string {
  const token = useContext(AdminTokenContext);
  if (!token) throw new Error("useAdminToken outside ConvexAdminProvider");
  return token;
}

export function ConvexAdminProvider({ token, children }: { token: string; children: ReactNode }) {
  const [client] = useState(() => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!));
  useEffect(() => () => void client.close(), [client]);
  return (
    <ConvexProvider client={client}>
      <AdminTokenContext.Provider value={token}>{children}</AdminTokenContext.Provider>
    </ConvexProvider>
  );
}
