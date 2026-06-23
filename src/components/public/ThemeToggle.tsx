"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

const KEY = "paideias-theme";
const ORDER: Theme[] = ["light", "dark", "system"];

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("theme-light", !dark);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme((localStorage.getItem(KEY) as Theme) || "system");
  }, []);

  // Follow OS changes while in system mode.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme ?? "system") + 1) % ORDER.length];
    setTheme(next);
    localStorage.setItem(KEY, next);
    apply(next);
  }

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label =
    theme === "light"
      ? "Theme: light"
      : theme === "dark"
        ? "Theme: dark"
        : "Theme: system";

  return (
    <button
      onClick={cycle}
      title={`${label} — click to change`}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted ring-1 ring-line transition-colors duration-200 hover:text-ink hover:ring-muted"
    >
      {theme === null ? <Monitor size={16} /> : <Icon size={16} />}
    </button>
  );
}
