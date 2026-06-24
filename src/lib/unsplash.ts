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

export type UnsplashResult = {
  id: string;
  thumb: string;
  regular: string;
  alt: string;
  color: string | null;
  width: number;
  height: number;
  authorName: string;
  authorLink: string;
  downloadLocation: string;
};

// Shared by the in-editor photo picker (/api/unsplash) and the AI agent
// posting API (/api/agent/posts) so both pick real, credited photos instead
// of guessing image URLs.
export async function searchUnsplash(
  query: string,
  page = 1,
  perPage = 24
): Promise<{ results: UnsplashResult[]; total: number; total_pages: number } | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || !query.trim()) return null;

  const res = await fetch(
    `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(
      query
    )}&per_page=${perPage}&page=${page}&content_filter=high&orientation=landscape`,
    {
      headers: { Authorization: `Client-ID ${accessKey}`, "Accept-Version": "v1" },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;

  const data = (await res.json()) as {
    results: UnsplashPhoto[];
    total: number;
    total_pages: number;
  };

  return {
    results: data.results.map((p) => ({
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
    })),
    total: data.total,
    total_pages: data.total_pages,
  };
}
