import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import TypographicCover from "@/components/public/TypographicCover";

export default function PostCard({
  post,
  large = false,
}: {
  post: Post;
  large?: boolean;
}) {
  return (
    <article
      className={`ring-card ring-card-hover group flex h-full flex-col overflow-hidden ${
        large ? "md:grid md:grid-cols-2" : ""
      }`}
    >
      <Link
        href={`/blog/${post.slug}`}
        className={`block overflow-hidden bg-paper ${
          large ? "aspect-[16/10] md:aspect-auto md:h-full" : "aspect-[16/9]"
        }`}
        tabIndex={-1}
        aria-hidden
      >
        {post.cover_template ? (
          <TypographicCover
            template={post.cover_template}
            title={post.title}
            label={post.category?.name ?? null}
            quote={post.excerpt ?? null}
            text={post.cover_text}
            layers={post.cover_layers}
            className="tcover--fill"
          />
        ) : post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt=""
            width={800}
            height={500}
            className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center border-b border-line">
            <span className="font-serif text-5xl text-accent/40">¶</span>
          </div>
        )}
      </Link>

      <div
        className={`flex flex-1 flex-col p-6 ${
          large ? "md:justify-center md:p-10" : ""
        }`}
      >
        <div className="flex items-center gap-3 text-xs font-medium text-muted">
          {post.category && (
            <Link
              href={`/blog?category=${post.category.slug}`}
              className="font-semibold uppercase tracking-wider text-accent transition-colors duration-200 hover:text-accent-dark"
            >
              {post.category.name}
            </Link>
          )}
          {post.published_at && (
            <time dateTime={post.published_at}>
              {formatDate(post.published_at)}
            </time>
          )}
        </div>

        <Link href={`/blog/${post.slug}`} className="block">
          <h3
            className={`mt-3 font-serif font-medium leading-snug tracking-tight transition-colors duration-200 group-hover:text-accent ${
              large
                ? "line-clamp-3 text-2xl md:text-[32px]"
                : "line-clamp-2 min-h-[2.75em] text-xl"
            }`}
          >
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p
            className={`mt-3 leading-relaxed text-muted ${
              large
                ? "line-clamp-3 text-base"
                : "line-clamp-2 min-h-[2.85em] text-sm"
            }`}
          >
            {post.excerpt}
          </p>
        )}

        <p className="mt-auto pt-5 text-xs text-muted">
          {post.reading_time} min read
        </p>
      </div>
    </article>
  );
}
