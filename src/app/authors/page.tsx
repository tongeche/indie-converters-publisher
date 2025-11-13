"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type Genre = {
  id: string;
  slug: string;
  label: string;
};

type AuthorCard = {
  id: string;
  slug: string;
  display_name: string;
  short_bio: string | null;
  photo_url: string | null;
  genres?: string[]; // Array of genre IDs
};

const fallbackPortrait =
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80";

export default function AuthorsIndexPage() {
  const [authors, setAuthors] = useState<AuthorCard[]>([]);
  const [filteredAuthors, setFilteredAuthors] = useState<AuthorCard[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [displayedCount, setDisplayedCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "recent">("name");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      const supabase = createBrowserSupabaseClient();
      
      // Fetch all genres
      const { data: genresData } = await supabase
        .from("genres")
        .select("id, slug, label")
        .order("label", { ascending: true });
      
      setGenres((genresData ?? []) as Genre[]);

      // Fetch authors with their associated genres
      const { data: authorsData } = await supabase
        .from("authors")
        .select("id, slug, display_name, short_bio, photo_url")
        .order("display_name", { ascending: true });

      if (authorsData) {
        // For each author, fetch their genres through books
        const authorsWithGenres = await Promise.all(
          authorsData.map(async (author) => {
            const { data: authorGenres } = await supabase
              .from("books_authors")
              .select(`
                book_id,
                books!inner(
                  books_genres!inner(
                    genre_id
                  )
                )
              `)
              .eq("author_id", author.id);

            // Extract unique genre IDs
            const genreIds = new Set<string>();
            authorGenres?.forEach((ba: any) => {
              ba.books?.books_genres?.forEach((bg: any) => {
                if (bg.genre_id) genreIds.add(bg.genre_id);
              });
            });

            return {
              ...author,
              genres: Array.from(genreIds)
            };
          })
        );

        setAuthors(authorsWithGenres as AuthorCard[]);
        setFilteredAuthors(authorsWithGenres as AuthorCard[]);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  // Filter and sort authors
  useEffect(() => {
    let result = [...authors];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(author =>
        author.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        author.short_bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by selected genres
    if (selectedGenres.length > 0) {
      result = result.filter(author =>
        author.genres?.some(genreId => selectedGenres.includes(genreId))
      );
    }

    // Sort
    if (sortBy === "name") {
      result.sort((a, b) => a.display_name.localeCompare(b.display_name));
    } else {
      result.reverse(); // Recent (reverse order)
    }

    setFilteredAuthors(result);
    setDisplayedCount(6); // Reset to show first 6 when filters change
  }, [searchQuery, sortBy, selectedGenres, authors]);

  const displayedAuthors = filteredAuthors.slice(0, displayedCount);
  const hasMore = displayedCount < filteredAuthors.length;

  const handleSeeMore = () => {
    setDisplayedCount(prev => prev + 6);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSortBy("name");
    setSelectedGenres([]);
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-purple-900 via-[#451DB3] to-purple-800 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-purple-200">
            Authors
          </p>
          <h1 className="mt-3 text-5xl font-bold text-white">
            Voices across the IndieConverters roster
          </h1>
          <p className="mt-4 text-xl text-purple-100">
            Every profile below is editable via Supabase. Click through to see
            spotlight titles, bios, and editorial CTAs.
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="border-b border-zinc-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Bar */}
            <div className="flex-1 lg:max-w-md">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search authors by name or bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border-2 border-purple-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-zinc-900 placeholder-zinc-400 transition focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 hover:text-zinc-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-purple-900">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "recent")}
                  className="rounded-full border-2 border-purple-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-purple-300 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100"
                >
                  <option value="name">A-Z</option>
                  <option value="recent">Recent</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="rounded-full bg-white border-2 border-purple-200 px-4 py-2">
                <span className="text-sm font-semibold text-purple-900">
                  {filteredAuthors.length} {filteredAuthors.length === 1 ? "author" : "authors"}
                </span>
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || sortBy !== "name" || selectedGenres.length > 0) && (
                <button
                  onClick={handleClearFilters}
                  className="rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-200"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Genre Filter Pills */}
          {genres.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-purple-900">Filter by genre:</p>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-purple-600 text-white shadow-lg ring-2 ring-purple-300"
                          : "bg-white border-2 border-purple-200 text-purple-900 hover:border-purple-400 hover:bg-purple-50"
                      }`}
                    >
                      {genre.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(searchQuery || sortBy !== "name" || selectedGenres.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-purple-900">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-900">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:text-purple-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {sortBy !== "name" && (
                <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-900">
                  Sort: Recent
                  <button
                    onClick={() => setSortBy("name")}
                    className="hover:text-purple-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {selectedGenres.map((genreId) => {
                const genre = genres.find(g => g.id === genreId);
                return genre ? (
                  <span key={genreId} className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-900">
                    {genre.label}
                    <button
                      onClick={() => toggleGenre(genreId)}
                      className="hover:text-purple-700"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      </section>

      {/* Authors Grid */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-600">Loading authors...</p>
          </div>
        ) : authors.length > 0 ? (
          <>
            <section className="mb-12">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayedAuthors.map((author) => (
                  <Link
                    key={author.id}
                    href={`/authors/${author.slug}`}
                    className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                  >
                    <div className="relative h-64 w-full bg-zinc-100">
                      <Image
                        src={author.photo_url || fallbackPortrait}
                        alt={author.display_name}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">
                          Author
                        </p>
                        <h2 className="text-2xl font-bold text-white">
                          {author.display_name}
                        </h2>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-zinc-600 line-clamp-3">
                        {author.short_bio ?? "Add a short bio in Supabase."}
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#451DB3] group-hover:gap-3 transition-all">
                        View profile →
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* See More Button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={handleSeeMore}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-4 text-lg font-semibold text-white shadow-xl transition hover:scale-[1.02] hover:shadow-2xl"
                >
                  See more authors
                </button>
                <p className="mt-4 text-sm text-zinc-600">
                  Showing {displayedCount} of {authors.length} authors
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-12 text-center">
            <p className="text-xl text-zinc-600">No authors found.</p>
            <p className="mt-2 text-sm text-zinc-500">
              Seed the `authors` table or create entries in Supabase Studio.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

