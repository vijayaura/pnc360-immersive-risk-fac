import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Property } from "@/data/mock-properties";

interface CopilotContextValue {
  property: Property | null;
  activeTab: string;
  setProperty: (p: Property | null) => void;
  setActiveTab: (tab: string) => void;
}

const CopilotContext = createContext<CopilotContextValue>({
  property: null,
  activeTab: "",
  setProperty: () => {},
  setActiveTab: () => {},
});

export function CopilotContextProvider({ children }: { children: ReactNode }) {
  const [property, setPropertyState] = useState<Property | null>(null);
  const [activeTab, setActiveTabState] = useState("");

  const setProperty = useCallback((p: Property | null) => setPropertyState(p), []);
  const setActiveTab = useCallback((tab: string) => setActiveTabState(tab), []);

  return (
    <CopilotContext.Provider value={{ property, activeTab, setProperty, setActiveTab }}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilotContext() {
  return useContext(CopilotContext);
}
