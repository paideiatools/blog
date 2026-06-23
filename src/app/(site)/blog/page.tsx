import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/public/PostCard";
import type { Category, Post } from "@/lib/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Articles",
  description:
    "All articles on qualitative research methodology, coding, analysis, and community stories from the Paideias blog.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  let query = supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(*), category:categories!inner(*)")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (category) {
    query = query.eq("categories.slug", category);
  }

  // Without a category filter we don't want the inner join to drop
  // uncategorised posts, so use a plain join instead.
  const { data: posts } = category
    ? await query
    : await supabase
        .from("posts")
        .select("*, author:profiles!posts_author_id_fkey(*), category:categories(*)")
        .eq("status", "published")
        .order("published_at", { ascending: false });

  const activeCategory = (categories as Category[])?.find(
    (c) => c.slug === category
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <header className="max-w-2xl">
        <h1 className="font-serif text-[43px] font-medium tracking-tight">
          {activeCategory ? activeCategory.name : "All articles"}
        </h1>
        <p className="mt-3 text-muted">
          {activeCategory?.description ??
            "Methodology, analysis, tools, and stories for qualitative researchers."}
        </p>
      </header>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/blog"
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            !category
              ? "bg-ink text-paper"
              : "border border-line bg-surface text-muted hover:border-accent hover:text-accent"
          }`}
        >
          All
        </Link>
        {(categories as Category[])?.map((cat) => (
          <Link
            key={cat.id}
            href={`/blog?category=${cat.slug}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              category === cat.slug
                ? "bg-ink text-paper"
                : "border border-line bg-surface text-muted hover:border-accent hover:text-accent"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {(posts as Post[])?.length ? (
        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {(posts as Post[]).map((post, i) => (
            <div
              key={post.id}
              className="rise"
              style={{ "--rise-delay": `${i * 70}ms` } as React.CSSProperties}
            >
              <PostCard post={post} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-surface p-16 text-center">
          <p className="font-serif text-xl text-muted">No articles here yet.</p>
          <p className="mt-2 text-sm text-faint">
            Check back soon — new writing is always in the works.
          </p>
        </div>
      )}
    </div>
  );
}
