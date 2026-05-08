import { api, apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Raw DTO from backend
 *
 * Note: Backend may return either snake_case or camelCase fields depending on endpoint.
 * We keep both optional and normalize them in the mapper.
 */
export interface EnvironmentDTO {
  id?: number | string;
  name: string;
  marketId: number | string;
  // Support both snake_case and camelCase from backend
  client_name?: string;
  clientName?: string;
  description?: string | null;
  status: 'active' | 'inactive' | string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  // Legacy field names (snake_case counts)
  market_admins_count?: number;
  insurers_count?: number;
  brokers_count?: number;
  reinsurers_count?: number;
  // New field names (camelCase counts with 'total' prefix)
  totalMarketAdmin?: number;
  totalInsurer?: number;
  totalBroker?: number;
  totalReinsurer?: number;
  // Branding fields (per backend integration guide)
  theme_color?: string;
  themeColor?: string;
  logo_file_id?: string;
  logoFileId?: string;
  logoUrl?: string;
  logo_url?: string;
  // Additional fields from new API response
  adminEmail?: string;
  adminName?: string;
  adminPassword?: string;
  domain?: string;
  region?: string | null;
  plan?: string | null;
  dbConnectionRef?: string;
  provisioningOperationId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * UI-friendly Environment shape
 */
export interface Environment {
  id: number | string;
  marketId: number | string;
  name: string;
  clientName: string;
  description?: string;
  status: 'active' | 'inactive' | string;
  createdAt?: string;
  updatedAt?: string;
  marketAdmins?: number;
  insurers?: number;
  brokers?: number;
  reinsurers?: number;
  // Branding fields (per backend integration guide)
  themeColor?: string; // HEX format: "#3B82F6"
  logoFileId?: string; // UUID from upload
  logoUrl?: string; // Direct URL to the logo image
  // Admin contact
  adminEmail?: string;
}

/**
 * Request body for creating an environment
 */
export interface CreateEnvironmentRequest {
  name: string;
  clientName: string;
  description?: string | null;
  status?: 'active' | 'inactive';
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  // Branding fields
  themeColor?: string; // HEX format: "#3B82F6"
  logoFile?: File | null;
}

/**
 * Response from creating an environment
 */
export interface CreateEnvironmentResponse {
  message: string;
  environment: EnvironmentDTO;
}

/**
 * Update environment request (per Edit Environment API spec)
 */
export interface UpdateEnvironmentRequest {
  name?: string;
  clientName?: string;
  description?: string;
  themeColor?: string;
  status?: 'active' | 'inactive' | 'provisioning' | 'failed';
  logoUrl?: String | null;
  logo?: File | null; // For multipart/form-data upload
}

/**
 * Update environment response
 */
export interface UpdateEnvironmentResponse {
  message: string;
  market: {
    marketId: string;
    name: string;
    clientName: string;
    description?: string;
    status: string;
    region?: string;
    plan?: string;
    updatedAt: string;
  };
}

/**
 * Status change response
 */
export interface StatusChangeResponse {
  message?: string;
  status?: 'active' | 'inactive' | string;
}

/**
 * Authority Matrix Types
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface RolePermissions {
  [permissionId: string]: boolean;
}

export interface AuthorityMatrix {
  id: string;
  roles: Array<{
    id: string;
    name: string;
  }>;
  permissions: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
  }>;
  matrix: {
    [roleId: string]: {
      [permissionId: string]: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAuthorityMatrixRequest {
  matrix: {
    [roleId: string]: RolePermissions;
  };
}

/**
 * Dashboard Stats
 */
export interface SuperAdminDashboardStats {
  totalEnvironments: number;
  activeEnvironments: number;
  inactiveEnvironments: number;
  totalMarketAdmins: number;
  totalInsurers: number;
  totalBrokers: number;
  totalReinsurers: number;
  recentEnvironments?: Environment[];
}

/**
 * List Environments API Response
 * New response structure with items array and summary counts at parent level
 */
export interface ListEnvironmentsResponse {
  items: EnvironmentDTO[];
  totalEnvironment: number;
  totalActiveEnvironment: number;
  totalMarketAdmin: number;
  totalInsurer: number;
}

/**
 * Parsed list environments result with environments and summary stats
 */
export interface ListEnvironmentsResult {
  environments: Environment[];
  totalEnvironment: number;
  totalActiveEnvironment: number;
  totalMarketAdmin: number;
  totalInsurer: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Maps backend DTO to UI-friendly Environment shape
 */
function mapEnvironment(dto: EnvironmentDTO): Environment {
  return {
    // Use marketId as id if id is not present (new API response uses marketId as primary identifier)
    id: dto.id ?? dto.marketId,
    name: dto.name || '',
    marketId: dto.marketId,
    // Prefer camelCase if present, fall back to snake_case
    clientName: dto.clientName || dto.client_name || '',
    description: dto.description ?? undefined,
    status: dto.status,
    // Normalize created/updated timestamps from either field style
    createdAt: dto.createdAt || dto.created_at,
    updatedAt: dto.updatedAt || dto.updated_at,
    // Support both legacy (snake_case with _count suffix) and new (camelCase with total prefix) field names
    marketAdmins: dto.totalMarketAdmin ?? dto.market_admins_count,
    insurers: dto.totalInsurer ?? dto.insurers_count,
    brokers: dto.totalBroker ?? dto.brokers_count,
    reinsurers: dto.totalReinsurer ?? dto.reinsurers_count,
    // Branding fields (per backend integration guide)
    themeColor: dto.themeColor || dto.theme_color,
    logoFileId: dto.logoFileId || dto.logo_file_id,
    logoUrl: dto.logoUrl || dto.logo_url,
    adminEmail: dto.adminEmail,
  };
}

/**
 * Utility function to extract and map environments from various API response formats
 * Handles both legacy array format and new object format with items array
 *
 * @param data - Raw API response (array or object with items/environments)
 * @returns Parsed result with environments array and summary counts
 */
export function extractEnvironmentsFromResponse(
  data: EnvironmentDTO[] | ListEnvironmentsResponse | { environments: EnvironmentDTO[] } | unknown,
): ListEnvironmentsResult {
  // Default result structure
  const defaultResult: ListEnvironmentsResult = {
    environments: [],
    totalEnvironment: 0,
    totalActiveEnvironment: 0,
    totalMarketAdmin: 0,
    totalInsurer: 0,
  };

  if (!data) {
    return defaultResult;
  }

  // Case 1: New response structure with items array
  if (
    typeof data === 'object' &&
    'items' in data &&
    Array.isArray((data as ListEnvironmentsResponse).items)
  ) {
    const response = data as ListEnvironmentsResponse;
    return {
      environments: response.items.map(mapEnvironment),
      totalEnvironment: response.totalEnvironment ?? response.items.length,
      totalActiveEnvironment:
        response.totalActiveEnvironment ??
        response.items.filter((e) => e.status === 'active').length,
      totalMarketAdmin: response.totalMarketAdmin ?? 0,
      totalInsurer: response.totalInsurer ?? 0,
    };
  }

  // Case 2: Legacy array format (direct array of environments)
  if (Array.isArray(data)) {
    const environments = (data as EnvironmentDTO[]).map(mapEnvironment);
    return {
      environments,
      totalEnvironment: environments.length,
      totalActiveEnvironment: environments.filter((e) => e.status === 'active').length,
      totalMarketAdmin: environments.reduce((sum, e) => sum + (e.marketAdmins ?? 0), 0),
      totalInsurer: environments.reduce((sum, e) => sum + (e.insurers ?? 0), 0),
    };
  }

  // Case 3: Object with environments array (legacy wrapper format)
  if (
    typeof data === 'object' &&
    'environments' in data &&
    Array.isArray((data as { environments: EnvironmentDTO[] }).environments)
  ) {
    const environments = (data as { environments: EnvironmentDTO[] }).environments.map(
      mapEnvironment,
    );
    return {
      environments,
      totalEnvironment: environments.length,
      totalActiveEnvironment: environments.filter((e) => e.status === 'active').length,
      totalMarketAdmin: environments.reduce((sum, e) => sum + (e.marketAdmins ?? 0), 0),
      totalInsurer: environments.reduce((sum, e) => sum + (e.insurers ?? 0), 0),
    };
  }

  return defaultResult;
}

// ============================================================================
// ENVIRONMENT MANAGEMENT APIs
// ============================================================================

/**
 * List all environments
 * Returns just the environments array for backward compatibility
 */
export async function listEnvironments(): Promise<Environment[]> {
  const result = await listEnvironmentsWithStats();
  return result.environments;
}

/**
 * List all environments with summary statistics
 * Returns the full parsed response including summary counts from API
 */
export async function listEnvironmentsWithStats(): Promise<ListEnvironmentsResult> {
  const data = await apiGet<
    EnvironmentDTO[] | ListEnvironmentsResponse | { environments: EnvironmentDTO[] }
  >(
    '/market-admin/lists',
    { skipCacheBust: true } as any, // Skip _ts parameter
  );

  return extractEnvironmentsFromResponse(data);
}

/**
 * Fetch environments for Super Admin Dashboard with pagination and filters
 */
export async function getSuperAdminDashboardEnvironments(params: any): Promise<ListEnvironmentsResult> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const query = queryParams.toString();
  const data = await apiGet<any>(
    `/market-admin/lists?${query}`,
    { skipCacheBust: true } as any,
  );

  return extractEnvironmentsFromResponse(data);
}

/**
 * Get a single environment by ID
 */
export async function getEnvironment(environmentId: string | number): Promise<Environment> {
  const data = await apiGet<EnvironmentDTO | { environment: EnvironmentDTO }>(
    `/super-admin/environments/${encodeURIComponent(String(environmentId))}`,
  );

  if ((data as any).id !== undefined) {
    return mapEnvironment(data as EnvironmentDTO);
  }

  if (data && 'environment' in data) {
    return mapEnvironment((data as any).environment);
  }

  return mapEnvironment(data as EnvironmentDTO);
}

/**
 * Create a new environment
 * Uses strict multipart/form-data for single-endpoint upload
 */
export async function createEnvironment(
  body: CreateEnvironmentRequest,
): Promise<CreateEnvironmentResponse> {
  const formData = new FormData();

  // Append all text fields
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key !== 'logoFile') {
      formData.append(key, String(value));
    }
  });

  // Append logo file if present
  if (body.logoFile) {
    formData.append('logo', body.logoFile);
  }

  // NOTE: Let browser set Content-Type with boundary automatically
  return apiPost<CreateEnvironmentResponse>('/market-admin/create', formData, {
    headers: {
      'Content-Type': undefined,
    },
  });
}

/**
 * Update an existing environment (PATCH /api/v1/market-admin/:id)
 * Supports both JSON and multipart/form-data (when logo is included)
 */
export async function updateEnvironment(
  marketId: string,
  body: UpdateEnvironmentRequest,
): Promise<UpdateEnvironmentResponse> {
  // If logo is included, use multipart/form-data
  if (body.logo) {
    const formData = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'logo') {
        formData.append(key, String(value));
      }
    });
    formData.append('logo', body.logo);

    return apiPatch<UpdateEnvironmentResponse>(
      `/market-admin/${encodeURIComponent(marketId)}`,
      formData,
      {
        headers: {
          'Content-Type': undefined, // Let browser set boundary
        },
      } as Record<string, unknown>,
    );
  }

  // Otherwise use JSON
  const { logo, ...jsonBody } = body;
  return apiPatch<UpdateEnvironmentResponse>(
    `/market-admin/${encodeURIComponent(marketId)}`,
    jsonBody,
  );
}

/**
 * Delete an environment
 */
export async function deleteEnvironment(
  environmentId: string | number,
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(
    `/super-admin/environments/${encodeURIComponent(String(environmentId))}`,
  );
}

/**
 * Activate an environment
 */
export async function activateEnvironment(
  environmentId: string | number,
): Promise<StatusChangeResponse> {
  return apiPatch<StatusChangeResponse>(
    `/super-admin/environments/${encodeURIComponent(String(environmentId))}/activate`,
  );
}

/**
 * Deactivate an environment
 */
export async function deactivateEnvironment(
  environmentId: string | number,
): Promise<StatusChangeResponse> {
  return apiPatch<StatusChangeResponse>(
    `/super-admin/environments/${encodeURIComponent(String(environmentId))}/deactivate`,
  );
}

// ============================================================================
// AUTHORITY MATRIX APIs
// ============================================================================

/**
 * Get authority matrix for an environment
 * Returns array, but we'll handle the 0th index in the component
 */
export async function getEnvironmentAuthorityMatrix(
  environmentId: string | number,
): Promise<AuthorityMatrix | AuthorityMatrix[]> {
  return apiGet<AuthorityMatrix | AuthorityMatrix[]>(
    `/auth-matrix/${encodeURIComponent(String(environmentId))}/data`,
    {
      skipCacheBust: true,
    } as any,
  );
}

/**
 * Update authority matrix for an environment
 */
export async function updateEnvironmentAuthorityMatrix(
  environmentId: string | number,
  body: UpdateAuthorityMatrixRequest,
): Promise<AuthorityMatrix> {
  return apiPatch<AuthorityMatrix>(
    `/auth-matrix/${encodeURIComponent(String(environmentId))}/data`,
    body,
  );
}

// ============================================================================
// DASHBOARD APIs
// ============================================================================

/**
 * Get Super Admin dashboard statistics
 */
export async function getSuperAdminDashboardStats(): Promise<SuperAdminDashboardStats> {
  return apiGet<SuperAdminDashboardStats>('/super-admin/dashboard/stats');
}
