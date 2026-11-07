import { useState } from 'react';
import { Calculator, LayoutDashboard, Truck, Users, FileText, Wallet, Settings, LogOut, Menu, X, Route, Building2 } from 'lucide-react';
import { Logo } from './components/Logo';
import { BoltCalculatorsDemo } from './components/calculators/BoltCalculatorsDemo';

type Visitor = { name: string; email: string; role: string; company: string };
const KEY = 'transera.demo.visitor';
const sections = [
  { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
  { id: 'calculators', label: 'Калькуляторы', icon: Calculator },
  { id: 'trips', label: 'Рейсы', icon: Route },
  { id: 'vehicles', label: 'Автомобили', icon: Truck },
  { id: 'drivers', label: 'Водители', icon: Users },
  { id: 'clients', label: 'Клиенты', icon: Building2 },
  { id: 'finance', label: 'Финансы', icon: Wallet },
  { id: 'documents', label: 'Документы', icon: FileText },
  { id: 'settings', label: 'Настройки', icon: Settings },
] as const;
const samples = [
  { route: 'Петрозаводск — Москва', distance: 1000, rate: 85, fuel: 32, consumption: 28 },
  { route: 'Санкт-Петербург — Петрозаводск', distance: 430, rate: 100, fuel: 32, consumption: 24 },
  { route: 'Москва — Санкт-Петербург', distance: 710, rate: 90, fuel: 32, consumption: 27 },
];
const money = (n: number) => Math.round(n).toLocaleString('ru-RU') + ' ₽';
function readVisitor(): Visitor | null { try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) as Visitor : null; } catch { return null; } }

export default function DemoApp() {
  const [visitor, setVisitor] = useState<Visitor | null>(readVisitor);
  const [register, setRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('Перевозчик');
  const [page, setPage] = useState('dashboard');
  const [menu, setMenu] = useState(false);
  const [distance, setDistance] = useState(1000);
  const [rate, setRate] = useState(85);
  const [fuel, setFuel] = useState(65);
  const [consumption, setConsumption] = useState(28);
  const [other, setOther] = useState(12000);
  const [saved, setSaved] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('transera.demo.calculations') || '[]') as string[]; } catch { return []; } });
  const income = distance * rate;
  const costs = distance / 100 * consumption * fuel + other;
  const profit = income - costs;
  const signIn = () => {
    if (!name.trim() || !email.includes('@')) return;
    const v = { name: name.trim(), email: email.trim(), role, company: company.trim() || 'Моя организация' };
    localStorage.setItem(KEY, JSON.stringify(v)); setVisitor(v);
  };
  const logout = () => { localStorage.removeItem(KEY); setVisitor(null); setPage('dashboard'); };
  const navigate = (id: string) => { setPage(id); setMenu(false); };
  const save = () => { const next = [new Date().toLocaleString('ru-RU') + ' — ' + money(profit) + ' прибыли', ...saved].slice(0, 20); setSaved(next); localStorage.setItem('transera.demo.calculations', JSON.stringify(next)); };
  if (!visitor) return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden bg-navy-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo tone="light" showSlogan />
        <div><h1 className="text-4xl font-bold leading-tight text-white">Управляйте перевозками, а не таблицами</h1>
          <p className="mt-6 text-lg text-navy-200">Рейсы, расчёты, финансы и аналитика — в одной системе.</p>
          <p className="mt-5 rounded-xl border border-sky-400/30 bg-sky-500/10 p-4 text-sm text-sky-200">Демонстрационная версия: никаких реальных заказов и платежей.</p></div>
        <p className="text-sm text-navy-300">© TRANSERA · Демонстрация</p>
      </aside>
      <main className="flex items-center justify-center bg-white px-5 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden"><Logo showSlogan /></div>
          <div><h2 className="text-3xl font-bold text-navy-900">{register ? 'Пробная регистрация' : 'Добро пожаловать в TRANSERA'}</h2>
            <p className="mt-2 text-graphite-500">Попробуйте платформу бесплатно без подключения к серверу.</p></div>
          <div className="grid grid-cols-2 rounded-xl bg-graphite-100 p-1">
            <button className={(!register ? 'bg-white shadow-sm ' : '') + 'rounded-lg p-3 text-sm font-medium'} onClick={() => setRegister(false)}>Вход в демо</button>
            <button className={(register ? 'bg-white shadow-sm ' : '') + 'rounded-lg p-3 text-sm font-medium'} onClick={() => setRegister(true)}>Регистрация</button>
          </div>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); signIn(); }}>
            <label className="block text-sm font-medium text-navy-900">Ваше имя<input required value={name} onChange={e => setName(e.target.value)} placeholder="Иван Иванов" className="mt-2 w-full rounded-xl border border-graphite-200 p-3 outline-none focus:border-sky-500" /></label>
            <label className="block text-sm font-medium text-navy-900">Электронная почта<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mail.ru" className="mt-2 w-full rounded-xl border border-graphite-200 p-3 outline-none focus:border-sky-500" /></label>
            {register && <label className="block text-sm font-medium text-navy-900">Название организации<input value={company} onChange={e => setCompany(e.target.value)} placeholder="Название компании" className="mt-2 w-full rounded-xl border border-graphite-200 p-3" /></label>}
            <label className="block text-sm font-medium text-navy-900">Ваша роль<select value={role} onChange={e => setRole(e.target.value)} className="mt-2 w-full rounded-xl border border-graphite-200 bg-white p-3"><option>Перевозчик</option><option>Экспедитор</option><option>Грузовладелец</option></select></label>
            <button type="submit" className="w-full rounded-xl bg-navy-800 px-5 py-3 font-semibold text-white hover:bg-navy-700">Войти в демонстрацию</button>
          </form>
          <p className="text-xs leading-relaxed text-graphite-500">Это не настоящая регистрация. Пароль не требуется, данные сохраняются только в этом браузере. Не вводите конфиденциальную информацию.</p>
        </div>
      </main>
    </div>
  );
  return (
    <div className="min-h-screen bg-graphite-50">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy-900 p-4 lg:hidden"><Logo tone="light" /><button onClick={() => setMenu(!menu)} className="text-white">{menu ? <X /> : <Menu />}</button></header>
      <aside className={(menu ? 'translate-x-0 ' : '-translate-x-full ') + 'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 text-white transition-transform lg:translate-x-0'}>
        <div className="px-5 py-6"><Logo tone="light" /><p className="mt-5 rounded-lg bg-sky-500/15 px-3 py-2 text-xs text-sky-200">ДЕМОНСТРАЦИОННЫЙ РЕЖИМ</p></div>
        <div className="mx-4 mb-3 rounded-xl bg-navy-800 p-3 text-sm"><p className="font-semibold">{visitor.company}</p><p className="mt-1 text-xs text-navy-300">{visitor.role}</p></div>
        <nav className="flex-1 space-y-1 overflow-auto px-3">{sections.map(s => <button key={s.id} onClick={() => navigate(s.id)} className={(page === s.id ? 'bg-sky-500/20 text-white ' : 'text-navy-200 hover:bg-navy-800 ') + 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm'}><s.icon size={18} />{s.label}</button>)}</nav>
        <div className="border-t border-navy-800 p-4 text-sm"><p className="mb-2 truncate">{visitor.name}</p><button onClick={logout} className="flex items-center gap-2 text-navy-200"><LogOut size={16} />Выйти из демо</button></div>
      </aside>
      <main className="mx-auto max-w-7xl px-4 py-7 lg:ml-64 lg:px-9">
        {page === 'dashboard' && <div className="space-y-6"><div><h1 className="text-3xl font-bold text-navy-900">Главная</h1><p className="mt-1 text-graphite-500">Здравствуйте, {visitor.name}! Это демонстрационные данные.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Выручка', '1 285 000 ₽'], ['Расходы', '872 000 ₽'], ['Прибыль', '413 000 ₽'], ['Рейсов за месяц', '24']].map(([label,value]) => <div key={label} className="rounded-2xl bg-white p-6 shadow-card"><p className="text-sm text-graphite-500">{label}</p><p className="mt-3 text-2xl font-bold text-navy-900">{value}</p><p className="mt-3 text-xs text-sky-600">Пример показателей</p></div>)}</div>
          <div className="rounded-2xl bg-white p-6 shadow-card"><h2 className="text-xl font-bold text-navy-900">Последние рейсы</h2><div className="mt-5 space-y-3">{samples.map(s => <div key={s.route} className="flex flex-wrap items-center justify-between gap-3 border-b border-graphite-100 py-3"><span className="font-medium">{s.route}</span><span className="text-sm text-graphite-500">{s.distance} км</span><span className="font-semibold text-navy-900">{money(s.distance*s.rate)}</span></div>)}</div></div>
          <button onClick={() => navigate('calculators')} className="rounded-xl bg-navy-800 px-5 py-3 font-medium text-white">Рассчитать стоимость рейса</button>
        </div>}
        {page === 'calculators' && <BoltCalculatorsDemo />}
        {page === 'trips' && <div className="space-y-5"><h1 className="text-3xl font-bold">Рейсы</h1><p className="text-graphite-500">Примеры рейсов для ознакомления.</p>{samples.map((s,i) => <div key={s.route} className="rounded-2xl bg-white p-6 shadow-card"><div className="flex flex-wrap justify-between gap-3"><strong>{s.route}</strong><span className="rounded-lg bg-sky-50 px-3 py-1 text-sm text-sky-700">{i===0?'В пути':i===1?'Завершён':'Запланирован'}</span></div><p className="mt-3 text-graphite-500">{s.distance} км · Стоимость {money(s.distance*s.rate)}</p></div>)}</div>}
        {page === 'settings' && <div className="space-y-5"><h1 className="text-3xl font-bold">Настройки профиля</h1><div className="rounded-2xl bg-white p-6 shadow-card"><p>Имя: {visitor.name}</p><p className="mt-3">Email: {visitor.email}</p><p className="mt-3">Роль: {visitor.role}</p><p className="mt-3">Организация: {visitor.company}</p><p className="mt-5 text-sm text-graphite-500">Профиль хранится локально на вашем устройстве.</p></div></div>}
        {!['dashboard','calculators','trips','settings'].includes(page) && <div className="space-y-5"><h1 className="text-3xl font-bold text-navy-900">{sections.find(s=>s.id===page)?.label}</h1><div className="rounded-2xl bg-white p-8 shadow-card"><p className="text-lg font-medium text-navy-900">Раздел в разработке</p><p className="mt-3 text-graphite-500">Этот модуль появится в следующих версиях TRANSERA. Сейчас доступен ознакомительный интерфейс.</p></div></div>}
        <p className="mt-10 border-t border-graphite-200 pt-5 text-xs text-graphite-500">TRANSERA · Демо. Данные вымышлены. Регистрация не создаёт аккаунт на сервере.</p>
      </main>
    </div>
  );
}
