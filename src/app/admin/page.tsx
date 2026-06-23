import Link from "next/link";
import {
  FileText,
  Eye,
  MessageSquare,
  Heart,
  Mail,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalPosts },
    { count: publishedPosts },
    { data: viewData },
    { count: totalComments },
    { count: totalLikes },
    { count: totalSubscribers },
    { data: topPosts },
    { data: recentComments },
  ] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("posts").select("view_count"),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase.from("post_likes").select("*", { count: "exact", head: true }),
    supabase.from("subscribers").select("*", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("id, title, slug, view_count, status")
      .order("view_count", { ascending: false })
      .limit(5),
    supabase
      .from("comments")
      .select("id, content, created_at, is_hidden, guest_name, author:profiles(full_name), post:posts(title, slug)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalViews =
    viewData?.reduce((sum, p) => sum + (p.view_count ?? 0), 0) ?? 0;

  const stats = [
    {
      label: "Posts",
      value: totalPosts ?? 0,
      sub: `${publishedPosts ?? 0} published`,
      icon: FileText,
    },
    { label: "Total views", value: totalViews, sub: "all time", icon: Eye },
    {
      label: "Comments",
      value: totalComments ?? 0,
      sub: "community discussion",
      icon: MessageSquare,
    },
    { label: "Likes", value: totalLikes ?? 0, sub: "appreciations", icon: Heart },
    {
      label: "Subscribers",
      value: totalSubscribers ?? 0,
      sub: "newsletter",
      icon: Mail,
    },
  ];

  return (
    <div className="p-6 md:p-10">
      <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        A bird&apos;s-eye view of your blog and community.
      </p>

      {/* Quick actions */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-ink p-6 text-white md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-serif text-xl font-bold">
            Got something to say today?
          </p>
          <p className="mt-1 text-sm text-white/60">
            Write it down while it&apos;s fresh — you can save a draft anytime.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/posts/new"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent-dark"
          >
            ✍️ Write a new post
          </Link>
          <Link
            href="/admin/comments"
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10"
          >
            Moderate comments
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10"
          >
            View site
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <stat.icon size={18} className="text-accent" />
            <p className="mt-3 text-3xl font-bold tracking-tight">
              {stat.value.toLocaleString()}
            </p>
            <p className="text-sm font-medium">{stat.label}</p>
            <p className="text-xs text-faint">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <TrendingUp size={17} className="text-accent" /> Top posts by views
          </h2>
          <ul className="mt-4 divide-y divide-line">
            {topPosts?.length ? (
              topPosts.map((post) => (
                <li
                  key={post.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <Link
                    href={`/admin/posts/${post.id}`}
                    className="min-w-0 truncate text-sm font-medium hover:text-accent"
                  >
                    {post.title || "(untitled)"}
                  </Link>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                    <Eye size={13} /> {post.view_count.toLocaleString()}
                  </span>
                </li>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-faint">
                No posts yet — write your first one!
              </p>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <MessageSquare size={17} className="text-accent" /> Recent comments
          </h2>
          <ul className="mt-4 divide-y divide-line">
            {recentComments?.length ? (
              recentComments.map((comment) => {
                const author = Array.isArray(comment.author)
                  ? comment.author[0]
                  : comment.author;
                const post = Array.isArray(comment.post)
                  ? comment.post[0]
                  : comment.post;
                return (
                  <li key={comment.id} className="py-3">
                    <p className="line-clamp-2 text-sm">{comment.content}</p>
                    <p className="mt-1 text-xs text-faint">
                      {author?.full_name ?? comment.guest_name ?? "Unknown"} on “
                      {post?.title}” ·{" "}
                      {formatDate(comment.created_at)}
                      {comment.is_hidden && (
                        <span className="ml-2 rounded bg-danger/10 px-1.5 py-0.5 font-medium text-danger">
                          hidden
                        </span>
                      )}
                    </p>
                  </li>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-faint">
                No comments yet.
              </p>
            )}
          </ul>
          <Link
            href="/admin/comments"
            className="mt-3 inline-block text-sm font-medium text-accent hover:text-accent-dark"
          >
            Moderate all comments →
          </Link>
        </section>
      </div>
    </div>
  );
}
