import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Package, Plus, Eye } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { getInsurerCompanyId } from '@/lib/auth';
import {
  getInsurerBrokerAssignmentsForQuoteCreation,
  getBrokerAssignedProductsForQuoteCreation,
  getBrokerQuotesList,
  type BrokerAssignment,
  type BrokerProductAssignment,
  type BrokerQuoteListItem,
} from '@/features/insurers/api/insurers';
import { isDemoMode } from '@/lib/demo-mode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { Badge } from '@/components/ui/badge';

const InsurerCreateBrokerQuote = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [brokersData, setBrokersData] = useState<BrokerAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedBroker, setSelectedBroker] = useState<number | string | null>(null);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [brokerProducts, setBrokerProducts] = useState<
    Record<string | number, BrokerProductAssignment[]>
  >({});

  const [searchTerm, setSearchTerm] = useState('');

  // Load brokers on component mount
  useEffect(() => {
    const loadBrokers = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const insurerId = getInsurerCompanyId();
        const brokers = await getInsurerBrokerAssignmentsForQuoteCreation(insurerId);
        setBrokersData(brokers);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to load brokers');
        toast({
          title: 'Error',
          description: error.message || 'Failed to load brokers',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadBrokers();
  }, [toast]);

  const getAllProductsFallback = (): BrokerProductAssignment[] => [];

  const getProductCode = (productName: string): string | null => {
    const productCodeMap: Record<string, string> = {};
    return productCodeMap[productName] || null;
  };

  // State for proposals dialog
  const [selectedBrokerForProposals, setSelectedBrokerForProposals] = useState<
    number | string | null
  >(null);
  const [proposalsLoading, setProposalsLoading] = useState<boolean>(false);
  const [proposalsError, setProposalsError] = useState<string | null>(null);
  const [brokerProposals, setBrokerProposals] = useState<
    Record<string | number, BrokerQuoteListItem[]>
  >({});

  const handleCreateQuote = (brokerId: number | string, product: BrokerProductAssignment) => {
    const broker = brokersData.find((b) => String(b.id) === String(brokerId));
    if (!broker) return;

    let productCode = String(product.productId);
    const mappedCode = getProductCode(product.productName);

    if (mappedCode) {
      productCode = mappedCode;
    } else if (!isNaN(Number(productCode))) {
      productCode = 'PI_Arch';
    }

    navigate(
      `/insurer/create-quote/proposal?product=${productCode}&distributor=${brokerId}&distributorName=${encodeURIComponent(broker.name)}`,
    );
  };

  const loadBrokerProposals = async (brokerId: number | string) => {
    const insurerId = getInsurerCompanyId();

    setProposalsLoading(true);
    setProposalsError(null);
    try {
      const response = await getBrokerQuotesList({
        brokerId: brokerId,
        page: 1,
        limit: 10,
      });

      setBrokerProposals((prev) => ({ ...prev, [brokerId]: response.items || [] }));
    } catch (err: any) {
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      if (isDemoMode()) {
        const mockProposals: BrokerQuoteListItem[] = [
          {
            id: '1',
            brokerId: String(brokerId),
            brokerName:
              brokersData.find((b) => String(b.id) === String(brokerId))?.name || 'Broker',
            productId: '1',
            productName: 'Professional Liability Insurance - Architects and Engineers',
            quoteNumber: 'QT00001',
            totalPremium: 12500.0,
            status: 'pending',
            submittedAt: new Date().toISOString(),
          },
          {
            id: '2',
            brokerId: String(brokerId),
            brokerName:
              brokersData.find((b) => String(b.id) === String(brokerId))?.name || 'Broker',
            productId: '2',
            productName: 'Motor Insurance',
            quoteNumber: 'QT00002',
            totalPremium: 18500.0,
            status: 'quoted',
            submittedAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ];
        setBrokerProposals((prev) => ({ ...prev, [brokerId]: mockProposals }));
      } else {
        if (status === 400) setProposalsError(message || 'Bad request while loading proposals.');
        else if (status === 401) setProposalsError('Unauthorized. Please log in again.');
        else if (status === 403) setProposalsError("You don't have access to these proposals.");
        else if (status && status >= 500)
          setProposalsError('Server error. Please try again later.');
        else setProposalsError(message || 'Failed to load proposals.');
      }
    } finally {
      setProposalsLoading(false);
    }
  };

  const getProductBadge = (productCode: string) => {
    console.log(productCode)
    const productBadges: Record<
      string,
      { code: string; variant: 'default' | 'secondary' | 'outline' }
    > = {
      PI_Arch: { code: 'PI Annual', variant: 'default' },
      PI: { code: 'PI Single', variant: 'secondary' },
      CAR: { code: 'CAR', variant: 'outline' },
      CAR_ANNUAL: { code: 'CAR Annual', variant: 'outline' },
    };
    return productBadges[productCode] || { code: productCode, variant: 'secondary' };
  };

  return (
    <div className="w-full p-8">
      {/* Broker Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Select Broker</CardTitle>
              <CardDescription>
                Choose a broker and their assigned product to create a new quote
              </CardDescription>
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
                  <TableHead className="text-center">Proposals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableSkeleton rowCount={5} colCount={5} />}
                {errorMessage && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Alert variant="destructive">
                        <AlertTitle>Failed to load</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  !errorMessage &&
                  brokersData.map((broker) => (
                    <TableRow key={broker.id}>
                      <TableCell className="font-medium">{broker.name}</TableCell>
                      <TableCell>{broker.email || '-'}</TableCell>
                      <TableCell>{broker.licenseNumber || '-'}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                setSelectedBroker(broker.id);
                                const insurerId = getInsurerCompanyId();

                                setProductsLoading(true);
                                setProductsError(null);
                                try {
                                  const assigned = await getBrokerAssignedProductsForQuoteCreation(
                                    insurerId || 0,
                                    broker.id,
                                  );

                                  // Always merge with fallback to ensure all products from Product Studio are shown
                                  const fallbackProducts = getAllProductsFallback();

                                  // Merge API results with fallback, preserving assigned status from API
                                  const mergedProducts = fallbackProducts.map((fallback) => {
                                    // Try to find matching product by ID first, then by name
                                    const apiProduct = assigned.find(
                                      (api) =>
                                        api.productId === fallback.productId ||
                                        api.productName === fallback.productName ||
                                        api.productName
                                          .toLowerCase()
                                          .includes(
                                            fallback.productName.toLowerCase().split(' ')[0],
                                          ),
                                    );
                                    return apiProduct ? { ...fallback, ...apiProduct } : fallback;
                                  });

                                  assigned.forEach((api) => {
                                    const inFallback = mergedProducts.find(
                                      (m) =>
                                        m.productId === api.productId ||
                                        m.productName === api.productName,
                                    );
                                    if (!inFallback) {
                                      mergedProducts.push(api);
                                    }
                                  });

                                  const sortedProducts = mergedProducts.sort((a, b) => {
                                    if (a.assigned === b.assigned) {
                                      return 0;
                                    }
                                    return a.assigned ? -1 : 1;
                                  });

                                  setBrokerProducts((prev) => ({
                                    ...prev,
                                    [broker.id]: sortedProducts,
                                  }));
                                } catch (err: any) {
                                  const status = err?.status as number | undefined;
                                  const message = err?.message as string | undefined;
                                  // On error, use fallback products but mark PI_Arch as assigned in demo mode
                                  const fallbackProducts = getAllProductsFallback().map(
                                    (product) => {
                                      if (
                                        isDemoMode() &&
                                        product.productName ===
                                          'Professional Liability Insurance - Architects and Engineers'
                                      ) {
                                        return { ...product, assigned: true };
                                      }
                                      return product;
                                    },
                                  );

                                  const sortedProducts = fallbackProducts.sort((a, b) => {
                                    if (a.assigned && !b.assigned) return -1;
                                    if (!a.assigned && b.assigned) return 1;
                                    return 0;
                                  });
                                  setBrokerProducts((prev) => ({
                                    ...prev,
                                    [broker.id]: sortedProducts,
                                  }));
                                  if (status === 400)
                                    setProductsError(
                                      message ||
                                        'Bad request while loading products. Showing all available products.',
                                    );
                                  else if (status === 401)
                                    setProductsError(
                                      'Unauthorized. Please log in again. Showing all available products.',
                                    );
                                  else if (status === 403)
                                    setProductsError(
                                      "You don't have access to these products. Showing all available products.",
                                    );
                                  else if (status && status >= 500)
                                    setProductsError(
                                      'Server error. Showing all available products.',
                                    );
                                  else
                                    setProductsError(
                                      message ||
                                        'Failed to load assigned products. Showing all available products.',
                                    );
                                } finally {
                                  setProductsLoading(false);
                                }
                              }}
                            >
                              <Package className="w-4 h-4 mr-2" />
                              {broker.productsAssigned} Products
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader className="pr-10">
                              <DialogTitle className="flex-1">
                                Create Quote for {broker.name}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              {productsError && (
                                <Alert variant="destructive" className="mb-3">
                                  <AlertTitle>Failed to load products</AlertTitle>
                                  <AlertDescription>{productsError}</AlertDescription>
                                </Alert>
                              )}
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-center">Action</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {productsLoading && <TableSkeleton rowCount={3} colCount={2} />}
                                  {!productsLoading &&
                                    (brokerProducts[broker.id] || []).map((item) => (
                                      <TableRow key={item.productId}>
                                        <TableCell className="font-medium whitespace-normal break-words max-w-md">
                                          <div className="pr-4">{item.productName}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {item.assigned ? (
                                            <Button
                                              size="sm"
                                              onClick={() => handleCreateQuote(broker.id, item)}
                                              className="gap-2"
                                            >
                                              <Plus className="w-4 h-4" />
                                              Create New Quote
                                            </Button>
                                          ) : (
                                            <Badge
                                              variant="secondary"
                                              className="text-muted-foreground"
                                            >
                                              Not Assigned
                                            </Badge>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell className="text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBrokerForProposals(broker.id);
                                loadBrokerProposals(broker.id);
                              }}
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader className="pr-10">
                              <DialogTitle className="flex-1">
                                Proposals for {broker.name}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              {proposalsError && (
                                <Alert variant="destructive" className="mb-3">
                                  <AlertTitle>Failed to load proposals</AlertTitle>
                                  <AlertDescription>{proposalsError}</AlertDescription>
                                </Alert>
                              )}
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Quote Reference</TableHead>
                                    <TableHead>Client Name</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Premium</TableHead>
                                    <TableHead>Created Date</TableHead>
                                    <TableHead>Action</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {proposalsLoading && <TableSkeleton rowCount={3} colCount={6} />}
                                  {!proposalsLoading &&
                                    (brokerProposals[broker.id] || []).length === 0 && (
                                      <TableRow>
                                        <TableCell
                                          colSpan={6}
                                          className="text-center text-muted-foreground py-8"
                                        >
                                          No proposals found for this broker
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  {!proposalsLoading &&
                                    (brokerProposals[broker.id] || []).map((proposal) => {
                                      const productBadge = getProductBadge(
                                        proposal.code || '',
                                      );
                                      return (
                                        <TableRow key={proposal.id}>
                                          <TableCell className="font-medium">
                                            {proposal.quoteNumber || `Q-${proposal.id}`}
                                          </TableCell>
                                          <TableCell>{proposal.brokerName || '-'}</TableCell>
                                          <TableCell>
                                            <div className="flex flex-col gap-1">
                                              <span className="text-sm">
                                                {proposal.productName || '-'}
                                              </span>
                                              {proposal.productName && (
                                                <Badge
                                                  variant={productBadge.variant}
                                                  className="w-fit"
                                                >
                                                  {productBadge.code}
                                                </Badge>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <Badge
                                              variant={
                                                proposal.status === 'quoted' ||
                                                proposal.status === 'approved'
                                                  ? 'default'
                                                  : 'secondary'
                                              }
                                            >
                                              {proposal.status || 'pending'}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            {proposal.totalPremium
                                              ? `AED ${proposal.totalPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                              : '-'}
                                          </TableCell>
                                          <TableCell>
                                            {proposal.submittedAt
                                              ? formatDateDDMMYYYY(proposal.submittedAt)
                                              : '-'}
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="flex items-center gap-2"
                                              onClick={() => (window.location.href = `/customer/proposal?resume=${proposal.id}`)}
                                            >
                                              <Eye className="w-4 h-4" />
                                              View
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                </TableBody>
                              </Table>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsurerCreateBrokerQuote;
