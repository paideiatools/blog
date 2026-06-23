"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileText, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type Result = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string | null;
};

export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSearched(false);
      // Wait a tick for the element to mount before focusing.
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    const supabase = createClient();
    const term = `%${q.trim()}%`;
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, excerpt, published_at")
      .eq("status", "published")
      .or(`title.ilike.${term},excerpt.ilike.${term}`)
      .order("published_at", { ascending: false })
      .limit(8);
    setResults((data as Result[]) ?? []);
    setSearching(false);
    setSearched(true);
  }, []);

  // Debounced live search.
  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  function go(slug: string) {
    onClose();
    router.push(`/blog/${slug}`);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-paper/70 px-5 pt-[14vh] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search articles"
    >
      <div
        className="ring-card w-full max-w-xl overflow-hidden fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          {searching ? (
            <Loader2 size={18} className="shrink-0 animate-spin text-muted" />
          ) : (
            <Search size={18} className="shrink-0 text-muted" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-faint"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="rounded-lg p-1.5 text-muted transition-colors hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {results.map((post) => (
            <button
              key={post.id}
              onClick={() => go(post.slug)}
              className="flex w-full items-start gap-3 border-b border-line px-5 py-4 text-left transition-colors last:border-0 hover:bg-paper/50"
            >
              <FileText size={16} className="mt-1 shrink-0 text-accent" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{post.title}</span>
                {post.excerpt && (
                  <span className="mt-0.5 block truncate text-sm text-muted">
                    {post.excerpt}
                  </span>
                )}
                {post.published_at && (
                  <span className="mt-1 block text-xs text-faint">
                    {formatDate(post.published_at)}
                  </span>
                )}
              </span>
            </button>
          ))}

          {searched && !searching && results.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted">
              No articles match “{query}”.
            </p>
          )}

          {!searched && (
            <p className="px-5 py-6 text-center text-xs text-faint">
              Type at least two characters to search · Esc to close
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
