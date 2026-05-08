import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { FileText, Search, Plus, Eye, Edit, Loader2, MessageSquare, Save, Settings2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import type { EndorsementListRow, Status } from "./endorsement-types";
import { getInsurerCompanyId } from "@/lib/auth";
import {
  getInsurerEndorsementFeeTypes,
  saveInsurerEndorsementFeeTypes,
  type EndorsementFeeTypeItem,
} from "@/lib/api/endorsements";

type EndorsementFeeTypeRow = {
  rowId: string;
  id?: string;
  label: string;
  adjustmentType: "PERCENTAGE" | "FIXED";
  adjustmentValue: number;
  status: "ACTIVE" | "INACTIVE";
};

export interface EndorsementListProps {
  endorsements: EndorsementListRow[];
  listMeta: { total: number; page: number; limit: number; totalPages: number } | null;
  listLoading: boolean;
  listError: string | null;
  searchTerm: string;
  listPage: number;
  statusFilter: string;
  typeFilter: string;
  detailLoading?: boolean;
  /** When true (broker portal), Edit is disabled unless status is Draft. When false (insurer), Edit is always enabled. */
  restrictEditToDraft?: boolean;
  /** When true, show "Create New Endorsement" button (broker only). When false (insurer), hide it. */
  showCreateButton?: boolean;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onStatusFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onCreateNew: () => void;
}

function getStatusBadge(status: Status) {
  const variants: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
    Draft: "outline",
    Submitted: "default",
    Approved: "secondary",
    Rejected: "destructive",
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

function formatPremiumAmount(amount?: number | null): string {
  if (amount == null || Number.isNaN(Number(amount))) return "N/A";
  return Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function getUnreadRowClassName(isUnread?: boolean, isBrokerPortal?: boolean): string | undefined {
  return isUnread && isBrokerPortal ? "bg-primary/12 hover:bg-primary/18" : undefined;
}

function isFinalizedEndorsementStatus(status: Status): boolean {
  return status === "Approved" || status === "Rejected";
}

function normalizeFeeAdjustmentType(value: unknown): EndorsementFeeTypeRow["adjustmentType"] {
  return String(value || "").toUpperCase() === "PERCENTAGE" ? "PERCENTAGE" : "FIXED";
}

function normalizeFeeStatus(value: unknown): EndorsementFeeTypeRow["status"] {
  return String(value || "").toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE";
}

function mapFeeTypeRow(item: EndorsementFeeTypeItem, index: number): EndorsementFeeTypeRow {
  return {
    rowId: item.id || `fee-${index}-${Date.now()}`,
    id: item.id,
    label: item.label || "",
    adjustmentType: normalizeFeeAdjustmentType(item.adjustmentType),
    adjustmentValue: Number(item.adjustmentValue || 0),
    status: normalizeFeeStatus(item.status),
  };
}


export function EndorsementList({
  endorsements,
  listMeta,
  listLoading,
  listError,
  searchTerm,
  listPage,
  statusFilter,
  typeFilter,
  detailLoading = false,
  restrictEditToDraft = false,
  showCreateButton = true,
  onSearchChange,
  onPageChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onView,
  onEdit,
  onCreateNew,
}: EndorsementListProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isBrokerPortal = restrictEditToDraft;
  const isInsurerPortal = !restrictEditToDraft;
  const insurerId = getInsurerCompanyId();
  const [endorsementFeeTypes, setEndorsementFeeTypes] = useState<EndorsementFeeTypeRow[]>([]);
  const [endorsementFeeTypesLoading, setEndorsementFeeTypesLoading] = useState(false);
  const [endorsementFeeTypesSaving, setEndorsementFeeTypesSaving] = useState(false);
  const [endorsementFeeTypesError, setEndorsementFeeTypesError] = useState<string | null>(null);
  const [isFeeConfigDialogOpen, setIsFeeConfigDialogOpen] = useState(false);
  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all-statuses" ||
    typeFilter !== "all-types";

  useEffect(() => {
    if (!isInsurerPortal) return;
    if (!insurerId) {
      setEndorsementFeeTypes([]);
      setEndorsementFeeTypesError("Unable to determine insurer ID.");
      return;
    }
    let cancelled = false;
    setEndorsementFeeTypesLoading(true);
    setEndorsementFeeTypesError(null);
    getInsurerEndorsementFeeTypes(insurerId)
      .then((rows) => {
        if (cancelled) return;
        const mapped = (rows || []).map(mapFeeTypeRow);
        setEndorsementFeeTypes(mapped);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setEndorsementFeeTypesError(err instanceof Error ? err.message : "Failed to load endorsement fees");
        setEndorsementFeeTypes([]);
      })
      .finally(() => {
        if (!cancelled) setEndorsementFeeTypesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isInsurerPortal, insurerId]);

  const addEndorsementFeeTypeRow = () => {
    setEndorsementFeeTypes((prev) => [
      ...prev,
      {
        rowId: `fee-${Date.now()}`,
        label: "",
        adjustmentType: "PERCENTAGE",
        adjustmentValue: 0,
        status: "ACTIVE",
      },
    ]);
  };

  const removeEndorsementFeeTypeRow = (rowId: string) => {
    setEndorsementFeeTypes((prev) => prev.filter((row) => row.rowId !== rowId));
  };

  const updateEndorsementFeeTypeRow = (
    rowId: string,
    field: "label" | "adjustmentType" | "adjustmentValue" | "status",
    value: string | number
  ) => {
    setEndorsementFeeTypes((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row))
    );
  };

  const handleSaveEndorsementFeeTypes = async () => {
    if (!insurerId) {
      setEndorsementFeeTypesError("Unable to determine insurer ID.");
      return;
    }
    try {
      setEndorsementFeeTypesSaving(true);
      setEndorsementFeeTypesError(null);
      const validRows = endorsementFeeTypes.filter((row) => row.label.trim() !== "");
      await saveInsurerEndorsementFeeTypes(
        insurerId,
        validRows.map((row) => ({
          ...(row.id ? { id: row.id } : {}),
          label: row.label.trim(),
          adjustmentType: row.adjustmentType,
          adjustmentValue: Number(row.adjustmentValue || 0),
          status: row.status,
        }))
      );
      const refreshed = await getInsurerEndorsementFeeTypes(insurerId);
      const mapped = (refreshed || []).map(mapFeeTypeRow);
      setEndorsementFeeTypes(mapped);
    } catch (err: unknown) {
      setEndorsementFeeTypesError(err instanceof Error ? err.message : "Failed to save endorsement fees");
    } finally {
      setEndorsementFeeTypesSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground">Endorsements Management</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage policy endorsements and modifications</p>
            </div>
          </div>
          {showCreateButton && (
            <Button onClick={onCreateNew} className="gap-2 flex-shrink-0">
              <Plus className="w-4 h-4" />
              Create New Endorsement
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full px-4 space-y-6">
          <Dialog open={isFeeConfigDialogOpen} onOpenChange={setIsFeeConfigDialogOpen}>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>Endorsement Fees</DialogTitle>
                <DialogDescription>Configure fee types and their values.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addEndorsementFeeTypeRow}
                    disabled={endorsementFeeTypesSaving || !insurerId}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Row
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEndorsementFeeTypes}
                    disabled={endorsementFeeTypesSaving || !insurerId}
                  >
                    {endorsementFeeTypesSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Fees
                      </>
                    )}
                  </Button>
                </div>
                {endorsementFeeTypesError && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {endorsementFeeTypesError}
                  </div>
                )}
                {endorsementFeeTypesLoading ? (
                  <div className="py-8 flex items-center justify-center text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading endorsement fees...
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Label</TableHead>
                          <TableHead>Pricing Type</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {endorsementFeeTypes.map((fee) => (
                          <TableRow key={fee.rowId}>
                            <TableCell>
                              <Input
                                value={fee.label}
                                onChange={(e) =>
                                  updateEndorsementFeeTypeRow(fee.rowId, "label", e.target.value)
                                }
                                placeholder="Enter fee type name"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={fee.adjustmentType}
                                onValueChange={(value: "PERCENTAGE" | "FIXED") =>
                                  updateEndorsementFeeTypeRow(fee.rowId, "adjustmentType", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                  <SelectItem value="FIXED">Fixed Amount</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step={fee.adjustmentType === "PERCENTAGE" ? "0.01" : "1"}
                                  value={Number.isFinite(fee.adjustmentValue) ? fee.adjustmentValue : 0}
                                  onChange={(e) =>
                                    updateEndorsementFeeTypeRow(
                                      fee.rowId,
                                      "adjustmentValue",
                                      Number(e.target.value || 0)
                                    )
                                  }
                                  className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">
                                  {fee.adjustmentType === "PERCENTAGE" ? "%" : "AED"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={fee.status}
                                onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                                  updateEndorsementFeeTypeRow(fee.rowId, "status", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ACTIVE">Active</SelectItem>
                                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEndorsementFeeTypeRow(fee.rowId)}
                                className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                disabled={endorsementFeeTypesSaving}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {endorsementFeeTypes.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No fee types configured. Click "Add Row" to add a fee type.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>
                    Endorsements
                    {listMeta != null ? ` (${listMeta.total})` : ""}
                  </CardTitle>
                  <CardDescription>List of all policy endorsements. Search by reference, policy number, or type.</CardDescription>
                </div>
                {/* {isInsurerPortal && (
                  <Button
                    size="sm"
                    onClick={() => setIsFeeConfigDialogOpen(true)}
                    disabled={!insurerId}
                  >
                    <Settings2 className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                )} */}
              </div>
            </CardHeader>
            <CardContent>
              {/* Search & Filter Bar — matches search-filter-container pattern used across all tables */}
              <div className="search-filter-container mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by policy number or reference..."
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-10 bg-background"
                    />
                  </div>

                  {/* Status Filter */}
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                      onStatusFilterChange(val);
                      onPageChange(1);
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-statuses">All Statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Type Filter */}
                  <Select
                    value={typeFilter}
                    onValueChange={(val) => {
                      onTypeFilterChange(val);
                      onPageChange(1);
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-types">All Types</SelectItem>
                      <SelectItem value="technical">Financial</SelectItem>
                      <SelectItem value="non_technical">Non-Financial</SelectItem>
                      <SelectItem value="extensions">Extensions</SelectItem>
                      <SelectItem value="cancellation">Cancellation</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onSearchChange("");
                      onStatusFilterChange("all-statuses");
                      onTypeFilterChange("all-types");
                      onPageChange(1);
                    }}
                    disabled={!hasActiveFilters}
                  >
                    Clear Filter
                  </Button>
                </div>
              </div>
              {listError ? (
                <div className="text-center py-12">
                  <p className="text-destructive">{listError}</p>
                </div>
              ) : listLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading endorsements...</span>
                </div>
              ) : endorsements.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No endorsements found</p>
                  {(searchTerm || statusFilter !== "all-statuses" || typeFilter !== "all-types") && (
                    <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filter criteria</p>
                  )}
                </div>
              ) : (
                <>
                  <Table className="table-auto w-auto min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-fit whitespace-nowrap">Endorsement Reference</TableHead>
                        <TableHead className="min-w-fit whitespace-nowrap">Policy Number</TableHead>
                        <TableHead className="min-w-fit whitespace-nowrap">Type</TableHead>
                        <TableHead className="min-w-fit whitespace-nowrap">Created Date</TableHead>
                        <TableHead className="min-w-fit whitespace-nowrap">Effective Date</TableHead>
                        <TableHead className="min-w-fit whitespace-nowrap">Premium Amount</TableHead>
                        <TableHead className="min-w-fit whitespace-nowrap">Requested By</TableHead>
                        <TableHead className="min-w-fit whitespace-nowrap">Status</TableHead>
                        <TableHead className="min-w-fit whitespace-nowrap text-center">Messages</TableHead>
                        <TableHead className="min-w-fit whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {endorsements.map((end) => (
                        <TableRow
                          key={end.id}
                          className={getUnreadRowClassName(end.isUnreadEndorsement, isBrokerPortal)}
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span>{end.endorsementReference}</span>
                              {isBrokerPortal && end.isUnreadEndorsement && (
                                <Badge
                                  variant="secondary"
                                  className="border border-primary/30 bg-primary/20 text-primary hover:bg-primary/20"
                                >
                                  New
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{end.policyNumber}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="text-sm">{end.endorsementType}</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {end.createdAt ? format(end.createdAt, "dd-MM-yyyy") : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {end.effectiveDate ? format(end.effectiveDate, "dd-MM-yyyy") : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatPremiumAmount(end.totalEndorsementAmount)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{end.requestedBy}</TableCell>
                          <TableCell className="whitespace-nowrap">{getStatusBadge(end.status)}</TableCell>
                          <TableCell className="whitespace-nowrap text-center">
                            <div className="flex justify-center">
                              {(() => {
                                const count = Number(end.unreadMessageCount || 0);
                                return count > 0 ? (
                                  <div className="relative w-fit">
                                    <MessageSquare className="w-5 h-5 text-blue-500" />
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                      {count}
                                    </span>
                                  </div>
                                ) : (
                                  <MessageSquare className="w-5 h-5 text-gray-400" />
                                );
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {(restrictEditToDraft && end.status !== "Draft") ||
                              (!restrictEditToDraft && isFinalizedEndorsementStatus(end.status)) ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onView(end.id)}
                                  disabled={detailLoading}
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onEdit(end.id)}
                                  disabled={detailLoading}
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {listMeta && (
                    <div className="px-0 py-4 border-t flex justify-between items-center mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {endorsements.length} of {listMeta.total} results
                      </div>
                      <div className="ml-auto">
                        <Pagination className="w-auto justify-end">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (listPage > 1) onPageChange(listPage - 1);
                                }}
                                className={
                                  listPage === 1 || endorsements.length === 0 || (listMeta?.total ?? 0) === 0
                                    ? "pointer-events-none opacity-50"
                                    : ""
                                }
                              />
                            </PaginationItem>
                            {(() => {
                              const maxPages = 5;
                              const totalPages = listMeta.totalPages;
                              let startPage = 1;
                              let endPage = Math.min(maxPages, totalPages);
                              if (totalPages > maxPages) {
                                if (listPage <= 3) {
                                  startPage = 1;
                                  endPage = maxPages;
                                } else if (listPage >= totalPages - 2) {
                                  startPage = totalPages - maxPages + 1;
                                  endPage = totalPages;
                                } else {
                                  startPage = listPage - 2;
                                  endPage = listPage + 2;
                                }
                              }
                              return Array.from(
                                { length: endPage - startPage + 1 },
                                (_, i) => startPage + i
                              ).map((pageNum) => (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    href="#"
                                    isActive={listPage === pageNum}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      onPageChange(pageNum);
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
                                  if (listPage < listMeta.totalPages) onPageChange(listPage + 1);
                                }}
                                className={
                                  listPage === listMeta.totalPages ||
                                    endorsements.length === 0 ||
                                    (listMeta?.total ?? 0) === 0
                                    ? "pointer-events-none opacity-50"
                                    : ""
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

