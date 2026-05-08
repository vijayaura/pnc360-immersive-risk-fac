import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Shield, Eye, ArrowLeft } from "lucide-react";
import { TableSearchFilter, type FilterConfig } from "@/components/shared/TableSearchFilter";
import { useTableSearch } from "@/shared/hooks/useTableSearch";
import { listReinsurers, listReinsurerGrades, type Reinsurer } from "@/features/reinsurers/api/reinsurers";
import { useToast } from "@/shared/hooks/use-toast";
import TableSkeleton from "@/components/loaders/TableSkeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const getStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return (
        <Badge variant="outline" className="text-success border-success/20 bg-success/5">
          Active
        </Badge>
      );
    case "inactive":
      return (
        <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5">
          Inactive
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const ITEMS_PER_PAGE = 10;

const reinsurerFilters: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
];

const MarketAdminReinsurerManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reinsurers, setReinsurers] = useState<Reinsurer[]>([]);
  const [gradeMap, setGradeMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [response, grades] = await Promise.all([
          listReinsurers({ page: 1, limit: 100 }),
          listReinsurerGrades(),
        ]);
        if (isMounted) {
          setReinsurers(response?.data || []);
          const map = Object.fromEntries((grades || []).map((g) => [g.id, g.valueLabel]));
          setGradeMap(map);
        }
      } catch (err: any) {
        const status = err?.status;
        const friendly =
          status === 400 ? "Invalid request while loading reinsurers." :
          status === 401 ? "Session expired. Please log in again." :
          status === 403 ? "You are not authorized to view reinsurers." :
          status === 404 ? "Reinsurer management is not yet available." :
          status === 500 ? "Server error while fetching reinsurers." :
          err?.message || "Failed to load reinsurers.";
        if (isMounted) setErrorMessage(friendly);
        if (status !== 404) {
          toast({ title: "Error", description: friendly, variant: "destructive" });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const {
    searchTerm,
    setSearchTerm,
    filters,
    filteredData: searchResults,
    updateFilter,
    clearFilters,
  } = useTableSearch({
    data: reinsurers,
    searchableFields: ["name", "adminEmail", "phone", "licenseNumber", "grade"],
    initialFilters: {},
  });

  // useTableSearch uses .includes() for string comparison — "inactive".includes("active") is true,
  // so the Active filter would incorrectly pass inactive rows. Apply exact match for status here.
  const filteredReinsurers = filters.status
    ? searchResults.filter((r) => r.status?.toLowerCase() === filters.status.toLowerCase())
    : searchResults;

  const totalPages = Math.ceil(filteredReinsurers.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentReinsurers = filteredReinsurers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: any) => {
    updateFilter(key, value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Reinsurer Management</h1>
                <p className="text-lg text-muted-foreground">
                  Manage reinsurance partners, their locations and admin access
                </p>
              </div>
            </div>
            <Button className="gap-2" onClick={() => navigate("/market-admin/create-reinsurer")}>
              <Plus className="w-4 h-4" />
              Create Reinsurer
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Reinsurance Partners
              </CardTitle>
              <CardDescription>
                Manage your reinsurance partners and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TableSearchFilter
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search by name, email, phone, license..."
                filters={reinsurerFilters}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
              />

              {errorMessage && (
                <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {errorMessage}
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reinsurer</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>License Number</TableHead>
                    <TableHead>Admin Email</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton rowCount={5} colCount={7} />
                  ) : currentReinsurers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="py-8 text-center text-muted-foreground">
                          {filteredReinsurers.length === 0 && reinsurers.length > 0
                            ? "No reinsurers match your search."
                            : "No reinsurers found. Create your first reinsurance partner."}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentReinsurers.map((reinsurer) => {
                      const isInactive = reinsurer.status?.toLowerCase() === 'inactive';
                      return (
                        <TableRow
                          key={reinsurer.id}
                          className={
                            isInactive
                              ? 'opacity-50 text-muted-foreground'
                              : 'hover:bg-muted/50 transition-colors'
                          }
                        >
                          <TableCell>
                            <span className="font-medium">{reinsurer.name}</span>
                          </TableCell>
                          <TableCell>{gradeMap[reinsurer.gradeId || ''] || reinsurer.grade || "—"}</TableCell>
                          <TableCell>{reinsurer.licenseNumber || "—"}</TableCell>
                          <TableCell>{reinsurer.adminEmail || "—"}</TableCell>
                          <TableCell>{reinsurer.phone || "—"}</TableCell>
                          <TableCell>{getStatusBadge(reinsurer.status)}</TableCell>
                          <TableCell className="text-center">
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/market-admin/reinsurer/${reinsurer.id}/edit`)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Edit Details
                                  </Button>
                                </TooltipTrigger>
                                {isInactive && (
                                  <TooltipContent side="top" className="max-w-[220px] text-center">
                                    <p>Reinsurer is inactive. Open to view details or re-activate via the toggle.</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {!isLoading && filteredReinsurers.length > ITEMS_PER_PAGE && (
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
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
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
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
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
    </div>
  );
};

export default MarketAdminReinsurerManagement;
