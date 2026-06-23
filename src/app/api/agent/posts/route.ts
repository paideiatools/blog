import type { NextRequest } from "next/server";
import { marked } from "marked";
import { createAdminClient } from "@/lib/supabase/admin";
import { excerptFromHtml, readingTimeFromHtml, slugify } from "@/lib/utils";

// Programmatic posting API for AI agents (Claude tool-use, automations, cron,
// etc.). Authenticated with a single bearer token (BLOG_AGENT_API_KEY) and
// backed by the service-role client so it can write without a user session.
//
//   GET  /api/agent/posts  → brand voice, categories, recent titles (context)
//   POST /api/agent/posts  → create a post (defaults to draft for review)

export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const expected = process.env.BLOG_AGENT_API_KEY;
  if (!expected) return false;
  const token = (request.headers.get("authorization") || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  return token.length > 0 && token === expected;
}

const unauthorized = () =>
  Response.json({ error: "unauthorized" }, { status: 401 });

// Only these hosts may appear in an <iframe> (video embeds).
const ALLOWED_IFRAME_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
]);

// Light hardening for agent-supplied HTML (the token is trusted, but defence
// in depth — content is rendered with dangerouslySetInnerHTML on the blog).
// Scripts/objects/event handlers are stripped; iframes survive only when they
// point at an allow-listed video host.
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?(?:object|embed)\b[^>]*>/gi, "")
    .replace(/<iframe\b[^>]*>(?:[\s\S]*?<\/iframe>)?/gi, (tag) => {
      const src = tag.match(/\ssrc\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
      try {
        if (ALLOWED_IFRAME_HOSTS.has(new URL(src).hostname.toLowerCase())) {
          return tag;
        }
      } catch {
        /* malformed src — drop it */
      }
      return "";
    })
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return unauthorized();

  const supabase = createAdminClient();
  const [{ data: categories }, { data: posts }] = await Promise.all([
    supabase.from("categories").select("name, slug, description").order("name"),
    supabase
      .from("posts")
      .select("title, slug, status, published_at")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  return Response.json({
    brand: {
      name: "Paideias Blog",
      audience: "qualitative researchers",
      voice:
        "Thoughtful, practical, peer-to-peer. Methodology, coding, and analysis for qualitative researchers — concrete and example-led, never hype. First person plural is fine.",
    },
    categories: categories ?? [],
    recent_posts: posts ?? [],
    instructions:
      "Write an original post that doesn't duplicate a recent title. Then POST to this same URL with the Bearer token and a JSON body: { title (required), body_markdown (required), kicker?, subtitle?, excerpt?, category? (a slug from `categories`), tags?: string[], cover_image_url?, status?: 'draft'|'published' }. Posts default to 'draft' so a human can review before publishing.",
  });
}

interface CreatePostBody {
  title?: string;
  kicker?: string;
  subtitle?: string;
  excerpt?: string;
  body_markdown?: string;
  body_html?: string;
  category?: string;
  tags?: string[];
  cover_image_url?: string;
  featured?: boolean;
  status?: "draft" | "published";
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return unauthorized();

  const body = (await request
    .json()
    .catch(() => null)) as CreatePostBody | null;

  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return Response.json(
      { error: "invalid_request", message: "A non-empty 'title' is required." },
      { status: 400 }
    );
  }
  if (!body.body_markdown?.trim() && !body.body_html?.trim()) {
    return Response.json(
      {
        error: "invalid_request",
        message: "Provide content as 'body_markdown' or 'body_html'.",
      },
      { status: 400 }
    );
  }

  const title = body.title.trim();
  const rawHtml = body.body_html?.trim()
    ? body.body_html
    : (marked.parse(body.body_markdown!, { async: false }) as string);
  const html = sanitizeHtml(rawHtml);

  const supabase = createAdminClient();

  // Attribute the post to the first admin profile.
  const { data: admin } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!admin) {
    return Response.json(
      { error: "no_admin", message: "No admin profile to attribute the post to." },
      { status: 409 }
    );
  }

  // Optional category by slug (preferred) or name.
  let categoryId: string | null = null;
  if (body.category?.trim()) {
    const c = body.category.trim();
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .or(`slug.eq.${c},name.ilike.${c}`)
      .limit(1)
      .maybeSingle();
    categoryId = cat?.id ?? null;
  }

  // Ensure a unique slug.
  const base = slugify(title) || `post-${Date.now().toString(36)}`;
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const { data: clash } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${base}-${i}`;
  }

  const status = body.status === "published" ? "published" : "draft";
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim().replace(/^#/, "")).filter(Boolean)
    : [];

  const { data: created, error } = await supabase
    .from("posts")
    .insert({
      title,
      kicker: body.kicker?.trim() || null,
      subtitle: body.subtitle?.trim() || null,
      slug,
      excerpt: body.excerpt?.trim() || excerptFromHtml(html),
      content_html: html,
      cover_image_url: body.cover_image_url?.trim() || null,
      category_id: categoryId,
      tags,
      reading_time: readingTimeFromHtml(html),
      featured: !!body.featured,
      status,
      author_id: admin.id,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id, slug, status")
    .single();

  if (error) {
    return Response.json(
      { error: "insert_failed", message: error.message },
      { status: 500 }
    );
  }

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL || "";
  return Response.json(
    {
      ok: true,
      id: created.id,
      slug: created.slug,
      status: created.status,
      url: `${siteBase}/blog/${created.slug}`,
      admin_url: `${siteBase}/admin/posts/${created.id}`,
      note:
        status === "draft"
          ? "Saved as a draft — review and publish it from the admin panel."
          : "Published live.",
    },
    { status: 201 }
  );
}
