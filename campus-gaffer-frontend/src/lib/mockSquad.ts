export interface Player {
  id: number;
  surname: string;
  squadNum: number;
  team: string;
  price: number;
  pts: number;
  mvp?: boolean;
}

export const SQUAD = {
  starters: [
    { id: 1, surname: 'Doyle', squadNum: 9, team: 'KCS', price: 9.5, pts: 11, mvp: true },
    { id: 2, surname: 'Mbeki', squadNum: 10, team: 'WAD', price: 8.0, pts: 7, mvp: false },
    { id: 3, surname: 'Diaz', squadNum: 8, team: 'TRN', price: 7.0, pts: 6, mvp: false },
    { id: 4, surname: 'Cohen', squadNum: 7, team: 'KCS', price: 6.5, pts: 4, mvp: false },
    { id: 5, surname: 'Bennett', squadNum: 4, team: 'KCS', price: 5.5, pts: 5, mvp: false },
    { id: 6, surname: 'Hartley', squadNum: 1, team: 'KCS', price: 5.0, pts: 4, mvp: false },
  ] as Player[],
  bench: [
    { id: 7, surname: 'Khan', squadNum: 11, team: 'STJ', price: 6.0, pts: 3 },
    { id: 8, surname: 'Schmidt', squadNum: 12, team: 'STJ', price: 6.5, pts: 0 },
    { id: 9, surname: 'Hall', squadNum: 13, team: 'HIL', price: 4.5, pts: 2 },
    { id: 10, surname: 'Andersen', squadNum: 14, team: 'PMB', price: 4.5, pts: 0 },
  ] as Player[],
};

export const SQUAD_LOCK_KEY = 'campus-gaffer-squad-locked';
export const SQUAD_DATA_KEY = 'campus-gaffer-squad';
export const SQUAD_ID_KEY = 'campus-gaffer-squad-id';
export const GW_KEY = 'campus-gaffer-gameweek';
export const USER_ID_KEY = 'campus-gaffer-user-id';
