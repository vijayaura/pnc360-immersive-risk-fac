import { useState } from 'react';
import { Globe, MapPin, Trash2, X, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/shared/utils/lib-utils';
import { getCountryFlag } from '@/lib/country-flag';
import type { SummaryEntry } from '@/features/product-config/hooks/useGeographicSelection';
import type { Country } from '@/features/product-config/masters/api/masters';

interface GeographicSelectionSummaryProps {
  summary: SummaryEntry[];
  totalSelected: number;
  onRemoveZone: (zoneId: string) => void;
  onClearAll: () => void;
  scrollHeight?: string;
  disabled?: boolean;
}

export function GeographicSelectionSummary({
  summary,
  totalSelected,
  onRemoveZone,
  onClearAll,
  scrollHeight = 'h-[280px]',
  disabled = false,
}: GeographicSelectionSummaryProps) {
  if (totalSelected === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
        <Globe className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm font-medium">No locations selected</p>
        <p className="text-xs mt-1">Browse and select from the tree on the left</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-1 sm:gap-2 mb-4 shrink-0 min-w-0">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <h3 className="text-sm font-semibold truncate">Selected Locations</h3>
          <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0 whitespace-nowrap">
            {totalSelected} {totalSelected === 1 ? 'zone' : 'zones'}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 h-7 text-xs shrink-0 px-2 sm:px-3"
          disabled={disabled}
        >
          <Trash2 className="h-3.5 w-3.5 sm:h-3 sm:w-3 sm:mr-1 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">Clear All</span>
        </Button>
      </div>

      <ScrollArea className={cn('min-h-0 flex-1 pr-3', scrollHeight)}>
        <div className="space-y-0.5 pb-2">
          {summary.map(({ country, regions }) => (
            <CountryRow
              key={country.id}
              country={country}
              countryLabel={country.label}
              zoneCount={regions.reduce((acc, r) => acc + r.zones.length, 0)}
              regions={regions}
              onRemoveZone={onRemoveZone}
              disabled={disabled}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function CountryRow({
  country,
  countryLabel,
  zoneCount,
  regions,
  onRemoveZone,
  disabled,
}: {
  country: Country;
  countryLabel: string;
  zoneCount: number;
  regions: { region: { id: string; label: string }; zones: { id: string; label: string }[] }[];
  onRemoveZone: (zoneId: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const flag = getCountryFlag(country);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-semibold hover:bg-muted/50 transition-colors">
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        {flag ? (
          <span className="text-base leading-none shrink-0" aria-hidden>
            {flag}
          </span>
        ) : null}
        <span className="flex-1 truncate">{countryLabel}</span>
        <Badge variant="outline" className="text-[10px] h-4 shrink-0">
          {zoneCount}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-6 mt-0.5 space-y-0.5">
          {regions.map(({ region, zones: zoneList }) => (
            <RegionRow
              key={region.id}
              regionLabel={region.label}
              zoneList={zoneList}
              onRemoveZone={onRemoveZone}
              disabled={disabled}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function RegionRow({
  regionLabel,
  zoneList,
  onRemoveZone,
  disabled,
}: {
  regionLabel: string;
  zoneList: { id: string; label: string }[];
  onRemoveZone: (zoneId: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors">
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="flex-1 truncate">{regionLabel}</span>
        <Badge variant="outline" className="text-[10px] h-4 shrink-0">
          {zoneList.length}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-5 mt-1 flex flex-wrap gap-1.5">
          {zoneList.map((zone) => (
            <span
              key={zone.id}
              className="inline-flex items-center gap-1 bg-muted/60 text-muted-foreground rounded-md px-2 py-0.5 text-xs group"
            >
              <MapPin className="h-2.5 w-2.5" />
              {zone.label}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemoveZone(zone.id)}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}


