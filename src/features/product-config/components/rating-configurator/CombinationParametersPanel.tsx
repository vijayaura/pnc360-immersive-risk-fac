import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Edit, Plus, Trash2 } from 'lucide-react';
import type { RatingParameter } from './types';

export type CombinationParameter = {
  ratingParameterId?: string;
  name: string;
  label?: string;
  combinationParameterIds: string[];
};

type Props = {
  ratingParameters: RatingParameter[];
  combinationParameters: CombinationParameter[];
  onAddCombination: () => void;
  onEditCombination: (index: number) => void;
  onRemoveCombination: (index: number) => void;
};

export function CombinationParametersPanel({
  ratingParameters,
  combinationParameters,
  onAddCombination,
  onEditCombination,
  onRemoveCombination,
}: Props) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const getParamLabel = (id: string) => {
    const raw = String(id || '').trim();
    if (!raw) return raw;
    const byId = ratingParameters.find(
      (p) => p.id === raw || p.definitionId === raw || p.formFieldId === raw,
    );
    if (byId?.label) return byId.label;
    if (byId?.name) return byId.name;
    const byRatingParamId = ratingParameters.find((p) =>
      (p.activeCategories || []).some((ac) => ac.ratingParameterId === raw),
    );
    const fallback = byRatingParamId?.label || byRatingParamId?.name;
    if (fallback) return fallback;
    return uuidRegex.test(raw) ? 'Unknown Field' : raw;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Combination Parameters</h3>
          <p className="text-sm text-muted-foreground">
            Combine multiple fields to create row-based pricing conditions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {combinationParameters.length} Total
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddCombination}
            className="flex items-center gap-1.5 h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Combination
          </Button>
        </div>
      </div>

      {combinationParameters.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">
          No combination parameters available.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Combination Definitions</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pr-1">
            {combinationParameters.map((item, index) => (
              <div
                key={`${item.ratingParameterId || item.name}:${item.combinationParameterIds.join(':')}:${index}`}
                className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/30 hover:border-primary/40 transition"
              >
                <div className="space-y-1 min-w-0">
                  <span className="font-medium text-sm block truncate">{item.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    Parameters:{' '}
                    {item.combinationParameterIds.length > 0
                      ? item.combinationParameterIds.map((id) => getParamLabel(id)).join(' x ')
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10"
                    onClick={() => onEditCombination(index)}
                    aria-label="Edit combination definition"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                    onClick={() => onRemoveCombination(index)}
                    aria-label="Delete combination definition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


