import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Globe, Settings, Eye, Search, Building2, Users, Shield, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/shared/hooks/use-toast';
import {
  listEnvironments,
  getSuperAdminDashboardEnvironments,
  type Environment,
  type ListEnvironmentsResult,
} from '@/features/super-admin/api/super-admin';
import { EnvironmentDetailsDialog } from '../components/EnvironmentDetailsDialog';
import { EditEnvironmentDialog } from '../components/EditEnvironmentDialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalItems, setTotalItems] = useState(0);
  const [totalActiveItems, setTotalActiveItems] = useState(0);
  const [totalMarketAdmins, setTotalMarketAdmins] = useState(0);
  const [totalInsurers, setTotalInsurers] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  const handleViewDetails = (env: Environment) => {
    setSelectedEnvironment(env);
    setIsDetailsOpen(true);
  };

  const handleEdit = (env: Environment) => {
    setSelectedEnvironment(env);
    setIsEditOpen(true);
  };

  const fetchEnvironments = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: currentPage,
        limit,
        search: searchTerm,
      };

      const response = await getSuperAdminDashboardEnvironments(params);

      setEnvironments(response.environments);
      setTotalItems(response.totalEnvironment);
      setTotalActiveItems(response.totalActiveEnvironment);
      setTotalMarketAdmins(response.totalMarketAdmin);
      setTotalInsurers(response.totalInsurer);

    } catch (error: unknown) {
      console.error('Failed to fetch environments:', error);
      const errorMessage =
        (error as { message?: string })?.message ||
        'Failed to load environments. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch environments on mount and when dependencies change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEnvironments();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit, searchTerm]);

  // Handle successful edit
  const handleEditSuccess = () => {
    fetchEnvironments();
  };

  const getStatusBadge = (status: string = '') => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'active':
        return (
          <Badge variant="outline" className="text-success border-success/20">
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="text-destructive border-destructive/20">
            Inactive
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-500/20">
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="text-destructive border-destructive/20">
            Failed
          </Badge>
        );
      default:
        return <Badge>{status ? status.charAt(0).toUpperCase() + status.slice(1) : status}</Badge>;
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      <div className="flex-1 p-6">
        <div className="w-full px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Super Admin Dashboard</h1>
              <p className="text-lg text-muted-foreground">
                Manage environments and access controls across all marketplaces
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => navigate('/super-admin/environments/create')}
            >
              <Plus className="w-4 h-4" />
              Create Environment
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Total Environments
                    </p>
                    <p className="text-3xl font-bold text-foreground">{totalItems}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Active Environments
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {totalActiveItems}
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Total Market Admins
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {totalMarketAdmins}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Insurers</p>
                    <p className="text-3xl font-bold text-foreground">
                      {totalInsurers}
                    </p>
                  </div>
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Building2 className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Environments Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Environments
                  </CardTitle>
                  <CardDescription>
                    Manage all client environments and their access controls
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search environments by name or client..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page on search
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Environment Name</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Market Admins</TableHead>
                      <TableHead>Insurers</TableHead>
                      <TableHead>Brokers</TableHead>
                      <TableHead>Reinsurers</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Loading environments...
                        </TableCell>
                      </TableRow>
                    ) : environments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No environments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      environments.map((env) => (
                        <TableRow key={env.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{env.name}</TableCell>
                          <TableCell>{env.clientName}</TableCell>
                          <TableCell>{getStatusBadge(env.status)}</TableCell>
                          <TableCell>{env.marketAdmins ?? 0}</TableCell>
                          <TableCell>{env.insurers ?? 0}</TableCell>
                          <TableCell>{env.brokers ?? 0}</TableCell>
                          <TableCell>{env.reinsurers ?? 0}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {env.createdAt ? formatDateDDMMYYYY(env.createdAt) : 'N/A'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  // navigate(`/super-admin/environments/${env.id}/authority-matrix`)
                                  navigate(
                                    `/super-admin/environments/${env.marketId}/authority-matrix`,
                                  )
                                }
                              >
                                <Settings className="w-4 h-4 mr-1" />
                                Authority Matrix
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(env)}>
                                <Pencil className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(env)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalItems > 0 && (
                <div className="flex items-center justify-between py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((currentPage - 1) * limit + 1, totalItems)} to{' '}
                    {Math.min(currentPage * limit, totalItems)} of {totalItems} environments
                  </div>
                  <Pagination className="w-auto m-0 justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>

                      {/* Page Numbers Logic */}
                      {(() => {
                        const maxVisiblePages = 5;
                        let startPage = 1;
                        let endPage = Math.min(maxVisiblePages, totalPages);

                        if (totalPages > maxVisiblePages) {
                          if (currentPage <= 3) {
                            startPage = 1;
                            endPage = maxVisiblePages;
                          } else if (currentPage >= totalPages - 2) {
                            startPage = totalPages - maxVisiblePages + 1;
                            endPage = totalPages;
                          } else {
                            startPage = currentPage - 2;
                            endPage = currentPage + 2;
                          }
                        }

                        return Array.from(
                          { length: endPage - startPage + 1 },
                          (_, i) => startPage + i
                        ).map((pageNum) => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              isActive={currentPage === pageNum}
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(pageNum);
                              }}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ));
                      })()}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EnvironmentDetailsDialog
        environment={selectedEnvironment}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <EditEnvironmentDialog
        environment={selectedEnvironment}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default SuperAdminDashboard;
