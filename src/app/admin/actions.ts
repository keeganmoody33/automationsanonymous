"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { ConvexError } from "convex/values";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ADMIN_COOKIE, checkPassword, currentAdminToken, issueToken } from "@/lib/admin-session";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password");
  if (typeof password !== "string" || !checkPassword(password)) {
    return { error: "Wrong password" };
  }
  const token = issueToken();
  const expires = new Date(Number(token.split(".")[0]));
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    expires,
  });
  // Setting the cookie re-renders the admin layout, which now sees a session.
  return {};
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete({ name: ADMIN_COOKIE, path: "/admin" });
}

export type PublishState = { ok?: boolean; slug?: string; error?: string };

/**
 * Publish runs on the server so the affected public pages can be
 * revalidated in the same request. Everything else in the editor uses
 * reactive Convex mutations from the client.
 */
export async function publishAutomation(id: Id<"automations">, slug: string): Promise<PublishState> {
  const token = await currentAdminToken();
  if (!token) return { error: "Session expired. Reload and open it again." };
  try {
    await fetchMutation(api.admin.automations.publish, { token, id, slug });
    const a = await fetchQuery(api.public.automations.getBySlug, { slug });
    revalidatePath("/automations");
    revalidatePath(`/automations/${slug}`);
    revalidatePath("/tools");
    for (const t of a?.toolSlugs ?? []) revalidatePath(`/tools/${t}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/llms-full.txt");
    return { ok: true, slug };
  } catch (err) {
    const message = err instanceof ConvexError ? String(err.data) : err instanceof Error ? err.message : "Publish failed";
    return { error: message };
  }
}
