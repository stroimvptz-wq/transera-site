import { useEffect, useState } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import {
  formatDate,
  getErrorMessage,
  INVITABLE_ROLES,
  ORG_ROLE_HINTS,
  ORG_ROLE_LABELS,
  type Invitation,
  type InvitableRole,
} from '@/lib/domain';
import {
  createInvitation,
  deleteInvitation,
  fetchInvitations,
} from '@/services/organizations';

interface InvitationsCardProps {
  organizationId: string;
}

type InviteStatus = 'active' | 'used' | 'expired';

function getInviteStatus(invitation: Invitation): InviteStatus {
  if (invitation.acceptedAt) return 'used';
  if (new Date(invitation.expiresAt).getTime() < Date.now()) return 'expired';
  return 'active';
}

const STATUS_LABELS: Record<InviteStatus, string> = {
  active: 'Активно',
  used: 'Использовано',
  expired: 'Истекло',
};

const STATUS_CLASSES: Record<InviteStatus, string> = {
  active: 'bg-success-50 text-success-700',
  used: 'bg-graphite-100 text-graphite-600',
  expired: 'bg-warning-50 text-warning-700',
};

export function InvitationsCard({ organizationId }: InvitationsCardProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createdInvitation, setCreatedInvitation] = useState<Invitation | null>(null);
  const [role, setRole] = useState<InvitableRole>('manager');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchInvitations(organizationId)
      .then((rows) => {
        if (active) setInvitations(rows);
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err, 'Не удалось загрузить приглашения.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId, reloadKey]);

  async function handleCreate() {
    setError(null);
    setCreating(true);
    try {
      const invitation = await createInvitation(organizationId, role);
      setCreatedInvitation(invitation);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось создать приглашение.'));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(invitation: Invitation) {
    setError(null);
    try {
      await deleteInvitation(invitation.id);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось удалить приглашение.'));
    }
  }

  async function handleCopy(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Не удалось скопировать. Выделите код и скопируйте вручную.');
    }
  }

  function closeCreatedModal() {
    setCreatedInvitation(null);
    setCopied(false);
  }

  return (
    <Card>
      <CardHeader
        title="Приглашения"
        description="Передайте код коллеге, и он присоединится к организации по этому коду"
        action={
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            Создать приглашение
          </Button>
        }
      />
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}

      {loading ? (
        <div className="h-16 animate-pulse rounded-xl bg-graphite-100" />
      ) : invitations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-graphite-200 px-4 py-8 text-center text-sm text-graphite-500">
          Приглашений пока нет
        </p>
      ) : (
        <ul className="divide-y divide-graphite-100">
          {invitations.map((invitation) => {
            const status = getInviteStatus(invitation);
            return (
              <li key={invitation.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-navy-900">{ORG_ROLE_LABELS[invitation.role]}</p>
                  <p className="text-xs text-graphite-500">до {formatDate(invitation.expiresAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-xs font-medium ${STATUS_CLASSES[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDelete(invitation)}
                    className="rounded-lg p-2 text-graphite-400 transition hover:bg-danger-50 hover:text-danger-600"
                    aria-label="Удалить приглашение"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={creating} title="Новое приглашение" onClose={() => setCreating(false)}>
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-graphite-700">Роль для нового сотрудника</p>
            <div className="grid gap-2">
              {INVITABLE_ROLES.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={role === item}
                  onClick={() => setRole(item)}
                  className={`rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                    role === item ? 'border-sky-400 bg-sky-50 ring-4 ring-sky-100' : 'border-graphite-200 hover:border-sky-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-navy-900">{ORG_ROLE_LABELS[item]}</p>
                  <p className="text-xs text-graphite-500">{ORG_ROLE_HINTS[item]}</p>
                </button>
              ))}
            </div>
          </div>
          <Button fullWidth loading={creating} onClick={() => void handleCreate()}>
            Создать код
          </Button>
        </div>
      </Modal>

      <Modal open={createdInvitation !== null} title="Код приглашения готов" onClose={closeCreatedModal}>
        {createdInvitation ? (
          <div className="space-y-5">
            <p className="text-sm text-graphite-500">
              Отправьте этот код сотруднику. Он действует 7 дней и работает один раз.
            </p>
            <div className="break-all rounded-xl bg-navy-50 p-4 font-mono text-sm text-navy-900">
              {createdInvitation.token}
            </div>
            <Button
              fullWidth
              icon={<Copy className="h-4 w-4" />}
              variant={copied ? 'secondary' : 'primary'}
              onClick={() => void handleCopy(createdInvitation.token)}
            >
              {copied ? 'Код скопирован' : 'Скопировать код'}
            </Button>
          </div>
        ) : null}
      </Modal>
    </Card>
  );
}
