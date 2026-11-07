import { useEffect, useState } from 'react';
import { Fuel, Gauge, Percent, Route as RouteIcon, Truck, TrendingUp, type LucideIcon } from 'lucide-react';
import { CalculationHistory } from '@/components/calculators/CalculationHistory';
import { CalculatorWorkspace } from '@/components/calculators/CalculatorWorkspace';
import { Card, CardHeader } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { CALCULATORS, getCalculator, type CalculatorKind } from '@/lib/calculators';
import { getErrorMessage } from '@/lib/domain';
import {
  deleteCalculation,
  fetchCalculations,
  type SavedCalculation,
} from '@/services/calculations';

const KIND_ICONS: Record<CalculatorKind, LucideIcon> = {
  transport_cost: Truck,
  trip_cost: RouteIcon,
  fuel: Fuel,
  carrier_profit: TrendingUp,
  forwarder_margin: Percent,
  price_per_km: Gauge,
};

export function CalculatorsPage() {
  const { session, activeMembership } = useAuth();
  const organizationId = activeMembership?.organization.id ?? null;
  const [selectedKind, setSelectedKind] = useState<CalculatorKind | null>(null);
  const [history, setHistory] = useState<SavedCalculation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!organizationId) return;
    let active = true;
    setHistoryLoading(true);
    setHistoryError(null);
    fetchCalculations(organizationId)
      .then((rows) => {
        if (active) setHistory(rows);
      })
      .catch((err: unknown) => {
        if (active) setHistoryError(getErrorMessage(err, 'Не удалось загрузить историю расчётов.'));
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId, reloadKey]);

  const reloadHistory = async () => setReloadKey((key) => key + 1);

  const handleDelete = async (id: string) => {
    await deleteCalculation(id);
    await reloadHistory();
  };

  const selected = selectedKind ? getCalculator(selectedKind) : undefined;

  if (selected) {
    return (
      <CalculatorWorkspace
        key={selected.kind}
        calculator={selected}
        onBack={() => setSelectedKind(null)}
        onSaved={reloadHistory}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl">Калькуляторы</h1>
        <p className="text-graphite-500">Расчёты для рейсов, топлива и прибыли. Сохраняйте результаты в историю.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CALCULATORS.map((calculator) => {
          const Icon = KIND_ICONS[calculator.kind];
          return (
            <button
              key={calculator.kind}
              type="button"
              onClick={() => setSelectedKind(calculator.kind)}
              className="group flex flex-col items-start gap-4 rounded-2xl border border-graphite-200 bg-white p-5 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-500 group-hover:text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="space-y-1">
                <span className="block font-semibold text-navy-900">{calculator.title}</span>
                <span className="block text-sm text-graphite-500">{calculator.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader title="История расчётов" description="Расчёты вашей организации, последние 50" />
        <CalculationHistory
          items={history}
          loading={historyLoading}
          error={historyError}
          currentUserId={session?.user.id ?? ''}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
}
