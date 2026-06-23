import type { NextRequest } from "next/server";

// Server-side proxy to the Unsplash API so the access key never ships to the
// browser. Search photos via GET; report a "download" via POST (required by
// the Unsplash API guidelines whenever a photo is actually used).

const UNSPLASH_API = "https://api.unsplash.com";

interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  color: string | null;
  width: number;
  height: number;
  urls: { small: string; regular: string };
  user: { name: string; username: string; links: { html: string } };
  links: { download_location: string };
}

export async function GET(request: NextRequest) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return Response.json({ error: "missing_key" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const page = searchParams.get("page") ?? "1";
  if (!query) {
    return Response.json({ results: [], total: 0, total_pages: 0 });
  }

  const res = await fetch(
    `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(
      query
    )}&per_page=24&page=${page}&content_filter=high&orientation=landscape`,
    {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return Response.json({ error: "unsplash_error" }, { status: res.status });
  }

  const data = (await res.json()) as {
    results: UnsplashPhoto[];
    total: number;
    total_pages: number;
  };

  const results = data.results.map((p) => ({
    id: p.id,
    thumb: p.urls.small,
    regular: p.urls.regular,
    alt: p.alt_description || p.description || query,
    color: p.color,
    width: p.width,
    height: p.height,
    authorName: p.user.name,
    authorLink: p.user.links.html,
    downloadLocation: p.links.download_location,
  }));

  return Response.json({
    results,
    total: data.total,
    total_pages: data.total_pages,
  });
}

export async function POST(request: NextRequest) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return Response.json({ ok: false }, { status: 503 });

  const body = (await request.json().catch(() => null)) as {
    downloadLocation?: string;
  } | null;
  const loc = body?.downloadLocation;

  if (typeof loc === "string" && loc.startsWith(UNSPLASH_API)) {
    // Fire-and-forget download ping (Unsplash attribution requirement).
    await fetch(loc, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    }).catch(() => {});
  }

  return Response.json({ ok: true });
}
