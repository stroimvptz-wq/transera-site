import { useState, type ReactNode } from 'react';
import { Car,
  Contact,
  FileText,
  Route as RouteIcon,
  Users,
  Wallet,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AppShell } from '@/components/layout/AppShell';
import { OrganizationSetup } from '@/components/organization/OrganizationSetup';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/Logo';
import { CalculatorsPage } from '@/pages/CalculatorsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { OrganizationPage } from '@/pages/OrganizationPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ModulePage } from '@/pages/ModulePage';
import { useRoute, type Route } from '@/lib/router';

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-graphite-50 px-6 text-center">
      <Logo />
      {children}
    </div>
  );
}

function renderRoute(route: Route, onOrganizationCreated: (organizationId: string) => Promise<void>) {
  switch (route) {
    case 'dashboard':
      return <DashboardPage />;
    case 'organization':
      return <OrganizationPage />;
    case 'settings':
      return <SettingsPage />;
    case 'calculators':
      return <CalculatorsPage />;
    case 'trips':
      return (
        <ModulePage
          title="Рейсы"
          description="Учёт рейсов, статусы и маршруты"
          icon={RouteIcon}
          stage="Рейсы появятся в следующем этапе сборки."
        />
      );
    case 'vehicles':
      return (
        <ModulePage
          title="Автомобили"
          description="Парк транспорта организации"
          icon={Car}
          stage="Автомобили появятся в следующем этапе сборки."
        />
      );
    case 'drivers':
      return (
        <ModulePage
          title="Водители"
          description="Водители, их ставки и рейсы"
          icon={Users}
          stage="Водители появятся в следующем этапе сборки."
        />
      );
    case 'clients':
      return (
        <ModulePage
          title="Клиенты"
          description="Клиенты и контрагенты с историей работы"
          icon={Contact}
          stage="Клиенты появятся в следующем этапе сборки."
        />
      );
    case 'finance':
      return (
        <ModulePage
          title="Финансы"
          description="Доходы, расходы и дебиторская задолженность"
          icon={Wallet}
          stage="Финансы появятся в следующем этапе сборки."
        />
      );
    case 'documents':
      return (
        <ModulePage
          title="Документы"
          description="Шаблоны и PDF-документы для рейсов"
          icon={FileText}
          stage="Документы появятся в следующем этапе сборки."
        />
      );
    case 'organization-new':
      return <OrganizationSetup onDone={onOrganizationCreated} />;
  }
}

function AppContent() {
  const { session, isLoading, isRecovery, loadError, memberships, refresh, setActiveOrganization } = useAuth();
  const [route, navigate] = useRoute();
  const [retrying, setRetrying] = useState(false);

  if (isLoading) {
    return (
      <FullScreenMessage>
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" aria-label="Загрузка" />
      </FullScreenMessage>
    );
  }

  if (!session || isRecovery) return <AuthScreen />;

  if (loadError) {
    return (
      <FullScreenMessage>
        <AlertTriangle className="h-10 w-10 text-warning-500" aria-hidden="true" />
        <div className="max-w-sm space-y-2">
          <p className="font-semibold text-navy-900">Не удалось загрузить аккаунт</p>
          <p className="text-sm text-graphite-500">{loadError}</p>
        </div>
        <Button
          loading={retrying}
          onClick={async () => {
            setRetrying(true);
            await refresh();
            setRetrying(false);
          }}
        >
          Повторить
        </Button>
      </FullScreenMessage>
    );
  }

  const finishOrganizationSetup = async (organizationId: string) => {
    setActiveOrganization(organizationId);
    await refresh();
    navigate('dashboard');
  };

  if (memberships.length === 0) {
    return (
      <FullScreenMessage>
        <div className="w-full max-w-2xl">
          <OrganizationSetup onDone={finishOrganizationSetup} />
        </div>
      </FullScreenMessage>
    );
  }

  return (
    <AppShell route={route} navigate={navigate}>
      {renderRoute(route, finishOrganizationSetup)}
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
