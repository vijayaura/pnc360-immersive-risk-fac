import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Trash2, Users, Settings, Plus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { TableSearchFilter, FilterConfig } from '@/components/shared/TableSearchFilter';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { Broker, listBrokers, listBrokersViaManagement } from '@/features/brokers/api/brokers';
import { listInsurers } from '@/features/insurers/api/insurers';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import TableSkeleton from '@/components/loaders/TableSkeleton';

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
    case 'FAILED':
      return (
        <Badge variant="outline" className="text-destructive border-destructive/20">
          Failed
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

const MarketAdminBrokerManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const { user } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isAddInsurerDialogOpen, setIsAddInsurerDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
  });
  const [availableInsurers, setAvailableInsurers] = useState<string[]>([]);

  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        let data: any[] = [];
        let meta: any = { totalPages: 1 };

        const params: any = {
          page: currentPage,
          limit: itemsPerPage,
        };
        if (searchTerm) params.search = searchTerm;
        Object.keys(filters).forEach((key) => {
          if (filters[key]) params[key] = filters[key];
        });

        if (user?.marketId) {
          const response = await listBrokersViaManagement(user.marketId, params);
          const managementBrokers = response.data;
          meta = response.meta;

          data = managementBrokers.map((broker: any) => ({
            id: broker.id || 0,
            name: broker.name || '',
            email: broker.brokerEmail || broker.adminEmail || '',
            phone: broker.contactNumber || '',
            company: broker.name || '',
            licenseNumber: undefined,
            licenseStartDate: undefined,
            licenseEndDate: undefined,
            joinDate: broker.createdAt || undefined,
            operatingCountries: undefined,
            operatingRegions: undefined,
            operatingZones: undefined,
            companyLogo: null,
            status: broker.status?.toLowerCase() || 'active',
            adminEmail: broker.adminEmail || undefined,
          }));
        } else {
          const response = await listBrokers(params);
          data = response.data;
          meta = response.meta;
        }

        if (isMounted) {
          setBrokers(data);
          setTotalPages(meta.totalPages || 1);
        }
      } catch (err: any) {
        if (!isMounted) return;
        const status = err?.status;
        const friendly =
          status === 400
            ? 'Invalid request while loading brokers.'
            : status === 401
              ? 'Session expired. Please log in again.'
              : status === 403
                ? 'You are not authorized to view brokers.'
                : status === 500
                  ? 'Server error while fetching brokers.'
                  : err?.message || 'Failed to load brokers.';
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
  }, [user?.marketId, currentPage, itemsPerPage, searchTerm, filters, toast]);

  useEffect(() => {
    const fetchInsurers = async () => {
      try {
        const response = await listInsurers();
        if (response && response.data) {
          setAvailableInsurers(response.data.map((i: any) => i.name));
        }
      } catch (error) {
        console.error('Failed to load insurers for commission dialog', error);
      }
    };
    fetchInsurers();
  }, []);

  // Configure filters for brokers
  const brokerFilters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'FAILED', label: 'Failed' },
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

  const [newInsurerCommission, setNewInsurerCommission] = useState({
    insurer: '',
    minCommission: '',
    maxCommission: '',
  });

  const handleAddUser = () => {
    toast({
      title: 'Broker Added',
      description: `Successfully added broker: ${newUser.name}`,
    });
    setIsAddUserDialogOpen(false);
    setNewUser({ name: '', email: '' });
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = () => {
    showConfirmDialog(
      {
        title: 'Save Changes',
        description: `Are you sure you want to save the changes to ${editingUser?.name}'s broker account?`,
        confirmText: 'Save Changes',
      },
      () => {
        toast({
          title: 'Broker Updated',
          description: `Successfully updated broker: ${editingUser?.name}`,
        });
        setIsEditUserDialogOpen(false);
        setEditingUser(null);
      },
    );
  };

  const handleAddInsurerCommission = () => {
    if (
      newInsurerCommission.insurer &&
      newInsurerCommission.minCommission &&
      newInsurerCommission.maxCommission
    ) {
      const updatedCommissions = [...(editingUser.insurerCommissions || []), newInsurerCommission];
      setEditingUser({ ...editingUser, insurerCommissions: updatedCommissions });
      toast({
        title: 'Commission Added',
        description: `Successfully added commission rates for ${newInsurerCommission.insurer}`,
      });
      setNewInsurerCommission({ insurer: '', minCommission: '', maxCommission: '' });
      setIsAddInsurerDialogOpen(false);
    }
  };

  const availableInsurersForUser = availableInsurers.filter(
    (insurer) => !editingUser?.insurerCommissions?.some((comm: any) => comm.insurer === insurer),
  );

  return (
    <div className="h-full bg-gradient-to-br from-background to-secondary/20 flex flex-col overflow-hidden">
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-full space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              {/* <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button> */}
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Distributor Management</h1>
                <p className="text-lg text-muted-foreground">
                  Manage distributor accounts and their commission structures
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => navigate('/market-admin/broker-management/create')}
            >
              <Plus className="w-4 h-4" />
              Add New Distributor
            </Button>
          </div>

          {/* Brokers Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Distributor Management
              </CardTitle>
              <CardDescription>
                Manage distributor accounts, view their statistics, and configure commission rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TableSearchFilter
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                filters={brokerFilters}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Broker Name</TableHead>
                      <TableHead className="min-w-[250px]">Admin Email</TableHead>
                      <TableHead className="min-w-[180px]">Contact Number</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[150px]">Join Date</TableHead>
                      <TableHead className="text-center min-w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableSkeleton rowCount={5} colCount={6} />
                    ) : brokers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="py-8 text-center text-muted-foreground">
                            No brokers found.
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      brokers.map((broker) => (
                        <TableRow
                          key={broker.id}
                          className={
                            broker.status?.toLowerCase() === 'inactive'
                              ? 'opacity-50 text-muted-foreground'
                              : ''
                          }
                        >
                          <TableCell className="font-medium">{broker.name}</TableCell>
                          <TableCell>{broker.adminEmail || '—'}</TableCell>
                          <TableCell>{broker.phone || '—'}</TableCell>
                          <TableCell>{getStatusBadge(broker.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {broker.joinDate
                                ? formatDateDDMMYYYY(broker.joinDate)
                                : '—'}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/market-admin/broker/${broker.id}/edit`)}
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                Edit Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  navigate(
                                    `/market-admin/user-management?organizationId=${broker.id}`,
                                  );
                                }}
                              >
                                <Users className="w-4 h-4 mr-2" />
                                Users & Roles
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
                    {[...Array(totalPages)].map((_, i) => (
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
            </CardContent>
          </Card>

          {/* Edit Broker Dialog */}
          <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Distributor Details & Commission Management</DialogTitle>
                <DialogDescription>
                  View broker details and manage commission rates for different insurers
                </DialogDescription>
              </DialogHeader>

              {editingUser && (
                <div className="grid gap-6 py-4">
                  {/* Broker Details Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Broker Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input value={editingUser.name} readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={editingUser.email} readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input value={editingUser.phone || 'N/A'} readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label>Company</Label>
                        <Input value={editingUser.company || 'N/A'} readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label>License Number</Label>
                        <Input
                          value={editingUser.licenseNumber || 'N/A'}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <div className="pt-2">{getStatusBadge(editingUser.status)}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{editingUser.quotesCount}</div>
                          <div className="text-sm text-muted-foreground">Total Quotes</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{editingUser.activePolicies}</div>
                          <div className="text-sm text-muted-foreground">Active Policies</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{editingUser.joinDate}</div>
                          <div className="text-sm text-muted-foreground">Join Date</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Commission Management Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Insurer Commission Rates</h3>
                      <Dialog
                        open={isAddInsurerDialogOpen}
                        onOpenChange={setIsAddInsurerDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm">Add Insurer</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Insurer Commission</DialogTitle>
                            <DialogDescription>
                              Set commission rates for a new insurer
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label>Insurer</Label>
                              <Select
                                value={newInsurerCommission.insurer}
                                onValueChange={(value) =>
                                  setNewInsurerCommission({
                                    ...newInsurerCommission,
                                    insurer: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an insurer" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableInsurersForUser.map((insurer) => (
                                    <SelectItem key={insurer} value={insurer}>
                                      {insurer}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label>Min Commission (%)</Label>
                                <Input
                                  type="number"
                                  value={newInsurerCommission.minCommission}
                                  onChange={(e) =>
                                    setNewInsurerCommission({
                                      ...newInsurerCommission,
                                      minCommission: e.target.value,
                                    })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Max Commission (%)</Label>
                                <Input
                                  type="number"
                                  value={newInsurerCommission.maxCommission}
                                  onChange={(e) =>
                                    setNewInsurerCommission({
                                      ...newInsurerCommission,
                                      maxCommission: e.target.value,
                                    })
                                  }
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsAddInsurerDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleAddInsurerCommission}>Add Commission</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="overflow-x-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px]">Insurer</TableHead>
                            <TableHead className="min-w-[150px]">Min Commission (%)</TableHead>
                            <TableHead className="min-w-[150px]">Max Commission (%)</TableHead>
                            <TableHead className="text-center min-w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {editingUser.insurerCommissions?.map((commission: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{commission.insurer}</TableCell>
                              <TableCell>{commission.minCommission}%</TableCell>
                              <TableCell>{commission.maxCommission}%</TableCell>
                              <TableCell className="text-center">
                                <Button variant="outline" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ConfirmDialog />
    </div>
  );
};

export default MarketAdminBrokerManagement;
