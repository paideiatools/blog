"use client";

import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Trash2,
} from "lucide-react";

const WIDTHS = [
  { label: "S", value: "40%" },
  { label: "M", value: "70%" },
  { label: "L", value: null }, // full width
];

export default function ImageBubbleMenu({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes("image");

  const btn = (active: boolean) =>
    `flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-xs font-semibold transition-colors ${
      active ? "bg-accent text-on-accent" : "text-white/80 hover:bg-white/15"
    }`;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => editor.isActive("image")}
      className="z-50 flex h-[40px] items-center gap-0.5 rounded-[5px] bg-[#262625] px-2 shadow-lg"
    >
      <button
        type="button"
        title="Align left"
        className={btn(attrs.align === "left")}
        onClick={() =>
          editor.chain().focus().updateAttributes("image", { align: "left" }).run()
        }
      >
        <AlignLeft size={15} />
      </button>
      <button
        type="button"
        title="Center"
        className={btn(attrs.align === "center" || !attrs.align)}
        onClick={() =>
          editor.chain().focus().updateAttributes("image", { align: "center" }).run()
        }
      >
        <AlignCenter size={15} />
      </button>
      <button
        type="button"
        title="Align right"
        className={btn(attrs.align === "right")}
        onClick={() =>
          editor.chain().focus().updateAttributes("image", { align: "right" }).run()
        }
      >
        <AlignRight size={15} />
      </button>

      <span className="mx-1 h-5 w-px bg-white/20" />

      {WIDTHS.map((w) => (
        <button
          key={w.label}
          type="button"
          title={w.value ? `Width ${w.value}` : "Full width"}
          className={btn(attrs.width === w.value)}
          onClick={() =>
            editor
              .chain()
              .focus()
              .updateAttributes("image", { width: w.value })
              .run()
          }
        >
          {w.label}
        </button>
      ))}

      <span className="mx-1 h-5 w-px bg-white/20" />

      <button
        type="button"
        title="Remove image"
        className={btn(false)}
        onClick={() => editor.chain().focus().deleteSelection().run()}
      >
        <Trash2 size={14} />
      </button>
    </BubbleMenu>
  );
}
