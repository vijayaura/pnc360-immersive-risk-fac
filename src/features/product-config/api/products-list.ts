import { apiGet } from '@/lib/api/client';

export interface ProductItem {
    category: string;
    createdAt: string;
    currency: string;
    id: string;
    name: string;
    organizationId: string;
    owner: string;
    status: string;
    updatedAt: string;
    version: string;
    description?: string;
    code?: string;
}
export interface ProductListResponse {
  items: ProductItem[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
export async function getProductsList(opts?: {
  page?: number;
  pageSize?: number;
  q?: string;
  assignedProduct?: boolean;
  suppressGlobalError?: boolean;
  skipCacheBust?: boolean;
  distributorOrgId?: string;
}): Promise<ProductListResponse> {
  const params: Record<string, string | number | boolean> = {};
  if (typeof opts?.page === "number") params.page = opts!.page;
  if (typeof opts?.pageSize === "number") params.limit = opts!.pageSize;
  if (opts?.q) params.q = opts.q;
  if (opts?.assignedProduct === true) params.assignedProduct = true;
  if (opts?.distributorOrgId) params.distributorOrgId = opts.distributorOrgId;

  const config: any = {
    params: Object.keys(params).length ? params : undefined,
    skipCacheBust: opts?.skipCacheBust ?? true,
  };

  if (opts?.suppressGlobalError) {
    config._suppressGlobalErrorToast = true;
  }

  return apiGet<ProductListResponse>("/product", config);
}
