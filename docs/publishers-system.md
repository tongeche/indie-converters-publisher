# Publishers System

## Overview

The publishers system allows tracking which publisher published each book, enabling display of in-house published titles and publisher-specific filtering.

## Database Schema

### Table: `publishers`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Publisher name (unique) |
| `slug` | TEXT | URL-friendly identifier (unique) |
| `description` | TEXT | Publisher description |
| `website_url` | TEXT | Publisher website |
| `logo_url` | TEXT | Publisher logo image URL |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Books Relationship

- **Column Added**: `books.publisher_id` (UUID, nullable)
- **Foreign Key**: References `publishers(id)` with `ON DELETE SET NULL`
- **Index**: `idx_books_publisher_id` for efficient queries

## Migration

To add the publishers system to your database:

```bash
# Using psql
psql $DATABASE_URL -f supabase/migrations/0004_add_publishers.sql

# OR using Supabase CLI
supabase db push
```

The migration will:
1. Create the `publishers` table
2. Add `publisher_id` column to `books` table
3. Create necessary indexes
4. Insert IndieConverters as the default publisher
5. Assign 10 books to IndieConverters (you can modify this)

## Usage

### Fetching Books by Publisher

```typescript
// Get IndieConverters publisher
const { data: publisher } = await supabase
  .from('publishers')
  .select('id')
  .eq('slug', 'indieconverters')
  .single();

// Get books published by IndieConverters
const { data: books } = await supabase
  .from('books')
  .select(`
    *,
    books_authors (
      authors:author_id (display_name, slug)
    )
  `)
  .eq('publisher_id', publisher.id)
  .eq('is_published', true);
```

### Adding a New Publisher

```typescript
const { data, error } = await supabase
  .from('publishers')
  .insert({
    name: 'New Publisher',
    slug: 'new-publisher',
    description: 'Publisher description',
    website_url: 'https://newpublisher.com'
  });
```

### Assigning a Publisher to a Book

```typescript
await supabase
  .from('books')
  .update({ publisher_id: publisherId })
  .eq('id', bookId);
```

## Services Page Integration

The services page now includes a "Success Stories" section that displays books published by IndieConverters:

### Features:
- **Automatic Fetching**: Server-side query of IndieConverters books
- **Rating Display**: Shows book ratings with star badges
- **Responsive Grid**: 2-4 columns based on screen size
- **Stats Section**: Shows publisher metrics (500+ books, 1M+ copies, 50+ countries)
- **Hover Effects**: Scale and shadow transitions
- **Fallback UI**: Graceful handling when no books are available

### Query Logic:
1. Fetches the IndieConverters publisher by slug
2. Gets top 8 books by rating
3. Includes author and genre information
4. Only shows published books with ratings

## Managing In-House Books

To designate books as published by IndieConverters:

```sql
-- Get publisher ID
SELECT id FROM publishers WHERE slug = 'indieconverters';

-- Assign specific books
UPDATE books 
SET publisher_id = '<publisher-id>'
WHERE id IN (
  '<book-id-1>',
  '<book-id-2>',
  -- ... more book IDs
);

-- Or assign by criteria (e.g., all books from a specific imprint)
UPDATE books
SET publisher_id = '<publisher-id>'
WHERE imprint_id = '<imprint-id>';
```

## TypeScript Types

```typescript
export type Publisher = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
};

export type Book = {
  // ... other fields
  publisher_id?: string | null;
};
```

## Future Enhancements

Potential improvements to the publishers system:

1. **Publisher Pages**: Dedicated page for each publisher with all their books
2. **Multi-Publisher Support**: Display books from multiple publishers
3. **Publisher Logos**: Show publisher branding on book pages
4. **Publisher Filtering**: Filter books by publisher in catalog
5. **Publisher Analytics**: Track sales and performance by publisher
6. **Submission Workflow**: Allow authors to submit to IndieConverters publishing
7. **Publisher Contracts**: Track rights, royalties, and contract terms
8. **Press Kit**: Generate publisher-specific marketing materials

## API Endpoints

Consider creating dedicated API endpoints:

```typescript
// GET /api/publishers
// Returns all publishers

// GET /api/publishers/:slug/books
// Returns all books by a specific publisher

// POST /api/books/:id/publisher
// Assign a publisher to a book (admin only)
```
