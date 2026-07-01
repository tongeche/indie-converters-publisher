-- Distribution channels selected by the author at publish time
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS distribution_channels text[] DEFAULT '{}';
