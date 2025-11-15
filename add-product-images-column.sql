-- Add images column to supplier_products table to support multiple product images
-- Run this SQL in your Supabase SQL Editor to enable multi-image support

ALTER TABLE supplier_products 
ADD COLUMN IF NOT EXISTS images text[];

-- Add a comment to document the column
COMMENT ON COLUMN supplier_products.images IS 'Array of image URLs for the product. First image is the primary image.';
