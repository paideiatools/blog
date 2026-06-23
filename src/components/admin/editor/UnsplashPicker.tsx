"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Search, X } from "lucide-react";

export interface UnsplashImage {
  id: string;
  thumb: string;
  regular: string;
  alt: string;
  color: string | null;
  width: number;
  height: number;
  authorName: string;
  authorLink: string;
  downloadLocation: string;
}

interface UnsplashPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (image: UnsplashImage) => void;
}

const SUGGESTIONS = [
  "research",
  "notebook",
  "conversation",
  "library",
  "minimal desk",
  "abstract",
];

export default function UnsplashPicker({
  open,
  onClose,
  onSelect,
}: UnsplashPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"missing_key" | "generic" | null>(null);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (term: string) => {
    const q = term.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/unsplash?q=${encodeURIComponent(q)}`);
      if (res.status === 503) {
        setError("missing_key");
        setResults([]);
        return;
      }
      if (!res.ok) {
        setError("generic");
        setResults([]);
        return;
      }
      const data = (await res.json()) as { results: UnsplashImage[] };
      setResults(data.results ?? []);
    } catch {
      setError("generic");
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  // Debounce typing.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, open, runSearch]);

  // Focus input + lock scroll + Esc to close while open.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Reset when closed.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSearched(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl fade-in">
        {/* Search bar */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Search size={18} className="shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search free photos on Unsplash…"
            className="h-8 w-full bg-transparent text-base outline-none placeholder:text-faint"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-paper hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-[240px] flex-1 overflow-y-auto p-5">
          {error === "missing_key" ? (
            <div className="mx-auto max-w-md py-12 text-center">
              <p className="font-serif text-lg text-ink">
                Unsplash isn’t connected yet
              </p>
              <p className="mt-2 text-sm text-muted">
                Add a free <code className="text-accent">UNSPLASH_ACCESS_KEY</code>{" "}
                to <code className="text-accent">.env.local</code> and restart
                the dev server. Create one at{" "}
                <a
                  href="https://unsplash.com/oauth/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent underline"
                >
                  unsplash.com/oauth/applications
                </a>
                .
              </p>
            </div>
          ) : error === "generic" ? (
            <div className="py-12 text-center text-sm text-muted">
              Couldn’t reach Unsplash. Try again in a moment.
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16 text-muted">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : !searched ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted">Try a topic to get started</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted">
              No photos found for “{query}”.
            </div>
          ) : (
            <div className="columns-2 gap-3 sm:columns-3">
              {results.map((img) => (
                <button
                  key={img.id}
                  onClick={() => onSelect(img)}
                  className="group relative mb-3 block w-full overflow-hidden rounded-lg"
                  style={{ backgroundColor: img.color ?? "#e5e5e5" }}
                  title={`Photo by ${img.authorName} on Unsplash`}
                >
                  <Image
                    src={img.thumb}
                    alt={img.alt}
                    width={img.width}
                    height={img.height}
                    unoptimized
                    className="w-full transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 text-left text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {img.authorName}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-line px-5 py-2.5 text-center text-[11px] text-faint">
          Photos from{" "}
          <a
            href="https://unsplash.com/?utm_source=paideias_blog&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-muted"
          >
            Unsplash
          </a>
          {" "}— free to use, attribution added automatically.
        </div>
      </div>
    </div>
  );
}
