import { create } from "zustand";
import { devtools } from "zustand/middleware";

// types/acceptQuote.ts

export interface SelectedPremium {
  basePremium: number;
  totalPremium: number;
  loadingAmount: number;
  discountAmount: number;
  feeAmount: number;
  currency: string;
}

export interface TplSelectedLimit {
  code: string;
  limitValue: number;
  description: string;
  pricingType: string;
  loading: number;
  premiumImpact: string;
  currency: string;
}

export interface TplConfiguration {
  defaultLimit: number;
  selectedLimit: TplSelectedLimit | null;
}

export interface Deductible {
  code: string;
  value: number;
  quoteOption: string;
  loading: number;
  premiumImpact: string;
}

export interface DeductiblesConfiguration {
  selectedDeductible: Deductible | null;
}

export interface ConfigurableItem {
  code: string;
  title: string;
  description: string;
  type: "Percentage" | "Fixed";
  pricingType: string;
  loading: number;
  premiumImpact: string;
  isMandatory: boolean;
  isOptional: boolean;
  selected: boolean;
  tags: string[];
}

export interface AcceptQuotePayload {
  decision: "auto_approve" | "manual_review";
  brokerOrgId: string;
  insurerOrgId: string;
  selectedPremium: SelectedPremium;
  tplConfiguration: TplConfiguration;
  deductiblesConfiguration: DeductiblesConfiguration;
  configurableItems: ConfigurableItem[];
  remarks: string;
}

interface AcceptQuoteState extends AcceptQuotePayload {
  setDecision: (decision: AcceptQuotePayload["decision"]) => void;
  setSelectedPremium: (premium: AcceptQuotePayload["selectedPremium"]) => void;
  setTplConfiguration: (tpl: AcceptQuotePayload["tplConfiguration"]) => void;
  setDeductiblesConfiguration: (deductible: AcceptQuotePayload["deductiblesConfiguration"]) => void;
  toggleConfigurableItem: (code: string, selected: boolean) => void;
  setRemarks: (remarks: string) => void;
  reset: () => void;
}

const initialState: AcceptQuotePayload = {
  decision: "auto_approve",
  brokerOrgId: "",
  insurerOrgId: "",
  selectedPremium: {
    basePremium: 0,
    totalPremium: 0,
    loadingAmount: 0,
    discountAmount: 0,
    feeAmount: 0,
    currency: "AED",
  },
  tplConfiguration: {
    defaultLimit: 0,
    selectedLimit: null,
  },
  deductiblesConfiguration: {
    selectedDeductible: null,
  },
  configurableItems: [],
  remarks: "",
};

export const useAcceptQuoteStore = create<AcceptQuoteState>()(
  devtools(
    (set) => ({
      ...initialState,

      setDecision: (decision) => set({ decision }),

      setSelectedPremium: (selectedPremium) => set({ selectedPremium }),

      setTplConfiguration: (tplConfiguration) => set({ tplConfiguration }),

      setDeductiblesConfiguration: (deductiblesConfiguration) => set({ deductiblesConfiguration }),

      toggleConfigurableItem: (code, selected) =>
        set((state) => ({
          configurableItems: state.configurableItems.map((item) =>
            item.code === code ? { ...item, selected } : item,
          ),
        })),

      setRemarks: (remarks) => set({ remarks }),

      reset: () => set(initialState),
    }),
    { name: "AcceptQuoteStore" },
  ),
);
