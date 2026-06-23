"use client";

// Ported from vincent0426/meditor (MIT), adapted to Tiptap v3.
// The framer-motion animations were replaced with CSS transitions, and the
// base64 image handling with a Supabase storage upload callback.
import type { Editor } from "@tiptap/core";
import { FloatingMenu } from "@tiptap/react/menus";
import {
  Code2,
  FileCode2,
  Image as ImageIcon,
  Images,
  List,
  ListOrdered,
  Minus,
  PlusCircle,
  SquarePlay,
  Table as TableIcon,
} from "lucide-react";
import { useRef, useState, type JSX } from "react";

import { useOutsideClick } from "@/hooks/use-outside-click";
import { classifyPastedUrl, vimeoEmbedHtml } from "./extensions";

interface FloatingMenuItem {
  name: string;
  command: () => void;
  icon: JSX.Element;
}

interface EditorFloatingMenuProps {
  editor: Editor;
  onImageSelected: (file: File) => void | Promise<void>;
  onSearchPhotos: () => void;
}

export default function EditorFloatingMenu({
  editor,
  onImageSelected,
  onSearchPhotos,
}: EditorFloatingMenuProps) {
  const [open, setOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const ref = useOutsideClick<HTMLButtonElement>(() => setOpen(false));

  function insertVideo() {
    const url = window.prompt("YouTube or Vimeo URL:");
    if (!url) return;
    const parsed = classifyPastedUrl(url);
    if (parsed?.kind === "youtube") {
      editor.chain().focus().setYoutubeVideo({ src: url.trim() }).run();
    } else if (parsed?.kind === "vimeo") {
      editor.chain().focus().setHtmlEmbed(vimeoEmbedHtml(parsed.id)).run();
    } else {
      window.alert("That doesn't look like a YouTube or Vimeo link.");
    }
  }

  function insertHtml() {
    const html = window.prompt(
      "Paste the HTML to embed (e.g. an iframe or widget snippet):"
    );
    if (html?.trim()) {
      editor.chain().focus().setHtmlEmbed(html.trim()).run();
    }
  }

  const items: FloatingMenuItem[] = [
    {
      name: "image",
      command: () => fileInput.current?.click(),
      icon: <ImageIcon size={20} className="text-[#1a8917]" strokeWidth={1.5} />,
    },
    {
      name: "photo search",
      command: onSearchPhotos,
      icon: <Images size={20} className="text-[#1a8917]" strokeWidth={1.5} />,
    },
    {
      name: "video",
      command: insertVideo,
      icon: <SquarePlay size={20} className="text-[#1a8917]" strokeWidth={1.5} />,
    },
    {
      name: "table",
      command: () =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
      icon: <TableIcon size={20} className="text-[#1a8917]" strokeWidth={1.5} />,
    },
    {
      name: "bulletList",
      command: () => editor.chain().focus().toggleBulletList().run(),
      icon: <List size={20} className="text-[#1a8917]" strokeWidth={1.5} />,
    },
    {
      name: "orderedList",
      command: () => editor.chain().focus().toggleOrderedList().run(),
      icon: <ListOrdered size={20} className="text-[#1a8917]" strokeWidth={1.5} />,
    },
    {
      name: "codeBlock",
      command: () => editor.chain().focus().toggleCodeBlock().run(),
      icon: <Code2 size={20} className="text-[#1a8917]" strokeWidth={1.5} />,
    },
    {
      name: "htmlEmbed",
      command: insertHtml,
      icon: <FileCode2 size={20} className="text-[#1a8917]" strokeWidth={1.5} />,
    },
    {
      name: "horizontalRule",
      command: () => editor.chain().focus().setHorizontalRule().run(),
      icon: <Minus size={20} className="text-[#1a8917]" strokeWidth={1.5} />,
    },
  ];

  // Only show on an empty top-level paragraph (Medium behaviour).
  const shouldShow = ({ editor }: { editor: Editor }) => {
    const { selection } = editor.state;
    if (
      !selection.empty ||
      selection.$head.parent.content.size > 0 ||
      selection.$head.depth !== 1 ||
      editor.isActive("heading", { level: 1 })
    ) {
      return false;
    }
    return true;
  };

  return (
    <FloatingMenu editor={editor} shouldShow={shouldShow} className="relative flex">
      <button
        ref={ref}
        type="button"
        className="absolute -top-[16px] right-6 rounded-full bg-surface text-ink/70 active:text-ink"
        onClick={() => setOpen((o) => !o)}
        aria-label="Insert content"
      >
        <PlusCircle
          size={32}
          strokeWidth={1}
          className={`transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        />
      </button>

      <input
        ref={fileInput}
        hidden
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
        type="file"
        onInput={(e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) onImageSelected(file);
          (e.target as HTMLInputElement).value = "";
        }}
      />

      {open && (
        <div className="absolute -top-5 left-6 z-50 flex h-10 w-fit items-center space-x-2 bg-surface px-2">
          {items.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className="flex size-8 items-center justify-center rounded-full border border-[#1a8917] bg-surface fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => {
                item.command();
                setOpen(false);
              }}
              title={item.name}
            >
              {item.icon}
            </button>
          ))}
        </div>
      )}
    </FloatingMenu>
  );
}
