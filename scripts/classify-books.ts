#!/usr/bin/env tsx

/**
 * Script to classify books by genre using OpenAI and update Supabase relationships.
 *
 * Usage:
 *   npx tsx scripts/classify-books.ts
 *
 * Required environment variables:
 *   - OPENAI_API_KEY
 *   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY (read/write limited)
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is not set.");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Supabase credentials are not set.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type Genre = {
  id: string;
  slug: string;
  label: string;
};

type Book = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  keywords: string[] | null;
  books_genres: { genre_id: string | null }[];
};

async function fetchGenres(): Promise<Genre[]> {
  const { data, error } = await supabase
    .from("genres")
    .select("id, slug, label")
    .order("label");

  if (error || !data) {
    throw new Error(`Failed to fetch genres: ${error?.message}`);
  }

  return data as Genre[];
}

async function fetchUnclassifiedBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select(
      `
      id,
      slug,
      title,
      description,
      keywords,
      books_genres ( genre_id )
    `
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error(`Failed to fetch books: ${error?.message}`);
  }

  return data as Book[];
}

async function classifyBook(
  book: Book,
  genres: Genre[]
): Promise<string[] | null> {
  if (!book.description) {
    console.warn(`⚠️  Skipping ${book.title} (no description)`);
    return null;
  }

  const genreList = genres
    .map((genre) => `${genre.slug}: ${genre.label}`)
    .join("\n");

  const prompt = `You are a publishing data specialist. You are given a book title, synopsis, and optional keywords.
Choose up to 2 genres from the provided list that best fit this book. Only use the provided genre slugs.
If nothing is suitable, return an empty array.

Return ONLY valid JSON with this shape:
{ "genres": ["slug-one", "slug-two"] }

Available genres:
${genreList}

Book title: ${book.title}
Synopsis: ${book.description}
Keywords: ${(book.keywords ?? []).join(", ") || "None"}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "You classify books for a publishing catalog. Always respond with strict JSON and never include markdown fences.",
        },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("No content returned from OpenAI.");

    const cleanContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const result = JSON.parse(cleanContent) as { genres?: string[] };
    return Array.isArray(result.genres) ? result.genres.slice(0, 2) : [];
  } catch (error) {
    console.error(`❌ OpenAI classification failed for ${book.title}:`, error);
    return null;
  }
}

async function upsertBookGenres(bookId: string, genreSlugs: string[], genres: Genre[]) {
  // Remove existing relations for this book before inserting new ones
  const { error: deleteError } = await supabase
    .from("books_genres")
    .delete()
    .eq("book_id", bookId);

  if (deleteError) {
    console.error(`   ⚠️  Failed to clear previous genres for ${bookId}:`, deleteError.message);
  }

  const insertPayload = genreSlugs
    .map((slug) => genres.find((genre) => genre.slug === slug))
    .filter((genre): genre is Genre => Boolean(genre))
    .map((genre) => ({
      book_id: bookId,
      genre_id: genre.id,
    }));

  if (insertPayload.length === 0) {
    console.warn(`⚠️  No valid genres to insert for book ${bookId}.`);
    return;
  }

  const { error } = await supabase
    .from("books_genres")
    .upsert(insertPayload, { onConflict: "book_id,genre_id" });

  if (error) {
    throw new Error(`Failed to upsert genres: ${error.message}`);
  }
}

async function main() {
  console.log("📚 Starting book classification...");

  const genres = await fetchGenres();
  console.log(`✅ Loaded ${genres.length} genres.`);

  const books = await fetchUnclassifiedBooks();
  if (books.length === 0) {
    console.log("ℹ️  All books already have genre classifications.");
    return;
  }
  console.log(`🔎 Classifying ${books.length} books without genres...\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const book of books) {
    console.log(`🎯 ${book.title}`);
    const genreSlugs = await classifyBook(book, genres);

    if (!genreSlugs || genreSlugs.length === 0) {
      console.log("   ↳ No genres returned. Skipping.");
      skipCount++;
      continue;
    }

    try {
      await upsertBookGenres(book.id, genreSlugs, genres);
      console.log(`   ↳ Assigned genres: ${genreSlugs.join(", ")}`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to save genres for ${book.title}:`, error);
      errorCount++;
    }
  }

  console.log("\n✅ Classification complete.");
  console.log(
    `   Success: ${successCount}, Skipped: ${skipCount}, Errors: ${errorCount}`
  );
}

main().catch((error) => {
  console.error("❌ Script crashed:", error);
  process.exit(1);
});
