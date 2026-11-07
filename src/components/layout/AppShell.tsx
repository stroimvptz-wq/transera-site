import { useState, type ReactNode } from 'react';
import {
  Building2,
  Calculator,
  Car,
  Contact,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Route,
  Settings,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { ORG_ROLE_LABELS, type Membership } from '@/lib/domain';
import type { Route as AppRoute } from '@/lib/router';

interface NavItem {
  route: AppRoute;
  label: string;
  icon: LucideIcon;
}

const MAIN_NAV: NavItem[] = [{ route: 'dashboard', label: 'Главная', icon: LayoutDashboard }];

const SECTION_NAV: NavItem[] = [
  { route: 'calculators', label: 'Калькуляторы', icon: Calculator },
  { route: 'trips', label: 'Рейсы', icon: Route },
  { route: 'vehicles', label: 'Автомобили', icon: Car },
  { route: 'drivers', label: 'Водители', icon: Users },
  { route: 'clients', label: 'Клиенты', icon: Contact },
  { route: 'finance', label: 'Финансы', icon: Wallet },
  { route: 'documents', label: 'Документы', icon: FileText },
];

const ACCOUNT_NAV: NavItem[] = [
  { route: 'organization', label: 'Организация', icon: Building2 },
  { route: 'settings', label: 'Настройки', icon: Settings },
];

interface AppShellProps {
  route: AppRoute;
  navigate: (route: AppRoute) => void;
  children: ReactNode;
}

export function AppShell({ route, navigate, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (next: AppRoute) => {
    navigate(next);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-graphite-50">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-navy-800 bg-navy-900 px-4 py-3 lg:hidden">
        <Logo tone="light" />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-2 text-white transition hover:bg-navy-800"
          aria-label="Открыть меню"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm animate-fade-in lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-navy-900 text-navy-100 transition-transform duration-300 ease-out lg:w-64 lg:translate-x-0 ${
          menuOpen ? 'translate-x-0 animate-slide-in' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-4 pt-6">
          <Logo tone="light" />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg p-1.5 text-navy-200 transition hover:bg-navy-800 lg:hidden"
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <OrganizationSwitcher onCreate={() => go('organization-new')} />

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Основное меню">
          <div className="space-y-1">
            {MAIN_NAV.map((item) => (
              <NavButton key={item.route} item={item} active={route === item.route} onClick={() => go(item.route)} />
            ))}
          </div>

          <div className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-navy-400">Разделы</p>
            {SECTION_NAV.map((item) => (
              <NavButton key={item.route} item={item} active={route === item.route} onClick={() => go(item.route)} />
            ))}
          </div>

          <div className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-navy-400">Аккаунт</p>
            {ACCOUNT_NAV.map((item) => (
              <NavButton key={item.route} item={item} active={route === item.route} onClick={() => go(item.route)} />
            ))}
          </div>
        </nav>

        <AccountFooter />
      </aside>

      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div key={route} className="animate-fade-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-sky-500/15 text-white shadow-inner ring-1 ring-sky-400/30'
          : 'text-navy-200 hover:bg-navy-800 hover:text-white'
      }`}
    >
      <item.icon className={`h-[18px] w-[18px] ${active ? 'text-sky-400' : ''}`} aria-hidden="true" />
      {item.label}
    </button>
  );
}

function OrganizationSwitcher({ onCreate }: { onCreate: () => void }) {
  const { memberships, activeMembership, setActiveOrganization } = useAuth();

  return (
    <div className="space-y-2 px-4 pb-4">
      <label htmlFor="org-switcher" className="px-1 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
        Организация
      </label>
      {memberships.length > 1 ? (
        <select
          id="org-switcher"
          value={activeMembership?.organization.id ?? ''}
          onChange={(e) => setActiveOrganization(e.target.value)}
          className="w-full rounded-xl border border-navy-700 bg-navy-800 px-3 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-400/20"
        >
          {memberships.map((m: Membership) => (
            <option key={m.organization.id} value={m.organization.id}>
              {m.organization.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="rounded-xl border border-navy-700 bg-navy-800/60 px-3 py-2.5">
          <p className="truncate text-sm font-medium text-white">{activeMembership?.organization.name}</p>
          {activeMembership ? (
            <p className="text-xs text-navy-300">{ORG_ROLE_LABELS[activeMembership.role]}</p>
          ) : null}
        </div>
      )}
      <button
        type="button"
        onClick={onCreate}
        className="w-full rounded-xl px-3 py-2 text-left text-sm text-sky-300 transition hover:bg-navy-800 hover:text-sky-200"
      >
        + Добавить организацию
      </button>
    </div>
  );
}

function AccountFooter() {
  const { profile, session, signOut } = useAuth();
  const displayName = profile?.fullName || session?.user.email || 'Пользователь';

  return (
    <div className="border-t border-navy-800 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sm font-semibold text-sky-300">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{displayName}</p>
          <p className="truncate text-xs text-navy-300">{session?.user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-lg p-2 text-navy-300 transition hover:bg-navy-800 hover:text-white"
          aria-label="Выйти из аккаунта"
          title="Выйти"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
