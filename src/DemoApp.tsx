import { useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Car, Contact, FileText, Route, Users, Wallet } from 'lucide-react';
import { AuthContext, type AuthContextValue } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardPage } from '@/pages/DashboardPage';
import { ModulePage } from '@/pages/ModulePage';
import { BoltCalculatorsDemo } from '@/components/calculators/BoltCalculatorsDemo';
import { useRoute } from '@/lib/router';
import type { Membership, Profile } from '@/lib/domain';

const demoSession = { user: { id: 'demo', email: 'demo@transera.local' } } as Session;
const demoProfile = { id: 'demo', fullName: 'Демонстрационный пользователь', primaryRole: 'carrier', secondaryRoles: ['forwarder', 'shipper'] } as Profile;
const demoMembership = { role: 'owner', organization: { id: 'demo-org', name: 'TRANSERA · Демонстрация' } } as Membership;

export default function DemoApp() {
  const [route, navigate] = useRoute();
  const [organization, setOrganization] = useState('TRANSERA · Демонстрация');
  const membership = useMemo(() => ({ ...demoMembership, organization: { ...demoMembership.organization, name: organization } }), [organization]);
  const context = useMemo<AuthContextValue>(() => ({
    session: demoSession, profile: demoProfile, memberships: [membership], activeMembership: membership,
    isLoading: false, loadError: null, isRecovery: false,
    setActiveOrganization: () => {}, refresh: async () => {}, signOut: async () => {},
    finishRecovery: () => {},
  }), [membership]);
  const modules = {
    trips: { title: 'Рейсы', description: 'Учёт рейсов, статусы и маршруты', icon: Route, stage: 'Рейсы появятся в следующем этапе сборки.' },
    vehicles: { title: 'Автомобили', description: 'Парк транспорта организации', icon: Car, stage: 'Автомобили появятся в следующем этапе сборки.' },
    drivers: { title: 'Водители', description: 'Водители, их ставки и рейсы', icon: Users, stage: 'Водители появятся в следующем этапе сборки.' },
    clients: { title: 'Клиенты', description: 'Клиенты и контрагенты с историей работы', icon: Contact, stage: 'Клиенты появятся в следующем этапе сборки.' },
    finance: { title: 'Финансы', description: 'Доходы, расходы и дебиторская задолженность', icon: Wallet, stage: 'Финансы появятся в следующем этапе сборки.' },
    documents: { title: 'Документы', description: 'Документооборот и файлы', icon: FileText, stage: 'Документы появятся в следующем этапе сборки.' },
  };
  const module = route in modules ? modules[route as keyof typeof modules] : null;
  return <AuthContext.Provider value={context}>
    <AppShell route={route} navigate={navigate}>
      {route === 'dashboard' ? <DashboardPage /> :
       route === 'calculators' ? <BoltCalculatorsDemo /> :
       module ? <ModulePage {...module} /> :
       route === 'organization' || route === 'organization-new' ? <div className="space-y-5"><h1 className="text-3xl font-bold text-navy-900">Организация</h1><div className="rounded-2xl bg-white p-6 shadow-card"><label className="block text-sm font-medium text-navy-900">Название демонстрационной организации<input value={organization} onChange={e => setOrganization(e.target.value)} className="mt-2 w-full rounded-xl border border-graphite-200 p-3"/></label><p className="mt-4 text-sm text-graphite-500">Изменения действуют только в этой демонстрации.</p></div></div> :
       <div className="space-y-5"><h1 className="text-3xl font-bold text-navy-900">Настройки</h1><div className="rounded-2xl bg-white p-6 shadow-card"><p>Демонстрационный доступ открыт всем посетителям. Регистрация и выбор роли отключены.</p></div></div>}
      <p className="mt-10 border-t border-graphite-200 pt-4 text-xs text-graphite-500">TRANSERA — демонстрационная версия. Серверная регистрация отключена, данные расчётов хранятся в браузере.</p>
    </AppShell>
  </AuthContext.Provider>;
}
