import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_BOOKS_API_KEY) {
  throw new Error(
    "Missing GOOGLE_BOOKS_API_KEY. Add it to .env and run `node --env-file=.env scripts/import-psych-books.mjs`."
  );
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const googleBookSchema = z.object({
  id: z.string(),
  volumeInfo: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    publishedDate: z.string().optional(),
    authors: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    imageLinks: z
      .object({
        thumbnail: z.string().url().optional(),
        small: z.string().url().optional(),
        smallThumbnail: z.string().url().optional(),
      })
      .partial()
      .optional(),
    industryIdentifiers: z
      .array(
        z.object({
          type: z.string(),
          identifier: z.string(),
        })
      )
      .optional(),
  }),
});

function buildGoogleBooksURL(params) {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("printType", "books");
  url.searchParams.set("maxResults", String(params.maxResults ?? 40));
  url.searchParams.set("startIndex", String(params.startIndex ?? 0));
  url.searchParams.set("q", params.query);
  if (params.orderBy) {
    url.searchParams.set("orderBy", params.orderBy);
  }
  url.searchParams.set("key", GOOGLE_BOOKS_API_KEY);
  return url;
}

async function fetchCategoryBooks(category, startIndex = 0, maxResults = 40, orderBy) {
  const url = buildGoogleBooksURL({
    query: `subject:${category}`,
    startIndex,
    maxResults,
    orderBy,
  });

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Books API error (${res.status}): ${await res.text()}`);
  }
  const json = await res.json();
  return z.array(googleBookSchema).parse(json.items ?? []);
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function upsertAuthor(name) {
  const slug = slugify(name);
  const { data, error } = await supabase
    .from("authors")
    .upsert({ slug, display_name: name }, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) {
    console.error("Author upsert failed:", name, error.message);
    return null;
  }
  return data?.id ?? null;
}

function normalizeDate(raw) {
  if (!raw) return null;
  // Accept formats: YYYY, YYYY-MM, YYYY-MM-DD
  const parts = raw.split("-");
  if (parts.length === 1 && parts[0].length === 4) {
    return `${parts[0]}-01-01`;
  }
  if (parts.length === 2) {
    const [year, month] = parts;
    return `${year}-${month.padStart(2, "0")}-01`;
  }
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return null;
}

async function upsertBook(item) {
  const info = item.volumeInfo;
  const pubDate = normalizeDate(info.publishedDate);
  const isbn13 =
    info.industryIdentifiers?.find((id) => id.type === "ISBN_13")?.identifier ??
    null;

  const { data: book, error } = await supabase
    .from("books")
    .upsert(
      {
        slug: item.id,
        title: info.title,
        subtitle: info.subtitle ?? null,
        description: info.description ?? null,
        cover_url:
          info.imageLinks?.thumbnail ??
          info.imageLinks?.small ??
          info.imageLinks?.smallThumbnail ??
          null,
        pub_date: pubDate,
        isbn13,
        formats: ["Paperback"],
        keywords: info.categories ?? [],
        is_published: true,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error || !book) {
    console.error("Book upsert failed:", info.title, error?.message);
    return null;
  }

  const authorNames = info.authors ?? ["Unknown Author"];
  for (const [index, name] of authorNames.entries()) {
    const authorId = await upsertAuthor(name);
    if (!authorId) continue;
    await supabase
      .from("books_authors")
      .upsert(
        { book_id: book.id, author_id: authorId, position: index + 1 },
        { onConflict: "book_id,author_id" }
      );
  }

  return book.id;
}

async function run() {
  console.log("Importing biography & memoir titles from Google Books…");
  const curatedQueries = [
    'intitle:"Becoming"+inauthor:"Michelle Obama"',
    'intitle:"Educated"+inauthor:"Tara Westover"',
    'intitle:"Born a Crime"+inauthor:"Trevor Noah"',
    'intitle:"When Breath Becomes Air"+inauthor:"Paul Kalanithi"',
    'intitle:"The Glass Castle"+inauthor:"Jeannette Walls"',
  ];

  for (const query of curatedQueries) {
    const item = await fetchBookByQuery(query);
    if (item) {
      await upsertBook(item);
    } else {
      console.warn("No result for query:", query);
    }
  }

  const bioItems = await fetchCategoryBooks("biography", 0, 5);
  for (const item of bioItems) {
    await upsertBook(item);
  }

  const fantasyItems = await fetchCategoryBooks("fantasy", 0, 5);
  for (const item of fantasyItems) {
    await upsertBook(item);
  }

  console.log("Fetching latest literary fiction highlights…");
  const literaryFictionItems = await fetchCategoryBooks("literary fiction", 0, 5, "newest");
  for (const item of literaryFictionItems) {
    await upsertBook(item);
  }

  console.log("Done!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
async function fetchBookByQuery(query) {
  const url = buildGoogleBooksURL({ query, startIndex: 0, maxResults: 5 });
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Books API error (${res.status}): ${await res.text()}`);
  }
  const json = await res.json();
  const items = z.array(googleBookSchema).parse(json.items ?? []);
  return items[0] ?? null;
}
