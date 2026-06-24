export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "admin" | "reader";
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type CoverLayer = {
  id: string;
  // sticker = decorative glyph in `text`; shape = geometric shape id in `text`
  kind?: "text" | "sticker" | "shape";
  text: string;
  x: number; // center X, % of cover width
  y: number; // center Y, % of cover height
  size: number; // font size in cqi (relative to cover width)
  width: number; // text box width, % of cover width
  color: "fg" | "accent" | "light" | "dark";
  font: "sans" | "serif";
  weight: number; // 400 | 700
  align: "left" | "center" | "right";
};

export type Post = {
  id: string;
  title: string;
  kicker: string | null;
  subtitle: string | null;
  slug: string;
  excerpt: string | null;
  content: unknown;
  content_html: string | null;
  cover_image_url: string | null;
  cover_credit_name: string | null;
  cover_credit_link: string | null;
  cover_template: string | null;
  cover_text: string | null;
  cover_layers: CoverLayer[] | null;
  status: "draft" | "published" | "archived";
  featured: boolean;
  author_id: string;
  category_id: string | null;
  tags: string[];
  reading_time: number;
  view_count: number;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
  category?: Category | null;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string | null;
  parent_id: string | null;
  content: string;
  guest_name: string | null;
  is_hidden: boolean;
  created_at: string;
  author?: Profile | null;
  post?: Pick<Post, "title" | "slug">;
};

export type Subscriber = {
  id: string;
  email: string;
  created_at: string;
};
