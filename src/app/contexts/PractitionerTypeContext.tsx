import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PractitionerType } from '../components/PractitionerTypeDetailModal';
import { practitionerTypeService } from '../../lib/services/practitionerTypeService';
import { getToken } from '../../lib/api';

interface PractitionerTypeContextType {
  practitionerTypes: PractitionerType[];
  updatePractitionerTypes: (types: PractitionerType[]) => void;
  getPractitionerTypeById: (id: string) => PractitionerType | undefined;
  getActivePractitionerTypes: () => PractitionerType[];
}

const PractitionerTypeContext = createContext<PractitionerTypeContextType | null>(null);

export const usePractitionerTypes = () => {
  const context = useContext(PractitionerTypeContext);
  if (!context) throw new Error('usePractitionerTypes must be used within PractitionerTypeProvider');
  return context;
};

// Re-exported for use by practitionerTypeService
export type { PractitionerType };

export function PractitionerTypeProvider({ children }: { children: ReactNode }) {
  const [practitionerTypes, setPractitionerTypes] = useState<PractitionerType[]>([]);

  // Load from API whenever a token is available
  const loadFromApi = () => {
    if (!getToken()) return;
    practitionerTypeService.getAll()
      .then(types => setPractitionerTypes(types))
      .catch(() => {/* silently keep existing data */});
  };

  useEffect(() => {
    loadFromApi();

    // Reload when user logs in (auth:unauthorized cleared means they may log back in)
    const onStorage = () => loadFromApi();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updatePractitionerTypes = (types: PractitionerType[]) => {
    setPractitionerTypes(types);
  };

  const getPractitionerTypeById = (id: string) => {
    return practitionerTypes.find((type) => type.id === id);
  };

  const getActivePractitionerTypes = () => {
    return practitionerTypes.filter((type) => type.active);
  };

  return (
    <PractitionerTypeContext.Provider
      value={{
        practitionerTypes,
        updatePractitionerTypes,
        getPractitionerTypeById,
        getActivePractitionerTypes,
      }}
    >
      {children}
    </PractitionerTypeContext.Provider>
  );
}
