-- =========================================================================
-- Pearls & Petals: Supabase Fix for Product Deletion & Permissions
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. Ensure Row Level Security (RLS) is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Drop any outdated delete policies if they exist
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON products;
DROP POLICY IF EXISTS "Allow delete for all" ON products;

-- 3. Create the DELETE policy for authenticated admin users
-- This allows any logged-in admin to delete products
CREATE POLICY "Authenticated users can delete products" ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- (Optional) If you also want to allow deleting products using the public/anon key without logging in:
-- CREATE POLICY "Allow delete for all" ON products
--   FOR DELETE
--   TO anon, authenticated
--   USING (true);

-- 4. Verify existing policies on products table
SELECT
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'products';
