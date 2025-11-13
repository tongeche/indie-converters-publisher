/**
 * Example: Interactive Book Filter Component
 * 
 * This component demonstrates how to use book tags for filtering
 * and discovery on an interactive book-selling page.
 */

import { useState, useEffect } from 'react';

type BookTag = {
  slug: string;
  label: string;
  category: string;
  color: string;
};

type Book = {
  id: string;
  title: string;
  cover_url: string;
  tags: string[];
  // ... other book fields
};

export function BookFilterExample() {
  const [books, setBooks] = useState<Book[]>([]);
  const [tags, setTags] = useState<BookTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Group tags by category for organized display
  const tagsByCategory = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, BookTag[]>);

  // Filter books based on selected tags
  const filteredBooks = books.filter(book => {
    if (selectedTags.length === 0) return true;
    return selectedTags.every(tagSlug => book.tags.includes(tagSlug));
  });

  const toggleTag = (tagSlug: string) => {
    setSelectedTags(prev =>
      prev.includes(tagSlug)
        ? prev.filter(t => t !== tagSlug)
        : [...prev, tagSlug]
    );
  };

  const categoryLabels: Record<string, string> = {
    format: '📚 Format',
    release: '🚀 Release',
    genre: '🎭 Genre',
    mood: '🎭 Mood',
    theme: '✨ Theme',
    audience: '👥 Audience',
    season: '🌟 Season',
    discovery: '💎 Discovery',
    length: '📖 Length',
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar Filters */}
      <aside className="w-64 flex-shrink-0">
        <div className="sticky top-4">
          <h2 className="text-xl font-bold mb-4">Filter Books</h2>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm ${
                !selectedCategory
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            {Object.keys(tagsByCategory).map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {categoryLabels[category] || category}
              </button>
            ))}
          </div>

          {/* Active Filters */}
          {selectedTags.length > 0 && (
            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Active Filters</span>
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-purple-600 hover:text-purple-800"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map(tagSlug => {
                  const tag = tags.find(t => t.slug === tagSlug);
                  return (
                    <button
                      key={tagSlug}
                      onClick={() => toggleTag(tagSlug)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-white"
                      style={{ backgroundColor: tag?.color || '#6B7280' }}
                    >
                      {tag?.label || tagSlug}
                      <span>×</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tag Filters */}
          <div className="space-y-4">
            {Object.entries(tagsByCategory)
              .filter(([category]) =>
                !selectedCategory || category === selectedCategory
              )
              .map(([category, categoryTags]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    {categoryLabels[category] || category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryTags.map(tag => {
                      const isSelected = selectedTags.includes(tag.slug);
                      return (
                        <button
                          key={tag.slug}
                          onClick={() => toggleTag(tag.slug)}
                          className={`px-3 py-1 rounded-full text-xs transition-all ${
                            isSelected
                              ? 'text-white ring-2 ring-purple-300'
                              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                          }`}
                          style={
                            isSelected
                              ? { backgroundColor: tag.color }
                              : undefined
                          }
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </aside>

      {/* Book Grid */}
      <main className="flex-1">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">
            {selectedTags.length > 0
              ? `Filtered Books (${filteredBooks.length})`
              : `All Books (${books.length})`}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map(book => (
            <BookCard key={book.id} book={book} allTags={tags} />
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No books found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
      </main>
    </div>
  );
}

function BookCard({ book, allTags }: { book: Book; allTags: BookTag[] }) {
  // Show max 3 most relevant tags
  const displayTags = book.tags
    .slice(0, 3)
    .map(slug => allTags.find(t => t.slug === slug))
    .filter((t): t is BookTag => t !== undefined);

  return (
    <div className="group cursor-pointer">
      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-100 mb-3">
        <img
          src={book.cover_url}
          alt={book.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <h3 className="font-semibold line-clamp-2 mb-2">{book.title}</h3>
      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {displayTags.map(tag => (
            <span
              key={tag.slug}
              className="px-2 py-0.5 rounded text-xs text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Usage Example for API Route:
 * 
 * // app/api/books/route.ts
 * export async function GET(request: Request) {
 *   const { searchParams } = new URL(request.url);
 *   const tags = searchParams.getAll('tag'); // ?tag=fast-paced&tag=new-release
 *   
 *   let query = supabase
 *     .from('books')
 *     .select(`
 *       *,
 *       books_authors(authors(*)),
 *       books_genres(genres(*))
 *     `)
 *     .eq('is_published', true);
 *   
 *   if (tags.length > 0) {
 *     query = query.contains('tags', tags);
 *   }
 *   
 *   const { data } = await query;
 *   return Response.json(data);
 * }
 */
