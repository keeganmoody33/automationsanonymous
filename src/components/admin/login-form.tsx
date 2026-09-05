"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="flex max-w-[40ch] flex-col gap-unit">
      <label className="flex flex-col gap-tick">
        <span className="text-chrome text-ink-2">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="border-thin bg-paper px-unit py-tick text-ink outline-none focus-visible:border-mark"
        />
      </label>
      {state.error ? (
        <p role="alert" className="text-chrome text-mark">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="self-start border-thin border-ink px-unit-2 py-tick text-chrome text-ink hover:border-mark hover:text-mark disabled:text-ink-3"
      >
        {pending ? "Checking" : "Open"}
      </button>
    </form>
  );
}
