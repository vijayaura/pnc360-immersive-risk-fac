import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Send,
  Check,
  X,
  ArrowLeft,
  Eye,
  Edit,
  Loader2,
  ChevronsUpDown,
  FileDiff,
  RefreshCw,
  Calculator,
  MessageSquare,
  User,
  Plus,
  Paperclip,
} from "lucide-react";
import { DatePickerWithDropdown } from "@/components/ui/date-picker-with-dropdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addMonths, addDays } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  getEndorsementById,
  createEndorsement,
  saveEndorsement,
  updateEndorsementStatus,
  deleteUploadedFile,
  listPolicyEndorsements,
  calculateEndorsementPremium,
  saveReCalculatedPremium,
  getEndorsementDifference,
  type EndorsementDetailResponse,
  type EndorsementDocumentItem,
  type PolicyEndorsementListItem,
  type EndorsementDifferenceResponse,
  getEndorsementChatHistory,
  sendEndorsementQuery,
  respondToEndorsementChat,
} from "@/lib/api/endorsements";
import { type ChatMessage } from "@/features/quotes/api/quotes";
import {
  type Endorsement,
  type EndorsementListRow,
  type Status,
  type ApprovalStep,
  type AuditLog,
  mapApiStatusToStatus,
  mapStatusToApiStatus,
  mapApiTypeToDisplay,
} from "./endorsement-types";
import { useToast } from "@/shared/hooks/use-toast";
import { getPolicyById, listPolicies, PolicyItem } from "@/features/quotes/api/policies";
import { cn, formatCurrency } from "@/shared/utils/lib-utils";
import { api } from "@/lib/api/client";

export interface EndorsementFormProps {
  mode: "create" | "edit" | "view";
  endorsementId: string | null;
  initialPolicyId?: string | null;
  endorsements: EndorsementListRow[];
  onBack: () => void;
  onCreated: () => void;
  onStatusUpdated?: () => void;
  /** When viewing policy endorsements table (edit/view), call to switch to view another endorsement */
  onViewEndorsement?: (id: string) => void;
  /** When viewing policy endorsements table (edit/view), call to switch to edit another endorsement */
  onEditEndorsement?: (id: string) => void;
  /** When true (broker portal), show "View Proposal Form" and "Save". When false (insurer), show "View Changes" and "Recalculate". */
  isBroker?: boolean;
  /** When true, auto-open the chat panel on mount (e.g. navigating from a notification). */
  openMessage?: boolean;
}

const sampleWorkflow: ApprovalStep[] = [
  {
    id: "1",
    approver: "John Smith",
    role: "Senior Underwriter",
    status: "approved",
    timestamp: "2024-01-15 10:30 AM",
    comments: "Approved with conditions",
  },
  {
    id: "2",
    approver: "Jane Doe",
    role: "Underwriting Manager",
    status: "pending",
    timestamp: undefined,
    comments: undefined,
  },
];

const sampleAuditTrail: AuditLog[] = [
  { id: "1", timestamp: "2024-01-15 09:00 AM", user: "System", action: "Created", details: "Endorsement created by broker" },
  { id: "2", timestamp: "2024-01-15 09:15 AM", user: "John Smith", action: "Updated", details: "Sum insured adjusted from 100,000 to 150,000" },
  { id: "3", timestamp: "2024-01-15 10:30 AM", user: "John Smith", action: "Approved", details: "First level approval granted" },
];

/** Combination row: { label, value: Array<{ id, label, value }> } */
function isCombinationMatrix(data: unknown): data is Array<{ label?: string; value?: unknown[] }> {
  return Array.isArray(data) && data.length > 0 && data.every(
    (row) => typeof row === "object" && row !== null && "value" in row && Array.isArray((row as { value?: unknown[] }).value)
  );
}

/** Normalize date period / policy period to "startDate – endDate" (object or JSON string). */
function formatDatePeriodDisplay(value: unknown): string | null {
  if (value == null) return null;
  let obj: Record<string, unknown> | null = null;
  if (typeof value === "object" && value !== null) {
    obj = value as Record<string, unknown>;
  } else if (typeof value === "string" && value.trim().startsWith("{")) {
    try {
      obj = JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (!obj) return null;
  const start = String(obj.startDate ?? obj.fromDate ?? obj.from ?? "");
  const end = String(obj.endDate ?? obj.toDate ?? obj.to ?? "");
  if (start || end) return `From : ${start || "—"}\nTo : ${end || "—"}`;
  return null;
}

function formatSingleCombinationValue(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  const datePeriod = formatDatePeriodDisplay(v);
  if (datePeriod != null) return datePeriod;
  return formatDifferenceScalarValue(v);
}

function formatDifferenceNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const roundedInteger = Math.round(value);
  if (Math.abs(value - roundedInteger) < 1e-6) {
    return roundedInteger.toLocaleString("en-US");
  }
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 6,
    useGrouping: true,
  });
}

function formatDifferenceScalarValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return formatDifferenceNumber(value);
  if (typeof value !== "string") return String(value);

  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalizedNumeric = trimmed.replace(/,/g, "");
  if (/^-?\d+(\.\d+)?$/.test(normalizedNumeric)) {
    const numericValue = Number(normalizedNumeric);
    if (Number.isFinite(numericValue)) {
      return formatDifferenceNumber(numericValue);
    }
  }
  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (typeof parsed === "string" || typeof parsed === "number") {
        return formatDifferenceScalarValue(parsed);
      }
    } catch {
      // Ignore JSON parse errors and fall back to the original value.
    }
  }
  return value;
}

function formatConsentDisplay(value: unknown): string | null {
  if (value == null) return null;

  let data: Record<string, unknown> | null = null;
  if (typeof value === "object" && !Array.isArray(value)) {
    data = value as Record<string, unknown>;
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.startsWith("{")) return null;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        data = parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }

  if (!data || typeof data.accepted !== "boolean") return null;

  const acceptedDisplay = data.accepted ? "Accepted" : "Not accepted";
  const documents = Array.isArray(data.documents) ? data.documents : [];
  const documentDisplay = documents
    .map((document) => {
      if (!document || typeof document !== "object") return null;
      const item = document as Record<string, unknown>;
      const label = typeof item.label === "string" && item.label.trim() ? item.label.trim() : "Document";
      const fileName = typeof item.fileName === "string" && item.fileName.trim() ? item.fileName.trim() : "Not provided";
      return `${label}: ${fileName}`;
    })
    .filter((item): item is string => Boolean(item));

  return documentDisplay.length > 0
    ? `${acceptedDisplay}\nDocuments: ${documentDisplay.join(", ")}`
    : acceptedDisplay;
}

function formatCewLoadingDisplay(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const data = value as Record<string, unknown>;
  if (data.loading == null || data.loading === "") return null;

  const sign = data.isIncrease === false ? "-" : "+";
  const loadingValue = formatDifferenceScalarValue(data.loading);
  const type = String(data.type ?? "").trim().toLowerCase();
  const currency = String(data.currency ?? "").trim();

  if (type === "percentage") {
    return `Loading: ${sign}${loadingValue}%`;
  }

  if (type === "currency") {
    return `Loading: ${sign}${currency} ${loadingValue}`;
  }

  if (currency) {
    return `Loading: ${sign}${currency} ${loadingValue}`;
  }

  return `Loading: ${sign}${loadingValue}`;
}

function formatCewValueSummary(_category: string, value: unknown): string {
  return formatCewLoadingDisplay(value) || "—";
}

function getCewFieldDisplayName(key: unknown, label: unknown): string {
  const normalizedKey = String(key ?? "").trim();
  const normalizedLabel = String(label ?? "").trim();
  const uppercaseKey = normalizedKey.toUpperCase();

  if (uppercaseKey === "DEDUCTIBLE" || uppercaseKey === "TPL") {
    return normalizedKey || normalizedLabel || "—";
  }

  return normalizedLabel || normalizedKey || "—";
}

function formatCewDeltaValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const premiumImpact = (value as Record<string, unknown>).premiumImpact;
    if (premiumImpact == null || premiumImpact === "") return "—";
    return String(premiumImpact);
  }
  return "—";
}

type ParsedCombinationCell = {
  id: string;
  label: string;
  value: string;
  isRatingParameter: boolean;
  premiumImpact: unknown;
  premiumImpactType: string | null;
};

type ParsedCombinationRow = {
  label: string;
  value: ParsedCombinationCell[];
  isDeleted: boolean;
  deletedMessage: string | null;
};

/** Returns parsed combination matrix or null if not that format. */
function parseCombinationValue(valueText: unknown, valueJson: unknown): ParsedCombinationRow[] | null {
  let data: unknown = valueJson;
  const hasUsableJson =
    data != null && !(Array.isArray(data) && data.length === 0);
  if (!hasUsableJson && valueText != null) {
    if (typeof valueText === "string") {
      const trimmed = valueText.trim();
      if (trimmed === "") return null;
      try {
        data = JSON.parse(trimmed) as unknown;
      } catch {
        return null;
      }
    } else {
      // API may return structured objects/arrays directly in valueText.
      data = valueText;
    }
  }
  if (!isCombinationMatrix(data)) return null;
  return data.map((row) => ({
    label: typeof row.label === "string" ? row.label : "Row",
    isDeleted: Boolean((row as { isDeleted?: boolean }).isDeleted),
    deletedMessage:
      typeof (row as { deletedMessage?: unknown }).deletedMessage === "string"
        ? String((row as { deletedMessage?: string }).deletedMessage)
        : null,
    value: (row.value ?? []).map((cell) => {
      const c = cell as {
        id?: string;
        label?: string;
        value?: unknown;
        isRatingParameter?: boolean;
        premiumImpact?: unknown;
        premiumImpactType?: string | null;
      };
      return {
        id: String(c?.id ?? ""),
        label: typeof c?.label === "string" ? c.label : "",
        value: formatSingleCombinationValue(c?.value),
        isRatingParameter: Boolean(c?.isRatingParameter),
        premiumImpact: c?.premiumImpact ?? null,
        premiumImpactType: c?.premiumImpactType ? String(c.premiumImpactType) : null,
      };
    }),
  }));
}

function formatPremiumDelta(premiumImpact: unknown, premiumImpactType: string | null | undefined): string {
  if (premiumImpact == null || premiumImpact === "") return "—";
  const numeric = Number(premiumImpact);
  const base = Number.isFinite(numeric)
    ? (Number.isInteger(numeric) ? String(numeric) : String(numeric))
    : String(premiumImpact);
  const type = String(premiumImpactType || "").toUpperCase();
  if (type.includes("PERCENT")) return `(${base}%)`;
  if (type.includes("FIXED") || type.includes("AMOUNT")) return `(AED ${base})`;
  return `(${base})`;
}

function normalizeDateOnly(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatPremiumAmountDisplay(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parsePremiumAmountInput(value: string): number {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return 0;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalPremiumAmountInput(value: string): number | null {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Formats a premium text field with en-US grouping; state should hold digits without commas. */
function formatPremiumInputThousandsDisplay(raw: string): string {
  const normalized = raw.replace(/,/g, "").trim();
  if (!normalized) return "";

  const sign = normalized.startsWith("-") ? "-" : "";
  const body = sign ? normalized.slice(1) : normalized;

  if (normalized === "-") return "-";

  const dotIndex = body.indexOf(".");
  const intRaw = dotIndex === -1 ? body : body.slice(0, dotIndex);
  const decRaw = dotIndex === -1 ? undefined : body.slice(dotIndex + 1);
  const trailingDot = dotIndex !== -1 && (decRaw === undefined || decRaw === "");

  const intGrouped =
    intRaw !== "" ? intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

  if (dotIndex === -1) {
    return sign + intGrouped;
  }

  const intDisplay = intGrouped || (intRaw === "" ? "0" : intGrouped);
  if (trailingDot) {
    return `${sign}${intDisplay}.`;
  }
  return `${sign}${intDisplay}.${decRaw ?? ""}`;
}

/** Non-comma characters before index — maps caret across grouping changes while typing. */
function significantCharsBeforeCursor(s: string, cursor: number): number {
  const end = Math.min(Math.max(0, cursor), s.length);
  let count = 0;
  for (let i = 0; i < end; i++) {
    if (s[i] !== ",") count++;
  }
  return count;
}

/** Caret position after `sigBefore` significant (non-comma) chars in a formatted string. */
function cursorFromSignificantCount(formatted: string, sigBefore: number): number {
  if (sigBefore <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] !== ",") {
      seen++;
      if (seen === sigBefore) return i + 1;
    }
  }
  return formatted.length;
}

function isPremiumAmountInputValue(value: string): boolean {
  return /^-?\d*(\.\d*)?$/.test(value);
}

function isNonNegativePremiumAmountInputValue(value: string): boolean {
  return /^\d*(\.\d*)?$/.test(value);
}

type PremiumRecalcFee = {
  label: string;
  adjustmentType: string;
  adjustmentValue: number;
  amount?: number;
  formula?: string;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizePremiumRecalcFee(
  fee: unknown,
  revisedPremium: number
): PremiumRecalcFee {
  const raw = isObjectRecord(fee) ? fee : {};
  const adjustmentType = String(raw.adjustmentType ?? "").toUpperCase();
  const adjustmentValue = Number(raw.adjustmentValue ?? 0);
  const rawAmount = Number(raw.amount ?? 0);
  const amount =
    rawAmount ||
    (adjustmentType === "PERCENTAGE"
      ? Number(((revisedPremium * adjustmentValue) / 100).toFixed(2))
      : adjustmentValue);

  return {
    label: String(raw.label ?? ""),
    adjustmentType,
    adjustmentValue,
    amount,
    formula: raw.formula ? String(raw.formula) : "",
  };
}

function extractPremiumRecalcFees(
  breakdown: unknown,
  snapshot: unknown,
  revisedPremium: number
): PremiumRecalcFee[] {
  const breakdownRecord = isObjectRecord(breakdown) ? breakdown : {};
  const snapshotRecord = isObjectRecord(snapshot) ? snapshot : {};
  const snapshotPremium = isObjectRecord(snapshotRecord.premium) ? snapshotRecord.premium : {};

  const rawFees =
    (Array.isArray(breakdownRecord.endorsementFees) && breakdownRecord.endorsementFees) ||
    (Array.isArray(breakdownRecord.fees) && breakdownRecord.fees) ||
    (Array.isArray(snapshotPremium.endorsementFees) && snapshotPremium.endorsementFees) ||
    (Array.isArray(snapshotRecord.endorsementFees) && snapshotRecord.endorsementFees) ||
    [];

  return rawFees.map((fee) => normalizePremiumRecalcFee(fee, revisedPremium));
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

export function EndorsementForm({
  mode,
  endorsementId,
  initialPolicyId = null,
  endorsements,
  onBack,
  onCreated,
  onStatusUpdated,
  onViewEndorsement,
  onEditEndorsement,
  isBroker: isBrokerProp,
  openMessage: openMessageProp = false,
}: EndorsementFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const endorsementsBasePath = location.pathname.startsWith("/broker") ? "/broker" : "/insurer";
  const isBroker = isBrokerProp ?? location.pathname.startsWith("/broker");
  /** Broker in view mode: readonly form, no submit, no document upload; only Download Endorsement Letter enabled. */
  const isBrokerViewMode = isBroker && mode === "view";
  const isExistingEndorsementMode = mode !== "create" && Boolean(endorsementId);
  const [detailLoading, setDetailLoading] = useState(false);
  const [policyContextLoading, setPolicyContextLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [downloadLetterLoading, setDownloadLetterLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [endorsementTypeCategory, setEndorsementTypeCategory] = useState<
    "non-technical" | "technical" | "cancellation" | "extensions" | ""
  >("");
  const [cancellationRefundAmount, setCancellationRefundAmount] = useState("");
  const [cancellationDetails, setCancellationDetails] = useState("");
  const [extensionDetails, setExtensionDetails] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [policyStartDateForEffective, setPolicyStartDateForEffective] = useState<Date | null>(null);
  const [policyEndDateForEffective, setPolicyEndDateForEffective] = useState<Date | null>(null);
  const [policyEndDateForExtension, setPolicyEndDateForExtension] = useState<Date | null>(null);
  const [resolvingPolicyNumber, setResolvingPolicyNumber] = useState(mode === "create" && Boolean(initialPolicyId));
  const [endorsement, setEndorsement] = useState<Partial<Endorsement>>({
    endorsementType: undefined,
    policyNumber: initialPolicyId || "",
    endorsementReference: `END-${Date.now()}`,
    effectiveDate: null,
    requestedBy: undefined,
    natureOfChange: "",
    sumInsuredAdjustment: 0,
    premiumAdjustment: 0,
    supportingDocuments: [],
    remarks: "",
    status: "Draft",
    approvalWorkflow: [],
    auditTrail: [],
  });
  const [effectiveDateOpen, setEffectiveDateOpen] = useState(false);
  /** File item shape: new uploads have .file; existing from API have .fileId, url, etc. */
  type UploadedFileItem = {
    name: string;
    size: number;
    file?: File;
    fileId?: string;
    url?: string;
    contentType?: string;
    originalFilename?: string;
    sizeBytes?: string;
  };
  /** Cancellation and extension have separate supporting documents; switching type clears the other. */
  const [cancellationUploadedFiles, setCancellationUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [extensionUploadedFiles, setExtensionUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [requiredSupportingDocs, setRequiredSupportingDocs] = useState<UploadedFileItem[]>([]);
  const [additionalSupportingDocs, setAdditionalSupportingDocs] = useState<UploadedFileItem[]>([]);
  const [showSupportingDocs, setShowSupportingDocs] = useState(false);
  const [supportingDocsLoading, setSupportingDocsLoading] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);
  /** Displayed list: cancellation docs when type is cancellation, extension docs when type is extension. */
  const uploadedFiles =
    endorsementTypeCategory === "cancellation"
      ? cancellationUploadedFiles
      : endorsementTypeCategory === "extensions"
        ? extensionUploadedFiles
        : [];
  const setUploadedFilesForCurrentType = (updater: (prev: UploadedFileItem[]) => UploadedFileItem[]) => {
    if (endorsementTypeCategory === "cancellation") setCancellationUploadedFiles(updater);
    else if (endorsementTypeCategory === "extensions") setExtensionUploadedFiles(updater);
  };
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    name: string;
    contentType?: string;
    isObjectUrl: boolean;
  } | null>(null);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [isDifferencesDialogOpen, setIsDifferencesDialogOpen] = useState(false);
  const [differencesData, setDifferencesData] = useState<EndorsementDifferenceResponse | null>(null);
  const [differencesLoading, setDifferencesLoading] = useState(false);
  const [policySearchOpen, setPolicySearchOpen] = useState(false);
  const [policySearchQuery, setPolicySearchQuery] = useState("");
  const [policySearchResults, setPolicySearchResults] = useState<PolicyItem[]>([]);
  const [policySearchLoading, setPolicySearchLoading] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(initialPolicyId || null);
  const policySearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [policyEndorsements, setPolicyEndorsements] = useState<PolicyEndorsementListItem[]>([]);
  const [policyEndorsementsMeta, setPolicyEndorsementsMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [policyEndorsementsLoading, setPolicyEndorsementsLoading] = useState(false);
  const [policyEndorsementsError, setPolicyEndorsementsError] = useState<string | null>(null);
  const [policyEndorsementsPage, setPolicyEndorsementsPage] = useState(1);
  const POLICY_ENDORSEMENTS_LIMIT = 5;
  const [initialDetailResolved, setInitialDetailResolved] = useState(!isExistingEndorsementMode);
  const [initialPolicyContextResolved, setInitialPolicyContextResolved] = useState(!isExistingEndorsementMode);
  const [initialPolicyEndorsementsResolved, setInitialPolicyEndorsementsResolved] = useState(!isExistingEndorsementMode);
  /** Snapshot of endorsement details (type, effectiveDate, policyId, policyExpiryDate, extensionDetails) when last saved. Supporting documents are excluded. */
  const lastSavedFormSnapshotRef = useRef<{
    type: string;
    effectiveDate: string | null;
    policyId: string | null;
    policyExpiryDate?: string | null;
    extensionDetails?: string | null;
  } | null>(null);
  const [saveFormLoading, setSaveFormLoading] = useState(false);

  /** Premium recalculation card (from calculate-premium API breakdown). Hidden until user clicks Recalculate. */
  const [showPremiumRecalcCard, setShowPremiumRecalcCard] = useState(false);
  const [premiumRecalcLoading, setPremiumRecalcLoading] = useState(false);
  const [premiumRecalcSaving, setPremiumRecalcSaving] = useState(false);
  const [premiumCurrency, setPremiumCurrency] = useState("AED");
  const [originalPremium, setOriginalPremium] = useState(0);
  const [revisedPremium, setRevisedPremium] = useState(0);
  const [premiumVariation, setPremiumVariation] = useState(0);
  const [proRatedPremium, setProRatedPremium] = useState(0);
  const [premiumRecalcFees, setPremiumRecalcFees] = useState<PremiumRecalcFee[]>([]);
  const [baseEndorsementPayablePremium, setBaseEndorsementPayablePremium] = useState(0);
  const [overridePremiumInput, setOverridePremiumInput] = useState("");
  const [autoRecalculate, setAutoRecalculate] = useState(true);
  const [manualOverride, setManualOverride] = useState(false);
  const [savedPremiumRecalcSnapshot, setSavedPremiumRecalcSnapshot] = useState<{
    originalPremium: number;
    revisedPremium: number;
    variation: number;
    proRatedPremium: number;
    autoCalculatePremium: boolean;
    overridePremium: number;
    loading: number;
    totalEndorsementAmount: number;
    feesSignature: string;
  } | null>(null);
  /** Loading/Discount (AED) for extension type in Premium Recalculation card (insurer only). */
  const [extensionLoadingDiscountInput, setExtensionLoadingDiscountInput] = useState("");
  const extensionLoadingInputRef = useRef<HTMLInputElement | null>(null);
  const extensionLoadingCaretSigRef = useRef<number | null>(null);
  const overridePremiumInputRef = useRef<HTMLInputElement | null>(null);
  const overridePremiumCaretSigRef = useRef<number | null>(null);

  const applyPremiumRecalculation = useCallback(
    (
      breakdown: {
        originalPremium?: number;
        revisedPremium?: number;
        variation?: number;
        proRatedPremium?: number;
        totalEndorsementAmount?: number;
        loading?: number;
        endorsementFees?: unknown[];
        fees?: unknown[];
      },
      snapshot?: unknown
    ) => {
      const original = Number(breakdown.originalPremium) || 0;
      const revised = Number(breakdown.revisedPremium) || 0;
      const variation = Number(breakdown.variation) || 0;
      const proRated = Number(breakdown.proRatedPremium) || 0;
      const totalAmount = Number(breakdown.totalEndorsementAmount) || 0;
      const fees = extractPremiumRecalcFees(breakdown, snapshot, revised);

      setOriginalPremium(original);
      setRevisedPremium(revised);
      setPremiumVariation(variation);
      setProRatedPremium(proRated);
      setPremiumRecalcFees(fees);
      setBaseEndorsementPayablePremium(totalAmount);
      if (endorsementTypeCategory === "cancellation") {
        setCancellationRefundAmount(totalAmount.toFixed(2));
      }

      if (endorsementTypeCategory === "extensions" && breakdown.loading != null) {
        setExtensionLoadingDiscountInput(String(Number(breakdown.loading) || 0));
      }
    },
    [endorsementTypeCategory]
  );

  const normalizedOverridePremium = parseOptionalPremiumAmountInput(overridePremiumInput) ?? 0;
  const extensionLoadingDiscount = parseOptionalPremiumAmountInput(extensionLoadingDiscountInput) ?? 0;
  const totalPayablePremium = useMemo(
    () => baseEndorsementPayablePremium + normalizedOverridePremium,
    [baseEndorsementPayablePremium, normalizedOverridePremium]
  );
  const premiumCurrencyLabel = premiumCurrency || "AED";
  const isInitialPageLoading =
    isExistingEndorsementMode &&
    (!initialDetailResolved || !initialPolicyContextResolved || !initialPolicyEndorsementsResolved);

  useEffect(() => {
    if (isExistingEndorsementMode) {
      setInitialDetailResolved(false);
      setInitialPolicyContextResolved(false);
      setInitialPolicyEndorsementsResolved(false);
      return;
    }
    setInitialDetailResolved(true);
    setInitialPolicyContextResolved(true);
    setInitialPolicyEndorsementsResolved(true);
  }, [isExistingEndorsementMode, endorsementId]);

  useEffect(() => {
    if (!isExistingEndorsementMode || !initialDetailResolved || selectedPolicyId) return;
    setInitialPolicyContextResolved(true);
    setInitialPolicyEndorsementsResolved(true);
  }, [isExistingEndorsementMode, initialDetailResolved, selectedPolicyId]);

  const currentPremiumRecalcSnapshot = useMemo(
    () => ({
      originalPremium,
      revisedPremium,
      variation: premiumVariation,
      proRatedPremium,
      autoCalculatePremium: autoRecalculate,
      overridePremium: normalizedOverridePremium,
      loading: endorsementTypeCategory === "extensions" ? extensionLoadingDiscount : 0,
      totalEndorsementAmount: totalPayablePremium,
      feesSignature: JSON.stringify(
        [...premiumRecalcFees]
          .map((fee) => ({
            label: String(fee.label || "").trim(),
            adjustmentType: String(fee.adjustmentType || "").toUpperCase(),
            adjustmentValue: Number(fee.adjustmentValue || 0),
          }))
          .sort((a, b) =>
            `${a.label}-${a.adjustmentType}-${a.adjustmentValue}`.localeCompare(
              `${b.label}-${b.adjustmentType}-${b.adjustmentValue}`
            )
          )
      ),
    }),
    [
      originalPremium,
      revisedPremium,
      premiumVariation,
      proRatedPremium,
      autoRecalculate,
      normalizedOverridePremium,
      endorsementTypeCategory,
      extensionLoadingDiscount,
      totalPayablePremium,
      premiumRecalcFees,
    ]
  );

  const hasUnsavedPremiumRecalcChanges = useMemo(() => {
    if (!showPremiumRecalcCard) return false;
    if (!savedPremiumRecalcSnapshot) return !isBrokerViewMode;
    const normalize = (n: number) => Number(Number(n || 0).toFixed(6));
    return (
      normalize(currentPremiumRecalcSnapshot.originalPremium) !== normalize(savedPremiumRecalcSnapshot.originalPremium) ||
      normalize(currentPremiumRecalcSnapshot.revisedPremium) !== normalize(savedPremiumRecalcSnapshot.revisedPremium) ||
      normalize(currentPremiumRecalcSnapshot.variation) !== normalize(savedPremiumRecalcSnapshot.variation) ||
      normalize(currentPremiumRecalcSnapshot.proRatedPremium) !== normalize(savedPremiumRecalcSnapshot.proRatedPremium) ||
      currentPremiumRecalcSnapshot.autoCalculatePremium !== savedPremiumRecalcSnapshot.autoCalculatePremium ||
      normalize(currentPremiumRecalcSnapshot.overridePremium) !== normalize(savedPremiumRecalcSnapshot.overridePremium) ||
      normalize(currentPremiumRecalcSnapshot.loading) !== normalize(savedPremiumRecalcSnapshot.loading) ||
      normalize(currentPremiumRecalcSnapshot.totalEndorsementAmount) !==
      normalize(savedPremiumRecalcSnapshot.totalEndorsementAmount) ||
      currentPremiumRecalcSnapshot.feesSignature !== savedPremiumRecalcSnapshot.feesSignature
    );
  }, [showPremiumRecalcCard, savedPremiumRecalcSnapshot, currentPremiumRecalcSnapshot, isBrokerViewMode]);
  const isPremiumRecalcReadOnly = isBrokerViewMode;
  const isFinalizedStatus = endorsement.status === "Approved" || endorsement.status === "Rejected";
  const shouldShowCreateNewEndorsementButton =
    isBroker &&
    mode === "view" &&
    Boolean(selectedPolicyId) &&
    isFinalizedStatus &&
    !(endorsementTypeCategory === "cancellation" && endorsement.status === "Approved");
  const isApprovedEditLock = !isBroker && mode === "edit" && isFinalizedStatus;

  useLayoutEffect(() => {
    if (extensionLoadingCaretSigRef.current == null) return;
    const el = extensionLoadingInputRef.current;
    if (!el) {
      extensionLoadingCaretSigRef.current = null;
      return;
    }
    const formatted = formatPremiumInputThousandsDisplay(extensionLoadingDiscountInput);
    const pos = Math.min(
      cursorFromSignificantCount(formatted, extensionLoadingCaretSigRef.current),
      formatted.length
    );
    extensionLoadingCaretSigRef.current = null;
    el.setSelectionRange(pos, pos);
  }, [extensionLoadingDiscountInput]);

  useLayoutEffect(() => {
    if (overridePremiumCaretSigRef.current == null) return;
    const el = overridePremiumInputRef.current;
    if (!el) {
      overridePremiumCaretSigRef.current = null;
      return;
    }
    const formatted = formatPremiumInputThousandsDisplay(overridePremiumInput);
    const pos = Math.min(
      cursorFromSignificantCount(formatted, overridePremiumCaretSigRef.current),
      formatted.length
    );
    overridePremiumCaretSigRef.current = null;
    el.setSelectionRange(pos, pos);
  }, [overridePremiumInput]);

  const isRecalcButtonLockedByStatus =
    !isBroker &&
    mode === "edit" &&
    (endorsement.status === "Approved" || endorsement.status === "Rejected");
  const isBrokerPremiumRecalcType =
    endorsementTypeCategory === "technical" ||
    endorsementTypeCategory === "non-technical" ||
    endorsementTypeCategory === "cancellation" ||
    endorsementTypeCategory === "extensions";
  const isBrokerApprovedView = isBrokerViewMode && isFinalizedStatus;
  const shouldShowPremiumRecalcCard =
    Boolean(endorsementId && selectedPolicyId && showPremiumRecalcCard) &&
    (!isBroker || (isBrokerApprovedView && isBrokerPremiumRecalcType));
  const displayedCancellationRefundAmount =
    endorsementTypeCategory === "cancellation" ? totalPayablePremium * -1 : 0;
  const formatPremiumSummaryValue = useCallback(
    (value: number, options?: { signed?: boolean }) => {
      const signed = options?.signed ?? false;
      const formattedValue = `${premiumCurrencyLabel} ${formatPremiumAmountDisplay(Math.abs(value))}`;
      if (signed) {
        if (value > 0) return `+ ${formattedValue}`;
        if (value < 0) return `- ${formattedValue}`;
        return formattedValue;
      }
      if (value < 0) return `- ${formattedValue}`;
      return formattedValue;
    },
    [premiumCurrencyLabel]
  );
  const getPremiumSummaryValueClassName = useCallback((value: number, emphasize = false) => {
    return cn(
      "tabular-nums whitespace-nowrap text-right",
      value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-foreground",
      emphasize && "font-semibold"
    );
  }, []);

  const isEffectiveDateWithinPolicyRange = useCallback(
    (date: Date | null) => {
      if (!date) return false;
      if (!selectedPolicyId) return true;
      if (!policyStartDateForEffective || !policyEndDateForEffective) return false;
      const value = normalizeDateOnly(date);
      const start = normalizeDateOnly(policyStartDateForEffective);
      const end = normalizeDateOnly(policyEndDateForEffective);
      return value >= start && value <= end;
    },
    [policyStartDateForEffective, policyEndDateForEffective, selectedPolicyId]
  );

  const validateEffectiveDateOrToast = useCallback(
    (date: Date | null, requiredMessage = "Please fill in effective date.") => {
      if (!date) {
        toast({ title: "Missing Required Fields", description: requiredMessage, variant: "destructive" });
        return false;
      }
      if (selectedPolicyId && (!policyStartDateForEffective || !policyEndDateForEffective)) {
        toast({
          title: "Policy Dates Loading",
          description: "Please wait for policy period to load before selecting effective date.",
          variant: "destructive",
        });
        return false;
      }
      if (!isEffectiveDateWithinPolicyRange(date)) {
        const start = policyStartDateForEffective ? format(policyStartDateForEffective, "dd-MM-yyyy") : "policy start";
        const end = policyEndDateForEffective ? format(policyEndDateForEffective, "dd-MM-yyyy") : "policy end";
        toast({
          title: "Invalid Effective Date",
          description: `Effective date must be between ${start} and ${end}.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    },
    [isEffectiveDateWithinPolicyRange, policyEndDateForEffective, policyStartDateForEffective, selectedPolicyId, toast]
  );

  const isExpiryDateWithinExtensionRange = useCallback(
    (date: Date | null) => {
      if (!date) return false;
      if (!selectedPolicyId) return true;
      if (!policyEndDateForExtension) return false;
      const value = normalizeDateOnly(date);
      const min = normalizeDateOnly(addDays(policyEndDateForExtension, 1));
      const max = normalizeDateOnly(addDays(addMonths(policyEndDateForExtension, 6), 1));
      return value >= min && value <= max;
    },
    [policyEndDateForExtension, selectedPolicyId]
  );

  const validateExpiryDateOrToast = useCallback(
    (date: Date | null, requiredMessage = "Please select an expiry date for the extension.") => {
      if (!date) {
        toast({ title: "Expiry Date Required", description: requiredMessage, variant: "destructive" });
        return false;
      }
      if (selectedPolicyId && !policyEndDateForExtension) {
        toast({
          title: "Policy Dates Loading",
          description: "Please wait for policy end date to load before selecting an expiry date.",
          variant: "destructive",
        });
        return false;
      }
      if (!isExpiryDateWithinExtensionRange(date)) {
        const min = policyEndDateForExtension ? format(addDays(policyEndDateForExtension, 1), "dd-MM-yyyy") : "the next day";
        const max = policyEndDateForExtension ? format(addDays(addMonths(policyEndDateForExtension, 6), 1), "dd-MM-yyyy") : "6 months and 1 day from policy end";
        toast({
          title: "Invalid Expiry Date",
          description: `Extended expiry date must be between ${min} and ${max}.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    },
    [isExpiryDateWithinExtensionRange, policyEndDateForExtension, selectedPolicyId, toast]
  );

  const mapSupportingDocsByType = useCallback((docs?: EndorsementDetailResponse["supportingDocuments"]) => {
    const cancellation: UploadedFileItem[] = [];
    const extensions: UploadedFileItem[] = [];
    if (!Array.isArray(docs) || docs.length === 0) {
      return { cancellation, extensions };
    }
    docs.forEach((doc) => {
      const fileItem: UploadedFileItem = {
        name: doc.originalFilename ?? doc.fileName ?? "Document",
        size: doc.sizeBytes ? Number(doc.sizeBytes) : 0,
        fileId: doc.fileId,
        url: doc.url,
        contentType: doc.contentType,
        originalFilename: doc.originalFilename,
        sizeBytes: doc.sizeBytes,
      };
      const normalizedType = String(doc.documentType ?? "").toLowerCase();
      if (normalizedType === "cancellation_supporting_document") {
        cancellation.push(fileItem);
      } else if (
        normalizedType === "extentions_supporting_document" ||
        normalizedType === "extensions_supporting_document"
      ) {
        extensions.push(fileItem);
      } else {
        // Backward compatibility: if documentType is missing/unknown, keep visible under both categories.
        cancellation.push(fileItem);
        extensions.push(fileItem);
      }
    });
    return { cancellation, extensions };
  }, []);

  const mapApiDocsToUploadedFiles = useCallback((docs?: EndorsementDocumentItem[]): UploadedFileItem[] => {
    if (!Array.isArray(docs) || docs.length === 0) return [];
    return docs.map((doc) => ({
      name:
        doc.originalFilename ??
        doc.documentName ??
        doc.fileName ??
        doc.filename ??
        "Document",
      size: doc.sizeBytes ? Number(doc.sizeBytes) : 0,
      fileId: doc.fileId ?? doc.id,
      url: doc.url,
      contentType: doc.contentType,
      originalFilename: doc.originalFilename ?? doc.filename,
      sizeBytes: doc.sizeBytes,
    }));
  }, []);

  const setTechnicalSupportingDocsFromDetail = useCallback(
    (detail: EndorsementDetailResponse) => {
      setRequiredSupportingDocs(mapApiDocsToUploadedFiles(detail.endorsementRequiredDocuments));
      setAdditionalSupportingDocs(mapApiDocsToUploadedFiles(detail.additionalDocuments));
    },
    [mapApiDocsToUploadedFiles]
  );

  const fetchTechnicalSupportingDocs = useCallback(async () => {
    if (!endorsementId) return;
    setShowSupportingDocs(true);
    try {
      setSupportingDocsLoading(true);
      const res = await getEndorsementById(endorsementId);
      const raw = res as unknown as { data?: EndorsementDetailResponse } & EndorsementDetailResponse;
      const detail = raw.data ?? raw;
      setTechnicalSupportingDocsFromDetail(detail);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load supporting documents";
      toast({ title: "Load Failed", description: message, variant: "destructive" });
    } finally {
      setSupportingDocsLoading(false);
    }
  }, [endorsementId, setTechnicalSupportingDocsFromDetail, toast]);

  // Chat/Query Response states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(
    () => openMessageProp || new URLSearchParams(location.search).get("openMessage") === "true",
  );
  const [newQueryDescription, setNewQueryDescription] = useState("");
  const [newQueryAttachments, setNewQueryAttachments] = useState<File[]>([]);
  const [queryResponse, setQueryResponse] = useState<Record<string, string>>({});
  const [showResponseForm, setShowResponseForm] = useState<Record<string, boolean>>({});
  const [querySubmitting, setQuerySubmitting] = useState(false);
  const [locallyReadMessageIds, setLocallyReadMessageIds] = useState<Set<string>>(new Set());
  const chatScrollAreaRef = useRef<HTMLDivElement | null>(null);
  const queryAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const chatReadSyncingRef = useRef(false);
  const chatMarkVisibleRef = useRef<() => void>(() => {});
  const chatSyncReadAtBottomRef = useRef<() => void | Promise<void>>(() => {});
  const chatFirstUnreadIdRef = useRef<string | null>(null);
  const chatLastTailIdRef = useRef<string | null>(null);

  // Sync state with URL parameter for notification auto-open
  useEffect(() => {
    if (new URLSearchParams(location.search).get("openMessage") === "true") {
      setIsChatExpanded(true);
    }
  }, [location.search]);

  const fetchPoliciesForSearch = useCallback(async (search: string) => {
    setPolicySearchLoading(true);
    try {
      const res = await listPolicies({
        page: 1,
        limit: 5,
        filterCancelledPolicies: true,
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      setPolicySearchResults(res?.data ?? []);
    } catch (err) {
      console.error("Policy search failed:", err);
      setPolicySearchResults([]);
    } finally {
      setPolicySearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!policySearchOpen) return;
    if (policySearchDebounceRef.current) clearTimeout(policySearchDebounceRef.current);
    policySearchDebounceRef.current = setTimeout(() => {
      fetchPoliciesForSearch(policySearchQuery);
    }, 300);
    return () => {
      if (policySearchDebounceRef.current) clearTimeout(policySearchDebounceRef.current);
    };
  }, [policySearchQuery, policySearchOpen, fetchPoliciesForSearch]);

  // Load endorsement when edit/view and endorsementId is set
  useEffect(() => {
    if (mode === "create" || !endorsementId) return;
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const res = await getEndorsementById(endorsementId);

        if (cancelled) return;
        // Support both { data: endorsement } and direct endorsement response
        const raw = res as unknown as { data?: EndorsementDetailResponse } & EndorsementDetailResponse;
        const d: EndorsementDetailResponse = raw.data ?? raw;
        setSelectedPolicyId(d.policyId);
        setEndorsementTypeCategory(
          d.type === "cancellation"
            ? "cancellation"
            : d.type === "technical"
              ? "technical"
              : d.type === "non_technical"
                ? "non-technical"
                : d.type === "extensions"
                  ? "extensions"
                  : "",
        );
        const isPremiumRecalcSupportedType =
          d.type === "technical" || d.type === "non_technical" || d.type === "cancellation" || d.type === "extensions";
        const premiumSnapshotRecord = isObjectRecord(d.premiumSnapshot) ? d.premiumSnapshot : {};
        const resolvedPremiumCurrency = String(
          d.currency ??
          premiumSnapshotRecord.currency ??
          "AED"
        ).trim() || "AED";
        setPremiumCurrency(resolvedPremiumCurrency);
        const recalc = d.recalculationDetails;
        const hasValidRecalcValues =
          recalc != null &&
          [recalc.originalPremium, recalc.revisedPremium, recalc.variation, recalc.proRatedPremium].every(
            (v) => v != null && Number.isFinite(Number(v))
          );
        if (hasValidRecalcValues && isPremiumRecalcSupportedType) {
          const original = Number(recalc.originalPremium || 0);
          const revised = Number(recalc.revisedPremium || 0);
          const variation = Number(recalc.variation || 0);
          const proRated = Number(recalc.proRatedPremium || 0);
          const loading = Number(recalc.loading || 0);
          const savedAutoCalculatePremium = recalc.autoCalculatePremium;
          const savedManualOverride = recalc.manualOverride;
          const isManualOverrideEnabled =
            savedManualOverride === true
              ? true
              : savedAutoCalculatePremium === true
                ? false
                : savedAutoCalculatePremium == null && savedManualOverride == null
                  ? false
                  : false;
          const autoCalc =
            savedManualOverride === true
              ? false
              : savedAutoCalculatePremium === true
                ? true
                : savedAutoCalculatePremium == null && savedManualOverride == null
                  ? true
                  : false;
          const overrideAmount = isManualOverrideEnabled ? Number(recalc.overridePremium || 0) : 0;
          const totalEndorsementAmount = Number(
            recalc.totalEndorsementAmount ||
            Number(premiumSnapshotRecord.totalEndorsementAmount || 0)
          );
          const feesFromRecalc = extractPremiumRecalcFees(recalc, d.premiumSnapshot, revised);
          setOriginalPremium(original);
          setRevisedPremium(revised);
          setPremiumVariation(variation);
          setProRatedPremium(proRated);
          setPremiumRecalcFees(feesFromRecalc);
          setBaseEndorsementPayablePremium(totalEndorsementAmount - overrideAmount);
          setOverridePremiumInput(isManualOverrideEnabled && overrideAmount !== 0 ? String(overrideAmount) : "");
          setAutoRecalculate(autoCalc);
          setExtensionLoadingDiscountInput(loading !== 0 ? String(loading) : "");
          setSavedPremiumRecalcSnapshot({
            originalPremium: original,
            revisedPremium: revised,
            variation,
            proRatedPremium: proRated,
            autoCalculatePremium: autoCalc,
            overridePremium: overrideAmount,
            loading: d.type === "extensions" ? loading : 0,
            totalEndorsementAmount,
            feesSignature: JSON.stringify(
              [...feesFromRecalc]
                .map((fee) => ({
                  label: String(fee.label || "").trim(),
                  adjustmentType: String(fee.adjustmentType || "").toUpperCase(),
                  adjustmentValue: Number(fee.adjustmentValue || 0),
                  amount: Number(fee.amount || 0),
                }))
                .sort((a, b) =>
                  `${a.label}-${a.adjustmentType}-${a.adjustmentValue}-${a.amount}`.localeCompare(
                    `${b.label}-${b.adjustmentType}-${b.adjustmentValue}-${b.amount}`
                  )
                )
            ),
          });
          if (isBrokerViewMode || (!isBroker && mode === "edit")) {
            setShowPremiumRecalcCard(true);
            setManualOverride(isManualOverrideEnabled);
          }
        } else if (isBrokerViewMode || (!isBroker && mode === "edit")) {
          setShowPremiumRecalcCard(false);
          setPremiumRecalcFees([]);
          setBaseEndorsementPayablePremium(0);
          setOverridePremiumInput("");
          setSavedPremiumRecalcSnapshot(null);
        }
        const refundFromApiSource =
          d.type === "cancellation" && recalc?.totalEndorsementAmount != null
            ? recalc.totalEndorsementAmount
            : d.refundAmount;
        const refundFromApi = refundFromApiSource != null && !Number.isNaN(Number(refundFromApiSource))
          ? String(refundFromApiSource)
          : "";
        setCancellationRefundAmount(refundFromApi);
        setCancellationDetails(d.cancellationDetails ?? "");
        setExtensionDetails((d as { extensionDetails?: string }).extensionDetails ?? "");
        setExpiryDate(d.policyExpiryDate ? new Date(d.policyExpiryDate) : null);
        let policyNumberDisplay = d.policyId;
        try {
          const policy = await getPolicyById(d.policyId);
          const raw = policy as unknown as Record<string, unknown>;
          policyNumberDisplay =
            (raw.policyNumber as string) ??
            (raw.policy_number as string) ??
            (raw.policy_id as string) ??
            String(policy.id);
        } catch {
          // keep policyId as fallback
        }
        setEndorsement({
          endorsementReference: d.endorsementReference,
          policyNumber: policyNumberDisplay,
          effectiveDate: d.effectiveDate ? new Date(d.effectiveDate) : null,
          status: mapApiStatusToStatus(d.status ?? ""),
          endorsementType: mapApiTypeToDisplay(d.type) as Endorsement["endorsementType"],
        });
        // Auto-prefill supporting documents in edit/view flow by documentType to avoid cross-type conflicts.
        const docsByType = mapSupportingDocsByType(d.supportingDocuments);
        setCancellationUploadedFiles(docsByType.cancellation);
        setExtensionUploadedFiles(docsByType.extensions);
        setTechnicalSupportingDocsFromDetail(d);
        if (!cancelled) {
          lastSavedFormSnapshotRef.current = {
            type: d.type ?? "",
            effectiveDate: d.effectiveDate ?? null,
            policyId: d.policyId ?? null,
            policyExpiryDate: d.policyExpiryDate ?? null,
            extensionDetails: (d as { extensionDetails?: string }).extensionDetails ?? null,
          };
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load endorsement";
          toast({ title: "Load Failed", description: message, variant: "destructive" });
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
          setInitialDetailResolved(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, endorsementId, toast, mapSupportingDocsByType, isBrokerViewMode, isBroker, setTechnicalSupportingDocsFromDetail]);

  // Lazy-load chat only when popup is opened to avoid premature read-side effects.
  useEffect(() => {
    if (!isChatExpanded || !endorsementId) return;
    let cancelled = false;
    (async () => {
      try {
        const chatRes = await getEndorsementChatHistory(endorsementId, "true");
        if (!cancelled) {
          setChatMessages(chatRes.data ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading chat history:", error);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isChatExpanded, endorsementId]);

  // Reset form when switching to create with initialPolicyId
  useEffect(() => {
    if (mode === "create") {
      setSelectedPolicyId(initialPolicyId || null);
      setEndorsement((prev) => ({ ...prev, policyNumber: initialPolicyId || "" }));
      setCancellationUploadedFiles([]);
      setExtensionUploadedFiles([]);
      setRequiredSupportingDocs([]);
      setAdditionalSupportingDocs([]);
      setShowSupportingDocs(false);
      setPremiumCurrency("AED");
      setExpiryDate(null);
      setCancellationRefundAmount("");
      lastSavedFormSnapshotRef.current = null;
      setResolvingPolicyNumber(Boolean(initialPolicyId));
    }
  }, [mode, initialPolicyId]);

  // Resolve initialPolicyId to policyNumber via policies API so the field shows POL00013 instead of UUID
  useEffect(() => {
    if (mode !== "create" || !initialPolicyId) return;
    let cancelled = false;
    const applyPolicyNumber = (policy: PolicyItem | (PolicyItem & { policyNumber?: string | null })) => {
      const raw = policy as unknown as Record<string, unknown>;
      const policyNumber =
        policy.policyNumber ??
        (raw.policyNumber as string) ??
        policy.policy_id ??
        initialPolicyId;
      setEndorsement((prev) => (prev ? { ...prev, policyNumber: String(policyNumber) } : prev));
      setResolvingPolicyNumber(false);
    };
    getPolicyById(initialPolicyId)
      .then((policy) => {
        if (cancelled) return;
        applyPolicyNumber(policy);
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback: use list API and find policy by id (e.g. when GET /policies/:id is not available)
        listPolicies({ page: 1, limit: 100 })
          .then((res) => {
            if (cancelled) return;
            const match = (res?.data ?? []).find((p) => p.id === initialPolicyId);
            if (match) applyPolicyNumber(match);
            else {
              toast({
                title: "Policy not found",
                description: "Could not resolve policy number. Policy ID will be shown.",
                variant: "destructive",
              });
              setResolvingPolicyNumber(false);
            }
          })
          .catch((err) => {
            if (cancelled) return;
            console.error("Resolve policy number for endorsement:", err);
            toast({
              title: "Could not load policy number",
              description: err instanceof Error ? err.message : "Policy may still be selected by ID.",
              variant: "destructive",
            });
            setResolvingPolicyNumber(false);
          });
      });
    return () => {
      cancelled = true;
    };
  }, [mode, initialPolicyId, toast]);

  // Reset policy endorsements page when policy changes
  useEffect(() => {
    setPolicyEndorsementsPage(1);
  }, [selectedPolicyId]);

  // Fetch policy period when a policy is selected:
  // - effective date must be between policyStartDate and policyEndDate
  // - extension expiry date must be between policyEndDate and policyEndDate + 6 months
  useEffect(() => {
    if (!selectedPolicyId) {
      setPolicyStartDateForEffective(null);
      setPolicyEndDateForEffective(null);
      setPolicyEndDateForExtension(null);
      return;
    }
    let cancelled = false;
    if (isExistingEndorsementMode) {
      setPolicyContextLoading(true);
    }
    getPolicyById(selectedPolicyId)
      .then((policy) => {
        if (cancelled) return;
        const raw = policy as unknown as {
          policyStartDate?: string;
          startDate?: string;
          start_date?: string;
          policy_start_date?: string;
          policyEndDate?: string;
          endDate?: string;
          end_date?: string;
          policy_end_date?: string;
        };
        const startDateStr =
          raw.policyStartDate ?? raw.startDate ?? raw.start_date ?? raw.policy_start_date ?? null;
        const endDateStr =
          raw.policyEndDate ?? raw.endDate ?? raw.end_date ?? raw.policy_end_date ?? null;
        const start = startDateStr ? new Date(startDateStr) : null;
        const end = endDateStr ? new Date(endDateStr) : null;
        setPolicyStartDateForEffective(start && !Number.isNaN(start.getTime()) ? start : null);
        setPolicyEndDateForEffective(end && !Number.isNaN(end.getTime()) ? end : null);
        if (endDateStr) {
          const d = new Date(endDateStr);
          setPolicyEndDateForExtension(Number.isNaN(d.getTime()) ? null : d);
        } else {
          setPolicyEndDateForExtension(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setPolicyStartDateForEffective(null);
        setPolicyEndDateForEffective(null);
        setPolicyEndDateForExtension(null);
      })
      .finally(() => {
        if (cancelled) return;
        setPolicyContextLoading(false);
        if (isExistingEndorsementMode) {
          setInitialPolicyContextResolved(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isExistingEndorsementMode, selectedPolicyId]);

  useEffect(() => {
    if (mode !== "create") return;
    if (!endorsement.effectiveDate) return;
    if (!selectedPolicyId || !policyStartDateForEffective || !policyEndDateForEffective) return;
    if (isEffectiveDateWithinPolicyRange(endorsement.effectiveDate)) return;
    setEndorsement((prev) => (prev ? { ...prev, effectiveDate: null } : prev));
  }, [
    endorsement.effectiveDate,
    isEffectiveDateWithinPolicyRange,
    mode,
    policyEndDateForEffective,
    policyStartDateForEffective,
    selectedPolicyId,
  ]);

  // Fetch policy endorsements list when a policy is selected (create: after user selects; edit/view: from loaded endorsement)
  useEffect(() => {
    if (!selectedPolicyId) return;
    let cancelled = false;
    setPolicyEndorsementsLoading(true);
    setPolicyEndorsementsError(null);
    listPolicyEndorsements(selectedPolicyId, { page: policyEndorsementsPage, limit: POLICY_ENDORSEMENTS_LIMIT })
      .then((res) => {
        if (cancelled) return;
        setPolicyEndorsements(res.data ?? []);
        setPolicyEndorsementsMeta(res.meta ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPolicyEndorsementsError(err instanceof Error ? err.message : "Failed to load policy endorsements");
        setPolicyEndorsements([]);
        setPolicyEndorsementsMeta(null);
      })
      .finally(() => {
        if (!cancelled) {
          setPolicyEndorsementsLoading(false);
          if (isExistingEndorsementMode) {
            setInitialPolicyEndorsementsResolved(true);
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isExistingEndorsementMode, selectedPolicyId, policyEndorsementsPage]);

  useEffect(() => {
    if (endorsementTypeCategory === "technical" || endorsementTypeCategory === "non-technical") return;
    setShowSupportingDocs(false);
  }, [endorsementTypeCategory]);

  const handleSubmitQueryResponse = async (queryId: string) => {
    const response = queryResponse[queryId];
    if (!response || !response.trim()) {
      toast({
        title: "Response Required",
        description: "Please enter a response.",
        variant: "destructive",
      });
      return;
    }
    if (!endorsementId) return;
    try {
      await respondToEndorsementChat(endorsementId, {
        message: response.trim(),
        parentMessageId: queryId,
      });
      const chatRes = await getEndorsementChatHistory(endorsementId, "true");
      setChatMessages(chatRes.data);
      setQueryResponse((prev) => ({ ...prev, [queryId]: "" }));
      setShowResponseForm((prev) => ({ ...prev, [queryId]: false }));
      toast({
        title: "Response Submitted",
        description: "Your response has been submitted successfully.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to submit response";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleSendQuery = async () => {
    if (!endorsementId) return;
    if (!newQueryDescription.trim() && newQueryAttachments.length === 0) {
      toast({
        title: "Message or Document Required",
        description: "Please enter a query message or attach a document.",
        variant: "destructive",
      });
      return;
    }

    try {
      setQuerySubmitting(true);
      await sendEndorsementQuery(endorsementId, {
        message: newQueryDescription.trim(),
        dueDate: new Date().toISOString().split("T")[0],
        files: newQueryAttachments,
      });

      const chatRes = await getEndorsementChatHistory(endorsementId, "true");
      setChatMessages(chatRes.data ?? []);
      setNewQueryDescription("");
      setNewQueryAttachments([]);
      if (queryAttachmentInputRef.current) {
        queryAttachmentInputRef.current.value = "";
      }
      toast({
        title: "Query Sent",
        description: `Your query has been sent successfully${newQueryAttachments.length > 0 ? ` with ${newQueryAttachments.length} attachment(s)` : ""}.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send query. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setQuerySubmitting(false);
    }
  };

  const handleQueryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const acceptedFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        acceptedFiles.push(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a PDF or image file.`,
          variant: "destructive",
        });
      }
    });
    if (acceptedFiles.length > 0) {
      setNewQueryAttachments((prev) => [...prev, ...acceptedFiles]);
    }
    event.target.value = "";
  };

  const removeQueryAttachment = (indexToRemove: number) => {
    setNewQueryAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const currentViewerRole: "broker" | "insurer" = isBroker ? "broker" : "insurer";
  const unreadIncomingMessageIds = useMemo(
    () =>
      chatMessages
        .filter((msg) => {
          if (msg.senderRole === currentViewerRole) return false;
          const readAt = currentViewerRole === "broker" ? msg.brokerReadAt : msg.insurerReadAt;
          return !readAt;
        })
        .map((msg) => msg.id)
        .filter((id) => !locallyReadMessageIds.has(id)),
    [chatMessages, currentViewerRole, locallyReadMessageIds]
  );
  const unreadIncomingCount = unreadIncomingMessageIds.length;
  const firstUnreadIncomingMessageId = unreadIncomingMessageIds[0] ?? null;
  const initialListUnreadCount = useMemo(() => {
    if (!endorsementId) return 0;
    const row = endorsements.find((e) => e.id === endorsementId);
    return Number(row?.unreadMessageCount || 0);
  }, [endorsementId, endorsements]);
  const floatingUnreadCount =
    chatMessages.length > 0 ? unreadIncomingCount : initialListUnreadCount;

  const markVisibleUnreadAsRead = useCallback(() => {
    if (unreadIncomingMessageIds.length === 0) return;
    setLocallyReadMessageIds((prev) => {
      const next = new Set(prev);
      unreadIncomingMessageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [unreadIncomingMessageIds]);

  const countUnreadForRole = useCallback(
    (messages: ChatMessage[]) =>
      messages.filter((msg) => {
        if (msg.senderRole === currentViewerRole) return false;
        const readAt = currentViewerRole === "broker" ? msg.brokerReadAt : msg.insurerReadAt;
        return !readAt;
      }).length,
    [currentViewerRole]
  );

  const syncServerReadStatusAtBottom = useCallback(async () => {
    if (!endorsementId || chatReadSyncingRef.current) return;
    chatReadSyncingRef.current = true;
    try {
      let attempts = 0;
      let previousUnread = Number.MAX_SAFE_INTEGER;
      let latestMessages = chatMessages;
      while (attempts < 20) {
        const res = await getEndorsementChatHistory(endorsementId, "true");
        latestMessages = res.data ?? [];
        const unread = countUnreadForRole(latestMessages);
        if (unread === 0) break;
        if (unread >= previousUnread) break;
        previousUnread = unread;
        attempts += 1;
      }
      setChatMessages(latestMessages);
    } catch (error) {
      console.error("Failed to sync chat read status:", error);
    } finally {
      chatReadSyncingRef.current = false;
    }
  }, [endorsementId, chatMessages, countUnreadForRole]);

  chatMarkVisibleRef.current = markVisibleUnreadAsRead;
  chatSyncReadAtBottomRef.current = syncServerReadStatusAtBottom;
  chatFirstUnreadIdRef.current = firstUnreadIncomingMessageId;

  const getEndorsementChatViewport = (): HTMLDivElement | null => {
    const root = chatScrollAreaRef.current;
    if (!root) return null;
    return root.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement | null;
  };

  useEffect(() => {
    if (!isChatExpanded) return;
    const viewport = getEndorsementChatViewport();
    if (!viewport) return;

    const onScroll = () => {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      if (distanceFromBottom <= 16) {
        chatMarkVisibleRef.current();
        void chatSyncReadAtBottomRef.current();
      }
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [isChatExpanded]);

  useEffect(() => {
    if (!isChatExpanded) {
      chatLastTailIdRef.current = null;
      return;
    }
    if (chatMessages.length === 0) return;

    const viewport = getEndorsementChatViewport();
    if (!viewport) return;

    const lastId = chatMessages[chatMessages.length - 1]?.id ?? "";
    const prevTail = chatLastTailIdRef.current;
    const isFirstContent = prevTail === null && Boolean(lastId);
    const isNewTailMessage = Boolean(lastId && prevTail !== null && lastId !== prevTail);

    const scrollToUnreadOrBottom = () => {
      const unreadId = chatFirstUnreadIdRef.current;
      if (unreadId) {
        const firstUnreadEl = viewport.querySelector(
          `[data-chat-message-id="${unreadId}"]`
        ) as HTMLDivElement | null;
        if (firstUnreadEl) {
          firstUnreadEl.scrollIntoView({ block: "center", behavior: "auto" });
          return;
        }
      }
      viewport.scrollTop = viewport.scrollHeight;
    };

    const run = () => {
      if (isFirstContent) {
        scrollToUnreadOrBottom();
        chatLastTailIdRef.current = lastId;
        return;
      }
      if (isNewTailMessage) {
        const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
        if (distanceFromBottom <= 80) {
          viewport.scrollTop = viewport.scrollHeight;
        }
        chatLastTailIdRef.current = lastId;
      }
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
    return () => cancelAnimationFrame(frame);
  }, [isChatExpanded, chatMessages.length, chatMessages[chatMessages.length - 1]?.id]);

  const getPreviousActiveEndorsement = useCallback(
    (currentId: string, policyNumber: string): EndorsementListRow | null => {
      const policyEndorsements = endorsements
        .filter((e) => e.policyNumber === policyNumber && e.id !== currentId)
        .sort((a, b) => {
          const aNum = parseInt(a.endorsementReference.replace(/\D/g, ""), 10) || 0;
          const bNum = parseInt(b.endorsementReference.replace(/\D/g, ""), 10) || 0;
          return bNum - aNum;
        });
      return policyEndorsements.find((e) => e.status === "Approved") || null;
    },
    [endorsements]
  );

  const hasFieldChanged = (
    fieldName: keyof Endorsement | keyof EndorsementListRow,
    currentValue: unknown,
    previousEndorsement: EndorsementListRow | null
  ): boolean => {
    if (!previousEndorsement) return false;
    const prev = previousEndorsement as unknown as Record<string, unknown>;
    return prev[fieldName] !== currentValue;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const newFiles: UploadedFileItem[] = [];
    Array.from(files).forEach((file) => {
      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        newFiles.push({ name: file.name, size: file.size, file });
      } else {
        toast({ title: "Invalid File Type", description: `${file.name} is not a PDF or image file.`, variant: "destructive" });
      }
    });
    setUploadedFilesForCurrentType((prev) => [...prev, ...newFiles]);
    event.target.value = "";
    toast({ title: "Files Uploaded", description: `${newFiles.length} file(s) uploaded successfully.` });
  };

  const buildCreateFormData = (
    payload: {
      policyId: string;
      type: string;
      effectiveDate: string;
      refundAmount?: number;
      cancellationDetails?: string;
      policyExpiryDate?: string;
      extensionDetails?: string;
    },
    files: { name: string; size: number; file?: File; fileId?: string }[]
  ): FormData => {
    const formData = new FormData();
    formData.append("policyId", payload.policyId);
    formData.append("type", payload.type);
    formData.append("effectiveDate", payload.effectiveDate);
    if (payload.refundAmount != null) formData.append("refundAmount", String(payload.refundAmount));
    if (payload.cancellationDetails != null) formData.append("cancellationDetails", payload.cancellationDetails);
    if (payload.policyExpiryDate != null) formData.append("policyExpiryDate", payload.policyExpiryDate);
    if (payload.extensionDetails != null) formData.append("extensionDetails", payload.extensionDetails);
    files.forEach((u) => {
      if (u.file) formData.append("supportingDocuments", u.file);
    });
    return formData;
  };

  const handleRemoveFile = async (index: number) => {
    const item = uploadedFiles[index];
    if (item?.fileId) {
      try {
        await deleteUploadedFile(item.fileId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to delete document";
        toast({ title: "Delete Failed", description: message, variant: "destructive" });
        return;
      }
    }
    setUploadedFilesForCurrentType((prev) => prev.filter((_, i) => i !== index));
  };

  const canPreviewDoc = (item: UploadedFileItem) => {
    if (item.file) {
      return item.file.type.startsWith("image/") || item.file.type === "application/pdf";
    }
    if (item.url) {
      const type = (item.contentType ?? "").toLowerCase();
      return type.startsWith("image/") || type === "application/pdf";
    }
    return false;
  };

  const openPreview = (item: UploadedFileItem) => {
    if (item.file) {
      const url = URL.createObjectURL(item.file);
      setPreviewDoc({
        url,
        name: item.name,
        contentType: item.file.type,
        isObjectUrl: true,
      });
    } else if (item.url) {
      setPreviewDoc({
        url: item.url,
        name: item.originalFilename ?? item.name,
        contentType: item.contentType,
        isObjectUrl: false,
      });
    }
  };

  const closePreview = () => {
    if (previewDoc?.isObjectUrl) {
      URL.revokeObjectURL(previewDoc.url);
    }
    setPreviewDoc(null);
  };

  const handleDownloadDocument = async (item: UploadedFileItem, fallbackId: string) => {
    if (!item.url) return;
    const downloadId = item.fileId ?? fallbackId;
    try {
      setDownloadingDocumentId(downloadId);
      const link = document.createElement("a");
      // Use direct navigation to signed URL to avoid CORS issues from fetch().
      link.href = item.url;
      link.download = item.originalFilename ?? item.name ?? "document";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to download document";
      toast({ title: "Download Failed", description: message, variant: "destructive" });
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  const currentApiEndorsementType =
    endorsementTypeCategory === "non-technical"
      ? "non_technical"
      : endorsementTypeCategory === "technical"
        ? "technical"
        : endorsementTypeCategory === "cancellation"
          ? "cancellation"
          : endorsementTypeCategory === "extensions"
            ? "extensions"
            : undefined;

  const handleSubmit = async () => {
    if (!selectedPolicyId) {
      toast({ title: "Policy Required", description: "Please select a policy from the list to create an endorsement.", variant: "destructive" });
      return;
    }
    if (!validateEffectiveDateOrToast(endorsement.effectiveDate, "Please fill in effective date.")) {
      return;
    }

    if (mode === "create" && endorsementTypeCategory === "cancellation") {
      const refund = (cancellationRefundAmount ?? "").trim() ? Number(cancellationRefundAmount) : undefined;
      const validRefund = refund != null && !Number.isNaN(refund) && refund >= 0 ? refund : undefined;
      setSubmitLoading(true);
      try {
        const formData = buildCreateFormData(
          {
            policyId: selectedPolicyId,
            type: "cancellation",
            effectiveDate: format(endorsement.effectiveDate!, "yyyy-MM-dd"),
            ...(validRefund != null ? { refundAmount: validRefund } : {}),
            ...((cancellationDetails || "").trim() ? { cancellationDetails: cancellationDetails.trim() } : {}),
          },
          uploadedFiles
        );
        const created = await createEndorsement(formData);
        toast({ title: "Endorsement Created", description: `Endorsement ${created.endorsementReference} has been created.` });
        onCreated();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create endorsement";
        toast({ title: "Create Failed", description: message, variant: "destructive" });
      } finally {
        setSubmitLoading(false);
      }
      return;
    }

    if (mode === "create" && endorsementTypeCategory === "extensions") {
      if (!validateExpiryDateOrToast(expiryDate)) {
        return;
      }
      setSubmitLoading(true);
      try {
        const formData = buildCreateFormData(
          {
            policyId: selectedPolicyId,
            type: "extensions",
            effectiveDate: format(endorsement.effectiveDate!, "yyyy-MM-dd"),
            policyExpiryDate: format(expiryDate, "yyyy-MM-dd"),
            ...((extensionDetails ?? "").trim() ? { extensionDetails: extensionDetails.trim() } : {}),
          },
          uploadedFiles
        );
        const created = await createEndorsement(formData);
        toast({ title: "Endorsement Created", description: `Endorsement ${created.endorsementReference} has been created.` });
        onCreated();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create endorsement";
        toast({ title: "Create Failed", description: message, variant: "destructive" });
      } finally {
        setSubmitLoading(false);
      }
      return;
    }

    if (mode === "create" && (endorsementTypeCategory === "non-technical" || endorsementTypeCategory === "technical")) {
      setSubmitLoading(true);
      try {
        const apiType =
          endorsementTypeCategory === "non-technical" ? "non_technical" : "technical";
        const formData = buildCreateFormData(
          {
            policyId: selectedPolicyId,
            type: apiType,
            effectiveDate: format(endorsement.effectiveDate!, "yyyy-MM-dd"),
          },
          uploadedFiles
        );
        const created = await createEndorsement(formData);
        toast({ title: "Endorsement Created", description: `Endorsement ${created.endorsementReference} has been created.` });
        onCreated();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create endorsement";
        toast({ title: "Create Failed", description: message, variant: "destructive" });
      } finally {
        setSubmitLoading(false);
      }
      return;
    }

    if (mode === "edit" && endorsementId) {
      if (!validateEffectiveDateOrToast(endorsement.effectiveDate, "Please fill in effective date.")) {
        return;
      }
      if (endorsementTypeCategory === "extensions") {
        if (!validateExpiryDateOrToast(expiryDate)) {
          return;
        }
      }
      setSubmitLoading(true);
      try {
        const apiType =
          endorsementTypeCategory === "cancellation"
            ? "cancellation"
            : endorsementTypeCategory === "technical"
              ? "technical"
              : endorsementTypeCategory === "extensions"
                ? "extensions"
                : "non_technical";
        const payload: {
          policyId: string;
          type: string;
          effectiveDate: string;
          refundAmount?: number;
          cancellationDetails?: string;
          policyExpiryDate?: string;
          extensionDetails?: string;
        } = {
          policyId: selectedPolicyId,
          type: apiType,
          effectiveDate: format(endorsement.effectiveDate, "yyyy-MM-dd"),
        };
        if (apiType === "cancellation") {
          const refund = (cancellationRefundAmount ?? "").trim() ? Number(cancellationRefundAmount) : undefined;
          if (refund != null && !Number.isNaN(refund) && refund >= 0) payload.refundAmount = refund;
          if ((cancellationDetails ?? "").trim()) payload.cancellationDetails = cancellationDetails!.trim();
        }
        if (apiType === "extensions") {
          if (expiryDate) payload.policyExpiryDate = format(expiryDate, "yyyy-MM-dd");
          if ((extensionDetails ?? "").trim()) payload.extensionDetails = extensionDetails!.trim();
        }
        // FormData for save: fields + only new files (items with .file). Already-uploaded docs stay on server; deleted ones were removed via DELETE API.
        const formData = buildCreateFormData(payload, uploadedFiles);
        await saveEndorsement(endorsementId, formData);
        toast({ title: "Endorsement Updated", description: "Your changes have been saved." });
        onCreated();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update endorsement";
        toast({ title: "Update Failed", description: message, variant: "destructive" });
      } finally {
        setSubmitLoading(false);
      }
      return;
    }

    const existingDraft = endorsements.find(
      (e) =>
        e.policyNumber === endorsement.policyNumber &&
        e.status === "Draft" &&
        e.id !== endorsementId
    );
    if (existingDraft) {
      toast({
        title: "Cannot Submit",
        description: "A draft endorsement already exists for this policy. Please complete or delete it first.",
        variant: "destructive",
      });
      return;
    }

    setEndorsement((prev) => (prev ? { ...prev, status: "Submitted" } : prev));
    toast({ title: "Endorsement Submitted", description: "Your endorsement request has been submitted for approval." });
    onCreated();
  };

  // Backend only allows changing status to APPROVED or REJECTED; Approved only from Draft/Submitted; Rejected not when already Approved.
  const currentStatus = endorsement.status || "Draft";
  const canSetToApproved = currentStatus === "Draft" || currentStatus === "Submitted";
  const canSetToRejected = currentStatus !== "Approved";
  const isExistingEndorsement = Boolean(endorsementId);
  const requiresSavedPremiumRecalcForApproval =
    !isBroker &&
    mode === "edit" &&
    isExistingEndorsement &&
    (
      endorsementTypeCategory === "technical" ||
      endorsementTypeCategory === "non-technical" ||
      endorsementTypeCategory === "cancellation" ||
      endorsementTypeCategory === "extensions"
    );
  const isApprovalBlockedByMissingPremiumRecalc =
    requiresSavedPremiumRecalcForApproval && !savedPremiumRecalcSnapshot;
  const canDownloadEndorsementLetter =
    mode !== "create" && (currentStatus === "Approved" || currentStatus === "Rejected");
  // Backend only allows save when status is DRAFT or SUBMITTED; disable Submit when Approved or Rejected
  const isSubmitDisabled =
    submitLoading || currentStatus === "Approved" || currentStatus === "Rejected";

  // Snapshot of endorsement details only (type, effectiveDate, policyId, policyExpiryDate, extensionDetails). Supporting documents are not considered.
  const currentFormSnapshot = useMemo(
    () => ({
      type:
        endorsementTypeCategory === "cancellation"
          ? "cancellation"
          : endorsementTypeCategory === "technical"
            ? "technical"
            : endorsementTypeCategory === "non-technical"
              ? "non_technical"
              : endorsementTypeCategory === "extensions"
                ? "extensions"
                : "",
      effectiveDate: endorsement.effectiveDate
        ? format(endorsement.effectiveDate, "yyyy-MM-dd")
        : null,
      policyId: selectedPolicyId,
      policyExpiryDate: expiryDate ? format(expiryDate, "yyyy-MM-dd") : null,
      extensionDetails: endorsementTypeCategory === "extensions" ? (extensionDetails ?? "") : null,
    }),
    [endorsementTypeCategory, endorsement.effectiveDate, selectedPolicyId, expiryDate, extensionDetails]
  );

  const hasUnsavedFormChanges =
    Boolean(endorsementId) &&
    Boolean(lastSavedFormSnapshotRef.current) &&
    (currentFormSnapshot.type !== lastSavedFormSnapshotRef.current!.type ||
      currentFormSnapshot.effectiveDate !== lastSavedFormSnapshotRef.current!.effectiveDate ||
      currentFormSnapshot.policyId !== lastSavedFormSnapshotRef.current!.policyId ||
      currentFormSnapshot.policyExpiryDate !== (lastSavedFormSnapshotRef.current!.policyExpiryDate ?? null) ||
      (currentFormSnapshot.extensionDetails ?? null) !== (lastSavedFormSnapshotRef.current!.extensionDetails ?? null));

  const applyStatusChange = async (newStatus: Status) => {
    if (!endorsementId) {
      setEndorsement((prev) => (prev ? { ...prev, status: newStatus } : prev));
      return;
    }
    // API only accepts Approved or Rejected
    if (newStatus === "Draft" || newStatus === "Submitted") {
      toast({
        title: "Status not allowed",
        description: "Status can only be changed to Approved or Rejected for an existing endorsement.",
        variant: "destructive",
      });
      return;
    }
    if (newStatus === "Approved" && !canSetToApproved) {
      toast({
        title: "Cannot approve",
        description: "Only Draft or Submitted endorsements can be approved.",
        variant: "destructive",
      });
      return;
    }
    if (newStatus === "Rejected" && !canSetToRejected) {
      toast({
        title: "Cannot reject",
        description: "An already approved endorsement cannot be rejected.",
        variant: "destructive",
      });
      return;
    }
    if (isApprovalBlockedByMissingPremiumRecalc) {
      toast({
        title: "Premium Recalculation Required",
        description: "Please calculate and save the premium recalculation before approving or rejecting this endorsement.",
        variant: "destructive",
      });
      return;
    }
    setStatusUpdating(true);
    try {
      const apiStatus = mapStatusToApiStatus(newStatus);
      const res = await updateEndorsementStatus(endorsementId, { status: apiStatus });
      setEndorsement((prev) =>
        prev
          ? {
            ...prev,
            status: mapApiStatusToStatus(res.status),
          }
          : prev
      );
      if (newStatus === "Approved") {
        toast({ title: "Endorsement Approved", description: "The endorsement has been approved successfully." });
      } else {
        toast({ title: "Endorsement Rejected", description: "The endorsement has been rejected.", variant: "destructive" });
      }
      onStatusUpdated?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update endorsement status";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleApprove = () => applyStatusChange("Approved");

  const handleReject = () => applyStatusChange("Rejected");

  const handleSaveRecalculatedPremium = async () => {
    if (!endorsementId) return;
    try {
      setPremiumRecalcSaving(true);
      await saveReCalculatedPremium(endorsementId, {
        originalPremium,
        revisedPremium,
        variation: premiumVariation,
        proRatedPremium,
        autoCalculatePremium: autoRecalculate,
        manualOverride,
        overridePremium: normalizedOverridePremium,
        totalEndorsementAmount: totalPayablePremium,
        endorsementFees: premiumRecalcFees.map((fee) => ({
          label: fee.label,
          adjustmentType: fee.adjustmentType,
          adjustmentValue: Number(fee.adjustmentValue || 0),
          amount: Number((fee.amount ?? fee.adjustmentValue) || 0),
          ...(fee.formula ? { formula: fee.formula } : {}),
        })),
        ...(endorsementTypeCategory === "extensions" ? { loading: extensionLoadingDiscount } : {}),
      });
      setSavedPremiumRecalcSnapshot(currentPremiumRecalcSnapshot);
      toast({
        title: "Saved",
        description: "Re-calculated premium has been saved.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save re-calculated premium";
      toast({
        title: "Save Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setPremiumRecalcSaving(false);
    }
  };

  const handleDownloadLetter = async () => {
    if (!endorsementId) {
      toast({
        title: "Endorsement Required",
        description: "Endorsement ID is required to download letter.",
        variant: "destructive",
      });
      return;
    }

    setDownloadLetterLoading(true);
    try {
      const calc = await calculateEndorsementPremium(endorsementId);
      const selectedPremium = (calc as { selectedPremium?: Record<string, unknown> })?.selectedPremium ?? {};
      const premiumSnapshot = (calc as { premiumSnapshot?: Record<string, unknown> })?.premiumSnapshot ?? {};
      const breakdown = (calc.breakdown ?? {}) as {
        originalPremium?: number;
        revisedPremium?: number;
      };

      const currency = String(
        selectedPremium.currency ??
        premiumSnapshot.currency ??
        "AED"
      );

      const basePremium = Number(
        selectedPremium.basePremium ??
        premiumSnapshot.basePremium ??
        breakdown.originalPremium ??
        0
      );
      const totalPremium = Number(
        selectedPremium.totalPremium ??
        premiumSnapshot.totalPremium ??
        breakdown.revisedPremium ??
        0
      );
      const loadingAmount = Number(
        selectedPremium.loadingAmount ??
        premiumSnapshot.loadingAmount ??
        0
      );
      const discountAmount = Number(
        selectedPremium.discountAmount ??
        premiumSnapshot.discountAmount ??
        0
      );
      const brokerCommissionAmount = Number(
        selectedPremium.brokerCommissionAmount ??
        premiumSnapshot.brokerCommissionAmount ??
        0
      );

      const payload = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cewSelectedItems: [],
        values: {
          basePremium: formatCurrency(basePremium, currency),
          totalPremium: formatCurrency(totalPremium, currency),
          subtotal: formatCurrency(totalPremium, currency),
          annualPremium: formatCurrency(totalPremium, currency),
          loading: formatCurrency(loadingAmount, currency),
          discount: formatCurrency(discountAmount, currency),
          vat: formatCurrency(0, currency),
          brokerCommission: formatCurrency(brokerCommissionAmount, currency),
          premiumBreakdown: "",
        },
      };

      const resp = await api.request<Blob>({
        url: `/endorsements/${encodeURIComponent(endorsementId)}/download-pdf/endorsement?includePremiumBreakdown=true`,
        method: "POST",
        data: payload,
        responseType: "blob",
        headers: { Accept: "application/pdf" },
      });

      const blob = resp.data as unknown as Blob;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const reference = endorsement.endorsementReference || "Endorsement";
      link.download = `Endorsement_Letter_${reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: "Endorsement letter PDF has been generated and downloaded.",
      });
    } catch (error: unknown) {
      let description = error instanceof Error ? error.message : "Failed to download endorsement letter PDF";
      try {
        const errorObj = error as { data?: unknown; response?: { data?: unknown } };
        const errorData = errorObj?.data || errorObj?.response?.data;
        if (errorData instanceof Blob) {
          const text = await errorData.text();
          const json = JSON.parse(text) as { message?: string };
          if (json.message) description = json.message;
        }
      } catch {
        // ignore parse errors
      }
      toast({
        title: "Download Failed",
        description,
        variant: "destructive",
      });
    } finally {
      setDownloadLetterLoading(false);
    }
  };

  if (isInitialPageLoading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>
            {detailLoading || policyContextLoading || policyEndorsementsLoading
              ? "Loading endorsement details..."
              : "Preparing endorsement details..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {detailLoading
                  ? "Loading..."
                  : mode === "create"
                    ? "Create New Endorsement"
                    : mode === "edit"
                      ? "Edit Endorsement"
                      : "View Endorsement"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Manage policy endorsements and modifications</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {endorsement.policyNumber && (
              <Badge variant="outline" className="text-sm">
                Policy: {endorsement.policyNumber}
              </Badge>
            )}
            {endorsement.status && getStatusBadge(endorsement.status)}
            {shouldShowCreateNewEndorsementButton && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (!selectedPolicyId) return;
                  navigate(
                    `${endorsementsBasePath}/endorsements/create?policyId=${encodeURIComponent(selectedPolicyId)}`
                  );
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Endorsement
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full px-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Endorsement Details</CardTitle>
              <CardDescription>Basic information about the endorsement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number <span className="text-destructive">*</span></Label>
                  {mode === "edit" || mode === "view" ? (
                    <Input
                      id="policyNumber"
                      value={resolvingPolicyNumber ? "" : (endorsement.policyNumber ?? "")}
                      readOnly
                      className="bg-muted"
                    />
                  ) : (
                    <Popover
                      open={policySearchOpen}
                      onOpenChange={(open) => {
                        setPolicySearchOpen(open);
                        if (open) setPolicySearchLoading(true);
                        if (!open) setPolicySearchQuery("");
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          id="policyNumber"
                          variant="outline"
                          role="combobox"
                          aria-expanded={policySearchOpen}
                          className={cn("w-full justify-between font-normal", !endorsement.policyNumber && "text-muted-foreground")}
                          disabled={resolvingPolicyNumber}
                        >
                          <span className="truncate">{resolvingPolicyNumber ? "Loading policy..." : (endorsement.policyNumber || "Search policy number...")}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Type to search policies..."
                            value={policySearchQuery}
                            onValueChange={setPolicySearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {policySearchLoading ? (
                                <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Loading policies...</span>
                                </div>
                              ) : policySearchQuery.trim() ? (
                                "No policies found."
                              ) : (
                                "Type to search policies."
                              )}
                            </CommandEmpty>
                            <CommandGroup>
                              {policySearchResults.map((p) => {
                                const raw = p as unknown as Record<string, unknown>;
                                const policyNumber =
                                  (raw.policyNumber as string) ??
                                  (raw.policy_number as string) ??
                                  (raw.policy_id as string) ??
                                  String(p.id);
                                const secondary = (raw.projectName || raw.client_name || raw.customerName || "") as string;
                                return (
                                  <CommandItem
                                    key={p.id}
                                    value={String(p.id)}
                                    onSelect={() => {
                                      setEndorsement((prev) => (prev ? { ...prev, policyNumber, effectiveDate: null } : prev));
                                      setSelectedPolicyId(String(p.id));
                                      setPolicySearchOpen(false);
                                      setPolicySearchQuery("");
                                    }}
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-medium">{policyNumber}</span>
                                      {secondary ? <span className="text-xs text-muted-foreground truncate">{secondary}</span> : null}
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {mode !== "create" && (
                  <div className="space-y-2">
                    <Label htmlFor="endorsementReference">Endorsement Reference</Label>
                    <Input
                      id="endorsementReference"
                      value={endorsement.endorsementReference ?? ""}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="endorsementTypeCategory">Endorsement Type <span className="text-destructive">*</span></Label>
                  {(!isBroker || isBrokerViewMode) ? (
                    <Input
                      id="endorsementTypeCategory"
                      value={
                        endorsementTypeCategory === "non-technical"
                          ? "Non-financial endorsement"
                          : endorsementTypeCategory === "technical"
                            ? "Financial endorsement"
                            : endorsementTypeCategory === "cancellation"
                              ? "Cancellation"
                              : endorsementTypeCategory === "extensions"
                                ? "Extension"
                                : ""
                      }
                      readOnly
                      className="bg-muted"
                    />
                  ) : (
                    <Select
                      value={endorsementTypeCategory}
                      onValueChange={(value) => {
                        const newType = value as "non-technical" | "technical" | "cancellation" | "extensions" | "";
                        if (newType === "extensions") {
                          setCancellationDetails("");
                          setCancellationRefundAmount("");
                          setCancellationUploadedFiles([]);
                        } else if (newType === "cancellation") {
                          setExtensionDetails("");
                          setExpiryDate(null);
                          setExtensionUploadedFiles([]);
                        }
                        setEndorsementTypeCategory(newType);
                      }}
                    >
                      <SelectTrigger id="endorsementTypeCategory">
                        <SelectValue placeholder="Select endorsement type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non-technical">Non-financial endorsement</SelectItem>
                        <SelectItem value="technical">Financial endorsement</SelectItem>
                        <SelectItem value="cancellation">Cancellation</SelectItem>
                        <SelectItem value="extensions">Extension</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Effective Date <span className="text-destructive">*</span></Label>
                  {(!isBroker || isBrokerViewMode) ? (
                    <Input
                      id="effectiveDate"
                      value={endorsement.effectiveDate ? format(endorsement.effectiveDate, "dd-MM-yyyy") : ""}
                      readOnly
                      className="bg-muted"
                    />
                  ) : (
                    <DatePickerWithDropdown
                      value={endorsement.effectiveDate || null}
                      onChange={(date) => {
                        setEndorsement((prev) => (prev ? { ...prev, effectiveDate: date || null } : prev));
                      }}
                      disabled={!selectedPolicyId || !policyStartDateForEffective || !policyEndDateForEffective}
                      fromDate={policyStartDateForEffective ?? undefined}
                      toDate={policyEndDateForEffective ?? undefined}
                      fromYear={(policyStartDateForEffective ?? new Date()).getFullYear() - 1}
                      toYear={(policyEndDateForEffective ?? new Date(new Date().getFullYear() + 5, 0, 1)).getFullYear()}
                      placeholder="Pick a date"
                    />
                  )}
                </div>

              </div>
              {((endorsementTypeCategory === "technical" || endorsementTypeCategory === "non-technical" || endorsementTypeCategory === "cancellation") || (endorsementTypeCategory === "extensions" && !isBroker)) && (
                <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-2">
                  {isBroker ? (
                    <>
                      {!isBrokerViewMode && (endorsementTypeCategory === "technical" || endorsementTypeCategory === "non-technical") && (
                        <Button
                          variant={`${!hasUnsavedFormChanges ? "default" : "outline"}`}
                          onClick={async () => {
                            const policyId = selectedPolicyId ?? endorsement.policyNumber;
                            if (!policyId) {
                              toast({
                                title: "Policy Required",
                                description: "Please select a policy to view the endorsement proposal form.",
                                variant: "destructive",
                              });
                              return;
                            }
                            if (endorsementId) {
                              navigate(`${endorsementsBasePath}/endorsements/proposal/${encodeURIComponent(endorsementId)}`, {
                                state: { endorsementType: currentApiEndorsementType },
                              });
                              return;
                            }
                            if (mode === "create") {
                              if (!validateEffectiveDateOrToast(endorsement.effectiveDate, "Please set effective date before opening the proposal form.")) {
                                return;
                              }
                              try {
                                const apiType =
                                  endorsementTypeCategory === "non-technical"
                                    ? "non_technical"
                                    : endorsementTypeCategory === "technical"
                                      ? "technical"
                                      : "non_technical";
                                const formData = buildCreateFormData(
                                  {
                                    policyId,
                                    type: apiType,
                                    effectiveDate: format(endorsement.effectiveDate, "yyyy-MM-dd"),
                                  },
                                  uploadedFiles
                                );
                                const created = await createEndorsement(formData);
                                navigate(`${endorsementsBasePath}/endorsements/proposal/${encodeURIComponent(created.endorsementId)}`, {
                                  state: { endorsementType: apiType },
                                });
                              } catch (err: unknown) {
                                const message = err instanceof Error ? err.message : "Failed to create endorsement";
                                toast({ title: "Error", description: message, variant: "destructive" });
                              }
                            }
                          }}
                          disabled={
                            (!selectedPolicyId && !endorsement.policyNumber) || (Boolean(endorsementId) && hasUnsavedFormChanges)
                          }
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Proposal Form
                        </Button>
                      )}
                      {endorsementId && !isBrokerViewMode && (endorsementTypeCategory === "technical" || endorsementTypeCategory === "non-technical") && (
                        <Button
                          variant={`${hasUnsavedFormChanges ? "default" : "outline"}`}
                          onClick={async () => {
                            if (!validateEffectiveDateOrToast(endorsement.effectiveDate, "Please set effective date before saving.")) {
                              return;
                            }
                            setSaveFormLoading(true);
                            try {
                              const apiType =
                                endorsementTypeCategory === "non-technical"
                                  ? "non_technical"
                                  : endorsementTypeCategory === "technical"
                                    ? "technical"
                                    : "non_technical";
                              const payload: {
                                policyId: string;
                                type: string;
                                effectiveDate: string;
                                refundAmount?: number;
                                cancellationDetails?: string;
                              } = {
                                policyId: selectedPolicyId!,
                                type: apiType,
                                effectiveDate: format(endorsement.effectiveDate, "yyyy-MM-dd"),
                              };
                              const formData = buildCreateFormData(payload, uploadedFiles);
                              await saveEndorsement(endorsementId, formData);
                              toast({ title: "Saved", description: "Your changes have been saved. You can now view the proposal form." });
                              // Refetch endorsement by ID to prefill form with latest data (stay on page, no redirect)
                              const res = await getEndorsementById(endorsementId);
                              const raw = res as unknown as { data?: EndorsementDetailResponse } & EndorsementDetailResponse;
                              const d: EndorsementDetailResponse = raw.data ?? raw;
                              setSelectedPolicyId(d.policyId);
                              setEndorsementTypeCategory(
                                d.type === "cancellation"
                                  ? "cancellation"
                                  : d.type === "technical"
                                    ? "technical"
                                    : d.type === "non_technical"
                                      ? "non-technical"
                                      : d.type === "extensions"
                                        ? "extensions"
                                        : "",
                              );
                              setExpiryDate(d.policyExpiryDate ? new Date(d.policyExpiryDate) : null);
                              setExtensionDetails((d as { extensionDetails?: string }).extensionDetails ?? "");
                              const refundFromApiSource =
                                d.type === "cancellation" && d.recalculationDetails?.totalEndorsementAmount != null
                                  ? d.recalculationDetails.totalEndorsementAmount
                                  : d.refundAmount;
                              const refundFromApi = refundFromApiSource != null && !Number.isNaN(Number(refundFromApiSource))
                                ? String(refundFromApiSource)
                                : "";
                              setCancellationRefundAmount(refundFromApi);
                              setCancellationDetails(d.cancellationDetails ?? "");
                              let policyNumberDisplay = d.policyId;
                              try {
                                const policy = await getPolicyById(d.policyId);
                                const policyRaw = policy as unknown as Record<string, unknown>;
                                policyNumberDisplay =
                                  (policyRaw.policyNumber as string) ??
                                  (policyRaw.policy_number as string) ??
                                  (policyRaw.policy_id as string) ??
                                  String(policy.id);
                              } catch {
                                // keep policyId as fallback
                              }
                              setEndorsement({
                                endorsementReference: d.endorsementReference,
                                policyNumber: policyNumberDisplay,
                                effectiveDate: d.effectiveDate ? new Date(d.effectiveDate) : null,
                                status: mapApiStatusToStatus(d.status ?? ""),
                                endorsementType: mapApiTypeToDisplay(d.type) as Endorsement["endorsementType"],
                              });
                              const docsByType = mapSupportingDocsByType(d.supportingDocuments);
                              setCancellationUploadedFiles(docsByType.cancellation);
                              setExtensionUploadedFiles(docsByType.extensions);
                              setTechnicalSupportingDocsFromDetail(d);
                              lastSavedFormSnapshotRef.current = {
                                type: d.type ?? "",
                                effectiveDate: d.effectiveDate ?? null,
                                policyId: d.policyId ?? null,
                                policyExpiryDate: d.policyExpiryDate ?? null,
                                extensionDetails: (d as { extensionDetails?: string }).extensionDetails ?? null,
                              };
                            } catch (err: unknown) {
                              const message = err instanceof Error ? err.message : "Failed to save endorsement";
                              toast({ title: "Save Failed", description: message, variant: "destructive" });
                            } finally {
                              setSaveFormLoading(false);
                            }
                          }}
                          disabled={!hasUnsavedFormChanges || saveFormLoading}
                          className="gap-2"
                        >
                          {saveFormLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          Save
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      {(endorsementTypeCategory === "technical" || endorsementTypeCategory === "non-technical") && (
                        <Button
                          variant="default"
                          onClick={async () => {
                            const policyId = selectedPolicyId ?? endorsement.policyNumber;
                            if (!policyId) {
                              toast({
                                title: "Policy Required",
                                description: "Please select a policy to view changes.",
                                variant: "destructive",
                              });
                              return;
                            }
                            let idToUse = endorsementId;
                            if (!idToUse && mode === "create" && endorsement.effectiveDate) {
                              const policyIdToUse = selectedPolicyId ?? endorsement.policyNumber;
                              const apiType =
                                endorsementTypeCategory === "non-technical"
                                  ? "non_technical"
                                  : endorsementTypeCategory === "technical"
                                    ? "technical"
                                    : endorsementTypeCategory === "cancellation"
                                      ? "cancellation"
                                      : endorsementTypeCategory === "extensions"
                                        ? "extensions"
                                        : "non_technical";
                              try {
                                const payload: {
                                  policyId: string;
                                  type: string;
                                  effectiveDate: string;
                                  policyExpiryDate?: string;
                                  extensionDetails?: string;
                                } = {
                                  policyId: policyIdToUse,
                                  type: apiType,
                                  effectiveDate: format(endorsement.effectiveDate, "yyyy-MM-dd"),
                                };
                                if (apiType === "extensions") {
                                  if (!validateExpiryDateOrToast(expiryDate)) {
                                    return;
                                  }
                                  payload.policyExpiryDate = format(expiryDate, "yyyy-MM-dd");
                                  if ((extensionDetails ?? "").trim()) payload.extensionDetails = extensionDetails.trim();
                                }
                                const formData = buildCreateFormData(payload, uploadedFiles);
                                const created = await createEndorsement(formData);
                                idToUse = created.endorsementId;
                              } catch (err: unknown) {
                                const message = err instanceof Error ? err.message : "Failed to create endorsement";
                                toast({ title: "Error", description: message, variant: "destructive" });
                                return;
                              }
                            }
                            if (!idToUse) return;
                            try {
                              setDifferencesLoading(true);
                              setIsDifferencesDialogOpen(true);
                              const data = await getEndorsementDifference(idToUse);
                              setDifferencesData(data);
                            } catch (err: unknown) {
                              const message = err instanceof Error ? err.message : "Failed to load endorsement differences.";
                              toast({ title: "Error", description: message, variant: "destructive" });
                              setIsDifferencesDialogOpen(false);
                            } finally {
                              setDifferencesLoading(false);
                            }
                          }}
                          disabled={(!selectedPolicyId && !endorsement.policyNumber) || (Boolean(endorsementId) && hasUnsavedFormChanges)}
                          className="gap-2"
                        >
                          {differencesLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileDiff className="w-4 h-4" />
                          )}
                          View Changes
                        </Button>
                      )}
                      {endorsementId && selectedPolicyId && (
                        <Button
                          variant="outline"
                          disabled={premiumRecalcLoading || isRecalcButtonLockedByStatus}
                          onClick={async () => {
                            if (!endorsementId) return;
                            try {
                              setPremiumRecalcLoading(true);
                              if (
                                !isBroker &&
                                mode === "edit" &&
                                endorsementTypeCategory === "extensions"
                              ) {
                                try {
                                  const detailRes = await getEndorsementById(endorsementId);
                                  const rawDetail = detailRes as unknown as { data?: EndorsementDetailResponse } & EndorsementDetailResponse;
                                  const detail = rawDetail.data ?? rawDetail;
                                  const prefetchedLoading = Number(detail.recalculationDetails?.loading || 0);
                                  setExtensionLoadingDiscountInput(prefetchedLoading !== 0 ? String(prefetchedLoading) : "");
                                } catch {
                                  // Keep current loading value if detail prefill fails.
                                }
                              }
                              const res = await calculateEndorsementPremium(endorsementId);
                              const b = res?.breakdown;
                              if (b) {
                                const snapshot = (res as { premiumSnapshot?: Record<string, unknown> })?.premiumSnapshot;
                                applyPremiumRecalculation(b, snapshot);
                              }
                              setShowPremiumRecalcCard(true);
                              toast({ title: "Success", description: "Premium recalculated." });
                            } catch (err: unknown) {
                              const message = err instanceof Error ? err.message : "Failed to recalculate premium";
                              toast({ title: "Error", description: message, variant: "destructive" });
                            } finally {
                              setPremiumRecalcLoading(false);
                            }
                          }}
                          className="gap-2"
                        >
                          {premiumRecalcLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Calculate
                        </Button>
                      )}
                    </>
                  )}
                  {endorsementId &&
                    (endorsementTypeCategory === "technical" || endorsementTypeCategory === "non-technical") &&
                    (!isBroker || isBrokerViewMode || endorsement.status === "Draft") && (
                      <Button
                        variant="outline"
                        onClick={async () => {
                          await fetchTechnicalSupportingDocs();
                        }}
                        disabled={supportingDocsLoading}
                        className="ml-auto gap-2 w-[300px]"
                      >
                        {supportingDocsLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        View Supporting Document
                      </Button>
                    )}
                </div>
              )}
            </CardContent>
          </Card>

          {shouldShowPremiumRecalcCard && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Premium Recalculation</CardTitle>
                    <CardDescription>Original premium, revised premium, variation, and pro-rated premium</CardDescription>
                  </div>
                  {!isPremiumRecalcReadOnly && (
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="autoRecalculate"
                        className={cn("text-sm font-normal", !isPremiumRecalcReadOnly && "cursor-pointer")}
                      >
                        Auto Recalculate
                      </Label>
                      <Switch
                        id="autoRecalculate"
                        checked={autoRecalculate}
                        disabled={isPremiumRecalcReadOnly || isApprovedEditLock}
                        onCheckedChange={(checked) => {
                          setAutoRecalculate(checked);
                          if (checked) {
                            setManualOverride(false);
                            setOverridePremiumInput("");
                            if (endorsementId) {
                              void (async () => {
                                try {
                                  setPremiumRecalcLoading(true);
                                  const res = await calculateEndorsementPremium(endorsementId);
                                  const b = res?.breakdown;
                                  if (b) {
                                    const snapshot = (res as { premiumSnapshot?: Record<string, unknown> })?.premiumSnapshot;
                                    applyPremiumRecalculation(b, snapshot);
                                  }
                                } catch (err: unknown) {
                                  const message =
                                    err instanceof Error ? err.message : "Failed to recalculate premium";
                                  toast({ title: "Error", description: message, variant: "destructive" });
                                } finally {
                                  setPremiumRecalcLoading(false);
                                }
                              })();
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isBrokerViewMode ? (
                    <div className="rounded-lg border bg-muted/20">
                      <div className="space-y-1 p-4">
                        {endorsementTypeCategory === "extensions" && (
                          <div className="flex items-center justify-between gap-4 py-2 text-sm">
                            <span className="text-muted-foreground">{`Loading/Discount (${premiumCurrencyLabel})`}</span>
                            <span className={getPremiumSummaryValueClassName(extensionLoadingDiscount)}>
                              {formatPremiumSummaryValue(extensionLoadingDiscount, { signed: true })}
                            </span>
                          </div>
                        )}
                        <div className={`flex items-center justify-between gap-4 ${!isBrokerApprovedView ? "border-t pt-3 mt-3" : ""}`}>
                          <span className="text-sm font-semibold">
                            {endorsementTypeCategory === "cancellation"
                              ? `Refund Amount (${premiumCurrencyLabel})`
                              : `Endorsement Payable Premium (${premiumCurrencyLabel})`}
                          </span>
                          <span
                            className={getPremiumSummaryValueClassName(
                              endorsementTypeCategory === "cancellation"
                                ? displayedCancellationRefundAmount
                                : totalPayablePremium,
                              true
                            )}
                          >
                            {formatPremiumSummaryValue(
                              endorsementTypeCategory === "cancellation"
                                ? displayedCancellationRefundAmount
                                : totalPayablePremium,
                              { signed: false }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-muted/20">
                      <div className="space-y-1 p-4">
                        <div className="flex items-center justify-between gap-4 py-2 text-sm">
                          <span className="text-muted-foreground">{`Original Premium (${premiumCurrencyLabel})`}</span>
                          <span className="tabular-nums whitespace-nowrap text-right">
                            {formatPremiumSummaryValue(originalPremium)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 py-2 text-sm">
                          <span className="text-muted-foreground">{`Revised Premium (${premiumCurrencyLabel})`}</span>
                          <span className="tabular-nums whitespace-nowrap text-right">
                            {formatPremiumSummaryValue(revisedPremium)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 py-2 text-sm">
                          <span className="text-muted-foreground">{`Premium Variation (${premiumCurrencyLabel})`}</span>
                          <span className={getPremiumSummaryValueClassName(premiumVariation)}>
                            {formatPremiumSummaryValue(premiumVariation, { signed: true })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 py-2 text-sm">
                          <span className="text-muted-foreground">{`Pro-Rated Premium (${premiumCurrencyLabel})`}</span>
                          <span className="tabular-nums whitespace-nowrap text-right">
                            {formatPremiumSummaryValue(proRatedPremium)}
                          </span>
                        </div>
                        {premiumRecalcFees.map((fee, idx) => {
                          const feeValue =
                            String(fee.adjustmentType || "").toUpperCase() === "PERCENTAGE"
                              ? Number(fee.amount || 0)
                              : Number(fee.adjustmentValue || 0);

                          return (
                            <div className="flex items-center justify-between gap-4 py-2 text-sm" key={`${fee.label}-${idx}`}>
                              <span className="text-muted-foreground">
                                {String(fee.adjustmentType || "").toUpperCase() === "PERCENTAGE"
                                  ? `${fee.label} (${Number(fee.adjustmentValue || 0).toFixed(2).replace(/\.00$/, "")}%)`
                                  : `${fee.label} (${premiumCurrencyLabel})`}
                              </span>
                              <span className={getPremiumSummaryValueClassName(feeValue)}>
                                {formatPremiumSummaryValue(feeValue, { signed: true })}
                              </span>
                            </div>
                          );
                        })}
                        {endorsementTypeCategory === "extensions" && (
                          <div className="space-y-2 py-2">
                            <Label htmlFor="extensionLoadingDiscount">{`Loading/Discount (${premiumCurrencyLabel})`}</Label>
                            <Input
                              ref={extensionLoadingInputRef}
                              id="extensionLoadingDiscount"
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              value={formatPremiumInputThousandsDisplay(extensionLoadingDiscountInput)}
                              onKeyDown={(e) => {
                                if (e.key === "-") {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                if (isPremiumRecalcReadOnly || isApprovedEditLock) return;
                                const input = e.target as HTMLInputElement;
                                const sig = significantCharsBeforeCursor(
                                  input.value,
                                  input.selectionStart ?? 0
                                );
                                const normalized = input.value.replace(/,/g, "");
                                if (isNonNegativePremiumAmountInputValue(normalized)) {
                                  extensionLoadingCaretSigRef.current = sig;
                                  setExtensionLoadingDiscountInput(normalized);
                                }
                              }}
                              placeholder="Enter loading or discount amount"
                              readOnly={isPremiumRecalcReadOnly || isApprovedEditLock}
                              className={cn(
                                "tabular-nums",
                                (isPremiumRecalcReadOnly || isApprovedEditLock) && "bg-muted"
                              )}
                            />
                            <div className="flex items-center justify-between gap-4 text-sm">
                              <span className="text-muted-foreground">Applied Loading/Discount</span>
                              <span className={getPremiumSummaryValueClassName(extensionLoadingDiscount)}>
                                {formatPremiumSummaryValue(extensionLoadingDiscount, { signed: true })}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="mt-3 space-y-3 border-t pt-3">
                          {manualOverride && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="overridePremiumInput">{`Override Premium (${premiumCurrencyLabel})`}</Label>
                                <Input
                                  ref={overridePremiumInputRef}
                                  id="overridePremiumInput"
                                  type="text"
                                  inputMode="decimal"
                                  autoComplete="off"
                                  value={formatPremiumInputThousandsDisplay(overridePremiumInput)}
                                  onChange={(e) => {
                                    if (isPremiumRecalcReadOnly || isApprovedEditLock) return;
                                    const input = e.target as HTMLInputElement;
                                    const sig = significantCharsBeforeCursor(
                                      input.value,
                                      input.selectionStart ?? 0
                                    );
                                    const normalized = input.value.replace(/,/g, "");
                                    if (isPremiumAmountInputValue(normalized)) {
                                      overridePremiumCaretSigRef.current = sig;
                                      setOverridePremiumInput(normalized);
                                    }
                                  }}
                                  placeholder="Enter override premium"
                                  readOnly={isPremiumRecalcReadOnly || isApprovedEditLock}
                                  className={cn(
                                    "tabular-nums",
                                    (isPremiumRecalcReadOnly || isApprovedEditLock) && "bg-muted"
                                  )}
                                />
                              </div>
                              <div className="flex items-center justify-between gap-4 py-2 text-sm">
                                <span className="text-muted-foreground">{`Manual Override (${premiumCurrencyLabel})`}</span>
                                <span className={getPremiumSummaryValueClassName(normalizedOverridePremium)}>
                                  {formatPremiumSummaryValue(normalizedOverridePremium, { signed: true })}
                                </span>
                              </div>
                            </>
                          )}
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-semibold">
                              {endorsementTypeCategory === "cancellation"
                                ? `Refund Amount (${premiumCurrencyLabel})`
                                : `Endorsement Payable Premium (${premiumCurrencyLabel})`}
                            </span>
                            <span
                              className={getPremiumSummaryValueClassName(
                                endorsementTypeCategory === "cancellation"
                                  ? displayedCancellationRefundAmount
                                  : totalPayablePremium,
                                true
                              )}
                            >
                              {formatPremiumSummaryValue(
                                endorsementTypeCategory === "cancellation"
                                  ? displayedCancellationRefundAmount
                                  : totalPayablePremium,
                                { signed: false }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isPremiumRecalcReadOnly && (
                    <>
                      <div className="flex items-center gap-2 pt-4 border-t">
                        <Label htmlFor="manualOverride" className="text-sm font-normal cursor-pointer">
                          Manual Override
                        </Label>
                        <Switch
                          id="manualOverride"
                          checked={manualOverride}
                          disabled={isApprovedEditLock}
                          onCheckedChange={(checked) => {
                            setManualOverride(checked);
                            setAutoRecalculate(!checked);
                            if (!checked) {
                              setOverridePremiumInput("");
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">(if required)</span>
                      </div>

                      {!isApprovedEditLock && (
                        <div className="flex justify-end pt-2">
                          <Button
                            onClick={handleSaveRecalculatedPremium}
                            disabled={premiumRecalcSaving || !hasUnsavedPremiumRecalcChanges}
                            className="gap-2"
                          >
                            {premiumRecalcSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            Save
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {endorsementTypeCategory === "extensions" && (
            <Card>
              <CardHeader>
                <CardTitle>Extension Details</CardTitle>
                <CardDescription>
                  {isBroker ? "Enter extension information" : "Extension information"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Extended Expiry Date <span className="text-destructive">*</span></Label>
                    {(!isBroker || isBrokerViewMode) ? (
                      <Input
                        id="expiryDate"
                        value={expiryDate ? format(expiryDate, "dd-MM-yyyy") : ""}
                        readOnly
                        className="bg-muted"
                      />
                    ) : (
                      <>
                        {policyEndDateForExtension == null && selectedPolicyId && (
                          <p className="text-xs text-muted-foreground">Loading policy end date to restrict expiry range…</p>
                        )}
                        <DatePickerWithDropdown
                          value={expiryDate}
                          onChange={setExpiryDate}
                          disabled={!selectedPolicyId || !policyEndDateForExtension}
                          fromDate={
                            policyEndDateForExtension ? addDays(policyEndDateForExtension, 1) : undefined
                          }
                          toDate={
                            policyEndDateForExtension
                              ? addDays(addMonths(policyEndDateForExtension, 6), 1)
                              : undefined
                          }
                          fromYear={
                            (policyEndDateForExtension ?? new Date()).getFullYear()
                          }
                          toYear={
                            (
                              policyEndDateForExtension
                                ? addMonths(policyEndDateForExtension, 6)
                                : new Date(new Date().getFullYear() + 1, 0, 1)
                            ).getFullYear()
                          }
                          placeholder="Pick a date"
                        />
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="extensionDetails">Other Important Details</Label>
                    {(!isBroker || isBrokerViewMode) ? (
                      <div className="rounded-md border bg-muted/50 p-3 text-sm min-h-[80px] whitespace-pre-wrap">
                        {extensionDetails || "—"}
                      </div>
                    ) : (
                      <Textarea
                        id="extensionDetails"
                        value={extensionDetails}
                        onChange={(e) => setExtensionDetails(e.target.value)}
                        placeholder="Enter important details for the extension (e.g., reason, terms, etc.)"
                        className="min-h-[120px]"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {endorsementTypeCategory === "cancellation" && (
            <Card>
              <CardHeader>
                <CardTitle>Cancellation Details</CardTitle>
                <CardDescription>
                  {isBroker ? "Enter cancellation information" : "Cancellation information"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cancellationDetails">Other Important Details</Label>
                    {(!isBroker || isBrokerViewMode) ? (
                      <div className="rounded-md border bg-muted/50 p-3 text-sm min-h-[80px] whitespace-pre-wrap">
                        {cancellationDetails || "—"}
                      </div>
                    ) : (
                      <Textarea
                        id="cancellationDetails"
                        value={cancellationDetails}
                        onChange={(e) => setCancellationDetails(e.target.value)}
                        placeholder="Enter important details for cancellation (e.g., reason, cancellation terms, etc.)"
                        className="min-h-[120px]"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(endorsementTypeCategory === "cancellation" || endorsementTypeCategory === "extensions") && !isBrokerViewMode && (
            <Card>
              <CardHeader>
                <CardTitle>Supporting Documents</CardTitle>
                <CardDescription>Upload PDF or image files to support this endorsement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="fileUpload" className="cursor-pointer">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Documents
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="fileUpload"
                      type="file"
                      multiple
                      accept=".pdf,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground">PDF and image files allowed</p>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Files</Label>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => {
                          const displayName = file.originalFilename ?? file.name;
                          const sizeKb = file.sizeBytes
                            ? (Number(file.sizeBytes) / 1024).toFixed(2)
                            : (file.size / 1024).toFixed(2);
                          const showView = canPreviewDoc(file);
                          return (
                            <div
                              key={file.fileId ?? index}
                              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate" title={displayName}>
                                    {displayName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{sizeKb} KB</p>
                                  {file.contentType && (
                                    <p className="text-xs text-muted-foreground">{file.contentType}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-0 shrink-0">
                                {showView && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openPreview(file)}
                                    title="View document"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveFile(index)}
                                  title="Remove document"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Broker view mode: read-only list of supporting documents (no upload) */}
          {(endorsementTypeCategory === "cancellation" || endorsementTypeCategory === "extensions") && isBrokerViewMode && uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Supporting Documents</CardTitle>
                <CardDescription>Documents attached to this endorsement (view only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => {
                    const displayName = file.originalFilename ?? file.name;
                    const sizeKb = file.sizeBytes
                      ? (Number(file.sizeBytes) / 1024).toFixed(2)
                      : (file.size / 1024).toFixed(2);
                    const showView = canPreviewDoc(file);
                    return (
                      <div
                        key={file.fileId ?? index}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" title={displayName}>
                              {displayName}
                            </p>
                            <p className="text-xs text-muted-foreground">{sizeKb} KB</p>
                          </div>
                        </div>
                        {showView && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openPreview(file)}
                            title="View document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={!!previewDoc} onOpenChange={(open) => !open && closePreview()}>
            <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle className="truncate pr-8">{previewDoc?.name ?? "Document"}</DialogTitle>
              </DialogHeader>
              {previewDoc &&
                (previewDoc.contentType?.startsWith("image/") ? (
                  <div className="w-full flex-1 flex items-center justify-center bg-muted min-h-0">
                    <img
                      src={previewDoc.url}
                      alt={previewDoc.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <iframe
                    src={previewDoc.url}
                    className="w-full flex-1 min-h-0 border-0"
                    title="Document Preview"
                  />
                ))}
            </DialogContent>
          </Dialog>

          <Dialog open={showSupportingDocs} onOpenChange={setShowSupportingDocs}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle>Supporting Documents</DialogTitle>
                <DialogDescription>Required and additional documents for this endorsement</DialogDescription>
              </DialogHeader>
              {supportingDocsLoading ? (
                <div className="py-10 flex items-center justify-center text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading supporting documents...
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto pr-1">
                  <div className="space-y-2">
                    <Label>Required Documents</Label>
                    {requiredSupportingDocs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No required documents found.</p>
                    ) : (
                      <div className="space-y-2">
                        {requiredSupportingDocs.map((file, index) => {
                          const displayName = file.originalFilename ?? file.name;
                          const rowId = file.fileId ?? `${displayName}-${index}`;
                          const sizeKb = file.sizeBytes
                            ? (Number(file.sizeBytes) / 1024).toFixed(2)
                            : (file.size / 1024).toFixed(2);
                          return (
                            <div
                              key={rowId}
                              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate" title={displayName}>
                                    {displayName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{sizeKb} KB</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {canPreviewDoc(file) && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openPreview(file)}
                                    title="View document"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                {file.url && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => void handleDownloadDocument(file, rowId)}
                                    disabled={downloadingDocumentId === rowId}
                                    title="Download document"
                                  >
                                    {downloadingDocumentId === rowId ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Documents</Label>
                    {additionalSupportingDocs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No additional documents found.</p>
                    ) : (
                      <div className="space-y-2">
                        {additionalSupportingDocs.map((file, index) => {
                          const displayName = file.originalFilename ?? file.name;
                          const rowId = file.fileId ?? `${displayName}-${index}`;
                          const sizeKb = file.sizeBytes
                            ? (Number(file.sizeBytes) / 1024).toFixed(2)
                            : (file.size / 1024).toFixed(2);
                          return (
                            <div
                              key={rowId}
                              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate" title={displayName}>
                                    {displayName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{sizeKb} KB</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {canPreviewDoc(file) && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openPreview(file)}
                                    title="View document"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                {file.url && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => void handleDownloadDocument(file, rowId)}
                                    disabled={downloadingDocumentId === rowId}
                                    title="Download document"
                                  >
                                    {downloadingDocumentId === rowId ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isDifferencesDialogOpen} onOpenChange={(open) => { setIsDifferencesDialogOpen(open); if (!open) setDifferencesData(null); }}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle>Endorsement changes</DialogTitle>
                <DialogDescription>Comparison of previous and current values for changed fields.</DialogDescription>
              </DialogHeader>
              {differencesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (differencesData?.differences?.length || differencesData?.cewDifferance?.length) ? (
                <div className="flex-1 min-h-0 overflow-auto space-y-4">
                  {differencesData?.differences?.length ? (
                    <div className="space-y-2">
                      <div className="px-3 py-2 rounded-md bg-muted text-sm font-medium text-foreground">
                        Proposal form changes
                      </div>
                      <div className="px-3 py-2 rounded-md bg-muted text-sm text-muted-foreground grid grid-cols-12 gap-2">
                        <div className="col-span-4">Field name</div>
                        <div className="col-span-3 text-center">Previous value</div>
                        <div className="col-span-3 text-center">Updated value</div>
                        <div className="col-span-2 text-center">Delta</div>
                      </div>
                      {differencesData.differences.map((diff) => {
                        const fieldLabel = String(diff.fieldName || "Unnamed field")
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase());
                        const prevCombination = parseCombinationValue(diff.previousValueText, diff.previousValueJson);
                        const currCombination = parseCombinationValue(diff.currentValueText, diff.currentValueJson);
                        const isCombination =
                          (prevCombination && prevCombination.length > 0) || (currCombination && currCombination.length > 0);

                        if (isCombination) {
                          const maxRows = Math.max(prevCombination?.length ?? 0, currCombination?.length ?? 0);
                          return (
                            <div key={diff.fieldId} className="rounded-lg border bg-muted/20 p-3 space-y-3">
                              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <span>{fieldLabel}</span>
                                {diff.isRatingParameter && <Calculator className="h-4 w-4 text-primary" />}
                              </div>
                              {Array.from({ length: maxRows }, (_, rowIdx) => {
                                const prevRow = prevCombination?.[rowIdx];
                                const currRow = currCombination?.[rowIdx];
                                const rowLabel = prevRow?.label ?? currRow?.label ?? `Row ${rowIdx + 1}`;
                                const deletedMessage =
                                  (currRow?.isDeleted && currRow.deletedMessage) ||
                                  (prevRow?.isDeleted && prevRow.deletedMessage) ||
                                  null;
                                const maxSubs = Math.max(prevRow?.value?.length ?? 0, currRow?.value?.length ?? 0);
                                return (
                                  <div key={`${diff.fieldId}-${rowIdx}`} className="space-y-2">
                                    <div className="text-xs font-medium text-muted-foreground">{rowLabel}</div>
                                    {deletedMessage ? (
                                      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                        {deletedMessage}
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        {Array.from({ length: maxSubs }, (_, subIdx) => {
                                          const prevSub = prevRow?.value?.[subIdx];
                                          const currSub = currRow?.value?.[subIdx];
                                          const subLabel = prevSub?.label ?? currSub?.label ?? "";
                                          if (!subLabel) return null;
                                          const isSubRatingParam =
                                            Boolean(currSub?.isRatingParameter) || Boolean(prevSub?.isRatingParameter);
                                          const subDeltaDisplay = formatPremiumDelta(
                                            currSub?.premiumImpact ?? prevSub?.premiumImpact,
                                            currSub?.premiumImpactType ?? prevSub?.premiumImpactType
                                          );
                                          return (
                                            <div
                                              key={currSub?.id || prevSub?.id || `${diff.fieldId}-${rowIdx}-${subIdx}`}
                                              className="rounded-md bg-background px-3 py-2"
                                            >
                                              <div className="grid grid-cols-12 gap-2 text-sm">
                                                <div className="col-span-4 text-foreground font-medium">
                                                  <span className="inline-flex items-center gap-1">
                                                    <span>{subLabel}</span>
                                                    {isSubRatingParam && <Calculator className="h-4 w-4 shrink-0 text-primary" />}
                                                  </span>
                                                </div>
                                                <div className="col-span-3 text-muted-foreground break-words whitespace-pre-line text-center">
                                                  {prevSub?.value ?? "—"}
                                                </div>
                                                <div className="col-span-3 text-foreground break-words whitespace-pre-line text-center">
                                                  {currSub?.value ?? "—"}
                                                </div>
                                                <div className="col-span-2 text-foreground break-words text-center">{subDeltaDisplay}</div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        const prevDisplay =
                          formatConsentDisplay(diff.previousValueText) ??
                          formatConsentDisplay(diff.previousValueJson) ??
                          formatDatePeriodDisplay(diff.previousValueText) ??
                          formatDatePeriodDisplay(diff.previousValueJson) ??
                          (diff.previousValueText != null && diff.previousValueText !== ""
                            ? formatDifferenceScalarValue(diff.previousValueText)
                            : diff.previousValueJson != null
                              ? formatDifferenceScalarValue(diff.previousValueJson)
                              : "—");
                        const currDisplay =
                          formatConsentDisplay(diff.currentValueText) ??
                          formatConsentDisplay(diff.currentValueJson) ??
                          formatDatePeriodDisplay(diff.currentValueText) ??
                          formatDatePeriodDisplay(diff.currentValueJson) ??
                          (diff.currentValueText != null && diff.currentValueText !== ""
                            ? formatDifferenceScalarValue(diff.currentValueText)
                            : diff.currentValueJson != null
                              ? formatDifferenceScalarValue(diff.currentValueJson)
                              : "—");
                        const deltaDisplay = formatPremiumDelta(diff.premiumImpact, diff.premiumImpactType);
                        return (
                          <div key={diff.fieldId} className="rounded-lg border bg-muted/20 px-3 py-2">
                            <div className="grid grid-cols-12 gap-2 text-sm">
                              <div className="col-span-4 text-foreground font-medium">
                                <span className="inline-flex items-center gap-1">
                                  <span>{fieldLabel}</span>
                                  {diff.isRatingParameter && <Calculator className="h-4 w-4 shrink-0 text-primary" />}
                                </span>
                              </div>
                              <div className="col-span-3 text-muted-foreground break-words whitespace-pre-line text-center">
                                {prevDisplay}
                              </div>
                              <div className="col-span-3 text-foreground break-words whitespace-pre-line text-center">
                                {currDisplay}
                              </div>
                              <div className="col-span-2 text-foreground break-words text-center">{deltaDisplay}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {differencesData?.cewDifferance?.length ? (
                    <div className="space-y-2">
                      <div className="px-3 py-2 rounded-md bg-muted text-sm font-medium text-foreground">
                        CEW changes
                      </div>
                      <div className="px-3 py-2 rounded-md bg-muted text-sm text-muted-foreground grid grid-cols-12 gap-2">
                        <div className="col-span-3">Field name</div>
                        <div className="col-span-3 text-center">Previous value</div>
                        <div className="col-span-3 text-center">Updated value</div>
                        <div className="col-span-3 text-center">Delta</div>
                      </div>
                      {differencesData.cewDifferance.map((diffItem) => (
                        <div key={`${diffItem.category}-${diffItem.key}`} className="rounded-lg border bg-muted/20 px-3 py-2">
                          <div className="grid grid-cols-12 gap-2 text-sm">
                            <div className="col-span-3 text-foreground font-medium break-words">
                              {getCewFieldDisplayName(diffItem.key, diffItem.label)}
                            </div>
                            <div className="col-span-3 text-muted-foreground break-words whitespace-pre-line text-center">
                              {formatCewValueSummary(diffItem.category, diffItem.previous)}
                            </div>
                            <div className="col-span-3 text-foreground break-words whitespace-pre-line text-center">
                              {formatCewValueSummary(diffItem.category, diffItem.current)}
                            </div>
                            <div className="col-span-3 text-foreground break-words whitespace-pre-line text-center">
                              {formatCewDeltaValue(diffItem.premiumImpact)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : differencesData && (differencesData.differences?.length ?? 0) === 0 && (differencesData.cewDifferance?.length ?? 0) === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No differences found.</p>
              ) : null}
            </DialogContent>
          </Dialog>

          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Approval Workflow</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setIsWorkflowDialogOpen(true)}>View All</Button>
                </div>
                <CardDescription>Current approval status and assigned approvers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sampleWorkflow.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            step.status === "approved" && "bg-green-100 text-green-700",
                            step.status === "pending" && "bg-yellow-100 text-yellow-700",
                            step.status === "rejected" && "bg-red-100 text-red-700"
                          )}
                        >
                          {step.status === "approved" && <CheckCircle2 className="h-4 w-4" />}
                          {step.status === "pending" && <Clock className="h-4 w-4" />}
                          {step.status === "rejected" && <XCircle className="h-4 w-4" />}
                        </div>
                        {index < sampleWorkflow.length - 1 && <div className="w-0.5 h-8 bg-border mt-1" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{step.approver}</p>
                        <p className="text-xs text-muted-foreground">{step.role}</p>
                        {step.timestamp && <p className="text-xs text-muted-foreground mt-1">{step.timestamp}</p>}
                        {step.comments && <p className="text-xs text-muted-foreground mt-1 italic">{step.comments}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Audit Trail</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setIsAuditDialogOpen(true)}>View All</Button>
                </div>
                <CardDescription>Log of changes for compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sampleAuditTrail.slice(0, 3).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-2 border rounded-lg bg-muted/30">
                      <History className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{log.user}</p>
                        <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div> */}

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-end gap-3">
                {canDownloadEndorsementLetter && (
                  <Button variant="outline" onClick={handleDownloadLetter} disabled={downloadLetterLoading} className="w-[300px]">
                    {downloadLetterLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download Endorsement Letter
                  </Button>
                )}
                {isBroker && !isBrokerViewMode && (
                  <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
                    {submitLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit
                  </Button>
                )}
                {!isBroker && (endorsement.status === "Submitted" || endorsement.status === "Draft") && (
                  <>
                    <Button
                      variant="default"
                      onClick={handleApprove}
                      disabled={
                        statusUpdating ||
                        !canSetToApproved ||
                        isApprovalBlockedByMissingPremiumRecalc ||
                        hasUnsavedPremiumRecalcChanges
                      }
                    >
                      {statusUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={
                        statusUpdating ||
                        !canSetToRejected ||
                        isApprovalBlockedByMissingPremiumRecalc ||
                        hasUnsavedPremiumRecalcChanges
                      }
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedPolicyId &&
            !policyEndorsementsLoading &&
            (policyEndorsementsMeta?.total ?? 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Total endorsements for this policy
                    {policyEndorsementsMeta != null ? ` (${policyEndorsementsMeta.total})` : ""}
                  </CardTitle>
                  <CardDescription>List of all endorsements for the selected policy.</CardDescription>
                </CardHeader>
                <CardContent>
                  {policyEndorsementsError ? (
                    <div className="text-center py-8">
                      <p className="text-destructive text-sm">{policyEndorsementsError}</p>
                    </div>
                  ) : policyEndorsements.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No endorsements found</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Endorsement Reference</TableHead>
                          <TableHead>Policy Number</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Effective Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {policyEndorsements.map((end) => (
                          <TableRow key={end.id}>
                            <TableCell className="font-medium">{end.endorsementReference}</TableCell>
                            <TableCell>{endorsement.policyNumber ?? "—"}</TableCell>
                            <TableCell>{mapApiTypeToDisplay(end.type)}</TableCell>
                            <TableCell>
                              {end.effectiveDate ? format(new Date(end.effectiveDate), "dd-MM-yyyy") : "—"}
                            </TableCell>
                            <TableCell>{getStatusBadge(mapApiStatusToStatus(end.status))}</TableCell>
                            <TableCell className="text-center">
                              {(() => {
                                const normalizedStatus = String(end.status || "").toLowerCase();
                                const canViewDetails = !isBroker || normalizedStatus === "approved" || normalizedStatus === "rejected";

                                return (
                                  <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className={canViewDetails ? "inline-flex" : "inline-flex cursor-not-allowed"}>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!canViewDetails}
                                            className={!canViewDetails ? "cursor-not-allowed" : undefined}
                                            onClick={() => navigate(`${endorsementsBasePath}/endorsement/${end.id}`)}
                                          >
                                            <Eye className="w-4 h-4" />
                                            View Details
                                          </Button>
                                        </span>
                                      </TooltipTrigger>
                                      {!canViewDetails && (
                                        <TooltipContent>
                                          <p>Cannot view details until approved or rejected</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {policyEndorsementsMeta && !policyEndorsementsLoading && (
                    <div className="px-0 py-4 border-t flex justify-between items-center mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {policyEndorsements.length} of {policyEndorsementsMeta.total} results
                      </div>
                      <div className="ml-auto">
                        <Pagination className="w-auto justify-end">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (policyEndorsementsPage > 1)
                                    setPolicyEndorsementsPage(policyEndorsementsPage - 1);
                                }}
                                className={
                                  policyEndorsementsPage === 1 || policyEndorsements.length === 0 || (policyEndorsementsMeta?.total ?? 0) === 0
                                    ? "pointer-events-none opacity-50"
                                    : ""
                                }
                              />
                            </PaginationItem>
                            {(() => {
                              const maxPages = 5;
                              const totalPages = policyEndorsementsMeta.totalPages;
                              let startPage = 1;
                              let endPage = Math.min(maxPages, totalPages);
                              if (totalPages > maxPages) {
                                if (policyEndorsementsPage <= 3) {
                                  startPage = 1;
                                  endPage = maxPages;
                                } else if (policyEndorsementsPage >= totalPages - 2) {
                                  startPage = totalPages - maxPages + 1;
                                  endPage = totalPages;
                                } else {
                                  startPage = policyEndorsementsPage - 2;
                                  endPage = policyEndorsementsPage + 2;
                                }
                              }
                              return Array.from(
                                { length: endPage - startPage + 1 },
                                (_, i) => startPage + i
                              ).map((pageNum) => (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    href="#"
                                    isActive={policyEndorsementsPage === pageNum}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPolicyEndorsementsPage(pageNum);
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
                                  if (policyEndorsementsPage < policyEndorsementsMeta.totalPages)
                                    setPolicyEndorsementsPage(policyEndorsementsPage + 1);
                                }}
                                className={
                                  policyEndorsementsPage === policyEndorsementsMeta.totalPages ||
                                    policyEndorsements.length === 0 ||
                                    (policyEndorsementsMeta?.total ?? 0) === 0
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
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      {mode !== "create" && endorsementId && (
        <>
          {/* Minimized Chat Widget - Bottom Right */}
          {!isChatExpanded && (
            <div className="fixed bottom-10 right-10 z-[100] group">
              <div className="relative">
                <Button
                  onClick={() => setIsChatExpanded(true)}
                  className="h-14 w-14 group-hover:w-[13.5rem] rounded-full shadow-lg flex items-center justify-start overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-all duration-300 ease-in-out p-0"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <span className="font-medium whitespace-nowrap opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 pr-6">
                    Endorsement Chat
                  </span>
                </Button>
                {floatingUnreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-0 shadow-sm pointer-events-none">
                    {floatingUnreadCount}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Expanded Chat Widget - Modal-like */}
          {isChatExpanded && (
            <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[700px] flex flex-col shadow-2xl rounded-lg overflow-hidden bg-white border border-gray-200">
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold">Queries & Communication</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsChatExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Chat Messages Area - Scrollable */}
              <div
                className="flex-1 flex flex-col p-0 overflow-hidden relative"
                style={{
                  backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.08) 1.5px, transparent 1.5px)`,
                  backgroundSize: '24px 24px',
                  backgroundColor: '#f9fafb',
                }}
              >
                <ScrollArea ref={chatScrollAreaRef} className="flex-1 px-4 py-4">
                  {chatMessages.length > 0 ? (
                    <div className="space-y-4">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className="space-y-2">
                          {firstUnreadIncomingMessageId === msg.id && (
                            <div className="flex items-center gap-2 py-1">
                              <div className="h-px bg-red-200 flex-1" />
                              <span className="text-[11px] font-medium text-red-600 whitespace-nowrap px-2 py-0.5 rounded-full bg-red-50 border border-red-200">
                                New messages
                              </span>
                              <div className="h-px bg-red-200 flex-1" />
                            </div>
                          )}
                          <div
                            data-chat-message-id={msg.id}
                            className={`flex ${msg.senderRole === (isBroker ? 'broker' : 'insurer') ? 'justify-end' : 'justify-start'
                              }`}
                          >
                            <div className="max-w-[80%]">
                              <div
                                className={`rounded-lg px-4 py-3 shadow-md border ${msg.senderRole === (isBroker ? 'broker' : 'insurer')
                                  ? 'bg-primary text-primary-foreground border-transparent'
                                  : 'bg-white text-gray-900 border-gray-200'
                                  }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <User
                                      className={`w-3 h-3 ${msg.senderRole === (isBroker ? 'broker' : 'insurer')
                                        ? 'text-white'
                                        : 'text-gray-600'
                                        }`}
                                    />
                                    <span
                                      className={`text-xs font-medium ${msg.senderRole === (isBroker ? 'broker' : 'insurer')
                                        ? 'text-white'
                                        : 'text-gray-700'
                                        }`}
                                    >
                                      {msg.senderRole === (isBroker ? 'broker' : 'insurer') ? 'You' : (isBroker ? 'Insurer' : 'Broker')}
                                    </span>
                                  </div>
                                  <Badge
                                    variant={msg.status === 'Responded' ? 'default' : 'secondary'}
                                    className={`text-xs ml-2 ${msg.senderRole === (isBroker ? 'broker' : 'insurer')
                                      ? 'bg-white/20 text-white hover:bg-white/30'
                                      : ''
                                      }`}
                                  >
                                    {msg.status
                                      ? msg.status.charAt(0).toUpperCase() + msg.status.slice(1)
                                      : '-'}
                                  </Badge>
                                </div>

                                <p
                                  className={`text-sm leading-relaxed break-all whitespace-pre-wrap ${msg.senderRole === (isBroker ? 'broker' : 'insurer') ? 'text-white' : 'text-gray-800'
                                    }`}
                                >
                                  {msg.message}
                                </p>

                                {((msg.attachments as any[])?.length ?? 0) > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {(msg.attachments as any[] ?? []).map((att) => (
                                      <a
                                        key={att.id}
                                        href={att.documentUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`block text-xs underline ${msg.senderRole === (isBroker ? 'broker' : 'insurer')
                                          ? 'text-blue-100'
                                          : 'text-blue-600'
                                          }`}
                                      >
                                        {att.documentName}
                                      </a>
                                    ))}
                                  </div>
                                )}

                                <div
                                  className={`text-xs mt-2 ${msg.senderRole === (isBroker ? 'broker' : 'insurer')
                                    ? 'opacity-70 text-white'
                                    : 'text-gray-500'
                                    }`}
                                >
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '-'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-sm text-gray-500 font-medium">No queries yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Start a conversation by sending a query
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Chat Input Area - Fixed at bottom */}
              <div className="border-t p-4 bg-gray-50 flex-shrink-0">
                {newQueryAttachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {newQueryAttachments.map((file, index) => (
                      <Badge key={`${file.name}-${file.size}-${index}`} variant="secondary" className="gap-1 pr-1">
                        <Paperclip className="h-3 w-3" />
                        <span className="max-w-[180px] truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeQueryAttachment(index)}
                          className="hover:bg-gray-200 rounded-full p-0.5"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input
                    ref={queryAttachmentInputRef}
                    type="file"
                    multiple
                    accept="application/pdf,image/*"
                    onChange={handleQueryFileChange}
                    className="hidden"
                  />
                  <div className="absolute inset-y-0 left-1 flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => queryAttachmentInputRef.current?.click()}
                      disabled={querySubmitting || !endorsementId}
                      aria-label="Attach documents"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Type a query message..."
                    value={newQueryDescription}
                    onChange={(e) => setNewQueryDescription(e.target.value)}
                    className="h-11 pl-11 pr-24"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSendQuery();
                      }
                    }}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <Button
                      onClick={() => void handleSendQuery()}
                      disabled={querySubmitting || (!newQueryDescription.trim() && newQueryAttachments.length === 0) || !endorsementId}
                      size="sm"
                      className="h-8 px-3 gap-1"
                    >
                      {querySubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approval Workflow</DialogTitle>
            <DialogDescription>Complete approval workflow for this endorsement</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Approver</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleWorkflow.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell className="font-medium">{step.approver}</TableCell>
                    <TableCell>{step.role}</TableCell>
                    <TableCell>
                      <Badge variant={step.status === "approved" ? "secondary" : step.status === "rejected" ? "destructive" : "outline"}>
                        {step.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{step.timestamp || "Pending"}</TableCell>
                    <TableCell>{step.comments || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Audit Trail</DialogTitle>
            <DialogDescription>Complete log of changes for compliance</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleAuditTrail.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell className="font-medium">{log.user}</TableCell>
                    <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                    <TableCell>{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog> */}
    </div>
  );
}
