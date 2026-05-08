import { useEffect, useState } from "react";
import { useToast } from '@/shared/hooks/use-toast';
import { useNavigate } from "react-router-dom";
import { ProductCard } from "@/components/shared/ProductCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building, User, Shield, Briefcase, Building2, Home as HomeIcon, Plane, Lock, Package, Ship, Anchor } from "lucide-react";
import { getProducts } from '@/features/product-config/api/products';
import { deriveProductCode } from '@/shared/utils/common-methods';
import { isDemoMode } from "@/lib/demo-mode";

interface InsuranceProduct {
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
  description: string;
  code: string;
}

interface Product {
  code: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: string;
  available: boolean;
}

const iconsList = [
  <Building className="w-6 h-6" />,
  <User className="w-6 h-6" />,
  <Shield className="w-6 h-6" />,
  <Briefcase className="w-6 h-6" />,
  <Building2 className="w-6 h-6" />,
  <HomeIcon className="w-6 h-6" />,
  <Plane className="w-6 h-6" />,
  <Lock className="w-6 h-6" />,
  <Package className="w-6 h-6" />,
  <Ship className="w-6 h-6" />,
  <Anchor className="w-6 h-6" />
]

const MastersProductSelection = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true);
  const [isComingSoonDialogOpen, setIsComingSoonDialogOpen] = useState(false);
  const isDemo = isDemoMode();

  const allInsuranceProducts = []

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const response = await getProducts();

        if (response?.items && response.items.length > 0) {
          setProducts(response.items);
        }
      } catch (error: unknown) {
        console.warn(
          "Failed to load products from API, using fallback data:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [toast]);
  // Filter products for demo mode - only show PI Annual
  const insuranceProducts = isDemo
    ? allInsuranceProducts.filter(p => p.code === 'PI_ANNUAL')
    : products;

  const handleProductSelect = (product: InsuranceProduct) => {
    // if (!product.available) {
    //   setIsComingSoonDialogOpen(true);
    //   return;
    // }

    // Navigate to masters management with product code
    // For now, CAR and PI have dedicated pages, others will use the general MastersManagement
    // if (product.code === "CAR") {
    //   navigate("/market-admin/masters-management/car");
    // } else if (product.code === "PI") {
    //   navigate("/market-admin/masters-management/pi");
    // } else {
    //   // For other products, navigate to general masters management with product code
    //   navigate(`/market-admin/masters-management?productCode=${product.code}&productName=${encodeURIComponent(product.name)}`);
    // }

    navigate(`/market-admin/masters-management/product/${product.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Masters Management</h1>
            <p className="text-muted-foreground">Select a product to manage its master data and configurations</p>
          </div>

          {/* Insurance products grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                code={product.code || deriveProductCode(product.name)}
                name={product.name}
                description={product.description}
                icon={iconsList[index]}
                color="primary"
                onClick={() => handleProductSelect(product)}
              />
            ))}
          </div>

          {/* Coming Soon Dialog */}
          <Dialog open={isComingSoonDialogOpen} onOpenChange={setIsComingSoonDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Coming Soon</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-muted-foreground">
                  This insurance product configuration is currently under development and will be available soon.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default MastersProductSelection;
