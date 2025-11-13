"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type AuthorCard = {
  id: string;
  slug: string;
  display_name: string;
  short_bio: string | null;
  photo_url: string | null;
};

const fallbackPortrait =
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80";

export default function AuthorsIndexPage() {
  const [authors, setAuthors] = useState<AuthorCard[]>([]);
  const [displayedCount, setDisplayedCount] = useState(6);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuthors() {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase
        .from("authors")
        .select("id, slug, display_name, short_bio, photo_url")
        .order("display_name", { ascending: true });

      setAuthors((data ?? []) as AuthorCard[]);
      setLoading(false);
    }

    fetchAuthors();
  }, []);

  const displayedAuthors = authors.slice(0, displayedCount);
  const hasMore = displayedCount < authors.length;

  const handleSeeMore = () => {
    setDisplayedCount(prev => prev + 6);
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

