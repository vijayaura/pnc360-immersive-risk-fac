import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useLocation, useParams, useNavigate } from "react-router-dom";
import { listEndorsements } from "@/lib/api/endorsements";
import { mapListItemToRow } from "@/features/insurers/components/endorsement-types";
import type { EndorsementListRow } from "@/features/insurers/components/endorsement-types";
import { EndorsementList } from "@/features/insurers/components/EndorsementList";
import { EndorsementForm } from "@/features/insurers/components/EndorsementForm";
import { getBrokerCompanyId } from "@/lib/auth";

const LIST_LIMIT = 5;

const InsurerEndorsements = () => {
  const { pathname, key } = useLocation();
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isBroker = pathname.startsWith("/broker");
  const brokerOrgId = isBroker ? getBrokerCompanyId()?.toString() : undefined;
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit" | "view">("list");
  const [selectedEndorsementId, setSelectedEndorsementId] = useState<string | null>(null);
  const [endorsements, setEndorsements] = useState<EndorsementListRow[]>([]);
  const [listMeta, setListMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [listPage, setListPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all-statuses");
  const [typeFilter, setTypeFilter] = useState("all-types");
  const [initialPolicyIdFromUrl, setInitialPolicyIdFromUrl] = useState<string | null>(null);
  // Capture ?openMessage=true ONCE on mount before the URL param is stripped
  const [openMessageOnMount, setOpenMessageOnMount] = useState<boolean>(
    () => searchParams.get("openMessage") === "true",
  );
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEndorsements = useCallback(
    async (page: number, search: string, status: string, type: string) => {
      setListLoading(true);
      setListError(null);
      try {
        const res = await listEndorsements({
          page,
          limit: LIST_LIMIT,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(status !== "all-statuses" ? { status } : {}),
          ...(type !== "all-types" ? { type } : {}),
          ...(isBroker && brokerOrgId ? { brokerId: brokerOrgId } : {}),
        });
        setEndorsements((res.data || []).map(mapListItemToRow));
        setListMeta(res.meta || null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load endorsements";
        setListError(message);
        setEndorsements([]);
        setListMeta(null);
      } finally {
        setListLoading(false);
      }
    },
    [isBroker, brokerOrgId]
  );

  useEffect(() => {
    if (viewMode !== "list") return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const doFetch = () => fetchEndorsements(listPage, searchTerm, statusFilter, typeFilter);
    const delay = searchTerm.trim() ? 300 : 0;
    searchDebounceRef.current = setTimeout(doFetch, delay);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [viewMode, listPage, searchTerm, statusFilter, typeFilter, fetchEndorsements]);

  // URL: ?mode=create&policyId=... — switch to create and pass policyId to form
  // URL: ?endorsementId=...&mode=... or /edit/:id — switch to edit or view
  useEffect(() => {
    const modeFromUrl = searchParams.get("mode");
    const policyId = searchParams.get("policyId");
    const endorsementId = searchParams.get("endorsementId") || routeId;
    const isCreateRoute = pathname.endsWith("/endorsements/create");

    let effectiveMode: any = modeFromUrl;
    if (!effectiveMode && isCreateRoute) {
      effectiveMode = "create";
    } else if (!effectiveMode && routeId) {
      if (pathname.includes("/edit/")) effectiveMode = "edit";
      else if (pathname.includes("/view/")) effectiveMode = "view";
      else effectiveMode = isBroker ? "view" : "edit";
    }

    if (modeFromUrl === "create" || isCreateRoute) {
      setInitialPolicyIdFromUrl(policyId || null);
      setViewMode("create");
      setSelectedEndorsementId(null);
    } else if (endorsementId) {
      setInitialPolicyIdFromUrl(null);
      setViewMode(
        effectiveMode === "edit" || effectiveMode === "view"
          ? effectiveMode
          : isBroker
          ? "view"
          : "edit",
      );
      setSelectedEndorsementId(endorsementId);
      if (searchParams.has("endorsementId") || searchParams.has("mode") || searchParams.has("openMessage")) {
        setSearchParams({}, { replace: true });
      }
    } else {
      setViewMode("list");
      setSelectedEndorsementId(null);
    }
  }, [searchParams, setSearchParams, isBroker, routeId, pathname]);

  const handleCreateNew = () => {
    navigate(`${isBroker ? "/broker" : "/insurer"}/endorsements/create`);
  };

  const handleView = (id: string) => {
    navigate(`${isBroker ? "/broker" : "/insurer"}/endorsements/view/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`${isBroker ? "/broker" : "/insurer"}/endorsements/edit/${id}`);
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedEndorsementId(null);
    const basePath = isBroker ? "/broker/endorsements" : "/insurer/endorsements";
    if (pathname !== basePath) {
      if (key !== "default") {
        navigate(-1);
      } else {
        navigate(basePath);
      }
    }
    fetchEndorsements(listPage, searchTerm, statusFilter, typeFilter);
  };

  const handleCreated = () => {
    setViewMode("list");
    setSelectedEndorsementId(null);
    fetchEndorsements(1, searchTerm, statusFilter, typeFilter);
  };

  const handleStatusUpdated = () => {
    fetchEndorsements(listPage, searchTerm, statusFilter, typeFilter);
  };

  if (viewMode === "list") {
    return (
      <EndorsementList
        endorsements={endorsements}
        listMeta={listMeta}
        listLoading={listLoading}
        listError={listError}
        searchTerm={searchTerm}
        listPage={listPage}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        restrictEditToDraft={isBroker}
        showCreateButton={isBroker}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setListPage(1);
        }}
        onPageChange={setListPage}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setListPage(1);
        }}
        onTypeFilterChange={(val) => {
          setTypeFilter(val);
          setListPage(1);
        }}
        onView={handleView}
        onEdit={handleEdit}
        onCreateNew={handleCreateNew}
      />
    );
  }

  const formMode = viewMode === "create" ? "create" : viewMode === "edit" ? "edit" : "view";
  const initialPolicyId = viewMode === "create" ? initialPolicyIdFromUrl : undefined;

  const shouldOpenMessage = openMessageOnMount;

  return (
    <EndorsementForm
      key={viewMode === "create" ? "create" : selectedEndorsementId ?? "create"}
      mode={formMode}
      endorsementId={selectedEndorsementId}
      initialPolicyId={initialPolicyId}
      endorsements={endorsements}
      onBack={handleBackToList}
      onCreated={handleCreated}
      onStatusUpdated={handleStatusUpdated}
      onViewEndorsement={handleView}
      onEditEndorsement={handleEdit}
      isBroker={isBroker}
      openMessage={shouldOpenMessage}
    />
  );
};

export default InsurerEndorsements;
