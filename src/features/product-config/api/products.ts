import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/client';
import type { AxiosRequestConfig } from 'axios';

export type ProductStatus = "Draft" | "Active" | "Archived";
export type ProductOwner = "insurer" | "reinsurer" | "broker";
export type ProductType = 'Single Cover' | 'Multi Cover';
type ProductCoverageRef = string | {
  id: string;
  label?: string;
  value?: string;
  active?: boolean;
  countryId?: string | null;
  regionId?: string | null;
};
export type ProductCategory =
  | "CASUALTY"
  | "ENGINEERING"
  | "GENERAL_ACCIDENT"
  | "GROUP_LIFE"
  | "LIABILITY"
  | "MARINE_CARGO"
  | "MARINE_HULL"
  | "MEDICAL"
  | "MOTOR"
  | "PROPERTY"
  | "WORKMENS_COMPENSATION"
  | "CONSTRUCTION"
  | "PROFESSIONAL"
  | "PERSONAL";

export interface Product {
  id: string;
  name: string;
  version: string | number;
  category: ProductCategory;
  currency: string;
  owner: ProductOwner;
  status: ProductStatus;
  description?: string;
  linkedInsurers?: number;
  linkedBrokers?: number;
  createdDate: string;
  modifiedDate: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  code?: string;
  organizationId?: string;
  validityStartDate?: string;
  validityEndDate?: string;
  validityPeriod?: number;
  validityPeriodUnit?: 'days' | 'months' | 'years';
  policyValidityPeriod?: number;
  policyValidityPeriodUnit?: 'days' | 'months' | 'years';
  autoActivation?: boolean;
  reinsuranceMandatory?: boolean;
  cartLikeCoverSelection?: boolean;
  customerProfileTemplateId?: string | null;
  customerCategory?: string | null;
  operatingCountries?: ProductCoverageRef[];
  operatingRegions?: ProductCoverageRef[];
  operatingZones?: ProductCoverageRef[];
  productType?: ProductType | string;
  sections?: ProductSection[];
}

export interface InsuranceProduct {
  id: string;
  name: string;
  category: string;
  currency: string;
  version: string;
  status: string;
  owner: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  code?: string;
  validityStartDate?: string;
  validityEndDate?: string;
  validityPeriod?: number;
  validityPeriodUnit?: 'days' | 'months' | 'years';
  policyValidityPeriod?: number;
  policyValidityPeriodUnit?: 'days' | 'months' | 'years';
  autoActivation?: boolean;
  reinsuranceMandatory?: boolean;
  customerProfileTemplateId?: string | null;
  customerCategory?: string | null;
}

export interface ProductCover {
  id?: string;
  name: string;
  code?: string;
  order?: number;
  createdAt?: string;
  riskCategorisationId?: string;
  riskCategoryId?: string;
}

export interface ProductSection {
  id?: string;
  name: string;
  order: number;
  covers: ProductCover[];
}

export interface CreateProductRequest {
  name: string;
  version?: string | number;
  category: ProductCategory;
  currency: string;
  owner: ProductOwner;
  status?: ProductStatus;
  description?: string;
  code?: string;
  validityStartDate?: string;
  validityEndDate?: string;
  validityPeriod?: number;
  validityPeriodUnit?: 'days' | 'months' | 'years';
  policyValidityPeriod?: number;
  policyValidityPeriodUnit?: 'days' | 'months' | 'years';
  autoActivation?: boolean;
  reinsuranceMandatory?: boolean;
  cartLikeCoverSelection?: boolean;
  customerProfileTemplateId?: string | null;
  oldCustomerProfileTemplateId?: string | null;
  customerCategory?: string | null;
  operatingCountries?: ProductCoverageRef[];
  operatingRegions?: ProductCoverageRef[];
  operatingZones?: ProductCoverageRef[];
  productType?: ProductType;
  sections?: ProductSection[];
}

export interface UpdateProductRequest {
  name?: string;
  version?: string | number;
  category?: ProductCategory;
  currency?: string;
  owner?: ProductOwner;
  status?: ProductStatus;
  description?: string;
  code?: string;
  validityStartDate?: string;
  validityEndDate?: string;
  validityPeriod?: number;
  validityPeriodUnit?: 'days' | 'months' | 'years';
  policyValidityPeriod?: number;
  policyValidityPeriodUnit?: 'days' | 'months' | 'years';
  autoActivation?: boolean;
  reinsuranceMandatory?: boolean;
  cartLikeCoverSelection?: boolean;
  customerProfileTemplateId?: string | null;
  oldCustomerProfileTemplateId?: string | null;
  customerCategory?: string | null;
  operatingCountries?: ProductCoverageRef[];
  operatingRegions?: ProductCoverageRef[];
  operatingZones?: ProductCoverageRef[];
  productType?: ProductType;
  sections?: ProductSection[];
}

export interface ProductListResponse {
  items?: InsuranceProduct[];
  meta?: {
    currentPage: number;
    itemCount: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ProductListFilters {
  status?: ProductStatus;
  category?: ProductCategory;
  owner?: ProductOwner;
  search?: string;
  page?: number;
  limit?: number;
}

// List all products with optional filters
export async function getProducts(filters?: ProductListFilters): Promise<ProductListResponse> {
  const validity = window.location.pathname.includes('/market-admin/')
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.owner) params.append("owner", filters.owner);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));

  const queryString = params.toString();
  // const url = `/admin/products${queryString ? `?${queryString}` : ""}`;
  const url = `/product?onlyActiveWithinValidity=${!validity}${queryString ? `&${queryString}` : ""}`;
  return apiGet<ProductListResponse>(url, { skipCacheBust: true } as any);
}

// Get product by ID
export async function getProduct(productId: string, config?: AxiosRequestConfig): Promise<Product> {
  return apiGet<Product>(`/product/${productId}`, config);
  // return apiGet<Product>(`/admin/products/${productId}`);
}

// Create new product
export async function createProduct(data: CreateProductRequest): Promise<Product> {
  // return apiPost<Product>("/admin/products", data); //OLD
  return apiPost<Product>("/product", data);
}

// Update product
export async function updateProduct(
  productId: string,
  data: UpdateProductRequest,
): Promise<Product> {
  // return apiPatch<Product>(`/admin/products/${productId}`, data);
  return apiPatch<Product>(`/product/${productId}`, data);
}

// Delete/archive product
export async function deleteProduct(productId: string): Promise<void> {
  // return apiDelete<void>(`/admin/products/${productId}`);
  return apiDelete<void>(`/product/${productId}`);
}

/**
 * DELETE /api/v1/product/:productId/cover/:coverId
 * Deletes a cover. If it was the last cover in its section,
 * the section is also deleted automatically by the backend.
 */
export async function deleteCover(
  productId: string,
  coverId: string,
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(
    `/product/${encodeURIComponent(productId)}/cover/${encodeURIComponent(coverId)}`,
  );
}

// Save product structure (sections + covers, including riskCategorisationId/riskCategoryId)
export async function saveProductStructure(
  productId: string,
  sections: ProductSection[],
): Promise<Product> {
  return apiPost<Product>(`/product/${productId}/structure`, { sections });
}

// Clone product
export async function cloneProduct(
  productId: string,
  newName?: string,
  newVersion?: string,
): Promise<Product> {
  return apiPost<Product>(`/admin/products/${productId}/clone`, { newName, newVersion });
}

// Create new version
export async function createProductVersion(productId: string, version: string): Promise<Product> {
  return apiPost<Product>(`/admin/products/${productId}/versions`, { version });
}

export interface RatingParameter {
  id: string;
  sectionId?: string;
  parentFieldId?: string | null;
  productId?: string;
  type: string;
  label: string;
  name: string;
  placeholder?: string | null;
  required?: boolean;
  isRatingParameter?: boolean;
  metadata?: Record<string, any> | null;
  validations?: any[] | null;
  masterId?: string | null;
  combinationRows?: any | null;
  combinationRowLabels?: any | null;
  fieldOrder?: number;
  options?: Array<
    | string
    | {
      masterValueId?: string;
      label: string;
      value: string;
      sortOrder?: number;
    }
  >;
  deletedAt?: string | null;
}
// Renamed to avoid conflict with ratings.ts
export async function getProductRatingParameters(productId: string): Promise<RatingParameter[]> {
  return apiGet<RatingParameter[]>(`/proposal-form/product/${productId}/rating-parameters`);
}
