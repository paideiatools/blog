import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Paideias Blog — Insights for Qualitative Researchers",
    template: "%s | Paideias Blog",
  },
  description:
    "Methodology guides, analysis techniques, and community stories for qualitative researchers — from the team behind Paideias.",
  openGraph: {
    type: "website",
    siteName: "Paideias Blog",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Applied before paint so the chosen theme never flashes.
const themeInit = `
(function () {
  try {
    var t = localStorage.getItem("paideias-theme") || "system";
    var dark =
      t === "dark" ||
      (t === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("theme-light", !dark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
