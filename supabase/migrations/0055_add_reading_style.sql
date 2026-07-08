-- Adds the reading-style preferences collected in the upload wizard's
-- "Reading Style" step (template, theme, typeface, size, spacing). The step's
-- own copy promises this sets "how your book opens on IndieConverters," but
-- the fields were never persisted — only ever held in wizard component state.

alter table books
  add column if not exists reading_style jsonb;

comment on column books.reading_style is 'Interior reading preferences chosen in the upload wizard: { style, theme, font, size, spacing }. Drives the default reading experience for this book.';
