import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ShareButtons from "@/components/public/ShareButtons";
import ReadingProgress from "@/components/public/ReadingProgress";
import LikeButton from "@/components/public/LikeButton";
import CommentSection from "@/components/public/CommentSection";
import PostCard from "@/components/public/PostCard";
import { formatDate, siteUrl } from "@/lib/utils";
import type { Post } from "@/lib/types";

async function getPost(slug: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(*), category:categories(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data as Post | null;
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

      <header className="mx-auto max-w-2xl">
        {post.kicker ? (
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            {post.kicker}
          </p>
        ) : post.category ? (
          <Link
            href={`/blog?category=${post.category.slug}`}
            className="text-xs font-bold uppercase tracking-[0.22em] text-accent hover:text-accent-dark"
          >
            {post.category.name}
          </Link>
        ) : null}
        <h1 className="mt-4 text-balance font-serif text-[clamp(2.15rem,5.5vw,3.05rem)] font-medium leading-[1.08] tracking-[-0.02em]">
          {post.title}
        </h1>
        {(post.subtitle || post.excerpt) && (
          <p className="mt-5 text-pretty text-xl leading-relaxed text-muted">
            {post.subtitle || post.excerpt}
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
          {post.published_at && (
            <time dateTime={post.published_at}>
              {formatDate(post.published_at)}
            </time>
          )}
          <span className="text-faint">·</span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} /> {post.reading_time} min read
          </span>
          <span className="text-faint">·</span>
          <span className="flex items-center gap-1.5">
            <Eye size={13} /> {post.view_count + 1} views
          </span>
        </div>
      </header>

      {post.cover_image_url && (
        <figure className="mx-auto mt-10 max-w-2xl">
          <Image
            src={post.cover_image_url}
            alt={post.title}
            width={1280}
            height={720}
            priority
            className="aspect-[16/9] w-full rounded-2xl object-cover ring-1 ring-line"
          />
        </figure>
      )}

      <div
        className="article-content mx-auto mt-12 max-w-2xl md:mt-16"
        dangerouslySetInnerHTML={{ __html: post.content_html ?? "" }}
      />

      {post.tags.length > 0 && (
        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-3 py-1 text-xs font-medium text-muted ring-1 ring-line"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

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
