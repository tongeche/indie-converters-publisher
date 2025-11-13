import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

type Genre = {
  id: string;
  slug: string;
  label: string;
};

type BookSpotlight = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  description: string | null;
  imprints: { name: string | null }[] | null;
  books_authors: {
    authors: { display_name: string }[] | null;
  }[];
};

type Editorial = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  hero_image_url: string | null;
  published_at: string | null;
};

type EventPreview = {
  id: string;
  slug: string;
  title: string;
  location: string | null;
  starts_at: string;
  hero_image_url: string | null;
};

export const metadata = {
  title: "Discover | IndieConverters",
  description:
    "Explore genres, editorial spotlights, and events from the IndieConverters community.",
};

const accentColors = [
  "from-[#FDE1D3] to-[#F5C6AA]",
  "from-[#E3F2FD] to-[#BBDEFB]",
  "from-[#EDE7F6] to-[#D1C4E9]",
  "from-[#FFF9C4] to-[#FFE082]",
  "from-[#F1F8E9] to-[#DCEDC8]",
  "from-[#FCE4EC] to-[#F8BBD0]",
];

// Helper function to truncate text to a specific word count
function truncateWords(text: string | null, maxWords: number): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

export default async function DiscoverPage() {
  const supabase = createServerSupabaseClient();

  const [genresRes, booksRes, newsRes, eventsRes] = await Promise.all([
    supabase
      .from("genres")
      .select("id, slug, label")
      .order("label", { ascending: true })
      .limit(9),
    supabase
      .from("books")
      .select(
        `
        id,
        slug,
        title,
        description,
        cover_url,
        imprints:imprint_id ( name ),
        books_authors (
          authors:author_id ( display_name )
        )
      `
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("news_articles")
      .select("id, slug, title, dek, hero_image_url, published_at")
      .eq("is_published", true)
      .eq("type", "news")
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("events")
      .select("id, slug, title, location, starts_at, hero_image_url")
      .eq("is_published", true)
      .order("starts_at", { ascending: true })
      .limit(4),
  ]);

  const genres = (genresRes.data ?? []) as Genre[];
  const spotlights = (booksRes.data ?? []) as BookSpotlight[];
  const editorials = (newsRes.data ?? []) as Editorial[];
  const events = (eventsRes.data ?? []) as EventPreview[];

  return (
    <main className="flex w-full flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/assets/services-hero-image.png"
            alt="Discover independent books"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-[#34146d]/90 to-[#4b1e9d]/90" />
        </div>

        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center text-white lg:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/70">
            Discover
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Explore and discover your next great read.
          </h1>
          <p className="text-lg text-white/80">
            Browse genre collections, meet talented authors, and dive into editorial conversations. Discover indie books that inspire, entertain, and transform.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-white/80">
            {["Fiction", "Non-Fiction", "Poetry", "Memoir"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/30 px-4 py-1"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-orange-400 px-10 py-4 text-lg font-semibold text-white shadow-xl transition hover:scale-[1.02] hover:shadow-2xl"
            >
              Discover more
            </Link>
        
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 sm:px-10 lg:py-20">

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
              Browse by mood
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
              Genre ribbons
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Tap into curated stacks based on Supabase genre rows.
            </p>
          </div>
          <Link
            href="/catalog"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400"
          >
            All genres
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {genres.length > 0 ? (
            genres.map((genre, idx) => (
              <Link
                key={genre.id}
                href={`/catalog?genre=${genre.slug}`}
                className={`rounded-3xl border border-zinc-100 bg-gradient-to-r ${
                  accentColors[idx % accentColors.length]
                } p-6 shadow-sm transition hover:shadow-lg`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600">
                  {genre.slug}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-zinc-900">
                  {genre.label}
                </h3>
                <p className="mt-2 text-sm text-zinc-700">
                  Browse titles tagged with {genre.label}.
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
              No genres yet. Seed them via Supabase to light up this grid.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
              Spotlight
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
              Editors recommend
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Pulling directly from the published books table.
            </p>
          </div>
          <Link
            href="/books"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            View catalog
          </Link>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {spotlights.length > 0 ? (
            spotlights.map((book) => (
              <article
                key={book.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-50"
              >
                <div className="relative h-64 w-full bg-zinc-200">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-zinc-600">
                      Upload a cover to showcase this book.
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                    {book.imprints?.[0]?.name ?? "Imprint TBD"}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-zinc-900">
                    {book.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-zinc-600">
                    {truncateWords(book.description, 39) || "Add jacket copy for richer previews."}
                  </p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {(() => {
                      const names =
                        book.books_authors
                          ?.flatMap((pivot) => pivot.authors ?? [])
                          .map((author) => author.display_name)
                          .filter(Boolean) ?? [];
                      return names.length > 0 ? names.join(" · ") : "Author TBD";
                    })()}
                  </p>
                  <Link
                    href={`/catalog/${book.slug}`}
                    className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
                  >
                    Dive in →
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
              Publish at least one book (`is_published = true`) to power this
              module.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
              Editorial hub
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
              News & features
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Straight from `news_articles`—perfect for thought leadership posts.
            </p>
          </div>
          <Link
            href="/news"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400"
          >
            View newsroom
          </Link>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {editorials.length > 0 ? (
            editorials.map((article) => (
              <article
                key={article.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-50"
              >
                <div className="relative h-48 w-full bg-zinc-200">
                  {article.hero_image_url ? (
                    <Image
                      src={article.hero_image_url}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                      Add hero_image_url to showcase this feature.
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  {article.published_at && (
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                      {format(new Date(article.published_at), "MMM d, yyyy")}
                    </p>
                  )}
                  <h3 className="mt-3 text-xl font-semibold text-zinc-900">
                    {article.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-zinc-600">
                    {article.dek ?? "Add a dek field to tease this story."}
                  </p>
                  <Link
                    href={`/news/${article.slug}`}
                    className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
                  >
                    Read feature →
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
              Publish news articles in Supabase to unlock the editorial feed.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
              Events
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
              Tours & readings
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Hooked to `events` with date + location metadata.
            </p>
          </div>
          <Link
            href="/events"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Full calendar
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {events.length > 0 ? (
            events.map((event) => (
              <article
                key={event.id}
                className="flex items-center gap-5 rounded-3xl border border-zinc-100 bg-zinc-50 p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white shadow-sm">
                    {event.hero_image_url ? (
                      <Image
                        src={event.hero_image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-[10px] font-semibold uppercase text-zinc-500">
                        Event
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500">
                      {format(new Date(event.starts_at), "MMM")}
                    </p>
                    <p className="text-3xl font-semibold text-zinc-900">
                      {format(new Date(event.starts_at), "dd")}
                    </p>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {event.title}
                  </h3>
                  <p className="text-sm text-zinc-600">
                    {event.location ?? "Location coming soon"}
                  </p>
                  <Link
                    href={`/events/${event.slug}`}
                    className="mt-2 inline-flex items-center text-sm font-semibold text-indigo-600"
                  >
                    Event details →
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
              Add upcoming events to showcase author tours and festivals.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/80 p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
          Keep exploring
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-zinc-900">
          Ready to wire submissions, newsletters, and more?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Follow the rest of the roadmap in{" "}
          <code className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-800">
            Instructions.md
          </code>{" "}
          to finish the full IndieConverters experience.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/submissions"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Build submissions
          </Link>
          <Link
            href="/newsletter"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400"
          >
            Newsletter endpoint
          </Link>
        </div>
      </section>

      </div>
    </main>
  );
}
