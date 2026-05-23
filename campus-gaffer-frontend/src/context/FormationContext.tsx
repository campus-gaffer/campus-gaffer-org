import { createContext, useContext, type ReactNode } from 'react';

export const DEFAULT_FORMATION = [1, 2, 1, 2] as const;

type FormationContextValue = {
  formation: readonly number[];
  formationLabel: string;
};

const FormationContext = createContext<FormationContextValue>({
  formation: DEFAULT_FORMATION,
  formationLabel: DEFAULT_FORMATION.join('-'),
});

export function FormationProvider({ children }: { children: ReactNode }) {
  const formation = DEFAULT_FORMATION;
  if (formation.reduce((a, b) => a + b, 0) !== 6) {
    throw new Error('Invalid formation');
  }
  const formationLabel = formation.join('-');

  return (
    <FormationContext.Provider value={{ formation, formationLabel }}>
      {children}
    </FormationContext.Provider>
  );
}

export function useFormation() {
  return useContext(FormationContext);
}
