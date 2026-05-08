import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Package, Download, Upload } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data - products available for assignment
const mockProducts = [];

// Mock data - insurers
const mockInsurers = [];

// Mock data - brokers with product assignments
const mockBrokers = [];

const getUserStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-success text-success-foreground';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

const BrokerConfiguration = () => {
  const { brokerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // Find broker by ID
  const broker = mockBrokers.find((b) => b.id === brokerId);

  const [isProductAssignmentDialogOpen, setIsProductAssignmentDialogOpen] = useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string>('');
  const [selectedInsurer, setSelectedInsurer] = useState<(typeof mockInsurers)[0] | null>(null);

  // Product assignment state
  const [tempProductAssignments, setTempProductAssignments] = useState<number[]>([]);
  const [tempProductCommissions, setTempProductCommissions] = useState<{
    [key: number]: { min: number; max: number };
  }>({});

  // In a real app, this would be managed by state management (Redux, Zustand, etc.)
  const [brokerStatus, setBrokerStatus] = useState(broker?.status || 'active');
  const [insurerStatuses, setInsurerStatuses] = useState<{ [key: number]: string }>({
    1: 'active',
    2: 'active',
    3: 'inactive',
    4: 'active',
  });

  if (!broker) {
    return (
      <div className="h-full bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Broker Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested broker could not be found.</p>
            <Button onClick={() => navigate('/market-admin/broker-management')}>Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleProductAssignment = (insurer: (typeof mockInsurers)[0]) => {
    setSelectedInsurer(insurer);
    setTempProductAssignments([...insurer.assignedProducts]);
    // Initialize temp commissions with default values for assigned products
    const tempCommissions: { [key: number]: { min: number; max: number } } = {};
    insurer.assignedProducts.forEach((productId) => {
      tempCommissions[productId] = { min: 2.0, max: 5.0 };
    });
    setTempProductCommissions(tempCommissions);
    setIsProductAssignmentDialogOpen(true);
  };

  const handleProductToggle = (productId: number) => {
    setTempProductAssignments((prev) => {
      if (prev.includes(productId)) {
        // Remove product and its commission data
        const newCommissions = { ...tempProductCommissions };
        delete newCommissions[productId];
        setTempProductCommissions(newCommissions);
        return prev.filter((id) => id !== productId);
      } else {
        // Add product with default commission values
        setTempProductCommissions((prev) => ({
          ...prev,
          [productId]: { min: 1.0, max: 5.0 },
        }));
        return [...prev, productId];
      }
    });
  };

  const updateProductCommission = (productId: number, field: 'min' | 'max', value: number) => {
    setTempProductCommissions((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const saveProductAssignments = () => {
    showConfirmDialog(
      {
        title: 'Save Product Assignments',
        description:
          'Are you sure you want to save these product assignments and commission rates?',
        confirmText: 'Save Assignments',
      },
      () => {
        console.log('Saving product assignments:', tempProductAssignments, tempProductCommissions);
        toast({
          title: 'Success',
          description: 'Product assignments and commissions updated successfully',
        });
        setIsProductAssignmentDialogOpen(false);
        setTempProductAssignments([]);
        setTempProductCommissions({});
      },
    );
  };

  const handleStatusToggle = (checked: boolean) => {
    const newStatus = checked ? 'active' : 'inactive';
    setPendingStatusChange(newStatus);
    setIsStatusChangeDialogOpen(true);
  };

  const confirmStatusChange = () => {
    console.log('Changing broker status to:', pendingStatusChange);
    setBrokerStatus(pendingStatusChange);
    toast({
      title: 'Status Updated',
      description: `Broker status has been changed to ${pendingStatusChange}`,
    });
    setIsStatusChangeDialogOpen(false);
    setPendingStatusChange('');
  };

  const getProductName = (productId: number) => {
    return mockProducts.find((p) => p.id === productId)?.name || 'Unknown Product';
  };

  const handleInsurerStatusToggle = (insurerId: number, checked: boolean) => {
    const newStatus = checked ? 'active' : 'inactive';
    setInsurerStatuses((prev) => ({
      ...prev,
      [insurerId]: newStatus,
    }));
    toast({
      title: 'Status Updated',
      description: `Insurer status has been changed to ${newStatus}`,
    });
  };

  return (
    <div className="h-full bg-gradient-to-br from-background to-secondary/20 flex flex-col overflow-hidden">
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-full space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/market-admin/broker/${broker.id}/details`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Configure {broker.name}</h1>
                <p className="text-lg text-muted-foreground">
                  Manage broker information and commission rates
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Content */}
          <Tabs defaultValue="information" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="information">Broker Information</TabsTrigger>
              <TabsTrigger value="commissions">Commission Rates</TabsTrigger>
            </TabsList>

            <TabsContent value="information" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Broker Information</CardTitle>
                  <CardDescription>View and edit broker details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={broker.name} readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={broker.email} readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={broker.phone || 'N/A'} readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input value={broker.company || 'N/A'} readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>License Number</Label>
                      <Input value={broker.licenseNumber || 'N/A'} readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Broker ID</Label>
                      <Input value={broker.id} readOnly className="bg-muted" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Label>Status</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={brokerStatus === 'active'}
                          onCheckedChange={handleStatusToggle}
                        />
                        <Badge className={`${getUserStatusColor(brokerStatus)} inline-flex w-fit`}>
                          {brokerStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Product Commission Rates by Insurer</CardTitle>
                      <CardDescription>
                        Manage insurer assignments and their product commission rates
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download Template
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Excel
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Insurer Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockInsurers.map((insurer) => (
                            <TableRow key={insurer.id}>
                              <TableCell className="font-medium">{insurer.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={insurerStatuses[insurer.id] === 'active'}
                                    onCheckedChange={(checked) =>
                                      handleInsurerStatusToggle(insurer.id, checked)
                                    }
                                  />
                                  <Badge
                                    className={`${getUserStatusColor(insurerStatuses[insurer.id])} inline-flex w-fit`}
                                  >
                                    {insurerStatuses[insurer.id]}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleProductAssignment(insurer)}
                                  className="flex items-center gap-2"
                                >
                                  <Package className="w-4 h-4" />
                                  {insurer.assignedProducts.length > 0
                                    ? `${insurer.assignedProducts.length} Assigned Products`
                                    : 'Assign Products'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Status Change Dialog */}
          <AlertDialog open={isStatusChangeDialogOpen} onOpenChange={setIsStatusChangeDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to change the broker status to {pendingStatusChange}? This
                  will affect their access to the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmStatusChange}>Change Status</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Product Assignment Dialog */}
          <Dialog
            open={isProductAssignmentDialogOpen}
            onOpenChange={setIsProductAssignmentDialogOpen}
          >
            <DialogContent className="max-w-2xl bg-background border shadow-lg z-50">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Assign Products to Broker
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Managing product assignments for: {selectedInsurer?.name || ''}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-4">
                  {mockProducts
                    .filter((product) => product.active)
                    .map((product) => (
                      <div
                        key={product.id}
                        className={`p-4 border rounded-lg transition-all ${tempProductAssignments.includes(product.id) ? 'border-primary bg-primary/5' : 'border-border'}`}
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={tempProductAssignments.includes(product.id)}
                            onCheckedChange={() => handleProductToggle(product.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-lg text-foreground">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">{product.code}</p>
                          </div>
                        </div>

                        {tempProductAssignments.includes(product.id) && (
                          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-2 block">
                                Min Commission (%)
                              </div>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max={tempProductCommissions[product.id]?.max || 15}
                                  value={tempProductCommissions[product.id]?.min || 2.0}
                                  onChange={(e) =>
                                    updateProductCommission(
                                      product.id,
                                      'min',
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  className="h-10 pr-8"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 11l5-5m0 0l5 5m-5-5v12"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-2 block">
                                Max Commission (%)
                              </div>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.1"
                                  min={tempProductCommissions[product.id]?.min || 0}
                                  max="15"
                                  value={tempProductCommissions[product.id]?.max || 5.0}
                                  onChange={(e) =>
                                    updateProductCommission(
                                      product.id,
                                      'max',
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  className="h-10 pr-8"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 11l5-5m0 0l5 5m-5-5v12"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-3 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setIsProductAssignmentDialogOpen(false)}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveProductAssignments}
                    className="px-6 bg-primary hover:bg-primary/90"
                  >
                    Save Assignments
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ConfirmDialog />
    </div>
  );
};

export default BrokerConfiguration;
