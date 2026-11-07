/*
# Lock down table grants and move policy helpers out of the public API

Plain-English summary
The database gave the public and signed-out visitors full access to the new tables
by default. This migration removes those broad permissions and grants only the
exact operations the app needs to signed-in users. It also moves the two internal
helper functions used by access rules into a private schema that the web API cannot call.

1. Modified Objects
- `profiles`, `organizations`, `memberships`, `invitations`: all table privileges
  revoked from `anon` and `authenticated`, then re-granted with the minimum set.
- `current_user_org_ids()` and `current_user_role(uuid)`: moved to schema `private`.
  Existing access rules keep working because they reference the functions directly.

2. Security
- `anon` (signed-out visitors) has no access to any of these tables.
- Signed-in users can only update the columns listed in the grants below.
- Organization creation and invitation acceptance remain available only through
  their dedicated functions, which check the signed-in user themselves.

3. Notes
- No data is changed or deleted.
*/

REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public.organizations FROM anon, authenticated;
REVOKE ALL ON public.memberships FROM anon, authenticated;
REVOKE ALL ON public.invitations FROM anon, authenticated;

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

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

ALTER FUNCTION public.current_user_org_ids() SET SCHEMA private;
ALTER FUNCTION public.current_user_role(uuid) SET SCHEMA private;

REVOKE EXECUTE ON FUNCTION private.current_user_org_ids() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.current_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_role(uuid) TO authenticated;
