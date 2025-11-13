````markdown
# Scripts

This directory contains utility scripts for managing the IndieConverters platform.

## classify-books.ts

Automatically assigns genres to books using OpenAI's GPT model based on book descriptions and keywords.

**Usage:**
```bash
npx tsx scripts/classify-books.ts
```

**Requirements:**
- `OPENAI_API_KEY` environment variable
- Supabase credentials

## generate-book-tags.ts

Generates dynamic discovery tags for books based on various attributes. This creates rich metadata for filtering and discovery on the book-selling page.

**Usage:**
```bash
npx tsx scripts/generate-book-tags.ts
```

**Requirements:**
- Supabase credentials

**Tag Categories Generated:**

1. **Format Tags** - Available formats
   - `format:ebook`, `format:paperback`, `format:hardcover`, `format:audiobook`

2. **Release Tags** - Publication timing
   - `new-release`, `just-released`, `coming-soon`, `pre-order`, `backlist`, `established`

3. **Genre Tags** - From genre relationships
   - `genre:{slug}` (e.g., `genre:science-fiction`, `genre:mystery`)

4. **Length Tags** - Reading commitment
   - `quick-read`, `bite-sized`, `immersive`, `detailed`

5. **Theme Tags** - Content attributes
   - `award-winning`, `series`, `debut-author`, `illustrated`, `true-story`

6. **Audience Tags** - Target readers
   - `young-adult`, `middle-grade`, `adult`

7. **Mood Tags** - Reading experience
   - `dark`, `suspenseful`, `uplifting`, `heartwarming`, `fast-paced`, `page-turner`
   - `thought-provoking`, `literary`, `emotional`, `humorous`, `witty`

8. **Season Tags** - Seasonal appeal
   - `holiday-read`, `cozy`, `summer-read`, `beach-read`, `gift-worthy`

9. **Discovery Tags** - Editorial/commercial
   - `staff-pick`, `reader-favorite`, `hidden-gem`, `trending`, `must-read`

### Tag System Architecture

The tagging system uses two database components:

1. **`books.tags`** - Array storing tag slugs for each book
2. **`book_tags`** table - Lookup table with tag metadata (label, category, color, description)

This separation allows:
- Fast filtering on books using GIN indexes
- Centralized tag management and UI configuration
- Easy addition of new tag categories
- Consistent tag display across the application

### Using Tags in the Application

**Filtering Books by Tag:**
```typescript
const { data } = await supabase
  .from('books')
  .select('*')
  .contains('tags', ['fast-paced', 'new-release']);
```

**Getting Tag Metadata:**
```typescript
const { data: tagInfo } = await supabase
  .from('book_tags')
  .select('*')
  .in('slug', ['fast-paced', 'new-release']);
```

**Display Tags with Colors:**
```tsx
{book.tags.map(tagSlug => {
  const tagInfo = tags.find(t => t.slug === tagSlug);
  return (
    <span 
      key={tagSlug}
      style={{ backgroundColor: tagInfo?.color }}
      className="px-2 py-1 rounded text-xs"
    >
      {tagInfo?.label || tagSlug}
    </span>
  );
})}
```

## generate-author-bios.ts

Automatically generates author biographies and website URLs using OpenAI's GPT-4 model.

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Add your OpenAI API key to `.env` or `.env.local`:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   # OR
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Usage

Run the script using npm:

```bash
npm run generate:author-bios
```

Or directly with tsx:

```bash
npx tsx scripts/generate-author-bios.ts
```

### What it does

1. Fetches all authors from the `authors` table in Supabase
2. Identifies authors with missing data:
   - `short_bio` (1-2 sentences)
   - `long_bio` (2-3 paragraphs)
   - `website_url` (realistic URL)
3. Uses OpenAI GPT-4 to generate missing content
4. Updates the database with generated content
5. Provides a summary report

### Features

- ✅ Only updates missing fields (preserves existing data)
- ✅ Rate limiting (1 second between requests)
- ✅ Error handling with detailed logging
- ✅ Validates OpenAI responses
- ✅ Works with real and fictional authors
- ✅ Shows progress for each author

### Output Example

```
🚀 Starting author bio generation script...

📚 Fetching authors from database...
✅ Found 12 authors

⏭️  Skipping Lexi Park (already has complete data)

📝 Processing: Erin Morgenstern
   Missing: long_bio
  🤖 Generating content for: Erin Morgenstern
  ✅ Successfully updated Erin Morgenstern

==================================================
📊 Summary:
   ✅ Successfully processed: 5
   ⏭️  Skipped (complete): 3
   ❌ Errors: 0
   📚 Total authors: 12
==================================================

✨ Script completed!
```

### Cost Estimation

- Uses `gpt-4o-mini` model
- Approximate cost: $0.01-0.02 per author (depending on content length)
- For 100 authors: ~$1-2

### Troubleshooting

**Error: OPENAI_API_KEY is not set**
- Make sure you've added `OPENAI_API_KEY` to your `.env` file
- Get an API key from https://platform.openai.com/api-keys

## generate-blog-posts.ts

Use OpenAI to draft polished IndieConverters blog posts and insert them into the `news_articles` table with `type = blog`.

**Usage:**
```bash
npx tsx scripts/generate-blog-posts.ts        # defaults to 4 posts
npx tsx scripts/generate-blog-posts.ts 6      # custom count
```

**What it does:**
1. Uses curated topics (distribution, marketing, hybrid launches, etc.) and prompts OpenAI (`gpt-4o-mini`) to return JSON with a title, slug, dek, hero image URL, and 5–7 paragraph body.
2. Upserts each post into Supabase with `is_published = true` and `type = 'blog'`.
3. Logs success/failure per post.

**Env requirements:**
- `OPENAI_API_KEY`
- `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (preferred) or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Posts immediately appear on `/blogs` and the blog strip on the home page.

**Error: Supabase credentials are not set**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are in `.env`

**Rate limiting errors**
- The script includes 1-second delays between requests
- If you hit rate limits, increase the delay in the code

**Invalid JSON responses**
- The script automatically strips markdown formatting
- Retries are not implemented - just re-run the script for failed authors
