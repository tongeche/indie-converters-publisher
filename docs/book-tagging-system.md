# Book Tagging System for Interactive Book Selling

## Overview

A comprehensive tagging system designed for an indie publishing platform's book-selling page. The system generates dynamic tags based on book metadata, enabling rich filtering, discovery, and personalized recommendations.

## System Components

### 1. Database Schema

**`books.tags`** column (text array)
- Stores tag slugs for each book
- Indexed with GIN for fast containment searches
- Examples: `['fast-paced', 'new-release', 'format:ebook']`

**`book_tags`** table
- Centralized tag metadata
- Fields: `slug`, `label`, `category`, `color`, `description`
- 40+ pre-seeded tags across 9 categories

### 2. Tag Generation Script

**`scripts/generate-book-tags.ts`**
- Automatically generates tags from book data
- No AI required - uses rule-based classification
- Can be run on-demand or scheduled

### 3. TypeScript Types

**`src/types/entities.ts`**
- `Book` type includes `tags: string[]`
- `BookTag` type for tag metadata
- Full type safety across the application

## Tag Categories

### 📚 Format Tags
Indicates available purchase formats
- `format:ebook`, `format:paperback`, `format:hardcover`, `format:audiobook`

### 🚀 Release Tags
Publication timing and availability
- `new-release` - Released in last 3 months
- `just-released` - Recently published
- `coming-soon` - Future publication date
- `pre-order` - Available for pre-order
- `backlist` - Older titles (2+ years)

### 🎭 Genre Tags
From existing genre relationships
- `genre:science-fiction`, `genre:mystery`, `genre:romance`, etc.
- Pulled from `books_genres` join table

### 📖 Length Tags
Reading commitment level
- `quick-read` - Shorter books
- `bite-sized` - Easy to consume
- `immersive` - Longer, detailed books

### ✨ Theme Tags
Content characteristics
- `award-winning` - Award recipients or finalists
- `series` - Part of a series
- `debut-author` - First-time author
- `illustrated` - Contains illustrations
- `true-story` - Based on real events

### 👥 Audience Tags
Target demographic
- `young-adult` - YA audience
- `middle-grade` - Ages 8-12
- `adult` - Adult readers

### 🎭 Mood Tags
Reading experience and tone
- **Dark/Light**: `dark`, `suspenseful`, `uplifting`, `heartwarming`
- **Pacing**: `fast-paced`, `page-turner`, `thought-provoking`
- **Emotional**: `literary`, `emotional`, `humorous`, `witty`

### 🌟 Season Tags
Seasonal appeal for marketing
- `holiday-read`, `cozy`, `summer-read`, `beach-read`, `gift-worthy`

### 💎 Discovery Tags
Editorial curation and social proof
- `staff-pick` - Curated by staff
- `reader-favorite` - Popular with readers
- `hidden-gem` - Underrated titles
- `trending` - Currently popular
- `must-read` - Essential reading

## Implementation Guide

### Step 1: Run Migration

```bash
# Apply the tags migration
psql $DATABASE_URL -f supabase/migrations/0002_add_tags.sql
```

This creates:
- `books.tags` column with GIN index
- `book_tags` lookup table
- 40+ pre-seeded tags

### Step 2: Generate Tags

```bash
# Generate tags for all published books
npx tsx scripts/generate-book-tags.ts
```

Output:
```
🏷️  Starting book tag generation...
✅ Loaded 150 published books.

📖 The Night Circus
   ✓ Generated 8 tags: dark, literary, format:paperback...
   ↳ Total tags: 8

✅ Tag generation complete.
   Success: 150, Errors: 0
```

### Step 3: Query Books with Tags

**Filter by multiple tags (AND logic):**
```typescript
const { data } = await supabase
  .from('books')
  .select('*')
  .contains('tags', ['fast-paced', 'new-release']);
```

**Filter by any tag (OR logic):**
```typescript
const { data } = await supabase
  .from('books')
  .select('*')
  .or(tags.map(tag => `tags.cs.{${tag}}`).join(','));
```

**Get tag metadata:**
```typescript
const { data: tagInfo } = await supabase
  .from('book_tags')
  .select('*')
  .in('slug', book.tags);
```

### Step 4: Display Tags in UI

```tsx
function BookCard({ book }: { book: Book }) {
  const { data: tagData } = useTags(book.tags);
  
  return (
    <div>
      <h3>{book.title}</h3>
      <div className="flex gap-2">
        {tagData?.map(tag => (
          <span
            key={tag.slug}
            className="px-2 py-1 rounded text-xs text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
}
```

## API Integration

### Book Search with Tag Filters

```typescript
// app/api/books/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tags = searchParams.getAll('tag');
  const category = searchParams.get('category');
  
  let query = supabase
    .from('books')
    .select(`
      *,
      books_authors(authors(*)),
      books_genres(genres(*))
    `)
    .eq('is_published', true);
  
  // Filter by tags
  if (tags.length > 0) {
    query = query.contains('tags', tags);
  }
  
  const { data } = await query;
  return Response.json(data);
}
```

### Tag Analytics Endpoint

```typescript
// Get most popular tags
export async function GET() {
  const { data } = await supabase.rpc('get_popular_tags', {
    limit_count: 20
  });
  
  return Response.json(data);
}

// SQL function to create:
/*
CREATE OR REPLACE FUNCTION get_popular_tags(limit_count INT)
RETURNS TABLE (tag TEXT, count BIGINT) AS $$
  SELECT 
    unnest(tags) as tag,
    COUNT(*) as count
  FROM books
  WHERE is_published = true
  GROUP BY tag
  ORDER BY count DESC
  LIMIT limit_count;
$$ LANGUAGE SQL;
*/
```

## UI Examples

### Filter Sidebar

```tsx
<aside>
  <h3>Filter by Mood</h3>
  {moodTags.map(tag => (
    <button
      onClick={() => toggleTag(tag.slug)}
      className={selected ? 'active' : ''}
    >
      {tag.label}
    </button>
  ))}
</aside>
```

### Quick Filters

```tsx
<div className="quick-filters">
  <button onClick={() => filterBy(['new-release'])}>
    New Releases
  </button>
  <button onClick={() => filterBy(['staff-pick'])}>
    Staff Picks
  </button>
  <button onClick={() => filterBy(['fast-paced', 'thriller'])}>
    Page-Turners
  </button>
</div>
```

### Tag Chips on Book Cards

```tsx
<div className="book-card">
  <img src={book.cover_url} />
  <h3>{book.title}</h3>
  <div className="tags">
    {book.tags.slice(0, 3).map(slug => {
      const tag = getTagInfo(slug);
      return <TagChip key={slug} tag={tag} />;
    })}
  </div>
</div>
```

## Best Practices

### 1. Tag Maintenance
- Regenerate tags after bulk imports
- Run classification before tag generation
- Review and manually curate "discovery" tags

### 2. Performance
- Use GIN indexes for tag searches
- Cache tag metadata in client
- Paginate results with many filters

### 3. UX Design
- Group filters by category
- Show tag counts in filters
- Allow multiple tag selection
- Provide "clear all" functionality

### 4. Marketing
- Feature seasonal tags on homepage
- Highlight "staff-pick" and "trending"
- Create curated collections by tags
- Use tags in email campaigns

## Advanced Features

### Smart Recommendations

```typescript
// Find similar books by tag overlap
function findSimilarBooks(bookTags: string[]) {
  return supabase.rpc('find_similar_by_tags', {
    input_tags: bookTags,
    min_overlap: 3,
    limit_count: 10
  });
}
```

### Personalized Discovery

```typescript
// Track user's tag preferences
function getUserTagPreferences(userId: string) {
  // Analyze user's purchases/views
  // Return most common tags
  // Filter books by preferred tags
}
```

### Dynamic Collections

```typescript
// Create dynamic collections based on tags
const collections = [
  {
    title: "Summer Beach Reads",
    tags: ['beach-read', 'summer-read', 'uplifting']
  },
  {
    title: "Award Winners",
    tags: ['award-winning']
  },
  {
    title: "Quick Reads for Busy Readers",
    tags: ['quick-read', 'bite-sized']
  }
];
```

## Maintenance Schedule

- **Daily**: Update "trending" tags based on sales
- **Weekly**: Review and update "staff-pick" tags
- **Monthly**: Regenerate all tags after data updates
- **Quarterly**: Review tag effectiveness and add new categories

## Metrics to Track

1. **Tag Usage**: Which tags are most filtered
2. **Conversion**: Do tagged books sell better
3. **Discovery**: How users navigate by tags
4. **Engagement**: Tag interaction rates

## Future Enhancements

- [ ] Machine learning for better mood detection
- [ ] User-generated tags
- [ ] Tag-based email campaigns
- [ ] A/B testing tag displays
- [ ] Tag-based pricing strategies
- [ ] Seasonal tag automation
- [ ] Cross-platform tag sync
