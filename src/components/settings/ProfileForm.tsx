import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field, inputClass } from '@/components/ui/Field';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage, type PrimaryRole } from '@/lib/domain';
import { updateProfile } from '@/services/profiles';

export function ProfileForm() {
  const { profile, refresh } = useAuth();
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [primaryRole, setPrimaryRole] = useState<PrimaryRole | null>(profile?.primaryRole ?? null);
  const [secondaryRoles, setSecondaryRoles] = useState<PrimaryRole[]>(profile?.secondaryRoles ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!profile) return null;

  function handlePrimaryChange(role: PrimaryRole) {
    setPrimaryRole(role);
    setSecondaryRoles((roles) => roles.filter((r) => r !== role));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 120) {
      setError('Укажите имя или название компании (от 2 до 120 символов).');
      return;
    }
    if (!primaryRole) {
      setError('Выберите основную роль.');
      return;
    }
    setLoading(true);
    try {
      await updateProfile(profile!.id, {
        fullName: trimmedName,
        phone: phone.trim(),
        primaryRole,
        secondaryRoles,
      });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось сохранить профиль.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Профиль" description="Имя и роли видят ваши коллеги в организации" />
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Имя или название компании" htmlFor="profile-name">
            <input id="profile-name" className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Телефон" htmlFor="profile-phone">
            <input id="profile-phone" type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>

        <RoleSelector
          primaryRole={primaryRole}
          secondaryRoles={secondaryRoles}
          onPrimaryChange={handlePrimaryChange}
          onSecondaryToggle={(role) =>
            setSecondaryRoles((roles) => (roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]))
          }
        />

        {error ? <Alert tone="error">{error}</Alert> : null}
        {saved ? <Alert tone="success">Профиль сохранён.</Alert> : null}
        <div className="flex justify-end">
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            Сохранить профиль
          </Button>
        </div>
      </form>
    </Card>
  );
}
