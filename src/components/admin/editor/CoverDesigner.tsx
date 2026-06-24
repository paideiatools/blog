"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Plus,
  Smile,
  Trash2,
  Type,
} from "lucide-react";
import TypographicCover, {
  COVER_STYLES,
  COVER_THEMES,
  buildCover,
  parseCover,
} from "@/components/public/TypographicCover";
import type { CoverLayer } from "@/lib/types";

// Color shown on the per-theme swatch + the layer "color" dots.
const ACCENT: Record<string, string> = {
  midnight: "#34d399",
  clay: "#2a1206",
  forest: "#6ee7b7",
  cream: "#d97757",
};
const FG: Record<string, string> = {
  midnight: "#ffffff",
  clay: "#2a1206",
  forest: "#ecfff7",
  cream: "#1b1a17",
};
const COLORS: Record<CoverLayer["color"], string> = {
  fg: "var(--tc-fg)",
  accent: "var(--tc-accent)",
  light: "#ffffff",
  dark: "#1b1a17",
};
const CORNERS = [
  { k: "tl", style: { top: -5, left: -5 }, cursor: "nwse-resize" },
  { k: "tr", style: { top: -5, right: -5 }, cursor: "nesw-resize" },
  { k: "bl", style: { bottom: -5, left: -5 }, cursor: "nesw-resize" },
  { k: "br", style: { bottom: -5, right: -5 }, cursor: "nwse-resize" },
] as const;
const ALIGNS = ["left", "center", "right"] as const;
const STICKERS = [
  "✦", "✧", "★", "☆", "✺", "✸", "❋", "❉", "✷", "❖",
  "◆", "●", "▲", "➳", "➔", "↗", "♥", "♦", "♣", "♠",
  "✿", "❀", "☀", "☁", "✏️", "🔍", "💬", "📌", "🎯", "🧠",
  "📖", "💡", "🔥", "⭐", "✅", "🌿", "📊", "🗣️", "🎓", "🧩",
];
const SHAPES = [
  "circle",
  "ring",
  "square",
  "rounded",
  "triangle",
  "diamond",
  "bar",
];
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

// Inner fill of a shape layer (fills its wrapper). Mirrors layerBoxStyle so the
// designer and the public render look identical.
function shapeVisual(l: CoverLayer): React.CSSProperties {
  const c = COLORS[l.color] ?? "var(--tc-fg)";
  const base = { width: "100%", height: "100%" } as React.CSSProperties;
  switch (l.text) {
    case "ring":
      return { ...base, border: `${Math.max(l.size * 0.13, 0.6)}cqi solid ${c}`, borderRadius: "50%" };
    case "circle":
      return { ...base, background: c, borderRadius: "50%" };
    case "rounded":
      return { ...base, background: c, borderRadius: `${l.size * 0.22}cqi` };
    case "triangle":
      return { ...base, background: c, clipPath: "polygon(50% 0,100% 100%,0 100%)" };
    case "diamond":
      return { ...base, background: c, clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" };
    case "bar":
      return { ...base, background: c, borderRadius: "999px" };
    default:
      return { ...base, background: c };
  }
}

function ShapePreview({ shape }: { shape: string }) {
  const c = "var(--color-ink)";
  const base = { display: "inline-block" as const };
  switch (shape) {
    case "ring":
      return (
        <span style={{ ...base, width: 16, height: 16, borderRadius: "50%", border: `2px solid ${c}` }} />
      );
    case "circle":
      return <span style={{ ...base, width: 16, height: 16, borderRadius: "50%", background: c }} />;
    case "square":
      return <span style={{ ...base, width: 14, height: 14, background: c }} />;
    case "rounded":
      return <span style={{ ...base, width: 14, height: 14, borderRadius: 4, background: c }} />;
    case "triangle":
      return (
        <span style={{ ...base, width: 16, height: 14, background: c, clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
      );
    case "diamond":
      return (
        <span style={{ ...base, width: 13, height: 13, background: c, clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" }} />
      );
    case "bar":
      return <span style={{ ...base, width: 18, height: 6, borderRadius: 999, background: c }} />;
    default:
      return <span style={{ ...base, width: 14, height: 14, background: c }} />;
  }
}

export default function CoverDesigner({
  template,
  onTemplateChange,
  title,
  label,
  quote,
  text,
  layers,
  onChange,
  onRemove,
}: {
  template: string;
  onTemplateChange: (t: string) => void;
  title: string;
  label?: string | null;
  quote?: string | null;
  text?: string | null;
  layers: CoverLayer[];
  onChange: (layers: CoverLayer[]) => void;
  onRemove: () => void;
}) {
  const { style, theme } = parseCover(template);
  const canvasRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stickerOpen, setStickerOpen] = useState(false);
  const sel = layers.find((l) => l.id === selectedId) ?? null;

  // Focus + select the layer being edited inline.
  useEffect(() => {
    if (!editingId) return;
    const el = canvasRef.current?.querySelector<HTMLElement>(
      `[data-layer-id="${editingId}"]`
    );
    if (!el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [editingId]);

  // Backspace / Delete removes the selected layer (unless typing in a field).
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      onChange(layersRef.current.filter((l) => l.id !== selectedId));
      setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, onChange]);

  function addLayer() {
    const l: CoverLayer = {
      id: Math.random().toString(36).slice(2, 9),
      kind: "text",
      text: "Your text",
      x: 50,
      y: 50,
      size: 8,
      width: 72,
      color: "fg",
      font: "sans",
      weight: 700,
      align: "center",
    };
    onChange([...layers, l]);
    setSelectedId(l.id);
  }

  function addSticker(glyph: string) {
    const l: CoverLayer = {
      id: Math.random().toString(36).slice(2, 9),
      kind: "sticker",
      text: glyph,
      x: 50,
      y: 50,
      size: 14,
      width: 24,
      color: "accent",
      font: "sans",
      weight: 400,
      align: "center",
    };
    onChange([...layers, l]);
    setSelectedId(l.id);
    setStickerOpen(false);
  }

  function addShape(shape: string) {
    const l: CoverLayer = {
      id: Math.random().toString(36).slice(2, 9),
      kind: "shape",
      text: shape,
      x: 50,
      y: 50,
      size: shape === "bar" ? 6 : 18,
      width: shape === "bar" ? 40 : 24,
      color: "accent",
      font: "sans",
      weight: 400,
      align: "center",
    };
    onChange([...layers, l]);
    setSelectedId(l.id);
    setStickerOpen(false);
  }

  function update(patch: Partial<CoverLayer>) {
    if (!selectedId) return;
    onChange(layers.map((l) => (l.id === selectedId ? { ...l, ...patch } : l)));
  }

  function remove() {
    if (!selectedId) return;
    onChange(layers.filter((l) => l.id !== selectedId));
    setSelectedId(null);
  }

  function startDrag(e: React.PointerEvent, id: string) {
    if (editingId === id) {
      // Editing this layer: keep the caret usable and don't let the canvas
      // (which exits edit mode) receive the event.
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const x = clamp(((ev.clientX - rect.left) / rect.width) * 100, 3, 97);
      const y = clamp(((ev.clientY - rect.top) / rect.height) * 100, 5, 95);
      onChange(
        layersRef.current.map((l) =>
          l.id === id ? { ...l, x: Math.round(x), y: Math.round(y) } : l
        )
      );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // Drag a corner handle to resize (scales from the layer's center).
  function startResize(e: React.PointerEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    const canvas = canvasRef.current;
    const l0 = layersRef.current.find((l) => l.id === id);
    if (!canvas || !l0) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + (l0.x / 100) * rect.width;
    const cy = rect.top + (l0.y / 100) * rect.height;
    const startDist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
    const startSize = l0.size;
    const startWidth = l0.width;
    const move = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
      const f = clamp(dist / startDist, 0.2, 6);
      onChange(
        layersRef.current.map((l) =>
          l.id === id
            ? {
                ...l,
                size: clamp(Math.round(startSize * f), 3, 60),
                width: clamp(Math.round(startWidth * f), 6, 100),
              }
            : l
        )
      );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const icon =
    "flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink";
  const iconActive = "bg-accent-soft text-accent-dark";
  const dot = "h-5 w-5 rounded-full ring-offset-1 transition";

  const AlignIcon =
    sel?.align === "left"
      ? AlignLeft
      : sel?.align === "right"
        ? AlignRight
        : AlignCenter;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {/* One contextual control bar */}
      <div className="flex h-12 items-center gap-1 border-b border-line px-2">
        {sel ? (
          <>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setSelectedId(null);
              }}
              className="mr-1 flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-accent hover:bg-accent-soft"
            >
              <Check size={14} /> Done
            </button>
            <span className="h-5 w-px bg-line" />
            <span className="flex items-center gap-1.5 px-1" title="Text size">
              <Type size={14} className="text-faint" />
              <input
                type="range"
                min={4}
                max={22}
                step={1}
                value={sel.size}
                onChange={(e) => update({ size: Number(e.target.value) })}
                className="w-20 accent-accent"
              />
            </span>
            {(sel.kind ?? "text") === "text" && (
              <>
                <button
                  type="button"
                  title="Serif"
                  onClick={() =>
                    update({ font: sel.font === "serif" ? "sans" : "serif" })
                  }
                  className={`${icon} ${sel.font === "serif" ? iconActive : ""}`}
                >
                  <span
                    className={sel.font === "serif" ? "font-serif italic" : ""}
                  >
                    Aa
                  </span>
                </button>
                <button
                  type="button"
                  title="Bold"
                  onClick={() =>
                    update({ weight: sel.weight >= 700 ? 400 : 700 })
                  }
                  className={`${icon} ${sel.weight >= 700 ? iconActive : ""}`}
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  title={`Align ${sel.align}`}
                  onClick={() =>
                    update({
                      align: ALIGNS[(ALIGNS.indexOf(sel.align) + 1) % 3],
                    })
                  }
                  className={icon}
                >
                  <AlignIcon size={15} />
                </button>
              </>
            )}
            <span className="mx-0.5 h-5 w-px bg-line" />
            <span className="flex items-center gap-1.5 px-1">
              {(
                [
                  ["fg", FG[theme]],
                  ["accent", ACCENT[theme]],
                  ["light", "#ffffff"],
                  ["dark", "#1b1a17"],
                ] as const
              ).map(([id, hex]) => (
                <button
                  key={id}
                  type="button"
                  title={id}
                  onClick={() => update({ color: id as CoverLayer["color"] })}
                  className={`${dot} ${
                    sel.color === id
                      ? "ring-2 ring-accent"
                      : "ring-1 ring-line"
                  }`}
                  style={{ background: hex }}
                />
              ))}
            </span>
            <button
              type="button"
              title="Delete text"
              onClick={remove}
              className={`${icon} ml-auto hover:!bg-danger/10 hover:!text-danger`}
            >
              <Trash2 size={15} />
            </button>
          </>
        ) : (
          <>
            <select
              value={style}
              onChange={(e) => onTemplateChange(buildCover(e.target.value, theme))}
              className="h-8 rounded-lg border border-line bg-paper px-2 text-sm font-medium outline-none focus:border-accent"
              title="Cover style"
            >
              {COVER_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <span className="ml-1 flex items-center gap-1.5">
              {COVER_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  title={t.label}
                  onClick={() => onTemplateChange(buildCover(style, t.id))}
                  className={`${dot} ${
                    theme === t.id ? "ring-2 ring-accent" : "ring-1 ring-line"
                  }`}
                  style={{ background: t.swatch }}
                />
              ))}
            </span>
            <button
              type="button"
              onClick={addLayer}
              className="ml-1 flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <Plus size={14} /> Add text
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setStickerOpen((o) => !o)}
                className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                  stickerOpen
                    ? "border-accent text-accent"
                    : "border-line text-muted hover:border-accent hover:text-accent"
                }`}
              >
                <Smile size={14} /> Sticker
              </button>
              {stickerOpen && (
                <div className="absolute left-0 top-9 z-20 w-64 rounded-xl border border-line bg-surface p-2 shadow-xl">
                  <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-faint">
                    Icons
                  </p>
                  <div className="grid max-h-40 grid-cols-7 gap-1 overflow-y-auto">
                    {STICKERS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => addSticker(g)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-ink transition-colors hover:bg-paper"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <p className="px-1 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                    Shapes
                  </p>
                  <div className="grid grid-cols-7 gap-1">
                    {SHAPES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        title={s}
                        onClick={() => addShape(s)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-paper"
                      >
                        <ShapePreview shape={s} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="ml-auto flex h-8 items-center rounded-lg px-2.5 text-xs font-medium text-faint transition-colors hover:text-danger"
            >
              Remove
            </button>
          </>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onPointerDown={() => {
          setEditingId(null);
          setSelectedId(null);
        }}
        className={`tcover--${theme} relative overflow-hidden`}
        style={{ containerType: "inline-size", aspectRatio: "16 / 9" }}
      >
        <TypographicCover
          template={template}
          title={title}
          label={label}
          quote={quote}
          text={text}
          className="!absolute inset-0 !rounded-none"
        />
        {layers.map((l) => {
          const kind = l.kind ?? "text";
          const editing = editingId === l.id;
          const selected = selectedId === l.id;
          const color = COLORS[l.color] ?? "var(--tc-fg)";
          const isBar = kind === "shape" && l.text === "bar";
          const wrap: React.CSSProperties = {
            position: "absolute",
            left: `${l.x}%`,
            top: `${l.y}%`,
            transform: "translate(-50%, -50%)",
            touchAction: "none",
            cursor: editing ? "text" : "move",
            width:
              kind === "shape" && !isBar ? `${l.size}cqi` : `${l.width}%`,
            height:
              kind === "shape"
                ? isBar
                  ? `${Math.max(l.size * 0.45, 1)}cqi`
                  : `${l.size}cqi`
                : undefined,
            outline: selected
              ? `1.5px ${editing ? "solid" : "dashed"} rgba(140,140,140,.95)`
              : "none",
            outlineOffset: "4px",
          };
          return (
            <div
              key={l.id}
              onPointerDown={(e) => startDrag(e, l.id)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (kind === "text") {
                  setSelectedId(l.id);
                  setEditingId(l.id);
                }
              }}
              style={wrap}
            >
              {kind === "shape" ? (
                <div style={shapeVisual(l)} />
              ) : (
                <span
                  data-layer-id={l.id}
                  contentEditable={editing}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    if (editing) {
                      update({ text: e.currentTarget.textContent ?? "" });
                      setEditingId(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (!editing) return;
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.blur();
                    } else if (e.key === "Escape") {
                      e.currentTarget.blur();
                    }
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    fontSize: `${l.size}cqi`,
                    color,
                    fontFamily:
                      kind === "sticker"
                        ? '"Apple Color Emoji","Segoe UI Emoji",var(--font-sans)'
                        : l.font === "serif"
                          ? "var(--font-serif)"
                          : "var(--font-sans)",
                    fontWeight: kind === "sticker" ? 400 : l.weight,
                    lineHeight: kind === "sticker" ? 1 : 1.12,
                    textAlign: kind === "sticker" ? "center" : l.align,
                    outline: "none",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "break-word",
                  }}
                >
                  {l.text}
                </span>
              )}

              {selected &&
                !editing &&
                CORNERS.map((c) => (
                  <div
                    key={c.k}
                    onPointerDown={(e) => startResize(e, l.id)}
                    style={{
                      position: "absolute",
                      ...c.style,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#fff",
                      border: "1.5px solid var(--color-accent)",
                      cursor: c.cursor,
                      touchAction: "none",
                    }}
                  />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
