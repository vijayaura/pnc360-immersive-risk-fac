import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Eye, Settings, Users, ArrowLeft } from 'lucide-react';
import { TableSearchFilter, FilterConfig } from '@/components/shared/TableSearchFilter';
import { Insurer, listInsurers } from '@/features/insurers/api/insurers';
import { useToast } from '@/shared/hooks/use-toast';
import TableSkeleton from '@/components/loaders/TableSkeleton';
import { InsurerProductConfigDialog } from '../components/InsurerProductConfigDialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const getStatusBadge = (status: string) => {
  const normalizedStatus = status?.toUpperCase();
  switch (normalizedStatus) {
    case 'ACTIVE':
      return (
        <Badge variant="outline" className="text-success border-success/20">
          Active
        </Badge>
      );
    case 'INACTIVE':
      return (
        <Badge variant="outline" className="text-destructive border-destructive/20">
          Inactive
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

const MarketAdminInsurerManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedInsurer, setSelectedInsurer] = useState<Insurer | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const params: any = {
          page: currentPage,
          limit: itemsPerPage,
        };
        if (searchTerm) params.search = searchTerm;
        Object.keys(filters).forEach((key) => {
          if (filters[key]) params[key] = filters[key];
        });

        const response = await listInsurers(params);
        if (isMounted) {
          setInsurers(response.data);
          setTotalPages(response.meta.totalPages);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const status =
          typeof err === 'object' && err !== null && 'status' in err
            ? (err as { status?: number }).status
            : undefined;
        const message =
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: unknown }).message ?? '')
            : '';
        const friendly =
          status === 400
            ? 'Invalid request while loading insurers.'
            : status === 401
              ? 'Session expired. Please log in again.'
              : status === 403
                ? 'You are not authorized to view insurers.'
                : status === 500
                  ? 'Server error while fetching insurers.'
                  : message || 'Failed to load insurers.';
        setErrorMessage(friendly);
        toast({ title: 'Error', description: friendly });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      load();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [currentPage, itemsPerPage, searchTerm, filters, toast]);

  const insurerFilters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
      ],
    },
  ];

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({});
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Underwriters</h1>
                <p className="text-lg text-muted-foreground">
                  Manage insurance companies and their product configurations
                </p>
              </div>
            </div>
            <Button className="gap-2" onClick={() => navigate('/market-admin/insurer-management/create')}>
              <Plus className="w-4 h-4" />
              Create Underwriter
            </Button>
          </div>

          {/* Insurers List */}
          <Card>
            <CardHeader>
              <CardTitle>Insurance Partners</CardTitle>
              <CardDescription>
                Manage your insurance partners and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TableSearchFilter
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                filters={insurerFilters}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
              {errorMessage && (
                <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {errorMessage}
                </div>
              )}

              <TooltipProvider delayDuration={200}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Underwriter</TableHead>
                      <TableHead>License Number</TableHead>
                      <TableHead>Admin Mail</TableHead>
                      <TableHead>Contact Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableSkeleton rowCount={5} colCount={6} />
                    ) : insurers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="py-8 text-center text-muted-foreground">
                            No insurers found.
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      insurers.map((insurer) => {
                        const isInactive = insurer.status?.toLowerCase() === 'inactive';
                        return (
                          <TableRow
                            key={insurer.id}
                            className={
                              isInactive
                                ? 'opacity-50 text-muted-foreground'
                                : 'hover:bg-muted/50 transition-colors'
                            }
                          >
                            <TableCell>
                              <span className="font-medium">{insurer.name}</span>
                            </TableCell>
                            <TableCell>{insurer.licenseNumber || '—'}</TableCell>
                            <TableCell>{insurer.adminEmail || '—'}</TableCell>
                            <TableCell>{insurer.contactNumber || '—'}</TableCell>
                            <TableCell>{getStatusBadge(insurer.status)}</TableCell>

                            <TableCell className="text-center">
                              <div className="flex gap-2 justify-center">

                                {/* Edit Details — always clickable so admin can re-activate from inside */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        navigate(`/market-admin/insurer/${insurer.id}/edit`)
                                      }
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Edit Details
                                    </Button>
                                  </TooltipTrigger>
                                  {isInactive && (
                                    <TooltipContent side="top" className="max-w-[220px] text-center">
                                      <p>Insurer is inactive. Open to view details or re-activate via the toggle.</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>

                                {/* User Role — disabled when inactive */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    {/* Wrap in span so tooltip works on disabled buttons */}
                                    <span className={isInactive ? 'cursor-not-allowed' : ''}>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isInactive}
                                        onClick={() =>
                                          navigate(
                                            `/market-admin/user-management?organizationId=${insurer.id}&orgName=${encodeURIComponent(insurer.name)}`,
                                          )
                                        }
                                        className={isInactive ? 'pointer-events-none' : ''}
                                      >
                                        <Users className="w-4 h-4 mr-2" />
                                        Users & Roles
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {isInactive && (
                                    <TooltipContent side="top" className="max-w-[200px] text-center">
                                      <p>Activate the insurer to manage user roles.</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>

                                {/* Settings — disabled when inactive */}
                                {/* <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={isInactive ? 'cursor-not-allowed' : ''}>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isInactive}
                                        onClick={() => {
                                          setSelectedInsurer(insurer);
                                          setConfigDialogOpen(true);
                                        }}
                                        className={isInactive ? 'pointer-events-none' : ''}
                                      >
                                        <Settings className="w-4 h-4 mr-2" />
                                        Settings
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {isInactive && (
                                    <TooltipContent side="top" className="max-w-[200px] text-center">
                                      <p>Activate the insurer to access settings.</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip> */}

                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TooltipProvider>

              {/* Pagination */}
              {!isLoading && totalPages > 1 && (
                <div className="px-6 py-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i + 1}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === i + 1}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(i + 1);
                            }}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                          className={
                            currentPage === totalPages ? 'pointer-events-none opacity-50' : ''
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>

          <InsurerProductConfigDialog
            open={configDialogOpen}
            onOpenChange={setConfigDialogOpen}
            insurer={selectedInsurer}
          />
        </div>
      </div>
    </div>
  );
};

export default MarketAdminInsurerManagement;
