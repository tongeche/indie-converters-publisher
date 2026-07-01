-- BN-001: set hero image + wire body images 3, 4, 5

-- 1. Set hero_image_url
UPDATE blogs
SET hero_image_url = 'https://lbtdawdgvmmfaojncjbk.supabase.co/storage/v1/object/public/blog-images/bn001/hero.png'
WHERE content_id = 'BN-001';

-- 2. Wire image-3 → reading order diagram placeholder
UPDATE blogs
SET body = REPLACE(
  body,
  '![ Diagram of a correct EPUB reading order: Cover → Title Page → Copyright → Table of Contents → Chapters → Back Matter.]()',
  '![ Diagram of a correct EPUB reading order: Cover → Title Page → Copyright → Table of Contents → Chapters → Back Matter.](https://lbtdawdgvmmfaojncjbk.supabase.co/storage/v1/object/public/blog-images/bn001/image-3.png)'
)
WHERE content_id = 'BN-001';

-- 3. Wire image-4 → validation tool screenshot placeholder
UPDATE blogs
SET body = REPLACE(
  body,
  '![ EPUB validation tool showing zero errors on a clean file, with a tablet preview of the finished book beside it.]()',
  '![ EPUB validation tool showing zero errors on a clean file, with a tablet preview of the finished book beside it.](https://lbtdawdgvmmfaojncjbk.supabase.co/storage/v1/object/public/blog-images/bn001/image-4.png)'
)
WHERE content_id = 'BN-001';

-- 4. Wire image-5 → insert after the "Images need to be prepared for screens" section
UPDATE blogs
SET body = REPLACE(
  body,
  'Inline images should support the text rather than fight the layout.',
  'Inline images should support the text rather than fight the layout.

![ Comparison of an oversized, poorly optimised image breaking an e-reader layout versus a correctly sized, screen-ready image displayed cleanly.](https://lbtdawdgvmmfaojncjbk.supabase.co/storage/v1/object/public/blog-images/bn001/image-5.png)'
)
WHERE content_id = 'BN-001';
