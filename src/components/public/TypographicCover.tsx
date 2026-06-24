import type { CSSProperties } from "react";
import type { CoverLayer } from "@/lib/types";

// Designed cover banners that complement the title instead of repeating it.
// A cover is "<style>:<theme>" — four layout styles × four color themes.
// Sizing uses container-query units (cqi) so it scales from card to hero.

export const COVER_STYLES = [
  { id: "generative", label: "Pattern" },
  { id: "badge", label: "Topic" },
  { id: "monogram", label: "Monogram" },
  { id: "quote", label: "Quote" },
] as const;

export const COVER_THEMES = [
  { id: "midnight", label: "Midnight", swatch: "#16203a" },
  { id: "clay", label: "Clay", swatch: "#cf6a45" },
  { id: "forest", label: "Forest", swatch: "#0f3d35" },
  { id: "cream", label: "Cream", swatch: "#e7dcc6" },
] as const;

const STYLE_IDS = COVER_STYLES.map((s) => s.id) as readonly string[];
const THEME_IDS = COVER_THEMES.map((t) => t.id) as readonly string[];

export function buildCover(style: string, theme: string) {
  return `${style}:${theme}`;
}

export function parseCover(template: string | null | undefined) {
  const [style, theme] = (template ?? "").split(":");
  return {
    style: STYLE_IDS.includes(style) ? style : "generative",
    theme: THEME_IDS.includes(theme) ? theme : "midnight",
  };
}

export function isCoverTemplate(value: string | null | undefined): boolean {
  return !!value && STYLE_IDS.includes((value.split(":")[0] ?? ""));
}

// Tiny deterministic PRNG so a post's pattern is stable across renders.
function seeded(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Sparkle({ style }: { style: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className="tcover__sparkle" style={style} aria-hidden>
      <path d="M12 0c.6 6.4 5 10.8 11.4 11.5C17 12.2 12.6 16.6 12 23c-.6-6.4-5-10.8-11.4-11.5C7 11.8 11.4 7.4 12 1Z" />
    </svg>
  );
}

function GenerativeField({ seed }: { seed: string }) {
  const rng = seeded(seed || "paideias");
  const kinds = ["disc", "ring", "dot"] as const;
  const shapes = Array.from({ length: 6 }, () => {
    const kind = kinds[Math.floor(rng() * kinds.length)];
    const size = 8 + rng() * 34;
    return {
      kind,
      size,
      left: rng() * 84,
      top: rng() * 44,
      op: 0.14 + rng() * 0.32,
    };
  });
  return (
    <>
      {shapes.map((s, i) => {
        const base: CSSProperties = {
          position: "absolute",
          left: `${s.left}cqi`,
          top: `${s.top}cqi`,
          width: `${s.size}cqi`,
          height: `${s.size}cqi`,
          opacity: s.op,
          borderRadius: "50%",
        };
        if (s.kind === "disc")
          base.background = "var(--tc-accent)";
        else if (s.kind === "ring")
          base.border = `${Math.max(s.size * 0.12, 1)}cqi solid var(--tc-accent)`;
        else {
          base.width = `${s.size * 0.3}cqi`;
          base.height = `${s.size * 0.3}cqi`;
          base.background = "currentColor";
        }
        return <span key={i} style={base} aria-hidden />;
      })}
    </>
  );
}

const LAYER_COLOR: Record<CoverLayer["color"], string> = {
  fg: "var(--tc-fg)",
  accent: "var(--tc-accent)",
  light: "#ffffff",
  dark: "#1b1a17",
};

// Positioning + visual style for a layer — shared by the public render and the
// admin designer so they look identical.
export function layerBoxStyle(layer: CoverLayer): CSSProperties {
  const color = LAYER_COLOR[layer.color] ?? "var(--tc-fg)";
  const common: CSSProperties = {
    position: "absolute",
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    transform: "translate(-50%, -50%)",
  };

  if (layer.kind === "shape") {
    const s = `${layer.size}cqi`;
    const box: CSSProperties = { ...common, width: s, height: s };
    switch (layer.text) {
      case "ring":
        return {
          ...box,
          border: `${Math.max(layer.size * 0.13, 0.6)}cqi solid ${color}`,
          borderRadius: "50%",
        };
      case "circle":
        return { ...box, background: color, borderRadius: "50%" };
      case "square":
        return { ...box, background: color };
      case "rounded":
        return { ...box, background: color, borderRadius: `${layer.size * 0.22}cqi` };
      case "triangle":
        return { ...box, background: color, clipPath: "polygon(50% 0,100% 100%,0 100%)" };
      case "diamond":
        return { ...box, background: color, clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" };
      case "bar":
        return {
          ...common,
          width: `${layer.width}%`,
          height: `${Math.max(layer.size * 0.45, 1)}cqi`,
          background: color,
          borderRadius: "999px",
        };
      default:
        return { ...box, background: color };
    }
  }

  const sticker = layer.kind === "sticker";
  return {
    ...common,
    width: `${layer.width}%`,
    fontSize: `${layer.size}cqi`,
    color,
    fontFamily: sticker
      ? '"Apple Color Emoji","Segoe UI Emoji",var(--font-sans)'
      : layer.font === "serif"
        ? "var(--font-serif)"
        : "var(--font-sans)",
    fontWeight: sticker ? 400 : layer.weight,
    lineHeight: sticker ? 1 : 1.12,
    textAlign: sticker ? "center" : layer.align,
  };
}

function LayerView({ layer }: { layer: CoverLayer }) {
  return (
    <span className="tcover__layer" style={layerBoxStyle(layer)}>
      {layer.kind === "shape" ? null : layer.text}
    </span>
  );
}

// Clean, text-free decorative backgrounds — the admin adds their own text.
function CoverArt({ style, seed }: { style: string; seed: string }) {
  if (style === "badge") {
    return (
      <>
        <span className="tcover__blob" aria-hidden />
        <span className="tcover__ring" aria-hidden />
      </>
    );
  }
  if (style === "monogram") {
    return (
      <>
        <span className="tcover__blob" aria-hidden />
        <Sparkle style={{ top: "18%", right: "22%", width: "6cqi" }} />
        <Sparkle style={{ bottom: "22%", left: "16%", width: "3.6cqi" }} />
        <Sparkle style={{ top: "32%", left: "30%", width: "2.6cqi" }} />
      </>
    );
  }
  if (style === "quote") {
    return (
      <>
        <span className="tcover__blob" aria-hidden />
        <span className="tcover__qmark" aria-hidden>
          &ldquo;
        </span>
      </>
    );
  }
  return <GenerativeField seed={seed} />;
}

export default function TypographicCover({
  template,
  title,
  layers,
  className = "",
}: {
  template: string;
  title: string;
  // Accepted for API compatibility; covers are a clean slate by default.
  label?: string | null;
  quote?: string | null;
  text?: string | null;
  hideBaseText?: boolean;
  layers?: CoverLayer[] | null;
  className?: string;
}) {
  const { style, theme } = parseCover(template);
  const cls = `tcover tcover--${theme} tcover--${style} ${className}`;
  return (
    <div className={cls}>
      <CoverArt style={style} seed={title || template} />
      {layers?.map((l) => (
        <LayerView key={l.id} layer={l} />
      ))}
    </div>
  );
}
