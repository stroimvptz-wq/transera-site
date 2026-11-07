/*
# TRANSERA core: profiles, organizations, memberships, invitations

Plain-English summary
This migration creates the foundation for accounts and companies. Each signed-in
user gets a profile with a main role (carrier, forwarder or shipper) and optional
extra roles. Users can create an organization, which becomes their company
workspace. Other people join an organization through a single-use invitation.

1. New Tables
- `profiles`: one row per user (name, phone, main role, extra roles).
- `organizations`: companies with name and INN.
- `memberships`: which user belongs to which organization and with what role
  (owner, admin, manager, accountant, viewer).
- `invitations`: single-use, expiring invite tokens created by owners and admins.

2. Security
- Row level security is enabled on every table.
- Only signed-in users (`authenticated`) receive any privileges. `anon` has none.
- Users see only their own profile plus profiles of colleagues in shared organizations.
- Organization data is visible only to its members. Only owners and admins can edit it.
- Column-level grants prevent users from changing protected columns (ids, creation dates).
- Creating organizations, memberships and joining by invite go through functions,
  so users cannot add themselves to an organization directly.

3. Functions
- `current_user_org_ids()`, `current_user_role(org)`: membership lookups used by policies.
  They run with definer rights to avoid recursive policy checks.
- `create_organization(name, inn)`: creates the company and makes the caller its owner.
- `join_organization(token)`: validates an invitation (exists, unused, not expired)
  and adds the caller as a member with the invited role.

4. Notes
- Invitations expire after 7 days and can be used only once.
- No migration seeds user accounts or passwords.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '' CHECK (char_length(full_name) <= 120),
  phone text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 32),
  primary_role text NOT NULL CHECK (primary_role IN ('carrier', 'forwarder', 'shipper')),
  secondary_roles text[] NOT NULL DEFAULT '{}' CHECK (secondary_roles <@ ARRAY['carrier', 'forwarder', 'shipper']::text[]),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  inn text NOT NULL DEFAULT '' CHECK (inn = '' OR inn ~ '^[0-9]{10}([0-9]{2})?$'),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'accountant', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS memberships_user_id_idx ON public.memberships (user_id);

CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'accountant', 'viewer')),
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invitations_organization_id_idx ON public.invitations (organization_id);

CREATE OR REPLACE FUNCTION public.current_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT m.organization_id FROM public.memberships m WHERE m.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_role(p_org uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT m.role FROM public.memberships m WHERE m.organization_id = p_org AND m.user_id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.current_user_org_ids() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_organization(p_name text, p_inn text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_name text := btrim(coalesce(p_name, ''));
  v_inn text := btrim(coalesce(p_inn, ''));
  v_org uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  IF char_length(v_name) < 2 OR char_length(v_name) > 120 THEN
    RAISE EXCEPTION 'INVALID_NAME';
  END IF;
  IF v_inn !~ '^([0-9]{10}([0-9]{2})?)?$' THEN
    RAISE EXCEPTION 'INVALID_INN';
  END IF;

  INSERT INTO public.organizations (name, inn, created_by)
  VALUES (v_name, v_inn, auth.uid())
  RETURNING id INTO v_org;

  INSERT INTO public.memberships (organization_id, user_id, role)
  VALUES (v_org, auth.uid(), 'owner');

  RETURN v_org;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_organization(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_inv public.invitations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT * INTO v_inv
  FROM public.invitations
  WHERE token = btrim(coalesce(p_token, ''))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVITE_NOT_FOUND';
  END IF;
  IF v_inv.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'INVITE_USED';
  END IF;
  IF v_inv.expires_at < now() THEN
    RAISE EXCEPTION 'INVITE_EXPIRED';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.organization_id = v_inv.organization_id AND m.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'ALREADY_MEMBER';
  END IF;

  INSERT INTO public.memberships (organization_id, user_id, role)
  VALUES (v_inv.organization_id, auth.uid(), v_inv.role);

  UPDATE public.invitations
  SET accepted_by = auth.uid(), accepted_at = now()
  WHERE id = v_inv.id;

  RETURN v_inv.organization_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_organization(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_organization(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_organization(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_organization(text) TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT (id, full_name, phone, primary_role, secondary_roles) ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone, primary_role, secondary_roles) ON public.profiles TO authenticated;

GRANT SELECT ON public.organizations TO authenticated;
GRANT UPDATE (name, inn) ON public.organizations TO authenticated;

GRANT SELECT ON public.memberships TO authenticated;
GRANT UPDATE (role) ON public.memberships TO authenticated;
GRANT DELETE ON public.memberships TO authenticated;

GRANT SELECT, DELETE ON public.invitations TO authenticated;
GRANT INSERT (organization_id, role) ON public.invitations TO authenticated;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR id IN (
    SELECT m.user_id FROM public.memberships m
    WHERE m.organization_id IN (SELECT public.current_user_org_ids())
  )
);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "organizations_select_members" ON public.organizations;
CREATE POLICY "organizations_select_members" ON public.organizations FOR SELECT
TO authenticated
USING (id IN (SELECT public.current_user_org_ids()));

DROP POLICY IF EXISTS "organizations_update_admins" ON public.organizations;
CREATE POLICY "organizations_update_admins" ON public.organizations FOR UPDATE
TO authenticated
USING (public.current_user_role(id) IN ('owner', 'admin'))
WITH CHECK (public.current_user_role(id) IN ('owner', 'admin'));

DROP POLICY IF EXISTS "memberships_select_members" ON public.memberships;
CREATE POLICY "memberships_select_members" ON public.memberships FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.current_user_org_ids()));

DROP POLICY IF EXISTS "memberships_update_admins" ON public.memberships;
CREATE POLICY "memberships_update_admins" ON public.memberships FOR UPDATE
TO authenticated
USING (
  public.current_user_role(organization_id) = 'owner'
  OR (public.current_user_role(organization_id) = 'admin' AND role <> 'owner')
)
WITH CHECK (
  public.current_user_role(organization_id) = 'owner'
  OR (public.current_user_role(organization_id) = 'admin' AND role <> 'owner')
);

DROP POLICY IF EXISTS "memberships_delete" ON public.memberships;
CREATE POLICY "memberships_delete" ON public.memberships FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid() AND role <> 'owner')
  OR (public.current_user_role(organization_id) = 'owner' AND role <> 'owner')
  OR (public.current_user_role(organization_id) = 'admin' AND role NOT IN ('owner', 'admin'))
);

DROP POLICY IF EXISTS "invitations_select_admins" ON public.invitations;
CREATE POLICY "invitations_select_admins" ON public.invitations FOR SELECT
TO authenticated
USING (public.current_user_role(organization_id) IN ('owner', 'admin'));

DROP POLICY IF EXISTS "invitations_insert_admins" ON public.invitations;
CREATE POLICY "invitations_insert_admins" ON public.invitations FOR INSERT
TO authenticated
WITH CHECK (
  public.current_user_role(organization_id) IN ('owner', 'admin')
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "invitations_delete_admins" ON public.invitations;
CREATE POLICY "invitations_delete_admins" ON public.invitations FOR DELETE
TO authenticated
USING (public.current_user_role(organization_id) IN ('owner', 'admin'));
