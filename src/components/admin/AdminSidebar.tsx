"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Mail,
  ExternalLink,
  LogOut,
  PenLine,
  Bot,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
];

export default function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-white/10 bg-ink text-white md:w-60">
      <div className="flex items-center gap-2 px-3 py-5 md:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent font-serif text-lg font-bold">
          P
        </span>
        <div className="hidden md:block">
          <p className="font-serif text-base font-bold leading-tight">
            Paideias
          </p>
          <p className="text-[11px] uppercase tracking-wider text-white/50">
            Admin panel
          </p>
        </div>
      </div>

      <Link
        href="/admin/posts/new"
        className="mx-3 mb-4 flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold transition-colors hover:bg-accent-dark md:mx-5"
      >
        <PenLine size={16} />
        <span className="hidden md:inline">New post</span>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={17} className="shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={16} className="shrink-0" />
          <span className="hidden md:inline">View site</span>
        </Link>
        <Link
          href="/admin/agent"
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            pathname.startsWith("/admin/agent")
              ? "bg-white/10 text-white"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Bot size={16} className="shrink-0" />
          <span className="hidden md:inline">AI agent posting</span>
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={16} className="shrink-0" />
          <span className="hidden md:inline">Sign out</span>
        </button>
        <div className="flex items-center gap-2 px-3 pt-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-dark">
            {initials(adminName)}
          </span>
          <span className="hidden truncate text-xs text-white/50 md:inline">
            {adminName}
          </span>
        </div>
      </div>
    </aside>
  );
}
