import { create } from "zustand";

export type TabValue = "quotes" | "referrals" | "fac-in" | "policies" | "endorsements";

export interface InsurerDashboardState {
  activeTab: TabValue;
  selectedProducts: string[];
  quotePage: number;
  policyPage: number;
  quoteSearch: string;
  quoteStatusFilter?: string;
  setActiveTab: (tab: TabValue) => void;
  setSelectedProducts: (products: string[]) => void;
  setQuotePage: (page: number) => void;
  setPolicyPage: (page: number) => void;
  setQuoteSearch: (term: string) => void;
  setQuoteStatusFilter: (status?: string) => void;
  reset: () => void;
}

export const useInsurerDashboardStore = create<InsurerDashboardState>((set) => ({
  activeTab: "quotes",
  selectedProducts: [],
  quotePage: 1,
  policyPage: 1,
  quoteSearch: "",
  quoteStatusFilter: undefined,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedProducts: (products) => set({ selectedProducts: products }),
  setQuotePage: (page) => set({ quotePage: page }),
  setPolicyPage: (page) => set({ policyPage: page }),
  setQuoteSearch: (term) => set({ quoteSearch: term }),
  setQuoteStatusFilter: (status) => set({ quoteStatusFilter: status }),
  reset: () =>
    set({
      activeTab: "quotes",
      selectedProducts: [],
      quotePage: 1,
      policyPage: 1,
      quoteSearch: "",
      quoteStatusFilter: undefined,
    }),
}));
