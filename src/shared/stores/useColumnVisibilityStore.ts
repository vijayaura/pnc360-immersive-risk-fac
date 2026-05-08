import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Interface for the global column visibility state across all dashboard tabs.
 * Key: Table Identifier (e.g., 'market-admin-users', 'broker-quotes'), Value: string[] of visible column IDs
 */
export interface ColumnVisibilityState {
  visibilities: Record<string, string[]>;
  
  /**
   * Updates the visibility selections for a specific table.
   * @param tableId Unique identifier for the table/tab
   * @param visibleColumnIds Array of column IDs that should be visible
   */
  setColumnVisibility: (tableId: string, visibleColumnIds: string[]) => void;
  
  /**
   * Toggles visibility for a single column.
   * @param tableId Unique identifier for the table/tab
   * @param columnId ID of the column to toggle
   * @param defaultVisible Optional default set of visible columns if none cached
   */
  toggleColumnVisibility: (tableId: string, columnId: string, defaultVisible: string[]) => void;
  
  /**
   * Returns the cached visible column IDs for a given table.
   */
  getTableVisibility: (tableId: string, defaultVisible: string[]) => string[];
  
  /**
   * Clears all cached column visibilities.
   */
  clearAll: () => void;
}

/**
 * Zustand store to preserve table column visibility across navigation and tab changes.
 * This state persists across page refreshes and sessions using localStorage.
 */
export const useColumnVisibilityStore = create<ColumnVisibilityState>()(
  persist(
    (set, get) => ({
      visibilities: {},

      setColumnVisibility: (tableId, visibleColumnIds) => 
        set((state) => ({
          visibilities: {
            ...state.visibilities,
            [tableId]: visibleColumnIds
          }
        })),

      toggleColumnVisibility: (tableId, columnId, defaultVisible) =>
        set((state) => {
          const current = state.visibilities[tableId] || defaultVisible;
          const next = current.includes(columnId)
            ? current.filter(id => id !== columnId)
            : [...current, columnId];
          
          return {
            visibilities: {
              ...state.visibilities,
              [tableId]: next
            }
          };
        }),

      getTableVisibility: (tableId, defaultVisible) => {
        return get().visibilities[tableId] || defaultVisible;
      },

      clearAll: () => set({ visibilities: {} })
    }),
    {
      name: 'column-visibility-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
