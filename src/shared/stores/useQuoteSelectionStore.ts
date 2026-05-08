import { create } from "zustand";
import { persist } from "zustand/middleware";
import { devtools } from "zustand/middleware";

interface QuoteSelectionState {
  insurerId: string | number | null;
  insurerOrganizationId: string | number | null;
  productId: string | number | null;
  responseId: string | null;
  acceptanceId: string | null;
  setSelection: (payload: {
    insurerId?: string | number | null;
    insurerOrganizationId?: string | number | null;
    productId?: string | number | null;
    responseId?: string | null;
    acceptanceId?: string | null;
  }) => void;
  clear: () => void;
}

export const useQuoteSelectionStore = create<QuoteSelectionState>()(
  devtools(
    persist(
      (set) => ({
        insurerId: null,
        insurerOrganizationId: null,
        productId: null,
        responseId: null,
        acceptanceId: null,
        setSelection: ({ insurerId, insurerOrganizationId, productId, responseId, acceptanceId }) =>
          set((prev) => ({
            insurerId: insurerId !== undefined ? insurerId : prev.insurerId,
            insurerOrganizationId:
              insurerOrganizationId !== undefined
                ? insurerOrganizationId
                : prev.insurerOrganizationId,
            productId: productId !== undefined ? productId : prev.productId,
            responseId: responseId !== undefined ? responseId : prev.responseId,
            acceptanceId: acceptanceId !== undefined ? acceptanceId : prev.acceptanceId,
          })),
        clear: () =>
          set({
            insurerId: null,
            insurerOrganizationId: null,
            productId: null,
            responseId: null,
            acceptanceId: null,
          }),
      }),
      {
        name: "quote-selection", // localStorage key
        partialize: (state) => ({
          insurerId: state.insurerId,
          insurerOrganizationId: state.insurerOrganizationId,
          productId: state.productId,
          responseId: state.responseId,
          acceptanceId: state.acceptanceId,
        }),
      },
    ),
    { name: "QuoteSelectionStore" },
  ),
);
