import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getAuditLogs, type AuditLog } from '../api/auditLogs';
import { formatDateTimeDDMMYYYY } from '@/shared/utils/date-format';
import { Shield, Search, Filter, CalendarX, X, Copy } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import TableSkeleton from '@/components/loaders/TableSkeleton';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useToast } from '@/shared/hooks/use-toast';
import { getBrokerUsers, getUserById } from '@/features/auth/api/users';
import { listBrokersViaManagement, getBroker } from '@/features/brokers/api/brokers';
import { listInsurers, getInsurer } from '@/features/insurers/api/insurers';
import { getAdminDashboardProducts, type MarketAdminProductItem, type MarketAdminProductResponse } from '@/features/market-admin/api/admin';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
    try {
        return formatDateTimeDDMMYYYY(iso);
    } catch {
        return iso;
    }
}

function isoToDateStr(iso: string): string {
    return iso.split('T')[0]; // 'YYYY-MM-DD'
}

type AuditDiffEntry = { from: unknown; to: unknown };
type AuditDiff = Record<string, AuditDiffEntry>;

type LookupOption = { id: string; label: string; hint?: string };

function normalizeForCompare(value: unknown): unknown {
    if (value instanceof Date) {
        return value.toISOString();
    }
    return value;
}

function isEqual(a: unknown, b: unknown): boolean {
    const aa = normalizeForCompare(a);
    const bb = normalizeForCompare(b);
    if (aa === bb) {
        return true;
    }
    try {
        return JSON.stringify(aa) === JSON.stringify(bb);
    } catch {
        return false;
    }
}

function parseAuditDiff(diff: Record<string, unknown> | null | undefined): AuditDiff | null {
    if (!diff) return null;

    const out: AuditDiff = {};
    for (const [key, value] of Object.entries(diff)) {
        if (!value || typeof value !== 'object') continue;
        const v = value as Record<string, unknown>;
        if (!('from' in v) || !('to' in v)) continue;
        out[key] = { from: v.from ?? null, to: v.to ?? null };
    }

    return Object.keys(out).length > 0 ? out : null;
}

function computeAuditDiff(before: Record<string, unknown> | null, after: Record<string, unknown> | null): AuditDiff | null {
    if (!before && !after) {
        return null;
    }

    const b = before ?? {};
    const a = after ?? {};
    const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
    const diff: AuditDiff = {};

    for (const key of keys) {
        const from = b[key] ?? null;
        const to = a[key] ?? null;
        if (!isEqual(from, to)) {
            diff[key] = { from, to };
        }
    }

    return Object.keys(diff).length > 0 ? diff : null;
}

const ACTION_COLORS: Record<string, string> = {
    CREATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    UPDATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    READ: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const METHOD_COLORS: Record<string, string> = {
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    PATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    GET: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const ITEMS_PER_PAGE = 10;

// ---------------------------------------------------------------------------
// Component Helpers
// ---------------------------------------------------------------------------

function NestedValueRenderer({ value }: { value: unknown }) {
    if (value === null || value === undefined) {
        return <span className="text-muted-foreground/50 italic">null</span>;
    }

    if (typeof value !== 'object') {
        const str = String(value);
        // Add a slight font change if it's a UUID just for cleanliness
        if (str.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            return <span className="text-muted-foreground font-mono text-[10px] break-all">{str}</span>;
        }
        return <span className="break-words">{str}</span>;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return <span className="text-muted-foreground italic text-[10px]">empty array</span>;

        return (
            <div className="flex flex-col gap-1.5 w-full mt-1">
                {value.map((item, index) => (
                    <div key={index} className="pl-3 border-l-2 border-primary/30 py-0.5">
                        <NestedValueRenderer value={item} />
                    </div>
                ))}
            </div>
        );
    }

    // It is an object
    const keys = Object.keys(value as object);
    if (keys.length === 0) return <span className="text-muted-foreground italic text-[10px]">empty object</span>;

    const obj = value as Record<string, unknown>;
    const hasLabelAndValue = keys.includes('label') && keys.includes('value');

    return (
        <div className="flex flex-col gap-1 w-full bg-muted/10 p-2 rounded-md border border-muted/50 mt-1">
            {keys.map(k => {
                // To keep it clean for repeated dynamic fields, dim the 'id' if there's a label+value
                if (hasLabelAndValue && k === 'id') return null;

                return (
                    <div key={k} className="flex flex-col sm:flex-row sm:gap-2 items-start">
                        <span className="text-muted-foreground font-semibold min-w-[100px] shrink-0 capitalize text-[10px] mt-0.5 pb-0.5">
                            {k.replace(/_/g, ' ')}:
                        </span>
                        <div className="text-foreground flex-1 break-words">
                            <NestedValueRenderer value={obj[k]} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function DiffDataRenderer({ diff }: { diff: AuditDiff | null }) {
    if (!diff || Object.keys(diff).length === 0) return <p className="text-xs text-muted-foreground italic">No changes</p>;

    return (
        <div className="border rounded-md overflow-hidden bg-background">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="py-2 h-8 text-xs font-semibold w-1/4">Field</TableHead>
                        <TableHead className="py-2 h-8 text-xs font-semibold">From</TableHead>
                        <TableHead className="py-2 h-8 text-xs font-semibold">To</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.entries(diff).map(([key, entry]) => {
                        const fromIsNil = entry.from === null || entry.from === undefined;
                        const toIsNil = entry.to === null || entry.to === undefined;

                        const fromClass = fromIsNil
                            ? 'bg-muted/20 text-muted-foreground border-muted/40'
                            : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-900/30';
                        const toClass = toIsNil
                            ? 'bg-muted/20 text-muted-foreground border-muted/40'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-900/30';

                        return (
                            <TableRow key={key} className="hover:bg-muted/30">
                                <TableCell className="py-3 text-xs font-medium text-muted-foreground align-top w-1/4 uppercase tracking-wider">
                                    {key.replace(/_/g, ' ')}
                                </TableCell>
                                <TableCell className="py-3 text-xs align-top">
                                    <div className={`rounded-md border p-2 ${fromClass}`}>
                                        {fromIsNil ? <span className="italic">null</span> : <NestedValueRenderer value={entry.from} />}
                                    </div>
                                </TableCell>
                                <TableCell className="py-3 text-xs align-top">
                                    <div className={`rounded-md border p-2 ${toClass}`}>
                                        {toIsNil ? <span className="italic">null</span> : <NestedValueRenderer value={entry.to} />}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

function JsonCodeBlock({ data }: { data: unknown }) {
    const text = (() => {
        if (data === null || data === undefined) return 'null';
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            return String(data);
        }
    })();

    return (
        <pre className="text-xs font-mono bg-muted/20 border rounded-md p-3 overflow-auto max-h-[50vh] whitespace-pre-wrap break-words">
            {text}
        </pre>
    );
}


// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketAdminAuditLogs() {
    const { toast } = useToast();
    const { user } = useAuthStore();
    const marketId = user?.marketId ?? '';

    // ── Filter state ───────────────────────────────────────────────────────
    const [queryInput, setQueryInput] = useState('');
    const [queryText, setQueryText] = useState('');
    const [actionFilter, setActionFilter] = useState('All');
    const [moduleFilter, setModuleFilter] = useState('All');
    const [targetTypeFilter, setTargetTypeFilter] = useState('All');
    const [targetIdInput, setTargetIdInput] = useState('');
    const [targetIdFilter, setTargetIdFilter] = useState('');
    const [selectedActorIds, setSelectedActorIds] = useState<string[]>([]);
    const [selectedOrganizationIds, setSelectedOrganizationIds] = useState<string[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [requestIdInput, setRequestIdInput] = useState('');
    const [requestIdFilter, setRequestIdFilter] = useState('');
    const [fromDate, setFromDate] = useState<string | undefined>();
    const [toDate, setToDate] = useState<string | undefined>();
    const [currentPage, setCurrentPage] = useState(1);
    const [userListQuery, setUserListQuery] = useState('');
    const [orgListQuery, setOrgListQuery] = useState('');
    const [productListQuery, setProductListQuery] = useState('');

    // ── Data state ─────────────────────────────────────────────────────────
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [userNameById, setUserNameById] = useState<Record<string, string>>({});
    const [organizationNameById, setOrganizationNameById] = useState<Record<string, string>>({});
    const [productNameById, setProductNameById] = useState<Record<string, string>>({});
    const [productOptions, setProductOptions] = useState<LookupOption[]>([]);
    const [userOptions, setUserOptions] = useState<LookupOption[]>([]);
    const [organizationOptions, setOrganizationOptions] = useState<LookupOption[]>([]);

    const inflightUserIdsRef = useRef<Set<string>>(new Set());
    const inflightOrgIdsRef = useRef<Set<string>>(new Set());

    // ── Dialog state ───────────────────────────────────────────────────────
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const copyToClipboard = useCallback(async (value: string | null | undefined, label: string) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            toast({ title: 'Copied', description: label });
        } catch {
            toast({ title: 'Copy failed', description: label, variant: 'destructive' });
        }
    }, [toast]);

    // ── Fetch ──────────────────────────────────────────────────────────────
    const fetchLogs = useCallback(async (page: number) => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const response = await getAuditLogs({
                page,
                limit: ITEMS_PER_PAGE,
                q: queryText || undefined,
                action: actionFilter !== 'All' ? actionFilter : undefined,
                module: moduleFilter !== 'All' ? moduleFilter : undefined,
                targetType: targetTypeFilter !== 'All' ? targetTypeFilter : undefined,
                targetId: targetIdFilter || undefined,
                actorIds: selectedActorIds.length ? selectedActorIds : undefined,
                organizationIds: selectedOrganizationIds.length ? selectedOrganizationIds : undefined,
                productIds: selectedProductIds.length ? selectedProductIds : undefined,
                requestId: requestIdFilter || undefined,
                from: fromDate || undefined,
                to: toDate || undefined,
            });
            setAuditLogs(response.items ?? []);
            setTotalPages(response.meta?.totalPages ?? 1);
            setTotalItems(response.meta?.total ?? 0);
        } catch (err: unknown) {
            console.error('❌ Failed to fetch audit logs:', err);
            setFetchError(err instanceof Error ? err.message : 'Failed to load audit logs.');
        } finally {
            setIsLoading(false);
        }
    }, [
        queryText,
        actionFilter,
        moduleFilter,
        targetTypeFilter,
        targetIdFilter,
        selectedActorIds,
        selectedOrganizationIds,
        selectedProductIds,
        requestIdFilter,
        fromDate,
        toDate,
    ]);

    useEffect(() => {
        const t = setTimeout(() => {
            setQueryText(queryInput.trim());
            resetPage();
        }, 350);
        return () => clearTimeout(t);
    }, [queryInput]);

    useEffect(() => {
        const t = setTimeout(() => {
            setTargetIdFilter(targetIdInput.trim());
            resetPage();
        }, 350);
        return () => clearTimeout(t);
    }, [targetIdInput]);

    useEffect(() => {
        const t = setTimeout(() => {
            setRequestIdFilter(requestIdInput.trim());
            resetPage();
        }, 350);
        return () => clearTimeout(t);
    }, [requestIdInput]);

    useEffect(() => {
        let cancelled = false;

        const loadProducts = async () => {
            try {
                const payload = await getAdminDashboardProducts();
                if (cancelled) return;

                const items: MarketAdminProductItem[] = Array.isArray(payload)
                    ? payload
                    : (() => {
                        const resp = payload as MarketAdminProductResponse;
                        if (Array.isArray(resp.items)) return resp.items;
                        if (Array.isArray(resp.data)) return resp.data;
                        if (Array.isArray(resp.result)) return resp.result;
                        return [];
                    })();

                const map: Record<string, string> = {};
                const opts: LookupOption[] = items
                    .filter((p) => p?.id && p?.name)
                    .map((p) => {
                        map[String(p.id)] = String(p.name);
                        return { id: String(p.id), label: String(p.name) };
                    })
                    .sort((a, b) => a.label.localeCompare(b.label));

                setProductOptions(opts);
                setProductNameById((prev) => ({ ...map, ...prev }));
            } catch {
                if (!cancelled) {
                    setProductOptions([]);
                }
            }
        };

        loadProducts();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const loadUsers = async () => {
            try {
                const all: LookupOption[] = [];
                const map: Record<string, string> = {};
                let page = 1;
                const limit = 100;
                let totalPages = 1;

                while (!cancelled && page <= totalPages && page <= 50) {
                    const resp = await getBrokerUsers({ page, limit, search: '' });
                    totalPages = Math.max(1, Math.ceil((resp.total ?? 0) / limit));
                    resp.items.forEach((u) => {
                        const id = String(u.id);
                        const label = u.name?.trim()
                            ? u.name.trim()
                            : u.email?.trim()
                                ? u.email.trim()
                                : id;
                        const hint = u.email?.trim() && label !== u.email.trim() ? u.email.trim() : undefined;
                        map[id] = label;
                        all.push({ id, label, hint });
                    });
                    page += 1;
                }

                if (!cancelled) {
                    const unique = Array.from(new Map(all.map((o) => [o.id, o])).values()).sort((a, b) => a.label.localeCompare(b.label));
                    setUserOptions(unique);
                    setUserNameById((prev) => ({ ...map, ...prev }));
                }
            } catch {
                if (!cancelled) {
                    setUserOptions([]);
                }
            }
        };

        const loadOrganizations = async () => {
            if (!marketId) return;
            try {
                const all: LookupOption[] = [];
                const map: Record<string, string> = {};

                let brokerPage = 1;
                let brokerTotalPages = 1;
                const limit = 100;
                while (!cancelled && brokerPage <= brokerTotalPages && brokerPage <= 50) {
                    const resp = await listBrokersViaManagement(marketId, { page: brokerPage, limit, search: '' });
                    brokerTotalPages = Number(resp.meta?.totalPages ?? 1);
                    resp.data.forEach((b) => {
                        const id = String(b.id);
                        const label = String(b.name ?? '').trim();
                        if (!id || !label) return;
                        map[id] = label;
                        all.push({ id, label, hint: 'Broker' });
                    });
                    brokerPage += 1;
                }

                let insurerPage = 1;
                let insurerTotalPages = 1;
                while (!cancelled && insurerPage <= insurerTotalPages && insurerPage <= 50) {
                    const resp = await listInsurers({ page: insurerPage, limit, search: '' });
                    insurerTotalPages = Number(resp.meta?.totalPages ?? 1);
                    resp.data.forEach((i) => {
                        const id = String(i.id);
                        const label = String(i.name ?? '').trim();
                        if (!id || !label) return;
                        map[id] = label;
                        all.push({ id, label, hint: 'Insurer' });
                    });
                    insurerPage += 1;
                }

                if (!cancelled) {
                    const unique = Array.from(new Map(all.map((o) => [o.id, o])).values()).sort((a, b) => a.label.localeCompare(b.label));
                    setOrganizationOptions(unique);
                    setOrganizationNameById((prev) => ({ ...map, ...prev }));
                }
            } catch {
                if (!cancelled) {
                    setOrganizationOptions([]);
                }
            }
        };

        loadUsers();
        loadOrganizations();

        return () => {
            cancelled = true;
        };
    }, [marketId]);

    useEffect(() => {
        let cancelled = false;

        const resolveLookups = async () => {
            const actorOrgIdByActorId: Record<string, string> = {};
            auditLogs.forEach((l) => {
                if (l.actorId && l.organizationId && !actorOrgIdByActorId[l.actorId]) {
                    actorOrgIdByActorId[l.actorId] = l.organizationId;
                }
            });

            const actorIds = Array.from(new Set(auditLogs.map((l) => l.actorId).filter(Boolean))) as string[];
            const orgIds = Array.from(new Set(auditLogs.map((l) => l.organizationId).filter(Boolean))) as string[];

            const missingActorIds = actorIds.filter((id) => !userNameById[id] && !inflightUserIdsRef.current.has(id));
            const missingOrgIds = orgIds.filter((id) => !organizationNameById[id] && !inflightOrgIdsRef.current.has(id));

            missingActorIds.forEach((id) => inflightUserIdsRef.current.add(id));
            missingOrgIds.forEach((id) => inflightOrgIdsRef.current.add(id));

            await Promise.all([
                ...missingActorIds.map(async (id) => {
                    try {
                        const data = await getUserById(id, actorOrgIdByActorId[id] ?? undefined);
                        if (cancelled) return;
                        const label = data.name?.trim() ? data.name.trim() : data.email?.trim() ? data.email.trim() : id;
                        setUserNameById((prev) => (prev[id] ? prev : { ...prev, [id]: label }));
                    } catch {
                        try {
                            const data = await getUserById(id, undefined);
                            if (cancelled) return;
                            const label = data.name?.trim() ? data.name.trim() : data.email?.trim() ? data.email.trim() : id;
                            setUserNameById((prev) => (prev[id] ? prev : { ...prev, [id]: label }));
                        } catch {
                            if (!cancelled) {
                                setUserNameById((prev) => (prev[id] ? prev : { ...prev, [id]: id }));
                            }
                        }
                    } finally {
                        inflightUserIdsRef.current.delete(id);
                    }
                }),
                ...missingOrgIds.map(async (id) => {
                    try {
                        const broker = await getBroker(id);
                        if (cancelled) return;
                        const label = broker.name?.trim() ? broker.name.trim() : id;
                        setOrganizationNameById((prev) => (prev[id] ? prev : { ...prev, [id]: label }));
                    } catch {
                        try {
                            const insurer = await getInsurer(id);
                            if (cancelled) return;
                            const label = insurer.name?.trim() ? insurer.name.trim() : id;
                            setOrganizationNameById((prev) => (prev[id] ? prev : { ...prev, [id]: label }));
                        } catch {
                            if (!cancelled) {
                                setOrganizationNameById((prev) => (prev[id] ? prev : { ...prev, [id]: id }));
                            }
                        } finally {
                            inflightOrgIdsRef.current.delete(id);
                        }
                    }
                }),
            ]);
        };

        if (auditLogs.length > 0) {
            resolveLookups();
        }

        return () => {
            cancelled = true;
        };
    }, [auditLogs, userNameById, organizationNameById]);

    // Re-fetch when filters or page changes
    useEffect(() => {
        fetchLogs(currentPage);
    }, [fetchLogs, currentPage]);

    // Reset to page 1 when filters change
    const resetPage = () => setCurrentPage(1);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // ── Derived display values ─────────────────────────────────────────────
    const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endEntry = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    // ── Client-side filter for date range (fallback if API doesn't support it)
    const displayedLogs = auditLogs.filter((log) => {
        if (!fromDate && !toDate) return true;
        const logDate = isoToDateStr(log.occurredAt);
        if (fromDate && logDate < fromDate) return false;
        if (toDate && logDate > toDate) return false;
        return true;
    });

    const availableModules = Array.from(new Set(auditLogs.map((l) => l.module).filter(Boolean))).sort();
    const availableTargetTypes = Array.from(new Set(auditLogs.map((l) => l.targetType).filter(Boolean))).sort();

    const tableOrganizationLabel = (log: AuditLog): string => {
        if (!log.organizationId) return 'N/A';
        return organizationNameById[log.organizationId] ?? log.organizationId;
    };

    const tableUserLabel = (log: AuditLog): string => {
        if (log.actorName && String(log.actorName).trim().length > 0) {
            return String(log.actorName).trim();
        }
        if (!log.actorId) {
            return log.actorType === 'system' ? 'System' : 'Unknown user';
        }
        return userNameById[log.actorId] ?? 'Unknown user';
    };

    const tableProductLabel = (log: AuditLog): string => {
        if (!log.productId) return 'N/A';
        return productNameById[log.productId] ?? log.productId;
    };

    const filteredUserOptions = useMemo(() => {
        const q = userListQuery.trim().toLowerCase();
        if (!q) return userOptions;
        return userOptions.filter((o) => o.label.toLowerCase().includes(q) || (o.hint?.toLowerCase().includes(q) ?? false));
    }, [userListQuery, userOptions]);

    const filteredOrganizationOptions = useMemo(() => {
        const q = orgListQuery.trim().toLowerCase();
        if (!q) return organizationOptions;
        return organizationOptions.filter((o) => o.label.toLowerCase().includes(q) || (o.hint?.toLowerCase().includes(q) ?? false));
    }, [orgListQuery, organizationOptions]);

    const filteredProductOptions = useMemo(() => {
        const q = productListQuery.trim().toLowerCase();
        if (!q) return productOptions;
        return productOptions.filter((o) => o.label.toLowerCase().includes(q));
    }, [productListQuery, productOptions]);

    const activeFilterChips = useMemo(() => {
        const chips: Array<{ key: string; label: string; onClear: () => void }> = [];

        if (actionFilter !== 'All') chips.push({ key: 'action', label: `Action: ${actionFilter}`, onClear: () => setActionFilter('All') });
        if (moduleFilter !== 'All') chips.push({ key: 'module', label: `Module: ${moduleFilter}`, onClear: () => setModuleFilter('All') });
        if (targetTypeFilter !== 'All') chips.push({ key: 'targetType', label: `Target Type: ${targetTypeFilter}`, onClear: () => setTargetTypeFilter('All') });
        if (targetIdFilter) chips.push({ key: 'targetId', label: `Target ID: ${targetIdFilter}`, onClear: () => { setTargetIdInput(''); setTargetIdFilter(''); } });
        if (requestIdFilter) chips.push({ key: 'requestId', label: `Request ID: ${requestIdFilter}`, onClear: () => { setRequestIdInput(''); setRequestIdFilter(''); } });
        if (fromDate || toDate) chips.push({ key: 'date', label: `Date: ${fromDate ?? '…'} → ${toDate ?? '…'}`, onClear: () => { setFromDate(undefined); setToDate(undefined); } });
        if (selectedActorIds.length) chips.push({ key: 'actors', label: `Users: ${selectedActorIds.length}`, onClear: () => setSelectedActorIds([]) });
        if (selectedOrganizationIds.length) chips.push({ key: 'orgs', label: `Organizations: ${selectedOrganizationIds.length}`, onClear: () => setSelectedOrganizationIds([]) });
        if (selectedProductIds.length) chips.push({ key: 'products', label: `Products: ${selectedProductIds.length}`, onClear: () => setSelectedProductIds([]) });
        if (queryText) chips.push({ key: 'q', label: `Search: ${queryText}`, onClear: () => { setQueryInput(''); setQueryText(''); } });

        return chips;
    }, [
        actionFilter,
        moduleFilter,
        targetTypeFilter,
        targetIdFilter,
        requestIdFilter,
        fromDate,
        toDate,
        selectedActorIds.length,
        selectedOrganizationIds.length,
        selectedProductIds.length,
        queryText,
    ]);

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="h-full bg-gradient-to-br from-background to-secondary/20 flex flex-col overflow-hidden">
            <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-full space-y-6">
                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-foreground mb-2">Audit Logs</h1>
                            <p className="text-lg text-muted-foreground">
                                Monitor system activities and user actions across the platform.
                            </p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                System Audit Logs
                            </CardTitle>
                            <CardDescription>
                                Review detailed security, authentication, and user events
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Filters Bar */}
                            <div className="bg-muted/40 border rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                {/* Search */}
                                <div className="relative flex-1 w-full sm:min-w-[300px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search (route/module/target/metadata)..."
                                        className="w-full pl-9 bg-background"
                                        value={queryInput}
                                        onChange={(e) => setQueryInput(e.target.value)}
                                    />
                                    {queryInput.trim().length > 0 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                            onClick={() => {
                                                setQueryInput('');
                                                setQueryText('');
                                                resetPage();
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                                    {/* Action Filter */}
                                    <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); resetPage(); }}>
                                        <SelectTrigger className="w-[150px] bg-background">
                                            <SelectValue placeholder="All Actions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Actions</SelectItem>
                                            <SelectItem value="CREATE">CREATE</SelectItem>
                                            <SelectItem value="UPDATE">UPDATE</SelectItem>
                                            <SelectItem value="DELETE">DELETE</SelectItem>
                                            <SelectItem value="READ">READ</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); resetPage(); }}>
                                        <SelectTrigger className="w-[160px] bg-background">
                                            <SelectValue placeholder="All Modules" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Modules</SelectItem>
                                            {availableModules.map((m) => (
                                                <SelectItem key={m} value={m}>
                                                    {m}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Date Range Popover */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="flex items-center gap-2 bg-background">
                                                <Filter className="h-4 w-4" /> Date Range
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80" align="end">
                                            <div className="space-y-4">
                                                <h4 className="font-medium leading-none">Filter by Date Range</h4>
                                                <div className="grid gap-2">
                                                    <div className="grid items-center gap-2">
                                                        <label htmlFor="fromDate" className="text-xs text-muted-foreground">From Date</label>
                                                        <DatePicker
                                                            id="fromDate"
                                                            value={fromDate}
                                                            onChange={(val) => { setFromDate(val); resetPage(); }}
                                                            max={toDate}
                                                            placeholder="Select start date"
                                                        />
                                                    </div>
                                                    <div className="grid items-center gap-2">
                                                        <label htmlFor="toDate" className="text-xs text-muted-foreground">To Date</label>
                                                        <DatePicker
                                                            id="toDate"
                                                            value={toDate}
                                                            onChange={(val) => { setToDate(val); resetPage(); }}
                                                            min={fromDate}
                                                            placeholder="Select end date"
                                                        />
                                                    </div>
                                                    {(fromDate || toDate) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => { setFromDate(undefined); setToDate(undefined); resetPage(); }}
                                                            className="text-xs w-full bg-muted/50 mt-1"
                                                        >
                                                            <CalendarX className="h-4 w-4 mr-2" />
                                                            Clear Dates
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="flex items-center gap-2 bg-background">
                                                <Filter className="h-4 w-4" /> More Filters
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[420px]" align="end">
                                            <div className="space-y-4">
                                                <h4 className="font-medium leading-none">Advanced Filters</h4>
                                                <Accordion type="multiple" className="w-full border rounded-md">
                                                    <AccordionItem value="users">
                                                        <AccordionTrigger className="px-4">Users</AccordionTrigger>
                                                        <AccordionContent className="px-4">
                                                            <div className="flex items-center gap-2 py-3">
                                                                <Input
                                                                    value={userListQuery}
                                                                    onChange={(e) => setUserListQuery(e.target.value)}
                                                                    placeholder="Filter users"
                                                                    className="bg-background"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="whitespace-nowrap"
                                                                    onClick={() => {
                                                                        const ids = filteredUserOptions.map((o) => o.id);
                                                                        setSelectedActorIds(Array.from(new Set([...selectedActorIds, ...ids])));
                                                                        resetPage();
                                                                    }}
                                                                    disabled={filteredUserOptions.length === 0}
                                                                >
                                                                    Select All
                                                                </Button>
                                                            </div>
                                                            <ScrollArea className="h-56 pr-3">
                                                                <div className="space-y-2">
                                                                    {filteredUserOptions.length === 0 ? (
                                                                        <div className="text-xs text-muted-foreground">No users available</div>
                                                                    ) : (
                                                                        filteredUserOptions.map((opt) => {
                                                                            const checked = selectedActorIds.includes(opt.id);
                                                                            return (
                                                                                <button
                                                                                    key={opt.id}
                                                                                    type="button"
                                                                                    className="w-full flex items-start gap-2 text-left p-2 rounded-md hover:bg-muted/40"
                                                                                    onClick={() => {
                                                                                        setSelectedActorIds((prev) => (
                                                                                            prev.includes(opt.id)
                                                                                                ? prev.filter((id) => id !== opt.id)
                                                                                                : [...prev, opt.id]
                                                                                        ));
                                                                                        resetPage();
                                                                                    }}
                                                                                >
                                                                                    <Checkbox checked={checked} className="mt-0.5 pointer-events-none" />
                                                                                    <div className="flex-1">
                                                                                        <div className="text-xs font-medium">{opt.label}</div>
                                                                                        {opt.hint ? <div className="text-[10px] text-muted-foreground">{opt.hint}</div> : null}
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })
                                                                    )}
                                                                </div>
                                                            </ScrollArea>
                                                            {selectedActorIds.length > 0 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="w-full bg-muted/50 mt-2"
                                                                    onClick={() => {
                                                                        setSelectedActorIds([]);
                                                                        resetPage();
                                                                    }}
                                                                >
                                                                    Clear Users
                                                                </Button>
                                                            )}
                                                        </AccordionContent>
                                                    </AccordionItem>

                                                    <AccordionItem value="organizations">
                                                        <AccordionTrigger className="px-4">Organizations</AccordionTrigger>
                                                        <AccordionContent className="px-4">
                                                            <div className="flex items-center gap-2 py-3">
                                                                <Input
                                                                    value={orgListQuery}
                                                                    onChange={(e) => setOrgListQuery(e.target.value)}
                                                                    placeholder="Filter organizations"
                                                                    className="bg-background"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="whitespace-nowrap"
                                                                    onClick={() => {
                                                                        const ids = filteredOrganizationOptions.map((o) => o.id);
                                                                        setSelectedOrganizationIds(Array.from(new Set([...selectedOrganizationIds, ...ids])));
                                                                        resetPage();
                                                                    }}
                                                                    disabled={filteredOrganizationOptions.length === 0}
                                                                >
                                                                    Select All
                                                                </Button>
                                                            </div>
                                                            <ScrollArea className="h-56 pr-3">
                                                                <div className="space-y-2">
                                                                    {filteredOrganizationOptions.length === 0 ? (
                                                                        <div className="text-xs text-muted-foreground">No organizations available</div>
                                                                    ) : (
                                                                        filteredOrganizationOptions.map((opt) => {
                                                                            const checked = selectedOrganizationIds.includes(opt.id);
                                                                            return (
                                                                                <button
                                                                                    key={opt.id}
                                                                                    type="button"
                                                                                    className="w-full flex items-start gap-2 text-left p-2 rounded-md hover:bg-muted/40"
                                                                                    onClick={() => {
                                                                                        setSelectedOrganizationIds((prev) => (
                                                                                            prev.includes(opt.id)
                                                                                                ? prev.filter((id) => id !== opt.id)
                                                                                                : [...prev, opt.id]
                                                                                        ));
                                                                                        resetPage();
                                                                                    }}
                                                                                >
                                                                                    <Checkbox checked={checked} className="mt-0.5 pointer-events-none" />
                                                                                    <div className="flex-1">
                                                                                        <div className="text-xs font-medium">{opt.label}</div>
                                                                                        {opt.hint ? <div className="text-[10px] text-muted-foreground">{opt.hint}</div> : null}
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })
                                                                    )}
                                                                </div>
                                                            </ScrollArea>
                                                            {selectedOrganizationIds.length > 0 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="w-full bg-muted/50 mt-2"
                                                                    onClick={() => {
                                                                        setSelectedOrganizationIds([]);
                                                                        resetPage();
                                                                    }}
                                                                >
                                                                    Clear Organizations
                                                                </Button>
                                                            )}
                                                        </AccordionContent>
                                                    </AccordionItem>

                                                    <AccordionItem value="products">
                                                        <AccordionTrigger className="px-4">Products</AccordionTrigger>
                                                        <AccordionContent className="px-4">
                                                            <div className="flex items-center gap-2 py-3">
                                                                <Input
                                                                    value={productListQuery}
                                                                    onChange={(e) => setProductListQuery(e.target.value)}
                                                                    placeholder="Filter products"
                                                                    className="bg-background"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="whitespace-nowrap"
                                                                    onClick={() => {
                                                                        const ids = filteredProductOptions.map((o) => o.id);
                                                                        setSelectedProductIds(Array.from(new Set([...selectedProductIds, ...ids])));
                                                                        resetPage();
                                                                    }}
                                                                    disabled={filteredProductOptions.length === 0}
                                                                >
                                                                    Select All
                                                                </Button>
                                                            </div>
                                                            <ScrollArea className="h-56 pr-3">
                                                                <div className="space-y-2">
                                                                    {filteredProductOptions.length === 0 ? (
                                                                        <div className="text-xs text-muted-foreground">No products available</div>
                                                                    ) : (
                                                                        filteredProductOptions.map((opt) => {
                                                                            const checked = selectedProductIds.includes(opt.id);
                                                                            return (
                                                                                <button
                                                                                    key={opt.id}
                                                                                    type="button"
                                                                                    className="w-full flex items-start gap-2 text-left p-2 rounded-md hover:bg-muted/40"
                                                                                    onClick={() => {
                                                                                        setSelectedProductIds((prev) => (
                                                                                            prev.includes(opt.id)
                                                                                                ? prev.filter((id) => id !== opt.id)
                                                                                                : [...prev, opt.id]
                                                                                        ));
                                                                                        resetPage();
                                                                                    }}
                                                                                >
                                                                                    <Checkbox checked={checked} className="mt-0.5 pointer-events-none" />
                                                                                    <div className="flex-1">
                                                                                        <div className="text-xs font-medium">{opt.label}</div>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })
                                                                    )}
                                                                </div>
                                                            </ScrollArea>
                                                            {selectedProductIds.length > 0 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="w-full bg-muted/50 mt-2"
                                                                    onClick={() => {
                                                                        setSelectedProductIds([]);
                                                                        resetPage();
                                                                    }}
                                                                >
                                                                    Clear Products
                                                                </Button>
                                                            )}
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-muted-foreground">Target Type</label>
                                                        <Select value={targetTypeFilter} onValueChange={(v) => { setTargetTypeFilter(v); resetPage(); }}>
                                                            <SelectTrigger className="bg-background">
                                                                <SelectValue placeholder="All Target Types" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="All">All Target Types</SelectItem>
                                                                {availableTargetTypes.map((t) => (
                                                                    <SelectItem key={t} value={t}>
                                                                        {t}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-muted-foreground">Target ID</label>
                                                        <Input
                                                            value={targetIdInput}
                                                            onChange={(e) => setTargetIdInput(e.target.value)}
                                                            placeholder="Target ID"
                                                            className="bg-background"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-muted-foreground">Request ID</label>
                                                        <Input
                                                            value={requestIdInput}
                                                            onChange={(e) => setRequestIdInput(e.target.value)}
                                                            placeholder="Request UUID"
                                                            className="bg-background"
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full bg-muted/50"
                                                    onClick={() => {
                                                        setTargetTypeFilter('All');
                                                        setTargetIdInput('');
                                                        setTargetIdFilter('');
                                                        setSelectedActorIds([]);
                                                        setSelectedOrganizationIds([]);
                                                        setSelectedProductIds([]);
                                                        setRequestIdInput('');
                                                        setRequestIdFilter('');
                                                        setUserListQuery('');
                                                        setOrgListQuery('');
                                                        setProductListQuery('');
                                                        resetPage();
                                                    }}
                                                >
                                                    Clear Advanced Filters
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {activeFilterChips.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {activeFilterChips.map((chip) => (
                                        <Badge key={chip.key} variant="secondary" className="flex items-center gap-1.5 pr-1">
                                            <span className="text-xs">{chip.label}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => {
                                                    chip.onClear();
                                                    resetPage();
                                                }}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </Badge>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="bg-muted/50"
                                        onClick={() => {
                                            setQueryInput('');
                                            setQueryText('');
                                            setActionFilter('All');
                                            setModuleFilter('All');
                                            setTargetTypeFilter('All');
                                            setTargetIdInput('');
                                            setTargetIdFilter('');
                                            setSelectedActorIds([]);
                                            setSelectedOrganizationIds([]);
                                            setSelectedProductIds([]);
                                            setRequestIdInput('');
                                            setRequestIdFilter('');
                                            setFromDate(undefined);
                                            setToDate(undefined);
                                            setUserListQuery('');
                                            setOrgListQuery('');
                                            setProductListQuery('');
                                            resetPage();
                                        }}
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            )}

                            {/* Table */}
                            <div className="border rounded-lg overflow-auto max-h-[60vh]">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10 bg-muted/50">
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="whitespace-nowrap bg-transparent">Occurred At</TableHead>
                                            <TableHead className="bg-transparent">User Name</TableHead>
                                            <TableHead className="bg-transparent">Organization</TableHead>
                                            <TableHead className="bg-transparent">Module</TableHead>
                                            <TableHead className="bg-transparent">Event</TableHead>
                                            <TableHead className="bg-transparent">Target</TableHead>
                                            <TableHead className="bg-transparent">IP</TableHead>
                                            <TableHead className="w-28 text-center bg-transparent">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableSkeleton rows={8} cols={8} />
                                        ) : fetchError ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-24 text-center text-destructive">
                                                    {fetchError}
                                                </TableCell>
                                            </TableRow>
                                        ) : displayedLogs.length > 0 ? (
                                            displayedLogs.map((log) => (
                                                <TableRow
                                                    key={log.id}
                                                    className="cursor-pointer hover:bg-muted/40"
                                                    onClick={() => { setSelectedLog(log); setIsDialogOpen(true); }}
                                                >
                                                    {/* Occurred At */}
                                                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                                                        {formatDateTime(log.occurredAt)}
                                                    </TableCell>

                                                    <TableCell className="text-xs">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-foreground truncate max-w-[220px]">
                                                                    {tableUserLabel(log)}
                                                                </span>
                                                                <Badge variant="outline" className="capitalize text-[10px] py-0.5">
                                                                    {log.actorType}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-xs text-muted-foreground">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-foreground truncate max-w-[220px]">
                                                                {tableOrganizationLabel(log)}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Module */}
                                                    <TableCell className="capitalize text-sm text-muted-foreground">
                                                        {log.module}
                                                    </TableCell>

                                                    {/* Action */}
                                                    <TableCell>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground'}`}>
                                                            {log.action}
                                                        </span>
                                                    </TableCell>

                                                    {/* Target */}
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-foreground">{log.targetType}</span>
                                                        </div>
                                                    </TableCell>

                                                    {/* IP */}
                                                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                        {log.ip}
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell className="text-center">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs h-7 px-2.5"
                                                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); setIsDialogOpen(true); }}
                                                        >
                                                            View Details
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                    No audit logs found matching your criteria.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination footer */}
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div>
                                    {totalItems === 0
                                        ? 'No entries'
                                        : `Showing ${startEntry}–${endEntry} of ${totalItems} entries`}
                                </div>
                                {totalPages > 1 && (
                                    <Pagination className="w-auto mx-0">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>
                                            {[...Array(totalPages)].map((_, i) => {
                                                const page = i + 1;
                                                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                                    return (
                                                        <PaginationItem key={page}>
                                                            <PaginationLink
                                                                href="#"
                                                                isActive={page === currentPage}
                                                                onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                    return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>;
                                                }
                                                return null;
                                            })}
                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto w-[90vw]">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>Full details of the recorded system event.</DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="pt-2 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="capitalize">{selectedLog.actorType}</Badge>
                                <Badge variant="secondary" className="capitalize">{selectedLog.module}</Badge>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${ACTION_COLORS[selectedLog.action] ?? 'bg-muted text-muted-foreground'}`}>
                                    {selectedLog.action}
                                </span>
                                <Badge variant="outline" className="font-mono text-xs">{selectedLog.method}</Badge>
                                <Badge variant="outline" className="font-mono text-xs">{selectedLog.route}</Badge>
                                {selectedLog.requestId && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => copyToClipboard(selectedLog.requestId, 'Request ID')}
                                    >
                                        <Copy className="h-3.5 w-3.5 mr-2" /> Copy Request ID
                                    </Button>
                                )}
                            </div>

                            <Tabs defaultValue="human">
                                <TabsList className="w-full justify-start">
                                    <TabsTrigger value="human">Human</TabsTrigger>
                                    <TabsTrigger value="technical">Technical</TabsTrigger>
                                </TabsList>

                                <TabsContent value="human">
                                    <div className="space-y-5 text-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">Occurred At</span>
                                                <p className="font-medium">{formatDateTime(selectedLog.occurredAt)}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">Request ID</span>
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-mono text-xs break-all">{selectedLog.requestId}</p>
                                                    {selectedLog.requestId && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => copyToClipboard(selectedLog.requestId, 'Request ID')}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">User</span>
                                                {selectedLog.actorId ? (
                                                    <div className="flex flex-col">
                                                        <p className="font-medium break-words">{userNameById[selectedLog.actorId] ?? selectedLog.actorId}</p>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-mono text-xs text-muted-foreground break-all">{selectedLog.actorId}</p>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => copyToClipboard(selectedLog.actorId, 'User ID')}
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="italic text-xs text-muted-foreground">N/A</p>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">Actor Type</span>
                                                <Badge variant="outline" className="capitalize">{selectedLog.actorType}</Badge>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">Organization</span>
                                                {selectedLog.organizationId ? (
                                                    <div className="flex flex-col">
                                                        <p className="font-medium break-words">{organizationNameById[selectedLog.organizationId] ?? selectedLog.organizationId}</p>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-mono text-xs text-muted-foreground break-all">{selectedLog.organizationId}</p>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => copyToClipboard(selectedLog.organizationId, 'Organization ID')}
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="italic text-xs text-muted-foreground">N/A</p>
                                                )}
                                            </div>

                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">Module</span>
                                                <p className="capitalize font-medium">{selectedLog.module}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">Action</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${ACTION_COLORS[selectedLog.action] ?? 'bg-muted text-muted-foreground'}`}>
                                                    {selectedLog.action}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">Target Type</span>
                                                <p className="font-medium">{selectedLog.targetType}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">Target ID</span>
                                                {selectedLog.targetId ? (
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="font-mono text-xs break-all">{selectedLog.targetId}</p>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => copyToClipboard(selectedLog.targetId, 'Target ID')}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <p className="italic text-xs text-muted-foreground">None</p>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">Route</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${METHOD_COLORS[selectedLog.method] ?? 'bg-muted text-muted-foreground'}`}>
                                                        {selectedLog.method}
                                                    </span>
                                                    <span className="font-mono text-xs">{selectedLog.route}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">IP Address</span>
                                                <p className="font-mono text-xs">{selectedLog.ip}</p>
                                            </div>
                                        </div>

                                        {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-2">Metadata</span>
                                                <div className="bg-muted/30 border rounded-md p-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                                    {Object.entries(selectedLog.metadata).map(([key, val]) => (
                                                        val != null && (
                                                            <div key={key}>
                                                                <span className="text-muted-foreground">{key}:</span>{' '}
                                                                <span className="font-medium">{String(val)}</span>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(selectedLog.before || selectedLog.after) && (
                                            <div>
                                                <span className="text-sm font-semibold text-foreground block mb-2">Changes</span>
                                                <DiffDataRenderer diff={parseAuditDiff(selectedLog.diff) ?? computeAuditDiff(selectedLog.before, selectedLog.after)} />
                                            </div>
                                        )}

                                        <div>
                                            <span className="text-xs text-muted-foreground block mb-1">User Agent</span>
                                            <p className="text-xs text-muted-foreground break-all">{selectedLog.userAgent}</p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="technical">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                                            <div className="border rounded-md p-3 bg-muted/10">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-muted-foreground">Request ID</span>
                                                    <span className="font-mono break-all">{selectedLog.requestId ?? 'null'}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 mt-2">
                                                    <span className="text-muted-foreground">Method</span>
                                                    <span className="font-mono">{selectedLog.method ?? 'null'}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 mt-2">
                                                    <span className="text-muted-foreground">Route</span>
                                                    <span className="font-mono break-all">{selectedLog.route ?? 'null'}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 mt-2">
                                                    <span className="text-muted-foreground">IP</span>
                                                    <span className="font-mono">{selectedLog.ip ?? 'null'}</span>
                                                </div>
                                            </div>

                                            <div className="border rounded-md p-3 bg-muted/10">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-muted-foreground">Actor ID</span>
                                                    <span className="font-mono break-all">{selectedLog.actorId ?? 'null'}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 mt-2">
                                                    <span className="text-muted-foreground">Organization ID</span>
                                                    <span className="font-mono break-all">{selectedLog.organizationId ?? 'null'}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 mt-2">
                                                    <span className="text-muted-foreground">Product ID</span>
                                                    <span className="font-mono break-all">{selectedLog.productId ?? 'null'}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 mt-2">
                                                    <span className="text-muted-foreground">Target</span>
                                                    <span className="font-mono break-all">{`${selectedLog.targetType ?? 'null'}:${selectedLog.targetId ?? 'null'}`}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Accordion type="multiple" className="w-full border rounded-md">
                                            <AccordionItem value="metadata">
                                                <AccordionTrigger className="px-4">Metadata</AccordionTrigger>
                                                <AccordionContent className="px-4">
                                                    <JsonCodeBlock data={selectedLog.metadata} />
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="diff">
                                                <AccordionTrigger className="px-4">Diff</AccordionTrigger>
                                                <AccordionContent className="px-4">
                                                    <JsonCodeBlock data={selectedLog.diff} />
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="before">
                                                <AccordionTrigger className="px-4">Before</AccordionTrigger>
                                                <AccordionContent className="px-4">
                                                    <JsonCodeBlock data={selectedLog.before} />
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="after">
                                                <AccordionTrigger className="px-4">After</AccordionTrigger>
                                                <AccordionContent className="px-4">
                                                    <JsonCodeBlock data={selectedLog.after} />
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="raw">
                                                <AccordionTrigger className="px-4">Raw Log</AccordionTrigger>
                                                <AccordionContent className="px-4">
                                                    <JsonCodeBlock data={selectedLog} />
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
