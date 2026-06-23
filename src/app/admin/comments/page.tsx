"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/types";
import { formatDate, initials } from "@/lib/utils";

const FILTERS = ["all", "visible", "hidden"] as const;

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from("comments")
      .select("*, author:profiles(full_name), post:posts(title, slug)")
      .order("created_at", { ascending: false });
    if (filter === "visible") query = query.eq("is_hidden", false);
    if (filter === "hidden") query = query.eq("is_hidden", true);
    const { data } = await query;
    setComments((data as Comment[]) ?? []);
    setLoaded(true);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleHidden(comment: Comment) {
    const supabase = createClient();
    await supabase
      .from("comments")
      .update({ is_hidden: !comment.is_hidden })
      .eq("id", comment.id);
    load();
  }

  async function remove(comment: Comment) {
    if (!confirm("Delete this comment permanently?")) return;
    const supabase = createClient();
    await supabase.from("comments").delete().eq("id", comment.id);
    load();
  }

  return (
    <div className="p-6 md:p-10">
      <h1 className="font-serif text-3xl font-bold">Comments</h1>
      <p className="mt-1 text-sm text-muted">
        Moderate the community discussion. Hidden comments stay in the database
        but are invisible to readers.
      </p>

      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === f
                ? "bg-ink text-white"
                : "border border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`rounded-2xl border border-line bg-surface p-5 ${
              comment.is_hidden ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-dark">
                  {initials(comment.author?.full_name ?? comment.guest_name)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">
                      {comment.author?.full_name ?? comment.guest_name ?? "Unknown"}
                    </span>{" "}
                    {!comment.author_id && (
                      <span className="rounded bg-paper px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-faint">
                        guest
                      </span>
                    )}{" "}
                    <span className="text-faint">
                      · {formatDate(comment.created_at)}
                    </span>
                    {comment.is_hidden && (
                      <span className="ml-2 rounded bg-danger/10 px-1.5 py-0.5 text-xs font-semibold text-danger">
                        hidden
                      </span>
                    )}
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink/90">
                    {comment.content}
                  </p>
                  {comment.post && (
                    <Link
                      href={`/blog/${comment.post.slug}#comments`}
                      target="_blank"
                      className="mt-2 inline-block text-xs font-medium text-accent hover:text-accent-dark"
                    >
                      on “{comment.post.title}” →
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => toggleHidden(comment)}
                  title={comment.is_hidden ? "Unhide" : "Hide from readers"}
                  className="rounded-lg p-2 text-faint transition-colors hover:bg-paper hover:text-amber-600"
                >
                  {comment.is_hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => remove(comment)}
                  title="Delete"
                  className="rounded-lg p-2 text-faint transition-colors hover:bg-paper hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {loaded && comments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-14 text-center text-sm text-faint">
            No comments {filter !== "all" ? `(${filter})` : "yet"}.
          </div>
        )}
      </div>
    </div>
  );
}
