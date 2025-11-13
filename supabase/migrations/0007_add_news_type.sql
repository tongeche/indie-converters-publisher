-- Add a type column to distinguish newsroom articles from blog posts
ALTER TABLE public.news_articles
ADD COLUMN IF NOT EXISTS type TEXT;

-- Backfill existing rows as news
UPDATE public.news_articles
SET type = 'news'
WHERE type IS NULL;

-- Enforce constraints and defaults
ALTER TABLE public.news_articles
ALTER COLUMN type SET NOT NULL;

ALTER TABLE public.news_articles
ALTER COLUMN type SET DEFAULT 'news';

ALTER TABLE public.news_articles
ADD CONSTRAINT news_articles_type_check
CHECK (type IN ('news', 'blog'));

COMMENT ON COLUMN public.news_articles.type IS 'Categorizes entries as newsroom updates or long-form blog posts.';

-- Helpful composite index for filtering latest posts
CREATE INDEX IF NOT EXISTS idx_news_articles_type_published
  ON public.news_articles (type, published_at DESC);
