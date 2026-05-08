import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type SaveHandler = (() => Promise<void> | void) | null;

interface UnsavedChangesContextValue {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  setSaveHandler: (fn: SaveHandler) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | undefined>(undefined);

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);
  const [saveHandler, setSaveHandler] = useState<SaveHandler>(null);

  // beforeunload native guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // body attribute for global CSS hooks
  useEffect(() => {
    if (isDirty) document.body.setAttribute('data-unsaved', 'true');
    else document.body.removeAttribute('data-unsaved');
  }, [isDirty]);

  const value = useMemo<UnsavedChangesContextValue>(() => ({
    isDirty,
    setDirty: setIsDirty,
    setSaveHandler,
  }), [isDirty]);

  return (
    <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges(): UnsavedChangesContextValue {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) throw new Error('useUnsavedChanges must be used within UnsavedChangesProvider');
  return ctx;
}


