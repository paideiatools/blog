"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push(next);
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push(next);
        router.refresh();
      } else {
        setNotice(
          "Check your inbox — we sent you a confirmation link to finish signing up."
        );
      }
    }
  }

  async function forgotPassword() {
    setError(null);
    setNotice(null);
    if (!email.includes("@")) {
      setError("Enter your email address above first, then click reset.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNotice("Check your inbox — we sent you a password reset link.");
  }

  const input =
    "h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm outline-none transition-colors focus:border-accent";

  return (
    <div className="mx-auto w-full max-w-md px-5 py-16">
      <div className="rounded-3xl border border-line bg-surface p-8 shadow-sm">
        <h1 className="text-center font-serif text-3xl font-bold">
          {mode === "signin" ? "Welcome back" : "Join the community"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          {mode === "signin"
            ? "Sign in to comment, like, and join the discussion."
            : "Create a free account to join the conversation."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === "signup" && (
            <input
              type="text"
              required
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={input}
            />
          )}
          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
          />

          {mode === "signin" && (
            <p className="text-right">
              <button
                type="button"
                onClick={forgotPassword}
                disabled={busy}
                className="text-xs font-medium text-muted transition-colors hover:text-accent"
              >
                Forgot password?
              </button>
            </p>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
          {notice && <p className="text-sm font-medium text-accent">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl bg-accent text-sm font-semibold text-on-accent transition-colors hover:bg-accent-dark disabled:opacity-60"
          >
            {busy
              ? "One moment…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button
                onClick={() => setMode("signup")}
                className="font-semibold text-accent hover:text-accent-dark"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="font-semibold text-accent hover:text-accent-dark"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-faint">
        <Link href="/" className="hover:text-accent">
          ← Back to the blog
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
