import { useState, useCallback } from 'react';
import { removeCommasFromNumber } from '@/shared/utils/numberFormat';
import { getInsurerCompanyId } from '@/lib/auth';
import {
  getBrokerAssignedProducts,
  updateBrokerProductAssignments,
  type BrokerProductAssignment,
} from '@/features/insurers/api/insurers';
import {
  getBrokerProductConfig,
  upsertBrokerProductConfig,
  type UpsertBrokerProductConfigDto,
} from '@/features/product-config/api/brokerProductConfig';
import { apiErrorToMessage } from '@/shared/utils/apiErrorToMessage';
import { useToast } from '@/shared/hooks/use-toast';

interface UseBrokerProductsReturn {
  products: Record<string | number, BrokerProductAssignment[]>;
  loading: boolean;
  error: string | null;
  saving: boolean;
  fetchProducts: (brokerId: string | number) => Promise<BrokerProductAssignment[]>;
  toggleProduct: (brokerId: string | number, productId: string | number) => void;
  updateCommission: (
    brokerId: string | number,
    productId: string | number,
    field: 'minCommission' | 'baseCommission' | 'maxCommission',
    value: string,
  ) => void;
  toggleSelectAll: (brokerId: string | number) => void;
  saveAssignments: (brokerId: string | number) => Promise<{ success: boolean; count: number }>;
  isAllSelected: (brokerId: string | number) => boolean;
  clearError: () => void;
}

/**
 * Custom hook for managing broker product assignments
 * Handles fetching products, toggling assignments, and saving
 */
export function useBrokerProducts(): UseBrokerProductsReturn {
  const { toast } = useToast();
  const [products, setProducts] = useState<Record<string | number, BrokerProductAssignment[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(
    async (brokerId: string): Promise<BrokerProductAssignment[]> => {
      setLoading(true);
      setError(null);
      try {
        const insurerId = getInsurerCompanyId();
        const [list, configs] = await Promise.all([
          getBrokerAssignedProducts(insurerId || '', brokerId),
          getBrokerProductConfig(brokerId).catch(() => []),
        ]);

        if (list.length === 0) {
          setError('No products available. Please ensure products are configured in the system.');
        }

        const mergedList = list.map((p) => {
          const config = configs.find((c) => c.productId === String(p.productId));
          const toCommission = (val: number | string | undefined | null): number | string | undefined => {
            if (val === undefined || val === null) return undefined;
            const num = Number(val);
            if (Number.isNaN(num)) return undefined;
            return num;
          };
          const merged = {
            ...p,
            minCommission: config ? toCommission(config.minCommission) : undefined,
            baseCommission: config ? toCommission(config.baseCommission) : undefined,
            maxCommission: config ? toCommission(config.maxCommission) : undefined,
          };
          if (!merged.isGeoCoverageAllowed && merged.assigned) {
            return { ...merged, assigned: false };
          }
          return merged;
        });

        setProducts((prev) => ({ ...prev, [brokerId]: mergedList }));
        return mergedList;
      } catch (err) {
        const message = apiErrorToMessage(err, 'Failed to load products.');
        setError(message);
        setProducts((prev) => ({ ...prev, [brokerId]: [] }));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const toggleProduct = useCallback((brokerId: string | number, productId: string | number) => {
    setProducts((prev) => {
      const list = prev[brokerId] || [];
      const next = list.map((p) => {
        if (p.productId !== productId) return p;
        if (!p.isGeoCoverageAllowed) return p;
        return { ...p, assigned: !p.assigned };
      });
      return { ...prev, [brokerId]: next };
    });
  }, []);

  const updateCommission = useCallback(
    (
      brokerId: string | number,
      productId: string | number,
      field: 'minCommission' | 'baseCommission' | 'maxCommission',
      value: string,
    ) => {
      setProducts((prev) => {
        const list = prev[brokerId] || [];
        const next = list.map((p) => (p.productId === productId ? { ...p, [field]: value } : p));
        return { ...prev, [brokerId]: next };
      });
    },
    [],
  );

  const toggleSelectAll = useCallback((brokerId: string | number) => {
    setProducts((prev) => {
      const list = prev[brokerId] || [];
      const selectable = list.filter((p) => p.isGeoCoverageAllowed);
      const allSelectableSelected =
        selectable.length > 0 && selectable.every((p) => p.assigned);
      const next = list.map((p) => ({
        ...p,
        assigned: p.isGeoCoverageAllowed ? !allSelectableSelected : p.assigned,
      }));
      return { ...prev, [brokerId]: next };
    });
  }, []);

  const isAllSelected = useCallback(
    (brokerId: string | number): boolean => {
      const list = products[brokerId] || [];
      const selectable = list.filter((p) => p.isGeoCoverageAllowed);
      return (
        selectable.length > 0 && selectable.every((p) => p.assigned)
      );
    },
    [products],
  );

  const saveAssignments = useCallback(
    async (brokerId: string): Promise<{ success: boolean; count: number }> => {
      setSaving(true);
      setError(null);
      try {
        const insurerId = getInsurerCompanyId();
        const currentProducts = products[brokerId] || [];
        const assignedProductIds = currentProducts
          .filter((p) => p.assigned)
          .map((p) => p.productId);

        const response = await updateBrokerProductAssignments(insurerId || '', brokerId, {
          assigned_product_ids: assignedProductIds,
        });

        // Validate and save commissions
        const assignedProducts = currentProducts.filter((p) => p.assigned);
        const invalidProduct = assignedProducts.find((p) => {
          const min = p.minCommission ? parseFloat(String(p.minCommission)) : 0;
          const max = p.maxCommission ? parseFloat(String(p.maxCommission)) : 0;
          return min > max;
        });

        if (invalidProduct) {
          const message = `Validation Error for ${invalidProduct.productName}: Min Commission cannot be greater than Max Commission.`;
          setError(message);
          toast({
            title: 'Validation Error',
            description: message,
            variant: 'destructive',
          });
          setSaving(false);
          return { success: false, count: 0 };
        }

        const baseUnderMinProduct = assignedProducts.find((p) => {
          if (!p.baseCommission || !p.minCommission) return false;
          const min = parseFloat(String(p.minCommission));
          const base = parseFloat(String(p.baseCommission));
          return base <= min;
        });

        if (baseUnderMinProduct) {
          const message = `Validation Error for ${baseUnderMinProduct.productName}: Base Commission must be greater than Min Commission.`;
          setError(message);
          toast({
            title: 'Validation Error',
            description: message,
            variant: 'destructive',
          });
          setSaving(false);
          return { success: false, count: 0 };
        }

        const parseCommission = (val: string | number | undefined): number | undefined => {
          if (val === undefined || val === null || val === '') return undefined;
          const cleaned = removeCommasFromNumber(String(val));
          const num = parseFloat(cleaned);
          return Number.isNaN(num) ? undefined : num;
        };

        const configsToSave: UpsertBrokerProductConfigDto[] = assignedProducts
          .map((p) => ({
            orgId: brokerId,
            productId: String(p.productId),
            minCommission: parseCommission(p.minCommission) ?? null,
            baseCommission: parseCommission(p.baseCommission) ?? null,
            maxCommission: parseCommission(p.maxCommission) ?? null,
          }));

        if (configsToSave.length > 0) {
          await upsertBrokerProductConfig(configsToSave);
        }

        toast({
          title: 'Assignments Saved',
          description: response.message || 'Product assignments have been saved successfully!',
        });

        return { success: true, count: response.assigned_product_ids.length };
      } catch (err) {
        const message = apiErrorToMessage(err, 'Failed to save product assignments.');
        setError(message);
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        return { success: false, count: 0 };
      } finally {
        setSaving(false);
      }
    },
    [products, toast],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    products,
    loading,
    error,
    saving,
    fetchProducts,
    toggleProduct,
    updateCommission,
    toggleSelectAll,
    saveAssignments,
    isAllSelected,
    clearError,
  };
}
