import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ChevronRight, Plus, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';
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
import { CreateRiskCategoryDialog } from './CreateRiskCategoryDialog';
import { useCreateRiskCategory, useDeleteRiskCategory } from '../api/riskCategorisation';
import type { RiskCategorisation, RiskCategory, RiskLevel } from '../utils/riskCategorisation';

interface RiskCategoriesSectionProps {
  rc: RiskCategorisation;
}

export function RiskCategoriesSection({ rc }: RiskCategoriesSectionProps) {
  const navigate = useNavigate();
  const createMutation = useCreateRiskCategory(rc.id);
  const deleteMutation = useDeleteRiskCategory(rc.id);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  const handleCreate = async (name: string, riskLevels: RiskLevel[]) => {
    const isDuplicateName = rc.riskCategories.some(
      (cat) => cat.name.toLowerCase() === name.toLowerCase(),
    );
    if (isDuplicateName) {
      toast.error(`Risk category "${name}" already exists`);
      return;
    }
    try {
      const newCat = await createMutation.mutateAsync({ name, riskLevels, assignments: {} });
      setCreateDialogOpen(false);
      toast.success('Risk category created');
      navigate(`/market-admin/risk-categorisation/${rc.id}/category/${newCat.id}`);
    } catch {
      toast.error('Failed to create risk category');
    }
  };

  const handleDelete = async () => {
    if (!deletingCatId) return;
    try {
      await deleteMutation.mutateAsync(deletingCatId);
      setDeletingCatId(null);
      toast.success('Risk category deleted');
    } catch {
      toast.error('Failed to delete risk category');
    }
  };

  const deletingCat = rc.riskCategories.find((c) => c.id === deletingCatId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rc.riskCategories.length} categor{rc.riskCategories.length === 1 ? 'y' : 'ies'}
        </p>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Add Risk Category
        </Button>
      </div>

      {rc.riskCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Layers className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No risk categories yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create a category to define risk levels and assign combinations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rc.riskCategories.map((cat) => (
            <Card
              key={cat.id}
              className="cursor-pointer hover:shadow-md transition-shadow group relative"
              onClick={() =>
                navigate(`/market-admin/risk-categorisation/${rc.id}/category/${cat.id}`)
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">{cat.name}</h3>
                    {cat.createdAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateDDMMYYYY(cat.createdAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCatId(cat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-3">
                  <Badge variant="secondary" className="text-xs">
                    {cat.riskLevels.length} risk level{cat.riskLevels.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateRiskCategoryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <AlertDialog
        open={!!deletingCatId}
        onOpenChange={(v) => {
          if (!v && !deleteMutation.isPending) setDeletingCatId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete risk category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCat?.name}"? All risk levels and assignments
              will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
