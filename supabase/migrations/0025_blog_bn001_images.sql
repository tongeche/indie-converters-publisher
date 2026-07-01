-- Wire BN-001-Image 3 → 2nd body placeholder (reading order diagram)
-- Wire BN-001-Image 4 → 3rd body placeholder (validation tool screenshot)
-- Image 1 (hero_image_url) and Image 2 (first body placeholder) still pending

UPDATE blogs
SET body = REPLACE(
  REPLACE(
    body,
    '![ Diagram of a correct EPUB reading order: Cover → Title Page → Copyright → Table of Contents → Chapters → Back Matter.]()',
    '![ Diagram of a correct EPUB reading order: Cover → Title Page → Copyright → Table of Contents → Chapters → Back Matter.](https://lh3.googleusercontent.com/d/1cWXV0VkSF58I9hiqTcKSkmqNsWk-BNtZ)'
  ),
  '![ EPUB validation tool showing zero errors on a clean file, with a tablet preview of the finished book beside it.]()',
  '![ EPUB validation tool showing zero errors on a clean file, with a tablet preview of the finished book beside it.](https://lh3.googleusercontent.com/d/1wjA7xp3d9UW6i1R8hBBj1lHkfIsPggow)'
)
WHERE content_id = 'BN-001';

-- Also revert the Google Drive URLs (replaced below with Supabase Storage after upload)
