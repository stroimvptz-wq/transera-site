import { formatRub } from '@/lib/domain';

export type CalculatorKind =
  | 'transport_cost'
  | 'trip_cost'
  | 'fuel'
  | 'carrier_profit'
  | 'forwarder_margin'
  | 'price_per_km';

export type ResultFormat = 'rub' | 'rubPerKm' | 'liters' | 'percent';

export interface CalculatorField {
  key: string;
  label: string;
  unit: string;
  defaultValue: number;
  step: number;
}

export interface CalculatorResult {
  key: string;
  label: string;
  format: ResultFormat;
}

export interface CalculatorDefinition {
  kind: CalculatorKind;
  title: string;
  description: string;
  fields: CalculatorField[];
  results: CalculatorResult[];
  compute: (values: Record<string, number>) => Record<string, number>;
}

export type CalculatorValues = Record<string, number>;

function safeDiv(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export const CALCULATORS: CalculatorDefinition[] = [
  {
    kind: 'transport_cost',
    title: 'Стоимость перевозки',
    description: 'Цена для клиента с учётом топлива, водителя, дорог и наценки',
    fields: [
      { key: 'distance', label: 'Расстояние', unit: 'км', defaultValue: 500, step: 1 },
      { key: 'consumption', label: 'Расход топлива', unit: 'л/100 км', defaultValue: 30, step: 0.5 },
      { key: 'fuelPrice', label: 'Цена топлива', unit: '₽/л', defaultValue: 60, step: 0.5 },
      { key: 'driverRate', label: 'Оплата водителя', unit: '₽/км', defaultValue: 10, step: 0.5 },
      { key: 'tolls', label: 'Платные дороги', unit: '₽', defaultValue: 0, step: 100 },
      { key: 'otherCosts', label: 'Прочие расходы', unit: '₽', defaultValue: 0, step: 100 },
      { key: 'markup', label: 'Наценка', unit: '%', defaultValue: 15, step: 1 },
    ],
    results: [
      { key: 'price', label: 'Цена для клиента', format: 'rub' },
      { key: 'cost', label: 'Себестоимость', format: 'rub' },
      { key: 'pricePerKm', label: 'Цена за километр', format: 'rubPerKm' },
      { key: 'fuelCost', label: 'Топливо', format: 'rub' },
      { key: 'driverPay', label: 'Водитель', format: 'rub' },
    ],
    compute: (v) => {
      const fuelCost = (v.distance * v.consumption * v.fuelPrice) / 100;
      const driverPay = v.distance * v.driverRate;
      const cost = fuelCost + driverPay + v.tolls + v.otherCosts;
      const price = cost * (1 + v.markup / 100);
      return { price, cost, pricePerKm: safeDiv(price, v.distance), fuelCost, driverPay };
    },
  },
  {
    kind: 'trip_cost',
    title: 'Себестоимость рейса',
    description: 'Полные расходы на один рейс и стоимость одного километра',
    fields: [
      { key: 'distance', label: 'Расстояние', unit: 'км', defaultValue: 500, step: 1 },
      { key: 'consumption', label: 'Расход топлива', unit: 'л/100 км', defaultValue: 30, step: 0.5 },
      { key: 'fuelPrice', label: 'Цена топлива', unit: '₽/л', defaultValue: 60, step: 0.5 },
      { key: 'driverSalary', label: 'Зарплата водителя за рейс', unit: '₽', defaultValue: 15000, step: 500 },
      { key: 'tolls', label: 'Платные дороги', unit: '₽', defaultValue: 0, step: 100 },
      { key: 'maintenancePerKm', label: 'Обслуживание', unit: '₽/км', defaultValue: 4, step: 0.5 },
      { key: 'depreciationPerKm', label: 'Амортизация', unit: '₽/км', defaultValue: 3, step: 0.5 },
      { key: 'insurance', label: 'Страхование на рейс', unit: '₽', defaultValue: 1000, step: 100 },
      { key: 'overhead', label: 'Накладные расходы', unit: '₽', defaultValue: 2000, step: 100 },
    ],
    results: [
      { key: 'total', label: 'Себестоимость рейса', format: 'rub' },
      { key: 'costPerKm', label: 'Стоимость за километр', format: 'rubPerKm' },
      { key: 'fuelCost', label: 'Топливо', format: 'rub' },
      { key: 'maintenanceCost', label: 'Обслуживание', format: 'rub' },
      { key: 'depreciationCost', label: 'Амортизация', format: 'rub' },
    ],
    compute: (v) => {
      const fuelCost = (v.distance * v.consumption * v.fuelPrice) / 100;
      const maintenanceCost = v.distance * v.maintenancePerKm;
      const depreciationCost = v.distance * v.depreciationPerKm;
      const total =
        fuelCost + v.driverSalary + v.tolls + maintenanceCost + depreciationCost + v.insurance + v.overhead;
      return {
        total,
        costPerKm: safeDiv(total, v.distance),
        fuelCost,
        maintenanceCost,
        depreciationCost,
      };
    },
  },
  {
    kind: 'fuel',
    title: 'Расход топлива',
    description: 'Сколько литров понадобится на рейс и во сколько это обойдётся',
    fields: [
      { key: 'distance', label: 'Расстояние', unit: 'км', defaultValue: 500, step: 1 },
      { key: 'consumption', label: 'Расход топлива', unit: 'л/100 км', defaultValue: 30, step: 0.5 },
      { key: 'fuelPrice', label: 'Цена топлива', unit: '₽/л', defaultValue: 60, step: 0.5 },
    ],
    results: [
      { key: 'cost', label: 'Стоимость топлива', format: 'rub' },
      { key: 'liters', label: 'Нужно литров', format: 'liters' },
      { key: 'costPerKm', label: 'Топливо на километр', format: 'rubPerKm' },
    ],
    compute: (v) => {
      const liters = (v.distance * v.consumption) / 100;
      const cost = liters * v.fuelPrice;
      return { cost, liters, costPerKm: safeDiv(cost, v.distance) };
    },
  },
  {
    kind: 'carrier_profit',
    title: 'Прибыль перевозчика',
    description: 'Чистая прибыль от рейса после расходов и налога',
    fields: [
      { key: 'revenue', label: 'Выручка за рейс', unit: '₽', defaultValue: 120000, step: 1000 },
      { key: 'fuelCost', label: 'Топливо', unit: '₽', defaultValue: 45000, step: 500 },
      { key: 'driverPay', label: 'Водитель', unit: '₽', defaultValue: 20000, step: 500 },
      { key: 'tolls', label: 'Платные дороги', unit: '₽', defaultValue: 5000, step: 100 },
      { key: 'otherCosts', label: 'Прочие расходы', unit: '₽', defaultValue: 3000, step: 100 },
      { key: 'taxPercent', label: 'Налог от выручки', unit: '%', defaultValue: 6, step: 0.5 },
    ],
    results: [
      { key: 'profit', label: 'Прибыль после налога', format: 'rub' },
      { key: 'marginPercent', label: 'Рентабельность', format: 'percent' },
      { key: 'totalCost', label: 'Расходы без налога', format: 'rub' },
      { key: 'tax', label: 'Налог', format: 'rub' },
    ],
    compute: (v) => {
      const totalCost = v.fuelCost + v.driverPay + v.tolls + v.otherCosts;
      const tax = (v.revenue * v.taxPercent) / 100;
      const profit = v.revenue - totalCost - tax;
      return { profit, marginPercent: safeDiv(profit, v.revenue) * 100, totalCost, tax };
    },
  },
  {
    kind: 'forwarder_margin',
    title: 'Маржа экспедитора',
    description: 'Разница между ценой клиента и ценой перевозчика',
    fields: [
      { key: 'clientPrice', label: 'Цена для клиента', unit: '₽', defaultValue: 120000, step: 1000 },
      { key: 'carrierPrice', label: 'Ставка перевозчика', unit: '₽', defaultValue: 95000, step: 1000 },
      { key: 'extraCosts', label: 'Доп. расходы', unit: '₽', defaultValue: 3000, step: 500 },
    ],
    results: [
      { key: 'margin', label: 'Маржа', format: 'rub' },
      { key: 'marginPercent', label: 'Маржа от цены клиента', format: 'percent' },
      { key: 'markupPercent', label: 'Наценка на ставку', format: 'percent' },
    ],
    compute: (v) => {
      const margin = v.clientPrice - v.carrierPrice - v.extraCosts;
      return {
        margin,
        marginPercent: safeDiv(margin, v.clientPrice) * 100,
        markupPercent: safeDiv(margin, v.carrierPrice) * 100,
      };
    },
  },
  {
    kind: 'price_per_km',
    title: 'Цена за километр',
    description: 'Цена рейса и ставка за километр с нужной рентабельностью',
    fields: [
      { key: 'distance', label: 'Расстояние', unit: 'км', defaultValue: 500, step: 1 },
      { key: 'totalCost', label: 'Себестоимость рейса', unit: '₽', defaultValue: 80000, step: 1000 },
      { key: 'markup', label: 'Желаемая наценка', unit: '%', defaultValue: 20, step: 1 },
    ],
    results: [
      { key: 'sellPrice', label: 'Цена рейса', format: 'rub' },
      { key: 'pricePerKm', label: 'Цена за километр', format: 'rubPerKm' },
      { key: 'costPerKm', label: 'Себестоимость за километр', format: 'rubPerKm' },
    ],
    compute: (v) => {
      const sellPrice = v.totalCost * (1 + v.markup / 100);
      return {
        sellPrice,
        pricePerKm: safeDiv(sellPrice, v.distance),
        costPerKm: safeDiv(v.totalCost, v.distance),
      };
    },
  },
];

export function getCalculator(kind: string): CalculatorDefinition | undefined {
  return CALCULATORS.find((calculator) => calculator.kind === kind);
}

export function getDefaultValues(calculator: CalculatorDefinition): Record<string, string> {
  return Object.fromEntries(calculator.fields.map((field) => [field.key, String(field.defaultValue)]));
}

export type ParseResult = { ok: true; values: CalculatorValues } | { ok: false; error: string };

export function parseValues(calculator: CalculatorDefinition, raw: Record<string, string>): ParseResult {
  const values: CalculatorValues = {};
  for (const field of calculator.fields) {
    const text = (raw[field.key] ?? '').trim().replace(',', '.');
    const value = text === '' ? NaN : Number(text);
    if (!Number.isFinite(value) || value < 0) {
      return { ok: false, error: `Поле «${field.label}» должно быть числом не меньше нуля.` };
    }
    values[field.key] = value;
  }
  return { ok: true, values };
}

const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

export function formatResult(value: number, format: ResultFormat): string {
  switch (format) {
    case 'rub':
      return formatRub(Math.round(value));
    case 'rubPerKm':
      return `${NUMBER_FORMAT.format(value)} ₽/км`;
    case 'liters':
      return `${NUMBER_FORMAT.format(value)} л`;
    case 'percent':
      return `${NUMBER_FORMAT.format(value)} %`;
  }
}
