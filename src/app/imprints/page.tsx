import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

type Imprint = {
  id: string;
  slug: string;
  name: string;
  mission: string | null;
  hero_image_url: string | null;
};

type ImprintBook = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  imprints: { name: string | null }[] | null;
};

export const metadata = {
  title: "Imprints | IndieConverters",
  description:
    "Explore IndieConverters imprints, their missions, and featured titles sourced directly from Supabase.",
};

export default async function ImprintsPage() {
  const supabase = createServerSupabaseClient();

  const [imprintsRes, featuredBooksRes] = await Promise.all([
    supabase
      .from("imprints")
      .select("id, slug, name, mission, hero_image_url")
      .order("created_at", { ascending: true }),
    supabase
      .from("books")
      .select(
        `
        id,
        slug,
        title,
        cover_url,
        imprints:imprint_id ( name )
      `
      )
      .eq("is_published", true)
      .not("imprint_id", "is", null)
      .order("pub_date", { ascending: false })
      .limit(8),
  ]);

  const imprints = (imprintsRes.data ?? []) as Imprint[];
  const featuredBooks = (featuredBooksRes.data ?? []) as ImprintBook[];

  const fallbackHero =
    "https://images.unsplash.com/photo-1455885666463-1ea8d96c6733?auto=format&fit=crop&w=1600&q=80";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 sm:px-10 lg:py-20">
      <section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-[#07090F] via-[#1B114C] to-[#451DB3] p-10 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-purple-200">
              Imprints
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
              Mission-driven collectives for every IndieConverters reader.
            </h1>
            <p className="mt-4 text-base text-purple-100 sm:text-lg">
              Each imprint is fully managed via Supabase tables. Seed or insert
              your own missions, hero imagery, and highlight titles to craft a
              marketing-friendly hub.
            </p>
          </div>
          <Link
            href="/instructions"
            className="rounded-full bg-white/90 px-5 py-3 text-sm font-semibold text-[#1B114C] transition hover:bg-white"
          >
            Edit via Supabase
          </Link>
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        {imprints.length > 0 ? (
          imprints.map((imprint) => (
            <article
              key={imprint.id}
              className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm"
            >
              <div className="relative h-56 w-full bg-zinc-100">
                <Image
                  src={imprint.hero_image_url || fallbackHero}
                  alt={imprint.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
                    Imprint
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    {imprint.name}
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-zinc-600">
                  {imprint.mission ?? "Add a mission statement for this imprint."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/imprints/${imprint.slug}`}
                    className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    View imprint
                  </Link>
                  <Link
                    href={`/catalog?imprint=${imprint.slug}`}
                    className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400"
                  >
                    View catalog
                  </Link>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
            No imprints found. Seed `public.imprints` via SQL or Supabase Studio.
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
              Featured titles
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
              Books by imprint
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Pulled from the `books` table with imprint associations.
            </p>
          </div>
          <Link
            href="/discover"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400"
          >
            View discover
          </Link>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredBooks.length > 0 ? (
            featuredBooks.map((book) => (
              <Link
                key={book.id}
                href={`/catalog/${book.slug}`}
                className="group rounded-3xl border border-zinc-100 bg-zinc-50 p-4 shadow-sm transition hover:shadow-lg"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-zinc-200">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={book.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-sm text-zinc-600">
                      Add a cover to showcase this title.
                    </div>
                  )}
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                  {book.imprints?.[0]?.name ?? "Imprint TBD"}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-zinc-900">
                  {book.title}
                </h3>
              </Link>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
              Publish books with `imprint_id` to populate this grid.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
