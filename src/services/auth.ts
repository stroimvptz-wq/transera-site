import { supabase } from '@/lib/supabase';
import type { PrimaryRole } from '@/lib/domain';

export interface SignUpInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  primaryRole: PrimaryRole;
  secondaryRoles: PrimaryRole[];
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(input: SignUpInput): Promise<{ hasSession: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        phone: input.phone,
        primary_role: input.primaryRole,
        secondary_roles: input.secondaryRoles,
      },
    },
  });
  if (error) throw error;
  return { hasSession: data.session !== null };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
