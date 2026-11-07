import { useAuth } from '@/hooks/useAuth';
import { PasswordForm } from '@/components/settings/PasswordForm';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { Card, CardHeader } from '@/components/ui/Card';

export function SettingsPage() {
  const { session } = useAuth();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl">Настройки</h1>
        <p className="text-graphite-500">Профиль, роли и безопасность аккаунта</p>
      </div>

      <Card>
        <CardHeader title="Аккаунт" description="Почта используется для входа и восстановления пароля" />
        <p className="font-medium text-navy-900">{session?.user.email}</p>
      </Card>

      <ProfileForm />
      <PasswordForm />
    </div>
  );
}
