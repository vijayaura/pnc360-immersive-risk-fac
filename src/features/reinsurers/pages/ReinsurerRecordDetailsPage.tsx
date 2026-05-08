import { useState } from 'react';
import { ArrowLeft, Brain, Download, Flag, Layers, Layout, MessageSquare, Pencil, Plus, Save, Send, Shield, User, Users, X } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReinsurerPolicyRecord } from '@/features/reinsurer-management/types';

const t = (value: unknown) => {
  if (value === null || value === undefined) return '-';
  const text = String(value).trim();
  return text.length ? text : '-';
};

const fmtAED = (value: number) =>
  `${new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(value)} AED`;

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const classes = normalized.includes('bound') || normalized.includes('active')
    ? 'bg-green-50 text-green-700 border-green-200'
    : normalized.includes('pending') || normalized.includes('review')
      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
      : 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {status}
    </span>
  );
}

function createFallbackRecord(recordId?: string): ReinsurerPolicyRecord {
  return {
    id: recordId || '192615ac-c194-4cb0-83fb-30fe5e1f26f2',
    policyOrQuoteId: 'PNC-QA-24041',
    riskId: 'RISK-24041',
    customerName: 'Harbor Logistics Group',
    productName: 'Marine Cargo',
    status: 'Pending Review',
    hasReinsurance: true,
    referralInfo: {
      source: 'Underwriter',
      createdBy: 'Demo Underwriter',
      createdDate: '2026-05-06',
      status: 'In Review',
    },
    productBreakdown: [],
    quoteId: 'demo-quote-004',
    programNames: ['Facultative Placement'],
    treatyNames: ['Single Risk Facultative'],
    totals: {
      sumInsured: 68000000,
      grossPremium: 1750000,
      cededToTreaty: 0,
      facultativeCeded: 47600000,
      netRetention: 20400000,
      commissionEarned: 210000,
      netRetentionAfterCommission: 20190000,
    },
  };
}

export default function ReinsurerRecordDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recordId } = useParams<{ recordId: string }>();
  const [isCommunicationOpen, setIsCommunicationOpen] = useState(false);
  const [isEditingParticipation, setIsEditingParticipation] = useState(false);
  const [participation, setParticipation] = useState({
    sharePercent: '55',
    risk: '26180000',
    premium: '962500',
    commissionPercent: '12',
    status: 'Quoted',
    comment: '',
  });
  const [participationHistory, setParticipationHistory] = useState([
    {
      date: '30/04/2026, 14:05:12',
      updatedBy: 'Demo Reinsurer',
      comment: 'Initial facultative terms quoted for requested ceded SI.',
      summary: 'Share 55%, commission 12%',
    },
    {
      date: '30/04/2026, 13:42:36',
      updatedBy: 'Demo Reinsurer',
      comment: 'Started internal review of pricing and capacity.',
      summary: 'Review started',
    },
  ]);
  const recordFromState = (location.state as { record?: ReinsurerPolicyRecord } | null)?.record;
  const record = recordFromState ?? createFallbackRecord(recordId);

  const sumInsured = record.totals?.sumInsured ?? 68000000;
  const cededSI = record.totals?.facultativeCeded ?? 47600000;
  const premium = record.totals?.grossPremium ?? 1750000;
  const commission = record.totals?.commissionEarned ?? 210000;

  const quoteInfo = [
    { label: 'Quote ID', value: record.policyOrQuoteId },
    { label: 'Risk ID', value: record.riskId },
    { label: 'Customer', value: record.customerName },
    { label: 'Product', value: record.productName },
    { label: 'Quote Status', value: <StatusBadge status={record.status} /> },
    { label: 'Placement Type', value: 'Facultative In' },
    { label: 'Submission Source', value: 'Underwriter Portal' },
    { label: 'Originating Insurer', value: 'Aura Underwriting Demo' },
    { label: 'Reinsurance Broker', value: 'Shields Reinsurance Brokers' },
    { label: 'Assigned Reinsurer', value: 'Demo Reinsurer' },
    { label: 'Requested By', value: record.referralInfo.createdBy },
    { label: 'Requested Date', value: record.referralInfo.createdDate },
  ];

  const riskValues = {
    productCover: record.productName,
    unit: 'Primary Risk',
    cededSI,
    premium,
    commissionPercent: '12%',
  };

  const referralHistory = [
    {
      id: 1,
      action: 'Facultative Request Received',
      actorType: 'Insurer',
      dateTime: '30/04/2026, 13:22:48',
      details: 'Underwriter requested facultative capacity for this risk.',
    },
    {
      id: 2,
      action: 'Placement Slip Shared',
      actorType: 'Broker',
      dateTime: '30/04/2026, 13:27:10',
      details: 'Reinsurance broker shared placement slip and requested terms.',
    },
    {
      id: 3,
      action: 'Quote Review Started',
      actorType: 'Reinsurer',
      dateTime: '30/04/2026, 13:42:36',
      details: 'Demo Reinsurer started reviewing requested ceded SI and premium.',
    },
  ];

  const handleDownloadPlacementSlip = () => {
    const slip = [
      'Facultative Placement Slip',
      `Quote ID: ${record.policyOrQuoteId}`,
      `Risk ID: ${record.riskId ?? '-'}`,
      `Customer: ${record.customerName}`,
      `Product: ${record.productName}`,
      `Requested Ceded SI: ${fmtAED(cededSI)}`,
      `Premium: ${fmtAED(premium)}`,
      `Commission: ${riskValues.commissionPercent}`,
    ].join('\n');
    const blob = new Blob([slip], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `placement-slip-${record.policyOrQuoteId}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveParticipation = () => {
    const now = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    setParticipationHistory((prev) => [
      {
        date: now,
        updatedBy: 'Demo Reinsurer',
        comment: participation.comment.trim() || 'Updated facultative participation terms.',
        summary: `Share ${participation.sharePercent}%, commission ${participation.commissionPercent}%`,
      },
      ...prev,
    ]);
    setParticipation((prev) => ({ ...prev, comment: '' }));
    setIsEditingParticipation(false);
  };

  const handleParticipationShareChange = (value: string) => {
    const share = Math.max(0, Math.min(100, Number(value) || 0));
    setParticipation((prev) => ({
      ...prev,
      sharePercent: value,
      risk: String(Math.round(cededSI * (share / 100))),
      premium: String(Math.round(premium * (share / 100))),
    }));
  };

  return (
    <div className="min-h-full overflow-auto bg-slate-50">
      <div className="mx-auto w-full max-w-none px-4 py-6 pb-8">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 bg-primary px-4 py-3 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="-ml-1 gap-1 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                onClick={() => navigate('/reinsurer/dashboard')}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <span className="h-6 w-px bg-primary-foreground/30" />
              <h2 className="text-lg font-semibold leading-tight">
                Facultative quote details - {t(record.policyOrQuoteId)}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary-foreground/80">
              Facultative In
              <Badge variant="secondary" className="border-0 bg-primary-foreground text-primary">
                Quote
              </Badge>
            </div>
          </div>

          <div className="space-y-8 bg-muted/30 p-6">
            <section aria-labelledby="quote-info-heading">
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h3 id="quote-info-heading" className="text-sm font-semibold text-slate-900">
                  Quote Information
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="ai-gradient-shimmer h-9 gap-2">
                    <Brain className="h-4 w-4" />
                    Immersive Risk Assessment
                  </Button>
                  <Button variant="default" size="sm" className="h-9 gap-2">
                    <Layout className="h-4 w-4" />
                    Quote Format
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handleDownloadPlacementSlip}>
                    <Download className="h-4 w-4" />
                    Download Placement Slip
                  </Button>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-3 divide-x divide-y divide-slate-200">
                  {quoteInfo.map((item) => (
                    <div key={item.label} className="px-4 py-3">
                      <div className="mb-1 text-xs text-muted-foreground">{item.label}</div>
                      <div className="break-words text-sm font-semibold text-foreground">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section aria-labelledby="risk-values-heading">
              <h3 id="risk-values-heading" className="mb-3 text-sm font-semibold text-slate-900">
                Risk Information
              </h3>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {['Product / Cover', 'Unit', 'Requested Ceded SI', 'Premium', 'Commission %'].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="px-3 py-4 text-sm font-medium text-slate-900">{riskValues.productCover}</td>
                      <td className="px-3 py-4 text-sm text-slate-700">{riskValues.unit}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-900">{fmtAED(riskValues.cededSI)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-primary">{fmtAED(riskValues.premium)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-900">{riskValues.commissionPercent}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="mock-breakdown-heading" className="space-y-6">
              <div>
                <h3 id="mock-breakdown-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Facultative Breakdown
                </h3>
              </div>

              <Card className="border-primary bg-primary text-primary-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary-foreground">
                    <div className="rounded-lg bg-primary-foreground/20 p-2">
                      <Layers className="h-4 w-4 text-primary-foreground" />
                    </div>
                    Facultative Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <section aria-labelledby="reinsurance-summary-heading">
                    <h4 id="reinsurance-summary-heading" className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary-foreground/80">
                      Reinsurance Summary
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { label: 'Gross Sum Insured', value: sumInsured },
                        { label: 'Facultative Cession', value: cededSI },
                        { label: 'Gross Premium', value: premium },
                        { label: 'Commission on Cession', value: commission },
                      ].map((box) => (
                        <div key={box.label} className="rounded-lg bg-background p-4 text-foreground shadow-sm">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{box.label}</p>
                          <p className="text-lg font-semibold tabular-nums">{fmtAED(box.value)}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="border-t border-primary-foreground/20" />

                  <section aria-labelledby="fac-placement-heading">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 id="fac-placement-heading" className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/80">
                        Facultative Placement
                      </h4>
                      <Badge variant="secondary" className="bg-primary-foreground text-primary">
                        Awaiting reinsurer response
                      </Badge>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        {
                          title: 'Demo Reinsurer',
                          subtitle: 'Your participation',
                          share: `${participation.sharePercent}%`,
                          risk: Number(participation.risk) || 0,
                          premiumShare: Number(participation.premium) || 0,
                          commission: `${participation.commissionPercent}%`,
                        },
                      ].map((item) => (
                        <div key={item.title} className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-primary-foreground">{item.title}</p>
                              <p className="text-xs text-primary-foreground/70">{item.subtitle}</p>
                            </div>
                            <Badge variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground">
                              {item.share}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between gap-3">
                              <span className="text-primary-foreground/70">Risk</span>
                              <span className="font-semibold tabular-nums text-primary-foreground">{fmtAED(item.risk)}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-primary-foreground/70">Premium</span>
                              <span className="font-semibold tabular-nums text-primary-foreground">{fmtAED(item.premiumShare)}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-primary-foreground/70">Commission</span>
                              <span className="font-semibold text-primary-foreground">{item.commission}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Facultative Reinsurance
                </h3>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4" />
                      My Participation
                    </CardTitle>
                    {isEditingParticipation ? (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditingParticipation(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" className="gap-2" onClick={handleSaveParticipation}>
                          <Save className="h-4 w-4" />
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditingParticipation(true)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50">
                            {['Reinsurer', 'Broker', 'Share %', 'Risk', 'Premium', 'Commission %', 'Status'].map((heading) => (
                              <th key={heading} className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                {heading}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200 last:border-b-0">
                            <td className="px-3 py-3 text-sm font-medium text-slate-900">Demo Reinsurer</td>
                            <td className="px-3 py-3 text-sm text-slate-700">Shields Reinsurance Brokers</td>
                            <td className="px-3 py-3 text-sm text-slate-700">
                              {isEditingParticipation ? (
                                <input
                                  className="h-8 w-20 rounded-md border border-slate-200 px-2 text-sm"
                                  value={participation.sharePercent}
                                  onChange={(event) => handleParticipationShareChange(event.target.value)}
                                />
                              ) : (
                                `${participation.sharePercent}%`
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-slate-900">
                              {isEditingParticipation ? (
                                <input
                                  className="h-8 w-32 rounded-md border border-slate-200 px-2 text-sm"
                                  value={participation.risk}
                                  onChange={(event) => setParticipation((prev) => ({ ...prev, risk: event.target.value }))}
                                />
                              ) : (
                                fmtAED(Number(participation.risk) || 0)
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-slate-900">
                              {isEditingParticipation ? (
                                <input
                                  className="h-8 w-28 rounded-md border border-slate-200 px-2 text-sm"
                                  value={participation.premium}
                                  onChange={(event) => setParticipation((prev) => ({ ...prev, premium: event.target.value }))}
                                />
                              ) : (
                                fmtAED(Number(participation.premium) || 0)
                              )}
                            </td>
                            <td className="px-3 py-3 text-sm text-slate-700">
                              {isEditingParticipation ? (
                                <input
                                  className="h-8 w-20 rounded-md border border-slate-200 px-2 text-sm"
                                  value={participation.commissionPercent}
                                  onChange={(event) => setParticipation((prev) => ({ ...prev, commissionPercent: event.target.value }))}
                                />
                              ) : (
                                `${participation.commissionPercent}%`
                              )}
                            </td>
                            <td className="px-3 py-3 text-sm">
                              <Badge variant="outline">{participation.status}</Badge>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {isEditingParticipation && (
                      <div className="mt-4">
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Edit Comment
                        </label>
                        <textarea
                          className="min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                          placeholder="Add a comment for this edit..."
                          value={participation.comment}
                          onChange={(event) => setParticipation((prev) => ({ ...prev, comment: event.target.value }))}
                        />
                      </div>
                    )}

                    <div className="mt-6">
                      <h4 className="mb-3 text-sm font-semibold text-slate-900">Edit History</h4>
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                              {['Date & Time', 'Updated By', 'Change Summary', 'Comment'].map((heading) => (
                                <th key={heading} className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                  {heading}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {participationHistory.map((entry) => (
                              <tr key={`${entry.date}-${entry.summary}`} className="border-b border-slate-200 last:border-b-0">
                                <td className="px-3 py-3 text-sm text-slate-700">{entry.date}</td>
                                <td className="px-3 py-3 text-sm text-slate-700">{entry.updatedBy}</td>
                                <td className="px-3 py-3 text-sm font-medium text-slate-900">{entry.summary}</td>
                                <td className="px-3 py-3 text-sm text-slate-700">{entry.comment}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section aria-labelledby="referral-history-heading">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle id="referral-history-heading" className="flex items-center gap-2 text-base">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      History & Timeline
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Click on any item to view detailed information
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsCommunicationOpen(true)}>
                    <MessageSquare className="h-4 w-4" />
                    Add Comment
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          {['#', 'Action', 'Actor Type', 'Date & Time', 'Comment / Details'].map((heading) => (
                            <th key={heading} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {referralHistory.map((item) => (
                          <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
                            <td className="px-4 py-3 text-sm text-slate-500">{item.id}</td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                                <Flag className="h-3 w-3" />
                                {item.action}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">{item.actorType}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">{item.dateTime}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{item.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>

      {isCommunicationOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[700px] w-[400px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Queries & Communication</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsCommunicationOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div
            className="relative flex flex-1 flex-col overflow-hidden p-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
              backgroundColor: '#f9fafb',
            }}
          >
            <div className="flex-1 overflow-auto px-4 py-4">
              <div className="space-y-4">
                {[
                  {
                    id: 'broker-pricing',
                    senderRole: 'broker',
                    senderLabel: 'Broker',
                    badge: 'Received',
                    message: 'Pricing',
                    createdAt: '30/04/2026, 13:22:48',
                  },
                  {
                    id: 'reinsurer-review',
                    senderRole: 'reinsurer',
                    senderLabel: 'You',
                    badge: 'Sent',
                    message: 'We are reviewing the requested ceded SI and commission terms.',
                    createdAt: '30/04/2026, 13:42:36',
                  },
                ].map((msg) => {
                  const isMine = msg.senderRole === 'reinsurer';
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%]">
                        <div
                          className={`rounded-lg border px-4 py-3 shadow-md ${
                            isMine
                              ? 'border-transparent bg-primary text-primary-foreground'
                              : 'border-gray-200 bg-white text-gray-900'
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <User className={`h-3 w-3 ${isMine ? 'text-white' : 'text-gray-600'}`} />
                              <span className={`text-xs font-medium ${isMine ? 'text-white' : 'text-gray-700'}`}>
                                {msg.senderLabel}
                              </span>
                            </div>
                            <Badge
                              variant={isMine ? 'secondary' : 'default'}
                              className={`text-xs ${isMine ? 'bg-white/20 text-white hover:bg-white/30' : ''}`}
                            >
                              {msg.badge}
                            </Badge>
                          </div>

                          <p className={`break-words text-sm leading-relaxed ${isMine ? 'text-white' : 'text-gray-800'}`}>
                            {msg.message}
                          </p>
                          <div className={`mt-2 text-xs ${isMine ? 'text-white opacity-70' : 'text-gray-500'}`}>
                            {msg.createdAt}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t bg-gray-50 p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-1 flex items-center">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Attach documents">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <input
                className="h-11 w-full rounded-md border border-input bg-background pl-11 pr-24 text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Type a query message..."
              />
              <div className="absolute inset-y-0 right-2 flex items-center">
                <Button size="sm" className="h-8 gap-1 px-3">
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isCommunicationOpen && (
        <div className="fixed bottom-10 right-10 z-50 group">
          <Button
            onClick={() => setIsCommunicationOpen(true)}
            className="h-14 w-14 group-hover:w-[13.5rem] rounded-full shadow-lg flex items-center justify-start overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-all duration-300 ease-in-out p-0"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center">
              <MessageSquare className="h-6 w-6" />
            </div>
            <span className="font-medium whitespace-nowrap opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 pr-6">
              Reinsurance Chat
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
