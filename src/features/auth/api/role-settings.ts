import { apiGet, apiPost, apiRequest } from '@/lib/api/client';

export type RolePricingType = 'percentage' | 'fixed';
export type RolePremiumSelection = 'sumInsured' | 'basePremium';

export interface RoleProductAssignmentItem {
  productId: string;
  productName: string;
  assigned: boolean;
}

export interface RoleLoadingDiscountRow {
  id: string;
  premiumSelection: RolePremiumSelection;
  from: number;
  to: number;
  pricingType: RolePricingType;
  value: number;
}

export interface RoleLoadingDiscountConfig {
  premiumSelection?: RolePremiumSelection;
  rows: RoleLoadingDiscountRow[];
}

const getRoleProductsPath = (roleId: string) =>
  `/auth-matrix/tenant/roles/${encodeURIComponent(roleId)}/products`;
const TENANT_PRODUCTS_PATH = '/auth-matrix/tenant/products';

const ROLE_LOADING_DISCOUNT_PATHS = [
  (roleId: string) =>
    `/auth-matrix/tenant/roles/${encodeURIComponent(roleId)}/loading-discount`,
];

const extractArray = <T,>(payload: unknown, keys: string[] = []): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];

  const obj = payload as Record<string, unknown>;
  const defaultKeys = ['data', 'items', 'results', 'rows', 'list'];

  for (const key of [...keys, ...defaultKeys]) {
    const value = obj[key];
    if (Array.isArray(value)) return value as T[];
  }

  return [];
};

const extractObject = (payload: unknown, keys: string[] = []): Record<string, unknown> => {
  if (!payload || typeof payload !== 'object') return {};

  const obj = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }

  return obj;
};

const isHttpErrorStatus = (error: unknown, statuses: number[]): boolean => {
  if (!error || typeof error !== 'object') return false;
  const status = 'status' in error ? Number((error as { status?: number }).status) : NaN;
  return Number.isFinite(status) && statuses.includes(status);
};

const normalizePricingType = (value: unknown): RolePricingType => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return normalized === 'fixed' || normalized === 'fixed_amount' ? 'fixed' : 'percentage';
};

const normalizePremiumSelection = (value: unknown): RolePremiumSelection => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return normalized === 'basepremium' || normalized === 'base_premium' || normalized === 'base-premium'
    ? 'basePremium'
    : 'sumInsured';
};

const normalizeNumber = (value: unknown): number => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const shouldIncludeRowId = (id: string): boolean =>
  Boolean(id) && !/^\d{13}-[a-z0-9]+$/i.test(id) && !id.startsWith('row-');

const normalizeRoleLoadingDiscountRow = (
  item: Record<string, unknown>,
  index: number,
): RoleLoadingDiscountRow => ({
  id: String(item.id ?? item.rowId ?? item.uuid ?? `row-${index}`),
  premiumSelection: normalizePremiumSelection(
    item.premiumSelection ?? item.premium_selection ?? item.selection ?? item.rangeType,
  ),
  from: normalizeNumber(item.from ?? item.rangeStart ?? item.start ?? item.min),
  to: normalizeNumber(item.to ?? item.rangeEnd ?? item.end ?? item.max),
  pricingType: normalizePricingType(item.pricingType ?? item.adjustmentType ?? item.type),
  value: normalizeNumber(
    item.value ?? item.adjustmentValue ?? item.loadingDiscount ?? item.loading_discount,
  ),
});

const getRoleScopedPayload = async (
  paths: Array<(roleId: string) => string>,
  roleId: string,
): Promise<unknown | null> => {
  for (const buildPath of paths) {
    try {
      return await apiGet<unknown>(buildPath(roleId));
    } catch (error) {
      if (isHttpErrorStatus(error, [404])) continue;
      throw error;
    }
  }

  return null;
};

const mutateRoleScopedPayload = async (
  paths: Array<(roleId: string) => string>,
  roleId: string,
  body: Record<string, unknown>,
): Promise<unknown> => {
  let lastError: unknown = null;

  for (const buildPath of paths) {
    for (const method of ['POST', 'PUT'] as const) {
      try {
        return await apiRequest(buildPath(roleId), {
          method,
          data: body,
        });
      } catch (error) {
        lastError = error;
        if (isHttpErrorStatus(error, [404, 405])) continue;
        throw error;
      }
    }
  }

  throw lastError ?? new Error('Failed to save role configuration.');
};

export async function getRoleProductAssignments(
  roleId: string,
  organizationId?: string,
): Promise<RoleProductAssignmentItem[]> {
  const [tenantPayload, rolePayload] = await Promise.all([
    apiGet<unknown>(TENANT_PRODUCTS_PATH),
    apiGet<unknown>(getRoleProductsPath(roleId)).catch((error) => {
      if (isHttpErrorStatus(error, [404])) return null;
      throw error;
    }),
  ]);

  const tenantItems = extractArray<Record<string, unknown>>(tenantPayload, [
    'data',
    'items',
    'products',
  ]);
  const roleItems = extractArray<Record<string, unknown>>(rolePayload, ['data', 'items', 'products']);
  const assignedMap = new Map<string, boolean>(
    roleItems.map((item) => [
      String(item.id ?? item.productId ?? item.product_id ?? ''),
      Boolean(item.assigned),
    ]),
  );

  const mergedProducts = tenantItems.map((item) => {
    const productId = String(item.id ?? item.productId ?? item.product_id ?? '');
    return {
      productId,
      productName: String(item.name ?? item.productName ?? item.product_name ?? ''),
      assigned: assignedMap.get(productId) ?? false,
    };
  });

  roleItems.forEach((item) => {
    const productId = String(item.id ?? item.productId ?? item.product_id ?? '');
    if (!productId || mergedProducts.some((product) => product.productId === productId)) return;

    mergedProducts.push({
      productId,
      productName: String(item.name ?? item.productName ?? item.product_name ?? ''),
      assigned: Boolean(item.assigned),
    });
  });

  return mergedProducts;
}

export async function saveRoleProductAssignments(
  roleId: string,
  productIds: string[],
  organizationId?: string,
): Promise<unknown> {
  return apiPost(
    getRoleProductsPath(roleId),
    {
      productIds,
    },
  );
}

export async function getRoleLoadingDiscountConfig(
  roleId: string,
  organizationId?: string,
): Promise<RoleLoadingDiscountConfig> {
  const payload = await getRoleScopedPayload(ROLE_LOADING_DISCOUNT_PATHS, roleId);
  const source = extractObject(payload, ['config', 'data', 'item']);
  const sourcePremiumSelection = normalizePremiumSelection(
    source.premiumSelection ?? source.premium_selection,
  );
  const combinedRows = extractArray<Record<string, unknown>>(
    source.rows ?? source.loadingDiscounts ?? source.loading_discounts ?? source.premiumSelections,
    ['rows', 'loadingDiscounts', 'loading_discounts', 'premiumSelections'],
  ).map((item, index) =>
    normalizeRoleLoadingDiscountRow(
      {
        ...item,
        premiumSelection:
          item.premiumSelection ?? item.premium_selection ?? sourcePremiumSelection,
      },
      index,
    ),
  );

  if (combinedRows.length > 0) {
    return {
      premiumSelection: sourcePremiumSelection ?? combinedRows[0]?.premiumSelection ?? 'sumInsured',
      rows: combinedRows,
    };
  }

  const sumInsuredRows = extractArray<Record<string, unknown>>(
    source.sumInsured ?? source.sum_insured,
    ['sumInsured', 'sum_insured', 'sumInsuredRanges', 'sum_insured_ranges'],
  ).map((item, index) =>
    normalizeRoleLoadingDiscountRow(
      {
        ...item,
        premiumSelection: 'sumInsured',
      },
      index,
    ),
  );
  const basePremiumRows = extractArray<Record<string, unknown>>(
    source.basePremium ?? source.base_premium,
    ['basePremium', 'base_premium', 'basePremiumRanges', 'base_premium_ranges'],
  ).map((item, index) =>
    normalizeRoleLoadingDiscountRow(
      {
        ...item,
        premiumSelection: 'basePremium',
      },
      index + sumInsuredRows.length,
    ),
  );

  return {
    premiumSelection: sumInsuredRows[0]
      ? 'sumInsured'
      : basePremiumRows[0]
        ? 'basePremium'
        : 'sumInsured',
    rows: [...sumInsuredRows, ...basePremiumRows],
  };
}

export async function saveRoleLoadingDiscountConfig(
  roleId: string,
  config: RoleLoadingDiscountConfig,
  organizationId?: string,
): Promise<unknown> {
  const serializeRows = (rows: RoleLoadingDiscountRow[]) =>
    rows.map((row) => ({
      ...(shouldIncludeRowId(row.id) ? { id: row.id } : {}),
      from: row.from,
      to: row.to,
      pricingType: row.pricingType === 'fixed' ? 'FIXED' : 'PERCENTAGE',
      value: row.value,
    }));

  return mutateRoleScopedPayload(
    ROLE_LOADING_DISCOUNT_PATHS,
    roleId,
    {
      premiumSelection: config.premiumSelection,
      rows: serializeRows(config.rows),
    },
  );
}
