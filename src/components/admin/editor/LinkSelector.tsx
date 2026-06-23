"use client";

// Ported from vincent0426/meditor (MIT), adapted to Tiptap v3.
import type { Editor } from "@tiptap/core";
import { Check, Trash, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

function getUrlFromString(str: string): string | null {
  try {
    return new URL(str).toString();
  } catch {
    try {
      return new URL(`https://${str}`).toString();
    } catch {
      return null;
    }
  }
}

interface LinkSelectorProps {
  editor: Editor;
  setShowLinkSelector: Dispatch<SetStateAction<boolean>>;
}

export function LinkSelector({ editor, setShowLinkSelector }: LinkSelectorProps) {
  const handleUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget[0] as HTMLInputElement;
    const url = getUrlFromString(input.value.trim());
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setShowLinkSelector(false);
  };

  return (
    <div className="flex h-full w-full min-w-[300px] items-center">
      <form
        onSubmit={handleUrlSubmit}
        className="flex w-full items-center rounded bg-[#262625] p-1"
      >
        <input
          autoFocus
          type="text"
          placeholder="Paste or type a link…"
          className="flex-1 bg-[#262625] px-1 text-sm text-white outline-none"
          defaultValue={(editor.getAttributes("link").href as string) || ""}
        />
        {editor.getAttributes("link").href ? (
          <button
            type="button"
            className="flex items-center rounded-sm p-1 text-red-400"
            onClick={() => {
              editor.chain().focus().unsetLink().run();
              setShowLinkSelector(false);
            }}
          >
            <Trash size={16} />
          </button>
        ) : (
          <>
            <button
              type="submit"
              className="flex items-center rounded-sm p-1 text-white"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              className="flex items-center rounded-sm p-1 text-white"
              onClick={() => setShowLinkSelector(false)}
            >
              <X size={16} />
            </button>
          </>
        )}
      </form>
    </div>
  );
}
