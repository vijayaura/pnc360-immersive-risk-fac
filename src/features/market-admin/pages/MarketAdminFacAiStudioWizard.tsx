import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/lib-utils';
import {
  getProductCategoryMasterOptions,
  type ProductCategoryOption,
} from '@/features/product-config/masters/api/masters';

import { DEMO_FAC_AI_PRODUCTS } from './MarketAdminFacAiStudioList';

/** Same fallback pattern as Product Studio (`CreateProduct`) when category master is unavailable. */
const FALLBACK_PRODUCT_CATEGORIES: ProductCategoryOption[] = [
  { value: 'CASUALTY', label: 'Casualty' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'GENERAL_ACCIDENT', label: 'General Accident' },
  { value: 'GROUP_LIFE', label: 'Group Life' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'MARINE_CARGO', label: 'Marine Cargo' },
  { value: 'MARINE_HULL', label: 'Marine Hull' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'MOTOR', label: 'Motor' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'PROPERTY', label: 'Property' },
  { value: 'WORKMENS_COMPENSATION', label: "Workmen's Compensation (WC)" },
];

export type FacAiDocumentRule = {
  tempId: string;
  displayLabel: string;
  description: string;
  requirement: 'mandatory' | 'optional';
  detectionPrompt: string;
  aiQuestionValidation: boolean;
  validationQuestions: { id?: string; question: string }[];
};

export type FacAiWizardForm = {
  productName: string;
  agentEmail: string;
  /** Product category master value codes (same field as Product Studio category picker). */
  businessTypes: string[];
  markupLogicInstructions: string;
  documents: FacAiDocumentRule[];
};

function emptyValidationQuestion(): { id?: string; question: string } {
  return { question: '' };
}

function newDocumentRule(requirement: 'mandatory' | 'optional'): FacAiDocumentRule {
  return {
    tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    displayLabel: '',
    description: '',
    requirement,
    detectionPrompt: '',
    aiQuestionValidation: false,
    validationQuestions: [],
  };
}

function defaultForm(): FacAiWizardForm {
  return {
    productName: '',
    agentEmail: '',
    businessTypes: [],
    markupLogicInstructions: '',
    documents: [
      {
        ...newDocumentRule('mandatory'),
        displayLabel: 'Risk placement slip',
        detectionPrompt: 'slip',
      },
    ],
  };
}

function formFromPiAgentDemo(): FacAiWizardForm {
  return {
    ...defaultForm(),
    productName: 'Professional Indemnity',
    agentEmail: 'quote@aurainsure.tech',
    businessTypes: ['LIABILITY', 'PROFESSIONAL'],
    markupLogicInstructions: `1. Apply the following markup rates:
   - Cedant Rate: 1%
   - Base Rate: 0.8%
   - Mark Up: 0.2%
2. Calculate the final premium based on these rates.`,
    documents: [
      {
        tempId: 'demo-doc-1',
        displayLabel: 'Risk placement slip',
        description: 'Signed or draft slip for facultative line, share, and premium terms.',
        requirement: 'mandatory',
        detectionPrompt: 'slip',
        aiQuestionValidation: true,
        validationQuestions: [
          { question: 'Does the document identify the insured and limit of liability?' },
          { question: 'Are premium and commission lines present and consistent with the referral?' },
        ],
      },
      {
        tempId: 'demo-doc-2',
        displayLabel: 'Supporting loss experience',
        description: 'Optional loss runs or claims history when cedent provides them.',
        requirement: 'optional',
        detectionPrompt: 'loss run claims history',
        aiQuestionValidation: false,
        validationQuestions: [],
      },
    ],
  };
}

function formFromMarineDemo(): FacAiWizardForm {
  const base = defaultForm();
  const p = DEMO_FAC_AI_PRODUCTS.find((x) => x.id === 'fac-ai-marine-router');
  if (!p) return base;
  return {
    ...base,
    productName: p.name,
    agentEmail: p.agentEmail,
    businessTypes: [...p.categoryCodes],
  };
}

function getInitialForm(seedKey: string | undefined): FacAiWizardForm {
  if (!seedKey || seedKey === 'new') return defaultForm();
  if (seedKey === 'fac-ai-pi-agent') return formFromPiAgentDemo();
  if (seedKey === 'fac-ai-marine-router') return formFromMarineDemo();
  const summary = DEMO_FAC_AI_PRODUCTS.find((row) => row.id === seedKey);
  if (summary) {
    return {
      ...defaultForm(),
      productName: summary.name,
      agentEmail: summary.agentEmail,
      businessTypes: [...summary.categoryCodes],
    };
  }
  return defaultForm();
}

function Req({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <span className="text-destructive ml-0.5" aria-hidden>
        *
      </span>
    </>
  );
}

function FacAiDocumentRuleEditorForm({
  doc,
  onPatch,
  onUpdateQuestions,
}: {
  doc: FacAiDocumentRule;
  onPatch: (patch: Partial<FacAiDocumentRule>) => void;
  onUpdateQuestions: (
    updater: (
      prev: FacAiDocumentRule['validationQuestions'],
    ) => FacAiDocumentRule['validationQuestions'],
  ) => void;
}) {
  return (
    <div className="space-y-4 py-1">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Requirement</Label>
        <RadioGroup
          value={doc.requirement}
          onValueChange={(v) => onPatch({ requirement: v as 'mandatory' | 'optional' })}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="mandatory" id={`req-man-${doc.tempId}`} />
            <Label htmlFor={`req-man-${doc.tempId}`} className="cursor-pointer font-normal">
              Mandatory
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="optional" id={`req-opt-${doc.tempId}`} />
            <Label htmlFor={`req-opt-${doc.tempId}`} className="cursor-pointer font-normal">
              Optional
            </Label>
          </div>
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`doc-label-${doc.tempId}`}>Display label</Label>
        <Input
          id={`doc-label-${doc.tempId}`}
          value={doc.displayLabel}
          onChange={(e) => onPatch({ displayLabel: e.target.value })}
          placeholder="e.g. Risk placement slip"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`doc-desc-${doc.tempId}`}>Description</Label>
        <Textarea
          id={`doc-desc-${doc.tempId}`}
          rows={2}
          value={doc.description}
          onChange={(e) => onPatch({ description: e.target.value })}
          placeholder="Short description for operators (as in Product Studio required documents)."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`doc-detect-${doc.tempId}`}>Ingestion / detection prompt</Label>
        <Textarea
          id={`doc-detect-${doc.tempId}`}
          rows={3}
          value={doc.detectionPrompt}
          onChange={(e) => onPatch({ detectionPrompt: e.target.value })}
          placeholder="Natural language cues so FAC AI recognises this document in submissions."
        />
      </div>
      <div className="space-y-4 rounded-md border bg-muted/20 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor={`doc-ai-val-${doc.tempId}`}>Validation rules — AI question checks</Label>
            <p className="text-sm text-muted-foreground">
              Same pattern as underwriting required documents: optional AI validation questions run when this file is
              ingested.
            </p>
          </div>
          <Switch
            id={`doc-ai-val-${doc.tempId}`}
            checked={doc.aiQuestionValidation}
            onCheckedChange={(checked) =>
              onPatch({
                aiQuestionValidation: checked,
                validationQuestions:
                  checked && doc.validationQuestions.length === 0
                    ? [emptyValidationQuestion()]
                    : !checked
                      ? []
                      : doc.validationQuestions,
              })
            }
          />
        </div>
        {doc.aiQuestionValidation ? (
          <div className="space-y-3">
            {doc.validationQuestions.map((item, qIndex) => (
              <div key={`${doc.tempId}-q-${qIndex}`} className="flex gap-2">
                <Input
                  value={item.question}
                  onChange={(e) =>
                    onUpdateQuestions((prev) =>
                      prev.map((q, i) => (i === qIndex ? { ...q, question: e.target.value } : q)),
                    )
                  }
                  placeholder={`Validation question ${qIndex + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() =>
                    onUpdateQuestions((prev) =>
                      prev.length > 1 ? prev.filter((_, i) => i !== qIndex) : [emptyValidationQuestion()],
                    )
                  }
                  aria-label={`Remove question ${qIndex + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onUpdateQuestions((prev) => [...prev, emptyValidationQuestion()])}
            >
              <Plus className="h-4 w-4" />
              Add validation question
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function MarketAdminFacAiStudioWizard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { productId } = useParams<{ productId: string }>();
  const { toast } = useToast();

  const isNew = pathname.endsWith('/fac-ai-studio/new');
  const seedKey = isNew ? 'new' : productId;

  const [form, setForm] = useState<FacAiWizardForm>(() => getInitialForm(seedKey));
  const [categoryOptions, setCategoryOptions] = useState<ProductCategoryOption[]>([]);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  const categoryChoices = categoryOptions.length > 0 ? categoryOptions : FALLBACK_PRODUCT_CATEGORIES;

  useEffect(() => {
    let mounted = true;
    getProductCategoryMasterOptions()
      .then((opts) => {
        if (!mounted) return;
        if (opts.length > 0) setCategoryOptions(opts);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setForm(getInitialForm(seedKey));
    setEditingDocId(null);
  }, [seedKey]);

  const update = <K extends keyof FacAiWizardForm>(key: K, value: FacAiWizardForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleProductCategory = (valueCode: string) => {
    setForm((f) => ({
      ...f,
      businessTypes: f.businessTypes.includes(valueCode)
        ? f.businessTypes.filter((x) => x !== valueCode)
        : [...f.businessTypes, valueCode],
    }));
  };

  const patchDocument = (tempId: string, patch: Partial<FacAiDocumentRule>) => {
    setForm((f) => ({
      ...f,
      documents: f.documents.map((d) => (d.tempId === tempId ? { ...d, ...patch } : d)),
    }));
  };

  const updateDocumentQuestions = (
    tempId: string,
    updater: (
      prev: FacAiDocumentRule['validationQuestions'],
    ) => FacAiDocumentRule['validationQuestions'],
  ) => {
    setForm((f) => ({
      ...f,
      documents: f.documents.map((d) =>
        d.tempId === tempId ? { ...d, validationQuestions: updater(d.validationQuestions) } : d,
      ),
    }));
  };

  const removeDocument = (tempId: string) => {
    setForm((f) => ({
      ...f,
      documents: f.documents.filter((d) => d.tempId !== tempId),
    }));
    setEditingDocId((id) => (id === tempId ? null : id));
  };

  const sortedDocuments = useMemo(() => {
    const mandatory = form.documents.filter((d) => d.requirement === 'mandatory');
    const optional = form.documents.filter((d) => d.requirement === 'optional');
    return [...mandatory, ...optional];
  }, [form.documents]);

  const editingDoc = editingDocId
    ? form.documents.find((d) => d.tempId === editingDocId)
    : undefined;

  const addDocument = () => {
    const row = newDocumentRule('mandatory');
    setForm((f) => ({ ...f, documents: [...f.documents, row] }));
    setEditingDocId(row.tempId);
  };

  const handleSubmit = () => {
    toast({
      title: 'Configuration saved (demo)',
      description: `"${form.productName || 'FAC AI product'}" is stored in this session only until an API is connected.`,
    });
    navigate('/market-admin/fac-ai-studio');
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-8 pb-24">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-2" onClick={() => navigate('/market-admin/fac-ai-studio')}>
              <ArrowLeft className="h-4 w-4" />
              All products
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isNew ? 'New FAC AI product' : 'Configure FAC AI product'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              One-page setup: product scope, markup logic, and document rules.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fac-product-name">
              <Req>Product Name</Req>
            </Label>
            <Input
              id="fac-product-name"
              placeholder="e.g. Professional Indemnity"
              value={form.productName}
              onChange={(e) => update('productName', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use a specific product name (for example Professional Indemnity), not only a generic line such as Casualty.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fac-email">
              <Req>Agent Email ID</Req>
            </Label>
            <Input
              id="fac-email"
              type="email"
              value={form.agentEmail}
              onChange={(e) => update('agentEmail', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>
              <Req>Use existing Product Categories for Business Types</Req>
            </Label>
            <p className="text-xs text-muted-foreground">
              Same category master as Product Studio — select one or more categories this FAC AI configuration applies
              to.
            </p>
            <div className="flex flex-wrap gap-2">
              {categoryChoices.map((cat) => {
                const on = form.businessTypes.includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleProductCategory(cat.value)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      on
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-muted-foreground/25 bg-background hover:bg-muted/60',
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fac-markup">Markup Logic Instructions:</Label>
            <Textarea
              id="fac-markup"
              rows={8}
              value={form.markupLogicInstructions}
              onChange={(e) => update('markupLogicInstructions', e.target.value)}
            />
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Required Documents Logic</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  List mandatory and optional document types with badges. Use Edit to configure labels, ingestion prompts,
                  and AI validation — same ideas as underwriting required-document management.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-1 shrink-0" onClick={addDocument}>
                <Plus className="h-4 w-4" />
                Add document
              </Button>
            </div>

            {sortedDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground border border-dashed rounded-md p-4">
                No document rules yet. Add a document to get started — set mandatory or optional in the editor.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border bg-background">
                {sortedDocuments.map((doc, idx) => (
                  <li
                    key={doc.tempId}
                    className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <Badge
                      variant={doc.requirement === 'mandatory' ? 'default' : 'secondary'}
                      className="w-fit shrink-0 font-medium"
                    >
                      {doc.requirement === 'mandatory' ? 'Mandatory' : 'Optional'}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {doc.displayLabel?.trim() || 'Untitled document'}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {doc.description?.trim() || 'No description — click Edit to add.'}
                      </p>
                      {doc.aiQuestionValidation ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          {doc.validationQuestions.filter((q) => q.question.trim()).length} AI validation question(s)
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline">{idx + 1}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setEditingDocId(doc.tempId)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Dialog
            open={Boolean(editingDoc)}
            onOpenChange={(open) => {
              if (!open) setEditingDocId(null);
            }}
          >
            <DialogContent className="max-w-lg max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
              {editingDoc ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Edit document rule</DialogTitle>
                    <DialogDescription>
                      Requirement, display text, ingestion hints, and optional AI validation questions for this
                      document type.
                    </DialogDescription>
                  </DialogHeader>
                  <FacAiDocumentRuleEditorForm
                    doc={editingDoc}
                    onPatch={(patch) => patchDocument(editingDoc.tempId, patch)}
                    onUpdateQuestions={(updater) => updateDocumentQuestions(editingDoc.tempId, updater)}
                  />
                  <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:gap-0">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive hover:text-destructive sm:mr-auto"
                      disabled={form.documents.length <= 1}
                      onClick={() => {
                        removeDocument(editingDoc.tempId);
                      }}
                    >
                      Remove document
                    </Button>
                    <Button type="button" onClick={() => setEditingDocId(null)}>
                      Done
                    </Button>
                  </DialogFooter>
                </>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-12 flex justify-end gap-3 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/market-admin/fac-ai-studio')}>
            Back
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
