// ─────────────────────────────────────────────────────────────────────────────
// usePreview — preview state, conditional visibility logic, layout helpers
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react';
import { type Page, type Section, type Field } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import {
    evaluateConditionalLogic,
    resolveConditionalLogicFieldOptions,
    resolveConditionalLogicFieldValue,
} from '@/features/proposals/utils/conditionalLogic';

interface UsePreviewProps {
    pages: Page[];
}

export function usePreview({ pages }: UsePreviewProps) {
    const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
    const [fullscreenPreviewValues, setFullscreenPreviewValues] = useState<Record<string, string>>(
        {},
    );
    const [currentPreviewPage, setCurrentPreviewPage] = useState<string>(
        pages[0]?.id || 'page1',
    );
    const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
    const [selectedCEWIds, setSelectedCEWIds] = useState<Set<string>>(new Set());

    // Keep preview page in sync with pages list
    useEffect(() => {
        if (pages.length > 0 && !pages.find((p) => p.id === currentPreviewPage)) {
            setCurrentPreviewPage(pages[0].id);
        }
    }, [pages, currentPreviewPage]);

    // Reset selection when switching pages
    useEffect(() => {
        const currentPage = pages.find((p) => p.id === currentPreviewPage);
        if (currentPage?.pageType !== 'quotesList') {
            setSelectedQuoteId(null);
            setSelectedCEWIds(new Set());
        }
    }, [currentPreviewPage, pages]);

    // ── Conditional logic evaluators ──────────────────────────────────────────────

    const shouldShowFieldInPreview = useCallback((field: Field): boolean => {
        if (!field.conditionalLogic) return true;
        const allFields = pages.flatMap((p) => p.sections.flatMap((s) => s.fields));
        return evaluateConditionalLogic(
            field.conditionalLogic,
            (fieldRef) => resolveConditionalLogicFieldValue(allFields, fullscreenPreviewValues, fieldRef),
            (fieldRef) => resolveConditionalLogicFieldOptions(allFields, fieldRef),
        );
    }, [pages, fullscreenPreviewValues]);

    const shouldShowSectionInPreview = useCallback((section: Section): boolean => {
        if (!section.fields || section.fields.length === 0) return false;

        const visibility = section.metadata?.visibility;
        if (visibility) {
            if (
                !visibility.masterValueId &&
                (!visibility.valueText || visibility.valueText.trim() === '')
            ) {
                return false;
            }

            const depFieldName = visibility.field;
            const condition = visibility.condition;
            const valueText = visibility.valueText || '';

            const allFields = pages.flatMap((p) => p.sections.flatMap((s) => s.fields));
            const depField = allFields.find((f) => f.name === depFieldName);
            const depValue = depField
                ? (fullscreenPreviewValues[depField.id] ?? '')
                : (fullscreenPreviewValues[depFieldName] ?? '');

            const depValueStr = String(
                depValue && typeof depValue === 'object'
                    ? ((depValue as { value?: unknown }).value ?? '')
                    : (depValue ?? ''),
            );
            const selectedMasterValueId =
                depValue && typeof depValue === 'object'
                    ? (depValue as { masterValueId?: unknown }).masterValueId !== undefined &&
                        (depValue as { masterValueId?: unknown }).masterValueId !== null
                        ? String((depValue as { masterValueId?: unknown }).masterValueId)
                        : undefined
                    : undefined;

            switch (condition) {
                case 'equals':
                    if (visibility.masterValueId && selectedMasterValueId) {
                        if (String(selectedMasterValueId) !== String(visibility.masterValueId)) return false;
                    } else if (depValueStr.toLowerCase() !== String(valueText).toLowerCase()) {
                        return false;
                    }
                    break;
                case 'not_equals':
                case 'notEquals':
                    if (visibility.masterValueId && selectedMasterValueId) {
                        if (String(selectedMasterValueId) === String(visibility.masterValueId)) return false;
                    } else if (depValueStr.toLowerCase() === String(valueText).toLowerCase()) {
                        return false;
                    }
                    break;
                case 'contains':
                    if (!depValueStr.toLowerCase().includes(String(valueText).toLowerCase())) return false;
                    break;
                case 'not_contains':
                case 'notContains':
                    if (depValueStr.toLowerCase().includes(String(valueText).toLowerCase())) return false;
                    break;
                case 'greater_than':
                case 'greaterThan':
                    if (depValueStr === '' || depValue === null || depValue === undefined) return false;
                    if (Number(depValueStr) <= Number(valueText)) return false;
                    break;
                case 'less_than':
                case 'lessThan':
                    if (depValueStr === '' || depValue === null || depValue === undefined) return false;
                    if (Number(depValueStr) >= Number(valueText)) return false;
                    break;
                case 'greater_than_or_equal':
                case 'greaterThanOrEqual':
                    if (depValueStr === '' || depValue === null || depValue === undefined) return false;
                    if (Number(depValueStr) < Number(valueText)) return false;
                    break;
                case 'less_than_or_equal':
                case 'lessThanOrEqual':
                    if (depValueStr === '' || depValue === null || depValue === undefined) return false;
                    if (Number(depValueStr) > Number(valueText)) return false;
                    break;
                case 'is_empty':
                case 'isEmpty':
                    if (
                        !(
                            depValue === undefined ||
                            depValue === null ||
                            depValueStr === '' ||
                            (Array.isArray(depValue) && depValue.length === 0)
                        )
                    ) {
                        return false;
                    }
                    break;
                case 'is_not_empty':
                case 'isNotEmpty':
                    if (
                        !(
                            depValue !== undefined &&
                            depValue !== null &&
                            depValueStr !== '' &&
                            !(Array.isArray(depValue) && depValue.length === 0)
                        )
                    ) {
                        return false;
                    }
                    break;
                default:
                    break;
            }
        }

        return section.fields.some((field) => shouldShowFieldInPreview(field));
    }, [pages, fullscreenPreviewValues, shouldShowFieldInPreview]);

    // ── Layout helpers ────────────────────────────────────────────────────────────

    const estimateFieldHeight = useCallback((field: Field): number => {
        const baseHeight = 60;
        const spacing = 16;
        switch (field.type) {
            case 'text':
            case 'number':
            case 'date':
            case 'time':
            case 'dropdown':
            case 'location':
                return baseHeight + spacing;
            case 'textarea':
                return 120 + spacing;
            case 'datePeriod':
            case 'policyPeriod':
                return baseHeight * 2 + spacing;
            case 'checkbox':
            case 'consent':
                return 40 + spacing;
            case 'file':
                return 80 + spacing;
            case 'multiselect':
            case 'multiselectDropdown':
                return baseHeight + spacing;
            case 'combination':
            case 'repeatable': {
                const rows = field.type === 'combination'
                    ? Math.max(field.combinationRowLabels?.length || 0, 1)
                    : 3;
                const subFieldsCount = field.subFields?.length || 1;
                return rows * 60 + subFieldsCount * 20 + 100 + spacing;
            }
            case 'chooseButton':
                return 50 + spacing;
            default:
                return baseHeight + spacing;
        }
    }, []);

    const shouldFieldSpanFullWidth = useCallback((field: Field): boolean => {
        return [
            'file',
            'location',
            'combination',
            'datePeriod',
            'policyPeriod',
            'chooseButton',
        ].includes(field.type);
    }, []);

    const getNextPage = useCallback((currentPageId: string) => {
        const currentIndex = pages.findIndex((p) => p.id === currentPageId);
        if (currentIndex >= 0 && currentIndex < pages.length - 1) {
            return pages[currentIndex + 1].id;
        }
        return null;
    }, [pages]);

    const getWrappedPages = useCallback((): Array<{
        pageIndex: number;
        fields: Array<{ page: Page; section: Section; field: Field }>;
    }> => {
        const maxPageHeight = 800;
        const wrappedPages: Array<{
            pageIndex: number;
            fields: Array<{ page: Page; section: Section; field: Field }>;
        }> = [];
        let currentPageIndex = 0;
        let currentPageHeight = 0;
        let currentPageFields: Array<{ page: Page; section: Section; field: Field }> = [];

        pages.forEach((page) => {
            const pageHeaderHeight = 100;
            if (currentPageHeight + pageHeaderHeight > maxPageHeight && currentPageFields.length > 0) {
                wrappedPages.push({ pageIndex: currentPageIndex, fields: currentPageFields });
                currentPageIndex++;
                currentPageHeight = 0;
                currentPageFields = [];
            }
            currentPageHeight += pageHeaderHeight;

            page.sections.forEach((section) => {
                const sectionHeaderHeight = section.title ? 60 : 0;
                if (
                    currentPageHeight + sectionHeaderHeight > maxPageHeight &&
                    currentPageFields.length > 0
                ) {
                    wrappedPages.push({ pageIndex: currentPageIndex, fields: currentPageFields });
                    currentPageIndex++;
                    currentPageHeight = sectionHeaderHeight;
                    currentPageFields = [];
                } else {
                    currentPageHeight += sectionHeaderHeight;
                }

                section.fields.forEach((field) => {
                    const fieldHeight = estimateFieldHeight(field);
                    if (currentPageHeight + fieldHeight > maxPageHeight && currentPageFields.length > 0) {
                        wrappedPages.push({ pageIndex: currentPageIndex, fields: currentPageFields });
                        currentPageIndex++;
                        currentPageHeight = fieldHeight;
                        currentPageFields = [{ page, section, field }];
                    } else {
                        currentPageHeight += fieldHeight;
                        currentPageFields.push({ page, section, field });
                    }
                });
            });
        });

        if (currentPageFields.length > 0) {
            wrappedPages.push({ pageIndex: currentPageIndex, fields: currentPageFields });
        }

        return wrappedPages;
    }, [pages, estimateFieldHeight]);

    return {
        // State
        isFullscreenPreview,
        setIsFullscreenPreview,
        fullscreenPreviewValues,
        setFullscreenPreviewValues,
        currentPreviewPage,
        setCurrentPreviewPage,
        selectedQuoteId,
        setSelectedQuoteId,
        selectedCEWIds,
        setSelectedCEWIds,
        // Logic
        shouldShowFieldInPreview,
        shouldShowSectionInPreview,
        estimateFieldHeight,
        shouldFieldSpanFullWidth,
        getNextPage,
        getWrappedPages,
    };
}
