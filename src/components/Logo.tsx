import { Truck } from 'lucide-react';

interface LogoProps {
  tone?: 'light' | 'dark';
  showSlogan?: boolean;
}

export function Logo({ tone = 'dark', showSlogan = false }: LogoProps) {
  const isLight = tone === 'light';
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-900/20">
        <Truck className="h-5 w-5 text-white" strokeWidth={2.25} aria-hidden="true" />
      </div>
      <div className="leading-none">
        <p className={`text-lg font-bold tracking-[0.18em] ${isLight ? 'text-white' : 'text-navy-900'}`}>TRANSERA</p>
        {showSlogan ? (
          <p className={`mt-1.5 text-xs ${isLight ? 'text-navy-200' : 'text-graphite-500'}`}>Всё для грузоперевозок</p>
        ) : null}
      </div>
    </div>
  );
}
