-- Storage Bucket Policies Setup Instructions
-- Run this in Supabase SQL Editor

-- Create storage bucket for product images (if not already created via UI)
-- Note: The bucket is usually created via Supabase console
-- But you can create it with SQL if needed:
-- INSERT INTO storage.buckets (id, name)
-- VALUES ('product-images', 'product-images');

-- STORAGE POLICY 1: Public users can READ product images
CREATE POLICY "Public can read product images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- STORAGE POLICY 2: Authenticated users (admins) can UPLOAD product images
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- STORAGE POLICY 3: Authenticated users (admins) can DELETE product images
CREATE POLICY "Authenticated users can delete product images" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Note: By default, buckets created via Supabase console have basic policies
-- Make sure the storage bucket 'product-images' is set to public for READ operations
