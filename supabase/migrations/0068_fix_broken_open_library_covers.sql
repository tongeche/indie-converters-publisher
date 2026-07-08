-- Replace Open Library ISBN cover URLs that resolve to 1x1 missing-cover
-- placeholders with verified Google Books cover images.
with cover_fixes(slug, cover_url) as (
  values
    (
      'convenience-store-woman',
      'https://books.google.com/books/content?id=z_tRswEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
    ),
    (
      'a-general-theory-of-oblivion',
      'https://books.google.com/books/content?id=gFePEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
    ),
    (
      'transparent-city',
      'https://books.google.com/books/content?id=THa4DgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
    ),
    (
      'all-your-children-scattered',
      'https://books.google.com/books/content?id=P-vHzgEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
    )
)
update public.books b
set cover_url = cover_fixes.cover_url,
    updated_at = now()
from cover_fixes
where b.slug = cover_fixes.slug;

with cover_fixes(slug, cover_url) as (
  values
    (
      'convenience-store-woman',
      'https://books.google.com/books/content?id=z_tRswEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
    ),
    (
      'a-general-theory-of-oblivion',
      'https://books.google.com/books/content?id=gFePEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
    ),
    (
      'transparent-city',
      'https://books.google.com/books/content?id=THa4DgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
    ),
    (
      'all-your-children-scattered',
      'https://books.google.com/books/content?id=P-vHzgEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
    )
)
update public.book_assets ba
set url = cover_fixes.cover_url,
    title = b.title || ' cover'
from public.books b
join cover_fixes on cover_fixes.slug = b.slug
where ba.book_id = b.id
  and ba.asset_type = 'cover';

with cover_fixes(slug, cover_url) as (
  values
    (
      'convenience-store-woman',
      'https://books.google.com/books/content?id=z_tRswEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
    ),
    (
      'a-general-theory-of-oblivion',
      'https://books.google.com/books/content?id=gFePEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
    ),
    (
      'transparent-city',
      'https://books.google.com/books/content?id=THa4DgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
    ),
    (
      'all-your-children-scattered',
      'https://books.google.com/books/content?id=P-vHzgEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
    )
)
insert into public.book_assets (book_id, asset_type, url, title)
select b.id, 'cover', cover_fixes.cover_url, b.title || ' cover'
from public.books b
join cover_fixes on cover_fixes.slug = b.slug
where not exists (
  select 1
  from public.book_assets existing
  where existing.book_id = b.id
    and existing.asset_type = 'cover'
);
