import { supabase } from '@/lib/supabase';
import type { CalculatorKind, CalculatorValues } from '@/lib/calculators';

export interface SavedCalculation {
  id: string;
  userId: string;
  kind: CalculatorKind;
  title: string;
  inputs: CalculatorValues;
  results: CalculatorValues;
  createdAt: string;
}

interface CalculationRow {
  id: string;
  user_id: string;
  kind: CalculatorKind;
  title: string;
  inputs: unknown;
  results: unknown;
  created_at: string;
}

const HISTORY_LIMIT = 50;

function toNumberRecord(value: unknown): CalculatorValues {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === 'number'),
  );
}

export async function fetchCalculations(organizationId: string): Promise<SavedCalculation[]> {
  const { data, error } = await supabase
    .from('calculations')
    .select('id, user_id, kind, title, inputs, results, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);
  if (error) throw error;

  return ((data ?? []) as CalculationRow[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    title: row.title,
    inputs: toNumberRecord(row.inputs),
    results: toNumberRecord(row.results),
    createdAt: row.created_at,
  }));
}

export interface NewCalculation {
  organizationId: string;
  userId: string;
  kind: CalculatorKind;
  title: string;
  inputs: CalculatorValues;
  results: CalculatorValues;
}

export async function saveCalculation(input: NewCalculation): Promise<void> {
  const { error } = await supabase.from('calculations').insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    kind: input.kind,
    title: input.title,
    inputs: input.inputs,
    results: input.results,
  });
  if (error) throw error;
}

export async function deleteCalculation(id: string): Promise<void> {
  const { error } = await supabase.from('calculations').delete().eq('id', id);
  if (error) throw error;
}
