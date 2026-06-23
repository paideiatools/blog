import Link from "next/link";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-serif text-xl font-bold">
              Paideias <span className="text-accent">Blog</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              A community for qualitative researchers — methodology, analysis,
              and stories from the field, by the team behind Paideias.
            </p>
            <a
              href="mailto:hello@paideias.org"
              className="mt-4 inline-block text-sm font-medium text-muted hover:text-accent"
            >
              hello@paideias.org
            </a>
          </div>

          <div className="text-sm">
            <p className="font-semibold">Explore</p>
            <ul className="mt-3 space-y-2 text-muted">
              <li>
                <Link href="/blog" className="hover:text-accent">
                  All articles
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-accent">
                  About Paideias
                </Link>
              </li>
              <li>
                <a
                  href="https://paideias.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent"
                >
                  The Paideias app
                </a>
              </li>
              <li>
                <Link href="/rss.xml" className="hover:text-accent">
                  RSS feed
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Stay in the loop</p>
            <p className="mb-3 mt-1 text-sm text-muted">
              New articles on qualitative research, straight to your inbox.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <p className="mt-12 border-t border-line pt-6 text-xs text-faint">
          © {new Date().getFullYear()} Paideias. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
