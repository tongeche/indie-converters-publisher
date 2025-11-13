-- Add rating column to books table
ALTER TABLE books
ADD COLUMN rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5.0);

-- Add comment explaining the column
COMMENT ON COLUMN books.rating IS 'Book rating from 0.0 to 5.0, used for TOP10 rankings';

-- Create index for efficient TOP10 queries
CREATE INDEX idx_books_rating ON books(rating DESC);

-- Update some sample books with ratings (you can modify these values)
UPDATE books SET rating = 4.8 WHERE title ILIKE '%night circus%';
UPDATE books SET rating = 4.7 WHERE title ILIKE '%starless sea%';
UPDATE books SET rating = 4.6 WHERE title ILIKE '%invisible life%';
UPDATE books SET rating = 4.5 WHERE title ILIKE '%House of spirits%';
UPDATE books SET rating = 4.4 WHERE title ILIKE '%love in the time%';
UPDATE books SET rating = 4.3 WHERE title ILIKE '%Brief%';
UPDATE books SET rating = 4.2 WHERE title ILIKE '%shadow%';
UPDATE books SET rating = 4.1 WHERE title ILIKE '%labyrinth%';
UPDATE books SET rating = 4.0 WHERE title ILIKE '%captain%';

-- Set random ratings for remaining books (between 3.5 and 4.9)
UPDATE books 
SET rating = ROUND((3.5 + (RANDOM() * 1.4))::numeric, 1)
WHERE rating = 0.0 OR rating IS NULL;
