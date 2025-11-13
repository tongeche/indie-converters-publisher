"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

type Genre = {
  id: string;
  slug: string;
  label: string;
};

export function GenresDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    // Fetch genres from API route
    fetch('/api/genres')
      .then(res => res.json())
      .then(data => setGenres(data))
      .catch(err => console.error('Failed to fetch genres:', err));
  }, []);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1 rounded-full px-3 py-1 text-white transition hover:bg-white/10 hover:text-white">
        Genres
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && genres.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-lg bg-white shadow-xl border border-zinc-200 py-2 z-50">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              href={`/catalog?genre=${genre.slug}`}
              className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition"
            >
              {genre.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
