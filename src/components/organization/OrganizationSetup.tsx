import { useState, type FormEvent } from 'react';
import { Building2, KeyRound } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { getErrorMessage } from '@/lib/domain';
import { createOrganization, joinOrganization } from '@/services/organizations';

type SetupTab = 'create' | 'join';

interface OrganizationSetupProps {
  onDone: (organizationId: string) => Promise<void>;
}

export function OrganizationSetup({ onDone }: OrganizationSetupProps) {
  const [tab, setTab] = useState<SetupTab>('create');
  const [name, setName] = useState('');
  const [inn, setInn] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const organizationId =
        tab === 'create'
          ? await createOrganization(name.trim(), inn.trim())
          : await joinOrganization(token.trim());
      await onDone(organizationId);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось выполнить действие. Попробуйте ещё раз.'));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 rounded-xl bg-graphite-100 p-1" role="tablist">
        {(
          [
            { id: 'create', label: 'Создать организацию', icon: Building2 },
            { id: 'join', label: 'По коду приглашения', icon: KeyRound },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
              tab === id ? 'bg-white text-navy-900 shadow-sm' : 'text-graphite-500 hover:text-graphite-800'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in" key={tab} noValidate>
        {tab === 'create' ? (
          <>
            <p className="text-sm text-graphite-500">
              Организация хранит рейсы, сотрудников и финансы. Вы станете её владельцем и сможете пригласить коллег.
            </p>
            <Field label="Название организации" htmlFor="org-name">
              <input id="org-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="ООО «Транспортная компания»" />
            </Field>
            <Field label="ИНН" htmlFor="org-inn" hint="Необязательно: 10 или 12 цифр">
              <input
                id="org-inn"
                inputMode="numeric"
                className={inputClass}
                value={inn}
                onChange={(e) => setInn(e.target.value.replace(/\D/g, ''))}
              />
            </Field>
          </>
        ) : (
          <>
            <p className="text-sm text-graphite-500">
              Введите код, который вам передал администратор организации. Код одноразовый и действует 7 дней.
            </p>
            <Field label="Код приглашения" htmlFor="invite-token">
              <input
                id="invite-token"
                className={`${inputClass} font-mono text-sm`}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoComplete="off"
              />
            </Field>
          </>
        )}

        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" fullWidth size="lg" loading={loading}>
          {tab === 'create' ? 'Создать организацию' : 'Присоединиться'}
        </Button>
      </form>
    </div>
  );
}
