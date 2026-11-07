/*
# Create trips and trip status history

Adds the "Рейсы" section: each organization records its trips with route, cargo, participants, planned and actual money, and a status history.

1. New Tables
- `trips`: one row per trip.
  - Identity: `id`, `organization_id` (owner organization), `user_id` (creator, defaults to the signed-in user), `trip_number` (unique within the organization), `trip_date`, `status`.
  - Route and cargo: `origin`, `destination`, `distance_km`, `cargo`, `weight_kg`, `volume_m3`.
  - Participants: `customer`, `carrier`, `vehicle`, `driver` (text for now; they become links once the Vehicles, Drivers and Clients sections exist).
  - Plan: `fuel_consumption` (l/100 km), `fuel_price` (rub/l), `planned_revenue`, `carrier_rate`, `planned_driver_pay`, `planned_tolls`, `planned_other_costs`.
  - Fact: `actual_revenue`, `actual_fuel_liters`, `actual_driver_pay`, `actual_tolls`, `actual_other_costs`.
  - `notes`, `created_at`.
- `trip_status_history`: one row each time a trip is created or its status changes.

2. Functions and triggers
- `private.record_trip_status()` writes a history row on insert and on every status change. It runs as a trigger only; it is not callable by API roles.

3. Security
- RLS enabled on both tables.
- Members of an organization can read its trips and history.
- Owners, admins and managers can create, edit and delete trips. Accountants and viewers can only read.
- The owner organization of a trip cannot be changed after creation, and the author cannot be changed.
- Column-level grants on `trips` block writes to `organization_id`, `user_id` and `id` on update.

4. Notes
- Money values are non-negative numbers with two decimals.
- Status values: planned, in_transit, delivered, completed, cancelled.
- Trip numbers are unique inside each organization.
*/

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_number text NOT NULL CHECK (char_length(trip_number) BETWEEN 1 AND 30),
  trip_date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_transit', 'delivered', 'completed', 'cancelled')),
  origin text NOT NULL CHECK (char_length(origin) BETWEEN 1 AND 160),
  destination text NOT NULL CHECK (char_length(destination) BETWEEN 1 AND 160),
  distance_km numeric(10,1) NOT NULL DEFAULT 0 CHECK (distance_km >= 0),
  cargo text NOT NULL DEFAULT '' CHECK (char_length(cargo) <= 200),
  weight_kg numeric(12,1) NOT NULL DEFAULT 0 CHECK (weight_kg >= 0),
  volume_m3 numeric(10,2) NOT NULL DEFAULT 0 CHECK (volume_m3 >= 0),
  customer text NOT NULL DEFAULT '' CHECK (char_length(customer) <= 160),
  carrier text NOT NULL DEFAULT '' CHECK (char_length(carrier) <= 160),
  vehicle text NOT NULL DEFAULT '' CHECK (char_length(vehicle) <= 80),
  driver text NOT NULL DEFAULT '' CHECK (char_length(driver) <= 120),
  fuel_consumption numeric(6,2) NOT NULL DEFAULT 0 CHECK (fuel_consumption >= 0),
  fuel_price numeric(8,2) NOT NULL DEFAULT 0 CHECK (fuel_price >= 0),
  planned_revenue numeric(14,2) NOT NULL DEFAULT 0 CHECK (planned_revenue >= 0),
  carrier_rate numeric(14,2) NOT NULL DEFAULT 0 CHECK (carrier_rate >= 0),
  planned_driver_pay numeric(14,2) NOT NULL DEFAULT 0 CHECK (planned_driver_pay >= 0),
  planned_tolls numeric(14,2) NOT NULL DEFAULT 0 CHECK (planned_tolls >= 0),
  planned_other_costs numeric(14,2) NOT NULL DEFAULT 0 CHECK (planned_other_costs >= 0),
  actual_revenue numeric(14,2) NOT NULL DEFAULT 0 CHECK (actual_revenue >= 0),
  actual_fuel_liters numeric(10,1) NOT NULL DEFAULT 0 CHECK (actual_fuel_liters >= 0),
  actual_driver_pay numeric(14,2) NOT NULL DEFAULT 0 CHECK (actual_driver_pay >= 0),
  actual_tolls numeric(14,2) NOT NULL DEFAULT 0 CHECK (actual_tolls >= 0),
  actual_other_costs numeric(14,2) NOT NULL DEFAULT 0 CHECK (actual_other_costs >= 0),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, trip_number)
);

CREATE INDEX IF NOT EXISTS trips_org_date_idx ON trips (organization_id, trip_date DESC);

CREATE TABLE IF NOT EXISTS trip_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('planned', 'in_transit', 'delivered', 'completed', 'cancelled')),
  changed_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trip_status_history_trip_idx ON trip_status_history (trip_id, changed_at DESC);

CREATE OR REPLACE FUNCTION private.record_trip_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.trip_status_history (trip_id, organization_id, status, changed_by)
    VALUES (NEW.id, NEW.organization_id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.record_trip_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trips_record_status ON trips;
CREATE TRIGGER trips_record_status
AFTER INSERT OR UPDATE OF status ON trips
FOR EACH ROW EXECUTE FUNCTION private.record_trip_status();

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_status_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT, DELETE ON trips TO authenticated;
GRANT INSERT (
  organization_id, trip_number, trip_date, status, origin, destination, distance_km, cargo, weight_kg, volume_m3,
  customer, carrier, vehicle, driver, fuel_consumption, fuel_price, planned_revenue, carrier_rate,
  planned_driver_pay, planned_tolls, planned_other_costs, actual_revenue, actual_fuel_liters,
  actual_driver_pay, actual_tolls, actual_other_costs, notes
) ON trips TO authenticated;
GRANT UPDATE (
  trip_number, trip_date, status, origin, destination, distance_km, cargo, weight_kg, volume_m3,
  customer, carrier, vehicle, driver, fuel_consumption, fuel_price, planned_revenue, carrier_rate,
  planned_driver_pay, planned_tolls, planned_other_costs, actual_revenue, actual_fuel_liters,
  actual_driver_pay, actual_tolls, actual_other_costs, notes
) ON trips TO authenticated;

GRANT SELECT, INSERT ON trip_status_history TO authenticated;

DROP POLICY IF EXISTS "select_org_trips" ON trips;
CREATE POLICY "select_org_trips" ON trips FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT private.current_user_org_ids()));

DROP POLICY IF EXISTS "insert_trips_editors" ON trips;
CREATE POLICY "insert_trips_editors" ON trips FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND private.current_user_role(organization_id) IN ('owner', 'admin', 'manager')
  );

DROP POLICY IF EXISTS "update_trips_editors" ON trips;
CREATE POLICY "update_trips_editors" ON trips FOR UPDATE
  TO authenticated
  USING (private.current_user_role(organization_id) IN ('owner', 'admin', 'manager'))
  WITH CHECK (private.current_user_role(organization_id) IN ('owner', 'admin', 'manager'));

DROP POLICY IF EXISTS "delete_trips_editors" ON trips;
CREATE POLICY "delete_trips_editors" ON trips FOR DELETE
  TO authenticated
  USING (private.current_user_role(organization_id) IN ('owner', 'admin', 'manager'));

DROP POLICY IF EXISTS "select_org_trip_history" ON trip_status_history;
CREATE POLICY "select_org_trip_history" ON trip_status_history FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT private.current_user_org_ids()));

DROP POLICY IF EXISTS "insert_org_trip_history" ON trip_status_history;
CREATE POLICY "insert_org_trip_history" ON trip_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by = auth.uid()
    AND private.current_user_role(organization_id) IN ('owner', 'admin', 'manager')
  );
