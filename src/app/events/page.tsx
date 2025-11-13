import Link from "next/link";
import { format } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

type Event = {
  id: string;
  slug: string;
  title: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  body: string | null;
  hero_image_url: string | null;
};

export const metadata = {
  title: "Events | IndieConverters",
  description:
    "Stay close to IndieConverters tours, readings, and community gatherings powered by Supabase data.",
};

export default async function EventsPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("events")
    .select(
      "id, slug, title, location, starts_at, ends_at, body, hero_image_url"
    )
    .eq("is_published", true)
    .order("starts_at", { ascending: true });

  const events = (data ?? []) as Event[];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:px-10 lg:py-20">
      <section className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
          Community
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-900">
          Events & author sightings
        </h1>
        <p className="mt-3 text-base text-zinc-600">
          All events below are fetched straight from Supabase. Keep your tours,
          launches, and workshops in sync by editing the database directly.
        </p>
        <Link
          href="/submissions"
          className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Request an appearance
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {events.length > 0 ? (
          events.map((event) => (
            <article
              key={event.id}
              className="flex flex-col rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative h-56 w-full overflow-hidden rounded-t-3xl bg-zinc-100">
                {event.hero_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.hero_image_url}
                    alt={event.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Upload a hero image in Supabase.
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                  <span>{format(new Date(event.starts_at), "MMM d, yyyy")}</span>
                  {event.location && (
                    <span className="text-zinc-400">• {event.location}</span>
                  )}
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-zinc-900">
                  {event.title}
                </h2>
                <p className="mt-3 flex-1 text-sm text-zinc-600">
                  {event.body ?? "Add a description in Supabase to tease details."}
                </p>
                <Link
                  href={`/events/${event.slug}`}
                  className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
                >
                  Event details →
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
            No events yet. Seed the `events` table or add entries via Supabase
            Studio.
          </div>
        )}
      </section>
    </main>
  );
}

