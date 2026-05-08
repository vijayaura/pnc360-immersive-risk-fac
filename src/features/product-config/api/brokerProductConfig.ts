import { apiGet, apiPost } from '@/lib/api/client';

export interface BrokerProductConfig {
  id: string;
  orgId: string;
  productId: string;
  minCommission: number | null;
  baseCommission: number | null;
  maxCommission: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertBrokerProductConfigDto {
  orgId: string;
  productId: string;
  minCommission: number | null;
  baseCommission: number | null;
  maxCommission: number | null;
}

export async function getBrokerProductConfig(orgId: string): Promise<BrokerProductConfig[]> {
  return apiGet<BrokerProductConfig[]>('/broker-product-config', {
    params: { orgId },
  });
}

export async function upsertBrokerProductConfig(
  dtos: UpsertBrokerProductConfigDto[],
): Promise<BrokerProductConfig[]> {
  return apiPost<BrokerProductConfig[]>('/broker-product-config', dtos);
}
