import Image from "next/image";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string | string[];
};

type BookResult = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  books_authors: {
    position: number | null;
    authors: { display_name: string; slug: string }[] | null;
  }[];
};

type AuthorResult = {
  id: string;
  slug: string;
  display_name: string;
  short_bio: string | null;
  photo_url: string | null;
};

type GenreResult = {
  id: string;
  slug: string;
  label: string;
};

const coerceQueryParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

const normalizeQuery = (query: string) =>
  query.replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim();

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const rawQuery = coerceQueryParam(searchParams.q).trim();
  const query = normalizeQuery(rawQuery);

  if (!query) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 sm:px-10">
        <section className="rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-indigo-600">
            Search
          </p>
          <h1 className="mt-4 text-4xl font-bold text-zinc-900">
            Start typing to discover authors, books, and genres.
          </h1>
          <p className="mt-3 text-zinc-600">
            Use the header search bar to explore the IndieConverters catalog.
          </p>
        </section>
      </main>
    );
  }

  const supabase = createServerSupabaseClient();
  const wildcard = `%${query}%`;

  const [booksRes, authorsRes, genresRes] = await Promise.all([
    supabase
      .from("books")
      .select(
        `
        id,
        slug,
        title,
        description,
        cover_url,
        books_authors (
          position,
          authors:author_id ( display_name, slug )
        )
      `
      )
      .eq("is_published", true)
      .or(`title.ilike.${wildcard},description.ilike.${wildcard}`)
      .order("pub_date", { ascending: false })
      .limit(10),
    supabase
      .from("authors")
      .select("id, slug, display_name, short_bio, photo_url")
      .or(`display_name.ilike.${wildcard},short_bio.ilike.${wildcard}`)
      .order("display_name", { ascending: true })
      .limit(10),
    supabase
      .from("genres")
      .select("id, slug, label")
      .or(`label.ilike.${wildcard},slug.ilike.${wildcard}`)
      .order("label", { ascending: true })
      .limit(10),
  ]);

  const books = (booksRes.data ?? []) as BookResult[];
  const authors = (authorsRes.data ?? []) as AuthorResult[];
  const genres = (genresRes.data ?? []) as GenreResult[];

  const hasResults = books.length > 0 || authors.length > 0 || genres.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 sm:px-10">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
          Search Results
        </p>
        <h1 className="mt-3 text-4xl font-bold text-zinc-900">
          “{rawQuery}”
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          Showing matches across books, authors, and genres.
        </p>
      </header>

      {!hasResults ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center text-zinc-600">
          <p className="text-lg font-semibold">No results found.</p>
          <p className="mt-2 text-sm">
            Try searching for a different title, author, or genre.
          </p>
        </div>
      ) : (
        <>
          <section>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                  Books
                </p>
                <p className="text-sm text-zinc-500">
                  {books.length > 0
                    ? `${books.length} result${books.length === 1 ? "" : "s"}`
                    : "No matches"}
                </p>
              </div>
              {books.length > 0 && (
                <Link
                  href="/discover"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Browse catalog →
                </Link>
              )}
            </div>
            {books.length > 0 ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {books.map((book) => {
                  const primaryAuthor = book.books_authors?.[0]?.authors?.[0];
                  return (
                    <Link
                      key={book.id}
                      href={`/catalog/${book.slug}`}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                        {book.cover_url ? (
                          <Image
                            src={book.cover_url}
                            alt={book.title}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-100 to-pink-100 p-6 text-center text-base font-semibold text-zinc-700">
                            {book.title}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-5">
                        <h3 className="text-lg font-semibold text-zinc-900 line-clamp-2 group-hover:text-indigo-600">
                          {book.title}
                        </h3>
                        {book.description && (
                          <p className="text-sm text-zinc-600 line-clamp-3">
                            {book.description}
                          </p>
                        )}
                        {primaryAuthor && (
                          <p className="text-sm font-medium text-zinc-500">
                            {primaryAuthor.display_name}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                No books matched this search.
              </p>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                  Authors
                </p>
                <p className="text-sm text-zinc-500">
                  {authors.length > 0
                    ? `${authors.length} match${authors.length === 1 ? "" : "es"}`
                    : "No matches"}
                </p>
              </div>
              {authors.length > 0 && (
                <Link
                  href="/authors"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  View authors →
                </Link>
              )}
            </div>
            {authors.length > 0 ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {authors.map((author) => (
                  <Link
                    key={author.id}
                    href={`/authors/${author.slug}`}
                    className="group rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-full bg-zinc-100">
                        {author.photo_url ? (
                          <Image
                            src={author.photo_url}
                            alt={author.display_name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-zinc-500">
                            {author.display_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 group-hover:text-indigo-600">
                          {author.display_name}
                        </h3>
                        {author.short_bio && (
                          <p className="text-sm text-zinc-600 line-clamp-2">
                            {author.short_bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                No authors matched this search.
              </p>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                  Genres
                </p>
                <p className="text-sm text-zinc-500">
                  {genres.length > 0
                    ? `${genres.length} match${genres.length === 1 ? "" : "es"}`
                    : "No matches"}
                </p>
              </div>
              {genres.length > 0 && (
                <Link
                  href="/discover"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Explore genres →
                </Link>
              )}
            </div>
            {genres.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {genres.map((genre) => (
                  <Link
                    key={genre.id}
                    href={`/discover?genre=${genre.slug}`}
                    className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5 transition hover:-translate-y-1 hover:border-indigo-100 hover:bg-white"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
                      {genre.slug}
                    </p>
                    <h3 className="mt-2 text-lg font-medium text-zinc-900">
                      {genre.label}
                    </h3>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                No genres matched this search.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
