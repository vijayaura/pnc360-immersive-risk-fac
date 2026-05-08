import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/client';
import type { RiskCategorisation, RiskCategory, RiskLevel, MasterValue } from '../utils/riskCategorisation';

// ─── API types ────────────────────────────────────────────────────────────────

export interface CreateRiskCategorisationPayload {
  name: string;
  titleLabelNames: string[];
  levelValues: MasterValue[][];
}

export interface UpdateRiskCategorisationPayload {
  name?: string;
  titleLabelNames?: string[];
  levelValues?: MasterValue[][];
}

export interface CreateRiskCategoryPayload {
  name: string;
  riskLevels: RiskLevel[];
  assignments: Record<string, string>;
}

export interface UpdateRiskCategoryPayload {
  name?: string;
  riskLevels?: RiskLevel[];
  assignments?: Record<string, string>;
}

// ─── API functions ────────────────────────────────────────────────────────────

const BASE = '/risk-categorisation';

export const riskCategorisationApi = {
  list: (): Promise<RiskCategorisation[]> =>
    apiGet<RiskCategorisation[]>(BASE),

  getOne: (rcId: string): Promise<RiskCategorisation> =>
    apiGet<RiskCategorisation>(`${BASE}/${rcId}`),

  create: (payload: CreateRiskCategorisationPayload): Promise<RiskCategorisation> =>
    apiPost<RiskCategorisation>(BASE, payload),

  update: (rcId: string, payload: UpdateRiskCategorisationPayload): Promise<RiskCategorisation> =>
    apiPatch<RiskCategorisation>(`${BASE}/${rcId}`, payload),

  remove: (rcId: string): Promise<void> =>
    apiDelete<void>(`${BASE}/${rcId}`),

  createCategory: (rcId: string, payload: CreateRiskCategoryPayload): Promise<RiskCategory> =>
    apiPost<RiskCategory>(`${BASE}/${rcId}/categories`, payload),

  updateCategory: (
    rcId: string,
    catId: string,
    payload: UpdateRiskCategoryPayload,
  ): Promise<RiskCategory> =>
    apiPatch<RiskCategory>(`${BASE}/${rcId}/categories/${catId}`, payload),

  removeCategory: (rcId: string, catId: string): Promise<void> =>
    apiDelete<void>(`${BASE}/${rcId}/categories/${catId}`),
};

// ─── Query keys ───────────────────────────────────────────────────────────────

export const RC_QUERY_KEY = ['risk-categorisations'] as const;

// ─── TanStack Query hooks ─────────────────────────────────────────────────────

export function useRiskCategorisations() {
  return useQuery({
    queryKey: RC_QUERY_KEY,
    queryFn: () => riskCategorisationApi.list(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useRiskCategorisation(rcId: string | undefined) {
  return useQuery({
    queryKey: [...RC_QUERY_KEY, rcId],
    queryFn: () => riskCategorisationApi.getOne(rcId!),
    enabled: Boolean(rcId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateRiskCategorisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRiskCategorisationPayload) =>
      riskCategorisationApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RC_QUERY_KEY });
    },
  });
}

export function useUpdateRiskCategorisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rcId, payload }: { rcId: string; payload: UpdateRiskCategorisationPayload }) =>
      riskCategorisationApi.update(rcId, payload),
    onSuccess: (data, { rcId }) => {
      // Update detail cache directly — prevents refetch/blink
      qc.setQueryData([...RC_QUERY_KEY, rcId], data);
      // Only invalidate the list query (exact match)
      qc.invalidateQueries({ queryKey: RC_QUERY_KEY, exact: true });
    },
  });
}

export function useDeleteRiskCategorisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rcId: string) => riskCategorisationApi.remove(rcId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RC_QUERY_KEY });
    },
  });
}

export function useCreateRiskCategory(rcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRiskCategoryPayload) =>
      riskCategorisationApi.createCategory(rcId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RC_QUERY_KEY });
    },
  });
}

export function useUpdateRiskCategory(rcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ catId, payload }: { catId: string; payload: UpdateRiskCategoryPayload }) =>
      riskCategorisationApi.updateCategory(rcId, catId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RC_QUERY_KEY });
    },
  });
}

export function useDeleteRiskCategory(rcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (catId: string) => riskCategorisationApi.removeCategory(rcId, catId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RC_QUERY_KEY });
    },
  });
}
