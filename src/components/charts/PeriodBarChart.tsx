export interface ChartBucket {
  label: string;
  revenue: number;
  expenses: number;
}

interface PeriodBarChartProps {
  buckets: ChartBucket[];
}

export function PeriodBarChart({ buckets }: PeriodBarChartProps) {
  const maxValue = Math.max(1, ...buckets.flatMap((b) => [b.revenue, b.expenses]));
  const hasData = buckets.some((b) => b.revenue > 0 || b.expenses > 0);

  return (
    <div className="relative">
      <div className="flex h-56 items-end gap-1.5 border-b border-graphite-200 sm:gap-3">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div
                className="w-full max-w-[16px] origin-bottom animate-grow-bar rounded-t-md bg-navy-700"
                style={{ height: `${(bucket.revenue / maxValue) * 100}%` }}
                title={`Выручка: ${bucket.revenue}`}
              />
              <div
                className="w-full max-w-[16px] origin-bottom animate-grow-bar rounded-t-md bg-sky-400"
                style={{ height: `${(bucket.expenses / maxValue) * 100}%` }}
                title={`Расходы: ${bucket.expenses}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-3">
        {buckets.map((bucket) => (
          <span key={bucket.label} className="num min-w-0 flex-1 truncate text-center text-[11px] text-graphite-500">
            {bucket.label}
          </span>
        ))}
      </div>
      {!hasData ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
          <p className="rounded-xl bg-white/95 px-4 py-2 text-sm text-graphite-500 shadow-card">
            Пока нет данных за выбранный период
          </p>
        </div>
      ) : null}
    </div>
  );
}
