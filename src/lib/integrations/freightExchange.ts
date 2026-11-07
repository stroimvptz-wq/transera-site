export type FreightExchangeId = 'ati';

export type FreightExchangeStatus = 'not_connected' | 'connected';

export interface FreightExchangeInfo {
  id: FreightExchangeId;
  name: string;
  status: FreightExchangeStatus;
  requirement: string;
}

export const FREIGHT_EXCHANGES: FreightExchangeInfo[] = [
  {
    id: 'ati',
    name: 'ATI.SU',
    status: 'not_connected',
    requirement: 'Доступ только через официальный API после заключения договора с ATI.SU.',
  },
];

export interface FreightLoadQuery {
  originCity: string;
  destinationCity: string;
  pickupDate: string;
}

export interface FreightLoad {
  externalId: string;
  originCity: string;
  destinationCity: string;
  pickupDate: string;
  weightKg: number;
  offerRub: number | null;
}

export interface FreightExchangeClient {
  readonly id: FreightExchangeId;
  searchLoads(query: FreightLoadQuery): Promise<FreightLoad[]>;
}
