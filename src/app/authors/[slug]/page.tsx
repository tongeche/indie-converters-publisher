import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { ExpandableBio } from "@/components/author/ExpandableBio";

type Author = {
  id: string;
  slug: string;
  display_name: string;
  short_bio: string | null;
  long_bio: string | null;
  website_url: string | null;
  photo_url: string | null;
};

type BookCard = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  pub_date: string | null;
  formats: string[] | null;
  rating?: number | null;
  imprints: { name: string | null }[] | null;
  books_genres?: {
    genres: { id: string; label: string; slug: string } | null;
  }[] | null;
};

type BookEntry = {
  position: number | null;
  books: BookCard | null;
};

type Recommendation = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  rating?: number | null;
  authors: { display_name: string; slug: string }[];
};

type Top10Book = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  rating: number;
  books_genres?: {
    genres: { id: string; label: string; slug: string } | null;
  }[] | null;
};

type PageParams = { params: Promise<{ slug: string }> };

const fallbackPortrait =
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80";
const fallbackCover =
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80";

const authorSelectFields =
  "id, slug, display_name, short_bio, long_bio, website_url, photo_url";

async function fetchAuthor(identifier: string | undefined) {
  const supabase = createServerSupabaseClient();

  if (!identifier) return null;
  const normalizedIdentifier = identifier.trim();

  const { data: slugMatch } = await supabase
    .from("authors")
    .select(authorSelectFields)
    .eq("slug", normalizedIdentifier)
    .maybeSingle();
  if (slugMatch) return slugMatch as Author;

  const { data: slugIlike } = await supabase
    .from("authors")
    .select(authorSelectFields)
    .ilike("slug", normalizedIdentifier)
    .maybeSingle();
  if (slugIlike) return slugIlike as Author;

  const displayIdentifier = normalizedIdentifier
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!displayIdentifier) return null;

  const { data: displayMatch } = await supabase
    .from("authors")
    .select(authorSelectFields)
    .ilike("display_name", `%${displayIdentifier}%`)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (displayMatch as Author) ?? null;
}

async function fetchAuthorBooks(authorId: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("books_authors")
    .select(
      `
      position,
      books:book_id (
        id,
        slug,
        title,
        description,
        cover_url,
        pub_date,
        formats,
        rating,
        imprints:imprint_id ( name ),
        books_genres (
          genres:genre_id ( id, label, slug )
        )
      )
    `
    )
    .eq("author_id", authorId)
    .order("position", { ascending: true });

  if (!data) return [];

  return data.map((entry: any) => ({
    position: entry.position ?? null,
    books: Array.isArray(entry.books)
      ? (entry.books[0] ?? null)
      : (entry.books ?? null),
  })) as BookEntry[];
}

async function fetchTop10Books() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("books")
    .select(
      `
      id,
      slug,
      title,
      cover_url,
      rating,
      books_genres (
        genres:genre_id ( id, label, slug )
      )
    `
    )
    .eq("is_published", true)
    .not("rating", "is", null)
    .order("rating", { ascending: false })
    .limit(10);

  return (
    data?.map((book) => ({
      id: book.id,
      slug: book.slug,
      title: book.title,
      cover_url: book.cover_url ?? null,
      rating: book.rating ?? 0,
      books_genres: book.books_genres?.map((g: any) => ({
        genres: g.genres ?? null,
      })),
    })) ?? []
  ) as Top10Book[];
}

async function fetchGenreRecommendations(
  genreId: string,
  excludeBookIds: string[]
) {
  if (!genreId) return [];
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("books")
    .select(
      `
      id,
      slug,
      title,
      cover_url,
      books_genres!inner ( genre_id ),
      books_authors (
        authors:author_id ( display_name, slug )
      )
    `
    )
    .eq("books_genres.genre_id", genreId)
    .eq("is_published", true);

  if (excludeBookIds.length > 0) {
    const formattedIds = excludeBookIds.map((id) => `'${id}'`).join(",");
    query = query.not("id", "in", `(${formattedIds})`);
  }

  const { data } = await query.limit(8);

  return (
    data?.map((book) => ({
      id: book.id,
      slug: book.slug,
      title: book.title,
      cover_url: book.cover_url ?? null,
      authors:
        book.books_authors?.map((entry: any) => entry.authors).filter(Boolean) ??
        [],
    })) ?? []
  );
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const author = await fetchAuthor(slug);
  if (!author) {
    return { title: "Author not found · IndieConverters" };
  }
  return {
    title: `${author.display_name} · IndieConverters`,
    description:
      author.short_bio ??
      "Discover IndieConverters authors, their books, and upcoming events.",
  };
}

export default async function AuthorPage({ params }: PageParams) {
  const { slug } = await params;
  const author = await fetchAuthor(slug);
  if (!author) notFound();

  const bookEntries = await fetchAuthorBooks(author.id);
  const authorBooks = bookEntries
    .map((entry) => entry.books)
    .filter((book): book is BookCard => Boolean(book));
  const featuredBook = authorBooks[0] ?? null;

  // Fetch TOP10 rated books
  const top10Books = await fetchTop10Books();

  const genreSet = new Set<string>();
  authorBooks.forEach((book) => {
    book.books_genres?.forEach((g) => {
      if (g.genres?.label) genreSet.add(g.genres.label);
    });
  });
  const topGenres = Array.from(genreSet).slice(0, 3);

  const primaryGenre = featuredBook?.books_genres?.[0]?.genres ?? null;
  const genreRecommendations =
    primaryGenre?.id
      ? await fetchGenreRecommendations(
          primaryGenre.id,
          authorBooks.map((book) => book.id)
        )
      : [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 sm:px-10 lg:py-20">
      <section className="grid gap-8 lg:grid-cols-2">
        {/* Card 1: Author overview */}
        <article className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-xl border border-white shadow-lg">
              <Image
                src={author.photo_url || fallbackPortrait}
                alt={author.display_name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 40vw, 160px"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
                Author
              </p>
              <h1 className="mt-2 text-4xl font-semibold text-zinc-900">
                {author.display_name}
              </h1>
              {topGenres.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {topGenres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {author.short_bio && (
            <p className="mt-6 text-base leading-relaxed text-zinc-600">
              {author.short_bio}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-[#F4511E] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d74415]"
            >
              Follow Author
            </button>
            {author.website_url && (
              <a
                href={author.website_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Website
              </a>
            )}
            <Link
              href={`/discover?author=${author.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
            >
              Browse titles
            </Link>
          </div>

          {featuredBook && (
            <div className="mt-8 flex gap-4 rounded-xl border border-zinc-100 bg-zinc-50 p-5">
              <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-white shadow">
                <Image
                  src={featuredBook.cover_url || fallbackCover}
                  alt={featuredBook.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                  Latest release
                </p>
                <h3 className="mt-1 text-lg font-semibold text-zinc-900">
                  {featuredBook.title}
                </h3>
                {featuredBook.description && (
                  <p className="mt-2 text-sm text-zinc-600 line-clamp-3">
                    {featuredBook.description}
                  </p>
                )}
                <Link
                  href={`/catalog/${featuredBook.slug}`}
                  className="mt-3 inline-flex text-sm font-semibold text-indigo-600"
                >
                  View details →
                </Link>
              </div>
            </div>
          )}
        </article>

        {/* Card 2: Author Biography */}
        <article className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900">
                About {author.display_name}
              </h2>
            </div>
          </div>

          <ExpandableBio 
            authorName={author.display_name}
            shortBio={author.short_bio}
            longBio={author.long_bio}
          />

          {/* Author Books Section */}
          {authorBooks.length > 0 && (
            <div className="mt-8 border-t border-zinc-100 pt-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
                    Publications
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-900">
                    Books by {author.display_name}
                  </h3>
                </div>
                {authorBooks.length > 3 && (
                  <Link
                    href={`/discover?author=${author.slug}`}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View all →
                  </Link>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {authorBooks.slice(0, 4).map((book) => (
                  <Link
                    key={book.id}
                    href={`/catalog/${book.slug}`}
                    className="group flex gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 transition hover:shadow-md hover:-translate-y-1"
                  >
                    <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white shadow">
                      <Image
                        src={book.cover_url || fallbackCover}
                        alt={book.title}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-900 line-clamp-2">
                        {book.title}
                      </h4>
                      <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                        {book.books_genres
                          ?.map((g) => g.genres?.label)
                          .filter(Boolean)
                          .join(", ") || "Genre TBD"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </section>

      {/* Promotional Banner Section */}
      <section className="mt-16">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 p-12 shadow-xl">
          <div className="relative z-10 max-w-4xl">
            <h3 className="text-4xl font-bold text-white mb-4">
              Publish your book with the largest independent self-publishing platform in the world
            </h3>
            <p className="text-lg text-white/90 mb-6">
              Distribute to major bookstores and online retailers across Europe and Brazil.
            </p>
            
            {/* Country Flags */}
            <div className="flex flex-wrap gap-3 mb-8">
              {['🇪🇸', '🇵🇹', '🇧🇷', '🇲🇽', '🇦🇷', '🇵🇪', '🇺🇾', '🇨🇱', '🇨🇴'].map((flag, i) => (
                <span key={i} className="text-4xl">
                  {flag}
                </span>
              ))}
            </div>

            <button className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-purple-700 shadow-lg transition hover:bg-purple-50 hover:scale-105">
              Start Your Publication
            </button>
          </div>
          
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10" />
        </div>
      </section>

      {/* TOP10 Books Section */}
      <section className="mt-16 rounded-xl bg-gradient-to-br from-zinc-50 to-white border border-zinc-100 p-10 shadow-sm">
        <div className="mb-8">
          <h3 className="text-3xl font-bold text-purple-700">
            Discover the TOP10 Independent Books
          </h3>
        </div>

        {top10Books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-8">
            {top10Books.map((book, index) => (
              <Link
                key={book.id}
                href={`/catalog/${book.slug}`}
                className="group"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-white shadow-md transition group-hover:shadow-xl group-hover:scale-105">
                  {/* Ranking Badge */}
                  <div className="absolute top-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-sm font-bold text-white shadow-lg">
                    {index + 1}
                  </div>
                  
                  {/* Rating Badge */}
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    <span>⭐</span>
                    <span>{book.rating.toFixed(1)}</span>
                  </div>

                  <Image
                    src={book.cover_url || fallbackCover}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                </div>
                <h4 className="mt-3 text-sm font-semibold text-zinc-900 line-clamp-2">
                  {book.title}
                </h4>
                <p className="mt-1 text-xs text-zinc-500">
                  {book.books_genres
                    ?.map((g) => g.genres?.label)
                    .filter(Boolean)
                    .join(", ") || "Fiction"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i}>
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 shadow-md" />
                <div className="mt-3 h-4 bg-zinc-200 rounded" />
                <div className="mt-2 h-3 bg-zinc-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        <div className="text-center">
          <Link
            href="/books"
            className="inline-flex items-center justify-center rounded-full border-2 border-purple-600 bg-white px-8 py-3 text-base font-semibold text-purple-600 transition hover:bg-purple-600 hover:text-white"
          >
            View All Books
          </Link>
        </div>
      </section>
    </main>
  );
}
