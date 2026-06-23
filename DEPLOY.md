# Paideias Blog — Development & Deployment

## Daily development (LOCAL database)

Everything runs against the **local Supabase stack** — your production data is never touched.

```bash
supabase start   # local Postgres/auth/storage (Docker), ports 54341-54349
npm run dev      # → http://localhost:3000
```

- Local Studio (database UI): http://127.0.0.1:54343
- Local emails (confirmations etc.): http://127.0.0.1:54344
- `.env.local` already points at the local stack.

**Local admin login:** `sahariar99@gmail.com` / `paideias-local`
(already created; any new signup with that email also becomes admin automatically)

Stop the stack with `supabase stop` (data persists between restarts).

## Schema changes

Add SQL files to `supabase/migrations/` — they apply to the local database on
`supabase start` (or `supabase db reset` to reapply from scratch).

To push migrations to the production database when deploying:

```bash
supabase link --project-ref puijdcwcfniebdiobxyg
supabase db push
```

(The two existing migrations are already applied to production.)

## Deploying to Vercel (PRODUCTION database)

1. Push to GitHub:
   ```bash
   git init && git add . && git commit -m "Paideias blog"
   gh repo create paideias-blog --private --push --source=.
   ```
2. Import the repo at https://vercel.com/new (Next.js auto-detected).
3. Set environment variables in Vercel → Project → Settings → Environment Variables:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://puijdcwcfniebdiobxyg.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production anon key (commented in `.env.local`) |
   | `NEXT_PUBLIC_SITE_URL` | your production domain (update after first deploy) |

4. In Supabase dashboard → Authentication → URL Configuration:
   - **Site URL**: your Vercel domain
   - **Redirect URLs**: `https://<your-domain>/auth/callback`

5. First production admin: sign up at `/login` with **sahariar99@gmail.com** —
   the trigger grants the admin role automatically. Then open `/admin`.

## Features recap

- Public: home, articles + category filter, article page (likes, share, comments
  — **guests can comment with just a name**, no account needed), about, RSS,
  sitemap, JSON-LD.
- Admin: dashboard stats, Medium-style editor (ported from
  [vincent0426/meditor](https://github.com/vincent0426/meditor), MIT) with
  bubble menu, plus-button floating menu, image uploads to Supabase storage,
  syntax-highlighted code blocks; post management; comment moderation;
  newsletter subscribers + CSV export.
