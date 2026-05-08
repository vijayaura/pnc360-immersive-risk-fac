# Development Guidelines - GET API Data Mapping

## 🚨 Critical Issue: Preventing useEffect Infinite Loops

### The Problem
When mapping GET API data to form fields, including form state (`ratingConfig`, `formData`, etc.) in `useEffect` dependencies causes infinite re-renders:

1. User types in field → Form state updates
2. Form state change triggers useEffect → Due to dependency array
3. useEffect updates form field → Overwrites user input
4. User input is lost "within nanoseconds"

### ❌ Anti-Patterns (DO NOT USE)

```typescript
// BAD: ratingConfig in dependencies causes infinite loop
useEffect(() => {
  if (apiData && ratingConfig) {
    updateField('field', apiData.value);
  }
}, [apiData, ratingConfig, updateField]); // ← ratingConfig causes problem!

// BAD: Any form state in dependencies
useEffect(() => {
  if (apiData && formState) {
    setFormState(prev => ({ ...prev, field: apiData.value }));
  }
}, [apiData, formState]); // ← formState causes problem!
```

### ✅ Correct Patterns

#### Pattern 1: One-Time Mapping (Recommended)
```typescript
import { useApiDataMapping } from '@/hooks/useApiDataMapping';

// Use the custom hook
const hasBeenMapped = useApiDataMapping(
  policyLimitsData,
  (data) => {
    updateLimits('maximumCover', data.policy_limits.maximum_cover.value);
    updateLimits('minimumPremium', data.policy_limits.minimum_premium.value);
  },
  [updateLimits] // Only include non-form-state dependencies
);
```

#### Pattern 2: Manual Flag Control
```typescript
const [hasInitialData, setHasInitialData] = useState(false);

useEffect(() => {
  if (apiData && !hasInitialData) {
    updateField('field', apiData.value);
    setHasInitialData(true);
  }
}, [apiData, hasInitialData, updateField]); // Controlled dependencies
```

#### Pattern 3: Ref-Based Tracking
```typescript
const hasBeenMapped = useRef(false);

useEffect(() => {
  if (apiData && !hasBeenMapped.current) {
    updateField('field', apiData.value);
    hasBeenMapped.current = true;
  }
}, [apiData, updateField]); // No form state in dependencies
```

## 🛡️ Form Field Best Practices

### Always Use Controlled Components with Fallbacks
```typescript
// ✅ GOOD: Proper fallbacks prevent uncontrolled component warnings
<Input 
  value={ratingConfig.limits?.minimumPremium || 0}
  onChange={(e) => updateLimits('minimumPremium', parseInt(e.target.value) || 0)}
/>

<Select 
  value={entry.pricingType || 'fixed'}
  onValueChange={(value) => updateEntry('pricingType', value)}
>
```

### Input Field Fallback Patterns
```typescript
// Numbers: Use || 0
value={formData.numericField || 0}

// Strings: Use || ''
value={formData.textField || ''}

// Select options: Use || 'defaultOption'
value={formData.selectField || 'fixed'}

// Booleans: Use || false
checked={formData.booleanField || false}
```

## 🔄 GET API Integration Checklist

When implementing GET API data mapping:

### ✅ Before Implementation
- [ ] Plan data mapping strategy (one-time vs conditional)
- [ ] Identify which fields need API data population
- [ ] Determine appropriate fallback values
- [ ] Choose correct useEffect pattern

### ✅ During Implementation
- [ ] **NEVER** include form state in useEffect dependencies
- [ ] Use custom hooks (`useApiDataMapping`) when possible
- [ ] Add proper fallback values to all form fields
- [ ] Test that fields remain editable after API data loads

### ✅ After Implementation
- [ ] Test field editability (type in fields, values should persist)
- [ ] Verify no infinite console logs
- [ ] Check that save functionality works correctly
- [ ] Ensure loading/error states work properly

## 🧪 Testing Guidelines

### Manual Testing Steps
1. **Load page** → API should fetch data
2. **Wait for data to populate** → Fields should show API values
3. **Try editing fields** → Values should persist as you type
4. **Check console** → No infinite logging or errors
5. **Save data** → Should work with current field values

### Red Flags to Watch For
- Fields that revert to API values while typing
- Infinite console logging
- "Cannot update component while rendering" errors
- Fields that become uneditable after API loads

## 📝 Code Review Guidelines

When reviewing GET API implementations, check for:

1. **useEffect Dependencies**: No form state in dependency arrays
2. **Field Fallbacks**: All inputs have proper `|| fallback` values
3. **Mapping Strategy**: Clear one-time or conditional mapping
4. **Error Handling**: Proper try-catch in mapping functions
5. **Console Logging**: No excessive debug output

## 🔧 Common Fixes

### If Fields Become Uneditable
```typescript
// Temporarily disable problematic useEffect
useEffect(() => {
  if (false && apiData && ratingConfig) { // ← Add 'false &&'
    // mapping logic
  }
}, [apiData, ratingConfig]);
```

### If Uncontrolled Component Warnings
```typescript
// Add fallbacks to all form fields
value={field || appropriateFallback}
```

### If Infinite Re-renders
```typescript
// Remove form state from dependencies
}, [apiData, updateFunction]); // ← Remove ratingConfig, formData, etc.
```

## 📚 Examples

See these components for correct implementations:
- `useApiDataMapping` hook (recommended approach)
- Coverage Options (fixed with disabled useEffect)
- Policy Limits (fixed with disabled useEffect)

## 🎯 Summary

**Golden Rule**: Never include form state in useEffect dependencies when mapping API data to form fields.

**Recommended Approach**: Use the `useApiDataMapping` custom hook for all future GET API implementations.

**Testing Mantra**: "Can I type in the fields after API data loads?" If no, there's a mapping issue.
