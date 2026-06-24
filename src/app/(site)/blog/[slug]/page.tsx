import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostBySlug } from "@/lib/posts";
import ShareButtons from "@/components/public/ShareButtons";
import ReadingProgress from "@/components/public/ReadingProgress";
import LikeButton from "@/components/public/LikeButton";
import CommentSection from "@/components/public/CommentSection";
import PostCard from "@/components/public/PostCard";
import ArticleView from "@/components/public/ArticleView";
import { siteUrl } from "@/lib/utils";
import type { Post } from "@/lib/types";

function getPost(slug: string) {
  return getPostBySlug(slug, "blog");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || undefined;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      tags: post.tags,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const supabase = await createClient();

  // Count the view and load likes + related posts in parallel.
  const [, { count: likeCount }, { data: related }] = await Promise.all([
    supabase.rpc("increment_post_views", { post_slug: slug }),
    supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id),
    post.category_id
      ? supabase
          .from("posts")
          .select("*, author:profiles!posts_author_id_fkey(*), category:categories(*)")
          .eq("status", "published")
          .eq("section", "blog")
          .eq("category_id", post.category_id)
          .neq("id", post.id)
          .order("published_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
  ]);

  const url = `${siteUrl()}/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image_url ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    author: {
      "@type": "Organization",
      name: "Paideias",
      url: siteUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: "Paideias",
      url: siteUrl(),
    },
    mainEntityOfPage: url,
  };

  return (
    <article className="px-5 py-14 md:py-20">
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ArticleView post={post} />

      <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-between gap-4 border-y border-line py-5">
        <LikeButton postId={post.id} initialCount={likeCount ?? 0} />
        <ShareButtons url={url} title={post.title} />
      </div>

      <CommentSection postId={post.id} />

      {(related as Post[])?.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl">
          <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-faint">
            Keep reading
          </h2>
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {(related as Post[]).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
