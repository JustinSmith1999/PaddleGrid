/*
  # Update Merch Products Schema
  
  1. Schema Updates
    - Add `designs` jsonb column for flexible design/color variants
    - Add `sizes` text array for available sizes
    - Add `display_order` integer for product ordering
    - Add `price` numeric column (keep base_price for compatibility)
    - Add `in_stock` boolean column
  
  2. Changes
    - Products will have nested designs with types and colors
    - Each color variant has its own image URL
    - Supports complex product variations
*/

-- Add new columns to merch_products
ALTER TABLE merch_products 
  ADD COLUMN IF NOT EXISTS price numeric,
  ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS designs jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 999,
  ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT true;

-- Update price from base_price if not set
UPDATE merch_products SET price = base_price WHERE price IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_merch_products_display_order ON merch_products(display_order);
CREATE INDEX IF NOT EXISTS idx_merch_products_in_stock ON merch_products(in_stock);
CREATE INDEX IF NOT EXISTS idx_merch_products_category ON merch_products(category);
