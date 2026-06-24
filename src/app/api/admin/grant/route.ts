import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Grant admin to an email. Promotes an existing user, or allowlists + invites a
// not-yet-registered one. Only callable by a signed-in admin.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
  } | null;
  const email = (body?.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Look for an existing account with this email.
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find(
    (u) => u.email?.toLowerCase() === email
  );

  if (existing) {
    const { error } = await admin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", existing.id);
    if (error) {
      return Response.json(
        { error: "update_failed", message: error.message },
        { status: 500 }
      );
    }
    return Response.json({
      ok: true,
      status: "promoted",
      message: `${email} is now an admin.`,
    });
  }

  // Not registered yet — allowlist so signup grants admin, then invite.
  await admin.from("admin_invites").upsert({ email, invited_by: user.id });
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${site}/reset-password`,
  });

  return Response.json({
    ok: true,
    status: inviteErr ? "allowlisted" : "invited",
    message: inviteErr
      ? `${email} will become an admin as soon as they sign up.`
      : `Invite sent to ${email}. They'll be an admin once they set a password.`,
  });
}
