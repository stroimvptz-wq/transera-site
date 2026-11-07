import type { ReactNode } from 'react';

export const inputClass =
  'w-full rounded-xl border border-graphite-200 bg-white px-3.5 py-2.5 text-[15px] text-graphite-900 placeholder:text-graphite-400 shadow-sm transition-all duration-200 hover:border-graphite-300 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:bg-graphite-50 disabled:text-graphite-400';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-graphite-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-danger-700">{error}</p>
      ) : hint ? (
        <p className="text-sm text-graphite-500">{hint}</p>
      ) : null}
    </div>
  );
}
