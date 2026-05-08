# State Management Setup Guide - Zustand

## Installation

```bash
npm install zustand
```

## Basic Store Example

### 1. Create a Store (`src/stores/useAuthStore.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAuthUser, setAuthUser, clearAuth } from '@/lib/auth';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'broker' | 'insurer' | 'admin';
  company_id?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => {
        set({ user, isAuthenticated: true });
        setAuthUser(user);
      },
      setToken: (token) => {
        set({ token });
        // Also update the API client
        import('@/lib/api/client').then(({ setAuthToken }) => {
          setAuthToken(token);
        });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        clearAuth();
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token
      }), // Only persist these fields
    }
  )
);
```

### 2. Master Data Store (`src/stores/useMasterDataStore.ts`)

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SimpleMasterItem {
  id: string;
  name: string;
  isActive?: boolean;
}

interface MasterDataState {
  projectTypes: SimpleMasterItem[];
  subProjectTypes: any[];
  constructionTypes: SimpleMasterItem[];
  roleTypes: SimpleMasterItem[];
  contractTypes: SimpleMasterItem[];
  soilTypes: SimpleMasterItem[];
  securityTypes: SimpleMasterItem[];
  areaTypes: SimpleMasterItem[];
  subcontractorTypes: SimpleMasterItem[];
  consultantRoles: SimpleMasterItem[];

  // Actions
  setProjectTypes: (types: SimpleMasterItem[]) => void;
  setConstructionTypes: (types: SimpleMasterItem[]) => void;
  setRoleTypes: (types: SimpleMasterItem[]) => void;
  // ... more setters

  // Computed selectors
  getActiveProjectTypes: () => SimpleMasterItem[];
  reset: () => void;
}

const initialState = {
  projectTypes: [],
  subProjectTypes: [],
  constructionTypes: [],
  roleTypes: [],
  contractTypes: [],
  soilTypes: [],
  securityTypes: [],
  areaTypes: [],
  subcontractorTypes: [],
  consultantRoles: [],
};

export const useMasterDataStore = create<MasterDataState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setProjectTypes: (types) => set({ projectTypes: types }),
      setConstructionTypes: (types) => set({ constructionTypes: types }),
      setRoleTypes: (types) => set({ roleTypes: types }),
      // ... more setters

      getActiveProjectTypes: () => {
        return get().projectTypes.filter((type) => type.isActive !== false);
      },

      reset: () => set(initialState),
    }),
    { name: 'MasterDataStore' }
  )
);
```

### 3. Quote/Proposal Store (`src/stores/useQuoteStore.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QuoteState {
  currentQuoteId: string | null;
  quoteReference: string;
  currentStep: number;
  stepCompletionStatus: Record<string, boolean>;

  // Actions
  setCurrentQuote: (id: string, reference: string) => void;
  setCurrentStep: (step: number) => void;
  updateStepCompletion: (step: string, completed: boolean) => void;
  reset: () => void;
}

const initialStepStatus = {
  project_details: false,
  contract_structure: false,
  cover_requirements: false,
  insured_details: false,
  site_risks: false,
  underwriting_documents: false,
  coverages_selected: false,
  plans_selected: false,
  policy_required_documents: false,
  policy_issued: false,
};

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set) => ({
      currentQuoteId: null,
      quoteReference: '',
      currentStep: 0,
      stepCompletionStatus: initialStepStatus,

      setCurrentQuote: (id, reference) =>
        set({ currentQuoteId: id, quoteReference: reference }),

      setCurrentStep: (step) => set({ currentStep: step }),

      updateStepCompletion: (step, completed) =>
        set((state) => ({
          stepCompletionStatus: {
            ...state.stepCompletionStatus,
            [step]: completed,
          },
        })),

      reset: () => set({
        currentQuoteId: null,
        quoteReference: '',
        currentStep: 0,
        stepCompletionStatus: initialStepStatus,
      }),
    }),
    {
      name: 'quote-storage',
    }
  )
);
```

### 4. UI State Store (`src/stores/useUIStore.ts`)

```typescript
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  loading: boolean;
  error: string | null;

  // Actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUIStore = create<UIStore>()(
  (set) => ({
    sidebarOpen: true,
    theme: 'system',
    loading: false,
    error: null,

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setTheme: (theme) => set({ theme }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  })
);
```

## Usage Examples

### In Components

```typescript
// Instead of multiple useState hooks
import { useMasterDataStore } from '@/stores/useMasterDataStore';
import { useQuoteStore } from '@/stores/useQuoteStore';

function ProposalForm() {
  // Select only what you need (prevents unnecessary re-renders)
  const projectTypes = useMasterDataStore((state) => state.projectTypes);
  const setProjectTypes = useMasterDataStore((state) => state.setProjectTypes);

  const currentStep = useQuoteStore((state) => state.currentStep);
  const setCurrentStep = useQuoteStore((state) => state.setCurrentStep);

  // Or use multiple values at once
  const { currentQuoteId, quoteReference, setCurrentQuote } = useQuoteStore();

  // ... rest of component
}
```

### With React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { useMasterDataStore } from '@/stores/useMasterDataStore';

function MasterDataLoader() {
  const setProjectTypes = useMasterDataStore((state) => state.setProjectTypes);

  const { data, isLoading } = useQuery({
    queryKey: ['projectTypes'],
    queryFn: async () => {
      const data = await fetchProjectTypes();
      setProjectTypes(data); // Update Zustand store
      return data;
    },
  });

  // ... rest
}
```

### Selectors for Performance

```typescript
// Create selectors to prevent unnecessary re-renders
const selectActiveProjectTypes = (state: MasterDataState) =>
  state.projectTypes.filter((type) => type.isActive !== false);

// In component
const activeProjectTypes = useMasterDataStore(selectActiveProjectTypes);
```

## Migration Strategy

1. **Start Small**: Migrate one feature at a time
2. **Keep React Query**: Use Zustand for client-side state, React Query for server state
3. **Replace localStorage**: Use Zustand's persist middleware
4. **Gradual Migration**: You can use both useState and Zustand during transition

## Best Practices

1. **Split Stores**: Create separate stores for different domains (auth, quotes, UI, etc.)
2. **Use Selectors**: Select only needed state to prevent re-renders
3. **Actions as Functions**: Keep actions simple and pure
4. **TypeScript**: Always type your stores
5. **DevTools**: Use devtools middleware in development

## Advanced: Middleware

```typescript
import { create } from 'zustand';
import { devtools, persist, immer } from 'zustand/middleware';
import { immer as immerMiddleware } from 'zustand/middleware/immer';

// With Immer for immutable updates
export const useComplexStore = create<ComplexState>()(
  devtools(
    persist(
      immer((set) => ({
        // You can mutate state directly with Immer
        updateField: (field, value) => set((state) => {
          state.formData[field] = value;
        }),
      })),
      { name: 'complex-storage' }
    ),
    { name: 'ComplexStore' }
  )
);
```
