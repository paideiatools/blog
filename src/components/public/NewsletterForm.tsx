"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("loading");
    const supabase = createClient();
    const { error } = await supabase.from("subscribers").insert({ email });
    // Unique violation means they're already subscribed — treat as success.
    if (error && error.code !== "23505") {
      setState("error");
      return;
    }
    setState("done");
    setEmail("");
  }

  if (state === "done") {
    return (
      <p className="text-sm font-medium text-accent">
        ✓ You&apos;re on the list. Welcome to the community!
      </p>
    );
  }

  return (
    <form onSubmit={subscribe} className="flex w-full max-w-md gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="h-11 flex-1 rounded-full border border-line bg-surface px-5 text-sm outline-none transition-colors focus:border-accent"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="h-11 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-dark disabled:opacity-60"
      >
        {state === "loading" ? "…" : "Subscribe"}
      </button>
      {state === "error" && (
        <p className="text-sm text-danger">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
