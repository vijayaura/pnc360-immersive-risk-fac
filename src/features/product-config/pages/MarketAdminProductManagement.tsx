import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building,
  User,
  Briefcase,
  Plus,
  Copy,
  Calendar,
  UserCircle,
  Edit,
  Users,
  Building2,
  Trash2,
  Database,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/shared/hooks/use-toast';
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getProducts,
  cloneProduct,
  deleteProduct,
  updateProduct,
  type Product,
  type InsuranceProduct,
  type ProductStatus,
  ProductListResponse,
} from '@/features/product-config/api/products';

const MarketAdminProductManagement = () => {
  const navigate = useNavigate();
  const { toast, dismiss } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloning, setIsCloning] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);
  const [activeToastId, setActiveToastId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const showToast = (props: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    dismiss();
    const { id } = toast(props);
    setActiveToastId(id);
  };

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    const interactiveSelector =
      'button, a, input, select, textarea, [role="button"], [role="switch"], [data-interactive="true"]';
    return !!target.closest(interactiveSelector);
  };

  const handleCardClick = (e: React.MouseEvent, productId: string) => {
    if (isInteractiveTarget(e.target)) return;
    const product = products.find((p) => p.id === productId);
    if (product) {
      navigate(
        `/market-admin/product-management/create?productId=${productId}&productName=${encodeURIComponent(
          product.name,
        )}&productVersion=${encodeURIComponent(product.version)}&edit=true`,
      );
    }
  };


  // Load products from API
  useEffect(() => {
    let mounted = true;
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const response = await getProducts({
          page: page,
          limit: limit
        });

        if (!mounted) return;

        const items = response?.items ?? [];

        // Update pagination meta
        if (response?.meta) {
          setTotalPages(response.meta.totalPages);
          setTotalItems(response.meta.totalItems);
        } else {
          // Fallback if no meta provided
          setTotalPages(1);
          setTotalItems(items.length);
        }

        const mapped = (items as InsuranceProduct[]).map((p) => ({
          id: p.id,
          name: p.name,
          version: p.version,
          category: p.category as any,
          currency: p.currency,
          owner: p.owner as any,
          status: p.status as any,
          description: p.description,
          linkedInsurers: 0,
          linkedBrokers: 0,
          createdDate: p.createdAt,
          modifiedDate: p.updatedAt,
          createdBy: "",
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          code: p.code,
          organizationId: p.organizationId,
        }));
        setProducts(mapped);
      } catch (error: any) {
        if (!mounted) return;
        console.warn("Failed to load products from API:", error);
        toast({
          title: "Error loading products",
          description: error.message || "Failed to fetch products",
          variant: "destructive",
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadProducts();
    return () => { mounted = false; };
  }, [page, limit, toast]); // Re-run when page/limit changes

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handleProductClick = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      navigate(
        `/market-admin/product-management/create?productId=${productId}&productName=${encodeURIComponent(
          product.name,
        )}&productVersion=${encodeURIComponent(product.version)}&edit=true`,
      );
    }
  };

  const handleCreateProduct = () => {
    navigate("/market-admin/product-management/create");
  };

  const handleEditProduct = (product: Product) => {
    navigate(
      `/market-admin/product-management/create?productId=${product.id
      }&productName=${encodeURIComponent(product.name)}&productVersion=${encodeURIComponent(
        product.version,
      )}&edit=true`,
    );
  };

  const handleCloneProduct = async (product: Product) => {
    try {
      setIsCloning(product.id);
      const clonedProduct = await cloneProduct(product.id);
      showToast({
        title: "Product Cloned",
        description: `${product.name} v${product.version} has been cloned successfully.`,
      });
      // Reload products
      const response = await getProducts();
      const items = response?.items ?? [];
      const mapped = (items as InsuranceProduct[]).map((p) => ({
        id: p.id,
        name: p.name,
        version: p.version,
        category: p.category as any,
        currency: p.currency,
        owner: p.owner as any,
        status: p.status as any,
        description: p.description,
        linkedInsurers: 0,
        linkedBrokers: 0,
        createdDate: p.createdAt,
        modifiedDate: p.updatedAt,
        createdBy: "",
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        code: p.code,
        organizationId: p.organizationId,
      }));
      setProducts(mapped);
    } catch (error: any) {
      showToast({
        title: "Error",
        description: error.message || "Failed to clone product",
        variant: "destructive",
      });
    } finally {
      setIsCloning(null);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      setIsDeleting(product.id);
      await deleteProduct(product.id);
      showToast({
        title: "Product Deleted",
        description: `${product.name} v${product.version} has been deleted.`,
      });
      // Reload products
      try {
        const response = await getProducts();
        const items = response?.items ?? [];
        const mapped = (items as InsuranceProduct[]).map((p) => ({
          id: p.id,
          name: p.name,
          version: p.version,
          category: p.category as any,
          currency: p.currency,
          owner: p.owner as any,
          status: p.status as any,
          description: p.description,
          linkedInsurers: 0,
          linkedBrokers: 0,
          createdDate: p.createdAt,
          modifiedDate: p.updatedAt,
          createdBy: "",
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          code: p.code,
          organizationId: p.organizationId,
        }));
        setProducts(mapped);
      } catch {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
      }
    } catch (error: any) {
      showToast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
      setShowDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  const handleToggleProductStatus = async (productId: string, checked: boolean) => {
    const newStatus: ProductStatus = checked ? "Active" : "Archived";

    try {
      setIsTogglingStatus(productId);

      // Make API call first (no optimistic update to prevent flickering)
      await updateProduct(productId, { status: newStatus });

      // Only update UI after successful API call
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p)));

      // Success toast
      showToast({
        title: "Product Status Updated",
        description: newStatus === "Active" ? "Product activated." : "Product archived.",
      });
    } catch (error: any) {
      // No need to revert since we didn't optimistically update
      showToast({
        title: "Error",
        description: error.message || "Failed to update product status",
        variant: "destructive",
      });
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const getStatusBadgeVariant = (
    status: ProductStatus,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Active":
        return "default";
      case "Draft":
        return "secondary";
      case "Archived":
        return "outline";
      default:
        return "outline";
    }
  };

  const getOwnerLabel = (owner: string): string => {
    const ownerMap: Record<string, string> = {
      broker: "Broker",
      insurer: "Insurer",
      reinsurer: "Reinsurer",
    };
    return ownerMap[owner] || owner;
  };

  const getProductIcon = (category: string) => {
    // Map category to icon
    if (category.includes("CONSTRUCTION") || category === "ENGINEERING") {
      return <Building className="w-5 h-5" />;
    }
    if (category.includes("PROFESSIONAL") || category === "LIABILITY") {
      return <User className="w-5 h-5" />;
    }
    if (category.includes("COMMERCIAL") || category === "CASUALTY") {
      return <Briefcase className="w-5 h-5" />;
    }
    return <Building className="w-5 h-5" />;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd-MM-yyyy");
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto p-6">
          <div className="w-full px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Product Studio</h1>
                <p className="text-muted-foreground mt-1">
                  View and manage all insurance products available in the system
                </p>
              </div>
              <Button onClick={handleCreateProduct} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Product
              </Button>
            </div>

            {/* Products List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No products found. Create your first product to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {products.map((product: Product, index: number) => (
                  <Card
                    key={`${product.id}-${index}`}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={(e) => handleCardClick(e, product.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                            {getProductIcon(product.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{product.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                v{product.version}
                              </Badge>
                              <Badge
                                variant={getStatusBadgeVariant(product.status)}
                                className="text-xs"
                              >
                                {product.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Owner:</span>
                                <span className="capitalize">{getOwnerLabel(product.owner)}</span>
                              </div>
                              {product.linkedInsurers && product.linkedInsurers > 0 && (
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  <span>
                                    {product.linkedInsurers} insurer
                                    {product.linkedInsurers !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              )}
                              {product.linkedBrokers && product.linkedBrokers > 0 && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>
                                    {product.linkedBrokers} broker
                                    {product.linkedBrokers !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  Created: {formatDate(product.createdDate || product.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  Modified: {formatDate(product.modifiedDate || product.updatedAt)}
                                </span>
                              </div>
                              {product.createdBy && (
                                <div className="flex items-center gap-1">
                                  <UserCircle className="w-3 h-3" />
                                  <span>{product.createdBy}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/market-admin/masters-management/product/${product.id}`);
                                }}
                                className="gap-1 text-xs h-7"
                              >
                                <Database className="w-3 h-3" />
                                View Masters
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate("/market-admin/insurer-management");
                                }}
                                className="gap-1 text-xs h-7"
                              >
                                <Building2 className="w-3 h-3" />
                                View Insurers
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate("/market-admin/broker-management");
                                }}
                                className="gap-1 text-xs h-7"
                              >
                                <Users className="w-3 h-3" />
                                View Brokers
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Active</span>
                            <Switch
                              checked={product.status === "Active"}
                              onCheckedChange={(checked) => handleToggleProductStatus(product.id, checked)}
                              disabled={isTogglingStatus === product.id}
                              role="switch"
                              data-interactive="true"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProduct(product);
                            }}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          {/* <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloneProduct(product);
                            }}
                            className="gap-2"
                            disabled={isCloning === product.id}
                          >
                            <Copy className="w-4 h-4" />
                            {isCloning === product.id ? "Cloning..." : "Clone"}
                          </Button> */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductToDelete(product);
                              setShowDeleteDialog(true);
                            }}
                            className="gap-2 text-destructive hover:text-destructive"
                            disabled={isDeleting === product.id}
                          >
                            <Trash2 className="w-4 h-4" />
                            {isDeleting === product.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {/* Pagination Controls */}
                {products.length > 0 && (
                  <div className="flex items-center justify-between py-4 border-t mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {products.length} of {totalItems} products
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={page <= 1 || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm font-medium">
                        Page {page} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={page >= totalPages || isLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium">
              {productToDelete?.name} v{productToDelete?.version}
            </span>
            ? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setProductToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (productToDelete) {
                  handleDeleteProduct(productToDelete);
                }
              }}
              disabled={!!productToDelete && isDeleting === productToDelete.id}
            >
              {productToDelete && isDeleting === productToDelete.id
                ? "Deleting..."
                : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarketAdminProductManagement;
