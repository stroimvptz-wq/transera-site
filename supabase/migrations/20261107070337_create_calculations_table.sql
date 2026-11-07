/*
# Create saved calculations table

Stores results of the TRANSERA calculators so each user can review their history inside their organization.

1. New Tables
- `calculations`
  - `id` (uuid, primary key)
  - `organization_id` (uuid, required, the organization the calculation belongs to)
  - `user_id` (uuid, required, defaults to the signed-in user who saved it)
  - `kind` (text, one of the six calculator types)
  - `title` (text, 1 to 120 characters, user-visible name)
  - `inputs` (jsonb, the values entered in the form)
  - `results` (jsonb, the computed values at the time of saving)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on `calculations`.
- Grant SELECT, INSERT, DELETE to `authenticated` only. No UPDATE, because saved results are a history record.
- Members of an organization can read all calculations of that organization.
- Only the author of a calculation can insert it under their own user id, and only into an organization they belong to.
- Only the author can delete their own calculation.

3. Notes
- Input size is capped to keep rows small.
- Index on (organization_id, created_at) supports the history list.
*/

CREATE TABLE IF NOT EXISTS calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('transport_cost', 'trip_cost', 'fuel', 'carrier_profit', 'forwarder_margin', 'price_per_km')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(inputs) = 'object' AND octet_length(inputs::text) <= 8000),
  results jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(results) = 'object' AND octet_length(results::text) <= 8000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calculations_org_created_idx ON calculations (organization_id, created_at DESC);

ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON calculations TO authenticated;

DROP POLICY IF EXISTS "select_org_calculations" ON calculations;
CREATE POLICY "select_org_calculations" ON calculations FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT private.current_user_org_ids()));

DROP POLICY IF EXISTS "insert_own_org_calculations" ON calculations;
CREATE POLICY "insert_own_org_calculations" ON calculations FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (SELECT private.current_user_org_ids())
  );

DROP POLICY IF EXISTS "delete_own_calculations" ON calculations;
CREATE POLICY "delete_own_calculations" ON calculations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
