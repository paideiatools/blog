"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Menu,
  X,
  PenLine,
  LogOut,
  Search,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";
import type { Category } from "@/lib/types";
import ThemeToggle from "./ThemeToggle";
import SearchOverlay from "./SearchOverlay";

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [articlesOpen, setArticlesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
          .then(({ data }) => setIsAdmin(data?.role === "admin"));
      }
    });

    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => setCategories((data as Category[]) ?? []));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    setArticlesOpen(false);
  }, [pathname]);

  // ⌘K / Ctrl+K opens search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function openArticles() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setArticlesOpen(true);
  }

  function scheduleCloseArticles() {
    closeTimer.current = setTimeout(() => setArticlesOpen(false), 150);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsAdmin(false);
    window.location.href = "/";
  }

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="font-serif text-2xl font-bold tracking-tight">
            Paideias
          </span>
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Blog
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {/* Articles + categories submenu */}
          <div
            className="relative"
            onMouseEnter={openArticles}
            onMouseLeave={scheduleCloseArticles}
          >
            <Link
              href="/blog"
              aria-expanded={articlesOpen}
              onFocus={openArticles}
              className={`flex items-center gap-1 text-sm font-medium transition-colors duration-200 hover:text-accent ${
                pathname.startsWith("/blog") ? "text-accent" : "text-muted"
              }`}
            >
              Articles
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  articlesOpen ? "rotate-180" : ""
                }`}
              />
            </Link>

            {articlesOpen && (
              <div
                className="ring-card absolute left-1/2 top-full mt-3 w-60 -translate-x-1/2 p-2 fade-in"
                onMouseEnter={openArticles}
                onMouseLeave={scheduleCloseArticles}
              >
                <Link
                  href="/blog"
                  className="block rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-paper/60 hover:text-accent"
                >
                  All articles
                </Link>
                <div className="my-1.5 h-px bg-line" />
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/blog?category=${cat.slug}`}
                    className="block rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-paper/60 hover:text-accent"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/about"
            className={`text-sm font-medium transition-colors duration-200 hover:text-accent ${
              pathname.startsWith("/about") ? "text-accent" : "text-muted"
            }`}
          >
            About Paideias
          </Link>

          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search articles (⌘K)"
            title="Search (⌘K)"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted ring-1 ring-line transition-colors duration-200 hover:text-ink hover:ring-muted"
          >
            <Search size={16} />
          </button>

          <ThemeToggle />

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-on-accent"
                aria-label="Account menu"
              >
                {initials(displayName)}
              </button>
              {userMenuOpen && (
                <div className="ring-card absolute right-0 mt-2 w-48 p-1.5 fade-in">
                  <p className="truncate px-3 py-2 text-xs text-muted">
                    {user.email}
                  </p>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-paper/60 hover:text-accent"
                    >
                      <PenLine size={15} /> Admin panel
                    </Link>
                  )}
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-paper/60"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-muted transition-colors duration-200 hover:text-accent"
            >
              Sign in
            </Link>
          )}

          <a
            href="https://paideias.org"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors duration-200 hover:bg-accent hover:text-on-accent"
          >
            Try Paideias
          </a>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search articles"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted"
          >
            <Search size={18} />
          </button>
          <ThemeToggle />
          <button onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-line bg-surface px-5 py-4 md:hidden fade-in">
          <div className="flex flex-col gap-4">
            <Link href="/blog" className="text-sm font-semibold">
              All articles
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className="pl-3 text-sm text-muted"
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/about" className="text-sm font-medium text-muted">
              About Paideias
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="text-sm font-medium text-accent">
                    Admin panel
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="text-left text-sm font-medium text-muted"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className="text-sm font-medium text-muted">
                Sign in
              </Link>
            )}
            <a
              href="https://paideias.org"
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
            >
              Try Paideias
            </a>
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
