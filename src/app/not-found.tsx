import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="font-serif text-7xl font-bold text-accent">404</p>
      <h1 className="mt-4 font-serif text-2xl font-bold">
        This page wandered off
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>
      <Link
        href="/"
        className="mt-7 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent"
      >
        Back to the blog
      </Link>
    </div>
  );
}
