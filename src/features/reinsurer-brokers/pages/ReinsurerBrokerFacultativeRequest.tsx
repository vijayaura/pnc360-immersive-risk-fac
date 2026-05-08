import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  FileUp,
  History,
  Paperclip,
  Plus,
  Send,
  Shield,
  Trash2,
  Upload,
  User,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBrokerProduct } from '@/features/reinsurer-brokers/data/mockData';

const fmtAED = (value: number) =>
  `${new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(value)} AED`;

const proposalSections = [
  {
    id: 'basic-details',
    title: 'Basic Details',
    icon: User,
    fields: [
      ['Company Name', 'Gulf Petrochemical Terminals'],
      ['Trade License #', 'TL-98451-DXB'],
      ['Registered Jurisdiction', 'Jebel Ali Free Zone'],
      ['Emirate of Registration', 'Dubai'],
      ['Main Business Activity', 'Petrochemical Storage'],
      ['Sub Business Activity', 'Bulk Liquid Terminal'],
      ['Year of Establishment', '2018'],
      ['Address Information', 'Plot S-42, Jebel Ali Free Zone, Dubai, UAE'],
      ['Total No. of Employees', '420'],
    ],
  },
  {
    id: 'risk-details',
    title: 'Risk Details',
    icon: Shield,
    fields: [
      ['Product / Cover', 'Property All Risk'],
      ['Unit', 'Primary Risk'],
      ['Occupancy', 'Petrochemical storage terminal'],
      ['Construction', 'Fire-rated steel and concrete tanks'],
      ['Risk Grade', 'A- with catastrophe exposure'],
      ['Sum Insured', fmtAED(78000000)],
      ['Requested Ceded SI', fmtAED(52000000)],
      ['Gross Premium', fmtAED(1380000)],
      ['Commission %', '12.5%'],
    ],
  },
  {
    id: 'claims-history',
    title: 'Claims History Details',
    icon: History,
    fields: [
      ['Loss Period', '2021 - 2025'],
      ['No. of Claims', '2'],
      ['Paid Claims', fmtAED(425000)],
      ['Outstanding Claims', fmtAED(150000)],
      ['Largest Loss', fmtAED(380000)],
      ['Loss Ratio', '41.7%'],
      ['Claims Description', 'One machinery fire loss and one minor storage leakage incident.'],
      ['Risk Improvement Status', 'Fire suppression upgrade completed in 2025.'],
      ['Claims Declaration', 'No open litigated claims declared by insured.'],
    ],
  },
  {
    id: 'attachments',
    title: 'Attachments',
    icon: FileText,
    fields: [
      ['Proposal Form', 'property-all-risk-proposal-form.pdf'],
      ['Loss History Report', 'five-year-claims-history.xlsx'],
      ['Risk Survey', 'jafza-terminal-risk-survey.pdf'],
      ['Trade License', 'trade-license-tl-98451-dxb.pdf'],
      ['Placement Slip Draft', 'broker-placement-slip-draft.pdf'],
      ['Previous Policy Schedule', 'expiring-policy-schedule.pdf'],
    ],
  },
];

const underwritingDocumentTypes = [
  {
    id: 'risk-inspection',
    name: 'Risk Inspection Report',
    description: 'Detailed physical inspection notes, recommendations, and risk improvements.',
    required: true,
    demoFileName: 'risk-inspection-report.pdf',
  },
  {
    id: 'survey-report',
    name: 'Survey Report',
    description: 'Independent site survey report for occupancy, protection, and exposure details.',
    required: true,
    demoFileName: 'survey-report.pdf',
  },
  {
    id: 'valuation-report',
    name: 'Valuation Report',
    description: 'Asset valuation or replacement cost basis supporting the declared sum insured.',
    required: true,
    demoFileName: 'valuation-report.xlsx',
  },
  {
    id: 'photos',
    name: 'Photos',
    description: 'Site, machinery, storage, fire protection, and surrounding exposure photos.',
    required: false,
    demoFileName: 'site-risk-photos.zip',
  },
  {
    id: 'site-layouts',
    name: 'Site Layouts',
    description: 'Plot plan, site layout, fire zones, building separation, and access routes.',
    required: false,
    demoFileName: 'site-layout.pdf',
  },
  {
    id: 'financial-statements',
    name: 'Financial Statements',
    description: 'Latest financial statements or turnover declaration supporting exposure values.',
    required: false,
    demoFileName: 'financial-statements.pdf',
  },
  {
    id: 'engineering-reports',
    name: 'Engineering Reports',
    description: 'Engineering, MEP, fire protection, or structural reports relevant to the risk.',
    required: false,
    demoFileName: 'engineering-report.pdf',
  },
];

const requestSteps = [
  { id: 'documents', title: 'Upload Request Documents' },
  { id: 'proposal', title: 'View Proposal Details' },
  { id: 'requests', title: 'Create Requests' },
] as const;

const reinsurerTargets = [
  {
    id: 'demo-reinsurer',
    name: 'Demo Reinsurer',
    appetite: 'Property, energy, and large industrial risks',
    capacity: 'Up to 60% share',
    responseTime: '24 hours',
  },
  {
    id: 'falcon-re',
    name: 'Falcon Re',
    appetite: 'Commercial property and engineering placements',
    capacity: 'Up to 35% share',
    responseTime: '48 hours',
  },
  {
    id: 'global-re',
    name: 'Global Re',
    appetite: 'Regional property and casualty facultative risks',
    capacity: 'Up to 25% share',
    responseTime: '72 hours',
  },
];

const cewItems = [
  { type: 'Clause', name: '72 Hours Clause', detail: 'Applies to catastrophe aggregation and loss occurrence definition.' },
  { type: 'Extension', name: 'Debris Removal Extension', detail: 'Included within overall property damage limit.' },
  { type: 'Extension', name: 'Professional Fees Extension', detail: 'Architect, surveyor, and consultant fees included.' },
  { type: 'Warranty', name: 'Hot Work Permit Warranty', detail: 'Formal permit system required for all hot work activity.' },
  { type: 'Warranty', name: 'Fire Protection Maintenance Warranty', detail: 'Quarterly testing and maintenance of fire systems required.' },
];

const placementValues = [
  ['Sum Insured', fmtAED(78000000)],
  ['Gross Premium', fmtAED(1380000)],
  ['Insurer Retention', fmtAED(26000000)],
  ['Cession Help Required', fmtAED(52000000)],
];

function ProposalSection({
  section,
  expanded,
  onToggle,
}: {
  section: (typeof proposalSections)[number];
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="cursor-pointer border-b border-slate-200 px-4 py-3" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Icon className="h-4 w-4" />
            </span>
            {section.title}
          </CardTitle>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {section.fields.map(([label, value], index) => {
              const isLastInRow = (index + 1) % 3 === 0;
              const isAltRow = Math.floor(index / 3) % 2 === 0;
              return (
                <div
                  key={label}
                  className={`border-b border-border px-4 py-3 ${!isLastInRow ? 'md:border-r' : ''} ${isAltRow ? 'bg-muted/30' : 'bg-white'}`}
                >
                  <div className="mb-1 text-xs text-muted-foreground">{label}</div>
                  <div className="text-sm font-semibold text-foreground">{value}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function ReinsurerBrokerFacultativeRequest() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const product = useMemo(() => getBrokerProduct(productId), [productId]);
  const [attachedFileName, setAttachedFileName] = useState('');
  const [supportingDocuments, setSupportingDocuments] = useState<Record<string, string>>({});
  const [additionalDocuments, setAdditionalDocuments] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<(typeof requestSteps)[number]['id']>('documents');
  const [reinsurerRequests, setReinsurerRequests] = useState([
    {
      id: 'demo-reinsurer',
      reinsurerId: 'demo-reinsurer',
      cessionPercent: '60',
      premium: '828000',
      commission: '103500',
    },
  ]);
  const [isAddingReinsurer, setIsAddingReinsurer] = useState(false);
  const [draftRequest, setDraftRequest] = useState({
    reinsurerId: reinsurerTargets[1]?.id ?? reinsurerTargets[0].id,
    cessionPercent: '25',
    premium: '345000',
    commission: '43125',
  });
  const [expandedSections, setExpandedSections] = useState(() => new Set(proposalSections.map((section) => section.id)));
  const hasAttachment = attachedFileName.trim().length > 0;

  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const supportingDocumentCount = Object.keys(supportingDocuments).length + additionalDocuments.length;
  const uploadedUnderwritingDocuments = underwritingDocumentTypes
    .filter((doc) => supportingDocuments[doc.id])
    .map((doc) => ({
      id: doc.id,
      title: doc.name,
      fileName: supportingDocuments[doc.id],
      category: doc.required ? 'Required underwriting' : 'Optional underwriting',
    }));
  const finalDocumentList = [
    {
      id: 'proposal-form',
      title: 'Proposal Form',
      fileName: attachedFileName,
      category: 'Required',
    },
    ...uploadedUnderwritingDocuments,
    ...additionalDocuments.map((fileName, index) => ({
      id: `additional-${index}`,
      title: 'Additional Document',
      fileName,
      category: 'Additional',
    })),
  ].filter((doc) => doc.fileName);

  const addReinsurerRequest = () => {
    if (!draftRequest.reinsurerId) return;
    setReinsurerRequests((prev) => [
      ...prev.filter((request) => request.reinsurerId !== draftRequest.reinsurerId),
      { ...draftRequest, id: draftRequest.reinsurerId },
    ]);
    setIsAddingReinsurer(false);
  };

  return (
    <div className="min-h-full overflow-auto bg-slate-50">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 pb-8">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <Button variant="ghost" className="mb-4 gap-2 px-0" onClick={() => navigate('/reinsurer-broker/facultative-request')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Create Facultative Request</p>
              <h2 className="text-2xl font-bold text-slate-900">{product.name}</h2>
            </div>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid gap-3 md:grid-cols-3">
              {requestSteps.map((step, index) => {
                const isActive = activeStep === step.id;
                const currentIndex = requestSteps.findIndex((item) => item.id === activeStep);
                const isComplete = index < currentIndex;

                return (
                  <button
                    key={step.id}
                    type="button"
                    className={`rounded-lg border p-4 text-left transition ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : isComplete
                          ? 'border-success/30 bg-success/10 text-success'
                          : 'border-border bg-white text-muted-foreground'
                    }`}
                    onClick={() => {
                      if (step.id === 'proposal' && !hasAttachment) return;
                      if (step.id === 'requests' && !hasAttachment) return;
                      setActiveStep(step.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : isComplete
                              ? 'bg-success text-white'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isComplete ? <CheckCircle className="h-4 w-4" /> : index + 1}
                      </span>
                      <span className="font-semibold">{step.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {activeStep === 'documents' && (
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" />
              Upload Request Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <Card
              className={`transition-all duration-200 ${
                hasAttachment
                  ? 'border-border bg-card shadow-sm ring-1 ring-inset ring-success/20'
                  : 'border-primary/25 bg-primary/5 hover:border-primary/35'
              }`}
            >
              <CardContent className="p-4 lg:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                  <div className="flex min-w-0 flex-1 gap-3 lg:gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                        hasAttachment ? 'border-success/30 bg-success/10' : 'border-border bg-muted/40'
                      }`}
                    >
                      {hasAttachment ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground lg:text-base">Proposal Form</h4>
                        {hasAttachment ? (
                          <Badge variant="outline" className="border-success text-success">Uploaded</Badge>
                        ) : (
                          <Badge variant="default">Required</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground lg:text-sm">
                        Main proposal form used to populate the submitted proposal details.
                      </p>
                      {hasAttachment && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground lg:text-sm">
                          <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <span className="truncate" title={attachedFileName}>
                              {attachedFileName}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end [&>button]:h-9 [&>button]:shrink-0">
                    {hasAttachment ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 px-3 text-xs text-destructive hover:bg-red-500/10 hover:text-red-500"
                        onClick={() => setAttachedFileName('')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    ) : (
                      <>
                        <Label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
                          <Upload className="h-3.5 w-3.5" />
                          Upload
                          <Input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xlsx,.xls"
                            onChange={(event) => setAttachedFileName(event.target.files?.[0]?.name ?? '')}
                          />
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5 px-3 text-xs"
                          onClick={() => setAttachedFileName(`${product.code}-proposal-form.pdf`)}
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          Use Demo Form
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-5 rounded-lg border bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Underwriting Documents</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload supporting files needed for facultative underwriting review.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    setSupportingDocuments(
                      underwritingDocumentTypes.reduce<Record<string, string>>((acc, doc) => {
                        acc[doc.id] = doc.demoFileName;
                        return acc;
                      }, {}),
                    )
                  }
                >
                  <Paperclip className="h-4 w-4" />
                  Attach Demo Documents
                </Button>
              </div>

              <div className="grid gap-4 lg:gap-5">
                {underwritingDocumentTypes.map((doc) => {
                  const uploadedFileName = supportingDocuments[doc.id];
                  const isUploaded = Boolean(uploadedFileName);

                  return (
                    <Card
                      key={doc.id}
                      className={`transition-all duration-200 ${
                        isUploaded
                          ? 'border-border bg-card shadow-sm ring-1 ring-inset ring-success/20'
                          : doc.required
                            ? 'border-primary/25 bg-primary/5 hover:border-primary/35'
                            : 'border-border bg-card/80 hover:border-primary/25'
                      }`}
                    >
                      <CardContent className="p-4 lg:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                          <div className="flex min-w-0 flex-1 gap-3 lg:gap-4">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                                isUploaded ? 'border-success/30 bg-success/10' : 'border-border bg-muted/40'
                              }`}
                            >
                              {isUploaded ? (
                                <CheckCircle className="h-5 w-5 text-success" />
                              ) : (
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-semibold text-foreground lg:text-base">{doc.name}</h4>
                                {isUploaded ? (
                                  <Badge variant="outline" className="border-success text-success">Uploaded</Badge>
                                ) : doc.required ? (
                                  <Badge variant="default">Required</Badge>
                                ) : (
                                  <Badge variant="outline">Optional</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground lg:text-sm">{doc.description}</p>
                              {isUploaded && (
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground lg:text-sm">
                                  <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                                    <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                                    <span className="truncate" title={uploadedFileName}>
                                      {uploadedFileName}
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end [&>button]:h-9 [&>button]:shrink-0">
                            {isUploaded ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5 px-3 text-xs text-destructive hover:bg-red-500/10 hover:text-red-500"
                                onClick={() =>
                                  setSupportingDocuments((prev) => {
                                    const next = { ...prev };
                                    delete next[doc.id];
                                    return next;
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                              </Button>
                            ) : (
                              <Label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
                                <Upload className="h-3.5 w-3.5" />
                                Upload
                                <Input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.zip"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) return;
                                    setSupportingDocuments((prev) => ({ ...prev, [doc.id]: file.name }));
                                  }}
                                />
                              </Label>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="space-y-4">
                {additionalDocuments.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">Additional Documents</h3>
                        <p className="text-sm text-muted-foreground">Add extra files that do not fit the configured list.</p>
                      </div>
                      <Label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                        <Plus className="h-4 w-4" />
                        Add Additional Document
                        <Input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.zip"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            setAdditionalDocuments((prev) => [...prev, file.name]);
                          }}
                        />
                      </Label>
                    </div>
                    <div className="grid gap-4 lg:gap-5">
                      {additionalDocuments.map((fileName, index) => (
                        <Card key={`${fileName}-${index}`} className="border border-border bg-card shadow-sm ring-1 ring-inset ring-success/20">
                          <CardContent className="p-4 lg:p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div className="flex min-w-0 flex-1 gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10">
                                  <CheckCircle className="h-5 w-5 text-success" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-semibold text-foreground lg:text-base">Additional Document</h4>
                                    <Badge variant="outline" className="border-success text-success">Uploaded</Badge>
                                  </div>
                                  <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-foreground lg:text-sm">
                                    <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                                    <span className="truncate" title={fileName}>{fileName}</span>
                                  </span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5 px-3 text-xs text-destructive hover:bg-red-500/10 hover:text-red-500"
                                onClick={() => setAdditionalDocuments((prev) => prev.filter((_, idx) => idx !== index))}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                              </Button>
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
                      <h3 className="text-base font-semibold text-foreground">Additional Documents</h3>
                      <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        No additional documents have been added yet.
                      </p>
                      <Label className="mt-5 inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                        <Plus className="h-4 w-4" />
                        Add Additional Document
                        <Input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.zip"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            setAdditionalDocuments((prev) => [...prev, file.name]);
                          }}
                        />
                      </Label>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-slate-50 p-3 text-sm">
              {hasAttachment ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Proposal attached</Badge>
                    <span className="font-medium text-slate-900">{attachedFileName}</span>
                    <span className="text-muted-foreground">Submitted proposal form details populated below.</span>
                  </div>
                  {supportingDocumentCount > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {supportingDocumentCount} supporting document{supportingDocumentCount > 1 ? 's' : ''}
                      </Badge>
                      <span className="text-muted-foreground">
                        Underwriting and additional documents attached for reinsurer review.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                null
              )}
            </div>

            <div className="flex justify-end">
              <Button disabled={!hasAttachment} onClick={() => setActiveStep('proposal')}>
                Continue to Proposal Details
              </Button>
            </div>
          </CardContent>
        </Card>
        )}

        {activeStep === 'proposal' && hasAttachment && (
          <>
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b">
                <CardTitle>Proposal Form</CardTitle>
                <p className="text-sm text-muted-foreground">Full proposal template with submitted values.</p>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {proposalSections.map((section) => (
                  <ProposalSection
                    key={section.id}
                    section={section}
                    expanded={expandedSections.has(section.id)}
                    onToggle={() => toggleSectionExpansion(section.id)}
                  />
                ))}
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="border-b px-4 py-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <Shield className="h-4 w-4" />
                      </span>
                      CEWs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {cewItems.map((item) => (
                        <div key={`${item.type}-${item.name}`} className="grid gap-2 px-4 py-3 md:grid-cols-[9rem_1fr]">
                          <div>
                            <Badge variant="outline">{item.type}</Badge>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="border-b px-4 py-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <FileText className="h-4 w-4" />
                      </span>
                      Requirement Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 p-4 md:grid-cols-4">
                    {placementValues.map(([label, value]) => (
                      <div key={label} className="rounded-lg border bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                  <Button variant="outline" onClick={() => setActiveStep('documents')}>
                    Back to Documents
                  </Button>
                  <Button onClick={() => setActiveStep('requests')}>
                    Continue to Create Requests
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeStep === 'requests' && hasAttachment && (
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>Create Requests</CardTitle>
              <p className="text-sm text-muted-foreground">Select reinsurers to receive this facultative request.</p>
            </CardHeader>
            <CardContent className="space-y-5 p-4">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b px-4 py-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <FileText className="h-4 w-4" />
                    </span>
                    Requirement Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 p-4 md:grid-cols-4">
                  {placementValues.map(([label, value]) => (
                    <div key={label} className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="rounded-lg border bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">Reinsurer Requests</h3>
                    <p className="text-sm text-muted-foreground">
                      Add reinsurers one by one and define the cession help requested from each market.
                    </p>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={() => setIsAddingReinsurer(true)}>
                    <Plus className="h-4 w-4" />
                    Add Reinsurer
                  </Button>
                </div>

                {isAddingReinsurer && (
                  <div className="mt-4 rounded-lg border border-primary/25 bg-primary/5 p-4">
                    <div className="grid gap-4 lg:grid-cols-4">
                      <div className="space-y-2 lg:col-span-1">
                        <Label htmlFor="reinsurer-market">Reinsurer</Label>
                        <select
                          id="reinsurer-market"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={draftRequest.reinsurerId}
                          onChange={(event) => setDraftRequest((prev) => ({ ...prev, reinsurerId: event.target.value }))}
                        >
                          {reinsurerTargets.map((reinsurer) => (
                            <option key={reinsurer.id} value={reinsurer.id}>
                              {reinsurer.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cession-percent">Cession %</Label>
                        <Input
                          id="cession-percent"
                          value={draftRequest.cessionPercent}
                          onChange={(event) => setDraftRequest((prev) => ({ ...prev, cessionPercent: event.target.value }))}
                          placeholder="25"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cession-premium">Premium Amount</Label>
                        <Input
                          id="cession-premium"
                          value={draftRequest.premium}
                          onChange={(event) => setDraftRequest((prev) => ({ ...prev, premium: event.target.value }))}
                          placeholder="345000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commission-amount">Commission Amount</Label>
                        <Input
                          id="commission-amount"
                          value={draftRequest.commission}
                          onChange={(event) => setDraftRequest((prev) => ({ ...prev, commission: event.target.value }))}
                          placeholder="43125"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddingReinsurer(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addReinsurerRequest}>Add Request</Button>
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {reinsurerRequests.length === 0 ? (
                    <div className="rounded-lg border border-dashed bg-slate-50 p-8 text-center">
                      <p className="font-semibold text-slate-900">No reinsurer requests added yet.</p>
                      <p className="mt-1 text-sm text-muted-foreground">Use Add Reinsurer to define cession help.</p>
                    </div>
                  ) : (
                    reinsurerRequests.map((request) => {
                      const reinsurer = reinsurerTargets.find((item) => item.id === request.reinsurerId);
                      return (
                        <div key={request.id} className="rounded-lg border bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold text-slate-900">{reinsurer?.name ?? request.reinsurerId}</h4>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Cession help</Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{reinsurer?.appetite}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-destructive hover:bg-red-500/10 hover:text-red-500"
                              onClick={() => setReinsurerRequests((prev) => prev.filter((item) => item.id !== request.id))}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </Button>
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-lg border bg-white p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cession %</p>
                              <p className="mt-1 font-semibold text-slate-900">{request.cessionPercent}%</p>
                            </div>
                            <div className="rounded-lg border bg-white p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Premium Amount</p>
                              <p className="mt-1 font-semibold text-slate-900">{fmtAED(Number(request.premium) || 0)}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Commission Amount</p>
                              <p className="mt-1 font-semibold text-slate-900">{fmtAED(Number(request.commission) || 0)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-slate-50 p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">Documents to Share</h3>
                    <p className="text-sm text-muted-foreground">
                      These documents will be included in the facultative request package.
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit bg-blue-50 text-blue-700 border-blue-200">
                    {finalDocumentList.length} document{finalDocumentList.length === 1 ? '' : 's'}
                  </Badge>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {finalDocumentList.map((doc) => (
                    <div key={doc.id} className="flex min-w-0 items-start gap-3 rounded-lg border bg-white p-3 shadow-sm">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10">
                        <FileText className="h-4 w-4 text-success" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{doc.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {doc.category}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground" title={doc.fileName}>
                          {doc.fileName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={() => setActiveStep('proposal')}>
                  Back to Proposal Details
                </Button>
                <Button
                  className="gap-2"
                  disabled={reinsurerRequests.length === 0}
                  onClick={() => navigate('/reinsurer-broker/referral/demo-pol-004')}
                >
                  <Send className="h-4 w-4" />
                  Create Requests
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
