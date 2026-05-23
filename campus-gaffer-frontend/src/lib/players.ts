export const TEAMS: Record<string, string> = {
  KCS: "King's", TRN: 'Trinity', WAD: 'Wadham',
  STJ: "St John's", PMB: 'Pembroke', MED: 'Medics',
  ENG: 'Engineers', LAW: 'Law FC', HIL: 'Hilltop', NTH: 'Northside',
};

export interface Player {
  id: number;
  name: string;
  team: string;
  price: number | null;
}

export const PLAYERS = [
  { id: 1, name: 'Victor Nnah', team: 'KCS', price: 8.0, pts: 12 },
  { id: 2, name: 'Samuel Buchel', team: 'TRN', price: 7.5, pts: 10 },
  { id: 3, name: 'Silas Curpen', team: 'WAD', price: 7.0, pts: 9 },
  { id: 4, name: 'Chukwudi Chijioke', team: 'STJ', price: 6.5, pts: 8 },
  { id: 5, name: 'Kendrick Costales', team: 'PMB', price: 6.0, pts: 7 },
  { id: 6, name: 'Andre Effiok-Osu', team: 'MED', price: 5.5, pts: 6 },
  { id: 7, name: 'Godwin Osho', team: 'ENG', price: 5.0 , pts: 5 },
  { id: 8, name: 'Ava Byrne', team: 'LAW', price: 5.0, pts: 5 },
  { id: 9, name: 'Sadie Glaston', team: 'HIL', price: 4.5, pts: 4 },
  { id: 10, name: 'Tomas G', team: 'NTH', price: 4.5, pts: 4 },
  { id: 11, name: 'Marcus Osei', team: 'TRN', price: 6.5, pts: 7 },
  { id: 12, name: 'Priya Sharma', team: 'WAD', price: 6.0, pts: 6 },
  { id: 13, name: 'Luca Ferrari', team: 'STJ', price: 6.0, pts: 6 },
  { id: 14, name: 'Ben Kimura', team: 'PMB', price: 5.5, pts: 5 },
  { id: 15, name: 'Zara Williams', team: 'MED', price: 5.0, pts: 5 },
  { id: 16, name: "Finn O'Brien", team: 'ENG', price: 5.0, pts: 5 },
  { id: 17, name: 'Amara Diallo', team: 'LAW', price: 4.5, pts: 4 },
  { id: 18, name: 'Kenji Nakamura', team: 'HIL', price: 4.5, pts: 4 },
];

export const BUDGET = 65.0;
export const MAX_S = 6;
export const MAX_B = 4;
export const MAX_Q = 10;
