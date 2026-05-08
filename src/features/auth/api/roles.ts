import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/client';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete';

// Permission structure returned in role response
export interface RolePermission {
  permissionKey: string;
  permissionName: string;
  groupName: string;
  actions: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
}

export interface AvailablePermission {
  id: string;
  key: string;
  name: string;
  actions: PermissionAction[];
}

// Permission group from initial data endpoint
export interface PermissionGroup {
  groupId: string;
  groupName: string;
  permissions: AvailablePermission[];
}

// Role response from backend
// Note: List endpoints may return roles without all fields
export interface Role {
  id: string;
  name: string;
  description?: string;
  type: 'main' | 'sub';
  organizationId?: string;
  userCount: number;
  permissionCount?: number; // Added for the optimized dashboard view
  permissions?: RolePermission[];
}

// Sub-role structure (for future use)
export interface SubRole {
  id: string;
  name: string;
  parentRole: string;
  userCount: number;
}

export interface SubRoleGroup {
  parentRole: string;
  subRoles: SubRole[];
}

// Initial data response from GET /tenant/roles-permissions
export interface RolesPermissionsResponse {
  roles: Role[];
  subRoles: SubRoleGroup[];
  permissions: PermissionGroup[];
  superAdminMatrix: Record<string, Record<string, boolean>>;
}

// Request payloads
export interface PermissionPayload {
  permissionKey: string;
  actions: PermissionAction[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: PermissionPayload[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: PermissionPayload[];
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
}

// ==================== API Functions ====================

const BASE_URL = '/auth-matrix';

/**
 * Get initial data for Role Management UI
 * Returns roles, permissions (grouped), and superAdminMatrix
 */
export async function getRolesPermissions(
  organizationId?: string,
): Promise<RolesPermissionsResponse> {
  const params: Record<string, string> = {};
  if (organizationId) params.organizationId = organizationId;

  return apiGet<RolesPermissionsResponse>(`${BASE_URL}/tenant/roles-permissions`, {
    params,
  });
}

/**
 * List all roles for the organization
 * Filters by type='main' for MVP (sub-roles not supported yet)
 */
export async function getRoles(organizationId?: string): Promise<Role[]> {
  const params: Record<string, string> = {};
  if (organizationId) params.organizationId = organizationId;

  const response = await apiGet<{ roles: Role[] } | Role[]>(`${BASE_URL}/tenant/roles`, {
    params,
  });

  // Backend might return a flat array or a wrapped object { roles: [] }
  const rolesArray = Array.isArray(response)
    ? response
    : ((response as { roles?: Role[] }).roles ?? []);

  // Some backends omit `type` on the list payload; keep those roles so
  // richer fields like assignedProductCount are not lost in the UI.
  return rolesArray.filter((role: Role) => !role.type || role.type === 'main');
}

/**
 * Get a single role by ID with full details including permissions
 * Use this when editing a role to get the complete permission data
 */
export async function getRoleById(id: string, organizationId?: string): Promise<Role> {
  const params: Record<string, string> = {};
  if (organizationId) params.organizationId = organizationId;

  return apiGet<Role>(`${BASE_URL}/tenant/roles/${id}`, {
    params,
  });
}

/**
 * Create a new custom role
 */
export async function createRole(data: CreateRoleRequest, organizationId?: string): Promise<Role> {
  const payload = { ...data, organizationId };
  const params: Record<string, string> = {};
  if (organizationId) params.organizationId = organizationId;

  return apiPost<Role>(`${BASE_URL}/tenant/roles`, payload, {
    params,
  });
}

/**
 * Create a new sub-role
 */
export async function createSubRole(data: {
  name: string;
  parentRoleId: string;
  organizationId?: string;
}): Promise<Role> {
  const params: Record<string, string> = {};
  if (data.organizationId) params.organizationId = data.organizationId;
  return apiPost<Role>(`${BASE_URL}/tenant/sub-roles`, data, { params });
}

/**
 * Update an existing role (name, description, and/or permissions)
 * Note: If permissions are provided, they REPLACE all existing permissions
 */
export async function updateRole(
  id: string,
  data: UpdateRoleRequest,
  organizationId?: string,
): Promise<Role> {
  const payload = { ...data, organizationId };
  const params: Record<string, string> = {};
  if (organizationId) params.organizationId = organizationId;

  return apiPut<Role>(`${BASE_URL}/tenant/roles/${id}`, payload, {
    params,
  });
}

/**
 * Bulk edit permissions across multiple roles
 */
export async function bulkUpdatePermissions(
  permissions: PermissionPayload[],
  organizationId?: string,
): Promise<void> {
  const params: Record<string, string> = {};
  if (organizationId) params.organizationId = organizationId;
  return apiPut(`${BASE_URL}/tenant/permissions`, { permissions }, { params });
}

/**
 * Delete a role
 * Will fail if role is assigned to users
 */
export async function deleteRole(
  id: string,
  organizationId?: string,
): Promise<{ message: string }> {
  const params: Record<string, string> = {};
  if (organizationId) params.organizationId = organizationId;

  return apiDelete<{ message: string }>(`${BASE_URL}/tenant/roles/${id}`, {
    params,
  });
}

/**
 * Assign a role to a user
 * Called AFTER user creation (separate from user creation API)
 */
export async function assignRoleToUser(
  userId: string,
  roleId: string,
  organizationId?: string,
): Promise<void> {
  return apiPost(`${BASE_URL}/tenant/assign-role`, {
    userId,
    roleId,
    organizationId,
  });
}

/**
 * Remove role assignment from a user
 */
export async function unassignRole(userId: string, organizationId?: string): Promise<void> {
  return apiDelete(`${BASE_URL}/tenant/assign-role/${userId}`, {
    params: { organizationId },
  });
}

// ==================== Helper Functions ====================

/**
 * Convert RolePermission array to PermissionPayload array (for API requests)
 */
export function rolePermissionsToPayload(permissions: RolePermission[]): PermissionPayload[] {
  return permissions
    .map((perm) => {
      const actions: PermissionAction[] = [];
      if (perm.actions.view) actions.push('view');
      if (perm.actions.create) actions.push('create');
      if (perm.actions.update) actions.push('update');
      if (perm.actions.delete) actions.push('delete');
      return {
        permissionKey: perm.permissionKey,
        actions,
      };
    })
    .filter((p) => p.actions.length > 0); // Only include permissions with at least one action
}

/**
 * Check if a permission is allowed by SuperAdmin matrix
 */
export function isPermissionAllowed(
  superAdminMatrix: Record<string, Record<string, boolean>>,
  userType: string,
  permissionKey: string,
): boolean {
  const typeMatrix = superAdminMatrix[userType.toLowerCase()];
  if (!typeMatrix) return true; // If no matrix for type, allow all
  return typeMatrix[permissionKey] !== false;
}

/**
 * Get display-friendly action label
 */
export function getActionLabel(action: PermissionAction): string {
  const labels: Record<PermissionAction, string> = {
    view: 'View',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
  };
  return labels[action];
}

// ==================== Static Permission Keys Reference ====================
// These are the 21 permission keys defined by the backend
// Always use the API response as the source of truth

export const PERMISSION_KEYS = [
  'productCreationManagement',
  'productAuthorityMatrix',
  'proposalFormDesign',
  'ratingConfigDesign',
  'documentDesign',
  'apiIntegrations',
  'uwRulesDesign',
  'mastersManagement',
  'insurersManagement',
  'brokersManagement',
  'insurerBrokerAssignments',
  'proposalFormSubmission',
  'quotesDashboardView',
  'policyDashboardView',
  'ratingConfigurator',
  'cewsConfigurator',
  'declarationDocuments',
  'policyWordings',
  'reinsuranceSetup',
  'endorsementsManagement',
  'uwManagement',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
