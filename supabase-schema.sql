-- Create products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  original_price NUMERIC NOT NULL,
  discount_price NUMERIC,
  on_sale BOOLEAN DEFAULT FALSE,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  available BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_on_sale ON products(on_sale);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_available ON products(available);
CREATE INDEX idx_products_slug ON products(slug);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- POLICY 1: Public users can READ all products (both in-stock and out-of-stock)
DROP POLICY IF EXISTS "Public read available products" ON products;
DROP POLICY IF EXISTS "Public read all products" ON products;
CREATE POLICY "Public read all products" ON products
  FOR SELECT
  USING (true);

-- POLICY 2: Only authenticated users (admins) can INSERT products
CREATE POLICY "Authenticated users can insert products" ON products
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- POLICY 3: Only authenticated users (admins) can UPDATE products
CREATE POLICY "Authenticated users can update products" ON products
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- POLICY 4: Only authenticated users (admins) can DELETE products
CREATE POLICY "Authenticated users can delete products" ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Note: Admins must also be in the 'authenticated' role in Supabase
-- The Supabase client library handles this automatically when using the anon key
-- but authenticated operations are still protected by RLS policies
