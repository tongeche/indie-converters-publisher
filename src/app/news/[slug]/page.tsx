import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

type Article = {
  title: string;
  dek: string | null;
  body: string | null;
  hero_image_url: string | null;
  published_at: string | null;
};

export default async function NewsArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("news_articles")
    .select("title, dek, body, hero_image_url, published_at")
    .eq("slug", params.slug)
    .eq("type", "news")
    .eq("is_published", true)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const article = data as Article;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16 sm:px-8 lg:py-20">
      <Link
        href="/news"
        className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
      >
        ← Back to newsroom
      </Link>

      <header className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-600">
          Newsroom
        </p>
        <h1 className="text-4xl font-semibold text-zinc-900">{article.title}</h1>
        {article.published_at && (
          <p className="text-sm text-zinc-500">
            Published {format(new Date(article.published_at), "MMMM d, yyyy")}
          </p>
        )}
        {article.dek && (
          <p className="text-base text-zinc-600">{article.dek}</p>
        )}
      </header>

      {article.hero_image_url && (
        <div className="relative h-80 w-full overflow-hidden rounded-3xl">
          <Image
            src={article.hero_image_url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      <article className="rounded-3xl bg-white p-8 shadow-sm shadow-indigo-100">
        {article.body ? (
          article.body.split("\n\n").map((paragraph, index) => (
            <p key={index} className="mb-5 text-base leading-relaxed text-zinc-700 last:mb-0">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-sm text-zinc-500">
            Add body content in Supabase to show the full article.
          </p>
        )}
      </article>
    </main>
  );
}
