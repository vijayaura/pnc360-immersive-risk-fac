import type { Product } from '@/features/product-config/api/products';

/**
 * Normalizes `/product/list` (and similar) responses into full product rows for dashboards.
 * List endpoints under `/product?` often omit operating geography; `/product/list` typically includes it.
 */
export function parseDashboardProductPayload(resValue: unknown): Product[] {
  let productsItems: unknown[] = [];
  if (Array.isArray(resValue)) {
    productsItems = resValue;
  } else if (resValue && typeof resValue === 'object') {
    const resObj = resValue as Record<string, unknown>;
    let nested: unknown = resObj.items ?? resObj.data ?? resObj.result ?? [];
    if (!Array.isArray(nested) && nested && typeof nested === 'object') {
      const n = nested as Record<string, unknown>;
      nested = n.items ?? n.data ?? [];
    }
    productsItems = Array.isArray(nested) ? nested : [];
  }
  return (Array.isArray(productsItems) ? productsItems : []) as Product[];
}
