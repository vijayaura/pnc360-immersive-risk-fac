// ─────────────────────────────────────────────────────────────────────────────
// proposal-form — Barrel export
// ─────────────────────────────────────────────────────────────────────────────

// Types
export * from './types';

// Constants
export * from './constants';

// Hooks
export { useFormPersistence } from './hooks/useFormPersistence';
export { useDragAndDrop } from './hooks/useDragAndDrop';
export { usePageOperations } from './hooks/usePageOperations';
export { useSectionOperations } from './hooks/useSectionOperations';
export { useFieldEditor, generateFieldName, parseCSVLabels, formatCSVLabels } from './hooks/useFieldEditor';
export { usePreview } from './hooks/usePreview';
export * from './utils/render-utils';

// Components
export * from './components/FullscreenPreviewDialog';
export * from './components/FieldConfigDialog';
export * from './components/PageValidationDialog';
export * from './components/CalculationDialog';
export * from './components/FormDesignHeader';
export * from './components/ComponentsSidebar';
export * from './components/DesignCanvas';
