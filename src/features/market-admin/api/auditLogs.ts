import { apiGet } from '@/lib/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditLogMetadata {
    apiAction?: string;
    productId?: string;
    fieldCount?: number;
    responseId?: string | null;
    templateId?: string;
    uploadCount?: number;
    currentPageId?: string;
    templateVersionId?: string;
    [key: string]: unknown;
}

export interface AuditLog {
    id: string;
    occurredAt: string;
    actorId: string;
    actorName?: string | null;
    organizationId: string | null;
    productId: string | null;
    actorType: string;          // 'broker' | 'insurer' | 'admin' | etc.
    module: string;             // 'quote' | 'policy' | 'user' | etc.
    action: string;             // 'CREATE' | 'UPDATE' | 'DELETE' | etc.
    targetType: string;         // 'form_response_values' | 'form_responses' | etc.
    targetId: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    diff: Record<string, unknown> | null;
    requestId: string;
    route: string;
    method: string;             // 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    ip: string;
    userAgent: string;
    metadata: AuditLogMetadata;
}

export interface AuditLogsMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface AuditLogsResponse {
    items: AuditLog[];
    meta: AuditLogsMeta;
}

export interface GetAuditLogsParams {
    page?: number;
    limit?: number;
    action?: string;
    module?: string;
    targetType?: string;
    targetId?: string;
    actorId?: string;
    actorIds?: string[];
    userId?: string;
    organizationId?: string;
    organizationIds?: string[];
    productId?: string;
    productIds?: string[];
    requestId?: string;
    q?: string;
    from?: string;
    to?: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function getAuditLogs(params?: GetAuditLogsParams): Promise<AuditLogsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.from) query.set('from', params.from);
    if (params?.to) {
        const toEnd = new Date(params.to);
        toEnd.setUTCHours(23, 59, 59, 999);
        query.set('to', toEnd.toISOString());
    }
    if (params?.module) query.set('module', params.module);
    if (params?.action) query.set('action', params.action);
    if (params?.targetType) query.set('targetType', params.targetType);
    if (params?.targetId) query.set('targetId', params.targetId);
    if (params?.actorId) query.set('actorId', params.actorId);
    if (params?.actorIds?.length) query.set('actorIds', params.actorIds.join(','));
    if (params?.userId) query.set('userId', params.userId);
    if (params?.organizationId) query.set('organizationId', params.organizationId);
    if (params?.organizationIds?.length) query.set('organizationIds', params.organizationIds.join(','));
    if (params?.productId) query.set('productId', params.productId);
    if (params?.productIds?.length) query.set('productIds', params.productIds.join(','));
    if (params?.requestId) query.set('requestId', params.requestId);
    if (params?.q) query.set('q', params.q);

    const qs = query.toString();
    return apiGet<AuditLogsResponse>(`/audit-logs${qs ? `?${qs}` : ''}`);
}
