import { useMemo, useState } from 'react';
import { ArrowLeft, Fuel, Gauge, Percent, Route, Truck, TrendingUp } from 'lucide-react';
import { CALCULATORS, formatResult, getDefaultValues, parseValues, type CalculatorDefinition, type CalculatorKind } from '@/lib/calculators';

const ICONS = { transport_cost: Truck, trip_cost: Route, fuel: Fuel, carrier_profit: TrendingUp, forwarder_margin: Percent, price_per_km: Gauge };
type RecordItem = { id: string; kind: CalculatorKind; title: string; at: string; results: Record<string, number> };
const STORAGE_KEY = 'transera.demo.bolt.calculations';
function readHistory(): RecordItem[] { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }

function Workspace({ calculator, onBack, onSave }: { calculator: CalculatorDefinition; onBack: () => void; onSave: (item: RecordItem) => void }) {
  const [raw, setRaw] = useState(() => getDefaultValues(calculator));
  const parsed = useMemo(() => parseValues(calculator, raw), [calculator, raw]);
  const results = useMemo(() => parsed.ok ? calculator.compute(parsed.values) : null, [calculator, parsed]);
  const [headline, ...details] = calculator.results;
  const save = () => {
    if (!results) return;
    const title = window.prompt('Название расчёта', calculator.title + ' ' + new Date().toLocaleDateString('ru-RU'));
    if (!title?.trim()) return;
    onSave({ id: String(Date.now()), kind: calculator.kind, title: title.trim().slice(0, 120), at: new Date().toLocaleString('ru-RU'), results });
    window.alert('Расчёт сохранён в этом браузере.');
  };
  return <div className="space-y-6">
    <div className="flex items-start gap-3"><button onClick={onBack} className="mt-1 rounded-lg p-2 text-graphite-500 hover:bg-graphite-100" aria-label="Назад"><ArrowLeft size={20}/></button><div><h2 className="text-2xl font-bold text-navy-900">{calculator.title}</h2><p className="mt-1 text-graphite-500">{calculator.description}</p></div></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
      <section className="rounded-2xl bg-white p-6 shadow-card"><h3 className="text-lg font-semibold text-navy-900">Исходные данные</h3><p className="mb-5 text-sm text-graphite-500">Результат пересчитывается сразу при изменении</p><div className="grid gap-4 sm:grid-cols-2">{calculator.fields.map(field => <label key={field.key} className="block text-sm font-medium text-navy-900">{field.label}<div className="relative mt-2"><input type="text" inputMode="decimal" value={raw[field.key] ?? ''} onChange={e => setRaw(v => ({...v,[field.key]:e.target.value}))} className="w-full rounded-xl border border-graphite-200 px-3 py-3 pr-20 outline-none focus:border-sky-400"/><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-graphite-500">{field.unit}</span></div></label>)}</div></section>
      <section className="space-y-5 rounded-2xl bg-navy-900 p-6 text-white shadow-lift lg:sticky lg:top-6">{results ? <><div><p className="text-sm text-navy-300">{headline.label}</p><p className="mt-2 text-3xl font-bold text-sky-300">{formatResult(results[headline.key],headline.format)}</p></div><dl className="divide-y divide-navy-800">{details.map(item => <div key={item.key} className="flex justify-between gap-4 py-3 text-sm"><dt className="text-navy-200">{item.label}</dt><dd className="font-semibold">{formatResult(results[item.key],item.format)}</dd></div>)}</dl><button onClick={save} className="w-full rounded-xl bg-sky-500 p-3 font-semibold text-navy-950 hover:bg-sky-400">Сохранить расчёт</button></> : <p className="text-sm text-navy-200">{parsed.ok ? 'Нет результата' : parsed.error}</p>}</section>
    </div>
  </div>;
}
export function BoltCalculatorsDemo() {
  const [selected, setSelected] = useState<CalculatorDefinition | null>(null);
  const [history, setHistory] = useState<RecordItem[]>(readHistory);
  const save = (item: RecordItem) => { const next = [item,...history].slice(0,50); setHistory(next); localStorage.setItem(STORAGE_KEY,JSON.stringify(next)); };
  const remove = (id: string) => { const next = history.filter(x=>x.id!==id);setHistory(next);localStorage.setItem(STORAGE_KEY,JSON.stringify(next)); };
  if (selected) return <Workspace key={selected.kind} calculator={selected} onBack={()=>setSelected(null)} onSave={save}/>;
  return <div className="space-y-8"><div><h1 className="text-3xl font-bold text-navy-900">Калькуляторы</h1><p className="mt-2 text-graphite-500">Шесть оригинальных калькуляторов TRANSERA из Bolt. Формулы и поля сохранены без изменений.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{CALCULATORS.map(calc => { const Icon=ICONS[calc.kind]; return <button key={calc.kind} onClick={()=>setSelected(calc)} className="group flex flex-col items-start gap-4 rounded-2xl border border-graphite-200 bg-white p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lift"><span className="rounded-xl bg-sky-50 p-3 text-sky-600 group-hover:bg-sky-500 group-hover:text-white"><Icon size={22}/></span><span><strong className="block text-navy-900">{calc.title}</strong><span className="mt-1 block text-sm text-graphite-500">{calc.description}</span></span></button>})}</div>
    <section className="rounded-2xl bg-white p-6 shadow-card"><h2 className="text-lg font-semibold text-navy-900">История расчётов</h2><p className="mt-1 text-sm text-graphite-500">Последние 50 расчётов, сохраняются только в этом браузере.</p><div className="mt-4 space-y-3">{history.length===0 ? <p className="text-sm text-graphite-500">Расчётов пока нет</p> : history.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-graphite-100 pb-3"><div><p className="font-medium text-navy-900">{item.title}</p><p className="text-xs text-graphite-500">{item.at}</p></div><button onClick={()=>remove(item.id)} className="text-sm text-graphite-500 hover:text-red-600">Удалить</button></div>)}</div></section>
  </div>;
}
