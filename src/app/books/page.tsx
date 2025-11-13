import Image from "next/image";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

type Book = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_url: string | null;
  pub_date: string | null;
  formats: string[] | null;
  keywords: string[] | null;
  books_genres: {
    genres: { label: string; slug: string } | null;
  }[];
  books_authors: {
    authors: {
      display_name: string;
      slug: string;
    } | null;
  }[];
};

const fallbackCover =
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80";

export default async function BooksPage() {
  const supabase = createServerSupabaseClient();

  // Fetch all published books
  const { data: books } = await supabase
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
      books_genres (
        genres:genre_id ( label, slug )
      ),
      books_authors (
        authors:author_id ( display_name, slug )
      )
    `
    )
    .eq("is_published", true)
    .order("pub_date", { ascending: false });

  // Normalize the data structure
  const booksList: Book[] = (books || []).map((book: any) => ({
    ...book,
    books_genres: Array.isArray(book.books_genres)
      ? book.books_genres.map((entry: any) => ({
          genres: Array.isArray(entry.genres)
            ? (entry.genres[0] ?? null)
            : (entry.genres ?? null),
        }))
      : [],
    books_authors: Array.isArray(book.books_authors)
      ? book.books_authors.map((entry: any) => ({
          authors: Array.isArray(entry.authors)
            ? (entry.authors[0] ?? null)
            : (entry.authors ?? null),
        }))
      : [],
  }));

  const booksByGenre = booksList.reduce<Record<string, Book[]>>((acc, book) => {
    const genreName =
      book.books_genres.find((entry) => !!entry.genres)?.genres?.label ?? "Uncategorized";
    if (!acc[genreName]) {
      acc[genreName] = [];
    }
    acc[genreName].push(book);
    return acc;
  }, {});

  const genreEntries = Object.entries(booksByGenre).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <main className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-purple-900 via-[#451DB3] to-purple-800 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h1 className="text-5xl font-bold text-white">All Books</h1>
          <p className="mt-4 text-xl text-purple-100">
            Discover our complete catalog of published titles
          </p>
        </div>
      </section>

      {/* Books Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 space-y-12">
          {booksList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-16 text-center">
              <p className="text-xl text-zinc-600">No books available yet.</p>
              <p className="mt-2 text-sm text-zinc-500">
                Check back soon for new releases!
              </p>
            </div>
          ) : (
            genreEntries.map(([genreLabel, genreBooks], index) => (
              <div
                key={genreLabel}
                className={`space-y-6 rounded-3xl p-6 ${
                  index % 2 === 0 ? "bg-white" : "bg-zinc-50"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#451DB3]">
                      {genreLabel}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {genreBooks.length} title{genreBooks.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Link
                    href={`/discover?genre=${genreLabel.toLowerCase()}`}
                    className="text-sm font-semibold text-[#451DB3] hover:underline"
                  >
                    View more →
                  </Link>
                </div>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {genreBooks.slice(0, 8).map((book) => {
                    const author = book.books_authors[0]?.authors;

                return (
                  <Link
                    key={book.id}
                    href={`/catalog/${book.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                  >
                    {/* Book Cover */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-white">
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-200 to-pink-200">
                          <p className="p-6 text-center text-lg font-semibold text-purple-800">
                            {book.title}
                          </p>
                        </div>
                      )}
                      
                      {/* Tags Overlay */}
                      {book.keywords && book.keywords.length > 0 && (
                        <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1.5">
                          {book.keywords.slice(0, 3).map((tag: string) => {
                            // Determine tag styling based on tag type
                            let bgColor = "bg-purple-600";
                            let textColor = "text-white";
                            
                            if (tag.includes("new-release") || tag.includes("just-released")) {
                              bgColor = "bg-red-500";
                            } else if (tag.includes("staff-pick") || tag.includes("must-read")) {
                              bgColor = "bg-yellow-500";
                              textColor = "text-gray-900";
                            } else if (tag.includes("format:")) {
                              bgColor = "bg-blue-500";
                            } else if (tag.includes("genre:")) {
                              bgColor = "bg-purple-500";
                            }
                            
                            // Clean up tag display
                            const displayTag = tag
                              .replace("format:", "")
                              .replace("genre:", "")
                              .replace(/-/g, " ")
                              .split(" ")
                              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ");
                            
                            return (
                              <span
                                key={tag}
                                className={`${bgColor} ${textColor} px-2 py-0.5 text-[10px] font-semibold rounded-full backdrop-blur-sm bg-opacity-90 shadow-sm`}
                              >
                                {displayTag}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Book Details */}
                    <div className="flex flex-1 flex-col p-5">
                      {/* Author Name on Top */}
                      {author && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#C2185B]">
                          {author.display_name}
                        </p>
                      )}

                      {/* Book Title */}
                      <h3 className="mt-2 text-xl font-bold text-zinc-900 line-clamp-2 group-hover:text-[#C2185B] transition">
                        {book.title}
                      </h3>

                      {/* Subtitle */}
                      {book.subtitle && (
                        <p className="mt-1 text-sm text-zinc-600 line-clamp-1">
                          {book.subtitle}
                        </p>
                      )}

                      {/* Synopsis */}
                      <div className="mt-3 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                          Sinopse
                        </p>
                        {book.description && (
                          <p className="text-sm text-zinc-700 line-clamp-3">
                            {book.description}
                          </p>
                        )}
                      </div>

                      {/* Price & Button */}
                      <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
                        <div>
                          <p className="text-xs text-zinc-500">Print Version</p>
                          <p className="text-2xl font-bold text-[#C2185B]">
                            € 8,20
                          </p>
                        </div>
                        <button className="rounded-full bg-[#C2185B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a31545]">
                          Buy
                        </button>
                      </div>

                      {/* Formats */}
                      {book.formats && book.formats.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {book.formats.map((format) => (
                            <span
                              key={format}
                              className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700"
                            >
                              {format}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                );
                  })}
                </div>
                <hr className="border-t border-zinc-200" />
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
