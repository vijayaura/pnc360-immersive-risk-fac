import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRiskCategorisation } from '../api/riskCategorisation';
import { RiskCategorisationList } from '../components/RiskCategorisationList';
import { MastersSection } from '../components/MastersSection';
import { RiskCategoriesSection } from '../components/RiskCategoriesSection';

export function RiskCategorisationManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedId = searchParams.get('id') ?? undefined;
  const activeTab = searchParams.get('tab') ?? 'masters';

  const { data: rc, isLoading } = useRiskCategorisation(selectedId);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params, { replace: true });
  };

  // ─── List view ────────────────────────────────────────────────────────────
  if (!selectedId) {
    return (
      <div className="p-6">
        <RiskCategorisationList />
      </div>
    );
  }

  // ─── Detail view ──────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={() => navigate('/market-admin/risk-categorisation')}
        >
          <ArrowLeft className="w-4 h-4" />
          All Categorisations
        </Button>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <h1 className="text-xl font-bold">{rc?.name ?? 'Risk Categorisation'}</h1>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-48">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !rc ? (
        <div className="text-center text-sm text-muted-foreground py-16">
          Risk Categorisation not found.{' '}
          <button
            className="underline text-primary"
            onClick={() => navigate('/market-admin/risk-categorisation')}
          >
            Go back
          </button>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="masters">Masters</TabsTrigger>
            <TabsTrigger value="risk-categories">Risk Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="masters" className="mt-4">
            <MastersSection rc={rc} />
          </TabsContent>

          <TabsContent value="risk-categories" className="mt-4">
            <RiskCategoriesSection rc={rc} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
