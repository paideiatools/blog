import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostEditor from "@/components/admin/PostEditor";
import type { Post } from "@/lib/types";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  return <PostEditor post={post as Post} />;
}
