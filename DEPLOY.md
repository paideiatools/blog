# Deploying Paideias Blog

A complete, start-to-finish guide to getting this blog live on **Vercel** with a
**Supabase** backend. Roughly 20–30 minutes end to end.

The stack: Next.js 16 (App Router) on Vercel · Supabase (Postgres + Auth +
Storage) · Resend for transactional email.

---

## What you'll set up

1. A Supabase project (database, auth, storage) — one SQL script does all of it.
2. Email sending via Resend (for admin invites + password resets).
3. The app on Vercel, wired to Supabase with environment variables.
4. Your first admin account.

You'll need: a [Supabase](https://supabase.com) account, a [Vercel](https://vercel.com)
account, and a [Resend](https://resend.com) account (free tiers are fine).

---

## Part A — Supabase

### A1. Create the project

Supabase Dashboard → **New project**. Pick a name, a strong **database password**
(save it), and the region closest to your readers. Wait for it to finish
provisioning.

### A2. Create the database (one script)

Open **SQL Editor → New query**, paste the entire contents of
[`supabase/setup.sql`](supabase/setup.sql), and click **Run**.

This creates everything in one shot — tables (`profiles`, `posts`, `comments`,
`post_likes`, `subscribers`, `categories`, `admin_invites`), all Row-Level
Security policies, the signup trigger, the view counter, the **`blog-media`
storage bucket**, and 5 seed categories. You should see "Success. No rows
returned."

> Already ran the individual migrations from `supabase/migrations/`? Skip this —
> `setup.sql` is just those consolidated.

### A3. Configure email (Resend SMTP)

Invite emails (Adminship) and password resets need an SMTP sender.

1. In **Resend**, create an API key, and under **Domains** add + verify your
   sending domain (e.g. `paideias.org`) by adding the DNS records it shows. Until
   the domain is verified, Resend only delivers to your own account email.
2. In Supabase → **Authentication → Emails → SMTP Settings**, enable custom SMTP:

   | Field | Value |
   | --- | --- |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | your Resend API key (`re_…`) |
   | Sender email | `hello@paideias.org` (an address on your verified domain) |
   | Sender name | `Paideias` |

### A4. Set the auth URLs

Supabase → **Authentication → URL Configuration**:

- **Site URL** → your production site URL (set after Vercel gives you a domain in
  Part B; you'll come back to this).
- **Redirect URLs** → add `https://YOUR-DOMAIN/**`.

This makes password-reset and invite links point at your live site.

### A5. Copy your API keys

Supabase → **Project Settings → API**. You'll need three values for Vercel:

- **Project URL** (e.g. `https://abcd1234.supabase.co`)
- **anon** public key
- **service_role** secret key (server-only — never expose this in the browser)

---

## Part B — Vercel

### B1. The repo is already on GitHub

This project lives at `github.com/paideiatools/blog`. If you're starting from a
fork or a new repo, push it first:

```bash
git remote add origin https://github.com/<you>/blog.git
git push -u origin main
```

### B2. Import into Vercel

[vercel.com/new](https://vercel.com/new) → **Import** the repo. Vercel detects
Next.js automatically — leave the build settings at their defaults.

### B3. Environment variables

In the import screen (or Project → **Settings → Environment Variables**), add:

| Variable | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | your Project URL | from A5 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key | from A5 |
| `SUPABASE_SERVICE_ROLE_KEY` | your service_role key | from A5 · **secret, server-only** |
| `NEXT_PUBLIC_SITE_URL` | `https://YOUR-DOMAIN` | the Vercel URL (placeholder for now) |
| `UNSPLASH_ACCESS_KEY` | your Unsplash Access Key | for in-editor photo search ([create one](https://unsplash.com/oauth/applications)) |
| `BLOG_AGENT_API_KEY` | a random secret token | the bearer token for the AI posting API |

Generate the agent token with:

```bash
node -e "console.log('pdb_' + require('crypto').randomBytes(24).toString('hex'))"
```

> SMTP credentials do **not** go here — those live in Supabase (Part A3).

### B4. Deploy, then fix the site URL

Click **Deploy**. When it finishes, Vercel gives you a domain (e.g.
`paideias-blog.vercel.app`). Now:

1. Set `NEXT_PUBLIC_SITE_URL` to that exact URL and **redeploy** (Deployments →
   ⋯ → Redeploy) so OG tags, RSS, sitemap, and the agent API return correct URLs.
2. Go back to Supabase → Authentication → URL Configuration and set **Site URL**
   (and a redirect URL) to that domain (Part A4).

Adding a custom domain later? Update both `NEXT_PUBLIC_SITE_URL` and the Supabase
Site URL to the custom domain and redeploy.

---

## Part C — Go live

### C1. Become the first admin

Visit `https://YOUR-DOMAIN/login` → **Create an account** with the bootstrap
email **`sahariar99@gmail.com`**. The signup trigger grants it the admin role
automatically — you'll land in `/admin`.

> Want a different bootstrap email? Change it in `supabase/setup.sql` (the
> `handle_new_user` function) before running A2, or just promote yourself later
> from another admin via Adminship.

### C2. Add more admins

Admin → **Adminship** → enter an email → **Make admin**. Existing users are
promoted instantly; new emails get an invite and become admin on signup.

### C3. Post with AI (optional)

Any agent (Claude, a script, an automation) can publish via the API using your
`BLOG_AGENT_API_KEY`:

```bash
curl -X POST https://YOUR-DOMAIN/api/agent/posts \
  -H "Authorization: Bearer $BLOG_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","body_markdown":"## Hi\n\nFrom an agent.","status":"draft"}'
```

Full format (designed covers, stickers, shapes, etc.) is in
[`AGENT_API.md`](AGENT_API.md).

---

## Local development

Everything runs against a **local Supabase stack** — production data is never
touched.

```bash
supabase start   # local Postgres/auth/storage (Docker), ports 54341-54349
npm run dev      # → http://localhost:3000
```

- Local Studio (database UI): http://127.0.0.1:54343
- Local emails (when SMTP is off): http://127.0.0.1:54344 (Mailpit)
- `.env.local` points at the local stack.
- Local admin: `sahariar99@gmail.com` / `paideias-local`
- Stop with `supabase stop` (data persists between restarts).

> SMTP is configured in `supabase/config.toml`; `SMTP_PASSWORD` must be in your
> shell env when you run `supabase start` (it's in `.env.local` — `export` it).

### Schema changes

Add a timestamped `.sql` file to `supabase/migrations/`. It applies locally on
the next `supabase start` (or `supabase db reset`). To apply migrations to
production:

```bash
supabase link --project-ref <YOUR-PROJECT-REF>
supabase db push
```

(Or paste the new migration into the Supabase SQL Editor.) Keep `setup.sql` in
sync when you add columns.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Build fails on Vercel | Run `npm run build` locally to reproduce; check Node version (Next 16 needs Node 18.18+). |
| Posts/admin pages empty | Confirm `setup.sql` ran and the three Supabase env vars are set in Vercel. |
| Login works but no admin | You signed up with a non-bootstrap email — promote yourself via Adminship from the bootstrap admin. |
| Invite / reset emails don't arrive | SMTP not set (A3) or the Resend domain isn't verified — check Resend → Logs. |
| Cover photos / uploads 404 | The `blog-media` bucket is created by `setup.sql`; re-run it if missing. |
| Agent API returns 401 | `BLOG_AGENT_API_KEY` mismatch between your request and Vercel. |
| OG/RSS show `localhost` | `NEXT_PUBLIC_SITE_URL` not updated to the real domain — set it and redeploy. |
