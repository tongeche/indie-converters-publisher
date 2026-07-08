-- Adds the target-audience and mature-content fields collected in the
-- upload wizard's "About" step. Previously fd.audience was captured in the
-- UI and shown in the Review summary but never persisted to the database.

alter table books
  add column if not exists audience text
    check (audience in ('adult', 'young-adult', 'middle-grade', 'children')),
  add column if not exists mature_content boolean not null default false;

comment on column books.audience is 'Target reading-age audience selected in the upload wizard (Adult/Young Adult/Middle Grade/Children).';
comment on column books.mature_content is 'Author-declared: book contains explicit sexual content, graphic violence, or strong language. Drives the Adult (18+) audience designation.';
