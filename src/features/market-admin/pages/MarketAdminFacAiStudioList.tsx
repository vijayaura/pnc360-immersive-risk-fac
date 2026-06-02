import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Search, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export type FacAiStudioProductSummary = {
  id: string;
  name: string;
  agentEmail: string;
  /** Labels shown on the list (chips). */
  businessTypes: string[];
  /** `value` codes from Product Category master — same as Product Studio. */
  categoryCodes: string[];
  updatedAtLabel: string;
  triggerPreview: string;
};

export const DEMO_FAC_AI_PRODUCTS: FacAiStudioProductSummary[] = [
  {
    id: 'fac-ai-pi-agent',
    name: 'Professional Indemnity',
    agentEmail: 'quote@aurainsure.tech',
    businessTypes: ['Liability', 'Professional'],
    categoryCodes: ['LIABILITY', 'PROFESSIONAL'],
    updatedAtLabel: 'Demo · 07 May 2026',
    triggerPreview: 'retech or fac-support or riyadh re',
  },
  {
    id: 'fac-ai-marine-router',
    name: 'Marine Fac Intake',
    agentEmail: 'marine-fac@aurainsure.tech',
    businessTypes: ['Marine Cargo', 'Property'],
    categoryCodes: ['MARINE_CARGO', 'PROPERTY'],
    updatedAtLabel: 'Demo · 06 May 2026',
    triggerPreview: 'marine cargo slip or berth exposure',
  },
];

export default function MarketAdminFacAiStudioList() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return DEMO_FAC_AI_PRODUCTS;
    return DEMO_FAC_AI_PRODUCTS.filter((row) =>
      [row.name, row.agentEmail, row.triggerPreview, ...row.businessTypes].join(' ').toLowerCase().includes(t),
    );
  }, [q]);

  return (
    <div className="min-h-full bg-background px-3 sm:px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-8 w-8" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">FAC AI Studio</h1>
            </div>
          </div>
          <Button className="gap-2 shrink-0" onClick={() => navigate('/market-admin/fac-ai-studio/new')}>
            <Plus className="h-4 w-4" />
            New product
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products by name, email, trigger, categories…"
            className="pl-9"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <Card key={p.id} className="border-border shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                      <CardDescription className="text-xs">{p.updatedAtLabel}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Agent email</p>
                  <p className="text-sm font-medium text-foreground">{p.agentEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categories</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.businessTypes.map((bt) => (
                      <Badge key={bt} variant="outline" className="font-normal">
                        {bt}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trigger preview</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.triggerPreview}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/market-admin/fac-ai-studio/product/${p.id}`)}>
                  Configure
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No products match your search.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
