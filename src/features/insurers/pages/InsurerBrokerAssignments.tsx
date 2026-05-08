import { useState } from 'react';
import { formatNumberWithCommas, removeCommasFromNumber } from '@/shared/utils/numberFormat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Footer } from '@/components/layout/Footer';
import { Calculator, Download, Upload, Package } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { useDistributors, useBrokerProducts } from '../hooks';

interface ConfirmDialogState {
  open: boolean;
  brokerId: string | number | null;
  brokerName: string;
  currentStatus: boolean;
}

const InsurerBrokerAssignments = () => {
  const { toast } = useToast();
  const { ConfirmDialog } = useConfirmDialog();

  const {
    distributors,
    loading,
    error: listError,
    toggling,
    toggleStatus,
    updateDistributor,
  } = useDistributors();

  const {
    products: brokerProducts,
    loading: productsLoading,
    error: productsError,
    saving: savingAssignments,
    fetchProducts,
    toggleProduct,
    toggleSelectAll,
    saveAssignments,
    isAllSelected,
    clearError: clearProductsError,
    updateCommission,
  } = useBrokerProducts();

  const [selectedBroker, setSelectedBroker] = useState<string | number | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    brokerId: null,
    brokerName: '',
    currentStatus: false,
  });

  const handleToggleRequest = (brokerId: string | number) => {
    const broker = distributors.find((b) => b.id === brokerId);
    if (!broker) return;
    setConfirmDialog({
      open: true,
      brokerId,
      brokerName: broker.name,
      currentStatus: broker.isActive,
    });
  };

  const confirmToggleBrokerStatus = async () => {
    const { brokerId, currentStatus } = confirmDialog;
    if (!brokerId) return;

    await toggleStatus(brokerId, currentStatus);
    setConfirmDialog({
      open: false,
      brokerId: null,
      brokerName: '',
      currentStatus: false,
    });
  };

  const openProductsDialog = async (brokerId: string | number) => {
    setSelectedBroker(brokerId);
    setProductDialogOpen(true);
    clearProductsError();
    await fetchProducts(brokerId);
  };

  const handleSaveAssignments = async (brokerId: string | number) => {
    const result = await saveAssignments(brokerId);
    if (result.success) {
      updateDistributor(brokerId, { productsAssigned: result.count });

      setTimeout(() => {
        setProductDialogOpen(false);
        setSelectedBroker(null);
      }, 100);
    }
  };

  const downloadTemplate = () => {
    toast({
      title: 'Template Downloaded',
      description: 'Excel template has been downloaded successfully.',
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: 'File Uploaded',
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Distributor Product Assignments
              </h1>
              <p className="text-sm text-muted-foreground">
                Configure distributor settings and commission structure
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Calculator className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Distributor Product Assignments</CardTitle>
                    <CardDescription>
                      Manage distributor status and product assignments
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Excel
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Broker Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Products Assigned</TableHead>
                      <TableHead className="text-center">Status / Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && <TableSkeleton rowCount={5} colCount={5} />}
                    {listError && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Alert variant="destructive">
                            <AlertTitle>Failed to load</AlertTitle>
                            <AlertDescription>{listError}</AlertDescription>
                          </Alert>
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading &&
                      !listError &&
                      distributors.map((broker) => (
                        <TableRow key={broker.id} className={!broker.isActive ? 'opacity-50' : ''}>
                          <TableCell className="font-medium">{broker.name}</TableCell>
                          <TableCell>{broker.email || '-'}</TableCell>
                          <TableCell>{broker.licenseNumber || '-'}</TableCell>
                          <TableCell>
                            <Dialog
                              open={selectedBroker === broker.id && productDialogOpen}
                              onOpenChange={(open) => {
                                if (!open) {
                                  setProductDialogOpen(false);
                                  setSelectedBroker(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openProductsDialog(broker.id)}
                                >
                                  <Package className="w-4 h-4 mr-2" />
                                  {broker.productsAssigned} Products
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader className="pr-10">
                                  <DialogTitle>Product Assignments - {broker.name}</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                  {productsError && (
                                    <Alert variant="destructive" className="mb-3">
                                      <AlertTitle>Failed to load products</AlertTitle>
                                      <AlertDescription>{productsError}</AlertDescription>
                                    </Alert>
                                  )}
                                  <div className="mb-4 flex justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleSelectAll(broker.id)}
                                      disabled={productsLoading}
                                    >
                                      {isAllSelected(broker.id) ? 'Deselect All' : 'Select All'}
                                    </Button>
                                  </div>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-center">Assigned</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {productsLoading && (
                                        <TableSkeleton rowCount={3} colCount={2} />
                                      )}
                                      {!productsLoading &&
                                        (brokerProducts[broker.id] || []).map((item) => (
                                          <TableRow
                                            key={item.productId}
                                            className={
                                              !item.isGeoCoverageAllowed ? 'opacity-60' : ''
                                            }
                                          >
                                            <TableCell className="font-medium whitespace-normal break-words max-w-md">
                                              <div className="pr-4">{item.productName}</div>
                                              {!item.isGeoCoverageAllowed && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                  Geo coverage not allowed — cannot assign
                                                </p>
                                              )}
                                              {item.assigned && (
                                                <div className="flex flex-col gap-2">
                                                  <div className="mt-2 flex gap-2 flex-col sm:flex-row items-start">
                                                    <div className="w-full sm:w-1/3">
                                                      <label className="text-xs text-muted-foreground block mb-1">
                                                        Min Commission
                                                      </label>
                                                      <div className="relative">
                                                        <Input
                                                          type="text"
                                                          placeholder="Min"
                                                          value={item.minCommission ? formatNumberWithCommas(item.minCommission) : ''}
                                                          onChange={(e) =>
                                                            updateCommission(
                                                              broker.id,
                                                              item.productId,
                                                              'minCommission',
                                                              removeCommasFromNumber(e.target.value),
                                                            )
                                                          }
                                                          className={`h-8 pr-8 ${
                                                            item.minCommission != null && item.minCommission !== '' &&
                                                            item.maxCommission != null && item.maxCommission !== '' &&
                                                            Number(item.minCommission) >
                                                              Number(item.maxCommission)
                                                              ? 'border-red-500'
                                                              : ''
                                                          }`}
                                                        />
                                                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                                                          %
                                                        </span>
                                                      </div>
                                                    </div>
                                                    <div className="w-full sm:w-1/3">
                                                      <label className="text-xs text-muted-foreground block mb-1">
                                                        Base Commission
                                                      </label>
                                                      <div className="relative">
                                                        <Input
                                                          type="text"
                                                          placeholder="Base"
                                                          value={item.baseCommission ? formatNumberWithCommas(item.baseCommission) : ''}
                                                          onChange={(e) =>
                                                            updateCommission(
                                                              broker.id,
                                                              item.productId,
                                                              'baseCommission',
                                                              removeCommasFromNumber(e.target.value),
                                                            )
                                                          }
                                                          className={`h-8 pr-8 ${
                                                            Number(item.baseCommission) > 0 &&
                                                            Number(item.minCommission) > 0 &&
                                                            Number(item.baseCommission) <= Number(item.minCommission)
                                                              ? 'border-red-500'
                                                              : ''
                                                          }`}
                                                        />
                                                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                                                          %
                                                        </span>
                                                      </div>
                                                    </div>
                                                    <div className="w-full sm:w-1/3">
                                                      <label className="text-xs text-muted-foreground block mb-1">
                                                        Max Commission
                                                      </label>
                                                      <div className="relative">
                                                        <Input
                                                          type="text"
                                                          placeholder="Max"
                                                          value={item.maxCommission ? formatNumberWithCommas(item.maxCommission) : ''}
                                                          onChange={(e) =>
                                                            updateCommission(
                                                              broker.id,
                                                              item.productId,
                                                              'maxCommission',
                                                              removeCommasFromNumber(e.target.value),
                                                            )
                                                          }
                                                          className={`h-8 pr-8 ${
                                                            item.minCommission != null && item.minCommission !== '' &&
                                                            item.maxCommission != null && item.maxCommission !== '' &&
                                                            Number(item.minCommission) >
                                                              Number(item.maxCommission)
                                                              ? 'border-red-500'
                                                              : ''
                                                          }`}
                                                        />
                                                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                                                          %
                                                        </span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  {item.minCommission != null && item.minCommission !== '' &&
                                                    item.maxCommission != null && item.maxCommission !== '' &&
                                                    Number(item.minCommission) >
                                                      Number(item.maxCommission) && (
                                                      <p className="text-xs text-red-500">
                                                        Min commission cannot be greater than max
                                                        commission
                                                      </p>
                                                    )}
                                                  {Number(item.baseCommission) > 0 &&
                                                    Number(item.minCommission) > 0 &&
                                                    Number(item.baseCommission) <=
                                                      Number(item.minCommission) && (
                                                      <p className="text-xs text-red-500">
                                                        Base commission must be greater than min
                                                        commission
                                                      </p>
                                                    )}
                                                </div>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-center align-top pt-4">
                                              <Checkbox
                                                checked={!!item.assigned}
                                                disabled={!item.isGeoCoverageAllowed}
                                                onCheckedChange={() =>
                                                  toggleProduct(broker.id, item.productId)
                                                }
                                              />
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                  {!broker.isActive && (
                                    <p className="text-sm text-amber-600 flex-1">
                                      Distributor must be active to assign products
                                    </p>
                                  )}
                                  <div className="flex gap-2">
                                    <DialogClose asChild>
                                      <Button variant="outline" disabled={savingAssignments}>
                                        Cancel
                                      </Button>
                                    </DialogClose>
                                    <Button
                                      className="bg-primary hover:bg-primary/90"
                                      onClick={() => handleSaveAssignments(broker.id)}
                                      disabled={savingAssignments || !broker.isActive}
                                      title={
                                        !broker.isActive
                                          ? 'Distributor must be active to assign products'
                                          : undefined
                                      }
                                    >
                                      {savingAssignments ? 'Saving...' : 'Save'}
                                    </Button>
                                  </div>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Badge
                                variant={broker.isActive ? 'default' : 'secondary'}
                                className={broker.isActive ? 'bg-green-100 text-green-800' : ''}
                              >
                                {broker.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Switch
                                checked={broker.isActive}
                                onCheckedChange={() => handleToggleRequest(broker.id)}
                                disabled={toggling}
                              />
                            </div>
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

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmDialog.currentStatus ? 'deactivate' : 'activate'}{' '}
              <strong>{confirmDialog.brokerName}</strong>?
              {confirmDialog.currentStatus
                ? ' This will prevent them from accessing the system.'
                : ' This will allow them to access the system.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setConfirmDialog({
                  open: false,
                  brokerId: null,
                  brokerName: '',
                  currentStatus: false,
                })
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleBrokerStatus}>
              {confirmDialog.currentStatus ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDialog />
      <Footer />
    </div>
  );
};

export default InsurerBrokerAssignments;
