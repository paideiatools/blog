"use client";

// Ported from vincent0426/meditor (MIT) — the shadcn/radix Select was
// replaced with a styled native <select>.
import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";

export default function CodeBlockSelect({
  node,
  updateAttributes,
  extension,
}: NodeViewProps) {
  const language = (node.attrs.language as string | null) ?? "null";
  const languages: string[] = extension.options.lowlight.listLanguages();

  return (
    <NodeViewWrapper className="code-block relative">
      <pre className="relative m-0 box-border rounded-[4px] border border-[#e5e5e5] bg-[#f9f9f9] p-8 pt-10 text-[14px] text-black/85">
        <div
          className="absolute left-3 top-2 z-10"
          contentEditable={false}
        >
          <select
            value={language}
            onChange={(e) => updateAttributes({ language: e.target.value })}
            className="cursor-pointer border-0 bg-transparent text-xs font-medium text-muted outline-none"
          >
            <option value="null">Auto</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
