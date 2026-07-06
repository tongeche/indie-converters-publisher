-- Persist the selected print/page-preview trim size for uploaded books.
-- Values match the UploadWizard trim-size IDs.

alter table public.books
  add column if not exists trim_size text;

do $$
begin
  alter table public.books
    add constraint books_trim_size_check
    check (
      trim_size is null
      or trim_size in (
        '5x8',
        '5_5x8_5',
        '6x9',
        '7x10',
        '8_5x11'
      )
    );
exception
  when duplicate_object then null;
end $$;

comment on column public.books.trim_size is
  'Selected trim size used for print estimates and manuscript page previews.';
