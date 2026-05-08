import { apiGet, apiPost } from '@/lib/api/client';

export type Role = 'insurer' | 'reinsurer' | 'broker';
export type SubRole = string; // e.g., "Broker Admin", "Broker User", "Insurer Admin", etc.

export interface Feature {
  id: string;
  category: string;
  name: string;
}

export interface Permission {
  read: boolean;
  write: boolean;
}

export interface AuthorityMatrix {
  productId: string;
  matrix: Record<string, Record<Role, Record<SubRole, Permission>>>;
}

export interface AuthorityMatrixCheckRequest {
  productId: string;
  featureId: string;
  role: Role;
}

export interface AuthorityMatrixCheckResponse {
  hasAccess: boolean;
}

// Get authority matrix for a product
export async function getAuthorityMatrix(productId: string): Promise<AuthorityMatrix> {
  return apiGet<AuthorityMatrix>(`/admin/products/${productId}/authority-matrix`);
}

// Save authority matrix for a product
export async function saveAuthorityMatrix(productId: string, matrix: Record<string, Record<Role, Record<SubRole, Permission>>>): Promise<AuthorityMatrix> {
  return apiPost<AuthorityMatrix>(`/admin/products/${productId}/authority-matrix`, { matrix });
}

// Check user permissions for a specific feature
export async function checkFeatureAccess(productId: string, featureId: string, role: Role): Promise<boolean> {
  const response = await apiGet<AuthorityMatrixCheckResponse>(
    `/admin/products/${productId}/authority-matrix/check?featureId=${featureId}&role=${role}`
  );
  return response.hasAccess;
}

