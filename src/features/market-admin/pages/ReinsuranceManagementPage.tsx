import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, Lock, BarChart3 } from "lucide-react";
import { TableSearchFilter, type FilterConfig } from "@/components/shared/TableSearchFilter";
import { useTableSearch } from "@/shared/hooks/useTableSearch";
import { listReinsurers, listReinsurerGrades, type Reinsurer } from "@/features/reinsurers/api/reinsurers";
import { listReinsuranceBrokers, type ReinsuranceBroker } from "@/features/reinsurance-brokers/api/reinsurance-brokers";
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

const statusFilters: FilterConfig[] = [
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

type TabValue = "reinsurance" | "intermediary";

const ReinsuranceManagementPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabValue>("reinsurance");

  // — Reinsurer state —
  const [reinsurers, setReinsurers] = useState<Reinsurer[]>([]);
  const [gradeMap, setGradeMap] = useState<Record<string, string>>({});
  const [isLoadingReinsurers, setIsLoadingReinsurers] = useState(false);
  const [reinsurerError, setReinsurerError] = useState<string | null>(null);
  const [reinsurerPage, setReinsurerPage] = useState(1);

  // — Broker state —
  const [brokers, setBrokers] = useState<ReinsuranceBroker[]>([]);
  const [isLoadingBrokers, setIsLoadingBrokers] = useState(false);
  const [brokerError, setBrokerError] = useState<string | null>(null);
  const [brokerPage, setBrokerPage] = useState(1);

  // — Fetch reinsurers on mount —
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoadingReinsurers(true);
      setReinsurerError(null);
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
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        const friendly =
          status === 400 ? "Invalid request while loading reinsurers." :
          status === 401 ? "Session expired. Please log in again." :
          status === 403 ? "You are not authorized to view reinsurers." :
          status === 404 ? "Reinsurer management is not yet available." :
          status === 500 ? "Server error while fetching reinsurers." :
          (err as { message?: string })?.message || "Failed to load reinsurers.";
        if (isMounted) setReinsurerError(friendly);
        if (status !== 404) {
          toast({ title: "Error", description: friendly, variant: "destructive" });
        }
      } finally {
        if (isMounted) setIsLoadingReinsurers(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // — Fetch brokers on mount —
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoadingBrokers(true);
      setBrokerError(null);
      try {
        const response = await listReinsuranceBrokers({ page: 1, limit: 100 });
        if (isMounted) {
          setBrokers(response?.data || []);
        }
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        const friendly =
          status === 400 ? "Invalid request while loading reinsurance brokers." :
          status === 401 ? "Session expired. Please log in again." :
          status === 403 ? "You are not authorized to view reinsurance brokers." :
          status === 404 ? "Reinsurance broker management is not yet available." :
          status === 500 ? "Server error while fetching reinsurance brokers." :
          (err as { message?: string })?.message || "Failed to load reinsurance brokers.";
        if (isMounted) setBrokerError(friendly);
        if (status !== 404) {
          toast({ title: "Error", description: friendly, variant: "destructive" });
        }
      } finally {
        if (isMounted) setIsLoadingBrokers(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // — Reinsurer search/filter —
  const {
    searchTerm: reinsurerSearchTerm,
    setSearchTerm: setReinsurerSearchTerm,
    filters: reinsurerFilters,
    filteredData: reinsurerSearchResults,
    updateFilter: updateReinsurerFilter,
    clearFilters: clearReinsurerFilters,
  } = useTableSearch({
    data: reinsurers,
    searchableFields: ["name", "adminEmail", "phone", "licenseNumber", "grade"],
    initialFilters: {},
  });

  const filteredReinsurers = reinsurerFilters.status
    ? reinsurerSearchResults.filter((r) => r.status?.toLowerCase() === reinsurerFilters.status.toLowerCase())
    : reinsurerSearchResults;

  const reinsurerTotalPages = Math.ceil(filteredReinsurers.length / ITEMS_PER_PAGE) || 1;
  const reinsurerStartIndex = (reinsurerPage - 1) * ITEMS_PER_PAGE;
  const currentReinsurers = filteredReinsurers.slice(reinsurerStartIndex, reinsurerStartIndex + ITEMS_PER_PAGE);

  // — Broker search/filter —
  const {
    searchTerm: brokerSearchTerm,
    setSearchTerm: setBrokerSearchTerm,
    filters: brokerFiltersState,
    filteredData: brokerSearchResults,
    updateFilter: updateBrokerFilter,
    clearFilters: clearBrokerFilters,
  } = useTableSearch({
    data: brokers,
    searchableFields: ["name", "adminEmail", "phone", "licenseNumber"],
    initialFilters: {},
  });

  const filteredBrokers = brokerFiltersState.status
    ? brokerSearchResults.filter((b) => b.status?.toLowerCase() === brokerFiltersState.status.toLowerCase())
    : brokerSearchResults;

  const brokerTotalPages = Math.ceil(filteredBrokers.length / ITEMS_PER_PAGE) || 1;
  const brokerStartIndex = (brokerPage - 1) * ITEMS_PER_PAGE;
  const currentBrokers = filteredBrokers.slice(brokerStartIndex, brokerStartIndex + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Reinsurance Management</h1>
              <p className="text-lg text-muted-foreground">
                Manage reinsurers, intermediaries, dashboards, and analytics
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/market-admin/reinsurance-dashboard")}
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard and Analytics
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
            <TabsList className="inline-flex h-auto bg-transparent border rounded-lg p-1 mb-6">
              <TabsTrigger
                value="reinsurance"
                className="px-4 py-2 text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Reinsurers
              </TabsTrigger>
              <TabsTrigger
                value="intermediary"
                className="px-4 py-2 text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Intermediary
              </TabsTrigger>
            </TabsList>

            {/* ── Reinsurance Tab ── */}
            <TabsContent value="reinsurance" className="mt-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Reinsurance Partners</h2>
                  <p className="text-sm text-muted-foreground">Manage your reinsurance partners and their configurations</p>
                </div>
                <Button className="gap-2" onClick={() => navigate("/market-admin/create-reinsurer")}>
                  <Plus className="w-4 h-4" />
                  Create Reinsurer
                </Button>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <TableSearchFilter
                    searchTerm={reinsurerSearchTerm}
                    onSearchChange={(value: string) => { setReinsurerSearchTerm(value); setReinsurerPage(1); }}
                    searchPlaceholder="Search by name, email, phone, license..."
                    filters={statusFilters}
                    activeFilters={reinsurerFilters}
                    onFilterChange={(key: string, value: unknown) => { updateReinsurerFilter(key, value); setReinsurerPage(1); }}
                    onClearFilters={clearReinsurerFilters}
                  />

                  {reinsurerError && (
                    <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {reinsurerError}
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
                      {isLoadingReinsurers ? (
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
                          const isInactive = reinsurer.status?.toLowerCase() === "inactive";
                          return (
                            <TableRow
                              key={reinsurer.id}
                              className={`hover:bg-muted/50 transition-colors ${
                                isInactive
                                  ? "border-l-2 border-l-destructive/40"
                                  : "border-l-2 border-l-transparent"
                              }`}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{reinsurer.name}</span>
                                  {isInactive && (
                                    <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{gradeMap[reinsurer.gradeId || ""] || reinsurer.grade || "—"}</TableCell>
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

                  {!isLoadingReinsurers && filteredReinsurers.length > ITEMS_PER_PAGE && (
                    <div className="px-6 py-4 border-t">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (reinsurerPage > 1) setReinsurerPage(reinsurerPage - 1);
                              }}
                              className={reinsurerPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          {Array.from({ length: reinsurerTotalPages }).map((_, i) => (
                            <PaginationItem key={i + 1}>
                              <PaginationLink
                                href="#"
                                isActive={reinsurerPage === i + 1}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setReinsurerPage(i + 1);
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
                                if (reinsurerPage < reinsurerTotalPages) setReinsurerPage(reinsurerPage + 1);
                              }}
                              className={reinsurerPage === reinsurerTotalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Intermediary Tab ── */}
            <TabsContent value="intermediary" className="mt-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Reinsurance Brokers</h2>
                  <p className="text-sm text-muted-foreground">Manage your reinsurance brokers and their configurations</p>
                </div>
                <Button className="gap-2" onClick={() => navigate("/market-admin/create-reinsurance-broker")}>
                  <Plus className="w-4 h-4" />
                  Create Reinsurance Broker
                </Button>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <TableSearchFilter
                    searchTerm={brokerSearchTerm}
                    onSearchChange={(value: string) => { setBrokerSearchTerm(value); setBrokerPage(1); }}
                    searchPlaceholder="Search by name, email, phone, license..."
                    filters={statusFilters}
                    activeFilters={brokerFiltersState}
                    onFilterChange={(key: string, value: unknown) => { updateBrokerFilter(key, value); setBrokerPage(1); }}
                    onClearFilters={clearBrokerFilters}
                  />

                  {brokerError && (
                    <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {brokerError}
                    </div>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>License Number</TableHead>
                        <TableHead>Admin Email</TableHead>
                        <TableHead>Contact Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingBrokers ? (
                        <TableSkeleton rowCount={5} colCount={6} />
                      ) : currentBrokers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="py-8 text-center text-muted-foreground">
                              {filteredBrokers.length === 0 && brokers.length > 0
                                ? "No reinsurance brokers match your search."
                                : "No reinsurance brokers found. Create your first reinsurance broker."}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentBrokers.map((broker) => {
                          const isInactive = broker.status?.toLowerCase() === "inactive";
                          return (
                            <TableRow
                              key={broker.id}
                              className={`hover:bg-muted/50 transition-colors ${
                                isInactive
                                  ? "border-l-2 border-l-destructive/40"
                                  : "border-l-2 border-l-transparent"
                              }`}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{broker.name}</span>
                                  {isInactive && (
                                    <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{broker.licenseNumber || "—"}</TableCell>
                              <TableCell>{broker.adminEmail || "—"}</TableCell>
                              <TableCell>{broker.phone || "—"}</TableCell>
                              <TableCell>{getStatusBadge(broker.status)}</TableCell>
                              <TableCell className="text-center">
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`/market-admin/reinsurance-broker/${broker.id}/edit`)}
                                      >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Edit Details
                                      </Button>
                                    </TooltipTrigger>
                                    {isInactive && (
                                      <TooltipContent side="top" className="max-w-[220px] text-center">
                                        <p>Broker is inactive. Open to view details or re-activate via the toggle.</p>
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

                  {!isLoadingBrokers && filteredBrokers.length > ITEMS_PER_PAGE && (
                    <div className="px-6 py-4 border-t">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (brokerPage > 1) setBrokerPage(brokerPage - 1);
                              }}
                              className={brokerPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          {Array.from({ length: brokerTotalPages }).map((_, i) => (
                            <PaginationItem key={i + 1}>
                              <PaginationLink
                                href="#"
                                isActive={brokerPage === i + 1}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setBrokerPage(i + 1);
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
                                if (brokerPage < brokerTotalPages) setBrokerPage(brokerPage + 1);
                              }}
                              className={brokerPage === brokerTotalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export { ReinsuranceManagementPage };
