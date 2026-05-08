import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Edit, Plus, Trash2 } from 'lucide-react';
import type { MatrixParameter, RatingParameter } from './types';

type Props = {
  ratingParameters: RatingParameter[];
  matrixParameters: MatrixParameter[];
  onAddMatrix: () => void;
  onEditMatrix: (index: number) => void;
  onRemoveMatrix: (index: number) => void;
};

export function MatrixParametersPanel({
  ratingParameters,
  matrixParameters,
  onAddMatrix,
  onEditMatrix,
  onRemoveMatrix,
}: Props) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const getParamLabel = (id: string) => {
    const raw = String(id || '').trim();
    if (!raw) return raw;

    const isFormField = (p: RatingParameter) => {
      const t = String(p.parameterType || '').toUpperCase();
      return t === 'FORM_FIELD' || !t;
    };

    const directFormField = ratingParameters.find(
      (p) => isFormField(p) && (p.formFieldId === raw || p.id === raw),
    );
    if (directFormField?.label) return directFormField.label;
    if (directFormField?.name) return directFormField.name;

    const byFormFieldIdOrId = ratingParameters.find((p) => p.formFieldId === raw || p.id === raw);
    const formFieldLabel = String(byFormFieldIdOrId?.formFieldLabel || '').trim();
    if (formFieldLabel) return formFieldLabel;
    if (byFormFieldIdOrId?.label) return byFormFieldIdOrId.label;
    if (byFormFieldIdOrId?.name) return byFormFieldIdOrId.name;

    const byActiveCategory = ratingParameters.find((p) =>
      (p.activeCategories || []).some((ac) => ac.ratingParameterId === raw),
    );
    return (
      byActiveCategory?.formFieldLabel ||
      byActiveCategory?.label ||
      byActiveCategory?.name ||
      (uuidRegex.test(raw) ? 'Unknown Field' : raw)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Matrix Parameters</h3>
          <p className="text-sm text-muted-foreground">
            Combine two fields to create matrix pricing configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {matrixParameters.length} Total
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddMatrix}
            className="flex items-center gap-1.5 h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Matrix
          </Button>
        </div>
      </div>

      {matrixParameters.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">No matrix parameters available.</div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Matrix Definitions</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pr-1">
            {matrixParameters.map((mp, index) => (
              <div
                key={`${mp.ratingParameterId || ''}:${mp.formFieldId}:${mp.formFieldId2}:${index}`}
                className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/30 hover:border-primary/40 transition"
              >
                <div className="space-y-1 min-w-0">
                  <span className="font-medium text-sm block truncate">
                    {mp.name || 'Matrix Parameter'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Fields: {getParamLabel(mp.formFieldId)} x {getParamLabel(mp.formFieldId2)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10"
                    onClick={() => onEditMatrix(index)}
                    aria-label="Edit matrix definition"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                    onClick={() => onRemoveMatrix(index)}
                    aria-label="Delete matrix definition"
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


