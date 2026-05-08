import { apiGet } from '@/lib/api/client';
import { apiPost } from '@/lib/api/client';
import { apiPut } from '@/lib/api/client';
import { apiPatch } from '@/lib/api/client';
import { apiDelete } from '@/lib/api/client';

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export interface AdminUserListItem {
  id: number;
  name?: string;
  email: string;
  role: string;
  user_type: 'admin' | 'user' | 'market_admin' | 'insurer' | 'broker' | string;
  status: 'active' | 'inactive' | 'pending' | string;
  created_at: string;
}

export async function getUsersByAdmin(): Promise<AdminUserListItem[]> {
  return apiGet<AdminUserListItem[]>('/users/by-admin');
}

export interface GetUserByIdResponseBody {
  id: string | number;
  name?: string;
  email: string;
  role: string;
  roleId?: string;
  roleName?: string;
  organizationId?: string | number;
  user_type: 'admin' | 'user' | 'market_admin' | 'insurer' | 'broker' | string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | string;
  isActive: boolean;
  created_at: string;
}

export async function getUserById(
  userId: number | string,
  organizationId?: string | number | null,
): Promise<GetUserByIdResponseBody> {
  const config = organizationId !== undefined ? { params: { organizationId } } : undefined;
  return apiGet<GetUserByIdResponseBody>(`/user-management/${userId}`, config);
}

export interface CreateUserRequestBody {
  name: string;
  email: string;
  password: string;
  user_type?: 'admin' | 'user' | 'market_admin' | 'insurer' | 'broker' | string;
  type?: 'admin' | 'user' | 'market_admin' | 'insurer' | 'broker' | string;
  organizationId?: string;
  // Note: roleId is assigned via separate API call (POST /auth-matrix/tenant/assign-role)
}

export interface CreateUserResponseBody {
  id: string;
  name: string;
  email: string;
  type: string;
  organizationId: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function createUser(body: CreateUserRequestBody): Promise<CreateUserResponseBody> {
  const response = await apiPost<CreateUserResponseBody>('/user-management', body);
  return response;
}

export interface UpdateUserRequestBody {
  name?: string;
  email?: string;
  password?: string;
  user_type?: 'admin' | 'user' | string;
  organizationId?: string;
  roleId?: string;
}
export interface UpdateUserResponseBody {
  message: string;
}

export async function updateUser(
  userId: number | string,
  body: UpdateUserRequestBody,
): Promise<UpdateUserResponseBody> {
  return apiPatch<UpdateUserResponseBody>(`/user-management/${userId}`, body);
}

export interface DeleteUserResponseBody {
  message: string;
}

export async function deleteUser(
  userId: number | string,
  organizationId?: string | number | null,
): Promise<DeleteUserResponseBody> {
  const config = organizationId !== undefined ? { params: { organizationId } } : undefined;
  return apiDelete<DeleteUserResponseBody>(`/user-management/${userId}`, config);
}

export interface UserStatusResponseBody {
  message: string;
}

export async function activateUser(userId: number | string): Promise<UserStatusResponseBody> {
  // return apiPatch<UserStatusResponseBody>(`/users/${userId}/activate-user`);
  return apiPatch<UserStatusResponseBody>(`/user-management/${userId}/status`, {
    status: 'ACTIVE',
  });
}

export async function deactivateUser(userId: number | string): Promise<UserStatusResponseBody> {
  // return apiPatch<UserStatusResponseBody>(`/users/${userId}/deactivate-user`);
  return apiPatch<UserStatusResponseBody>(`/user-management/${userId}/status`, {
    status: 'INACTIVE',
  });
}

// Portal-scoped user listings
export interface PortalUserListItem extends AdminUserListItem {
  is_admin?: number | boolean;
}

export interface BrokerUserListItem {
  id: string;
  name?: string;
  email: string;
  type: string;
  organizationId: string;
  status: string;
  isActive: boolean;
  roleId?: string | null;
  roleName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsurerUsersResponse {
  insurer_id: number;
  users: PortalUserListItem[];
}

export interface InsurerUserListItem {
  id: string;
  name?: string;
  email: string;
  type: string;
  organizationId: string;
  status: string;
  isActive: boolean;
  roleId?: string | null;
  roleName?: string | null;
  createdAt: string;
  updatedAt: string;
}
export async function getBrokerUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  organizationId?: number | string;
}): Promise<PaginatedResponse<BrokerUserListItem>> {
  const data = await apiGet<PaginatedResponse<BrokerUserListItem>>(`/user-management/list`, {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      search: params?.search ?? '',
      organizationId: params?.organizationId ?? undefined,
    },
  });

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: Number(data?.total) || 0,
    page: Number(data?.page) || (params?.page ?? 1),
    limit: Number(data?.limit) || (params?.limit ?? 10),
  };
}

export async function getInsurerUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  organizationId?: number | string;
}): Promise<PaginatedResponse<InsurerUserListItem>> {
  const data = await apiGet<PaginatedResponse<InsurerUserListItem>>(`/user-management/list`, {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      search: params?.search ?? '',
      organizationId: params?.organizationId ?? undefined,
    },
  });

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: Number(data?.total) || 0,
    page: Number(data?.page) || (params?.page ?? 1),
    limit: Number(data?.limit) || (params?.limit ?? 10),
  };
}
