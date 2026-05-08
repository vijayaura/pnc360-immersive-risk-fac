import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api/client';
import type { PaginatedResult, Plan, PlanInput, PlanStatus } from '@/lib/types';

const BASE_PATH = '/plans';

export interface ListPlansQuery {
  status?: PlanStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listPlans(query: ListPlansQuery = {}): Promise<PaginatedResult<Plan>> {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.search) params.set('search', query.search);
  if (typeof query.page === 'number') params.set('page', String(query.page));
  if (typeof query.pageSize === 'number') params.set('pageSize', String(query.pageSize));

  const qs = params.toString();
  const path = qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
  return apiGet<PaginatedResult<Plan>>(path);
}

export async function getPlan(planId: string): Promise<Plan> {
  return apiGet<Plan>(`${BASE_PATH}/${encodeURIComponent(planId)}`);
}

export async function createPlan(input: PlanInput): Promise<Plan> {
  return apiPost<Plan>(BASE_PATH, input);
}

export async function updatePlan(planId: string, input: Partial<PlanInput>): Promise<Plan> {
  return apiPut<Plan>(`${BASE_PATH}/${encodeURIComponent(planId)}`, input);
}

export async function deletePlan(planId: string): Promise<{ success: boolean }>{
  return apiDelete<{ success: boolean }>(`${BASE_PATH}/${encodeURIComponent(planId)}`);
}


