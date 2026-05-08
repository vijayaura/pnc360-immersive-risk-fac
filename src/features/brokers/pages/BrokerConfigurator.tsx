import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, Save, FileText, Package, Download, Upload } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';

const BrokerConfigurator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { insurerId } = useParams();
  const { navigateBack } = useNavigationHistory();
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // Detect if we're in insurer portal or market admin
  const isInsurerPortal = location.pathname.startsWith('/insurer');
  const backPath = isInsurerPortal
    ? '/insurer/product-config'
    : `/market-admin/insurer/${insurerId}/product-config`;

  // Mock products data
  const [products] = useState([]);

  // Mock data for brokers with assigned products
  const [brokersData, setBrokersData] = useState([
    {
      id: 1,
      name: 'Gulf Insurance Brokers',
      email: 'info@gulfbrokers.ae',
      license: 'BRK-001-2024',
      assignedProducts: [1, 2], // Array of product IDs
      productCommissions: { 1: { min: 2.0, max: 5.0 }, 2: { min: 2.5, max: 6.0 } }, // Product-specific commissions
      minCommission: 2.0,
      maxCommission: 5.0,
      status: 'Active',
    },
    {
      id: 2,
      name: 'Emirates Risk Management',
      email: 'contact@emiratesrisk.com',
      license: 'BRK-002-2024',
      assignedProducts: [1],
      productCommissions: { 1: { min: 1.5, max: 4.5 } },
      minCommission: 1.5,
      maxCommission: 4.5,
      status: 'Active',
    },
    {
      id: 3,
      name: 'Dubai Insurance Services',
      email: 'hello@dubaiinsurance.ae',
      license: 'BRK-003-2024',
      assignedProducts: [],
      productCommissions: {},
      minCommission: 2.5,
      maxCommission: 6.0,
      status: 'Active',
    },
    {
      id: 4,
      name: 'Abu Dhabi Brokers',
      email: 'contact@adbrokers.ae',
      license: 'BRK-004-2024',
      assignedProducts: [2],
      productCommissions: { 2: { min: 2.0, max: 4.0 } },
      minCommission: 2.0,
      maxCommission: 4.0,
      status: 'Active',
    },
    {
      id: 5,
      name: 'Northern Emirates Insurance',
      email: 'info@northernemirates.ae',
      license: 'BRK-005-2024',
      assignedProducts: [1, 2],
      productCommissions: { 1: { min: 1.8, max: 5.5 }, 2: { min: 2.0, max: 5.0 } },
      minCommission: 1.8,
      maxCommission: 5.5,
      status: 'Inactive',
    },
  ]);

  // State for product assignment dialog
  const [selectedBroker, setSelectedBroker] = useState<number | null>(null);
  const [tempProductAssignments, setTempProductAssignments] = useState<number[]>([]);
  const [tempProductCommissions, setTempProductCommissions] = useState<{
    [key: number]: { min: number; max: number };
  }>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const getInsurerName = (id: string | undefined) => {
    const insurerNames: { [key: string]: string } = {
      'emirates-insurance': 'Emirates Insurance',
      'axa-gulf': 'AXA Gulf',
      'oman-insurance': 'Oman Insurance',
      'dubai-insurance': 'Dubai Insurance',
    };
    return insurerNames[id || ''] || 'Unknown Insurer';
  };

  const handleProductAssignment = (brokerId: number) => {
    const broker = brokersData.find((b) => b.id === brokerId);
    if (broker) {
      setSelectedBroker(brokerId);
      setTempProductAssignments([...broker.assignedProducts]);
      setTempProductCommissions({ ...broker.productCommissions });
      setIsDialogOpen(true);
    }
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
        if (selectedBroker) {
          setBrokersData((prev) =>
            prev.map((broker) =>
              broker.id === selectedBroker
                ? {
                    ...broker,
                    assignedProducts: [...tempProductAssignments],
                    productCommissions: { ...tempProductCommissions },
                  }
                : broker,
            ),
          );
          setIsDialogOpen(false);
          setSelectedBroker(null);
          setTempProductAssignments([]);
          setTempProductCommissions({});

          toast({
            title: 'Success',
            description: 'Product assignments and commissions updated successfully',
          });
        }
      },
    );
  };

  const saveConfiguration = () => {
    showConfirmDialog(
      {
        title: 'Save Configuration',
        description: 'Are you sure you want to save the broker configuration?',
        confirmText: 'Save Configuration',
      },
      () => {
        toast({
          title: 'Configuration Saved',
          description: `Broker configuration has been successfully saved for ${getInsurerName(insurerId)}.`,
        });
      },
    );
  };

  const downloadTemplate = () => {
    // Create CSV template content
    const csvContent = `Broker Name,Email,License Number,Status,Product 1 Assignment,Product 1 Min Commission,Product 1 Max Commission,Product 2 Assignment,Product 2 Min Commission,Product 2 Max Commission
Gulf Insurance Brokers,info@gulfbrokers.ae,BRK-001-2024,Active,YES,2.0,5.0,YES,2.5,6.0
Emirates Risk Management,contact@emiratesrisk.com,BRK-002-2024,Active,YES,1.5,4.5,NO,0,0
New Broker Name,contact@newbroker.com,BRK-XXX-2024,Active,NO,0,0,NO,0,0`;

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `broker-configuration-template-${insurerId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'Broker configuration template has been downloaded successfully.',
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (
      !file.name.endsWith('.csv') &&
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.xls')
    ) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls)',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Here you would normally parse the file and update the broker data
      // For demo purposes, we'll just show a success message

      // Simulate file processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'File Uploaded Successfully',
        description: 'Broker configuration has been updated from the uploaded file.',
      });

      // Reset file input
      event.target.value = '';
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to process the uploaded file. Please check the format and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(backPath)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Product Config
              </Button>
              <div className="h-8 w-px bg-border" />
              <h1 className="text-xl font-semibold">Broker Assignments</h1>
            </div>
            <Button onClick={saveConfiguration} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Broker Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Broker Management
                  </CardTitle>
                  <CardDescription>
                    Assign products to brokers and configure their commission ranges
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </Button>
                  <div className="relative">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="sr-only"
                      disabled={isUploading}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? 'Uploading...' : 'Upload Excel'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Assignment Summary</p>
                    <p className="text-sm text-muted-foreground">
                      {brokersData.reduce(
                        (total, broker) => total + broker.assignedProducts.length,
                        0,
                      )}{' '}
                      total product assignments across {brokersData.length} brokers
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Active Brokers</p>
                    <p className="font-medium">
                      {brokersData.filter((b) => b.status === 'Active').length}
                    </p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Broker Details</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Products Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brokersData.map((broker) => (
                      <TableRow
                        key={broker.id}
                        className={broker.assignedProducts.length > 0 ? 'bg-primary/5' : ''}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{broker.name}</p>
                            <p className="text-sm text-muted-foreground">{broker.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{broker.license}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              broker.status === 'Active'
                                ? 'bg-success-light text-success'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {broker.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProductAssignment(broker.id)}
                            className="flex items-center gap-2"
                            disabled={broker.status !== 'Active'}
                          >
                            <Package className="w-4 h-4" />
                            {broker.assignedProducts.length} Products
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-background border shadow-lg z-50">
          <DialogHeader>
            <DialogTitle>Assign Products to Broker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBroker && (
              <p className="text-sm text-muted-foreground">
                Managing product assignments for:{' '}
                {brokersData.find((b) => b.id === selectedBroker)?.name}
              </p>
            )}
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 border rounded-lg bg-background ${tempProductAssignments.includes(product.id) ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <Checkbox
                      checked={tempProductAssignments.includes(product.id)}
                      onCheckedChange={() => handleProductToggle(product.id)}
                      disabled={!product.active}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.code}</p>
                    </div>
                    {!product.active && (
                      <span className="text-xs text-muted-foreground">Inactive</span>
                    )}
                  </div>

                  {tempProductAssignments.includes(product.id) && (
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1 block">
                          Min Commission (%)
                        </div>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max={tempProductCommissions[product.id]?.max || 15}
                          value={tempProductCommissions[product.id]?.min || 1.0}
                          onChange={(e) =>
                            updateProductCommission(
                              product.id,
                              'min',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-8"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1 block">
                          Max Commission (%)
                        </div>
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
                          className="h-8"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveProductAssignments}>Save Assignments</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
      <Footer />
    </div>
  );
};

export default BrokerConfigurator;
