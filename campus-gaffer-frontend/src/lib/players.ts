export const TEAMS: Record<string, string> = {
  KCS: "King's", TRN: 'Trinity', WAD: 'Wadham',
  STJ: "St John's", PMB: 'Pembroke', MED: 'Medics',
  ENG: 'Engineers', LAW: 'Law FC', HIL: 'Hilltop', NTH: 'Northside',
};

export interface Player {
  id: string;
  name: string;
  team: string;
  price: number | null;
}

export const BUDGET = 65.0;
export const MAX_S = 6;
export const MAX_B = 4;
export const MAX_Q = 10;
