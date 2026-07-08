-- Assigns hero images to the blog posts that were published without one
-- (empty grey cards on /blog). Images are existing assets from src/assets,
-- uploaded to the blog-images storage bucket to match the convention already
-- used by bn001 and bn004 (which already had hero images).

update public.blogs set hero_image_url =
  'https://lbtdawdgvmmfaojncjbk.supabase.co/storage/v1/object/public/blog-images/gs001/hero.webp'
where content_id = 'GS-001';

update public.blogs set hero_image_url =
  'https://lbtdawdgvmmfaojncjbk.supabase.co/storage/v1/object/public/blog-images/gs002/hero.webp'
where content_id = 'GS-002';

update public.blogs set hero_image_url =
  'https://lbtdawdgvmmfaojncjbk.supabase.co/storage/v1/object/public/blog-images/gs003/hero.png'
where content_id = 'GS-003';

update public.blogs set hero_image_url =
  'https://lbtdawdgvmmfaojncjbk.supabase.co/storage/v1/object/public/blog-images/gs004/hero.png'
where content_id = 'GS-004';

update public.blogs set hero_image_url =
  'https://lbtdawdgvmmfaojncjbk.supabase.co/storage/v1/object/public/blog-images/bn002/hero.png'
where content_id = 'BN-002';

update public.blogs set hero_image_url =
  'https://lbtdawdgvmmfaojncjbk.supabase.co/storage/v1/object/public/blog-images/bn003/hero.webp'
where content_id = 'BN-003';

update public.blogs set hero_image_url =
  'https://lbtdawdgvmmfaojncjbk.supabase.co/storage/v1/object/public/blog-images/bn005/hero.png'
where content_id = 'BN-005';
