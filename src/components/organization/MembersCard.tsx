import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import {
  getErrorMessage,
  ORG_ROLE_LABELS,
  formatDate,
  type Member,
  type OrgRole,
} from '@/lib/domain';
import { fetchMembers, removeMember, updateMemberRole } from '@/services/organizations';

const ASSIGNABLE_ROLES: OrgRole[] = ['admin', 'manager', 'accountant', 'viewer'];

interface MembersCardProps {
  organizationId: string;
  currentUserId: string;
  canManage: boolean;
}

export function MembersCard({ organizationId, currentUserId, canManage }: MembersCardProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchMembers(organizationId)
      .then((rows) => {
        if (active) setMembers(rows);
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err, 'Не удалось загрузить сотрудников.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId, reloadKey]);

  async function handleRoleChange(member: Member, role: OrgRole) {
    setBusyId(member.membershipId);
    setError(null);
    try {
      await updateMemberRole(member.membershipId, role);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось изменить роль.'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(member: Member) {
    setBusyId(member.membershipId);
    setError(null);
    try {
      await removeMember(member.membershipId);
      setConfirmingId(null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось удалить сотрудника.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Сотрудники"
        description={`Всего участников: ${members.length}`}
      />
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-graphite-100" />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-graphite-100">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            const isOwner = member.role === 'owner';
            const editable = canManage && !isOwner && !isSelf;
            const busy = busyId === member.membershipId;

            return (
              <li key={member.membershipId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy-900">
                    {member.fullName || 'Без имени'}
                    {isSelf ? <span className="ml-2 text-xs font-normal text-sky-600">Это вы</span> : null}
                  </p>
                  <p className="text-sm text-graphite-500">
                    {member.phone || 'Телефон не указан'} · с {formatDate(member.joinedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {editable ? (
                    <select
                      aria-label="Роль сотрудника"
                      value={member.role}
                      disabled={busy}
                      onChange={(e) => void handleRoleChange(member, e.target.value as OrgRole)}
                      className="rounded-lg border border-graphite-200 bg-white px-3 py-2 text-sm text-graphite-800 transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ORG_ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="rounded-lg bg-navy-50 px-3 py-1.5 text-sm font-medium text-navy-800">
                      {ORG_ROLE_LABELS[member.role]}
                    </span>
                  )}

                  {editable && confirmingId !== member.membershipId ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(member.membershipId)}
                      className="rounded-lg p-2 text-graphite-400 transition hover:bg-danger-50 hover:text-danger-600"
                      aria-label="Удалить из организации"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}

                  {editable && confirmingId === member.membershipId ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <Button size="sm" variant="danger" loading={busy} onClick={() => void handleRemove(member)}>
                        Удалить
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)}>
                        Отмена
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
