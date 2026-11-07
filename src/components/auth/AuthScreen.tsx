import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ForgotPasswordForm, LoginForm, RegisterForm, ResetPasswordForm, type AuthMode } from '@/components/auth/AuthForms';
import { useAuth } from '@/hooks/useAuth';

const HIGHLIGHTS = [
  'Расчёт рейса и прибыли за минуту',
  'Учёт рейсов, машин и водителей',
  'Финансы, документы и аналитика в одном месте',
];

const TITLES: Record<AuthMode | 'reset', { title: string; subtitle: string }> = {
  login: { title: 'С возвращением', subtitle: 'Войдите, чтобы продолжить работу' },
  register: { title: 'Создайте аккаунт', subtitle: 'Выберите роль и начните работать за пару минут' },
  forgot: { title: 'Восстановление пароля', subtitle: 'Мы отправим ссылку на вашу почту' },
  reset: { title: 'Новый пароль', subtitle: 'Придумайте пароль для входа в TRANSERA' },
};

export function AuthScreen() {
  const { isRecovery } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const currentMode = isRecovery ? 'reset' : mode;
  const { title, subtitle } = TITLES[currentMode];

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-navy-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-navy-500/40 blur-3xl" />
        <div className="relative animate-fade-up">
          <Logo tone="light" showSlogan />
        </div>
        <div className="relative max-w-md space-y-8 animate-fade-up [animation-delay:120ms]">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Управляйте перевозками, а не таблицами
          </h1>
          <ul className="space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-navy-100">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-400" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-navy-300">© TRANSERA. Платформа для участников рынка грузоперевозок</p>
      </aside>

      <main className="flex items-center justify-center bg-white px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 lg:hidden">
            <Logo showSlogan />
          </div>

          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold text-navy-900">{title}</h2>
            <p className="text-graphite-500">{subtitle}</p>
          </div>

          {currentMode === 'login' || currentMode === 'register' ? (
            <div className="mb-7 grid grid-cols-2 rounded-xl bg-graphite-100 p-1" role="tablist">
              {(['login', 'register'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={currentMode === tab}
                  onClick={() => setMode(tab)}
                  className={`rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
                    currentMode === tab ? 'bg-white text-navy-900 shadow-sm' : 'text-graphite-500 hover:text-graphite-800'
                  }`}
                >
                  {tab === 'login' ? 'Вход' : 'Регистрация'}
                </button>
              ))}
            </div>
          ) : null}

          {currentMode === 'login' ? <LoginForm onSwitch={setMode} /> : null}
          {currentMode === 'register' ? <RegisterForm onSwitch={setMode} /> : null}
          {currentMode === 'forgot' ? <ForgotPasswordForm onSwitch={setMode} /> : null}
          {currentMode === 'reset' ? <ResetPasswordForm /> : null}
        </div>
      </main>
    </div>
  );
}
