import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  Eye,
  FileText,
  MessageSquare,
  Pencil,
  Plus,
  Save,
  Send,
  Upload,
  User,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/lib-utils';
import { facultativeReferrals } from '@/features/reinsurer-brokers/data/mockData';
import { FacInwardRequestJourney } from '@/features/reinsurer-brokers/components/FacInwardRequestJourney';

const fmtAED = (value: number) =>
  `${new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(value)} AED`;

type ReferralRecord = (typeof facultativeReferrals)[number];

const fallbackRecord: ReferralRecord = facultativeReferrals[0];

const requestDocuments = [
  { title: 'Proposal Form', category: 'Required', fileName: 'PAR-proposal-form.pdf' },
  { title: 'Risk Inspection Report', category: 'Required underwriting', fileName: 'risk-inspection-report.pdf' },
  { title: 'Survey Report', category: 'Required underwriting', fileName: 'survey-report.pdf' },
  { title: 'Valuation Report', category: 'Required underwriting', fileName: 'valuation-report.xlsx' },
  { title: 'Engineering Report', category: 'Optional underwriting', fileName: 'engineering-report.pdf' },
];

const CEW_TYPES = ['Clause', 'Extension', 'Warranty'] as const;

type PlacementCewItem = {
  id: string;
  type: (typeof CEW_TYPES)[number] | string;
  name: string;
  detail: string;
};

const DEFAULT_PLACEMENT_CEWS: PlacementCewItem[] = [
  {
    id: 'cew-72h-clause',
    type: 'Clause',
    name: '72 Hours Clause',
    detail: 'Applies to catastrophe aggregation and loss occurrence definition.',
  },
  {
    id: 'cew-debris-ext',
    type: 'Extension',
    name: 'Debris Removal Extension',
    detail: 'Included within overall property damage limit.',
  },
  {
    id: 'cew-hot-work-war',
    type: 'Warranty',
    name: 'Hot Work Permit Warranty',
    detail: 'Formal permit system required for all hot work activity.',
  },
];

const requirementSummary = [
  ['Sum Insured', fmtAED(78000000)],
  ['Gross Premium', fmtAED(1380000)],
  ['Insurer Retention', fmtAED(26000000)],
  ['Cession Help Required', fmtAED(52000000)],
  ['Commission %', '12.5%'],
] as const satisfies readonly (readonly [string, string])[];

const proposalSections = [
  {
    title: 'Basic Details',
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
    title: 'Risk Details',
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
    title: 'Claims History Details',
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
    title: 'Attachments',
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

type AiRiskTier = 'green' | 'amber' | 'red';

type AiFieldRiskInsight = {
  score: number;
  tier: AiRiskTier;
  pointers: readonly string[];
};

function aiRiskTierFromScore(score: number): AiRiskTier {
  if (score <= 40) return 'green';
  if (score <= 70) return 'amber';
  return 'red';
}

function aiRiskScoreBadgeClass(tier: AiRiskTier): string {
  return cn(
    'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ring-1 ring-inset',
    tier === 'green' && 'bg-emerald-100 text-emerald-900 ring-emerald-300',
    tier === 'amber' && 'bg-amber-100 text-amber-950 ring-amber-300',
    tier === 'red' && 'bg-red-100 text-red-950 ring-red-400',
  );
}

/** Per submitted-value cell when AI Risk suggestion is enabled. */
function submittedValueAiRiskInsight(sectionTitle: string, fieldLabel: string): AiFieldRiskInsight {
  const sec = sectionTitle.toLowerCase();
  const lbl = fieldLabel.toLowerCase();
  const combined = `${sec} ${lbl}`;

  if (sec === 'attachments') {
    return {
      score: 32,
      tier: 'green',
      pointers: ['Core slip + survey present', 'Reconcile PDF dates with risk change log', 'Flag if loss run stale vs claims section'],
    };
  }
  if (combined.includes('claim') || /\b(loss ratio|paid claims|outstanding claims|largest loss)\b/.test(combined)) {
    return {
      score: 71,
      tier: 'red',
      pointers: ['2 paid losses · watch reserve drift', '41.7% LR vs modelling band', 'Open leakage narrative — verify IBNR'],
    };
  }
  if (
    combined.includes('sum insured') ||
    combined.includes('ceded') ||
    combined.includes('retention') ||
    /\b(gross premium|premium|commission)\b/.test(combined)
  ) {
    return {
      score: 68,
      tier: 'amber',
      pointers: ['High SI concentration on terminal stack', 'Peer layer pricing soft vs CAT peers', 'JAFZA cluster accumulation check'],
    };
  }
  if (
    combined.includes('address') ||
    combined.includes('emirate') ||
    combined.includes('jurisdiction') ||
    combined.includes('plot') ||
    combined.includes('zone')
  ) {
    return {
      score: 64,
      tier: 'amber',
      pointers: ['Coastal industrial CAT uplift', 'Wind / surge footprints — stress scenarios', 'Deductible vs corridor norms'],
    };
  }
  if (
    combined.includes('construction') ||
    combined.includes('occupancy') ||
    combined.includes('risk grade') ||
    (combined.includes('unit') && combined.includes('risk')) ||
    (combined.includes('product') && combined.includes('cover'))
  ) {
    return {
      score: 76,
      tier: 'red',
      pointers: ['Tank farm vapour + fire-load dominant', "'A-' grade still CAT-heavy", 'Spacing / sprinkler linkage to HPR'],
    };
  }
  if (
    combined.includes('employee') ||
    combined.includes('year of establishment') ||
    /\bestablishment\b/.test(combined)
  ) {
    return {
      score: 38,
      tier: 'green',
      pointers: ['Mature ops · 420 headcount manageable', 'Turnaround windows — uplift maintenance peril', 'Newer entity — track stability'],
    };
  }
  if (combined.includes('business activity') || combined.includes('trade license') || combined.includes('company name')) {
    return {
      score: 52,
      tier: 'amber',
      pointers: ['Petrochemical storage — commodity spike BI', 'License jurisdiction matches UAE ops', 'Name / activity alignment OK'],
    };
  }
  return {
    score: 56,
    tier: 'amber',
    pointers: ['Cross-field peer tail vs PAR terminal book', 'Monitor claims + CAT interaction', 'No single red flag · aggregate watch'],
  };
}

type RequirementSummaryAiInsight = AiFieldRiskInsight & {
  /** Human-readable peer / model band for underwriter comparison. */
  acceptableRange: string;
};

/** AI context for facultative requirement summary tiles (amounts + commission). */
function requirementSummaryAiInsight(summaryLabel: string): RequirementSummaryAiInsight {
  const lbl = summaryLabel.toLowerCase();

  if (lbl.includes('sum insured')) {
    return {
      score: 64,
      tier: 'amber',
      pointers: [
        '78M AED vs JAFZA petrochemical peer cluster density',
        'CAT PML uplift · stress tank farm + wind footprint',
        'Align SI with last risk survey declared values',
      ],
      acceptableRange: '72M – 84M AED (PAR terminal, CAT-exposed cohort)',
    };
  }
  if (lbl.includes('gross premium')) {
    return {
      score: 61,
      tier: 'amber',
      pointers: [
        '≈1.77‰ on SI vs market 1.5–2.2‰ for heavy industrial',
        'Layer pricing soft vs regional CAT peers — watch net rate',
      ],
      acceptableRange: '1.22M – 1.55M AED (model band at quoted SI / exposure)',
    };
  }
  if (lbl.includes('retention')) {
    return {
      score: 48,
      tier: 'green',
      pointers: [
        '≈33% of SI — typical cedent corridor for fac outward',
        'Net retention stress vs balance sheet appetite',
      ],
      acceptableRange: '23M – 30M AED (≈29–39% of SI for this occupancy)',
    };
  }
  if (lbl.includes('cession')) {
    return {
      score: 59,
      tier: 'amber',
      pointers: [
        '52M line vs programme shape and Layer 1 thickness',
        'Correlate with requested share on placement tab',
      ],
      acceptableRange: '48M – 56M AED (vs peer layer thickness for similar limits)',
    };
  }
  if (lbl.includes('commission')) {
    return {
      score: 42,
      tier: 'green',
      pointers: [
        'Within facultative uplift norms vs primary book',
        'Net terms still drive technical adequacy',
      ],
      acceptableRange: '11% – 14.5% gross-to-gross (fac inward / brokered layer)',
    };
  }

  return {
    score: 55,
    tier: 'amber',
    pointers: ['Cross-check technical vs exposure schedule', 'Peer strip vs single risk'],
    acceptableRange: 'Refer to committee pricing band for this risk class',
  };
}

function computeSubmissionCumulativeSnapshot(): {
  averageScore: number;
  tier: AiRiskTier;
  highlights: readonly string[];
} {
  let sum = 0;
  let n = 0;
  let peak = 0;
  let peakLabel = '';

  for (const section of proposalSections) {
    for (const [label] of section.fields) {
      const { score } = submittedValueAiRiskInsight(section.title, label);
      sum += score;
      n++;
      if (score >= peak) {
        peak = score;
        peakLabel = label;
      }
    }
  }

  for (const [label] of requirementSummary) {
    const { score } = requirementSummaryAiInsight(label);
    sum += score;
    n++;
    if (score >= peak) {
      peak = score;
      peakLabel = label;
    }
  }

  const averageScore = n ? Math.round(sum / n) : 0;
  const tier = aiRiskTierFromScore(averageScore);

  const highlights =
    tier === 'red'
      ? ([
          `Composite heat · ${averageScore}/100 — elevated cohort`,
          `Hot cell · ${peakLabel} (${peak}) drives tail`,
          'CAT + claims stack — tighten terms or uplift attachment',
          'Portfolio: JAFZA petrochemical correlated basket',
          'Attachments complete — drill technical & loss development',
        ] as const)
      : tier === 'amber'
        ? ([
            `Composite heat · ${averageScore}/100 — monitoring band`,
            `Peak exposure · ${peakLabel} (${peak})`,
            'Coastal + industrial mix — CAT deductible review',
            'Accumulation acceptable with layering discipline',
            'Claims history within appetite · watch LR trend',
          ] as const)
        : ([
            `Composite heat · ${averageScore}/100 — within comfort`,
            `${peakLabel} (${peak}) is highest local reading`,
            'Document pack coherent vs narrative',
            'Geography/peril profile manageable vs model',
          ] as const);

  return { averageScore, tier, highlights };
}

const reinsurerRequestStatuses = [
  {
    id: 'demo-reinsurer',
    name: 'Demo Reinsurer',
    status: 'Quoted',
    cessionPercent: '60%',
    premium: fmtAED(828000),
    commission: fmtAED(103500),
    lastUpdate: '07/05/2026, 10:30',
  },
  {
    id: 'falcon-re',
    name: 'Falcon Re',
    status: 'Pending Review',
    cessionPercent: '25%',
    premium: fmtAED(345000),
    commission: fmtAED(43125),
    lastUpdate: '07/05/2026, 10:18',
  },
  {
    id: 'global-re',
    name: 'Global Re',
    status: 'Declined',
    cessionPercent: '15%',
    premium: fmtAED(207000),
    commission: fmtAED(25875),
    lastUpdate: '07/05/2026, 11:05',
  },
];

const statusBadgeClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('quoted')) return 'bg-green-50 text-green-700 border-green-200';
  if (normalized.includes('pending')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (normalized.includes('declined')) return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

type RequestDetailsPortal = 'broker' | 'insurer' | 'reinsurer';

/** Underwriter / signing reinsurer: embedded fac-in UX (timeline, placement actions, no broker reinsurer picker). */
const inwardFacPortal = (portal: RequestDetailsPortal): boolean => portal === 'insurer' || portal === 'reinsurer';

const portalPaths = (portal: RequestDetailsPortal) => {
  if (portal === 'insurer') {
    return {
      referralBase: '/insurer/fac-in-cases',
      dashboard: '/insurer/fac-in-cases',
    };
  }
  if (portal === 'reinsurer') {
    return {
      referralBase: '/reinsurer/fac-slips',
      dashboard: '/reinsurer/dashboard',
    };
  }
  return {
    referralBase: '/reinsurer-broker/referral',
    dashboard: '/reinsurer-broker/dashboard',
  };
};

export type ReinsurerBrokerPathOverrides = {
  referralBase: string;
  dashboard: string;
  /** When set, "Back" on the reinsurer line detail returns here instead of the facultative record overview. */
  backFromReinsurerDetail?: string;
};

const timelineBrokerPerspective: [string, string, string][] = [
  ['Facultative Request Created', 'Broker created a placement request from the attached quote form.', '06/05/2026, 14:42:18'],
  ['Placement Slip Generated', 'Risk values, commission, and requested share were populated for review.', '06/05/2026, 14:48:10'],
  ['Sent to Reinsurer', 'Request routed to Demo Reinsurer for terms and capacity confirmation.', '06/05/2026, 15:30:22'],
];

/** Insurer referral route: timeline copy as the cedent / requester — not the receiving reinsurer. */
const timelineInsurerRequesterPerspective: [string, string, string][] = [
  [
    'Facultative Request Created',
    'You raised a facultative placement request from this underwriting referral with the attached quote and underwriting pack.',
    '06/05/2026, 14:42:18',
  ],
  [
    'Placement Slip Generated',
    'Requested share, commission, and exposure lines were captured on the placement slip for reinsurer review.',
    '06/05/2026, 14:48:10',
  ],
  [
    'Sent to Reinsurer',
    'The submission was released to the receiving reinsurer for technical review, capacity, and facultative terms.',
    '06/05/2026, 15:30:22',
  ],
];

/** Underwriter portal: wording as experienced by the receiving reinsurer. */
const timelineReinsurerPerspective: [string, string, string][] = [
  [
    'Inbound facultative submission received',
    'Fac pack and slip reached your underwriting inbox from the placing broker and cedent for facultative acceptance.',
    '06/05/2026, 14:42:18',
  ],
  [
    'Submission triaged — documentation complete',
    'Proposal, inspections, valuations, and prior loss history marked complete; risk opened on your facultative blotter for technical review.',
    '06/05/2026, 14:48:10',
  ],
  [
    'Underwriting assessment in progress',
    'Your team is validating exposure accumulation, catastrophe drivers, attachment, and pricing before confirming line share and facultative quote terms.',
    '06/05/2026, 15:30:22',
  ],
];

type PlacementEditHistoryRow = {
  date: string;
  updatedBy: string;
  summary: string;
  comment: string;
};

const placementEditHistoryBrokerInitial: PlacementEditHistoryRow[] = [
  {
    date: '06/05/2026, 15:30:22',
    updatedBy: 'Demo Reinsurance Broker',
    summary: 'Placement slip submitted to reinsurer',
    comment: 'Initial request shared with target reinsurer for capacity confirmation.',
  },
  {
    date: '06/05/2026, 14:48:10',
    updatedBy: 'Demo Reinsurance Broker',
    summary: 'Quote form attached',
    comment: 'Broker quote form validated and risk values extracted.',
  },
];

/** Insurer referral: edit history rows as logged by the cedent requester (not broker, not inward reinsurer inbox). */
const placementEditHistoryInsurerReferrerInitial: PlacementEditHistoryRow[] = [
  {
    date: '06/05/2026, 15:30:22',
    updatedBy: 'Demo Underwriter',
    summary: 'Placement slip submitted to reinsurer',
    comment: 'Request shared from this underwriting referral for facultative capacity and pricing.',
  },
  {
    date: '06/05/2026, 14:48:10',
    updatedBy: 'Demo Underwriter',
    summary: 'Referral pack attached',
    comment: 'Quote and underwriting attachments validated against this referral before release.',
  },
];

/** Underwriter portal: Edit History as recorded from the receiving reinsurer's side. */
const placementEditHistoryReinsurerInitial: PlacementEditHistoryRow[] = [
  {
    date: '06/05/2026, 15:30:22',
    updatedBy: 'Demo Reinsurer',
    summary: 'Inbound placement logged for facultative underwriting',
    comment:
      'Your team registered the slip against the risk; share and premium lines initialised for technical review and CAT checks.',
  },
  {
    date: '06/05/2026, 14:48:10',
    updatedBy: 'Demo Reinsurer',
    summary: 'Supporting pack accepted for assessment',
    comment:
      'Proposal and underwriting attachments accepted as complete to progress internal pricing and capacity allocation.',
  },
];

export default function ReinsurerBrokerRequestDetails({
  portal = 'broker',
  pathOverrides,
  requesterChatRole = 'broker',
  submissionSourceLabel,
}: {
  portal?: RequestDetailsPortal;
  pathOverrides?: ReinsurerBrokerPathOverrides;
  /** Outbound bubble in reinsurance chat: broker-placing vs cedent underwriting. */
  requesterChatRole?: 'broker' | 'insurer';
  /** Overrides quote info "Submission Source" (e.g. insurer referral reinsurance page). */
  submissionSourceLabel?: string;
}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const defaultedPaths = portalPaths(portal);
  const referralBase = pathOverrides?.referralBase ?? defaultedPaths.referralBase;
  const dashboardPath = pathOverrides?.dashboard ?? defaultedPaths.dashboard;
  const backFromReinsurerDetailPath = pathOverrides?.backFromReinsurerDetail;
  const { recordId, reinsurerId } = useParams<{ recordId: string; reinsurerId?: string }>();
  const record = ((location.state as { record?: ReferralRecord } | null)?.record
    ?? facultativeReferrals.find((item) => item.id === recordId)
    ?? fallbackRecord);
  const isReinsurerDetailPage = Boolean(reinsurerId);
  /** Broker portal: reinsurer picker; inward fac portals: omit list and embed reinsurer panels. */
  const showReinsurerRequestsList = portal === 'broker' && !isReinsurerDetailPage;
  const showReinsurerDetailPanels = isReinsurerDetailPage || inwardFacPortal(portal);

  const [isCommunicationOpen, setIsCommunicationOpen] = useState(false);
  const [insurerDocumentsDialogOpen, setInsurerDocumentsDialogOpen] = useState(false);
  const [aiRiskSuggestionsEnabled, setAiRiskSuggestionsEnabled] = useState(false);
  const signedFacSlipInputRef = useRef<HTMLInputElement>(null);

  const [placementCewItems, setPlacementCewItems] = useState<PlacementCewItem[]>(() =>
    DEFAULT_PLACEMENT_CEWS.map((item) => ({ ...item })),
  );

  /** Underwriter portal: CEWs apply unless unchecked (deselected). */
  const [includedCewIds, setIncludedCewIds] = useState<Set<string>>(
    () => new Set(DEFAULT_PLACEMENT_CEWS.map((item) => item.id)),
  );
  const [addCewDialogOpen, setAddCewDialogOpen] = useState(false);
  const [newCewType, setNewCewType] = useState<string>(CEW_TYPES[0]);
  const [newCewName, setNewCewName] = useState('');
  const [newCewDetail, setNewCewDetail] = useState('');
  const [signedFacSlipName, setSignedFacSlipName] = useState<string | null>(null);
  const [placementFinalised, setPlacementFinalised] = useState(false);

  const [selectedReinsurerId] = useState(reinsurerId ?? 'demo-reinsurer');
  const [isEditingPlacement, setIsEditingPlacement] = useState(false);
  const [placement, setPlacement] = useState({
    sharePercent: '60',
    risk: String(Math.round(record.requestedCededSI * 0.6)),
    premium: String(Math.round(record.premium * 0.6)),
    commissionPercent: '12.5',
    comment: '',
  });
  const [history, setHistory] = useState<PlacementEditHistoryRow[]>(() => {
    if (inwardFacPortal(portal)) return placementEditHistoryReinsurerInitial;
    if (requesterChatRole === 'insurer') return placementEditHistoryInsurerReferrerInitial;
    return placementEditHistoryBrokerInitial;
  });

  const quoteInfo = [
    ['Request ID', record.requestId],
    ['Risk ID', record.riskId],
    ['Insured', record.insured],
    ['Product', record.product],
    ['Submission Source', submissionSourceLabel ?? 'Reinsurer Broker Portal'],
    ['Originating Insurer', 'Aura Underwriting Demo'],
    ['Target Reinsurer', reinsurerRequestStatuses.find((item) => item.id === selectedReinsurerId)?.name ?? record.reinsurer],
    ['Submitted Date', record.submittedDate],
    ['Status', record.status],
  ];

  /** Insurer facultative inward: one overview grid (identifiers → cover → parties → exposure). No Product/Commission duplicate vs Facultative reinsurance line. */
  const insurerRequestOverviewSections: { title: string; rows: readonly (readonly [string, string])[] }[] = [
    {
      title: 'Identification',
      rows: [
        ['Request ID', record.requestId],
        ['Risk ID', record.riskId],
        ['Status', record.status],
      ],
    },
    {
      title: 'Cover & insured',
      rows: [
        ['Insured', record.insured],
        ['Product', record.product],
        ['Unit', 'Primary Risk'],
      ],
    },
    {
      title: 'Parties & submission',
      rows: [
        ['Target Reinsurer', reinsurerRequestStatuses.find((item) => item.id === selectedReinsurerId)?.name ?? record.reinsurer],
        ['Originating Insurer', 'Aura Underwriting Demo'],
        ['Submission Source', submissionSourceLabel ?? 'Reinsurer Broker Portal'],
      ],
    },
    {
      title: 'Exposure',
      rows: [
        ['Submitted Date', record.submittedDate],
        ['Requested Ceded SI', fmtAED(record.requestedCededSI)],
        ['Premium', fmtAED(record.premium)],
      ],
    },
  ];

  const timeline =
    inwardFacPortal(portal)
      ? timelineReinsurerPerspective
      : requesterChatRole === 'insurer'
        ? timelineInsurerRequesterPerspective
        : timelineBrokerPerspective;

  useEffect(() => {
    setHistory(() => {
      if (inwardFacPortal(portal)) return placementEditHistoryReinsurerInitial;
      if (requesterChatRole === 'insurer') return placementEditHistoryInsurerReferrerInitial;
      return placementEditHistoryBrokerInitial;
    });
  }, [portal, record.id, reinsurerId, requesterChatRole]);

  useEffect(() => {
    setPlacement({
      sharePercent: '60',
      risk: String(Math.round(record.requestedCededSI * 0.6)),
      premium: String(Math.round(record.premium * 0.6)),
      commissionPercent: '12.5',
      comment: '',
    });
  }, [record.id, record.requestedCededSI, record.premium]);

  useEffect(() => {
    setPlacementCewItems(DEFAULT_PLACEMENT_CEWS.map((item) => ({ ...item })));
    setIncludedCewIds(new Set(DEFAULT_PLACEMENT_CEWS.map((item) => item.id)));
  }, [record.id]);

  const handleShareChange = (value: string) => {
    const share = Math.max(0, Math.min(100, Number(value) || 0));
    setPlacement((prev) => ({
      ...prev,
      sharePercent: value,
      risk: String(Math.round(record.requestedCededSI * (share / 100))),
      premium: String(Math.round(record.premium * (share / 100))),
    }));
  };

  const openDocumentDemo = (fileName: string, title?: string) => {
    toast({
      title: title ?? 'Document',
      description: `Opening preview for ${fileName} (demo).`,
    });
  };

  const handleSignedFacSlipChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSignedFacSlipName(file.name);
    toast({
      title: 'Signed Placement slip',
      description: `${file.name} uploaded successfully (demo).`,
    });
    event.target.value = '';
  };

  const resetAddCewForm = () => {
    setNewCewType(CEW_TYPES[0]);
    setNewCewName('');
    setNewCewDetail('');
  };

  const handleAddPlacementCew = () => {
    const name = newCewName.trim();
    const detail = newCewDetail.trim();
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'Title required',
        description: 'Enter a CEW title before adding.',
      });
      return;
    }
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `cew-custom-${crypto.randomUUID()}`
        : `cew-custom-${Date.now()}`;
    const item: PlacementCewItem = {
      id,
      type: newCewType,
      name,
      detail: detail || '—',
    };
    setPlacementCewItems((prev) => [...prev, item]);
    setIncludedCewIds((prev) => new Set(prev).add(id));
    setAddCewDialogOpen(false);
    resetAddCewForm();
    toast({ title: 'CEW added', description: `${name} is included on this placement (demo).` });
  };

  const handleFinalisePlacement = () => {
    if (placementFinalised) return;
    if (!signedFacSlipName) {
      toast({
        variant: 'destructive',
        title: 'Signed slip required',
        description: 'Upload the signed placement slip before finalising placement.',
      });
      return;
    }
    setPlacementFinalised(true);
    toast({
      title: 'Placement finalised',
      description: `${record.requestId} — facultative inward placement recorded against this risk (demo).`,
    });
  };

  const handleDownloadFacPlacementSlip = () => {
    const slip = [
      'Facultative Placement Slip',
      `Request ID: ${record.requestId}`,
      `Risk ID: ${record.riskId}`,
      `Insured: ${record.insured}`,
      `Product: ${record.product}`,
      `Requested Ceded SI: ${fmtAED(record.requestedCededSI)}`,
      `Premium: ${fmtAED(record.premium)}`,
      `Commission %: ${placement.commissionPercent}%`,
    ].join('\n');
    const blob = new Blob([slip], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `placement-slip-${record.requestId.replace(/[^a-zA-Z0-9-_]/g, '_')}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSavePlacement = () => {
    const now = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    setHistory((prev) => [
      {
        date: now,
        updatedBy: inwardFacPortal(portal)
          ? 'Demo Reinsurer'
          : requesterChatRole === 'insurer'
            ? 'Demo Underwriter'
            : 'Demo Reinsurance Broker',
        summary: `Share ${placement.sharePercent}%, commission ${placement.commissionPercent}%`,
        comment:
          placement.comment.trim() ||
          (inwardFacPortal(portal)
            ? 'Recorded updated facultative line and commission after internal underwriting review.'
            : requesterChatRole === 'insurer'
              ? 'Updated placement terms recorded from underwriting.'
              : 'Updated broker placement terms.'),
      },
      ...prev,
    ]);
    setPlacement((prev) => ({ ...prev, comment: '' }));
    setIsEditingPlacement(false);
  };

  const signedPlacementSlipSection = (
    <section
      aria-labelledby="signed-placement-slip-heading"
      className="rounded-xl border border-primary/30 bg-primary/[0.06] p-4 shadow-sm ring-1 ring-inset ring-primary/10 dark:bg-primary/[0.09] dark:border-primary/40"
    >
      <div className="flex flex-wrap items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"
          aria-hidden
        >
          <Upload className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <header>
            <h3 id="signed-placement-slip-heading" className="text-base font-semibold tracking-tight text-foreground">
              Signed Placement slip
            </h3>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Upload the executed slip (PDF or image) for facultative inward records.
            </p>
          </header>
          <input
            ref={signedFacSlipInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            className="hidden"
            onChange={handleSignedFacSlipChange}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 gap-2 border-primary/45 bg-background hover:bg-primary/10 hover:text-foreground"
              onClick={() => signedFacSlipInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload signed placement slip
            </Button>
            <div className="flex min-h-10 flex-1 items-center rounded-lg border border-dashed border-primary/35 bg-background/95 px-4 py-3 text-sm dark:bg-background/80">
              {signedFacSlipName ? (
                <span className="font-medium text-foreground">
                  Attached: <span className="break-all text-primary">{signedFacSlipName}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">No file attached yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-full overflow-auto bg-slate-50">
      <div className="mx-auto w-full max-w-none space-y-6 px-4 py-6 pb-8">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 shrink-0 text-foreground hover:bg-muted hover:text-foreground"
                onClick={() =>
                  isReinsurerDetailPage
                    ? navigate(
                        backFromReinsurerDetailPath ?? `${referralBase}/${recordId}`,
                        backFromReinsurerDetailPath ? undefined : { state: { record } },
                      )
                    : navigate(dashboardPath)
                }
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold leading-snug tracking-tight text-foreground">
                  {isReinsurerDetailPage
                    ? `Reinsurer detail — ${reinsurerRequestStatuses.find((item) => item.id === selectedReinsurerId)?.name ?? record.reinsurer}`
                    : portal === 'insurer'
                      ? 'Facultative Inwards - request details'
                      : 'Facultative request details'}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">{record.requestId}</p>
              </div>
            </div>
            {portal === 'insurer' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ai-gradient-shimmer h-9 shrink-0 gap-2 lg:ml-auto"
                onClick={() => navigate('/insurer/command-center')}
              >
                <Brain className="h-4 w-4" />
                Immersive Risk Assessment
              </Button>
            ) : null}
          </div>

          <div className="space-y-6 p-4">
            {portal === 'insurer' && (
              <>
                {showReinsurerDetailPanels ? (
                  <FacInwardRequestJourney
                    recordStatus={record.status}
                    placementFinalised={placementFinalised}
                    signedFacSlipName={signedFacSlipName}
                    requestId={record.requestId}
                    submittedDate={record.submittedDate}
                  />
                ) : null}
                <section className="space-y-5 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50 via-white to-white p-5 shadow-sm md:p-6">
                  <div className="space-y-4">

                    {showReinsurerDetailPanels && (
                      <>
                        <Card className="overflow-hidden rounded-lg border border-slate-200 bg-card shadow-sm ring-1 ring-slate-100">
                          <div className="bg-primary px-4 py-5 text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] md:px-5 md:py-6">
                            <div className="mx-auto mb-5 flex max-w-none flex-col gap-4 border-b border-primary-foreground/20 pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                              <div className="min-w-0 space-y-1">
                                <CardTitle className="text-base text-primary-foreground">Summary</CardTitle>
                                <CardDescription className="text-primary-foreground/85">
                                  Identifiers, parties, exposure, and inward context.
                                </CardDescription>
                              </div>
                              <div className="flex shrink-0 sm:pt-0.5 sm:justify-end">
                                {!isReinsurerDetailPage ? (
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-9 gap-1.5 border-0 bg-primary-foreground/15 text-primary-foreground shadow-sm hover:bg-primary-foreground/25 hover:text-primary-foreground"
                                    onClick={() => setInsurerDocumentsDialogOpen(true)}
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    Attached documents
                                  </Button>
                                ) : (
                                  <span className="max-w-xs text-right text-sm text-primary-foreground/80 sm:max-w-none">
                                    Underlying documents per referral.
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mx-auto mb-5 flex max-w-none flex-col gap-3 border-b border-primary-foreground/20 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <div className="flex min-w-0 items-start gap-3">
                                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 text-primary-foreground shadow-sm backdrop-blur-sm">
                                  <ClipboardList className="h-5 w-5 opacity-95" aria-hidden />
                                </span>
                                <div className="min-w-0">
                                  <h3 id="requirement-summary-heading" className="text-base font-semibold tracking-tight">
                                    Requirement summary
                                  </h3>
                                  <p className="mt-1 text-sm leading-relaxed text-primary-foreground/85">
                                    Key limits, retention, ceded line and commission. Enable{' '}
                                    <span className="font-semibold text-primary-foreground">AI Risk suggestion</span> above
                                    for peer/model bands and per-metric signals in Submission details.
                                  </p>
                                </div>
                              </div>
                              <Badge className="h-fit w-fit shrink-0 border-0 bg-primary-foreground/20 px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground/25">
                                Core commercial terms
                              </Badge>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                              {requirementSummary.map(([label, value]) => {
                                const reqInsight = requirementSummaryAiInsight(label);
                                return (
                                  <div
                                    key={label}
                                    className="rounded-xl bg-background/97 p-3 text-foreground shadow-md backdrop-blur-sm dark:bg-card/96"
                                  >
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                      {label}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
                                    {aiRiskSuggestionsEnabled ? (
                                      <>
                                        <div className="mt-2 rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-2.5 py-2 ring-1 ring-inset ring-emerald-200/40 dark:border-emerald-500/30 dark:bg-emerald-950/25 dark:ring-emerald-500/20">
                                          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-100">
                                            Suggested acceptable range
                                          </p>
                                          <p className="mt-1 text-[11px] font-semibold leading-snug text-emerald-950 dark:text-emerald-50">
                                            {reqInsight.acceptableRange}
                                          </p>
                                        </div>
                                        <div className="mt-2 rounded-lg border border-violet-200/60 bg-gradient-to-br from-violet-500/[0.07] via-blue-500/[0.08] to-cyan-500/[0.1] px-3 py-2.5 ring-1 ring-inset ring-violet-200/40 dark:border-violet-500/25 dark:from-violet-500/15 dark:via-blue-500/12 dark:to-cyan-500/15 dark:ring-violet-500/20">
                                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-[10px] font-semibold uppercase tracking-wide ai-gradient-text">
                                              Risk signal
                                            </span>
                                            <span
                                              className={aiRiskScoreBadgeClass(reqInsight.tier)}
                                              title={`${reqInsight.score}/100`}
                                            >
                                              {reqInsight.score}
                                            </span>
                                          </div>
                                          <ul className="space-y-1.5 text-[11px] font-medium leading-snug">
                                            {reqInsight.pointers.map((pt) => (
                                              <li key={pt} className="flex gap-1.5">
                                                <span className="ai-gradient-text shrink-0 font-bold">▸</span>
                                                <span className="ai-gradient-text min-w-0">{pt}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-3">
                              {(() => {
                                let cellIndex = 0;
                                const cells: JSX.Element[] = [];
                                for (const section of insurerRequestOverviewSections) {
                                  cells.push(
                                    <div
                                      key={`h-${section.title}`}
                                      className="border-b border-border bg-slate-100/80 px-4 py-2 md:col-span-3"
                                    >
                                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {section.title}
                                      </p>
                                    </div>,
                                  );
                                  for (const [label, value] of section.rows) {
                                    const i = cellIndex++;
                                    const isLastInRow = (i + 1) % 3 === 0;
                                    const isAltRow = Math.floor(i / 3) % 2 === 0;
                                    cells.push(
                                      <div
                                        key={`${section.title}-${label}`}
                                        className={`border-b border-border px-4 py-3 ${!isLastInRow ? 'md:border-r' : ''} ${isAltRow ? 'bg-muted/30' : 'bg-white'}`}
                                      >
                                        <div className="mb-1 text-xs text-muted-foreground">{label}</div>
                                        <div className="min-w-0 break-all text-sm font-semibold text-foreground">
                                          {label === 'Status' ? (
                                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                              {value}
                                            </Badge>
                                          ) : (
                                            value
                                          )}
                                        </div>
                                      </div>,
                                    );
                                  }
                                  let rem = section.rows.length % 3;
                                  if (rem !== 0) {
                                    rem = 3 - rem;
                                    for (let p = 0; p < rem; p++) {
                                      const i = cellIndex++;
                                      const isLastInRow = (i + 1) % 3 === 0;
                                      const isAltRow = Math.floor(i / 3) % 2 === 0;
                                      cells.push(
                                        <div
                                          key={`${section.title}-pad-${p}`}
                                          className={`hidden border-b border-border md:block ${!isLastInRow ? 'md:border-r' : ''} ${isAltRow ? 'bg-muted/30' : 'bg-white'}`}
                                          aria-hidden
                                        />,
                                      );
                                    }
                                  }
                                }
                                return cells;
                              })()}
                            </div>
                          </CardContent>
                        </Card>

                        <Tabs defaultValue="submission-details" className="w-full">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <TabsList className="flex h-11 w-full max-w-full min-w-0 shrink-0 items-stretch gap-0 overflow-x-auto rounded-xl border border-slate-200/90 bg-slate-100/95 p-1 shadow-inner lg:w-auto lg:min-w-[42rem] lg:overflow-visible">
                              <TabsTrigger
                                value="submission-details"
                                className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-3 py-0 text-center text-xs font-medium leading-none text-muted-foreground shadow-none ring-offset-background transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-foreground sm:text-sm sm:leading-none"
                              >
                                Submission details
                              </TabsTrigger>
                              <TabsTrigger
                                value="facultative-reinsurance"
                                className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-3 py-0 text-center text-xs font-medium leading-none text-muted-foreground shadow-none ring-offset-background transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-foreground sm:text-sm sm:leading-none"
                              >
                                Facultative Reinsurance Actions
                              </TabsTrigger>
                            </TabsList>
                            <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                              <Label htmlFor="ai-risk-suggestions" className="mb-0 text-sm font-medium text-foreground">
                                AI Risk suggestion
                              </Label>
                              <Switch
                                id="ai-risk-suggestions"
                                className="shrink-0 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-600 data-[state=checked]:via-blue-600 data-[state=checked]:to-cyan-500"
                                checked={aiRiskSuggestionsEnabled}
                                onCheckedChange={setAiRiskSuggestionsEnabled}
                              />
                            </div>
                          </div>

                          <TabsContent value="submission-details" className="mt-4 space-y-4 focus-visible:outline-none">
                            <div className="space-y-10">
                              <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-900">Submitted values</h3>
                                {aiRiskSuggestionsEnabled ? (
                                  (() => {
                                    const cumulative = computeSubmissionCumulativeSnapshot();
                                    return (
                                        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50/80 p-4 shadow-sm ring-1 ring-slate-100">
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                                          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                                            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                              Cumulative risk score
                                            </span>
                                            <span
                                              className={cn(
                                                'text-3xl font-bold tabular-nums tracking-tight leading-none',
                                                cumulative.tier === 'green' && 'text-emerald-600',
                                                cumulative.tier === 'amber' && 'text-amber-600',
                                                cumulative.tier === 'red' && 'text-red-600',
                                              )}
                                            >
                                              {cumulative.averageScore}
                                            </span>
                                            <span className="text-sm font-medium text-muted-foreground">/100</span>
                                          </div>
                                          <span className={cn(aiRiskScoreBadgeClass(cumulative.tier), 'shrink-0 self-center')}>
                                            {cumulative.tier === 'green'
                                              ? 'Favourable'
                                              : cumulative.tier === 'amber'
                                                ? 'Watch'
                                                : 'Elevated'}
                                          </span>
                                        </div>
                                        <ul className="mt-3 grid grid-cols-1 gap-3 border-t border-dashed border-border pt-3 text-xs font-medium leading-snug text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
                                          {cumulative.highlights.map((item) => (
                                            <li key={item} className="flex min-w-0 gap-2">
                                              <span className="font-bold shrink-0 text-slate-400">▸</span>
                                              <span className="min-w-0">{item}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    );
                                  })()
                                ) : null}
                                <div className="space-y-4">
                                  {proposalSections.map((section) => (
                                    <div key={section.title} className="overflow-hidden rounded-lg border bg-card">
                                      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                          <FileText className="h-4 w-4" />
                                        </span>
                                        <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3">
                                        {section.fields.map(([label, value], index) => {
                                          const isLastInRow = (index + 1) % 3 === 0;
                                          const isAltRow = Math.floor(index / 3) % 2 === 0;
                                          const isAttachments = section.title === 'Attachments';
                                          return (
                                            <div
                                              key={label}
                                              className={`border-b border-border px-4 py-3 ${!isLastInRow ? 'md:border-r' : ''} ${isAltRow ? 'bg-muted/30' : 'bg-white'}`}
                                            >
                                              <div className="mb-1 text-xs text-muted-foreground">{label}</div>
                                              <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="min-w-0 break-all text-sm font-semibold text-foreground">
                                                  {value}
                                                </div>
                                                {isAttachments ? (
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="shrink-0 gap-1.5"
                                                    onClick={() => openDocumentDemo(String(value), label)}
                                                  >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    View
                                                  </Button>
                                                ) : null}
                                              </div>
                                              {aiRiskSuggestionsEnabled
                                                ? (() => {
                                                    const insight = submittedValueAiRiskInsight(section.title, label);
                                                    return (
                                                      <div className="mt-2 rounded-lg border border-violet-200/60 bg-gradient-to-br from-violet-500/[0.07] via-blue-500/[0.08] to-cyan-500/[0.1] px-3 py-2.5 ring-1 ring-inset ring-violet-200/40 dark:border-violet-500/25 dark:from-violet-500/15 dark:via-blue-500/12 dark:to-cyan-500/15 dark:ring-violet-500/20">
                                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                                          <span className="text-[10px] font-semibold uppercase tracking-wide ai-gradient-text">
                                                            Risk signal
                                                          </span>
                                                          <span
                                                            className={aiRiskScoreBadgeClass(insight.tier)}
                                                            title={`${insight.score}/100`}
                                                          >
                                                            {insight.score}
                                                          </span>
                                                        </div>
                                                        <ul className="space-y-1.5 text-[11px] font-medium leading-snug">
                                                          {insight.pointers.map((pt) => (
                                                            <li key={pt} className="flex gap-1.5">
                                                              <span className="ai-gradient-text shrink-0 font-bold">▸</span>
                                                              <span className="ai-gradient-text min-w-0">{pt}</span>
                                                            </li>
                                                          ))}
                                                        </ul>
                                                      </div>
                                                    );
                                                  })()
                                                : null}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-900">CEWs</h3>
                                <div className="divide-y rounded-lg border bg-card">
                                  {placementCewItems.map((item) => (
                                    <div key={item.id} className="px-4 py-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                        <Badge variant="outline" className="h-fit w-fit shrink-0">
                                          {item.type}
                                        </Badge>
                                      </div>
                                      <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="facultative-reinsurance" className="mt-4 space-y-4 focus-visible:outline-none">
                            <Card className="border-slate-200 shadow-sm ring-1 ring-slate-100">
                              <CardHeader className="border-b bg-slate-50/60">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <CardTitle className="text-base">Facultative reinsurance</CardTitle>
                                    <CardDescription>Placement line, share and premiums.</CardDescription>
                                  </div>
                                  {!isEditingPlacement ? (
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditingPlacement(true)}>
                                      <Pencil className="h-4 w-4" />
                                      Edit Placement
                                    </Button>
                                  ) : (
                                    <Button size="sm" className="gap-2" onClick={handleSavePlacement}>
                                      <Save className="h-4 w-4" />
                                      Save
                                    </Button>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4 p-4">
                                <div className="grid gap-4 md:grid-cols-4">
                                  <div className="rounded-lg border bg-white p-3 shadow-sm">
                                    <Label>Requested Share %</Label>
                                    {isEditingPlacement ? (
                                      <Input
                                        className="mt-2"
                                        value={placement.sharePercent}
                                        onChange={(event) => handleShareChange(event.target.value)}
                                      />
                                    ) : (
                                      <p className="mt-2 text-lg font-bold">{placement.sharePercent}%</p>
                                    )}
                                  </div>
                                  <div className="rounded-lg border bg-white p-3 shadow-sm">
                                    <Label>Broker Placed Risk</Label>
                                    {isEditingPlacement ? (
                                      <Input
                                        className="mt-2"
                                        value={placement.risk}
                                        onChange={(event) => setPlacement((prev) => ({ ...prev, risk: event.target.value }))}
                                      />
                                    ) : (
                                      <p className="mt-2 text-lg font-bold">{fmtAED(Number(placement.risk) || 0)}</p>
                                    )}
                                  </div>
                                  <div className="rounded-lg border bg-white p-3 shadow-sm">
                                    <Label>Premium</Label>
                                    {isEditingPlacement ? (
                                      <Input
                                        className="mt-2"
                                        value={placement.premium}
                                        onChange={(event) =>
                                          setPlacement((prev) => ({ ...prev, premium: event.target.value }))
                                        }
                                      />
                                    ) : (
                                      <p className="mt-2 text-lg font-bold">{fmtAED(Number(placement.premium) || 0)}</p>
                                    )}
                                  </div>
                                  <div className="rounded-lg border bg-white p-3 shadow-sm">
                                    <Label>Commission %</Label>
                                    {isEditingPlacement ? (
                                      <Input
                                        className="mt-2"
                                        value={placement.commissionPercent}
                                        onChange={(event) =>
                                          setPlacement((prev) => ({ ...prev, commissionPercent: event.target.value }))
                                        }
                                      />
                                    ) : (
                                      <p className="mt-2 text-lg font-bold">{placement.commissionPercent}%</p>
                                    )}
                                  </div>
                                </div>

                                {isEditingPlacement && (
                                  <div className="space-y-2">
                                    <Label htmlFor="placement-comment-insurer">Edit comment</Label>
                                    <Input
                                      id="placement-comment-insurer"
                                      value={placement.comment}
                                      onChange={(event) => setPlacement((prev) => ({ ...prev, comment: event.target.value }))}
                                      placeholder="Add a note for your facultative underwriting audit trail"
                                    />
                                  </div>
                                )}

                                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                                  <div className="border-b bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
                                    Edit History
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full min-w-[50rem] text-sm">
                                      <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <tr>
                                          <th className="px-4 py-3">Date</th>
                                          <th className="px-4 py-3">Updated By</th>
                                          <th className="px-4 py-3">Summary</th>
                                          <th className="px-4 py-3">Comment</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y">
                                        {history.map((item) => (
                                          <tr key={`${item.date}-${item.summary}`}>
                                            <td className="px-4 py-3">{item.date}</td>
                                            <td className="px-4 py-3">{item.updatedBy}</td>
                                            <td className="px-4 py-3 font-semibold">{item.summary}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{item.comment}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <Collapsible
                              defaultOpen={false}
                              className="group rounded-lg border border-slate-200 bg-card shadow-sm ring-1 ring-slate-100 data-[state=closed]:overflow-hidden"
                            >
                              <Card className="border-0 shadow-none ring-0">
                                <CollapsibleTrigger asChild>
                                  <CardHeader className="cursor-pointer border-b bg-slate-50/60 hover:bg-muted/30">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0 space-y-1 text-left">
                                        <CardTitle className="text-base">History & timeline</CardTitle>
                                        <CardDescription>Key facultative milestones and events.</CardDescription>
                                      </div>
                                      <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                                    </div>
                                  </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <CardContent className="space-y-3 p-4">
                                    {timeline.map(([title, description, date]) => (
                                      <div key={title} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                          <p className="font-semibold text-slate-900">{title}</p>
                                          <span className="text-xs text-muted-foreground">{date}</span>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                                      </div>
                                    ))}
                                  </CardContent>
                                </CollapsibleContent>
                              </Card>
                            </Collapsible>

                            <Card className="border-slate-200 shadow-sm ring-1 ring-violet-100">
                              <CardHeader className="border-b bg-slate-50/60">
                                <CardTitle className="text-base">Placement actions</CardTitle>
                                <CardDescription>
                                  Confirm which CEWs remain on this facultative placement and attach the countersigned slip.
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-8 p-4">
                                <div className="space-y-3">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <Label className="text-base font-semibold text-slate-900">CEWs on placement</Label>
                                      <p className="mt-1 text-sm text-muted-foreground">
                                        Uncheck any clause, extension, or warranty that should not apply to the signed facultative
                                        placement.
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="shrink-0 gap-1.5"
                                      disabled={placementFinalised}
                                      onClick={() => {
                                        resetAddCewForm();
                                        setAddCewDialogOpen(true);
                                      }}
                                    >
                                      <Plus className="h-4 w-4" />
                                      Add CEW
                                    </Button>
                                  </div>
                                  <div className="divide-y rounded-lg border bg-white shadow-sm">
                                    {placementCewItems.map((item) => (
                                      <label
                                        key={item.id}
                                        htmlFor={`placement-cew-${item.id}`}
                                        className="flex cursor-pointer gap-3 px-4 py-3 hover:bg-muted/40"
                                      >
                                        <Checkbox
                                          id={`placement-cew-${item.id}`}
                                          checked={includedCewIds.has(item.id)}
                                          onCheckedChange={(checked) =>
                                            setIncludedCewIds((prev) => {
                                              const next = new Set(prev);
                                              if (checked === true) next.add(item.id);
                                              else next.delete(item.id);
                                              return next;
                                            })
                                          }
                                          className="mt-1"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                                            <Badge variant="outline" className="h-fit w-fit shrink-0">
                                              {item.type}
                                            </Badge>
                                          </div>
                                          <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {includedCewIds.size} of {placementCewItems.length} selected for binding
                                  </p>
                                </div>

                                {signedPlacementSlipSection}

                                <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="max-w-xl text-sm text-muted-foreground">
                                    {placementFinalised
                                      ? 'This facultative placement has been marked as finalised. Further changes should go through endorsement or a new fac request.'
                                      : 'Finalising records the inward placement with your CEW selections and the attached signed slip.'}
                                  </p>
                                  <Button
                                    type="button"
                                    variant="default"
                                    className="shrink-0 gap-2 sm:min-w-[12rem]"
                                    disabled={placementFinalised}
                                    onClick={handleFinalisePlacement}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    {placementFinalised ? 'Placement finalised' : 'Finalise placement'}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>
                        </Tabs>

                        {!isReinsurerDetailPage ? (
                          <Dialog open={insurerDocumentsDialogOpen} onOpenChange={setInsurerDocumentsDialogOpen}>
                            <DialogContent className="flex max-h-[min(92vh,56rem)] w-[min(96vw,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
                              <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-4 text-left">
                                <DialogTitle>Attached documents</DialogTitle>
                                <DialogDescription className="text-left">
                                  {requestDocuments.length} uploaded files for this facultative inward request.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                                <div className="divide-y divide-border rounded-lg border">
                                  {requestDocuments.map((doc) => (
                                    <div
                                      key={doc.fileName}
                                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                                    >
                                      <div className="flex min-w-0 flex-1 items-start gap-3">
                                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium text-foreground">{doc.title}</span>
                                            <Badge
                                              variant="outline"
                                              className="border-success text-xs font-normal text-success"
                                            >
                                              Uploaded
                                            </Badge>
                                          </div>
                                          <p
                                            className="mt-0.5 truncate text-xs text-muted-foreground"
                                            title={doc.fileName}
                                          >
                                            {doc.fileName}
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0 gap-1"
                                        onClick={() => openDocumentDemo(doc.fileName, doc.title)}
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                        View
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : null}
                      </>
                    )}
                  </div>
                </section>
              </>
            )}
            {portal !== 'insurer' && (
            <>
            {!isReinsurerDetailPage && (
              <>
            <Card>
              <CardHeader className="border-b">
                {inwardFacPortal(portal) ? (
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <CardTitle className="text-base font-semibold tracking-tight">Facultative Request details</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ai-gradient-shimmer h-9 gap-2"
                        onClick={() =>
                          navigate(portal === 'reinsurer' ? '/reinsurer/analytics' : '/insurer/command-center')
                        }
                      >
                        <Brain className="h-4 w-4" />
                        Immersive Risk Assessment
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2"
                        onClick={handleDownloadFacPlacementSlip}
                      >
                        <Download className="h-4 w-4" />
                        Download Placement Slip
                      </Button>
                    </div>
                  </div>
                ) : (
                  <CardTitle>Facultative Request details</CardTitle>
                )}
              </CardHeader>
              <CardContent className="space-y-5 p-4">
                <div className="space-y-4">
                  <div className="rounded-lg border bg-white p-4">
                    <h3 className="text-base font-semibold text-foreground">Upload Request Documents</h3>
                    <div className="mt-4 grid gap-4">
                      <Card className="border-border bg-card shadow-sm ring-1 ring-inset ring-success/20">
                        <CardContent className="p-4 lg:p-5">
                          <div className="flex min-w-0 gap-3 lg:gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10">
                              <CheckCircle className="h-5 w-5 text-success" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-semibold text-foreground lg:text-base">Proposal Form</h4>
                                  <Badge variant="outline" className="border-success text-success">Uploaded</Badge>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0 gap-1.5"
                                  onClick={() => openDocumentDemo('PAR-proposal-form.pdf', 'Proposal Form')}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground lg:text-sm">
                                Main proposal form used to populate the submitted proposal details.
                              </p>
                              <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-foreground lg:text-sm">
                                <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                                <span className="truncate">PAR-proposal-form.pdf</span>
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-5 rounded-lg border bg-white p-4">
                        <h3 className="text-base font-semibold text-foreground">Underwriting Documents</h3>
                        <div className="grid gap-4 lg:gap-5">
                          {requestDocuments.slice(1).map((doc) => (
                            <Card key={`${doc.category}-${doc.fileName}`} className="border-border bg-card shadow-sm ring-1 ring-inset ring-success/20">
                              <CardContent className="p-4 lg:p-5">
                                <div className="flex min-w-0 gap-3 lg:gap-4">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10">
                                    <CheckCircle className="h-5 w-5 text-success" />
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-sm font-semibold text-foreground lg:text-base">{doc.title}</h4>
                                        <Badge variant="outline" className="border-success text-success">Uploaded</Badge>
                                        <Badge variant="outline">{doc.category}</Badge>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0 gap-1.5"
                                        onClick={() => openDocumentDemo(doc.fileName, doc.title)}
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                        View
                                      </Button>
                                    </div>
                                    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-foreground lg:text-sm">
                                      <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                                      <span className="truncate" title={doc.fileName}>{doc.fileName}</span>
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="border-b">
                      <CardTitle>Proposal Form</CardTitle>
                      <p className="text-sm text-muted-foreground">Full proposal template with submitted values.</p>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                      {proposalSections.map((section) => (
                        <Card key={section.title} className="border border-slate-200 bg-white shadow-sm">
                          <CardHeader className="border-b px-4 py-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                <FileText className="h-4 w-4" />
                              </span>
                              {section.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-3">
                              {section.fields.map(([label, value], index) => {
                                const isLastInRow = (index + 1) % 3 === 0;
                                const isAltRow = Math.floor(index / 3) % 2 === 0;
                                const isAttachments = section.title === 'Attachments';
                                return (
                                  <div
                                    key={label}
                                    className={`border-b border-border px-4 py-3 ${!isLastInRow ? 'md:border-r' : ''} ${isAltRow ? 'bg-muted/30' : 'bg-white'}`}
                                  >
                                    <div className="mb-1 text-xs text-muted-foreground">{label}</div>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="min-w-0 break-all text-sm font-semibold text-foreground">{value}</div>
                                      {isAttachments ? (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="shrink-0 gap-1.5"
                                          onClick={() => openDocumentDemo(String(value), label)}
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                          View
                                        </Button>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="border-b px-4 py-3">
                      <CardTitle className="text-sm font-semibold text-slate-900">CEWs</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {placementCewItems.map((item) => (
                          <div key={item.id} className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                              <Badge variant="outline" className="h-fit w-fit shrink-0">{item.type}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="border-b px-4 py-3">
                      <CardTitle className="text-sm font-semibold text-slate-900">Requirement Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                      {requirementSummary.map(([label, value]) => (
                        <div key={label} className="rounded-lg border bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {showReinsurerRequestsList ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Reinsurer Requests & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {reinsurerRequestStatuses.map((request) => {
                  const isSelected = selectedReinsurerId === request.id;

                  return (
                    <div
                      key={request.id}
                      className={`rounded-lg border p-4 transition ${isSelected ? 'border-primary bg-primary/5' : 'bg-white'}`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{request.name}</h3>
                            <Badge variant="outline" className={statusBadgeClass(request.status)}>{request.status}</Badge>
                            {isSelected && (
                              <Badge variant="outline" className="border-primary text-primary">
                                Viewing details
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">Last update: {request.lastUpdate}</p>
                        </div>
                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            navigate(`${referralBase}/${record.id}/reinsurer/${request.id}`, {
                              state: { record },
                            })
                          }
                        >
                          View Details
                        </Button>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg border bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cession %</p>
                          <p className="mt-1 font-semibold text-slate-900">{request.cessionPercent}</p>
                        </div>
                        <div className="rounded-lg border bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Premium Amount</p>
                          <p className="mt-1 font-semibold text-slate-900">{request.premium}</p>
                        </div>
                        <div className="rounded-lg border bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Commission Amount</p>
                          <p className="mt-1 font-semibold text-slate-900">{request.commission}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            ) : null}
              </>
            )}

            {showReinsurerDetailPanels && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>
                  Reinsurer Detail View - {reinsurerRequestStatuses.find((item) => item.id === selectedReinsurerId)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {quoteInfo.map(([label, value], index) => {
                    const isLastInRow = (index + 1) % 3 === 0;
                    const isAltRow = Math.floor(index / 3) % 2 === 0;
                    return (
                      <div
                        key={label}
                        className={`border-b border-border px-4 py-3 ${!isLastInRow ? 'md:border-r' : ''} ${isAltRow ? 'bg-muted/30' : 'bg-white'}`}
                      >
                        <div className="mb-1 text-xs text-muted-foreground">{label}</div>
                        <div className="min-w-0 break-all text-sm font-semibold text-foreground">
                          {label === 'Status' ? (
                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                              {value}
                            </Badge>
                          ) : (
                            value
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            )}

            {showReinsurerDetailPanels && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Risk Information</CardTitle>
                <CardDescription>Ceded sums and premiums for this placement.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {(
                    [
                      ['Product / Cover', record.product],
                      ['Unit', 'Primary Risk'],
                      ['Requested Ceded SI', fmtAED(record.requestedCededSI)],
                      ['Premium', fmtAED(record.premium)],
                      ['Commission %', `${placement.commissionPercent}%`],
                    ] as const
                  ).map(([label, value], index) => {
                    const isLastInRow = (index + 1) % 3 === 0;
                    const isAltRow = Math.floor(index / 3) % 2 === 0;
                    return (
                      <div
                        key={label}
                        className={`border-b border-border px-4 py-3 ${!isLastInRow ? 'md:border-r' : ''} ${isAltRow ? 'bg-muted/30' : 'bg-white'}`}
                      >
                        <div className="mb-1 text-xs text-muted-foreground">{label}</div>
                        <div className="min-w-0 break-all text-sm font-semibold text-foreground">{value}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            )}

            {showReinsurerDetailPanels && (
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Facultative Reinsurance</CardTitle>
                  {!isEditingPlacement ? (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditingPlacement(true)}>
                      <Pencil className="h-4 w-4" />
                      Edit Placement
                    </Button>
                  ) : (
                    <Button size="sm" className="gap-2" onClick={handleSavePlacement}>
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <Label>Requested Share %</Label>
                    {isEditingPlacement ? (
                      <Input className="mt-2" value={placement.sharePercent} onChange={(event) => handleShareChange(event.target.value)} />
                    ) : (
                      <p className="mt-2 text-lg font-bold">{placement.sharePercent}%</p>
                    )}
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <Label>Broker Placed Risk</Label>
                    {isEditingPlacement ? (
                      <Input className="mt-2" value={placement.risk} onChange={(event) => setPlacement((prev) => ({ ...prev, risk: event.target.value }))} />
                    ) : (
                      <p className="mt-2 text-lg font-bold">{fmtAED(Number(placement.risk) || 0)}</p>
                    )}
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <Label>Premium</Label>
                    {isEditingPlacement ? (
                      <Input className="mt-2" value={placement.premium} onChange={(event) => setPlacement((prev) => ({ ...prev, premium: event.target.value }))} />
                    ) : (
                      <p className="mt-2 text-lg font-bold">{fmtAED(Number(placement.premium) || 0)}</p>
                    )}
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <Label>Commission %</Label>
                    {isEditingPlacement ? (
                      <Input className="mt-2" value={placement.commissionPercent} onChange={(event) => setPlacement((prev) => ({ ...prev, commissionPercent: event.target.value }))} />
                    ) : (
                      <p className="mt-2 text-lg font-bold">{placement.commissionPercent}%</p>
                    )}
                  </div>
                </div>

                {isEditingPlacement && (
                  <div className="space-y-2">
                    <Label htmlFor="placement-comment">Edit comment</Label>
                    <Input
                      id="placement-comment"
                      value={placement.comment}
                      onChange={(event) => setPlacement((prev) => ({ ...prev, comment: event.target.value }))}
                      placeholder={
                        inwardFacPortal(portal)
                          ? 'Add a note for your facultative underwriting audit trail'
                          : requesterChatRole === 'insurer'
                            ? 'Add a note for the underwriting placement audit trail'
                            : 'Add a comment for the edit history'
                      }
                    />
                  </div>
                )}

                <div className="rounded-lg border">
                  <div className="border-b bg-slate-50 px-4 py-3 font-semibold">Edit History</div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[50rem] text-sm">
                      <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Updated By</th>
                          <th className="px-4 py-3">Summary</th>
                          <th className="px-4 py-3">Comment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {history.map((item) => (
                          <tr key={`${item.date}-${item.summary}`}>
                            <td className="px-4 py-3">{item.date}</td>
                            <td className="px-4 py-3">{item.updatedBy}</td>
                            <td className="px-4 py-3 font-semibold">{item.summary}</td>
                            <td className="px-4 py-3 text-muted-foreground">{item.comment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {showReinsurerDetailPanels && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>History & Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {timeline.map(([title, description, date]) => (
                  <div key={title} className="rounded-lg border bg-white p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold text-slate-900">{title}</p>
                      <span className="text-xs text-muted-foreground">{date}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            )}

            {showReinsurerDetailPanels && inwardFacPortal(portal) && (
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Placement actions</CardTitle>
                  <CardDescription>
                    Confirm which CEWs remain on this facultative placement and attach the countersigned slip.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 p-4">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Label className="text-base font-semibold text-slate-900">CEWs on placement</Label>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Uncheck any clause, extension, or warranty that should not apply to the signed facultative placement.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5"
                        disabled={placementFinalised}
                        onClick={() => {
                          resetAddCewForm();
                          setAddCewDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add CEW
                      </Button>
                    </div>
                    <div className="divide-y rounded-lg border bg-white">
                      {placementCewItems.map((item) => (
                        <label
                          key={item.id}
                          htmlFor={`placement-cew-${item.id}`}
                          className="flex cursor-pointer gap-3 px-4 py-3 hover:bg-muted/40"
                        >
                          <Checkbox
                            id={`placement-cew-${item.id}`}
                            checked={includedCewIds.has(item.id)}
                            onCheckedChange={(checked) =>
                              setIncludedCewIds((prev) => {
                                const next = new Set(prev);
                                if (checked === true) next.add(item.id);
                                else next.delete(item.id);
                                return next;
                              })
                            }
                            className="mt-1"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                              <Badge variant="outline" className="h-fit w-fit shrink-0">{item.type}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {includedCewIds.size} of {placementCewItems.length} selected for binding
                    </p>
                  </div>

                  {signedPlacementSlipSection}

                  <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xl text-sm text-muted-foreground">
                      {placementFinalised
                        ? 'This facultative placement has been marked as finalised. Further changes should go through endorsement or a new fac request.'
                        : 'Finalising records the inward placement with your CEW selections and the attached signed slip.'}
                    </p>
                    <Button
                      type="button"
                      variant="default"
                      className="shrink-0 gap-2 sm:min-w-[12rem]"
                      disabled={placementFinalised}
                      onClick={handleFinalisePlacement}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {placementFinalised ? 'Placement finalised' : 'Finalise placement'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            </>
            )}
          </div>
        </div>

        <Button
          className="fixed bottom-6 right-6 z-40 gap-2 rounded-full shadow-lg"
          onClick={() => setIsCommunicationOpen(true)}
        >
          <MessageSquare className="h-4 w-4" />
          Reinsurance Chat
        </Button>

        {isCommunicationOpen && (
          <div className="fixed bottom-20 right-6 z-50 w-[24rem] max-w-[calc(100vw-2rem)] rounded-xl border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
              <div>
                <p className="font-semibold">Queries & Communication</p>
                <p className="text-xs text-primary-foreground/80">Facultative placement chat</p>
              </div>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsCommunicationOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3 p-4">
              <div className="rounded-lg bg-slate-100 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <User className="h-4 w-4" />
                  Demo Reinsurer
                </div>
                Please confirm if the{' '}
                {requesterChatRole === 'insurer' ? 'ceding commission' : 'broker commission'} is firm at{' '}
                {placement.commissionPercent}%.
              </div>
              <div className="ml-8 rounded-lg bg-primary/10 p-3 text-sm">
                <div className="mb-1 font-semibold">
                  {requesterChatRole === 'insurer' ? 'Demo Underwriter (Cedent)' : 'Demo Reinsurance Broker'}
                </div>
                {requesterChatRole === 'insurer'
                  ? 'Yes — commission and requested share follow this referral quote and facultative instructions.'
                  : 'Yes, commission and requested share are based on the attached quote form.'}
              </div>
              <div className="flex gap-2 pt-2">
                <Input placeholder="Type a message..." />
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={addCewDialogOpen}
        onOpenChange={(open) => {
          setAddCewDialogOpen(open);
          if (!open) resetAddCewForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add CEW</DialogTitle>
            <DialogDescription>
              Add a clause, extension, or warranty to this facultative placement. It will be included by default until you
              uncheck it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="add-cew-name">Title</Label>
              <Input
                id="add-cew-name"
                value={newCewName}
                onChange={(e) => setNewCewName(e.target.value)}
                placeholder="e.g. Automatic reinstatement"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-cew-type">Type</Label>
              <Select value={newCewType} onValueChange={setNewCewType}>
                <SelectTrigger id="add-cew-type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {CEW_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-cew-detail">Detail</Label>
              <Textarea
                id="add-cew-detail"
                value={newCewDetail}
                onChange={(e) => setNewCewDetail(e.target.value)}
                placeholder="Brief wording or underwriting note"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddCewDialogOpen(false);
                resetAddCewForm();
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAddPlacementCew} disabled={placementFinalised}>
              Add to placement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
