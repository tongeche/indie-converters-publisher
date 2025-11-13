import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

type Genre = {
  id: string;
  slug: string;
  label: string;
};

type GenreCard = Genre & {
  featured_author?: Author | null;
};

type HighlightBook = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  pub_date: string | null;
  formats: string[] | null;
  imprints: { name: string | null; slug: string | null }[] | null;
  books_authors: {
    position: number | null;
    authors: { display_name: string; slug: string }[] | null;
  }[];
};

type Author = {
  id: string;
  slug: string;
  display_name: string;
  short_bio: string | null;
  photo_url: string | null;
};

type NewsArticle = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  hero_image_url: string | null;
  published_at: string | null;
};

const fallbackAuthorPhoto =
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80";

const hashSlug = (value: string) =>
  Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);

export default async function Home() {
  const supabase = createServerSupabaseClient();

  const [genresRes, highlightsRes, authorsRes, comingSoonRes, newsRes] = await Promise.all([
    supabase
      .from("genres")
      .select("id, slug, label")
      .order("label", { ascending: true })
      .limit(6),
    supabase
      .from("books")
      .select(
        `
        id,
        slug,
        title,
        description,
        cover_url,
        pub_date,
        formats,
        imprints:imprint_id ( name, slug ),
        books_authors (
          position,
          authors:author_id ( display_name, slug )
        )
      `
      )
      .eq("is_published", true)
      .order("pub_date", { ascending: false })
      .limit(10),
    supabase
      .from("authors")
      .select("id, slug, display_name, short_bio, photo_url")
      .order("created_at", { ascending: true })
      .limit(4),
    supabase
      .from("books")
      .select(
        `
        id,
        slug,
        title,
        cover_url,
        pub_date
      `
      )
      .eq("is_published", false)
      .not("pub_date", "is", null)
      .gte("pub_date", new Date().toISOString().split('T')[0])
      .order("pub_date", { ascending: true })
      .limit(10),
    supabase
      .from("news_articles")
      .select("id, slug, title, dek, hero_image_url, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(4),
  ]);

  const highlights = (highlightsRes.data ?? []) as HighlightBook[];
  const authors = (authorsRes.data ?? []) as Author[];
  const comingSoon = (comingSoonRes.data ?? []) as HighlightBook[];
  const newsArticles = (newsRes.data ?? []) as NewsArticle[];
  const genres = ((genresRes.data ?? []) as Genre[]).map<GenreCard>((genre) => {
    const index =
      authors.length > 0 ? hashSlug(genre.slug) % authors.length : -1;
    const featured_author = index >= 0 ? authors[index] : null;
    return { ...genre, featured_author };
  });

  return (
    <main className="flex w-full flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/assets/services-hero-image.png"
            alt="Indie author working outdoors"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-[#34146d]/90 to-[#4b1e9d]/90" />
        </div>

        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center text-white lg:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/70">
            IndieConverters
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Transform your manuscript into a global release.
          </h1>
          <p className="text-lg text-white/80">
            We combine editorial craftsmanship, design, and digital distribution so independent authors can publish at scale across every major retailer.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-white/80">
            {["Editing", "Design", "Distribution", "Analytics"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/30 px-4 py-1"
              >
                {item}
              </span>
            ))}
          </div>
          <Link
            href="/publish"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-orange-400 px-10 py-4 text-lg font-semibold text-white shadow-xl transition hover:scale-[1.02] hover:shadow-2xl"
          >
            Publish now
          </Link>
        </div>
      </section>

      {/* Content Sections */}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-16 sm:px-10 lg:py-20">

      {/* How It Works Section */}
      <section className="relative overflow-hidden rounded-xl bg-[#FAFAFA] p-8 md:p-12 shadow-lg">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Book Image */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative w-64 h-80 md:w-80 md:h-96">
              <Image
                src="/assets/book-demo.png"
                alt="Your Book"
                fill
                className="object-contain drop-shadow-2xl"
                sizes="(max-width: 768px) 256px, 320px"
              />
            </div>
          </div>

          {/* Right: How It Works Content */}
          <div className="text-black">
            <Link
              href="/publish"
              className="inline-block mb-6 rounded-full bg-[#461E89] hover:bg-[#5a2aaa] px-6 py-2.5 text-sm font-semibold text-white transition"
            >
              Publish Your Book
            </Link>

            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-black">
              How It Works
            </h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#461E89] flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-black">
                    You publish your book online, free of charge.
                  </h3>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#461E89] flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-black">
                    You set your royalty rate.
                  </h3>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#461E89] flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-black">
                    We sell your book and you receive direct deposits to your account.
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editors Recommend Section */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
              SPOTLIGHT
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
              Editors recommend
            </h2>
          </div>
          <Link
            href="/discover"
            className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Discover more
          </Link>
        </div>

        {highlights.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.slice(0, 4).map((book, index) => {
              const author = book.books_authors[0]?.authors?.[0];
              const imprint = book.imprints?.[0];

              return (
                <Link
                  key={book.id}
                  href={`/catalog/${book.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-zinc-100">
                    {book.cover_url ? (
                      <Image
                        src={book.cover_url}
                        alt={book.title}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 15vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-100 to-pink-100 p-4 text-center text-sm font-semibold text-zinc-700">
                        {book.title}
                      </div>
                    )}
                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-zinc-700 shadow-sm">
                      #{index + 1}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-4">
                    {imprint?.name && (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-500">
                        {imprint.name}
                      </p>
                    )}
                    <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2">
                      {book.title}
                    </h3>
                    {book.description && (
                      <p className="text-xs text-zinc-600 line-clamp-2">{book.description}</p>
                    )}
                    {author && (
                      <p className="text-xs font-medium text-zinc-500">{author.display_name}</p>
                    )}
                    <p className="mt-auto text-xs font-semibold text-indigo-600">
                      Details →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
            No published books yet. Add books with `is_published = true` to feature them here.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
              Discover
            </p>
          </div>
          <Link
            href="/discover"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Discover more
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {genres.length > 0 ? (
            genres.map((genre) => (
              <Link
                key={genre.id}
                href={`/discover?genre=${genre.slug}`}
                className="group block rounded-2xl border border-zinc-100 bg-zinc-50 p-5 transition hover:-translate-y-1 hover:border-indigo-100 hover:shadow-md"
              >
                <article className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
                        {genre.slug}
                      </p>
                      <h3 className="mt-2 text-lg font-medium text-zinc-900">
                        {genre.label}
                      </h3>
                    </div>
                    {genre.featured_author && (
                      <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white shadow-sm">
                        <Image
                          src={genre.featured_author.photo_url ?? fallbackAuthorPhoto}
                          alt={genre.featured_author.display_name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {genre.featured_author
                      ? `Featuring ${genre.featured_author.display_name}`
                      : "Add an author portrait to spotlight this genre."}
                  </p>
                </article>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
              No genres yet. Seed them via `supabase/seed/seed.sql` or Supabase Studio.
            </div>
          )}
        </div>
      </section>

      {/* New Releases Section */}
      <section className="py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-zinc-900">New Releases</h2>
          <div className="mt-4 mx-auto w-24 border-t-4 border-zinc-900"></div>
        </div>

        {highlights.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {highlights.map((book) => (
              <Link
                key={book.id}
                href={`/catalog/${book.slug}`}
                className="group"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-100 shadow-md transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 p-4">
                      <p className="text-center text-sm font-semibold text-zinc-700">
                        {book.title}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center rounded-3xl border border-dashed border-zinc-200 p-12 text-zinc-600">
            <p className="text-lg">No published books yet.</p>
            <p className="mt-2 text-sm">Insert rows with `is_published = true` to populate new releases.</p>
          </div>
        )}

        {/* Pagination Dots (optional, for carousel effect) */}
        {highlights.length > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-zinc-900"></div>
            <div className="h-2 w-2 rounded-full bg-zinc-300"></div>
            <div className="h-2 w-2 rounded-full bg-zinc-300"></div>
          </div>
        )}
      </section>

      {/* Our Authors Section */}
      <section className="py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-zinc-900 uppercase tracking-wider">Our Authors</h2>
          <div className="mt-4 mx-auto w-24 border-t-4 border-zinc-300"></div>
        </div>

        {authors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {authors.map((author) => (
              <Link
                key={author.id}
                href={`/authors/${author.slug}`}
                className="group"
              >
                <div className="bg-white rounded-lg overflow-hidden shadow-lg transition-all duration-300 group-hover:shadow-2xl">
                  <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                    {author.photo_url ? (
                      <Image
                        src={author.photo_url}
                        alt={author.display_name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <div className="text-6xl text-gray-400">
                          {author.display_name.charAt(0)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-white p-6 text-center border-t border-zinc-100">
                    <h3 className="text-xl font-semibold text-zinc-800">
                      {author.display_name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center rounded-3xl border border-dashed border-zinc-200 p-12 text-zinc-600">
            <p className="text-lg">No authors yet.</p>
            <p className="mt-2 text-sm">Add authors to your database to populate this section.</p>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/authors"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-300"
          >
            More Authors →
          </Link>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-12 bg-zinc-50">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-zinc-900">Coming Soon</h2>
          <div className="mt-4 mx-auto w-24 border-t-4 border-zinc-900"></div>
        </div>

        {comingSoon.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {comingSoon.map((book) => (
              <Link
                key={book.id}
                href={`/catalog/${book.slug}`}
                className="group"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-100 shadow-md transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 p-4">
                      <p className="text-center text-sm font-semibold text-zinc-700">
                        {book.title}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center rounded-3xl border border-dashed border-zinc-200 p-12 text-zinc-600 bg-white">
            <p className="text-lg">No upcoming books yet.</p>
            <p className="mt-2 text-sm">Add future books with publication dates to populate this section.</p>
          </div>
        )}

        {/* Pagination Dots */}
        {comingSoon.length > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-zinc-900"></div>
            <div className="h-2 w-2 rounded-full bg-zinc-300"></div>
            <div className="h-2 w-2 rounded-full bg-zinc-300"></div>
          </div>
        )}
      </section>

      {/* Top 5 Independent Books Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-[#C2185B] mb-4">
              Discover the TOP 5 independent books of the month:
            </h2>
          </div>

          {highlights.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {highlights.slice(0, 3).map((book) => {
                const author = book.books_authors[0]?.authors?.[0];
                
                return (
                  <Link
                    key={book.id}
                    href={`/catalog/${book.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          priority
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-pink-200 to-purple-300">
                          <p className="text-center text-lg font-semibold text-white p-6">
                            {book.title}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-zinc-900 line-clamp-2 group-hover:text-[#C2185B] transition">
                        {book.title}
                      </h3>
                      {author && (
                        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-zinc-600">
                          {author.display_name}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-zinc-600">
              <p className="text-lg">No books available yet.</p>
              <p className="mt-2 text-sm">Add published books to showcase in the top 5.</p>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-full bg-[#C2185B] px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-[#a31545] hover:shadow-xl"
            >
              View All Books
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-12">
        <div className="mb-8">
          <h2 className="text-5xl font-bold text-zinc-900">Blog</h2>
        </div>

        {newsArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsArticles.slice(0, 3).map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group"
              >
                <article className="relative overflow-hidden rounded-3xl shadow-lg transition-all duration-300 group-hover:shadow-2xl">
                  {/* Image Background */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {article.hero_image_url ? (
                      <Image
                        src={article.hero_image_url}
                        alt={article.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-purple-400 via-pink-400 to-red-400" />
                    )}
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                  </div>

                  {/* Content overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="mb-3 text-xl font-bold line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span>Read</span>
                      <svg 
                        className="h-4 w-4 transition-transform group-hover:translate-x-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center rounded-3xl border border-dashed border-zinc-200 p-12 text-zinc-600 bg-white">
            <p className="text-lg">No blog posts yet.</p>
            <p className="mt-2 text-sm">Add news articles to populate this section.</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/news"
            className="inline-flex items-center justify-center rounded-full border-2 border-cyan-400 bg-transparent px-8 py-3 text-base font-semibold text-cyan-600 transition hover:bg-cyan-50"
          >
            Show all
          </Link>
        </div>
      </section>

      {/* Bundles/Services Section */}
      <BundlesSection />

      </div>
    </main>
  );
}

// Bundles Section Component
async function BundlesSection() {
  const supabase = createServerSupabaseClient();
  
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(4);

  return (
    <section className="py-12">
      <div className="mb-8">
        <h2 className="text-5xl font-bold text-zinc-900">Bundles</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[440px,1fr] gap-6">
        {/* Left: CTA Card */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 p-10 text-white shadow-lg">
          <h3 className="mb-4 text-3xl font-bold">Buy more, pay less</h3>
          <p className="mb-8 text-lg text-white/90">
            A quick start to your business with ultimate packs for eCommerce stores!
          </p>
          <Link
            href="/services"
            className="inline-flex items-center justify-center rounded-lg border-2 border-white bg-transparent px-6 py-3 font-semibold text-white transition hover:bg-white hover:text-blue-600"
          >
            Choose your pack
          </Link>
        </div>

        {/* Right: Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services && services.length > 0 ? (
            services.map((service: any) => (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="group flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500">
                    {service.icon_url ? (
                      <Image
                        src={service.icon_url}
                        alt={service.name}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    ) : (
                      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="mb-1 text-base font-bold text-zinc-900 line-clamp-2 group-hover:text-blue-600 transition">
                    {service.name}
                  </h3>
                  
                  {/* Reviews & Price */}
                  <div className="mb-2 flex items-center gap-2 text-sm">
                    {service.review_count > 0 && (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="text-orange-400">★</span>
                          <span className="font-semibold text-zinc-700">{service.rating}</span>
                          <span className="text-zinc-400">({service.review_count})</span>
                        </div>
                      </>
                    )}
                    {!service.review_count && (
                      <span className="text-zinc-400 text-xs">★ No reviews</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-zinc-900">${service.price}</span>
                    {service.original_price && service.original_price > service.price && (
                      <>
                        <span className="text-sm text-zinc-400 line-through">${service.original_price}</span>
                        <span className="rounded bg-orange-400 px-2 py-0.5 text-xs font-bold text-white">
                          save {Math.round(((service.original_price - service.price) / service.original_price) * 100)}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  {service.short_description && (
                    <p className="mt-2 text-xs text-zinc-600 line-clamp-2">
                      {service.short_description}
                    </p>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-2 rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center text-zinc-600">
              <p>No services available yet.</p>
              <p className="mt-1 text-sm">Add services to populate this section.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

