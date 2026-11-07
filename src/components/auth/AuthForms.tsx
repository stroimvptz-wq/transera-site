import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage, type PrimaryRole } from '@/lib/domain';
import { requestPasswordReset, signIn, signUp, updatePassword } from '@/services/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export type AuthMode = 'login' | 'register' | 'forgot';

function toggleRole(roles: PrimaryRole[], role: PrimaryRole): PrimaryRole[] {
  return roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role];
}

export function LoginForm({ onSwitch }: { onSwitch: (mode: AuthMode) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Введите корректный адрес почты.');
      return;
    }
    if (!password) {
      setError('Введите пароль.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось войти. Попробуйте ещё раз.'));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field label="Электронная почта" htmlFor="login-email">
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.ru"
        />
      </Field>
      <Field label="Пароль" htmlFor="login-password">
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button type="submit" fullWidth size="lg" loading={loading}>
        Войти
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button type="button" onClick={() => onSwitch('forgot')} className="font-medium text-sky-600 hover:text-sky-700">
          Забыли пароль?
        </button>
        <button type="button" onClick={() => onSwitch('register')} className="font-medium text-navy-800 hover:text-navy-600">
          Создать аккаунт
        </button>
      </div>
    </form>
  );
}

export function RegisterForm({ onSwitch }: { onSwitch: (mode: AuthMode) => void }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [primaryRole, setPrimaryRole] = useState<PrimaryRole | null>(null);
  const [secondaryRoles, setSecondaryRoles] = useState<PrimaryRole[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handlePrimaryChange(role: PrimaryRole) {
    setPrimaryRole(role);
    setSecondaryRoles((roles) => roles.filter((r) => r !== role));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 120) {
      setError('Укажите имя или название компании (от 2 до 120 символов).');
      return;
    }
    if (!primaryRole) {
      setError('Выберите основную роль.');
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Введите корректный адрес почты.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль должен содержать не менее ${MIN_PASSWORD_LENGTH} символов.`);
      return;
    }

    setLoading(true);
    try {
      const { hasSession } = await signUp({
        fullName: trimmedName,
        phone: phone.trim(),
        email: email.trim(),
        password,
        primaryRole,
        secondaryRoles,
      });
      if (!hasSession) {
        setNotice('Аккаунт создан. Войдите, используя почту и пароль.');
        onSwitch('login');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось создать аккаунт. Попробуйте ещё раз.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Имя или название компании" htmlFor="reg-name">
          <input
            id="reg-name"
            className={inputClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </Field>
        <Field label="Телефон" htmlFor="reg-phone" hint="Необязательно">
          <input
            id="reg-phone"
            type="tel"
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </Field>
        <Field label="Электронная почта" htmlFor="reg-email">
          <input
            id="reg-email"
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Пароль" htmlFor="reg-password" hint={`Не менее ${MIN_PASSWORD_LENGTH} символов`}>
          <input
            id="reg-password"
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
      </div>

      <RoleSelector
        primaryRole={primaryRole}
        secondaryRoles={secondaryRoles}
        onPrimaryChange={handlePrimaryChange}
        onSecondaryToggle={(role) => setSecondaryRoles((roles) => toggleRole(roles, role))}
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button type="submit" fullWidth size="lg" loading={loading}>
        Зарегистрироваться
      </Button>
      <p className="text-center text-sm text-graphite-500">
        Уже есть аккаунт?{' '}
        <button type="button" onClick={() => onSwitch('login')} className="font-medium text-sky-600 hover:text-sky-700">
          Войти
        </button>
      </p>
    </form>
  );
}

export function ForgotPasswordForm({ onSwitch }: { onSwitch: (mode: AuthMode) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Введите корректный адрес почты.');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось отправить письмо. Попробуйте позже.'));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <Alert tone="success">Если аккаунт с такой почтой существует, мы отправили на неё ссылку для смены пароля.</Alert>
        <Button fullWidth size="lg" variant="secondary" onClick={() => onSwitch('login')}>
          Вернуться ко входу
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field label="Электронная почта" htmlFor="forgot-email" hint="Пришлём ссылку для создания нового пароля">
        <input
          id="forgot-email"
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </Field>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button type="submit" fullWidth size="lg" loading={loading}>
        Отправить ссылку
      </Button>
      <button type="button" onClick={() => onSwitch('login')} className="w-full text-center text-sm font-medium text-sky-600 hover:text-sky-700">
        Назад ко входу
      </button>
    </form>
  );
}

export function ResetPasswordForm() {
  const { finishRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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
      finishRecovery();
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось сохранить пароль. Запросите ссылку заново.'));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field label="Новый пароль" htmlFor="reset-password" hint={`Не менее ${MIN_PASSWORD_LENGTH} символов`}>
        <input
          id="reset-password"
          type="password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      <Field label="Повторите пароль" htmlFor="reset-confirm">
        <input
          id="reset-confirm"
          type="password"
          className={inputClass}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button type="submit" fullWidth size="lg" loading={loading}>
        Сохранить пароль
      </Button>
    </form>
  );
}
