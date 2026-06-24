"use client";

import { useState } from "react";
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
  ShieldCheck,
  KeyRound,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";
import ChangePasswordModal from "@/components/ChangePasswordModal";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
];

export default function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

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
        <Link
          href="/admin/adminship"
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            pathname.startsWith("/admin/adminship")
              ? "bg-white/10 text-white"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          }`}
        >
          <ShieldCheck size={16} className="shrink-0" />
          <span className="hidden md:inline">Adminship</span>
        </Link>

        {/* Profile menu */}
        <div className="relative pt-2">
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute bottom-full left-0 z-20 mb-2 w-52 rounded-xl border border-white/10 bg-ink p-1.5 shadow-2xl">
                <button
                  onClick={() => {
                    setPwOpen(true);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <KeyRound size={15} /> Change password
                </button>
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </>
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex w-full items-center gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-dark">
              {initials(adminName)}
            </span>
            <span className="hidden flex-1 truncate text-left text-xs text-white/60 md:inline">
              {adminName}
            </span>
            <ChevronDown
              size={14}
              className={`hidden shrink-0 text-white/40 transition-transform md:block ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </aside>
  );
}
