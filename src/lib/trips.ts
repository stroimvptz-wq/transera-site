import { getCalculator } from '@/lib/calculators';

export const TRIP_STATUSES = ['planned', 'in_transit', 'delivered', 'completed', 'cancelled'] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  planned: 'Запланирован',
  in_transit: 'В пути',
  delivered: 'Доставлен',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

export const TRIP_STATUS_STYLES: Record<TripStatus, string> = {
  planned: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_transit: 'bg-warning-50 text-warning-700 ring-warning-200',
  delivered: 'bg-navy-50 text-navy-700 ring-navy-200',
  completed: 'bg-success-50 text-success-700 ring-success-200',
  cancelled: 'bg-graphite-100 text-graphite-600 ring-graphite-200',
};

export const TRIP_TEXT_FIELDS = [
  'tripNumber',
  'tripDate',
  'origin',
  'destination',
  'cargo',
  'customer',
  'carrier',
  'vehicle',
  'driver',
  'notes',
] as const;

export const TRIP_NUMBER_FIELDS = [
  'distanceKm',
  'weightKg',
  'volumeM3',
  'fuelConsumption',
  'fuelPrice',
  'plannedRevenue',
  'carrierRate',
  'plannedDriverPay',
  'plannedTolls',
  'plannedOtherCosts',
  'actualRevenue',
  'actualFuelLiters',
  'actualDriverPay',
  'actualTolls',
  'actualOtherCosts',
] as const;

type TextField = (typeof TRIP_TEXT_FIELDS)[number];
type NumberField = (typeof TRIP_NUMBER_FIELDS)[number];

export type TripFieldKey = TextField | NumberField | 'status';

export type TripInput = { status: TripStatus } & Record<TextField, string> & Record<NumberField, number>;

export type TripForm = { status: TripStatus } & Record<TextField, string> & Record<NumberField, string>;

export type Trip = TripInput & { id: string; createdAt: string };

export const TRIP_FIELD_LABELS: Record<TripFieldKey, string> = {
  tripNumber: 'Номер рейса',
  tripDate: 'Дата',
  status: 'Статус',
  origin: 'Откуда',
  destination: 'Куда',
  distanceKm: 'Расстояние, км',
  cargo: 'Груз',
  weightKg: 'Вес, кг',
  volumeM3: 'Объём, м³',
  customer: 'Заказчик',
  carrier: 'Перевозчик',
  vehicle: 'Автомобиль',
  driver: 'Водитель',
  fuelConsumption: 'Расход, л/100 км',
  fuelPrice: 'Цена топлива, ₽/л',
  plannedRevenue: 'Стоимость перевозки, ₽',
  carrierRate: 'Ставка перевозчика, ₽',
  plannedDriverPay: 'Оплата водителя, ₽',
  plannedTolls: 'Платные дороги, ₽',
  plannedOtherCosts: 'Прочие расходы, ₽',
  actualRevenue: 'Фактическая выручка, ₽',
  actualFuelLiters: 'Фактически залито, л',
  actualDriverPay: 'Выплачено водителю, ₽',
  actualTolls: 'Платные дороги факт, ₽',
  actualOtherCosts: 'Прочие расходы факт, ₽',
  notes: 'Комментарий',
};

export interface TripFormSection {
  title: string;
  description: string;
  fields: TripFieldKey[];
}

export const TRIP_FORM_SECTIONS: TripFormSection[] = [
  {
    title: 'Основное',
    description: 'Номер, даты и маршрут рейса',
    fields: ['tripNumber', 'tripDate', 'status', 'origin', 'destination', 'distanceKm'],
  },
  {
    title: 'Груз',
    description: 'Что везём и сколько',
    fields: ['cargo', 'weightKg', 'volumeM3'],
  },
  {
    title: 'Участники',
    description: 'Заказчик, перевозчик, машина и водитель',
    fields: ['customer', 'carrier', 'vehicle', 'driver'],
  },
  {
    title: 'План',
    description: 'Расчётные доходы и расходы до выезда',
    fields: [
      'plannedRevenue',
      'carrierRate',
      'fuelConsumption',
      'fuelPrice',
      'plannedDriverPay',
      'plannedTolls',
      'plannedOtherCosts',
    ],
  },
  {
    title: 'Факт',
    description: 'Что получилось на самом деле',
    fields: ['actualRevenue', 'actualFuelLiters', 'actualDriverPay', 'actualTolls', 'actualOtherCosts'],
  },
];

const MAX_TEXT_LENGTH: Record<TextField, number> = {
  tripNumber: 30,
  tripDate: 10,
  origin: 160,
  destination: 160,
  cargo: 200,
  customer: 160,
  carrier: 160,
  vehicle: 80,
  driver: 120,
  notes: 2000,
};

export function createEmptyTripForm(tripNumber: string, tripDate: string): TripForm {
  const numbers = Object.fromEntries(TRIP_NUMBER_FIELDS.map((key) => [key, ''])) as Record<NumberField, string>;
  return {
    ...numbers,
    status: 'planned',
    tripNumber,
    tripDate,
    origin: '',
    destination: '',
    cargo: '',
    customer: '',
    carrier: '',
    vehicle: '',
    driver: '',
    notes: '',
  };
}

export function tripToForm(trip: Trip): TripForm {
  const numbers = Object.fromEntries(
    TRIP_NUMBER_FIELDS.map((key) => [key, String(trip[key])]),
  ) as Record<NumberField, string>;
  return {
    ...numbers,
    status: trip.status,
    tripNumber: trip.tripNumber,
    tripDate: trip.tripDate,
    origin: trip.origin,
    destination: trip.destination,
    cargo: trip.cargo,
    customer: trip.customer,
    carrier: trip.carrier,
    vehicle: trip.vehicle,
    driver: trip.driver,
    notes: trip.notes,
  };
}

export type ParsedTrip = { ok: true; value: TripInput } | { ok: false; error: string };

export function parseTripForm(form: TripForm): ParsedTrip {
  const texts = {} as Record<TextField, string>;
  for (const key of TRIP_TEXT_FIELDS) {
    const value = form[key].trim();
    if (value.length > MAX_TEXT_LENGTH[key]) {
      return { ok: false, error: `Поле «${TRIP_FIELD_LABELS[key]}» слишком длинное.` };
    }
    texts[key] = value;
  }

  if (!texts.tripNumber) return { ok: false, error: 'Укажите номер рейса.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texts.tripDate)) return { ok: false, error: 'Укажите дату рейса.' };
  if (!texts.origin) return { ok: false, error: 'Укажите пункт отправления.' };
  if (!texts.destination) return { ok: false, error: 'Укажите пункт назначения.' };

  const numbers = {} as Record<NumberField, number>;
  for (const key of TRIP_NUMBER_FIELDS) {
    const text = form[key].trim().replace(',', '.');
    const value = text === '' ? 0 : Number(text);
    if (!Number.isFinite(value) || value < 0) {
      return { ok: false, error: `Поле «${TRIP_FIELD_LABELS[key]}» должно быть числом не меньше нуля.` };
    }
    numbers[key] = value;
  }

  return { ok: true, value: { ...texts, ...numbers, status: form.status } };
}

export interface FinanceSnapshot {
  revenue: number;
  fuelLiters: number;
  fuelCost: number;
  driverPay: number;
  tolls: number;
  otherCosts: number;
  totalCost: number;
  profit: number;
  marginPercent: number;
}

export interface TripFinance {
  planned: FinanceSnapshot;
  actual: FinanceSnapshot;
  forwarderMargin: number | null;
  forwarderMarginPercent: number | null;
}

function buildSnapshot(input: {
  revenue: number;
  fuelLiters: number;
  fuelCost: number;
  driverPay: number;
  tolls: number;
  otherCosts: number;
}): FinanceSnapshot {
  const profitCalculator = getCalculator('carrier_profit');
  const result = profitCalculator?.compute({ ...input, taxPercent: 0 });
  return {
    revenue: input.revenue,
    fuelLiters: input.fuelLiters,
    fuelCost: input.fuelCost,
    driverPay: input.driverPay,
    tolls: input.tolls,
    otherCosts: input.otherCosts,
    totalCost: result?.totalCost ?? 0,
    profit: result?.profit ?? 0,
    marginPercent: result?.marginPercent ?? 0,
  };
}

export function calculateTripFinance(trip: TripInput): TripFinance {
  const fuelCalculator = getCalculator('fuel');
  const forwarderCalculator = getCalculator('forwarder_margin');

  const plannedFuel = fuelCalculator?.compute({
    distance: trip.distanceKm,
    consumption: trip.fuelConsumption,
    fuelPrice: trip.fuelPrice,
  }) ?? { cost: 0, liters: 0 };

  const planned = buildSnapshot({
    revenue: trip.plannedRevenue,
    fuelLiters: plannedFuel.liters,
    fuelCost: plannedFuel.cost,
    driverPay: trip.plannedDriverPay,
    tolls: trip.plannedTolls,
    otherCosts: trip.plannedOtherCosts,
  });

  const actual = buildSnapshot({
    revenue: trip.actualRevenue,
    fuelLiters: trip.actualFuelLiters,
    fuelCost: trip.actualFuelLiters * trip.fuelPrice,
    driverPay: trip.actualDriverPay,
    tolls: trip.actualTolls,
    otherCosts: trip.actualOtherCosts,
  });

  const forwarder =
    trip.carrierRate > 0
      ? forwarderCalculator?.compute({
          clientPrice: trip.plannedRevenue,
          carrierPrice: trip.carrierRate,
          extraCosts: 0,
        })
      : undefined;

  return {
    planned,
    actual,
    forwarderMargin: forwarder?.margin ?? null,
    forwarderMarginPercent: forwarder?.marginPercent ?? null,
  };
}

export function getNextTripNumber(existingNumbers: string[]): string {
  const numericParts = existingNumbers
    .map((number) => Number(number.replace(/\D/g, '')))
    .filter((value) => Number.isFinite(value));
  const next = (numericParts.length ? Math.max(...numericParts) : 0) + 1;
  return `Р-${String(next).padStart(4, '0')}`;
}
