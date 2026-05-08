import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, ChevronRight } from 'lucide-react';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '@/shared/utils/date-format';
import { TemplatePages } from '@/features/quotes/components/QuoteDetailsV2/TemplatePages';
import type { ProposalBundleResponseV2 } from '@/features/quotes/api/quotes';

interface PreviewField {
    id: string | undefined;
    label: string;
    name: string;
    type?: string;
    metadata?: any;
    value: unknown;
}

interface PreviewSection {
    id: string | undefined;
    title: string;
    fields: PreviewField[];
}

interface PreviewPage {
    id: string | undefined;
    title: string;
    sections: PreviewSection[];
}

export interface AdditionalDeclarationDocPreview {
    id: string | number;
    title: string;
    fileUrl?: string;
    fileName?: string;
}

interface PreviewDocument {
    id: string | number;
    displayLabel?: string;
    name: string;
    status: 'pending' | 'uploaded' | string;
    fileUrl?: string;
    fileName?: string;
    uploadedFileId?: string | number;
    aiValidationResult?: {
        is_valid_document: boolean;
        description_message: string;
    };
}

interface ProposalPreviewDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    previewSections: PreviewPage[];
    templatePreviewResponse?: ProposalBundleResponseV2;
    productId?: string;
    declarationDocuments: PreviewDocument[];
    underwritingDocuments: PreviewDocument[];
    policyIssuanceDocuments?: PreviewDocument[];
    additionalDeclarationDocuments?: AdditionalDeclarationDocPreview[];
    currency?: string;
    title?: string;
    footer?: React.ReactNode;
}

// ─── Helper: clickable file / URL link ───────────────────────────────────────
const FileLink: React.FC<{ val: File | string; name?: string }> = ({ val, name }) => {
    const isFile = val instanceof File;
    const fileName = isFile ? val.name : (name || 'View Document');
    return (
        <button
            type="button"
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 hover:underline font-medium text-left transition-colors"
            onClick={() => {
                const href = isFile ? URL.createObjectURL(val as File) : (val as string);
                window.open(href, '_blank');
            }}
        >
            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate text-sm">{fileName}</span>
        </button>
    );
};

// ─── Helper: key → readable label ────────────────────────────────────────────
function toReadableLabel(key: string): string {
    const readable = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .trim();
    return readable.charAt(0).toUpperCase() + readable.slice(1);
}

function formatTimeDisplay(value: string): string | null {
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
    if (!match) return null;

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return null;
    }

    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

function hasCompletedUpload(doc?: PreviewDocument | null): boolean {
    if (!doc) return false;
    if (String(doc.status).toLowerCase() === 'uploaded') return true;
    if (typeof doc.fileUrl === 'string' && doc.fileUrl.trim() !== '') return true;
    if (typeof doc.fileName === 'string' && doc.fileName.trim() !== '') return true;
    if (doc.uploadedFileId != null) return true;
    if (doc.aiValidationResult != null) return true;
    return false;
}

function getConsentLabelMap(meta?: any): Record<string, string> {
    const docs = Array.isArray(meta?.consentDocuments) ? meta.consentDocuments : [];
    return Object.fromEntries(
        docs
            .filter((item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
            .map((item) => [
                String(item.id ?? ''),
                typeof item.label === 'string' && item.label.trim() ? item.label.trim() : String(item.id ?? ''),
            ])
            .filter(([id]) => Boolean(id)),
    );
}

function getConsentDocumentEntries(val: unknown, meta?: any): Array<{ label: string; file: File | string }> {
    if (!val || typeof val !== 'object' || Array.isArray(val)) return [];
    const consentLabelMap = getConsentLabelMap(meta);
    const resolveLabel = (key: string, fallback?: string) =>
        consentLabelMap[key] || fallback || toReadableLabel(key);

    const record = val as Record<string, unknown>;
    const rawDocuments = record.documents;
    if (!rawDocuments) return [];

    if (Array.isArray(rawDocuments)) {
        return rawDocuments
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
            .map((item, index) => {
                const fileCandidate =
                    item.file instanceof File
                        ? item.file
                        : typeof item.signedUrl === 'string' && item.signedUrl.trim()
                            ? item.signedUrl
                            : typeof item.url === 'string' && item.url.trim()
                                ? item.url
                                : typeof item.fileName === 'string' && item.fileName.trim()
                                    ? item.fileName
                                    : null;
                if (!fileCandidate) return null;
                return {
                    label:
                        typeof item.label === 'string' && item.label.trim()
                            ? item.label
                            : resolveLabel(String(item.id ?? ''), `Document ${index + 1}`),
                    file: fileCandidate,
                };
            })
            .filter((item): item is { label: string; file: File | string } => Boolean(item));
    }

    if (typeof rawDocuments === 'object') {
        return Object.entries(rawDocuments as Record<string, unknown>)
            .map(([key, item]) => {
                if (item instanceof File) {
                    return { label: resolveLabel(key), file: item };
                }
                if (typeof item === 'string' && item.trim()) {
                    return { label: resolveLabel(key), file: item };
                }
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                    const entry = item as Record<string, unknown>;
                    const fileCandidate =
                        entry.file instanceof File
                            ? entry.file
                            : typeof entry.signedUrl === 'string' && entry.signedUrl.trim()
                                ? entry.signedUrl
                                : typeof entry.url === 'string' && entry.url.trim()
                                    ? entry.url
                                    : typeof entry.fileName === 'string' && entry.fileName.trim()
                                        ? entry.fileName
                                        : null;
                    if (!fileCandidate) return null;
                    return {
                        label: typeof entry.label === 'string' && entry.label.trim()
                            ? entry.label
                            : resolveLabel(key),
                        file: fileCandidate,
                    };
                }
                return null;
            })
            .filter((item): item is { label: string; file: File | string } => Boolean(item));
    }

    return [];
}

function renderPreviewDocuments(documents: PreviewDocument[]): React.ReactNode {
    return documents.map((doc) => {
        const label = doc.displayLabel || doc.name || '';
        const isUploaded = hasCompletedUpload(doc);
        const canOpen = Boolean(doc.fileUrl && String(doc.fileUrl).trim());
        const fileName = doc.fileName || doc.name || '';

        return (
            <div
                key={doc.id}
                className="grid grid-cols-[200px_1fr] items-center gap-x-8 py-3 text-sm first:pt-3.5 last:pb-3.5"
            >
                <span className="text-muted-foreground font-medium">{label}</span>

                {isUploaded ? (
                    canOpen ? (
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 hover:underline font-medium text-left transition-colors"
                            onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{fileName || 'View Document'}</span>
                        </button>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <FileText className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                            <span className="truncate">{fileName || 'Uploaded'}</span>
                        </span>
                    )
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground/60 italic font-medium">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        Not Uploaded
                    </span>
                )}
            </div>
        );
    });
}

function renderConsentValue(val: unknown, meta?: any): React.ReactNode {
    if (!val || typeof val !== 'object' || Array.isArray(val)) {
        return <span className="text-muted-foreground/60 italic">—</span>;
    }

    const record = val as Record<string, unknown>;
    const accepted = record.accepted === true;
    const documents = getConsentDocumentEntries(val, meta);

    return (
        <div className="space-y-2">
            <div>{accepted ? 'Accepted' : 'Not accepted'}</div>
            {documents.length > 0 ? (
                <div className="space-y-1">
                    {documents.map((doc, index) => {
                        const name = doc.file instanceof File
                            ? doc.file.name
                            : (typeof doc.file === 'string' && !doc.file.startsWith('http') && !doc.file.startsWith('/api/v1/')
                                ? doc.file
                                : undefined);
                        return (
                            <div key={`${doc.label}-${index}`} className="flex flex-wrap items-center gap-2">
                                <span className="text-muted-foreground">{doc.label}:</span>
                                <span>{doc.file instanceof File || (typeof doc.file === 'string' && (doc.file.startsWith('http') || doc.file.startsWith('/api/v1/')))
                                    ? <FileLink val={doc.file} name={name || doc.label} />
                                    : String(doc.file)}</span>
                            </div>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}

// ─── Format a single leaf value into a ReactNode ─────────────────────────────
function formatVal(val: any, currency: string, meta?: any, fieldType?: string): React.ReactNode {
    if (val === true) return 'Yes';
    if (val === false) return 'No';
    if (val === undefined || val === null || val === '') return <span className="text-muted-foreground/60 italic">—</span>;

    if (fieldType === 'consent') {
        return renderConsentValue(val, meta);
    }

    if (val instanceof File) return <FileLink val={val} />;

    const isUrl = (s: any): s is string =>
        typeof s === 'string' && (s.startsWith('http') || s.startsWith('/api/v1/'));
    if (isUrl(val)) return <FileLink val={val} />;

    // Robust Numeric Detection & Formatting
    // Skip numeric formatting for phone/mobile fields — return raw string
    const _fieldNameLower = (meta?.name || meta?.label || '').toLowerCase();
    const _isPhoneField =
        _fieldNameLower.includes('mobile') ||
        _fieldNameLower.includes('phone') ||
        _fieldNameLower.includes('tel') ||
        _fieldNameLower.includes('contact') ||
        meta?.numberFormat === 'phone';

    if (_isPhoneField && (typeof val === 'string' || typeof val === 'number')) {
        return String(val);
    }

    let numericVal: number | null = null;
    if (typeof val === 'number') {
        numericVal = val;
    } else if (typeof val === 'string' && val.trim() !== '') {
        const cleaned = val.replace(/,/g, '');
        const num = Number(cleaned);
        // Only treat as numeric if it's a valid number and matches a basic numeric pattern
        if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(cleaned)) {
            numericVal = num;
        }
    }

    if (numericVal !== null) {
        if (meta?.numberFormat === 'currency') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency !== 'N/A' ? currency : 'USD',
            }).format(numericVal);
        }

        // Special handling for years (typically 1800-2100) - shouldn't have commas
        const isYearRange = Number.isInteger(numericVal) && numericVal >= 1800 && numericVal <= 2100;
        const isYearField = 
            meta?.label?.toLowerCase().includes('year') || 
            meta?.name?.toLowerCase().includes('year');

        const isLikelyYear = (isYearRange || isYearField) && !meta?.forceFormatting;
        
        if (isLikelyYear) {
            return String(numericVal);
        }

        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 10,
        }).format(numericVal);
    }

    if (typeof val === 'string') {
        if (fieldType === 'time') {
            return formatTimeDisplay(val) || val;
        }
        const timeDisplay = formatTimeDisplay(val);
        if (timeDisplay) return timeDisplay;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
                return formatDateTimeDDMMYYYY(d);
            }
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            const d = new Date(val + 'T00:00:00');
            if (!isNaN(d.getTime())) return formatDateDDMMYYYY(d);
        }
        return val;
    }

    if (val instanceof Date) return formatDateDDMMYYYY(val);

    if (typeof val === 'object' && !Array.isArray(val)) {
        if ('value' in val && 'otherText' in val) {
            return val.value === 'Other' ? `Other: ${(val as any).otherText}` : String((val as any).value);
        }
        if ('address' in val || ('lat' in val && 'lng' in val)) {
            const addr: string = (val as any).address || '';
            const lat = (val as any).lat;
            const lng = (val as any).lng;
            const coords = lat != null && lng != null ? `${lat}, ${lng}` : '';
            if (addr && coords) return `${addr} | ${coords}`;
            return addr || coords || '—';
        }
        // date_period / policyPeriod — use fromDateLabel / toDateLabel from metadata
        const obj = val as Record<string, unknown>;
        const startVal = obj.startDate ?? obj.fromDate ?? obj.from;
        const endVal = obj.endDate ?? obj.toDate ?? obj.to;
        if (startVal !== undefined || endVal !== undefined) {
            const fromLabel: string = meta?.fromDateLabel || 'From Date';
            const toLabel: string = meta?.toDateLabel || 'To Date';
            const fmt = (v: unknown) => {
                if (!v) return '—';
                const s = String(v);
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                    const d = new Date(s + 'T00:00:00');
                    if (!isNaN(d.getTime())) return formatDateDDMMYYYY(d);
                }
                return s;
            };
            return (
                <div className="flex flex-col gap-0.5">
                    <span><span className="text-muted-foreground">{fromLabel}:</span> {fmt(startVal)}</span>
                    <span><span className="text-muted-foreground">{toLabel}:</span> {fmt(endVal)}</span>
                </div>
            );
        }
        const leafVals = Object.entries(val)
            .filter(([k]) => k !== '_rowId' && k !== 'id')
            .map(([, ev]) => formatVal(ev, currency))
            .filter((s) => s !== '—');
        return leafVals.length > 0 ? (leafVals as string[]).join(', ') : '—';
    }

    if (Array.isArray(val)) {
        const joined = val.map((i) => formatVal(i, currency)).filter((s) => s !== '—');
        return joined.length > 0 ? (joined as string[]).join(', ') : '—';
    }

    return String(val);
}

// ─── Repeatable sub-row rendered as an aligned table ─────────────────────────
const RepeatableTable: React.FC<{ label: string; rows: Record<string, any>[]; currency: string }> = ({
    label,
    rows,
    currency,
}) => {
    // collect column keys from first row (excluding internal ids)
    const cols = Object.keys(rows[0] || {}).filter((k) => k !== '_rowId' && k !== 'id');
    if (cols.length === 0) return null;

    return (
        // Full-width block — label on its own line, table below
        <div className="flex flex-col gap-2 text-sm">
            <span className="text-muted-foreground font-medium">{label}</span>
            <div className="rounded-lg border border-border overflow-hidden">
                {/* Header row */}
                <div
                    className="grid bg-muted/40 border-b border-border"
                    style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}
                >
                    {cols.map((col) => (
                        <div
                            key={col}
                            className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                        >
                            {toReadableLabel(col)}
                        </div>
                    ))}
                </div>
                {/* Data rows */}
                {rows.map((row, i) => (
                    <div
                        key={i}
                        className={`grid ${i < rows.length - 1 ? 'border-b border-border' : ''}`}
                        style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}
                    >
                        {cols.map((col, colIdx) => (
                            <div key={colIdx} className="px-4 py-2.5 text-sm font-medium text-foreground">
                                {formatVal(row[col], currency, { label: col, name: col })}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Combination sub-fields (single object) ───────────────────────────────────
const CombinationRow: React.FC<{ label: string; obj: Record<string, any>; currency: string }> = ({
    label,
    obj,
    currency,
}) => {
    const entries = Object.entries(obj).filter(([k]) => k !== '_rowId' && k !== 'id');
    if (entries.length === 0)
        return (
            <div className="grid grid-cols-[200px_1fr] items-start gap-x-8 gap-y-1 text-sm">
                <span className="text-muted-foreground font-medium py-0.5">{label}</span>
                <span className="text-muted-foreground/60 italic py-0.5">—</span>
            </div>
        );

    return (
        <div className="grid grid-cols-[200px_1fr] items-start gap-x-8 text-sm">
            <span className="text-muted-foreground font-medium py-0.5">{label}</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 py-0.5">
                {entries.map(([key, val], i) => (
                    <div key={i} className="text-foreground flex items-baseline">
                        <span className="text-muted-foreground/70 mr-2 min-w-[80px] shrink-0">
                            {toReadableLabel(key)}:
                        </span>
                        <span>
                            {formatVal(val, currency, { label: key, name: key })}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── FieldRow: one field in the preview ──────────────────────────────────────
const FieldRow: React.FC<{ field: PreviewField; currency: string }> = ({ field, currency }) => {
    const v = field.value;

    if (field.type === 'consent') {
        const rendered = formatVal(v, currency, field.metadata, field.type);
        return (
            <div className="grid grid-cols-[200px_1fr] items-start gap-x-8 text-sm">
                <span className="text-muted-foreground font-medium py-0.5 leading-relaxed">{field.label}</span>
                <div className="py-0.5 break-words leading-relaxed text-foreground">{rendered}</div>
            </div>
        );
    }

    const isCombination =
        v !== null &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        !(v instanceof File) &&
        !(v instanceof Date) &&
        !('value' in (v as any) && 'otherText' in (v as any)) &&
        !('address' in (v as any)) &&
        !('lat' in (v as any));

    const isRepeatableArray =
        Array.isArray(v) &&
        v.length > 0 &&
        v.some((item) => typeof item === 'object' && item !== null && !(item instanceof File));

    // ── Date period object → use fromDateLabel / toDateLabel from metadata
    if (
        v !== null &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        !(v instanceof File) &&
        !(v instanceof Date)
    ) {
        const obj = v as Record<string, unknown>;
        const startVal = obj.startDate ?? obj.fromDate ?? obj.from;
        const endVal = obj.endDate ?? obj.toDate ?? obj.to;
        if (startVal !== undefined || endVal !== undefined) {
            const fromLabel: string = field.metadata?.fromDateLabel || 'From Date';
            const toLabel: string = field.metadata?.toDateLabel || 'To Date';
            const fmt = (d: unknown) => {
                if (!d) return '—';
                const s = String(d);
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                    const dt = new Date(s + 'T00:00:00');
                    if (!isNaN(dt.getTime())) return formatDateDDMMYYYY(dt);
                }
                return s;
            };
            return (
                <div className="grid grid-cols-[200px_1fr] items-start gap-x-8 text-sm">
                    <span className="text-muted-foreground font-medium py-0.5 leading-relaxed">{field.label}</span>
                    <div className="py-0.5 flex flex-wrap gap-x-8 gap-y-1 text-foreground">
                        <span>
                            <span className="text-muted-foreground/70 mr-1">{fromLabel}:</span>
                            <span className="font-medium">{fmt(startVal)}</span>
                        </span>
                        <span>
                            <span className="text-muted-foreground/70 mr-1">{toLabel}:</span>
                            <span className="font-medium">{fmt(endVal)}</span>
                        </span>
                    </div>
                </div>
            );
        }
    }

    // ── Repeatable (array of objects) → table layout
    if (isRepeatableArray) {
        const objectRows = (v as any[]).filter(
            (item) => typeof item === 'object' && item !== null && !(item instanceof File),
        );
        return <RepeatableTable label={field.label} rows={objectRows} currency={currency} />;
    }

    // ── Combination (single plain object) → inline key: value pairs
    if (isCombination) {
        return <CombinationRow label={field.label} obj={v as Record<string, any>} currency={currency} />;
    }

    // ── Simple / scalar value → 2-column label | value row
    const rendered = formatVal(v, currency, field.metadata, field.type);
    return (
        <div className="grid grid-cols-[200px_1fr] items-start gap-x-8 text-sm">
            <span className="text-muted-foreground font-medium py-0.5 leading-relaxed">{field.label}</span>
            <div className="py-0.5 break-words leading-relaxed text-foreground">{rendered}</div>
        </div>
    );
};

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Card header with accent left border */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-muted/30 border-b border-border">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
            <span className="text-sm font-semibold text-foreground tracking-tight">{title}</span>
        </div>
        {/* Card body — each field row has a subtle separator */}
        <div className="divide-y divide-border/60 px-5">
            {children}
        </div>
    </div>
);

// ─── Page heading ─────────────────────────────────────────────────────────────
const PageHeading: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex items-center gap-2 pt-1">
        <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
        <div className="flex-1 h-px bg-border/70" />
    </div>
);

// ─── Main Dialog ──────────────────────────────────────────────────────────────
export const ProposalPreviewDialog: React.FC<ProposalPreviewDialogProps> = ({
    isOpen,
    onOpenChange,
    previewSections,
    templatePreviewResponse,
    productId: _productId,
    declarationDocuments,
    underwritingDocuments,
    policyIssuanceDocuments = [],
    additionalDeclarationDocuments = [],
    currency = 'N/A',
    title = 'Proposal Preview',
    footer,
}) => {
    const allExpandedKeys = React.useMemo(() => {
        if (!templatePreviewResponse?.template) return [];

        return [
            ...(templatePreviewResponse.template.pages ?? []).map((page) => `page_${page.id}`),
            ...(templatePreviewResponse.template.additionalInformationPages ?? []).map(
                (page) => `additional_information_page_${page.id}`,
            ),
        ];
    }, [templatePreviewResponse]);

    const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
        () => new Set(allExpandedKeys),
    );

    React.useEffect(() => {
        setExpandedSections(new Set(allExpandedKeys));
    }, [allExpandedKeys, isOpen]);

    const toggleSection = React.useCallback((key: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* ── Sticky header ── */}
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0 bg-background">
                    <DialogTitle className="text-lg font-bold tracking-tight">{title}</DialogTitle>
                </DialogHeader>

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="px-6 py-5 space-y-6">

                        {templatePreviewResponse ? (
                            <TemplatePages
                                v2Response={templatePreviewResponse}
                                expandedSections={expandedSections}
                                onToggle={toggleSection}
                            />
                        ) : (
                            previewSections.map((page) => (
                                <div key={page.id} className="space-y-3">
                                    <PageHeading title={page.title} />

                                    {page.sections.map((section) => (
                                        <SectionCard key={section.id} title={section.title}>
                                            {section.fields.map((field) => (
                                                <div key={field.id} className="py-3 first:pt-3.5 last:pb-3.5">
                                                    <FieldRow field={field} currency={currency} />
                                                </div>
                                            ))}
                                        </SectionCard>
                                    ))}
                                </div>
                            ))
                        )}

                        {/* Underwriting Documents */}
                        {underwritingDocuments.length > 0 && (
                            <div className="space-y-3">
                                <PageHeading title="Underwriting Documents" />
                                <SectionCard title="Uploaded Documents">
                                    {renderPreviewDocuments(underwritingDocuments)}
                                </SectionCard>
                            </div>
                        )}

                        {/* Policy Issuance Documents (formerly Declaration Documents) */}
                        {(() => {
                            const allIssuanceDocs = [...(policyIssuanceDocuments || []), ...(declarationDocuments || [])];
                            const seen = new Set();
                            const uniqueDocs = allIssuanceDocs.filter(d => {
                                const key = d.id || d.name;
                                if (!key || seen.has(key)) return false;
                                seen.add(key);
                                return true;
                            });

                            if (uniqueDocs.length === 0) return null;

                            return (
                                <div className="space-y-3">
                                    <PageHeading title="Policy Issuance Documents" />
                                    <SectionCard title="Uploaded Documents">
                                        {renderPreviewDocuments(uniqueDocs)}
                                    </SectionCard>
                                </div>
                            );
                        })()}

                        {/* Additional Documents */}
                        {additionalDeclarationDocuments.length > 0 && (
                            <div className="space-y-3">
                                <PageHeading title="Additional Documents" />
                                <SectionCard title="Additional Uploaded Documents">
                                    {additionalDeclarationDocuments.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="grid grid-cols-[200px_1fr] items-center gap-x-8 py-3 text-sm first:pt-3.5 last:pb-3.5"
                                        >
                                            <span className="text-muted-foreground font-medium">{doc.title}</span>
                                            {doc.fileUrl ? (
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                                                >
                                                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate">{doc.fileName || 'Open'}</span>
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground/60 italic text-sm">
                                                    {doc.fileName || '—'}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </SectionCard>
                            </div>
                        )}

                    </div>
                </div>
                {footer ? (
                    <div className="border-t border-border bg-background px-6 py-4 flex-shrink-0">
                        <DialogFooter>{footer}</DialogFooter>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
};
