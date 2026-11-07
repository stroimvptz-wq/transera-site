import { useMemo, useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field, inputClass } from '@/components/ui/Field';
import { formatRub, getErrorMessage } from '@/lib/domain';
import {
  calculateTripFinance,
  parseTripForm,
  TRIP_FIELD_LABELS,
  TRIP_FORM_SECTIONS,
  TRIP_STATUSES,
  TRIP_STATUS_LABELS,
  type Trip,
  type TripFieldKey,
  type TripForm,
} from '@/lib/trips';
import { createTrip, updateTrip } from '@/services/trips';

const FIELD_UNITS: Partial<Record<TripFieldKey, string>> = {
  distanceKm: 'км',
  weightKg: 'кг',
  volumeM3: 'м³',
  fuelConsumption: 'л/100 км',
  fuelPrice: '₽/л',
  actualFuelLiters: 'л',
};

const TEXTAREA_FIELDS: TripFieldKey[] = ['notes'];

const TEXT_INPUT_FIELDS: TripFieldKey[] = [
  'tripNumber',
  'origin',
  'destination',
  'cargo',
  'customer',
  'carrier',
  'vehicle',
  'driver',
];

interface TripEditorProps {
  organizationId: string;
  initial: TripForm;
  existing: Trip | null;
  onCancel: () => void;
  onSaved: (tripId: string) => Promise<void>;
}

export function TripEditor({ organizationId, initial, existing, onCancel, onSaved }: TripEditorProps) {
  const [form, setForm] = useState<TripForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseTripForm(form), [form]);
  const finance = useMemo(() => (parsed.ok ? calculateTripFinance(parsed.value) : null), [parsed]);

  const setField = (key: TripFieldKey, value: string) => {
    setForm((current) => ({ ...current, [key]: value }) as TripForm);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        await updateTrip(existing.id, parsed.value);
        await onSaved(existing.id);
      } else {
        const created = await createTrip(organizationId, parsed.value);
        await onSaved(created.id);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось сохранить рейс. Проверьте данные и попробуйте снова.'));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
      <div className="space-y-6">
        {TRIP_FORM_SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader title={section.title} description={section.description} />
            <div className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((key) => (
                <div key={key} className={key === 'cargo' ? 'sm:col-span-2' : ''}>
                  <TripFieldInput form={form} fieldKey={key} onChange={setField} />
                </div>
              ))}
            </div>
          </Card>
        ))}
        <Card>
          <CardHeader title="Комментарий" description="Особенности рейса, условия погрузки и выгрузки" />
          <TripFieldInput form={form} fieldKey="notes" onChange={setField} />
        </Card>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t border-graphite-200 bg-graphite-50/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
          <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
            Отмена
          </Button>
          <Button type="submit" loading={saving} className="w-full sm:w-auto">
            {existing ? 'Сохранить изменения' : 'Создать рейс'}
          </Button>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <div className="rounded-2xl bg-navy-900 p-5 text-white shadow-lift sm:p-6">
          <p className="text-sm font-medium text-navy-300">Прибыль по плану</p>
          <p className="num mt-2 text-3xl font-bold text-sky-300">
            {finance ? formatRub(finance.planned.profit) : '—'}
          </p>
          <dl className="mt-5 space-y-3 text-sm">
            <SummaryRow label="Маржа" value={finance ? `${finance.planned.marginPercent.toFixed(1)} %` : '—'} />
            <SummaryRow label="Топливо, литров" value={finance ? `${finance.planned.fuelLiters.toFixed(1)} л` : '—'} />
            <SummaryRow label="Расходы" value={finance ? formatRub(finance.planned.totalCost) : '—'} />
            {finance && finance.forwarderMargin !== null ? (
              <SummaryRow label="Маржа экспедитора" value={formatRub(finance.forwarderMargin)} />
            ) : null}
          </dl>
        </div>
        <Card>
          <p className="text-sm font-medium text-graphite-500">Факт</p>
          <p className="num mt-2 text-2xl font-bold text-navy-900">
            {finance ? formatRub(finance.actual.profit) : '—'}
          </p>
          <p className="mt-1 text-xs text-graphite-500">Заполните фактические значения после рейса, чтобы видеть реальную прибыль.</p>
        </Card>
        {!parsed.ok ? <p className="text-sm text-warning-700">{parsed.error}</p> : null}
      </aside>
    </form>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-navy-200">{label}</dt>
      <dd className="num font-semibold text-white">{value}</dd>
    </div>
  );
}

interface TripFieldInputProps {
  form: TripForm;
  fieldKey: TripFieldKey;
  onChange: (key: TripFieldKey, value: string) => void;
}

function TripFieldInput({ form, fieldKey, onChange }: TripFieldInputProps) {
  const id = `trip-${fieldKey}`;
  const label = TRIP_FIELD_LABELS[fieldKey];

  if (fieldKey === 'status') {
    return (
      <Field label={label} htmlFor={id}>
        <select id={id} className={inputClass} value={form.status} onChange={(e) => onChange(fieldKey, e.target.value)}>
          {TRIP_STATUSES.map((status) => (
            <option key={status} value={status}>
              {TRIP_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  if (fieldKey === 'tripDate') {
    return (
      <Field label={label} htmlFor={id}>
        <input id={id} type="date" className={inputClass} value={form.tripDate} onChange={(e) => onChange(fieldKey, e.target.value)} />
      </Field>
    );
  }

  const unit = FIELD_UNITS[fieldKey];
  const value = form[fieldKey];

  if (TEXTAREA_FIELDS.includes(fieldKey)) {
    return (
      <Field label={label} htmlFor={id}>
        <textarea id={id} rows={3} maxLength={2000} className={inputClass} value={value} onChange={(e) => onChange(fieldKey, e.target.value)} />
      </Field>
    );
  }

  const isNumeric = !TEXT_INPUT_FIELDS.includes(fieldKey);

  return (
    <Field label={label} htmlFor={id}>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode={isNumeric ? 'decimal' : 'text'}
          autoComplete="off"
          className={`${inputClass} ${unit ? 'pr-20' : ''} ${isNumeric ? 'num' : ''}`}
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
        />
        {unit ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-graphite-400">
            {unit}
          </span>
        ) : null}
      </div>
    </Field>
  );
}
