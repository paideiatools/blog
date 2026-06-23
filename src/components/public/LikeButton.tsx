"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LikeButton({
  postId,
  initialCount,
}: {
  postId: string;
  initialCount: number;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase
        .from("post_likes")
        .select("post_id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setLiked(!!data));
    });
  }, [postId]);

  async function toggle() {
    if (!userId) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const supabase = createClient();
    if (liked) {
      setLiked(false);
      setCount((c) => Math.max(0, c - 1));
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
    } else {
      setLiked(true);
      setCount((c) => c + 1);
      await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: userId });
    }
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        liked
          ? "border-accent bg-accent-soft text-accent-dark"
          : "border-line bg-surface text-muted hover:border-accent hover:text-accent"
      }`}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart size={16} fill={liked ? "currentColor" : "none"} />
      {count > 0 ? count : "Like"}
    </button>
  );
}
