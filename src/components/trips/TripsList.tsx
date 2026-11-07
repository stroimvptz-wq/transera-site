import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { TripStatusBadge } from '@/components/trips/TripStatusBadge';
import { Button } from '@/components/ui/Button';
import { calculateTripFinance, TRIP_STATUSES, TRIP_STATUS_LABELS, type Trip, type TripStatus } from '@/lib/trips';
import { formatRub } from '@/lib/domain';
import { inputClass } from '@/components/ui/Field';

type StatusFilter = TripStatus | 'all';

interface TripsListProps {
  trips: Trip[];
  canEdit: boolean;
  onOpen: (tripId: string) => void;
  onCreate: () => void;
}

function matchesQuery(trip: Trip, query: string): boolean {
  if (!query) return true;
  const haystack = [
    trip.tripNumber,
    trip.origin,
    trip.destination,
    trip.cargo,
    trip.customer,
    trip.carrier,
    trip.vehicle,
    trip.driver,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export function TripsList({ trips, canEdit, onOpen, onCreate }: TripsListProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = { all: trips.length } as Record<StatusFilter, number>;
    for (const status of TRIP_STATUSES) result[status] = trips.filter((trip) => trip.status === status).length;
    return result;
  }, [trips]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return trips.filter(
      (trip) => (statusFilter === 'all' || trip.status === statusFilter) && matchesQuery(trip, normalized),
    );
  }, [trips, query, statusFilter]);

  const filterChips: StatusFilter[] = ['all', ...TRIP_STATUSES];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl">Рейсы</h1>
          <p className="text-graphite-500">Маршруты, грузы и финансы каждого рейса</p>
        </div>
        {canEdit ? (
          <Button onClick={onCreate} className="w-full sm:w-auto">
            Новый рейс
          </Button>
        ) : null}
      </div>

      <div className="space-y-4 rounded-2xl border border-graphite-200 bg-white p-4 shadow-card sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Номер, город, заказчик, водитель"
            aria-label="Поиск рейсов"
            className={`${inputClass} pl-10`}
          />
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Фильтр по статусу">
          {filterChips.map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(status)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'bg-navy-900 text-white' : 'bg-graphite-100 text-graphite-600 hover:bg-graphite-200'
                }`}
              >
                {status === 'all' ? 'Все' : TRIP_STATUS_LABELS[status]} <span className="num opacity-70">{counts[status]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-graphite-300 bg-white px-6 py-14 text-center">
          <p className="font-semibold text-navy-900">Рейсов пока нет</p>
          <p className="mt-1 text-sm text-graphite-500">
            {canEdit ? 'Создайте первый рейс, чтобы видеть его финансы.' : 'Менеджеры организации добавляют рейсы здесь.'}
          </p>
          {canEdit ? (
            <Button className="mt-5" onClick={onCreate}>
              Создать рейс
            </Button>
          ) : null}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-graphite-300 bg-white px-6 py-10 text-center text-sm text-graphite-500">
          По этим условиям рейсов не найдено. Измените поиск или фильтр.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((trip) => {
            const finance = calculateTripFinance(trip);
            return (
              <li key={trip.id}>
                <button
                  type="button"
                  onClick={() => onOpen(trip.id)}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-graphite-200 bg-white p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 sm:p-5"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-navy-900">{trip.tripNumber}</span>
                      <span className="text-xs text-graphite-500">{trip.tripDate}</span>
                      <TripStatusBadge status={trip.status} />
                    </div>
                    <p className="truncate text-sm text-navy-800">
                      {trip.origin} <span className="text-graphite-400">→</span> {trip.destination}
                    </p>
                    <p className="truncate text-xs text-graphite-500">
                      {[trip.customer, trip.carrier, trip.driver].filter(Boolean).join(' · ') || 'Участники не указаны'}
                    </p>
                  </div>
                  <div className="hidden shrink-0 space-y-1 text-right sm:block">
                    <p className="num font-semibold text-navy-900">{formatRub(trip.plannedRevenue)}</p>
                    <p className={`num text-xs font-medium ${finance.planned.profit >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      Прибыль {formatRub(finance.planned.profit)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-graphite-300 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-500" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
