"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PostCard from "@/components/public/PostCard";
import type { Post } from "@/lib/types";

const AUTOPLAY_MS = 6000;

export default function FeaturedCarousel({ posts }: { posts: Post[] }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (posts.length < 2) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % posts.length);
    }, AUTOPLAY_MS);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(() => {
    startTimer();
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts.length]);

  function go(next: number) {
    setIndex(((next % posts.length) + posts.length) % posts.length);
    startTimer();
  }

  if (posts.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={stopTimer}
      onMouseLeave={startTimer}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {posts.map((post) => (
            <div key={post.id} className="w-full shrink-0">
              <PostCard post={post} large />
            </div>
          ))}
        </div>
      </div>

      {posts.length > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            aria-label="Previous featured post"
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 p-2 text-ink ring-1 ring-line transition-colors hover:text-accent md:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => go(index + 1)}
            aria-label="Next featured post"
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 p-2 text-ink ring-1 ring-line transition-colors hover:text-accent md:flex"
          >
            <ChevronRight size={18} />
          </button>

          <div className="mt-4 flex justify-center gap-2">
            {posts.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to featured post ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-accent" : "w-1.5 bg-line"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
