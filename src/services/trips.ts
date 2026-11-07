import { supabase } from '@/lib/supabase';
import { TRIP_NUMBER_FIELDS, type Trip, type TripInput, type TripStatus } from '@/lib/trips';

export interface TripStatusChange {
  id: string;
  status: TripStatus;
  changedAt: string;
}

type TripRow = Record<string, unknown>;

const NUMBER_KEYS = new Set<string>(TRIP_NUMBER_FIELDS);

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function toTrip(row: TripRow): Trip {
  const entries = Object.entries(row).map(([key, value]) => {
    const camelKey = snakeToCamel(key);
    return [camelKey, NUMBER_KEYS.has(camelKey) ? Number(value) : value];
  });
  return Object.fromEntries(entries) as Trip;
}

function toRow(input: TripInput): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [camelToSnake(key), value]));
}

const TRIP_LIST_LIMIT = 500;

export async function fetchTrips(organizationId: string): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('organization_id', organizationId)
    .order('trip_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(TRIP_LIST_LIMIT);
  if (error) throw error;
  return ((data ?? []) as TripRow[]).map(toTrip);
}

export async function fetchTripHistory(tripId: string): Promise<TripStatusChange[]> {
  const { data, error } = await supabase
    .from('trip_status_history')
    .select('id, status, changed_at')
    .eq('trip_id', tripId)
    .order('changed_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as { id: string; status: TripStatus; changed_at: string }[]).map((row) => ({
    id: row.id,
    status: row.status,
    changedAt: row.changed_at,
  }));
}

export async function createTrip(organizationId: string, input: TripInput): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert({ organization_id: organizationId, ...toRow(input) })
    .select('*')
    .single();
  if (error) throw error;
  return toTrip(data as TripRow);
}

export async function updateTrip(tripId: string, input: TripInput): Promise<void> {
  const { error } = await supabase.from('trips').update(toRow(input)).eq('id', tripId);
  if (error) throw error;
}

export async function deleteTrip(tripId: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', tripId);
  if (error) throw error;
}

export async function fetchTripNumbers(organizationId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('trip_number')
    .eq('organization_id', organizationId);
  if (error) throw error;
  return ((data ?? []) as { trip_number: string }[]).map((row) => row.trip_number);
}
