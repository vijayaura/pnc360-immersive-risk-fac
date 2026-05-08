import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/lib-utils';

import { DEMO_FAC_AI_PRODUCTS } from './MarketAdminFacAiStudioList';

const STEPS = [
  { id: 1, title: 'Scope & Behavior', subtitle: 'Define role and purpose.' },
  { id: 2, title: 'Channels', subtitle: 'Select communication platforms.' },
  { id: 3, title: 'Schema & Extraction', subtitle: 'Key data structure.' },
  { id: 4, title: 'Action & Routing Setup', subtitle: 'Configure tasks.' },
] as const;

const BUSINESS_TYPES = ['Property', 'Engineering', 'Casualty', 'Motor', 'Life', 'Marine', 'Health', 'Others'] as const;
const ROLE_OPTIONS = ['Analyst', 'Placement Coordinator', 'Underwriting Assistant', 'Operations'];

type ReplyStrategy = 'same_thread_sender' | 'new_thread_receiver' | 'ack_forward';
type ActionType = 'send_email' | 'assign_task';
type RoutingCondition = 'never' | 'always' | 'conditional';

type DocRow = { tempId: string; documentType: string; detectionPrompt: string };

export type FacAiWizardForm = {
  agentName: string;
  role: string;
  agentEmail: string;
  businessTypes: string[];
  agentRoleInstructions: string;
  agentTriggerPrompt: string;
  senderMode: string;
  senderContacts: string;
  receiverMode: string;
  receiverContacts: string;
  replyStrategy: ReplyStrategy;
  agentInstructionsSchema: string;
  markupLogicInstructions: string;
  documents: DocRow[];
  actionType: ActionType;
  subjectTemplate: string;
  emailBodyTemplate: string;
  aiPromptOptional: string;
  routingCondition: RoutingCondition;
};

function newDoc(): DocRow {
  return { tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`, documentType: '', detectionPrompt: '' };
}

function defaultForm(): FacAiWizardForm {
  return {
    agentName: '',
    role: ROLE_OPTIONS[0],
    agentEmail: '',
    businessTypes: [],
    agentRoleInstructions: '',
    agentTriggerPrompt: '',
    senderMode: 'any',
    senderContacts: '',
    receiverMode: 'any',
    receiverContacts: '',
    replyStrategy: 'new_thread_receiver',
    agentInstructionsSchema: '',
    markupLogicInstructions: '',
    documents: [{ ...newDoc(), documentType: 'risk slip', detectionPrompt: 'slip' }],
    actionType: 'send_email',
    subjectTemplate: '',
    emailBodyTemplate: '',
    aiPromptOptional: '',
    routingCondition: 'never',
  };
}

function formFromPiAgentDemo(): FacAiWizardForm {
  return {
    ...defaultForm(),
    agentName: 'pi agent',
    role: 'Analyst',
    agentEmail: 'quote@aurainsure.tech',
    businessTypes: ['Casualty'],
    agentRoleInstructions: 'role',
    agentTriggerPrompt: 'Trigger this agent if subject contains retech or fac-support or riyadh re',
    senderMode: 'any',
    senderContacts: 'Aamir - insurer\nvamshi chippa',
    receiverMode: 'any',
    receiverContacts: 'ABC Reinsurer\nAamir - Reinsurer\nvamshi chippa',
    replyStrategy: 'new_thread_receiver',
    agentInstructionsSchema: 'instructions',
    markupLogicInstructions: `1. Apply the following markup rates:
   - Cedant Rate: 1%
   - Base Rate: 0.8%
   - Mark Up: 0.2%
2. Calculate the final premium based on these rates.`,
    documents: [{ tempId: 'demo-doc-1', documentType: 'risk slip', detectionPrompt: 'slip' }],
    actionType: 'send_email',
    subjectTemplate: 'subject',
    emailBodyTemplate: 'email body',
    aiPromptOptional: `1. A short introduction about the insured (only if information is available)
2. Qualitative and quantitative appetite summaries
3. Pros and cons of the risk
4. Rate, net rate, and premium details`,
    routingCondition: 'never',
  };
}

function formFromMarineDemo(): FacAiWizardForm {
  const base = defaultForm();
  const p = DEMO_FAC_AI_PRODUCTS.find((x) => x.id === 'fac-ai-marine-router');
  if (!p) return base;
  return {
    ...base,
    agentName: p.name,
    role: p.role,
    agentEmail: p.agentEmail,
    businessTypes: [...p.businessTypes],
    agentTriggerPrompt: p.triggerPreview,
    agentRoleInstructions:
      'Route inbound marine facultative slips, validate attachments, and surface key exposure fields.',
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
      agentName: summary.name,
      role: summary.role,
      agentEmail: summary.agentEmail,
      businessTypes: [...summary.businessTypes],
      agentTriggerPrompt: summary.triggerPreview,
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

export default function MarketAdminFacAiStudioWizard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { productId } = useParams<{ productId: string }>();
  const { toast } = useToast();

  const isNew = pathname.endsWith('/fac-ai-studio/new');
  const seedKey = isNew ? 'new' : productId;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FacAiWizardForm>(() => getInitialForm(seedKey));

  useEffect(() => {
    setForm(getInitialForm(seedKey));
    setStep(1);
  }, [seedKey]);

  const update = <K extends keyof FacAiWizardForm>(key: K, value: FacAiWizardForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleBusinessType = (bt: string) => {
    setForm((f) => ({
      ...f,
      businessTypes: f.businessTypes.includes(bt) ? f.businessTypes.filter((x) => x !== bt) : [...f.businessTypes, bt],
    }));
  };

  const senderLines = useMemo(
    () =>
      form.senderContacts
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean),
    [form.senderContacts],
  );
  const receiverLines = useMemo(
    () =>
      form.receiverContacts
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean),
    [form.receiverContacts],
  );

  const goBack = () => {
    if (step <= 1) {
      navigate('/market-admin/fac-ai-studio');
      return;
    }
    setStep((s) => s - 1);
  };

  const goNext = () => {
    if (step >= 4) return;
    setStep((s) => s + 1);
  };

  const handleSubmit = () => {
    toast({
      title: 'Configuration saved (demo)',
      description: `"${form.agentName || 'FAC AI product'}" is stored in this session only until an API is connected.`,
    });
    navigate('/market-admin/fac-ai-studio');
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-4xl px-6 py-8 pb-24">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-2" onClick={() => navigate('/market-admin/fac-ai-studio')}>
              <ArrowLeft className="h-4 w-4" />
              All products
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isNew ? 'New FAC AI product' : 'Configure FAC AI product'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Four-step setup aligned with facultative inbox automation.</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div
                key={s.id}
                className={cn(
                  'flex gap-3 rounded-lg border px-4 py-3 shadow-sm transition-colors',
                  active && 'border-amber-400/80 bg-amber-50/80 dark:bg-amber-950/20',
                  done && !active && 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20',
                  !active && !done && 'border-muted bg-muted/40',
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-bold',
                    active && 'bg-amber-400 text-amber-950',
                    done && !active && 'bg-emerald-600 text-white',
                    !active && !done && 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <Check className="h-5 w-5" /> : s.id}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step bodies */}
        {step === 1 ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fac-agent-name">
                <Req>Agent Name</Req>
              </Label>
              <Input id="fac-agent-name" value={form.agentName} onChange={(e) => update('agentName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fac-role">
                <Req>Role</Req>
              </Label>
              <Select value={form.role} onValueChange={(v) => update('role', v)}>
                <SelectTrigger id="fac-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Req>Business Types</Req>
              </Label>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_TYPES.map((bt) => {
                  const on = form.businessTypes.includes(bt);
                  return (
                    <button
                      key={bt}
                      type="button"
                      onClick={() => toggleBusinessType(bt)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm transition-colors',
                        on
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-muted-foreground/25 bg-background hover:bg-muted/60',
                      )}
                    >
                      {bt}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fac-role-instructions">
                <Req>Agent Role Instructions</Req>
              </Label>
              <Textarea
                id="fac-role-instructions"
                rows={5}
                value={form.agentRoleInstructions}
                onChange={(e) => update('agentRoleInstructions', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Use free text natural language here for faster setup.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fac-trigger">
                <Req>Agent trigger prompt</Req>
              </Label>
              <Textarea
                id="fac-trigger"
                rows={4}
                value={form.agentTriggerPrompt}
                onChange={(e) => update('agentTriggerPrompt', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Use free text natural language here for faster setup.</p>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Inbound Channels (Senders)</h2>

              <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
                <Label className="text-base">
                  <Req>Select Sender(s)</Req>
                </Label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <Select value={form.senderMode} onValueChange={(v) => update('senderMode', v)}>
                    <SelectTrigger className="sm:w-40 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="whitelist">Whitelist</SelectItem>
                      <SelectItem value="domain">Domain match</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap gap-2 min-h-[2rem]">
                      {senderLines.map((line) => (
                        <span key={line} className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                          {line}
                        </span>
                      ))}
                    </div>
                    <Label htmlFor="fac-sender-contacts" className="sr-only">
                      Sender contacts (one per line)
                    </Label>
                    <Textarea
                      id="fac-sender-contacts"
                      placeholder="Enter one contact per line (e.g. Aamir - insurer)"
                      rows={3}
                      value={form.senderContacts}
                      onChange={(e) => update('senderContacts', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Input placeholder="Search sender contacts (demo UI)" disabled className="max-w-xs" />
                  <Button type="button" variant="outline" size="sm" disabled>
                    + New Contact
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can use free text natural language here. Consider voice-enabling this input for faster setup.
                </p>
              </div>

              <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
                <Label className="text-base">
                  <Req>Select Receiver(s)</Req>
                </Label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <Select value={form.receiverMode} onValueChange={(v) => update('receiverMode', v)}>
                    <SelectTrigger className="sm:w-40 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="whitelist">Whitelist</SelectItem>
                      <SelectItem value="domain">Domain match</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap gap-2 min-h-[2rem]">
                      {receiverLines.map((line) => (
                        <span key={line} className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                          {line}
                        </span>
                      ))}
                    </div>
                    <Textarea
                      id="fac-receiver-contacts"
                      placeholder="Enter one contact per line (e.g. ABC Reinsurer)"
                      rows={3}
                      value={form.receiverContacts}
                      onChange={(e) => update('receiverContacts', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Input placeholder="Search receiver contacts (demo UI)" disabled className="max-w-xs" />
                  <Button type="button" variant="outline" size="sm" disabled>
                    + New Contact
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can use free text natural language here. Consider voice-enabling this input for faster setup.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Reply Strategy</h2>
              <RadioGroup
                value={form.replyStrategy}
                onValueChange={(v: ReplyStrategy) => update('replyStrategy', v)}
                className="grid gap-3 md:grid-cols-3"
              >
                {(
                  [
                    {
                      id: 'same_thread_sender',
                      title: 'Reply in same thread to Sender',
                      body: 'Keeps the conversation with the original sender.',
                    },
                    {
                      id: 'new_thread_receiver',
                      title: 'New thread to Receiver',
                      body: 'Starts a new conversation with the designated receiver.',
                    },
                    {
                      id: 'ack_forward',
                      title: 'Acknowledge + Forward',
                      body: 'Sends ack to sender and forwards to receiver.',
                    },
                  ] as const
                ).map((opt) => {
                  const selected = form.replyStrategy === opt.id;
                  return (
                    <Label
                      key={opt.id}
                      className={cn(
                        'flex cursor-pointer flex-col gap-2 rounded-lg border-2 bg-card p-4 shadow-sm transition-colors',
                        selected ? 'border-primary ring-2 ring-primary/15' : 'border-muted hover:border-muted-foreground/30',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={opt.id} id={`reply-${opt.id}`} className="mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold leading-snug">{opt.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{opt.body}</p>
                        </div>
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>
            </section>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fac-agent-instructions">Agent Instructions:</Label>
              <Textarea
                id="fac-agent-instructions"
                rows={5}
                value={form.agentInstructionsSchema}
                onChange={(e) => update('agentInstructionsSchema', e.target.value)}
              />
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
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Label className="text-base">
                  <Req>Required Sample Documents</Req>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 w-fit shrink-0"
                  onClick={() =>
                    update('documents', [...form.documents, newDoc()])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add Document
                </Button>
              </div>
              <div className="space-y-4">
                {form.documents.map((doc, idx) => (
                  <Card key={doc.tempId} className="relative overflow-hidden shadow-sm">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        update(
                          'documents',
                          form.documents.filter((d) => d.tempId !== doc.tempId),
                        )
                      }
                      disabled={form.documents.length <= 1}
                      aria-label="Remove document row"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <CardContent className="space-y-3 pt-6 pr-11">
                      <div className="space-y-2">
                        <Label htmlFor={`doc-type-${doc.tempId}`}>Document Type</Label>
                        <Input
                          id={`doc-type-${doc.tempId}`}
                          value={doc.documentType}
                          onChange={(e) =>
                            update(
                              'documents',
                              form.documents.map((d) =>
                                d.tempId === doc.tempId ? { ...d, documentType: e.target.value } : d,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`doc-prompt-${doc.tempId}`}>Document Detection Prompt</Label>
                        <Textarea
                          id={`doc-prompt-${doc.tempId}`}
                          rows={4}
                          value={doc.detectionPrompt}
                          onChange={(e) =>
                            update(
                              'documents',
                              form.documents.map((d) =>
                                d.tempId === doc.tempId ? { ...d, detectionPrompt: e.target.value } : d,
                              ),
                            )
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Document {idx + 1}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Action to Perform</h2>
              <RadioGroup
                value={form.actionType}
                onValueChange={(v: ActionType) => update('actionType', v)}
                className="space-y-4"
              >
                <Label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border-2 bg-card p-4',
                    form.actionType === 'send_email'
                      ? 'border-primary ring-2 ring-primary/15'
                      : 'border-muted',
                  )}
                >
                  <RadioGroupItem value="send_email" id="action-email" />
                  <div>
                    <p className="font-semibold">Send Email</p>
                    <p className="text-sm text-muted-foreground mt-1">Assign TasCompose and send a response.</p>
                  </div>
                </Label>
                <Label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border-2 bg-card p-4',
                    form.actionType === 'assign_task' ? 'border-primary ring-2 ring-primary/15' : 'border-muted',
                  )}
                >
                  <RadioGroupItem value="assign_task" id="action-task" />
                  <div>
                    <p className="font-semibold">Assign Task</p>
                    <p className="text-sm text-muted-foreground mt-1">Create a task for teammate.</p>
                  </div>
                </Label>
              </RadioGroup>

              {form.actionType === 'send_email' ? (
                <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Create New Template</p>
                  <div className="space-y-2">
                    <Label htmlFor="fac-subject">Subject Template</Label>
                    <Input
                      id="fac-subject"
                      placeholder="subject"
                      value={form.subjectTemplate}
                      onChange={(e) => update('subjectTemplate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fac-body">Email Body Template</Label>
                    <Textarea
                      id="fac-body"
                      rows={6}
                      placeholder="email body"
                      value={form.emailBodyTemplate}
                      onChange={(e) => update('emailBodyTemplate', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4">
                  Task assignment fields can be added when the workflow engine is wired; this demo keeps the email path.
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="fac-ai-prompt">AI Prompt (Optional)</Label>
                <Textarea
                  id="fac-ai-prompt"
                  rows={8}
                  value={form.aiPromptOptional}
                  onChange={(e) => update('aiPromptOptional', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Generate draft using AI instructions</p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Routing Conditions (Optional)</h2>
              <RadioGroup
                value={form.routingCondition}
                onValueChange={(v: RoutingCondition) => update('routingCondition', v)}
                className="grid gap-3 md:grid-cols-3"
              >
                {(
                  [
                    { id: 'never', title: 'Never', body: 'Send automatically' },
                    { id: 'always', title: 'Always', body: 'Require human approval every time' },
                    { id: 'conditional', title: 'Conditional', body: 'Require approval based on rule' },
                  ] as const
                ).map((opt) => {
                  const selected = form.routingCondition === opt.id;
                  return (
                    <Label
                      key={opt.id}
                      className={cn(
                        'flex cursor-pointer flex-col gap-2 rounded-lg border-2 bg-card p-4 shadow-sm',
                        selected ? 'border-primary ring-2 ring-primary/15' : 'border-muted',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={opt.id} id={`route-${opt.id}`} />
                        <div>
                          <p className="font-semibold">{opt.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{opt.body}</p>
                        </div>
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>
            </section>
          </div>
        ) : null}

        <div className="mt-12 flex justify-end gap-3 border-t pt-6">
          <Button type="button" variant="outline" onClick={goBack}>
            Back
          </Button>
          {step < 4 ? (
            <Button type="button" onClick={goNext}>
              Continue Next
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit}>
              Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
