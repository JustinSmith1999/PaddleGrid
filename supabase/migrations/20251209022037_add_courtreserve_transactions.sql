/*
  # CourtReserve Transactions Sync
  
  1. New Tables
    - `courtreserve_transactions`
      - Stores financial transaction data synced from CourtReserve
      - Includes transaction type, amount, payment info, and related entities
      - Links to facilities for multi-tenant support
      
  2. Columns
    - `id` (uuid, primary key)
    - `facility_id` (uuid, foreign key to facilities)
    - `courtreserve_transaction_id` (text, unique CourtReserve ID)
    - `transaction_date` (timestamptz, when transaction occurred)
    - `transaction_type` (text, type: Fee, Payment, Refund, etc.)
    - `amount` (decimal, transaction amount)
    - `payment_type` (text, Cash, Credit Card, etc.)
    - `payment_status` (text, paid, unpaid, partial)
    - `customer_name` (text, customer who made transaction)
    - `customer_email` (text, customer email)
    - `customer_id` (text, CourtReserve customer ID)
    - `reservation_id` (text, related CourtReserve reservation ID)
    - `reservation_start_date` (timestamptz, related reservation start)
    - `reservation_end_date` (timestamptz, related reservation end)
    - `event_name` (text, related event name)
    - `event_id` (text, CourtReserve event ID)
    - `instructor_name` (text, instructor name)
    - `revenue_category` (text, revenue category)
    - `description` (text, transaction description)
    - `raw_data` (jsonb, full API response for reference)
    - `created_at` (timestamptz, when synced)
    - `updated_at` (timestamptz, last update)
    
  3. Security
    - Enable RLS on `courtreserve_transactions` table
    - Facility admins can view transactions for their facility
    - Service role can insert/update for sync operations
    
  4. Indexes
    - Index on facility_id for fast filtering
    - Index on transaction_date for date range queries
    - Index on courtreserve_transaction_id for deduplication
    - Composite index on facility_id + transaction_date
*/

-- Create transactions table
CREATE TABLE IF NOT EXISTS courtreserve_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  courtreserve_transaction_id text,
  transaction_date timestamptz NOT NULL,
  transaction_type text,
  amount decimal(10, 2) DEFAULT 0,
  payment_type text,
  payment_status text DEFAULT 'unpaid',
  customer_name text,
  customer_email text,
  customer_id text,
  reservation_id text,
  reservation_start_date timestamptz,
  reservation_end_date timestamptz,
  event_name text,
  event_id text,
  instructor_name text,
  revenue_category text,
  description text,
  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_facility_id 
  ON courtreserve_transactions(facility_id);

CREATE INDEX IF NOT EXISTS idx_transactions_date 
  ON courtreserve_transactions(transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_courtreserve_id 
  ON courtreserve_transactions(courtreserve_transaction_id);

CREATE INDEX IF NOT EXISTS idx_transactions_facility_date 
  ON courtreserve_transactions(facility_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_customer 
  ON courtreserve_transactions(customer_email, facility_id);

-- Add unique constraint to prevent duplicate syncs
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_unique_courtreserve 
  ON courtreserve_transactions(facility_id, courtreserve_transaction_id) 
  WHERE courtreserve_transaction_id IS NOT NULL;

-- Enable RLS
ALTER TABLE courtreserve_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Facility admins can view their facility's transactions
CREATE POLICY "Facility admins can view transactions"
  ON courtreserve_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = courtreserve_transactions.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin')
    )
  );

-- Policy: Service role can insert transactions (for sync operations)
CREATE POLICY "Service role can insert transactions"
  ON courtreserve_transactions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Service role can update transactions (for sync operations)
CREATE POLICY "Service role can update transactions"
  ON courtreserve_transactions
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create sync log table for tracking transaction syncs
CREATE TABLE IF NOT EXISTS courtreserve_transaction_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'running',
  sync_started_at timestamptz DEFAULT now(),
  sync_completed_at timestamptz,
  transactions_synced integer DEFAULT 0,
  transactions_updated integer DEFAULT 0,
  transactions_skipped integer DEFAULT 0,
  error_message text,
  filters_used jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on sync logs
ALTER TABLE courtreserve_transaction_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Facility admins can view sync logs
CREATE POLICY "Facility admins can view transaction sync logs"
  ON courtreserve_transaction_sync_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = courtreserve_transaction_sync_logs.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin')
    )
  );

-- Policy: Service role can insert sync logs
CREATE POLICY "Service role can insert transaction sync logs"
  ON courtreserve_transaction_sync_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Service role can update sync logs
CREATE POLICY "Service role can update transaction sync logs"
  ON courtreserve_transaction_sync_logs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger for transactions
CREATE OR REPLACE FUNCTION update_courtreserve_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_transactions_timestamp
  BEFORE UPDATE ON courtreserve_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_courtreserve_transactions_updated_at();