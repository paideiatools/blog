"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setHasSession(!!user);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/"), 1800);
  }

  const input =
    "h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm outline-none transition-colors focus:border-accent";

  return (
    <div className="mx-auto w-full max-w-md px-5 py-16">
      <div className="ring-card p-8">
        <h1 className="text-center font-serif text-3xl font-medium">
          Set a new password
        </h1>

        {hasSession === false && (
          <p className="mt-4 text-center text-sm text-muted">
            This page only works from a password reset link.{" "}
            <Link href="/login" className="font-semibold text-accent">
              Request one here
            </Link>
            .
          </p>
        )}

        {hasSession && !done && (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <input
              type="password"
              required
              minLength={8}
              placeholder="New password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Repeat new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={input}
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="h-12 w-full rounded-xl bg-accent text-sm font-semibold text-on-accent transition-colors hover:bg-accent-dark disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save new password"}
            </button>
          </form>
        )}

        {done && (
          <p className="mt-6 text-center text-sm font-medium text-accent">
            ✓ Password updated — taking you home…
          </p>
        )}
      </div>
    </div>
  );
}
