import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface PlanSelectionState {
  tplLimitAdjustment: number;
  tplAdjustmentAmount: number;
  netPremium: number;
  brokerCommissionPercent: number;
  brokerCommissionAmount: number;
  totalAnnualPremium: number;
  currency?: string;
  insurerName?: string;
  coverageAmount?: number;

  setSelectedPlan: (
    payload: Partial<Omit<PlanSelectionState, "setSelectedPlan" | "clear">>,
  ) => void;

  clear: () => void;
}

export const usePlanSelectionStore = create<PlanSelectionState>()(
  devtools(
    (set) => ({
      tplLimitAdjustment: 0,
      tplAdjustmentAmount: 0,
      netPremium: 0,
      brokerCommissionPercent: 0,
      brokerCommissionAmount: 0,
      totalAnnualPremium: 0,
      currency: undefined,
      insurerName: undefined,
      coverageAmount: undefined,

      setSelectedPlan: (payload) =>
        set((prev) => ({
          ...prev,
          ...payload,
        })),

      clear: () =>
        set({
          tplLimitAdjustment: 0,
          tplAdjustmentAmount: 0,
          netPremium: 0,
          brokerCommissionPercent: 0,
          brokerCommissionAmount: 0,
          totalAnnualPremium: 0,
          currency: undefined,
          insurerName: undefined,
          coverageAmount: undefined,
        }),
    }),
    { name: "PlanSelectionStore" },
  ),
);
