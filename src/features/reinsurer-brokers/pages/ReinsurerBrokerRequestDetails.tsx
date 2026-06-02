import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  Eye,
  FileText,
  Info,
  Loader2,
  Pencil,
  Plus,
  Save,
  Upload,
  Download,
  MessageSquare,
  Send,
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
import { buildFacultativeReinsuranceSlipDocxBlob } from '@/features/referrals/utils/facultativeReinsuranceSlipDocx';
import { facultativeReferrals } from '@/features/reinsurer-brokers/data/mockData';
import { FacInwardRequestJourney } from '@/features/reinsurer-brokers/components/FacInwardRequestJourney';
import {
  ArrangeFacultativeReinsuranceDialog,
  type FacultativeArrangeDraft,
} from '@/features/referrals/components/ArrangeFacultativeReinsuranceDialog';
import { listReinsurers, type Reinsurer } from '@/features/reinsurers/api/reinsurers';
import {
  computeFacInwardJourneyCompleted,
  FAC_INWARD_JOURNEY_STEPS,
  facInwardStepTimestamp,
  formatFacInwardBritishDateTime,
  getFirstIncompleteSlipStepIndex,
} from '@/features/reinsurer-brokers/model/facInwardJourneyShared';

const fmtAED = (value: number) =>
  `${new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(value)} AED`;

/** Party context per journey step — aligns with `FAC_INWARD_JOURNEY_STEPS` order. */
const FAC_SLIP_EXCHANGE_ROLES = [
  'Cedent / broker issued',
  'Reinsurer quoted',
  'Broker circulated placement',
  'Cedent signed & returned',
] as const;

/** Labels for slip-sequence row actions — aligned with `FAC_INWARD_JOURNEY_STEPS` `fileSlug`s. */
function getSlipStepButtonCopy(step: (typeof FAC_INWARD_JOURNEY_STEPS)[number]) {
  switch (step.fileSlug) {
    case 'fac-request-slip':
      return {
        generate: 'Request slip',
        upload: 'Upload request slip',
        action: 'Send request slip',
      };
    case 'quote-slip':
      return {
        generate: 'Quote slip',
        upload: 'Upload quote slip',
        action: 'Send quote slip',
      };
    case 'placement-slip':
      return {
        generate: 'Placement slip',
        upload: 'Upload placement slip',
        action: 'Send placement slip',
      };
    case 'signed-placement-slip':
      return {
        generate: 'Signed slip',
        upload: 'Upload signed slip',
        action: 'Send signed slip',
      };
    default:
      return { generate: 'Slip', upload: 'Upload slip', action: 'Send slip' };
  }
}

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
    premiumAED: 828000,
    commissionAED: 103500,
    premium: fmtAED(828000),
    commission: fmtAED(103500),
    lastUpdate: '07/05/2026, 10:30',
  },
  {
    id: 'falcon-re',
    name: 'Falcon Re',
    status: 'Pending Review',
    cessionPercent: '25%',
    premiumAED: 345000,
    commissionAED: 43125,
    premium: fmtAED(345000),
    commission: fmtAED(43125),
    lastUpdate: '07/05/2026, 10:18',
  },
  {
    id: 'global-re',
    name: 'Global Re',
    status: 'Declined',
    cessionPercent: '15%',
    premiumAED: 207000,
    commissionAED: 25875,
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

type PlacementEditBaseline = {
  sharePercent: string;
  risk: string;
  premium: string;
  commissionPercent: string;
};

type PlacementFieldChange = {
  label: string;
  before: string;
  after: string;
};

type PlacementEditHistoryRow = {
  date: string;
  updatedBy: string;
  summary: string;
  comment: string;
  /** When set, replaces summary for display of previous vs current placement figures. */
  fieldChanges?: readonly PlacementFieldChange[];
};

const placementEditHistoryBrokerInitial: PlacementEditHistoryRow[] = [
  {
    date: '06/05/2026, 15:30:22',
    updatedBy: 'Demo Reinsurance Requester',
    summary: 'Placement slip submitted to reinsurer',
    comment: 'Initial request shared with target reinsurer for capacity confirmation.',
  },
  {
    date: '06/05/2026, 14:48:10',
    updatedBy: 'Demo Reinsurance Requester',
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

/** Shared Edit History table for facultative placement (underwriter + broker layouts). */
function PlacementEditHistoryTable({
  history,
  headerClassName,
  wrapClassName,
}: {
  history: PlacementEditHistoryRow[];
  headerClassName: string;
  wrapClassName: string;
}) {
  return (
    <div className={wrapClassName}>
      <div className={headerClassName}>Edit History</div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Updated By</th>
              <th className="px-4 py-3">Summary</th>
              <th className="min-w-[14rem] px-4 py-3">Previous → current</th>
              <th className="px-4 py-3">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {history.map((item, index) => (
              <tr key={`${item.date}-${item.updatedBy}-${index}`}>
                <td className="px-4 py-3 whitespace-nowrap align-top text-muted-foreground">{item.date}</td>
                <td className="px-4 py-3 align-top">{item.updatedBy}</td>
                <td className="px-4 py-3 align-top font-semibold">{item.summary}</td>
                <td className="px-4 py-3 align-top">
                  {item.fieldChanges && item.fieldChanges.length > 0 ? (
                    <ul className="space-y-2 text-xs leading-snug">
                      {item.fieldChanges.map((ch) => (
                        <li key={ch.label}>
                          <div className="font-medium text-foreground">{ch.label}</div>
                          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 tabular-nums">
                            <span className="text-muted-foreground line-through decoration-muted-foreground/40">
                              {ch.before}
                            </span>
                            <span className="text-muted-foreground" aria-hidden>
                              →
                            </span>
                            <span className="font-semibold text-foreground">{ch.after}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">{item.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReinsurerBrokerRequestDetails({
  portal = 'broker',
  pathOverrides,
  requesterChatRole = 'broker',
  submissionSourceLabel,
  /** Reinsurer-broker referral routes: same shell as insurer fac-in-cases (journey, summary, tabs). */
  embedInwardFacLayout = false,
}: {
  portal?: RequestDetailsPortal;
  pathOverrides?: ReinsurerBrokerPathOverrides;
  /** Outbound bubble in reinsurance chat: broker-placing vs cedent underwriting. */
  requesterChatRole?: 'broker' | 'insurer';
  /** Overrides quote info "Submission Source" (e.g. insurer referral reinsurance page). */
  submissionSourceLabel?: string;
  embedInwardFacLayout?: boolean;
}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { record?: ReferralRecord; returnTo?: string } | null;
  const navigateReturnTo = locationState?.returnTo;
  const defaultedPaths = portalPaths(portal);
  const referralBase = pathOverrides?.referralBase ?? defaultedPaths.referralBase;
  const dashboardPath = pathOverrides?.dashboard ?? defaultedPaths.dashboard;
  const backFromReinsurerDetailPath = pathOverrides?.backFromReinsurerDetail;
  const { recordId, reinsurerId } = useParams<{ recordId: string; reinsurerId?: string }>();
  const record = (locationState?.record
    ?? facultativeReferrals.find((item) => item.id === recordId)
    ?? fallbackRecord);
  const isReinsurerDetailPage = Boolean(reinsurerId);
  /** Insurer / reinsurer / broker referral inward: full fac-in request shell. */
  const showInwardFacShell = inwardFacPortal(portal) || embedInwardFacLayout;
  /** Broker-only reinsurer line picker (list route is never embed inward). */
  const showReinsurerRequestsList = portal === 'broker' && !isReinsurerDetailPage;
  /** Detail panels / journey: per-reinsurer or insurer/reinsurer inward portals (not embed on list-only route). */
  const showReinsurerDetailPanels = isReinsurerDetailPage || inwardFacPortal(portal);
  /** Broker referral inward: CEWs on placement are display-only (matches controlled placement handoff). */
  const brokerReferralPlacementCewReadOnly = embedInwardFacLayout;
  /** Broker placing outward fac to reinsurers: same layout shell as inward demo, without AI / immersive header. */
  const isBrokerFacOutwardDetail = portal === 'broker' && embedInwardFacLayout && isReinsurerDetailPage;
  /** Show “Attached documents” on summary header (inward list + broker outward journey detail). Reinsurer line detail otherwise hides it. */
  const showAttachedDocumentsInSummary = !isReinsurerDetailPage || isBrokerFacOutwardDetail;
  /** Facultative inward request details: insurer/reinsurer fac-in pages + insurer referral fac line (not broker outward placement or broker referral list). */
  const showFacInwardReinsuranceChat =
    (inwardFacPortal(portal) && showReinsurerDetailPanels) ||
    (Boolean(pathOverrides) && embedInwardFacLayout && isReinsurerDetailPage);

  const [insurerDocumentsDialogOpen, setInsurerDocumentsDialogOpen] = useState(false);
  const [facSlipDocDownloading, setFacSlipDocDownloading] = useState(false);
  const [aiRiskSuggestionsEnabled, setAiRiskSuggestionsEnabled] = useState(false);
  const [brokerArrangeFacDraft, setBrokerArrangeFacDraft] = useState<FacultativeArrangeDraft | null>(null);
  const [brokerFacReinsurers, setBrokerFacReinsurers] = useState<Reinsurer[]>([]);
  const [reinsuranceChatOpen, setReinsuranceChatOpen] = useState(false);

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
  /** Demo: user-attached file name per journey step (earlier steps); signed step uses `signedFacSlipName` when set. */
  const [slipUploadByStep, setSlipUploadByStep] = useState<Record<number, string>>({});
  /** Demo: system draft filename per step (download slip button). */
  const [generatedSlipByStep, setGeneratedSlipByStep] = useState<Record<number, string>>({});
  const slipUploadStepRef = useRef<number | null>(null);
  const slipFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listReinsurers({ limit: 200, status: 'ACTIVE' })
      .then((res) => setBrokerFacReinsurers(res.data ?? []))
      .catch(() => {});
  }, []);

  const facJourneyCompleted = useMemo(
    () => computeFacInwardJourneyCompleted(record.status, placementFinalised, signedFacSlipName),
    [record.status, placementFinalised, signedFacSlipName],
  );

  /** Broker referral list: aggregates across reinsurer lines (excludes declined shares for ceded SI). */
  const brokerReferralOverviewMetrics = useMemo(() => {
    const parseCessionPct = (value: string) => {
      const n = Number(String(value).replace(/%/g, ''));
      return Number.isFinite(n) ? n / 100 : 0;
    };
    let cededSi = 0;
    let commissionSum = 0;
    for (const line of reinsurerRequestStatuses) {
      if (line.status === 'Declined') continue;
      cededSi += record.requestedCededSI * parseCessionPct(line.cessionPercent);
      commissionSum += line.commissionAED;
    }
    const cededSiRounded = Math.round(cededSi);
    return {
      requestedCessionSi: record.requestedCededSI,
      cededSi: cededSiRounded,
      cededSiYetToBePlaced: Math.max(0, record.requestedCededSI - cededSiRounded),
      premium: record.premium,
      commission: commissionSum,
    };
  }, [record.requestedCededSI, record.premium, reinsurerRequestStatuses]);

  const brokerFacArrangeRetentionAvailable = useMemo(
    () =>
      brokerReferralOverviewMetrics.cededSiYetToBePlaced > 0
        ? brokerReferralOverviewMetrics.cededSiYetToBePlaced
        : record.requestedCededSI,
    [brokerReferralOverviewMetrics.cededSiYetToBePlaced, record.requestedCededSI],
  );

  const [selectedReinsurerId] = useState(reinsurerId ?? 'demo-reinsurer');
  const [isEditingPlacement, setIsEditingPlacement] = useState(false);
  const [placement, setPlacement] = useState({
    sharePercent: '60',
    risk: String(Math.round(record.requestedCededSI * 0.6)),
    premium: String(Math.round(record.premium * 0.6)),
    commissionPercent: '12.5',
    comment: '',
  });
  const placementEditBaselineRef = useRef<PlacementEditBaseline | null>(null);
  const [history, setHistory] = useState<PlacementEditHistoryRow[]>(() => {
    if (isBrokerFacOutwardDetail) return placementEditHistoryBrokerInitial;
    if (inwardFacPortal(portal) || embedInwardFacLayout) return placementEditHistoryReinsurerInitial;
    if (requesterChatRole === 'insurer') return placementEditHistoryInsurerReferrerInitial;
    return placementEditHistoryBrokerInitial;
  });

  const quoteInfo = [
    ['Request ID', record.requestId],
    ['Risk ID', record.riskId],
    ['Insured', record.insured],
    ['Product', record.product],
    ['Submission Source', submissionSourceLabel ?? 'Reinsurance Requester Portal'],
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
        ['Submission Source', submissionSourceLabel ?? 'Reinsurance Requester Portal'],
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

  const timeline = isBrokerFacOutwardDetail
    ? timelineBrokerPerspective
    : inwardFacPortal(portal) || embedInwardFacLayout
      ? timelineReinsurerPerspective
      : requesterChatRole === 'insurer'
        ? timelineInsurerRequesterPerspective
        : timelineBrokerPerspective;

  useEffect(() => {
    setHistory(() => {
      if (isBrokerFacOutwardDetail) return placementEditHistoryBrokerInitial;
      if (inwardFacPortal(portal) || embedInwardFacLayout) return placementEditHistoryReinsurerInitial;
      if (requesterChatRole === 'insurer') return placementEditHistoryInsurerReferrerInitial;
      return placementEditHistoryBrokerInitial;
    });
  }, [portal, record.id, reinsurerId, requesterChatRole, embedInwardFacLayout, isBrokerFacOutwardDetail]);

  useEffect(() => {
    setPlacement({
      sharePercent: '60',
      risk: String(Math.round(record.requestedCededSI * 0.6)),
      premium: String(Math.round(record.premium * 0.6)),
      commissionPercent: '12.5',
      comment: '',
    });
    placementEditBaselineRef.current = null;
    setIsEditingPlacement(false);
  }, [record.id, record.requestedCededSI, record.premium]);

  const facultativeSlipDownloadContext = useMemo(
    () => ({
      referral: undefined,
      referralId: record.requestId,
      productName: record.product,
      sumInsured: 78_000_000,
      cededSumInsured: (() => {
        let ceded = record.requestedCededSI;
        if (isBrokerFacOutwardDetail) {
          const pr = Number(placement.risk);
          if (Number.isFinite(pr) && pr > 0) ceded = Math.round(pr);
        }
        return ceded;
      })(),
      grossPremium: (() => {
        let prem = record.premium;
        if (isBrokerFacOutwardDetail) {
          const pp = Number(placement.premium);
          if (Number.isFinite(pp) && pp > 0) prem = Math.round(pp);
        }
        return prem;
      })(),
      currency: 'AED',
      selectedParties: [
        {
          kind: 'reinsurer' as const,
          id: selectedReinsurerId,
          name:
            reinsurerRequestStatuses.find((item) => item.id === selectedReinsurerId)?.name ?? record.reinsurer,
        },
      ],
      insuredDisplayName: record.insured,
      locationDisplayName: record.insured,
      periodStartIso: `${record.submittedDate}T12:00:00`,
    }),
    [
      record.requestId,
      record.product,
      record.requestedCededSI,
      record.premium,
      record.insured,
      record.submittedDate,
      record.reinsurer,
      selectedReinsurerId,
      isBrokerFacOutwardDetail,
      placement.risk,
      placement.premium,
    ],
  );

  const handleDownloadFacRequestSlipDocx = useCallback(async () => {
    setFacSlipDocDownloading(true);
    try {
      const blob = await buildFacultativeReinsuranceSlipDocxBlob(facultativeSlipDownloadContext);
      const safeRef = record.requestId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Facultative_Reinsurance_Slip_${safeRef}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Download started', description: 'Facultative request slip (.docx).' });
    } catch {
      toast({ title: 'Download failed', description: 'Could not generate the slip.', variant: 'destructive' });
    } finally {
      setFacSlipDocDownloading(false);
    }
  }, [facultativeSlipDownloadContext, record.requestId, toast]);

  useEffect(() => {
    setPlacementCewItems(DEFAULT_PLACEMENT_CEWS.map((item) => ({ ...item })));
    setIncludedCewIds(new Set(DEFAULT_PLACEMENT_CEWS.map((item) => item.id)));
    setGeneratedSlipByStep({});
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

  const signedPlacementStepIndex = FAC_INWARD_JOURNEY_STEPS.length - 1;

  const openSlipStepUpload = (stepIndex: number) => {
    slipUploadStepRef.current = stepIndex;
    slipFileInputRef.current?.click();
  };

  const handleSlipSequenceFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const stepIndex = slipUploadStepRef.current;
    event.target.value = '';
    slipUploadStepRef.current = null;
    if (!file || stepIndex === null) return;

    if (stepIndex === signedPlacementStepIndex) {
      setSignedFacSlipName(file.name);
    } else {
      setSlipUploadByStep((prev) => ({ ...prev, [stepIndex]: file.name }));
    }
    toast({
      title: FAC_INWARD_JOURNEY_STEPS[stepIndex]?.label ?? 'Slip',
      description: `${file.name} attached (demo).`,
    });
  };

  const handleGenerateSlipForStep = (stepIndex: number) => {
    const step = FAC_INWARD_JOURNEY_STEPS[stepIndex];
    const safeReq = record.requestId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const name = `${step.fileSlug}-generated-${safeReq}.pdf`;
    setGeneratedSlipByStep((prev) => ({ ...prev, [stepIndex]: name }));
    toast({
      title: 'Slip draft ready',
      description: `${step.label}: ${name} (demo — production would create the document).`,
    });
  };

  const handleSlipStepWorkflowAction = (stepIndex: number) => {
    const step = FAC_INWARD_JOURNEY_STEPS[stepIndex];
    const copy = getSlipStepButtonCopy(step);
    const safeReq = record.requestId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const demoFallback = `${step.fileSlug}-${safeReq}.pdf`;
    const displayName =
      stepIndex === signedPlacementStepIndex && signedFacSlipName
        ? signedFacSlipName
        : slipUploadByStep[stepIndex] ??
          generatedSlipByStep[stepIndex] ??
          (facJourneyCompleted[stepIndex] ? demoFallback : null);
    if (displayName) {
      openDocumentDemo(displayName, copy.action);
      return;
    }
    toast({
      title: copy.action,
      description: `Add a slip for ${step.label} using download or upload, then run this action (demo).`,
    });
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
    if (!facJourneyCompleted[2]) {
      toast({
        variant: 'destructive',
        title: 'Placement slip not in channel',
        description:
          'The placement slip must be shared in the workflow before you can finalise this inward placement.',
      });
      return;
    }
    setPlacementFinalised(true);
    toast({
      title: 'Placement finalised',
      description: `${record.requestId} — facultative inward placement recorded against this risk (demo).`,
    });
  };

  const beginPlacementEdit = () => {
    placementEditBaselineRef.current = {
      sharePercent: placement.sharePercent,
      risk: placement.risk,
      premium: placement.premium,
      commissionPercent: placement.commissionPercent,
    };
    setIsEditingPlacement(true);
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
    const baseline = placementEditBaselineRef.current;
    placementEditBaselineRef.current = null;

    const fieldChanges: PlacementFieldChange[] = [];
    if (baseline) {
      if (baseline.sharePercent !== placement.sharePercent) {
        fieldChanges.push({
          label: 'Requested share %',
          before: `${baseline.sharePercent}%`,
          after: `${placement.sharePercent}%`,
        });
      }
      if (baseline.risk !== placement.risk) {
        fieldChanges.push({
          label: inwardFacPortal(portal) ? 'Placed risk (ceded line)' : 'Broker placed risk',
          before: fmtAED(Number(baseline.risk) || 0),
          after: fmtAED(Number(placement.risk) || 0),
        });
      }
      if (baseline.premium !== placement.premium) {
        fieldChanges.push({
          label: 'Premium',
          before: fmtAED(Number(baseline.premium) || 0),
          after: fmtAED(Number(placement.premium) || 0),
        });
      }
      if (baseline.commissionPercent !== placement.commissionPercent) {
        fieldChanges.push({
          label: 'Commission %',
          before: `${baseline.commissionPercent}%`,
          after: `${placement.commissionPercent}%`,
        });
      }
    }

    const defaultComment = inwardFacPortal(portal)
      ? 'Recorded updated facultative line and commission after internal underwriting review.'
      : requesterChatRole === 'insurer'
        ? 'Updated placement terms recorded from underwriting.'
        : 'Updated broker placement terms.';

    const summary =
      fieldChanges.length > 0
        ? `Placement updated · ${fieldChanges.length} figure${fieldChanges.length === 1 ? '' : 's'} changed`
        : 'Placement saved · no figure changes';

    setHistory((prev) => [
      {
        date: now,
        updatedBy: inwardFacPortal(portal)
          ? 'Demo Reinsurer'
          : requesterChatRole === 'insurer'
            ? 'Demo Underwriter'
            : 'Demo Reinsurance Requester',
        summary,
        comment: placement.comment.trim() || defaultComment,
        fieldChanges: fieldChanges.length > 0 ? fieldChanges : undefined,
      },
      ...prev,
    ]);
    setPlacement((prev) => ({ ...prev, comment: '' }));
    setIsEditingPlacement(false);
  };

  const firstIncompleteSlipStepIndex = getFirstIncompleteSlipStepIndex(facJourneyCompleted);

  const slipExchangeSection = (
    <section
      aria-labelledby="slip-exchange-heading"
      className="rounded-xl border border-border/80 bg-muted/20 p-4 shadow-sm ring-1 ring-inset ring-border/30"
    >
      <input
        ref={slipFileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        className="hidden"
        onChange={handleSlipSequenceFileChange}
      />
      <div className="flex flex-wrap items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
          aria-hidden
        >
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <header>
            <h3 id="slip-exchange-heading" className="text-base font-semibold tracking-tight text-foreground">
              Slip document sequence
            </h3>
          </header>
          <ol className="space-y-2">
            {FAC_INWARD_JOURNEY_STEPS.map((step, index) => {
              const done = facJourneyCompleted[index];
              const at = done ? facInwardStepTimestamp(record.submittedDate, index) : null;
              const safeReq = record.requestId.replace(/[^a-zA-Z0-9-_]/g, '_');
              const demoFileName = `${step.fileSlug}-${safeReq}.pdf`;
              const party = FAC_SLIP_EXCHANGE_ROLES[index] ?? '—';
              const localName = slipUploadByStep[index];
              const generatedName = generatedSlipByStep[index];
              const displayName =
                index === signedPlacementStepIndex && signedFacSlipName
                  ? signedFacSlipName
                  : localName ?? generatedName ?? (done ? demoFileName : null);
              const isActiveStep = firstIncompleteSlipStepIndex === index;
              const copy = getSlipStepButtonCopy(step);

              return (
                <li
                  key={step.label}
                  className={cn(
                    'grid grid-cols-1 items-start gap-x-4 gap-y-2.5 rounded-lg border px-3 py-2.5 transition-colors',
                    'lg:grid-cols-[auto_minmax(0,1fr)_minmax(18rem,36rem)]',
                    done
                      ? 'border-border/50 bg-muted/45 text-muted-foreground shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]'
                      : isActiveStep
                        ? 'border-primary/35 bg-background/90 text-muted-foreground/90 ring-1 ring-inset ring-primary/15'
                        : 'border-dashed border-muted-foreground/25 bg-background/70 text-muted-foreground/85',
                  )}
                >
                  <div className="mt-0.5 shrink-0" aria-hidden>
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground/65" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/35" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          done ? 'text-foreground/70' : 'text-muted-foreground',
                        )}
                      >
                        {step.label}
                      </p>
                      {at ? (
                        <time
                          className="text-[11px] tabular-nums text-muted-foreground/80"
                          dateTime={at.toISOString()}
                        >
                          {formatFacInwardBritishDateTime(at)}
                        </time>
                      ) : (
                        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground/90">{party}</p>
                    {displayName ? (
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground/75">{displayName}</p>
                    ) : (
                      <p className="mt-1 text-[11px] italic text-muted-foreground/65">
                        Not yet recorded on this placement
                      </p>
                    )}
                  </div>
                  <div className="min-w-0 w-full lg:max-w-none">
                    <div
                      className="grid w-full gap-1.5"
                      style={{
                        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)',
                      }}
                    >
                      <Button
                        type="button"
                        variant="secondary"
                        className={cn(
                          'flex !h-auto min-h-0 w-full min-w-0 flex-row items-center justify-center gap-1 !px-1.5 !py-1.5 text-[11px] font-medium leading-tight',
                          '!whitespace-normal text-balance shadow-sm sm:text-xs sm:leading-snug [&_svg]:!h-3.5 [&_svg]:!w-3.5',
                        )}
                        onClick={() => handleGenerateSlipForStep(index)}
                      >
                        <Download className="h-3.5 w-3.5 shrink-0 self-center" aria-hidden />
                        <span className="min-w-0 break-words text-center">{copy.generate}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'flex !h-auto min-h-0 w-full min-w-0 flex-row items-center justify-center gap-1 !px-1.5 !py-1.5 text-[11px] font-medium leading-tight',
                          '!whitespace-normal text-balance shadow-sm sm:text-xs sm:leading-snug [&_svg]:!h-3.5 [&_svg]:!w-3.5',
                          isActiveStep && firstIncompleteSlipStepIndex !== -1 && 'border-primary/50 ring-1 ring-primary/20',
                        )}
                        onClick={() => openSlipStepUpload(index)}
                      >
                        <Upload className="h-3.5 w-3.5 shrink-0 self-center" aria-hidden />
                        <span className="min-w-0 break-words text-center">{copy.upload}</span>
                      </Button>
                      <Button
                        type="button"
                        className={cn(
                          'flex !h-auto min-h-0 w-full min-w-0 flex-row items-center justify-center gap-1 !px-1.5 !py-1.5 text-[11px] font-medium leading-tight',
                          '!whitespace-normal text-balance shadow-sm sm:text-xs sm:leading-snug [&_svg]:!h-3.5 [&_svg]:!w-3.5',
                        )}
                        onClick={() => handleSlipStepWorkflowAction(index)}
                      >
                        <Send className="h-3.5 w-3.5 shrink-0 self-center" aria-hidden />
                        <span className="min-w-0 break-words text-center">{copy.action}</span>
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
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
                onClick={() => {
                  if (isReinsurerDetailPage) {
                    navigate(
                      backFromReinsurerDetailPath ?? `${referralBase}/${recordId}`,
                      backFromReinsurerDetailPath ? undefined : { state: { record } },
                    );
                    return;
                  }
                  if (portal === 'reinsurer') {
                    navigate(dashboardPath);
                    return;
                  }
                  if (navigateReturnTo) {
                    navigate(navigateReturnTo);
                    return;
                  }
                  navigate(dashboardPath);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold leading-snug tracking-tight text-foreground">
                  {isReinsurerDetailPage
                    ? `Reinsurer detail — ${reinsurerRequestStatuses.find((item) => item.id === selectedReinsurerId)?.name ?? record.reinsurer}`
                    : showInwardFacShell
                      ? portal === 'reinsurer'
                        ? 'Facultative slips – request details'
                        : 'Facultative Inwards - request details'
                      : 'Facultative request details'}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">{record.requestId}</p>
              </div>
            </div>
            {showInwardFacShell && !isBrokerFacOutwardDetail ? (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:ml-auto">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor="ai-risk-suggestions" className="mb-0 text-sm font-medium text-foreground">
                    AI Risk suggestion
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-label="About AI Risk suggestions"
                      >
                        <Info className="h-4 w-4" aria-hidden />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-sm text-xs leading-relaxed">
                      AI Risk suggestions are indicative and illustrative only. They are not underwriting advice, a
                      commitment to terms, or a substitute for your own judgment, pricing models, and internal guidelines.
                      Treat all scores and ranges as suggestive signals, not definitive decisions.
                    </TooltipContent>
                  </Tooltip>
                  <Switch
                    id="ai-risk-suggestions"
                    className="shrink-0 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-600 data-[state=checked]:via-blue-600 data-[state=checked]:to-cyan-500"
                    checked={aiRiskSuggestionsEnabled}
                    onCheckedChange={setAiRiskSuggestionsEnabled}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ai-gradient-shimmer h-9 shrink-0 gap-2"
                  onClick={() =>
                    navigate(
                      portal === 'reinsurer'
                        ? '/reinsurer/analytics'
                        : embedInwardFacLayout
                          ? '/reinsurer-broker/dashboard'
                          : '/insurer/command-center',
                    )
                  }
                >
                  <Brain className="h-4 w-4" />
                  Immersive Risk Assessment
                </Button>
              </div>
            ) : showReinsurerRequestsList && !pathOverrides ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 shrink-0 lg:ml-auto"
                onClick={() => {
                  setBrokerArrangeFacDraft({
                    id: `fac-${Date.now()}`,
                    cededSumInsured: 0,
                    rows: [
                      {
                        id: `new-${Date.now()}`,
                        reinsurerId: '',
                        name: '',
                        sharePercent: 0,
                        commissionPercent: 0,
                      },
                    ],
                    isNew: true,
                  });
                }}
              >
                <Plus className="h-4 w-4" />
                Need Facultative
              </Button>
            ) : null}
          </div>

          <div className="space-y-6 p-4">
            {showInwardFacShell && (
              <>
                {showReinsurerDetailPanels ? (
                  <FacInwardRequestJourney
                    recordStatus={record.status}
                    placementFinalised={placementFinalised}
                    signedFacSlipName={signedFacSlipName}
                    requestId={record.requestId}
                    submittedDate={record.submittedDate}
                    title={isBrokerFacOutwardDetail ? 'Facultative Outwards journey' : undefined}
                  />
                ) : null}
                <section className="space-y-5 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50 via-white to-white p-5 shadow-sm md:p-6">
                  <div className="space-y-4">

                    {showReinsurerDetailPanels && (
                      <>
                        <Card className="overflow-hidden rounded-lg border border-slate-200 bg-card shadow-sm ring-1 ring-slate-100">
                          <div className="border-b border-border bg-muted/30 px-4 py-5 md:px-5 md:py-6">
                            <div className="mx-auto flex max-w-none flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                              <div className="min-w-0 space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  Summary
                                </p>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                  Identifiers, parties, exposure, and inward context.
                                </p>
                              </div>
                              {showAttachedDocumentsInSummary ? (
                                <div className="flex shrink-0 sm:pt-0.5 sm:justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 gap-1.5 border border-border/80 bg-background/80 text-foreground shadow-none hover:bg-muted"
                                    onClick={() => setInsurerDocumentsDialogOpen(true)}
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    Attached documents
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="bg-primary px-4 py-5 text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] md:px-5 md:py-6">
                            <div className="mx-auto mb-5 flex max-w-none flex-col gap-3 border-b border-primary-foreground/20 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <div className="flex min-w-0 items-start gap-3">
                                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 text-primary-foreground shadow-sm backdrop-blur-sm">
                                  <ClipboardList className="h-5 w-5 opacity-95" aria-hidden />
                                </span>
                                <div className="min-w-0">
                                  <h3
                                    id="requirement-summary-heading"
                                    className="text-xl font-bold tracking-tight text-primary-foreground"
                                  >
                                    Requirement summary
                                  </h3>
                                </div>
                              </div>
                              <Badge className="h-fit w-fit shrink-0 border-0 bg-primary-foreground/20 px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground/25">
                                Core commercial terms
                              </Badge>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              {requirementSummary.map(([label, value]) => {
                                const reqInsight = requirementSummaryAiInsight(label);
                                return (
                                  <div
                                    key={label}
                                    className="rounded-xl border border-white/20 bg-white p-3 shadow-md dark:border-white/10 dark:bg-zinc-950"
                                  >
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400">
                                      {label}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-zinc-50">{value}</p>
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
                                    <Button variant="outline" size="sm" className="gap-2" onClick={beginPlacementEdit}>
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
                                      placeholder={
                                        isBrokerFacOutwardDetail
                                          ? 'Add a comment for the edit history'
                                          : 'Add a note for your facultative underwriting audit trail'
                                      }
                                    />
                                  </div>
                                )}

                                <PlacementEditHistoryTable
                                  history={history}
                                  wrapClassName="overflow-hidden rounded-lg border bg-white shadow-sm"
                                  headerClassName="border-b bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900"
                                />
                              </CardContent>
                            </Card>

                            <Collapsible
                              defaultOpen={isBrokerFacOutwardDetail}
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
                                        {brokerReferralPlacementCewReadOnly
                                          ? 'Clauses, extensions, and warranties on this placement are fixed for broker review.'
                                          : 'Uncheck any clause, extension, or warranty that should not apply to the signed facultative placement.'}
                                      </p>
                                    </div>
                                    {!brokerReferralPlacementCewReadOnly ? (
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
                                    ) : null}
                                  </div>
                                  <div
                                    className={cn(
                                      'divide-y rounded-lg border bg-white shadow-sm',
                                      brokerReferralPlacementCewReadOnly && 'bg-muted/20',
                                    )}
                                  >
                                    {placementCewItems.map((item) => (
                                      <label
                                        key={item.id}
                                        htmlFor={`placement-cew-${item.id}`}
                                        className={cn(
                                          'flex gap-3 px-4 py-3',
                                          brokerReferralPlacementCewReadOnly
                                            ? 'cursor-not-allowed opacity-80'
                                            : 'cursor-pointer hover:bg-muted/40',
                                        )}
                                      >
                                        <Checkbox
                                          id={`placement-cew-${item.id}`}
                                          checked={includedCewIds.has(item.id)}
                                          disabled={brokerReferralPlacementCewReadOnly || placementFinalised}
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

                                {slipExchangeSection}

                                {!brokerReferralPlacementCewReadOnly ? (
                                  <div
                                    className={cn(
                                      'flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center',
                                      placementFinalised ? 'sm:justify-between' : 'sm:justify-end',
                                    )}
                                  >
                                    {placementFinalised ? (
                                      <p className="max-w-xl text-sm text-muted-foreground">
                                        This facultative placement has been marked as finalised. Further changes should go
                                        through endorsement or a new fac request.
                                      </p>
                                    ) : null}
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
                                ) : null}
                              </CardContent>
                            </Card>
                          </TabsContent>
                        </Tabs>

                        {showAttachedDocumentsInSummary ? (
                          <Dialog open={insurerDocumentsDialogOpen} onOpenChange={setInsurerDocumentsDialogOpen}>
                            <DialogContent className="flex max-h-[min(92vh,56rem)] w-[min(96vw,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
                              <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-4 text-left">
                                <DialogTitle>Attached documents</DialogTitle>
                                <DialogDescription className="text-left">
                                  {requestDocuments.length + 1} files for this facultative request
                                  {isBrokerFacOutwardDetail ? ' (outward placement journey)' : ''}.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                                <div className="divide-y divide-border rounded-lg border">
                                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-muted/20">
                                    <div className="flex min-w-0 flex-1 items-start gap-3">
                                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-sm font-medium text-foreground">
                                            Facultative request slip
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className="border-primary/40 text-xs font-normal text-primary"
                                          >
                                            Generated
                                          </Badge>
                                        </div>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                          Word document — same template as Facultative New outreach (referral + line
                                          terms).
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="shrink-0 gap-1"
                                      disabled={facSlipDocDownloading}
                                      onClick={() => void handleDownloadFacRequestSlipDocx()}
                                    >
                                      {facSlipDocDownloading ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Download className="h-3.5 w-3.5" />
                                      )}
                                      Download
                                    </Button>
                                  </div>
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
            {portal === 'broker' && (
            <>
            {showReinsurerRequestsList ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {(
                  [
                    ['Requested cession SI', fmtAED(brokerReferralOverviewMetrics.requestedCessionSi), 'Sum insured requested for facultative cession'],
                    ['Ceded SI (placed)', fmtAED(brokerReferralOverviewMetrics.cededSi), 'Share allocated across active lines (excl. declined)'],
                    [
                      'Ceded SI (Yet to be placed)',
                      fmtAED(brokerReferralOverviewMetrics.cededSiYetToBePlaced),
                      'Remaining requested SI not yet allocated to reinsurer lines',
                    ],
                    ['Premium', fmtAED(brokerReferralOverviewMetrics.premium), 'Gross premium on this facultative referral'],
                    ['Commission', fmtAED(brokerReferralOverviewMetrics.commission), 'Aggregate brokerage commission on lines'],
                  ] as const
                ).map(([label, value, hint]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100"
                    title={hint}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-2 text-lg font-bold tabular-nums text-slate-900 sm:text-xl">{value}</p>
                  </div>
                ))}
              </div>
            <Card className="border-blue-200/80 bg-blue-50/30 shadow-sm ring-1 ring-blue-100">
              <CardHeader className="border-b border-blue-100/80 pb-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-semibold text-blue-950">Facultative outbound</CardTitle>
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs text-amber-800">
                      Facultative
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-muted-foreground">Ceded SI (requested)</span>
                    <span className="font-semibold tabular-nums text-slate-900">{fmtAED(record.requestedCededSI)}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-muted-foreground">Gross premium (referral)</span>
                    <span className="font-semibold tabular-nums text-slate-900">{fmtAED(record.premium)}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">Reinsurer panel</p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    <table className="w-full min-w-[52rem] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/90 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <th className="px-3 py-2.5 whitespace-nowrap">Request ID</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Risk ID</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Target reinsurer</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Status</th>
                          <th className="px-3 py-2.5 text-right whitespace-nowrap">Requested ceded SI</th>
                          <th className="px-3 py-2.5 text-right whitespace-nowrap">Premium</th>
                          <th className="px-3 py-2.5 text-right whitespace-nowrap w-[1%]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reinsurerRequestStatuses.map((request) => {
                          const lineCessionFrac =
                            Number(String(request.cessionPercent).replace(/%/g, '')) / 100 || 0;
                          const lineRequestedCessionSi = Math.round(record.requestedCededSI * lineCessionFrac);

                          return (
                            <tr key={request.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-3 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                                {record.requestId}
                              </td>
                              <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{record.riskId}</td>
                              <td className="px-3 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                                {request.name}
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <Badge variant="outline" className={statusBadgeClass(request.status)}>
                                  {request.status}
                                </Badge>
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                                {fmtAED(lineRequestedCessionSi)}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                                {request.premium}
                              </td>
                              <td className="px-3 py-2.5 text-right whitespace-nowrap align-middle">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 whitespace-nowrap"
                                  onClick={() =>
                                    navigate(`${referralBase}/${record.id}/reinsurer/${request.id}`, {
                                      state: navigateReturnTo
                                        ? { record, returnTo: navigateReturnTo }
                                        : { record },
                                    })
                                  }
                                >
                                  View details
                                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-200 bg-slate-50/60 font-semibold text-slate-900">
                          <td className="px-3 py-2.5" colSpan={4}>
                            Total
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                            {fmtAED(
                              reinsurerRequestStatuses.reduce((sum, rq) => {
                                const f =
                                  Number(String(rq.cessionPercent).replace(/%/g, '')) / 100 || 0;
                                return sum + Math.round(record.requestedCededSI * f);
                              }, 0),
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                            {fmtAED(reinsurerRequestStatuses.reduce((s, rq) => s + rq.premiumAED, 0))}
                          </td>
                          <td className="px-3 py-2.5" />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
            </>
            ) : null}

            {showReinsurerDetailPanels && !embedInwardFacLayout && (
            <>
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

            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Facultative Reinsurance</CardTitle>
                  {!isEditingPlacement ? (
                    <Button variant="outline" size="sm" className="gap-2" onClick={beginPlacementEdit}>
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

                <PlacementEditHistoryTable
                  history={history}
                  wrapClassName="rounded-lg border"
                  headerClassName="border-b bg-slate-50 px-4 py-3 font-semibold"
                />
              </CardContent>
            </Card>

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

            {inwardFacPortal(portal) && (
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

                  {slipExchangeSection}

                  <div
                    className={cn(
                      'flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center',
                      placementFinalised ? 'sm:justify-between' : 'sm:justify-end',
                    )}
                  >
                    {placementFinalised ? (
                      <p className="max-w-xl text-sm text-muted-foreground">
                        This facultative placement has been marked as finalised. Further changes should go through
                        endorsement or a new fac request.
                      </p>
                    ) : null}
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
            </>
            )}
          </div>
        </div>
      </div>

      {showFacInwardReinsuranceChat ? (
        <>
          <Button
            type="button"
            className="fixed bottom-6 right-6 z-40 gap-2 rounded-full shadow-lg"
            onClick={() => setReinsuranceChatOpen(true)}
          >
            <MessageSquare className="h-4 w-4" />
            Reinsurance Chat
          </Button>
          {reinsuranceChatOpen ? (
            <div className="fixed bottom-20 right-6 z-50 w-[24rem] max-w-[calc(100vw-2rem)] rounded-xl border bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
                <div>
                  <p className="font-semibold">Queries & Communication</p>
                  <p className="text-xs text-primary-foreground/80">Facultative placement chat</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setReinsuranceChatOpen(false)}
                >
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
                    {requesterChatRole === 'insurer' ? 'Demo Underwriter (Cedent)' : 'Demo Reinsurance Requester'}
                  </div>
                  {requesterChatRole === 'insurer'
                    ? 'Yes — commission and requested share follow this referral quote and facultative instructions.'
                    : 'Yes, commission and requested share are based on the attached quote form.'}
                </div>
                <div className="flex gap-2 pt-2">
                  <Input placeholder="Type a message..." />
                  <Button type="button" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {brokerArrangeFacDraft ? (
        <ArrangeFacultativeReinsuranceDialog
          draft={brokerArrangeFacDraft}
          updateDraft={setBrokerArrangeFacDraft}
          totalSI={record.requestedCededSI}
          grossPremium={record.premium}
          currency="AED"
          retentionAvailable={brokerFacArrangeRetentionAvailable}
          reinsurers={brokerFacReinsurers}
          onCommit={() => {
            toast({
              title: 'Facultative panel captured',
              description: 'Outbound facultative details are recorded for this referral (demo).',
            });
          }}
        />
      ) : null}

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
