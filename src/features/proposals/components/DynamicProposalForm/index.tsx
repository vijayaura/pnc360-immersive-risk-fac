import { useState, useEffect, useCallback, useRef, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  CreditCard,
  Plus,
  Upload,
  X,
  Calculator,
  Eye,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  Loader2,
  RefreshCw,
  FileEdit,
  Bot,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import type {
  Field,
  Page,
  RequireDocument,
  Section,
  SubField,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { isMetadataActive } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import type { ProductWorkflowResponse } from '@/features/product-config/api/workflow';
import {
  saveProposalForm,
  SaveProposalFormRequest,
  SaveProposalFormResponse,
} from '@/features/product-config/proposal-form/api/saveProposalForm';
import { uploadPIFilledProposal } from '@/features/quotes/api/quotes';
import {
  calculateEndorsementPremium,
  getEndorsementDifference,
  type EndorsementDifferenceResponse,
  updateEndorsementForm,
} from '@/lib/api/endorsements';
import { DocumentUpload } from '../DocumentUpload';
import { QuotesComparison, type QuotesComparisonRef } from '@/features/quotes/components/QuotesComparison';
import { PaymentPage } from '../PaymentPage';
import { useQuoteSelectionStore } from '@/shared/stores/useQuoteSelectionStore';
import { useDeclarationUploadsStore } from '@/shared/stores/useDeclarationUploadsStore';
import { useEndorsementUploadsStore } from '@/shared/stores/useEndorsementUploadsStore';
import { useUnderwritingUploadsStore } from '@/shared/stores/useUnderwritingUploadsStore';
import { getInsurerCompanyId } from '@/lib/auth';
import {
  getRequiredDocumentsForInsurer,
  getEndorsementRequiredDocumentsForInsurer,
  uploadAdditionalDocument,
  uploadEndorsementAdditionalDocument,
  deleteUploadedFile,
  type RequiredDocumentForInsurer,
} from '@/features/product-config/required-docs/api/requiredDocuments';
import { formatFileSize, handleDirectDownload } from '@/shared/utils/fileUtils';
import { useDynamicFormState } from '../../hooks/useDynamicFormState';
import { useDynamicRows } from '../../hooks/useDynamicRows';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FieldRenderer } from '../FieldRenderer';
import { usePremiumCalculation } from '../../hooks/usePremiumCalculation';
import { useProposalAutosave } from '../../hooks/useProposalAutosave';
import { useProposalSteps } from '../../hooks/useProposalStep';
import { FormSteps } from '../FormSteps';
import { FormNavigation } from '../FormNavigation';
import { useIntegrationExecution } from '../../hooks/useIntegrationExecution';
import { IntegrationErrorDialog } from './IntegrationErrorDialog';
import { IntegrationLoadingOverlay } from './IntegrationLoadingOverlay';
import { FetchIntegrationButton } from './FetchIntegrationButton';
import { serializePageFields } from '../../utils/serializeProposalFields';
import { initializeFormData } from '../../utils/initializeFormData';
import { getFormFieldValue } from '../../utils/formDataFieldAccess';
import { calculateQuoteRating } from '@/features/quotes/api/quotes';
import { validateReinsurance } from '@/features/product-config/api/reinsurance';
import {
  extractionItemLooksLikePeriodField,
  parseExtractedPeriodPayload,
} from '../../utils/extractedPeriod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { NumberUnit } from '../../types/form';
import { isSectionVisibilitySatisfied } from '../../utils/sectionVisibility';

// Extracted components & utilities
import { MapDialogWrapper } from './MapDialogWrapper';
import { ScanningDialog } from './ScanningDialog';
import { ProposalPreviewDialog } from './ProposalPreviewDialog';
import { getFilesToUpload } from './getFilesToUpload';
import { validateMultiFieldLogic } from './validateMultiFieldLogic';
import { mapPIFilledProposalToForm } from './mapPIFilledProposal';
import { normalizeEditDataToFormData, normalizeEditDocuments } from '../../utils/normalizeEditData';
import type {
  IntegrationBlockedInfo,
  ProposalFormEditResponse,
} from '@/features/quotes/api/edit-quote';
import type {
  ProposalBundleResponseV2,
  ProposalTemplate,
  TemplateFieldValidation,
  TemplateFieldItem,
  TemplateNavigationField,
  TemplatePageItem,
  TemplatePageSection,
  TemplateSubField,
} from '@/features/quotes/api/quotes';
import { apiUploadFile } from '@/lib/api/client';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NUMBER_UNIT_OPTIONS: { value: NumberUnit | ''; label: string }[] = [
  { value: '', label: 'Select number unit' },
  { value: 'millions', label: 'Millions' },
  { value: 'thousand', label: 'Thousands' },
  { value: 'hundredThousand', label: 'Hundred Thousands' },
];

const EMPTY_UPLOADS_MAP: Record<string, any> = {};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasCurrencyNumberFieldInPages(pages: Page[]): boolean {
  for (const page of pages) {
    for (const section of page.sections || []) {
      for (const field of section.fields || []) {
        if (field.type === 'number' && field.metadata?.numberFormat === 'currency') return true;
        if (field.type === 'combination' && field.subFields?.length) {
          const hasCurrency = field.subFields.some(
            (sf: SubField) => sf.type === 'number' && sf.metadata?.numberFormat === 'currency',
          );
          if (hasCurrency) return true;
        }
      }
    }
  }
  return false;
}

function isCombinationMatrix(data: unknown): data is Array<{ label?: string; value?: unknown[] }> {
  return Array.isArray(data) && data.length > 0 && data.every(
    (row) => typeof row === 'object' && row !== null && 'value' in row && Array.isArray((row as { value?: unknown[] }).value)
  );
}

function formatDatePeriodDisplay(value: unknown): string | null {
  if (value == null) return null;
  let obj: Record<string, unknown> | null = null;
  if (typeof value === 'object' && value !== null) {
    obj = value as Record<string, unknown>;
  } else if (typeof value === 'string' && value.trim().startsWith('{')) {
    try {
      obj = JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (!obj) return null;
  const start = String(obj.startDate ?? obj.fromDate ?? obj.from ?? '');
  const end = String(obj.endDate ?? obj.toDate ?? obj.to ?? '');
  if (start || end) return `From : ${start || '—'}\nTo : ${end || '—'}`;
  return null;
}

function formatDifferenceNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const roundedInteger = Math.round(value);
  if (Math.abs(value - roundedInteger) < 1e-6) {
    return roundedInteger.toLocaleString('en-US');
  }
  return value.toLocaleString('en-US', {
    maximumFractionDigits: 6,
    useGrouping: true,
  });
}

function formatDifferenceScalarValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'number') return formatDifferenceNumber(value);
  if (typeof value !== 'string') return String(value);

  const trimmed = value.trim();
  if (!trimmed) return '';
  const normalizedNumeric = trimmed.replace(/,/g, '');
  if (/^-?\d+(\.\d+)?$/.test(normalizedNumeric)) {
    const numericValue = Number(normalizedNumeric);
    if (Number.isFinite(numericValue)) {
      return formatDifferenceNumber(numericValue);
    }
  }
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (typeof parsed === 'string' || typeof parsed === 'number') {
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
  if (typeof value === 'object' && !Array.isArray(value)) {
    data = value as Record<string, unknown>;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed.startsWith('{')) return null;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        data = parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }

  if (!data || typeof data.accepted !== 'boolean') return null;

  const acceptedDisplay = data.accepted ? 'Accepted' : 'Not accepted';
  const documents = Array.isArray(data.documents) ? data.documents : [];
  const documentDisplay = documents
    .map((document) => {
      if (!document || typeof document !== 'object') return null;
      const item = document as Record<string, unknown>;
      const label = typeof item.label === 'string' && item.label.trim() ? item.label.trim() : 'Document';
      const fileName = typeof item.fileName === 'string' && item.fileName.trim() ? item.fileName.trim() : 'Not provided';
      return `${label}: ${fileName}`;
    })
    .filter((item): item is string => Boolean(item));

  return documentDisplay.length > 0
    ? `${acceptedDisplay}\nDocuments: ${documentDisplay.join(', ')}`
    : acceptedDisplay;
}

function formatSingleCombinationValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const datePeriod = formatDatePeriodDisplay(value);
  if (datePeriod != null) return datePeriod;
  return formatDifferenceScalarValue(value);
}

function formatCewLoadingDisplay(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;

  const data = value as Record<string, unknown>;
  if (data.loading == null || data.loading === '') return null;

  const sign = data.isIncrease === false ? '-' : '+';
  const loadingValue = formatDifferenceScalarValue(data.loading);
  const type = String(data.type ?? '').trim().toLowerCase();
  const currency = String(data.currency ?? '').trim();

  if (type === 'percentage') {
    return `Loading: ${sign}${loadingValue}%`;
  }

  if (type === 'currency') {
    return `Loading: ${sign}${currency} ${loadingValue}`;
  }

  if (currency) {
    return `Loading: ${sign}${currency} ${loadingValue}`;
  }

  return `Loading: ${sign}${loadingValue}`;
}

function formatCewValueSummary(_category: string, value: unknown): string {
  return formatCewLoadingDisplay(value) || '—';
}

function getCewFieldDisplayName(key: unknown, label: unknown): string {
  const normalizedKey = String(key ?? '').trim();
  const normalizedLabel = String(label ?? '').trim();
  const uppercaseKey = normalizedKey.toUpperCase();

  if (uppercaseKey === 'DEDUCTIBLE' || uppercaseKey === 'TPL') {
    return normalizedKey || normalizedLabel || '—';
  }

  return normalizedLabel || normalizedKey || '—';
}

function formatCewDeltaValue(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const premiumImpact = (value as Record<string, unknown>).premiumImpact;
    if (premiumImpact == null || premiumImpact === '') return '—';
    return String(premiumImpact);
  }
  return '—';
}

type ParsedCombinationCell = {
  id: string;
  label: string;
  value: string;
  isRatingParameter: boolean;
};

type ParsedCombinationRow = {
  label: string;
  value: ParsedCombinationCell[];
  isDeleted: boolean;
  deletedMessage: string | null;
};

function parseCombinationValue(valueText: unknown, valueJson: unknown): ParsedCombinationRow[] | null {
  let data: unknown = valueJson;
  const hasUsableJson =
    data != null && !(Array.isArray(data) && data.length === 0);
  if (!hasUsableJson && valueText != null) {
    if (typeof valueText === 'string') {
      const trimmed = valueText.trim();
      if (trimmed === '') return null;
      try {
        data = JSON.parse(trimmed) as unknown;
      } catch {
        return null;
      }
    } else {
      data = valueText;
    }
  }
  if (!isCombinationMatrix(data)) return null;
  return data.map((row) => ({
    label: typeof row.label === 'string' ? row.label : 'Row',
    isDeleted: Boolean((row as { isDeleted?: boolean }).isDeleted),
    deletedMessage:
      typeof (row as { deletedMessage?: unknown }).deletedMessage === 'string'
        ? String((row as { deletedMessage?: string }).deletedMessage)
        : null,
    value: (row.value ?? []).map((cell) => {
      const combinationCell = cell as {
        id?: string;
        label?: string;
        value?: unknown;
        isRatingParameter?: boolean;
      };
      return {
        id: String(combinationCell?.id ?? ''),
        label: typeof combinationCell?.label === 'string' ? combinationCell.label : '',
        value: formatSingleCombinationValue(combinationCell?.value),
        isRatingParameter: Boolean(combinationCell?.isRatingParameter),
      };
    }),
  }));
}

function hasUploadedUnderwritingDocument(
  doc: {
    status?: string;
    fileUrl?: string;
    fileName?: string;
    uploadedFileId?: string | number;
    aiValidationResult?: {
      is_valid_document: boolean;
      description_message: string;
    };
  } | null | undefined,
): boolean {
  if (!doc) return false;
  if (doc.status === 'uploaded') return true;
  if (typeof doc.fileUrl === 'string' && doc.fileUrl.trim()) return true;
  if (typeof doc.fileName === 'string' && doc.fileName.trim()) return true;
  if (doc.uploadedFileId != null) return true;
  if (doc.aiValidationResult != null) return true;
  return false;
}

function hasUploadedDeclarationDocument(
  doc: {
    status?: string;
    fileUrl?: string;
    fileName?: string;
    aiValidationResult?: {
      is_valid_document: boolean;
      description_message: string;
    };
  } | null | undefined,
): boolean {
  if (!doc) return false;
  if (doc.status === 'uploaded') return true;
  if (typeof doc.fileUrl === 'string' && doc.fileUrl.trim()) return true;
  if (typeof doc.fileName === 'string' && doc.fileName.trim()) return true;
  if (doc.aiValidationResult != null) return true;
  return false;
}

function getSummaryDisplayValue(textValue: unknown, jsonValue: unknown): string {
  return (
    formatConsentDisplay(textValue) ??
    formatConsentDisplay(jsonValue) ??
    formatDatePeriodDisplay(textValue) ??
    formatDatePeriodDisplay(jsonValue) ??
    (textValue != null && textValue !== ''
      ? formatDifferenceScalarValue(textValue)
      : jsonValue != null
        ? formatDifferenceScalarValue(jsonValue)
        : '—')
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DynamicProposalFormProps {
  // ── Edit / resume mode ────────────────────────────────────────────────────
  /**
   * Pass the full edit API response to enable edit/resume mode.
   * When provided, all of the individual props below (pages, templateId, etc.)
   * are derived from it automatically — you don't need to pass them separately.
   */
  editData?: ProposalFormEditResponse | null;

  // ── Create mode (or overrides when editData is also provided) ─────────────
  templateId?: string;
  templateVersionId?: string;
  pages?: Page[];
  additionalInformationPages?: Page[];
  productId?: string;
  productName?: string;
  productCode?: string;
  productThemeColor?: string;
  onFormSubmit?: (responseId: string, fieldValues?: Record<string, unknown>[]) => void;
  initialData?: Record<string, unknown>;
  savedProposalId?: string;
  distributorId?: string;
  distributorName?: string;
  requiredDocuments?: RequireDocument[];
  declarationDocuments?: RequireDocument[];
  workflow?: ProductWorkflowResponse;
  currency?: string;
  reinsuranceMandatory?: boolean;
  onStepChange?: (stepIndex: number) => void;
  onStepCompletionChange?: (completionStatus: Record<string, boolean>) => void;
  /** When true (e.g. endorsement flow with prefilled data), allow switching to any step and going back after quotes */
  allowFreeNavigation?: boolean;
  /** When set (endorsement flow), save/next calls PATCH /endorsements/{endorsementId} instead of POST /quote */
  endorsementId?: string;
  /** When 'non_technical', rating parameter fields are shown disabled with prefilled values */
  endorsementType?: 'technical' | 'non_technical';
}

type EditDataWithAdditionalInformation = ProposalFormEditResponse & {
  additionalInformation?: {
    template?: {
      pages?: Page[];
    };
  };
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DynamicProposalForm = ({
  editData,
  templateId: templateIdProp,
  templateVersionId: templateVersionIdProp,
  pages: pagesProp,
  additionalInformationPages: additionalInformationPagesProp,
  productId: productIdProp,
  productName: productNameProp,
  productCode,
  productThemeColor,
  onFormSubmit,
  initialData: initialDataProp = {},
  savedProposalId: savedProposalIdProp,
  distributorId,
  distributorName,
  requiredDocuments: requiredDocumentsProp,
  declarationDocuments = [],
  workflow: workflowProp,
  currency: currencyProp = 'N/A',
  reinsuranceMandatory = false,
  onStepChange,
  onStepCompletionChange,
  allowFreeNavigation = false,
  endorsementId: endorsementIdProp,
  endorsementType: endorsementTypeProp,
}: DynamicProposalFormProps) => {
  // ── Derive props from editData when in edit/resume mode ───────────────────
  // All these fall back to the directly-passed props, so create mode is unchanged.
  const isEditMode = Boolean(editData);
  const editDataWithAdditionalInformation = editData as EditDataWithAdditionalInformation | null;
  const pages: Page[] = pagesProp ?? (editData?.template?.pages as unknown as Page[]) ?? [];
  const additionalInformationPages: Page[] =
    additionalInformationPagesProp ??
    (editData?.template?.additionalInformationPages as unknown as Page[]) ??
    (editDataWithAdditionalInformation?.additionalInformation?.template?.pages as unknown as Page[]) ??
    [];
  const allRenderablePages = useMemo(
    () => [...pages, ...additionalInformationPages].filter(isMetadataActive),
    [pages, additionalInformationPages],
  );
  const activePages = useMemo(() => pages.filter(isMetadataActive), [pages]);
  const activeAdditionalInformationPages = useMemo(
    () => additionalInformationPages.filter(isMetadataActive),
    [additionalInformationPages],
  );
  const templateId = templateIdProp ?? editData?.templateId;
  const templateVersionId = templateVersionIdProp ?? editData?.templateVersionId;
  const productId = (productIdProp ??
    editData?.productId ??
    editData?.template?.productId ??
    '') as string;
  const productName = productNameProp ?? editData?.template?.name;
  const savedProposalId = savedProposalIdProp ?? editData?.responseId;
  const workflow = workflowProp ?? editData?.workflow;
  const currency = currencyProp !== 'N/A' ? currencyProp : (editData?.currency ?? 'N/A');
  const endorsementType =
    endorsementTypeProp ?? (editData as { endorsement?: { type?: 'technical' | 'non_technical' } })?.endorsement?.type;

  // Memoize so the derived objects have STABLE references across re-renders.
  // Without this, normalizeEditDataToFormData() runs on every render, creating
  // a new object each time. The isLocked effect depends on initialData and
  // would re-fire (resetting currentPageIndex) every time the component
  // re-renders (e.g. when onQuoteSelected advances the step).
  const initialData: Record<string, unknown> = useMemo(
    () => (isEditMode && editData ? normalizeEditDataToFormData(editData) : initialDataProp),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editData, isEditMode], // initialDataProp intentionally omitted — it never changes after mount
  );

  const requiredDocuments: RequireDocument[] = useMemo(() => {
    const fromProp = requiredDocumentsProp;
    if (Array.isArray(fromProp) && fromProp.length > 0) {
      return fromProp;
    }
    if (isEditMode && editData) {
      const fromEdit = normalizeEditDocuments(editData) as unknown as RequireDocument[];
      if (fromEdit.length > 0) return fromEdit;
    }
    return fromProp ?? [];
  }, [requiredDocumentsProp, editData, isEditMode]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Core state ────────────────────────────────────────────────────────────
  const initialResponseId = (savedProposalId || (initialData?.id as string) || null) as
    | string
    | null;
  const [responseId, setResponseId] = useState<string | null>(
    initialResponseId,
  );
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [submittedMaxIndex, setSubmittedMaxIndex] = useState<number>(-1);
  const [unlockedMaxIndex, setUnlockedMaxIndex] = useState<number>(0);
  const [isProposalLocked, setIsProposalLocked] = useState<boolean>(!!initialData?.isLocked);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isQuoteSummaryOpen, setIsQuoteSummaryOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | number | null>(null);
  const [numberUnit, setNumberUnit] = useState<NumberUnit | ''>('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // ── Map/location state ────────────────────────────────────────────────────
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [activeLocationFieldId, setActiveLocationFieldId] = useState<string | null>(null);

  // ── Document state ────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoFillInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingProposal, setIsUploadingProposal] = useState(false);
  const [isScanningDialogOpen, setIsScanningDialogOpen] = useState(false);
  const [allDocumentTypes, setAllDocumentTypes] = useState<
    Array<{
      id: string | number;
      name: string;
      required: boolean;
      status: string;
      fileUrl?: string;
      fileName?: string;
      /** Upload row id from `/quote/required-doc` (for delete) */
      uploadedFileId?: string | number;
      aiValidationResult?: {
        is_valid_document: boolean;
        description_message: string;
      };
    }>
  >([]);
  const [declarationDocumentTypes, setDeclarationDocumentTypes] = useState<
    Array<{
      id: string | number;
      name: string;
      required: boolean;
      status: string;
      fileUrl?: string;
      fileName?: string;
      aiValidationResult?: {
        is_valid_document: boolean;
        description_message: string;
      };
    }>
  >([]);
  const latestUnderwritingDocumentsRef = useRef<
    Array<{
      id: string | number;
      name: string;
      required: boolean;
      status: string;
      fileUrl?: string;
      fileName?: string;
      uploadedFileId?: string | number;
      aiValidationResult?: {
        is_valid_document: boolean;
        description_message: string;
      };
    }>
  >([]);
  const latestDeclarationDocumentsRef = useRef<
    Array<{
      id: string | number;
      name: string;
      required: boolean;
      status: 'pending' | 'uploaded';
      fileUrl?: string;
      fileName?: string;
      aiValidationResult?: {
        is_valid_document: boolean;
        description_message: string;
      };
    }>
  >([]);
  const [insurerDocuments, setInsurerDocuments] = useState<RequiredDocumentForInsurer[]>([]);

  // ── Additional declaration documents (user-added with custom title + file) ─
  type AdditionalDeclarationDoc = {
    id: string | number;
    title: string;
    fileUrl?: string;
    fileName?: string;
    contentType?: string;
    fileSize?: string;
  };
  const canPreviewAdditionalDoc = (doc: AdditionalDeclarationDoc): boolean => {
    const ct = (doc.contentType || '').toLowerCase();
    return ct.startsWith('image/') || ct === 'application/pdf';
  };

  const [additionalEndorsementDocuments, setAdditionalEndorsementDocuments] = useState<
    AdditionalDeclarationDoc[]
  >([]);
  const additionalDocTargetRef = useRef<'declaration' | 'endorsement' | 'underwriting'>('declaration');
  const [viewAdditionalEndorsementDoc, setViewAdditionalEndorsementDoc] =
    useState<AdditionalDeclarationDoc | null>(null);
  const [deletingAdditionalEndorsementDocId, setDeletingAdditionalEndorsementDocId] = useState<
    string | number | null
  >(null);

  // ── Endorsement documents (endorsement flow: required from API in future + additional) ─
  const [endorsementDocuments, setEndorsementDocuments] = useState<RequiredDocumentForInsurer[]>([]);
  const ADDITIONAL_DOC_ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ] as const;
  const ADDITIONAL_DOC_ACCEPT =
    '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.svg,application/pdf,image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword';
  const ADDITIONAL_DOC_ALLOWED_MESSAGE = 'PDF, JPG, JPEG, PNG, WebP, SVG, DOC, DOCX';
  const [additionalDeclarationDocuments, setAdditionalDeclarationDocuments] = useState<
    AdditionalDeclarationDoc[]
  >([]);
  const [additionalUnderwritingDocuments, setAdditionalUnderwritingDocuments] = useState<
    AdditionalDeclarationDoc[]
  >([]);
  const [viewAdditionalDoc, setViewAdditionalDoc] = useState<AdditionalDeclarationDoc | null>(null);
  const [isAddAdditionalDocOpen, setIsAddAdditionalDocOpen] = useState(false);
  const [newAdditionalDoc, setNewAdditionalDoc] = useState<{
    title: string;
    file: File | null;
  }>({ title: '', file: null });
  const [isUploadingAdditionalDoc, setIsUploadingAdditionalDoc] = useState(false);
  const [additionalDocPreviewUrl, setAdditionalDocPreviewUrl] = useState<string | null>(null);
  const additionalDocInputRef = useRef<HTMLInputElement>(null);
  const [deletingAdditionalDocId, setDeletingAdditionalDocId] = useState<string | number | null>(
    null,
  );
  const declarationUploadsByResponse = useDeclarationUploadsStore((state) => state.uploadsByResponse);
  const endorsementUploadsByResponse = useEndorsementUploadsStore((state) => state.uploadsByResponse);
  const underwritingUploadsByResponse = useUnderwritingUploadsStore((state) => state.uploadsByResponse);
  const clearDeclarationUploadsForResponse = useDeclarationUploadsStore((state) => state.clearResponse);
  const clearUnderwritingUploadsForResponse = useUnderwritingUploadsStore((state) => state.clearResponse);
  const clearEndorsementUploadsForResponse = useEndorsementUploadsStore((state) => state.clearResponse);
  const declarationUploadsForResponse = useMemo(
    () =>
      responseId !== undefined && responseId !== null
        ? declarationUploadsByResponse[String(responseId)] || EMPTY_UPLOADS_MAP
        : EMPTY_UPLOADS_MAP,
    [declarationUploadsByResponse, responseId],
  );
  const endorsementUploadsForResponse = useMemo(
    () =>
      responseId !== undefined && responseId !== null
        ? endorsementUploadsByResponse[String(responseId)] || EMPTY_UPLOADS_MAP
        : EMPTY_UPLOADS_MAP,
    [endorsementUploadsByResponse, responseId],
  );
  const underwritingUploadsForResponse = useMemo(
    () =>
      responseId !== undefined && responseId !== null
        ? underwritingUploadsByResponse[String(responseId)] || EMPTY_UPLOADS_MAP
        : EMPTY_UPLOADS_MAP,
    [responseId, underwritingUploadsByResponse],
  );
  const mobileStepsScrollRef = useRef<HTMLDivElement>(null);
  const desktopStepsScrollRef = useRef<HTMLDivElement>(null);
  const lastResponseContextRef = useRef<string | null>(initialResponseId);



  // ── Form state (via hook) ────────────────────────────────────────────────
  const { formData, setFormData, handleFieldChange, isInitialized } = useDynamicFormState({
    pages: allRenderablePages,
    initialData,
  });

  // ── Derived / memoized values ─────────────────────────────────────────────
  const hasRequiredDocs = (requiredDocuments?.length ?? 0) > 0;

  const documentUploadItems = useMemo(() => {
    return (requiredDocuments ?? []).map((doc) => {
      const d = doc as typeof doc & {
        fileUrl?: string;
        fileName?: string;
        originalFilename?: string;
        filename?: string;
        status?: string;
        uploadedFileId?: string | number;
        aiValidationResult?: {
          is_valid_document: boolean;
          description_message: string;
        };
        ai_validation_result?: {
          is_valid_document: boolean;
          description_message: string;
        };
      };
      const local = allDocumentTypes.find((t) => String(t.id) === String(doc.id));
      const cachedUpload = underwritingUploadsForResponse[String(doc.id)];
      const sourceFileUrl = d.fileUrl;
      const sourceFileName = d.fileName ?? d.originalFilename ?? d.filename;
      const sourceAiValidation = d.aiValidationResult ?? d.ai_validation_result;
      const hasServerUploaded = hasUploadedUnderwritingDocument({
        status: d.status,
        fileUrl: sourceFileUrl,
        fileName: sourceFileName,
        uploadedFileId: d.uploadedFileId,
        aiValidationResult: sourceAiValidation,
      });
      const fileUrl =
        local?.fileUrl ??
        cachedUpload?.url ??
        cachedUpload?.fileUrl ??
        (hasServerUploaded ? sourceFileUrl : undefined);
      const fileName =
        local?.fileName ??
        cachedUpload?.originalFilename ??
        cachedUpload?.filename ??
        (hasServerUploaded ? sourceFileName : undefined);
      const isUploaded = hasUploadedUnderwritingDocument({
        status: local?.status ?? (cachedUpload || hasServerUploaded ? 'uploaded' : 'pending'),
        fileUrl,
        fileName,
        uploadedFileId: local?.uploadedFileId ?? cachedUpload?.id ?? d.uploadedFileId,
        aiValidationResult:
          local?.aiValidationResult ?? cachedUpload?.ai_validation_result ?? sourceAiValidation,
      });
      return {
        id: doc.id,
        name: doc.label || '',
        displayLabel: doc.label || '',
        description: doc.description || '',
        required: Boolean(doc.isRequired),
        validationQuestions: doc.validationQuestions ?? [],
        status: (isUploaded ? 'uploaded' : 'pending') as 'pending' | 'uploaded',
        fileSize: null,
        fileUrl,
        fileName,
        uploadedFileId: local?.uploadedFileId ?? cachedUpload?.id ?? d.uploadedFileId,
        aiValidationResult:
          local?.aiValidationResult ?? cachedUpload?.ai_validation_result ?? sourceAiValidation,
      };
    });
  }, [requiredDocuments, allDocumentTypes, underwritingUploadsForResponse]);

  const declarationUploadItems = useMemo(() => {
    return insurerDocuments.map((doc) => {
      const local = declarationDocumentTypes.find((t) => String(t.id) === String(doc.id));
      const cachedUpload = declarationUploadsForResponse[String(doc.id)];
      // For declaration docs, backend may return template URLs.
      // Treat server document as uploaded only when fileUrl exists AND signedUrl is absent.
      const serverUploaded = !!doc.fileUrl && !doc.signedUrl;
      const sourceFileUrl = serverUploaded ? doc.fileUrl || undefined : undefined;
      const sourceFileName = serverUploaded ? doc.originalFilename || undefined : undefined;
      const sourceAiValidation = serverUploaded ? doc.ai_validation_result : undefined;
      const fileUrl =
        local?.fileUrl ??
        cachedUpload?.url ??
        cachedUpload?.fileUrl ??
        (serverUploaded ? sourceFileUrl : undefined);
      const fileName =
        local?.fileName ??
        cachedUpload?.originalFilename ??
        cachedUpload?.filename ??
        (serverUploaded ? sourceFileName : undefined);
      const isUploaded = hasUploadedDeclarationDocument({
        status: local?.status ?? (cachedUpload || serverUploaded ? 'uploaded' : 'pending'),
        fileUrl,
        fileName,
        aiValidationResult:
          local?.aiValidationResult ??
          cachedUpload?.ai_validation_result ??
          sourceAiValidation,
      });
      return {
        id: doc.id,
        name: doc.displayLabel || doc.originalFilename || '',
        displayLabel: doc.displayLabel || doc.originalFilename || '',
        description: doc.description || '',
        required: Boolean(doc.isRequired),
        validationQuestions: doc.validationQuestions ?? [],
        status: (isUploaded ? 'uploaded' : 'pending') as 'pending' | 'uploaded',
        fileSize: null,
        fileName,
        fileUrl,
        aiValidationResult:
          local?.aiValidationResult ??
          cachedUpload?.ai_validation_result ??
          sourceAiValidation,
      };
    });
  }, [insurerDocuments, declarationDocumentTypes, declarationUploadsForResponse]);

  const getMissingEndorsementDocument = useCallback(
    () => {
      return endorsementDocuments.find((doc) => {
        if (!doc.isActive || !doc.isRequired) return false;

        const cachedUpload = endorsementUploadsForResponse[String(doc.id)];

        return !hasUploadedDeclarationDocument({
          status:
            cachedUpload || doc.fileUrl || doc.originalFilename || (doc as { uploadedFileId?: string | number }).uploadedFileId
              ? 'uploaded'
              : 'pending',
          fileUrl:
            cachedUpload?.url ??
            cachedUpload?.fileUrl ??
            doc.fileUrl ??
            undefined,
          fileName:
            cachedUpload?.originalFilename ??
            cachedUpload?.filename ??
            doc.originalFilename ??
            undefined,
          aiValidationResult:
            cachedUpload?.ai_validation_result ??
            doc.ai_validation_result,
        });
      });
    },
    [endorsementDocuments, endorsementUploadsForResponse],
  );

  useEffect(() => {
    latestUnderwritingDocumentsRef.current = documentUploadItems;
  }, [documentUploadItems]);

  useEffect(() => {
    latestDeclarationDocumentsRef.current = declarationUploadItems.map((doc) => ({
      id: doc.id,
      name: doc.name,
      required: doc.required,
      status: doc.status,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      aiValidationResult: doc.aiValidationResult,
    }));
  }, [declarationUploadItems]);

  const hasCurrencyNumberField = useMemo(
    () => hasCurrencyNumberFieldInPages(allRenderablePages),
    [allRenderablePages],
  );

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const fallbackSteps = useProposalSteps(allRenderablePages, requiredDocuments?.length || 0);
  const iconSourceSteps = useProposalSteps(allRenderablePages, 0);

  useDynamicRows({ pages: allRenderablePages, formData, isInitialized, onChange: handleFieldChange });

  const {
    errors: validationErrors,
    validatePage,
    validatePages,
    shouldShowField,
    isFieldRequired,
    clearError,
  } = useFormValidation(formData, allRenderablePages);

  const calculatedPremium = usePremiumCalculation({ productCode, formData });

  const {
    executePageIntegrations,
    executeFieldIntegration,
    getFieldIntegrations,
    executionState: integrationState,
    clearError: clearIntegrationError,
    setError: setIntegrationError,
  } = useIntegrationExecution({
    productId,
    formData,
    onFieldChange: handleFieldChange,
    formResponseId: responseId ? String(responseId) : undefined,
  });

  useEffect(() => {
    const nextResponseId = (savedProposalId || (initialData?.id as string) || null) as string | null;
    const previousResponseId = lastResponseContextRef.current;
    if (previousResponseId === nextResponseId) return;

    // Clear persisted upload cache and local upload mirrors from previous quote context.
    if (previousResponseId) {
      clearUnderwritingUploadsForResponse(previousResponseId);
      clearDeclarationUploadsForResponse(previousResponseId);
      clearEndorsementUploadsForResponse(previousResponseId);
    }

    setResponseId(nextResponseId);
    setAllDocumentTypes([]);
    setDeclarationDocumentTypes([]);
    setAdditionalUnderwritingDocuments([]);
    setAdditionalDeclarationDocuments([]);
    setAdditionalEndorsementDocuments([]);
    setInsurerDocuments([]);
    setEndorsementDocuments([]);
    setSelectedQuoteId(null);
    setIsProposalLocked(false);
    setIntegrationError(null);
    setUnlockedMaxIndex(0);
    setSubmittedMaxIndex(-1);

    hasPrefilledDeclRef.current = false;
    hasPrefilledAdditionalRef.current = false;
    hasPrefilledEndorsementRequiredRef.current = false;
    hasPrefilledEndorsementAdditionalRef.current = false;
    lastDeclFetchKeyRef.current = null;
    lastEndorsementDeclFetchKeyRef.current = null;
    hasJumpedToLockedStepRef.current = false;

    latestUnderwritingDocumentsRef.current = [];
    latestDeclarationDocumentsRef.current = [];
    lastResponseContextRef.current = nextResponseId;
  }, [
    savedProposalId,
    initialData,
    clearUnderwritingUploadsForResponse,
    clearDeclarationUploadsForResponse,
    clearEndorsementUploadsForResponse,
    setIsProposalLocked,
    setSelectedQuoteId,
    setIntegrationError,
  ]);

  useProposalAutosave({
    enabled: true,
    formData,
    pages: allRenderablePages,
    currentPageIndex,
    productCode,
    productName,
    savedProposalId,
    distributorId,
    distributorName,
    calculatedPremium,
  });

  // ── Steps ─────────────────────────────────────────────────────────────────
  const steps = useMemo(() => {
    const wfSteps = Array.isArray(workflow?.steps) ? [...workflow!.steps] : null;
    const shouldShowRevisedQuoteStep =
      endorsementIdProp && endorsementType !== 'non_technical';

    const getIconFor = (title: string) => {
      const match = iconSourceSteps.find((s) => s.label === title);
      return match ? match.icon : iconSourceSteps[0]?.icon;
    };

    if (!wfSteps || wfSteps.length === 0) {
      if (endorsementIdProp) {
        const endorsementSteps = activePages.map((p, idx) => ({
          id: p.id as string,
          label: p.title,
          icon: getIconFor(p.title),
          index: idx,
        }));

        activeAdditionalInformationPages.forEach((p) =>
          endorsementSteps.push({
            id: p.id as string,
            label: p.title,
            icon: getIconFor(p.title),
            index: endorsementSteps.length,
          }),
        );

        endorsementSteps.push({
          id: 'endorsement_documents',
          label: 'Endorsement Documents',
          icon: getIconFor('Policy Issuance Documents'),
          index: endorsementSteps.length,
        });

        if (shouldShowRevisedQuoteStep) {
          endorsementSteps.push({
            id: 'revised_quote',
            label: "CEW's",
            icon: RefreshCw,
            index: endorsementSteps.length,
          });
        }

        endorsementSteps.push({
          id: 'endorsement_changes',
          label: 'Summary of Changes',
          icon: FileEdit,
          index: endorsementSteps.length,
        });

        return endorsementSteps;
      }

      return [
        ...fallbackSteps,
        { id: 'payment', label: 'Payment', icon: CreditCard, index: fallbackSteps.length },
      ];
    }

    wfSteps.sort((a: any, b: any) => (a.stepOrder || 0) - (b.stepOrder || 0));
    const result: Array<{ id: string; label: string; icon: any; index: number }> = [];
    const pushStepIfMissing = (step: { id: string; label: string; icon: any }) => {
      if (result.some((existing) => existing.id === step.id)) return;
      result.push({ ...step, index: result.length });
    };

    wfSteps.forEach((s: any) => {
      const key = String(s?.component?.key || '').toLowerCase();
      if (endorsementIdProp) {
        if (key === 'proposal_form') {
          activePages.forEach((p) =>
            result.push({
              id: p.id as string,
              label: p.title,
              icon: getIconFor(p.title),
              index: result.length,
            }),
          );
        } else if (key === 'additional_information') {
          activeAdditionalInformationPages.forEach((p) =>
            result.push({
              id: p.id as string,
              label: p.title,
              icon: getIconFor(p.title),
              index: result.length,
            }),
          );
        } else if (key === 'policy_issuance_documents') {
          pushStepIfMissing({
            id: 'endorsement_documents',
            label: 'Endorsement Documents',
            icon: getIconFor('Policy Issuance Documents'),
          });
        } else if (key === 'quotes_list' && shouldShowRevisedQuoteStep) {
          pushStepIfMissing({
            id: 'revised_quote',
            label: "CEW's",
            icon: RefreshCw,
          });
        }
        return;
      }

      if (key === 'proposal_form') {
        activePages.forEach((p) =>
          result.push({
            id: p.id as string,
            label: p.title,
            icon: getIconFor(p.title),
            index: result.length,
          }),
        );
      } else if (key === 'additional_information') {
        activeAdditionalInformationPages.forEach((p) =>
          result.push({
            id: p.id as string,
            label: p.title,
            icon: getIconFor(p.title),
            index: result.length,
          }),
        );
      } else if ((key === 'required_documents' || key === 'underwriting_documents') && !endorsementIdProp) {
        const isSpecialProduct = productId === 'd85a17e7-c24c-4fa7-ad68-ef9c72561b44';
        if (!isSpecialProduct || hasRequiredDocs) {
          pushStepIfMissing({
            id: 'required_documents',
            label: 'Underwriting Documents',
            icon: getIconFor('Underwriting Documents'),
          });
        }
      } else if (key === 'quotes_list' && !endorsementIdProp) {
        pushStepIfMissing({
          id: 'quotes_comparison',
          label: 'Quotes',
          icon: getIconFor('Quotes'),
        });
      } else if ((key === 'policy_details' || key === 'policy_issuance_documents') && !endorsementIdProp) {
        pushStepIfMissing({
          id: 'declaration_documents',
          label: 'Policy Issuance Documents',
          icon: getIconFor('Policy Issuance Documents'),
        });
      }
    });

    if (endorsementIdProp) {
      pushStepIfMissing({
        id: 'endorsement_changes',
        label: 'Summary of Changes',
        icon: FileEdit,
      });
    }

    // Always show a step for additional documents when user has quotes
    const hasQuotesStep = result.some((r) => r.id === 'quotes_comparison');
    const hasDeclarationStep = result.some((r) => r.id === 'declaration_documents');
    if (hasQuotesStep && !hasDeclarationStep) {
      result.push({
        id: 'declaration_documents',
        label: 'Policy Issuance Documents',
        icon: getIconFor('Policy Issuance Documents'),
        index: result.length,
      });
    }

    if (!endorsementIdProp) {
      result.push({ id: 'payment', label: 'Payment', icon: CreditCard, index: result.length });
    }

    if (result.length > 0) return result;

    return [
      ...fallbackSteps,
      { id: 'payment', label: 'Payment', icon: CreditCard, index: fallbackSteps.length },
    ];
  }, [
    workflow,
    activePages,
    activeAdditionalInformationPages,
    hasRequiredDocs,
    productId,
    fallbackSteps,
    iconSourceSteps,
    endorsementIdProp,
    endorsementType,
  ]);

  const [endorsementDifferenceData, setEndorsementDifferenceData] =
    useState<EndorsementDifferenceResponse | null>(null);
  const [endorsementDifferenceLoading, setEndorsementDifferenceLoading] = useState(false);
  const [endorsementDifferenceError, setEndorsementDifferenceError] = useState<string | null>(null);

  // ── Derived page info ──────────────────────────────────────────────────────
  const currentStepId = steps[currentPageIndex]?.id;
  const quotesStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === 'quotes_comparison'),
    [steps],
  );
  const isStepBeforeQuotes =
    quotesStepIndex > 0 && currentPageIndex === quotesStepIndex - 1;
  const dynamicPageIndex = allRenderablePages.findIndex((p) => p.id === currentStepId);
  const currentPage: Page | null =
    dynamicPageIndex >= 0 ? allRenderablePages[dynamicPageIndex] : null;
  const lastActiveProposalFormPageId = activePages[activePages.length - 1]?.id ?? null;
  const isCurrentPageAdditionalInformation = Boolean(
    currentPage?.id &&
    additionalInformationPages.some((page) => page.id === currentPage.id),
  );

  const buildSavePayload = useCallback(
    (page: Page, fieldValues: SaveProposalFormRequest['fieldValues']): SaveProposalFormRequest => ({
      templateId,
      templateVersionId,
      productId,
      responseId,
      currentPageId: page.id,
      fieldValues,
      isAdditionalInformation: isCurrentPageAdditionalInformation,
      isLastProposalFormPage: page.id === lastActiveProposalFormPageId,
      brokerOrganizationId: distributorId,
    }),
    [
      templateId,
      templateVersionId,
      productId,
      responseId,
      isCurrentPageAdditionalInformation,
      lastActiveProposalFormPageId,
      distributorId,
    ],
  );

  // ── Section visibility ─────────────────────────────────────────────────────
  const shouldShowSection = (section: Section): boolean => {
    if (!isMetadataActive(section)) return false;
    if (!section.fields || section.fields.length === 0) return false;

    const visibility = section.metadata?.visibility;
    if (visibility) {
      const allFields = allRenderablePages.flatMap((p) =>
        (p.sections || []).flatMap((s) => s.fields || []),
      );
      const depField = allFields.find(
        (f) => f.name === visibility.field || f.id === visibility.field,
      );
      const rawDepValue = depField ? formData[depField.name] : formData[visibility.field];
      if (!isSectionVisibilitySatisfied(visibility, depField, rawDepValue)) return false;
    }

    return section.fields.some((field) => shouldShowField(field));
  };

  const handleFieldChangeWrapper = useCallback(
    (name: string, value: any) => {
      handleFieldChange(name, value);
      if (
        validationErrors[name] ||
        Object.keys(validationErrors).some((k) => k.startsWith(`${name}.`))
      ) {
        clearError(name);
      }
    },
    [handleFieldChange, validationErrors, clearError],
  );

  const handleOpenMap = useCallback((fieldId: string) => {
    setActiveLocationFieldId(fieldId);
    setIsLocationModalOpen(true);
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Initialise form data
  useEffect(() => {
    if (isInitialized) return;
    setFormData((prev) => initializeFormData(allRenderablePages, initialData, prev));
  }, [allRenderablePages, initialData, isInitialized]);

  useEffect(() => {
    const scrollActiveStepIntoView = (container: HTMLDivElement | null) => {
      if (!container) return;

      const activeStep = container.querySelector<HTMLElement>(
        `[data-step-index="${currentPageIndex}"]`,
      );

      if (!activeStep) return;

      activeStep.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    };

    const animationFrame = window.requestAnimationFrame(() => {
      scrollActiveStepIntoView(mobileStepsScrollRef.current);
      scrollActiveStepIntoView(desktopStepsScrollRef.current);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [currentPageIndex, steps.length]);

  // Jump to quotes step if proposal is already locked on load.
  // IMPORTANT: Use a ref guard so this fires EXACTLY ONCE — never on re-renders.
  // Previously, initialData was an unstable reference (new object each render),
  // causing this effect to re-fire whenever onQuoteSelected advanced the step,
  // which immediately reset currentPageIndex back to quotes_comparison.
  const hasJumpedToLockedStepRef = useRef(false);
  const revisedQuoteRef = useRef<QuotesComparisonRef>(null);

  useEffect(() => {
    if (!endorsementIdProp || currentStepId !== 'endorsement_changes') return;

    let isMounted = true;

    (async () => {
      try {
        setEndorsementDifferenceLoading(true);
        setEndorsementDifferenceError(null);
        const data = await getEndorsementDifference(endorsementIdProp);
        if (!isMounted) return;
        setEndorsementDifferenceData(data);
      } catch (error: unknown) {
        if (!isMounted) return;
        const message =
          error instanceof Error ? error.message : 'Failed to load endorsement changes.';
        setEndorsementDifferenceError(message);
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        if (isMounted) {
          setEndorsementDifferenceLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentStepId, endorsementIdProp, toast]);

  useEffect(() => {
    if (hasJumpedToLockedStepRef.current) return; // already ran
    if (!initialData?.isLocked || steps.length === 0) return; // nothing to do
    const quotesIndex = steps.findIndex((s) => s.id === 'quotes_comparison');
    if (quotesIndex >= 0) {
      hasJumpedToLockedStepRef.current = true; // mark as done before state updates
      setCurrentPageIndex(quotesIndex);
      setUnlockedMaxIndex((prev) => Math.max(prev, quotesIndex));
      setSubmittedMaxIndex((prev) => Math.max(prev, quotesIndex - 1));
    }
  }, [steps]); // steps is sufficient — initialData.isLocked is captured via closure but is now stable

  // Check if form is blocked by a previously failed integration
  useEffect(() => {
    if (!initialData?.integrationBlockedInfo) return;
    const block = initialData.integrationBlockedInfo as IntegrationBlockedInfo;
    setIntegrationError({
      title: `Integration Failed: ${block.integrationName}`,
      message: block.errorMessage,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount — initialData is stable after initial load

  // When allowFreeNavigation (e.g. endorsement with prefilled data), unlock all steps
  useEffect(() => {
    if (!endorsementIdProp && allowFreeNavigation && steps.length > 0) {
      setUnlockedMaxIndex((prev) => Math.max(prev, steps.length - 1));
    }
  }, [allowFreeNavigation, steps.length, endorsementIdProp]);

  // Register global onQuoteSelected callback
  useEffect(() => {
    (window as any).onQuoteSelected = (_quoteId: number) => {
      // Always advance to the immediate next step after quotes in the
      // workflow-driven step list, whatever that next step happens to be.
      let idx = -1;
      const quotesIdx = steps.findIndex((s) => s.id === 'quotes_comparison');
      if (quotesIdx >= 0 && quotesIdx < steps.length - 1) {
        idx = quotesIdx + 1;
      }
      if (idx >= 0) {
        setCurrentPageIndex(idx);
        setUnlockedMaxIndex((prev) => Math.max(prev, idx));
        setSubmittedMaxIndex((prev) => Math.max(prev, idx - 1));
      }
    };
    return () => {
      try {
        delete (window as any).onQuoteSelected;
      } catch { }
    };
  }, [steps]);

  // Update parent step tracking for Header back-button confirmation dialog
  useEffect(() => {
    onStepChange?.(currentPageIndex);
  }, [currentPageIndex, onStepChange]);

  // Update parent completion tracking whenever submittedMaxIndex increases
  useEffect(() => {
    if (onStepCompletionChange && steps.length > 0) {
      const status: Record<string, boolean> = {};
      steps.forEach((step, idx) => {
        // Map dynamic step titles to legacy hardcoded keys so the Discontinue dialog
        // in Proposal.tsx can still display the completed steps list.
        const isReached = idx <= submittedMaxIndex;
        // 1. Dynamic Pages -> Title-based matching (e.g. "Project Details" -> "project_details")
        const titleMatch = step.label.replace(/\s+/g, '_').replace(/-/g, '_').toLowerCase();
        status[titleMatch] = isReached;

        // 2. Fixed Steps -> Map to legacy v2 property names
        if (step.id === 'required_documents') status['underwriting_documents'] = isReached;
        if (step.id === 'quotes_comparison') {
          status['coverages_selected'] = isReached;
          status['plans_selected'] = isReached;
        }
        if (step.id === 'declaration_documents') status['policy_required_documents'] = isReached;
        if (step.id === 'payment') status['policy_issued'] = isReached;
      });

      // Always inject at least one legacy key if we've completed step 0
      // so the UI box triggers (it checks specific keys like project_details)
      if (submittedMaxIndex >= 0) {
        status['project_details'] = true;
      }
      onStepCompletionChange(status);
    }
  }, [submittedMaxIndex, steps, onStepCompletionChange]);

  // Prefill declaration documents from editData (e.g. policy bundle / endorsement flow)
  const editDeclDocs = (editData as any)?.declarationDocuments as Array<{ id: string; originalFilename?: string; filename?: string; url: string; contentType?: string; sizeBytes?: string | number }> | undefined;
  const hasPrefilledDeclRef = useRef(false);
  useEffect(() => {
    if (!editDeclDocs?.length || hasPrefilledDeclRef.current) return;
    hasPrefilledDeclRef.current = true;
    const mapped = editDeclDocs.map((d) => ({
      id: d.id,
      productId: productId || '',
      organizationId: '',
      marketUserId: '',
      displayLabel: d.originalFilename || d.filename || d.id,
      description: '',
      isRequired: true,
      isActive: true,
      fileUrl: d.url,
      originalFilename: d.originalFilename || d.filename || undefined,
    })) as RequiredDocumentForInsurer[];
    setInsurerDocuments(mapped);
  }, [editDeclDocs, productId]);

  // Prefill additional documents from editData (e.g. policy bundle / endorsement flow)
  const editAdditionalDocs = (editData as any)?.additionalDocuments as Array<{ id: string; documentName?: string; originalFilename?: string; filename?: string; url: string; contentType?: string }> | undefined;
  const hasPrefilledAdditionalRef = useRef(false);
  useEffect(() => {
    if (!editAdditionalDocs?.length || hasPrefilledAdditionalRef.current) return;
    hasPrefilledAdditionalRef.current = true;
    const mapped = editAdditionalDocs.map((d) => ({
      id: d.id,
      title: d.originalFilename || d.filename || d.documentName || d.id,
      fileUrl: d.url,
      fileName: d.originalFilename || d.filename || undefined,
      contentType: d.contentType,
    }));
    setAdditionalDeclarationDocuments(mapped);
    setAdditionalUnderwritingDocuments(mapped);
  }, [editAdditionalDocs]);

  // Prefill endorsement required documents from editData (endorsement render API)
  const editEndorsementRequiredDocs = (editData as any)?.endorsementRequiredDocuments as Array<{ id: string; originalFilename?: string; filename?: string; url: string; contentType?: string; sizeBytes?: string | number }> | undefined;
  const hasPrefilledEndorsementRequiredRef = useRef(false);
  useEffect(() => {
    if (!editEndorsementRequiredDocs?.length || hasPrefilledEndorsementRequiredRef.current) return;
    hasPrefilledEndorsementRequiredRef.current = true;
    const mapped = editEndorsementRequiredDocs.map((d) => ({
      id: d.id,
      productId: productId || '',
      organizationId: '',
      marketUserId: '',
      displayLabel: d.originalFilename || d.filename || d.id,
      description: '',
      isRequired: true,
      isActive: true,
      fileUrl: d.url,
      originalFilename: d.originalFilename || d.filename || undefined,
    })) as RequiredDocumentForInsurer[];
    setEndorsementDocuments(mapped);
  }, [editEndorsementRequiredDocs, productId]);

  // Prefill endorsement additional documents from editData (endorsement render API)
  const editEndorsementAdditionalDocs = (editData as any)?.endorsementAdditionalDocuments as Array<{ id: string; documentName?: string; originalFilename?: string; filename?: string; url: string; contentType?: string }> | undefined;
  const hasPrefilledEndorsementAdditionalRef = useRef(false);
  useEffect(() => {
    if (!editEndorsementAdditionalDocs?.length || hasPrefilledEndorsementAdditionalRef.current) return;
    hasPrefilledEndorsementAdditionalRef.current = true;
    const mapped = editEndorsementAdditionalDocs.map((d) => ({
      id: d.id,
      title: d.originalFilename || d.filename || d.documentName || d.id,
      fileUrl: d.url,
      fileName: d.originalFilename || d.filename || undefined,
      contentType: d.contentType,
    }));
    setAdditionalEndorsementDocuments(mapped);
  }, [editEndorsementAdditionalDocs]);

  // Fetch declaration documents when arriving at that step (skip if already prefilled from editData)
  const { insurerOrganizationId, insurerId, setSelection } = useQuoteSelectionStore();
  const resolvedInsurerFromPremiumRef = useRef<string | null>(null);

  // Keep insurer context aligned with revised-quote source for all endorsement flows,
  // including non-technical flow where revised-quote step is skipped.
  useEffect(() => {
    if (!endorsementIdProp) return;
    if (resolvedInsurerFromPremiumRef.current === endorsementIdProp) return;
    let mounted = true;
    (async () => {
      try {
        const premiumRes = await calculateEndorsementPremium(endorsementIdProp);
        const sourceInsurers = (premiumRes as any)?.insurers ?? (premiumRes as any)?.results ?? [];
        const firstInsurer = Array.isArray(sourceInsurers) ? sourceInsurers[0] : null;
        const derivedInsurerId =
          firstInsurer?.insurerId ??
          firstInsurer?.insurer_id ??
          firstInsurer?.organizationId ??
          firstInsurer?.insurerOrganizationId ??
          null;
        if (!mounted || derivedInsurerId == null || String(derivedInsurerId).trim() === '') return;
        const normalizedId =
          typeof derivedInsurerId === 'number' ? derivedInsurerId : String(derivedInsurerId);
        setSelection({
          insurerId: normalizedId,
          insurerOrganizationId: normalizedId,
          productId: productId || null,
          responseId: responseId || null,
        });
        localStorage.setItem('selected_insurer_id', String(normalizedId));
        localStorage.setItem('selected_insurer_org_id', String(normalizedId));
        resolvedInsurerFromPremiumRef.current = endorsementIdProp;
      } catch (e) {
        console.error('[Endorsement] Failed to resolve insurer context from premium response:', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [endorsementIdProp, productId, responseId, setSelection]);

  const resolvedInsurerOrganizationId = useMemo(() => {
    const fromEditData =
      (editData as { endorsement?: { organizationId?: string; insurerId?: string } })?.endorsement
        ?.organizationId ??
      (editData as { endorsement?: { organizationId?: string; insurerId?: string } })?.endorsement
        ?.insurerId ??
      (editData as { quote_meta?: { insurer_id?: string | number } })?.quote_meta?.insurer_id;
    const fromLocalStorage =
      localStorage.getItem('selected_insurer_org_id') || localStorage.getItem('selected_insurer_id');
    const fromAuth = getInsurerCompanyId();
    if (endorsementIdProp) {
      return fromEditData ?? insurerOrganizationId ?? fromLocalStorage ?? fromAuth ?? null;
    }
    return insurerOrganizationId ?? fromEditData ?? fromLocalStorage ?? fromAuth ?? null;
  }, [insurerOrganizationId, editData, endorsementIdProp]);

  const resolvedInsurerId = useMemo(() => {
    const fromEditData =
      (editData as { endorsement?: { insurerId?: string } })?.endorsement?.insurerId ??
      (editData as { quote_meta?: { insurer_id?: string | number } })?.quote_meta?.insurer_id;
    const fromLocalStorage = localStorage.getItem('selected_insurer_id');
    if (endorsementIdProp) {
      return fromEditData ?? insurerId ?? fromLocalStorage ?? null;
    }
    return insurerId ?? fromEditData ?? fromLocalStorage ?? null;
  }, [editData, endorsementIdProp, insurerId]);

  // Ensure insurer organization context is available for endorsement documents flow
  // (non-technical endorsements can skip revised-quote, so quote-selection may not be set yet).
  useEffect(() => {
    if (!endorsementIdProp) return;
    const isOnEndorsementDocuments = steps[currentPageIndex]?.id === 'endorsement_documents';
    if (!isOnEndorsementDocuments) return;
    if (!resolvedInsurerOrganizationId) return;
    if (
      insurerOrganizationId === resolvedInsurerOrganizationId &&
      (resolvedInsurerId == null || insurerId === resolvedInsurerId)
    ) {
      return;
    }
    setSelection({
      insurerOrganizationId: resolvedInsurerOrganizationId,
      insurerId: resolvedInsurerId,
      productId: productId || null,
      responseId: responseId || null,
    });
  }, [
    endorsementIdProp,
    steps,
    currentPageIndex,
    resolvedInsurerOrganizationId,
    resolvedInsurerId,
    insurerOrganizationId,
    insurerId,
    setSelection,
    productId,
    responseId,
  ]);
  const lastDeclFetchKeyRef = useRef<string | null>(null);
  const fetchDeclarationDocuments = useCallback(
    async (force = false) => {
      if (!productId || !resolvedInsurerOrganizationId) return;
      const fetchKey = `${productId}-${resolvedInsurerOrganizationId}`;
      if (!force && lastDeclFetchKeyRef.current === fetchKey) return;
      lastDeclFetchKeyRef.current = fetchKey;
      try {
        const docs = await getRequiredDocumentsForInsurer(
          productId as any,
          resolvedInsurerOrganizationId as any,
        );
        setInsurerDocuments(Array.isArray(docs) ? docs : []);
      } catch (e) {
        console.error('[Declaration] Failed to fetch required documents:', e);
      }
    },
    [productId, resolvedInsurerOrganizationId],
  );
  useEffect(() => {
    const isOnDeclaration = steps[currentPageIndex]?.id === 'declaration_documents';
    if (!isOnDeclaration) return;

    // In edit flow, only skip fetch when render API already has declaration docs.
    // If render API returns [], we intentionally fall back to create-flow fetch path.
    const hasPrefilledFromRender = Array.isArray(editDeclDocs) && editDeclDocs.length > 0;
    if (hasPrefilledFromRender) return;

    void fetchDeclarationDocuments();
  }, [currentPageIndex, steps, editDeclDocs, fetchDeclarationDocuments]);

  // Fetch endorsement required documents when on endorsement_documents step.
  // Call API when endorsementRequiredDocuments from render is empty [] or when we need initial list.
  const lastEndorsementDeclFetchKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const hasPrefilledFromRender = Array.isArray(editEndorsementRequiredDocs) && editEndorsementRequiredDocs.length > 0;
    if (hasPrefilledFromRender) return;
    const isOnEndorsementDocuments = steps[currentPageIndex]?.id === 'endorsement_documents';
    if (!isOnEndorsementDocuments || !productId || !resolvedInsurerOrganizationId) return;
    const fetchKey = `${productId}-${resolvedInsurerOrganizationId}`;
    if (lastEndorsementDeclFetchKeyRef.current === fetchKey) return;
    lastEndorsementDeclFetchKeyRef.current = fetchKey;
    let mounted = true;
    (async () => {
      try {
        const docs = await getEndorsementRequiredDocumentsForInsurer(
          productId as any,
          resolvedInsurerOrganizationId as any
        );
        if (mounted) setEndorsementDocuments(Array.isArray(docs) ? docs : []);
      } catch (e) {
        console.error('[Endorsement Documents] Failed to fetch required documents:', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentPageIndex, steps, productId, resolvedInsurerOrganizationId, editEndorsementRequiredDocs]);

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const openAddAdditionalDocDialog = useCallback((target: 'declaration' | 'endorsement' | 'underwriting' = 'declaration') => {
    additionalDocTargetRef.current = target;
    setAdditionalDocPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setNewAdditionalDoc({ title: '', file: null });
    setIsAddAdditionalDocOpen(true);
    if (additionalDocInputRef.current) additionalDocInputRef.current.value = '';
  }, []);

  const handleAdditionalDocFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const allowed = ADDITIONAL_DOC_ALLOWED_TYPES.includes(
        file.type as (typeof ADDITIONAL_DOC_ALLOWED_TYPES)[number],
      );
      if (!allowed) {
        toast({
          title: 'Invalid file type',
          description: `Allowed types: ${ADDITIONAL_DOC_ALLOWED_MESSAGE}.`,
          variant: 'destructive',
        });
        e.target.value = '';
        return;
      }
      setAdditionalDocPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      });
      setNewAdditionalDoc((prev) => ({ ...prev, file }));
    },
    [toast],
  );

  const handleAdditionalDocFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      const allowed = ADDITIONAL_DOC_ALLOWED_TYPES.includes(
        file.type as (typeof ADDITIONAL_DOC_ALLOWED_TYPES)[number],
      );
      if (!allowed) {
        toast({
          title: 'Invalid file type',
          description: `Allowed types: ${ADDITIONAL_DOC_ALLOWED_MESSAGE}.`,
          variant: 'destructive',
        });
        return;
      }
      setAdditionalDocPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      });
      setNewAdditionalDoc((prev) => ({ ...prev, file }));
    },
    [toast],
  );

  const removeAdditionalDocFile = useCallback(() => {
    setAdditionalDocPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setNewAdditionalDoc((prev) => ({ ...prev, file: null }));
    if (additionalDocInputRef.current) additionalDocInputRef.current.value = '';
  }, []);

  const submitAdditionalDocument = useCallback(async () => {
    const title = newAdditionalDoc.title?.trim();
    const file = newAdditionalDoc.file;
    if (!title) {
      toast({
        title: 'Title required',
        description: 'Please enter a document title.',
        variant: 'destructive',
      });
      return;
    }
    if (!file) {
      toast({
        title: 'Document required',
        description: 'Please add a document file.',
        variant: 'destructive',
      });
      return;
    }
    const allowedType = ADDITIONAL_DOC_ALLOWED_TYPES.includes(
      file.type as (typeof ADDITIONAL_DOC_ALLOWED_TYPES)[number],
    );
    if (!allowedType) {
      toast({
        title: 'Invalid file type',
        description: `Allowed types: ${ADDITIONAL_DOC_ALLOWED_MESSAGE}.`,
        variant: 'destructive',
      });
      return;
    }
    if (!responseId) {
      toast({
        title: 'Proposal required',
        description: 'Please save the proposal first.',
        variant: 'destructive',
      });
      return;
    }
    setIsUploadingAdditionalDoc(true);
    try {
      const resp =
        additionalDocTargetRef.current === 'endorsement'
          ? await uploadEndorsementAdditionalDocument(responseId, file, title, endorsementIdProp ?? undefined)
          : await uploadAdditionalDocument(responseId, file, title);
      const fileUrl = resp?.url ?? resp?.fileUrl ?? '';
      const fileName = resp?.originalFilename ?? resp?.filename ?? file.name;
      const contentType = resp?.contentType ?? file.type;
      const id =
        resp?.id != null
          ? resp.id
          : `additional-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const sizeBytes = resp?.size ?? file.size;
      const formattedSize = formatFileSize(sizeBytes);
      const newEntry = {
        id,
        title,
        fileUrl: fileUrl || undefined,
        fileName: fileName || file.name,
        contentType: contentType || undefined,
        fileSize: formattedSize,
      };
      if (additionalDocTargetRef.current === 'endorsement') {
        setAdditionalEndorsementDocuments((prev) => prev.concat(newEntry));
      } else if (additionalDocTargetRef.current === 'underwriting') {
        setAdditionalUnderwritingDocuments((prev) => prev.concat(newEntry));
      } else {
        setAdditionalDeclarationDocuments((prev) => prev.concat(newEntry));
      }
      toast({
        title: 'Document added',
        description: 'Additional document has been added successfully.',
      });
      setAdditionalDocPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setIsAddAdditionalDocOpen(false);
      setNewAdditionalDoc({ title: '', file: null });
      if (additionalDocInputRef.current) additionalDocInputRef.current.value = '';
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || 'Failed to upload document. Please try again.';
      toast({ title: 'Upload failed', description: message, variant: 'destructive' });
    } finally {
      setIsUploadingAdditionalDoc(false);
    }
  }, [newAdditionalDoc, responseId, toast, endorsementIdProp]);

  const handleDeleteAdditionalEndorsementDoc = useCallback(
    async (doc: { id: string | number; title: string; fileUrl?: string }) => {
      if (typeof doc.id === 'string' && doc.id.startsWith('additional-')) {
        setAdditionalEndorsementDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        toast({ title: 'Document removed', description: `${doc.title} has been removed.` });
        return;
      }
      setDeletingAdditionalEndorsementDocId(doc.id);
      try {
        await deleteUploadedFile(doc.id);
        setAdditionalEndorsementDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        toast({ title: 'Document removed', description: `${doc.title} has been removed.` });
      } catch (err: unknown) {
        const message =
          (err as { message?: string })?.message || 'Failed to delete file. Please try again.';
        toast({ title: 'Delete failed', description: message, variant: 'destructive' });
      } finally {
        setDeletingAdditionalEndorsementDocId(null);
      }
    },
    [toast],
  );

  const handleDeleteAdditionalDoc = useCallback(
    async (doc: AdditionalDeclarationDoc) => {
      if (typeof doc.id === 'string' && doc.id.startsWith('additional-')) {
        setAdditionalDeclarationDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        toast({ title: 'Document removed', description: `${doc.title} has been removed.` });
        return;
      }
      setDeletingAdditionalDocId(doc.id);
      try {
        await deleteUploadedFile(doc.id);
      } catch (err: unknown) {
        const message =
          (err as { message?: string })?.message || 'Failed to delete file. Please try again.';
        toast({ title: 'Delete failed', description: message, variant: 'destructive' });
        setDeletingAdditionalDocId(null);
        return;
      }
      setDeletingAdditionalDocId(null);
      if (additionalDocTargetRef.current === 'underwriting' || steps[currentPageIndex]?.id === 'required_documents') {
        setAdditionalUnderwritingDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      } else {
        setAdditionalDeclarationDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      }
      toast({ title: 'Document removed', description: `${doc.title} has been removed.` });
    },
    [toast],
  );

  const handleAutoFill = useCallback(() => {
    // Trigger the hidden file input
    if (autoFillInputRef.current) {
      autoFillInputRef.current.value = ''; // Reset input so same file can be selected again
      autoFillInputRef.current.click();
    }
  }, []);


  const handleAutoFillFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAutoFilling(true);
    try {
      toast({
        title: 'Extracting data',
        description: 'Uploading document and extracting data...',
      });

      const response = await apiUploadFile<{
        summary: {
          data: Array<{
            fieldName: string;
            label: string;
            type: string;
            valueText?: string;
            value?: unknown;
            valueJson?: unknown;
            masterValueId?: string | null;
          }>;
        };
      }>(
        '/document-extraction/extract-json',
        file,
        undefined,
        'file',
        { productId: productId || '' }
      );

      console.log('EXTRACTED DATA RESPONSE:', response);

      // Build lookup maps for subfields (tables/grids) across all pages:
      const subFieldIdToName: Record<string, string> = {};
      const subFieldLabelToName: Record<string, string> = {};
      const subFieldNameToName: Record<string, string> = {};
      const fieldNameToFormType: Record<string, string> = {};

      for (const page of allRenderablePages) {
        for (const section of page.sections || []) {
          for (const field of section.fields || []) {
            if (field.name) {
              fieldNameToFormType[field.name] = field.type;
            }
            if ((field.type === 'combination' || field.type === 'repeatable') && field.subFields) {
              for (const sf of field.subFields) {
                if (sf.id) subFieldIdToName[sf.id] = sf.name;
                if (sf.label) subFieldLabelToName[sf.label.trim()] = sf.name;
                if (sf.name) subFieldNameToName[sf.name] = sf.name;
              }
            }
          }
        }
      }

      const extracted = response?.summary?.data || [];
      let filledCount = 0;

      for (const item of extracted) {
        const { fieldName, valueText, value, valueJson } = item;

        // ── 1. Combination / Repeatable via valueJson ──
        if (Array.isArray(valueJson) && valueJson.length > 0) {
          const rows = (valueJson as Array<{ label: string; value: Array<{ id?: string; label?: string; fieldName?: string; value: unknown }> }>)
            .map((row) => {
              const rowObj: Record<string, unknown> = {};
              for (const subItem of row.value || []) {
                const sfName =
                  (subItem.id ? subFieldIdToName[subItem.id] : null) ??
                  (subItem.fieldName ? subFieldNameToName[subItem.fieldName] : null) ??
                  (subItem.label ? subFieldLabelToName[String(subItem.label || '').trim()] : null);

                if (sfName) rowObj[sfName] = subItem.value;
              }
              return rowObj;
            });
          handleFieldChange(fieldName, rows);
          filledCount++;
          continue;
        }

        // ── 2. Combination / Repeatable via `value` (legacy fallback) ──
        if (Array.isArray(value) && value.length > 0) {
          const firstItem = (value as any[])[0];
          if (firstItem && typeof firstItem === 'object' && Array.isArray(firstItem.value)) {
            const rows = (value as Array<{ label: string; value: Array<{ label?: string; fieldName?: string; value: unknown }> }>)
              .map((row) => {
                const rowObj: Record<string, unknown> = {};
                for (const subItem of row.value || []) {
                  const colLabel = String(subItem.label || subItem.fieldName || '').trim();
                  const sfName =
                    subFieldNameToName[colLabel] ??
                    subFieldLabelToName[colLabel] ??
                    subFieldIdToName[colLabel];

                  if (sfName) {
                    rowObj[sfName] = subItem.value;
                  } else if (colLabel) {
                    rowObj[colLabel] = subItem.value;
                  }
                }
                return rowObj;
              });
            handleFieldChange(fieldName, rows);
            filledCount++;
            continue;
          }
        }

        const formFieldType = fieldName ? fieldNameToFormType[fieldName] : undefined;
        if (extractionItemLooksLikePeriodField(item.type, formFieldType)) {
          const period = parseExtractedPeriodPayload(value, valueText);
          if (period) {
            handleFieldChange(fieldName, period);
            filledCount++;
          }
          continue;
        }

        // ── 3. Simple scalar fields ──
        let scalar: any = valueText !== undefined && valueText !== null && valueText !== ''
          ? valueText
          : (typeof value === 'string' || typeof value === 'number')
            ? String(value)
            : null;

        if (scalar === null || (typeof scalar === 'string' && scalar === '')) continue;

        // Coerce string booleans to actual booleans for checkbox fields
        if (formFieldType === 'checkbox') {
          scalar = scalar === true || scalar === 'true' || scalar === '1' || scalar === 'yes';
        }

        handleFieldChange(fieldName, scalar);
        filledCount++;
      }

      toast({
        title: 'Auto Fill Complete',
        description: `${filledCount} field(s) filled from the document.`,
      });
    } catch (error) {
      console.error('Auto fill failed:', error);
      toast({
        title: 'Error',
        description: 'Document extraction failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAutoFilling(false);
    }
  }, [allRenderablePages, toast, handleFieldChange, productId]);




  const handleQuotesLoaded = useCallback((hasQuotes: boolean) => {
    if (hasQuotes) setIsProposalLocked(true);
  }, []);

  const isStepDirectNavigationDisabled = useCallback(
    (index: number): boolean => {
      const baseDisabled = index !== currentPageIndex && index > unlockedMaxIndex;
      if (baseDisabled) return true;
      if (endorsementIdProp) {
        const revisedQuoteIndex = steps.findIndex((s) => s.id === 'revised_quote');
        const isPostRevised = revisedQuoteIndex >= 0 && index > revisedQuoteIndex;
        if (isPostRevised && index !== currentPageIndex) return true;
      }
      return false;
    },
    [currentPageIndex, unlockedMaxIndex, endorsementIdProp, steps],
  );

  const hasUploadedDeclarationFile = useCallback(
    (doc: RequiredDocumentForInsurer) => Boolean(doc.fileUrl) && !Boolean(doc.signedUrl),
    [],
  );

  const getMissingDeclarationDocument = useCallback(
    () => {
      return insurerDocuments.find((doc) => {
        if (!Boolean(doc.isRequired)) return false;

        const local = declarationDocumentTypes.find((item) => String(item.id) === String(doc.id));
        const cachedUpload = declarationUploadsForResponse[String(doc.id)];
        const hasServerUploaded = Boolean(doc.fileUrl) && !Boolean(doc.signedUrl);

        return !hasUploadedDeclarationDocument({
          status: local?.status ?? (hasServerUploaded ? 'uploaded' : 'pending'),
          fileUrl:
            local?.fileUrl ??
            cachedUpload?.url ??
            cachedUpload?.fileUrl ??
            (hasServerUploaded ? doc.fileUrl || undefined : undefined),
          fileName:
            local?.fileName ??
            cachedUpload?.originalFilename ??
            cachedUpload?.filename ??
            (hasServerUploaded ? doc.originalFilename || undefined : undefined),
          aiValidationResult:
            local?.aiValidationResult ??
            cachedUpload?.ai_validation_result ??
            doc.ai_validation_result,
        });
      });
    },
    [declarationDocumentTypes, declarationUploadsForResponse, insurerDocuments],
  );

  const getMissingUnderwritingDocuments = useCallback(
    () => {
      return (requiredDocuments ?? []).filter((doc) => {
        if (!Boolean(doc.isRequired)) return false;

        const local = allDocumentTypes.find((item) => String(item.id) === String(doc.id));
        const cachedUpload = underwritingUploadsForResponse[String(doc.id)];
        const sourceDoc = doc as RequireDocument & {
          fileUrl?: string;
          fileName?: string;
          status?: string;
        };
        const hasServerUploaded =
          Boolean(
            typeof sourceDoc.fileUrl === 'string' && sourceDoc.fileUrl.trim(),
          ) || sourceDoc.status === 'uploaded';

        return !hasUploadedUnderwritingDocument({
          status: local?.status ?? (cachedUpload || hasServerUploaded ? 'uploaded' : 'pending'),
          fileUrl:
            local?.fileUrl ??
            cachedUpload?.url ??
            cachedUpload?.fileUrl ??
            (hasServerUploaded ? sourceDoc.fileUrl : undefined),
          fileName:
            local?.fileName ??
            cachedUpload?.originalFilename ??
            cachedUpload?.filename ??
            (hasServerUploaded ? sourceDoc.fileName : undefined),
          uploadedFileId: local?.uploadedFileId ?? cachedUpload?.id,
          aiValidationResult:
            local?.aiValidationResult ?? cachedUpload?.ai_validation_result,
        });
      });
    },
    [requiredDocuments, allDocumentTypes, underwritingUploadsForResponse],
  );

  const showMissingUnderwritingDocumentsToast = useCallback(() => {
    const missingMandatoryDocs = getMissingUnderwritingDocuments();
    if (missingMandatoryDocs.length === 0) return false;

    const missingLabels = missingMandatoryDocs
      .map((doc) => doc.label || 'This document')
      .join(', ');

    toast({
      title: 'Missing Required Documents',
      description: `Please upload the following required documents: ${missingLabels}`,
      variant: 'destructive',
    });
    return true;
  }, [getMissingUnderwritingDocuments, toast]);

  const handleStepClick = (index: number) => {
    if (isStepDirectNavigationDisabled(index)) return;

    if (endorsementIdProp) {
      const revisedQuoteIndex = steps.findIndex((s) => s.id === 'revised_quote');
      const isMovingBeyondRevisedQuote = revisedQuoteIndex >= 0 && index > revisedQuoteIndex;
      if (isMovingBeyondRevisedQuote) {
        const isSaved = revisedQuoteRef.current?.isSelectionSavedForEndorsement?.() ?? false;
        if (!isSaved) {
          toast({
            title: 'Save Required',
            description:
              'Please save the Revised Quote before moving to the next endorsement steps.',
            variant: 'destructive',
          });
          return;
        }
      }
    }

    if (!allowFreeNavigation) {
      const quotesIndex = steps.findIndex((s) => s.id === 'quotes_comparison');
      const hasReachedQuotes = quotesIndex >= 0 && unlockedMaxIndex >= quotesIndex;
      if (hasReachedQuotes && index < quotesIndex) {
        toast({
          title: 'Proposal Locked',
          description: 'You cannot go back to previous steps after reaching quotes.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (currentStepId === 'required_documents' && index > currentPageIndex) {
      if (showMissingUnderwritingDocumentsToast()) {
        return;
      }
    }

    if (currentStepId === 'quotes_comparison' && index > currentPageIndex && !selectedQuoteId) {
      toast({
        title: 'Select Plan To Continue',
        description: 'Please select a plan before proceeding.',
        variant: 'destructive',
      });
      return;
    }

    if (currentStepId === 'quotes_comparison' && index > currentPageIndex) {
      if (!responseId) {
        toast({
          title: 'Referral Check Failed',
          description: 'Missing responseId to verify referral status.',
          variant: 'destructive',
        });
        return;
      }
      calculateQuoteRating(String(responseId))
        .then((data) => {
          const list = (data.insurers || data.results || []) as any[];
          const hasReferral = list.some(
            (item) => String(item.status || '').toLowerCase() === 'referral',
          );
          if (hasReferral) {
            toast({
              title: 'Referral In Progress',
              description:
                'This quote is referred to an underwriter. You cannot proceed to the next step.',
              variant: 'destructive',
            });
            return;
          }
          setCurrentPageIndex(index);
        })
        .catch(() =>
          toast({
            title: 'Referral Check Failed',
            description: 'Unable to verify referral status.',
            variant: 'destructive',
          }),
        );
      return;
    }

    if (currentStepId === 'declaration_documents' && index > currentPageIndex) {
      const missingMandatoryDoc = getMissingDeclarationDocument();
      if (missingMandatoryDoc) {
        toast({
          title: 'Documents Required',
          description: `${missingMandatoryDoc.displayLabel || 'This document'} is required before proceeding.`,
          variant: 'destructive',
        });
        return;
      }
    }

    if (currentStepId === 'endorsement_documents' && index > currentPageIndex) {
      const missingMandatoryDoc = getMissingEndorsementDocument();
      if (missingMandatoryDoc) {
        toast({
          title: 'Documents Required',
          description: `${missingMandatoryDoc.displayLabel || 'This document'} is required before proceeding.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setCurrentPageIndex(index);
  };

  const validateCurrentStepForAdvance = useCallback(async () => {
    if (currentPage) {
      const { isValid, errors: pageErrors } = validatePage(currentPage);
      if (!isValid) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        // Scroll to the first error
        const firstErrorKey = Object.keys(pageErrors)[0];
        if (firstErrorKey) {
          const errorElement = document.getElementById(`field-${firstErrorKey}`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const inputEl = errorElement.querySelector('input, select, textarea, button') as HTMLElement | null;
            if (inputEl) inputEl.focus();
          }
        }
        return false;
      }

      const multiError = validateMultiFieldLogic(currentPage as any, formData);
      if (multiError) {
        toast({ title: 'Validation Error', description: multiError, variant: 'destructive' });
        return false;
      }
    }

    const dateValidationResult = validatePages(allRenderablePages, 'dateOnly');
    if (!dateValidationResult.isValid) {
      const firstInvalidPageStepIndex = steps.findIndex(
        (step) => step.id === dateValidationResult.firstInvalidPageId,
      );

      toast({
        title: 'Validation Error',
        description: 'Please correct the invalid date values before proceeding.',
        variant: 'destructive',
      });

      if (firstInvalidPageStepIndex >= 0) {
        setCurrentPageIndex(firstInvalidPageStepIndex);
      }

      return false;
    }

    if (currentStepId === 'required_documents') {
      if (showMissingUnderwritingDocumentsToast()) {
        return false;
      }
    }

    if (currentStepId === 'declaration_documents') {
      const missingMandatoryDoc = getMissingDeclarationDocument();
      if (missingMandatoryDoc) {
        toast({
          title: 'Documents Required',
          description: `${missingMandatoryDoc.displayLabel || 'This document'} is required before proceeding.`,
          variant: 'destructive',
        });
        return false;
      }
    }

    if (currentStepId === 'endorsement_documents') {
      const missingMandatoryDoc = getMissingEndorsementDocument();
      if (missingMandatoryDoc) {
        toast({
          title: 'Documents Required',
          description: `${missingMandatoryDoc.displayLabel || 'This document'} is required before proceeding.`,
          variant: 'destructive',
        });
        return false;
      }
    }

    return true;
  }, [
    allRenderablePages,
    currentPage,
    currentStepId,
    formData,
    getMissingDeclarationDocument,
    getMissingEndorsementDocument,
    showMissingUnderwritingDocumentsToast,
    steps,
    toast,
    validatePage,
    validatePages,
  ]);

  const handleNext = async (options?: { bypassQuoteSummary?: boolean }) => {
    const canAdvance = await validateCurrentStepForAdvance();
    if (!canAdvance) return;

    if (isStepBeforeQuotes && !options?.bypassQuoteSummary) {
      setIsQuoteSummaryOpen(true);
      return;
    }

    if (currentPage?.id) {
      const integrationOk = await executePageIntegrations(currentPage.id);
      if (!integrationOk) return;
    }

    if (currentStepId === 'quotes_comparison' && !selectedQuoteId) {
      toast({
        title: 'Select Plan To Continue',
        description: 'Please select a plan before proceeding.',
        variant: 'destructive',
      });
      return;
    }

    if (currentStepId === 'quotes_comparison') {
      if (!responseId) {
        toast({
          title: 'Referral Check Failed',
          description: 'Missing responseId to verify referral status.',
          variant: 'destructive',
        });
        return;
      }
      try {
        const data = await calculateQuoteRating(String(responseId));
        const list = (data.insurers || data.results || []) as any[];
        const hasReferral = list.some(
          (item) => String(item.status || '').toLowerCase() === 'referral',
        );
        if (hasReferral) {
          toast({
            title: 'Referral In Progress',
            description: 'This quote is referred to an underwriter. Redirecting to dashboard.',
            variant: 'destructive',
          });
          navigate('/broker/dashboard');
          return;
        }
      } catch {
        toast({
          title: 'Referral Check Failed',
          description: 'Unable to verify referral status.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (currentPage) {
      setIsSaving(true);
      try {
        const visibleSections = currentPage.sections.filter(shouldShowSection);
        const fieldValues = visibleSections.flatMap((section) =>
          serializePageFields(section.fields, formData),
        );
        const filesToUpload = getFilesToUpload([currentPage], formData);
        const payload = buildSavePayload(currentPage, fieldValues);
        const saveResponse: SaveProposalFormResponse = endorsementIdProp
          ? await updateEndorsementForm(endorsementIdProp, payload, filesToUpload)
          : await saveProposalForm(payload, filesToUpload);
        if (saveResponse.responseId) setResponseId(saveResponse.responseId);
      } catch (error) {
        console.error('Error saving proposal form:', error);
        toast({
          title: 'Error',
          description: 'Failed to save data. Please try again.',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      } finally {
        setIsSaving(false);
      }
    }

    // 5b. Endorsement revised-quote: sync selection with backend before moving to next step
    if (currentStepId === 'revised_quote' && endorsementIdProp) {
      const isSaved = revisedQuoteRef.current?.isSelectionSavedForEndorsement?.() ?? false;
      if (!isSaved) {
        toast({
          title: 'Save Required',
          description:
            'Please save the Revised Quote before moving to the next endorsement steps.',
          variant: 'destructive',
        });
        return;
      }
    }

    // 6. Advance step
    setSubmittedMaxIndex((prev) => Math.max(prev, currentPageIndex));
    setUnlockedMaxIndex((prev) => Math.max(prev, currentPageIndex + 1));
    if (currentPageIndex < steps.length - 1) setCurrentPageIndex(currentPageIndex + 1);
  };

  const handleBack = () => {
    if (!allowFreeNavigation) {
      const quotesIndex = steps.findIndex((s) => s.id === 'quotes_comparison');
      const hasReachedQuotes = quotesIndex >= 0 && unlockedMaxIndex >= quotesIndex;
      if (hasReachedQuotes && currentPageIndex <= quotesIndex) {
        toast({
          title: 'Proposal Locked',
          description: 'You cannot go back to previous steps after reaching quotes.',
          variant: 'destructive',
        });
        return;
      }
    }
    if (currentPageIndex > 0) setCurrentPageIndex(currentPageIndex - 1);
  };

  const handleSubmit = async () => {
    if (currentPage) {
      const { isValid, errors: pageErrors } = validatePage(currentPage);
      if (!isValid) {
        const firstErrorKey = Object.keys(pageErrors)[0];
        if (firstErrorKey) {
          const errorElement = document.getElementById(`field-${firstErrorKey}`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const inputEl = errorElement.querySelector('input, select, textarea, button') as HTMLElement | null;
            if (inputEl) inputEl.focus();
          }
        }
        return;
      }
    }

    const dateValidationResult = validatePages(allRenderablePages, 'dateOnly');
    if (!dateValidationResult.isValid) {
      const firstInvalidPageStepIndex = steps.findIndex(
        (step) => step.id === dateValidationResult.firstInvalidPageId,
      );

      if (firstInvalidPageStepIndex >= 0) {
        setCurrentPageIndex(firstInvalidPageStepIndex);
      }

      toast({
        title: 'Validation Error',
        description: 'Please correct the invalid date values before submitting.',
        variant: 'destructive',
      });
      return;
    }

    // Check reinsurance validation if product requires it
    if (reinsuranceMandatory && productId) {
      try {
        const result = await validateReinsurance(
          productId,
          [], // coverIds — backend resolves from product
          formData.policyStartDate as string | undefined,
        );
        if (!result.valid) {
          toast({
            title: 'Reinsurance Validation Failed',
            description: result.errors.join('. '),
            variant: 'destructive',
          });
          return;
        }
      } catch (err) {
        console.warn('Reinsurance validation check failed:', err);
        // Non-blocking — allow submission if validation service is unavailable
      }
    }

    setIsSubmitting(true);
    try {
      let finalResponseId = responseId;
      if (currentPage) {
        const fieldValues = currentPage.sections.flatMap((section) =>
          serializePageFields(section.fields, formData),
        );
        const payload = buildSavePayload(currentPage, fieldValues);
        const filesToUpload = getFilesToUpload([currentPage], formData);
        const saveResponse: SaveProposalFormResponse = endorsementIdProp
          ? await updateEndorsementForm(endorsementIdProp, payload, filesToUpload)
          : await saveProposalForm(payload, filesToUpload);
        finalResponseId = saveResponse.responseId || responseId;
        if (finalResponseId) setResponseId(finalResponseId);
      }

      if (!finalResponseId) {
        toast({
          title: 'Submission Error',
          description: 'Failed to save form. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      const allFieldValues = allRenderablePages.flatMap((page) =>
        page.sections.flatMap((section) => serializePageFields(section.fields, formData)),
      );

      if (onFormSubmit) {
        onFormSubmit(finalResponseId, allFieldValues);
      } else {
        toast({
          title: 'Form Submitted',
          description: 'Form data has been submitted successfully',
        });
      }

      // Clear local form cache after successful submit.
      localStorage.removeItem('stored_plan_requests');
      Object.keys(localStorage)
        .filter((key) => key.startsWith('endorsement_extension_baseline_'))
        .forEach((key) => localStorage.removeItem(key));
      useDeclarationUploadsStore.setState({ uploadsByResponse: {} });
      useDeclarationUploadsStore.persist.clearStorage();
      useEndorsementUploadsStore.setState({ uploadsByResponse: {} });
      useEndorsementUploadsStore.persist.clearStorage();
      useUnderwritingUploadsStore.setState({ uploadsByResponse: {} });
      useUnderwritingUploadsStore.persist.clearStorage();
    } catch (error) {
      console.error('Error submitting proposal form:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit proposal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Preview data ───────────────────────────────────────────────────────────

  const previewSections = useMemo(() => {
    return allRenderablePages
      .map((p) => ({
        id: p.id,
        title: p.title,
        sections: (p.sections || [])
          .filter((s) => shouldShowSection(s))
          .map((s) => ({
            id: s.id,
            title: s.title,
            fields: (s.fields || [])
              .filter((f) => shouldShowField(f))
              .map((f) => ({
                id: f.id,
                label: f.label || f.name,
                name: f.name,
                type: f.type,
                metadata: {
                  ...f.metadata,
                  fromDateLabel: f.fromDateLabel,
                  toDateLabel: f.toDateLabel,
                },
                value: formData[f.name],
              })),
          }))
          .filter((s) => s.fields.length > 0),
      }))
      .filter((p) => p.sections.length > 0);
  }, [allRenderablePages, formData, shouldShowSection, shouldShowField]);

  const proposalPreviewResponse = useMemo<ProposalBundleResponseV2>(() => {
    type PreviewFileEntry = {
      url: string;
      metadata?: { rowIndex?: number };
    };

    type PreviewTemplateSubField = TemplateSubField & {
      files?: PreviewFileEntry[];
    };

    type PreviewTemplateFieldItem = TemplateFieldItem & {
      files?: PreviewFileEntry[];
      subFields?: PreviewTemplateSubField[];
    };

    const toFileEntries = (value: unknown) => {
      if (value instanceof File) {
        return [{ url: URL.createObjectURL(value) }];
      }
      if (typeof value === 'string' && value.trim()) {
        const trimmed = value.trim();
        if (trimmed.startsWith('http') || trimmed.startsWith('/api/v1/')) {
          return [{ url: trimmed }];
        }
      }
      return [];
    };

    const mapSubField = (subField: SubField): PreviewTemplateSubField => {
      const rawValue = formData[subField.name];
      const mappedSubField: TemplateSubField = {
        id: String(subField.id ?? subField.name),
        name: subField.name,
        type: subField.type,
        label: subField.label,
        options: Array.isArray(subField.options)
          ? subField.options.map((option) =>
              typeof option === 'string' ? option : option.value,
            )
          : [],
        required: Boolean(subField.required),
        placeholder: subField.placeholder ?? '',
        isRatingParameter: Boolean(subField.isRatingParameter),
        metadata: {
          ...(subField.metadata ?? {}),
          fromDateLabel: subField.fromDateLabel,
          toDateLabel: subField.toDateLabel,
        },
      };

      return {
        ...mappedSubField,
        files: subField.type === 'file' ? toFileEntries(rawValue) : undefined,
      };
    };

    const mapField = (field: Field): PreviewTemplateFieldItem => {
      const rawValue = formData[field.name];
      const mappedField: TemplateFieldItem = {
        id: String(field.id ?? field.name),
        name: field.name,
        type: field.type,
        label: field.label,
        options: Array.isArray(field.options)
          ? field.options.map((option) =>
              typeof option === 'string' ? option : option.value,
            )
          : [],
        required: Boolean(field.required),
        placeholder: field.placeholder,
        validations: (field.validations ?? []).map<TemplateFieldValidation>((validation) => ({
          type: validation.type,
        })),
        subFields: field.subFields?.map(mapSubField) ?? [],
        isRatingParameter: Boolean(field.isRatingParameter),
        value: rawValue,
        metadata: {
          ...(field.metadata ?? {}),
          active: field.metadata?.active !== false,
          fromDateLabel: field.fromDateLabel,
          toDateLabel: field.toDateLabel,
        },
      };

      return {
        ...mappedField,
        files: field.type === 'file' ? toFileEntries(rawValue) : undefined,
      };
    };

    const mapPage = (page: Page, source: 'proposal' | 'additionalInformation'): TemplatePageItem => {
      const sections: TemplatePageSection[] = (page.sections ?? [])
        .filter(shouldShowSection)
        .map((section, sectionIndex) => ({
          id: String(section.id ?? `${page.id ?? page.title}-section-${sectionIndex}`),
          title: section.title ?? '',
          subtitle: section.subtitle ?? '',
          sectionOrder: section.sectionOrder ?? sectionIndex + 1,
          metadata: {
            ...(section.metadata ?? {}),
            active: section.metadata?.active !== false,
          },
          fields: section.fields
            .filter(shouldShowField)
            .map(mapField),
        }))
        .filter((section) => section.fields.length > 0);

      return {
        id: String(page.id ?? page.title ?? `${source}-page`),
        title: page.title,
        pageType: page.pageType ?? 'form',
        subtitle: page.subtitle ?? '',
        pageOrder: page.pageOrder ?? 0,
        navigationFields: [] as TemplateNavigationField[],
        metadata: {
          ...(page.metadata ?? {}),
          active: page.metadata?.active !== false,
        },
        sections,
      };
    };

    const template: ProposalTemplate = {
      name: productName || 'Proposal Preview',
      productId: String(productId ?? ''),
      templateId: templateId ?? '',
      currency,
      pages: activePages.map((page) => mapPage(page, 'proposal')),
      additionalInformationPages: activeAdditionalInformationPages.map((page) =>
        mapPage(page, 'additionalInformation'),
      ),
    };

    return {
      lastFilledPageId: currentPage?.id ?? '',
      responseId: responseId ?? '',
      templateId: templateId ?? '',
      templateVersionId: templateVersionId ?? '',
      productId: String(productId ?? ''),
      status: 'draft',
      template,
    };
  }, [
    activeAdditionalInformationPages,
    activePages,
    currency,
    currentPage?.id,
    formData,
    productId,
    productName,
    responseId,
    shouldShowField,
    shouldShowSection,
    templateId,
    templateVersionId,
  ]);

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (!steps[currentPageIndex]) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No pages available</p>
        </CardContent>
      </Card>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={10}>
      <input
        type="file"
        ref={autoFillInputRef}
        onChange={handleAutoFillFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-large border-border w-full overflow-hidden">
          <CardHeader className="px-4 sm:px-6">
            <div className="space-y-1">
              <div className="mb-6 flex items-center justify-between gap-4">
                <CardTitle className="text-xl">{productName || 'Create New Quote'}</CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  {hasCurrencyNumberField && (
                    <>
                    <Label htmlFor="number-unit" className="text-sm font-medium text-foreground">
                      Number Unit :
                    </Label>
                    <Select
                      value={numberUnit === '' ? 'none' : numberUnit}
                      onValueChange={(v) => setNumberUnit(v === 'none' ? '' : (v as NumberUnit))}
                    >
                      <SelectTrigger className="w-[180px] shrink-0">
                        <SelectValue placeholder="Select number unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {NUMBER_UNIT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value || 'none'} value={opt.value || 'none'}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    </>
                  )}
                  {!isEditMode && currentPage && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAutoFill}
                      disabled={isAutoFilling || isSaving || isSubmitting}
                      className="gap-2 shrink-0 bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {isAutoFilling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bot className="w-12 h-12" />
                      )}
                      Auto Fill
                    </Button>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Page {currentPageIndex + 1} of {steps.length}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-4 mt-6">
              <div className="flex-1 bg-primary/5 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-smooth"
                  style={{ width: `${((currentPageIndex + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

          </CardHeader>

          <CardContent className="px-4 sm:px-6">
            <Tabs
              value={currentPage ? currentPage.id : steps[currentPageIndex]?.id}
              className="w-full"
            >
              {/* Step Tabs */}
              <div className="mb-8">
                {/* Mobile */}
                <div className="md:hidden">
                  <div ref={mobileStepsScrollRef} className="overflow-x-auto scrollbar-hide pb-2">
                    <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-lg w-max">
                      {steps.map((step, index) => {
                        const isDisabled = isStepDirectNavigationDisabled(index);
                        return (
                          <Tooltip key={step.id}>
                            <TooltipTrigger asChild>
                              <span className="inline-block">
                                <button
                                  data-step-index={index}
                                  onClick={() => {
                                    if (!isDisabled) handleStepClick(index);
                                  }}
                                  disabled={isDisabled}
                                  className={`flex items-center gap-2 p-3 rounded-md text-xs font-medium transition-smooth flex-shrink-0 whitespace-nowrap ${index === currentPageIndex
                                    ? 'bg-primary text-primary-foreground shadow-glow'
                                    : index < currentPageIndex
                                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                      : isDisabled
                                        ? 'bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60'
                                        : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                                    } ${!isDisabled ? 'hover:scale-105' : ''}`}
                                >
                                  <span className="text-xs font-bold">{index + 1}</span>
                                  <step.icon className="w-3 h-3 flex-shrink-0" />
                                  <span className="text-[10px] leading-tight">{step.label}</span>
                                </button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {isDisabled
                                ? 'Only reached and current steps are clickable'
                                : 'Go to step'}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {/* Desktop */}
                <div className="hidden md:block">
                  <FormSteps
                    steps={steps}
                    currentIndex={currentPageIndex}
                    unlockedMaxIndex={unlockedMaxIndex}
                    onStepClick={handleStepClick}
                    isStepDisabled={isStepDirectNavigationDisabled}
                    scrollContainerRef={desktopStepsScrollRef}
                  />
                </div>
              </div>

              {/* Dynamic form pages */}
              {currentPage && (
                <TabsContent value={currentPage.id} className="space-y-6">
                  {currentPage.subtitle && (
                    <p className="text-sm text-muted-foreground mb-4">{currentPage.subtitle}</p>
                  )}
                  {currentPage.sections
                    ?.filter(shouldShowSection)
                    .map((section) => (
                      <div key={section.id} className="space-y-4">
                        {section.title && (
                          <div>
                            <h3 className="font-semibold text-lg">{section.title}</h3>
                            {section.subtitle && (
                              <p className="text-sm text-muted-foreground mt-1">{section.subtitle}</p>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 md:gap-x-6 md:gap-y-3">
                          {section.fields.map((field) => {
                            if (!shouldShowField(field)) return null;
                            return (
                              <div
                                key={field.id}
                                id={`field-${field.name}`}
                                className={
                                  field.metadata?.fullWidth === true
                                    ? 'md:col-span-2'
                                    : field.metadata?.fullWidth === false
                                      ? ''
                                      : ['repeatable', 'combination', 'multiselect', 'datePeriod', 'policyPeriod'].includes(field.type)
                                        ? 'md:col-span-2'
                                        : ''
                                }
                              >
                                <FieldRenderer
                                  field={field}
                                  value={getFormFieldValue(formData, field)}
                                  error={validationErrors[field.name]}
                                  errors={validationErrors}
                                  formData={formData}
                                  currency={currency}
                                  numberUnit={numberUnit}
                                  onChange={handleFieldChangeWrapper}
                                  shouldShowField={shouldShowField}
                                  isFieldRequired={isFieldRequired}
                                  onOpenMap={handleOpenMap}
                                  formResponseId={responseId}
                                  productId={productId}
                                  productThemeColor={productThemeColor}
                                  pages={allRenderablePages}
                                  disabled={
                                    endorsementType === 'non_technical' &&
                                    Boolean((field as { isRatingParameter?: boolean }).isRatingParameter)
                                  }
                                  disableRatingParameters={endorsementType === 'non_technical'}
                                  hasIntegration={getFieldIntegrations(field.id || field.name, field.name).length > 0}
                                  onExecuteIntegration={(fId) => executeFieldIntegration(fId, field.name)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </TabsContent>
              )}

              {/* Required Documents */}
              {currentStepId === 'required_documents' && (
                <TabsContent value="required_documents" className="space-y-6">
                  <div className="space-y-6">
                    <div className="text-left mb-6">
                      <h2 className="text-lg font-semibold text-foreground mb-1">
                        Upload Underwriting Documents
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Please upload documents needed for underwriting
                      </p>
                    </div>
                    <DocumentUpload
                      documents={documentUploadItems}
                      formResponseId={responseId || undefined}
                      onDocumentStatusChange={(updatedDocuments) => {
                        latestUnderwritingDocumentsRef.current = updatedDocuments;
                        setAllDocumentTypes(
                          updatedDocuments.map((doc) => ({
                            id: doc.id,
                            name: doc.name,
                            required: doc.required,
                            status: doc.status,
                            fileUrl: doc.fileUrl,
                            fileName: doc.fileName,
                            uploadedFileId: doc.uploadedFileId,
                            aiValidationResult: doc.aiValidationResult,
                          })),
                        );
                      }}
                    />

                    <div className="space-y-4">
                      {additionalUnderwritingDocuments.length > 0 ? (
                        <>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="text-base font-semibold text-foreground">
                                Additional Documents
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Add supporting files needed for underwriting.
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className={`gap-2 ${additionalUnderwritingDocuments.length >= 5 ? 'cursor-not-allowed opacity-60' : ''}`}
                              onClick={() => openAddAdditionalDocDialog('underwriting')}
                              disabled={additionalUnderwritingDocuments.length >= 5}
                              title={
                                additionalUnderwritingDocuments.length >= 5
                                  ? 'Maximum 5 additional documents allowed'
                                  : undefined
                              }
                            >
                              <Plus className="w-4 h-4" />
                              Add Additional Document
                            </Button>
                          </div>
                          <div className="grid gap-4 lg:gap-6">
                            {additionalUnderwritingDocuments.map((doc) => (
                              <Card
                                key={doc.id}
                                className="transition-all duration-200 border border-border bg-card shadow-sm ring-1 ring-inset ring-success/20"
                              >
                                <CardContent className="p-4 lg:p-6">
                                  <div className="space-y-4">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                                      <div className="flex min-w-0 flex-1 gap-3 lg:gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10">
                                          <CheckCircle className="w-5 h-5 text-success" />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-2">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-semibold text-sm text-foreground lg:text-base">
                                              {doc.title}
                                            </h4>
                                            <Badge
                                              variant="outline"
                                              className="text-success border-success"
                                            >
                                              Uploaded
                                            </Badge>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground lg:text-sm">
                                            <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                                              <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                                              <span className="truncate" title={doc.fileName}>
                                                {doc.fileName}
                                              </span>
                                            </span>
                                            {doc.fileSize && (
                                              <span className="text-muted-foreground">· {doc.fileSize}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end [&>button]:h-9 [&>button]:shrink-0">
                                        {doc.fileUrl && canPreviewAdditionalDoc(doc) && (
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 px-3 text-xs"
                                            onClick={() => setViewAdditionalDoc(doc)}
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                            View
                                          </Button>
                                        )}
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="gap-1.5 px-3 text-xs"
                                          onClick={() =>
                                            doc.fileUrl && handleDirectDownload(doc.fileUrl, doc.fileName || doc.title || 'document')
                                          }
                                          disabled={!doc.fileUrl}
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                          Download
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="gap-1.5 px-3 text-xs text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 hover:text-destructive"
                                          disabled={deletingAdditionalDocId === doc.id}
                                          onClick={() => handleDeleteAdditionalDoc(doc)}
                                        >
                                          {deletingAdditionalDocId === doc.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                          )}
                                          Remove
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </>
                      ) : (
                        <Card className="border border-dashed border-muted-foreground/25 bg-muted/20 shadow-none">
                          <CardContent className="flex flex-col items-center px-6 py-10 text-center">
                            <div className="mb-4 rounded-full border border-border/60 bg-background p-3 shadow-sm">
                              <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">
                              Additional Documents
                            </h3>
                            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                              No additional documents have been added yet.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-5 gap-2"
                              onClick={() => openAddAdditionalDocDialog('underwriting')}
                            >
                              <Plus className="w-4 h-4" />
                              Add Additional Document
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Quotes Comparison */}
              <TabsContent key="quotes_comparison" value="quotes_comparison" className="space-y-6">
                <div className="space-y-6">
                  <div className="text-left mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-1">Quotes</h2>
                    <p className="text-sm text-muted-foreground">
                      View your quote and select extensions
                    </p>
                  </div>
                  <QuotesComparison
                    assignedInsurers={null}
                    currentProposal={null}
                    insurerPricingConfigs={null}
                    isLoadingProposal={false}
                    isLoadingPricingConfigs={false}
                    productId={productId || 1}
                    responseId={responseId}
                    onQuotesLoaded={handleQuotesLoaded}
                    setSelectedQuoteId={setSelectedQuoteId}
                  />
                </div>
              </TabsContent>

              {/* Endorsement Documents (endorsement flow only) — required docs from API in future + additional */}
              <TabsContent value="endorsement_documents" className="space-y-6">
                <div className="space-y-6">
                  <div className="text-left mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-1">Endorsement Documents</h2>
                    <p className="text-sm text-muted-foreground">
                      Upload required and additional documents for this endorsement.
                    </p>
                  </div>
                  {endorsementDocuments.filter((doc) => Boolean(doc.isActive)).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No required documents for this endorsement yet.</p>
                  ) : (
                    <DocumentUpload
                      documents={endorsementDocuments
                        .filter((doc) => Boolean(doc.isActive))
                        .map((doc) => ({
                          id: doc.id,
                          name: doc.displayLabel || doc.originalFilename || '',
                          displayLabel: doc.displayLabel || doc.originalFilename || '',
                          description: doc.description || '',
                          required: Boolean(doc.isRequired),
                          validationQuestions: doc.validationQuestions ?? [],
                          status: doc.fileUrl ? 'uploaded' : 'pending',
                          fileSize: null,
                          fileName: doc.originalFilename || undefined,
                          fileUrl: doc.fileUrl || undefined,
                          uploadedFileId: (doc as { uploadedFileId?: string | number }).uploadedFileId,
                        }))}
                      formResponseId={responseId || undefined}
                      mode="endorsement"
                      productId={productId}
                      endorsementId={endorsementIdProp}
                      templateUrls={endorsementDocuments.reduce(
                        (acc, d) => { if (d.fileUrl) acc[d.id] = d.fileUrl; return acc; },
                        {} as Record<string | number, string>,
                      )}
                      onDocumentStatusChange={async (updatedDocuments) => {
                        const updatedList = endorsementDocuments.map((d) => {
                          const updated = updatedDocuments.find((u) => u.id === d.id);
                          if (!updated) return d;
                          const isUploaded = updated.status === 'uploaded';
                          return {
                            ...d,
                            fileUrl: isUploaded ? (updated.fileUrl ?? d.fileUrl) : undefined,
                            originalFilename: isUploaded ? (updated.fileName ?? d.originalFilename) : undefined,
                            uploadedFileId: isUploaded ? (updated.uploadedFileId ?? (d as { uploadedFileId?: string | number }).uploadedFileId) : undefined,
                          };
                        });
                        setEndorsementDocuments(updatedList);
                        const anyDeleted = updatedDocuments.some(
                          (u) => u.status === 'pending' && endorsementDocuments.some((d) => d.id === u.id && d.fileUrl),
                        );
                        if (anyDeleted && productId && resolvedInsurerOrganizationId) {
                          try {
                            const docs = await getEndorsementRequiredDocumentsForInsurer(
                              productId as any,
                              resolvedInsurerOrganizationId as any
                            );
                            const apiList = Array.isArray(docs) ? docs : [];
                            const merged = apiList.map((apiDoc) => {
                              const local = updatedList.find((l) => String(l.id) === String(apiDoc.id));
                              return {
                                ...apiDoc,
                                displayLabel: apiDoc.displayLabel,
                                description: apiDoc.description ?? '',
                                fileUrl: local?.fileUrl ?? apiDoc.fileUrl ?? undefined,
                                originalFilename: local?.originalFilename ?? apiDoc.originalFilename ?? undefined,
                                uploadedFileId: (local as { uploadedFileId?: string | number })?.uploadedFileId,
                              };
                            });
                            setEndorsementDocuments(merged);
                          } catch (e) {
                            console.error('[Endorsement Documents] Refetch after delete failed:', e);
                          }
                        }
                      }}
                    />
                  )}

                  <div className="space-y-4">
                    {additionalEndorsementDocuments.length > 0 ? (
                      <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">
                              Additional Documents
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Add supporting files for this endorsement when needed.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className={`gap-2 ${additionalEndorsementDocuments.length >= 5 ? 'cursor-not-allowed opacity-60' : ''}`}
                            onClick={() => openAddAdditionalDocDialog('endorsement')}
                            disabled={additionalEndorsementDocuments.length >= 5}
                            title={
                              additionalEndorsementDocuments.length >= 5
                                ? 'Maximum 5 additional documents allowed'
                                : undefined
                            }
                          >
                            <Plus className="w-4 h-4" />
                            Add Additional Document
                          </Button>
                        </div>
                        <div className="grid gap-4 lg:gap-6">
                          {additionalEndorsementDocuments.map((doc) => (
                            <Card
                              key={doc.id}
                              className="transition-all duration-200 border border-border bg-card shadow-sm ring-1 ring-inset ring-success/20"
                            >
                              <CardContent className="p-4 lg:p-6">
                                <div className="space-y-4">
                                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                                    <div className="flex min-w-0 flex-1 gap-3 lg:gap-4">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10">
                                        <CheckCircle className="w-5 h-5 text-success" />
                                      </div>
                                      <div className="min-w-0 flex-1 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h4 className="font-semibold text-sm text-foreground lg:text-base">
                                            {doc.title}
                                          </h4>
                                          <Badge
                                            variant="outline"
                                            className="text-success border-success"
                                          >
                                            Uploaded
                                          </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground lg:text-sm">
                                          <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                                            <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                                            <span className="truncate" title={doc.fileName}>
                                              {doc.fileName}
                                            </span>
                                          </span>
                                          {doc.fileSize && (
                                            <span className="text-muted-foreground">· {doc.fileSize}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end [&>button]:h-9 [&>button]:shrink-0">
                                      {doc.fileUrl && canPreviewAdditionalDoc(doc as any) && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="gap-1.5 px-3 text-xs"
                                          onClick={() => setViewAdditionalEndorsementDoc(doc)}
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                          View
                                        </Button>
                                      )}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 px-3 text-xs"
                                        onClick={() =>
                                          doc.fileUrl && handleDirectDownload(doc.fileUrl, doc.fileName || doc.title || 'document')
                                        }
                                        disabled={!doc.fileUrl}
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        Download
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 px-3 text-xs text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 hover:text-destructive"
                                        disabled={deletingAdditionalEndorsementDocId === doc.id}
                                        onClick={() => handleDeleteAdditionalEndorsementDoc(doc)}
                                      >
                                        {deletingAdditionalEndorsementDocId === doc.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    ) : (
                      <Card className="border border-dashed border-muted-foreground/25 bg-muted/20 shadow-none">
                        <CardContent className="flex flex-col items-center px-6 py-10 text-center">
                          <div className="mb-4 rounded-full border border-border/60 bg-background p-3 shadow-sm">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <h3 className="text-base font-semibold text-foreground">
                            Additional Documents
                          </h3>
                          <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            No additional documents have been added yet.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-5 gap-2"
                            onClick={() => openAddAdditionalDocDialog('endorsement')}
                          >
                            <Plus className="w-4 h-4" />
                            Add Additional Document
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Summary of Changes (endorsement flow only) — fields edited in proposal form + revised quote extensions */}
              <TabsContent value="endorsement_changes" className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-8">
                  <div className="text-left mb-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Summary of Changes</h2>
                    <p className="text-sm text-slate-600">
                      Review the latest backend-calculated differences before submitting.
                    </p>
                  </div>

                  {endorsementDifferenceLoading ? (
                    <Card className="border border-slate-200 shadow-sm">
                      <CardContent className="py-12 flex items-center justify-center bg-slate-50/50">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                      </CardContent>
                    </Card>
                  ) : endorsementDifferenceError ? (
                    <Card className="border border-slate-200 shadow-sm">
                      <CardContent className="py-12 text-center bg-slate-50/50">
                        <FileEdit className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-red-500 font-medium">{endorsementDifferenceError}</p>
                      </CardContent>
                    </Card>
                  ) : (endorsementDifferenceData?.differences?.length ?? 0) === 0 &&
                    (endorsementDifferenceData?.cewDifferance?.length ?? 0) === 0 ? (
                    <Card className="border border-slate-200 shadow-sm">
                      <CardContent className="py-12 text-center bg-slate-50/50">
                        <FileEdit className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No differences found.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-8">
                      {endorsementDifferenceData?.differences?.length ? (
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-slate-800">Proposal form changes</h3>
                          <Card className="overflow-hidden border border-slate-200 shadow-sm">
                            <CardContent className="p-0">
                              <div className="overflow-x-auto w-full scrollbar-thin">
                                <Table className="min-w-[700px] border-collapse">
                                  <TableHeader className="bg-slate-50">
                                    <TableRow className="border-b border-slate-200">
                                      <TableHead className="w-[30%] py-3 font-semibold text-slate-700">Field</TableHead>
                                      <TableHead className="w-[35%] py-3 font-semibold text-slate-700">Previous value</TableHead>
                                      <TableHead className="w-[35%] py-3 font-semibold text-slate-700">Updated value</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {endorsementDifferenceData.differences.map((diff) => {
                                      const fieldLabel = String(diff.fieldName || 'Unnamed field')
                                        .replace(/_/g, ' ')
                                        .replace(/\b\w/g, (char) => char.toUpperCase());
                                      const prevCombination = parseCombinationValue(diff.previousValueText, diff.previousValueJson);
                                      const currCombination = parseCombinationValue(diff.currentValueText, diff.currentValueJson);
                                      const isCombination =
                                        (prevCombination && prevCombination.length > 0) || (currCombination && currCombination.length > 0);

                                      if (isCombination) {
                                        const maxRows = Math.max(prevCombination?.length ?? 0, currCombination?.length ?? 0);
                                        return (
                                          <Fragment key={diff.fieldId}>
                                            <TableRow className="bg-slate-100 hover:bg-slate-100 border-t-4 border-slate-200">
                                              <TableCell colSpan={3} className="py-3">
                                                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm uppercase tracking-wider">
                                                  <span>{fieldLabel}</span>
                                                  {diff.isRatingParameter && <Calculator className="h-4 w-4 text-primary" />}
                                                </div>
                                              </TableCell>
                                            </TableRow>
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
                                                <Fragment key={`${diff.fieldId}-${rowIdx}`}>
                                                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-y border-slate-200">
                                                    <TableCell colSpan={3} className="font-semibold text-slate-600 py-2 italic pl-6 text-sm">
                                                      {rowLabel}
                                                    </TableCell>
                                                  </TableRow>
                                                  {deletedMessage ? (
                                                    <TableRow className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                                                      <TableCell colSpan={3} className="py-3 pl-10 text-sm text-amber-700 whitespace-pre-wrap break-words">
                                                        {deletedMessage}
                                                      </TableCell>
                                                    </TableRow>
                                                  ) : (
                                                    Array.from({ length: maxSubs }, (_, subIdx) => {
                                                      const prevSub = prevRow?.value?.[subIdx];
                                                      const currSub = currRow?.value?.[subIdx];
                                                      const subLabel = prevSub?.label ?? currSub?.label ?? '';
                                                      if (!subLabel) return null;
                                                      const isSubRatingParam =
                                                        Boolean(currSub?.isRatingParameter) || Boolean(prevSub?.isRatingParameter);
                                                      return (
                                                        <TableRow
                                                          key={currSub?.id || prevSub?.id || `${diff.fieldId}-${rowIdx}-${subIdx}`}
                                                          className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
                                                        >
                                                          <TableCell className="font-medium text-slate-700 align-top py-3">
                                                            <div className="flex items-start gap-3 ml-4">
                                                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0"></div>
                                                              <span className="flex items-center gap-1">
                                                                <span>{subLabel}</span>
                                                                {isSubRatingParam && <Calculator className="h-4 w-4 shrink-0 text-primary" />}
                                                              </span>
                                                            </div>
                                                          </TableCell>
                                                          <TableCell className="text-slate-500 align-top whitespace-pre-wrap break-words py-3">
                                                            {prevSub?.value || '—'}
                                                          </TableCell>
                                                          <TableCell className="text-slate-500 align-top whitespace-pre-wrap break-words py-3">
                                                            {currSub?.value || '—'}
                                                          </TableCell>
                                                        </TableRow>
                                                      );
                                                    })
                                                  )}
                                                </Fragment>
                                              );
                                            })}
                                          </Fragment>
                                        );
                                      }

                                      const prevDisplay = getSummaryDisplayValue(diff.previousValueText, diff.previousValueJson);
                                      const currDisplay = getSummaryDisplayValue(diff.currentValueText, diff.currentValueJson);

                                      return (
                                        <TableRow key={diff.fieldId} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                          <TableCell className="font-medium text-slate-800 align-top py-4">
                                            <div className="flex items-center gap-2">
                                              <span>{fieldLabel}</span>
                                              {diff.isRatingParameter && <Calculator className="h-4 w-4 shrink-0 text-primary" />}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-slate-500 align-top whitespace-pre-wrap break-words py-4">
                                            {prevDisplay || '—'}
                                          </TableCell>
                                          <TableCell className="text-slate-500 align-top whitespace-pre-wrap break-words py-4">
                                            {currDisplay || '—'}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : null}

                      {endorsementDifferenceData?.cewDifferance?.length ? (
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-slate-800">CEW changes</h3>
                          <Card className="overflow-hidden border border-slate-200 shadow-sm">
                            <CardContent className="p-0">
                              <div className="overflow-x-auto w-full scrollbar-thin">
                                <Table className="min-w-[700px] border-collapse">
                                  <TableHeader className="bg-slate-50">
                                    <TableRow className="border-b border-slate-200">
                                      <TableHead className="w-[30%] py-3 font-semibold text-slate-700">Field</TableHead>
                                      <TableHead className="w-[35%] py-3 font-semibold text-slate-700">Previous value</TableHead>
                                      <TableHead className="w-[35%] py-3 font-semibold text-slate-700">Updated value</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {endorsementDifferenceData.cewDifferance.map((diffItem) => (
                                      <TableRow key={`${diffItem.category}-${diffItem.key}`} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                        <TableCell className="font-medium text-slate-800 align-top py-4">
                                          {getCewFieldDisplayName(diffItem.key, diffItem.label)}
                                        </TableCell>
                                        <TableCell className="text-slate-500 align-top whitespace-pre-wrap break-words py-4">
                                          {formatCewValueSummary(diffItem.category, diffItem.previous) || '—'}
                                        </TableCell>
                                        <TableCell className="text-slate-500 align-top whitespace-pre-wrap break-words py-4">
                                          {formatCewValueSummary(diffItem.category, diffItem.current) || '—'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </TabsContent>


              {/* Revised Quote (endorsement flow only, except non-technical) — uses GET calculate-premium and POST select-premium */}
              {endorsementType !== 'non_technical' && (
                <TabsContent value="revised_quote" className="space-y-6">
                  <div className="space-y-6">
                    <div className="text-left mb-6">
                      <h2 className="text-lg font-semibold text-foreground mb-1">CEW's</h2>
                      <p className="text-sm text-muted-foreground">
                        Review and select the CEW for this endorsement.
                      </p>
                    </div>
                    {endorsementIdProp && (
                      <QuotesComparison
                        ref={revisedQuoteRef}
                        assignedInsurers={null}
                        currentProposal={null}
                        insurerPricingConfigs={null}
                        isLoadingProposal={false}
                        isLoadingPricingConfigs={false}
                        productId={productId || 1}
                        responseId={responseId}
                        endorsementId={endorsementIdProp}
                        onQuotesLoaded={handleQuotesLoaded}
                        setSelectedQuoteId={setSelectedQuoteId}
                      />
                    )}
                  </div>
                </TabsContent>
              )}

              {/* Declaration Documents */}
              <TabsContent value="declaration_documents" className="space-y-6">
                <div className="space-y-6">
                  <div className="text-left mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                      Policy Issuance Documents                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Review documents required by the selected insurer
                    </p>
                  </div>
                  {insurerDocuments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No documents available.</p>
                  ) : (
                    <DocumentUpload
                      documents={declarationUploadItems}
                      formResponseId={responseId || undefined}
                      mode="declaration"
                      preferServerState={isEditMode}
                      productId={productId}
                      templateUrls={insurerDocuments.reduce(
                        (acc, d) => {
                          const url = d.signedUrl || d.fileUrl;
                          if (url) acc[d.id] = url;
                          return acc;
                        },
                        {} as Record<string | number, string>,
                      )}
                      onDocumentStatusChange={(updatedDocuments) => {
                        const deletedExistingDeclarationDoc = updatedDocuments.some((updated) => {
                          if (updated.status !== 'pending') return false;
                          const previous = insurerDocuments.find(
                            (doc) => String(doc.id) === String(updated.id),
                          );
                          return Boolean(previous?.fileUrl) && !Boolean(previous?.signedUrl);
                        });
                        latestDeclarationDocumentsRef.current = updatedDocuments.map((doc) => ({
                          id: doc.id,
                          name: doc.name,
                          required: doc.required,
                          status: doc.status === 'uploaded' ? 'uploaded' : 'pending',
                          fileUrl: doc.fileUrl,
                        }));
                        setDeclarationDocumentTypes(
                          updatedDocuments.map((doc) => ({
                            id: doc.id,
                            name: doc.name,
                            required: doc.required,
                            status: doc.status,
                            fileUrl: doc.fileUrl,
                            fileName: doc.fileName,
                            aiValidationResult: doc.aiValidationResult,
                          })),
                        );
                        setInsurerDocuments((prev) =>
                          prev.map((d) => {
                            const updated = updatedDocuments.find((u) => u.id === d.id);
                            if (!updated) return d;
                            const isUploaded = updated.status === 'uploaded';
                            return {
                              ...d,
                              fileUrl: isUploaded ? (updated.fileUrl ?? d.fileUrl ?? undefined) : undefined,
                              originalFilename: isUploaded
                                ? (updated.fileName ?? d.originalFilename) || undefined
                                : undefined,
                              ai_validation_result: isUploaded
                                ? (updated.aiValidationResult ?? d.ai_validation_result)
                                : undefined,
                              // signedUrl represents template URL, not uploaded proof.
                              // Clear it after upload so UI and mandatory-check logic
                              // correctly treat this row as uploaded.
                              signedUrl: isUploaded ? undefined : d.signedUrl,
                            };
                          }),
                        );

                        // Edit-flow robustness:
                        // after deleting an existing uploaded declaration file, reload template docs
                        // so UI aligns with create flow and backend-required document definitions.
                        if (deletedExistingDeclarationDoc) {
                          void fetchDeclarationDocuments(true);
                        }
                      }}
                    />
                  )}

                  <div className="space-y-4">
                    {additionalDeclarationDocuments.length > 0 ? (
                      <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">
                              Additional Documents
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Add supporting files that should travel with this declaration.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className={`gap-2 ${additionalDeclarationDocuments.length >= 5 ? 'cursor-not-allowed opacity-60' : ''}`}
                            onClick={() => openAddAdditionalDocDialog('declaration')}
                            disabled={additionalDeclarationDocuments.length >= 5}
                            title={
                              additionalDeclarationDocuments.length >= 5
                                ? 'Maximum 5 additional documents allowed'
                                : undefined
                            }
                          >
                            <Plus className="w-4 h-4" />
                            Add Additional Document
                          </Button>
                        </div>
                        <div className="grid gap-4 lg:gap-6">
                          {additionalDeclarationDocuments.map((doc) => (
                            <Card
                              key={doc.id}
                              className="transition-all duration-200 border border-border bg-card shadow-sm ring-1 ring-inset ring-success/20"
                            >
                              <CardContent className="p-4 lg:p-6">
                                <div className="space-y-4">
                                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                                    <div className="flex min-w-0 flex-1 gap-3 lg:gap-4">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10">
                                        <CheckCircle className="w-5 h-5 text-success" />
                                      </div>
                                      <div className="min-w-0 flex-1 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h4 className="font-semibold text-sm text-foreground lg:text-base">
                                            {doc.title}
                                          </h4>
                                          <Badge
                                            variant="outline"
                                            className="text-success border-success"
                                          >
                                            Uploaded
                                          </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground lg:text-sm">
                                          <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                                            <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                                            <span className="truncate" title={doc.fileName}>
                                              {doc.fileName}
                                            </span>
                                          </span>
                                          {doc.fileSize && (
                                            <span className="text-muted-foreground">· {doc.fileSize}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end [&>button]:h-9 [&>button]:shrink-0">
                                      {doc.fileUrl && canPreviewAdditionalDoc(doc) && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="gap-1.5 px-3 text-xs"
                                          onClick={() => setViewAdditionalDoc(doc)}
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                          View
                                        </Button>
                                      )}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 px-3 text-xs"
                                        onClick={() =>
                                          doc.fileUrl && handleDirectDownload(doc.fileUrl, doc.fileName || doc.title || 'document')
                                        }
                                        disabled={!doc.fileUrl}
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        Download
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 px-3 text-xs text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 hover:text-destructive"
                                        disabled={deletingAdditionalDocId === doc.id}
                                        onClick={() => handleDeleteAdditionalDoc(doc)}
                                      >
                                        {deletingAdditionalDocId === doc.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    ) : (
                      <Card className="border border-dashed border-muted-foreground/25 bg-muted/20 shadow-none">
                        <CardContent className="flex flex-col items-center px-6 py-10 text-center">
                          <div className="mb-4 rounded-full border border-border/60 bg-background p-3 shadow-sm">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <h3 className="text-base font-semibold text-foreground">
                            Additional Documents
                          </h3>
                          <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            No additional documents have been added yet.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-5 gap-2"
                            onClick={() => openAddAdditionalDocDialog('declaration')}
                          >
                            <Plus className="w-4 h-4" />
                            Add Additional Document
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Add Additional Document Dialog */}
              <Dialog open={isAddAdditionalDocOpen} onOpenChange={setIsAddAdditionalDocOpen}>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Add Additional Document</DialogTitle>
                    <DialogDescription>Enter a title and upload a document.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="additional-doc-title">
                        Document title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="additional-doc-title"
                        value={newAdditionalDoc.title}
                        onChange={(e) =>
                          setNewAdditionalDoc((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="e.g., Additional certificate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Document file <span className="text-destructive">*</span>
                      </Label>
                      {!newAdditionalDoc.file ? (
                        <div
                          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 cursor-pointer transition-colors hover:border-muted-foreground/50 hover:bg-muted/30"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={handleAdditionalDocFileDrop}
                          onClick={() => additionalDocInputRef.current?.click()}
                        >
                          <div className="text-center">
                            {isUploadingAdditionalDoc ? (
                              <>
                                <div className="mx-auto h-12 w-12 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                <div className="mt-4">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Uploading...
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <div className="mt-4">
                                  <span className="text-sm font-medium text-primary hover:text-primary/80">
                                    Drag and drop or click to upload
                                  </span>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {ADDITIONAL_DOC_ALLOWED_MESSAGE}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded bg-background border flex items-center justify-center overflow-hidden p-1">
                              {isUploadingAdditionalDoc ? (
                                <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                              ) : additionalDocPreviewUrl ? (
                                <img
                                  src={additionalDocPreviewUrl}
                                  alt="Document preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Upload className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{newAdditionalDoc.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(newAdditionalDoc.file.size)}
                              </p>
                              {isUploadingAdditionalDoc ? (
                                <p className="text-xs text-muted-foreground animate-pulse">
                                  Uploading...
                                </p>
                              ) : (
                                <p className="text-xs text-green-600">✓ Uploaded successfully</p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeAdditionalDocFile}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <input
                        ref={additionalDocInputRef}
                        type="file"
                        className="sr-only"
                        accept={ADDITIONAL_DOC_ACCEPT}
                        onChange={handleAdditionalDocFileChange}
                        disabled={isUploadingAdditionalDoc}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      onClick={submitAdditionalDocument}
                      disabled={
                        isUploadingAdditionalDoc ||
                        !newAdditionalDoc.title?.trim() ||
                        !newAdditionalDoc.file
                      }
                    >
                      {isUploadingAdditionalDoc ? (
                        <>
                          <span className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                          Adding...
                        </>
                      ) : (
                        'Add Document'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* View Additional Document Dialog */}
              <Dialog
                open={!!viewAdditionalDoc}
                onOpenChange={(open) => !open && setViewAdditionalDoc(null)}
              >
                <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>
                      {viewAdditionalDoc?.title || viewAdditionalDoc?.fileName}
                    </DialogTitle>
                  </DialogHeader>
                  {viewAdditionalDoc &&
                    (viewAdditionalDoc.fileUrl ? (
                      (viewAdditionalDoc.contentType || '').toLowerCase().startsWith('image/') ? (
                        <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-muted">
                          <img
                            src={viewAdditionalDoc.fileUrl}
                            alt={viewAdditionalDoc.title || viewAdditionalDoc.fileName || 'Preview'}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      ) : (viewAdditionalDoc.contentType || '').toLowerCase() ===
                        'application/pdf' ? (
                        <iframe
                          src={viewAdditionalDoc.fileUrl}
                          className="w-full flex-1 min-h-0 border-0"
                          title="Document Preview"
                        />
                      ) : (
                        <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-muted text-muted-foreground">
                          No preview available
                        </div>
                      )
                    ) : (
                      <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-muted text-muted-foreground">
                        No preview available
                      </div>
                    ))}
                </DialogContent>
              </Dialog>

              {/* View Additional Endorsement Document Dialog */}
              <Dialog
                open={!!viewAdditionalEndorsementDoc}
                onOpenChange={(open) => !open && setViewAdditionalEndorsementDoc(null)}
              >
                <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>
                      {viewAdditionalEndorsementDoc?.title || viewAdditionalEndorsementDoc?.fileName}
                    </DialogTitle>
                  </DialogHeader>
                  {viewAdditionalEndorsementDoc &&
                    (viewAdditionalEndorsementDoc.fileUrl ? (
                      (viewAdditionalEndorsementDoc.contentType || '').toLowerCase().startsWith('image/') ? (
                        <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-muted">
                          <img
                            src={viewAdditionalEndorsementDoc.fileUrl}
                            alt={viewAdditionalEndorsementDoc.title || viewAdditionalEndorsementDoc.fileName || 'Preview'}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      ) : (viewAdditionalEndorsementDoc.contentType || '').toLowerCase() ===
                        'application/pdf' ? (
                        <iframe
                          src={viewAdditionalEndorsementDoc.fileUrl}
                          className="w-full flex-1 min-h-0 border-0"
                          title="Document Preview"
                        />
                      ) : (
                        <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-muted text-muted-foreground">
                          No preview available
                        </div>
                      )
                    ) : (
                      <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-muted text-muted-foreground">
                        No preview available
                      </div>
                    ))}
                </DialogContent>
              </Dialog>

              {/* Payment */}
              <TabsContent value="payment" className="space-y-6">
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                    Preview Proposal
                  </Button>
                </div>
                <PaymentPage
                  amount={calculatedPremium?.premium || 2500}
                  currency={currency}
                  quoteId={selectedQuoteId || undefined}
                  onPaymentSuccess={() => {
                    useDeclarationUploadsStore.setState({ uploadsByResponse: {} });
                    useDeclarationUploadsStore.persist.clearStorage();
                    useUnderwritingUploadsStore.setState({ uploadsByResponse: {} });
                    useUnderwritingUploadsStore.persist.clearStorage();
                    toast({
                      title: 'Payment Successful',
                      description: 'Policy issued successfully.',
                    });
                    setSubmittedMaxIndex(steps.length);
                  }}
                />
                <ProposalPreviewDialog
                  isOpen={isPreviewOpen}
                  onOpenChange={setIsPreviewOpen}
                  previewSections={previewSections}
                  templatePreviewResponse={proposalPreviewResponse}
                  productId={productId}
                  policyIssuanceDocuments={
                    (declarationDocumentTypes.length > 0
                      ? declarationDocumentTypes.map((doc) => {
                          const insurerDoc = insurerDocuments.find(
                            (d) => String(d.id) === String(doc.id),
                          );
                          return {
                            id: doc.id,
                            name: insurerDoc?.displayLabel || doc.name || '',
                            status: doc.status,
                            fileUrl: doc.fileUrl ?? insurerDoc?.fileUrl ?? undefined,
                            fileName: doc.fileName ?? insurerDoc?.originalFilename ?? undefined,
                          };
                        })
                      : declarationUploadItems.map((doc) => ({
                          id: doc.id,
                          name: doc.displayLabel || doc.name || '',
                          status: doc.status,
                          fileUrl: doc.fileUrl,
                          fileName: doc.fileName,
                        })))
                  }
                  declarationDocuments={declarationUploadItems}
                  underwritingDocuments={documentUploadItems}
                  additionalDeclarationDocuments={additionalDeclarationDocuments}
                  currency={currency}
                />
              </TabsContent>
            </Tabs>

            <ProposalPreviewDialog
              isOpen={isQuoteSummaryOpen}
              onOpenChange={setIsQuoteSummaryOpen}
              title="Proposal Summary"
              previewSections={previewSections}
              templatePreviewResponse={proposalPreviewResponse}
              productId={productId}
              policyIssuanceDocuments={
                (declarationDocumentTypes.length > 0
                  ? declarationDocumentTypes.map((doc) => {
                      const insurerDoc = insurerDocuments.find(
                        (d) => String(d.id) === String(doc.id),
                      );
                      return {
                        id: doc.id,
                        name: insurerDoc?.displayLabel || doc.name || '',
                        status: doc.status,
                        fileUrl: doc.fileUrl ?? insurerDoc?.fileUrl ?? undefined,
                        fileName: doc.fileName ?? insurerDoc?.originalFilename ?? undefined,
                      };
                    })
                  : declarationUploadItems.map((doc) => ({
                      id: doc.id,
                      name: doc.displayLabel || doc.name || '',
                      status: doc.status,
                      fileUrl: doc.fileUrl,
                      fileName: doc.fileName,
                    })))
              }
              declarationDocuments={declarationUploadItems}
              underwritingDocuments={documentUploadItems}
              additionalDeclarationDocuments={additionalDeclarationDocuments}
              currency={currency}
              footer={
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsQuoteSummaryOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      setIsQuoteSummaryOpen(false);
                      await handleNext({ bypassQuoteSummary: true });
                    }}
                  >
                    Proceed to Quote
                  </Button>
                </>
              }
            />

          </CardContent>
          <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-6">
            <div className="flex justify-end">
              <FormNavigation
                currentPageIndex={currentPageIndex}
                totalSteps={steps.length}
                onBack={handleBack}
                onNext={handleNext}
                onSubmit={handleSubmit}
                isSaving={isSaving}
                isSubmitting={isSubmitting}
                isIntegrationLoading={integrationState.isLoading}
                nextLabel={isStepBeforeQuotes ? 'View Summary' : 'Next'}
                disableBack={!allowFreeNavigation && (() => {
                  const quotesIndex = steps.findIndex((s) => s.id === 'quotes_comparison');
                  return (
                    quotesIndex >= 0 &&
                    unlockedMaxIndex >= quotesIndex &&
                    currentPageIndex <= quotesIndex
                  );
                })()}
              />
            </div>
          </div>
        </Card>

        {/* Hidden file input for PI proposal upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.PDF"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              setIsScanningDialogOpen(true);
              setIsUploadingProposal(true);
              const response = await uploadPIFilledProposal(file);
              const updates = mapPIFilledProposalToForm(response);
              setFormData((prev) => ({ ...prev, ...updates }));
              toast({
                title: 'Proposal Uploaded Successfully',
                description: 'Form fields have been auto-filled from the uploaded proposal.',
              });
            } catch (error: unknown) {
              console.error('Error uploading proposal:', error);
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Failed to upload and process the proposal file.';
              toast({
                title: 'Upload Failed',
                description: errorMessage,
                variant: 'destructive',
              });
            } finally {
              setIsUploadingProposal(false);
              setIsScanningDialogOpen(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          }}
        />

        <ScanningDialog
          isOpen={isScanningDialogOpen}
          onOpenChange={setIsScanningDialogOpen}
          isUploading={isUploadingProposal}
        />

        {activeLocationFieldId && (
          <MapDialogWrapper
            activeFieldId={activeLocationFieldId}
            pages={allRenderablePages}
            formData={formData}
            isOpen={isLocationModalOpen}
            onClose={() => {
              setIsLocationModalOpen(false);
              setActiveLocationFieldId(null);
            }}
            onLocationSelect={(coordinates, address) => {
              const combinedValue = `${address} | ${coordinates}`;
              const isCompositeLegacy =
                activeLocationFieldId?.includes('__row_') &&
                activeLocationFieldId?.includes('__col_');
              const isCombinationFormat = activeLocationFieldId?.startsWith('COMBINATION:');

              if (isCombinationFormat && activeLocationFieldId) {
                const [, fieldId, rowIndexStr, subName] = activeLocationFieldId.split(':');
                const rowIndex = parseInt(rowIndexStr, 10);

                let parentFieldName = '';
                allRenderablePages.forEach((page) => {
                  page.sections.forEach((section) => {
                    const field = section.fields.find((f) => f.id === fieldId);
                    if (field) parentFieldName = field.name;
                  });
                });

                if (parentFieldName) {
                  const existingRows = Array.isArray(formData[parentFieldName])
                    ? [...(formData[parentFieldName] as any[])]
                    : [];
                  existingRows[rowIndex] = {
                    ...(existingRows[rowIndex] || {}),
                    [subName]: combinedValue,
                  };
                  handleFieldChangeWrapper(parentFieldName, existingRows);
                }
              } else if (isCompositeLegacy && activeLocationFieldId) {
                const parts = activeLocationFieldId.split('__');
                const realFieldId = parts[0];
                const rowIndex = parseInt(parts[1].split('_')[1]);
                const subFieldName = parts[2].split('_')[1];
                let parentFieldName = '';
                allRenderablePages.forEach((page) => {
                  page.sections.forEach((section) => {
                    const field = section.fields.find((f) => f.id === realFieldId);
                    if (field) parentFieldName = field.name;
                  });
                });
                if (parentFieldName) {
                  const existingRows = Array.isArray(formData[parentFieldName])
                    ? [...(formData[parentFieldName] as any[])]
                    : [];
                  existingRows[rowIndex] = {
                    ...(existingRows[rowIndex] || {}),
                    [subFieldName]: combinedValue,
                  };
                  handleFieldChangeWrapper(parentFieldName, existingRows);
                }
              } else if (activeLocationFieldId) {
                let fieldName = activeLocationFieldId;
                allRenderablePages.forEach((page) => {
                  page.sections.forEach((section) => {
                    const field = section.fields.find((f) => f.id === activeLocationFieldId);
                    if (field) fieldName = field.name;
                  });
                });
                handleFieldChangeWrapper(fieldName, combinedValue);
              }
              setIsLocationModalOpen(false);
              setActiveLocationFieldId(null);
            }}
          />
        )}
      </div>
      <IntegrationLoadingOverlay visible={integrationState.isLoading} />
      <IntegrationErrorDialog
        open={!!integrationState.error}
        title={integrationState.error?.title ?? ''}
        message={integrationState.error?.message ?? ''}
        redirectUrl={integrationState.redirectUrl}
        onClose={clearIntegrationError}
        onRedirect={(url) => { clearIntegrationError(); navigate(url); }}
      />
    </TooltipProvider>
  );
};
