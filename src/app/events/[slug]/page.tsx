import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

async function fetchEvent(slug: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("events")
    .select(
      "id, slug, title, location, starts_at, ends_at, body, hero_image_url"
    )
    .eq("slug", slug)
    .single();

  return data;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const event = await fetchEvent(params.slug);
  if (!event) {
    return {
      title: "Event not found · IndieConverters",
    };
  }

  return {
    title: `${event.title} · IndieConverters`,
    description: event.body?.slice(0, 140) ?? "Event details from IndieConverters.",
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = await fetchEvent(params.slug);
  if (!event) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16 sm:px-10 lg:py-20">
      <Link
        href="/events"
        className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
      >
        ← Back to events
      </Link>

      <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative h-72 w-full overflow-hidden rounded-t-3xl bg-zinc-100">
          {event.hero_image_url ? (
            <Image
              src={event.hero_image_url}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1000px"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Upload a hero image to Supabase for richer previews.
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-5 left-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">
              {format(new Date(event.starts_at), "MMM d, yyyy")}
            </p>
            <h1 className="text-3xl font-semibold">{event.title}</h1>
            {event.location && <p className="text-sm text-white/80">{event.location}</p>}
          </div>
        </div>

        <div className="space-y-4 p-8">
          <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
            <p>
              <strong>Starts:</strong> {format(new Date(event.starts_at), "PPpp")}
            </p>
            {event.ends_at && (
              <p>
                <strong>Ends:</strong> {format(new Date(event.ends_at), "PPpp")}
              </p>
            )}
          </div>

          <div className="prose max-w-none text-zinc-700">
            {event.body ? (
              <p>{event.body}</p>
            ) : (
              <p>Describe this event in Supabase to share more context.</p>
            )}
          </div>

          <Link
            href="/submissions"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Contact events team
          </Link>
        </div>
      </section>
    </main>
  );
}
