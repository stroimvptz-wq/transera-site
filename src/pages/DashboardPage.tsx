import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { PeriodBarChart, type ChartBucket } from '@/components/charts/PeriodBarChart';
import { useAuth } from '@/hooks/useAuth';
import { formatRub, PRIMARY_ROLES, type PrimaryRole } from '@/lib/domain';

type Period = 'day' | 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  day: 'День',
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
};

interface Metrics {
  revenue: number;
  expenses: number;
  profit: number;
  trips: number;
  avgProfitPerTrip: number;
  receivables: number;
  payables: number;
  margin: number;
}

interface KpiDefinition {
  key: keyof Metrics;
  label: string;
  roles: PrimaryRole[];
  format: (value: number) => string;
}

const formatCount = (value: number) => value.toLocaleString('ru-RU');
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const KPIS: KpiDefinition[] = [
  { key: 'revenue', label: 'Выручка', roles: ['carrier', 'forwarder'], format: formatRub },
  { key: 'expenses', label: 'Расходы', roles: PRIMARY_ROLES, format: formatRub },
  { key: 'profit', label: 'Прибыль', roles: ['carrier', 'forwarder'], format: formatRub },
  { key: 'trips', label: 'Количество рейсов', roles: PRIMARY_ROLES, format: formatCount },
  { key: 'avgProfitPerTrip', label: 'Средняя прибыль с рейса', roles: ['carrier', 'forwarder'], format: formatRub },
  { key: 'receivables', label: 'Дебиторская задолженность', roles: ['carrier', 'forwarder'], format: formatRub },
  { key: 'payables', label: 'Кредиторская задолженность', roles: PRIMARY_ROLES, format: formatRub },
  { key: 'margin', label: 'Рентабельность', roles: ['carrier', 'forwarder'], format: formatPercent },
];

const EMPTY_METRICS: Metrics = {
  revenue: 0,
  expenses: 0,
  profit: 0,
  trips: 0,
  avgProfitPerTrip: 0,
  receivables: 0,
  payables: 0,
  margin: 0,
};

const BUCKET_COUNTS: Record<Period, number> = { day: 14, week: 12, month: 12, year: 5 };

function buildBuckets(period: Period, now: Date): ChartBucket[] {
  return Array.from({ length: BUCKET_COUNTS[period] }, (_, index) => {
    const offset = BUCKET_COUNTS[period] - 1 - index;
    const date = new Date(now);
    if (period === 'day') date.setDate(now.getDate() - offset);
    if (period === 'week') date.setDate(now.getDate() - offset * 7);
    if (period === 'month') date.setMonth(now.getMonth() - offset);
    if (period === 'year') date.setFullYear(now.getFullYear() - offset);

    const label =
      period === 'day' || period === 'week'
        ? date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
        : period === 'month'
          ? date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' })
          : String(date.getFullYear());

    return { label, revenue: 0, expenses: 0 };
  });
}

export function DashboardPage() {
  const { profile, activeMembership } = useAuth();
  const [period, setPeriod] = useState<Period>('month');

  const buckets = useMemo(() => buildBuckets(period, new Date()), [period]);

  const visibleKpis = useMemo(() => {
    if (!profile) return [];
    const roles = new Set<PrimaryRole>([profile.primaryRole, ...profile.secondaryRoles]);
    return KPIS.filter((kpi) => kpi.roles.some((role) => roles.has(role)));
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl">Главная</h1>
          <p className="text-graphite-500">{activeMembership?.organization.name}</p>
        </div>
        <div className="inline-flex w-full rounded-xl bg-white p-1 shadow-card ring-1 ring-graphite-100 sm:w-auto" role="tablist" aria-label="Период">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={period === item}
              onClick={() => setPeriod(item)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 sm:flex-none ${
                period === item ? 'bg-navy-800 text-white shadow-sm' : 'text-graphite-500 hover:text-navy-900'
              }`}
            >
              {PERIOD_LABELS[item]}
            </button>
          ))}
        </div>
      </div>

      <Alert tone="info">
        Показатели заполнятся автоматически, когда появятся рейсы и финансовые записи. Разделы для них идут в следующих обновлениях.
      </Alert>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ключевые показатели">
        {visibleKpis.map((kpi, index) => (
          <Card
            key={kpi.key}
            className="group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift animate-fade-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <p className="text-sm text-graphite-500">{kpi.label}</p>
            <p className="num mt-3 text-2xl font-semibold text-navy-900 sm:text-[28px]">
              {kpi.format(EMPTY_METRICS[kpi.key])}
            </p>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-graphite-100">
              <div className="h-full w-0 rounded-full bg-sky-400 transition-all duration-700 group-hover:w-1/4" />
            </div>
          </Card>
        ))}
      </section>

      <Card>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg">Выручка и расходы</h2>
            <p className="text-sm text-graphite-500">По периодам: {PERIOD_LABELS[period].toLowerCase()}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-graphite-600">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-navy-700" /> Выручка
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" /> Расходы
            </span>
          </div>
        </div>
        <PeriodBarChart buckets={buckets} />
        <p className="mt-5 flex items-center gap-2 text-xs text-graphite-400">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Графики показывают данные только за периоды, в которых есть записи.
        </p>
      </Card>
    </div>
  );
}
