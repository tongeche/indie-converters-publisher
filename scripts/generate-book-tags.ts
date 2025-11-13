#!/usr/bin/env tsx

/**
 * Script to generate dynamic tags for books based on various attributes.
 * Tags help with filtering, discovery, and marketing on the book-selling page.
 *
 * Usage:
 *   npx tsx scripts/generate-book-tags.ts
 *
 * Required environment variables:
 *   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Supabase credentials are not set.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type Book = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  pub_date: string | null;
  formats: string[];
  keywords: string[];
  books_genres: { genres: { label: string; slug: string } }[];
  books_authors: { authors: { display_name: string } }[];
};

/**
 * Tag generation strategies for an interactive book-selling page:
 * 
 * 1. FORMAT TAGS: Available formats (eBook, Paperback, Audiobook, Hardcover)
 * 2. RELEASE TAGS: New releases, Coming soon, Bestseller potential
 * 3. GENRE TAGS: From genre relationships
 * 4. LENGTH TAGS: Quick read, Epic read (based on description length as proxy)
 * 5. THEME TAGS: Award winner, Debut author, Series
 * 6. AUDIENCE TAGS: Young adult, Adult, All ages
 * 7. MOOD TAGS: Dark, Uplifting, Thought-provoking, Fast-paced
 * 8. SEASON TAGS: Summer read, Holiday gift, Beach read
 * 9. TRENDING TAGS: Staff pick, Reader favorite, Hidden gem
 * 10. PRICE TAGS: Budget-friendly, Premium edition
 */

function generateFormatTags(formats: string[]): string[] {
  return formats.map(format => `format:${format.toLowerCase()}`);
}

function generateReleaseTags(pubDate: string | null): string[] {
  if (!pubDate) return [];
  
  const date = new Date(pubDate);
  const now = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  
  const tags: string[] = [];
  
  // Future release
  if (date > now) {
    tags.push("coming-soon", "pre-order");
  }
  // Released in last 3 months
  else if (date > threeMonthsAgo) {
    tags.push("new-release", "just-released");
  }
  // Classic (over 2 years old)
  else if (date.getFullYear() < now.getFullYear() - 2) {
    tags.push("backlist", "established");
  }
  
  return tags;
}

function generateGenreTags(genres: { label: string; slug: string }[]): string[] {
  return genres.map(genre => `genre:${genre.slug}`);
}

function generateLengthTags(description: string | null): string[] {
  if (!description) return [];
  
  const wordCount = description.split(/\s+/).length;
  
  // Using description length as a proxy for book complexity
  if (wordCount > 500) {
    return ["detailed", "immersive"];
  } else if (wordCount < 200) {
    return ["quick-read", "bite-sized"];
  }
  
  return [];
}

function generateThemeTags(
  title: string,
  description: string | null,
  keywords: string[],
  authors: { display_name: string }[]
): string[] {
  const tags: string[] = [];
  const text = `${title} ${description || ""} ${keywords.join(" ")}`.toLowerCase();
  
  // Award indicators
  if (text.match(/award|prize|winner|finalist/i)) {
    tags.push("award-winning");
  }
  
  // Series indicators
  if (text.match(/book \d+|volume \d+|part \d+|series/i) || title.match(/:\s*book/i)) {
    tags.push("series");
  }
  
  // Debut author (simple heuristic - would need author book count)
  if (text.match(/debut|first novel|first book/i)) {
    tags.push("debut-author");
  }
  
  // Illustrated
  if (text.match(/illustrated|illustrations|pictures|artwork/i)) {
    tags.push("illustrated");
  }
  
  // Based on true story
  if (text.match(/true story|based on|memoir|biography/i)) {
    tags.push("true-story");
  }
  
  return tags;
}

function generateAudienceTags(
  title: string,
  description: string | null,
  genres: { label: string }[]
): string[] {
  const tags: string[] = [];
  const text = `${title} ${description || ""} ${genres.map(g => g.label).join(" ")}`.toLowerCase();
  
  if (text.match(/young adult|ya|teen|teenage/i)) {
    tags.push("young-adult");
  }
  
  if (text.match(/middle grade|children|kids|ages 8-12/i)) {
    tags.push("middle-grade");
  }
  
  if (text.match(/adult fiction|mature themes/i) || (!tags.length && genres.length > 0)) {
    tags.push("adult");
  }
  
  return tags;
}

function generateMoodTags(description: string | null, keywords: string[]): string[] {
  if (!description) return [];
  
  const tags: string[] = [];
  const text = `${description} ${keywords.join(" ")}`.toLowerCase();
  
  // Dark/Light spectrum
  if (text.match(/dark|thriller|mystery|suspense|noir|gothic/i)) {
    tags.push("dark", "suspenseful");
  }
  
  if (text.match(/uplifting|heartwarming|feel-good|inspiring|hope/i)) {
    tags.push("uplifting", "heartwarming");
  }
  
  // Pacing
  if (text.match(/fast-paced|action|thriller|page-turner|gripping/i)) {
    tags.push("fast-paced", "page-turner");
  }
  
  if (text.match(/contemplative|literary|thoughtful|philosophical/i)) {
    tags.push("thought-provoking", "literary");
  }
  
  // Emotional
  if (text.match(/emotional|tear-jerker|moving|poignant/i)) {
    tags.push("emotional");
  }
  
  if (text.match(/funny|humor|comedy|hilarious|witty/i)) {
    tags.push("humorous", "witty");
  }
  
  return tags;
}

function generateSeasonTags(
  pubDate: string | null,
  description: string | null,
  keywords: string[]
): string[] {
  const tags: string[] = [];
  const text = `${description || ""} ${keywords.join(" ")}`.toLowerCase();
  
  // Holiday themed
  if (text.match(/christmas|holiday|winter|snow|cozy/i)) {
    tags.push("holiday-read", "cozy");
  }
  
  // Summer themed
  if (text.match(/summer|beach|vacation|tropical/i)) {
    tags.push("summer-read", "beach-read");
  }
  
  // Gift-worthy
  if (text.match(/gift|collection|anthology|special edition/i)) {
    tags.push("gift-worthy");
  }
  
  return tags;
}

function generateDiscoveryTags(): string[] {
  // These would typically be set manually or based on sales data
  // For now, we'll randomly assign some for demo purposes
  const discoveryTags = [
    "staff-pick",
    "reader-favorite", 
    "hidden-gem",
    "trending",
    "must-read",
  ];
  
  // Randomly select 1-2 tags (10% chance for each book)
  if (Math.random() < 0.1) {
    return [discoveryTags[Math.floor(Math.random() * discoveryTags.length)]];
  }
  
  return [];
}

function generateAllTags(book: Book): string[] {
  const allTags: string[] = [];
  
  // Extract related data
  const genres = book.books_genres.map(bg => bg.genres);
  const authors = book.books_authors.map(ba => ba.authors);
  
  // Generate tags from different sources
  allTags.push(...generateFormatTags(book.formats));
  allTags.push(...generateReleaseTags(book.pub_date));
  allTags.push(...generateGenreTags(genres));
  allTags.push(...generateLengthTags(book.description));
  allTags.push(...generateThemeTags(book.title, book.description, book.keywords, authors));
  allTags.push(...generateAudienceTags(book.title, book.description, genres));
  allTags.push(...generateMoodTags(book.description, book.keywords));
  allTags.push(...generateSeasonTags(book.pub_date, book.description, book.keywords));
  allTags.push(...generateDiscoveryTags());
  
  // Remove duplicates and return
  return Array.from(new Set(allTags)).sort();
}

async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select(`
      id,
      slug,
      title,
      description,
      pub_date,
      formats,
      keywords,
      books_genres (
        genres (
          label,
          slug
        )
      ),
      books_authors (
        authors (
          display_name
        )
      )
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error(`Failed to fetch books: ${error?.message}`);
  }

  return data as unknown as Book[];
}

async function updateBookTags(bookId: string, tags: string[]): Promise<void> {
  // Store tags in the dedicated tags array column
  const { error } = await supabase
    .from("books")
    .update({ tags: tags })
    .eq("id", bookId);

  if (error) {
    throw new Error(`Failed to update tags for book ${bookId}: ${error.message}`);
  }
}

async function main() {
  console.log("🏷️  Starting book tag generation...\n");

  const books = await fetchBooks();
  console.log(`✅ Loaded ${books.length} published books.\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const book of books) {
    console.log(`📖 ${book.title}`);
    
    try {
      const tags = generateAllTags(book);
      
      // Merge with existing tags (if any), keeping unique values
      const existingTags = book.keywords || []; // Keep original keywords separate
      const allTags = Array.from(new Set([...tags]));
      
      await updateBookTags(book.id, allTags);
      
      console.log(`   ✓ Generated ${tags.length} tags: ${tags.slice(0, 5).join(", ")}${tags.length > 5 ? "..." : ""}`);
      console.log(`   ↳ Total tags: ${allTags.length}\n`);
      
      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to generate tags for ${book.title}:`, error);
      errorCount++;
    }
  }

  console.log("\n✅ Tag generation complete.");
  console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
  
  // Print tag summary
  console.log("\n📊 Tag Categories Generated:");
  console.log("   • Format tags (eBook, Paperback, etc.)");
  console.log("   • Release tags (New release, Coming soon, etc.)");
  console.log("   • Genre tags (from genre relationships)");
  console.log("   • Length tags (Quick read, Immersive, etc.)");
  console.log("   • Theme tags (Award-winning, Series, Debut, etc.)");
  console.log("   • Audience tags (Young adult, Adult, etc.)");
  console.log("   • Mood tags (Dark, Uplifting, Fast-paced, etc.)");
  console.log("   • Season tags (Summer read, Holiday, etc.)");
  console.log("   • Discovery tags (Staff pick, Hidden gem, etc.)");
}

main().catch((error) => {
  console.error("❌ Script crashed:", error);
  process.exit(1);
});
