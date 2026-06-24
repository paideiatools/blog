import Image from "next/image";
import Link from "next/link";
import { Clock, Eye } from "lucide-react";
import TypographicCover from "@/components/public/TypographicCover";
import { formatDate } from "@/lib/utils";
import type { Post } from "@/lib/types";

// Shared header + cover + content + tags rendering for /blog/[slug] and
// /about/[slug] — the latter just hides view/reading-time stats.
export default function ArticleView({
  post,
  showStats = true,
  categoryHref = "/blog",
}: {
  post: Post;
  showStats?: boolean;
  categoryHref?: string;
}) {
  return (
    <>
      <header className="mx-auto max-w-2xl">
        {post.kicker ? (
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            {post.kicker}
          </p>
        ) : post.category ? (
          <Link
            href={`${categoryHref}?category=${post.category.slug}`}
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

        {showStats && (
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
        )}
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
    </>
  );
}
