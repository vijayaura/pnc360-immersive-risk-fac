import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Edit, Trash2, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listBrokersViaManagement } from "@/features/brokers/api/brokers";
import TableSkeleton from "@/components/loaders/TableSkeleton";
import { formatDateShort } from "@/shared/utils/date-format";

interface BrokerManagementTabProps {
    itemsPerPage?: number;
}

const getUserStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'inactive': return 'bg-gray-100 text-gray-800';
        case 'suspended': return 'bg-red-100 text-red-800';
        default: return 'bg-blue-100 text-blue-800';
    }
};

export const BrokerManagementTab = ({ itemsPerPage = 5 }: BrokerManagementTabProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
    const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
    const [isAddInsurerDialogOpen, setIsAddInsurerDialogOpen] = useState(false);

    const [newUser, setNewUser] = useState({
        name: "",
        email: ""
    });
    const [editingUser, setEditingUser] = useState<any>(null);
    const [newInsurerCommission, setNewInsurerCommission] = useState({
        insurer: "",
        minCommission: "",
        maxCommission: ""
    });

    const { data: brokersData, isLoading, error } = useQuery({
        queryKey: ['admin-broker-management', currentPage, itemsPerPage],
        queryFn: () => listBrokersViaManagement('default', { page: currentPage, limit: itemsPerPage }),
    });

    const currentBrokers = useMemo(() => brokersData?.data || [], [brokersData]);
    const totalBrokerPages = useMemo(() => brokersData?.meta.totalPages || 0, [brokersData]);

    const handleAddUser = useCallback(() => {
        // Mock add user functionality
        console.log("Adding user:", newUser);
        setIsAddUserDialogOpen(false);
        setNewUser({ name: "", email: "" });
    }, [newUser]);

    const handleEditUser = useCallback((user: any) => {
        setEditingUser(user);
        setIsEditUserDialogOpen(true);
    }, []);

    const handleUpdateUser = useCallback(() => {
        // Mock update user functionality
        console.log("Updating user:", editingUser);
        setIsEditUserDialogOpen(false);
        setEditingUser(null);
    }, [editingUser]);

    const handleAddInsurerCommission = useCallback(() => {
        if (newInsurerCommission.insurer && newInsurerCommission.minCommission && newInsurerCommission.maxCommission) {
            const updatedCommissions = [...(editingUser?.insurerCommissions || []), newInsurerCommission];
            setEditingUser({ ...editingUser, insurerCommissions: updatedCommissions });
            setNewInsurerCommission({ insurer: "", minCommission: "", maxCommission: "" });
            setIsAddInsurerDialogOpen(false);
        }
    }, [newInsurerCommission, editingUser]);

    const handlePreviousPage = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (currentPage > 1) setCurrentPage(p => p - 1);
    }, [currentPage]);

    const handleNextPage = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (currentPage < totalBrokerPages) setCurrentPage(p => p + 1);
    }, [currentPage, totalBrokerPages]);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Broker Management
                            </CardTitle>
                            <CardDescription>
                                Manage brokers, their details, insurer products and commission rates
                            </CardDescription>
                        </div>
                        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    Add New Broker
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Broker</DialogTitle>
                                    <DialogDescription>
                                        Create a new broker account with access to the platform
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            autoComplete="off"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleAddUser}>
                                        Add Broker
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <TableSkeleton cols={7} rows={itemsPerPage} />
                    ) : error ? (
                        <div className="p-8 text-center text-destructive">
                            Error loading brokers. Please try again later.
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto table-scrollbars">
                            <Table equalColumns columnCount={7} minColumnWidth={150}>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Quotes Count</TableHead>
                                        <TableHead>Active Policies</TableHead>
                                        <TableHead>Join Date</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentBrokers.map((broker) => (
                                        <TableRow key={broker.id}>
                                            <TableCell className="font-medium">{broker.name}</TableCell>
                                            <TableCell>{broker.adminEmail || broker.brokerEmail || '-'}</TableCell>
                                            <TableCell>
                                                <Badge className={getUserStatusColor(broker.status || 'active')}>
                                                    {(broker.status || 'active').charAt(0).toUpperCase() + (broker.status || 'active').slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">{(broker as any).quotesCount || 0}</TableCell>
                                            <TableCell className="text-center">{(broker as any).activePolicies || 0}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{formatDateShort(broker.createdAt) || '-'}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(broker)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                            <div className="px-6 py-4 border-t">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={handlePreviousPage}
                                                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                            />
                                        </PaginationItem>
                                        {[...Array(totalBrokerPages)].map((_, i) => (
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
                                                onClick={handleNextPage}
                                                className={currentPage === totalBrokerPages ? "pointer-events-none opacity-50" : ""}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Edit User Dialog (simplified placeholder for now) */}
            <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Broker Details & Commission Management</DialogTitle>
                        <DialogDescription>
                            View and update broker information, insurer products and commission rates
                        </DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <div className="grid gap-6 py-4">
                            <p>Editing broker: {editingUser.name}</p>
                            {/* Real editing logic would go here, omitting for brevity in this mock-to-api migration step */}
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateUser}>
                            Update Broker
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};


