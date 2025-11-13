# Book Rating System

## Overview

The book rating system allows books to be rated from 0.0 to 5.0, enabling the display of TOP10 rated books throughout the platform.

## Database Schema

### Column: `books.rating`
- **Type**: `DECIMAL(2,1)`
- **Range**: 0.0 to 5.0
- **Default**: 0.0
- **Constraint**: `CHECK (rating >= 0 AND rating <= 5.0)`
- **Index**: `idx_books_rating` (DESC order for efficient TOP10 queries)

## Migration

To add the rating system to your database:

```bash
# Using psql
psql $DATABASE_URL -f supabase/migrations/0003_add_book_rating.sql

# OR using Supabase CLI
supabase db push
```

The migration will:
1. Add the `rating` column to the `books` table
2. Create an index for efficient sorting by rating
3. Populate sample ratings for existing books
4. Set random ratings (3.5-4.9) for any books without ratings

## Usage

### Fetching TOP10 Books

```typescript
const { data: top10 } = await supabase
  .from('books')
  .select('id, slug, title, cover_url, rating')
  .eq('is_published', true)
  .not('rating', 'is', null)
  .order('rating', { ascending: false })
  .limit(10);
```

### Updating a Book Rating

```typescript
await supabase
  .from('books')
  .update({ rating: 4.5 })
  .eq('id', bookId);
```

### Display Format

Ratings are displayed with one decimal place (e.g., 4.5, 4.8) and shown with a star emoji ⭐ for visual appeal.

## UI Implementation

### Author Detail Page

The TOP10 section displays:
- Grid of 10 books (responsive: 2 cols mobile, 3 cols tablet, 5 cols desktop)
- Ranking badge (1-10) in yellow/amber gradient
- Rating badge with star emoji and decimal rating
- Book cover with hover effects
- Book title and genre information

### Features

- **Ranking Badge**: Circular badge with book position (1-10)
- **Rating Badge**: Semi-transparent black badge with ⭐ icon and rating value
- **Hover Effects**: Scale and shadow transition on hover
- **Responsive Grid**: Adjusts columns based on screen size
- **Fallback UI**: Shows skeleton placeholders when no books are available

## Rating Guidelines

When manually setting ratings, consider:

- **5.0**: Exceptional, must-read books
- **4.5-4.9**: Excellent books with widespread acclaim
- **4.0-4.4**: Very good books, highly recommended
- **3.5-3.9**: Good books worth reading
- **3.0-3.4**: Average books with specific appeal
- **Below 3.0**: Books with limited appeal or quality issues

## Future Enhancements

Potential improvements to the rating system:

1. **User Ratings**: Allow readers to submit ratings
2. **Average Calculation**: Calculate rating from multiple user submissions
3. **Review Count**: Display number of reviews alongside rating
4. **Weighted Ratings**: Apply algorithms to prevent rating manipulation
5. **Category-Specific TOP10**: TOP10 by genre or tag
6. **Time-Based Rankings**: Weekly/monthly TOP10 lists
7. **Trending Algorithm**: Combine rating with recent popularity

## API Endpoints

Consider creating dedicated API endpoints:

```typescript
// GET /api/books/top10
// Returns the current TOP10 rated books

// GET /api/books/top10?genre=science-fiction
// Returns TOP10 books filtered by genre

// POST /api/books/:id/rate
// Submit a user rating for a book
```
