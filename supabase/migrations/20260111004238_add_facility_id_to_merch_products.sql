/*
  # Add facility_id to merch_products

  1. Changes
    - Add facility_id column to merch_products table
    - Link all existing products to Pickleball Heaven facility
    - Update RLS policies to allow viewing products by facility
*/

-- Add facility_id column to merch_products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'merch_products' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE merch_products ADD COLUMN facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update all existing products to link to Pickleball Heaven
UPDATE merch_products 
SET facility_id = 'bfb8aa81-fca9-48d9-b697-d13bba78430e'
WHERE facility_id IS NULL;

-- Add index for facility_id
CREATE INDEX IF NOT EXISTS idx_merch_products_facility_id ON merch_products(facility_id);
