import { supabase } from '@/lib/supabase';
import {
  type Invitation,
  type InvitableRole,
  type Member,
  type Membership,
  type OrgRole,
} from '@/lib/domain';

interface MembershipRow {
  id: string;
  role: OrgRole;
  organization: { id: string; name: string; inn: string } | { id: string; name: string; inn: string }[] | null;
}

interface InvitationRow {
  id: string;
  role: InvitableRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

interface MemberRow {
  id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

interface ProfileNameRow {
  id: string;
  full_name: string;
  phone: string;
}

export async function fetchMemberships(userId: string): Promise<Membership[]> {
  const { data, error } = await supabase
    .from('memberships')
    .select('id, role, organization:organizations(id, name, inn)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  return ((data ?? []) as MembershipRow[]).flatMap((row) => {
    const organization = Array.isArray(row.organization) ? row.organization[0] : row.organization;
    return organization ? [{ id: row.id, role: row.role, organization }] : [];
  });
}

export async function createOrganization(name: string, inn: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_organization', { p_name: name, p_inn: inn });
  if (error) throw error;
  if (typeof data !== 'string') throw new Error('Не удалось создать организацию.');
  return data;
}

export async function joinOrganization(token: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_organization', { p_token: token });
  if (error) throw error;
  if (typeof data !== 'string') throw new Error('Не удалось присоединиться к организации.');
  return data;
}

export async function updateOrganization(
  organizationId: string,
  input: { name: string; inn: string },
): Promise<void> {
  const { data, error } = await supabase
    .from('organizations')
    .update({ name: input.name, inn: input.inn })
    .eq('id', organizationId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Недостаточно прав для изменения организации.');
}

export async function fetchMembers(organizationId: string): Promise<Member[]> {
  const { data: memberRows, error: membersError } = await supabase
    .from('memberships')
    .select('id, user_id, role, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });
  if (membersError) throw membersError;

  const members = (memberRows ?? []) as MemberRow[];
  if (members.length === 0) return [];

  const { data: profileRows, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', members.map((m) => m.user_id));
  if (profilesError) throw profilesError;

  const profiles = new Map(((profileRows ?? []) as ProfileNameRow[]).map((p) => [p.id, p]));

  return members.map((m) => {
    const profile = profiles.get(m.user_id);
    return {
      membershipId: m.id,
      userId: m.user_id,
      role: m.role,
      fullName: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      joinedAt: m.created_at,
    };
  });
}

export async function updateMemberRole(membershipId: string, role: OrgRole): Promise<void> {
  const { data, error } = await supabase
    .from('memberships')
    .update({ role })
    .eq('id', membershipId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Недостаточно прав для изменения роли.');
}

export async function removeMember(membershipId: string): Promise<void> {
  const { data, error } = await supabase
    .from('memberships')
    .delete()
    .eq('id', membershipId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Недостаточно прав для удаления сотрудника.');
}

export async function fetchInvitations(organizationId: string): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('id, role, token, expires_at, accepted_at, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return ((data ?? []) as InvitationRow[]).map((row) => ({
    id: row.id,
    role: row.role,
    token: row.token,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  }));
}

export async function createInvitation(organizationId: string, role: InvitableRole): Promise<Invitation> {
  const { data, error } = await supabase
    .from('invitations')
    .insert({ organization_id: organizationId, role })
    .select('id, role, token, expires_at, accepted_at, created_at')
    .single();
  if (error) throw error;

  const row = data as InvitationRow;
  return {
    id: row.id,
    role: row.role,
    token: row.token,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

export async function deleteInvitation(invitationId: string): Promise<void> {
  const { data, error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Приглашение не найдено.');
}
