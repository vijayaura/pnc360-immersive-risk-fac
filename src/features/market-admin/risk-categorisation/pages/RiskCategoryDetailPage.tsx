import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useRiskCategorisation, useUpdateRiskCategory } from '../api/riskCategorisation';
import type { UpdateRiskCategoryPayload } from '../api/riskCategorisation';
import { getCombinations } from '../utils/riskCategorisation';
import { RiskCategoryDetailView } from '../components/RiskCategoryDetailView';
import type { RiskLevel } from '../utils/riskCategorisation';

export function RiskCategoryDetailPage() {
  const { rcId, categoryId } = useParams<{ rcId: string; categoryId: string }>();
  const navigate = useNavigate();

  const { data: rc, isLoading } = useRiskCategorisation(rcId);
  const updateMutation = useUpdateRiskCategory(rcId ?? '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rc) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Risk Categorisation not found.
      </div>
    );
  }

  const category = rc.riskCategories.find((c) => c.id === categoryId);
  if (!category) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Risk Category not found.{' '}
        <button
          className="underline text-primary"
          onClick={() =>
            navigate(`/market-admin/risk-categorisation?id=${rcId}&tab=risk-categories`)
          }
        >
          Go back
        </button>
      </div>
    );
  }

  const combinations = getCombinations(rc);

  const handleSaveRiskLevels = async (riskLevels: RiskLevel[]) => {
    try {
      const newLevelIds = new Set(riskLevels.map((l) => l.id));
      const existingAssignments = category.assignments ?? {};

      const hasStaleAssignments = Object.values(existingAssignments).some(
        (id) => !newLevelIds.has(id),
      );

      const payload: UpdateRiskCategoryPayload = hasStaleAssignments
        ? {
            riskLevels,
            assignments: Object.fromEntries(
              Object.entries(existingAssignments).filter(([, v]) => newLevelIds.has(v)),
            ),
          }
        : { riskLevels };

      await updateMutation.mutateAsync({ catId: category.id, payload });
      toast.success('Risk levels saved');
    } catch {
      toast.error('Failed to save risk levels');
    }
  };

  const handleSaveAssignments = async (assignments: Record<string, string>) => {
    try {
      await updateMutation.mutateAsync({
        catId: category.id,
        payload: { assignments },
      });
      toast.success('Assignments saved');
    } catch {
      toast.error('Failed to save assignments');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={() =>
            navigate(`/market-admin/risk-categorisation?id=${rcId}&tab=risk-categories`)
          }
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">{rc.name}</p>
          <h1 className="text-xl font-bold">{category.name}</h1>
        </div>
      </div>

      <RiskCategoryDetailView
        rc={rc}
        category={category}
        combinations={combinations}
        onSaveRiskLevels={handleSaveRiskLevels}
        onSaveAssignments={handleSaveAssignments}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
}
