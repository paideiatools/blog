import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/public/PostCard";
import FeaturedCarousel from "@/components/public/FeaturedCarousel";
import NewsletterForm from "@/components/public/NewsletterForm";
import type { Category, Post } from "@/lib/types";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: featured }, { data: latest }, { data: categories }] =
    await Promise.all([
      supabase
        .from("posts")
        .select("*, author:profiles!posts_author_id_fkey(*), category:categories(*)")
        .eq("status", "published")
        .eq("section", "blog")
        .eq("featured", true)
        .order("published_at", { ascending: false })
        .limit(5),
      supabase
        .from("posts")
        .select("*, author:profiles!posts_author_id_fkey(*), category:categories(*)")
        .eq("status", "published")
        .eq("section", "blog")
        .order("published_at", { ascending: false })
        .limit(9),
      supabase.from("categories").select("*").order("name"),
    ]);

  const featuredPosts = (featured as Post[]) ?? [];
  const featuredIds = new Set(featuredPosts.map((p) => p.id));
  const latestPosts = ((latest as Post[]) ?? []).filter(
    (p) => !featuredIds.has(p.id)
  );

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-24 md:pb-28 md:pt-32">
          <p className="rise text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            The Paideias community blog
          </p>
          <h1
            className="rise mt-6 max-w-3xl font-serif text-[43px] font-medium leading-[1.08] tracking-tight md:text-[64px]"
            style={{ "--rise-delay": "90ms" } as React.CSSProperties}
          >
            Where qualitative researchers think out loud
          </h1>
          <p
            className="rise mt-6 max-w-xl text-xl leading-relaxed text-muted"
            style={{ "--rise-delay": "180ms" } as React.CSSProperties}
          >
            Methodology deep-dives, coding and analysis techniques, and honest
            stories from the field — written for researchers, by researchers.
          </p>
          <div
            className="rise mt-10 flex flex-wrap items-center gap-3"
            style={{ "--rise-delay": "270ms" } as React.CSSProperties}
          >
            <Link
              href="/blog"
              className="flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-paper transition-colors duration-200 hover:bg-accent hover:text-on-accent"
            >
              Read the blog <ArrowRight size={16} />
            </Link>
            <a
              href="https://paideias.org"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-7 py-3.5 text-sm font-semibold text-ink ring-1 ring-line transition-colors duration-200 hover:ring-muted"
            >
              Discover Paideias
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5">
        {/* Featured */}
        {featuredPosts.length > 0 && (
          <section className="mt-14">
            <h2 className="section-label mb-5 text-xs font-bold uppercase tracking-[0.2em] text-faint">
              Featured
            </h2>
            <FeaturedCarousel posts={featuredPosts} />
          </section>
        )}

        {/* Latest */}
        <section className="mt-16">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="flex-1 pr-6 section-label text-xs font-bold uppercase tracking-[0.2em] text-faint">
              Latest articles
            </h2>
            <Link
              href="/blog"
              className="text-sm font-medium text-accent hover:text-accent-dark"
            >
              View all →
            </Link>
          </div>

          {latestPosts.length > 0 ? (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {latestPosts.slice(0, 6).map((post, i) => (
                <div
                  key={post.id}
                  className="rise"
                  style={{ "--rise-delay": `${i * 80}ms` } as React.CSSProperties}
                >
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="ring-card p-16 text-center">
              <p className="font-serif text-xl text-muted">
                The first article is on its way.
              </p>
              <p className="mt-2 text-sm text-faint">
                Subscribe below so you don&apos;t miss it.
              </p>
            </div>
          )}
        </section>

        {/* Topics */}
        {(categories as Category[])?.length > 0 && (
          <section className="mt-16">
            <h2 className="section-label mb-5 text-xs font-bold uppercase tracking-[0.2em] text-faint">
              Browse by topic
            </h2>
            <div className="flex flex-wrap gap-3">
              {(categories as Category[]).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blog?category=${cat.slug}`}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-muted ring-1 ring-line transition-colors duration-200 hover:text-ink hover:ring-muted"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* App promo band */}
        <section className="ring-card mt-20 overflow-hidden px-8 py-14 text-center md:px-16">
          <h2 className="mx-auto max-w-2xl font-serif text-3xl font-medium leading-snug md:text-[43px]">
            Analyse your qualitative data with Paideias
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            From transcripts to themes — Paideias helps you code, memo, and
            make sense of your data without losing the nuance.
          </p>
          <a
            href="https://paideias.org"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-dark"
          >
            Try Paideias free <ArrowRight size={16} />
          </a>
        </section>

        {/* Newsletter */}
        <section className="mx-auto mt-20 max-w-xl text-center">
          <h2 className="font-serif text-2xl font-medium">
            Join the newsletter
          </h2>
          <p className="mt-2 text-sm text-muted">
            One thoughtful email when new research insights are published. No
            spam, ever.
          </p>
          <div className="mt-5 flex justify-center">
            <NewsletterForm />
          </div>
        </section>
      </div>
    </>
  );
}
