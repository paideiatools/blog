"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Youtube from "@tiptap/extension-youtube";
import { TableKit } from "@tiptap/extension-table";
import {
  ArrowLeft,
  FileUp,
  Settings2,
  X,
  UploadCloud,
  Images,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  cleanWordHtml,
  fileToHtml,
  splitTitleFromHtml,
} from "@/lib/import-doc";
import lowlight from "@/lib/lowlight";
import EditorBubbleMenu from "@/components/admin/editor/EditorBubbleMenu";
import EditorFloatingMenu from "@/components/admin/editor/EditorFloatingMenu";
import CodeBlockSelect from "@/components/admin/editor/CodeBlockSelect";
import ImageBubbleMenu from "@/components/admin/editor/ImageBubbleMenu";
import TableControls from "@/components/admin/editor/TableControls";
import UnsplashPicker, {
  type UnsplashImage,
} from "@/components/admin/editor/UnsplashPicker";
import CoverDesigner from "@/components/admin/editor/CoverDesigner";
import type { CoverLayer } from "@/lib/types";
import {
  AnimatedText,
  BlogImage,
  HtmlEmbed,
  classifyPastedUrl,
  vimeoEmbedHtml,
} from "@/components/admin/editor/extensions";
import type { Category, Post } from "@/lib/types";
import {
  excerptFromHtml,
  readingTimeFromHtml,
  slugify,
} from "@/lib/utils";

type SaveState = "idle" | "saving" | "saved" | "error";

function initialContent(post?: Post): JSONContent | string {
  if (!post) return "";
  const json = post.content as JSONContent | null;
  if (json?.type === "doc" && Array.isArray(json.content)) {
    // Older posts stored the title as a leading H1 in the body — strip it now
    // that the title is edited in its own field.
    const [first, ...rest] = json.content;
    if (first?.type === "heading" && first.attrs?.level === 1) {
      return { ...json, content: rest };
    }
    return json;
  }
  return post.content_html ?? "";
}

// Auto-grow a textarea to fit its content.
function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export default function PostEditor({ post }: { post?: Post }) {
  const router = useRouter();
  const isNew = !post;

  const [docTitle, setDocTitle] = useState(post?.title ?? "");
  const [kicker, setKicker] = useState(post?.kicker ?? "");
  const [subtitle, setSubtitle] = useState(post?.subtitle ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [coverUrl, setCoverUrl] = useState(post?.cover_image_url ?? "");
  const [categoryId, setCategoryId] = useState(post?.category_id ?? "");
  const [coverTemplate, setCoverTemplate] = useState(post?.cover_template ?? "");
  const [coverCreditName, setCoverCreditName] = useState(
    post?.cover_credit_name ?? ""
  );
  const [coverCreditLink, setCoverCreditLink] = useState(
    post?.cover_credit_link ?? ""
  );
  const [coverText, setCoverText] = useState(post?.cover_text ?? "");
  const [coverLayers, setCoverLayers] = useState<CoverLayer[]>(
    post?.cover_layers ?? []
  );
  const [tagsInput, setTagsInput] = useState(post?.tags?.join(", ") ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(
    post?.meta_description ?? ""
  );
  const [featured, setFeatured] = useState(post?.featured ?? false);
  const [section, setSection] = useState<Post["section"]>(
    post?.section ?? "blog"
  );
  const [status, setStatus] = useState<Post["status"]>(post?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(post?.published_at ?? null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  // null = closed; otherwise where the picked photo goes.
  const [unsplashMode, setUnsplashMode] = useState<"inline" | "cover" | null>(
    null
  );

  const coverInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const slugTouchedRef = useRef(slugTouched);
  slugTouchedRef.current = slugTouched;

  // Stable handles for paste/drop (editorProps are captured once).
  const pasteImageRef = useRef<(file: File) => void>(() => {});
  const pasteUrlRef = useRef<(text: string) => boolean>(() => false);

  // Forces a re-render on caret moves so the table toolbar shows/hides.
  const [, setSelectionTick] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3] },
        link: { openOnClick: false },
      }),
      BlogImage,
      Typography,
      CharacterCount,
      TextAlign.configure({ types: ["paragraph", "heading"] }),
      AnimatedText,
      HtmlEmbed,
      Youtube.configure({ nocookie: true }),
      TableKit.configure({ table: { resizable: true } }),
      Placeholder.configure({
        placeholder: "Tell your story…",
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockSelect);
        },
      }).configure({ lowlight }),
    ],
    content: initialContent(post),
    editorProps: {
      attributes: { class: "tiptap article-content" },
      // Clean up Word's clipboard HTML so pasted documents come in tidy.
      transformPastedHTML: (html) => cleanWordHtml(html),
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter(
          (f) => f.type.startsWith("image/")
        );
        if (files.length > 0) {
          event.preventDefault();
          files.forEach((f) => pasteImageRef.current(f));
          return true;
        }
        // Pasted image/video URLs become embeds.
        const text = event.clipboardData?.getData("text/plain") ?? "";
        if (text && pasteUrlRef.current(text)) {
          event.preventDefault();
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
          f.type.startsWith("image/")
        );
        if (files.length > 0) {
          event.preventDefault();
          files.forEach((f) => pasteImageRef.current(f));
          return true;
        }
        return false;
      },
    },
    onSelectionUpdate() {
      setSelectionTick((t) => t + 1);
    },
  });

  function onTitleChange(value: string) {
    setDocTitle(value);
    if (!slugTouchedRef.current) setSlug(slugify(value));
  }

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => setCategories((data as Category[]) ?? []));
  }, []);

  async function uploadImage(file: File): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("blog-media")
      .upload(path, file, { cacheControl: "31536000" });
    if (error) {
      setErrorMsg(`Image upload failed: ${error.message}`);
      return null;
    }
    const { data } = supabase.storage.from("blog-media").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onCoverSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (url) {
      setCoverUrl(url);
      setCoverTemplate("");
      setCoverText("");
      setCoverCreditName("");
      setCoverCreditLink("");
    }
  }

  function clearCover() {
    setCoverUrl("");
    setCoverTemplate("");
    setCoverText("");
    setCoverCreditName("");
    setCoverCreditLink("");
    setCoverLayers([]);
  }

  async function onInlineImageSelected(file: File) {
    if (!editor) return;
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }
  pasteImageRef.current = onInlineImageSelected;

  pasteUrlRef.current = (text: string): boolean => {
    if (!editor) return false;
    const parsed = classifyPastedUrl(text);
    if (!parsed) return false;
    if (parsed.kind === "image") {
      editor.chain().focus().setImage({ src: parsed.url }).run();
    } else if (parsed.kind === "youtube") {
      editor.chain().focus().setYoutubeVideo({ src: parsed.url }).run();
    } else {
      editor.chain().focus().setHtmlEmbed(vimeoEmbedHtml(parsed.id)).run();
    }
    return true;
  };

  function onUnsplashSelect(img: UnsplashImage) {
    // Unsplash API guideline: report the download whenever a photo is used.
    fetch("/api/unsplash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloadLocation: img.downloadLocation }),
    }).catch(() => {});

    if (unsplashMode === "cover") {
      setCoverUrl(img.regular);
      setCoverTemplate("");
      setCoverCreditName(img.authorName);
      setCoverCreditLink(img.authorLink);
    } else if (editor) {
      // The credit rides along as node attributes, so it tracks the image's
      // size and alignment when those are changed later.
      editor
        .chain()
        .focus()
        .setImage({
          src: img.regular,
          alt: img.alt,
          align: "center",
          creditName: img.authorName,
          creditLink: img.authorLink,
        } as { src: string })
        .run();
    }
    setUnsplashMode(null);
  }

  async function onImportSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;

    const hasContent = editor.state.doc.textContent.trim().length > 0;
    if (
      hasContent &&
      !confirm(`Replace the current draft with “${file.name}”?`)
    ) {
      return;
    }

    setImporting(true);
    setErrorMsg(null);
    try {
      const html = await fileToHtml(file, uploadImage);
      const fallbackTitle = file.name.replace(/\.[^.]+$/, "");
      const { title, body } = splitTitleFromHtml(html, fallbackTitle);
      editor.commands.setContent(body);
      onTitleChange(title);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Import failed.");
    }
    setImporting(false);
  }

  async function save(nextStatus: Post["status"]) {
    if (!editor) return;
    setErrorMsg(null);

    const title = docTitle.trim();
    if (!title) {
      setErrorMsg("Give your post a title before saving.");
      return;
    }

    setSaveState("saving");
    const supabase = createClient();

    // The title lives in its own field now, so the body HTML is used as-is.
    const html = editor.getHTML();
    const finalSlug =
      (slugTouched && slug ? slugify(slug) : slugify(title)) ||
      `post-${Date.now().toString(36)}`;
    const becomesPublished = nextStatus === "published";
    const finalPublishedAt =
      publishedAt ?? (becomesPublished ? new Date().toISOString() : null);

    const payload = {
      title,
      kicker: kicker.trim() || null,
      subtitle: subtitle.trim() || null,
      slug: finalSlug,
      excerpt: excerpt.trim() || excerptFromHtml(html),
      content: editor.getJSON(),
      content_html: html,
      cover_image_url: coverTemplate ? null : coverUrl || null,
      cover_template: coverTemplate || null,
      cover_text: coverTemplate ? coverText.trim() || null : null,
      cover_layers: coverTemplate && coverLayers.length ? coverLayers : null,
      cover_credit_name: coverTemplate ? null : coverCreditName.trim() || null,
      cover_credit_link: coverTemplate ? null : coverCreditLink.trim() || null,
      category_id: categoryId || null,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean),
      reading_time: readingTimeFromHtml(html),
      meta_title: metaTitle.trim() || null,
      meta_description: metaDescription.trim() || null,
      featured,
      section,
      status: nextStatus,
      published_at: finalPublishedAt,
    };

    if (isNew) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("posts")
        .insert({ ...payload, author_id: user!.id })
        .select("id")
        .single();

      if (error) {
        setSaveState("error");
        setErrorMsg(
          error.code === "23505"
            ? "That URL slug is already taken — change it in Settings."
            : error.message
        );
        return;
      }
      setSaveState("saved");
      setStatus(nextStatus);
      setPublishedAt(finalPublishedAt);
      router.replace(`/admin/posts/${data.id}`);
    } else {
      const { error } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", post.id);

      if (error) {
        setSaveState("error");
        setErrorMsg(
          error.code === "23505"
            ? "That URL slug is already taken — change it in Settings."
            : error.message
        );
        return;
      }
      setSaveState("saved");
      setStatus(nextStatus);
      setPublishedAt(finalPublishedAt);
      setSlug(finalSlug);
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }

  const words = editor?.storage.characterCount.words() ?? 0;

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/posts"
              className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
            >
              <ArrowLeft size={16} /> Posts
            </Link>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                status === "published"
                  ? "bg-accent-soft text-accent-dark"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {status}
            </span>
            <span className="hidden text-xs text-faint sm:inline">
              {words.toLocaleString()} words
            </span>
            {uploading && (
              <span className="flex items-center gap-1 text-xs text-faint">
                <Loader2 size={12} className="animate-spin" /> Uploading…
              </span>
            )}
            {importing && (
              <span className="flex items-center gap-1 text-xs text-faint">
                <Loader2 size={12} className="animate-spin" /> Importing…
              </span>
            )}
            {saveState === "saving" && (
              <span className="flex items-center gap-1 text-xs text-faint">
                <Loader2 size={12} className="animate-spin" /> Saving…
              </span>
            )}
            {saveState === "saved" && (
              <span className="flex items-center gap-1 text-xs text-accent">
                <CheckCircle2 size={12} /> Saved
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
              title="Import a .docx, .md, .html, or .txt document"
              className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              <FileUp size={15} />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <Settings2 size={15} />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={() => save("draft")}
              disabled={saveState === "saving"}
              className="rounded-full border border-line px-3.5 py-2 text-sm font-medium transition-colors hover:border-ink disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              onClick={() => save("published")}
              disabled={saveState === "saving"}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              {status === "published" ? "Update" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mx-auto mt-4 max-w-2xl rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {errorMsg}
        </div>
      )}

      {/* Writing canvas */}
      <div className="mx-auto max-w-2xl px-5 pb-32 pt-10">
        {/* Cover image */}
        {coverTemplate ? (
          <div className="mb-8">
            <CoverDesigner
              template={coverTemplate}
              onTemplateChange={setCoverTemplate}
              title={docTitle}
              label={categories.find((c) => c.id === categoryId)?.name ?? null}
              quote={subtitle || null}
              text={coverText || null}
              layers={coverLayers}
              onChange={setCoverLayers}
              onRemove={clearCover}
            />
          </div>
        ) : coverUrl ? (
          <div className="group relative mb-8 overflow-hidden rounded-2xl">
            <Image
              src={coverUrl}
              alt="Cover"
              width={1200}
              height={675}
              className="w-full object-cover"
            />
            <button
              onClick={clearCover}
              className="absolute right-3 top-3 rounded-full bg-ink/70 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
              title="Remove cover"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="mb-8 flex items-center gap-1 rounded-2xl border border-dashed border-line p-1.5">
            <span className="px-2.5 text-sm text-faint">Cover</span>
            <button
              onClick={() => setCoverTemplate("generative:midnight")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-muted transition-colors hover:bg-paper hover:text-accent"
            >
              <Sparkles size={16} /> Design
            </button>
            <button
              onClick={() => setUnsplashMode("cover")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-muted transition-colors hover:bg-paper hover:text-accent"
            >
              <Images size={16} /> Unsplash
            </button>
            <button
              onClick={() => coverInputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-muted transition-colors hover:bg-paper hover:text-accent"
            >
              <UploadCloud size={16} /> Upload
            </button>
          </div>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onCoverSelected}
        />
        <input
          ref={importInputRef}
          type="file"
          accept=".docx,.md,.markdown,.html,.htm,.txt"
          className="hidden"
          onChange={onImportSelected}
        />

        {/* Kicker · Title · Subtitle */}
        <input
          value={kicker}
          onChange={(e) => setKicker(e.target.value)}
          placeholder="Kicker (optional)"
          maxLength={60}
          className="block w-full bg-transparent text-xs font-bold uppercase tracking-[0.2em] text-accent outline-none placeholder:font-bold placeholder:text-faint"
        />
        <textarea
          value={docTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          ref={(el) => autoGrow(el)}
          onInput={(e) => autoGrow(e.currentTarget)}
          rows={1}
          placeholder="Title"
          className="mt-2 block w-full resize-none overflow-hidden bg-transparent font-serif text-[40px] font-semibold leading-[1.1] tracking-tight outline-none placeholder:text-faint/50"
        />
        <textarea
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          ref={(el) => autoGrow(el)}
          onInput={(e) => autoGrow(e.currentTarget)}
          rows={1}
          placeholder="Add a subtitle (optional)"
          className="mt-3 block w-full resize-none overflow-hidden bg-transparent text-xl leading-relaxed text-muted outline-none placeholder:text-faint/60"
        />
        <hr className="my-7 border-line" />

        {editor && (
          <>
            <EditorBubbleMenu editor={editor} />
            <ImageBubbleMenu editor={editor} />
            <EditorFloatingMenu
              editor={editor}
              onImageSelected={onInlineImageSelected}
              onSearchPhotos={() => setUnsplashMode("inline")}
            />
          </>
        )}

        <div ref={canvasRef} className="relative">
          <EditorContent editor={editor} />
          {editor && <TableControls editor={editor} canvasRef={canvasRef} />}
        </div>
      </div>

      <UnsplashPicker
        open={unsplashMode !== null}
        onClose={() => setUnsplashMode(null)}
        onSelect={onUnsplashSelect}
      />

      {/* Settings drawer */}
      {settingsOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/30"
            onClick={() => setSettingsOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col overflow-y-auto border-l border-line bg-surface p-6 shadow-2xl fade-in">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold">Post settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg p-2 text-muted hover:bg-paper"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm">
              <label className="block">
                <span className="font-semibold">URL slug</span>
                <div className="mt-1.5 flex items-center rounded-xl border border-line bg-paper px-3">
                  <span className="text-faint">/blog/</span>
                  <input
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugTouched(true);
                    }}
                    className="h-11 w-full bg-transparent pl-0.5 outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="font-semibold">Excerpt</span>
                <span className="ml-2 text-xs text-faint">
                  shown on cards & search results
                </span>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  placeholder="Auto-generated from content if left empty"
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper p-3 outline-none focus:border-accent"
                />
              </label>

              <label className="block">
                <span className="font-semibold">Category</span>
                <select
                  value={categoryId ?? ""}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 outline-none focus:border-accent"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-semibold">Tags</span>
                <span className="ml-2 text-xs text-faint">comma-separated</span>
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="thematic analysis, interviews"
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 outline-none focus:border-accent"
                />
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-line bg-paper p-4">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                <span>
                  <span className="font-semibold">Featured post</span>
                  <span className="block text-xs text-muted">
                    Pinned to the top of the homepage
                  </span>
                </span>
              </label>

              <label className="block">
                <span className="font-semibold">Section</span>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value as Post["section"])}
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 outline-none focus:border-accent"
                >
                  <option value="blog">Blog post — public, listed on /blog</option>
                  <option value="docs">
                    Paideias docs — only under /about, hidden from the blog
                  </option>
                </select>
              </label>

              <div className="border-t border-line pt-5">
                <p className="font-semibold">SEO overrides</p>
                <label className="mt-3 block">
                  <span className="text-xs font-medium text-muted">
                    Meta title ({(metaTitle || docTitle).length}/60)
                  </span>
                  <input
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={docTitle || "Defaults to post title"}
                    className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 outline-none focus:border-accent"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="text-xs font-medium text-muted">
                    Meta description ({(metaDescription || excerpt).length}/160)
                  </span>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={3}
                    placeholder={excerpt || "Defaults to the excerpt"}
                    className="mt-1.5 w-full rounded-xl border border-line bg-paper p-3 outline-none focus:border-accent"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={() => setSettingsOpen(false)}
              className="mt-8 rounded-full bg-ink py-3 text-sm font-semibold text-white transition-colors hover:bg-accent"
            >
              Done
            </button>
          </aside>
        </>
      )}
    </div>
  );
}
