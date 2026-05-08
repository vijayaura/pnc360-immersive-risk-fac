import React, { lazy, Suspense, type ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Full-page fallback while a lazy route chunk loads.
 * Kept lightweight so it ships with the main bundle.
 */
export function RoutePageFallback() {
  return (
    <div
      className="flex min-h-[40vh] w-full items-center justify-center bg-background"
      role="status"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

type RouteModule = Record<string, ComponentType<Record<string, unknown>>> & {
  default?: ComponentType<Record<string, unknown>>;
};

/**
 * Code-split route leaf: one dynamic import + Suspense per page.
 * - Use default `exportKey` for `export default MyPage`.
 * - Pass the export name for `export function MyPage` / `export { MyPage }`.
 * Props are forwarded (e.g. route elements that pass flags into the page component).
 */
export function lazyRoute<P extends object = Record<string, never>>(
  loader: () => Promise<RouteModule>,
  exportKey: 'default' | (string & {}) = 'default',
): React.FC<P> {
  const Lazy = lazy(async () => {
    const mod = await loader();
    if (exportKey === 'default') {
      const C = mod.default;
      if (!C) {
        throw new Error('lazyRoute: expected default export');
      }
      return { default: C as ComponentType<P> };
    }
    const C = mod[exportKey];
    if (!C) {
      throw new Error(`lazyRoute: missing export "${String(exportKey)}"`);
    }
    return { default: C as ComponentType<P> };
  });

  const Wrapped: React.FC<P> = (props) => (
    <Suspense fallback={<RoutePageFallback />}>
      <Lazy {...(props as P)} />
    </Suspense>
  );
  Wrapped.displayName = `LazyRoute(${exportKey === 'default' ? 'default' : exportKey})`;
  return Wrapped;
}
