/*
# Create profile automatically on sign-up

Plain-English summary
When someone registers, their profile (name, phone, main role, extra roles) is now
saved in the same step as the account itself. This avoids a window where a new
account exists without a profile.

1. Functions
- `private.handle_new_user()`: copies the sign-up details into `profiles`.
  It runs with definer rights because the new account has no access rights yet.

2. Triggers
- `on_auth_user_created` on the built-in accounts table, after each new account.

3. Security
- The function is not callable by web visitors. Only the account system triggers it.
- Profile values still pass the same validation rules as the profiles table.
*/

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, primary_role, secondary_roles)
  VALUES (
    NEW.id,
    left(btrim(coalesce(NEW.raw_user_meta_data->>'full_name', '')), 120),
    left(btrim(coalesce(NEW.raw_user_meta_data->>'phone', '')), 32),
    NEW.raw_user_meta_data->>'primary_role',
    coalesce(
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'secondary_roles')),
      '{}'::text[]
    )
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();
