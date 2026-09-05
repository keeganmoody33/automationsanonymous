"use server";

import { cookies } from "next/headers";
import { ADMIN_COOKIE, checkPassword, issueToken } from "@/lib/admin-session";

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
