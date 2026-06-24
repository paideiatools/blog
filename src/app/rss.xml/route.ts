import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/utils";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const base = siteUrl();
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("title, slug, excerpt, published_at")
    .eq("status", "published")
    .eq("section", "blog")
    .order("published_at", { ascending: false })
    .limit(30);

  const items = (posts ?? [])
    .map(
      (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${base}/blog/${post.slug}</link>
      <guid>${base}/blog/${post.slug}</guid>
      ${post.excerpt ? `<description>${escapeXml(post.excerpt)}</description>` : ""}
      ${post.published_at ? `<pubDate>${new Date(post.published_at).toUTCString()}</pubDate>` : ""}
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Paideias Blog</title>
    <link>${base}</link>
    <description>Insights for qualitative researchers — from the team behind Paideias.</description>
    <language>en</language>
    <managingEditor>hello@paideias.org (Paideias)</managingEditor>
    <webMaster>hello@paideias.org (Paideias)</webMaster>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
