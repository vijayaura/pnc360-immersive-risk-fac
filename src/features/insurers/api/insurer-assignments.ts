import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api/client';

export interface AssignProductsRequest {
  productIds: string[]; // Array of product UUIDs
}

export interface AssignProductsResponse {
  message: string;
  distributerOrgId: string;
  assignedProductIds: string[];
  skippedProductIds: string[];
  totalAssigned: number;
  totalSkipped: number;
}

// Legacy request/response for backwards compatibility
export interface UpdateBrokerProductAssignmentsParams {
  assigned_product_ids: (number | string)[];
}

export interface UpdateBrokerProductAssignmentsResponse {
  message: string;
  insurer_id?: number;
  broker_id?: number;
  assigned_product_ids: (number | string)[];
  skipped_product_ids: (number | string)[];
  totalAssigned?: number;
  totalSkipped?: number;
}

/**
 * Assign products to a distributor (replace-all operation)
 * Uses new backend API: POST /underwriter/distributors/:distributerOrgId/products
 *
 * IMPORTANT: This is a replace-all operation. Products not in the list will be unassigned.
 */
export async function updateBrokerProductAssignments(
  _insurerId: number | string, // Parameter kept for backwards compatibility but not used
  brokerId: number | string,
  params: UpdateBrokerProductAssignmentsParams,
): Promise<UpdateBrokerProductAssignmentsResponse> {
  try {
    // Convert product IDs to strings for new API
    const productIds = params.assigned_product_ids.map((id) => String(id));

    // Try new API first
    const response = await apiPost<AssignProductsResponse>(
      `/underwriter/distributors/${encodeURIComponent(String(brokerId))}/products`,
      { productIds },
    );

    // Map new response to legacy format for backwards compatibility
    return {
      message: response.message,
      assigned_product_ids: response.assignedProductIds,
      skipped_product_ids: response.skippedProductIds,
      totalAssigned: response.totalAssigned,
      totalSkipped: response.totalSkipped,
    };
  } catch (error: unknown) {
    const apiError = error as { status?: number };
    // If new API fails with 404, fall back to old API
    if (apiError?.status === 404) {
      console.warn('[API] New assign products endpoint not found, falling back to legacy API');
      return apiPut<UpdateBrokerProductAssignmentsResponse>(
        `/insurer/${encodeURIComponent(String(brokerId))}/products?insurer_id=${encodeURIComponent(
          String(_insurerId),
        )}`,
        {
          assigned_product_ids: params.assigned_product_ids.map((id) => Number(id)),
        },
      );
    }
    throw error;
  }
}
