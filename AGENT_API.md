# Letting AI agents write posts

The blog exposes a small, token-protected HTTP API so an AI agent — Claude,
a scheduled automation, Zapier/Make, a GitHub Action, or your own script — can
draft and publish posts on your behalf.

It's deliberately a plain REST endpoint rather than anything bespoke, because
that's the lowest common denominator every agent platform can call. One
endpoint, one bearer token.

## The endpoint

```
GET  /api/agent/posts                    → context: brand voice, categories, recent titles, full capabilities
GET  /api/agent/posts?image_search=query → search Unsplash for a real, credited cover/inline photo
POST /api/agent/posts                    → create a post
```

Auth: send `Authorization: Bearer <BLOG_AGENT_API_KEY>` on every request.

The plain `GET` response includes a `capabilities` object describing the
cover-design system, animated text, credited images, tables, and video
embeds in enough detail that an agent never has to read this file — it's the
single source of truth the agent actually sees at call time. Keep this file
and the `capabilities` object in the route in sync if you change either.

### Environment

| Variable | Purpose |
| --- | --- |
| `BLOG_AGENT_API_KEY` | The bearer token agents must present. Rotate by changing it. |
| `SUPABASE_SERVICE_ROLE_KEY` | Lets the server insert posts without a user session. **Server-only — never expose.** |
| `NEXT_PUBLIC_SITE_URL` | Used to build the returned post URLs. |

Set all three locally in `.env.local` (already done for local dev) and in
Vercel's Project → Settings → Environment Variables for production.

## The workflow (human-in-the-loop by design)

1. **Read context** — the agent `GET`s the endpoint to learn the brand voice,
   the available `categories` (with slugs), and the 40 most recent post titles
   so it doesn't repeat one.
2. **Write** — the agent composes an original post in Markdown.
3. **Submit** — the agent `POST`s it. **Posts default to `status: "draft"`**, so
   nothing goes live until you review and publish it from the admin panel.
   (An agent may pass `"status": "published"` to skip review — only do this if
   you trust the agent fully.)

## Create a post

`POST /api/agent/posts`

```jsonc
{
  "title": "Coding for saturation without losing the thread",   // required
  "body_markdown": "## Where saturation really comes from\n\n...", // required (or body_html)
  "kicker": "Methodology",          // optional — accent overline above the title
  "subtitle": "A practical test…",  // optional — deck under the title
  "excerpt": "…",                   // optional — auto-derived from content if omitted
  "category": "methodology",        // optional — a slug from GET categories
  "tags": ["coding", "thematic analysis"],
  "cover_image_url": "https://…",   // optional
  "status": "draft"                 // optional — "draft" (default) | "published"
}
```

Response (`201`):

```json
{
  "ok": true,
  "id": "…",
  "slug": "coding-for-saturation-without-losing-the-thread",
  "status": "draft",
  "url": "https://…/blog/…",
  "admin_url": "https://…/admin/posts/…"
}
```

## Search for a real photo (optional)

```bash
curl -s "$SITE/api/agent/posts?image_search=qualitative+coding" \
  -H "Authorization: Bearer $BLOG_AGENT_API_KEY"
```

Returns up to 12 results: `{ id, thumb, regular, alt, color, width, height,
authorName, authorLink, downloadLocation }`. Use `regular` as
`cover_image_url`, and pass `authorName`/`authorLink` as
`cover_credit_name`/`cover_credit_link` on the `POST` — Unsplash requires
attribution. Skip this and use `cover_template` instead for a designed
(non-photo) cover.

## Example: curl

```bash
curl -X POST http://localhost:3000/api/agent/posts \
  -H "Authorization: Bearer $BLOG_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test post","body_markdown":"## Hello\n\nFrom an agent."}'
```

## Example: give this to Claude as a tool

Describe the endpoint to Claude (via the API's tool-use, an MCP wrapper, or
Claude Code) as two actions:

- `get_blog_context()` → `GET /api/agent/posts` — returns voice, categories,
  recent titles.
- `create_blog_post({title, body_markdown, kicker?, subtitle?, category?, tags?, status?})`
  → `POST /api/agent/posts`.

A good agent prompt: *"Call `get_blog_context`. Pick a topic for qualitative
researchers that isn't in `recent_posts`. Draft an 800–1,200 word post in
Markdown with a clear `##`-headed structure, matching the brand voice. Submit
it with `create_blog_post` as a draft, choosing the closest `category` slug."*

Because posts land as drafts, you stay the editor-in-chief: the agent proposes,
you publish.

## Rich content (use `body_html`)

`body_markdown` covers headings, lists, links, code, blockquotes, and tables.
For the full editor toolkit, send `body_html` instead — these all render and
round-trip back into the admin editor:

- **Animated text** (the "marking" effects):
  `<span data-animate="highlight" class="animate-text-highlight">…</span>`
  (also `shimmer` and `glow`).
- **Image with credit** — a figure that keeps its caption when resized/aligned:
  ```html
  <figure data-blog-image data-align="center" class="blog-figure"
          data-credit-name="Jane Doe" data-credit-link="https://unsplash.com/@jane"
          style="display:block;margin:0 auto;width:100%">
    <img src="https://images.unsplash.com/…" alt="…"
         style="display:block;width:100%;height:auto;margin:0">
    <figcaption class="image-credit">Photo by
      <a href="https://unsplash.com/@jane">Jane Doe</a> on
      <a href="https://unsplash.com/">Unsplash</a></figcaption>
  </figure>
  ```
- **Tables** — `<table><tbody><tr><th><p>…</p></th>…</tr>…</tbody></table>`
  (use `<th>` for the header row).
- **Video** — wrap an allow-listed iframe so it renders responsively (16:9):
  ```html
  <div class="video-embed"><iframe src="https://www.youtube.com/embed/VIDEO_ID"
       allowfullscreen></iframe></div>
  ```

## Notes

- Cover: pass a photo via `cover_image_url` (plus optional `cover_credit_name`
  and `cover_credit_link`), OR a designed banner via `cover_template` of the form
  `<style>:<theme>` — styles `generative | badge | monogram | quote`, themes
  `midnight | clay | forest | cream` (e.g. `"generative:forest"`). A template and
  a photo are mutually exclusive. Designed covers complement the title (pattern,
  category, initial, or a pulled quote) rather than repeating it. Optionally add
  positioned layers with `cover_layers`: an array of
  `{ kind, text, x, y, size, width, color, font, weight, align }`. `kind` is
  `text` (editable text), `sticker` (a decorative glyph/emoji in `text`, e.g.
  "✦"), or `shape` (a geometric shape id in `text`: `circle|ring|square|rounded|
  triangle|diamond|bar`). `x`/`y` are center %, `size`/`width` are % of the cover
  width, `color` is `fg|accent|light|dark`, `font` is `sans|serif`. Mix text +
  stickers + shapes to design a cool, custom cover card for the post. Optionally set
  `cover_text` to put custom words on the card (independent of title/subtitle);
  if omitted it falls back to the subtitle/category.
- Content may be `body_markdown` (converted server-side) or `body_html`. Both are
  sanitized: `<script>`, `<object>`, `<embed>`, inline event handlers, and
  `javascript:` URLs are stripped. `<iframe>` survives **only** for allow-listed
  video hosts (`youtube.com`, `youtube-nocookie.com`, `player.vimeo.com`).
- Slugs are generated from the title and de-duplicated automatically.
- Every agent post is attributed to the first admin profile, but the byline is
  hidden on the public site, so readers just see the date and reading time.
