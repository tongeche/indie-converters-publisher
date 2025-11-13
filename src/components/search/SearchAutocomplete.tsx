"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Book, User, Tag } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type SearchResult = {
  type: "book" | "author" | "genre";
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  image?: string;
};

export function SearchAutocomplete() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      await performSearch(query);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function performSearch(searchQuery: string) {
    const supabase = createBrowserSupabaseClient();
    const searchTerm = `%${searchQuery}%`;

    const [booksRes, authorsRes, genresRes] = await Promise.all([
      supabase
        .from("books")
        .select("id, slug, title, cover_url, books_authors(authors:author_id(display_name))")
        .ilike("title", searchTerm)
        .eq("is_published", true)
        .limit(3),
      supabase
        .from("authors")
        .select("id, slug, display_name, photo_url")
        .ilike("display_name", searchTerm)
        .limit(3),
      supabase
        .from("genres")
        .select("id, slug, label")
        .or(`label.ilike.${searchTerm},slug.ilike.${searchTerm}`)
        .limit(3),
    ]);

    const searchResults: SearchResult[] = [];

    // Add books
    if (booksRes.data) {
      booksRes.data.forEach((book: any) => {
        const authorName = book.books_authors?.[0]?.authors?.display_name;
        searchResults.push({
          type: "book",
          id: book.id,
          title: book.title,
          subtitle: authorName ? `by ${authorName}` : undefined,
          slug: book.slug,
          image: book.cover_url || undefined,
        });
      });
    }

    // Add authors
    if (authorsRes.data) {
      authorsRes.data.forEach((author) => {
        searchResults.push({
          type: "author",
          id: author.id,
          title: author.display_name,
          subtitle: "Author",
          slug: author.slug,
          image: author.photo_url || undefined,
        });
      });
    }

    // Add genres
    if (genresRes.data) {
      genresRes.data.forEach((genre) => {
        searchResults.push({
          type: "genre",
          id: genre.id,
          title: genre.label,
          subtitle: "Genre",
          slug: genre.slug,
        });
      });
    }

    setResults(searchResults);
    setIsOpen(searchResults.length > 0);
  }

  function handleSelect(result: SearchResult) {
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);

    if (result.type === "book") {
      router.push(`/catalog/${result.slug}`);
    } else if (result.type === "author") {
      router.push(`/authors/${result.slug}`);
    } else if (result.type === "genre") {
      router.push(`/discover?genre=${result.slug}`);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setQuery("");
        setIsOpen(false);
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }

  function getIcon(type: SearchResult["type"]) {
    switch (type) {
      case "book":
        return <Book className="h-4 w-4" />;
      case "author":
        return <User className="h-4 w-4" />;
      case "genre":
        return <Tag className="h-4 w-4" />;
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search books, authors..."
          className="w-full rounded-full bg-white/10 backdrop-blur-sm border border-white/20 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition"
        />
      </form>

      {/* Autocomplete dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-zinc-500">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                    index === selectedIndex
                      ? "bg-purple-50"
                      : "hover:bg-zinc-50"
                  }`}
                >
                  {result.image ? (
                    <img
                      src={result.image}
                      alt={result.title}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 text-[#461E89]">
                      {getIcon(result.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-zinc-900">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="truncate text-xs text-zinc-500">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 capitalize">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {/* Show all results link */}
          {query.trim() && (
            <div className="border-t border-zinc-100 p-2">
              <button
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(query)}`);
                  setQuery("");
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[#461E89] transition hover:bg-purple-50"
              >
                <Search className="h-4 w-4" />
                See all results for "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
