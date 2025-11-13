export type Book = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  imprint_id?: string | null;
  publisher_id?: string | null;
  pub_date?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
  description?: string | null;
  cover_url?: string | null;
  formats: ("Hardcover" | "Paperback" | "eBook" | "Audiobook")[];
  keywords: string[];
  tags: string[];
  is_published: boolean;
  rating?: number | null;
};

export type Publisher = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
};

export type Service = {
  id: string;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  icon_url?: string | null;
  price: number;
  original_price?: number | null;
  rating?: number | null;
  review_count?: number;
  is_active: boolean;
  display_order: number;
  features?: string[];
};

export type BookTag = {
  id: string;
  slug: string;
  label: string;
  category: "format" | "release" | "genre" | "length" | "theme" | "audience" | "mood" | "season" | "discovery" | "other";
  description?: string | null;
  color?: string | null;
};

export type Author = {
  id: string;
  slug: string;
  display_name: string;
  short_bio?: string | null;
  long_bio?: string | null;
  website_url?: string | null;
  photo_url?: string | null;
};

