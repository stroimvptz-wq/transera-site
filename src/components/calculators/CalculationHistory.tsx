import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { formatResult, getCalculator } from '@/lib/calculators';
import type { SavedCalculation } from '@/services/calculations';

interface CalculationHistoryProps {
  items: SavedCalculation[];
  loading: boolean;
  error: string | null;
  currentUserId: string;
  onDelete: (id: string) => Promise<void>;
}

const DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function CalculationHistory({ items, loading, error, currentUserId, onDelete }: CalculationHistoryProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await onDelete(id);
      setConfirmId(null);
    } catch {
      setDeleteError('Не удалось удалить расчёт. Попробуйте ещё раз.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl bg-graphite-100" />;
  }

  if (error) return <Alert tone="error">{error}</Alert>;

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-graphite-200 px-4 py-8 text-center text-sm text-graphite-500">
        Сохранённых расчётов пока нет. Откройте калькулятор, заполните данные и нажмите «Сохранить расчёт».
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {deleteError ? <Alert tone="error">{deleteError}</Alert> : null}
      <ul className="divide-y divide-graphite-100">
        {items.map((item) => {
          const calculator = getCalculator(item.kind);
          const headline = calculator?.results[0];
          const headlineValue = headline ? item.results[headline.key] : undefined;
          const isOwn = item.userId === currentUserId;
          return (
            <li key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium text-navy-900">{item.title}</p>
                <p className="text-xs text-graphite-500">
                  {calculator?.title ?? 'Расчёт'} · {DATE_FORMAT.format(new Date(item.createdAt))}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                {headline && headlineValue !== undefined ? (
                  <div className="text-right">
                    <p className="text-xs text-graphite-500">{headline.label}</p>
                    <p className="num font-semibold text-navy-900">{formatResult(headlineValue, headline.format)}</p>
                  </div>
                ) : null}
                {isOwn ? (
                  confirmId === item.id ? (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                        Отмена
                      </Button>
                      <Button size="sm" variant="danger" loading={deletingId === item.id} onClick={() => void handleDelete(item.id)}>
                        Удалить
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(item.id)}
                      className="rounded-lg p-2 text-graphite-400 transition hover:bg-danger-50 hover:text-danger-600"
                      aria-label="Удалить расчёт"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
