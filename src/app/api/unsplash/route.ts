import type { NextRequest } from "next/server";
import { searchUnsplash } from "@/lib/unsplash";

// Server-side proxy to the Unsplash API so the access key never ships to the
// browser. Search photos via GET; report a "download" via POST (required by
// the Unsplash API guidelines whenever a photo is actually used).

const UNSPLASH_API = "https://api.unsplash.com";

export async function GET(request: NextRequest) {
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    return Response.json({ error: "missing_key" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const page = Number(searchParams.get("page") ?? "1") || 1;
  if (!query) {
    return Response.json({ results: [], total: 0, total_pages: 0 });
  }

  const data = await searchUnsplash(query, page);
  if (!data) {
    return Response.json({ error: "unsplash_error" }, { status: 502 });
  }
  return Response.json(data);
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
