import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { marked } from "marked";

export const metadata = { title: "Docs" };

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Only allow plain filenames — no path traversal.
  if (!/^[A-Za-z0-9._-]+$/.test(slug)) notFound();

  let raw: string;
  try {
    raw = await readFile(path.join(process.cwd(), `${slug}.md`), "utf8");
  } catch {
    notFound();
  }

  const html = marked.parse(raw, { async: false }) as string;

  return (
    <div className="p-6 md:p-10">
      <Link
        href="/admin/agent"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to AI agent posting
      </Link>

      <div className="mt-5 rounded-2xl border border-line bg-surface p-6 md:p-10">
        <p className="mb-6 text-xs font-bold uppercase tracking-wider text-faint">
          {slug}.md
        </p>
        <div
          className="article-content max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
