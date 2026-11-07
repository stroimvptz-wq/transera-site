import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { TripStatusBadge } from '@/components/trips/TripStatusBadge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { formatRub, getErrorMessage } from '@/lib/domain';
import {
  calculateTripFinance,
  parseTripForm,
  TRIP_STATUSES,
  TRIP_STATUS_LABELS,
  tripToForm,
  type FinanceSnapshot,
  type Trip,
  type TripStatus,
} from '@/lib/trips';
import { deleteTrip, fetchTripHistory, updateTrip, type TripStatusChange } from '@/services/trips';

interface TripDetailsProps {
  trip: Trip;
  canEdit: boolean;
  onBack: () => void;
  onEdit: () => void;
  onChanged: () => Promise<void>;
  onDeleted: () => Promise<void>;
}

const DATE_TIME = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function formatLiters(value: number): string {
  return `${value.toFixed(1)} л`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)} %`;
}

export function TripDetails({ trip, canEdit, onBack, onEdit, onChanged, onDeleted }: TripDetailsProps) {
  const finance = useMemo(() => calculateTripFinance(trip), [trip]);
  const [history, setHistory] = useState<TripStatusChange[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState<TripStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setHistoryLoading(true);
    setHistoryError(null);
    fetchTripHistory(trip.id)
      .then((rows) => {
        if (active) setHistory(rows);
      })
      .catch((err: unknown) => {
        if (active) setHistoryError(getErrorMessage(err, 'Не удалось загрузить историю рейса.'));
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [trip.id, trip.status]);

  async function changeStatus(next: TripStatus) {
    if (next === trip.status) return;
    setStatusSaving(next);
    setActionError(null);
    try {
      const parsed = parseTripForm({ ...tripToForm(trip), status: next });
      if (!parsed.ok) throw new Error(parsed.error);
      await updateTrip(trip.id, parsed.value);
      await onChanged();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Не удалось изменить статус рейса.'));
    } finally {
      setStatusSaving(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setActionError(null);
    try {
      await deleteTrip(trip.id);
      setDeleteOpen(false);
      await onDeleted();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Не удалось удалить рейс.'));
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  const rows: { label: string; planned: string; actual: string; strong?: boolean }[] = [
    financeRow('Выручка', finance.planned, finance.actual, (s) => s.revenue, formatRub),
    financeRow('Топливо, литров', finance.planned, finance.actual, (s) => s.fuelLiters, formatLiters),
    financeRow('Топливо, ₽', finance.planned, finance.actual, (s) => s.fuelCost, formatRub),
    financeRow('Водитель', finance.planned, finance.actual, (s) => s.driverPay, formatRub),
    financeRow('Платные дороги', finance.planned, finance.actual, (s) => s.tolls, formatRub),
    financeRow('Прочие расходы', finance.planned, finance.actual, (s) => s.otherCosts, formatRub),
    financeRow('Расходы всего', finance.planned, finance.actual, (s) => s.totalCost, formatRub),
    financeRow('Прибыль', finance.planned, finance.actual, (s) => s.profit, formatRub, true),
    financeRow('Маржа', finance.planned, finance.actual, (s) => s.marginPercent, formatPercent),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          className="mt-1 rounded-lg p-2 text-graphite-500 transition hover:bg-graphite-100 hover:text-navy-900"
          aria-label="Назад к списку рейсов"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl">Рейс {trip.tripNumber}</h1>
            <TripStatusBadge status={trip.status} />
          </div>
          <p className="text-graphite-500">
            {trip.tripDate} · {trip.origin} → {trip.destination}
          </p>
        </div>
        {canEdit ? (
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="sm" icon={<Pencil className="h-4 w-4" />} onClick={onEdit}>
              <span className="hidden sm:inline">Изменить</span>
            </Button>
            <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteOpen(true)} aria-label="Удалить рейс">
              <span className="hidden sm:inline">Удалить</span>
            </Button>
          </div>
        ) : null}
      </div>

      {actionError ? <Alert tone="error">{actionError}</Alert> : null}

      {canEdit ? (
        <Card>
          <CardHeader title="Статус рейса" description="Смена статуса сохраняется в истории" />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Статус рейса">
            {TRIP_STATUSES.map((status) => {
              const active = trip.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  disabled={statusSaving !== null}
                  onClick={() => void changeStatus(status)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                    active ? 'bg-navy-900 text-white' : 'bg-graphite-100 text-graphite-700 hover:bg-graphite-200'
                  }`}
                >
                  {statusSaving === status ? '...' : TRIP_STATUS_LABELS[status]}
                </button>
              );
            })}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Маршрут и груз" />
          <dl className="space-y-3 text-sm">
            <InfoRow label="Откуда" value={trip.origin} />
            <InfoRow label="Куда" value={trip.destination} />
            <InfoRow label="Расстояние" value={`${trip.distanceKm} км`} />
            <InfoRow label="Груз" value={trip.cargo || '—'} />
            <InfoRow label="Вес" value={trip.weightKg ? `${trip.weightKg} кг` : '—'} />
            <InfoRow label="Объём" value={trip.volumeM3 ? `${trip.volumeM3} м³` : '—'} />
          </dl>
        </Card>
        <Card>
          <CardHeader title="Участники" description="Связи с автопарком, водителями и клиентами появятся в следующих разделах" />
          <dl className="space-y-3 text-sm">
            <InfoRow label="Заказчик" value={trip.customer || '—'} />
            <InfoRow label="Перевозчик" value={trip.carrier || '—'} />
            <InfoRow label="Автомобиль" value={trip.vehicle || '—'} />
            <InfoRow label="Водитель" value={trip.driver || '—'} />
          </dl>
        </Card>
      </div>

      <Card>
        <CardHeader title="Финансы рейса" description="План рассчитан по данным рейса, факт заполняется после поездки" />
        <div className="overflow-hidden rounded-xl border border-graphite-200">
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] bg-graphite-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-graphite-500">
            <span>Показатель</span>
            <span className="text-right">План</span>
            <span className="text-right">Факт</span>
          </div>
          <ul className="divide-y divide-graphite-100">
            {rows.map((row) => (
              <li
                key={row.label}
                className={`grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] items-center px-4 py-3 text-sm ${row.strong ? 'bg-sky-50/60 font-semibold' : ''}`}
              >
                <span className="text-navy-800">{row.label}</span>
                <span className="num text-right text-navy-900">{row.planned}</span>
                <span className="num text-right text-navy-900">{row.actual}</span>
              </li>
            ))}
          </ul>
        </div>
        {finance.forwarderMargin !== null ? (
          <p className="mt-4 text-sm text-graphite-600">
            Маржа экспедитора по плану: <span className="num font-semibold text-navy-900">{formatRub(finance.forwarderMargin)}</span>{' '}
            ({formatPercent(finance.forwarderMarginPercent ?? 0)} от стоимости перевозки)
          </p>
        ) : null}
      </Card>

      {trip.notes ? (
        <Card>
          <CardHeader title="Комментарий" />
          <p className="whitespace-pre-line text-sm text-navy-800">{trip.notes}</p>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="История рейса" description="Создание рейса и каждая смена статуса" />
        {historyLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-graphite-100" />
        ) : historyError ? (
          <Alert tone="error">{historyError}</Alert>
        ) : history.length === 0 ? (
          <p className="text-sm text-graphite-500">Записей пока нет.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-graphite-200 pl-6">
            {history.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[1.85rem] top-1.5 h-2.5 w-2.5 rounded-full bg-sky-500 ring-4 ring-white" aria-hidden="true" />
                <p className="text-sm font-medium text-navy-900">{TRIP_STATUS_LABELS[entry.status]}</p>
                <p className="text-xs text-graphite-500">{DATE_TIME.format(new Date(entry.changedAt))}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Modal open={deleteOpen} title="Удалить рейс?" onClose={() => setDeleteOpen(false)}>
        <div className="space-y-5">
          <p className="text-sm text-graphite-600">
            Рейс {trip.tripNumber} и его история будут удалены без возможности восстановления.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Отмена
            </Button>
            <Button variant="danger" loading={deleting} onClick={() => void handleDelete()}>
              Удалить рейс
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function financeRow(
  label: string,
  planned: FinanceSnapshot,
  actual: FinanceSnapshot,
  pick: (snapshot: FinanceSnapshot) => number,
  format: (value: number) => string,
  strong = false,
) {
  return { label, planned: format(pick(planned)), actual: format(pick(actual)), strong };
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-graphite-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-graphite-500">{label}</dt>
      <dd className="text-right font-medium text-navy-900">{value}</dd>
    </div>
  );
}
