/*
  # Add Courts for Pickleball Heaven
  
  1. Courts Created
    - 16 courts for Pickleball Heaven facility:
      - Championship Court #1 ($40/hr)
      - Courts #2-#15 ($30/hr each)
      - Court #16 Championship ($40/hr)
      - Court #6 includes Backyard Games option
  
  2. Notes
    - All courts set as active
    - Pricing reflects premium rates for championship courts
*/

-- Create courts for Pickleball Heaven
INSERT INTO courts (name, facility_id, hourly_rate, is_active, description)
VALUES
  ('Championship Court #1', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 40.00, true, 'Premium championship court'),
  ('Court #2', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Standard pickleball court'),
  ('Court #3', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Standard pickleball court'),
  ('Court #4', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Standard pickleball court'),
  ('Court #5', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Standard pickleball court'),
  ('Court #6 Pickleball or Backyard Games', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Multi-use court for pickleball or backyard games'),
  ('Court #7', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Standard pickleball court'),
  ('Court #8', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Standard pickleball court'),
  ('Court #9', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Standard pickleball court'),
  ('Court #10', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Standard pickleball court'),
  ('Court #11', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Standard pickleball court'),
  ('Court #12', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Standard pickleball court'),
  ('Court #13', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Standard pickleball court'),
  ('Court #14', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Standard pickleball court'),
  ('Court #15', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 30.00, true, 'Standard pickleball court'),
  ('Court #16 (Championship)', 'bfb8aa81-fca9-48d9-b697-d13bba78430e', 40.00, true, 'Premium championship court')
ON CONFLICT DO NOTHING;
