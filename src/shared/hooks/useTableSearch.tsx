import { useState, useMemo } from "react";

export interface SearchableItem {
  [key: string]: any;
}

export interface UseTableSearchProps<T extends SearchableItem> {
  data: T[];
  searchableFields: (keyof T)[];
  initialFilters?: Record<string, any>;
}

export const useTableSearch = <T extends SearchableItem>({
  data,
  searchableFields,
  initialFilters = {}
}: UseTableSearchProps<T>) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);

  const filteredData = useMemo(() => {
    let result = data;

    // Apply search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item =>
        searchableFields.some(field => {
          const value = item[field];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value) && value.length > 0) {
          // Multi-select filter
          result = result.filter(item => value.includes(String(item[key])));
        } else if (typeof value === 'object' && value.start && value.end) {
          // Date range filter
          result = result.filter(item => {
            const itemDate = new Date(String(item[key]));
            const startDate = new Date(value.start);
            const endDate = new Date(value.end);
            return itemDate >= startDate && itemDate <= endDate;
          });
        } else if (typeof value === 'object' && (value.start || value.end)) {
          // Partial date range filter
          result = result.filter(item => {
            const itemDate = new Date(String(item[key]));
            if (value.start && value.end) {
              const startDate = new Date(value.start);
              const endDate = new Date(value.end);
              return itemDate >= startDate && itemDate <= endDate;
            } else if (value.start) {
              const startDate = new Date(value.start);
              return itemDate >= startDate;
            } else if (value.end) {
              const endDate = new Date(value.end);
              return itemDate <= endDate;
            }
            return true;
          });
        } else if (typeof value === 'string' && value.trim()) {
          // Single value filter
          result = result.filter(item => {
            const itemValue = String(item[key]);
            // For date fields, check if the date matches or is within range
            if (key.toLowerCase().includes('date')) {
              return itemValue.includes(value) || new Date(itemValue).toDateString() === new Date(value).toDateString();
            }
            // For other fields, exact match or contains
            return itemValue.toLowerCase().includes(value.toLowerCase()) || itemValue === value;
          });
        } else if (typeof value === 'number') {
          // Number filter
          result = result.filter(item => {
            const itemValue = parseFloat(String(item[key]).replace(/[^\d.-]/g, ''));
            return !isNaN(itemValue) && itemValue >= value;
          });
        }
      }
    });

    return result;
  }, [data, searchTerm, filters, searchableFields]);

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setSearchTerm("");
  };

  const clearFilter = (key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    filteredData,
    updateFilter,
    clearFilters,
    clearFilter
  };
};