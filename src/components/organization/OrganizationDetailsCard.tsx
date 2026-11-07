import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Field, inputClass } from '@/components/ui/Field';
import { getErrorMessage, type Organization } from '@/lib/domain';
import { updateOrganization } from '@/services/organizations';
import { useAuth } from '@/hooks/useAuth';

interface OrganizationDetailsCardProps {
  organization: Organization;
  canManage: boolean;
}

export function OrganizationDetailsCard({ organization, canManage }: OrganizationDetailsCardProps) {
  const { refresh } = useAuth();
  const [name, setName] = useState(organization.name);
  const [inn, setInn] = useState(organization.inn);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 120) {
      setError('Название должно содержать от 2 до 120 символов.');
      return;
    }
    if (inn !== '' && !/^(\d{10}|\d{12})$/.test(inn)) {
      setError('ИНН должен содержать 10 или 12 цифр.');
      return;
    }
    setLoading(true);
    try {
      await updateOrganization(organization.id, { name: trimmedName, inn });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось сохранить изменения.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Реквизиты организации" description="Эти данные видят все сотрудники" />
      {canManage ? (
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <Field label="Название" htmlFor="details-name">
              <input id="details-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
          </div>
          <Field label="ИНН" htmlFor="details-inn" hint="Необязательно">
            <input
              id="details-inn"
              inputMode="numeric"
              className={inputClass}
              value={inn}
              onChange={(e) => setInn(e.target.value.replace(/\D/g, ''))}
            />
          </Field>
          <div className="flex flex-col justify-end gap-3 sm:items-end">
            {error ? <Alert tone="error">{error}</Alert> : null}
            {saved ? <Alert tone="success">Изменения сохранены.</Alert> : null}
            <Button type="submit" loading={loading} className="w-full sm:w-auto">
              Сохранить
            </Button>
          </div>
        </form>
      ) : (
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-graphite-500">Название</dt>
            <dd className="font-medium text-navy-900">{organization.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-graphite-500">ИНН</dt>
            <dd className="font-medium text-navy-900">{organization.inn || 'Не указан'}</dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
