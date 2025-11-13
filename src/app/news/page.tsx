import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

type NewsArticle = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  hero_image_url: string | null;
  published_at: string | null;
};

export const metadata = {
  title: "Newsroom | IndieConverters",
  description:
    "Latest announcements, editorials, and community highlights from IndieConverters.",
};

export default async function NewsIndexPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("news_articles")
    .select("id, slug, title, dek, hero_image_url, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(24);

  const articles = (data ?? []) as NewsArticle[];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:px-10 lg:py-20">
      <section className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
          Newsroom
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-900">
          IndieConverters Dispatch
        </h1>
        <p className="mt-3 text-base text-zinc-600">
          Press releases, editor conversations, submission spotlights, and
          community news—direct from our Supabase-powered editorial team.
        </p>
      </section>

      {articles.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-12 text-center text-sm text-zinc-600">
          No published news yet. Add records to the `news_articles` table to
          populate this feed.
        </section>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className="group rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-56 w-full overflow-hidden rounded-t-3xl bg-zinc-100">
                {article.hero_image_url ? (
                  <Image
                    src={article.hero_image_url}
                    alt={article.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Add hero_image_url to showcase this story.
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 p-6">
                {article.published_at && (
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500">
                    {format(new Date(article.published_at), "MMM d, yyyy")}
                  </p>
                )}
                <h2 className="text-xl font-semibold text-zinc-900">
                  {article.title}
                </h2>
                <p className="text-sm text-zinc-600 line-clamp-3">
                  {article.dek ?? "Add a dek in Supabase to tease this article."}
                </p>
                <span className="text-sm font-semibold text-indigo-600">
                  Read feature →
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

