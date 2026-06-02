import React, { createContext, useContext, useMemo, useState } from 'react';

import { mockProperties, type Property } from '../data/mock-data';

type CommandCenterContextValue = {
  property: Property;
  setPropertyId: (id: string) => void;
};

const CommandCenterContext = createContext<CommandCenterContextValue | null>(null);

export function CommandCenterProvider({ children }: { children: React.ReactNode }) {
  const [propertyId, setPropertyId] = useState(mockProperties[0]?.id ?? 'prop-001');

  const property = useMemo(
    () => mockProperties.find((p) => p.id === propertyId) ?? mockProperties[0]!,
    [propertyId],
  );

  const setPropertyIdStable = (id: string) => setPropertyId(id);

  return (
    <CommandCenterContext.Provider value={{ property, setPropertyId: setPropertyIdStable }}>
      {children}
    </CommandCenterContext.Provider>
  );
}

export function useCommandCenterProperty() {
  const ctx = useContext(CommandCenterContext);
  if (!ctx) {
    throw new Error('useCommandCenterProperty must be used within CommandCenterProvider');
  }
  return ctx;
}
