"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Subscriber } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    setSubscribers((data as Subscriber[]) ?? []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Remove this subscriber?")) return;
    const supabase = createClient();
    await supabase.from("subscribers").delete().eq("id", id);
    load();
  }

  function exportCsv() {
    const csv = [
      "email,subscribed_at",
      ...subscribers.map((s) => `${s.email},${s.created_at}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paideias-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Subscribers</h1>
          <p className="mt-1 text-sm text-muted">
            {subscribers.length.toLocaleString()} people on the newsletter list.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={subscribers.length === 0}
          className="flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Subscribed</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {subscribers.map((sub) => (
              <tr key={sub.id} className="hover:bg-paper/60">
                <td className="px-5 py-3.5 font-medium">{sub.email}</td>
                <td className="px-5 py-3.5 text-muted">
                  {formatDate(sub.created_at)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => remove(sub.id)}
                    title="Remove"
                    className="rounded-lg p-2 text-faint transition-colors hover:bg-paper hover:text-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {loaded && subscribers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-14 text-center text-faint">
                  No subscribers yet — they&apos;ll appear here as readers join
                  the newsletter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
