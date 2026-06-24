"use client";

import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

export default function GrantAdminForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: data.message });
        setEmail("");
      } else {
        setResult({
          ok: false,
          message:
            data.message ??
            (data.error === "invalid_email"
              ? "Enter a valid email address."
              : data.error === "forbidden"
                ? "Only admins can do this."
                : "Something went wrong."),
        });
      }
    } catch {
      setResult({ ok: false, message: "Network error — try again." });
    }
    setBusy(false);
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="person@example.com"
          className="h-11 flex-1 rounded-xl border border-line bg-paper px-3 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-dark disabled:opacity-60"
        >
          {busy ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <UserPlus size={15} />
          )}
          Make admin
        </button>
      </form>
      {result && (
        <p
          className={`mt-3 rounded-xl px-4 py-3 text-sm font-medium ${
            result.ok
              ? "bg-accent-soft text-accent-dark"
              : "bg-danger/10 text-danger"
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
