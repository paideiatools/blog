import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/utils";
import GrantAdminForm from "@/components/admin/GrantAdminForm";

export const metadata = { title: "Adminship" };

export default async function AdminshipPage() {
  const supabase = await createClient();
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "admin")
    .order("created_at");

  return (
    <div className="p-6 md:p-10">
      <h1 className="font-serif text-3xl font-bold">Adminship</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Give someone admin access by email. If they already have an account
        they’re promoted immediately; otherwise they’re invited and become an
        admin as soon as they sign up.
      </p>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <ShieldCheck size={17} className="text-accent" /> Grant admin access
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          They’ll get the same powers you have — write, publish, moderate, and
          manage. Only grant this to people you trust.
        </p>
        <GrantAdminForm />
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-semibold">Current admins</h2>
        <ul className="mt-4 divide-y divide-line">
          {(admins ?? []).map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-dark">
                {initials(a.full_name ?? "Admin")}
              </span>
              <span className="text-sm font-medium">
                {a.full_name ?? "Admin"}
              </span>
            </li>
          ))}
          {!admins?.length && (
            <li className="py-3 text-sm text-faint">No admins yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
