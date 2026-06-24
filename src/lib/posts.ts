import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

// Shared by /blog/[slug] and /about/[slug] — same shape, different section.
export async function getPostBySlug(
  slug: string,
  section: "blog" | "docs"
): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(*), category:categories(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("section", section)
    .maybeSingle();
  return data as Post | null;
}
