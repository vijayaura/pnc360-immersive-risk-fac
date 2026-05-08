import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollableTabs } from '@/components/ui/ScrollableTabs';
import { saveQuoteFormatByTemplate, getQuoteFormatByTemplate } from '@/features/product-config/quote-format/api/quote-format';

import QuoteFormatTab from '../quote-format/components/QuoteFormatTab';
import { getDocumentTemplates, getMacros } from '@/features/product-config/document-builder/api/document-configurator';
import { DocumentPreview } from '../document-builder/components/DocumentPreview';
import { mapBackendTemplate, elementToBlock } from '../utils/documentMapping';
import { generateQuotePdf } from '@/features/product-config/quote-format/api/quote-format';
import { macroToRatingParameter } from '../utils/macroMapping';
import type {
  DocumentTemplate as DocTpl,
  RatingParameter as DocParam,
  ElementType as DocElementType,
} from '../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Footer } from '@/components/layout/Footer';
import {
  ArrowLeft,
  Calculator,
  Download,
  FileText,
  Upload,
  Eye,
  Plus,
  ChevronDown,
  Trash2,
  X,
  Edit,
  Info,
  Layout,
  LoaderCircle,
  Save,
  Shield,
  Brain,
} from 'lucide-react';
import InsurerUWRulesDesign from '@/features/insurers/pages/InsurerUWRulesDesign';
import { useToast } from '@/shared/hooks/use-toast';
import {
  getActiveProjectTypes,
  getActiveConstructionTypes,
  getSubProjectTypesByProjectType,
} from '@/lib/masters-data';
import { getActiveCountries } from '@/lib/location-data';
import {
  listMasterProjectTypes,
  listMasterSubProjectTypes,
  listMasterConstructionTypes,
  listMasterRoleTypes,
  listMasterContractTypes,
  listMasterSoilTypes,
  listMasterSubcontractorTypes,
  listMasterConsultantRoles,
  listMasterSecurityTypes,
  listMasterAreaTypes,
  type SimpleMasterItem,
  type SubProjectTypeItem,
} from '@/features/product-config/masters/api/masters';
import {
  getInsurerMetadata,
  getQuoteConfigForUI,
  getProductQuoteFormat,
  saveProductQuoteFormat,
  uploadQuoteFormatLogo,
  getProductRequiredDocuments,
  saveProductRequiredDocument,
  updateProductRequiredDocument,
  deleteProductRequiredDocument,
  deleteProductRequiredDocumentTemplate,
  deleteProductRequiredDocumentValidationQuestion,
  getProductRequiredDocumentSignedUrl,
  getProductEndorsementDocuments,
  saveProductEndorsementDocument,
  updateProductEndorsementDocument,
  deleteProductEndorsementDocument,
  deleteProductEndorsementDocumentTemplate,
  deleteProductEndorsementDocumentValidationQuestion,
  getProductEndorsementDocumentSignedUrl,
  getCewsClauses,
  getBaseRates,
  saveBaseRates,
  updateBaseRates,
  getMinimumPremiums,
  saveMinimumPremiums,
  updateMinimumPremiums,
  getProjectRiskFactors,
  createProjectRiskFactors,
  updateProjectRiskFactors,
  getCoverageOptions,
  getPolicyLimits,
  savePolicyLimits,
  updatePolicyLimits,
  getClausePricing,
  saveClausePricing,
  saveQuoteCoverage,
  getConstructionTypesConfiguration,
  createConstructionTypesConfiguration,
  updateConstructionTypesConfiguration,
  getCountriesConfiguration,
  createCountriesConfiguration,
  updateCountriesConfiguration,
  getRegionsConfiguration,
  createRegionsConfiguration,
  updateRegionsConfiguration,
  getZonesConfiguration,
  createZonesConfiguration,
  updateZonesConfiguration,
  getContractTypesConfiguration,
  createContractTypesConfiguration,
  updateContractTypesConfiguration,
  getRoleTypesConfiguration,
  createRoleTypesConfiguration,
  updateRoleTypesConfiguration,
  getSoilTypesConfiguration,
  createSoilTypesConfiguration,
  updateSoilTypesConfiguration,
  getSubcontractorTypesConfiguration,
  createSubcontractorTypesConfiguration,
  updateSubcontractorTypesConfiguration,
  getConsultantRolesConfiguration,
  getSecurityTypesConfiguration,
  createSecurityTypesConfiguration,
  updateSecurityTypesConfiguration,
  getAreaTypesConfiguration,
  createAreaTypesConfiguration,
  updateAreaTypesConfiguration,
  getFeeTypesConfiguration,
  type InsurerMetadata,
  type QuoteConfigUIResponse,
  type PolicyWording,
  type ProductQuoteFormatResponse,
  type ProjectRiskFactorsRequest,
  type CoverageOptionsResponse,
  type PolicyLimitsResponse,
  type SavePolicyLimitsRequest,
  type UpdatePolicyLimitsRequest,
  type GetClausePricingResponse,
  type SaveClausePricingRequest,
  type SaveQuoteCoverageRequest,
  type ConstructionTypeConfigItem,
  type SaveConstructionTypesConfigRequest,
  type SaveConstructionTypesConfigResponse,
  type CountryConfigItem,
  type SaveCountriesConfigRequest,
  type SaveCountriesConfigResponse,
  type RegionConfigItem,
  type SaveRegionsConfigRequest,
  type SaveRegionsConfigResponse,
  type ZoneConfigItem,
  type SaveZonesConfigRequest,
  type SaveZonesConfigResponse,
  type ContractTypeConfigItem,
  type SaveContractTypesConfigRequest,
  type SaveContractTypesConfigResponse,
  type RoleTypeConfigItem,
  type SaveRoleTypesConfigRequest,
  type SaveRoleTypesConfigResponse,
  type SoilTypeConfigItem,
  type SaveSoilTypesConfigRequest,
  type SaveSoilTypesConfigResponse,
  type SubcontractorTypeConfigItem,
  type SaveSubcontractorTypesConfigRequest,
  type SaveSubcontractorTypesConfigResponse,
  type ConsultantRoleConfigItem,
  type SaveSecurityTypesRequest,
  type SaveSecurityTypesResponse,
  type SaveAreaTypesRequest,
  type SaveAreaTypesResponse,
  type FeeTypeConfigItem,
  getWordingDocumentTypes,
  addWordingDocumentType,
  updateWordingDocumentType,
  deleteWordingDocumentType,
  getWordingTemplateSignedUrl,
  type ProductRequiredDocumentItem,
  type ProductEndorsementDocumentItem,
  getQuoteCoverage,
  type QuoteCoverageResponse,
  saveTplConfiguration,
  getCewConfiguration,
  type CewConfigurationResponseDto,
  type TplConfigDto,
} from '@/features/insurers/api/insurers';
import { getInsurerCompanyId } from '@/lib/auth';
// Removed generic uploadFile; using product-scoped logo upload helper
import QuoteConfigurator, { QUOTE_VALIDITY_PERIOD_UNIT } from '../pricing/components/QuoteConfigurator';
import CEWsConfiguration from '../cew/components/CEWsConfiguration';
import CEWRulesDialog from '../cew/components/CEWRulesDialog';
import {
  saveProductCew,
  updateProductCew,
  deleteProductCew,
  type SaveProductCewDto,
  toClauseTypeDto,
  toShowTypeDto,
  exportCewConfiguration,
  importCewConfiguration,
  type TplExtension,
  AdjustmentType,
  type ProductCewPricingDto,
} from '@/features/product-config/cew/api/cew-config';
import WordingConfigurations from '../wording/components/WordingConfigurations';

import PricingConfigurator from '../pricing/components/PricingConfigurator';
import {
  getPolicyDeductibles,
  savePolicyDeductibles,
  type ProductPolicyDeductibleDto,
} from '@/features/product-config/pricing/api/ratings';
import { getProduct, Product } from '@/features/product-config/api/products';
import {
  getProductUnderwritingDocuments,
  saveProductUnderwritingDocument,
  updateProductUnderwritingDocument,
  deleteProductUnderwritingDocument,
  deleteProductUnderwritingDocumentValidationQuestion,
  type ProductUnderwritingDocumentItem,
} from '@/features/insurers/api/insurer-required-docs';
import { deriveProductCode } from '@/shared/utils/common-methods';
import { ClausePricingCardV2 } from '../cew/components/ClausePricingCardV2';

type DocumentTemplate = {
  name: string;
  size: string;
  url: string;
  file?: File;
  uploadDate?: string;
};

type RequiredDocumentItem = {
  id: string;
  label: string;
  description: string;
  required: boolean;
  active: boolean;
  order: number;
  aiQuestionValidation: boolean;
  referToUnderWrtiterAllowed: boolean;
  validationQuestions: Array<{
    id?: string;
    question: string;
  }>;
  template: DocumentTemplate | null;
};

type NewDocument = {
  label: string;
  description: string;
  required: boolean;
  active: boolean;
  aiQuestionValidation: boolean;
  referToUnderWrtiterAllowed: boolean;
  validationQuestions: Array<{
    id?: string;
    question: string;
  }>;
  template: DocumentTemplate | null;
};

const emptyValidationQuestion = () => ({ question: '' });

const defaultDocumentFormState = (): NewDocument => ({
  label: '',
  description: '',
  required: false,
  active: true,
  aiQuestionValidation: false,
  referToUnderWrtiterAllowed: false,
  validationQuestions: [emptyValidationQuestion()],
  template: null,
});

type PolicyWordingItem = {
  id?: string;
  label: string;
  url: string;
  is_active: boolean;
  originalFilename?: string;
  templateFile?: string;
  fileSize?: number;
};

interface SubProjectEntry {
  projectType: string;
  subProjectType: string;
  pricingType: 'percentage' | 'fixed' | string;
  baseRate: number;
  quoteOption: 'quote' | 'no-quote' | string;
  currency?: string;
}

// Multi-select soil type component
const SoilTypeMultiSelect = ({
  defaultValues = [],
  onValueChange,
  soilTypesData = [],
}: {
  defaultValues?: string[];
  onValueChange?: (values: string[]) => void;
  soilTypesData: any[];
}) => {
  const [selectedValues, setSelectedValues] = useState<string[]>(defaultValues);
  const [isOpen, setIsOpen] = useState(false);

  // Use master data from API, fallback to hardcoded values
  const soilTypes =
    soilTypesData.length > 0
      ? soilTypesData.map((item) => item.name || item.title || item.label || item)
      : ['Rock', 'Clay', 'Sandy', 'Mixed', 'Unknown'];

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    setSelectedValues(newValues);
    onValueChange?.(newValues);
  };

  const displayText =
    selectedValues.length > 0 ? `${selectedValues.length} selected` : 'Select soil types';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="h-8 text-xs justify-between w-full"
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0">
        <div className="p-2 space-y-1">
          {soilTypes.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`soil-${type.toLowerCase()}`}
                checked={selectedValues.includes(type)}
                onCheckedChange={() => handleToggle(type)}
              />
              <Label
                htmlFor={`soil-${type.toLowerCase()}`}
                className="text-xs flex-1 cursor-pointer"
              >
                {type}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};


// Multi-select cover component with grouping
const CoverMultiSelect = ({
  selectedValues = [],
  onValueChange,
  sections = [],
  placeholder = "Select covers",
}: {
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
  sections: any[];
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (id: string | number) => {
    const idStr = String(id);
    const has = selectedValues.some((v) => String(v) === idStr);
    const newValues = has
      ? selectedValues.filter((v) => String(v) !== idStr)
      : [...selectedValues, idStr];
    onValueChange(newValues);

    const allCoversCount = sections.flatMap((s) => s.covers || []).length;
    if (newValues.length === allCoversCount) {
      setIsOpen(false);
    }
  };

  const allCovers = sections.flatMap((s) => s.covers || []);
  const selectedCount = selectedValues.length;

  let displayText = placeholder;
  if (selectedCount === 1) {
    const cover = allCovers.find((c) => String(c.id) === String(selectedValues[0]));
    displayText = cover ? cover.name : `${selectedCount} selected`;
  } else if (selectedCount > 1) {
    displayText = `${selectedCount} covers selected`;
  }

  return (
    <div className="space-y-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-10 px-3 py-2 font-normal"
          >
            <span className="truncate">{displayText}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 overflow-hidden"
          align="start"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-sm font-medium text-muted-foreground">Select covers</span>
            <button
              type="button"
              className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ScrollArea className="h-64 w-full" type="scroll">
            <div className="p-2 pr-1">
              {sections.map((section) => (
                <div key={section.id} className="mb-4 last:mb-0">
                  <h4 className="px-2 mb-1 text-sm font-semibold text-muted-foreground">
                    {section.name}
                  </h4>
                  <div className="space-y-0.5">
                    {section.covers?.map((cover) => (
                      <div
                        key={cover.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer group transition-all"
                        onClick={() => handleToggle(cover.id)}
                      >
                        <div className="flex shrink-0 h-4 w-4 items-center justify-center">
                          <Checkbox
                            id={`cover-${cover.id}`}
                            checked={selectedValues.some((v) => String(v) === String(cover.id))}
                            onCheckedChange={() => handleToggle(cover.id)}
                            className="pointer-events-none rounded-[2px] bg-white border-slate-300 group-hover:border-white data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white opacity-100 transition-all shadow-sm"
                          />
                        </div>
                        <Label
                          htmlFor={`cover-${cover.id}`}
                          className="text-sm font-medium leading-none flex-1 cursor-pointer pointer-events-none select-none"
                        >
                          {cover.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {sections.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No covers available
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedValues.map((rawId) => {
            const idStr = String(rawId);
            const cover = allCovers.find((c) => String(c.id) === idStr);
            const label = cover?.name || cover?.code || idStr;
            return (
              <Badge
                key={idStr}
                variant="secondary"
                className="h-7 gap-1 pr-0.5 pl-2 py-0 font-normal max-w-full"
              >
                <span className="truncate max-w-[220px]" title={label}>
                  {label}
                </span>
                <button
                  type="button"
                  className="rounded-sm p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Remove ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(idStr);
                  }}
                >
                  <X className="h-3 w-3 shrink-0" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

function buildValidationQuestionsPayload(
  questions: Array<{
    id?: string;
    question: string;
  }>,
) {
  return questions
    .map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      question: item.question.trim(),
    }))
    .filter((item) => item.question !== '');
}

function AiValidationFields({
  documentState,
  onChange,
  keyPrefix,
  onDeleteQuestion,
  deletingQuestionIds = [],
}: {
  documentState: Pick<NewDocument, 'aiQuestionValidation' | 'validationQuestions'>;
  onChange: (
    updater: (
      prev: Pick<NewDocument, 'aiQuestionValidation' | 'validationQuestions'>,
    ) => Pick<NewDocument, 'aiQuestionValidation' | 'validationQuestions'>,
  ) => void;
  keyPrefix: string;
  onDeleteQuestion?: (question: { id?: string; question: string }, index: number) => Promise<void> | void;
  deletingQuestionIds?: string[];
}) {
  const updateQuestions = (
    updater: (
      prevQuestions: Array<{
        id?: string;
        question: string;
      }>,
    ) => Array<{
      id?: string;
      question: string;
    }>,
  ) => {
    onChange((prev) => ({
      ...prev,
      validationQuestions: updater(prev.validationQuestions),
    }));
  };

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor={`${keyPrefix}-ai-validation`}>AI Validation</Label>
          <p className="text-sm text-muted-foreground">
            Enable AI-based question checks for this document.
          </p>
        </div>
        <Switch
          id={`${keyPrefix}-ai-validation`}
          checked={documentState.aiQuestionValidation}
          onCheckedChange={(checked) =>
            onChange((prev) => ({
              ...prev,
              aiQuestionValidation: checked,
              validationQuestions:
                checked && prev.validationQuestions.length === 0
                  ? [emptyValidationQuestion()]
                  : prev.validationQuestions,
            }))
          }
        />
      </div>

      {documentState.aiQuestionValidation && (
        <div className="space-y-3">
          {documentState.validationQuestions.map((item, index) => (
            <div key={item.id ?? `${keyPrefix}-question-${index}`} className="flex gap-2">
              <Input
                value={item.question}
                onChange={(e) =>
                  updateQuestions((prev) =>
                    prev.map((question, questionIndex) =>
                      questionIndex === index
                        ? { ...question, question: e.target.value }
                        : question,
                    ),
                  )
                }
                placeholder={`Question ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!!item.id && deletingQuestionIds.includes(item.id)}
                onClick={async () => {
                  if (onDeleteQuestion) {
                    await onDeleteQuestion(item, index);
                    return;
                  }
                  updateQuestions((prev) =>
                    prev.length > 1
                      ? prev.filter((_, questionIndex) => questionIndex !== index)
                      : [emptyValidationQuestion()],
                  );
                }}
                aria-label={`Remove question ${index + 1}`}
              >
                {item.id && onDeleteQuestion ? (
                  <Trash2 className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() =>
              updateQuestions((prev) => [...prev, emptyValidationQuestion()])
            }
          >
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </div>
      )}
    </div>
  );
}

/** Linked covers from CEW API: may be `selectedCoverIds`, nested `selectedCovers[].id`, or legacy `coverId`. */
function mapClauseSelectedCoverIdsFromApi(c: any): string[] {
  const asIdStrings = (items: unknown[] | undefined): string[] =>
    (items ?? [])
      .map((item) =>
        item != null && typeof item === 'object' && 'id' in (item as object)
          ? String((item as { id: unknown }).id)
          : String(item),
      )
      .filter((id) => id !== '' && id !== 'undefined');

  const fromIds = asIdStrings(c?.selectedCoverIds);
  if (fromIds.length > 0) return fromIds;

  const fromCovers = asIdStrings(c?.selectedCovers);
  if (fromCovers.length > 0) return fromCovers;

  if (c?.coverId != null && c.coverId !== '') return [String(c.coverId)];

  return [];
}

function resolveSelectedCoverNamesFromSections(
  selectedIds: string[] | undefined,
  sections: any[] | undefined,
): string[] {
  const ids = selectedIds ?? [];
  const secs = sections ?? [];
  const allCovers = secs.flatMap((s) => s.covers || []);
  return ids.map((id) => {
    const idStr = String(id);
    const c = allCovers.find((x: any) => String(x.id) === idStr);
    return (c?.name || c?.code || idStr) as string;
  });
}

interface Deductible {
  id: string | number;
  title?: string;
  description?: string;
  defaultValue?: string;
  value?: string | number;
  pricingType?: 'percentage' | 'fixed' | 'flat';
  quoteAction?: string;
  showType?: 'OPTIONAL' | 'MANDATORY';
  loadingDiscount?: number;
  discount?: string | number;
}

const normalizeQuoteAction = (v: string): 'quote' | 'no_quote' | 'referral' => {
  const val = v.toLowerCase();
  if (val === 'no_quote' || val === 'no-quote') return 'no_quote';
  if (val === 'manual' || val === 'manual-review' || val === 'referral') return 'referral';
  return 'quote';
};

/**
 * Converts raw API validation error messages for clause pricing into
 * human-readable descriptions that non-technical users can understand.
 */
const friendlyClauseErrorMessage = (message: string | undefined): string => {
  if (!message) return 'Please check your input and try again.';

  // clausesPricing.N.label must be longer than or equal to 1 characters
  if (/clausesPricing\.\d+\.label/i.test(message)) {
    return 'Please enter a label for each clause pricing entry before saving.';
  }
  // clausesPricing.N.adjustmentValue …
  if (/clausesPricing\.\d+\.adjustmentValue/i.test(message)) {
    return 'Please enter a valid adjustment value for each clause pricing entry.';
  }
  // clausesPricing.N.type …
  if (/clausesPricing\.\d+\.type/i.test(message)) {
    return 'Please select a valid pricing type for each clause pricing entry.';
  }
  // Generic clausesPricing field error
  if (/clausesPricing/i.test(message)) {
    return 'One or more clause pricing entries have missing or invalid values. Please review and try again.';
  }

  return message;
};

const SingleProductConfig = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [productInfo, setProductInfo] = useState<Product | null>(null);
  const [policyDeductibles, setPolicyDeductibles] = useState<Deductible[]>([]);
  const { insurerId, productId } = useParams();

  // Detect if we're in insurer portal or market admin
  const isInsurerPortal = location.pathname.startsWith('/insurer');
  const basePath = isInsurerPortal ? '/insurer' : `/market-admin/insurer/${insurerId}`;
  const { toast } = useToast();
  const productCurrency = productInfo?.currency || 'N/A';

  // Update quote config currency when product info loads
  useEffect(() => {
    if (productInfo?.currency) {
      setQuoteConfig((prev) => ({
        ...prev,
        premium: {
          ...prev.premium,
          currency: productInfo.currency,
        },
      }));
    }
  }, [productInfo?.currency]);

  const activeProjectTypes = getActiveProjectTypes();
  const activeConstructionTypes = getActiveConstructionTypes();
  const activeCountries = getActiveCountries();
  const normalizedProductOperatingGeography =
    productInfo?.operatingCountries || productInfo?.operatingRegions || productInfo?.operatingZones
      ? {
          operatingCountries: (productInfo.operatingCountries || []).map((item) => ({
            id: typeof item === 'string' ? item : item.id,
          })),
          operatingRegions: (productInfo.operatingRegions || []).map((item) => ({
            id: typeof item === 'string' ? item : item.id,
          })),
          operatingZones: (productInfo.operatingZones || []).map((item) => ({
            id: typeof item === 'string' ? item : item.id,
          })),
        }
      : undefined;
  const normalizedPricingProductInfo = productInfo
    ? {
        id: productInfo.id,
        name: productInfo.name,
        code: productInfo.code,
        category: productInfo.category,
        currency: productInfo.currency,
        description: productInfo.description || '',
        version: String(productInfo.version ?? ''),
        status: productInfo.status,
        owner: productInfo.owner,
        organizationId: productInfo.organizationId || null,
        createdAt: productInfo.createdAt || '',
        updatedAt: productInfo.updatedAt || '',
      }
    : null;

  // Masters fetched from API for Base Rates
  const [projectTypesMasters, setProjectTypesMasters] = useState<SimpleMasterItem[] | null>(null);
  const [subProjectTypesMasters, setSubProjectTypesMasters] = useState<SubProjectTypeItem[] | null>(
    null,
  );
  const [isLoadingBaseRatesMasters, setIsLoadingBaseRatesMasters] = useState(false);
  const [baseRatesMastersError, setBaseRatesMastersError] = useState<string | null>(null);
  const [isSavingBaseRates, setIsSavingBaseRates] = useState(false);

  // Masters fetched from API for Minimum Premiums
  const [isLoadingMinimumPremiumsMasters, setIsLoadingMinimumPremiumsMasters] = useState(false);
  const [minimumPremiumsMastersError, setMinimumPremiumsMastersError] = useState<string | null>(
    null,
  );
  const [isSavingMinimumPremiums, setIsSavingMinimumPremiums] = useState(false);

  // Project Risk Factors loading state
  const [isLoadingProjectRiskFactors, setIsLoadingProjectRiskFactors] = useState(false);
  const [projectRiskFactorsError, setProjectRiskFactorsError] = useState<string | null>(null);
  const [hasProjectRiskFactorsData, setHasProjectRiskFactorsData] = useState(false);
  const [isSavingProjectRiskFactors, setIsSavingProjectRiskFactors] = useState(false);

  // Contractor Risk Factors loading state
  const [isLoadingContractorRiskFactors, setIsLoadingContractorRiskFactors] = useState(false);
  const [contractorRiskFactorsError, setContractorRiskFactorsError] = useState<string | null>(null);
  const [hasContractorRiskFactorsData, setHasContractorRiskFactorsData] = useState(false);
  const [isSavingContractorRiskFactors, setIsSavingContractorRiskFactors] = useState(false);

  // Clause Metadata state
  const [isLoadingClauseMetadata, setIsLoadingClauseMetadata] = useState(false);
  const [clauseMetadataError, setClauseMetadataError] = useState<string | null>(null);
  const [clauseMetadata, setClauseMetadata] = useState([]);

  // Clause Pricing state
  const [isLoadingClausePricing, setIsLoadingClausePricing] = useState(false);
  const [clausePricingError, setClausePricingError] = useState<string | null>(null);
  const [clausePricingData, setClausePricingData] = useState<any | null>(null);
  const [isSavingClausePricing, setIsSavingClausePricing] = useState(false);

  // Master Data states
  const [constructionTypesData, setConstructionTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingConstructionTypes, setIsLoadingConstructionTypes] = useState(false);
  const [constructionTypesError, setConstructionTypesError] = useState<string | null>(null);

  const [roleTypesData, setRoleTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingRoleTypes, setIsLoadingRoleTypes] = useState(false);
  const [roleTypesError, setRoleTypesError] = useState<string | null>(null);

  const [contractTypesData, setContractTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingContractTypes, setIsLoadingContractTypes] = useState(false);
  const [contractTypesError, setContractTypesError] = useState<string | null>(null);

  const [soilTypesData, setSoilTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingSoilTypes, setIsLoadingSoilTypes] = useState(false);
  const [soilTypesError, setSoilTypesError] = useState<string | null>(null);

  const [subcontractorTypesData, setSubcontractorTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingSubcontractorTypes, setIsLoadingSubcontractorTypes] = useState(false);
  const [subcontractorTypesError, setSubcontractorTypesError] = useState<string | null>(null);

  const [consultantRolesData, setConsultantRolesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingConsultantRoles, setIsLoadingConsultantRoles] = useState(false);
  const [consultantRolesError, setConsultantRolesError] = useState<string | null>(null);

  const [securityTypesData, setSecurityTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingSecurityTypes, setIsLoadingSecurityTypes] = useState(false);
  const [securityTypesError, setSecurityTypesError] = useState<string | null>(null);

  const [areaTypesData, setAreaTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingAreaTypes, setIsLoadingAreaTypes] = useState(false);
  const [areaTypesError, setAreaTypesError] = useState<string | null>(null);

  // Quote Config Location Data states (Countries, Regions, Zones)
  const [countriesData, setCountriesData] = useState<string[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);

  const [regionsData, setRegionsData] = useState<string[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [regionsError, setRegionsError] = useState<string | null>(null);

  const [zonesData, setZonesData] = useState<string[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [zonesError, setZonesError] = useState<string | null>(null);

  // Construction Types Configuration state
  const [constructionTypesConfigData, setConstructionTypesConfigData] = useState<
    ConstructionTypeConfigItem[]
  >([]);
  const [isLoadingConstructionTypesConfig, setIsLoadingConstructionTypesConfig] = useState(false);
  const [constructionTypesConfigError, setConstructionTypesConfigError] = useState<string | null>(
    null,
  );
  const [isSavingConstructionTypesConfig, setIsSavingConstructionTypesConfig] = useState(false);

  // Countries Configuration state
  const [countriesConfigData, setCountriesConfigData] = useState<CountryConfigItem[]>([]);
  const [isLoadingCountriesConfig, setIsLoadingCountriesConfig] = useState(false);
  const [countriesConfigError, setCountriesConfigError] = useState<string | null>(null);
  const [isSavingCountriesConfig, setIsSavingCountriesConfig] = useState(false);

  // Regions Configuration state
  const [regionsConfigData, setRegionsConfigData] = useState<RegionConfigItem[]>([]);
  const [isLoadingRegionsConfig, setIsLoadingRegionsConfig] = useState(false);
  const [regionsConfigError, setRegionsConfigError] = useState<string | null>(null);
  const [isSavingRegionsConfig, setIsSavingRegionsConfig] = useState(false);

  // Zones Configuration state
  const [zonesConfigData, setZonesConfigData] = useState<ZoneConfigItem[]>([]);
  const [isLoadingZonesConfig, setIsLoadingZonesConfig] = useState(false);
  const [zonesConfigError, setZonesConfigError] = useState<string | null>(null);
  const [isSavingZonesConfig, setIsSavingZonesConfig] = useState(false);

  // Contract Types Configuration state
  const [contractTypesConfigData, setContractTypesConfigData] = useState<ContractTypeConfigItem[]>(
    [],
  );
  const [isLoadingContractTypesConfig, setIsLoadingContractTypesConfig] = useState(false);
  const [contractTypesConfigError, setContractTypesConfigError] = useState<string | null>(null);
  const [isSavingContractTypesConfig, setIsSavingContractTypesConfig] = useState(false);

  // Role Types Configuration state
  const [roleTypesConfigData, setRoleTypesConfigData] = useState<RoleTypeConfigItem[]>([]);
  const [isLoadingRoleTypesConfig, setIsLoadingRoleTypesConfig] = useState(false);
  const [roleTypesConfigError, setRoleTypesConfigError] = useState<string | null>(null);
  const [isSavingRoleTypesConfig, setIsSavingRoleTypesConfig] = useState(false);

  // Soil Types Configuration state
  const [soilTypesConfigData, setSoilTypesConfigData] = useState<SoilTypeConfigItem[]>([]);
  const [isLoadingSoilTypesConfig, setIsLoadingSoilTypesConfig] = useState(false);
  const [soilTypesConfigError, setSoilTypesConfigError] = useState<string | null>(null);
  const [isSavingSoilTypesConfig, setIsSavingSoilTypesConfig] = useState(false);

  // Subcontractor Types Configuration state
  const [subcontractorTypesConfigData, setSubcontractorTypesConfigData] = useState<
    SubcontractorTypeConfigItem[]
  >([]);
  const [isLoadingSubcontractorTypesConfig, setIsLoadingSubcontractorTypesConfig] = useState(false);
  const [subcontractorTypesConfigError, setSubcontractorTypesConfigError] = useState<string | null>(
    null,
  );
  const [isSavingSubcontractorTypesConfig, setIsSavingSubcontractorTypesConfig] = useState(false);

  // Consultant Roles Configuration state
  const [consultantRolesConfigData, setConsultantRolesConfigData] = useState<
    ConsultantRoleConfigItem[]
  >([]);
  const [isLoadingConsultantRolesConfig, setIsLoadingConsultantRolesConfig] = useState(false);
  const [consultantRolesConfigError, setConsultantRolesConfigError] = useState<string | null>(null);
  const [isSavingConsultantRolesConfig, setIsSavingConsultantRolesConfig] = useState(false);

  // Security Types Configuration state
  const [securityTypesConfigData, setSecurityTypesConfigData] = useState([]);
  const [isLoadingSecurityTypesConfig, setIsLoadingSecurityTypesConfig] = useState(false);
  const [securityTypesConfigError, setSecurityTypesConfigError] = useState<string | null>(null);
  const [isSavingSecurityTypesConfig, setIsSavingSecurityTypesConfig] = useState(false);

  // Area Types Configuration state
  const [areaTypesConfigData, setAreaTypesConfigData] = useState([]);
  const [isLoadingAreaTypesConfig, setIsLoadingAreaTypesConfig] = useState(false);
  const [areaTypesConfigError, setAreaTypesConfigError] = useState<string | null>(null);
  const [isSavingAreaTypesConfig, setIsSavingAreaTypesConfig] = useState(false);

  // Fee Types Configuration state
  const [feeTypesConfigData, setFeeTypesConfigData] = useState<FeeTypeConfigItem[]>([]);
  const [isLoadingFeeTypesConfig, setIsLoadingFeeTypesConfig] = useState(false);
  const [feeTypesConfigError, setFeeTypesConfigError] = useState<string | null>(null);
  const [isSavingFeeTypesConfig, setIsSavingFeeTypesConfig] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  // Fetch Fee Types Configuration
  const fetchFeeTypesConfig = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs for fee types config fetch:', {
        insurerId,
        productId,
      });
      setFeeTypesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }
    setIsLoadingFeeTypesConfig(true);
    setFeeTypesConfigError(null);

    try {
      console.log('🔍 Fetching fee types configuration...');
      const response = await getFeeTypesConfiguration(String(insurerId), String(productId));
      console.log('✅ Fee types config response:', response);

      if (response?.items) {
        setFeeTypesConfigData(response.items);
        console.log('✅ Fee types config data set:', response.items);
      } else {
        console.warn('⚠️ No fee types config items in response');
        setFeeTypesConfigData([]);
      }

      console.log('🎯 === FETCH FEE TYPES CONFIGURATION SUCCESS ===');
    } catch (err) {
      console.error('❌ Error fetching fee types configuration:', err);
      const status = err?.status;
      const msg =
        status === 400
          ? 'Bad request while fetching fee types configuration.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access to fee types configuration.'
              : status >= 500
                ? 'Server error while fetching fee types configuration.'
                : err?.message || 'Failed to fetch fee types configuration.';

      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });

      setFeeTypesConfigError(msg);
      setFeeTypesConfigData([]);
    } finally {
      setIsLoadingFeeTypesConfig(false);
    }
  };

  // Coverage Options state
  const [coverageOptionsData, setCoverageOptionsData] = useState<CoverageOptionsResponse | null>(
    null,
  );
  const [isSavingCoverageOptions, setIsSavingCoverageOptions] = useState(false);
  const [isLoadingCoverageOptions, setIsLoadingCoverageOptions] = useState(false);
  const [coverageOptionsError, setCoverageOptionsError] = useState<string | null>(null);

  // Policy Limits state
  const [policyLimitsData, setPolicyLimitsData] = useState<PolicyLimitsResponse | null>(null);
  const [isLoadingPolicyLimits, setIsLoadingPolicyLimits] = useState(false);
  const [policyLimitsError, setPolicyLimitsError] = useState<string | null>(null);
  const [isSavingPolicyLimits, setIsSavingPolicyLimits] = useState(false);
  // Always fetch on demand (Pricing tab or Base Rates click)
  const fetchBaseRatesMasters = async (): Promise<void> => {
    setIsLoadingBaseRatesMasters(true);
    setBaseRatesMastersError(null);
    try {
      const projects = await listMasterProjectTypes();
      setProjectTypesMasters(projects);
      const subs = await listMasterSubProjectTypes();
      setSubProjectTypesMasters(subs);
      // Map sub projects under their parent project type (slugged value)
      const projectSlugById = new Map<number, string>();
      const projectSlugs: string[] = [];
      projects.forEach((p) => {
        const slug = (p.label || String(p.id))
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        projectSlugById.set(Number(p.id), slug);
        projectSlugs.push(slug);
      });
      // Keep shimmer running; fetch insurer base rates and map values onto the metadata
      const insurerId = getInsurerCompanyId();
      const pid = product?.id || '1';
      let mappedEntries: SubProjectEntry[] = subs.map((s) => ({
        projectType: projectSlugById.get(s.projectTypeId) || String(s.projectTypeId),
        subProjectType: s.label,
        pricingType: 'percentage',
        baseRate: 0,
        quoteOption: 'quote',
        currency: undefined,
      }));
      try {
        if (insurerId && pid) {
          const baseRates = await getBaseRates(insurerId, String(pid));
          const byProject = new Map<
            string,
            Array<{
              name: string;
              currency: string;
              base_rate: number;
              pricing_type: string;
              quote_option: string;
            }>
          >();
          (baseRates || []).forEach((item) => {
            const slug = (item.project_type || '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');
            byProject.set(slug, Array.isArray(item.sub_projects) ? item.sub_projects : []);
          });
          mappedEntries = mappedEntries.map((e) => {
            const list = byProject.get(e.projectType) || [];
            const match = list.find(
              (sp) => (sp.name || '').toLowerCase() === e.subProjectType.toLowerCase(),
            );
            if (!match) return e;
            // Append values into UI without overwriting metadata structure
            const normalizedPricing =
              String(match.pricing_type || '').toUpperCase() === 'FIXED_AMOUNT'
                ? 'fixed'
                : 'percentage';
            const normalizedQuote =
              String(match.quote_option || '').toUpperCase() === 'NO_QUOTE' ? 'no-quote' : 'quote';
            return {
              ...e,
              pricingType: normalizedPricing as 'fixed' | 'percentage',
              baseRate: Number(match.base_rate || 0),
              currency: match.currency || undefined,
              quoteOption: normalizedQuote as 'quote' | 'no-quote',
            };
          });
        }
      } catch (err) {
        const status = err?.status;
        // 404 means no configuration yet for this product - this is OK for new products
        if (status === 404) {
          console.log(
            '[BaseRates] No existing configuration found (404) - starting with empty data',
          );
          // Don't set error for 404 - this is expected for new products
        } else {
          const msg =
            status === 400
              ? 'Bad request while loading base rates.'
              : status === 401
                ? 'Unauthorized. Please log in again.'
                : status === 403
                  ? 'Forbidden. You do not have access.'
                  : status >= 500
                    ? 'Server error while loading base rates.'
                    : 'Failed to load base rates.';
          setBaseRatesMastersError(msg);
        }
      }
      setRatingConfig((prev) => ({
        ...prev,
        subProjectEntries: mappedEntries,
      }));

      toast({
        title: 'Loaded',
        description: `Project Types: ${(projects || []).length}, Sub Types: ${(subs || []).length}`,
      });
    } catch (err) {
      const status = err?.status;
      // 404 means no configuration yet - this is OK for new products
      if (status === 404) {
        console.log('[BaseRates] No existing master data found (404) - starting with empty data');
        // Don't set error for 404 - this is expected for new products
      } else {
        const msg =
          status === 400
            ? 'Bad request while loading project types.'
            : status === 401
              ? 'Unauthorized. Please log in again.'
              : status === 403
                ? 'Forbidden. You do not have access.'
                : status >= 500
                  ? 'Server error while loading masters.'
                  : 'Failed to load masters.';
        setBaseRatesMastersError(msg);
        toast({
          title: 'Failed to load',
          description: msg,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoadingBaseRatesMasters(false);
    }
  };

  // Always fetch on demand (Pricing tab or Minimum Premiums click)
  const fetchMinimumPremiumsMasters = async (): Promise<void> => {
    setIsLoadingMinimumPremiumsMasters(true);
    setMinimumPremiumsMastersError(null);
    // try { toast({ title: 'Loading...', description: 'Fetching Project Types and Sub Project Types for Minimum Premiums' }); } catch {}
    try {
      const projects = await listMasterProjectTypes();
      setProjectTypesMasters(projects);
      const subs = await listMasterSubProjectTypes();
      setSubProjectTypesMasters(subs);
      // Map sub projects under their parent project type (slugged value)
      const projectSlugById = new Map<number, string>();
      const projectSlugs: string[] = [];
      projects.forEach((p: any) => {
        const slug = (p.label || String(p.id))
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        projectSlugById.set(p.id, slug);
        projectSlugs.push(slug);
      });
      // Keep shimmer running; fetch insurer minimum premiums and map values onto the metadata
      const insurerId = getInsurerCompanyId();
      const pid = product?.id || '1';
      let mappedEntries: SubProjectEntry[] = subs.map((s) => ({
        projectType: projectSlugById.get(s.projectTypeId) || String(s.projectTypeId),
        subProjectType: s.label,
        pricingType: 'percentage',
        baseRate: 0,
        quoteOption: 'quote',
      }));
      console.log('[MinimumPremiums] Initial mappedEntries:', mappedEntries);
      try {
        if (insurerId && pid) {
          console.log('[MinimumPremiums] Calling getMinimumPremiums with:', {
            insurerId,
            pid,
          });
          const minimumPremiums = await getMinimumPremiums(insurerId, String(pid));
          console.log('[MinimumPremiums] Received data:', minimumPremiums);

          const byProject = new Map<
            string,
            Array<{
              name: string;
              currency: string;
              base_rate: number;
              pricing_type: string;
              quote_option: string;
            }>
          >();
          (minimumPremiums || []).forEach((item) => {
            const slug = (item.project_type || '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');
            console.log(
              `[MinimumPremiums] Processing project type: "${item.project_type}" -> slug: "${slug}"`,
            );
            console.log(`[MinimumPremiums] Sub-projects:`, item.sub_projects);
            byProject.set(slug, Array.isArray(item.sub_projects) ? item.sub_projects : []);
          });
          console.log('[MinimumPremiums] byProject map:', Array.from(byProject.entries()));
          mappedEntries = mappedEntries.map((e) => {
            const list = byProject.get(e.projectType) || [];
            const match = list.find(
              (sp) => (sp.name || '').toLowerCase() === e.subProjectType.toLowerCase(),
            );
            if (!match) {
              console.log(
                `[MinimumPremiums] No match found for project: ${e.projectType}, subProject: ${e.subProjectType}`,
              );
              return e;
            }
            console.log(`[MinimumPremiums] Found match for ${e.subProjectType}:`, match);
            // Append values into UI without overwriting metadata structure
            const normalizedPricing =
              String(match.pricing_type || '').toUpperCase() === 'FIXED_AMOUNT'
                ? 'fixed'
                : 'percentage';
            const normalizedQuote =
              String(match.quote_option || '').toUpperCase() === 'NO_QUOTE' ? 'no-quote' : 'quote';
            const updatedEntry = {
              ...e,
              pricingType: normalizedPricing as 'fixed' | 'percentage',
              baseRate: Number(match.base_rate || 0),
              // currency informs display; UI already shows % vs AED based on pricingType
              quoteOption: normalizedQuote as 'quote' | 'no-quote',
            };
            console.log(`[MinimumPremiums] Updated entry for ${e.subProjectType}:`, updatedEntry);
            return updatedEntry;
          });
          console.log('[MinimumPremiums] Mapped entries:', mappedEntries);
        }
      } catch (err) {
        console.error('[MinimumPremiums] Error in fetchMinimumPremiumsMasters:', err);
        const status = err?.status;
        const errorMessage = err?.message || '';

        // Suppress error message for 500 status with "error fetching" message on first load
        if (status === 500 && errorMessage.includes('error fetching')) {
          console.warn(
            '[MinimumPremiums] API returned 500 with "error fetching" - suppressing error message',
          );
          setMinimumPremiumsMastersError(null);
        } else {
          const msg =
            status === 400
              ? 'Bad request while loading minimum premiums.'
              : status === 401
                ? 'Unauthorized. Please log in again.'
                : status === 403
                  ? 'Forbidden. You do not have access.'
                  : status >= 500
                    ? 'Server error while loading minimum premiums.'
                    : 'Failed to load minimum premiums.';
          console.error('[MinimumPremiums] Setting error message:', msg);
          setMinimumPremiumsMastersError(msg);
        }
        // Still show UI even if API fails - just log the error
        console.warn('[MinimumPremiums] API failed, showing UI with default data:', err);
      }
      // Always set the UI data even if API fails
      setRatingConfig((prev) => ({
        ...prev,
        subProjectEntries: mappedEntries,
      }));
      toast({
        title: 'Loaded',
        description: `Project Types: ${(projects || []).length}, Sub Types: ${(subs || []).length}`,
      });
    } catch (err) {
      const status = err?.status;
      // 404 means no configuration yet - this is OK for new products
      if (status === 404) {
        console.log(
          '[MinimumPremiums] No existing master data found (404) - starting with empty data',
        );
        // Don't set error for 404 - this is expected for new products
      } else {
        const msg =
          status === 400
            ? 'Bad request while loading project types.'
            : status === 401
              ? 'Unauthorized. Please log in again.'
              : status === 403
                ? 'Forbidden. You do not have access.'
                : status >= 500
                  ? 'Server error while loading masters.'
                  : 'Failed to load masters.';
        setMinimumPremiumsMastersError(msg);
      }
      // Still show UI even if masters loading fails - use fallback data
      console.warn('[MinimumPremiums] Masters loading failed, showing UI with fallback data:', err);
      // Set fallback data to ensure UI is shown
      setRatingConfig((prev) => ({ ...prev, subProjectEntries: [] }));
      toast({
        title: 'Warning',
        description: 'Using fallback data. Some features may be limited.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMinimumPremiumsMasters(false);
    }
  };

  // Minimum Premiums save handler
  const handleSaveMinimumPremiums = async () => {
    const insurerId = getInsurerCompanyId();
    const pid = product?.id || '1';
    if (!insurerId || !pid) return;

    setIsSavingMinimumPremiums(true);
    try {
      setMinimumPremiumsMastersError(null);
      const byProject = new Map<
        string,
        {
          projectLabel: string;
          items: {
            name: string;
            pricing_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
            base_rate: number;
            currency: string;
            quote_option: 'AUTO_QUOTE' | 'NO_QUOTE' | 'QUOTE_AND_REFER';
          }[];
        }
      >();
      const labelBySlug = new Map<string, string>();
      (projectTypesMasters || []).forEach((p) =>
        labelBySlug.set(p.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), p.label),
      );
      ratingConfig.subProjectEntries.forEach((e) => {
        const slug = e.projectType;
        const projectLabel = labelBySlug.get(slug) || slug;
        if (!byProject.has(slug)) byProject.set(slug, { projectLabel, items: [] });
        const pricing_type =
          String(e.pricingType).toLowerCase() === 'fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE';
        const currency = pricing_type === 'FIXED_AMOUNT' ? productCurrency : '%';
        const quote_option = 'AUTO_QUOTE'; // Always use AUTO_QUOTE for minimum premiums
        byProject.get(slug)!.items.push({
          name: e.subProjectType,
          pricing_type,
          base_rate: Number(e.baseRate || 0),
          currency,
          quote_option,
        });
      });
      const body = {
        minimum_premium_rates: Array.from(byProject.values()).map((group) => ({
          project_type: group.projectLabel,
          sub_projects: group.items,
        })),
      };
      const hasExisting = Boolean(
        projectTypesMasters &&
        subProjectTypesMasters &&
        ratingConfig.subProjectEntries.some((e) => Number(e.baseRate) !== 0),
      );
      const resp = hasExisting
        ? await updateMinimumPremiums(insurerId, String(pid), body)
        : await saveMinimumPremiums(insurerId, String(pid), body);
      toast({
        title: 'Saved',
        description: resp?.message || 'Minimum premiums saved.',
      });
    } catch (err) {
      const status = err?.status;
      const msg =
        status === 400
          ? 'Invalid data while saving minimum premiums.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while saving minimum premiums.'
                : err?.message || 'Failed to save minimum premiums.';
      setMinimumPremiumsMastersError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsSavingMinimumPremiums(false);
    }
  };

  // Fire GET on Project Risk Factors click and map to UI state
  const fetchProjectRiskFactors = async (): Promise<void> => {
    setIsLoadingProjectRiskFactors(true);
    setProjectRiskFactorsError(null);
    try {
      const insurerId = getInsurerCompanyId();
      const pid = product?.id || '1';
      if (!insurerId || !pid) return;
      const resp = await getProjectRiskFactors(insurerId, String(pid));
      const data = resp && resp.data != null ? resp.data : resp || {};

      console.log('📋 Project Risk Factors API response:', data);
      console.log('📋 Risk definition data:', data?.location_hazard_loadings?.risk_definition);

      // Map API -> UI (only fields currently bound in UI)
      const mapDur = Array.isArray(data.project_duration_loadings)
        ? data.project_duration_loadings.map((d, idx: number) => ({
          id: idx + 1,
          from: Number(d?.from_months ?? 0),
          to: d?.to_months == null ? 999 : Number(d.to_months),
          pricingType:
            String(d?.pricing_type || '').toUpperCase() === 'FIXED_AMOUNT'
              ? 'fixed'
              : 'percentage',
          value: Number(d?.loading_discount ?? 0),
          quoteOption:
            String(d?.quote_option || '').toUpperCase() === 'NO_QUOTE' ? 'no-quote' : 'quote',
        }))
        : undefined;
      const mapMaint = Array.isArray(data.maintenance_period_loadings)
        ? data.maintenance_period_loadings.map((d, idx: number) => ({
          id: idx + 1,
          from: Number(d?.from_months ?? 0),
          to: d?.to_months == null ? 999 : Number(d.to_months),
          pricingType:
            String(d?.pricing_type || '').toUpperCase() === 'FIXED_AMOUNT'
              ? 'fixed'
              : 'percentage',
          value: Number(d?.loading_discount ?? 0),
          quoteOption:
            String(d?.quote_option || '').toUpperCase() === 'NO_QUOTE' ? 'no-quote' : 'quote',
        }))
        : undefined;
      const hazardRates = Array.isArray(data?.location_hazard_loadings?.location_hazard_rates)
        ? data.location_hazard_loadings.location_hazard_rates.reduce((acc, r) => {
          const txt = String(r?.risk_level || '').toLowerCase();
          const key = txt.includes('very')
            ? 'veryHigh'
            : txt.includes('high') && !txt.includes('very')
              ? 'high'
              : txt.includes('moderate')
                ? 'moderate'
                : 'low';
          acc[key] = {
            pricingType:
              String(r?.pricing_type || '').toLowerCase() === 'fixed_amount'
                ? 'fixed'
                : 'percentage',
            loadingDiscount: Number(r?.loading_discount ?? 0),
            quoteOption:
              String(r?.quote_option || '').toUpperCase() === 'NO_QUOTE' ? 'no-quote' : 'quote',
          };
          return acc;
        }, {})
        : {};

      // Map risk definition factors from API to hardcoded UI fields
      const riskDefinition = data?.location_hazard_loadings?.risk_definition;
      const mappedRiskDefinition = {
        nearWaterBody: {
          lowRisk: 'no',
          moderateRisk: 'no',
          highRisk: 'no',
          veryHighRisk: 'no',
        },
        floodProneZone: {
          lowRisk: 'no',
          moderateRisk: 'no',
          highRisk: 'no',
          veryHighRisk: 'no',
        },
        cityCenter: {
          lowRisk: 'no',
          moderateRisk: 'no',
          highRisk: 'no',
          veryHighRisk: 'no',
        },
        soilType: {
          lowRisk: [],
          moderateRisk: [],
          highRisk: [],
          veryHighRisk: [],
        },
        existingStructure: {
          lowRisk: 'no',
          moderateRisk: 'no',
          highRisk: 'no',
          veryHighRisk: 'no',
        },
        blastingExcavation: {
          lowRisk: 'no',
          moderateRisk: 'no',
          highRisk: 'no',
          veryHighRisk: 'no',
        },
        securityArrangements: {
          lowRisk: '',
          moderateRisk: '',
          highRisk: '',
          veryHighRisk: '',
        },
      };

      // Map API factors to hardcoded fields
      if (riskDefinition?.factors && Array.isArray(riskDefinition.factors)) {
        riskDefinition.factors.forEach((factor) => {
          const factorName = String(factor.factor || '').toLowerCase();

          if (factorName.includes('near water body') || factorName.includes('water body')) {
            mappedRiskDefinition.nearWaterBody = {
              lowRisk: String(factor.low_risk || 'no').toLowerCase(),
              moderateRisk: String(factor.moderate_risk || 'no').toLowerCase(),
              highRisk: String(factor.high_risk || 'no').toLowerCase(),
              veryHighRisk: String(factor.very_high_risk || 'no').toLowerCase(),
            };
          } else if (factorName.includes('flood-prone') || factorName.includes('flood prone')) {
            mappedRiskDefinition.floodProneZone = {
              lowRisk: String(factor.low_risk || 'no').toLowerCase(),
              moderateRisk: String(factor.moderate_risk || 'no').toLowerCase(),
              highRisk: String(factor.high_risk || 'no').toLowerCase(),
              veryHighRisk: String(factor.very_high_risk || 'no').toLowerCase(),
            };
          } else if (factorName.includes('city center') || factorName.includes('city centre')) {
            mappedRiskDefinition.cityCenter = {
              lowRisk: String(factor.low_risk || 'no').toLowerCase(),
              moderateRisk: String(factor.moderate_risk || 'no').toLowerCase(),
              highRisk: String(factor.high_risk || 'no').toLowerCase(),
              veryHighRisk: String(factor.very_high_risk || 'no').toLowerCase(),
            };
          } else if (factorName.includes('soil type') || factorName.includes('soil')) {
            // For soil type, handle array values from API
            mappedRiskDefinition.soilType = {
              lowRisk: Array.isArray(factor.low_risk) ? factor.low_risk : [],
              moderateRisk: Array.isArray(factor.moderate_risk) ? factor.moderate_risk : [],
              highRisk: Array.isArray(factor.high_risk) ? factor.high_risk : [],
              veryHighRisk: Array.isArray(factor.very_high_risk) ? factor.very_high_risk : [],
            };
          } else if (
            factorName.includes('existing structure') ||
            factorName.includes('existing structure on site')
          ) {
            mappedRiskDefinition.existingStructure = {
              lowRisk: String(factor.low_risk || 'no').toLowerCase(),
              moderateRisk: String(factor.moderate_risk || 'no').toLowerCase(),
              highRisk: String(factor.high_risk || 'no').toLowerCase(),
              veryHighRisk: String(factor.very_high_risk || 'no').toLowerCase(),
            };
          } else if (factorName.includes('blasting') || factorName.includes('deep excavation')) {
            mappedRiskDefinition.blastingExcavation = {
              lowRisk: String(factor.low_risk || 'no').toLowerCase(),
              moderateRisk: String(factor.moderate_risk || 'no').toLowerCase(),
              highRisk: String(factor.high_risk || 'no').toLowerCase(),
              veryHighRisk: String(factor.very_high_risk || 'no').toLowerCase(),
            };
          } else if (
            factorName.includes('security') ||
            factorName.includes('security arrangements')
          ) {
            mappedRiskDefinition.securityArrangements = {
              lowRisk: String(factor.low_risk || ''),
              moderateRisk: String(factor.moderate_risk || ''),
              highRisk: String(factor.high_risk || ''),
              veryHighRisk: String(factor.very_high_risk || ''),
            };
          }
        });
      }

      console.log('📋 Mapped risk definition:', mappedRiskDefinition);

      setRatingConfig((prev) => ({
        ...prev,
        projectRisk: {
          ...prev.projectRisk,
          ...(mapDur ? { durationLoadings: mapDur } : {}),
          ...(mapMaint ? { maintenancePeriodLoadings: mapMaint } : {}),
          locationHazardRates: hazardRates,
          riskDefinition: mappedRiskDefinition,
        },
      }));

      // Set flag to indicate we have data from GET API
      const hasData =
        Array.isArray(data.project_duration_loadings) ||
        Array.isArray(data.maintenance_period_loadings) ||
        (data?.location_hazard_loadings?.location_hazard_rates &&
          Array.isArray(data.location_hazard_loadings.location_hazard_rates));
      setHasProjectRiskFactorsData(hasData);
    } catch (err) {
      const status = err?.status;
      // 404 means no configuration yet for this product - this is OK for new products
      if (status === 404) {
        console.log(
          '[ProjectRiskFactors] No existing configuration found (404) - starting with empty data',
        );
        // Don't set error for 404 - this is expected for new products
        setHasProjectRiskFactorsData(false);
      } else {
        const msg =
          status === 400
            ? 'Bad request while loading project risk factors.'
            : status === 401
              ? 'Unauthorized. Please log in again.'
              : status === 403
                ? 'Forbidden. You do not have access.'
                : status >= 500
                  ? 'Server error while loading project risk factors.'
                  : 'Failed to load project risk factors.';
        setProjectRiskFactorsError(msg);
      }
    } finally {
      setIsLoadingProjectRiskFactors(false);
    }
  };

  // Project Risk Factors save handler
  const handleSaveProjectRiskFactors = async () => {
    const insurerId = getInsurerCompanyId();
    const pid = product?.id || '1';
    if (!insurerId || !pid) return;

    setIsSavingProjectRiskFactors(true);
    try {
      // Map UI state to API request format
      const body: ProjectRiskFactorsRequest = {
        project_risk_factors: {
          project_duration_loadings: ratingConfig.projectRisk.durationLoadings.map((item) => ({
            from_months: Number(item.from || 0),
            to_months: item.to === 999 ? null : Number(item.to || 0),
            pricing_type: item.pricingType === 'fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE',
            loading_discount: Number(item.value || 0),
            quote_option: item.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE',
          })),
          maintenance_period_loadings: ratingConfig.projectRisk.maintenancePeriodLoadings.map(
            (item) => ({
              from_months: Number(item.from || 0),
              to_months: item.to === 999 ? null : Number(item.to || 0),
              pricing_type: item.pricingType === 'fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE',
              loading_discount: Number(item.value || 0),
              quote_option: item.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE',
            }),
          ),
          location_hazard_loadings: {
            risk_definition: {
              factors: (() => {
                const projectRisk = ratingConfig.projectRisk as any;
                const riskDef = projectRisk?.riskDefinition || {};

                return [
                  {
                    factor: 'Near water body',
                    low_risk: riskDef?.nearWaterBody?.lowRisk === 'yes' ? 'Yes' : 'No',
                    moderate_risk: riskDef?.nearWaterBody?.moderateRisk === 'yes' ? 'Yes' : 'No',
                    high_risk: riskDef?.nearWaterBody?.highRisk === 'yes' ? 'Yes' : 'No',
                    very_high_risk: riskDef?.nearWaterBody?.veryHighRisk === 'yes' ? 'Yes' : 'No',
                  },
                  {
                    factor: 'Flood-prone zone',
                    low_risk: riskDef?.floodProneZone?.lowRisk === 'yes' ? 'Yes' : 'No',
                    moderate_risk: riskDef?.floodProneZone?.moderateRisk === 'yes' ? 'Yes' : 'No',
                    high_risk: riskDef?.floodProneZone?.highRisk === 'yes' ? 'Yes' : 'No',
                    very_high_risk: riskDef?.floodProneZone?.veryHighRisk === 'yes' ? 'Yes' : 'No',
                  },
                  {
                    factor: 'City center',
                    low_risk: riskDef?.cityCenter?.lowRisk === 'yes' ? 'Yes' : 'No',
                    moderate_risk: riskDef?.cityCenter?.moderateRisk === 'yes' ? 'Yes' : 'No',
                    high_risk: riskDef?.cityCenter?.highRisk === 'yes' ? 'Yes' : 'No',
                    very_high_risk: riskDef?.cityCenter?.veryHighRisk === 'yes' ? 'Yes' : 'No',
                  },
                  {
                    factor: 'Soil type',
                    low_risk: Array.isArray(riskDef?.soilType?.lowRisk)
                      ? riskDef.soilType.lowRisk
                      : [],
                    moderate_risk: Array.isArray(riskDef?.soilType?.moderateRisk)
                      ? riskDef.soilType.moderateRisk
                      : [],
                    high_risk: Array.isArray(riskDef?.soilType?.highRisk)
                      ? riskDef.soilType.highRisk
                      : [],
                    very_high_risk: Array.isArray(riskDef?.soilType?.veryHighRisk)
                      ? riskDef.soilType.veryHighRisk
                      : [],
                  },
                  {
                    factor: 'Existing structure on site',
                    low_risk: riskDef?.existingStructure?.lowRisk === 'yes' ? 'Yes' : 'No',
                    moderate_risk:
                      riskDef?.existingStructure?.moderateRisk === 'yes' ? 'Yes' : 'No',
                    high_risk: riskDef?.existingStructure?.highRisk === 'yes' ? 'Yes' : 'No',
                    very_high_risk:
                      riskDef?.existingStructure?.veryHighRisk === 'yes' ? 'Yes' : 'No',
                  },
                  {
                    factor: 'Blasting/Deep excavation',
                    low_risk: riskDef?.blastingExcavation?.lowRisk === 'yes' ? 'Yes' : 'No',
                    moderate_risk:
                      riskDef?.blastingExcavation?.moderateRisk === 'yes' ? 'Yes' : 'No',
                    high_risk: riskDef?.blastingExcavation?.highRisk === 'yes' ? 'Yes' : 'No',
                    very_high_risk:
                      riskDef?.blastingExcavation?.veryHighRisk === 'yes' ? 'Yes' : 'No',
                  },
                  {
                    factor: 'Security arrangements',
                    low_risk: riskDef?.securityArrangements?.lowRisk || '',
                    moderate_risk: riskDef?.securityArrangements?.moderateRisk || '',
                    high_risk: riskDef?.securityArrangements?.highRisk || '',
                    very_high_risk: riskDef?.securityArrangements?.veryHighRisk || '',
                  },
                ];
              })(),
            },
            location_hazard_rates: [
              {
                risk_level: 'Low Risk',
                pricing_type: 'PERCENTAGE',
                loading_discount: Number(ratingConfig.projectRisk.locationHazardLoadings?.low || 0),
                quote_option: 'AUTO_QUOTE',
              },
              {
                risk_level: 'Moderate Risk',
                pricing_type: 'PERCENTAGE',
                loading_discount: Number(
                  ratingConfig.projectRisk.locationHazardLoadings?.moderate || 0,
                ),
                quote_option: 'AUTO_QUOTE',
              },
              {
                risk_level: 'High Risk',
                pricing_type: 'PERCENTAGE',
                loading_discount: Number(
                  ratingConfig.projectRisk.locationHazardLoadings?.high || 0,
                ),
                quote_option: 'AUTO_QUOTE',
              },
              {
                risk_level: 'Very High Risk',
                pricing_type: 'PERCENTAGE',
                loading_discount: Number(
                  ratingConfig.projectRisk.locationHazardLoadings?.veryHigh || 0,
                ),
                quote_option: 'AUTO_QUOTE',
              },
            ],
          },
        },
      };

      // Debug: Log the request body to verify Risk Definition mapping
      console.log('🔍 Project Risk Factors Request Body:', JSON.stringify(body, null, 2));

      // Use POST if no data from GET API, PATCH if data exists
      const resp = hasProjectRiskFactorsData
        ? await updateProjectRiskFactors(insurerId, String(pid), {
          insurer_id: insurerId,
          ...body,
        })
        : await createProjectRiskFactors(insurerId, String(pid), body);

      toast({
        title: 'Saved',
        description: resp?.message || 'Project risk factors saved successfully.',
      });
    } catch (err) {
      const status = err?.status;
      const msg =
        status === 400
          ? 'Invalid data while saving project risk factors.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while saving project risk factors.'
                : err?.message || 'Failed to save project risk factors.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsSavingProjectRiskFactors(false);
    }
  };

  // Mock product data
  const product = {
    id: productId,
    name: productId === '1' ? 'CAR Insurance' : 'CAR Insurance Premium',
    code: productId === '1' ? 'CAR-STD-001' : 'CAR-PRM-002',
  };

  // State for geographic selection

  // Initialize base rates from masters data
  const initializeBaseRates = () => {
    const rates: Record<string, number> = {};
    activeProjectTypes.forEach((type) => {
      rates[type.value] = 0; // Start with 0 instead of pre-filled base rates
    });
    return rates;
  };

  // Initialize sub project types as individual entries
  const initializeSubProjectEntries = () => {
    const entries: SubProjectEntry[] = [];

    activeProjectTypes.forEach((type) => {
      const subTypes = getSubProjectTypesByProjectType(type.id);
      subTypes.forEach((subType) => {
        entries.push({
          projectType: type.value,
          subProjectType: subType.label,
          pricingType: 'percentage',
          baseRate: 0, // Start with 0 instead of pre-filled base rates
          quoteOption: 'quote',
          currency: productCurrency,
        });
      });
    });

    return entries;
  };

  const [uploadedWordings, setUploadedWordings] = useState([]);
  const [activePricingTab, setActivePricingTab] = useState('base-rates');
  const [isNewWordingDialogOpen, setIsNewWordingDialogOpen] = useState(false);
  const [newWordingName, setNewWordingName] = useState('');
  const [isWordingUploadDialogOpen, setIsWordingUploadDialogOpen] = useState(false);
  const [wordingUploadTitle, setWordingUploadTitle] = useState('');
  const [wordingUploadActive, setWordingUploadActive] = useState(true);
  const [wordingUploadFile, setWordingUploadFile] = useState<File | null>(null);
  const [isUploadingWording, setIsUploadingWording] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingWording, setEditingWording] = useState(null);
  const [isEditClauseDialogOpen, setIsEditClauseDialogOpen] = useState(false);
  const [selectedClause, setSelectedClause] = useState(null);
  const [isAddClauseDialogOpen, setIsAddClauseDialogOpen] = useState(false);
  const [isCEWRulesDialogOpen, setIsCEWRulesDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewWording, setPreviewWording] = useState<PolicyWording | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<DocTpl | null>(null);
  const [previewParameters, setPreviewParameters] = useState<DocParam[]>([]);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [previewHiddenTypes, setPreviewHiddenTypes] = useState<DocElementType[]>([]);
  const [isConfirmSaveDialogOpen, setIsConfirmSaveDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('pricing');
  const [isQuoteFormatDialogOpen, setIsQuoteFormatDialogOpen] = useState(false);

  // Quote Format state
  const [isLoadingQuoteFormat, setIsLoadingQuoteFormat] = useState(false);
  const [quoteFormatError, setQuoteFormatError] = useState<string | null>(null);
  const quoteFormatApiRef = useRef(false);
  const [quoteFormatId, setQuoteFormatId] = useState<number | null>(null);
  const [quoteLogoFile, setQuoteLogoFile] = useState<File | null>(null);
  const [isSavingQuoteFormat, setIsSavingQuoteFormat] = useState(false);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState<string | null>(null);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [uploadedStampUrl, setUploadedStampUrl] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      if (!product.id) return;
      try {
        const list = await getDocumentTemplates(product.id as string);
        const options = list.map((t) => ({ id: t.id, name: t.name }));
        setTemplates(options);
        if (!selectedTemplateId && options.length > 0) {
          setSelectedTemplateId(options[0].id);
        }
      } catch {
        // ignore
      }
    };
    loadTemplates();
  }, [product.id]);

  useEffect(() => {
    const loadTemplateQuoteFormat = async () => {
      if (!selectedTemplateId) return;
      try {
        setIsLoadingQuoteFormat(true);
        const data = await getQuoteFormatByTemplate(selectedTemplateId);
        if (data) {
          setUploadedLogoUrl(data.logoUrl || null);
          setUploadedSignatureUrl(data.signatureUrl || null);
          setUploadedStampUrl(data.stampUrl || null);
          setQuoteConfig((prev) => ({
            ...prev,
            header: {
              ...prev.header,
              companyName: data.staticMacroOverrides?.companyName || '',
              companyAddress: data.staticMacroOverrides?.companyAddress || '',
              contactInfo: data.staticMacroOverrides?.companyContactInfo || '',
              headerColor: data.headerBgColor || prev.header.headerColor,
              headerTextColor: data.headerTextColor || prev.header.headerTextColor,
            },
            signature: {
              ...prev.signature,
              showSignatureBlock: !!data.signatureVisible,
              authorizedSignatory: data.signatureName || '',
              signatoryTitle: data.signatureTitle || '',
              signatureText: prev.signature.signatureText,
            },
            stamp: {
              ...prev.stamp,
              showStampBlock: data.stampVisible ?? prev.stamp.showStampBlock,
              stampLabel: data.stampLabel || '',
            },
            footer: {
              ...prev.footer,
              showFooter: !!data.footerVisible,
              showDisclaimer: !!data.disclaimerVisible,
              showRegulatoryInfo: !!data.regulatoryInfoVisible,
              generalDisclaimer: data.staticMacroOverrides?.generalDisclaimerText || '',
              regulatoryText: data.staticMacroOverrides?.regulatoryInformation || '',
              footerBgColor: data.footerBgColor || prev.footer.footerBgColor,
              footerTextColor: data.footerTextColor || prev.footer.footerTextColor,
            },
          }));
        }
      } finally {
        setIsLoadingQuoteFormat(false);
      }
    };
    loadTemplateQuoteFormat();
  }, [selectedTemplateId]);

  // Required Documents state
  const [isLoadingRequiredDocs, setIsLoadingRequiredDocs] = useState(false);
  const [requiredDocsError, setRequiredDocsError] = useState<string | null>(null);
  const requiredDocsApiRef = useRef(false);

  // Insurer metadata state
  const [insurerMetadata, setInsurerMetadata] = useState<InsurerMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Quote config data state
  const [quoteConfigData, setQuoteConfigData] = useState<QuoteConfigUIResponse | null>(null);
  const [isLoadingQuoteConfig, setIsLoadingQuoteConfig] = useState(false);
  const [quoteConfigError, setQuoteConfigError] = useState<string | null>(null);
  const [isSavingQuoteConfig, setIsSavingQuoteConfig] = useState(false);
  const [hasQuoteConfigData, setHasQuoteConfigData] = useState(false);

  // Policy Wordings state
  const [policyWordings, setPolicyWordings] = useState<PolicyWordingItem[]>([]);
  const [isLoadingPolicyWordings, setIsLoadingPolicyWordings] = useState(false);
  const [policyWordingsError, setPolicyWordingsError] = useState<string | null>(null);
  const policyWordingsApiRef = useRef(false);

  // Required Documents state
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocumentItem[]>([]);
  const [editingDocument, setEditingDocument] = useState<RequiredDocumentItem | null>(null);
  const [newDocument, setNewDocument] = useState<NewDocument>(defaultDocumentFormState());
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [deletingValidationQuestionIds, setDeletingValidationQuestionIds] = useState<string[]>([]);

  // Endorsement Documents state
  const [isLoadingEndorsementDocs, setIsLoadingEndorsementDocs] = useState(false);
  const [endorsementDocsError, setEndorsementDocsError] = useState<string | null>(null);
  const endorsementDocsApiRef = useRef(false);
  const [endorsementDocuments, setEndorsementDocuments] = useState<RequiredDocumentItem[]>([]);
  const [editingEndorsementDocument, setEditingEndorsementDocument] =
    useState<RequiredDocumentItem | null>(null);
  const [newEndorsementDocument, setNewEndorsementDocument] =
    useState<NewDocument>(defaultDocumentFormState());
  const [isUploadingEndorsementTemplate, setIsUploadingEndorsementTemplate] = useState(false);

  // Underwriting Documents state
  const [isLoadingUnderwritingDocs, setIsLoadingUnderwritingDocs] = useState(false);
  const [underwritingDocsError, setUnderwritingDocsError] = useState<string | null>(null);
  const underwritingDocsApiRef = useRef(false);
  const [underwritingDocuments, setUnderwritingDocuments] = useState<RequiredDocumentItem[]>([]);
  const [editingUnderwritingDocument, setEditingUnderwritingDocument] =
    useState<RequiredDocumentItem | null>(null);
  const [newUnderwritingDocument, setNewUnderwritingDocument] =
    useState<NewDocument>(defaultDocumentFormState());

  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => { },
  });
  const [newClause, setNewClause] = useState({
    code: '',
    title: '',
    type: 'Clause',
    show: 'Optional',
    wording: '',
    purposeDescription: '',
    purpose: '',
    adjustmentType: 'percentage',
    adjustmentValue: 0,
    clausesPricing: [
      {
        label: '',
        limits: '',
        type: 'percentage',
        adjustmentValue: 0,
        isActive: true,
      },
    ] as any[],
    selectedCoverIds: [] as string[],
  });

  // State for TPL limit & Extensions
  const [tplLimit, setTplLimit] = useState('');

  useEffect(() => {
    if (!productId) return;
    const fetchProductInfo = async () => {
      if (productId) {
        const info = await getProduct(productId);
        setProductInfo(info);
      }
    };
    fetchProductInfo();
  }, [productId]);

  // Load insurer metadata when Quote Configurator tab is active
  useEffect(() => {
    const loadInsurerMetadata = async () => {
      if (activeTab === 'quote-config' && !insurerMetadata && !isLoadingMetadata) {
        setIsLoadingMetadata(true);
        setMetadataError(null);
        try {
          const insurerId = getInsurerCompanyId();
          if (insurerId) {
            const metadata = await getInsurerMetadata(insurerId);
            setInsurerMetadata(metadata);
          }
        } catch (err) {
          const status = err?.status as number | undefined;
          const message = err?.message as string | undefined;
          if (status === 400)
            setMetadataError(message || 'Bad request while loading insurer metadata.');
          else if (status === 401) setMetadataError('Unauthorized. Please log in again.');
          else if (status === 403) setMetadataError("You don't have access to insurer metadata.");
          else if (status && status >= 500)
            setMetadataError('Server error. Please try again later.');
          else setMetadataError(message || 'Failed to load insurer metadata.');
        } finally {
          setIsLoadingMetadata(false);
        }
      }
    };

    loadInsurerMetadata();
  }, [activeTab, insurerMetadata]);

  // Load quote config data after metadata is loaded
  // useEffect(() => {
  //   const loadQuoteConfigData = async () => {
  //     if (
  //       insurerMetadata &&
  //       !quoteConfigData &&
  //       !isLoadingQuoteConfig &&
  //       activeTab === 'quote-config'
  //     ) {
  //       setIsLoadingQuoteConfig(true);
  //       setQuoteConfigError(null);
  //       try {
  //         const insurerId = getInsurerCompanyId();
  //         if (insurerId && product.id) {
  //           const configData = await getQuoteConfigForUI(insurerId, product.id as string);
  //           setQuoteConfigData(configData);

  //           // Populate the UI with the fetched data (correct mapping)
  //           setQuoteConfig((prev) => ({
  //             ...prev,
  //             details: {
  //               ...prev.details,
  //               validityDays: String(configData?.validity_days || ''),
  //               validityPeriod: String(
  //                 configData?.validity_period || configData?.validity_days || '',
  //               ),
  //               validityPeriodUnit: (configData?.validity_period_unit ||
  //                 QUOTE_VALIDITY_PERIOD_UNIT.DAYS) as any,
  //               backdateWindow: String(configData?.backdate_days || ''),
  //               countries: configData?.operating_countries || [],
  //               regions: configData?.operating_regions || [],
  //               zones: configData?.operating_zones || [],
  //             },
  //           }));

  //           // Set flag to indicate we have existing data from GET API
  //           setHasQuoteConfigData(
  //             Boolean(
  //               configData &&
  //               (configData.validity_days ||
  //                 configData.backdate_days ||
  //                 configData.operating_countries?.length),
  //             ),
  //           );
  //         }
  //       } catch (err) {
  //         const status = err?.status as number | undefined;
  //         const message = err?.message as string | undefined;
  //         if (status === 400)
  //           setQuoteConfigError(message || 'Bad request while loading quote config.');
  //         else if (status === 401) setQuoteConfigError('Unauthorized. Please log in again.');
  //         else if (status === 403) setQuoteConfigError("You don't have access to quote config.");
  //         else if (status && status >= 500)
  //           setQuoteConfigError('Server error. Please try again later.');
  //         else setQuoteConfigError(message || 'Failed to load quote config.');
  //       } finally {
  //         setIsLoadingQuoteConfig(false);
  //       }
  //     }
  //   };

  //   loadQuoteConfigData();
  // }, [insurerMetadata, quoteConfigData, activeTab, product.id]);

  // Load policy wordings when Wording Configuration tab is active
  useEffect(() => {
    const loadPolicyWordings = async () => {
      if (
        activeTab === 'wording' &&
        !isLoadingPolicyWordings &&
        !policyWordingsApiRef.current &&
        product.id
      ) {
        policyWordingsApiRef.current = true;
        setIsLoadingPolicyWordings(true);
        setPolicyWordingsError(null);
        try {
          if (product.id) {
            const list = await getWordingDocumentTypes(product.id as string);
            const mapped = (list || []).map((d) => ({
              id: String(d.id),
              label: d.displayLabel,
              url: '',
              is_active: !!d.isActive,
              originalFilename: d.originalFilename,
              templateFile: d.templateFile,
              fileSize: d.fileSize,
            })) as PolicyWordingItem[];
            setPolicyWordings(mapped);
          }
        } catch (err) {
          const status = err?.status as number | undefined;
          const message = err?.message as string | undefined;
          if (status === 400)
            setPolicyWordingsError(message || 'Bad request while loading policy wordings.');
          else if (status === 401) setPolicyWordingsError('Unauthorized. Please log in again.');
          else if (status === 403)
            setPolicyWordingsError("You don't have access to policy wordings.");
          else if (status && status >= 500)
            setPolicyWordingsError('Server error. Please try again later.');
          else setPolicyWordingsError(message || 'Failed to load policy wordings.');
        } finally {
          setIsLoadingPolicyWordings(false);
          policyWordingsApiRef.current = false;
        }
      }
    };

    loadPolicyWordings();

    // Cleanup function to reset the ref when tab changes
    return () => {
      if (activeTab !== 'wording') {
        policyWordingsApiRef.current = false;
      }
    };
  }, [activeTab, product.id]);

  // Load TPL limits & extensions when CEWs tab is active
  useEffect(() => {
    const loadTpl = async () => {
      if (activeTab !== 'cews') return;
      if (tplApiRef.current || hasLoadedTplRef.current) return;
      tplApiRef.current = true;
      setIsLoadingTpl(true);
      setTplError(null);
      try {
        if (!product.id) return;
        const data: CewConfigurationResponseDto = await getCewConfiguration(product.id as string);
        // Map limits
        setTplLimit(String(data?.tplConfig?.defaultTplLimit || ''));
        // Map extensions
        const mapped = (data?.tplConfig?.extensions || []).map((e) => ({
          id: e.id,
          title: e.title || '',
          description: e.description || '',
          tplLimitValue: String(e.tplLimitValue || ''),
          pricingType: (String(e.pricingType || '').toLowerCase() === 'fixed'
            ? 'fixed'
            : 'percentage') as 'percentage' | 'fixed',
          loadingDiscount: Number(e.loadingDiscount || 0),
        }));
        setTplExtensions(mapped as TplExtension[]);
        hasLoadedTplRef.current = true;
      } catch (err: unknown) {
        const e = err as { status?: number; message?: string };
        const status = e?.status;
        const message = e?.message;
        if (status === 400) setTplError(message || 'Bad request while loading TPL data.');
        else if (status === 401) setTplError('Unauthorized. Please log in again.');
        else if (status === 403) setTplError("You don't have access to TPL data.");
        else if (status && status >= 500) setTplError('Server error. Please try again later.');
        else setTplError(message || 'Failed to load TPL data.');
      } finally {
        setIsLoadingTpl(false);
        tplApiRef.current = false;
      }
    };
    loadTpl();
    return () => {
      if (activeTab !== 'cews') {
        hasLoadedTplRef.current = false;
        tplApiRef.current = false;
      }
    };
  }, [activeTab, product.id]);

  // Load Clauses/Exclusions/Warranties when CEWs tab is active
  const refreshClausesData = async () => {
    if (clausesApiRef.current) return;
    clausesApiRef.current = true;
    setIsLoadingClauses(true);
    setClausesError(null);
    try {
      if (!product.id) return;
      const data: CewConfigurationResponseDto = await getCewConfiguration(product.id as string);
      const list = Array.isArray(data?.clauses) ? data.clauses : [];
      const mapped = list.map((c) => ({
        id: c.id,
        code: c.clauseCode || '',
        title: c.title || '',
        purposeDescription: c.purposeDescription || '',
        wording: c.clauseContent || '',
        type:
          (c.type || '').toUpperCase() === 'EXCLUSION'
            ? 'Exclusion'
            : (c.type || '').toUpperCase() === 'WARRANTY'
              ? 'Warranty'
              : 'Clause',
        show: (c.showType || '').toUpperCase() === 'MANDATORY' ? 'Mandatory' : 'Optional',
        adjustmentType: c.adjustmentType || 'percentage',
        adjustmentValue: parseFloat(c.adjustmentValue || 0),
        displayOrder: Number(c.displayOrder || 0),
        active: !!c.isActive,
        clausesPricing:
          c.clausesPricing?.map((p: any) => ({
            id: p.id,
            label: p.label,
            limits: p.limits,
            type: p.type === 'fixed' ? 'currency' : p.type,
            adjustmentValue: p.adjustmentValue,
            isActive: p.isActive,
          })) || [],
        selectedCoverIds: mapClauseSelectedCoverIdsFromApi(c),
      }));
      setClausesData(mapped);
    } catch (err) {
      console.error('Error in fetching data', err);
    } finally {
      setIsLoadingClauses(false);
      clausesApiRef.current = false;
    }
  };

  useEffect(() => {
    const loadClauses = async () => {
      if (activeTab !== 'cews') return;
      await refreshClausesData();
    };

    const loadDeductibles = async () => {
      const deductibles = await getPolicyDeductibles(product.id);
      if (deductibles?.length) {
        const policyDeductibles: Deductible[] = (deductibles || []).map((d) => ({
          id: d.id || Math.random(),
          title: d.title || '',
          description: d.description || '',
          pricingType:
            d.pricingType?.toLowerCase() === 'fixed' ? 'fixed' : d.pricingType?.toLowerCase() === 'flat' ? 'flat' : 'percentage',
          discount: d.discount,
          showType: d.showType === 'MANDATORY' ? 'MANDATORY' : 'OPTIONAL',
        }));
        setPolicyDeductibles(policyDeductibles);
      }
    };
    loadClauses();
    loadDeductibles();
  }, [activeTab, product.id]);

  // Handle logo file selection (no upload; sent on save)
  const handleLogoUpload = (file: File) => {
    if (!file) return;
    // Validate file type (only JPEG, PNG, WebP - no GIF or videos)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description:
          'Please upload a JPEG, PNG, or WebP image. GIF and video files are not allowed.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }
    setQuoteLogoFile(file);
    setUploadedLogoUrl(null);
  };

  // Helper to parse contact info from free-form input
  const parseContactInfo = (contactInfo: string) => {
    try {
      return JSON.parse(contactInfo);
    } catch {
      const phoneMatch = contactInfo.match(/Phone:\s*([^\n]+)/i);
      const emailMatch = contactInfo.match(/Email:\s*([^\n]+)/i);
      const websiteMatch = contactInfo.match(/Website:\s*([^\n]+)/i);
      return {
        phone: phoneMatch?.[1]?.trim() || '',
        email: emailMatch?.[1]?.trim() || '',
        website: websiteMatch?.[1]?.trim() || '',
      };
    }
  };

  // Sanitize URL values (remove stray backticks and whitespace)
  const sanitizeUrl = (url?: string | null) =>
    url ? String(url).trim().replace(/^`|`$/g, '') : (url ?? null);

  // Save Quote Format (moved out of JSX)
  const handleSaveQuoteFormat = async () => {
    if (!product.id) return;
    try {
      setIsSavingQuoteFormat(true);
      const body = {
        companyName: quoteConfig.header.companyName || '',
        companyAddress: quoteConfig.header.companyAddress || '',
        quotationPrefix: quoteConfig.details.quotePrefix || '',
        contactInfo: parseContactInfo(quoteConfig.header.contactInfo || ''),
        headerBgColor: quoteConfig.header.headerColor || '#000000',
        headerTextColor: quoteConfig.header.headerTextColor || '#FFFFFF',
        logoPosition: (quoteConfig.header.logoPosition || 'left').toUpperCase(),
        showProjectDetails: !!quoteConfig.risk.showProjectDetails,
        showCoverageTypes: !!quoteConfig.risk.showCoverageTypes,
        showCoverageLimits: !!quoteConfig.risk.showCoverageLimits,
        showDeductibles: !!quoteConfig.risk.showDeductibles,
        showContractorInfo: !!quoteConfig.risk.showContractorInfo,
        riskSectionTitle: quoteConfig.risk.riskSectionTitle || 'Risk Details',
        showBasePremium: !!quoteConfig.premium.showBasePremium,
        showRiskAdjustments: !!quoteConfig.premium.showRiskAdjustments,
        showFeesCharges: !!quoteConfig.premium.showFees,
        showTaxesVat: !!quoteConfig.premium.showTaxes,
        showTotalPremium: !!quoteConfig.premium.showTotalPremium,
        premiumSectionTitle: quoteConfig.premium.premiumSectionTitle || 'Premium Breakdown',
        premiumCurrency: quoteConfig.premium.currency || productCurrency,
        showWarranties: !!quoteConfig.terms.showWarranties,
        showExclusions: !!quoteConfig.terms.showExclusions,
        showDeductibleDetails: !!quoteConfig.terms.showDeductibleDetails,
        showPolicyConditions: !!quoteConfig.terms.showPolicyConditions,
        termsSectionTitle: quoteConfig.terms.termsSectionTitle || 'Terms & Conditions',
        additionalTermsText: quoteConfig.terms.additionalTerms || '',
        showSignatureBlock: !!quoteConfig.signature.showSignatureBlock,
        authorizedSignatoryName: quoteConfig.signature.authorizedSignatory || '',
        signatoryTitle: quoteConfig.signature.signatoryTitle || '',
        signatureBlockText: quoteConfig.signature.signatureText || '',
        showFooter: !!quoteConfig.footer.showFooter,
        showGeneralDisclaimer: !!quoteConfig.footer.showDisclaimer,
        generalDisclaimerText: quoteConfig.footer.generalDisclaimer || '',
        showRegulatoryInfo: !!quoteConfig.footer.showRegulatoryInfo,
        regulatoryInfoText: quoteConfig.footer.regulatoryText || '',
        footerBgColor: quoteConfig.footer.footerBgColor || '#FFFFFF',
        footerTextColor: quoteConfig.footer.footerTextColor || '#000000',
        logoUrl: uploadedLogoUrl || quoteConfig.header.logoUrl || null,
      };
      await saveProductQuoteFormat(product.id as string, body);
      toast({
        title: 'Quote format saved',
        description: 'Saved successfully.',
      });
      const refreshed = await getProductQuoteFormat(product.id as string);
      setQuoteFormatId(refreshed?.id ? Number(refreshed.id) : null);
      setQuoteConfig((prev) => ({
        ...prev,
        header: {
          ...prev.header,
          companyName: refreshed.companyName || '',
          companyAddress: refreshed.companyAddress || '',
          contactInfo: refreshed.contactInfo ? JSON.stringify(refreshed.contactInfo) : '',
          headerColor: refreshed.headerBgColor || '#1f2937',
          headerTextColor: refreshed.headerTextColor || '#ffffff',
          logoPosition: (refreshed.logoPosition || 'LEFT').toLowerCase(),
          logoUrl: refreshed.logoUrl || '',
        },
        details: {
          ...prev.details,
          quotePrefix: refreshed.quotationPrefix || '',
        },
        risk: {
          ...prev.risk,
          showProjectDetails: !!refreshed.showProjectDetails,
          showCoverageTypes: !!refreshed.showCoverageTypes,
          showCoverageLimits: !!refreshed.showCoverageLimits,
          showDeductibles: !!refreshed.showDeductibles,
          showContractorInfo: !!refreshed.showContractorInfo,
          riskSectionTitle: refreshed.riskSectionTitle || 'Risk Details',
        },
        premium: {
          ...prev.premium,
          currency: refreshed.premiumCurrency || productCurrency,
          premiumSectionTitle: refreshed.premiumSectionTitle || 'Premium Breakdown',
          showBasePremium: !!refreshed.showBasePremium,
          showRiskAdjustments: !!refreshed.showRiskAdjustments,
          showFees: !!refreshed.showFeesCharges,
          showTaxes: !!refreshed.showTaxesVat,
          showTotalPremium: !!refreshed.showTotalPremium,
        },
        terms: {
          ...prev.terms,
          showWarranties: !!refreshed.showWarranties,
          showExclusions: !!refreshed.showExclusions,
          showDeductibleDetails: !!refreshed.showDeductibleDetails,
          showPolicyConditions: !!refreshed.showPolicyConditions,
          termsSectionTitle: refreshed.termsSectionTitle || 'Terms & Conditions',
          additionalTerms: refreshed.additionalTermsText || '',
        },
        signature: {
          ...prev.signature,
          showSignatureBlock: !!refreshed.showSignatureBlock,
          authorizedSignatory: refreshed.authorizedSignatoryName || '',
          signatoryTitle: refreshed.signatoryTitle || '',
          signatureText: refreshed.signatureBlockText || '',
        },
        footer: {
          ...prev.footer,
          showFooter: !!refreshed.showFooter,
          showDisclaimer: !!refreshed.showGeneralDisclaimer,
          showRegulatoryInfo: !!refreshed.showRegulatoryInfo,
          generalDisclaimer: refreshed.generalDisclaimerText || '',
          regulatoryText: refreshed.regulatoryInfoText || '',
          footerBgColor: refreshed.footerBgColor || '#ffffff',
          footerTextColor: refreshed.footerTextColor || '#000000',
        },
      }));
    } catch (err) {
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      if (status === 400)
        toast({
          title: 'Bad request',
          description: message || 'Please review inputs.',
        });
      else if (status === 401)
        toast({ title: 'Unauthorized', description: 'Please log in again.' });
      else if (status === 403)
        toast({
          title: 'Forbidden',
          description: "You don't have permission.",
        });
      else if (status && status >= 500)
        toast({
          title: 'Server error',
          description: 'Please try again later.',
        });
      else
        toast({
          title: 'Error',
          description: message || 'Failed to save quote format.',
        });
    } finally {
      setIsSavingQuoteFormat(false);
    }
  };

  // Load Required Documents when tab is active
  useEffect(() => {
    const loadRequiredDocs = async () => {
      if (activeTab !== 'document-management') return;
      if (requiredDocsApiRef.current) return;
      requiredDocsApiRef.current = true;
      setIsLoadingRequiredDocs(true);
      setRequiredDocsError(null);
      try {
        if (!product.id) return;
        const resp = await getProductRequiredDocuments(product.id as string);
        const list = Array.isArray(resp) ? resp : [];
        const sorted = list
          .slice()
          .sort(
            (a: ProductRequiredDocumentItem, b: ProductRequiredDocumentItem) =>
              Number(a.displayOrder || 0) - Number(b.displayOrder || 0),
          );
        const mapped = sorted.map((d: ProductRequiredDocumentItem) => ({
          id: String(d.id),
          label: d.displayLabel,
          description: d.description || '',
          required: !!d.isRequired,
          active: !!d.isActive,
          order: Number(d.displayOrder) + 1,
          aiQuestionValidation: !!d.aiQuestionValidation,
          validationQuestions:
            d.validationQuestions?.map((question) => ({
              id: question.id,
              question: question.question,
            })) ?? [emptyValidationQuestion()],
          template: d.templateFile
            ? {
              name: String(d.originalFilename ?? '—'),
              size: '—',
              url: '',
            }
            : null,
        })) as RequiredDocumentItem[];
        setRequiredDocuments(mapped);
        // loaded successfully
      } catch (err) {
        const status = err?.status as number | undefined;
        const message = err?.message as string | undefined;
        if (status === 400)
          setRequiredDocsError(message || 'Bad request while loading required documents.');
        else if (status === 401) setRequiredDocsError('Unauthorized. Please log in again.');
        else if (status === 403)
          setRequiredDocsError("You don't have access to required documents.");
        else if (status && status >= 500)
          setRequiredDocsError('Server error. Please try again later.');
        else setRequiredDocsError(message || 'Failed to load required documents.');
      } finally {
        setIsLoadingRequiredDocs(false);
        requiredDocsApiRef.current = false;
      }
    };
    loadRequiredDocs();
  }, [activeTab, product.id]);

  // Load Endorsement Documents when tab is active
  useEffect(() => {
    const loadEndorsementDocs = async () => {
      if (activeTab !== 'document-management') return;
      if (endorsementDocsApiRef.current) return;
      endorsementDocsApiRef.current = true;
      setIsLoadingEndorsementDocs(true);
      setEndorsementDocsError(null);
      try {
        if (!product.id) return;
        const resp = await getProductEndorsementDocuments(product.id as string);
        setEndorsementDocuments(mapRequiredDocuments(resp));
      } catch (err) {
        const status = err?.status as number | undefined;
        const message = err?.message as string | undefined;
        if (status === 400)
          setEndorsementDocsError(message || 'Bad request while loading endorsement documents.');
        else if (status === 401) setEndorsementDocsError('Unauthorized. Please log in again.');
        else if (status === 403)
          setEndorsementDocsError("You don't have access to endorsement documents.");
        else if (status && status >= 500)
          setEndorsementDocsError('Server error. Please try again later.');
        else setEndorsementDocsError(message || 'Failed to load endorsement documents.');
      } finally {
        setIsLoadingEndorsementDocs(false);
        endorsementDocsApiRef.current = false;
      }
    };
    loadEndorsementDocs();
  }, [activeTab, product.id]);

  // Load Underwriting Documents when tab is active
  useEffect(() => {
    const loadUnderwritingDocs = async () => {
      if (activeTab !== 'document-management') return;
      if (underwritingDocsApiRef.current) return;
      underwritingDocsApiRef.current = true;
      setIsLoadingUnderwritingDocs(true);
      setUnderwritingDocsError(null);
      try {
        if (!product.id) return;
        const resp = await getProductUnderwritingDocuments(product.id as string);
        setUnderwritingDocuments(mapRequiredDocuments(resp));
      } catch (err) {
        const status = err?.status as number | undefined;
        const message = err?.message as string | undefined;
        if (status === 400)
          setUnderwritingDocsError(message || 'Bad request while loading underwriting documents.');
        else if (status === 401) setUnderwritingDocsError('Unauthorized. Please log in again.');
        else if (status === 403)
          setUnderwritingDocsError("You don't have access to underwriting documents.");
        else if (status && status >= 500)
          setUnderwritingDocsError('Server error. Please try again later.');
        else setUnderwritingDocsError(message || 'Failed to load underwriting documents.');
      } finally {
        setIsLoadingUnderwritingDocs(false);
        underwritingDocsApiRef.current = false;
      }
    };
    loadUnderwritingDocs();
  }, [activeTab, product.id]);

  // Helper functions for hierarchical filtering
  const getAvailableRegions = () => {
    if (
      !insurerMetadata ||
      !quoteConfig.details.countries ||
      quoteConfig.details.countries.length === 0
    ) {
      return [];
    }
    return insurerMetadata.operating_regions.filter((region) =>
      quoteConfig.details.countries?.includes(region.country),
    );
  };

  const getAvailableZones = () => {
    if (
      !insurerMetadata ||
      !quoteConfig.details.regions ||
      quoteConfig.details.regions.length === 0
    ) {
      return [];
    }
    return insurerMetadata.operating_zones.filter((zone) =>
      quoteConfig.details.regions?.includes(zone.region),
    );
  };

  const [tplExtensions, setTplExtensions] = useState<TplExtension[]>([
    {
      id: 1,
      title: '',
      description: '',
      tplLimitValue: '',
      pricingType: 'percentage' as 'percentage' | 'fixed',
      loadingDiscount: 0,
    },
  ]);
  const [isLoadingTpl, setIsLoadingTpl] = useState(false);
  const [tplError, setTplError] = useState<string | null>(null);
  const tplApiRef = useRef(false);
  const hasLoadedTplRef = useRef(false);
  const [isSavingTpl, setIsSavingTpl] = useState(false);
  // Pricing tab local state only (API integrations removed on request)

  const saveTplExtensions = async () => {
    try {
      setIsSavingTpl(true);
      setTplError(null);
      if (!product.id) return;

      // Only send the current remaining extensions (after any removals)
      const currentExtensions = (tplExtensions || [])
        .filter(
          (ext) =>
            (ext.title && ext.title.trim().length > 0) ||
            (ext.tplLimitValue && String(ext.tplLimitValue).trim().length > 0),
        )
        .map((ext) => ({
          title: ext.title || '',
          description: ext.description || '',
          tplLimitValue: Number(ext.tplLimitValue || 0),
          pricingType: (ext.pricingType === 'fixed' ? 'Fixed' : 'Percentage') as
            | 'Fixed'
            | 'Percentage'
            | 'Flat',
          loadingDiscount: Number(ext.loadingDiscount || 0),
        }));

      console.log('🔧 Saving TPL Extensions - Current extensions count:', currentExtensions.length);
      console.log('🔧 Extensions being sent:', currentExtensions);

      const body: TplConfigDto = {
        defaultTplLimit: Number(tplLimit || 0),
        currency: productCurrency,
        extensions: currentExtensions,
      };

      await saveTplConfiguration(product.id as string, body);
      // refresh GET with shimmer
      hasLoadedTplRef.current = false;
      tplApiRef.current = false;
      setIsLoadingTpl(true);
      const data: CewConfigurationResponseDto = await getCewConfiguration(product.id as string);
      setTplLimit(String(data?.tplConfig?.defaultTplLimit || ''));
      const mapped = (data?.tplConfig?.extensions || []).map((e) => ({
        id: e.id,
        title: e.title || '',
        description: e.description || '',
        tplLimitValue: String(e.tplLimitValue || ''),
        pricingType: (String(e.pricingType || '').toLowerCase() === 'fixed'
          ? 'fixed'
          : 'percentage') as 'percentage' | 'fixed',
        loadingDiscount: Number(e.loadingDiscount || 0),
      }));
      setTplExtensions(mapped as TplExtension[]);
      hasLoadedTplRef.current = true;
      setIsLoadingTpl(false);

      console.log('✅ TPL Extensions saved and refreshed successfully');
      toast({
        title: 'TPL Extensions',
        description: `TPL extensions saved successfully!`,
      });
    } catch (err) {
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      if (status === 400) setTplError(message || 'Bad request while saving TPL data.');
      else if (status === 401) setTplError('Unauthorized. Please log in again.');
      else if (status === 403) setTplError("You don't have access to save TPL data.");
      else if (status && status >= 500) setTplError('Server error. Please try again later.');
      else setTplError(message || 'Failed to save TPL data.');
      setIsLoadingTpl(false);
    } finally {
      setIsSavingTpl(false);
    }
  };
  // Load Base Rates when Pricing → Base Rates is active
  // (removed) Base Rates API integration
  // (removed) Base Rates save handler
  // (removed) Project Risk API integration
  // Clauses data - start empty
  const [clausesData, setClausesData] = useState([]);
  const [isLoadingClauses, setIsLoadingClauses] = useState(false);
  const [isExportingClauses, setIsExportingClauses] = useState(false);
  const [isImportingClauses, setIsImportingClauses] = useState(false);
  const [clausesError, setClausesError] = useState<string | null>(null);
  const clausesApiRef = useRef(false);
  const clausesImportInputRef = useRef<HTMLInputElement>(null);

  const handleExportClauses = async () => {
    if (!product.id) return;
    setIsExportingClauses(true);
    try {
      const blob = await exportCewConfiguration(product.id as string);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${product?.name || 'product'}_clauses_exclusions_warranties.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Export successful', description: 'Clauses exported successfully.' });
    } catch (err) {
      console.error('Export error', err);
      toast({ title: 'Export failed', description: 'Failed to export clauses.', variant: 'destructive' });
    } finally {
      setIsExportingClauses(false);
    }
  };

  const handleImportClauses = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product.id) return;
    e.target.value = '';
    setIsImportingClauses(true);
    try {
      await importCewConfiguration(product.id as string, file);
      clausesApiRef.current = false;
      await refreshClausesData();
      toast({ title: 'Import successful', description: 'Clauses imported successfully.' });
    } catch (err) {
      console.error('Import error', err);
      toast({ title: 'Import failed', description: 'Failed to import clauses.', variant: 'destructive' });
    } finally {
      setIsImportingClauses(false);
    }
  };
  const [isSavingClause, setIsSavingClause] = useState(false);
  const [isSavingDeductibles, setIsSavingDeductibles] = useState(false);

  const [quoteConfig, setQuoteConfig] = useState({
    header: {
      companyName: '',
      companyAddress: '',
      contactInfo: '',
      headerColor: '#1f2937',
      headerTextColor: '#ffffff',
      logoPosition: 'left',
      logoUrl: '',
    },
    details: {
      quotePrefix: '',
      dateFormat: 'DD/MM/YYYY',
      validityPeriod: '',
      validityPeriodUnit: QUOTE_VALIDITY_PERIOD_UNIT.DAYS,
      geographicalScope: '',
      countries: [], // Array of country names
      regions: [], // Array of region names
      zones: [], // Array of zone names
      countryIds: [], // Array of country IDs
      regionIds: [], // Array of region IDs
      zoneIds: [], // Array of zone IDs
      backdateWindow: '',
      showQuoteNumber: true,
      showIssueDate: true,
      showValidity: true,
      showGeographicalScope: true,
    },
    risk: {
      showProjectDetails: true,
      showCoverageTypes: true,
      showCoverageLimits: true,
      showDeductibles: true,
      showContractorInfo: true,
      riskSectionTitle: 'Risk Details',
    },
    premium: {
      currency: productCurrency,
      premiumSectionTitle: 'Premium Breakdown',
      showBasePremium: true,
      showRiskAdjustments: true,
      showFees: true,
      showTaxes: true,
      showTotalPremium: true,
    },
    terms: {
      showWarranties: true,
      showExclusions: true,
      showDeductibleDetails: true,
      showPolicyConditions: true,
      termsSectionTitle: 'Terms & Conditions',
      additionalTerms: '',
    },
    signature: {
      showSignatureBlock: true,
      authorizedSignatory: '',
      signatoryTitle: '',
      signatureText: '',
    },
    stamp: {
      showStampBlock: true,
      stampLabel: '',
    },
    footer: {
      showFooter: true,
      showDisclaimer: true,
      showRegulatoryInfo: true,
      generalDisclaimer: '',
      regulatoryText: '',
      footerBgColor: '#f8f9fa',
      footerTextColor: '#6b7280',
    },
  });
  const [ratingConfig, setRatingConfig] = useState({
    // Base Rates by Project Type (from masters data)
    baseRates: initializeBaseRates(),
    // Quote decision for each project type
    projectTypeQuoteOptions: (() => {
      const options: Record<string, string> = {};
      activeProjectTypes.forEach((type) => {
        options[type.value] = 'quote'; // default to 'quote'
      });
      return options;
    })(),
    // Sub project entries with individual pricing
    subProjectEntries: initializeSubProjectEntries(),
    // Project Risk Factors
    projectRisk: {
      projectTypeMultipliers: {
        residential: 0,
        commercial: 0,
        infrastructure: 0,
      },
      durationLoadings: [
        {
          id: 1,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          value: 0,
          quoteOption: 'quote',
        },
      ],
      maintenancePeriodLoadings: [
        {
          id: 1,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          value: 0,
          quoteOption: 'quote',
        },
      ],
      locationHazardLoadings: {
        low: 0,
        moderate: 0,
        high: 0,
        veryHigh: 0,
      },
    },
    // Contractor Risk Factors
    contractorRisk: {
      experienceDiscounts: [
        {
          id: 1,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
      subcontractorLoadings: {
        none: 0,
        limited: 0,
        moderate: 0,
        heavy: 0,
      },
      contractorNumbers: [
        {
          id: 1,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
      subcontractorNumbers: [
        {
          id: 1,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
      claimFrequency: [
        {
          id: 1,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
      claimAmountCategories: [
        {
          id: 1,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
    },
    // Cover Requirements (based on proposal form fields)
    coverRequirements: {
      sumInsured: [
        {
          id: 1,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
      projectValue: [
        {
          id: 2,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
      contractWorks: [
        {
          id: 3,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
      plantEquipment: [
        {
          id: 4,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
      temporaryWorks: [
        {
          id: 5,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
      otherMaterials: [
        {
          id: 6,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
      principalExistingProperty: [
        {
          id: 7,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
      tplLimit: [
        {
          id: 8,
          from: 0,
          to: 0,
          pricingType: 'percentage',
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
      subLimits: [
        {
          id: 9,
          title: '',
          description: '',
          pricingType: 'percentage-sum-insured',
          value: 0,
        },
      ],
      deductibles: [
        {
          id: 10,
          deductibleType: 'fixed',
          value: 0,
          loadingDiscount: 0,
          quoteOption: 'quote',
        },
      ],
      crossLiabilityCover: {
        yes: 0,
        no: 0,
      },
    },
    // Policy Limits
    limits: {
      minimumPremium: 0,
      maximumCover: 0,
      baseBrokerCommission: 0,
      minimumBrokerCommission: 0,
      maximumBrokerCommission: 0,
    },
    // Clauses Pricing - now derived from configured CEWs
    clausesPricing: clausesData.map((clause, index) => ({
      id: index + 1,
      code: clause.code,
      name: clause.title,
      enabled: clause.show === 'Mandatory' ? true : false, // Mandatory always enabled
      isMandatory: clause.show === 'Mandatory',
      pricingType: (clause.type === 'Clause' ? 'percentage' : 'amount') as 'percentage' | 'amount',
      pricingValue: clause.type === 'Clause' ? 2.5 : 500, // Default values for demo
      variableOptions: [
        {
          id: 1,
          label: clause.show === 'Mandatory' ? 'Standard Rate' : 'Base Option',
          limits: clause.show === 'Mandatory' ? 'All Coverage' : 'Standard Coverage',
          type: (clause.type === 'Clause' ? 'percentage' : 'amount') as 'percentage' | 'amount',
          value:
            clause.show === 'Mandatory'
              ? clause.type === 'Clause'
                ? 2.5
                : 500 // Default values for demo
              : clause.type === 'Clause'
                ? 1.5
                : 300, // Default values for demo
        },
      ],
    })),
    // Fee Types
    feeTypes: [
      {
        id: 1,
        label: 'VAT',
        pricingType: 'percentage',
        value: 0,
        active: true,
      },
    ],
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setWordingUploadFile(file);
    if (file) {
      toast({
        title: 'File Selected',
        description: 'The file will be uploaded when you save.',
        variant: 'default',
      });
    }
  };

  const openUploadDialog = () => {
    setEditingWording(null);
    setWordingUploadTitle('');
    setWordingUploadFile(null);
    setWordingUploadActive(true);
    setIsWordingUploadDialogOpen(true);
  };

  const openEditDialog = (wording: any) => {
    setEditingWording(wording);
    setWordingUploadTitle(wording.label || wording.name || '');
    setWordingUploadActive(wording.is_active === true);

    // If there's an existing file, create a mock File object to display it
    if (wording.originalFilename || wording.original_filename) {
      const filename = wording.originalFilename || wording.original_filename;
      const fileId = wording.templateFile || wording.template_file;
      const size = wording.fileSize || wording.file_size || wording.size || 0;

      // Create a mock File object with the existing file information
      const mockFile = new File([], filename, { type: 'application/pdf' });

      // Add custom properties to track the uploaded file
      Object.defineProperty(mockFile, 'uploadedUrl', {
        value: fileId,
        writable: true,
      });

      // Override size property (normally read-only on File objects)
      Object.defineProperty(mockFile, 'size', {
        value: size,
        writable: true,
      });

      // Also add fileSize property as fallback/custom property
      Object.defineProperty(mockFile, 'fileSize', {
        value: size,
        writable: true,
      });

      setWordingUploadFile(mockFile);
    } else {
      setWordingUploadFile(null);
    }

    setIsWordingUploadDialogOpen(true);
  };

  const handleToggleWordingActive = async (
    wording: PolicyWordingItem,
    isActive: boolean,
  ): Promise<void> => {
    if (!product.id) return;

    try {
      console.log('Toggling wording active state:', {
        wording: wording.label,
        isActive,
      });

      if (!wording.id) {
        throw new Error('Missing document type ID');
      }
      await updateWordingDocumentType(product.id as string, wording.id, {
        isActive,
      });
      const list = await getWordingDocumentTypes(product.id as string);
      const mapped = (list || []).map((d) => ({
        id: String(d.id),
        label: d.displayLabel,
        url: '',
        is_active: !!d.isActive,
        originalFilename: d.originalFilename,
        templateFile: d.templateFile,
      })) as PolicyWordingItem[];
      setPolicyWordings(mapped);

      toast({
        title: 'Success',
        description: `Policy wording ${isActive ? 'activated' : 'deactivated'} successfully!`,
        variant: 'default',
      });
    } catch (err) {
      console.error('Error toggling wording active state:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      let errorMessage = 'Failed to update policy wording status.';
      if (status === 400) errorMessage = 'Bad request. Please check the data.';
      else if (status === 401) errorMessage = 'Unauthorized. Please log in again.';
      else if (status === 403) errorMessage = 'Forbidden. You do not have permission.';
      else if (status && status >= 500) errorMessage = 'Server error. Please try again later.';
      else if (message) errorMessage = message;

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleSavePolicyWording = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    if (!product.id) {
      toast({
        title: 'Error',
        description: 'Missing product ID. Please reload the page and try again.',
        variant: 'destructive',
      });
      console.error('Missing product.id:', {
        insurerId,
        productId: product.id,
      });
      return;
    }

    try {
      setIsUploadingWording(true);
      console.log('Saving policy wording:', {
        insurerId,
        productId: product.id,
        title: wordingUploadTitle,
        isActive: wordingUploadActive,
        hasFile: !!wordingUploadFile,
        editing: !!editingWording,
      });

      if (editingWording?.id) {
        await updateWordingDocumentType(
          product.id as string,
          editingWording.id,
          {
            displayLabel: wordingUploadTitle,
            isActive: !!wordingUploadActive,
          },
          wordingUploadFile ?? undefined,
        );
        toast({
          title: 'Updated',
          description: 'Policy wording updated successfully!',
          variant: 'default',
        });
      } else {
        if (!wordingUploadFile) {
          toast({
            title: 'Error',
            description: 'Please select a file to upload.',
            variant: 'destructive',
          });
          return;
        }
        await addWordingDocumentType(
          product.id as string,
          {
            displayLabel: wordingUploadTitle,
            description: '',
            isRequired: false,
            isActive: !!wordingUploadActive,
          },
          wordingUploadFile,
        );
        toast({
          title: 'Success',
          description: 'Policy wording saved successfully!',
          variant: 'default',
        });
      }
      const list = await getWordingDocumentTypes(product.id as string);
      const mapped = (list || []).map((d) => ({
        id: String(d.id),
        label: d.displayLabel,
        url: '',
        is_active: !!d.isActive,
        originalFilename: d.originalFilename,
        templateFile: d.templateFile,
        fileSize: d.fileSize,
      })) as PolicyWordingItem[];
      setPolicyWordings(mapped);
      setIsWordingUploadDialogOpen(false);
      setEditingWording(null);
      setWordingUploadTitle('');
      setWordingUploadFile(null);
      setWordingUploadActive(true);
    } finally {
      setIsUploadingWording(false);
    }
  };

  const handleDeleteWording = (wording: PolicyWordingItem) => {
    if (!product.id || !wording.id) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Policy Wording',
      description: `Are you sure you want to delete "${wording.label}"? This action cannot be undone.`,
      action: () => {
        (async () => {
          try {
            await deleteWordingDocumentType(product.id as string, wording.id as string);
            const list = await getWordingDocumentTypes(product.id as string);
            const mapped = (list || []).map((d) => ({
              id: String(d.id),
              label: d.displayLabel,
              url: '',
              is_active: !!d.isActive,
              originalFilename: d.originalFilename,
              templateFile: d.templateFile,
              fileSize: d.fileSize,
            })) as PolicyWordingItem[];
            setPolicyWordings(mapped);
            toast({
              title: 'Deleted',
              description: 'Policy wording deleted.',
            });
          } catch (err) {
            const message = err?.message as string | undefined;
            toast({
              title: 'Error',
              description: message || 'Failed to delete policy wording.',
              variant: 'destructive',
            });
          } finally {
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          }
        })();
      },
    });
  };

  const handleViewWording = async (wording: PolicyWordingItem) => {
    if (!product.id || !wording.id) return;
    try {
      const { signedUrl } = await getWordingTemplateSignedUrl(
        product.id as string,
        wording.id as string,
      );
      window.open(signedUrl, '_blank');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to open document preview.',
        variant: 'destructive',
      });
    }
  };

  // Base Rates save handler
  const handleSaveBaseRates = async () => {
    const insurerId = getInsurerCompanyId();
    const pid = product?.id || '1';
    if (!insurerId || !pid) return;

    setIsSavingBaseRates(true);
    try {
      setBaseRatesMastersError(null);
      const byProject = new Map<
        string,
        {
          projectLabel: string;
          items: {
            name: string;
            pricing_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
            base_rate: number;
            currency: '%' | string;
            quote_option: 'AUTO_QUOTE' | 'NO_QUOTE' | 'QUOTE_AND_REFER';
          }[];
        }
      >();
      const labelBySlug = new Map<string, string>();
      (projectTypesMasters || []).forEach((p) =>
        labelBySlug.set(p.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), p.label),
      );
      ratingConfig.subProjectEntries.forEach((e) => {
        const slug = e.projectType;
        const projectLabel = labelBySlug.get(slug) || slug;
        if (!byProject.has(slug)) byProject.set(slug, { projectLabel, items: [] });
        const pricing_type =
          String(e.pricingType).toLowerCase() === 'fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE';
        const currency = pricing_type === 'FIXED_AMOUNT' ? productCurrency : '%';
        const quote_option =
          String(e.quoteOption).toLowerCase() === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE';
        byProject.get(slug)!.items.push({
          name: e.subProjectType,
          pricing_type,
          base_rate: Number(e.baseRate || 0),
          currency,
          quote_option,
        });
      });
      const body = {
        base_rates: Array.from(byProject.values()).map((group) => ({
          project_type: group.projectLabel,
          sub_projects: group.items,
        })),
      };
      const hasExisting = Boolean(
        projectTypesMasters &&
        subProjectTypesMasters &&
        ratingConfig.subProjectEntries.some((e) => Number(e.baseRate) !== 0),
      );
      const resp = hasExisting
        ? await updateBaseRates(insurerId, String(pid), body)
        : await saveBaseRates(insurerId, String(pid), body);
      toast({
        title: 'Saved',
        description: resp?.message || 'Base rates saved.',
      });
    } catch (err) {
      const status = err?.status;
      const msg =
        status === 400
          ? 'Invalid data while saving base rates.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while saving base rates.'
                : err?.message || 'Failed to save base rates.';
      setBaseRatesMastersError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsSavingBaseRates(false);
    }
  };

  // Coverage Options fetch handler
  const fetchCoverageOptions = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const pid = product?.id || '1';

    if (!insurerId || !pid) {
      setCoverageOptionsError('Unable to determine insurer ID or product ID.');
      return;
    }

    setIsLoadingCoverageOptions(true);
    setCoverageOptionsError(null);

    try {
      const data = await getCoverageOptions(insurerId, String(pid));
      setCoverageOptionsData(data);
    } catch (err) {
      console.error('Coverage Options fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      // 404 means no configuration yet for this product - this is OK for new products
      if (status === 404) {
        console.log(
          '[CoverageOptions] No existing configuration found (404) - starting with empty data',
        );
        // Don't set error for 404 - this is expected for new products
      } else if (status === 400) {
        setCoverageOptionsError(message || 'Bad request while loading coverage options.');
      } else if (status === 401) {
        setCoverageOptionsError('Unauthorized. Please log in again.');
      } else if (status === 403) {
        setCoverageOptionsError("You don't have access to coverage options.");
      } else if (status && status >= 500) {
        setCoverageOptionsError('Server error while loading coverage options.');
      } else {
        setCoverageOptionsError(message || 'Failed to load coverage options.');
      }
    } finally {
      setIsLoadingCoverageOptions(false);
    }
  };

  // Policy Limits fetch handler
  const fetchPolicyLimits = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      setPolicyLimitsError('Unable to determine insurer ID or product ID.');
      return;
    }

    setIsLoadingPolicyLimits(true);
    setPolicyLimitsError(null);

    try {
      const data = await getPolicyLimits(insurerId, String(productId));
      setPolicyLimitsData(data);
      console.log('✅ Policy Limits data loaded:', data);
    } catch (err) {
      console.error('Policy Limits fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      // 404 means no configuration yet for this product - this is OK for new products
      if (status === 404) {
        console.log(
          '[PolicyLimits] No existing configuration found (404) - starting with empty data',
        );
        // Don't set error for 404 - this is expected for new products
      } else if (status === 400) {
        setPolicyLimitsError(message || 'Bad request while loading policy limits.');
      } else if (status === 401) {
        setPolicyLimitsError('Unauthorized. Please log in again.');
      } else if (status === 403) {
        setPolicyLimitsError("You don't have access to policy limits.");
      } else if (status && status >= 500) {
        setPolicyLimitsError('Server error while loading policy limits.');
      } else {
        setPolicyLimitsError(message || 'Failed to load policy limits.');
      }
    } finally {
      setIsLoadingPolicyLimits(false);
    }
  };

  // Clause Metadata fetch handler
  const fetchClauseMetadata = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      setClauseMetadataError('Unable to determine insurer ID or product ID.');
      return;
    }

    // Prevent duplicate calls if already loading
    if (isLoadingClauseMetadata) {
      console.log('⚠️ Clause metadata fetch already in progress, skipping duplicate call');
      return;
    }

    console.log('🚀 Starting clause metadata fetch...');
    setIsLoadingClauseMetadata(true);
    setClauseMetadataError(null);

    try {
      const data = await getCewsClauses(insurerId, String(productId));
      setClauseMetadata(data.clauses || []);

      // Initialize clausesPricing with default values from metadata
      const defaultClausesPricing = (data.clauses || []).map((clause, index: number) => ({
        id: index + 1,
        code: clause.clause_code,
        name: clause.title,
        enabled: clause.show_type === 'MANDATORY',
        isMandatory: clause.show_type === 'MANDATORY',
        pricingType: (clause.clause_type === 'CLAUSE' ? 'percentage' : 'amount') as
          | 'percentage'
          | 'amount',
        pricingValue: 0, // Default to 0, will be updated from API if available
        variableOptions: [
          {
            id: 1,
            label: 'Standard Rate',
            limits: 'All Coverage',
            type: (clause.clause_type === 'CLAUSE' ? 'percentage' : 'amount') as
              | 'percentage'
              | 'amount',
            value: 2,
          },
        ],
      }));

      setRatingConfig((prev) => ({
        ...prev,
        clausesPricing: defaultClausesPricing,
      }));

      // If we already have pricing data, merge it with the fresh metadata
      if (
        clausePricingData &&
        clausePricingData.clause_pricing &&
        clausePricingData.clause_pricing.length > 0
      ) {
        // Pass the fresh metadata directly instead of relying on state
        setTimeout(
          () => updateClausePricingFromAPIData(clausePricingData.clause_pricing, data.clauses),
          100,
        );
      }

      console.log('✅ Clause metadata loaded:', data);
    } catch (err) {
      console.error('Clause metadata fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      // 404 means no configuration yet for this product - this is OK for new products
      if (status === 404) {
        console.log(
          '[ClauseMetadata] No existing configuration found (404) - starting with empty data',
        );
        // Don't set error for 404 - this is expected for new products
      } else if (status === 400) {
        setClauseMetadataError(message || 'Bad request while loading clause metadata.');
      } else if (status === 401) {
        setClauseMetadataError('Unauthorized access to clause metadata.');
      } else if (status === 403) {
        setClauseMetadataError('Forbidden access to clause metadata.');
      } else if (status === 500) {
        setClauseMetadataError('Server error while loading clause metadata.');
      } else {
        setClauseMetadataError(message || 'Failed to load clause metadata.');
      }
    } finally {
      setIsLoadingClauseMetadata(false);
    }
  };

  // Clause Pricing fetch handler
  const fetchClausePricing = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      setClausePricingError('Unable to determine insurer ID or product ID.');
      return;
    }

    // Prevent duplicate calls if already loading
    if (isLoadingClausePricing) {
      console.log('⚠️ Clause pricing fetch already in progress, skipping duplicate call');
      return;
    }

    console.log('🚀 Starting clause pricing fetch...');
    setIsLoadingClausePricing(true);
    setClausePricingError(null);

    try {
      const data = await getClausePricing(insurerId, String(productId));
      console.log('📊 Raw clause pricing response:', data);

      // Store the raw API response data for POST/PATCH decision making
      setClausePricingData({ clause_pricing: data.clauses || [] });

      // Update ratingConfig.clausesPricing with the pricing data if we have both metadata and pricing
      if (clauseMetadata.length > 0 && data.clauses && data.clauses.length > 0) {
        // Pass clauseMetadata explicitly to ensure we use the correct data
        updateClausePricingFromAPIData(data.clauses, clauseMetadata);
      }

      console.log('✅ Clause pricing data loaded:', data);
    } catch (err) {
      console.error('Clause pricing fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      // 404 means no configuration yet for this product - this is OK for new products
      if (status === 404) {
        console.log(
          '[ClausePricing] No existing configuration found (404) - starting with empty data',
        );
        // Don't set error for 404 - this is expected for new products
        setClausePricingData({ clause_pricing: [] });
      } else if (status === 400) {
        setClausePricingError(message || 'Bad request while loading clause pricing.');
      } else if (status === 401) {
        setClausePricingError('Unauthorized access to clause pricing.');
      } else if (status === 403) {
        setClausePricingError('Forbidden access to clause pricing.');
      } else if (status === 500) {
        setClausePricingError('Server error while loading clause pricing.');
      } else {
        setClausePricingError(message || 'Failed to load clause pricing.');
      }
    } finally {
      setIsLoadingClausePricing(false);
    }
  };

  // Function to update clause pricing from API response data
  const updateClausePricingFromAPIData = (pricingData, metadata = clauseMetadata) => {
    console.log('🔄 Updating clause pricing from API data:', pricingData);
    console.log('🔄 Using clauseMetadata:', metadata);

    // Safety check: if metadata is empty, skip update
    if (!metadata || metadata.length === 0) {
      console.warn('⚠️ Clause metadata is empty, skipping pricing update');
      return;
    }

    setRatingConfig((prev) => ({
      ...prev,
      clausesPricing: metadata.map((clause, index) => {
        // Find matching pricing data for this clause
        const pricingItem = pricingData.find((p) => p.clause_code === clause.clause_code);

        if (pricingItem && pricingItem.pricing) {
          const pricing = pricingItem.pricing;
          return {
            id: index + 1,
            code: clause.clause_code,
            name: clause.title,
            enabled: Boolean(pricing.is_enabled),
            isMandatory: clause.show_type === 'MANDATORY', // Use show_type from clause metadata, not pricing
            pricingType: (pricing.pricing_type === 'PERCENTAGE' ? 'percentage' : 'amount') as
              | 'percentage'
              | 'amount',
            pricingValue: pricing.pricing_value || 0,
            variableOptions: pricing.options.map((option, optIndex: number) => ({
              id: optIndex + 1,
              label: option.label,
              limits: option.limit,
              type: (option.type === 'PERCENTAGE' ? 'percentage' : 'amount') as
                | 'percentage'
                | 'amount',
              value: option.value,
            })),
          };
        } else {
          // Use default values if no pricing data found
          return {
            id: index + 1,
            code: clause.clause_code,
            name: clause.title,
            enabled: clause.show_type === 'MANDATORY',
            isMandatory: clause.show_type === 'MANDATORY',
            pricingType: (clause.clause_type === 'CLAUSE' ? 'percentage' : 'amount') as
              | 'percentage'
              | 'amount',
            pricingValue: clause.clause_type === 'CLAUSE' ? 2.5 : 500,
            variableOptions: [
              {
                id: 1,
                label: clause.show_type === 'MANDATORY' ? 'Standard Rate' : 'Base Option',
                limits: clause.show_type === 'MANDATORY' ? 'All Coverage' : 'Standard Coverage',
                type: (clause.clause_type === 'CLAUSE' ? 'percentage' : 'amount') as
                  | 'percentage'
                  | 'amount',
                value:
                  clause.show_type === 'MANDATORY'
                    ? clause.clause_type === 'CLAUSE'
                      ? 2.5
                      : 500
                    : clause.clause_type === 'CLAUSE'
                      ? 1.5
                      : 300,
              },
            ],
          };
        }
      }),
    }));

    console.log('✅ Clause pricing updated in ratingConfig');
  };

  // Master Data fetch handlers
  const fetchConstructionTypes = async (): Promise<void> => {
    setIsLoadingConstructionTypes(true);
    setConstructionTypesError(null);

    try {
      const data = await listMasterConstructionTypes();
      setConstructionTypesData(data);
      console.log('✅ Construction Types data loaded:', data);
    } catch (err) {
      console.error('Construction Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      if (status === 400) {
        setConstructionTypesError(message || 'Bad request while loading construction types.');
      } else if (status === 401) {
        setConstructionTypesError('Unauthorized access to construction types.');
      } else if (status === 403) {
        setConstructionTypesError('Forbidden access to construction types.');
      } else if (status === 500) {
        setConstructionTypesError('Server error while loading construction types.');
      } else {
        setConstructionTypesError(message || 'Failed to load construction types.');
      }
    } finally {
      setIsLoadingConstructionTypes(false);
    }
  };

  const fetchRoleTypes = async (): Promise<void> => {
    setIsLoadingRoleTypes(true);
    setRoleTypesError(null);

    try {
      const data = await listMasterRoleTypes();
      setRoleTypesData(data);
      console.log('✅ Role Types data loaded:', data);
    } catch (err) {
      console.error('Role Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      if (status === 400) {
        setRoleTypesError(message || 'Bad request while loading role types.');
      } else if (status === 401) {
        setRoleTypesError('Unauthorized access to role types.');
      } else if (status === 403) {
        setRoleTypesError('Forbidden access to role types.');
      } else if (status === 500) {
        setRoleTypesError('Server error while loading role types.');
      } else {
        setRoleTypesError(message || 'Failed to load role types.');
      }
    } finally {
      setIsLoadingRoleTypes(false);
    }
  };

  const fetchContractTypes = async (): Promise<void> => {
    setIsLoadingContractTypes(true);
    setContractTypesError(null);

    try {
      const data = await listMasterContractTypes();
      setContractTypesData(data);
      console.log('✅ Contract Types data loaded:', data);
    } catch (err) {
      console.error('Contract Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      if (status === 400) {
        setContractTypesError(message || 'Bad request while loading contract types.');
      } else if (status === 401) {
        setContractTypesError('Unauthorized access to contract types.');
      } else if (status === 403) {
        setContractTypesError('Forbidden access to contract types.');
      } else if (status === 500) {
        setContractTypesError('Server error while loading contract types.');
      } else {
        setContractTypesError(message || 'Failed to load contract types.');
      }
    } finally {
      setIsLoadingContractTypes(false);
    }
  };

  const fetchSoilTypes = async (): Promise<void> => {
    setIsLoadingSoilTypes(true);
    setSoilTypesError(null);

    try {
      const data = await listMasterSoilTypes();
      setSoilTypesData(data);
      console.log('✅ Soil Types data loaded:', data);
    } catch (err) {
      console.error('Soil Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      if (status === 400) {
        setSoilTypesError(message || 'Bad request while loading soil types.');
      } else if (status === 401) {
        setSoilTypesError('Unauthorized access to soil types.');
      } else if (status === 403) {
        setSoilTypesError('Forbidden access to soil types.');
      } else if (status === 500) {
        setSoilTypesError('Server error while loading soil types.');
      } else {
        setSoilTypesError(message || 'Failed to load soil types.');
      }
    } finally {
      setIsLoadingSoilTypes(false);
    }
  };

  const fetchSubcontractorTypes = async (): Promise<void> => {
    setIsLoadingSubcontractorTypes(true);
    setSubcontractorTypesError(null);

    try {
      const data = await listMasterSubcontractorTypes();
      setSubcontractorTypesData(data);
      console.log('✅ Subcontractor Types data loaded:', data);
    } catch (err) {
      console.error('Subcontractor Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      if (status === 400) {
        setSubcontractorTypesError(message || 'Bad request while loading subcontractor types.');
      } else if (status === 401) {
        setSubcontractorTypesError('Unauthorized access to subcontractor types.');
      } else if (status === 403) {
        setSubcontractorTypesError('Forbidden access to subcontractor types.');
      } else if (status === 500) {
        setSubcontractorTypesError('Server error while loading subcontractor types.');
      } else {
        setSubcontractorTypesError(message || 'Failed to load subcontractor types.');
      }
    } finally {
      setIsLoadingSubcontractorTypes(false);
    }
  };

  const fetchConsultantRoles = async (): Promise<void> => {
    setIsLoadingConsultantRoles(true);
    setConsultantRolesError(null);

    try {
      const data = await listMasterConsultantRoles();
      setConsultantRolesData(data);
      console.log('✅ Consultant Roles data loaded:', data);
    } catch (err) {
      console.error('Consultant Roles fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      if (status === 400) {
        setConsultantRolesError(message || 'Bad request while loading consultant roles.');
      } else if (status === 401) {
        setConsultantRolesError('Unauthorized access to consultant roles.');
      } else if (status === 403) {
        setConsultantRolesError('Forbidden access to consultant roles.');
      } else if (status === 500) {
        setConsultantRolesError('Server error while loading consultant roles.');
      } else {
        setConsultantRolesError(message || 'Failed to load consultant roles.');
      }
    } finally {
      setIsLoadingConsultantRoles(false);
    }
  };

  const fetchSecurityTypes = async (): Promise<void> => {
    setIsLoadingSecurityTypes(true);
    setSecurityTypesError(null);

    try {
      const data = await listMasterSecurityTypes();
      setSecurityTypesData(data);
      console.log('✅ Security Types data loaded:', data);
    } catch (err) {
      console.error('Security Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      if (status === 400) {
        setSecurityTypesError(message || 'Bad request while loading security types.');
      } else if (status === 401) {
        setSecurityTypesError('Unauthorized access to security types.');
      } else if (status === 403) {
        setSecurityTypesError('Forbidden access to security types.');
      } else if (status === 500) {
        setSecurityTypesError('Server error while loading security types.');
      } else {
        setSecurityTypesError(message || 'Failed to load security types.');
      }
    } finally {
      setIsLoadingSecurityTypes(false);
    }
  };

  const fetchAreaTypes = async (): Promise<void> => {
    setIsLoadingAreaTypes(true);
    setAreaTypesError(null);

    try {
      const data = await listMasterAreaTypes();
      setAreaTypesData(data);
      console.log('✅ Area Types data loaded:', data);
    } catch (err) {
      console.error('Area Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      if (status === 400) {
        setAreaTypesError(message || 'Bad request while loading area types.');
      } else if (status === 401) {
        setAreaTypesError('Unauthorized access to area types.');
      } else if (status === 403) {
        setAreaTypesError('Forbidden access to area types.');
      } else if (status === 500) {
        setAreaTypesError('Server error while loading area types.');
      } else {
        setAreaTypesError(message || 'Failed to load area types.');
      }
    } finally {
      setIsLoadingAreaTypes(false);
    }
  };

  // Quote Config Location Data fetch handlers
  // const fetchCountries = async (): Promise<void> => {
  //   const insurerId = getInsurerCompanyId();
  //   const productId = product?.id;

  //   if (!insurerId || !productId) {
  //     setCountriesError('Unable to determine insurer ID or product ID.');
  //     return;
  //   }

  //   setIsLoadingCountries(true);
  //   setCountriesError(null);

  //   try {
  //     const data = await getQuoteConfigForUI(insurerId, String(productId));
  //     setCountriesData(data.operating_countries || []);
  //     console.log('✅ Countries data loaded:', data.operating_countries);
  //   } catch (err) {
  //     console.error('Countries fetch error:', err);
  //     const status = err?.status as number | undefined;
  //     const message = err?.message as string | undefined;

  //     if (status === 400) {
  //       setCountriesError(message || 'Bad request while loading countries.');
  //     } else if (status === 401) {
  //       setCountriesError('Unauthorized access to countries.');
  //     } else if (status === 403) {
  //       setCountriesError('Forbidden access to countries.');
  //     } else if (status === 500) {
  //       setCountriesError('Server error while loading countries.');
  //     } else {
  //       setCountriesError(message || 'Failed to load countries.');
  //     }
  //   } finally {
  //     setIsLoadingCountries(false);
  //   }
  // };

  // const fetchRegions = async (): Promise<void> => {
  //   const insurerId = getInsurerCompanyId();
  //   const productId = product?.id;

  //   if (!insurerId || !productId) {
  //     setRegionsError('Unable to determine insurer ID or product ID.');
  //     return;
  //   }

  //   setIsLoadingRegions(true);
  //   setRegionsError(null);

  //   try {
  //     const data = await getQuoteConfigForUI(insurerId, String(productId));
  //     setRegionsData(data.operating_regions || []);
  //     console.log('✅ Regions data loaded:', data.operating_regions);
  //   } catch (err) {
  //     console.error('Regions fetch error:', err);
  //     const status = err?.status as number | undefined;
  //     const message = err?.message as string | undefined;

  //     if (status === 400) {
  //       setRegionsError(message || 'Bad request while loading regions.');
  //     } else if (status === 401) {
  //       setRegionsError('Unauthorized access to regions.');
  //     } else if (status === 403) {
  //       setRegionsError('Forbidden access to regions.');
  //     } else if (status === 500) {
  //       setRegionsError('Server error while loading regions.');
  //     } else {
  //       setRegionsError(message || 'Failed to load regions.');
  //     }
  //   } finally {
  //     setIsLoadingRegions(false);
  //   }
  // };

  // const fetchZones = async (): Promise<void> => {
  //   const insurerId = getInsurerCompanyId();
  //   const productId = product?.id;

  //   if (!insurerId || !productId) {
  //     setZonesError('Unable to determine insurer ID or product ID.');
  //     return;
  //   }

  //   setIsLoadingZones(true);
  //   setZonesError(null);

  //   try {
  //     const data = await getQuoteConfigForUI(insurerId, String(productId));
  //     setZonesData(data.operating_zones || []);
  //     console.log('✅ Zones data loaded:', data.operating_zones);
  //   } catch (err) {
  //     console.error('Zones fetch error:', err);
  //     const status = err?.status as number | undefined;
  //     const message = err?.message as string | undefined;

  //     if (status === 400) {
  //       setZonesError(message || 'Bad request while loading zones.');
  //     } else if (status === 401) {
  //       setZonesError('Unauthorized access to zones.');
  //     } else if (status === 403) {
  //       setZonesError('Forbidden access to zones.');
  //     } else if (status === 500) {
  //       setZonesError('Server error while loading zones.');
  //     } else {
  //       setZonesError(message || 'Failed to load zones.');
  //     }
  //   } finally {
  //     setIsLoadingZones(false);
  //   }
  // };

  // Save Clause Pricing handler with POST/PATCH logic
  const handleSaveClausePricing = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      toast({
        title: 'Error',
        description: 'Missing insurer ID or product ID',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingClausePricing(true);

    try {
      // Collect clause pricing data from loaded clause metadata and transform to new structure
      console.log('🔍 Debug - clauseMetadata:', clauseMetadata);
      console.log('🔍 Debug - ratingConfig.clausesPricing:', ratingConfig.clausesPricing);

      // Transform clause metadata and pricing data to new API structure
      const clauses = clauseMetadata.map((clause, index) => {
        // Find pricing data for this clause
        const pricingData = ratingConfig.clausesPricing?.find((p) => p.code === clause.clause_code);

        // Determine if clause should be enabled
        // Priority: 1) pricingData.enabled if exists, 2) Mandatory clauses are enabled by default
        const isEnabled = pricingData
          ? Boolean(pricingData.enabled)
          : clause.show_type === 'MANDATORY';

        console.log(
          `🔍 Clause ${clause.clause_code}: pricingData?.enabled =`,
          pricingData?.enabled,
          'isEnabled =',
          isEnabled,
          'show_type =',
          clause.show_type,
        );

        return {
          clause_code: clause.clause_code,
          title: clause.title,
          clause_type: clause.clause_type as 'CLAUSE' | 'WARRANTY' | 'EXCLUSION',
          show_type: clause.show_type as 'MANDATORY' | 'OPTIONAL',
          display_order: clause.display_order || (index + 1) * 10,
          is_active: isEnabled,
          pricing: {
            is_enabled: isEnabled,
            pricing_type: (pricingData?.pricingType === 'percentage'
              ? 'PERCENTAGE'
              : 'CURRENCY') as 'PERCENTAGE' | 'CURRENCY',
            pricing_value: pricingData?.pricingValue ?? 0,
            base_currency: productCurrency,
            options: pricingData?.variableOptions?.map((option, optIndex: number) => ({
              label: option.label || 'Standard Rate',
              limit: option.limits || 'All Coverage',
              type: (option.type === 'percentage' ? 'PERCENTAGE' : 'CURRENCY') as
                | 'PERCENTAGE'
                | 'CURRENCY',
              value: option.value || 2,
              display_order: optIndex + 1,
            })) || [
                {
                  label: 'Standard Rate',
                  limit: 'All Coverage',
                  type: 'PERCENTAGE' as const,
                  value: 2,
                  display_order: 1,
                },
              ],
          },
        };
      });

      // Check if we have any clause data to save
      if (clauses.length === 0) {
        toast({
          title: 'No Clause Data',
          description: 'No clause data available to save. Please ensure clause metadata is loaded.',
          variant: 'destructive',
        });
        return;
      }

      const clausePricingPayload: SaveClausePricingRequest = {
        clauses: clauses,
      };

      console.log('📝 Clause pricing payload:', JSON.stringify(clausePricingPayload, null, 2));

      // Always use POST API as per new requirements
      console.log('📝 Saving clause pricing data...');
      const response = await saveClausePricing(insurerId, String(productId), clausePricingPayload);

      console.log('✅ Clause pricing saved successfully:', response);

      // Update local state with response
      if (response.clauses) {
        setClausePricingData({ clause_pricing: response.clauses });

        // Update ratingConfig with the new pricing data
        const updatedPricingData = response.clauses.map((clause: any) => ({
          id: parseInt(clause.clause_code.replace(/\D/g, '')) || 1,
          code: clause.clause_code,
          name: clause.title,
          enabled: Boolean(clause.pricing.is_enabled),
          isMandatory: Boolean(clause.pricing.is_enabled),
          pricingType: (clause.pricing.pricing_type === 'PERCENTAGE' ? 'percentage' : 'amount') as
            | 'percentage'
            | 'amount',
          pricingValue: Number(clause.pricing.pricing_value) || 0,
          variableOptions: clause.pricing.options.map((option, index: number) => ({
            id: index + 1,
            label: String(option.label),
            limits: String(option.limit),
            type: (option.type === 'PERCENTAGE' ? 'percentage' : 'amount') as
              | 'percentage'
              | 'amount',
            value: Number(option.value) || 0,
          })),
        }));

        setRatingConfig((prev) => ({
          ...prev,
          clausesPricing: updatedPricingData,
        }));
      }

      toast({
        title: 'Success',
        description: response.message || 'Clause pricing configuration saved successfully',
      });
    } catch (err) {
      console.error('Save Clause Pricing error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;

      if (status === 400) {
        toast({
          title: 'Bad Request',
          description: message || 'Invalid clause pricing data provided',
          variant: 'destructive',
        });
      } else if (status === 401) {
        toast({
          title: 'Unauthorized',
          description: 'You are not authorized to save clause pricing',
          variant: 'destructive',
        });
      } else if (status === 403) {
        toast({
          title: 'Forbidden',
          description: 'You do not have permission to save clause pricing',
          variant: 'destructive',
        });
      } else if (status === 500) {
        toast({
          title: 'Server Error',
          description: 'Server error while saving clause pricing. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: message || 'Failed to save clause pricing configuration',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSavingClausePricing(false);
    }
  };

  // Save Policy Limits handler with POST/PATCH logic
  const handleSavePolicyLimits = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      toast({
        title: 'Error',
        description: 'Missing insurer ID or product ID',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingPolicyLimits(true);

    try {
      // Check if we already have data from the GET API call
      const hasExistingData = policyLimitsData !== null;

      if (hasExistingData) {
        console.log('📝 Existing policy limits data found, using PATCH API');

        // Collect data from UI for PATCH (matches exact specification format)
        const updateData: UpdatePolicyLimitsRequest = {
          policy_limits_and_deductible: {
            policy_limits: {
              minimum_premium: {
                pricing_type: 'FIXED_AMOUNT',
                value: ratingConfig.limits?.minimumPremium || 0,
              },
              maximum_cover: {
                pricing_type: 'FIXED_AMOUNT',
                value: ratingConfig.limits?.maximumCover || 0,
              },
              base_broker_commission: {
                pricing_type: 'PERCENTAGE',
                value: ratingConfig.limits?.baseBrokerCommission || 0,
              },
              minimum_broker_commission: {
                pricing_type: 'PERCENTAGE',
                value: ratingConfig.limits?.minimumBrokerCommission || 0,
              },
              maximum_broker_commission: {
                pricing_type: 'PERCENTAGE',
                value: ratingConfig.limits?.maximumBrokerCommission || 0,
              },
            },
            sub_limits:
              ratingConfig.coverRequirements?.subLimits?.map((entry) => ({
                title: entry.title || '',
                description: entry.description || '',
                pricing_type: (entry.pricingType === 'fixed'
                  ? 'FIXED_AMOUNT'
                  : entry.pricingType === 'percentage_sum_insured'
                    ? 'PERCENTAGE_OF_SUM_INSURED'
                    : entry.pricingType === 'percentage_loss'
                      ? 'PERCENTAGE_OF_LOSS'
                      : 'FIXED_AMOUNT') as
                  | 'PERCENTAGE_OF_SUM_INSURED'
                  | 'FIXED_AMOUNT'
                  | 'PERCENTAGE_OF_LOSS',
                value: entry.value || 0,
              })) || [],
            deductibles:
              ratingConfig.coverRequirements?.deductibles?.map((entry) => ({
                type: (entry.deductibleType === 'fixed'
                  ? 'FIXED_AMOUNT'
                  : entry.deductibleType === 'percentage_loss'
                    ? 'PERCENTAGE_OF_LOSS'
                    : entry.deductibleType === 'percentage_sum_insured'
                      ? 'PERCENTAGE_OF_SUM_INSURED'
                      : 'FIXED_AMOUNT') as
                  | 'FIXED_AMOUNT'
                  | 'PERCENTAGE_OF_LOSS'
                  | 'PERCENTAGE_OF_SUM_INSURED',
                value: entry.value || 0,
                loading_discount: entry.loadingDiscount || 0,
                quote_option: (entry.quoteOption === 'quote' ? 'AUTO_QUOTE' : 'MANUAL_QUOTE') as
                  | 'AUTO_QUOTE'
                  | 'MANUAL_QUOTE',
              })) || [],
          },
        };

        console.log('📤 Calling PATCH API with data:', updateData);
        const patchResponse = await updatePolicyLimits(insurerId, String(productId), updateData);
        console.log('📥 PATCH API response:', patchResponse);

        // Update local state with PATCH response (response.data format)
        if (patchResponse?.data) {
          const responseData = patchResponse.data;
          setPolicyLimitsData({
            policy_limits: responseData.policy_limits,
            sub_limits: responseData.sub_limits || [],
            deductibles: responseData.deductibles || [],
          });
        }
      } else {
        console.log('📝 No existing policy limits data, using POST API');

        // Collect data from UI for POST (with currency in nested objects)
        const postData: SavePolicyLimitsRequest = {
          policy_limits_and_deductible: {
            policy_limits: {
              minimum_premium: {
                pricing_type: 'FIXED_AMOUNT',
                value: ratingConfig.limits?.minimumPremium || 0,
              },
              maximum_cover: {
                pricing_type: 'FIXED_AMOUNT',
                value: ratingConfig.limits?.maximumCover || 0,
              },
              base_broker_commission: {
                pricing_type: 'PERCENTAGE',
                value: ratingConfig.limits?.baseBrokerCommission || 0,
              },
              minimum_broker_commission: {
                pricing_type: 'PERCENTAGE',
                value: ratingConfig.limits?.minimumBrokerCommission || 0,
              },
              maximum_broker_commission: {
                pricing_type: 'PERCENTAGE',
                value: ratingConfig.limits?.maximumBrokerCommission || 0,
              },
            },
            sub_limits:
              ratingConfig.coverRequirements?.subLimits?.map((entry) => ({
                title: entry.title || '',
                description: entry.description || '',
                pricing_type: (entry.pricingType === 'fixed'
                  ? 'FIXED_AMOUNT'
                  : entry.pricingType === 'percentage_sum_insured'
                    ? 'PERCENTAGE_OF_SUM_INSURED'
                    : entry.pricingType === 'percentage_loss'
                      ? 'PERCENTAGE_OF_LOSS'
                      : 'FIXED_AMOUNT') as
                  | 'PERCENTAGE_OF_SUM_INSURED'
                  | 'FIXED_AMOUNT'
                  | 'PERCENTAGE_OF_LOSS',
                value: entry.value || 0,
              })) || [],
            deductibles:
              ratingConfig.coverRequirements?.deductibles?.map((entry) => ({
                type: (entry.deductibleType === 'fixed'
                  ? 'FIXED_AMOUNT'
                  : entry.deductibleType === 'percentage_loss'
                    ? 'PERCENTAGE_OF_LOSS'
                    : entry.deductibleType === 'percentage_sum_insured'
                      ? 'PERCENTAGE_OF_SUM_INSURED'
                      : 'FIXED_AMOUNT') as
                  | 'FIXED_AMOUNT'
                  | 'PERCENTAGE_OF_LOSS'
                  | 'PERCENTAGE_OF_SUM_INSURED',
                value: entry.value || 0,
                loading_discount: entry.loadingDiscount || 0,
                quote_option: (entry.quoteOption === 'quote' ? 'AUTO_QUOTE' : 'MANUAL_QUOTE') as
                  | 'AUTO_QUOTE'
                  | 'MANUAL_QUOTE',
              })) || [],
          },
        };

        console.log('📤 Calling POST API with data:', postData);
        const postResponse = await savePolicyLimits(insurerId, String(productId), postData);
        console.log('📥 POST API response:', postResponse);

        // Update local state with POST response
        if (postResponse?.policy_limits_and_deductible) {
          const responseData = postResponse.policy_limits_and_deductible;
          setPolicyLimitsData({
            policy_limits: responseData.policy_limits,
            sub_limits: responseData.sub_limits || [],
            deductibles: responseData.deductibles || [],
          });
        }
      }

      toast({
        title: 'Success',
        description: 'Policy limits and deductibles saved successfully!',
        variant: 'default',
      });
    } catch (error) {
      console.error('Save Policy Limits error:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        stack: error?.stack,
      });

      const status = error?.status;
      const message =
        status === 400
          ? 'Invalid data while saving policy limits.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while saving policy limits.'
                : error?.message || 'Failed to save policy limits.';

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingPolicyLimits(false);
    }
  };

  // Save Coverage Options handler with GET-then-POST/PATCH logic

  // Fetch Construction Types Configuration after metadata loads
  const fetchConstructionTypesConfig = async (): Promise<void> => {
    console.log('🚀 fetchConstructionTypesConfig called');
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    console.log('🔍 IDs check:', { insurerId, productId });

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      setConstructionTypesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated, starting API call...');
    setIsLoadingConstructionTypesConfig(true);
    setConstructionTypesConfigError(null);

    try {
      console.log('🔍 Fetching Construction Types Configuration...');
      console.log('📡 API Call Parameters:', { insurerId, productId });
      const response = await getConstructionTypesConfiguration(insurerId, String(productId));

      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response items:', response.items);
      console.log('🔍 Items length:', response.items?.length);
      console.log('🔍 Raw response JSON:', JSON.stringify(response, null, 2));

      if (response.items?.length > 0) {
        console.log('✅ Found items, setting state...');
        setConstructionTypesConfigData(response.items);
        console.log('✅ Construction Types Configuration loaded:', response.items);
        console.log('✅ Setting state with data:', response.items);
      } else {
        console.log('❌ No items found or empty array');
        console.log('❌ Condition check:', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          itemsArray: response.items,
        });
        setConstructionTypesConfigData([]);
        console.log('ℹ️ No existing Construction Types Configuration found');
      }
    } catch (err) {
      console.error('❌ Error loading Construction Types Configuration:', err);
      const status = err?.status;
      // 404 means no configuration yet for this product - this is OK for new products
      if (status === 404) {
        console.log(
          '[ConstructionTypesConfig] No existing configuration found (404) - starting with empty data',
        );
        setConstructionTypesConfigData([]);
        // Don't set error for 404 - this is expected for new products
      } else {
        setConstructionTypesConfigError(
          err.message || 'Failed to load construction types configuration',
        );
        setConstructionTypesConfigData([]);
      }
    } finally {
      setIsLoadingConstructionTypesConfig(false);
    }
  };

  // Fetch Countries Configuration after metadata loads
  const fetchCountriesConfig = async (): Promise<void> => {
    console.log('🚀 fetchCountriesConfig called');
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    console.log('🔍 IDs check:', { insurerId, productId });

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      setCountriesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated, starting API call...');
    setIsLoadingCountriesConfig(true);
    setCountriesConfigError(null);

    try {
      console.log('🔍 Fetching Countries Configuration...');
      console.log('📡 API Call Parameters:', { insurerId, productId });
      const response = await getCountriesConfiguration(insurerId, String(productId));

      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response items:', response.items);
      console.log('🔍 Items length:', response.items?.length);
      console.log('🔍 Raw response JSON:', JSON.stringify(response, null, 2));

      if (response.items?.length > 0) {
        console.log('✅ Found items, setting state...');
        setCountriesConfigData(response.items);
        console.log('✅ Countries Configuration loaded:', response.items);
        console.log('✅ Setting state with data:', response.items);
      } else {
        console.log('❌ No items found or empty array');
        console.log('❌ Condition check:', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          itemsArray: response.items,
        });
        setCountriesConfigData([]);
        console.log('ℹ️ No existing Countries Configuration found');
      }
    } catch (err) {
      console.error('❌ Error loading Countries Configuration:', err);
      const status = err?.status;
      const msg =
        status === 400
          ? 'Bad request while loading countries configuration.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while loading countries configuration.'
                : 'Failed to load countries configuration.';
      setCountriesConfigError(msg);
      setCountriesConfigData([]);
    } finally {
      setIsLoadingCountriesConfig(false);
    }
  };

  // Fetch Regions Configuration after metadata loads
  const fetchRegionsConfig = async (): Promise<void> => {
    console.log('🚀 fetchRegionsConfig called');
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    console.log('🔍 IDs check:', { insurerId, productId });

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      setRegionsConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated, starting API call...');
    setIsLoadingRegionsConfig(true);
    setRegionsConfigError(null);

    try {
      console.log('🔍 Fetching Regions Configuration...');
      console.log('📡 API Call Parameters:', { insurerId, productId });
      const response = await getRegionsConfiguration(insurerId, String(productId));

      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response items:', response.items);
      console.log('🔍 Items length:', response.items?.length);
      console.log('🔍 Raw response JSON:', JSON.stringify(response, null, 2));

      if (response.items?.length > 0) {
        console.log('✅ Found items, setting state...');
        setRegionsConfigData(response.items);
        console.log('✅ Regions Configuration loaded:', response.items);
        console.log('✅ Setting state with data:', response.items);
      } else {
        console.log('❌ No items found or empty array');
        console.log('❌ Condition check:', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          itemsArray: response.items,
        });
        setRegionsConfigData([]);
        console.log('ℹ️ No existing Regions Configuration found');
      }
    } catch (err) {
      console.error('❌ Error loading Regions Configuration:', err);
      const status = err?.status;
      const msg =
        status === 400
          ? 'Bad request while loading regions configuration.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while loading regions configuration.'
                : 'Failed to load regions configuration.';
      setRegionsConfigError(msg);
      setRegionsConfigData([]);
    } finally {
      setIsLoadingRegionsConfig(false);
    }
  };

  // Fetch Zones Configuration after metadata loads
  const fetchZonesConfig = async (): Promise<void> => {
    console.log('🚀 fetchZonesConfig called');
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    console.log('🔍 IDs check:', { insurerId, productId });

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      setZonesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated, starting API call...');
    setIsLoadingZonesConfig(true);
    setZonesConfigError(null);

    try {
      console.log('🔍 Fetching Zones Configuration...');
      console.log('📡 API Call Parameters:', { insurerId, productId });
      const response = await getZonesConfiguration(insurerId, String(productId));

      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response items:', response.items);
      console.log('🔍 Items length:', response.items?.length);
      console.log('🔍 Raw response JSON:', JSON.stringify(response, null, 2));

      if (response.items?.length > 0) {
        console.log('✅ Found items, setting state...');
        setZonesConfigData(response.items);
        console.log('✅ Zones Configuration loaded:', response.items);
        console.log('✅ Setting state with data:', response.items);
      } else {
        console.log('ℹ️ No zones configuration items found, starting with empty data');
        console.log('ℹ️ Condition check:', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          itemsArray: response.items,
        });
        setZonesConfigData([]);
        console.log('ℹ️ No existing Zones Configuration found');
      }
    } catch (err) {
      console.error('❌ Error loading Zones Configuration:', err);
      const status = err?.status;
      if (status === 404) {
        console.log(
          '[ZonesConfig] No existing configuration found (404) - starting with empty data',
        );
        setZonesConfigData([]);
        setZonesConfigError(null);
      } else {
        const msg =
          status === 400
            ? 'Bad request while loading zones configuration.'
            : status === 401
              ? 'Unauthorized. Please log in again.'
              : status === 403
                ? 'Forbidden. You do not have access.'
                : status >= 500
                  ? 'Server error while loading zones configuration.'
                  : 'Failed to load zones configuration.';
        setZonesConfigError(msg);
        setZonesConfigData([]);
      }
    } finally {
      setIsLoadingZonesConfig(false);
    }
  };

  // Save Zones Configuration handler with GET-then-POST/PATCH logic
  const handleSaveZonesConfiguration = async (formData): Promise<void> => {
    console.log('🎯 === SAVE ZONES CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      toast({
        title: 'Error',
        description: 'Unable to determine insurer ID or product ID.',
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ IDs validated:', { insurerId, productId });
    setIsSavingZonesConfig(true);

    try {
      // Build request payload from form data
      const items = Object.entries(formData).map(
        ([zoneName, zoneFormData]: [string, any], index: number) => {
          console.log(`📝 Processing zone "${zoneName}":`, zoneFormData);

          const item = {
            name: zoneName,
            pricing_type: (zoneFormData.pricingType === 'fixed' ? 'FIXED_RATE' : 'PERCENTAGE') as
              | 'PERCENTAGE'
              | 'FIXED_RATE',
            value: Number(zoneFormData.value || 0),
            quote_option: (zoneFormData.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE') as
              | 'AUTO_QUOTE'
              | 'NO_QUOTE',
            display_order: index + 1,
            is_active: true,
          };

          console.log(`✅ Mapped item for "${zoneName}":`, item);
          return item;
        },
      );

      const requestPayload: SaveZonesConfigRequest = {
        zones_config: {
          items,
        },
      };

      console.log('🔍 Final request payload:', JSON.stringify(requestPayload, null, 2));

      // Determine if this is a POST or PATCH based on existing data
      const hasExistingData = zonesConfigData && zonesConfigData.length > 0;
      console.log('🔍 Has existing data?', hasExistingData);
      console.log('🔍 Existing data:', zonesConfigData);

      let response: SaveZonesConfigResponse;

      if (hasExistingData) {
        console.log('🔄 Calling PATCH API (update existing)...');
        response = await updateZonesConfiguration(insurerId, String(productId), requestPayload);
        console.log('✅ PATCH Response:', response);

        toast({
          title: 'Success',
          description: 'Zones configuration updated successfully!',
          variant: 'default',
        });
      } else {
        console.log('🆕 Calling POST API (create new)...');
        response = await createZonesConfiguration(insurerId, String(productId), requestPayload);
        console.log('✅ POST Response:', response);

        toast({
          title: 'Success',
          description: 'Zones configuration created successfully!',
          variant: 'default',
        });
      }

      // Update state with response data
      if (response.data?.items) {
        console.log('🔄 Updating zones config data with response...');
        setZonesConfigData(response.data.items);
        console.log('✅ State updated with:', response.data.items);
      }
    } catch (err) {
      console.error('❌ Error saving Zones Configuration:', err);
      const status = err?.status;
      const msg =
        status === 400
          ? 'Bad request while saving zones configuration.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while saving zones configuration.'
                : 'Failed to save zones configuration.';

      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSavingZonesConfig(false);
      console.log('🎯 === SAVE ZONES CONFIGURATION COMPLETED ===');
    }
  };

  // Fetch Contract Types Configuration after metadata loads
  const fetchContractTypesConfig = async (): Promise<void> => {
    console.log('🚀 fetchContractTypesConfig called');
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    console.log('🔍 IDs check:', { insurerId, productId });

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      setContractTypesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated, starting API call...');
    setIsLoadingContractTypesConfig(true);
    setContractTypesConfigError(null);

    try {
      console.log('🔍 Fetching Contract Types Configuration...');
      console.log('📡 API Call Parameters:', { insurerId, productId });
      const response = await getContractTypesConfiguration(insurerId, String(productId));

      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response items:', response.items);
      console.log('🔍 Items length:', response.items?.length);
      console.log('🔍 Raw response JSON:', JSON.stringify(response, null, 2));

      if (response.items?.length > 0) {
        console.log('✅ Found items, setting state...');
        setContractTypesConfigData(response.items);
        console.log('✅ Contract Types Configuration loaded:', response.items);
        console.log('✅ Setting state with data:', response.items);
      } else {
        console.log('❌ No items found or empty array');
        console.log('❌ Condition check:', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          itemsArray: response.items,
        });
        setContractTypesConfigData([]);
        console.log('ℹ️ No existing Contract Types Configuration found');
      }
    } catch (err) {
      console.error('❌ Error loading Contract Types Configuration:', err);
      const status = err?.status;
      // 404 means no configuration yet for this product - this is OK for new products
      if (status === 404) {
        console.log(
          '[ContractTypesConfig] No existing configuration found (404) - starting with empty data',
        );
        setContractTypesConfigData([]);
        // Don't set error for 404 - this is expected for new products
      } else {
        const msg =
          status === 400
            ? 'Bad request while loading contract types configuration.'
            : status === 401
              ? 'Unauthorized. Please log in again.'
              : status === 403
                ? 'Forbidden. You do not have access.'
                : status >= 500
                  ? 'Server error while loading contract types configuration.'
                  : 'Failed to load contract types configuration.';
        setContractTypesConfigError(msg);
        setContractTypesConfigData([]);
      }
    } finally {
      setIsLoadingContractTypesConfig(false);
    }
  };

  // Save Contract Types Configuration handler with GET-then-POST/PATCH logic
  const handleSaveContractTypesConfiguration = async (formData: {
    [key: string]: any;
  }): Promise<void> => {
    console.log('🎯 === SAVE CONTRACT TYPES CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      toast({
        title: 'Error',
        description: 'Unable to determine insurer ID or product ID.',
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ IDs validated:', { insurerId, productId });
    setIsSavingContractTypesConfig(true);

    try {
      // Build request payload from form data
      const items = Object.entries(formData).map(
        ([contractTypeName, contractTypeFormData], index) => {
          console.log(`📝 Processing contract type "${contractTypeName}":`, contractTypeFormData);

          const item = {
            name: contractTypeName,
            pricing_type: (contractTypeFormData.pricingType === 'fixed'
              ? 'FIXED_RATE'
              : 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED_RATE',
            value: Number(contractTypeFormData.value || 0),
            quote_option: (contractTypeFormData.quoteOption === 'no-quote'
              ? 'NO_QUOTE'
              : 'AUTO_QUOTE') as 'AUTO_QUOTE' | 'NO_QUOTE',
            display_order: index + 1,
            is_active: true,
          };

          console.log(`✅ Mapped item for "${contractTypeName}":`, item);
          return item;
        },
      );

      const requestPayload: SaveContractTypesConfigRequest = {
        contract_types_config: {
          items,
        },
      };

      console.log('🔍 Final request payload:', JSON.stringify(requestPayload, null, 2));

      // Determine if this is a POST or PATCH based on existing data
      const hasExistingData = contractTypesConfigData && contractTypesConfigData.length > 0;
      console.log('🔍 Has existing data?', hasExistingData);
      console.log('🔍 Existing data:', contractTypesConfigData);

      let response: SaveContractTypesConfigResponse;

      if (hasExistingData) {
        console.log('🔄 Calling PATCH API (update existing)...');
        response = await updateContractTypesConfiguration(
          insurerId,
          String(productId),
          requestPayload,
        );
        console.log('✅ PATCH Response:', response);

        toast({
          title: 'Success',
          description: 'Contract types configuration updated successfully!',
          variant: 'default',
        });
      } else {
        console.log('🆕 Calling POST API (create new)...');
        response = await createContractTypesConfiguration(
          insurerId,
          String(productId),
          requestPayload,
        );
        console.log('✅ POST Response:', response);

        toast({
          title: 'Success',
          description: 'Contract types configuration created successfully!',
          variant: 'default',
        });
      }

      // Update state with response data
      if (response.data?.items) {
        console.log('🔄 Updating contract types config data with response...');
        setContractTypesConfigData(response.data.items);
        console.log('✅ State updated with:', response.data.items);
      }
    } catch (err) {
      console.error('❌ Error saving Contract Types Configuration:', err);
      const status = err?.status;
      const msg =
        status === 400
          ? 'Bad request while saving contract types configuration.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while saving contract types configuration.'
                : 'Failed to save contract types configuration.';

      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSavingContractTypesConfig(false);
      console.log('🎯 === SAVE CONTRACT TYPES CONFIGURATION COMPLETED ===');
    }
  };

  // Fetch Role Types Configuration after metadata loads
  const fetchRoleTypesConfig = async (): Promise<void> => {
    console.log('🚀 fetchRoleTypesConfig called');
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    console.log('🔍 IDs check:', { insurerId, productId });

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      setRoleTypesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated, starting API call...');
    setIsLoadingRoleTypesConfig(true);
    setRoleTypesConfigError(null);

    try {
      console.log('🔍 Fetching Role Types Configuration...');
      console.log('📡 API Call Parameters:', { insurerId, productId });
      const response = await getRoleTypesConfiguration(insurerId, String(productId));

      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response items:', response.items);
      console.log('🔍 Items length:', response.items?.length);
      console.log('🔍 Raw response JSON:', JSON.stringify(response, null, 2));

      if (response.items?.length > 0) {
        console.log('✅ Found items, setting state...');
        setRoleTypesConfigData(response.items);
        console.log('✅ Role Types Configuration loaded:', response.items);
        console.log('✅ Setting state with data:', response.items);
      } else {
        console.log('❌ No items found or empty array');
        console.log('❌ Condition check:', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          itemsArray: response.items,
        });
        setRoleTypesConfigData([]);
        console.log('ℹ️ No existing Role Types Configuration found');
      }
    } catch (err) {
      console.error('❌ Error loading Role Types Configuration:', err);
      const status = err?.status;
      // 404 means no configuration yet for this product - this is OK for new products
      if (status === 404) {
        console.log(
          '[RoleTypesConfig] No existing configuration found (404) - starting with empty data',
        );
        setRoleTypesConfigData([]);
        // Don't set error for 404 - this is expected for new products
      } else {
        const msg =
          status === 400
            ? 'Bad request while loading role types configuration.'
            : status === 401
              ? 'Unauthorized. Please log in again.'
              : status === 403
                ? 'Forbidden. You do not have access.'
                : status >= 500
                  ? 'Server error while loading role types configuration.'
                  : 'Failed to load role types configuration.';
        setRoleTypesConfigError(msg);
        setRoleTypesConfigData([]);
      }
    } finally {
      setIsLoadingRoleTypesConfig(false);
    }
  };

  // Save Role Types Configuration handler with GET-then-POST/PATCH logic
  const handleSaveRoleTypesConfiguration = async (formData: {
    [key: string]: any;
  }): Promise<void> => {
    console.log('🎯 === SAVE ROLE TYPES CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      toast({
        title: 'Error',
        description: 'Unable to determine insurer ID or product ID.',
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ IDs validated:', { insurerId, productId });
    setIsSavingRoleTypesConfig(true);

    try {
      // Build request payload from form data
      const items = Object.entries(formData).map(([roleTypeName, roleTypeFormData], index) => {
        console.log(`📝 Processing role type "${roleTypeName}":`, roleTypeFormData);

        const item = {
          name: roleTypeName,
          pricing_type: (roleTypeFormData.pricingType === 'fixed' ? 'FIXED_RATE' : 'PERCENTAGE') as
            | 'PERCENTAGE'
            | 'FIXED_RATE',
          value: Number(roleTypeFormData.value || 0),
          quote_option: (roleTypeFormData.quoteOption === 'no-quote'
            ? 'NO_QUOTE'
            : 'AUTO_QUOTE') as 'AUTO_QUOTE' | 'NO_QUOTE',
          display_order: index + 1,
          is_active: true,
        };

        console.log(`✅ Mapped item for "${roleTypeName}":`, item);
        return item;
      });

      const requestPayload: SaveRoleTypesConfigRequest = {
        role_types_config: {
          items,
        },
      };

      console.log('🔍 Final request payload:', JSON.stringify(requestPayload, null, 2));

      // Determine if this is a POST or PATCH based on existing data
      const hasExistingData = roleTypesConfigData && roleTypesConfigData.length > 0;
      console.log('🔍 Has existing data?', hasExistingData);
      console.log('🔍 Existing data:', roleTypesConfigData);

      let response: SaveRoleTypesConfigResponse;

      if (hasExistingData) {
        console.log('🔄 Calling PATCH API (update existing)...');
        response = await updateRoleTypesConfiguration(insurerId, String(productId), requestPayload);
        console.log('✅ PATCH Response:', response);

        toast({
          title: 'Success',
          description: 'Role types configuration updated successfully!',
          variant: 'default',
        });
      } else {
        console.log('🆕 Calling POST API (create new)...');
        response = await createRoleTypesConfiguration(insurerId, String(productId), requestPayload);
        console.log('✅ POST Response:', response);

        toast({
          title: 'Success',
          description: 'Role types configuration created successfully!',
          variant: 'default',
        });
      }

      // Update state with response data
      if (response.data?.items) {
        console.log('🔄 Updating role types config data with response...');
        setRoleTypesConfigData(response.data.items);
        console.log('✅ State updated with:', response.data.items);
      }
    } catch (err) {
      console.error('❌ Error saving Role Types Configuration:', err);
      const status = err?.status;
      const msg =
        status === 400
          ? 'Bad request while saving role types configuration.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while saving role types configuration.'
                : 'Failed to save role types configuration.';

      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSavingRoleTypesConfig(false);
      console.log('🎯 === SAVE ROLE TYPES CONFIGURATION COMPLETED ===');
    }
  };

  // Fetch Soil Types Configuration after metadata loads
  const fetchSoilTypesConfig = async (): Promise<void> => {
    console.log('🚀 fetchSoilTypesConfig called');
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    console.log('🔍 IDs check:', { insurerId, productId });

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      setSoilTypesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated, starting API call...');
    setIsLoadingSoilTypesConfig(true);
    setSoilTypesConfigError(null);

    try {
      console.log('🔍 Fetching Soil Types Configuration...');
      console.log('📡 API Call Parameters:', { insurerId, productId });
      const response = await getSoilTypesConfiguration(insurerId, String(productId));

      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response items:', response.items);
      console.log('🔍 Items length:', response.items?.length);
      console.log('🔍 Raw response JSON:', JSON.stringify(response, null, 2));

      if (response.items?.length > 0) {
        console.log('✅ Found items, setting state...');
        setSoilTypesConfigData(response.items);
        console.log('✅ Soil Types Configuration loaded:', response.items);
        console.log('✅ Setting state with data:', response.items);
      } else {
        console.log('❌ No items found or empty array');
        console.log('❌ Condition check:', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          itemsArray: response.items,
        });
        setSoilTypesConfigData([]);
        console.log('ℹ️ No existing Soil Types Configuration found');
      }
    } catch (err) {
      console.error('❌ Error loading Soil Types Configuration:', err);
      const status = err?.status;
      // 404 means no configuration yet for this product - this is OK for new products
      if (status === 404) {
        console.log(
          '[SoilTypesConfig] No existing configuration found (404) - starting with empty data',
        );
        setSoilTypesConfigData([]);
        // Don't set error for 404 - this is expected for new products
      } else {
        const msg =
          status === 400
            ? 'Bad request while loading soil types configuration.'
            : status === 401
              ? 'Unauthorized. Please log in again.'
              : status === 403
                ? 'Forbidden. You do not have access.'
                : status >= 500
                  ? 'Server error while loading soil types configuration.'
                  : 'Failed to load soil types configuration.';
        setSoilTypesConfigError(msg);
        setSoilTypesConfigData([]);
      }
    } finally {
      setIsLoadingSoilTypesConfig(false);
    }
  };

  // Save Soil Types Configuration handler with GET-then-POST/PATCH logic
  const handleSaveSoilTypesConfiguration = async (formData: {
    [key: string]: any;
  }): Promise<void> => {
    console.log('🎯 === SAVE SOIL TYPES CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      toast({
        title: 'Error',
        description: 'Unable to determine insurer ID or product ID.',
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ IDs validated:', { insurerId, productId });
    setIsSavingSoilTypesConfig(true);

    try {
      // Build request payload from form data
      const items = Object.entries(formData).map(([soilTypeName, soilTypeFormData], index) => {
        console.log(`📝 Processing soil type "${soilTypeName}":`, soilTypeFormData);

        const item = {
          name: soilTypeName,
          pricing_type: (soilTypeFormData.pricingType === 'fixed' ? 'FIXED_RATE' : 'PERCENTAGE') as
            | 'PERCENTAGE'
            | 'FIXED_RATE',
          value: Number(soilTypeFormData.value || 0),
          quote_option: (soilTypeFormData.quoteOption === 'no-quote'
            ? 'NO_QUOTE'
            : 'AUTO_QUOTE') as 'AUTO_QUOTE' | 'NO_QUOTE',
          display_order: index + 1,
          is_active: true,
        };

        console.log(`✅ Mapped item for "${soilTypeName}":`, item);
        return item;
      });

      const requestPayload: SaveSoilTypesConfigRequest = {
        soil_types_config: {
          items,
        },
      };

      console.log('🔍 Final request payload:', JSON.stringify(requestPayload, null, 2));

      // Determine if this is a POST or PATCH based on existing data
      const hasExistingData = soilTypesConfigData && soilTypesConfigData.length > 0;
      console.log('🔍 Has existing data?', hasExistingData);
      console.log('🔍 Existing data:', soilTypesConfigData);

      let response: SaveSoilTypesConfigResponse;

      if (hasExistingData) {
        console.log('🔄 Calling PATCH API (update existing)...');
        response = await updateSoilTypesConfiguration(insurerId, String(productId), requestPayload);
        console.log('✅ PATCH Response:', response);

        toast({
          title: 'Success',
          description: 'Soil types configuration updated successfully!',
          variant: 'default',
        });
      } else {
        console.log('🆕 Calling POST API (create new)...');
        response = await createSoilTypesConfiguration(insurerId, String(productId), requestPayload);
        console.log('✅ POST Response:', response);

        toast({
          title: 'Success',
          description: 'Soil types configuration created successfully!',
          variant: 'default',
        });
      }

      // Update state with response data
      if (response.data?.items) {
        console.log('🔄 Updating soil types config data with response...');
        setSoilTypesConfigData(response.data.items);
        console.log('✅ State updated with:', response.data.items);
      }
    } catch (err) {
      console.error('❌ Error saving Soil Types Configuration:', err);
      const status = err?.status;
      const msg =
        status === 400
          ? 'Bad request while saving soil types configuration.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while saving soil types configuration.'
                : 'Failed to save soil types configuration.';

      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSavingSoilTypesConfig(false);
      console.log('🎯 === SAVE SOIL TYPES CONFIGURATION COMPLETED ===');
    }
  };

  // Fetch Subcontractor Types Configuration after metadata loads
  const fetchSubcontractorTypesConfig = async (): Promise<void> => {
    console.log('🚀 fetchSubcontractorTypesConfig called');
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    console.log('🔍 IDs check:', { insurerId, productId });

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      setSubcontractorTypesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated, starting API call...');
    setIsLoadingSubcontractorTypesConfig(true);
    setSubcontractorTypesConfigError(null);

    try {
      console.log('🔍 Fetching Subcontractor Types Configuration...');
      console.log('📡 API Call Parameters:', { insurerId, productId });
      const response = await getSubcontractorTypesConfiguration(insurerId, String(productId));

      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response items:', response.items);
      console.log('🔍 Items length:', response.items?.length);
      console.log('🔍 Raw response JSON:', JSON.stringify(response, null, 2));

      if (response.items?.length > 0) {
        console.log('✅ Found items, setting state...');
        setSubcontractorTypesConfigData(response.items);
        console.log('✅ Subcontractor Types Configuration loaded:', response.items);
        console.log('✅ Setting state with data:', response.items);
      } else {
        console.log('❌ No items found or empty array');
        console.log('❌ Condition check:', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          itemsArray: response.items,
        });
        setSubcontractorTypesConfigData([]);
        console.log('ℹ️ No existing Subcontractor Types Configuration found');
      }
    } catch (err) {
      console.error('❌ Error loading Subcontractor Types Configuration:', err);
      const status = err?.status;
      // 404 means no configuration yet for this product - this is OK for new products
      if (status === 404) {
        console.log(
          '[SubcontractorTypesConfig] No existing configuration found (404) - starting with empty data',
        );
        setSubcontractorTypesConfigData([]);
        // Don't set error for 404 - this is expected for new products
      } else {
        const msg =
          status === 400
            ? 'Bad request while loading subcontractor types configuration.'
            : status === 401
              ? 'Unauthorized. Please log in again.'
              : status === 403
                ? 'Forbidden. You do not have access.'
                : status >= 500
                  ? 'Server error while loading subcontractor types configuration.'
                  : 'Failed to load subcontractor types configuration.';
        setSubcontractorTypesConfigError(msg);
        setSubcontractorTypesConfigData([]);
      }
    } finally {
      setIsLoadingSubcontractorTypesConfig(false);
    }
  };

  // Fetch Consultant Roles Configuration
  const fetchConsultantRolesConfig = async (): Promise<void> => {
    console.log('🎯 === FETCH CONSULTANT ROLES CONFIGURATION STARTED ===');

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs for consultant roles config:', {
        insurerId,
        productId,
      });
      setConsultantRolesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated for consultant roles config:', {
      insurerId,
      productId,
    });
    setIsLoadingConsultantRolesConfig(true);
    setConsultantRolesConfigError(null);

    try {
      console.log('🔍 Calling getConsultantRolesConfiguration API...');
      const response = await getConsultantRolesConfiguration(insurerId, String(productId));
      console.log('✅ Consultant Roles Configuration API Response:', response);

      if (response?.items && Array.isArray(response.items)) {
        console.log('📝 Setting consultant roles config data:', response.items);
        setConsultantRolesConfigData(response.items);
        console.log('✅ Consultant roles config data set successfully');
      } else {
        console.warn('⚠️ No consultant roles items in response:', response);
        setConsultantRolesConfigData([]);
      }
    } catch (err) {
      console.error('❌ Error fetching Consultant Roles Configuration:', err);
      const status = err?.status;
      const msg =
        status === 400
          ? 'Bad request while loading consultant roles configuration.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while loading consultant roles configuration.'
                : 'Failed to load consultant roles configuration.';
      setConsultantRolesConfigError(msg);
      setConsultantRolesConfigData([]);
    } finally {
      setIsLoadingConsultantRolesConfig(false);
    }
  };

  // Fetch Security Types Configuration
  const fetchSecurityTypesConfig = async (): Promise<void> => {
    console.log('🎯 === FETCH SECURITY TYPES CONFIGURATION STARTED ===');

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs for security types config:', {
        insurerId,
        productId,
      });
      setSecurityTypesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated for security types config:', {
      insurerId,
      productId,
    });
    setIsLoadingSecurityTypesConfig(true);
    setSecurityTypesConfigError(null);

    try {
      console.log('🔍 Calling getSecurityTypesConfiguration API...');
      const response = await getSecurityTypesConfiguration(insurerId, String(productId));
      console.log('✅ Security Types Configuration API Response:', response);

      if (response?.items && Array.isArray(response.items)) {
        console.log('📝 Setting security types config data:', response.items);
        setSecurityTypesConfigData(response.items);
        console.log('✅ Security types config data set successfully');
      } else {
        console.warn('⚠️ No security types items in response:', response);
        setSecurityTypesConfigData([]);
      }
    } catch (err) {
      console.error('❌ Error fetching Security Types Configuration:', err);
      const status = err?.status;
      const msg =
        status === 400
          ? 'Bad request while loading security types configuration.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while loading security types configuration.'
                : 'Failed to load security types configuration.';
      setSecurityTypesConfigError(msg);
      setSecurityTypesConfigData([]);
    } finally {
      setIsLoadingSecurityTypesConfig(false);
    }
  };

  // Save Security Types Configuration handler
  const handleSaveSecurityTypesConfiguration = async (formData: {
    [key: string]: any;
  }): Promise<void> => {
    console.log('🎯 === SAVE SECURITY TYPES CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      toast({
        title: 'Error',
        description: 'Unable to determine insurer ID or product ID.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingSecurityTypesConfig(true);

    try {
      // Transform form data to API format
      const items = Object.keys(formData).map((securityTypeName, index) => {
        const securityTypeData = formData[securityTypeName];
        return {
          name: securityTypeName,
          pricing_type: (securityTypeData?.pricingType === 'fixed'
            ? 'FIXED_RATE'
            : 'PERCENTAGE') as 'FIXED_RATE' | 'PERCENTAGE',
          value: Number(securityTypeData?.value || 0),
          quote_option: (securityTypeData?.quoteOption === 'no-quote'
            ? 'NO_QUOTE'
            : 'AUTO_QUOTE') as 'NO_QUOTE' | 'AUTO_QUOTE',
          display_order: index + 1,
          is_active: true,
        };
      });

      const requestPayload: SaveSecurityTypesRequest = {
        security_types_config: { items },
      };

      console.log('🔍 Request payload:', requestPayload);

      // Determine whether to use POST or PATCH based on existing data
      const hasExistingData = securityTypesConfigData && securityTypesConfigData.length > 0;
      console.log('🔍 Has existing data:', hasExistingData);
      console.log('🔍 Using API method:', hasExistingData ? 'PATCH' : 'POST');

      let response: SaveSecurityTypesResponse;

      if (hasExistingData) {
        // Use PATCH for existing data
        response = await updateSecurityTypesConfiguration(
          insurerId,
          String(productId),
          requestPayload,
        );
      } else {
        // Use POST for new data
        response = await createSecurityTypesConfiguration(
          insurerId,
          String(productId),
          requestPayload,
        );
      }

      console.log('✅ API Response:', response);

      // Refresh the configuration data
      await fetchSecurityTypesConfig();

      toast({
        title: 'Success',
        description: response?.message || 'Security types configuration saved successfully.',
      });

      console.log('🎯 === SAVE SECURITY TYPES CONFIGURATION SUCCESS ===');
    } catch (err) {
      console.error('❌ Error saving security types configuration:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to save security types configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingSecurityTypesConfig(false);
    }
  };

  // Fetch Area Types Configuration
  const fetchAreaTypesConfig = async (): Promise<void> => {
    console.log('🎯 === FETCH AREA TYPES CONFIGURATION STARTED ===');

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs for area types config:', {
        insurerId,
        productId,
      });
      setAreaTypesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated for area types config:', {
      insurerId,
      productId,
    });
    setIsLoadingAreaTypesConfig(true);
    setAreaTypesConfigError(null);

    try {
      console.log('🔍 Calling getAreaTypesConfiguration API...');
      const response = await getAreaTypesConfiguration(insurerId, String(productId));
      console.log('✅ Area Types Configuration API Response:', response);

      if (response?.items && Array.isArray(response.items)) {
        console.log('📝 Setting area types config data:', response.items);
        setAreaTypesConfigData(response.items);
        console.log('✅ Area types config data set successfully');
      } else {
        console.warn('⚠️ No area types items in response:', response);
        setAreaTypesConfigData([]);
      }
    } catch (err) {
      console.error('❌ Error fetching Area Types Configuration:', err);
      const status = err?.status;
      const msg =
        status === 400
          ? 'Bad request while loading area types configuration.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while loading area types configuration.'
                : 'Failed to load area types configuration.';
      setAreaTypesConfigError(msg);
      setAreaTypesConfigData([]);
    } finally {
      setIsLoadingAreaTypesConfig(false);
    }
  };

  // Save Area Types Configuration handler
  const handleSaveAreaTypesConfiguration = async (formData: {
    [key: string]: any;
  }): Promise<void> => {
    console.log('🎯 === SAVE AREA TYPES CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      toast({
        title: 'Error',
        description: 'Unable to determine insurer ID or product ID.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingAreaTypesConfig(true);

    try {
      // Transform form data to API format
      const items = Object.keys(formData).map((areaTypeName, index) => {
        const areaTypeData = formData[areaTypeName];
        return {
          name: areaTypeName,
          pricing_type: (areaTypeData?.pricingType === 'fixed' ? 'FIXED_RATE' : 'PERCENTAGE') as
            | 'FIXED_RATE'
            | 'PERCENTAGE',
          value: Number(areaTypeData?.value || 0),
          quote_option: (areaTypeData?.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE') as
            | 'NO_QUOTE'
            | 'AUTO_QUOTE',
          display_order: index + 1,
          is_active: true,
        };
      });

      const requestPayload: SaveAreaTypesRequest = {
        area_types_config: { items },
      };

      console.log('🔍 Request payload:', requestPayload);

      // Determine whether to use POST or PATCH based on existing data
      const hasExistingData = areaTypesConfigData && areaTypesConfigData.length > 0;
      console.log('🔍 Has existing data:', hasExistingData);
      console.log('🔍 Using API method:', hasExistingData ? 'PATCH' : 'POST');

      let response: SaveAreaTypesResponse;

      if (hasExistingData) {
        // Use PATCH for existing data
        response = await updateAreaTypesConfiguration(insurerId, String(productId), requestPayload);
      } else {
        // Use POST for new data
        response = await createAreaTypesConfiguration(insurerId, String(productId), requestPayload);
      }

      console.log('✅ API Response:', response);

      // Refresh the configuration data
      await fetchAreaTypesConfig();

      toast({
        title: 'Success',
        description: response?.message || 'Area types configuration saved successfully.',
      });

      console.log('🎯 === SAVE AREA TYPES CONFIGURATION SUCCESS ===');
    } catch (err) {
      console.error('❌ Error saving area types configuration:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to save area types configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingAreaTypesConfig(false);
    }
  };

  // Save Subcontractor Types Configuration handler with GET-then-POST/PATCH logic
  const handleSaveSubcontractorTypesConfiguration = async (formData: {
    [key: string]: any;
  }): Promise<void> => {
    console.log('🎯 === SAVE SUBCONTRACTOR TYPES CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      toast({
        title: 'Error',
        description: 'Unable to determine insurer ID or product ID.',
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ IDs validated:', { insurerId, productId });
    setIsSavingSubcontractorTypesConfig(true);

    try {
      // Build request payload from form data
      const items = Object.entries(formData).map(
        ([subcontractorTypeName, subcontractorTypeFormData], index) => {
          console.log(
            `📝 Processing subcontractor type "${subcontractorTypeName}":`,
            subcontractorTypeFormData,
          );

          const item = {
            name: subcontractorTypeName,
            pricing_type: (subcontractorTypeFormData.pricingType === 'fixed'
              ? 'FIXED_RATE'
              : 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED_RATE',
            value: Number(subcontractorTypeFormData.value || 0),
            quote_option: (subcontractorTypeFormData.quoteOption === 'no-quote'
              ? 'NO_QUOTE'
              : 'AUTO_QUOTE') as 'AUTO_QUOTE' | 'NO_QUOTE',
            display_order: index + 1,
            is_active: true,
          };

          console.log(`✅ Mapped item for "${subcontractorTypeName}":`, item);
          return item;
        },
      );

      const requestPayload: SaveSubcontractorTypesConfigRequest = {
        subcontractor_types_config: {
          items,
        },
      };

      console.log('🔍 Final request payload:', JSON.stringify(requestPayload, null, 2));

      // Determine if this is a POST or PATCH based on existing data
      const hasExistingData =
        subcontractorTypesConfigData && subcontractorTypesConfigData.length > 0;
      console.log('🔍 Has existing data?', hasExistingData);
      console.log('🔍 Existing data:', subcontractorTypesConfigData);

      let response: SaveSubcontractorTypesConfigResponse;

      if (hasExistingData) {
        console.log('🔄 Calling PATCH API (update existing)...');
        response = await updateSubcontractorTypesConfiguration(
          insurerId,
          String(productId),
          requestPayload,
        );
        console.log('✅ PATCH Response:', response);

        toast({
          title: 'Success',
          description: 'Subcontractor types configuration updated successfully!',
          variant: 'default',
        });
      } else {
        console.log('🆕 Calling POST API (create new)...');
        response = await createSubcontractorTypesConfiguration(
          insurerId,
          String(productId),
          requestPayload,
        );
        console.log('✅ POST Response:', response);

        toast({
          title: 'Success',
          description: 'Subcontractor types configuration created successfully!',
          variant: 'default',
        });
      }

      // Update state with response data
      if (response.data?.items) {
        console.log('🔄 Updating subcontractor types config data with response...');
        setSubcontractorTypesConfigData(response.data.items);
        console.log('✅ State updated with:', response.data.items);
      }
    } catch (err) {
      console.error('❌ Error saving Subcontractor Types Configuration:', err);
      const status = err?.status;
      const msg =
        status === 400
          ? 'Bad request while saving subcontractor types configuration.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while saving subcontractor types configuration.'
                : 'Failed to save subcontractor types configuration.';

      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSavingSubcontractorTypesConfig(false);
      console.log('🎯 === SAVE SUBCONTRACTOR TYPES CONFIGURATION COMPLETED ===');
    }
  };

  // Save Regions Configuration handler with GET-then-POST/PATCH logic
  const handleSaveRegionsConfiguration = async (formData: {
    [key: string]: any;
  }): Promise<void> => {
    console.log('🎯 === SAVE REGIONS CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      toast({
        title: 'Error',
        description: 'Unable to determine insurer ID or product ID.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingRegionsConfig(true);

    try {
      // Build request payload from form data
      const items: SaveRegionsConfigRequest['regions_config']['items'] = [];

      // Get the regions metadata to know which regions to include
      console.log('🔍 Building payload from form data and regions metadata...');
      console.log('🔍 Regions data:', regionsData);
      console.log('🔍 Form data:', formData);

      regionsData.forEach((regionName: string, index: number) => {
        const regionFormData = formData[regionName];
        console.log(`🔍 Processing region "${regionName}":`, regionFormData);

        if (regionFormData) {
          const item = {
            name: regionName,
            pricing_type: (regionFormData.pricingType === 'fixed' ? 'FIXED_RATE' : 'PERCENTAGE') as
              | 'PERCENTAGE'
              | 'FIXED_RATE',
            value: Number(regionFormData.value || 0),
            quote_option: (regionFormData.quoteOption === 'no-quote'
              ? 'NO_QUOTE'
              : 'AUTO_QUOTE') as 'AUTO_QUOTE' | 'NO_QUOTE',
            display_order: index + 1,
            is_active: true,
          };

          items.push(item);
          console.log(`✅ Added item for "${regionName}":`, item);
        } else {
          console.log(`⚠️ No form data found for "${regionName}", using defaults`);
          // Add default values for regions without form data
          const item = {
            name: regionName,
            pricing_type: 'PERCENTAGE' as const,
            value: 1,
            quote_option: 'AUTO_QUOTE' as const,
            display_order: index + 1,
            is_active: true,
          };

          items.push(item);
        }
      });

      const requestPayload: SaveRegionsConfigRequest = {
        regions_config: {
          items: items,
        },
      };

      console.log('🔍 Request payload:', requestPayload);

      // Determine if we should POST or PATCH based on existing data
      const hasExistingData = regionsConfigData && regionsConfigData.length > 0;
      console.log('🔍 Has existing data:', hasExistingData);

      let response: SaveRegionsConfigResponse;
      if (hasExistingData) {
        console.log('📡 Calling PATCH API...');
        response = await updateRegionsConfiguration(insurerId, String(productId), requestPayload);
      } else {
        console.log('📡 Calling POST API...');
        response = await createRegionsConfiguration(insurerId, String(productId), requestPayload);
      }

      console.log('✅ API Response:', response);

      // Update the config data with the response
      if (response.data?.items) {
        setRegionsConfigData(response.data.items);
      }

      toast({
        title: 'Success',
        description: response.message || 'Regions configuration saved successfully.',
      });

      console.log('🎯 === SAVE REGIONS CONFIGURATION COMPLETED ===');
    } catch (err) {
      console.error('❌ Error saving Regions Configuration:', err);
      const status = err?.status;
      const msg =
        status === 400
          ? 'Invalid data while saving regions configuration.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while saving regions configuration.'
                : err?.message || 'Failed to save regions configuration.';

      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSavingRegionsConfig(false);
    }
  };

  // Save Countries Configuration handler with GET-then-POST/PATCH logic
  const handleSaveCountriesConfiguration = async (formData: {
    [key: string]: any;
  }): Promise<void> => {
    console.log('🎯 === SAVE COUNTRIES CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      toast({
        title: 'Error',
        description: 'Unable to determine insurer ID or product ID.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingCountriesConfig(true);

    try {
      // Build request payload from form data
      const items: SaveCountriesConfigRequest['countries_config']['items'] = [];

      // Get the countries metadata to know which countries to include
      console.log('🔍 Building payload from form data and countries metadata...');
      console.log('🔍 Countries data:', countriesData);
      console.log('🔍 Form data:', formData);

      countriesData.forEach((countryName: string) => {
        const countryFormData = formData[countryName];
        console.log(`🔍 Processing country "${countryName}":`, countryFormData);

        if (countryFormData) {
          // Check if this country uses 'name' field (like Kuwait) or 'country' field
          const isKuwait = countryName === 'Kuwait';

          const item: any = {
            pricing_type: countryFormData.pricingType === 'fixed' ? 'FIXED_RATE' : 'PERCENTAGE',
            value: Number(countryFormData.value || 0),
            quote_option: countryFormData.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE',
          };

          // Add the appropriate field based on country
          if (isKuwait) {
            item.name = countryName;
          } else {
            item.country = countryName;
          }

          items.push(item);
          console.log(`✅ Added item for "${countryName}":`, item);
        } else {
          console.log(`⚠️ No form data found for "${countryName}", using defaults`);
          // Add default values for countries without form data
          const isKuwait = countryName === 'Kuwait';
          const item: any = {
            pricing_type: 'PERCENTAGE',
            value: 1,
            quote_option: 'AUTO_QUOTE',
          };

          if (isKuwait) {
            item.name = countryName;
          } else {
            item.country = countryName;
          }

          items.push(item);
        }
      });

      const requestPayload: SaveCountriesConfigRequest = {
        countries_config: {
          items: items,
        },
      };

      console.log('🔍 Request payload:', requestPayload);

      // Determine if we should POST or PATCH based on existing data
      const hasExistingData = countriesConfigData && countriesConfigData.length > 0;
      console.log('🔍 Has existing data:', hasExistingData);

      let response: SaveCountriesConfigResponse;
      if (hasExistingData) {
        console.log('📡 Calling PATCH API...');
        response = await updateCountriesConfiguration(insurerId, String(productId), requestPayload);
      } else {
        console.log('📡 Calling POST API...');
        response = await createCountriesConfiguration(insurerId, String(productId), requestPayload);
      }

      console.log('✅ API Response:', response);

      // Update the config data with the response
      if (response.data?.items) {
        setCountriesConfigData(response.data.items);
      }

      toast({
        title: 'Success',
        description: response.message || 'Countries configuration saved successfully.',
      });

      console.log('🎯 === SAVE COUNTRIES CONFIGURATION COMPLETED ===');
    } catch (err) {
      console.error('❌ Error saving Countries Configuration:', err);
      const status = err?.status;
      const msg =
        status === 400
          ? 'Invalid data while saving countries configuration.'
          : status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'Forbidden. You do not have access.'
              : status >= 500
                ? 'Server error while saving countries configuration.'
                : err?.message || 'Failed to save countries configuration.';

      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSavingCountriesConfig(false);
    }
  };

  // Save Construction Types Configuration handler with GET-then-POST/PATCH logic
  const handleSaveConstructionTypesConfiguration = async (formData): Promise<void> => {
    console.log('🎯 === SAVE CONSTRUCTION TYPES CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      toast({
        title: 'Error',
        description: 'Unable to determine insurer ID or product ID.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingConstructionTypesConfig(true);

    try {
      // Build the request payload from form data
      const items: ConstructionTypeConfigItem[] = [];
      let displayOrder = 1;

      // Convert form data to API format
      Object.entries(formData).forEach(([name, data]: any) => {
        if (data && typeof data === 'object') {
          items.push({
            name: name,
            pricing_type: data.pricingType === 'fixed' ? 'FIXED_RATE' : 'PERCENTAGE',
            value: parseFloat(data.value) || 0,
            quote_option: data.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE',
            display_order: displayOrder++,
            is_active: true,
          });
        }
      });

      const requestPayload: SaveConstructionTypesConfigRequest = {
        construction_types_config: {
          items: items,
        },
      };

      console.log('🔍 Request payload:', requestPayload);

      // Determine if we should POST or PATCH based on existing data
      const hasExistingData = constructionTypesConfigData && constructionTypesConfigData.length > 0;
      console.log('🔍 Has existing data:', hasExistingData);

      let response: SaveConstructionTypesConfigResponse;

      if (hasExistingData) {
        console.log('🔄 Updating existing configuration (PATCH)...');
        response = await updateConstructionTypesConfiguration(
          insurerId,
          String(productId),
          requestPayload,
        );
      } else {
        console.log('🆕 Creating new configuration (POST)...');
        response = await createConstructionTypesConfiguration(
          insurerId,
          String(productId),
          requestPayload,
        );
      }

      console.log('✅ Save successful:', response);

      // Update local state with the response
      if (response.data?.items) {
        setConstructionTypesConfigData(response.data.items);
      }

      toast({
        title: 'Success',
        description: response.message || 'Construction types configuration saved successfully.',
      });
    } catch (err) {
      console.error('❌ Save failed:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save construction types configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingConstructionTypesConfig(false);
    }
  };

  // Save Quote Coverage handler with POST/PATCH logic and strict validation
  const handleSaveQuoteCoverage = async (formValues?: {
    backdateWindow: number;
    countryIds: string[];
    regionIds: string[];
    zoneIds: string[];
  }): Promise<void> => {
    console.log('🎯 === SAVE QUOTE COVERAGE STARTED ===');

    try {
      // Step 1: Validate required data
      const insurerId = getInsurerCompanyId();
      const productId = product?.id;

      if (!productId) {
        console.error('❌ Missing product ID');
        toast({
          title: 'Error',
          description: 'Unable to determine product ID. Please refresh the page.',
          variant: 'destructive',
        });
        return;
      }

      // Step 2: Set loading state
      setIsSavingQuoteConfig(true);

      // Step 3: Extract form values and checkbox selections from UI stat
      const backdateDays =
        typeof formValues?.backdateWindow === 'number'
          ? formValues.backdateWindow
          : Number(quoteConfig.details.backdateWindow || 0);

      const selectedCountries = Array.isArray(quoteConfig.details.countries)
        ? quoteConfig.details.countries
        : [];
      const selectedRegions = Array.isArray(quoteConfig.details.regions)
        ? quoteConfig.details.regions
        : [];
      const selectedZones = Array.isArray(quoteConfig.details.zones)
        ? quoteConfig.details.zones
        : [];

      // Step 4: Clean and validate checkbox data
      const cleanCountries = selectedCountries.filter(
        (country) => typeof country === 'string' && country.trim().length > 0,
      );
      const cleanRegions = selectedRegions.filter(
        (region) => typeof region === 'string' && region.trim().length > 0,
      );
      const cleanZones = selectedZones.filter(
        (zone) => typeof zone === 'string' && zone.trim().length > 0,
      );

      // Step 5: STRICT CROSS-CONTAMINATION CHECKS

      // Check if any regions are in countries array
      const regionsInCountries = cleanCountries.filter((country) => cleanRegions.includes(country));

      // Check if any zones are in countries array
      const zonesInCountries = cleanCountries.filter((country) => cleanZones.includes(country));

      // Check if any zones are in regions array
      const zonesInRegions = cleanRegions.filter((region) => cleanZones.includes(region));

      if (regionsInCountries.length > 0) {
        console.error(
          '❌ CROSS-CONTAMINATION DETECTED: Regions found in countries array:',
          regionsInCountries,
        );
        toast({
          title: 'Validation Error',
          description: `Cross-contamination detected: ${regionsInCountries.join(
            ', ',
          )} should not be in countries. Please check your selections.`,
          variant: 'destructive',
        });
        return;
      }

      if (zonesInCountries.length > 0) {
        console.error(
          '❌ CROSS-CONTAMINATION DETECTED: Zones found in countries array:',
          zonesInCountries,
        );
        toast({
          title: 'Validation Error',
          description: `Cross-contamination detected: ${zonesInCountries.join(
            ', ',
          )} should not be in countries. Please check your selections.`,
          variant: 'destructive',
        });
        return;
      }

      if (zonesInRegions.length > 0) {
        console.error(
          '❌ CROSS-CONTAMINATION DETECTED: Zones found in regions array:',
          zonesInRegions,
        );
        toast({
          title: 'Validation Error',
          description: `Cross-contamination detected: ${zonesInRegions.join(
            ', ',
          )} should not be in regions. Please check your selections.`,
          variant: 'destructive',
        });
        return;
      }

      //   console.log("✅ Cross-contamination validation passed");
      //   console.log(quoteConfig);
      // Step 6: Build API request payload using IDs instead of labels
      const countryIds: any = Array.isArray(formValues?.countryIds)
        ? formValues!.countryIds
        : Array.isArray(quoteConfig.details.countryIds)
          ? quoteConfig.details.countryIds
          : [];
      const regionIds: any = Array.isArray(formValues?.regionIds)
        ? formValues!.regionIds
        : Array.isArray(quoteConfig.details.regionIds)
          ? quoteConfig.details.regionIds
          : [];
      const zoneIds: any = Array.isArray(formValues?.zoneIds)
        ? formValues!.zoneIds
        : Array.isArray(quoteConfig.details.zoneIds)
          ? quoteConfig.details.zoneIds
          : [];
      const cleanCountryIds: any = countryIds.filter(
        (id) => typeof id === 'string' && id.trim().length > 0,
      );
      const cleanRegionIds: any = regionIds.filter(
        (id) => typeof id === 'string' && id.trim().length > 0,
      );
      const cleanZoneIds = zoneIds.filter((id) => typeof id === 'string' && id.trim().length > 0);

      const requestPayload: SaveQuoteCoverageRequest = {
        productId: productId,
        backdateWindowDays: backdateDays,
        geography: {
          countries: cleanCountryIds,
          regions: cleanRegionIds,
          zones: cleanZoneIds,
        },
      };

      console.log('📦 Final API Request Payload:', requestPayload);
      let apiResponse;
      apiResponse = await saveQuoteCoverage(String(productId), requestPayload);

      // Step 8: Success handling

      toast({
        title: 'Success',
        description: hasQuoteConfigData
          ? 'Quote coverage updated successfully!'
          : 'Quote coverage saved successfully!',
      });

      // Mark as having data for future PATCH calls
      setHasQuoteConfigData(true);
    } catch (error) {
      // Step 9: Error handling with specific error messages
      console.error('❌ Save Quote Coverage Error:', error);

      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save quote coverage configuration.',
        variant: 'destructive',
      });
    } finally {
      // Step 10: Always reset loading state
      console.log('⏳ Setting loading state to FALSE...');
      setIsSavingQuoteConfig(false);
      console.log('🎯 === SAVE QUOTE COVERAGE COMPLETED ===');
    }
  };

  const [quoteCoverageData, setQuoteCoverageData] = useState<QuoteCoverageResponse | null>(null);
  const [isLoadingQuoteCoverage, setIsLoadingQuoteCoverage] = useState(false);
  const [quoteCoverageError, setQuoteCoverageError] = useState<string | null>(null);
  useEffect(() => {
    const pid = product?.id;
    if (!pid || activeTab !== 'quote-config') return;
    let mounted = true;
    (async () => {
      try {
        setIsLoadingQuoteCoverage(true);
        setQuoteCoverageError(null);
        const resp = await getQuoteCoverage(String(pid));
        if (!mounted) return;
        setQuoteCoverageData(resp || null);
        setHasQuoteConfigData(Boolean(resp));
      } catch (err) {
        if (!mounted) return;
        console.error('❌ Failed to load quote coverage:', err);
      } finally {
        if (mounted) setIsLoadingQuoteCoverage(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [product?.id, activeTab]);

  // Handle saving consultant roles configuration
  const handleSaveConsultantRolesConfiguration = async (formData: { [key: string]: any }) => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      toast({
        title: 'Error',
        description: 'Unable to determine insurer ID or product ID.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingConsultantRolesConfig(true);

    try {
      // Import the API function
      const { saveConsultantRoles } = await import('@/features/insurers/api/insurers');

      // Transform form data to API format
      const consultantRolesData = Object.entries(formData || {}).map(([name, config]) => ({
        name,
        pricing_type: config.pricingType === 'fixed' ? 'FIXED_RATE' : 'PERCENTAGE',
        value: parseFloat(config.value || '0'),
        quote_option: config.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'QUOTE',
        display_order: 1,
        is_active: true,
      }));

      const requestBody: any = {
        consultant_roles_config: {
          items: consultantRolesData,
        },
      };

      console.log('💾 Saving consultant roles configuration:', requestBody);

      await saveConsultantRoles(insurerId, String(productId), requestBody);

      toast({
        title: 'Success',
        description: 'Consultant roles configuration saved successfully.',
      });

      // Refresh the data
      await fetchConsultantRolesConfig();
    } catch (error) {
      console.error('❌ Error saving consultant roles configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save consultant roles configuration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingConsultantRolesConfig(false);
    }
  };

  // Placeholder for other save operations
  const saveConfiguration = () => {
    toast({
      title: 'Configuration Saved',
      description: 'Configuration has been saved successfully.',
    });
  };

  const handleConfirmSave = () => {
    toast({
      title: 'Configuration Saved',
      description: `Product configuration for ${product.name} has been successfully saved.`,
    });
    setIsConfirmSaveDialogOpen(false);
    setHasUnsavedChanges(false);
  };

  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  const handleTabChange = async (newTab: string) => {
    const nextTab = newTab === 'quote-config' ? 'pricing' : newTab;
    setActiveTab(nextTab);
    if (nextTab === 'pricing') {
      setActivePricingTab('base-rates');
      await fetchBaseRatesMasters();
    }
  };

  const handleBackNavigation = () => {
    navigate(`${basePath}/product-config`);
  };

  // Helper function to get the next order number
  const getNextOrder = (items) => {
    return Math.max(...items.map((item) => item.order), 0) + 1;
  };
  const mapRequiredDocuments = (
    resp: Array<ProductRequiredDocumentItem | ProductEndorsementDocumentItem>,
  ): RequiredDocumentItem[] => {
    const list = Array.isArray(resp) ? resp : [];
    const sorted = list
      .slice()
      .sort(
        (a, b) =>
          Number((a as ProductRequiredDocumentItem).displayOrder || 0) -
          Number((b as ProductRequiredDocumentItem).displayOrder || 0),
      );
    const mapped = sorted.map((d) => ({
      id: String(d.id),
      label: d.displayLabel,
      description: d.description || '',
      required: !!d.isRequired,
      active: !!d.isActive,
      order: Number((d as ProductRequiredDocumentItem).displayOrder) + 1,
      aiQuestionValidation: !!d.aiQuestionValidation,
      referToUnderWrtiterAllowed: !!d.referToUnderWrtiterAllowed,
      validationQuestions:
        d.validationQuestions?.map((question) => ({
          id: question.id,
          question: question.question,
        })) ?? [emptyValidationQuestion()],
      template: d.templateFile
        ? {
          name: String(d.originalFilename ?? '—'),
          size: '—',
          url: '',
        }
        : null,
    })) as RequiredDocumentItem[];
    return mapped;
  };

  const removeQuestionLocally = (
    questions: Array<{ id?: string; question: string }>,
    index: number,
  ) =>
    questions.length > 1
      ? questions.filter((_, questionIndex) => questionIndex !== index)
      : [emptyValidationQuestion()];

  const deleteValidationQuestionWithApi = async ({
    productId,
    documentId,
    question,
    index,
    deleteQuestion,
    setDocument,
    errorSetter,
  }: {
    productId: string | number;
    documentId: string;
    question: { id?: string; question: string };
    index: number;
    deleteQuestion: (
      productId: string | number,
      documentId: string,
      questionId: string,
    ) => Promise<unknown>;
    setDocument: React.Dispatch<React.SetStateAction<RequiredDocumentItem | null>>;
    errorSetter: (message: string | null) => void;
  }) => {
    if (!question.id) {
      setDocument((prev) =>
        prev
          ? {
            ...prev,
            validationQuestions: removeQuestionLocally(prev.validationQuestions, index),
          }
          : prev,
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Validation Question',
      description: 'Are you sure you want to delete this validation question? This action cannot be undone.',
      action: () => {
        (async () => {
          try {
            setDeletingValidationQuestionIds((prev) => [...prev, question.id as string]);
            errorSetter(null);
            await deleteQuestion(productId, documentId, question.id);
            setDocument((prev) =>
              prev
                ? {
                  ...prev,
                  validationQuestions: removeQuestionLocally(prev.validationQuestions, index),
                }
                : prev,
            );
            toast({
              title: 'Question Deleted',
              description: 'Validation question has been removed.',
            });
          } catch (err: unknown) {
            const message = (err as { message?: string } | null)?.message;
            errorSetter(message || 'Failed to delete validation question.');
            toast({
              title: 'Error',
              description: message || 'Failed to delete validation question.',
              variant: 'destructive',
            });
          } finally {
            setDeletingValidationQuestionIds((prev) =>
              prev.filter((questionId) => questionId !== question.id),
            );
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          }
        })();
      },
    });
  };

  // Handle adding new document

  // Handle editing document
  const handleEditDocument = async () => {
    if (!editingDocument) return;

    if (!product.id) return;

    try {
      console.log('🚀 Updating required document:', editingDocument);
      setIsLoadingRequiredDocs(true);
      setRequiredDocsError(null);

      const templateFile =
        editingDocument.template &&
          editingDocument.template.file &&
          editingDocument.template.file instanceof File
          ? editingDocument.template.file
          : undefined;

      // Check if we need to delete the template
      const originalDoc = requiredDocuments.find(
        (d) => String(d.id) === String(editingDocument.id),
      );
      const shouldDeleteTemplate = originalDoc?.template && !editingDocument.template;

      if (shouldDeleteTemplate) {
        await deleteProductRequiredDocumentTemplate(product.id, String(editingDocument.id));
      }

      // Call the UPDATE API with product-level endpoint
      await updateProductRequiredDocument(product.id, String(editingDocument.id), {
        display_label: editingDocument.label,
        description: editingDocument.description || '',
        is_required: !!editingDocument.required,
        is_active: !!editingDocument.active,
        ai_question_validation: !!editingDocument.aiQuestionValidation,
        validation_questions: buildValidationQuestionsPayload(
          editingDocument.aiQuestionValidation ? editingDocument.validationQuestions : [],
        ),
        template_file: templateFile,
      });

      console.log('✅ Document updated successfully');

      const resp = await getProductRequiredDocuments(product.id as string);
      setRequiredDocuments(mapRequiredDocuments(resp));

      setEditingDocument(null);
      toast({
        title: 'Document Updated',
        description: `"${editingDocument.label}" has been updated successfully!`,
        variant: 'default',
      });
    } catch (err: unknown) {
      console.error('❌ Error updating required document:', err);
      const e = err as { status?: number; message?: string };
      const status = e?.status;
      const message = e?.message;

      let errorMessage = 'Failed to update required document.';
      if (status === 400) errorMessage = message || 'Bad request. Please check the data.';
      else if (status === 401) errorMessage = 'Unauthorized. Please log in again.';
      else if (status === 403) errorMessage = 'Forbidden. You do not have permission.';
      else if (status && status >= 500) errorMessage = 'Server error. Please try again later.';
      else if (message) errorMessage = message;

      setRequiredDocsError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRequiredDocs(false);
    }
  };

  // Endorsement documents: edit
  const handleEditEndorsementDocument = async () => {
    if (!editingEndorsementDocument) return;
    if (!product.id) return;

    try {
      setIsLoadingEndorsementDocs(true);
      setEndorsementDocsError(null);

      const templateFile =
        editingEndorsementDocument.template &&
          editingEndorsementDocument.template.file &&
          editingEndorsementDocument.template.file instanceof File
          ? editingEndorsementDocument.template.file
          : undefined;

      const originalDoc = endorsementDocuments.find(
        (d) => String(d.id) === String(editingEndorsementDocument.id),
      );
      const shouldDeleteTemplate = originalDoc?.template && !editingEndorsementDocument.template;

      if (shouldDeleteTemplate) {
        await deleteProductEndorsementDocumentTemplate(
          product.id,
          String(editingEndorsementDocument.id),
        );
      }

      await updateProductEndorsementDocument(product.id, String(editingEndorsementDocument.id), {
        display_label: editingEndorsementDocument.label,
        description: editingEndorsementDocument.description || '',
        is_required: !!editingEndorsementDocument.required,
        is_active: !!editingEndorsementDocument.active,
        ai_question_validation: !!editingEndorsementDocument.aiQuestionValidation,
        validation_questions: buildValidationQuestionsPayload(
          editingEndorsementDocument.aiQuestionValidation
            ? editingEndorsementDocument.validationQuestions
            : [],
        ),
        template_file: templateFile,
      });

      const resp = await getProductEndorsementDocuments(product.id as string);
      setEndorsementDocuments(mapRequiredDocuments(resp as ProductEndorsementDocumentItem[]));

      setEditingEndorsementDocument(null);
      toast({
        title: 'Document Updated',
        description: `"${editingEndorsementDocument.label}" has been updated successfully!`,
      });
    } catch (err) {
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      if (status === 400)
        setEndorsementDocsError(message || 'Bad request while updating endorsement document.');
      else if (status === 401) setEndorsementDocsError('Unauthorized. Please log in again.');
      else if (status === 403)
        setEndorsementDocsError("You don't have access to endorsement documents.");
      else if (status && status >= 500)
        setEndorsementDocsError('Server error. Please try again later.');
      else setEndorsementDocsError(message || 'Failed to update endorsement document.');
    } finally {
      setIsLoadingEndorsementDocs(false);
    }
  };

  const handleEditUnderwritingDocument = async () => {
    if (!editingUnderwritingDocument) return;
    if (!product.id) return;

    try {
      setIsLoadingUnderwritingDocs(true);
      setUnderwritingDocsError(null);

      await updateProductUnderwritingDocument(product.id, String(editingUnderwritingDocument.id), {
        display_label: editingUnderwritingDocument.label,
        description: editingUnderwritingDocument.description || '',
        is_required: !!editingUnderwritingDocument.required,
        is_active: !!editingUnderwritingDocument.active,
        ai_question_validation: !!editingUnderwritingDocument.aiQuestionValidation,
        refer_to_under_wrtiter_allowed:
          editingUnderwritingDocument.aiQuestionValidation
            ? !!editingUnderwritingDocument.referToUnderWrtiterAllowed
            : false,
        validation_questions: buildValidationQuestionsPayload(
          editingUnderwritingDocument.aiQuestionValidation
            ? editingUnderwritingDocument.validationQuestions
            : [],
        ),
      });

      const resp = await getProductUnderwritingDocuments(product.id as string);
      setUnderwritingDocuments(mapRequiredDocuments(resp));

      setEditingUnderwritingDocument(null);
      toast({
        title: 'Document Updated',
        description: `"${editingUnderwritingDocument.label}" has been updated successfully!`,
      });
    } catch (err) {
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      if (status === 400)
        setUnderwritingDocsError(message || 'Bad request while updating underwriting document.');
      else if (status === 401) setUnderwritingDocsError('Unauthorized. Please log in again.');
      else if (status === 403)
        setUnderwritingDocsError("You don't have access to underwriting documents.");
      else if (status && status >= 500)
        setUnderwritingDocsError('Server error. Please try again later.');
      else setUnderwritingDocsError(message || 'Failed to update underwriting document.');
    } finally {
      setIsLoadingUnderwritingDocs(false);
    }
  };

  const handleViewDocument = async (doc) => {
    if (!product.id || !doc.id) return;
    try {
      const { signedUrl } = await getProductRequiredDocumentSignedUrl(product.id, String(doc.id));
      window.open(signedUrl, '_blank');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to open document preview.',
        variant: 'destructive',
      });
    }
  };

  // Toggle document active status (persist via API)
  const toggleDocumentActive = async (docId: number | string) => {
    if (!product.id) return;
    try {
      setIsLoadingRequiredDocs(true);
      setRequiredDocsError(null);
      const target = requiredDocuments.find((d) => String(d.id) === String(docId));
      const nextActive = target ? !target.active : true;
      await updateProductRequiredDocument(product.id, String(docId), {
        is_active: nextActive,
      });
      const resp = await getProductRequiredDocuments(product.id as string);
      const list = Array.isArray(resp) ? resp : [];
      const sorted = list
        .slice()
        .sort(
          (a: ProductRequiredDocumentItem, b: ProductRequiredDocumentItem) =>
            Number(a.displayOrder || 0) - Number(b.displayOrder || 0),
        );
      const mapped = sorted.map((d: ProductRequiredDocumentItem) => ({
        id: String(d.id),
        label: d.displayLabel,
        description: d.description || '',
        required: !!d.isRequired,
        active: !!d.isActive,
        order: Number(d.displayOrder) + 1,
        aiQuestionValidation: !!d.aiQuestionValidation,
        validationQuestions:
          d.validationQuestions?.map((question) => ({
            id: question.id,
            question: question.question,
          })) ?? [emptyValidationQuestion()],
        template: d.templateFile
          ? {
            name: String(d.originalFilename ?? '—'),
            size: '—',
            url: '',
          }
          : null,
      })) as RequiredDocumentItem[];
      setRequiredDocuments(mapped);
    } catch (err: unknown) {
      const e = err as { message?: string };
      const message = e?.message as string | undefined;
      setRequiredDocsError(message || 'Failed to update document status.');
    } finally {
      setIsLoadingRequiredDocs(false);
    }
  };

  const toggleEndorsementDocumentActive = async (docId: number | string) => {
    if (!product.id) return;
    try {
      setIsLoadingEndorsementDocs(true);
      setEndorsementDocsError(null);
      const target = endorsementDocuments.find((d) => String(d.id) === String(docId));
      const nextActive = target ? !target.active : true;
      await updateProductEndorsementDocument(product.id, String(docId), {
        is_active: nextActive,
      });
      const resp = await getProductEndorsementDocuments(product.id as string);
      setEndorsementDocuments(mapRequiredDocuments(resp as ProductEndorsementDocumentItem[]));
    } catch (err: unknown) {
      const e = err as { message?: string };
      const message = e?.message as string | undefined;
      setEndorsementDocsError(message || 'Failed to update endorsement document status.');
    } finally {
      setIsLoadingEndorsementDocs(false);
    }
  };

  const toggleUnderwritingDocumentActive = async (docId: number | string) => {
    if (!product.id) return;
    try {
      setIsLoadingUnderwritingDocs(true);
      setUnderwritingDocsError(null);
      const target = underwritingDocuments.find((d) => String(d.id) === String(docId));
      const nextActive = target ? !target.active : true;
      await updateProductUnderwritingDocument(product.id, String(docId), {
        is_active: nextActive,
      });
      const resp = await getProductUnderwritingDocuments(product.id as string);
      setUnderwritingDocuments(mapRequiredDocuments(resp));
    } catch (err: unknown) {
      const e = err as { message?: string };
      const message = e?.message as string | undefined;
      setUnderwritingDocsError(message || 'Failed to update underwriting document status.');
    } finally {
      setIsLoadingUnderwritingDocs(false);
    }
  };

  // Delete document (persist via API)
  const handleDeleteDocument = (docId: string) => {
    const doc = requiredDocuments.find((d) => d.id === docId);
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Document',
      description: `Are you sure you want to delete "${doc?.label}"? This action cannot be undone.`,
      action: () => {
        (async () => {
          if (!product.id) return;
          try {
            setIsLoadingRequiredDocs(true);
            setRequiredDocsError(null);
            await deleteProductRequiredDocument(product.id, String(docId));
            const resp = await getProductRequiredDocuments(product.id as string);
            const list = Array.isArray(resp) ? resp : [];
            const sorted = list
              .slice()
              .sort(
                (a: ProductRequiredDocumentItem, b: ProductRequiredDocumentItem) =>
                  Number(a.displayOrder || 0) - Number(b.displayOrder || 0),
              );
            const mapped = sorted.map((d: ProductRequiredDocumentItem) => ({
              id: String(d.id),
              label: d.displayLabel,
              description: d.description || '',
              required: !!d.isRequired,
              active: !!d.isActive,
              order: Number(d.displayOrder) + 1,
              aiQuestionValidation: !!d.aiQuestionValidation,
              validationQuestions:
                d.validationQuestions?.map((question) => ({
                  id: question.id,
                  question: question.question,
                })) ?? [emptyValidationQuestion()],
              template: d.templateFile
                ? {
                  name: String(d.originalFilename ?? '—'),
                  size: '—',
                  url: '',
                }
                : null,
            })) as RequiredDocumentItem[];
            setRequiredDocuments(mapped);
            toast({
              title: 'Document Deleted',
              description: 'The document has been removed from required documents.',
            });
          } catch (err: unknown) {
            const e = err as { message?: string };
            const message = e?.message as string | undefined;
            setRequiredDocsError(message || 'Failed to delete document.');
          } finally {
            setIsLoadingRequiredDocs(false);
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          }
        })();
      },
    });
  };

  const handleUnderwritingDeleteDocument = (docId: string) => {
    const doc = underwritingDocuments.find((d) => d.id === docId);
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Document',
      description: `Are you sure you want to delete "${doc?.label}"? This action cannot be undone.`,
      action: () => {
        (async () => {
          if (!product.id) return;
          try {
            setIsLoadingUnderwritingDocs(true);
            setUnderwritingDocsError(null);
            await deleteProductUnderwritingDocument(product.id, String(docId));
            const resp = await getProductUnderwritingDocuments(product.id as string);
            setUnderwritingDocuments(mapRequiredDocuments(resp));
            toast({
              title: 'Document Deleted',
              description: 'The document has been removed from underwriting documents.',
            });
          } catch (err: unknown) {
            const e = err as { message?: string };
            const message = e?.message as string | undefined;
            setUnderwritingDocsError(message || 'Failed to delete underwriting document.');
          } finally {
            setIsLoadingUnderwritingDocs(false);
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          }
        })();
      },
    });
  };

  // Handle template upload
  const handleTemplateUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (
      !file.type.includes('pdf') &&
      !file.type.includes('document') &&
      !file.type.includes('msword')
    ) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF, Word document, or image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    const template = {
      name: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      size: `${Math.round(file.size / 1024)} KB`,
      url: '',
      file,
    };

    if (isEdit && editingDocument) {
      setEditingDocument({
        ...editingDocument,
        template,
      });
    } else {
      setNewDocument((prev) => ({
        ...prev,
        template,
      }));
    }

    toast({
      title: 'Template Selected',
      description: `Template "${file.name}" is ready to be saved.`,
    });
  };

  // Remove template
  const removeTemplate = (isEdit: boolean = false) => {
    const templateName = isEdit ? editingDocument?.template?.name : newDocument?.template?.name;
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Template',
      description: `Are you sure you want to remove the template "${templateName}"?`,
      action: () => {
        if (isEdit && editingDocument) {
          setEditingDocument({ ...editingDocument, template: null });
        } else {
          setNewDocument((prev) => ({ ...prev, template: null }));
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Endorsement document template helpers
  const handleEndorsementTemplateUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !file.type.includes('pdf') &&
      !file.type.includes('document') &&
      !file.type.includes('msword')
    ) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF, Word document, or image file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    const template = {
      name: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      size: `${Math.round(file.size / 1024)} KB`,
      url: '',
      file,
    };

    if (isEdit && editingEndorsementDocument) {
      setEditingEndorsementDocument({
        ...editingEndorsementDocument,
        template,
      });
    } else {
      setNewEndorsementDocument((prev) => ({
        ...prev,
        template,
      }));
    }

    toast({
      title: 'Template Selected',
      description: `Template "${file.name}" is ready to be saved.`,
    });
  };

  const removeEndorsementTemplate = (isEdit: boolean = false) => {
    const templateName = isEdit
      ? editingEndorsementDocument?.template?.name
      : newEndorsementDocument?.template?.name;
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Template',
      description: `Are you sure you want to remove the template "${templateName}"?`,
      action: () => {
        if (isEdit && editingEndorsementDocument) {
          setEditingEndorsementDocument({ ...editingEndorsementDocument, template: null });
        } else {
          setNewEndorsementDocument((prev) => ({ ...prev, template: null }));
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const updateQuoteConfig = (section: string, field: string, value) => {
    markAsChanged();
    setQuoteConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const updateSubProjectEntry = (index: number, field: string, value: string | number) => {
    markAsChanged();
    setRatingConfig((prev) => ({
      ...prev,
      subProjectEntries: prev.subProjectEntries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  };

  const updateProjectRiskFactor = (category: string, key: string, value) => {
    markAsChanged();

    // Helper function to set nested object property using dot notation
    const setNestedProperty = (obj, path: string, value) => {
      const keys = path.split('.');
      const lastKey = keys.pop()!;
      const target = keys.reduce((current, key) => {
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        return current[key];
      }, obj);
      target[lastKey] = value;
      return obj;
    };

    setRatingConfig((prev) => {
      const newConfig = { ...prev };

      if (category === 'riskDefinition') {
        // Handle nested risk definition updates
        const projectRisk = newConfig.projectRisk as any;
        if (!projectRisk.riskDefinition) {
          projectRisk.riskDefinition = {};
        }
        const updatedRiskDefinition = { ...projectRisk.riskDefinition };
        setNestedProperty(updatedRiskDefinition, key, value);

        return {
          ...newConfig,
          projectRisk: {
            ...newConfig.projectRisk,
            riskDefinition: updatedRiskDefinition,
          },
        };
      } else if (category === 'locationHazardRates') {
        // Handle nested location hazard rates updates
        const projectRisk = newConfig.projectRisk as any;
        if (!projectRisk.locationHazardRates) {
          projectRisk.locationHazardRates = {};
        }
        const updatedLocationHazardRates = {
          ...projectRisk.locationHazardRates,
        };
        setNestedProperty(updatedLocationHazardRates, key, value);

        return {
          ...newConfig,
          projectRisk: {
            ...newConfig.projectRisk,
            locationHazardRates: updatedLocationHazardRates,
          },
        };
      } else {
        // Handle regular category updates (existing functionality)
        return {
          ...newConfig,
          projectRisk: {
            ...newConfig.projectRisk,
            [category]: {
              ...newConfig.projectRisk[category as keyof typeof newConfig.projectRisk],
              [key]: value,
            },
          },
        };
      }
    });
  };

  // Helper functions for duration and maintenance period loadings
  const addDurationLoading = () => {
    markAsChanged();
    const newId = Math.max(...ratingConfig.projectRisk.durationLoadings.map((d) => d.id), 0) + 1;
    setRatingConfig((prev) => ({
      ...prev,
      projectRisk: {
        ...prev.projectRisk,
        durationLoadings: [
          ...prev.projectRisk.durationLoadings,
          {
            id: newId,
            from: 0,
            to: 12,
            pricingType: 'percentage',
            value: 0,
            quoteOption: 'quote',
          },
        ],
      },
    }));
  };

  const removeDurationLoading = (id: number) => {
    const item = ratingConfig.projectRisk.durationLoadings.find((d) => d.id === id);
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Duration Loading',
      description: `Are you sure you want to remove the duration loading for "${item?.from}-${item?.to} months"?`,
      action: () => {
        markAsChanged();
        setRatingConfig((prev) => ({
          ...prev,
          projectRisk: {
            ...prev.projectRisk,
            durationLoadings: prev.projectRisk.durationLoadings.filter((d) => d.id !== id),
          },
        }));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const updateDurationLoading = (id: number, field: string, value) => {
    markAsChanged();
    setRatingConfig((prev) => ({
      ...prev,
      projectRisk: {
        ...prev.projectRisk,
        durationLoadings: prev.projectRisk.durationLoadings.map((d) =>
          d.id === id ? { ...d, [field]: value } : d,
        ),
      },
    }));
  };

  const addMaintenancePeriodLoading = () => {
    markAsChanged();
    const newId =
      Math.max(...ratingConfig.projectRisk.maintenancePeriodLoadings.map((m) => m.id), 0) + 1;
    setRatingConfig((prev) => ({
      ...prev,
      projectRisk: {
        ...prev.projectRisk,
        maintenancePeriodLoadings: [
          ...prev.projectRisk.maintenancePeriodLoadings,
          {
            id: newId,
            from: 0,
            to: 12,
            pricingType: 'percentage',
            value: 0,
            quoteOption: 'quote',
          },
        ],
      },
    }));
  };

  const removeMaintenancePeriodLoading = (id: number) => {
    const item = ratingConfig.projectRisk.maintenancePeriodLoadings.find((m) => m.id === id);
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Maintenance Period Loading',
      description: `Are you sure you want to remove the maintenance period loading for "${item?.from}-${item?.to} months"?`,
      action: () => {
        markAsChanged();
        setRatingConfig((prev) => ({
          ...prev,
          projectRisk: {
            ...prev.projectRisk,
            maintenancePeriodLoadings: prev.projectRisk.maintenancePeriodLoadings.filter(
              (m) => m.id !== id,
            ),
          },
        }));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const updateMaintenancePeriodLoading = (id: number, field: string, value) => {
    markAsChanged();
    setRatingConfig((prev) => ({
      ...prev,
      projectRisk: {
        ...prev.projectRisk,
        maintenancePeriodLoadings: prev.projectRisk.maintenancePeriodLoadings.map((m) =>
          m.id === id ? { ...m, [field]: value } : m,
        ),
      },
    }));
  };

  const updateContractorRiskEntry = (category: string, id: number, field: string, value) => {
    setRatingConfig((prev) => {
      const categoryData = prev.contractorRisk[category as keyof typeof prev.contractorRisk];
      // Only update if it's an array (new format)
      if (Array.isArray(categoryData)) {
        return {
          ...prev,
          contractorRisk: {
            ...prev.contractorRisk,
            [category]: categoryData.map((entry) =>
              entry.id === id ? { ...entry, [field]: value } : entry,
            ),
          },
        };
      }
      return prev;
    });
  };

  const addContractorRiskEntry = (category: string) => {
    setRatingConfig((prev) => {
      const categoryData = prev.contractorRisk[category as keyof typeof prev.contractorRisk];
      // Only add if it's an array (new format)
      if (Array.isArray(categoryData)) {
        const currentEntries = Array.isArray(categoryData) ? categoryData : [];
        // Use Date.now() for unique ID to avoid issues with empty arrays or duplicate IDs
        const newId =
          currentEntries.length > 0
            ? Math.max(...currentEntries.map((entry) => entry.id), 0) + 1
            : 1;
        return {
          ...prev,
          contractorRisk: {
            ...prev.contractorRisk,
            [category]: [
              ...currentEntries,
              {
                id: newId,
                from: 0,
                to: 0,
                pricingType: 'percentage',
                loadingDiscount: 0,
                quoteOption: 'quote',
              },
            ],
          },
        };
      }
      return prev;
    });
  };

  const removeContractorRiskEntry = (category: string, id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Entry',
      description: `Are you sure you want to remove this ${category
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()} entry?`,
      action: () => {
        setRatingConfig((prev) => {
          const categoryData = prev.contractorRisk[category as keyof typeof prev.contractorRisk];
          // Only remove if it's an array (new format)
          if (Array.isArray(categoryData)) {
            return {
              ...prev,
              contractorRisk: {
                ...prev.contractorRisk,
                [category]: categoryData.filter((entry) => entry.id !== id),
              },
            };
          }
          return prev;
        });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const updateCoverRequirement = useCallback((category: string, key: string, value: number) => {
    setRatingConfig((prev) => ({
      ...prev,
      coverRequirements: {
        ...prev.coverRequirements,
        [category]: {
          ...prev.coverRequirements[category as keyof typeof prev.coverRequirements],
          [key]: value,
        },
      },
    }));
  }, []);

  const updateCoverRequirementEntry = useCallback(
    (category: string, id: number, field: string, value) => {
      setRatingConfig((prev) => {
        const categoryData =
          prev.coverRequirements[category as keyof typeof prev.coverRequirements];
        // Only update if it's an array (new format)
        if (Array.isArray(categoryData)) {
          return {
            ...prev,
            coverRequirements: {
              ...prev.coverRequirements,
              [category]: categoryData.map((entry) =>
                entry.id === id ? { ...entry, [field]: value } : entry,
              ),
            },
          };
        }
        return prev;
      });
    },
    [],
  );
  const addCoverRequirementEntry = useCallback((category: string) => {
    setRatingConfig((prev) => {
      const categoryData = prev.coverRequirements[category as keyof typeof prev.coverRequirements];
      // Only add if it's an array (new format)
      if (Array.isArray(categoryData)) {
        const currentEntries = Array.isArray(categoryData) ? categoryData : [];
        // Generate unique ID across all categories to prevent conflicts
        const allEntries = Object.values(prev.coverRequirements)
          .flat()
          .filter(Array.isArray)
          .flat();
        const maxId =
          allEntries.length > 0 ? Math.max(...allEntries.map((entry: any) => entry.id || 0)) : 0;
        const newId = maxId + 1;

        let newEntry;

        if (category === 'subLimits') {
          newEntry = {
            id: newId,
            title: '',
            description: '',
            pricingType: 'fixed',
            value: 0,
          };
        } else if (category === 'deductibles') {
          newEntry = {
            id: newId,
            deductibleType: 'fixed',
            value: 0,
            loadingDiscount: 0,
            quoteOption: 'quote',
          };
        } else {
          newEntry = {
            id: newId,
            from: 0,
            to: 0,
            pricingType: 'percentage',
            loadingDiscount: 0,
            quoteOption: 'quote',
          };
        }

        return {
          ...prev,
          coverRequirements: {
            ...prev.coverRequirements,
            [category]: [...currentEntries, newEntry],
          },
        };
      }
      return prev;
    });
  }, []);

  const removeCoverRequirementEntry = useCallback((category: string, id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Entry',
      description: `Are you sure you want to remove this ${category
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()} entry?`,
      action: () => {
        setRatingConfig((prev) => {
          const categoryData =
            prev.coverRequirements[category as keyof typeof prev.coverRequirements];
          // Only remove if it's an array (new format)
          if (Array.isArray(categoryData)) {
            return {
              ...prev,
              coverRequirements: {
                ...prev.coverRequirements,
                [category]: categoryData.filter((entry) => entry.id !== id),
              },
            };
          }
          return prev;
        });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  const updateLimits = (key: string, value: number) => {
    setRatingConfig((prev) => ({
      ...prev,
      limits: {
        ...prev.limits,
        [key]: value,
      },
    }));
  };

  const addNewClause = async () => {
    if (!newClause.code || !newClause.title || !newClause.show) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // If Show is Mandatory, validate clause pricing rows: only block if BOTH limit AND value are filled but label is empty
    if (newClause.show === 'Mandatory') {
      const pricingRows = newClause.clausesPricing || [];
      const hasRowWithValueButNoLabel = pricingRows.some((p: any) => {
        const limitsHasValue = p.limits !== undefined && p.limits !== null && p.limits !== '' && String(p.limits).trim() !== '';
        const valueHasValue = Number(p.adjustmentValue) > 0;
        const labelEmpty = !p.label || String(p.label).trim() === '';
        return (limitsHasValue || valueHasValue) && labelEmpty;
      });
      if (hasRowWithValueButNoLabel) {
        toast({
          title: 'Validation failed',
          description: 'Please enter a label for each clause pricing entry before saving.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      if (!product.id) return;

      // Map UI -> API
      const payload: SaveProductCewDto = {
        clauseCode: newClause.code,
        title: newClause.title,
        purposeDescription: newClause.purposeDescription || '',
        type: toClauseTypeDto(newClause.type),
        showType: toShowTypeDto(newClause.show),
        adjustmentType: newClause.adjustmentType as AdjustmentType,
        adjustmentValue: newClause.adjustmentValue,
        clauseContent: newClause.purpose || newClause.wording || '',
        isActive: true,
        displayOrder: clausesData.length + 1,
        clausesPricing:
          newClause.show === 'Mandatory'
            ? (newClause.clausesPricing || [])
                .filter((p: any) => {
                  // Only send rows where the user has actually entered something
                  const limitsHasValue = p.limits !== undefined && p.limits !== null && p.limits !== '' && String(p.limits).trim() !== '';
                  const valueHasValue = Number(p.adjustmentValue) > 0;
                  const labelHasValue = p.label && String(p.label).trim() !== '';
                  return limitsHasValue || valueHasValue || labelHasValue;
                })
                .map((p: any) => ({
                  ...p,
                  type:
                    (p.type || 'percentage').toLowerCase() === 'fixed'
                      ? 'currency'
                      : (p.type || 'percentage').toLowerCase(),
                  adjustmentValue: parseFloat(String(p.adjustmentValue || 0)),
                }))
            : [],
        selectedCoverIds: newClause.selectedCoverIds || [],
      };

      const created = await saveProductCew(product.id as string, payload);
      const createdCoverIds = mapClauseSelectedCoverIdsFromApi(created);

      // Update UI list immediately
      setClausesData((prev) => [
        ...prev,
        {
          id: created.id,
          code: created.clauseCode,
          title: created.title,
          purposeDescription: created.purposeDescription,
          wording: created.clauseContent,
          type:
            created.type === 'EXCLUSION'
              ? 'Exclusion'
              : created.type === 'WARRANTY'
                ? 'Warranty'
                : 'Clause',
          show: created.showType === 'MANDATORY' ? 'Mandatory' : 'Optional',
          displayOrder: created.displayOrder ?? 0,
          active: created.isActive,
          adjustmentType: created.adjustmentType || newClause.adjustmentType || 'percentage',
          adjustmentValue: created.adjustmentValue ?? newClause.adjustmentValue ?? 0,
          clausesPricing: [],
          selectedCoverIds:
            createdCoverIds.length > 0 ? createdCoverIds : newClause.selectedCoverIds || [],
        },
      ]);

      // Reset dialog form
      setNewClause({
        code: '',
        title: '',
        type: 'Clause',
        show: 'Optional',
        wording: '',
        purposeDescription: '',
        purpose: '',
        adjustmentType: 'percentage',
        adjustmentValue: 0,
        clausesPricing: [
          {
            label: '',
            limits: '',
            type: 'percentage',
            adjustmentValue: 0,
            isActive: true,
          },
        ],
        selectedCoverIds: [],
      });
      setIsAddClauseDialogOpen(false);

      toast({
        title: 'Clause Added',
        description: 'The new clause has been successfully added.',
      });
    } catch (err) {
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      if (status === 400)
        toast({
          title: 'Invalid data',
          description: friendlyClauseErrorMessage(message),
          variant: 'destructive',
        });
      else if (status === 401)
        toast({
          title: 'Unauthorized',
          description: 'Please log in again.',
          variant: 'destructive',
        });
      else if (status === 403)
        toast({
          title: 'Forbidden',
          description: "You don't have access.",
          variant: 'destructive',
        });
      else if (status && status >= 500)
        toast({
          title: 'Server error',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      else
        toast({
          title: 'Failed',
          description: message || 'Failed to add clause.',
          variant: 'destructive',
        });
    }
  };
  const showPreview = async () => {
    if (!product.id) return;

    try {
      setPreviewError(null);
      setIsPreviewLoading(true);
      if (selectedTemplateId) {
        const tpls = await getDocumentTemplates(product.id as string);
        let macros: Awaited<ReturnType<typeof getMacros>> = [];
        try {
          macros = await getMacros(product.id as string);
        } catch {
          macros = [];
        }
        const full = tpls.find((t) => t.id === selectedTemplateId);
        if (full) {
          const mapped = mapBackendTemplate(full);
          const hidden: DocElementType[] = [];
          if (!quoteConfig.signature.showSignatureBlock) hidden.push('signature');
          if (!quoteConfig.stamp.showStampBlock) hidden.push('stamp');
          const params: DocParam[] = (macros || []).map(macroToRatingParameter);
          const currentLogoUrl = quoteLogoFile
            ? URL.createObjectURL(quoteLogoFile)
            : uploadedLogoUrl || quoteConfig.header.logoUrl || '';
          const currentSignatureUrl = signatureFile
            ? URL.createObjectURL(signatureFile)
            : uploadedSignatureUrl || '';
          const currentStampUrl = stampFile
            ? URL.createObjectURL(stampFile)
            : uploadedStampUrl || '';
          const vals: Record<string, string> = {
            companyName: String(quoteConfig.header.companyName || ''),
            companyAddress: String(quoteConfig.header.companyAddress || ''),
            companyContactInfo: String(quoteConfig.header.contactInfo || ''),
            logoPosition: String(quoteConfig.header.logoPosition || 'left'),
            headerBgColor: String(quoteConfig.header.headerColor || ''),
            headerTextColor: String(quoteConfig.header.headerTextColor || ''),
            generalDisclaimerText: String(quoteConfig.footer.generalDisclaimer || ''),
            regulatoryInformation: String(quoteConfig.footer.regulatoryText || ''),
            footerBgColor: String(quoteConfig.footer.footerBgColor || ''),
            footerTextColor: String(quoteConfig.footer.footerTextColor || ''),
            authorizedSignatory: String(quoteConfig.signature.authorizedSignatory || ''),
            signatoryTitle: String(quoteConfig.signature.signatoryTitle || ''),
            signatureText: String(quoteConfig.signature.signatureText || ''),
            logoUrl: String(currentLogoUrl),
            signatureImageUrl: String(currentSignatureUrl),
            stampImageUrl: String(currentStampUrl),
            stampLabel: String(quoteConfig.stamp.stampLabel || ''),
            premiumCurrency: String(quoteConfig.premium.currency || ''),
          };
          const effectiveFooter = (mapped.footer || [])
            .map((el) => {
              if (el.type === 'image') {
                return {
                  ...el,
                  imageUrl: el.imageUrl || currentSignatureUrl || el.content,
                };
              }
              return el;
            })
            .filter((el) => {
              if (!quoteConfig.footer.showFooter) return false;
              const content = typeof el.content === 'string' ? el.content : '';
              const id = (el.id || '').toLowerCase();
              if (
                !quoteConfig.footer.showDisclaimer &&
                (el.type === 'paragraph' || el.type === 'text')
              ) {
                if (content.includes('{{generalDisclaimerText}}') || id.includes('disclaimer')) {
                  return false;
                }
              }
              if (
                !quoteConfig.footer.showRegulatoryInfo &&
                (el.type === 'paragraph' || el.type === 'text')
              ) {
                if (content.includes('{{regulatoryInformation}}') || id.includes('regulatory')) {
                  return false;
                }
              }
              return true;
            });

          const effective: DocTpl = {
            ...mapped,
            header: mapped.header.map((el) =>
              el.type === 'logo'
                ? {
                  ...el,
                  logoUrl: el.logoUrl || currentLogoUrl,
                }
                : el,
            ),
            body: mapped.body,
            footer: effectiveFooter,
          };
          setPreviewTemplate(effective);
          setPreviewParameters(params);
          setPreviewValues(vals);
          setPreviewHiddenTypes(hidden);
        }
      }
      setIsPreviewDialogOpen(true);
    } catch (err) {
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      if (status === 400) setPreviewError(message || 'Bad request while loading preview.');
      else if (status === 401) setPreviewError('Unauthorized. Please log in again.');
      else if (status === 403) setPreviewError("You don't have access to preview.");
      else if (status && status >= 500) setPreviewError('Server error. Please try again later.');
      else setPreviewError(message || 'Failed to load preview.');
      setIsPreviewDialogOpen(true);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSaveTemplateQuoteFormat = async () => {
    try {
      if (!selectedTemplateId) {
        toast({
          title: 'Select a template',
          description: 'Please choose a document template before saving.',
          variant: 'destructive',
        });
        return;
      }

      setIsSavingQuoteFormat(true);
      const payload = {
        headerBgColor: quoteConfig.header.headerColor || '#000000',
        headerTextColor: quoteConfig.header.headerTextColor || '#FFFFFF',
        footerVisible: !!quoteConfig.footer.showFooter,
        footerBgColor: quoteConfig.footer.footerBgColor || '#FFFFFF',
        footerTextColor: quoteConfig.footer.footerTextColor || '#000000',
        disclaimerVisible: !!quoteConfig.footer.showDisclaimer,
        regulatoryInfoVisible: !!quoteConfig.footer.showRegulatoryInfo,
        signatureVisible: !!quoteConfig.signature.showSignatureBlock,
        signatureName: quoteConfig.signature.authorizedSignatory || '',
        signatureTitle: quoteConfig.signature.signatoryTitle || '',
        stampVisible: !!quoteConfig.stamp.showStampBlock,
        stampLabel: quoteConfig.stamp.stampLabel || '',
        staticMacroOverrides: {
          companyName: quoteConfig.header.companyName || '',
          companyAddress: quoteConfig.header.companyAddress || '',
          companyContactInfo: quoteConfig.header.contactInfo || '',
          generalDisclaimerText: quoteConfig.footer.generalDisclaimer || '',
          regulatoryInformation: quoteConfig.footer.regulatoryText || '',
        },
      };

      await saveQuoteFormatByTemplate(selectedTemplateId, payload, {
        logo: quoteLogoFile || null,
        signature: signatureFile || null,
        stamp: stampFile || null,
      });

      toast({
        title: 'Saved',
        description: 'Template quote format saved successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description: err?.message || 'Could not save quote format.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingQuoteFormat(false);
    }
  };

  const addNewDeductible = () => {
    setPolicyDeductibles((prev): Deductible[] => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        title: '',
        description: '',
        value: 0,
        quoteAction: 'quote',
        pricingType: 'percentage',
        showType: 'OPTIONAL',
        discount: 0,
      },
    ]);
  };

  const updateDeductible = (id: string, field: string, value: any) => {
    setPolicyDeductibles((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const removeDeductible = (id: string) => {
    setPolicyDeductibles((prev) => prev.filter((d) => d.id !== id));
  };

  const saveDuductibles = async () => {
    if (!productId) return;
    try {
      setIsSavingDeductibles(true);
      // Map to API payload
      const payload: ProductPolicyDeductibleDto[] = policyDeductibles.map((d) => ({
        id: typeof d.id === 'string' && d.id.length > 10 ? d.id : undefined,
        title: d.title || '',
        description: d.description || '',
        pricingType: d.pricingType === 'fixed' ? 'Fixed' : d.pricingType === 'flat' ? 'Flat' : 'Percentage',
        discount: Number(d.discount || 0),
        showType: (d.showType === 'MANDATORY' ? 'MANDATORY' : 'OPTIONAL') as 'OPTIONAL' | 'MANDATORY',
      }));

      await savePolicyDeductibles(productId, payload);

      toast({
        title: 'Success',
        description: 'Policy deductibles saved successfully.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save policy deductibles.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDeductibles(false);
    }
  };

  const handlePrintPreview = () => {
    const src = document.getElementById('printable');
    if (!src) {
      window.print();
      return;
    }
    document.body.classList.add('printing');
    const style = document.createElement('style');
    style.setAttribute('data-print-style', 'true');
    style.innerHTML = `
@media print {
  @page { size: A4; margin: 8mm; }
  body.printing * { visibility: hidden !important; }
  body.printing #printable, body.printing #printable * { visibility: visible !important; }
  body.printing #printable { position: static !important; margin: 0 !important; padding: 0 !important; width: 210mm !important; box-sizing: border-box !important; }
  body.printing #printable .max-w-[210mm] { width: 210mm !important; max-width: 210mm !important; margin: 0 !important; }
  body.printing #printable [class*="min-h-[297mm]"] { min-height: auto !important; }
  body.printing #printable [class*="p-[20mm]"] { padding: 8mm !important; }
  body.printing #printable [class*="mx-auto"] { margin-left: 0 !important; margin-right: 0 !important; }
  body.printing #printable [class*="shadow"] { box-shadow: none !important; }
  body.printing #printable [class*="bg-muted/20"] { background: transparent !important; }
  body.printing #printable table { width: 100% !important; border-collapse: collapse !important; }
  body.printing #printable thead { display: table-header-group !important; }
  body.printing #printable tbody { display: table-row-group !important; }
  body.printing #printable tr { page-break-inside: avoid !important; }
  body.printing #printable th, body.printing #printable td { word-break: break-word !important; }
  body.printing #printable img { max-width: 100% !important; height: auto !important; }
}
`;
    document.head.appendChild(style);
    const cleanup = () => {
      document.body.classList.remove('printing');
      style.remove();
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      if (!selectedTemplateId) return;
      setIsPdfDownloading(true);
      const blob = await generateQuotePdf(selectedTemplateId, {
        values: Object.fromEntries(
          Object.entries(previewValues || {}).map(([k, v]) => [k, String(v ?? '')]),
        ),
        hiddenTypes: previewHiddenTypes,
        footerVisible: quoteConfig.footer.showFooter,
        disclaimerVisible: quoteConfig.footer.showDisclaimer,
        regulatoryInfoVisible: quoteConfig.footer.showRegulatoryInfo,
        signatureVisible: quoteConfig.signature.showSignatureBlock,
        template: previewTemplate
          ? {
            header: (previewTemplate.header || []).map(elementToBlock),
            body: (previewTemplate.body || []).map(elementToBlock),
            footer: (previewTemplate.footer || []).map(elementToBlock),
          }
          : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (previewTemplate?.type === 'policy' ? 'policy' : 'quote') + '.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to download PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsPdfDownloading(false);
    }
  };

  const updateClausePricing = (id: number, updates: any) => {
    setSelectedClause((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        clausesPricing: prev.clausesPricing.map((clause) =>
          clause.id === id ? { ...clause, ...updates } : clause,
        ),
      };
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card">
        <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackNavigation}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {productInfo?.name} - Product Configuration
                </h1>
                <p className="text-sm text-muted-foreground">
                  {productInfo?.code || deriveProductCode(productInfo?.name || '')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/insurer/command-center')}
                className="ai-gradient-shimmer gap-2 h-9"
              >
                <Brain className="w-4 h-4" />
                Immersive Risk Assessment
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsQuoteFormatDialogOpen(true)}
                className="gap-2 h-9"
              >
                <Layout className="w-4 h-4" />
                Quote Format
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-8">
          <Tabs value={activeTab} onValueChange={(val) => { handleTabChange(val); setTimeout(() => { document.querySelector<HTMLElement>('[role="tab"][data-state="active"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); }, 50); }} className="space-y-6">
            <ScrollableTabs className="pb-2">
              <TabsList className="flex w-full min-w-max justify-between bg-primary/5 p-1 gap-2 rounded-lg border border-primary/10 shadow-sm transition-all duration-300">
                {/* <TabsTrigger
                  value="quote-config"
                  className="shrink-0 flex items-center gap-2 whitespace-nowrap px-6 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Quote Coverage
                </TabsTrigger> */}
                <TabsTrigger
                  value="pricing"
                  className="shrink-0 flex items-center gap-2 whitespace-nowrap px-6 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Calculator className="w-4 h-4" />
                  Pricing Configurator
                </TabsTrigger>
                <TabsTrigger
                  value="uw-rules"
                  className="shrink-0 flex items-center gap-2 whitespace-nowrap px-6 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Shield className="w-4 h-4" />
                  UW Rules
                </TabsTrigger>
                <TabsTrigger
                  value="cews"
                  className="shrink-0 flex items-center gap-2 whitespace-nowrap px-6 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  CEWs Configuration
                </TabsTrigger>
                <TabsTrigger
                  value="wording"
                  className="shrink-0 flex items-center gap-2 whitespace-nowrap px-6 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  Wording Configurations
                </TabsTrigger>
                <TabsTrigger
                  value="document-management"
                  className="shrink-0 flex items-center gap-2 whitespace-nowrap px-6 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Document Management
                </TabsTrigger>

              </TabsList>
            </ScrollableTabs>

            {/* Quote Coverage Tab */}
            {/* <TabsContent value="quote-config" className="space-y-6">
              <QuoteConfigurator
                isLoadingQuoteConfig={isLoadingQuoteConfig}
                isSavingQuoteConfig={isSavingQuoteConfig}
                onSave={handleSaveQuoteCoverage}
                quoteConfig={quoteConfig}
                updateQuoteConfig={updateQuoteConfig}
                insurerMetadata={insurerMetadata}
                metadataError={metadataError}
                quoteConfigError={quoteConfigError}
                quoteCoverageData={quoteCoverageData}
                productId={String(productInfo?.id || productId || '')}
                productOperatingGeography={normalizedProductOperatingGeography}
              />
            </TabsContent> */}

            {/* UW Rules Design Tab */}
            <TabsContent value="uw-rules" className="space-y-6">
              <Card>
                <CardContent className="p-0">
                  <div className="h-[800px] border rounded-md overflow-hidden bg-background">
                    <InsurerUWRulesDesign
                      productId={productInfo?.id || String(productId)}
                      productName={productInfo?.name || 'Product'}
                      isEmbedded={true}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Pricing Configurator Tab */}
            <TabsContent value="pricing" className="space-y-6">
              <PricingConfigurator
                key={productId}
                productInfo={normalizedPricingProductInfo}
                productId={String(productId || '')}
                activeProjectTypes={activeProjectTypes}
                ratingConfig={ratingConfig}
                activeConstructionTypes={activeConstructionTypes}
                activeCountries={activeCountries}
                fetchBaseRatesMasters={fetchBaseRatesMasters}
                fetchMinimumPremiumsMasters={fetchMinimumPremiumsMasters}
                fetchProjectRiskFactors={fetchProjectRiskFactors}
                fetchCoverageOptions={fetchCoverageOptions}
                fetchPolicyLimits={fetchPolicyLimits}
                fetchClauseMetadata={fetchClauseMetadata}
                saveConfiguration={saveConfiguration}
                markAsChanged={markAsChanged}
                setRatingConfig={setRatingConfig}
                isLoadingBaseRatesMasters={isLoadingBaseRatesMasters}
                baseRatesMastersError={baseRatesMastersError}
                projectTypesMasters={projectTypesMasters}
                updateSubProjectEntry={updateSubProjectEntry}
                isLoadingMinimumPremiumsMasters={isLoadingMinimumPremiumsMasters}
                minimumPremiumsMastersError={minimumPremiumsMastersError}
                addDurationLoading={addDurationLoading}
                updateDurationLoading={updateDurationLoading}
                removeDurationLoading={removeDurationLoading}
                addMaintenancePeriodLoading={addMaintenancePeriodLoading}
                updateMaintenancePeriodLoading={updateMaintenancePeriodLoading}
                removeMaintenancePeriodLoading={removeMaintenancePeriodLoading}
                updateProjectRiskFactor={updateProjectRiskFactor}
                SoilTypeMultiSelect={SoilTypeMultiSelect}
                isLoadingProjectRiskFactors={isLoadingProjectRiskFactors}
                isSavingProjectRiskFactors={isSavingProjectRiskFactors}
                projectRiskFactorsError={projectRiskFactorsError}
                addContractorRiskEntry={addContractorRiskEntry}
                updateContractorRiskEntry={updateContractorRiskEntry}
                removeContractorRiskEntry={removeContractorRiskEntry}
                isLoadingContractorRiskFactors={isLoadingContractorRiskFactors}
                isSavingContractorRiskFactors={isSavingContractorRiskFactors}
                contractorRiskFactorsError={contractorRiskFactorsError}
                isLoadingClauseMetadata={isLoadingClauseMetadata}
                clauseMetadataError={clauseMetadataError}
                clauseMetadata={clauseMetadata}
                isLoadingClausePricing={isLoadingClausePricing}
                clausePricingError={clausePricingError}
                clausePricingData={clausePricingData}
                isSavingClausePricing={isSavingClausePricing}
                handleSaveClausePricing={handleSaveClausePricing}
                addCoverRequirementEntry={addCoverRequirementEntry}
                updateCoverRequirementEntry={updateCoverRequirementEntry}
                removeCoverRequirementEntry={removeCoverRequirementEntry}
                updateCoverRequirement={updateCoverRequirement}
                isLoadingCoverageOptions={isLoadingCoverageOptions}
                isSavingCoverageOptions={isSavingCoverageOptions}
                coverageOptionsError={coverageOptionsError}
                coverageOptionsData={coverageOptionsData}
                updateLimits={updateLimits}
                isLoadingPolicyLimits={isLoadingPolicyLimits}
                isSavingPolicyLimits={isSavingPolicyLimits}
                policyLimitsError={policyLimitsError}
                policyLimitsData={policyLimitsData}
                handleSavePolicyLimits={handleSavePolicyLimits}
                handleSaveBaseRates={handleSaveBaseRates}
                isSavingBaseRates={isSavingBaseRates}
                handleSaveMinimumPremiums={handleSaveMinimumPremiums}
                isSavingMinimumPremiums={isSavingMinimumPremiums}
                handleSaveProjectRiskFactors={handleSaveProjectRiskFactors}
                constructionTypesData={constructionTypesData}
                isLoadingConstructionTypes={isLoadingConstructionTypes}
                constructionTypesError={constructionTypesError}
                roleTypesData={roleTypesData}
                isLoadingRoleTypes={isLoadingRoleTypes}
                roleTypesError={roleTypesError}
                contractTypesData={contractTypesData}
                isLoadingContractTypes={isLoadingContractTypes}
                contractTypesError={contractTypesError}
                soilTypesData={soilTypesData}
                isLoadingSoilTypes={isLoadingSoilTypes}
                soilTypesError={soilTypesError}
                subcontractorTypesData={subcontractorTypesData}
                isLoadingSubcontractorTypes={isLoadingSubcontractorTypes}
                subcontractorTypesError={subcontractorTypesError}
                consultantRolesData={consultantRolesData}
                isLoadingConsultantRoles={isLoadingConsultantRoles}
                consultantRolesError={consultantRolesError}
                securityTypesData={securityTypesData}
                isLoadingSecurityTypes={isLoadingSecurityTypes}
                securityTypesError={securityTypesError}
                areaTypesData={areaTypesData}
                isLoadingAreaTypes={isLoadingAreaTypes}
                areaTypesError={areaTypesError}
                countriesData={countriesData}
                isLoadingCountries={isLoadingCountries}
                countriesError={countriesError}
                regionsData={regionsData}
                isLoadingRegions={isLoadingRegions}
                regionsError={regionsError}
                zonesData={zonesData}
                isLoadingZones={isLoadingZones}
                zonesError={zonesError}
                constructionTypesConfigData={constructionTypesConfigData}
                isLoadingConstructionTypesConfig={isLoadingConstructionTypesConfig}
                constructionTypesConfigError={constructionTypesConfigError}
                isSavingConstructionTypesConfig={isSavingConstructionTypesConfig}
                handleSaveConstructionTypesConfiguration={handleSaveConstructionTypesConfiguration}
                countriesConfigData={countriesConfigData}
                isLoadingCountriesConfig={isLoadingCountriesConfig}
                countriesConfigError={countriesConfigError}
                isSavingCountriesConfig={isSavingCountriesConfig}
                handleSaveCountriesConfiguration={handleSaveCountriesConfiguration}
                regionsConfigData={regionsConfigData}
                isLoadingRegionsConfig={isLoadingRegionsConfig}
                regionsConfigError={regionsConfigError}
                isSavingRegionsConfig={isSavingRegionsConfig}
                handleSaveRegionsConfiguration={handleSaveRegionsConfiguration}
                zonesConfigData={zonesConfigData}
                isLoadingZonesConfig={isLoadingZonesConfig}
                zonesConfigError={zonesConfigError}
                isSavingZonesConfig={isSavingZonesConfig}
                handleSaveZonesConfiguration={handleSaveZonesConfiguration}
                contractTypesConfigData={contractTypesConfigData}
                isLoadingContractTypesConfig={isLoadingContractTypesConfig}
                contractTypesConfigError={contractTypesConfigError}
                isSavingContractTypesConfig={isSavingContractTypesConfig}
                handleSaveContractTypesConfiguration={handleSaveContractTypesConfiguration}
                roleTypesConfigData={roleTypesConfigData}
                isLoadingRoleTypesConfig={isLoadingRoleTypesConfig}
                roleTypesConfigError={roleTypesConfigError}
                isSavingRoleTypesConfig={isSavingRoleTypesConfig}
                handleSaveRoleTypesConfiguration={handleSaveRoleTypesConfiguration}
                soilTypesConfigData={soilTypesConfigData}
                isLoadingSoilTypesConfig={isLoadingSoilTypesConfig}
                soilTypesConfigError={soilTypesConfigError}
                isSavingSoilTypesConfig={isSavingSoilTypesConfig}
                handleSaveSoilTypesConfiguration={handleSaveSoilTypesConfiguration}
                subcontractorTypesConfigData={subcontractorTypesConfigData}
                isLoadingSubcontractorTypesConfig={isLoadingSubcontractorTypesConfig}
                subcontractorTypesConfigError={subcontractorTypesConfigError}
                isSavingSubcontractorTypesConfig={isSavingSubcontractorTypesConfig}
                handleSaveSubcontractorTypesConfiguration={
                  handleSaveSubcontractorTypesConfiguration
                }
                consultantRolesConfigData={consultantRolesConfigData}
                isLoadingConsultantRolesConfig={isLoadingConsultantRolesConfig}
                consultantRolesConfigError={consultantRolesConfigError}
                isSavingConsultantRolesConfig={isSavingConsultantRolesConfig}
                handleSaveConsultantRolesConfiguration={handleSaveConsultantRolesConfiguration}
                securityTypesConfigData={securityTypesConfigData}
                isLoadingSecurityTypesConfig={isLoadingSecurityTypesConfig}
                securityTypesConfigError={securityTypesConfigError}
                isSavingSecurityTypesConfig={isSavingSecurityTypesConfig}
                handleSaveSecurityTypesConfiguration={handleSaveSecurityTypesConfiguration}
                areaTypesConfigData={areaTypesConfigData}
                isLoadingAreaTypesConfig={isLoadingAreaTypesConfig}
                areaTypesConfigError={areaTypesConfigError}
                isSavingAreaTypesConfig={isSavingAreaTypesConfig}
                handleSaveAreaTypesConfiguration={handleSaveAreaTypesConfiguration}
                fetchClausePricing={fetchClausePricing}
                fetchConstructionTypes={fetchConstructionTypes}
                fetchConstructionTypesConfig={fetchConstructionTypesConfig}
                fetchRoleTypes={fetchRoleTypes}
                fetchRoleTypesConfig={fetchRoleTypesConfig}
                fetchContractTypes={fetchContractTypes}
                fetchContractTypesConfig={fetchContractTypesConfig}
                fetchSoilTypes={fetchSoilTypes}
                fetchSoilTypesConfig={fetchSoilTypesConfig}
                fetchSubcontractorTypes={fetchSubcontractorTypes}
                fetchSubcontractorTypesConfig={fetchSubcontractorTypesConfig}
                fetchConsultantRoles={fetchConsultantRoles}
                fetchConsultantRolesConfig={fetchConsultantRolesConfig}
                fetchSecurityTypes={fetchSecurityTypes}
                fetchSecurityTypesConfig={fetchSecurityTypesConfig}
                fetchAreaTypes={fetchAreaTypes}
                fetchAreaTypesConfig={fetchAreaTypesConfig}
                fetchFeeTypesConfig={fetchFeeTypesConfig}
                // fetchCountries={fetchCountries}
                fetchCountriesConfig={fetchCountriesConfig}
                // fetchRegions={fetchRegions}
                fetchRegionsConfig={fetchRegionsConfig}
                // fetchZones={fetchZones}
                fetchZonesConfig={fetchZonesConfig}
              />
            </TabsContent>

            {/* CEWs Configuration Tab */}
            <TabsContent value="cews" className="space-y-6">
              <CEWsConfiguration
                tplError={tplError}
                isLoadingTpl={isLoadingTpl}
                tplLimit={tplLimit}
                setTplLimit={(v: string) => setTplLimit(v)}
                tplExtensions={tplExtensions}
                setTplExtensions={(v) => setTplExtensions(v)}
                isSavingTpl={isSavingTpl}
                saveTplExtensions={saveTplExtensions}
                productCurrency={productCurrency}
              />

              {/* Clauses, Exclusions, and Warranties Section */}
              {isLoadingClauses ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="w-72 h-6 bg-gray-200 rounded animate-pulse" />
                        <div className="w-[28rem] h-4 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="w-28 h-9 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="w-full h-9 bg-gray-200 rounded animate-pulse" />
                    <div className="space-y-2">
                      <div className="w-full h-12 bg-gray-200 rounded animate-pulse" />
                      <div className="w-full h-12 bg-gray-200 rounded animate-pulse" />
                      <div className="w-full h-12 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Clauses, Exclusions, and Warranties Section</CardTitle>
                        <CardDescription>
                          Configure specific clauses, exclusions, and warranty requirements
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportClauses}
                          disabled={isExportingClauses}
                        >
                          {isExportingClauses ? (
                            <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {isExportingClauses ? 'Exporting...' : 'Export'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clausesImportInputRef.current?.click()}
                          disabled={isImportingClauses}
                        >
                          {isImportingClauses ? (
                            <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          {isImportingClauses ? 'Importing...' : 'Import'}
                        </Button>
                        <input
                          ref={clausesImportInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          onChange={handleImportClauses}
                        />
                        <Button variant="outline" onClick={() => setIsCEWRulesDialogOpen(true)}>
                          <Eye className="w-4 h-4 mr-2" />
                          CEW's rule
                        </Button>
                        <Button onClick={() => setIsAddClauseDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Clause
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {clausesError && (
                      <div className="mb-4 text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                        {clausesError}
                      </div>
                    )}
                    <TooltipProvider delayDuration={250}>
                      <div className="w-full overflow-x-auto relative">
                        {isImportingClauses && (
                          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/70 rounded-md gap-3">
                            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">Importing clauses...</p>
                          </div>
                        )}
                        <Table className="w-full min-w-[960px] table-fixed">
                          <colgroup>
                            {Array.from({ length: 7 }).map((_, i) => (
                              <col key={i} style={{ width: `${100 / 7}%` }} />
                            ))}
                          </colgroup>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-left align-middle">Clause Code</TableHead>
                              <TableHead className="text-left align-middle">Title / Purpose</TableHead>
                              <TableHead className="text-left align-middle">Purpose Description</TableHead>
                              <TableHead className="text-center align-middle">Type</TableHead>
                              <TableHead className="text-center align-middle">Show</TableHead>
                              <TableHead className="text-center align-middle">Covers</TableHead>
                              <TableHead className="text-center align-middle">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {clausesData.map((item, index) => {
                              const selectedIds = item.selectedCoverIds || [];
                              const coverCount = selectedIds.length;
                              const coverNames = resolveSelectedCoverNamesFromSections(
                                selectedIds,
                                productInfo?.sections || [],
                              );
                              return (
                                <TableRow key={index}>
                                  <TableCell className="min-w-0 text-left align-middle font-medium">
                                    <span className="block truncate" title={item.code}>
                                      {item.code}
                                    </span>
                                  </TableCell>
                                  <TableCell className="min-w-0 text-left align-middle">
                                    <span className="block break-words" title={item.title}>
                                      {item.title}
                                    </span>
                                  </TableCell>
                                  <TableCell className="min-w-0 text-left align-middle">
                                    <span className="text-sm text-muted-foreground block break-words">
                                      {item.purposeDescription ||
                                        item.description ||
                                        item.purpose ||
                                        'No description available'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="min-w-0 text-center align-middle px-2">
                                    <div className="flex justify-center px-1">
                                      <Badge
                                        variant={
                                          item.type === 'Clause'
                                            ? 'default'
                                            : item.type === 'Exclusion'
                                              ? 'destructive'
                                              : 'secondary'
                                        }
                                        className="max-w-full shrink"
                                      >
                                        {item.type}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="min-w-0 text-center align-middle px-2">
                                    <div className="flex justify-center px-1">
                                      <Badge
                                        variant={item.show === 'Mandatory' ? 'default' : 'outline'}
                                        className="max-w-full shrink"
                                      >
                                        {item.show}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="min-w-0 text-center align-middle px-2">
                                    {coverCount === 0 ? (
                                      <span className="text-sm text-muted-foreground">Global</span>
                                    ) : (
                                      <div className="flex justify-center px-1">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              type="button"
                                              className="text-sm font-semibold tabular-nums text-foreground border-b border-dotted border-muted-foreground/60 hover:border-foreground cursor-help bg-transparent p-0"
                                            >
                                              {coverCount}
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" className="max-w-xs">
                                            <p className="text-xs font-medium text-muted-foreground mb-1.5">
                                              Selected covers
                                            </p>
                                            <ul className="text-sm space-y-1 list-disc pl-4">
                                              {coverNames.map((name, i) => (
                                                <li key={`${name}-${i}`}>{name}</li>
                                              ))}
                                            </ul>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="min-w-0 text-center align-middle px-2">
                                    <div className="flex justify-center gap-1.5">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const pricing =
                                            item.clausesPricing && item.clausesPricing.length > 0
                                              ? item.clausesPricing
                                              : [
                                                {
                                                  label: '',
                                                  limits: '',
                                                  type: 'percentage',
                                                  adjustmentValue: 0,
                                                  isActive: true,
                                                },
                                              ];
                                          setSelectedClause({
                                            ...item,
                                            clausesPricing: pricing,
                                            selectedCoverIds: item.selectedCoverIds || [],
                                          });
                                          setIsEditClauseDialogOpen(true);
                                        }}
                                      >
                                        View/Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                        onClick={() => {
                                          if (!product.id) return;
                                          setConfirmDialog({
                                            isOpen: true,
                                            title: 'Delete Clause',
                                            description: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
                                            action: () => {
                                              (async () => {
                                                try {
                                                  setIsSavingClause(true);
                                                  const payload: SaveProductCewDto = {
                                                    id: item.id as string,
                                                    clauseCode: item.code,
                                                    title: item.title,
                                                    purposeDescription:
                                                      item.purposeDescription || '',
                                                    type: toClauseTypeDto(item.type),
                                                    adjustmentType:
                                                      item.adjustmentType || 'percentage',
                                                    adjustmentValue: item.adjustmentValue || 0,
                                                    showType: toShowTypeDto(item.show),
                                                    clauseContent: item.wording || '',
                                                    isActive: false,
                                                  };
                                                  await deleteProductCew(
                                                    product.id as string,
                                                    payload,
                                                  );
                                                  setClausesData((prev) =>
                                                    prev.filter((c) => c.id !== item.id),
                                                  );
                                                  toast({
                                                    title: 'Clause Deleted',
                                                    description: 'The clause has been removed.',
                                                  });
                                                } catch (err) {
                                                  const status = err?.status as number | undefined;
                                                  const message = err?.message as string | undefined;
                                                  if (status === 400)
                                                    toast({
                                                      title: 'Invalid data',
                                                      description: friendlyClauseErrorMessage(message),
                                                      variant: 'destructive',
                                                    });
                                                  else if (status === 401)
                                                    toast({
                                                      title: 'Unauthorized',
                                                      description: 'Please log in again.',
                                                      variant: 'destructive',
                                                    });
                                                  else if (status === 403)
                                                    toast({
                                                      title: 'Forbidden',
                                                      description: "You don't have access.",
                                                      variant: 'destructive',
                                                    });
                                                  else if (status && status >= 500)
                                                    toast({
                                                      title: 'Server error',
                                                      description: 'Please try again later.',
                                                      variant: 'destructive',
                                                    });
                                                  else
                                                    toast({
                                                      title: 'Failed',
                                                      description:
                                                        message || 'Failed to delete clause.',
                                                      variant: 'destructive',
                                                    });
                                                } finally {
                                                  setIsSavingClause(false);
                                                  setConfirmDialog((prev) => ({
                                                    ...prev,
                                                    isOpen: false,
                                                  }));
                                                }
                                              })();
                                            },
                                          });
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </TooltipProvider>
                  </CardContent>
                </Card>
              )}

              {/* CEW Rules Dialog */}
              <CEWRulesDialog
                open={isCEWRulesDialogOpen}
                onOpenChange={(open) => {
                  setIsCEWRulesDialogOpen(open);
                }}
                productId={product?.id as string | undefined}
                cewsList={(clausesData || []).map(
                  (c: { id?: string | number; title?: string; code?: string }) => ({
                    id: String(c.id ?? ''),
                    title: c.title || c.code || '',
                  }),
                )}
                onOpenAddClause={() => setIsAddClauseDialogOpen(true)}
                onRulesChanged={() => {
                  if (activeTab === 'cews' && product?.id) {
                    void refreshClausesData();
                  }
                }}
              />

              {/* Edit and Add Clause Dialogs */}
              <Dialog open={isEditClauseDialogOpen} onOpenChange={setIsEditClauseDialogOpen}>
                <DialogContent className="max-w-6xl bg-card text-card-foreground border-0 shadow-2xl">
                  <DialogHeader className="space-y-2 pb-4">
                    <DialogTitle>View/Edit Clause Details</DialogTitle>
                  </DialogHeader>
                  {selectedClause && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-code">Clause Code</Label>
                          <Input
                            id="edit-code"
                            value={selectedClause.code}
                            onChange={(e) =>
                              setSelectedClause({
                                ...selectedClause,
                                code: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-type">Type</Label>
                          <Select
                            value={selectedClause.type}
                            onValueChange={(value) =>
                              setSelectedClause({
                                ...selectedClause,
                                type: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Clause">Clause</SelectItem>
                              <SelectItem value="Exclusion">Exclusion</SelectItem>
                              <SelectItem value="Warranty">Warranty</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="edit-cover">Linked Covers</Label>
                          <CoverMultiSelect
                            selectedValues={selectedClause.selectedCoverIds || []}
                            onValueChange={(values) =>
                              setSelectedClause({
                                ...selectedClause,
                                selectedCoverIds: values,
                              })
                            }
                            sections={productInfo?.sections || []}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-title">Title / Purpose</Label>
                        <Input
                          id="edit-title"
                          value={selectedClause.title}
                          onChange={(e) =>
                            setSelectedClause({
                              ...selectedClause,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-purpose-desc">Purpose Description</Label>
                        <Input
                          id="edit-purpose-desc"
                          value={selectedClause.purposeDescription || ''}
                          onChange={(e) =>
                            setSelectedClause({
                              ...selectedClause,
                              purposeDescription: e.target.value,
                            })
                          }
                          placeholder="Brief description of the clause purpose"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-purpose">Clause Wordings</Label>
                        <Textarea
                          id="edit-purpose"
                          value={selectedClause?.wording || ''}
                          onChange={(e) =>
                            setSelectedClause({
                              ...selectedClause,
                              wording: e.target.value,
                            })
                          }
                          placeholder="Enter the detailed clause wordings..."
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-adjustment-type">Adjustment Type *</Label>
                          <Select
                            value={selectedClause.adjustmentType}
                            onValueChange={(value) =>
                              setSelectedClause({
                                ...selectedClause,
                                adjustmentType: value,
                                adjustmentValue:
                                  value === 'percentage'
                                    ? Math.min(
                                        100,
                                        Math.max(0, Number(selectedClause.adjustmentValue) || 0),
                                      )
                                    : selectedClause.adjustmentValue,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="currency">{productCurrency}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-adjustment-value">Adjustment Value *</Label>
                          <FormattedNumberInput
                            id="edit-adjustment-value"
                            value={
                              typeof selectedClause.adjustmentValue === 'number'
                                ? selectedClause.adjustmentValue
                                : Number(selectedClause.adjustmentValue) || 0
                            }
                            allowDecimals={selectedClause.adjustmentType === 'percentage'}
                            maxDecimals={selectedClause.adjustmentType === 'percentage' ? 2 : 0}
                            min={selectedClause.adjustmentType === 'percentage' ? 0 : undefined}
                            max={selectedClause.adjustmentType === 'percentage' ? 100 : undefined}
                            minFractionDigits={selectedClause.adjustmentType === 'percentage' ? 0 : undefined}
                            suffix={selectedClause.adjustmentType === 'percentage' ? '%' : productCurrency}
                            onChange={(value) =>
                              setSelectedClause({
                                ...selectedClause,
                                adjustmentValue: value,
                              })
                            }
                            placeholder={selectedClause.adjustmentType === 'percentage' ? '0 – 100' : 'Enter the pricing value'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-show">Show *</Label>
                          <Select
                            value={selectedClause.show}
                            onValueChange={(value) =>
                              setSelectedClause({
                                ...selectedClause,
                                show: value,
                                adjustmentValue: value === 'Optional' ? 0 : selectedClause.adjustmentValue,
                                clausesPricing: value === 'Optional'
                                  ? [{
                                    label: '',
                                    limits: '',
                                    type: 'percentage',
                                    adjustmentValue: 0,
                                    isActive: true,
                                  }]
                                  : selectedClause.clausesPricing,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Optional">Optional</SelectItem>
                              <SelectItem value="Mandatory">Mandatory</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {selectedClause.show === 'Mandatory' && (
                        <div className="grid gap-6">
                          <ClausePricingCardV2
                            pricingList={(selectedClause.clausesPricing || []) as any}
                            productInfo={productInfo}
                            onChange={(newList) => {
                              setSelectedClause({
                                ...selectedClause,
                                clausesPricing: newList,
                              });
                            }}
                          />
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditClauseDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            // Validate clause pricing rows: only block if BOTH limit AND value are filled but label is empty
                            if (selectedClause.show === 'Mandatory') {
                              const pricingRows = selectedClause.clausesPricing || [];
                              const hasRowWithValueButNoLabel = pricingRows.some((p: any) => {
                                const limitsHasValue = p.limits !== undefined && p.limits !== null && p.limits !== '' && String(p.limits).trim() !== '';
                                const valueHasValue = Number(p.adjustmentValue) > 0;
                                const labelEmpty = !p.label || String(p.label).trim() === '';
                                return (limitsHasValue || valueHasValue) && labelEmpty;
                              });
                              if (hasRowWithValueButNoLabel) {
                                toast({
                                  title: 'Validation failed',
                                  description: 'Please enter a label for each clause pricing entry before saving.',
                                  variant: 'destructive',
                                });
                                return;
                              }
                            }
                            setIsSavingClause(true);
                            try {
                              if (!product.id || !selectedClause?.id) return;
                              const payload: SaveProductCewDto = {
                                id: selectedClause.id as string,
                                clauseCode: selectedClause.code,
                                title: selectedClause.title,
                                purposeDescription: selectedClause.purposeDescription || '',
                                adjustmentType: selectedClause.adjustmentType || 'percentage',
                                adjustmentValue: selectedClause.adjustmentValue || 0,
                                type: toClauseTypeDto(selectedClause.type),
                                showType: toShowTypeDto(selectedClause.show),
                                clauseContent:
                                  selectedClause.purpose || selectedClause.wording || '',
                                isActive: true,
                                clausesPricing:
                                  selectedClause.show === 'Mandatory'
                                    ? (selectedClause.clausesPricing || [])
                                        .filter((p: any) => {
                                          // Only send rows where the user has actually entered something
                                          const limitsHasValue = p.limits !== undefined && p.limits !== null && p.limits !== '' && String(p.limits).trim() !== '';
                                          const valueHasValue = Number(p.adjustmentValue) > 0;
                                          const labelHasValue = p.label && String(p.label).trim() !== '';
                                          return limitsHasValue || valueHasValue || labelHasValue;
                                        })
                                        .map((p: ProductCewPricingDto) => ({
                                          ...p,
                                          type:
                                            (p.type || 'percentage').toLowerCase() === 'fixed'
                                              ? 'currency'
                                              : (p.type || 'percentage').toLowerCase(),
                                          adjustmentValue: parseFloat(
                                            String(p.adjustmentValue || 0),
                                          ),
                                        }))
                                    : [],
                                selectedCoverIds: selectedClause.selectedCoverIds || [],
                              };

                              const updated = await updateProductCew(product.id as string, payload);

                              // Update table row with response
                              setClausesData((prev) =>
                                prev.map((c) =>
                                  c.id === selectedClause.id
                                    ? {
                                      ...c,
                                      code: updated.clauseCode || c.code,
                                      title: updated.title || c.title,
                                      purposeDescription:
                                        updated.purposeDescription || c.purposeDescription,
                                      wording: updated.clauseContent || c.wording,
                                      type:
                                        (updated.type || '').toUpperCase() === 'EXCLUSION'
                                          ? 'Exclusion'
                                          : (updated.type || '').toUpperCase() === 'WARRANTY'
                                            ? 'Warranty'
                                            : 'Clause',
                                      show:
                                        (updated.showType || '').toUpperCase() === 'MANDATORY'
                                          ? 'Mandatory'
                                          : 'Optional',
                                      displayOrder: Number(
                                        updated.displayOrder || c.displayOrder,
                                      ),
                                      active: !!updated.isActive,
                                      adjustmentType: updated.adjustmentType || c.adjustmentType,
                                      adjustmentValue:
                                        updated.adjustmentValue || c.adjustmentValue,
                                      clausesPricing: selectedClause.clausesPricing,
                                      selectedCoverIds: selectedClause.selectedCoverIds || [],
                                    }
                                    : c,
                                ),
                              );
                              // Update ratingConfig with changes from selectedClause.clausesPricing
                              setRatingConfig((prev) => {
                                const updatedPricing = [...prev.clausesPricing];
                                // We are not updating ratingConfig directly anymore as it is fetched from API
                                // But if we need to keep local state in sync:
                                // selectedClause.clausesPricing.forEach((sc) => {
                                //   const index = updatedPricing.findIndex((p) => p.code === sc.code);
                                //   if (index !== -1) {
                                //     updatedPricing[index] = sc;
                                //   } else {
                                //     updatedPricing.push(sc);
                                //   }
                                // });
                                return {
                                  ...prev,
                                  clausesPricing: updatedPricing,
                                };
                              });

                              setIsEditClauseDialogOpen(false);
                              // refresh list
                              try {
                                clausesApiRef.current = true;
                                const data: CewConfigurationResponseDto = await getCewConfiguration(
                                  product.id as string,
                                );
                                const list = Array.isArray(data?.clauses) ? data.clauses : [];
                                const mapped = list.map((c) => ({
                                  id: c.id,
                                  code: c.clauseCode || '',
                                  title: c.title || '',
                                  purposeDescription: c.purposeDescription || '',
                                  wording: c.clauseContent || '',
                                  type:
                                    (c.type || '').toUpperCase() === 'EXCLUSION'
                                      ? 'Exclusion'
                                      : (c.type || '').toUpperCase() === 'WARRANTY'
                                        ? 'Warranty'
                                        : 'Clause',
                                  show:
                                    (c.showType || '').toUpperCase() === 'MANDATORY'
                                      ? 'Mandatory'
                                      : 'Optional',
                                  adjustmentType: c.adjustmentType || 'percentage',
                                  adjustmentValue: parseFloat(c.adjustmentValue || 0),
                                  displayOrder: Number(c.displayOrder || 0),
                                  active: !!c.isActive,
                                  clausesPricing:
                                    c.clausesPricing?.map((p: any) => ({
                                      id: p.id,
                                      label: p.label,
                                      limits: p.limits,
                                      type:
                                        (p.type || 'percentage').toLowerCase() === 'fixed'
                                          ? 'currency'
                                          : (p.type || 'percentage').toLowerCase(),
                                      adjustmentValue: parseFloat(String(p.adjustmentValue || 0)),
                                      isActive: p.isActive,
                                    })) || [],
                                  selectedCoverIds: mapClauseSelectedCoverIdsFromApi(c),
                                }));
                                setClausesData(mapped);
                              } finally {
                                clausesApiRef.current = false;
                              }
                              toast({
                                title: 'Clause Updated',
                                description: 'The clause has been successfully updated.',
                              });
                            } catch (err) {
                              const status = err?.status as number | undefined;
                              const message = err?.message as string | undefined;
                              if (status === 400)
                                toast({
                                  title: 'Invalid data',
                                  description: friendlyClauseErrorMessage(message),
                                  variant: 'destructive',
                                });
                              else if (status === 401)
                                toast({
                                  title: 'Unauthorized',
                                  description: 'Please log in again.',
                                  variant: 'destructive',
                                });
                              else if (status === 403)
                                toast({
                                  title: 'Forbidden',
                                  description: "You don't have access.",
                                  variant: 'destructive',
                                });
                              else if (status && status >= 500)
                                toast({
                                  title: 'Server error',
                                  description: 'Please try again later.',
                                  variant: 'destructive',
                                });
                              else
                                toast({
                                  title: 'Failed',
                                  description: message || 'Failed to update clause.',
                                  variant: 'destructive',
                                });
                            } finally {
                              setIsSavingClause(false);
                            }
                          }}
                        >
                          {isSavingClause ? 'Saving…' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog open={isAddClauseDialogOpen} onOpenChange={setIsAddClauseDialogOpen}>
                <DialogContent className="max-w-6xl bg-card text-card-foreground border-0 shadow-2xl">
                  <DialogHeader className="space-y-2 pb-4">
                    <DialogTitle>Add New Clause</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-code">Clause Code *</Label>
                        <Input
                          id="new-code"
                          placeholder="e.g., C001"
                          value={newClause.code}
                          onChange={(e) => setNewClause({ ...newClause, code: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-type">Type *</Label>
                        <Select
                          value={newClause.type}
                          onValueChange={(value) => setNewClause({ ...newClause, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Clause">Clause</SelectItem>
                            <SelectItem value="Exclusion">Exclusion</SelectItem>
                            <SelectItem value="Warranty">Warranty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="new-cover">Linked Covers</Label>
                        <CoverMultiSelect
                          selectedValues={newClause.selectedCoverIds || []}
                          onValueChange={(values) =>
                            setNewClause({ ...newClause, selectedCoverIds: values })
                          }
                          sections={productInfo?.sections || []}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-title">Title / Purpose *</Label>
                      <Input
                        id="new-title"
                        placeholder="Enter clause title or purpose"
                        value={newClause.title}
                        onChange={(e) => setNewClause({ ...newClause, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-purpose-desc">Purpose Description</Label>
                      <Input
                        id="new-purpose-desc"
                        value={newClause.purposeDescription || ''}
                        onChange={(e) =>
                          setNewClause({
                            ...newClause,
                            purposeDescription: e.target.value,
                          })
                        }
                        placeholder="Brief description of the clause purpose"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-purpose">Clause Wordings</Label>
                      <Textarea
                        id="new-purpose"
                        placeholder="Enter the detailed clause wordings..."
                        value={newClause.purpose}
                        onChange={(e) =>
                          setNewClause({
                            ...newClause,
                            purpose: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pricing-type">Adjustment Type *</Label>
                        <Select
                          value={newClause.adjustmentType}
                          onValueChange={(value) =>
                            setNewClause({
                              ...newClause,
                              adjustmentType: value,
                              adjustmentValue:
                                value === 'percentage'
                                  ? Math.min(100, Math.max(0, Number(newClause.adjustmentValue) || 0))
                                  : newClause.adjustmentValue,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="currency">
                              {productInfo?.currency || 'Fixed'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-adjustment-value">Adjustment Value *</Label>
                        <FormattedNumberInput
                          id="new-adjustment-value"
                          value={newClause.adjustmentValue || 0}
                          allowDecimals={newClause.adjustmentType === 'percentage'}
                          maxDecimals={newClause.adjustmentType === 'percentage' ? 2 : 0}
                          min={newClause.adjustmentType === 'percentage' ? 0 : undefined}
                          max={newClause.adjustmentType === 'percentage' ? 100 : undefined}
                          minFractionDigits={newClause.adjustmentType === 'percentage' ? 0 : undefined}
                          suffix={newClause.adjustmentType === 'percentage' ? '%' : productInfo?.currency || productCurrency}
                          onChange={(val) =>
                            setNewClause({
                              ...newClause,
                              adjustmentValue: val,
                            })
                          }
                          placeholder={newClause.adjustmentType === 'percentage' ? '0 – 100' : 'Enter the pricing value'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-show">Show *</Label>
                        <Select
                          value={newClause.show}
                          onValueChange={(value) =>
                            setNewClause({
                              ...newClause,
                              show: value,
                              adjustmentValue: value === 'Optional' ? 0 : newClause.adjustmentValue,
                              clausesPricing: value === 'Optional'
                                ? [{
                                  label: '',
                                  limits: '',
                                  type: 'percentage',
                                  adjustmentValue: 0,
                                  isActive: true,
                                }]
                                : newClause.clausesPricing,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Optional">Optional</SelectItem>
                            <SelectItem value="Mandatory">Mandatory</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {newClause.show === 'Mandatory' && (
                      <div className="grid gap-6">
                        <ClausePricingCardV2
                          pricingList={(newClause.clausesPricing || []) as any}
                          productInfo={productInfo}
                          onChange={(newList) => {
                            setNewClause({
                              ...newClause,
                              clausesPricing: newList,
                            });
                          }}
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddClauseDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={addNewClause}
                        disabled={!newClause.code || !newClause.title || !newClause.show}
                      >
                        Add Clause
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Deductibles */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Deductibles</CardTitle>
                      <CardDescription>Configure product specific deductibles</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={addNewDeductible} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Deductible
                      </Button>
                      <Button size="sm" disabled={isSavingDeductibles} onClick={saveDuductibles}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSavingDeductibles ? 'Saving...' : 'Save Deductibles'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Show</TableHead>
                          <TableHead>Pricing Type</TableHead>
                          <TableHead>Loading/Discount</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {policyDeductibles.map((deductible: any) => (
                          <TableRow key={deductible.id}>
                            <TableCell>
                              <Input
                                value={deductible.title || ''}
                                onChange={(e) =>
                                  updateDeductible(deductible.id, 'title', e.target.value)
                                }
                                placeholder="Enter a title"
                                className="w-48"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={deductible.description || ''}
                                onChange={(e) =>
                                  updateDeductible(deductible.id, 'description', e.target.value)
                                }
                                className="w-60"
                                placeholder="Enter a description"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={deductible.showType || 'OPTIONAL'}
                                onValueChange={(value) =>
                                  updateDeductible(deductible.id, 'showType', value)
                                }
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="OPTIONAL">Optional</SelectItem>
                                  <SelectItem value="MANDATORY">Mandatory</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={deductible.pricingType || 'percentage'}
                                onValueChange={(value) => {
                                  const v = value as 'percentage' | 'fixed' | 'flat';
                                  setPolicyDeductibles((prev) =>
                                    prev.map((d) => {
                                      if (d.id !== deductible.id) return d;
                                      return {
                                        ...d,
                                        pricingType: v,
                                        discount:
                                          v === 'percentage'
                                            ? Math.min(100, Math.max(0, Number(d.discount) || 0))
                                            : d.discount,
                                      };
                                    }),
                                  );
                                }}
                              >
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">Percentage</SelectItem>
                                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                                  <SelectItem value="flat">Flat</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <FormattedNumberInput
                                value={deductible.discount ? Number(deductible.discount) : 0}
                                onChange={(val) => updateDeductible(deductible.id, 'discount', val)}
                                className="w-32"
                                min={deductible.pricingType === 'percentage' ? 0 : undefined}
                                max={deductible.pricingType === 'percentage' ? 100 : undefined}
                                allowDecimals={deductible.pricingType === 'percentage'}
                                maxDecimals={deductible.pricingType === 'percentage' ? 2 : undefined}
                                minFractionDigits={deductible.pricingType === 'percentage' ? 0 : undefined}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDeductible(deductible.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Wording Configuration Tab */}
            <TabsContent value="wording" className="space-y-6">
              <WordingConfigurations
                policyWordingsError={policyWordingsError}
                isLoadingPolicyWordings={isLoadingPolicyWordings}
                openUploadDialog={openUploadDialog}
                policyWordings={policyWordings}
                openEditDialog={openEditDialog}
                isWordingUploadDialogOpen={isWordingUploadDialogOpen}
                setIsWordingUploadDialogOpen={setIsWordingUploadDialogOpen}
                editingWording={editingWording}
                wordingUploadTitle={wordingUploadTitle}
                setWordingUploadTitle={setWordingUploadTitle}
                handleFileUpload={handleFileUpload}
                wordingUploadFile={wordingUploadFile}
                wordingUploadActive={wordingUploadActive}
                setWordingUploadActive={setWordingUploadActive}
                handleSavePolicyWording={handleSavePolicyWording}
                isUploadingWording={isUploadingWording}
                isUploadingFile={isUploadingFile}
                handleToggleWordingActive={handleToggleWordingActive}
                onDeleteWording={handleDeleteWording}
                onViewWording={handleViewWording}
              />
            </TabsContent>
            {/* Document Management Tab */}
            <TabsContent value="document-management" className="space-y-6">
              {isLoadingUnderwritingDocs ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 border rounded-md">
                      <div className="w-56 h-5 bg-gray-200 rounded animate-pulse mb-3" />
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {underwritingDocsError && (
                    <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                      {underwritingDocsError}
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Underwriting Document
                          </CardTitle>
                          <CardDescription>
                            Manage document types required for underwriting
                          </CardDescription>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="gap-2"
                              onClick={() =>
                                setNewUnderwritingDocument(defaultDocumentFormState())
                              }
                            >
                              <Plus className="w-4 h-4" />
                              Add New
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[525px]">
                            <DialogHeader>
                              <DialogTitle>Add New Underwriting Document Type</DialogTitle>
                              <DialogDescription>
                                Create a new document type required for underwriting
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="underwriting-doc-label">Display Label *</Label>
                                <Input
                                  id="underwriting-doc-label"
                                  value={newUnderwritingDocument.label}
                                  onChange={(e) =>
                                    setNewUnderwritingDocument({
                                      ...newUnderwritingDocument,
                                      label: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., Underwriting Questionnaire"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="underwriting-doc-description">Description</Label>
                                <Input
                                  id="underwriting-doc-description"
                                  value={newUnderwritingDocument.description || ''}
                                  onChange={(e) =>
                                    setNewUnderwritingDocument({
                                      ...newUnderwritingDocument,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., Detailed underwriting questionnaire"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="underwriting-doc-required"
                                  checked={newUnderwritingDocument.required || false}
                                  onCheckedChange={(checked) =>
                                    setNewUnderwritingDocument({
                                      ...newUnderwritingDocument,
                                      required: checked === true,
                                    })
                                  }
                                />
                                <Label htmlFor="underwriting-doc-required">
                                  Required Document
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="underwriting-doc-active"
                                  checked={newUnderwritingDocument.active}
                                  onCheckedChange={(checked) =>
                                    setNewUnderwritingDocument({
                                      ...newUnderwritingDocument,
                                      active: checked === true,
                                    })
                                  }
                                />
                                <Label htmlFor="underwriting-doc-active">Active</Label>
                              </div>
                              <AiValidationFields
                                keyPrefix="underwriting-doc"
                                documentState={newUnderwritingDocument}
                                onChange={(updater) =>
                                  setNewUnderwritingDocument((prev) => ({
                                    ...prev,
                                    ...updater(prev),
                                  }))
                                }
                              />
                              {newUnderwritingDocument.aiQuestionValidation && (
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-1">
                                    <Label htmlFor="underwriting-doc-refer-toggle">
                                      Refer To Underwriter On Validation Failure
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                      Allow referral to the underwriter if AI validation fails.
                                    </p>
                                  </div>
                                  <Switch
                                    id="underwriting-doc-refer-toggle"
                                    checked={newUnderwritingDocument.referToUnderWrtiterAllowed}
                                    onCheckedChange={(checked) =>
                                      setNewUnderwritingDocument({
                                        ...newUnderwritingDocument,
                                        referToUnderWrtiterAllowed: checked,
                                      })
                                    }
                                  />
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={async () => {
                                  if (!product.id) return;
                                  try {
                                    setIsLoadingUnderwritingDocs(true);
                                    setUnderwritingDocsError(null);
                                    await saveProductUnderwritingDocument(
                                      product.id as string,
                                      {
                                        display_label: newUnderwritingDocument.label,
                                        description: newUnderwritingDocument.description || '',
                                        is_required: !!newUnderwritingDocument.required,
                                        is_active: !!newUnderwritingDocument.active,
                                        ai_question_validation:
                                          !!newUnderwritingDocument.aiQuestionValidation,
                                        refer_to_under_wrtiter_allowed:
                                          newUnderwritingDocument.aiQuestionValidation
                                            ? !!newUnderwritingDocument.referToUnderWrtiterAllowed
                                            : false,
                                        validation_questions: buildValidationQuestionsPayload(
                                          newUnderwritingDocument.aiQuestionValidation
                                            ? newUnderwritingDocument.validationQuestions
                                            : [],
                                        ),
                                        display_order: getNextOrder(underwritingDocuments),
                                        template_file: null,
                                      },
                                    );
                                    const resp = await getProductUnderwritingDocuments(
                                      product.id as string,
                                    );
                                    setUnderwritingDocuments(mapRequiredDocuments(resp));
                                    setNewUnderwritingDocument(defaultDocumentFormState());
                                    toast({
                                      title: 'Document Added',
                                      description:
                                        'Underwriting document type has been added successfully.',
                                    });
                                  } catch (err) {
                                    const status = err?.status as number | undefined;
                                    const message = err?.message as string | undefined;
                                    if (status === 400)
                                      setUnderwritingDocsError(
                                        message ||
                                          'Bad request while saving underwriting document.',
                                      );
                                    else if (status === 401)
                                      setUnderwritingDocsError(
                                        'Unauthorized. Please log in again.',
                                      );
                                    else if (status === 403)
                                      setUnderwritingDocsError(
                                        "You don't have access to underwriting documents.",
                                      );
                                    else if (status && status >= 500)
                                      setUnderwritingDocsError(
                                        'Server error. Please try again later.',
                                      );
                                    else
                                      setUnderwritingDocsError(
                                        message || 'Failed to save underwriting document.',
                                      );
                                  } finally {
                                    setIsLoadingUnderwritingDocs(false);
                                  }
                                }}
                              >
                                Save Document Type
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {underwritingDocuments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No underwriting documents configured yet.
                        </p>
                      ) : (
                        <Table equalColumns columnCount={6} minColumnWidth={130}>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order</TableHead>
                              <TableHead>Display Label</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-center">Required</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                              <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {underwritingDocuments
                              .sort((a, b) => a.order - b.order)
                              .map((doc) => (
                                <TableRow key={doc.id}>
                                  <TableCell className="font-medium">{doc.order}</TableCell>
                                  <TableCell>{doc.label}</TableCell>
                                  <TableCell className="truncate" title={doc.description}>
                                    {doc.description}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex justify-center">
                                      <Badge variant={doc.required ? 'default' : 'secondary'}>
                                        {doc.required ? 'Required' : 'Optional'}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex justify-center">
                                      <Badge
                                        variant={doc.active ? 'default' : 'secondary'}
                                        className="cursor-pointer"
                                        onClick={() => toggleUnderwritingDocumentActive(doc.id)}
                                      >
                                        {doc.active ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex justify-center gap-2">
                                      <Dialog
                                        open={
                                          !!editingUnderwritingDocument &&
                                          editingUnderwritingDocument.id === doc.id
                                        }
                                        onOpenChange={(open) => {
                                          if (open) {
                                            setEditingUnderwritingDocument(doc);
                                          } else {
                                            setEditingUnderwritingDocument(null);
                                          }
                                        }}
                                      >
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingUnderwritingDocument(doc)}
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[525px]">
                                          <DialogHeader>
                                            <DialogTitle>Edit Underwriting Document</DialogTitle>
                                          </DialogHeader>
                                          {editingUnderwritingDocument && (
                                            <div className="space-y-4">
                                              <div className="space-y-2">
                                                <Label htmlFor="edit-underwriting-doc-label">
                                                  Display Label *
                                                </Label>
                                                <Input
                                                  id="edit-underwriting-doc-label"
                                                  value={editingUnderwritingDocument.label}
                                                  onChange={(e) =>
                                                    setEditingUnderwritingDocument({
                                                      ...editingUnderwritingDocument,
                                                      label: e.target.value,
                                                    })
                                                  }
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label htmlFor="edit-underwriting-doc-description">
                                                  Description
                                                </Label>
                                                <Input
                                                  id="edit-underwriting-doc-description"
                                                  value={
                                                    editingUnderwritingDocument.description || ''
                                                  }
                                                  onChange={(e) =>
                                                    setEditingUnderwritingDocument({
                                                      ...editingUnderwritingDocument,
                                                      description: e.target.value,
                                                    })
                                                  }
                                                />
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <Checkbox
                                                  id="edit-underwriting-doc-required"
                                                  checked={
                                                    editingUnderwritingDocument.required || false
                                                  }
                                                  onCheckedChange={(checked) =>
                                                    setEditingUnderwritingDocument({
                                                      ...editingUnderwritingDocument,
                                                      required: checked === true,
                                                    })
                                                  }
                                                />
                                                <Label htmlFor="edit-underwriting-doc-required">
                                                  Required Document
                                                </Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <Checkbox
                                                  id="edit-underwriting-doc-active"
                                                  checked={editingUnderwritingDocument.active}
                                                  onCheckedChange={(checked) =>
                                                    setEditingUnderwritingDocument({
                                                      ...editingUnderwritingDocument,
                                                      active: checked === true,
                                                    })
                                                  }
                                                />
                                                <Label htmlFor="edit-underwriting-doc-active">
                                                  Active
                                                </Label>
                                              </div>
                                              <AiValidationFields
                                                keyPrefix={`edit-underwriting-doc-${doc.id}`}
                                                documentState={editingUnderwritingDocument}
                                                onChange={(updater) =>
                                                  setEditingUnderwritingDocument((prev) =>
                                                    prev
                                                      ? {
                                                        ...prev,
                                                        ...updater(prev),
                                                      }
                                                      : prev,
                                                  )
                                                }
                                                onDeleteQuestion={(question, index) =>
                                                  product.id && editingUnderwritingDocument
                                                    ? deleteValidationQuestionWithApi({
                                                      productId: product.id,
                                                      documentId: String(editingUnderwritingDocument.id),
                                                      question,
                                                      index,
                                                      deleteQuestion:
                                                        deleteProductUnderwritingDocumentValidationQuestion,
                                                      setDocument: setEditingUnderwritingDocument,
                                                      errorSetter: setUnderwritingDocsError,
                                                    })
                                                    : undefined
                                                }
                                                deletingQuestionIds={deletingValidationQuestionIds}
                                              />
                                              {editingUnderwritingDocument.aiQuestionValidation && (
                                                <div className="flex items-center justify-between rounded-lg border p-3">
                                                  <div className="space-y-1">
                                                    <Label htmlFor="edit-underwriting-doc-refer-toggle">
                                                      Refer To Underwriter On Validation Failure
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                      Allow referral to the underwriter if AI validation fails.
                                                    </p>
                                                  </div>
                                                  <Switch
                                                    id="edit-underwriting-doc-refer-toggle"
                                                    checked={
                                                      editingUnderwritingDocument.referToUnderWrtiterAllowed
                                                    }
                                                    onCheckedChange={(checked) =>
                                                      setEditingUnderwritingDocument({
                                                        ...editingUnderwritingDocument,
                                                        referToUnderWrtiterAllowed: checked,
                                                      })
                                                    }
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          <DialogFooter>
                                            <Button onClick={handleEditUnderwritingDocument}>
                                              Save Changes
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleUnderwritingDeleteDocument(String(doc.id))
                                        }
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
              {isLoadingRequiredDocs ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 border rounded-md">
                      <div className="w-56 h-5 bg-gray-200 rounded animate-pulse mb-3" />
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {requiredDocsError && (
                    <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                      {requiredDocsError}
                    </div>
                  )}

                  {/* Policy Issuance Document */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Policy Issuance Document
                          </CardTitle>
                          <CardDescription>
                            Manage document types for policy issuance
                          </CardDescription>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="gap-2"
                              onClick={() =>
                                setNewDocument(defaultDocumentFormState())
                              }
                            >
                              <Plus className="w-4 h-4" />
                              Add New
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[525px]">
                            <DialogHeader>
                              <DialogTitle>Add New Document Type</DialogTitle>
                              <DialogDescription>
                                Create a new policy issuance document type
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="doc-label">Display Label *</Label>
                                <Input
                                  id="doc-label"
                                  value={newDocument.label}
                                  onChange={(e) =>
                                    setNewDocument({
                                      ...newDocument,
                                      label: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., BOQ or Cost Breakdown"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="doc-description">Description</Label>
                                <Input
                                  id="doc-description"
                                  value={newDocument.description || ''}
                                  onChange={(e) =>
                                    setNewDocument({
                                      ...newDocument,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., Bill of quantities or detailed cost breakdown"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="doc-template">Template (Optional)</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="doc-template"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => handleTemplateUpload(e)}
                                    className="hidden"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('doc-template')?.click()}
                                    className="w-full"
                                    disabled={isUploadingTemplate}
                                  >
                                    {isUploadingTemplate ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        {newDocument.template
                                          ? 'Change Template'
                                          : 'Upload Template'}
                                      </>
                                    )}
                                  </Button>
                                </div>
                                {newDocument.template && (
                                  <div className="flex items-center justify-between bg-muted p-2 rounded">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4" />
                                      <div>
                                        <span className="text-sm">{newDocument.template.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          ({newDocument.template.size})
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTemplate()}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="doc-required"
                                  checked={newDocument.required || false}
                                  onCheckedChange={(checked) =>
                                    setNewDocument({
                                      ...newDocument,
                                      required: checked === true,
                                    })
                                  }
                                />
                                <Label htmlFor="doc-required">Required Document</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="doc-active"
                                  checked={newDocument.active}
                                  onCheckedChange={(checked) =>
                                    setNewDocument({
                                      ...newDocument,
                                      active: checked === true,
                                    })
                                  }
                                />
                                <Label htmlFor="doc-active">Active</Label>
                              </div>
                              <AiValidationFields
                                keyPrefix="policy-doc"
                                documentState={newDocument}
                                onChange={(updater) =>
                                  setNewDocument((prev) => ({
                                    ...prev,
                                    ...updater(prev),
                                  }))
                                }
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={async () => {
                                  if (!product.id) return;
                                  try {
                                    setIsLoadingRequiredDocs(true);
                                    setRequiredDocsError(null);
                                    await saveProductRequiredDocument(product.id as string, {
                                      display_label: newDocument.label,
                                      description: newDocument.description || '',
                                      is_required: !!newDocument.required,
                                      is_active: !!newDocument.active,
                                      ai_question_validation: !!newDocument.aiQuestionValidation,
                                      validation_questions: buildValidationQuestionsPayload(
                                        newDocument.aiQuestionValidation
                                          ? newDocument.validationQuestions
                                          : [],
                                      ),
                                      display_order: getNextOrder(requiredDocuments),
                                      template_file:
                                        (newDocument.template &&
                                          (newDocument.template.file as File)) ||
                                        null,
                                    });
                                    const resp = await getProductRequiredDocuments(
                                      product.id as string,
                                    );
                                    setRequiredDocuments(mapRequiredDocuments(resp));
                                    setNewDocument(defaultDocumentFormState());
                                    toast({
                                      title: 'Document added',
                                      description: 'Required document created successfully.',
                                    });
                                    setIsWordingUploadDialogOpen(false);
                                  } catch (err: unknown) {
                                    const e = err as {
                                      status?: number;
                                      message?: string;
                                    };
                                    const status = e?.status;
                                    const message = e?.message as string | undefined;
                                    if (status === 400)
                                      setRequiredDocsError(
                                        message || 'Bad request while creating document.',
                                      );
                                    else if (status === 401)
                                      setRequiredDocsError('Unauthorized. Please log in again.');
                                    else if (status === 403)
                                      setRequiredDocsError("You don't have access.");
                                    else if (status && status >= 500)
                                      setRequiredDocsError('Server error. Please try again later.');
                                    else
                                      setRequiredDocsError(message || 'Failed to create document.');
                                  } finally {
                                    setIsLoadingRequiredDocs(false);
                                  }
                                }}
                              >
                                Add Document Type
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Display Label</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-center">
                              <div className="flex justify-center">Required</div>
                            </TableHead>
                            <TableHead className="text-center">Template</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requiredDocuments
                            .sort((a, b) => a.order - b.order)
                            .map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell className="font-medium">{doc.order}</TableCell>
                                <TableCell>{doc.label}</TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {doc.description}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <Badge variant={doc.required ? 'default' : 'secondary'}>
                                      {doc.required ? 'Required' : 'Optional'}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {doc.template ? (
                                    <div className="flex items-center justify-center gap-2 min-w-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-primary hover:text-primary hover:bg-primary/10"
                                        onClick={() => handleViewDocument(doc)}
                                      >
                                        <Eye className="w-4 h-4 mr-1" />
                                        View
                                      </Button>
                                      <span title={doc.template.name} className="inline-flex">
                                        <Info className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0 cursor-help" />
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      No template
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <Badge
                                      variant={doc.active ? 'default' : 'secondary'}
                                      className="cursor-pointer"
                                      onClick={() => toggleDocumentActive(doc.id)}
                                    >
                                      {doc.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex gap-2 justify-center">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setEditingDocument({ ...doc })}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="sm:max-w-[525px]">
                                        <DialogHeader>
                                          <DialogTitle>Edit Document Type</DialogTitle>
                                          <DialogDescription>
                                            Update the document type information
                                          </DialogDescription>
                                        </DialogHeader>
                                        {editingDocument && (
                                          <div className="space-y-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-doc-label">
                                                Display Label *
                                              </Label>
                                              <Input
                                                id="edit-doc-label"
                                                value={editingDocument.label}
                                                onChange={(e) =>
                                                  setEditingDocument({
                                                    ...editingDocument,
                                                    label: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-doc-description">
                                                Description
                                              </Label>
                                              <Input
                                                id="edit-doc-description"
                                                value={editingDocument.description || ''}
                                                onChange={(e) =>
                                                  setEditingDocument({
                                                    ...editingDocument,
                                                    description: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-doc-template">
                                                Template (Optional)
                                              </Label>
                                              <div className="flex items-center gap-2">
                                                <Input
                                                  id={`edit-doc-template-${doc.id}`}
                                                  type="file"
                                                  accept=".pdf,.doc,.docx"
                                                  onChange={(e) => handleTemplateUpload(e, true)}
                                                  className="hidden"
                                                />
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  onClick={() =>
                                                    document
                                                      .getElementById(`edit-doc-template-${doc.id}`)
                                                      ?.click()
                                                  }
                                                  className="w-full"
                                                  disabled={isUploadingTemplate}
                                                >
                                                  {isUploadingTemplate ? (
                                                    <>
                                                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                                                      Uploading...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Upload className="w-4 h-4 mr-2" />
                                                      {editingDocument.template
                                                        ? 'Change Template'
                                                        : 'Upload Template'}
                                                    </>
                                                  )}
                                                </Button>
                                              </div>
                                              {editingDocument.template && (
                                                <div className="flex items-center justify-between bg-muted p-2 rounded">
                                                  <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4" />
                                                    <div>
                                                      <span className="text-sm">
                                                        {editingDocument.template.name}
                                                      </span>
                                                      <span className="text-xs text-muted-foreground">
                                                        ({editingDocument.template.size})
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeTemplate(true)}
                                                  >
                                                    <X className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <Checkbox
                                                id="edit-doc-required"
                                                checked={editingDocument.required || false}
                                                onCheckedChange={(checked) =>
                                                  setEditingDocument({
                                                    ...editingDocument,
                                                    required: checked === true,
                                                  })
                                                }
                                              />
                                              <Label htmlFor="edit-doc-required">
                                                Required Document
                                              </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <Checkbox
                                                id="edit-doc-active"
                                                checked={editingDocument.active}
                                                onCheckedChange={(checked) =>
                                                  setEditingDocument({
                                                    ...editingDocument,
                                                    active: checked === true,
                                                  })
                                                }
                                              />
                                              <Label htmlFor="edit-doc-active">Active</Label>
                                            </div>
                                            <AiValidationFields
                                              keyPrefix={`edit-policy-doc-${doc.id}`}
                                              documentState={editingDocument}
                                              onChange={(updater) =>
                                                setEditingDocument((prev) =>
                                                  prev
                                                    ? {
                                                      ...prev,
                                                      ...updater(prev),
                                                    }
                                                    : prev,
                                                )
                                              }
                                              onDeleteQuestion={(question, index) =>
                                                product.id && editingDocument
                                                  ? deleteValidationQuestionWithApi({
                                                    productId: product.id,
                                                    documentId: String(editingDocument.id),
                                                    question,
                                                    index,
                                                    deleteQuestion:
                                                      deleteProductRequiredDocumentValidationQuestion,
                                                    setDocument: setEditingDocument,
                                                    errorSetter: setRequiredDocsError,
                                                  })
                                                  : undefined
                                              }
                                              deletingQuestionIds={deletingValidationQuestionIds}
                                            />
                                          </div>
                                        )}
                                        <DialogFooter>
                                          <Button onClick={handleEditDocument}>Save Changes</Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
              {isLoadingEndorsementDocs ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 border rounded-md">
                      <div className="w-56 h-5 bg-gray-200 rounded animate-pulse mb-3" />
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {endorsementDocsError && (
                    <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                      {endorsementDocsError}
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Endorsement Document
                          </CardTitle>
                          <CardDescription>
                            Manage document types required for endorsements
                          </CardDescription>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="gap-2"
                              onClick={() =>
                                setNewEndorsementDocument(defaultDocumentFormState())
                              }
                            >
                              <Plus className="w-4 h-4" />
                              Add New
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[525px]">
                            <DialogHeader>
                              <DialogTitle>Add New Endorsement Document Type</DialogTitle>
                              <DialogDescription>
                                Create a new document type required for endorsements
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="endorsement-doc-label">Display Label *</Label>
                                <Input
                                  id="endorsement-doc-label"
                                  value={newEndorsementDocument.label}
                                  onChange={(e) =>
                                    setNewEndorsementDocument({
                                      ...newEndorsementDocument,
                                      label: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., Endorsement Schedule"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="endorsement-doc-description">Description</Label>
                                <Input
                                  id="endorsement-doc-description"
                                  value={newEndorsementDocument.description || ''}
                                  onChange={(e) =>
                                    setNewEndorsementDocument({
                                      ...newEndorsementDocument,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., Signed endorsement schedule"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="endorsement-doc-template">
                                  Template (Optional)
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="endorsement-doc-template"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => handleEndorsementTemplateUpload(e)}
                                    className="hidden"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                      document
                                        .getElementById('endorsement-doc-template')
                                        ?.click()
                                    }
                                    className="w-full"
                                    disabled={isUploadingEndorsementTemplate}
                                  >
                                    {isUploadingEndorsementTemplate ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        {newEndorsementDocument.template
                                          ? 'Change Template'
                                          : 'Upload Template'}
                                      </>
                                    )}
                                  </Button>
                                </div>
                                {newEndorsementDocument.template && (
                                  <div className="flex items-center justify-between bg-muted p-2 rounded">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4" />
                                      <div>
                                        <span className="text-sm">
                                          {newEndorsementDocument.template.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          ({newEndorsementDocument.template.size})
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeEndorsementTemplate()}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="endorsement-doc-required"
                                  checked={newEndorsementDocument.required || false}
                                  onCheckedChange={(checked) =>
                                    setNewEndorsementDocument({
                                      ...newEndorsementDocument,
                                      required: checked === true,
                                    })
                                  }
                                />
                                <Label htmlFor="endorsement-doc-required">
                                  Required Document
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="endorsement-doc-active"
                                  checked={newEndorsementDocument.active}
                                  onCheckedChange={(checked) =>
                                    setNewEndorsementDocument({
                                      ...newEndorsementDocument,
                                      active: checked === true,
                                    })
                                  }
                                />
                                <Label htmlFor="endorsement-doc-active">Active</Label>
                              </div>
                              <AiValidationFields
                                keyPrefix="endorsement-doc"
                                documentState={newEndorsementDocument}
                                onChange={(updater) =>
                                  setNewEndorsementDocument((prev) => ({
                                    ...prev,
                                    ...updater(prev),
                                  }))
                                }
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={async () => {
                                  if (!product.id) return;
                                  try {
                                    setIsLoadingEndorsementDocs(true);
                                    setEndorsementDocsError(null);
                                    await saveProductEndorsementDocument(product.id as string, {
                                      display_label: newEndorsementDocument.label,
                                      description: newEndorsementDocument.description || '',
                                      is_required: !!newEndorsementDocument.required,
                                      is_active: !!newEndorsementDocument.active,
                                      ai_question_validation:
                                        !!newEndorsementDocument.aiQuestionValidation,
                                      validation_questions: buildValidationQuestionsPayload(
                                        newEndorsementDocument.aiQuestionValidation
                                          ? newEndorsementDocument.validationQuestions
                                          : [],
                                      ),
                                      display_order: getNextOrder(endorsementDocuments),
                                      template_file:
                                        (newEndorsementDocument.template &&
                                          (newEndorsementDocument.template.file as File)) ||
                                        null,
                                    });
                                    const resp = await getProductEndorsementDocuments(
                                      product.id as string,
                                    );
                                    setEndorsementDocuments(
                                      mapRequiredDocuments(
                                        resp as ProductEndorsementDocumentItem[],
                                      ),
                                    );
                                    setNewEndorsementDocument(defaultDocumentFormState());
                                    toast({
                                      title: 'Document Added',
                                      description:
                                        'Endorsement document type has been added successfully.',
                                    });
                                  } catch (err) {
                                    const status = err?.status as number | undefined;
                                    const message = err?.message as string | undefined;
                                    if (status === 400)
                                      setEndorsementDocsError(
                                        message ||
                                        'Bad request while saving endorsement document.',
                                      );
                                    else if (status === 401)
                                      setEndorsementDocsError(
                                        'Unauthorized. Please log in again.',
                                      );
                                    else if (status === 403)
                                      setEndorsementDocsError(
                                        "You don't have access to endorsement documents.",
                                      );
                                    else if (status && status >= 500)
                                      setEndorsementDocsError(
                                        'Server error. Please try again later.',
                                      );
                                    else
                                      setEndorsementDocsError(
                                        message || 'Failed to save endorsement document.',
                                      );
                                  } finally {
                                    setIsLoadingEndorsementDocs(false);
                                  }
                                }}
                              >
                                Save Document Type
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {endorsementDocuments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No endorsement documents configured yet.
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order</TableHead>
                              <TableHead>Display Label</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-center">
                                <div className="flex justify-center">Required</div>
                              </TableHead>
                              <TableHead className="text-center">Template</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                              <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {endorsementDocuments
                              .sort((a, b) => a.order - b.order)
                              .map((doc) => (
                                <TableRow key={doc.id}>
                                  <TableCell className="font-medium">{doc.order}</TableCell>
                                  <TableCell>{doc.label}</TableCell>
                                  <TableCell className="max-w-xs truncate">
                                    {doc.description}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex justify-center">
                                      <Badge variant={doc.required ? 'default' : 'secondary'}>
                                        {doc.required ? 'Required' : 'Optional'}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {doc.template ? (
                                      <div className="flex items-center justify-center gap-2 min-w-0">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-primary hover:text-primary hover:bg-primary/10"
                                          onClick={async () => {
                                            if (!product.id) return;
                                            try {
                                              const { signedUrl } =
                                                await getProductEndorsementDocumentSignedUrl(
                                                  product.id,
                                                  String(doc.id),
                                                );
                                              window.open(
                                                signedUrl,
                                                '_blank',
                                                'noopener,noreferrer',
                                              );
                                            } catch {
                                              toast({
                                                title: 'Download failed',
                                                description:
                                                  'Could not download template. Please try again.',
                                                variant: 'destructive',
                                              });
                                            }
                                          }}
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          View
                                        </Button>
                                        <span title={doc.template.name} className="inline-flex">
                                          <Info className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0 cursor-help" />
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        No template
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex justify-center">
                                      <Badge
                                        variant={doc.active ? 'default' : 'secondary'}
                                        className="cursor-pointer"
                                        onClick={() => toggleEndorsementDocumentActive(doc.id)}
                                      >
                                        {doc.active ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex gap-2 justify-center">
                                      <Dialog
                                        open={
                                          !!editingEndorsementDocument &&
                                          editingEndorsementDocument.id === doc.id
                                        }
                                        onOpenChange={(open) => {
                                          if (open) {
                                            setEditingEndorsementDocument(doc);
                                          } else {
                                            setEditingEndorsementDocument(null);
                                          }
                                        }}
                                      >
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingEndorsementDocument(doc)}
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[525px]">
                                          <DialogHeader>
                                            <DialogTitle>Edit Endorsement Document</DialogTitle>
                                          </DialogHeader>
                                          {editingEndorsementDocument && (
                                            <div className="space-y-4">
                                              <div className="space-y-2">
                                                <Label htmlFor="edit-endorsement-doc-label">
                                                  Display Label *
                                                </Label>
                                                <Input
                                                  id="edit-endorsement-doc-label"
                                                  value={editingEndorsementDocument.label}
                                                  onChange={(e) =>
                                                    setEditingEndorsementDocument({
                                                      ...editingEndorsementDocument,
                                                      label: e.target.value,
                                                    })
                                                  }
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label htmlFor="edit-endorsement-doc-description">
                                                  Description
                                                </Label>
                                                <Input
                                                  id="edit-endorsement-doc-description"
                                                  value={editingEndorsementDocument.description || ''}
                                                  onChange={(e) =>
                                                    setEditingEndorsementDocument({
                                                      ...editingEndorsementDocument,
                                                      description: e.target.value,
                                                    })
                                                  }
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label htmlFor="edit-endorsement-doc-template">
                                                  Template (Optional)
                                                </Label>
                                                <div className="flex items-center gap-2">
                                                  <Input
                                                    id={`edit-endorsement-doc-template-${doc.id}`}
                                                    type="file"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={(e) =>
                                                      handleEndorsementTemplateUpload(e, true)
                                                    }
                                                    className="hidden"
                                                  />
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                      document
                                                        .getElementById(
                                                          `edit-endorsement-doc-template-${doc.id}`,
                                                        )
                                                        ?.click()
                                                    }
                                                    className="w-full"
                                                    disabled={isUploadingEndorsementTemplate}
                                                  >
                                                    {isUploadingEndorsementTemplate ? (
                                                      <>
                                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                                                        Uploading...
                                                      </>
                                                    ) : (
                                                      <>
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        {editingEndorsementDocument.template
                                                          ? 'Change Template'
                                                          : 'Upload Template'}
                                                      </>
                                                    )}
                                                  </Button>
                                                </div>
                                                {editingEndorsementDocument.template && (
                                                  <div className="flex items-center justify-between bg-muted p-2 rounded">
                                                    <div className="flex items-center gap-2">
                                                      <FileText className="w-4 h-4" />
                                                      <div>
                                                        <span className="text-sm">
                                                          {editingEndorsementDocument.template.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                          {editingEndorsementDocument.template.size}
                                                        </span>
                                                      </div>
                                                    </div>
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => removeEndorsementTemplate(true)}
                                                    >
                                                      <X className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <Checkbox
                                                  id="edit-endorsement-doc-required"
                                                  checked={editingEndorsementDocument.required || false}
                                                  onCheckedChange={(checked) =>
                                                    setEditingEndorsementDocument({
                                                      ...editingEndorsementDocument,
                                                      required: checked === true,
                                                    })
                                                  }
                                                />
                                                <Label htmlFor="edit-endorsement-doc-required">
                                                  Required Document
                                                </Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <Checkbox
                                                  id="edit-endorsement-doc-active"
                                                  checked={editingEndorsementDocument.active}
                                                  onCheckedChange={(checked) =>
                                                    setEditingEndorsementDocument({
                                                      ...editingEndorsementDocument,
                                                      active: checked === true,
                                                    })
                                                  }
                                                />
                                                <Label htmlFor="edit-endorsement-doc-active">
                                                  Active
                                                </Label>
                                              </div>
                                              <AiValidationFields
                                                keyPrefix={`edit-endorsement-doc-${doc.id}`}
                                                documentState={editingEndorsementDocument}
                                                onChange={(updater) =>
                                                  setEditingEndorsementDocument((prev) =>
                                                    prev
                                                      ? {
                                                        ...prev,
                                                        ...updater(prev),
                                                      }
                                                      : prev,
                                                  )
                                                }
                                                onDeleteQuestion={(question, index) =>
                                                  product.id && editingEndorsementDocument
                                                    ? deleteValidationQuestionWithApi({
                                                      productId: product.id,
                                                      documentId: String(editingEndorsementDocument.id),
                                                      question,
                                                      index,
                                                      deleteQuestion:
                                                        deleteProductEndorsementDocumentValidationQuestion,
                                                      setDocument: setEditingEndorsementDocument,
                                                      errorSetter: setEndorsementDocsError,
                                                    })
                                                    : undefined
                                                }
                                                deletingQuestionIds={deletingValidationQuestionIds}
                                              />
                                            </div>
                                          )}
                                          <DialogFooter>
                                            <Button onClick={handleEditEndorsementDocument}>
                                              Save Changes
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setConfirmDialog({
                                            isOpen: true,
                                            title: 'Delete Document Type',
                                            description:
                                              'Are you sure you want to delete this endorsement document type? This action cannot be undone.',
                                            action: async () => {
                                              if (!product.id) return;
                                              try {
                                                await deleteProductEndorsementDocument(
                                                  product.id,
                                                  String(doc.id),
                                                );
                                                const resp = await getProductEndorsementDocuments(
                                                  product.id as string,
                                                );
                                                setEndorsementDocuments(
                                                  mapRequiredDocuments(
                                                    resp as ProductEndorsementDocumentItem[],
                                                  ),
                                                );
                                                toast({
                                                  title: 'Document Deleted',
                                                  description:
                                                    'Endorsement document type has been deleted.',
                                                });
                                              } catch (err) {
                                                const status = err?.status as number | undefined;
                                                const message = err?.message as string | undefined;
                                                if (status === 400)
                                                  setEndorsementDocsError(
                                                    message ||
                                                    'Bad request while deleting endorsement document.',
                                                  );
                                                else if (status === 401)
                                                  setEndorsementDocsError(
                                                    'Unauthorized. Please log in again.',
                                                  );
                                                else if (status === 403)
                                                  setEndorsementDocsError(
                                                    "You don't have access to endorsement documents.",
                                                  );
                                                else if (status && status >= 500)
                                                  setEndorsementDocsError(
                                                    'Server error. Please try again later.',
                                                  );
                                                else
                                                  setEndorsementDocsError(
                                                    message || 'Failed to delete endorsement document.',
                                                  );
                                              } finally {
                                                setConfirmDialog((prev) => ({
                                                  ...prev,
                                                  isOpen: false,
                                                }));
                                              }
                                            },
                                          });
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                </>
              )}
            </TabsContent>


          </Tabs>
        </div>
      </div>

      <Dialog open={isQuoteFormatDialogOpen} onOpenChange={setIsQuoteFormatDialogOpen}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quote Format</DialogTitle>
            <DialogDescription>
              Configure the quote format for the selected template, then preview or save it.
            </DialogDescription>
          </DialogHeader>

          {(templates ?? []).length === 0 ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-2xl font-semibold text-center">Document not configured</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Select
                  value={selectedTemplateId || ''}
                  onValueChange={(value) => {
                    setIsLoadingQuoteFormat(true);
                    setSelectedTemplateId(value);
                  }}
                >
                  <SelectTrigger className="h-8 w-full sm:w-56" aria-label="Select Template">
                    <SelectValue placeholder="Select Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {(templates ?? []).length > 0 ? (
                      (templates ?? []).map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-2 text-xs text-muted-foreground">No templates</div>
                    )}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={showPreview} size="sm">
                  Preview
                </Button>
                <Button
                  variant="default"
                  disabled={isSavingQuoteFormat}
                  onClick={handleSaveTemplateQuoteFormat}
                >
                  {isSavingQuoteFormat ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircle className="animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save Quote Format'
                  )}
                </Button>
              </div>

              <QuoteFormatTab
                quoteFormatError={quoteFormatError}
                isLoadingQuoteFormat={isLoadingQuoteFormat}
                templates={templates}
                quoteConfig={quoteConfig}
                updateQuoteConfig={updateQuoteConfig}
                uploadedLogoUrl={uploadedLogoUrl}
                setQuoteLogoFile={setQuoteLogoFile}
                quoteLogoFile={quoteLogoFile}
                setSignatureFile={setSignatureFile}
                signatureFile={signatureFile}
                uploadedSignatureUrl={uploadedSignatureUrl}
                setStampFile={setStampFile}
                stampFile={stampFile}
                uploadedStampUrl={uploadedStampUrl}
                setUploadedLogoUrl={setUploadedLogoUrl}
                setUploadedSignatureUrl={setUploadedSignatureUrl}
                setUploadedStampUrl={setUploadedStampUrl}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />

      {/* Quote Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent
          className="max-w-5xl w-[95vw] p-0 max-h-[85vh] overflow-y-auto"
          showClose={false}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
            <div>
              <DialogTitle>
                {previewTemplate?.type === 'policy' ? 'Policy Preview' : 'Quote Preview'}
              </DialogTitle>
              <DialogDescription>
                {previewTemplate?.type === 'policy'
                  ? 'Rendered using your current Policy Document selections'
                  : 'Rendered using your current Quote Format selections'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isPdfDownloading}
              >
                {isPdfDownloading ? (
                  <>
                    <span className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button size="sm" onClick={() => setIsPreviewDialogOpen(false)}>
                Close Preview
              </Button>
            </div>
          </div>

          <div id="printable" className="bg-muted/20 p-4">
            {previewTemplate ? (
              <DocumentPreview
                template={previewTemplate}
                parameters={previewParameters}
                values={previewValues}
                hiddenTypes={previewHiddenTypes}
              />
            ) : (
              <div
                className="mx-auto bg-white shadow-sm border w-full max-w-[794px]"
                style={{ minHeight: '1122px' }}
              >
                <div
                  className="px-8 py-6 flex items-center justify-between"
                  style={{
                    background: quoteConfig.header.headerColor,
                    color: quoteConfig.header.headerTextColor,
                  }}
                >
                  <div className="flex-1">
                    <h1 className="text-2xl font-semibold leading-tight">
                      {quoteConfig.header.companyName || 'Company Name'}
                    </h1>
                    <p className="opacity-90 text-sm whitespace-pre-line">
                      {quoteConfig.header.companyAddress || 'Company Address'}
                    </p>
                  </div>
                  <div className="w-28 h-12 flex items-center justify-center border border-white/30 rounded ml-6">
                    {quoteConfig.header.logoUrl || uploadedLogoUrl ? (
                      <img
                        src={quoteConfig.header.logoUrl || uploadedLogoUrl || ''}
                        alt="Company Logo"
                        className="max-h-10 object-contain"
                      />
                    ) : (
                      <span className="text-xs opacity-90">Logo</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Configuration Confirmation Dialog */}
      <AlertDialog open={isConfirmSaveDialogOpen} onOpenChange={setIsConfirmSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save All Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save the current configuration? This will overwrite any
              previously saved settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>Save All Config</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete/Remove Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDialog.action}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Network debug dialog removed per request */}
    </div>
  );
};

export default SingleProductConfig;
