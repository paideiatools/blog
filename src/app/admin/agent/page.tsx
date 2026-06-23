import { readdir } from "fs/promises";
import Link from "next/link";
import { FileText } from "lucide-react";
import AgentApiCard from "@/components/admin/AgentApiCard";

export const metadata = { title: "AI agent posting" };

export default async function AgentPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const agentEndpoint = `${siteUrl}/api/agent/posts`;
  const agentApiKey = process.env.BLOG_AGENT_API_KEY || null;

  let docs: string[] = [];
  try {
    docs = (await readdir(process.cwd()))
      .filter((f) => f.toLowerCase().endsWith(".md"))
      .sort();
  } catch {
    docs = [];
  }

  return (
    <div className="p-6 md:p-10">
      <h1 className="font-serif text-3xl font-bold">AI agent posting</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Let Claude or any AI agent draft posts for you over a simple API. Hand
        the agent the endpoint and key below; its posts arrive as drafts for
        your review.
      </p>

      <AgentApiCard endpoint={agentEndpoint} apiKey={agentApiKey} />

      <section className="mt-8 rounded-2xl border border-line bg-surface p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <FileText size={17} className="text-accent" /> Documentation
        </h2>
        <p className="mt-1 text-sm text-muted">
          Project guides and references (rendered from the repository’s Markdown
          files).
        </p>
        {docs.length ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {docs.map((file) => {
              const slug = file.replace(/\.md$/i, "");
              return (
                <li key={file}>
                  <Link
                    href={`/admin/docs/${slug}`}
                    className="flex items-center gap-2 rounded-xl border border-line bg-paper px-4 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                  >
                    <FileText size={15} className="shrink-0 text-faint" />
                    {file}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-faint">No Markdown docs found.</p>
        )}
      </section>
    </div>
  );
}
