-- Wire BN-001 body image 1 → Supabase Storage
UPDATE blogs
SET body = REPLACE(
  body,
  '![ The same book: polished in Word on the left, broken layout on an e-reader on the right.]()',
  '![ The same book: polished in Word on the left, broken layout on an e-reader on the right.](https://lbtdawdgvmmfaojncjbk.supabase.co/storage/v1/object/public/blog-images/bn001/image-1.png)'
)
WHERE content_id = 'BN-001';
