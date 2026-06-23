import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Bundle the repo's Markdown docs so the in-admin docs viewer can read them
  // at runtime on Vercel.
  outputFileTracingIncludes: {
    "/admin/agent": ["./*.md"],
    "/admin/docs/[slug]": ["./*.md"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "puijdcwcfniebdiobxyg.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Local Supabase storage (supabase start)
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54341",
        pathname: "/storage/v1/object/public/**",
      },
      // Unsplash photos (in-editor photo search)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
