"use client";

// Ported from vincent0426/meditor (MIT), adapted to Tiptap v3
// (@tiptap/react/menus + floating-ui instead of tippy).
import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  BoldIcon,
  ItalicIcon,
  Link as LinkIcon,
  Quote,
  Sparkles,
  Strikethrough,
  Type,
  UnderlineIcon,
} from "lucide-react";
import { useState, type JSX } from "react";

import { LinkSelector } from "./LinkSelector";
import { TEXT_EFFECTS, type TextEffect } from "./extensions";

interface BubbleMenuItem {
  name: string;
  disable?: () => boolean;
  isActive: () => boolean;
  command: () => void;
  icon: JSX.Element;
}

export default function EditorBubbleMenu({ editor }: { editor: Editor }) {
  const [showLinkSelector, setShowLinkSelector] = useState(false);
  const [showAnimatePicker, setShowAnimatePicker] = useState(false);

  const items: BubbleMenuItem[] = [
    {
      name: "bold",
      disable: () => editor.isActive("heading"),
      isActive: () => editor.isActive("bold"),
      command: () => editor.chain().focus().toggleBold().run(),
      icon: <BoldIcon size={21} />,
    },
    {
      name: "italic",
      disable: () => editor.isActive("heading"),
      isActive: () => editor.isActive("italic"),
      command: () => editor.chain().focus().toggleItalic().run(),
      icon: <ItalicIcon size={21} />,
    },
    {
      name: "underline",
      disable: () => editor.isActive("heading"),
      isActive: () => editor.isActive("underline"),
      command: () => editor.chain().focus().toggleUnderline().run(),
      icon: <UnderlineIcon size={21} />,
    },
    {
      name: "strike",
      disable: () => editor.isActive("heading"),
      isActive: () => editor.isActive("strike"),
      command: () => editor.chain().focus().toggleStrike().run(),
      icon: <Strikethrough size={21} />,
    },
    {
      name: "link",
      disable: () => editor.isActive("heading"),
      isActive: () => editor.isActive("link"),
      command: () => setShowLinkSelector((s) => !s),
      icon: <LinkIcon size={21} />,
    },
    {
      name: "heading2",
      isActive: () => editor.isActive("heading", { level: 2 }),
      command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      icon: <Type size={21} />,
    },
    {
      name: "heading3",
      isActive: () => editor.isActive("heading", { level: 3 }),
      command: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      icon: <Type size={15} />,
    },
    {
      name: "blockquote",
      isActive: () => editor.isActive("blockquote"),
      command: () => editor.chain().focus().toggleBlockquote().run(),
      icon: <Quote size={21} />,
    },
    {
      name: "animate",
      disable: () => editor.isActive("heading", { level: 1 }),
      isActive: () => editor.isActive("animatedText"),
      command: () => setShowAnimatePicker((s) => !s),
      icon: <Sparkles size={19} />,
    },
  ];

  const EFFECT_LABEL: Record<TextEffect, string> = {
    shimmer: "Shimmer",
    highlight: "Highlight",
    glow: "Glow",
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor, state }) => {
        if (state.selection.empty) return false;
        if (
          editor.isActive("heading", { level: 1 }) ||
          editor.isActive("image") ||
          editor.isActive("codeBlock") ||
          editor.isActive("horizontalRule")
        ) {
          return false;
        }
        return true;
      }}
      className="z-50 flex h-[44px] items-center rounded-[5px] bg-[#262625] px-[10px] shadow-lg"
    >
      {showLinkSelector ? (
        <LinkSelector editor={editor} setShowLinkSelector={setShowLinkSelector} />
      ) : showAnimatePicker ? (
        <div className="flex items-center gap-1 px-1">
          <Sparkles size={14} className="text-[#b5e5a4]" />
          {TEXT_EFFECTS.map((effect) => (
            <button
              key={effect}
              type="button"
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                editor.isActive("animatedText", { effect })
                  ? "bg-[#b5e5a4] text-[#141413]"
                  : `text-white hover:bg-white/15 animate-text-${effect}`
              }`}
              onClick={() => {
                editor.chain().focus().setTextAnimation(effect).run();
                setShowAnimatePicker(false);
              }}
            >
              {EFFECT_LABEL[effect]}
            </button>
          ))}
          <button
            type="button"
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-white/70 hover:bg-white/15"
            onClick={() => {
              editor.chain().focus().unsetTextAnimation().run();
              setShowAnimatePicker(false);
            }}
          >
            None
          </button>
        </div>
      ) : (
        items.map((item) => (
          <span key={item.name} className="flex items-center">
            <button
              type="button"
              className={`px-[7.5px] ${
                item.isActive()
                  ? "text-[#b5e5a4]"
                  : item.disable?.()
                    ? "text-[#4d4d4d]"
                    : "text-white"
              }`}
              disabled={item.disable?.()}
              onClick={item.command}
            >
              {item.icon}
            </button>
            {item.name === "link" && (
              <span className="mx-2 h-[24px] w-[2px] bg-[#4d4d4d]" />
            )}
          </span>
        ))
      )}
    </BubbleMenu>
  );
}
