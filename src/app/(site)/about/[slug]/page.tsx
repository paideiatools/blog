import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPostBySlug } from "@/lib/posts";
import ArticleView from "@/components/public/ArticleView";

async function getDoc(slug: string) {
  return getPostBySlug(slug, "docs");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDoc(slug);
  if (!doc) return {};

  const title = doc.meta_title || doc.title;
  const description = doc.meta_description || doc.excerpt || undefined;

  return {
    title,
    description,
    alternates: { canonical: `/about/${doc.slug}` },
  };
}

export default async function AboutDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await getDoc(slug);
  if (!doc) notFound();

  return (
    <article className="px-5 py-14 md:py-20">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/about"
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-accent"
        >
          <ArrowLeft size={15} /> About Paideias
        </Link>
      </div>

      <div className="mt-8">
        <ArticleView post={doc} showStats={false} categoryHref="/about" />
      </div>

      <div className="mx-auto mt-16 max-w-2xl rounded-2xl bg-paper p-8 text-center ring-1 ring-line">
        <p className="font-serif text-xl font-medium">
          Ready to try Paideias?
        </p>
        <a
          href="https://paideias.org"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-dark"
        >
          Try it free
        </a>
      </div>
    </article>
  );
}
