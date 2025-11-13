import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

type AuthorCard = {
  id: string;
  slug: string;
  display_name: string;
  short_bio: string | null;
  photo_url: string | null;
};

const fallbackPortrait =
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80";

export const metadata = {
  title: "Authors | IndieConverters",
  description:
    "Browse IndieConverters authors and jump into their spotlight pages powered by Supabase.",
};

export default async function AuthorsIndexPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("authors")
    .select("id, slug, display_name, short_bio, photo_url")
    .order("display_name", { ascending: true });

  const authors = (data ?? []) as AuthorCard[];

  // Split authors into chunks of 6 (2 rows × 3 cols)
  const chunkSize = 6;
  const authorChunks: AuthorCard[][] = [];
  for (let i = 0; i < authors.length; i += chunkSize) {
    authorChunks.push(authors.slice(i, i + chunkSize));
  }

  // Highlight banners data
  const highlights = [
    {
      title: "Discover New Voices",
      description: "Explore emerging authors bringing fresh perspectives to indie publishing",
      bgColor: "from-purple-600 to-indigo-600",
      icon: "✨"
    },
    {
      title: "Award-Winning Authors",
      description: "Celebrating literary excellence and storytelling mastery",
      bgColor: "from-pink-600 to-rose-600",
      icon: "🏆"
    },
    {
      title: "International Writers",
      description: "Stories from around the world, united by creative vision",
      bgColor: "from-blue-600 to-cyan-600",
      icon: "🌍"
    }
  ];

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

      {/* Alternating Sections */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        {authors.length > 0 ? (
          authorChunks.map((chunk, chunkIndex) => (
            <div key={chunkIndex}>
              {/* Author Grid Section */}
              <section className="mb-16">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {chunk.map((author) => (
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

              {/* Highlight Banner Section (after each chunk except the last) */}
              {chunkIndex < authorChunks.length - 1 && (
                <section className="mb-16">
                  <div 
                    className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${
                      highlights[chunkIndex % highlights.length].bgColor
                    } p-12 shadow-xl`}
                  >
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <span className="text-6xl mb-4">
                        {highlights[chunkIndex % highlights.length].icon}
                      </span>
                      <h3 className="text-3xl font-bold text-white mb-3">
                        {highlights[chunkIndex % highlights.length].title}
                      </h3>
                      <p className="text-lg text-white/90 max-w-2xl">
                        {highlights[chunkIndex % highlights.length].description}
                      </p>
                      <button className="mt-6 rounded-full bg-white px-8 py-3 text-sm font-semibold text-purple-900 shadow-lg transition hover:bg-purple-50 hover:scale-105">
                        Explore Authors
                      </button>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                  </div>
                </section>
              )}
            </div>
          ))
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

