import { create } from "zustand";
import { persist } from "zustand/middleware";
import { devtools } from "zustand/middleware";
import type { UploadDeclarationDocumentResponse } from '@/features/product-config/required-docs/api/requiredDocuments';

type DocId = string | number;
type ResponseId = string | number;

export interface EndorsementUploadItem extends UploadDeclarationDocumentResponse {
  docId: DocId;
  responseId: ResponseId;
}

interface EndorsementUploadsState {
  uploadsByResponse: Record<string, Record<string, EndorsementUploadItem>>;
  setUploaded: (
    responseId: ResponseId,
    docId: DocId,
    payload: UploadDeclarationDocumentResponse,
  ) => void;
  removeUploaded: (responseId: ResponseId, docId: DocId) => void;
  getUploaded: (responseId: ResponseId, docId: DocId) => EndorsementUploadItem | undefined;
  getAll: (responseId: ResponseId) => Record<string, EndorsementUploadItem>;
  clearResponse: (responseId: ResponseId) => void;
  clearAll: () => void;
}

export const useEndorsementUploadsStore = create<EndorsementUploadsState>()(
  devtools(
    persist(
      (set, get) => ({
        uploadsByResponse: {},
        setUploaded: (responseId, docId, payload) =>
          set((state) => {
            const rid = String(responseId);
            const did = String(docId);
            const current = state.uploadsByResponse[rid] || {};
            return {
              uploadsByResponse: {
                ...state.uploadsByResponse,
                [rid]: {
                  ...current,
                  [did]: {
                    ...payload,
                    docId,
                    responseId,
                  },
                },
              },
            };
          }),
        removeUploaded: (responseId, docId) =>
          set((state) => {
            const rid = String(responseId);
            const did = String(docId);
            const current = state.uploadsByResponse[rid];
            if (!current) return state;
            const { [did]: _, ...rest } = current;
            return {
              uploadsByResponse: {
                ...state.uploadsByResponse,
                [rid]: rest,
              },
            };
          }),
        getUploaded: (responseId, docId) => {
          const rid = String(responseId);
          const did = String(docId);
          return get().uploadsByResponse[rid]?.[did];
        },
        getAll: (responseId) => {
          const rid = String(responseId);
          return get().uploadsByResponse[rid] || {};
        },
        clearResponse: (responseId) =>
          set((state) => {
            const rid = String(responseId);
            const { [rid]: _, ...rest } = state.uploadsByResponse;
            return { uploadsByResponse: rest };
          }),
        clearAll: () => set({ uploadsByResponse: {} }),
      }),
      {
        name: "endorsement-uploads",
        partialize: (state) => ({
          uploadsByResponse: state.uploadsByResponse,
        }),
      },
    ),
    { name: "EndorsementUploadsStore" },
  ),
);
