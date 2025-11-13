import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export const dynamic = "force-dynamic";

type SearchResultResponse = {
  books: {
    id: string;
    slug: string;
    title: string;
    author: string | null;
  }[];
  authors: {
    id: string;
    slug: string;
    display_name: string;
  }[];
  genres: {
    id: string;
    slug: string;
    label: string;
  }[];
};

const normalizeQuery = (value: string) =>
  value.replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "5");
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(1, Math.floor(limitParam)), 10)
    : 5;

  const rawQuery = normalizeQuery(searchParams.get("q") ?? "");
  if (!rawQuery) {
    return NextResponse.json<SearchResultResponse>({
      books: [],
      authors: [],
      genres: [],
    });
  }

  const supabase = createServerSupabaseClient();
  const wildcard = `%${rawQuery}%`;

  const [booksRes, authorsRes, genresRes] = await Promise.all([
    supabase
      .from("books")
      .select(
        `
        id,
        slug,
        title,
        books_authors (
          position,
          authors:author_id ( display_name )
        )
      `
      )
      .eq("is_published", true)
      .or(`title.ilike.${wildcard}`)
      .order("pub_date", { ascending: false })
      .limit(limit),
    supabase
      .from("authors")
      .select("id, slug, display_name")
      .or(`display_name.ilike.${wildcard}`)
      .order("display_name", { ascending: true })
      .limit(limit),
    supabase
      .from("genres")
      .select("id, slug, label")
      .or(`label.ilike.${wildcard},slug.ilike.${wildcard}`)
      .order("label", { ascending: true })
      .limit(limit),
  ]);

  if (booksRes.error || authorsRes.error || genresRes.error) {
    const message =
      booksRes.error?.message ??
      authorsRes.error?.message ??
      genresRes.error?.message ??
      "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const books =
    booksRes.data?.map((book) => ({
      id: book.id,
      slug: book.slug,
      title: book.title,
      author: book.books_authors?.[0]?.authors?.display_name ?? null,
    })) ?? [];

  return NextResponse.json<SearchResultResponse>({
    books,
    authors: authorsRes.data ?? [],
    genres: genresRes.data ?? [],
  });
}
