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
import TypographicCover from "@/components/public/TypographicCover";
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

      {post.cover_template ? (
        <figure className="mx-auto mt-10 max-w-2xl">
          <TypographicCover
            template={post.cover_template}
            title={post.title}
            label={post.kicker ?? post.category?.name ?? null}
            quote={post.subtitle ?? post.excerpt ?? null}
            text={post.cover_text}
            layers={post.cover_layers}
            className="ring-1 ring-line"
          />
        </figure>
      ) : post.cover_image_url ? (
        <figure className="group relative mx-auto mt-10 max-w-2xl">
          <Image
            src={post.cover_image_url}
            alt={post.title}
            width={1280}
            height={720}
            priority
            className="aspect-[16/9] w-full rounded-2xl object-cover ring-1 ring-line"
          />
          {post.cover_credit_name && (
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/60 to-transparent px-4 pb-2.5 pt-10 text-right text-xs text-white/90 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Photo by{" "}
              {post.cover_credit_link ? (
                <a
                  href={`${post.cover_credit_link}?utm_source=paideias_blog&utm_medium=referral`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto underline"
                >
                  {post.cover_credit_name}
                </a>
              ) : (
                post.cover_credit_name
              )}{" "}
              on Unsplash
            </figcaption>
          )}
        </figure>
      ) : null}

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
