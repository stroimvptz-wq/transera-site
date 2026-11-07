import { Building2 } from 'lucide-react';
import { OrganizationDetailsCard } from '@/components/organization/OrganizationDetailsCard';
import { MembersCard } from '@/components/organization/MembersCard';
import { InvitationsCard } from '@/components/organization/InvitationsCard';
import { useAuth } from '@/hooks/useAuth';
import { canManageOrganization, ORG_ROLE_LABELS } from '@/lib/domain';

export function OrganizationPage() {
  const { activeMembership, profile } = useAuth();
  if (!activeMembership || !profile) return null;

  const { organization, role } = activeMembership;
  const canManage = canManageOrganization(role);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-800 text-sky-300">
          <Building2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl sm:text-3xl">{organization.name}</h1>
          <p className="text-graphite-500">
            Ваша роль: <span className="font-medium text-navy-800">{ORG_ROLE_LABELS[role]}</span>
          </p>
        </div>
      </div>

      <OrganizationDetailsCard key={organization.id} organization={organization} canManage={canManage} />

      {canManage ? <InvitationsCard organizationId={organization.id} /> : null}

      <MembersCard organizationId={organization.id} currentUserId={profile.id} canManage={canManage} />
    </div>
  );
}
