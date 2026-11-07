import { useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import {
  formatResult,
  getDefaultValues,
  parseValues,
  type CalculatorDefinition,
} from '@/lib/calculators';
import { getErrorMessage } from '@/lib/domain';
import { saveCalculation } from '@/services/calculations';

interface CalculatorWorkspaceProps {
  calculator: CalculatorDefinition;
  onBack: () => void;
  onSaved: () => Promise<void>;
}

export function CalculatorWorkspace({ calculator, onBack, onSaved }: CalculatorWorkspaceProps) {
  const { session, activeMembership } = useAuth();
  const [raw, setRaw] = useState<Record<string, string>>(() => getDefaultValues(calculator));
  const [saveOpen, setSaveOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const parsed = useMemo(() => parseValues(calculator, raw), [calculator, raw]);
  const results = useMemo(
    () => (parsed.ok ? calculator.compute(parsed.values) : null),
    [calculator, parsed],
  );

  const [headline, ...details] = calculator.results;

  const updateField = (key: string, value: string) => {
    setSaved(false);
    setRaw((current) => ({ ...current, [key]: value }));
  };

  const openSave = () => {
    setSaveError(null);
    setTitle(`${calculator.title} ${new Date().toLocaleDateString('ru-RU')}`);
    setSaveOpen(true);
  };

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parsed.ok || !results || !session || !activeMembership) return;
    const trimmed = title.trim();
    if (trimmed.length < 1 || trimmed.length > 120) {
      setSaveError('Название должно содержать от 1 до 120 символов.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await saveCalculation({
        organizationId: activeMembership.organization.id,
        userId: session.user.id,
        kind: calculator.kind,
        title: trimmed,
        inputs: parsed.values,
        results,
      });
      setSaveOpen(false);
      setSaved(true);
      await onSaved();
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Не удалось сохранить расчёт.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          className="mt-1 rounded-lg p-2 text-graphite-500 transition hover:bg-graphite-100 hover:text-navy-900"
          aria-label="Назад к калькуляторам"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl">{calculator.title}</h1>
          <p className="text-graphite-500">{calculator.description}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
        <Card>
          <CardHeader title="Исходные данные" description="Результат пересчитывается сразу при изменении" />
          <div className="grid gap-4 sm:grid-cols-2">
            {calculator.fields.map((field) => (
              <Field key={field.key} label={field.label} htmlFor={`calc-${field.key}`}>
                <div className="relative">
                  <input
                    id={`calc-${field.key}`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={raw[field.key] ?? ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className={`${inputClass} pr-16 num`}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-graphite-400">
                    {field.unit}
                  </span>
                </div>
              </Field>
            ))}
          </div>
        </Card>

        <div className="space-y-6 rounded-2xl bg-navy-900 p-6 text-white shadow-lift lg:sticky lg:top-6">
          {parsed.ok && results ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium text-navy-300">{headline.label}</p>
                <p className="num animate-fade-in text-3xl font-bold tracking-tight text-sky-300 sm:text-4xl" key={`${headline.key}-${results[headline.key]}`}>
                  {formatResult(results[headline.key], headline.format)}
                </p>
              </div>
              <dl className="divide-y divide-navy-800">
                {details.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-sm text-navy-200">{item.label}</dt>
                    <dd className="num text-sm font-semibold text-white">{formatResult(results[item.key], item.format)}</dd>
                  </div>
                ))}
              </dl>
              <Button fullWidth icon={<Save className="h-4 w-4" />} onClick={openSave}>
                Сохранить расчёт
              </Button>
              {saved ? <Alert tone="success">Расчёт сохранён в истории.</Alert> : null}
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-navy-300">Результат</p>
              <p className="text-sm text-navy-200">{parsed.ok ? '' : parsed.error}</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={saveOpen} title="Сохранить расчёт" onClose={() => setSaveOpen(false)}>
        <form onSubmit={handleSave} className="space-y-5" noValidate>
          <Field label="Название" htmlFor="calc-title" hint="Например: рейс Москва - Казань">
            <input
              id="calc-title"
              className={inputClass}
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </Field>
          {saveError ? <Alert tone="error">{saveError}</Alert> : null}
          <Button type="submit" fullWidth loading={saving}>
            Сохранить
          </Button>
        </form>
      </Modal>
    </div>
  );
}
