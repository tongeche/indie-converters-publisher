import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { BookOpen, FileText, Headphones, ChevronDown } from "lucide-react";
import { BookAddToCartButton } from "@/components/catalog/BookAddToCartButton";

type BookDetail = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_url: string | null;
  pub_date: string | null;
  formats: string[] | null;
  keywords: string[] | null;
  imprints: { name: string | null; slug: string | null } | null;
  books_authors: {
    position: number | null;
    authors: {
      display_name: string;
      slug: string;
      short_bio: string | null;
      photo_url: string | null;
    } | null;
  }[];
  books_genres: {
    genres: { id: string; label: string; slug: string } | null;
  }[];
  book_retailer_links: {
    url: string;
    retailers: { label: string } | null;
  }[];
  book_assets: {
    asset_type: string;
    url: string;
    title: string | null;
  }[];
};

type PageParams = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

const fallbackCover =
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80";
const fallbackAuthorPhoto =
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80";

async function fetchBook(slug: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("books")
    .select(
      `
      id,
      slug,
      title,
      subtitle,
      description,
      cover_url,
      pub_date,
      formats,
      keywords,
      imprints:imprint_id ( name, slug ),
      books_authors (
        position,
        authors:author_id ( display_name, slug, short_bio, photo_url )
      ),
      books_genres (
        genres:genre_id ( id, label, slug )
      ),
      book_retailer_links (
        url,
        retailers:retailer_id ( label )
      ),
      book_assets (
        asset_type,
        url,
        title
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (!data) return null;

  type SupabaseAuthorEntry = {
    position: number | null;
    authors:
      | BookDetail["books_authors"][number]["authors"]
      | BookDetail["books_authors"][number]["authors"][]
      | null;
  };

  type SupabaseGenreEntry = {
    genres:
      | BookDetail["books_genres"][number]["genres"]
      | BookDetail["books_genres"][number]["genres"][]
      | null;
  };

  type SupabaseRetailerEntry = {
    url: string;
    retailers:
      | BookDetail["book_retailer_links"][number]["retailers"]
      | BookDetail["book_retailer_links"][number]["retailers"][]
      | null;
  };

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle ?? null,
    description: data.description ?? null,
    cover_url: data.cover_url ?? null,
    pub_date: data.pub_date ?? null,
    formats: data.formats ?? null,
    keywords: data.keywords ?? null,
    imprints: Array.isArray(data.imprints)
      ? (data.imprints[0] as BookDetail["imprints"]) ?? null
      : ((data.imprints as BookDetail["imprints"]) ?? null),
    books_authors: Array.isArray(data.books_authors)
      ? (data.books_authors as SupabaseAuthorEntry[]).map((entry) => ({
          position: entry.position ?? null,
          authors: Array.isArray(entry.authors)
            ? entry.authors[0] ?? null
            : entry.authors ?? null,
        }))
      : [],
    books_genres: Array.isArray(data.books_genres)
      ? (data.books_genres as SupabaseGenreEntry[]).map((entry) => ({
          genres: Array.isArray(entry.genres)
            ? entry.genres[0] ?? null
            : entry.genres ?? null,
        }))
      : [],
    book_retailer_links: Array.isArray(data.book_retailer_links)
      ? (data.book_retailer_links as SupabaseRetailerEntry[]).map((entry) => ({
          url: entry.url,
          retailers: Array.isArray(entry.retailers)
            ? entry.retailers[0] ?? null
            : entry.retailers ?? null,
        }))
      : [],
    book_assets: Array.isArray(data.book_assets)
      ? (data.book_assets as BookDetail["book_assets"])
      : [],
  };
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const book = await fetchBook(slug);
  if (!book) {
    return {
      title: "Book not found · IndieConverters",
    };
  }

  const authors =
    book.books_authors
      ?.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((entry) => entry.authors?.display_name)
      .filter(Boolean)
      .join(", ") ?? "";

  return {
    title: `${book.title}${book.subtitle ? ` — ${book.subtitle}` : ""}`,
    description:
      book.description?.slice(0, 150) ||
      `Discover ${book.title} by ${authors} on IndieConverters.`,
  };
}

export default async function BookPage({ params }: PageParams) {
  const { slug } = await params;
  const book = await fetchBook(slug);
  if (!book) {
    notFound();
  }

  const authors = book.books_authors
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((entry) => entry.authors)
    .filter(
      (author): author is NonNullable<typeof author> => Boolean(author)
    );

  const genres = book.books_genres
    .map((entry) => entry.genres)
    .filter(
      (genre): genre is NonNullable<typeof genre> => Boolean(genre)
    );

  const retailers = book.book_retailer_links
    .map((entry) => ({
      label: entry.retailers?.label ?? "Retailer",
      url: entry.url,
    }))
    .filter((retailer) => Boolean(retailer.url));

  const primaryGenre = genres[0];

  const supabase = createServerSupabaseClient();
  type Recommendation = {
    id: string;
    slug: string;
    title: string;
    cover_url: string | null;
  };
  let recommendations: Recommendation[] = [];
  if (primaryGenre?.id) {
    const { data } = await supabase
      .from("books")
      .select(
        `
        id,
        slug,
        title,
        cover_url,
        books_genres!inner ( genre_id )
      `
      )
      .eq("books_genres.genre_id", primaryGenre.id)
      .eq("is_published", true)
      .neq("slug", book.slug)
      .limit(6);
    recommendations =
      data?.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        cover_url: item.cover_url ?? null,
      })) ?? [];
  }

  const featuredAuthor = authors[0];
  const formatPreference = ["Hardcover", "Paperback", "eBook", "Audiobook"];
  const selectedFormat =
    book.formats?.find((format) => formatPreference.includes(format)) ??
    book.formats?.[0] ??
    null;
  const formatPriceMap: Record<string, number> = {
    Hardcover: 28,
    Paperback: 22,
    eBook: 14,
    Audiobook: 18,
  };
  const price = selectedFormat
    ? formatPriceMap[selectedFormat] ?? 20
    : 20;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16 sm:px-10 lg:py-20">
      {/* Section 1: hero */}
      <section className="grid gap-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:grid-cols-[200px_minmax(0,1fr)_260px]">
        <div className="flex flex-col items-center gap-4 lg:items-start">
          <div className="relative w-full max-w-[220px] overflow-hidden rounded-xl border border-zinc-100 bg-zinc-100 shadow-lg">
            <div className="relative aspect-[2/3]">
              <Image
                src={book.cover_url || fallbackCover}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 70vw, 25vw"
                priority
              />
            </div>
          </div>
          <div className="flex w-full items-center justify-center gap-3 text-[#F4511E] md:justify-start">
            {[BookOpen, FileText, Headphones].map((Icon, index) => (
              <div
                key={index}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm"
              >
                <Icon className="h-6 w-6" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="mt-3 text-3xl font-semibold text-zinc-900">
              {book.title}
            </h1>
            {authors.length > 0 && (
              <p className="mt-4 text-sm text-zinc-500">
                By{" "}
                {authors.map((author, idx) => (
                  <span key={author.slug}>
                    {idx > 0 && ", "}
                    <Link
                      href={`/authors/${author.slug}`}
                      className="font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      {author.display_name}
                    </Link>
                  </span>
                ))}
              </p>
            )}

          </div>

          {book.description && (
            <div className="space-y-4 text-base leading-relaxed text-zinc-700">
              {book.description.split("\n").map((paragraph: string, idx: number) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          )}

          {retailers.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-zinc-900 mb-3">
                Buy from Other Retailers:
              </p>
              <div className="flex flex-wrap gap-3">
                {retailers.map((retailer) => (
                  <a
                    key={retailer.url}
                    href={retailer.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border-2 border-[#F4511E] px-4 py-2 text-sm font-semibold text-[#F4511E] transition hover:bg-[#F4511E] hover:text-white"
                  >
                    {retailer.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Description Section */}
          <details className="group mt-6 border-t border-zinc-200 pt-4" open>
            <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-zinc-900">
              <span>Description</span>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-700">
              {book.description ? (
                book.description.split("\n").map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))
              ) : (
                <p className="text-zinc-500">No description available.</p>
              )}
            </div>
          </details>

        </div>

        <div className="flex flex-col gap-6 border-t border-zinc-200 pt-4 lg:border-t-0 lg:border-l lg:border-zinc-200 lg:pl-6">
          {/* About the Author Section */}
          {featuredAuthor && (
            <details className="group border-t border-zinc-200 pt-4 lg:border-t-0">
              <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-zinc-900">
                <span>About the Author</span>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-4">
                <div className="flex items-start gap-4">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border border-zinc-200">
                    <Image
                      src={featuredAuthor.photo_url || fallbackAuthorPhoto}
                      alt={featuredAuthor.display_name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/authors/${featuredAuthor.slug}`}
                      className="text-base font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      {featuredAuthor.display_name}
                    </Link>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                      {featuredAuthor.short_bio ??
                        "Add a short bio in Supabase to showcase this author."}
                    </p>
                  </div>
                </div>
              </div>
            </details>
          )}

          <BookAddToCartButton
            bookId={book.id}
            title={book.title}
            price={price}
            coverUrl={book.cover_url || fallbackCover}
            description={book.description}
            format={selectedFormat}
          />
        </div>
      </section>

      {/* Section 2: recommendations */}
      {recommendations.length > 0 && (
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-zinc-900">
            You May Also Like
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((rec) => (
              <Link
                key={rec.id}
                href={`/catalog/${rec.slug}`}
                className="group rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative mx-auto h-48 w-32 overflow-hidden rounded-xl bg-white">
                  <Image
                    src={rec.cover_url || fallbackCover}
                    alt={rec.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="128px"
                  />
                </div>
                <p className="mt-4 text-sm font-semibold text-zinc-900">
                  {rec.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
