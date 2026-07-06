-- The UploadWizard "generate cover from template" flow uploads image/svg+xml,
-- but the covers bucket was only seeded with raster mime types (0015), so
-- Supabase Storage rejected template-generated covers with a 400.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
WHERE id = 'covers';
