"use client";

import { useState } from "react";
import { Bot, Check, Copy, Eye, EyeOff } from "lucide-react";

export default function AgentApiCard({
  endpoint,
  apiKey,
}: {
  endpoint: string;
  apiKey: string | null;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<"endpoint" | "key" | null>(null);

  function copy(value: string, which: "endpoint" | "key") {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const masked = apiKey
    ? `${apiKey.slice(0, 6)}${"•".repeat(Math.max(apiKey.length - 10, 6))}${apiKey.slice(-4)}`
    : "";

  return (
    <section className="mt-8 rounded-2xl border border-line bg-surface p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <Bot size={17} className="text-accent" /> AI agent posting
      </h2>
      <p className="mt-1 text-sm text-muted">
        Let Claude or any AI agent draft posts for you. Give the agent the
        endpoint and this key (as a{" "}
        <code className="rounded bg-paper px-1 py-0.5 text-xs">
          Authorization: Bearer
        </code>{" "}
        header). Agent posts arrive as drafts for your review.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">
            Endpoint
          </p>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2">
            <code className="min-w-0 flex-1 truncate text-sm">{endpoint}</code>
            <button
              onClick={() => copy(endpoint, "endpoint")}
              className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
              title="Copy endpoint"
            >
              {copied === "endpoint" ? (
                <Check size={15} className="text-accent" />
              ) : (
                <Copy size={15} />
              )}
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">
            API key
          </p>
          {apiKey ? (
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2">
              <code className="min-w-0 flex-1 truncate text-sm">
                {revealed ? apiKey : masked}
              </code>
              <button
                onClick={() => setRevealed((r) => !r)}
                className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
                title={revealed ? "Hide" : "Reveal"}
              >
                {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                onClick={() => copy(apiKey, "key")}
                className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
                title="Copy key"
              >
                {copied === "key" ? (
                  <Check size={15} className="text-accent" />
                ) : (
                  <Copy size={15} />
                )}
              </button>
            </div>
          ) : (
            <p className="mt-1 rounded-xl border border-dashed border-line bg-paper px-3 py-2 text-sm text-faint">
              Not configured — set{" "}
              <code className="text-accent">BLOG_AGENT_API_KEY</code> in your
              environment to enable.
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-faint">
        Keep this key secret — anyone with it can post. Rotate it by changing{" "}
        <code>BLOG_AGENT_API_KEY</code>. See <code>AGENT_API.md</code> for the
        full request format and a ready-to-paste agent prompt.
      </p>
    </section>
  );
}
