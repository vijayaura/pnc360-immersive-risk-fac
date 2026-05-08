import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Database } from 'lucide-react';
import type { DefaultRatingParam, RatingParameter } from './types';

type Props = {
  paramId: string;
  title: string;
  excludeParamId?: string;
  defaultRatingParamsList: DefaultRatingParam[];
  allAvailableParameters: RatingParameter[];
  onChangeDefaultRatingParamsList: (next: DefaultRatingParam[]) => void;
};

export function RatingParameterSection({
  paramId,
  title,
  excludeParamId,
  defaultRatingParamsList,
  allAvailableParameters,
  onChangeDefaultRatingParamsList,
}: Props) {
  const param = defaultRatingParamsList.find((p) => p.id === paramId);
  if (!param) return null;

  let excludedIds: string[] = [];
  if (excludeParamId) {
    const excludeParam = defaultRatingParamsList.find((p) => p.id === excludeParamId);
    excludedIds = excludeParam?.selectedRatingParameters || [];
  }

  const availableParameters = allAvailableParameters.filter((p) => !excludedIds.includes(p.id));

  const currentSelectedIds = param.selectedRatingParameters || [];
  const allSelected =
    availableParameters.length > 0 &&
    availableParameters.every((p) => currentSelectedIds.includes(p.id));

  const showSelectAll = ['factor', 'premiumLimit'].includes(paramId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {showSelectAll && availableParameters.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`select-all-${paramId}`}
                checked={allSelected}
                onCheckedChange={(checked) => {
                  const updatedParams = checked ? availableParameters.map((p) => p.id) : [];
                  const updated = defaultRatingParamsList.map((pr) =>
                    pr.id === param.id ? { ...pr, selectedRatingParameters: updatedParams } : pr,
                  );
                  onChangeDefaultRatingParamsList(updated);
                }}
              />
              <Label
                htmlFor={`select-all-${paramId}`}
                className="text-sm font-medium cursor-pointer"
              >
                Select All
              </Label>
            </div>
          )}
        </div>
        {param.selectedRatingParameters && param.selectedRatingParameters.length > 0 && (
          <Badge variant="outline">{param.selectedRatingParameters.length} Selected</Badge>
        )}
      </div>

      <div className="space-y-3">
        {availableParameters.length === 0 ? (
          <div className="p-4 border-2 border-dashed rounded-md text-center text-muted-foreground">
            <p className="text-xs">
              No rating parameters available. Mark fields as rating parameters in the proposal form
              design.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {availableParameters.map((p) => {
              const isSelected = param.selectedRatingParameters?.includes(p.id) || false;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    const currentParams = param.selectedRatingParameters || [];
                    const updatedParams = isSelected
                      ? currentParams.filter((id) => id !== p.id)
                      : [...currentParams, p.id];
                    const updated = defaultRatingParamsList.map((pr) =>
                      pr.id === param.id
                        ? {
                            ...pr,
                            selectedRatingParameters:
                              updatedParams.length > 0 ? updatedParams : undefined,
                          }
                        : pr,
                    );
                    onChangeDefaultRatingParamsList(updated);
                  }}
                  className={`p-3 border-2 rounded-md cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary shadow-sm'
                      : 'bg-background hover:bg-muted/50 hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-2.5 h-2.5 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex gap-1 flex-1 min-w-0">
                      <Label className="font-medium text-xs cursor-pointer">{p.label}</Label>
                      {p.masterId && <Database className="w-4 h-4 text-primary" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {param.selectedRatingParameters && param.selectedRatingParameters.length > 0 && (
        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 mb-2">
            <Label className="text-xs font-medium">Selected Parameters</Label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {param.selectedRatingParameters.map((selectedParamId) => {
              const p = allAvailableParameters.find((pr) => pr.id === selectedParamId);
              return p ? (
                <Badge key={selectedParamId} variant="secondary" className="text-xs px-2 py-0.5">
                  {p.label}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
