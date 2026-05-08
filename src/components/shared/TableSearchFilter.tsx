import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date' | 'daterange' | 'multiselect' | 'number';
  options?: { value: string; label: string; }[];
}

interface TableSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  activeFilters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  /** Increment when clearing filters so filter controls remount in sync with parent state (e.g. Radix Select). */
  filterWidgetsKey?: number;
  className?: string;
  children?: React.ReactNode;
}

export const TableSearchFilter: React.FC<TableSearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  activeFilters,
  onFilterChange,
  onClearFilters,
  filterWidgetsKey = 0,
  className = "",
  children
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const hasActiveFilters = Object.values(activeFilters).some(value =>
    value !== undefined && value !== null && value !== "" &&
    (Array.isArray(value) ? value.length > 0 : true)
  );

  const handleClearAll = () => {
    onClearFilters();
    setIsFiltersOpen(false);
  };

  const renderFilter = (filter: FilterConfig) => {
    // Normalise: activeFilters may store select values as arrays (e.g. ['active'])
    // or plain strings depending on caller. Unwrap so widgets always get the right type.
    const rawValue = activeFilters[filter.key];

    switch (filter.type) {
      case 'select': {
        // Unwrap array → string for the Select widget
        const selectValue = Array.isArray(rawValue)
          ? (rawValue[0] ?? '')
          : (rawValue ?? '');
        return (
          <div key={`${filter.key}-${filterWidgetsKey}`} className="space-y-2">
            <Label>{filter.label}</Label>
            <Select
              value={selectValue || "all"}
              onValueChange={(val) => onFilterChange(filter.key, val === "all" ? "" : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`All ${filter.label}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }

      case 'multiselect': {
        // Ensure it's always an array for the checkboxes
        const multiValue = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];
        return (
          <div key={`${filter.key}-${filterWidgetsKey}`} className="space-y-2">
            <Label>{filter.label}</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {filter.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${filter.key}-${option.value}`}
                    checked={multiValue.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onFilterChange(filter.key, [...multiValue, option.value]);
                      } else {
                        onFilterChange(filter.key, multiValue.filter((v: string) => v !== option.value));
                      }
                    }}
                  />
                  <Label htmlFor={`${filter.key}-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'date': {
        const dateValue = Array.isArray(rawValue) ? rawValue[0] : rawValue;
        return (
          <div key={`${filter.key}-${filterWidgetsKey}`} className="flex flex-col gap-2">
            <Label>{filter.label}</Label>
            <DatePicker
              value={dateValue as string}
              onChange={(date) => onFilterChange(filter.key, date)}
              placeholder="Pick a date"
            />
          </div>
        );
      }

      case 'daterange': {
        const currentValue = (Array.isArray(rawValue) ? undefined : rawValue) || {};
        return (
          <div key={`${filter.key}-${filterWidgetsKey}`} className="flex flex-col gap-2">
            <Label>{filter.label || 'Date Range'}</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <DatePicker
                  value={currentValue.from}
                  onChange={(date) => onFilterChange(filter.key, { ...currentValue, from: date })}
                  placeholder="From"
                />
              </div>
              <span className="text-muted-foreground">-</span>
              <div className="flex-1">
                <DatePicker
                  value={currentValue.to}
                  onChange={(date) => onFilterChange(filter.key, { ...currentValue, to: date })}
                  placeholder="To"
                />
              </div>
            </div>
          </div>
        );
      }

      case 'number': {
        const numValue = Array.isArray(rawValue) ? rawValue[0] : rawValue;
        return (
          <div key={`${filter.key}-${filterWidgetsKey}`} className="space-y-2">
            <Label>{filter.label}</Label>
            <Input
              type="number"
              min="0"
              value={numValue || ""}
              onKeyDown={(e) => {
                if (['-', '+', 'e', 'E'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || Number(val) >= 0) {
                  onFilterChange(filter.key, val);
                }
              }}
              placeholder={`Filter by ${filter.label.toLowerCase()}`}
            />
          </div>
        );
      }

      default:
        return null;
    }
  };


  return (
    <div className={`search-filter-container ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-filter-input pl-9 h-10 bg-background border-border"
              spellCheck={false}
              autoComplete="off"
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {filters.length > 0 && (
            <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 border-border hover:bg-muted/50 hover:text-foreground gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full ml-1">
                      {Object.values(activeFilters).filter(v =>
                        v !== undefined && v !== null && v !== "" &&
                        (Array.isArray(v) ? v.length > 0 : true)
                      ).length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-h-96 overflow-y-auto bg-card border border-border shadow-large" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Filters</h4>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        className="h-8 px-2 text-muted-foreground hover:bg-muted/50 hover:text-primary gap-1"
                      >
                        <X className="w-3 h-3" />
                        Clear All
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {filters.map((filter) => renderFilter(filter))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-10 shrink-0 px-3 text-muted-foreground hover:bg-muted/50 hover:text-primary gap-1"
              >
                <X className="w-4 h-4" />
                Clear filters
              </Button>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};