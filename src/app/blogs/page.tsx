import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  hero_image_url: string | null;
  published_at: string | null;
};

export const metadata = {
  title: "Blog | IndieConverters",
  description:
    "Studio essays, author playbooks, and behind-the-scenes dispatches from IndieConverters.",
};

export default async function BlogsPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("news_articles")
    .select("id, slug, title, dek, hero_image_url, published_at")
    .eq("is_published", true)
    .eq("type", "blog")
    .order("published_at", { ascending: false })
    .limit(24);

  const posts = (data ?? []) as BlogPost[];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:px-10 lg:py-20">
      <section className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#8a20f9]">
          Blog
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-900">
          Studio Notes & Author Playbooks
        </h1>
        <p className="mt-3 text-base text-zinc-600">
          Essays from our editors, marketing strategists, and IndieConverters
          authors covering craft, distribution, and building a sustainable
          career.
        </p>
      </section>

      {posts.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-12 text-center text-sm text-zinc-600">
          No blog posts yet. Insert records into `news_articles` with
          <code className="mx-1 rounded bg-zinc-200 px-1 py-0.5 text-xs">type = blog</code>
          to populate this feed.
        </section>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blogs/${post.slug}`}
              className="group rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-56 w-full overflow-hidden rounded-t-3xl bg-zinc-100">
                {post.hero_image_url ? (
                  <Image
                    src={post.hero_image_url}
                    alt={post.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Add a hero_image_url to showcase this post.
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 p-6">
                {post.published_at && (
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#8a20f9]">
                    {format(new Date(post.published_at), "MMM d, yyyy")}
                  </p>
                )}
                <h2 className="text-xl font-semibold text-zinc-900">
                  {post.title}
                </h2>
                <p className="text-sm text-zinc-600 line-clamp-3">
                  {post.dek ?? "Add a dek to summarize this blog post."}
                </p>
                <span className="text-sm font-semibold text-[#8a20f9]">
                  Read article →
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
