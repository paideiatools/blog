"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { MessageCircle, Reply, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/types";
import { initials } from "@/lib/utils";

const GUEST_NAME_KEY = "paideias-guest-name";

function timeAgo(date: string) {
  const seconds = (Date.now() - new Date(date).getTime()) / 1000;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function displayName(comment: Comment) {
  return comment.author?.full_name ?? comment.guest_name ?? "Anonymous";
}

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [guestName, setGuestName] = useState("");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .select("*, author:profiles(id, full_name, avatar_url, role)")
      .eq("post_id", postId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: true });
    setComments((data as Comment[]) ?? []);
    setLoaded(true);
  }, [postId]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    setGuestName(localStorage.getItem(GUEST_NAME_KEY) ?? "");
    load();
  }, [load]);

  async function submit(content: string, parentId: string | null) {
    setError(null);
    if (!content.trim()) return;
    if (!user && !guestName.trim()) {
      setError("Please add your name so others know who's talking.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: user?.id ?? null,
      guest_name: user ? null : guestName.trim(),
      parent_id: parentId,
      content: content.trim(),
    });
    setBusy(false);

    if (insertError) {
      setError("Couldn't post your comment. Please try again.");
      return;
    }
    if (!user) localStorage.setItem(GUEST_NAME_KEY, guestName.trim());
    setDraft("");
    setReplyDraft("");
    setReplyTo(null);
    load();
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("comments").delete().eq("id", id);
    load();
  }

  const roots = comments.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => comments.filter((c) => c.parent_id === id);

  function CommentItem({ comment, depth }: { comment: Comment; depth: number }) {
    const name = displayName(comment);
    return (
      <div className={depth > 0 ? "ml-10 mt-4" : "mt-6"}>
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-dark">
            {initials(name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-semibold">{name}</span>
              {comment.author?.role === "admin" && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-dark">
                  Author
                </span>
              )}
              {!comment.author_id && (
                <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-faint">
                  Guest
                </span>
              )}
              <span className="text-xs text-faint">
                {timeAgo(comment.created_at)}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/90">
              {comment.content}
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs text-faint">
              {depth === 0 && (
                <button
                  onClick={() =>
                    setReplyTo(replyTo === comment.id ? null : comment.id)
                  }
                  className="flex items-center gap-1 font-medium hover:text-accent"
                >
                  <Reply size={13} /> Reply
                </button>
              )}
              {user && user.id === comment.author_id && (
                <button
                  onClick={() => remove(comment.id)}
                  className="flex items-center gap-1 font-medium hover:text-danger"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>

            {replyTo === comment.id && (
              <div className="mt-3">
                <textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  rows={2}
                  placeholder="Write a reply…"
                  className="w-full rounded-xl border border-line bg-surface p-3 text-sm outline-none transition-colors focus:border-accent"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => submit(replyDraft, comment.id)}
                    disabled={busy || !replyDraft.trim()}
                    className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-on-accent hover:bg-accent-dark disabled:opacity-50"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="rounded-full px-4 py-1.5 text-xs font-medium text-muted hover:bg-paper"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {childrenOf(comment.id).map((child) => (
          <CommentItem key={child.id} comment={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <section id="comments" className="mx-auto mt-16 max-w-2xl">
      <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
        <MessageCircle size={22} className="text-accent" />
        Discussion {loaded && comments.length > 0 && `(${comments.length})`}
      </h2>

      <div className="mt-6">
        {!user && (
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              maxLength={80}
              placeholder="Your name"
              className="h-10 w-full max-w-[220px] rounded-full border border-line bg-surface px-4 text-sm outline-none transition-colors focus:border-accent"
            />
            <p className="text-xs text-faint">
              or{" "}
              <Link
                href="/login"
                className="font-medium text-accent hover:text-accent-dark"
              >
                sign in
              </Link>{" "}
              to comment with your account
            </p>
          </div>
        )}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Share your thoughts with the community…"
          className="w-full rounded-2xl border border-line bg-surface p-4 text-sm outline-none transition-colors focus:border-accent"
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => submit(draft, null)}
            disabled={busy || !draft.trim()}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-dark disabled:opacity-50"
          >
            {busy ? "Posting…" : "Post comment"}
          </button>
        </div>
      </div>

      <div className="mt-2">
        {roots.map((comment) => (
          <CommentItem key={comment.id} comment={comment} depth={0} />
        ))}
        {loaded && comments.length === 0 && (
          <p className="mt-8 text-center text-sm text-faint">
            No comments yet — be the first to start the discussion.
          </p>
        )}
      </div>
    </section>
  );
}
