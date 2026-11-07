import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field, inputClass } from '@/components/ui/Field';
import { getErrorMessage } from '@/lib/domain';
import { updatePassword } from '@/services/auth';

const MIN_PASSWORD_LENGTH = 8;

export function PasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль должен содержать не менее ${MIN_PASSWORD_LENGTH} символов.`);
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают.');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setPassword('');
      setConfirm('');
      setSaved(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось сменить пароль.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Смена пароля" description="Используйте не менее 8 символов" />
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Новый пароль" htmlFor="new-password">
          <input id="new-password" type="password" autoComplete="new-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Повторите пароль" htmlFor="confirm-password">
          <input id="confirm-password" type="password" autoComplete="new-password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <div className="space-y-3 sm:col-span-2">
          {error ? <Alert tone="error">{error}</Alert> : null}
          {saved ? <Alert tone="success">Пароль изменён.</Alert> : null}
          <div className="flex justify-end">
            <Button type="submit" loading={loading} className="w-full sm:w-auto">
              Сменить пароль
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
