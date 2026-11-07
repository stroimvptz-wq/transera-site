import { Check } from 'lucide-react';
import {
  PRIMARY_ROLES,
  PRIMARY_ROLE_DESCRIPTIONS,
  PRIMARY_ROLE_LABELS,
  type PrimaryRole,
} from '@/lib/domain';

interface RoleSelectorProps {
  primaryRole: PrimaryRole | null;
  secondaryRoles: PrimaryRole[];
  onPrimaryChange: (role: PrimaryRole) => void;
  onSecondaryToggle: (role: PrimaryRole) => void;
}

export function RoleSelector({
  primaryRole,
  secondaryRoles,
  onPrimaryChange,
  onSecondaryToggle,
}: RoleSelectorProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-graphite-700">Основная роль</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {PRIMARY_ROLES.map((role) => {
            const active = primaryRole === role;
            return (
              <button
                key={role}
                type="button"
                aria-pressed={active}
                onClick={() => onPrimaryChange(role)}
                className={`relative rounded-xl border p-3.5 text-left transition-all duration-200 hover:-translate-y-px ${
                  active
                    ? 'border-sky-400 bg-sky-50 shadow-sm ring-4 ring-sky-100'
                    : 'border-graphite-200 bg-white hover:border-sky-300'
                }`}
              >
                <p className="pr-6 text-sm font-semibold text-navy-900">{PRIMARY_ROLE_LABELS[role]}</p>
                <p className="mt-1 text-xs leading-relaxed text-graphite-500">{PRIMARY_ROLE_DESCRIPTIONS[role]}</p>
                {active ? (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500">
                    <Check className="h-3 w-3 text-white" aria-hidden="true" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-graphite-700">Дополнительные роли</p>
        <div className="flex flex-wrap gap-2">
          {PRIMARY_ROLES.filter((role) => role !== primaryRole).map((role) => {
            const active = secondaryRoles.includes(role);
            return (
              <button
                key={role}
                type="button"
                aria-pressed={active}
                onClick={() => onSecondaryToggle(role)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200 ${
                  active
                    ? 'border-navy-700 bg-navy-800 text-white'
                    : 'border-graphite-200 bg-white text-graphite-700 hover:border-sky-300'
                }`}
              >
                {PRIMARY_ROLE_LABELS[role]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
