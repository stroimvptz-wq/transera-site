import { TRIP_STATUS_LABELS, TRIP_STATUS_STYLES, type TripStatus } from '@/lib/trips';

export function TripStatusBadge({ status }: { status: TripStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${TRIP_STATUS_STYLES[status]}`}
    >
      {TRIP_STATUS_LABELS[status]}
    </span>
  );
}
