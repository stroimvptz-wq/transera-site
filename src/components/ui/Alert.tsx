import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type Tone = 'error' | 'success' | 'info';

const TONE_CLASSES: Record<Tone, string> = {
  error: 'border-danger-500/30 bg-danger-50 text-danger-700',
  success: 'border-success-500/30 bg-success-50 text-success-700',
  info: 'border-sky-200 bg-sky-50 text-navy-800',
};

const TONE_ICONS: Record<Tone, typeof Info> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export function Alert({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  const Icon = TONE_ICONS[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm animate-fade-in ${TONE_CLASSES[tone]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
