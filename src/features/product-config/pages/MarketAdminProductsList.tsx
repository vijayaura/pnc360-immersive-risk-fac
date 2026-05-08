import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft, Plus, Edit, Save } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';

interface Product {
  id: number;
  name: string;
  code: string;
  status: "Active" | "Inactive";
  createdDate: string;
}

const MarketAdminProductsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { insurerId } = useParams();

  // Detect if we're in insurer portal or market admin
  const isInsurerPortal = location.pathname.startsWith('/insurer');
  const basePath = isInsurerPortal ? '/insurer' : `/market-admin/insurer/${insurerId}`;
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "CAR Insurance Standard",
      code: "CAR-STD-001",
      status: "Active",
      createdDate: "2024-01-15"
    },
    {
      id: 2,
      name: "CAR Insurance Premium",
      code: "CAR-PRM-002",
      status: "Active",
      createdDate: "2024-01-20"
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    code: ""
  });
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const getInsurerName = (id: string | undefined) => {
    const insurerNames: { [key: string]: string } = {
      'emirates-insurance': 'Emirates Insurance',
      'axa-gulf': 'AXA Gulf',
      'oman-insurance': 'Oman Insurance',
      'dubai-insurance': 'Dubai Insurance'
    };
    return insurerNames[id || ''] || 'Unknown Insurer';
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.code) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const product: Product = {
      id: products.length + 1,
      name: newProduct.name,
      code: newProduct.code,
      status: "Active",
      createdDate: new Date().toISOString().split('T')[0]
    };

    setProducts([...products, product]);
    setNewProduct({ name: "", code: "" });
    setIsAddDialogOpen(false);

    toast({
      title: "Product Added",
      description: `${newProduct.name} has been successfully added.`
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = () => {
    if (!editProduct?.name || !editProduct?.code) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setProducts(products.map(p =>
      p.id === editProduct.id ? editProduct : p
    ));
    setIsEditDialogOpen(false);
    setEditProduct(null);

    toast({
      title: "Product Updated",
      description: `${editProduct.name} has been successfully updated.`
    });
  };

  const handleProductClick = (productId: number) => {
    navigate(`/market-admin/insurer/${insurerId}/product-config/products/${productId}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/market-admin/insurer/${insurerId}/product-config`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Configuration
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Products - {getInsurerName(insurerId)}</h1>
                <p className="text-sm text-muted-foreground">Manage insurance products and configurations</p>
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-code">Product Code</Label>
                    <Input
                      id="product-code"
                      value={newProduct.code}
                      onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                      placeholder="Enter product code"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddProduct}>
                      <Save className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-product-name">Product Name</Label>
              <Input
                id="edit-product-name"
                value={editProduct?.name || ""}
                onChange={(e) => setEditProduct(editProduct ? { ...editProduct, name: e.target.value } : null)}
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-product-code">Product Code</Label>
              <Input
                id="edit-product-code"
                value={editProduct?.code || ""}
                onChange={(e) => setEditProduct(editProduct ? { ...editProduct, code: e.target.value } : null)}
                placeholder="Enter product code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-product-status">Status</Label>
              <Select
                value={editProduct?.status || "Active"}
                onValueChange={(value: "Active" | "Inactive") =>
                  setEditProduct(editProduct ? { ...editProduct, status: value } : null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProduct}>
                <Save className="w-4 h-4 mr-2" />
                Update Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Products List</CardTitle>
              <CardDescription>
                Manage your insurance products and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Product Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="cursor-pointer hover:bg-primary/5">
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.code}</TableCell>
                      <TableCell>
                        <Badge variant={product.status === "Active" ? "default" : "secondary"}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.createdDate}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProductClick(product.id)}
                          >
                            Configure
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MarketAdminProductsList;