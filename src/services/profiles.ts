import { supabase } from '@/lib/supabase';
import { PRIMARY_ROLES, type PrimaryRole, type Profile } from '@/lib/domain';

interface ProfileRow {
  id: string;
  full_name: string;
  phone: string;
  primary_role: string;
  secondary_roles: string[];
}

function isPrimaryRole(value: string): value is PrimaryRole {
  return (PRIMARY_ROLES as string[]).includes(value);
}

function mapProfile(row: ProfileRow): Profile {
  if (!isPrimaryRole(row.primary_role)) {
    throw new Error('Некорректная роль в профиле.');
  }
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    primaryRole: row.primary_role,
    secondaryRoles: row.secondary_roles.filter(isPrimaryRole),
  };
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, primary_role, secondary_roles')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as ProfileRow) : null;
}

export interface ProfileInput {
  fullName: string;
  phone: string;
  primaryRole: PrimaryRole;
  secondaryRoles: PrimaryRole[];
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName,
      phone: input.phone,
      primary_role: input.primaryRole,
      secondary_roles: input.secondaryRoles,
    })
    .eq('id', userId)
    .select('id, full_name, phone, primary_role, secondary_roles')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Профиль не найден.');
  return mapProfile(data as ProfileRow);
}
