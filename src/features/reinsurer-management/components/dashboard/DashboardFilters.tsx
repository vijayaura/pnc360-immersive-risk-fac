import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Search } from 'lucide-react';
import type { DashboardFilters as DashboardFiltersType } from '../../types';
import type { ReinsurerGradeValue } from '@/features/reinsurers/api/reinsurers';
import {
  SI_BAND_OPTIONS,
  LOCATION_OPTIONS,
} from '../../utils/dashboardDummyData';

interface ReinsurerOption {
  id: string;
  name: string;
}

interface BrokerOption {
  id: string;
  name: string;
}

interface DashboardFiltersProps {
  filters: DashboardFiltersType;
  onFilterChange: (key: keyof DashboardFiltersType, value: string | undefined) => void;
  onClearFilters: () => void;
  reinsurers: ReinsurerOption[];
  brokers: BrokerOption[];
  coverTypeOptions?: string[];
  gradeOptions?: ReinsurerGradeValue[];
}

const UNSET = '__all__';

export function DashboardFilters({
  filters,
  onFilterChange,
  onClearFilters,
  reinsurers,
  brokers,
  coverTypeOptions = [],
  gradeOptions = [],
}: DashboardFiltersProps) {
  const handleSelectChange = (key: keyof DashboardFiltersType, value: string) => {
    onFilterChange(key, value === UNSET ? undefined : value);
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Row 1: Search + Reinsurers + Brokers + Covers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search case, insured, broker, cover, location, status..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.reinsurerId ?? UNSET}
          onValueChange={(v) => handleSelectChange('reinsurerId', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All reinsurers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>All reinsurers</SelectItem>
            {reinsurers.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.brokerId ?? UNSET}
          onValueChange={(v) => handleSelectChange('brokerId', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All brokers/inter..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>All brokers / intermediaries</SelectItem>
            {brokers.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.coverType ?? UNSET}
          onValueChange={(v) => handleSelectChange('coverType', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All covers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>All covers</SelectItem>
            {coverTypeOptions.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Locations + From + To + Credit Ratings + SI Bands */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Select
          value={filters.location ?? UNSET}
          onValueChange={(v) => handleSelectChange('location', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>All locations</SelectItem>
            {LOCATION_OPTIONS.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">From</span>
          <DatePicker
            value={filters.dateFrom}
            onChange={(val) => onFilterChange('dateFrom', val)}
            placeholder="From date"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">To</span>
          <DatePicker
            value={filters.dateTo}
            onChange={(val) => onFilterChange('dateTo', val)}
            placeholder="To date"
          />
        </div>

        <Select
          value={filters.creditRating ?? UNSET}
          onValueChange={(v) => handleSelectChange('creditRating', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All credit ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>All credit ratings</SelectItem>
            {gradeOptions.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.valueLabel}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sumInsuredBand ?? UNSET}
          onValueChange={(v) => handleSelectChange('sumInsuredBand', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All sum insured b..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>All sum insured bands</SelectItem>
            {SI_BAND_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear filters */}
      <div>
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
