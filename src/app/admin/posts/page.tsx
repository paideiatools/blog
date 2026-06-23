"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  Globe,
  PenLine,
  Plus,
  Search,
  Star,
  Trash2,
  Undo2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const FILTERS = ["all", "published", "draft", "archived"] as const;

const STATUS_STYLE: Record<string, string> = {
  published: "bg-accent-soft text-accent-dark",
  draft: "bg-amber-100 text-amber-800",
  archived: "bg-gray-100 text-gray-500",
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("posts")
      .select("*, category:categories(name)")
      .order("updated_at", { ascending: false });
    setPosts((data as Post[]) ?? []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: posts.length,
      published: 0,
      draft: 0,
      archived: 0,
    };
    posts.forEach((p) => c[p.status]++);
    return c;
  }, [posts]);

  const visible = useMemo(() => {
    let list = posts;
    if (filter !== "all") list = list.filter((p) => p.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [posts, filter, search]);

  async function remove(post: Post) {
    if (!confirm(`Delete “${post.title || "(untitled)"}” permanently?`)) return;
    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", post.id);
    load();
  }

  async function toggleFeatured(post: Post) {
    const supabase = createClient();
    await supabase
      .from("posts")
      .update({ featured: !post.featured })
      .eq("id", post.id);
    load();
  }

  async function togglePublished(post: Post) {
    const supabase = createClient();
    if (post.status === "published") {
      await supabase
        .from("posts")
        .update({ status: "draft" })
        .eq("id", post.id);
    } else {
      await supabase
        .from("posts")
        .update({
          status: "published",
          published_at: post.published_at ?? new Date().toISOString(),
        })
        .eq("id", post.id);
    }
    load();
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Posts</h1>
          <p className="mt-1 text-sm text-muted">
            Write, edit, and manage everything you publish.
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
        >
          <Plus size={16} /> New post
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-ink text-white"
                  : "border border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              {f}
              <span className="ml-1.5 text-xs opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, slug, or tag…"
            className="h-9 w-64 rounded-full border border-line bg-surface pl-9 pr-4 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-5 py-3 font-semibold">Title</th>
              <th className="hidden px-5 py-3 font-semibold md:table-cell">
                Category
              </th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="hidden px-5 py-3 font-semibold md:table-cell">
                Views
              </th>
              <th className="hidden px-5 py-3 font-semibold lg:table-cell">
                Updated
              </th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((post) => (
              <tr key={post.id} className="transition-colors hover:bg-paper/60">
                <td className="max-w-xs px-5 py-4">
                  <Link
                    href={`/admin/posts/${post.id}`}
                    className="flex items-center gap-2 font-medium hover:text-accent"
                  >
                    {post.featured && (
                      <Star
                        size={14}
                        className="shrink-0 fill-amber-400 text-amber-400"
                      />
                    )}
                    <span className="truncate">
                      {post.title || "(untitled)"}
                    </span>
                  </Link>
                </td>
                <td className="hidden px-5 py-4 text-muted md:table-cell">
                  {post.category?.name ?? "—"}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[post.status]}`}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="hidden px-5 py-4 text-muted md:table-cell">
                  {post.view_count.toLocaleString()}
                </td>
                <td className="hidden px-5 py-4 text-muted lg:table-cell">
                  {formatDate(post.updated_at)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => togglePublished(post)}
                      title={
                        post.status === "published"
                          ? "Unpublish (back to draft)"
                          : "Publish now"
                      }
                      className={`rounded-lg p-2 transition-colors hover:bg-paper ${
                        post.status === "published"
                          ? "text-accent hover:text-amber-600"
                          : "text-faint hover:text-accent"
                      }`}
                    >
                      {post.status === "published" ? (
                        <Undo2 size={16} />
                      ) : (
                        <Globe size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => toggleFeatured(post)}
                      title={post.featured ? "Unfeature" : "Feature on homepage"}
                      className="rounded-lg p-2 text-faint transition-colors hover:bg-paper hover:text-amber-500"
                    >
                      <Star
                        size={16}
                        className={
                          post.featured ? "fill-amber-400 text-amber-400" : ""
                        }
                      />
                    </button>
                    {post.status === "published" && (
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        title="View live"
                        className="rounded-lg p-2 text-faint transition-colors hover:bg-paper hover:text-accent"
                      >
                        <Eye size={16} />
                      </Link>
                    )}
                    <Link
                      href={`/admin/posts/${post.id}`}
                      title="Edit"
                      className="rounded-lg p-2 text-faint transition-colors hover:bg-paper hover:text-accent"
                    >
                      <PenLine size={16} />
                    </Link>
                    <button
                      onClick={() => remove(post)}
                      title="Delete"
                      className="rounded-lg p-2 text-faint transition-colors hover:bg-paper hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loaded && visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-faint">
                  {search
                    ? `Nothing matches “${search}”.`
                    : `No posts ${filter !== "all" ? `with status “${filter}”` : "yet"}.`}{" "}
                  <Link href="/admin/posts/new" className="text-accent">
                    Write one →
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
