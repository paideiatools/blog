"use client";

import { Mark, Node, mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { Code2, PenLine } from "lucide-react";

export const TEXT_EFFECTS = ["shimmer", "highlight", "glow"] as const;
export type TextEffect = (typeof TEXT_EFFECTS)[number];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    htmlEmbed: {
      setHtmlEmbed: (html: string) => ReturnType;
    };
    animatedText: {
      setTextAnimation: (effect: TextEffect) => ReturnType;
      unsetTextAnimation: () => ReturnType;
    };
  }
}

/* ---------- Animated text mark (rendered as CSS animation on the blog) ---------- */

export const AnimatedText = Mark.create({
  name: "animatedText",

  addAttributes() {
    return {
      effect: { default: "shimmer" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-animate]",
        getAttrs: (el) => ({
          effect: (el as HTMLElement).getAttribute("data-animate"),
        }),
      },
    ];
  },

  renderHTML({ mark }) {
    return [
      "span",
      {
        "data-animate": mark.attrs.effect,
        class: `animate-text-${mark.attrs.effect}`,
      },
      0,
    ];
  },

  addCommands() {
    return {
      setTextAnimation:
        (effect) =>
        ({ commands }) =>
          commands.setMark(this.name, { effect }),
      unsetTextAnimation:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

/* ---------- Image with alignment + width controls ---------- */

const UTM = "?utm_source=paideias_blog&utm_medium=referral";

export const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) =>
          (el.closest("figure") as HTMLElement | null)?.style.width ||
          el.style.width ||
          null,
      },
      align: {
        default: "center",
        parseHTML: (el) =>
          (el.closest("figure") as HTMLElement | null)?.getAttribute(
            "data-align"
          ) ||
          el.getAttribute("data-align") ||
          "center",
      },
      // Photo credit (e.g. from Unsplash). Lives on the node so the caption
      // moves, resizes, and re-aligns together with the image.
      creditName: {
        default: null,
        parseHTML: (el) =>
          (el.closest("figure") as HTMLElement | null)?.getAttribute(
            "data-credit-name"
          ) || null,
      },
      creditLink: {
        default: null,
        parseHTML: (el) =>
          (el.closest("figure") as HTMLElement | null)?.getAttribute(
            "data-credit-link"
          ) || null,
      },
    };
  },

  // Parse our own <figure> wrapper as well as bare <img> (paste / import).
  parseHTML() {
    return [{ tag: "figure[data-blog-image] img" }, { tag: "img[src]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { width, align, creditName, creditLink } = node.attrs;
    const margins =
      align === "left"
        ? "margin-right: auto; margin-left: 0;"
        : align === "right"
          ? "margin-left: auto; margin-right: 0;"
          : "margin-left: auto; margin-right: auto;";
    const figureStyle = `display: block; ${margins} width: ${width || "100%"};`;

    const img = [
      "img",
      mergeAttributes(HTMLAttributes, {
        style: "display: block; width: 100%; height: auto; margin: 0;",
      }),
    ];

    const figureAttrs: Record<string, string> = {
      "data-blog-image": "",
      "data-align": align,
      class: "blog-figure",
      style: figureStyle,
    };
    if (creditName) figureAttrs["data-credit-name"] = creditName;
    if (creditLink) figureAttrs["data-credit-link"] = creditLink;

    if (!creditName) {
      return ["figure", figureAttrs, img];
    }

    const caption = creditLink
      ? [
          "figcaption",
          { class: "image-credit" },
          "Photo by ",
          [
            "a",
            {
              href: `${creditLink}${UTM}`,
              target: "_blank",
              rel: "noopener noreferrer",
            },
            creditName,
          ],
          " on ",
          [
            "a",
            {
              href: `https://unsplash.com/${UTM}`,
              target: "_blank",
              rel: "noopener noreferrer",
            },
            "Unsplash",
          ],
        ]
      : ["figcaption", { class: "image-credit" }, creditName];

    return ["figure", figureAttrs, img, caption];
  },
});

/* ---------- Raw HTML embed block ---------- */

function HtmlEmbedView({ node, updateAttributes }: NodeViewProps) {
  function edit() {
    const next = window.prompt("Edit embedded HTML:", node.attrs.html as string);
    if (next !== null) updateAttributes({ html: next });
  }

  return (
    <NodeViewWrapper className="html-embed group relative my-4">
      <div
        className="overflow-hidden rounded-xl border border-dashed border-line p-3"
        contentEditable={false}
        dangerouslySetInnerHTML={{ __html: node.attrs.html as string }}
      />
      <button
        type="button"
        onClick={edit}
        contentEditable={false}
        className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-paper opacity-0 transition-opacity group-hover:opacity-100"
      >
        <PenLine size={11} /> Edit HTML
      </button>
      <span
        contentEditable={false}
        className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-faint opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Code2 size={10} /> html
      </span>
    </NodeViewWrapper>
  );
}

export const HtmlEmbed = Node.create({
  name: "htmlEmbed",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      html: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-html-embed]",
        getAttrs: (el) => ({ html: (el as HTMLElement).innerHTML }),
      },
    ];
  },

  renderHTML({ node }) {
    // Serialize the raw HTML as real children so the public page renders it.
    // Only runs in the browser (admin editor), so `document` is available.
    const container = document.createElement("div");
    container.setAttribute("data-html-embed", "");
    container.innerHTML = node.attrs.html as string;
    return container;
  },

  addCommands() {
    return {
      setHtmlEmbed:
        (html) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { html } }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(HtmlEmbedView);
  },
});

/* ---------- Paste helpers ---------- */

const IMAGE_URL_RE =
  /^https?:\/\/\S+\.(?:png|jpe?g|gif|webp|avif|svg)(?:\?\S*)?$/i;

const YOUTUBE_RE =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]{6,}/i;

const VIMEO_RE = /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i;

export function classifyPastedUrl(
  text: string
):
  | { kind: "image"; url: string }
  | { kind: "youtube"; url: string }
  | { kind: "vimeo"; id: string }
  | null {
  const url = text.trim();
  if (/\s/.test(url)) return null;
  if (IMAGE_URL_RE.test(url)) return { kind: "image", url };
  if (YOUTUBE_RE.test(url)) return { kind: "youtube", url };
  const vimeo = url.match(VIMEO_RE);
  if (vimeo) return { kind: "vimeo", id: vimeo[1] };
  return null;
}

export function vimeoEmbedHtml(id: string): string {
  return `<div class="video-embed"><iframe src="https://player.vimeo.com/video/${id}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
}
