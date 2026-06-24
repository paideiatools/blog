import type { NextRequest } from "next/server";
import { marked } from "marked";
import { createAdminClient } from "@/lib/supabase/admin";
import { excerptFromHtml, readingTimeFromHtml, slugify } from "@/lib/utils";
import { searchUnsplash } from "@/lib/unsplash";
import type { CoverLayer } from "@/lib/types";

function sanitizeLayers(input: unknown): CoverLayer[] | null {
  if (!Array.isArray(input)) return null;
  const colors = ["fg", "accent", "light", "dark"];
  const aligns = ["left", "center", "right"];
  const fonts = ["sans", "serif"];
  const num = (v: unknown, d: number, lo: number, hi: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
  };
  const out = input
    .slice(0, 12)
    .map((raw) => {
      const l = (raw ?? {}) as Record<string, unknown>;
      return {
        id:
          typeof l.id === "string"
            ? l.id.slice(0, 12)
            : Math.random().toString(36).slice(2, 9),
        kind:
          l.kind === "sticker"
            ? "sticker"
            : l.kind === "shape"
              ? "shape"
              : "text",
        text: String(l.text ?? "").slice(0, 200),
        x: num(l.x, 50, 0, 100),
        y: num(l.y, 50, 0, 100),
        size: num(l.size, 8, 3, 30),
        width: num(l.width, 72, 5, 100),
        color: colors.includes(l.color as string)
          ? (l.color as CoverLayer["color"])
          : "fg",
        font: fonts.includes(l.font as string)
          ? (l.font as CoverLayer["font"])
          : "sans",
        weight: Number(l.weight) >= 700 ? 700 : 400,
        align: aligns.includes(l.align as string)
          ? (l.align as CoverLayer["align"])
          : "center",
      } as CoverLayer;
    })
    .filter((l) => l.text);
  return out.length ? out : null;
}

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

// GET ?image_search=<query> reuses the same bearer token to search Unsplash,
// so an agent can pick a real, credited photo instead of guessing a URL.
async function handleImageSearch(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("image_search")?.trim() ?? "";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const data = await searchUnsplash(query, page, 12);
  if (!data) {
    return Response.json(
      { error: "image_search_unavailable", message: "Set UNSPLASH_ACCESS_KEY and pass a non-empty 'image_search' query." },
      { status: 503 }
    );
  }
  return Response.json({
    results: data.results,
    usage:
      "Pick a result and pass its `regular` URL as cover_image_url, plus cover_credit_name (authorName) and cover_credit_link (authorLink) on POST — Unsplash requires attribution.",
  });
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return unauthorized();

  if (new URL(request.url).searchParams.has("image_search")) {
    return handleImageSearch(request);
  }

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
      "Write an original post that doesn't duplicate a recent title. Then POST to this same URL with the Bearer token and a JSON body: { title (required), body_markdown (required), kicker?, subtitle?, excerpt?, category? (a slug from `categories`), tags?: string[], status?: 'draft'|'published', ...cover fields, see `capabilities.cover` }. Posts default to 'draft' so a human can review before publishing. Use `capabilities` below to make full use of the blog's design system — don't just write plain text when a cover, an image, a highlighted phrase, or a table would make the post better.",
    capabilities: {
      cover: {
        summary:
          "Every post needs ONE cover, chosen one of two ways — pick whichever fits the topic:",
        designed: {
          how: "Set cover_template to '<style>:<theme>' (e.g. 'generative:forest'). styles: generative|badge|monogram|quote. themes: midnight|clay|forest|cream.",
          layers:
            "Optionally add cover_layers: an array of { kind, text, x, y, size, width, color, font, weight, align }. kind is 'text' (editable words), 'sticker' (an emoji/glyph in `text`, e.g. '✦'), or 'shape' (one of circle|ring|square|rounded|triangle|diamond|bar, in `text`). x/y are center % (0-100), size/width are % of cover width, color is fg|accent|light|dark, font is sans|serif. Mix 2-4 layers for a custom designed card — a short overline word, a sticker, an accent shape.",
          cover_text:
            "Optional cover_text sets the card's main words independent of the title/subtitle.",
        },
        photo: {
          how: "Real photo instead of a designed card: GET this same URL with ?image_search=<query> (same bearer token) to search Unsplash. Pick a result, then on POST send cover_image_url = result.regular, cover_credit_name = result.authorName, cover_credit_link = result.authorLink.",
        },
        rule: "cover_template and cover_image_url are mutually exclusive — pick one per post.",
      },
      rich_body_html: {
        summary:
          "For more than plain markdown, send body_html instead of body_markdown — all of this round-trips into the editor:",
        animated_text:
          "Wrap a key phrase to draw the eye: <span data-animate=\"highlight\" class=\"animate-text-highlight\">phrase</span> (also 'shimmer', 'glow'). Use sparingly — one or two phrases per post, on the sentence that matters most.",
        credited_image:
          "Inline photo with a hover credit: <figure data-blog-image data-align=\"center\" class=\"blog-figure\" data-credit-name=\"Jane Doe\" data-credit-link=\"https://unsplash.com/@jane\" style=\"display:block;margin:0 auto;width:100%\"><img src=\"...\" alt=\"...\" style=\"display:block;width:100%;height:auto;margin:0\"><figcaption class=\"image-credit\">Photo by <a href=\"...\">Jane Doe</a> on <a href=\"https://unsplash.com/\">Unsplash</a></figcaption></figure>. Get a real photo + credit via ?image_search above.",
        tables: "<table><tbody><tr><th><p>...</p></th>...</tr>...</tbody></table> (use <th> for the header row) — good for comparisons.",
        video: "<div class=\"video-embed\"><iframe src=\"https://www.youtube.com/embed/VIDEO_ID\" allowfullscreen></iframe></div> — only youtube.com, youtube-nocookie.com, player.vimeo.com survive sanitization.",
      },
      guidance:
        "Use these deliberately, not on every post: a designed cover or a real photo always (pick the one that fits the topic), one highlighted phrase on posts with a single strong takeaway, a table when comparing 2+ things, a video only if directly relevant. Don't decorate for its own sake — match the brand voice (thoughtful, concrete, never hype).",
    },
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
  cover_template?: string;
  cover_text?: string;
  cover_layers?: unknown;
  cover_credit_name?: string;
  cover_credit_link?: string;
  featured?: boolean;
  status?: "draft" | "published";
}

const COVER_STYLES = ["generative", "badge", "monogram", "quote"];
const COVER_THEMES = ["midnight", "clay", "forest", "cream"];

// Accepts "<style>:<theme>" (e.g. "generative:forest"); a bare style defaults
// to the midnight theme. Returns null for anything invalid.
function normalizeCoverTemplate(value: string | undefined): string | null {
  const t = value?.trim();
  if (!t) return null;
  const [style, theme] = t.split(":");
  if (!COVER_STYLES.includes(style)) return null;
  return `${style}:${COVER_THEMES.includes(theme) ? theme : "midnight"}`;
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
  const coverTemplate = normalizeCoverTemplate(body.cover_template);

  const { data: created, error } = await supabase
    .from("posts")
    .insert({
      title,
      kicker: body.kicker?.trim() || null,
      subtitle: body.subtitle?.trim() || null,
      slug,
      excerpt: body.excerpt?.trim() || excerptFromHtml(html),
      content_html: html,
      cover_image_url: coverTemplate ? null : body.cover_image_url?.trim() || null,
      cover_template: coverTemplate,
      cover_text: coverTemplate ? body.cover_text?.trim() || null : null,
      cover_layers: coverTemplate ? sanitizeLayers(body.cover_layers) : null,
      cover_credit_name: coverTemplate
        ? null
        : body.cover_credit_name?.trim() || null,
      cover_credit_link: coverTemplate
        ? null
        : body.cover_credit_link?.trim() || null,
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
