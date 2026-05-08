import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/shared/utils/lib-utils';
import { Button } from '@/components/ui/button';
import {
  type CalculationConfig,
  type Page,
  type Section,
  type Field,
  type GeneralTemplateListItem,
  type ProductFormDesignType,
  getCustomerProfileTemplateDesign,
  getGeneralTemplateDesign,
  getGeneralTemplates,
  isFieldLocked,
  SubField,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
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
import { getAllGlobalMasters, GlobalMasterDto } from '@/features/product-config/masters/api/masters';

// ΓöÇΓöÇ Extracted hooks ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
import { useFormPersistence } from '../proposal-form/hooks/useFormPersistence';
import { useDragAndDrop } from '../proposal-form/hooks/useDragAndDrop';
import { usePageOperations } from '../proposal-form/hooks/usePageOperations';
import { useSectionOperations } from '../proposal-form/hooks/useSectionOperations';
import { useFieldEditor } from '../proposal-form/hooks/useFieldEditor';
import { usePreview } from '../proposal-form/hooks/usePreview';
import {
  FileText,
  Type,
  Hash,
  Calendar,
  Clock,
  CheckSquare,
  Upload,
  List,
  ChevronDown,
  ChevronRight,
  MapPin,
  CalendarDays,
  Circle,
  User,
  Mail,
  Phone,
  Building2,
  MapPin as MapPinIcon,
  CreditCard,
  Briefcase,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FullscreenPreviewDialog } from '../proposal-form/components/FullscreenPreviewDialog';
import { FieldConfigDialog } from '../proposal-form/components/FieldConfigDialog';
import { PageValidationDialog } from '../proposal-form/components/PageValidationDialog';
import { CalculationDialog } from '../proposal-form/components/CalculationDialog';
import { FormDesignHeader } from '../proposal-form/components/FormDesignHeader';
import { ComponentsSidebar } from '../proposal-form/components/ComponentsSidebar';
import { DesignCanvas } from '../proposal-form/components/DesignCanvas';
import { ApiIntegrationDialog } from '../proposal-form/components/ApiIntegrationDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getIntegrations,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  type Integration,
  type IntegrationTriggerLevel,
} from '../integrations/api/integrations';


type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'dropdown'
  | 'date'
  | 'time'
  | 'datePeriod'
  | 'checkbox'
  | 'consent'
  | 'file'
  | 'multiselect'
  | 'multiselectDropdown'
  | 'location'
  | 'combination'
  | 'chooseButton'
  | 'policyPeriod';

type PageType =
  | 'general'
  | 'form'
  | 'payment'
  | 'quotesList'
  | 'policyDetails'
  | 'underwritingDocuments'
  | 'requiredDocuments';

const fieldsLibrary: {
  id: string;
  label: string;
  icon: React.ReactNode;
  field: Partial<Field>;
}[] = [
    {
      id: 'fullName',
      label: 'Full Name',
      icon: <User className="w-4 h-4" />,
      field: {
        type: 'text',
        label: 'Full Name',
        name: 'fullName',
        placeholder: 'Enter full name',
        required: true,
        validations: [
          { type: 'minLength', value: 2, message: 'Name must be at least 2 characters' },
          { type: 'maxLength', value: 100, message: 'Name must not exceed 100 characters' },
        ],
      },
    },
    {
      id: 'email',
      label: 'Email ID',
      icon: <Mail className="w-4 h-4" />,
      field: {
        type: 'text',
        label: 'Email ID',
        name: 'email',
        placeholder: 'Enter email address',
        required: true,
        validations: [
          {
            type: 'pattern',
            value: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            message: 'Please enter a valid email address',
          },
        ],
      },
    },
    {
      id: 'phoneNumber',
      label: 'Phone Number',
      icon: <Phone className="w-4 h-4" />,
      field: {
        type: 'text',
        label: 'Phone Number',
        name: 'phoneNumber',
        placeholder: 'Enter phone number',
        required: true,
        validations: [
          {
            type: 'pattern',
            value: '^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$',
            message: 'Please enter a valid phone number',
          },
        ],
      },
    },
    {
      id: 'companyName',
      label: 'Company Name',
      icon: <Building2 className="w-4 h-4" />,
      field: {
        type: 'text',
        label: 'Company Name',
        name: 'companyName',
        placeholder: 'Enter company name',
        required: false,
        validations: [
          { type: 'maxLength', value: 200, message: 'Company name must not exceed 200 characters' },
        ],
      },
    },
    {
      id: 'address',
      label: 'Address',
      icon: <MapPinIcon className="w-4 h-4" />,
      field: {
        type: 'text',
        label: 'Address',
        name: 'address',
        placeholder: 'Enter address',
        required: false,
        validations: [
          { type: 'maxLength', value: 500, message: 'Address must not exceed 500 characters' },
        ],
      },
    },
    {
      id: 'dateOfBirth',
      label: 'Date of Birth',
      icon: <Calendar className="w-4 h-4" />,
      field: {
        type: 'date',
        label: 'Date of Birth',
        name: 'dateOfBirth',
        required: false,
        validations: [
          { type: 'maxDate', value: 'today', message: 'Date of birth cannot be in the future' },
        ],
      },
    },
    {
      id: 'nationalId',
      label: 'National ID / Passport',
      icon: <CreditCard className="w-4 h-4" />,
      field: {
        type: 'text',
        label: 'National ID / Passport',
        name: 'nationalId',
        placeholder: 'Enter national ID or passport number',
        required: false,
        validations: [
          { type: 'maxLength', value: 50, message: 'ID number must not exceed 50 characters' },
        ],
      },
    },
    {
      id: 'occupation',
      label: 'Occupation',
      icon: <Briefcase className="w-4 h-4" />,
      field: {
        type: 'text',
        label: 'Occupation',
        name: 'occupation',
        placeholder: 'Enter occupation',
        required: false,
        validations: [
          { type: 'maxLength', value: 100, message: 'Occupation must not exceed 100 characters' },
        ],
      },
    },
  ];

const fieldTypes: {
  value: FieldType;
  label: string;
  icon: React.ReactNode;
  canBeRating?: boolean;
}[] = [
    { value: 'text', label: 'Text', icon: <Type className="w-4 h-4" />, canBeRating: false },
    { value: 'textarea', label: 'Textarea', icon: <FileText className="w-4 h-4" />, canBeRating: false },
    { value: 'number', label: 'Number', icon: <Hash className="w-4 h-4" />, canBeRating: true },
    { value: 'dropdown', label: 'Dropdown', icon: <ChevronDown className="w-4 h-4" />, canBeRating: true },
    { value: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" />, canBeRating: true },
    { value: 'time', label: 'Time', icon: <Clock className="w-4 h-4" />, canBeRating: true },
    { value: 'datePeriod', label: 'Date Period', icon: <CalendarDays className="w-4 h-4" />, canBeRating: true },
    { value: 'policyPeriod', label: 'Policy Period', icon: <CalendarDays className="w-4 h-4" />, canBeRating: true },
    { value: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="w-4 h-4" />, canBeRating: true },
    { value: 'consent', label: 'Consent', icon: <CheckSquare className="w-4 h-4" />, canBeRating: false },
    { value: 'file', label: 'File Upload', icon: <Upload className="w-4 h-4" />, canBeRating: false },
    { value: 'multiselect', label: 'Multi-Select', icon: <List className="w-4 h-4" />, canBeRating: true },
    { value: 'multiselectDropdown', label: 'Multi-Select Dropdown', icon: <List className="w-4 h-4" />, canBeRating: true },
    { value: 'location', label: 'Location Coordinates', icon: <MapPin className="w-4 h-4" />, canBeRating: false },
    { value: 'combination', label: 'Combination Fields', icon: <List className="w-4 h-4" />, canBeRating: true },
    { value: 'chooseButton', label: 'Choose Button (Radio)', icon: <Circle className="w-4 h-4" />, canBeRating: false },
  ];

function applyTemplateTitleToPages(pages: Page[], templateTitle: string): Page[] {
  if (!templateTitle.trim()) return pages;

  return pages.map((page, index) =>
    index === 0
      ? {
          ...page,
          title: templateTitle,
        }
      : page,
  );
}

function markInheritedLockedFields(pages: Page[]): Page[] {
  return pages.map((page) => ({
    ...page,
    sections: (page.sections || []).map((section) => ({
      ...section,
      fields: (section.fields || []).map((field) => ({
        ...field,
        metadata:
          isFieldLocked(field)
            ? {
                ...(field.metadata || {}),
                inheritedLockedFromTemplate: true,
              }
            : field.metadata,
      })),
    })),
  }));
}

function normalizePageGeneralTemplateName(page: Page): Page {
  const metadataTemplateName =
    typeof page.metadata?.generalTemplateName === 'string'
      ? page.metadata.generalTemplateName.trim()
      : '';
  const directTemplateName =
    typeof page.generalTemplateName === 'string' ? page.generalTemplateName.trim() : '';
  const generalTemplateName = directTemplateName || metadataTemplateName;

  return generalTemplateName
    ? {
        ...page,
        generalTemplateName,
      }
    : page;
}

function normalizePagesGeneralTemplateNames(pages: Page[]): Page[] {
  return pages.map(normalizePageGeneralTemplateName);
}

const ProposalFormDesign = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const normalizeCustomerCategory = (value?: string | null): string => {
    if (!value) return '';

    const categoryMap: Record<string, string> = {
      INDIVIDUAL: 'Individual',
      CORPORATE: 'Corporate',
      GOVERNMENT: 'Government',
      Individual: 'Individual',
      Corporate: 'Corporate',
      Government: 'Government',
    };

    return categoryMap[value] || value;
  };

  const searchMode = searchParams.get('mode');
  const mode =
    searchMode === 'customer-template'
      ? 'customer-template'
      : searchMode === 'general-template'
        ? 'general-template'
        : 'product';
  const isCustomerTemplateMode = mode === 'customer-template';
  const isGeneralTemplateMode = mode === 'general-template';
  const designType =
    searchParams.get('designType') === 'additional-information'
      ? 'additional-information'
      : 'proposal-form';
  const productId = searchParams.get('productId');
  const customerTemplateId = searchParams.get('templateId');
  const generalTemplateId = searchParams.get('templateId');
  const sourceTemplateId = searchParams.get('sourceTemplateId');
  const initialGeneralTemplateIds = useMemo(
    () =>
      (searchParams.get('generalTemplateIds') || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    [searchParams],
  );
  const [selectedGeneralTemplateIds, setSelectedGeneralTemplateIds] = useState<string[]>(
    initialGeneralTemplateIds,
  );
  const isExistingCustomerTemplateEdit = isCustomerTemplateMode && !!customerTemplateId;
  const initialTemplateCategory = normalizeCustomerCategory(searchParams.get('customerCategory'));
  const productName =
    searchParams.get(isCustomerTemplateMode || isGeneralTemplateMode ? 'templateName' : 'productName') ||
    (isCustomerTemplateMode
      ? 'Customer Template'
      : isGeneralTemplateMode
        ? 'General Template'
        : 'Product');
  const productVersion = searchParams.get('productVersion') || '';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialTemplateCategory);
  const didInitializeCustomerTemplate = useRef(false);
  const didInitializeGeneralTemplate = useRef(false);
  const formDesignTitle = isCustomerTemplateMode
    ? 'Customer Template Design'
    : isGeneralTemplateMode
      ? 'General Template Design'
    : designType === 'additional-information'
      ? 'Additional Information'
      : 'Proposal Form Design';
  const isAdditionalInformationMode =
    !isCustomerTemplateMode && !isGeneralTemplateMode && designType === 'additional-information';
  const publishButtonLabel = isCustomerTemplateMode
    ? 'Save Template'
    : isGeneralTemplateMode
      ? 'Save Template'
    : designType === 'additional-information'
      ? 'Save Additional Information'
      : 'Publish';
  const singleActionLoadingLabel = isCustomerTemplateMode
    ? 'Saving Template...'
    : isGeneralTemplateMode
      ? 'Saving Template...'
    : isAdditionalInformationMode
      ? 'Saving Additional Information...'
      : 'Saving...';
  const availableFieldTypes = useMemo(
    () =>
      isAdditionalInformationMode
        ? fieldTypes.map((fieldType) => ({
            ...fieldType,
            canBeRating: false,
          }))
        : fieldTypes,
    [isAdditionalInformationMode],
  );

  // ΓöÇΓöÇ Form persistence hook ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const {
    pages,
    setPages,
    isEditing,
    templateId,
    isInitialLoad,
    isLoading,
    isSaving,
    isSavingDraft,
    isPublishing,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isPublished,
    setIsPublished,
    updatePages,
    handleSaveForm,
    transformPagesToPayload,
  } = useFormPersistence({
    productId,
    productName,
    productVersion,
    mode,
    designType: designType as ProductFormDesignType,
    customerTemplateId,
    generalTemplateId,
    customerCategory: selectedCategory || undefined,
    generalTemplateIds: selectedGeneralTemplateIds,
  });

  // ΓöÇΓöÇ Local UI state ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const [selectedPageId, setSelectedPageId] = useState<string>(pages[0]?.id || 'page1');
  const [editingSectionField, setEditingSectionField] = useState<{
    sectionId: string;
    field: 'title' | 'subtitle';
  } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    if (pages.length === 0) return;
    if (!pages.find((page) => page.id === selectedPageId)) {
      setSelectedPageId(pages[0]?.id || 'page1');
    }
  }, [pages, selectedPageId]);

  useEffect(() => {
    if (
      !isCustomerTemplateMode ||
      customerTemplateId ||
      isInitialLoad ||
      didInitializeCustomerTemplate.current
    ) {
      return;
    }

    let mounted = true;

    const initializeCustomerTemplate = async () => {
      try {
        let nextPages: Page[];

        if (sourceTemplateId) {
          const sourceTemplateDesign = await getCustomerProfileTemplateDesign(sourceTemplateId);
          if (!mounted) return;

          nextPages = applyTemplateTitleToPages(
            normalizePagesGeneralTemplateNames(
              markInheritedLockedFields(sourceTemplateDesign?.pages || []),
            ),
            productName,
          );
        } else {
          nextPages = [
            {
              id: 'customer-template-page',
              title: productName,
              pageType: 'form',
              pageOrder: 1,
              sections: [],
            },
          ];
        }

        if (!nextPages.length) {
          nextPages = [
            {
              id: 'customer-template-page',
              title: productName,
              pageType: 'form',
              pageOrder: 1,
              sections: [],
            },
          ];
        }

        setPages(nextPages);
        setSelectedPageId(nextPages[0]?.id || 'page1');
        setHasUnsavedChanges(!!sourceTemplateId);
        setIsPublished(false);
        didInitializeCustomerTemplate.current = true;
      } catch (error: any) {
        if (!mounted) return;
        setPages([
          {
            id: 'customer-template-page',
            title: productName,
            pageType: 'form',
            pageOrder: 1,
            sections: [],
          },
        ]);
        setSelectedPageId('customer-template-page');
        setHasUnsavedChanges(false);
        setIsPublished(false);
        didInitializeCustomerTemplate.current = true;
        toast({
          title: 'Error loading template',
          description: error.message || 'Failed to load the selected source template.',
          variant: 'destructive',
        });
      }
    };

    initializeCustomerTemplate();
    return () => {
      mounted = false;
    };
  }, [
    customerTemplateId,
    isCustomerTemplateMode,
    isInitialLoad,
    productName,
    setHasUnsavedChanges,
    setIsPublished,
    setPages,
    sourceTemplateId,
    toast,
  ]);

  useEffect(() => {
    if (
      !isGeneralTemplateMode ||
      generalTemplateId ||
      isInitialLoad ||
      didInitializeGeneralTemplate.current
    ) {
      return;
    }

    let mounted = true;

    const initializeGeneralTemplate = async () => {
      try {
        let nextPages: Page[];

        if (sourceTemplateId) {
          const sourceTemplateDesign = await getGeneralTemplateDesign(sourceTemplateId);
          if (!mounted) return;

          nextPages = normalizePagesGeneralTemplateNames(sourceTemplateDesign?.pages || []).map(
            (page, index) => ({
              ...page,
              pageType: 'general',
              pageOrder: page.pageOrder ?? index + 1,
            }),
          );
        } else {
          nextPages = [
            {
              id: 'general-template-page-1',
              title: 'Page 1',
              pageType: 'general',
              pageOrder: 1,
              sections: [],
            },
          ];
        }

        if (!nextPages.length) {
          nextPages = [
            {
              id: 'general-template-page-1',
              title: 'Page 1',
              pageType: 'general',
              pageOrder: 1,
              sections: [],
            },
          ];
        }

        setPages(nextPages);
        setSelectedPageId(nextPages[0]?.id || 'general-template-page-1');
        setHasUnsavedChanges(!!sourceTemplateId);
        setIsPublished(false);
        didInitializeGeneralTemplate.current = true;
      } catch (error: any) {
        if (!mounted) return;
        setPages([
          {
            id: 'general-template-page-1',
            title: 'Page 1',
            pageType: 'general',
            pageOrder: 1,
            sections: [],
          },
        ]);
        setSelectedPageId('general-template-page-1');
        setHasUnsavedChanges(false);
        setIsPublished(false);
        didInitializeGeneralTemplate.current = true;
        toast({
          title: 'Error loading template',
          description: error.message || 'Failed to load the selected source template.',
          variant: 'destructive',
        });
      }
    };

    initializeGeneralTemplate();
    return () => {
      mounted = false;
    };
  }, [
    generalTemplateId,
    isGeneralTemplateMode,
    isInitialLoad,
    setHasUnsavedChanges,
    setIsPublished,
    setPages,
    sourceTemplateId,
    toast,
  ]);

  const handleFormSave = (isDraft: boolean) => {
    if (isCustomerTemplateMode && !selectedCategory) {
      toast({
        title: 'Category required',
        description: 'Please select the category before saving the template.',
        variant: 'destructive',
      });
      return;
    }

    handleSaveForm(isDraft);
  };

  // ΓöÇΓöÇ Calculation dialog state ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const [isCalculationDialogOpen, setIsCalculationDialogOpen] = useState(false);
  const [currentCalculationSubFieldIndex, setCurrentCalculationSubFieldIndex] = useState<number | null>(null);
  const [currentCalculationFieldId, setCurrentCalculationFieldId] = useState<string | null>(null);
  const [currentCalculationSectionId, setCurrentCalculationSectionId] = useState<string | null>(null);
  const [currentCalculationPageId, setCurrentCalculationPageId] = useState<string | null>(null);
  const [tempCalculationConfig, setTempCalculationConfig] = useState<CalculationConfig>({
    type: 'arithmetic',
    initialField: '',
    operations: [],
  });

  // ΓöÇΓöÇ Global Masters ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const [globalMasters, setGlobalMasters] = useState<GlobalMasterDto[]>([]);
  const [isLoadingGlobalMasters, setIsLoadingGlobalMasters] = useState(false);

  // ΓöÇΓöÇ Delete confirmation dialog state ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'page' | 'section' | 'field' | null;
    pageId?: string;
    sectionId?: string;
    fieldId?: string;
    title?: string;
  }>({
    isOpen: false,
    type: null,
  });

  // — API Integration state —
  const [isApiIntegrationDialogOpen, setIsApiIntegrationDialogOpen] = useState(false);
  const [apiIntegrationTriggerLevel, setApiIntegrationTriggerLevel] = useState<IntegrationTriggerLevel>('page');
  const [apiIntegrationPageId, setApiIntegrationPageId] = useState<string | undefined>();
  const [apiIntegrationFieldId, setApiIntegrationFieldId] = useState<string | undefined>();
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);

  // Fetch integrations when productId is available
  useEffect(() => {
    const fetchIntegrations = async () => {
      if (!productId) return;
      try {
        setIsLoadingIntegrations(true);
        const response = await getIntegrations(productId);
        setIntegrations(response.integrations || []);
      } catch (error) {
        console.error('[ProposalFormDesign] Failed to fetch integrations:', error);
      } finally {
        setIsLoadingIntegrations(false);
      }
    };
    fetchIntegrations();
  }, [productId]);

  // Compute integration counts per page
  const pageIntegrationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    integrations.forEach((integration) => {
      if (integration.triggerLevel === 'page' && integration.triggerPageId) {
        counts[integration.triggerPageId] = (counts[integration.triggerPageId] || 0) + 1;
      }
    });
    return counts;
  }, [integrations]);

  // Compute field-level integration count for current field being edited
  const fieldIntegrationCount = useMemo(() => {
    if (!apiIntegrationFieldId) return 0;
    return integrations.filter(
      (i) => i.triggerLevel === 'field' && i.triggerFieldId === apiIntegrationFieldId,
    ).length;
  }, [integrations, apiIntegrationFieldId]);

  const handleOpenPageApiIntegration = useCallback((pageId: string) => {
    setApiIntegrationTriggerLevel('page');
    setApiIntegrationPageId(pageId);
    setApiIntegrationFieldId(undefined);
    // Check for existing page-level integration
    const existing = integrations.find(
      (i) => i.triggerLevel === 'page' && i.triggerPageId === pageId,
    );
    setEditingIntegration(existing || null);
    setIsApiIntegrationDialogOpen(true);
  }, [integrations]);

  const handleOpenFieldApiIntegration = useCallback((fieldId: string, pageId?: string) => {
    setApiIntegrationTriggerLevel('field');
    setApiIntegrationFieldId(fieldId);
    setApiIntegrationPageId(pageId ?? selectedPageId);
    // Check for existing field-level integration
    const existing = integrations.find(
      (i) => i.triggerLevel === 'field' && i.triggerFieldId === fieldId,
    );
    setEditingIntegration(existing || null);
    setIsApiIntegrationDialogOpen(true);
  }, [integrations, selectedPageId]);

  const handleSaveIntegration = useCallback(async (integrationData: Partial<Integration>) => {
    if (!productId) {
      console.error('[ProposalFormDesign] Cannot save integration: productId is missing');
      toast({ title: 'Please save the product first before configuring integrations', variant: 'destructive' });
      return;
    }
    try {
      if (editingIntegration?.id) {
        const updated = await updateIntegration(productId, editingIntegration.id, integrationData);
        setIntegrations((prev) =>
          prev.map((i) => (i.id === editingIntegration.id ? updated : i)),
        );
        toast({ title: 'Integration updated successfully' });
      } else {
        const { id: _id, productId: _pid, createdAt: _ca, updatedAt: _ua, ...createPayload } = integrationData as Integration;
        const created = await createIntegration(productId, createPayload);
        setIntegrations((prev) => [...prev, created]);
        toast({ title: 'Integration created successfully' });
      }
      setIsApiIntegrationDialogOpen(false);
      setEditingIntegration(null);
    } catch (error) {
      console.error('[ProposalFormDesign] Failed to save integration:', error);
      toast({ title: 'Failed to save integration', variant: 'destructive' });
    }
  }, [productId, editingIntegration, toast]);

  const handleDeleteIntegration = useCallback(async (integrationId: string) => {
    if (!productId) {
      console.error('[ProposalFormDesign] Cannot delete integration: productId is missing');
      toast({ title: 'Please save the product first before managing integrations', variant: 'destructive' });
      return;
    }
    try {
      await deleteIntegration(productId, integrationId);
      setIntegrations((prev) => prev.filter((i) => i.id !== integrationId));
      setIsApiIntegrationDialogOpen(false);
      toast({ title: 'Integration deleted successfully' });
    } catch (error) {
      console.error('[ProposalFormDesign] Failed to delete integration:', error);
      toast({ title: 'Failed to delete integration', variant: 'destructive' });
    }
  }, [productId, toast]);

  useEffect(() => {
    const fetchGlobalMasters = async () => {
      try {
        setIsLoadingGlobalMasters(true);
        const masters = await getAllGlobalMasters();
        setGlobalMasters(masters);
      } catch (error) {
        console.warn('Failed to load global masters:', error);
      } finally {
        setIsLoadingGlobalMasters(false);
      }
    };
    fetchGlobalMasters();
  }, []);
  // ΓöÇΓöÇ Drag and Drop ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const {
    draggedFieldId,
    draggedFieldPageId,
    draggedFieldSectionId,
    draggedPageId,
    draggedSectionId,
    draggedSectionPageId,
    draggedFieldType,
    dragOverSectionId,
    setDraggedFieldType,
    setDragOverSectionId,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handlePageDragStart,
    handlePageDragOver,
    handlePageDragLeave,
    handlePageDrop,
    handleSectionDragStart,
    handleSectionDragOver,
    handleSectionDragLeave,
    handleSectionDrop,
  } = useDragAndDrop({ pages, updatePages });

  // ΓöÇΓöÇ Page Operations ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const {
    expandedPages,
    expandedSections,
    togglePageExpansion,
    toggleSectionExpansion,
    expandSection,
    isAddPageDialogOpen,
    setIsAddPageDialogOpen,
    newPageConfig,
    setNewPageConfig,
    addPage,
    handleCreatePage,
    deletePage: performDeletePage,
    duplicatePage,
    updatePageTitle,
    updatePageSubtitle,
    updatePageActive,
    isPageValidationDialogOpen,
    setIsPageValidationDialogOpen,
    selectedPageForValidation,
    setSelectedPageForValidation,
    isPageValidationApplyAttempted,
    setIsPageValidationApplyAttempted,
    getNumericFieldsForPage,
    handleAddPageValidation,
    handleUpdatePageValidation,
    handleDeletePageValidation,
    getPageMultiFieldValidationIssues,
    handleApplyPageValidation,
    handleCancelPageValidation,
  } = usePageOperations({
    pages,
    updatePages,
    setHasUnsavedChanges,
    selectedPageId,
    setSelectedPageId,
    defaultPageType: isGeneralTemplateMode ? 'general' : 'form',
  });

  const setSelectedSectionIdRef = useRef<((id: string | null) => void) | undefined>(undefined);

  const handleSectionCreated = useCallback(
    ({ pageId, sectionId }: { pageId: string; sectionId: string }) => {
      setSelectedPageId(pageId);
      setSelectedSectionIdRef.current?.(sectionId);
      expandSection(sectionId);
    },
    [setSelectedPageId, expandSection],
  );

  // ΓöÇΓöÇ Section Operations ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const {
    addSection,
    deleteSection: performDeleteSection,
    duplicateSection,
    deleteField: performDeleteField,
    duplicateField,
    updateSectionTitle,
    updateSectionSubtitle,
    updateSectionActive,
    updateSectionVisibility,
  } = useSectionOperations({ pages, updatePages, onSectionCreated: handleSectionCreated });

  const {
    isFieldDialogOpen,
    setIsFieldDialogOpen,
    isConfiguringField,
    setIsConfiguringField,
    selectedFieldId,
    setSelectedFieldId,
    selectedSectionId,
    setSelectedSectionId,
    fieldConfig,
    setFieldConfig,
    optionsInput,
    setOptionsInput,
    dependentOptionsInput,
    setDependentOptionsInput,
    optionsSourceMode,
    setOptionsSourceMode,
    selectedGlobalMaster,
    setSelectedGlobalMaster,
    selectedMasterValues,
    setSelectedMasterValues,
    minMaxError,
    setMinMaxError,
    minMaxCharacterError,
    setMinMaxCharacterError,
    hasMinOrMax,
    hasFormat,
    subFieldsConfig,
    setSubFieldsConfig,
    combinationRowsCount,
    setCombinationRowsCount,
    combinationRowLabels,
    setCombinationRowLabels,
    combinationRowLabelsInput,
    setCombinationRowLabelsInput,
    maximizeAdditionOfRows,
    setMaximizeAdditionOfRows,
    maximumRowCountInput,
    setMaximumRowCountInput,
    subFieldOptionsInput,
    setSubFieldOptionsInput,
    isSubFieldDialogOpen,
    setIsSubFieldDialogOpen,
    isConfiguringSubField,
    setIsConfiguringSubField,
    selectedSubFieldId,
    subFieldConfig,
    setSubFieldConfig,
    subFieldDependentOptionsInput,
    setSubFieldDependentOptionsInput,
    handleCloseFieldDialog,
    handleCloseSubFieldDialog,
    startAddingField,
    startEditingField,
    startAddingSubField,
    startEditingSubField,
    saveField,
    saveSubField,
    addLibraryField,
    validateMinMax,
    validateMinMaxCharacter,
  } = useFieldEditor({
    pages,
    updatePages,
    selectedPageId,
    setSelectedPageId,
    globalMasters,
    disableRatingParameters: isAdditionalInformationMode,
    isCustomerTemplateMode,
    isExistingCustomerTemplateEdit: isExistingCustomerTemplateEdit && !isGeneralTemplateMode,
    expandSection,
  });

  setSelectedSectionIdRef.current = setSelectedSectionId;

  useEffect(() => {
    const page = pages.find((p) => p.id === selectedPageId);
    const sections = page?.sections ?? [];
    if (sections.length === 0) {
      setSelectedSectionId(null);
      return;
    }
    const sectionIds = new Set(
      sections.map((s) => s.id).filter((id): id is string => Boolean(id)),
    );
    if (!selectedSectionId || !sectionIds.has(selectedSectionId)) {
      const firstId = sections[0]?.id;
      setSelectedSectionId(firstId ?? null);
    }
  }, [pages, selectedPageId, selectedSectionId, setSelectedSectionId]);

  const {
    isFullscreenPreview,
    setIsFullscreenPreview,
    fullscreenPreviewValues,
    setFullscreenPreviewValues,
    currentPreviewPage,
    setCurrentPreviewPage,
    selectedQuoteId,
    setSelectedQuoteId,
    selectedCEWIds,
    setSelectedCEWIds,
    shouldShowFieldInPreview,
    shouldShowSectionInPreview,
    estimateFieldHeight,
    shouldFieldSpanFullWidth,
    getNextPage,
    getWrappedPages,
  } = usePreview({ pages });

  const deletePage = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    setDeleteDialog({
      isOpen: true,
      type: 'page',
      pageId,
      title: page?.title || 'this page',
    });
  };

  const deleteSection = (pageId: string, sectionId: string) => {
    const page = pages.find((p) => p.id === pageId);
    const section = page?.sections.find((s) => s.id === sectionId);
    setDeleteDialog({
      isOpen: true,
      type: 'section',
      pageId,
      sectionId,
      title: section?.title || 'this section',
    });
  };

  const deleteField = (pageId: string, sectionId: string, fieldId: string) => {
    const page = pages.find((p) => p.id === pageId);
    const section = page?.sections.find((s) => s.id === sectionId);
    const field = section?.fields.find((f) => f.id === fieldId);

    if ((!isCustomerTemplateMode || isExistingCustomerTemplateEdit) && isFieldLocked(field)) {
      toast({
        title: 'Field locked',
        description: 'This field is locked and cannot be changed.',
        variant: 'destructive',
      });
      return;
    }

    setDeleteDialog({
      isOpen: true,
      type: 'field',
      pageId,
      sectionId,
      fieldId,
      title: field?.label || 'this field',
    });
  };

  const toggleFieldLock = useCallback((pageId: string, sectionId: string, fieldId: string) => {
    updatePages((prev) =>
      prev.map((page) =>
        page.id === pageId
          ? {
              ...page,
              sections: (page.sections || []).map((section) =>
                section.id === sectionId
                  ? {
                      ...section,
                      fields: (section.fields || []).map((field) =>
                        field.id === fieldId
                          ? {
                              ...field,
                              isLocked: !isFieldLocked(field),
                              metadata: {
                                ...(field.metadata || {}),
                                isLocked: !isFieldLocked(field),
                              },
                            }
                          : field,
                      ),
                    }
                  : section,
              ),
            }
          : page,
      ),
    );
  }, [updatePages]);

  const confirmDelete = () => {
    if (!deleteDialog.type) return;

    // Capture what to delete before closing the dialog
    const { type, pageId, sectionId, fieldId } = deleteDialog;

    // Close the dialog first, then perform the deletion after the exit
    // animation completes to avoid a flash caused by simultaneous layout
    // shift (field removed) and dialog close animation.
    setDeleteDialog({ isOpen: false, type: null });

    setTimeout(() => {
      if (type === 'page' && pageId) {
        performDeletePage(pageId);
      } else if (type === 'section' && pageId && sectionId) {
        performDeleteSection(pageId, sectionId);
      } else if (type === 'field' && pageId && sectionId && fieldId) {
        performDeleteField(pageId, sectionId, fieldId);
      }
    }, 150);
  };


  // ΓöÇΓöÇ Derived values ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const selectedPage = useMemo(() => pages.find((p) => p.id === selectedPageId) || null, [pages, selectedPageId]);
  const selectedSection = useMemo(() => selectedPage?.sections?.find((s) => s.id === selectedSectionId) || null, [selectedPage, selectedSectionId]);

  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false);
  const [availableGeneralTemplates, setAvailableGeneralTemplates] = useState<GeneralTemplateListItem[]>([]);
  const [isLoadingGeneralTemplates, setIsLoadingGeneralTemplates] = useState(false);
  const [pendingGeneralTemplateIds, setPendingGeneralTemplateIds] = useState<string[]>(selectedGeneralTemplateIds);

  useEffect(() => {
    setSelectedGeneralTemplateIds(initialGeneralTemplateIds);
    setPendingGeneralTemplateIds(initialGeneralTemplateIds);
  }, [initialGeneralTemplateIds]);

  useEffect(() => {
    if (!isTemplatesDialogOpen) return;

    let mounted = true;

    const loadGeneralTemplates = async () => {
      try {
        setIsLoadingGeneralTemplates(true);
        const response = await getGeneralTemplates();
        if (!mounted) return;
        setAvailableGeneralTemplates(Array.isArray(response) ? response : []);
      } catch (error: any) {
        if (!mounted) return;
        toast({
          title: 'Error loading templates',
          description: error.message || 'Failed to load general templates',
          variant: 'destructive',
        });
      } finally {
        if (mounted) setIsLoadingGeneralTemplates(false);
      }
    };

    loadGeneralTemplates();
    return () => {
      mounted = false;
    };
  }, [isTemplatesDialogOpen, toast]);

  const handleApplyGeneralTemplates = useCallback(() => {
    setSelectedGeneralTemplateIds(pendingGeneralTemplateIds);
    setIsTemplatesDialogOpen(false);
  }, [pendingGeneralTemplateIds]);

  // ΓöÇΓöÇ Fields library (inline JSX icons) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

  /* ΓöÇΓöÇΓöÇ renderFieldPreview ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

  const allProps = {
    navigate,
    toast,
    productId,
    productName,
    productVersion,
    isCustomerTemplateMode,
    isExistingCustomerTemplateEdit,
    pages,
    setPages,
    isEditing,
    templateId,
    isInitialLoad,
    isLoading,
    isSaving,
    isSavingDraft,
    isPublishing,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isPublished,
    setIsPublished,
    updatePages,
    handleSaveForm,
    transformPagesToPayload,
    selectedPageId,
    setSelectedPageId,
    editingSectionField,
    setEditingSectionField,
    selectedTemplate,
    setSelectedTemplate,
    isCalculationDialogOpen,
    setIsCalculationDialogOpen,
    currentCalculationSubFieldIndex,
    setCurrentCalculationSubFieldIndex,
    currentCalculationFieldId,
    setCurrentCalculationFieldId,
    currentCalculationSectionId,
    setCurrentCalculationSectionId,
    currentCalculationPageId,
    setCurrentCalculationPageId,
    tempCalculationConfig,
    setTempCalculationConfig,
    globalMasters,
    setGlobalMasters,
    isLoadingGlobalMasters,
    setIsLoadingGlobalMasters,
    draggedFieldId,
    draggedFieldPageId,
    draggedFieldSectionId,
    draggedPageId,
    draggedSectionId,
    draggedSectionPageId,
    draggedFieldType,
    dragOverSectionId,
    setDraggedFieldType,
    setDragOverSectionId,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handlePageDragStart,
    handlePageDragOver,
    handlePageDragLeave,
    handlePageDrop,
    handleSectionDragStart,
    handleSectionDragOver,
    handleSectionDragLeave,
    handleSectionDrop,
    addPage,
    handleCreatePage,
    deletePage,
    updatePageTitle,
    updatePageSubtitle,
    expandedPages,
    expandedSections,
    togglePageExpansion,
    toggleSectionExpansion,
    isAddPageDialogOpen,
    setIsAddPageDialogOpen,
    newPageConfig,
    setNewPageConfig,
    isPageValidationDialogOpen,
    setIsPageValidationDialogOpen,
    selectedPageForValidation,
    setSelectedPageForValidation,
    isPageValidationApplyAttempted,
    setIsPageValidationApplyAttempted,
    getNumericFieldsForPage,
    handleAddPageValidation,
    handleUpdatePageValidation,
    handleDeletePageValidation,
    getPageMultiFieldValidationIssues,
    handleApplyPageValidation,
    handleCancelPageValidation,
    addSection,
    deleteSection,
    duplicateSection,
    deleteField,
    updateSectionTitle,
    updateSectionSubtitle,
    updateSectionVisibility,
    isFieldDialogOpen,
    setIsFieldDialogOpen,
    isConfiguringField,
    setIsConfiguringField,
    selectedFieldId,
    setSelectedFieldId,
    selectedSectionId,
    setSelectedSectionId,
    fieldConfig,
    setFieldConfig,
    optionsInput,
    setOptionsInput,
    dependentOptionsInput,
    setDependentOptionsInput,
    optionsSourceMode,
    setOptionsSourceMode,
    selectedGlobalMaster,
    setSelectedGlobalMaster,
    selectedMasterValues,
    setSelectedMasterValues,
    minMaxError,
    setMinMaxError,
    minMaxCharacterError,
    setMinMaxCharacterError,
    hasMinOrMax,
    hasFormat,
    subFieldsConfig,
    setSubFieldsConfig,
    combinationRowsCount,
    setCombinationRowsCount,
    combinationRowLabels,
    setCombinationRowLabels,
    combinationRowLabelsInput,
    setCombinationRowLabelsInput,
    subFieldOptionsInput,
    setSubFieldOptionsInput,
    isSubFieldDialogOpen,
    setIsSubFieldDialogOpen,
    isConfiguringSubField,
    setIsConfiguringSubField,
    selectedSubFieldId,
    subFieldConfig,
    setSubFieldConfig,
    subFieldDependentOptionsInput,
    setSubFieldDependentOptionsInput,
    handleCloseFieldDialog,
    handleCloseSubFieldDialog,
    startAddingField,
    startEditingField,
    startAddingSubField,
    startEditingSubField,
    saveField,
    saveSubField,
    addLibraryField,
    validateMinMax,
    validateMinMaxCharacter,
    isFullscreenPreview,
    setIsFullscreenPreview,
    fullscreenPreviewValues,
    setFullscreenPreviewValues,
    currentPreviewPage,
    setCurrentPreviewPage,
    selectedQuoteId,
    setSelectedQuoteId,
    selectedCEWIds,
    setSelectedCEWIds,
    getNextPage,
    fieldTypes: availableFieldTypes,
    fieldsLibrary,
    hideRatingParameterControls: isAdditionalInformationMode,
    hideRatingBadges: isAdditionalInformationMode,
    onOpenFieldApiIntegration: handleOpenFieldApiIntegration,
    fieldIntegrationCount,
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <FormDesignHeader
        navigate={navigate}
        productName={productName}
        productVersion={productVersion}
        title={formDesignTitle}
        backPath={
          isCustomerTemplateMode || isGeneralTemplateMode
            ? '/market-admin/customer-template-management'
            : undefined
        }
        saveButtonLabel={publishButtonLabel}
        singleActionMode={isCustomerTemplateMode || isGeneralTemplateMode || isAdditionalInformationMode}
        singleActionLoadingLabel={singleActionLoadingLabel}
        showCategorySelect={false}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        setIsFullscreenPreview={setIsFullscreenPreview}
        handleSaveForm={handleFormSave}
        isSavingDraft={isSavingDraft}
        canSave={isCustomerTemplateMode || isGeneralTemplateMode || !!productId}
        hasUnsavedChanges={hasUnsavedChanges}
        isPublished={isPublished}
        isPublishing={isPublishing}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ComponentsSidebar
          selectedPage={selectedPage}
          selectedPageId={selectedPageId}
          selectedSectionId={selectedSectionId}
          addPage={addPage}
          addSection={addSection}
          fieldTypes={availableFieldTypes}
          setDraggedFieldType={setDraggedFieldType}
          setDragOverSectionId={setDragOverSectionId}
          toast={toast}
          startAddingField={startAddingField}
          isAddPageDialogOpen={isAddPageDialogOpen}
          setIsAddPageDialogOpen={setIsAddPageDialogOpen}
          newPageConfig={newPageConfig}
          setNewPageConfig={setNewPageConfig}
          handleCreatePage={handleCreatePage}
          allowMultiplePages={!isCustomerTemplateMode || isGeneralTemplateMode}
          isGeneralTemplateMode={isGeneralTemplateMode}
          showTemplatesButton={!isCustomerTemplateMode && !isGeneralTemplateMode && !isAdditionalInformationMode}
          onOpenTemplatesDialog={() => setIsTemplatesDialogOpen(true)}
        />

        <DesignCanvas
          pages={pages}
          isCustomerTemplateMode={isCustomerTemplateMode}
          isExistingCustomerTemplateEdit={isExistingCustomerTemplateEdit}
          hideRatingBadges={isAdditionalInformationMode}
          allowMultiplePages={!isCustomerTemplateMode || isGeneralTemplateMode}
          selectedPageId={selectedPageId}
          selectedSectionId={selectedSectionId}
          setSelectedPageId={(id) => setSelectedPageId(id)}
          draggedPageId={draggedPageId}
          handlePageDragStart={handlePageDragStart}
          handlePageDragOver={handlePageDragOver}
          handlePageDragLeave={handlePageDragLeave}
          handlePageDrop={handlePageDrop}
          handleDragEnd={handleDragEnd}
          togglePageExpansion={togglePageExpansion}
          expandedPages={expandedPages}
          updatePageTitle={updatePageTitle}
          updatePageSubtitle={updatePageSubtitle}
          updatePageActive={updatePageActive}
          setSelectedPageForValidation={setSelectedPageForValidation}
          setIsPageValidationDialogOpen={setIsPageValidationDialogOpen}
          setIsPageValidationApplyAttempted={setIsPageValidationApplyAttempted}
          deletePage={deletePage}
          duplicatePage={duplicatePage}
          draggedSectionId={draggedSectionId}
          handleSectionDragStart={handleSectionDragStart}
          handleSectionDragOver={handleSectionDragOver}
          handleSectionDragLeave={handleSectionDragLeave}
          handleSectionDrop={handleSectionDrop}
          setSelectedSectionId={(id) => setSelectedSectionId(id)}
          expandedSections={expandedSections}
          toggleSectionExpansion={toggleSectionExpansion}
          updateSectionTitle={updateSectionTitle}
          updateSectionSubtitle={updateSectionSubtitle}
          updateSectionActive={updateSectionActive}
          updateSectionVisibility={updateSectionVisibility}
          startAddingField={startAddingField}
          deleteSection={deleteSection}
          duplicateSection={duplicateSection}
          dragOverSectionId={dragOverSectionId}
          setDragOverSectionId={setDragOverSectionId}
          draggedFieldType={draggedFieldType}
          draggedFieldId={draggedFieldId}
          setFieldConfig={setFieldConfig}
          setIsConfiguringField={setIsConfiguringField}
          setIsFieldDialogOpen={setIsFieldDialogOpen}
          setDraggedFieldType={setDraggedFieldType}
          handleDrop={handleDrop}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          startEditingField={startEditingField}
          deleteField={deleteField}
          duplicateField={duplicateField}
          toggleFieldLock={toggleFieldLock}
          addSection={addSection}
          setCurrentCalculationFieldId={(id) => setCurrentCalculationFieldId(id)}
          setCurrentCalculationSectionId={(id) => setCurrentCalculationSectionId(id)}
          setCurrentCalculationPageId={(id) => setCurrentCalculationPageId(id)}
          setTempCalculationConfig={setTempCalculationConfig}
          setIsCalculationDialogOpen={setIsCalculationDialogOpen}
          setEditingSectionField={setEditingSectionField}
          setOptionsInput={setOptionsInput}
          setDependentOptionsInput={setDependentOptionsInput}
          setSubFieldsConfig={setSubFieldsConfig}
          setCombinationRowsCount={setCombinationRowsCount}
          setCombinationRowLabels={setCombinationRowLabels}
          setSelectedFieldId={setSelectedFieldId}
          onOpenApiIntegration={handleOpenPageApiIntegration}
          pageIntegrationCounts={pageIntegrationCounts}
        />
      </div>

      <FullscreenPreviewDialog {...allProps} />
      <FieldConfigDialog {...allProps} />
      <Dialog open={isTemplatesDialogOpen} onOpenChange={setIsTemplatesDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Templates</DialogTitle>
            <DialogDescription>
              Select one or more general templates to load into this proposal form design.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {isLoadingGeneralTemplates ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Loading templates...
              </div>
            ) : availableGeneralTemplates.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                No general templates found.
              </div>
            ) : (
              availableGeneralTemplates.map((template) => {
                const isChecked = pendingGeneralTemplateIds.includes(template.id);

                return (
                  <label
                    key={template.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                      isChecked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30',
                    )}
                  >
                    <Checkbox
                      className="mt-1"
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        setPendingGeneralTemplateIds((current) =>
                          checked
                            ? Array.from(new Set([...current, template.id]))
                            : current.filter((id) => id !== template.id),
                        );
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-foreground">{template.name}</p>
                      </div>
                      {template.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {template.fields?.length ? (
                          template.fields.map((field, index) => (
                            <span
                              key={`${template.id}-${field.name}-${index}`}
                              className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-foreground"
                            >
                              {field.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No fields configured yet.
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplatesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyGeneralTemplates}>Use Templates</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PageValidationDialog {...allProps} />
      <CalculationDialog {...allProps} />

      {productId && (
        <ApiIntegrationDialog
          open={isApiIntegrationDialogOpen}
          onOpenChange={setIsApiIntegrationDialogOpen}
          productId={productId}
          triggerLevel={apiIntegrationTriggerLevel}
          triggerPageId={apiIntegrationPageId}
          triggerFieldId={apiIntegrationFieldId}
          pages={pages}
          existingIntegration={editingIntegration}
          onSave={handleSaveIntegration}
          onDelete={handleDeleteIntegration}
        />
      )}

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => !open && setDeleteDialog({ ...deleteDialog, isOpen: false })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {deleteDialog.type} <strong>{deleteDialog.title}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProposalFormDesign;
