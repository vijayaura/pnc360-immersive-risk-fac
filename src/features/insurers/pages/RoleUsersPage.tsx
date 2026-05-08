import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ArrowLeft, Search, Users, UserPlus } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { getInsurerUsers } from '@/features/auth/api/users';
import { getInsurerCompanyId } from '@/lib/auth';

type UiUser = {
  id: string;
  name?: string;
  email: string;
  type: string;
  roleId?: string | null;
  roleName?: string | null;
  status: string;
  createdAt: string;
  organizationId: string;
};

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':   return 'bg-green-100 text-green-800 border-green-200';
    case 'INACTIVE': return 'bg-red-100 text-red-800 border-red-200';
    case 'PENDING':  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:         return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function RoleUsersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();

  // Context from URL params
  const roleId   = searchParams.get('roleId') || '';
  const roleName = searchParams.get('roleName') || 'Role';
  const orgId    = searchParams.get('orgId') || searchParams.get('organizationId') || '';
  const orgName  = searchParams.get('orgName') || '';

  const isMarketAdmin =
    location.pathname.includes('/market-admin') ||
    window.location.pathname.includes('/market-admin');

  const [users, setUsers]               = useState<UiUser[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage]                 = useState(1);
  const limit                           = 10;
  const [searchTerm, setSearchTerm]     = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const companyId = isMarketAdmin
          ? (orgId || undefined)
          : (getInsurerCompanyId()?.toString());

        const resp = await getInsurerUsers({
          page,
          limit,
          search: searchTerm,
          organizationId: companyId,
        });

        if (!isMounted) return;

        // Filter by roleId client-side
        const all: UiUser[] = resp.items.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          type: u.type,
          roleId: u.roleId ?? null,
          roleName: u.roleName ?? null,
          status: u.status,
          createdAt: u.createdAt,
          organizationId: (u.organizationId || u.organization_id || '').toString(),
        }));

        const filtered = roleId ? all.filter((u) => u.roleId === roleId) : all;
        setUsers(filtered);
        setTotal(filtered.length);
      } catch (err: unknown) {
        const error = err as { status?: number; message?: string };
        const status = error?.status;
        const message = error?.message;
        if (status === 401) setErrorMessage('You are not authenticated. Please log in.');
        else if (status === 403) setErrorMessage("You don't have permission to view users.");
        else if (status && status >= 500) setErrorMessage('Server error. Please try again later.');
        else setErrorMessage(message || 'Failed to load users.');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [page, searchTerm, roleId, orgId, isMarketAdmin]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total],
  );

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const q = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [users, searchTerm]);

  const handleAddUser = () => {
    const path = isMarketAdmin ? '/market-admin/add-user' : '/insurer/add-user';
    navigate(path, {
      state: {
        organizationId: orgId || undefined,
        organizationName: orgName || undefined,
        preselectedRoleId: roleId,
        preselectedRoleName: roleName,
      },
    });
  };

  const handleEditUser = (user: UiUser) => {
    const path = isMarketAdmin
      ? `/market-admin/edit-user/${user.id}`
      : `/insurer/edit-user/${user.id}`;
    navigate(path, {
      state: {
        organizationId: user.organizationId || orgId || undefined,
        organizationName: orgName || undefined,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6 cityscape-bg">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">{roleName}</h1>
              </div>
              <p className="text-muted-foreground">
                {orgName ? `${orgName} · ` : ''}Users assigned to this role
              </p>
            </div>
          </div>
          <Button className="gap-2 self-start sm:self-auto" onClick={handleAddUser}>
            <UserPlus className="w-4 h-4" />
            Add New User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.status?.toUpperCase() === 'ACTIVE').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter((u) => u.status?.toUpperCase() === 'INACTIVE').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users
            </CardTitle>
            <CardDescription>Users assigned to the <strong>{roleName}</strong> role</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-6 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>

            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && <TableSkeleton rowCount={5} colCount={6} />}
                  {!loading && filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No users assigned to this role.</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name || user.email?.split('@')[0] || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                          {user.roleName || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                          Edit Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="px-2 py-4 border-t mt-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        href="#"
                        isActive={page === i + 1}
                        onClick={(e) => { e.preventDefault(); setPage(i + 1); }}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
