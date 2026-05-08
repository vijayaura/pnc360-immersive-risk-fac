import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/shared/ProductCard";
import { Building, User, Shield, Package, DollarSign, FileCheck, Home, Briefcase, Users, Heart, Plane, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getProductsList, ProductListResponse, ProductItem } from '@/features/product-config/api/products-list';
import { useAuthStore } from '@/shared/stores/useAuthStore';

interface InsuranceProduct {
  code: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: string;
}

const ProductSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [page] = useState(1);
  const [pageSize] = useState(24);
  const { user } = useAuthStore();

  const isBrokerRoute = location.pathname.startsWith("/broker/product-selection");

  // Some versions of the react-query types don't include newer option keys
  // on UseQueryOptions. Narrow the type but allow `keepPreviousData` locally.
  type LocalQueryOptions = UseQueryOptions<
    ProductListResponse,
    Error,
    ProductListResponse,
    (string | number | boolean)[]
  > & { keepPreviousData?: boolean };

  const queryOptions: LocalQueryOptions = {
    queryKey: ["products", page, pageSize, isBrokerRoute, user?.organizationId],
    queryFn: () =>
      getProductsList({
        page,
        pageSize,
        ...(isBrokerRoute && { assignedProduct: true, distributorOrgId: user?.organizationId }),
      }),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  };

  const { data, isLoading, isError, error, isFetching } = useQuery(queryOptions);

  const prefillState = (location.state as any) || null;
  const initialDataFromNav = (prefillState?.initialData as Record<string, unknown> | undefined) ?? undefined;

  const handleProductSelect = (productId: string, productName: string) => {
    // console.log("Selected product ID:", productId , productName);
    navigate(`/customer/proposal/${productId}?productName=${productName}&new=true`, {
      state: initialDataFromNav ? { initialData: initialDataFromNav, source: prefillState?.source } : undefined,
    });
  };

  // If coming from Customer Profiles with a product already chosen, jump directly.
  useEffect(() => {
    if (!prefillState?.autoSelectProductId || !prefillState?.autoSelectProductName) return;
    handleProductSelect(prefillState.autoSelectProductId, prefillState.autoSelectProductName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillState?.autoSelectProductId, prefillState?.autoSelectProductName]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Select Insurance Product" />

      <div className="container mx-auto px-4 py-8 max-w-7xl flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="flex flex-col justify-center items-center min-h-[400px] text-destructive">
            <p>Error loading products</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try again later
            </p>
          </div>
        ) : !data?.items || data.items.length === 0 ? (
          <div className="flex flex-col justify-center items-center min-h-[400px] text-muted-foreground">
            <Inbox className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p>There are no insurance products available at the moment.</p>
          </div>
        ) : (
          <>
            {isFetching && (
              <div className="flex justify-end mb-4">
                <span className="text-xs text-muted-foreground animate-pulse">
                  Refreshing...
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.items.map((product: ProductItem) => (
                <ProductCard
                  key={product.code}
                  code={product.code}
                  name={product.name || product.code}
                  description={product.description || product.category}
                  icon={<Package className="w-6 h-6" />}
                  color="primary"
                  onClick={() =>
                    handleProductSelect(
                      product.id || product.code,
                      product.name || product.code,
                    )
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProductSelection;
