import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface ModulePageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  stage: string;
}

export function ModulePage({ title, description, icon: Icon, stage }: ModulePageProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        <p className="text-graphite-500">{description}</p>
      </div>
      <Card className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-navy-900">Раздел в разработке</p>
          <p className="max-w-md text-sm text-graphite-500">{stage}</p>
        </div>
      </Card>
    </div>
  );
}
